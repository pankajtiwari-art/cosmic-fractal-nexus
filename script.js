// ============================================================
// COSMIC FRACTAL NEXUS - ULTIMATE 50+ CONTROL VISUALIZER
// Three.js + Generative Audio + Post-Processing
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// ========== 1. SCENE SETUP ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.zoomSpeed = 1.2;
controls.rotateSpeed = 1.0;
controls.panSpeed = 0.8;

// ========== 2. GLOBAL STATE ==========
let userInteracted = false;
controls.object.addEventListener('start', () => { userInteracted = true; });
controls.object.addEventListener('end', () => { setTimeout(() => { userInteracted = false; }, 1000); });

// Performance monitoring
let fpsCounter = document.getElementById('fps-indicator');
let frameCount = 0;
let lastTime = performance.now();

// Audio system
let audioCtx = null;
let analyser = null;
let dataArray = null;
let masterGain = null;
let isAudioPlaying = false;
let audioSources = [];

// ========== 3. PARAMETERS DASHBOARD (50+ controls) ==========
const themes = {
    Zen: { c1: '#ffffff', c2: '#aaaaaa', c3: '#555555', c4: '#222222', bg: '#050505' },
    Cosmic: { c1: '#00ffff', c2: '#ff00ff', c3: '#8800ff', c4: '#ffffff', bg: '#000011' },
    Nature: { c1: '#00ff44', c2: '#aaff00', c3: '#005511', c4: '#ffff88', bg: '#000a02' },
    Fire: { c1: '#ff2200', c2: '#ff8800', c3: '#ffdd00', c4: '#ffffff', bg: '#110200' },
    Neon: { c1: '#ff00cc', c2: '#00ffcc', c3: '#ff6600', c4: '#ffff00', bg: '#000000' }
};

const params = {
    // Core Geometry
    theme: 'Cosmic',
    count: 180,
    radius: 6.5,
    turns: 4.2,
    tubeRadius: 0.008,
    radialSeg: 10,
    tubularSeg: 400,
    sphereSize: 0.65,
    wireframe: false,
    morphTarget: 0.0,

    // Colors & Environment
    c1: themes.Cosmic.c1,
    c2: themes.Cosmic.c2,
    c3: themes.Cosmic.c3,
    c4: themes.Cosmic.c4,
    bgColor: themes.Cosmic.bg,
    fogColor: themes.Cosmic.bg,
    fogDensity: 0.025,
    colorIntensity: 1.2,
    edgeFadeAmount: 0.08,
    opacityMode: 1.0,

    // Motion & Waves
    baseSpeed: 0.035,
    trailLength: 0.18,
    waveAmplitude: 0.008,
    waveFreq: 12.0,
    rotX: -1.2,
    rotY: -0.5,
    rotZ: 0.0,
    autoRotateObj: true,
    objRotSpeed: 0.12,
    reverseFlow: false,

    // Particles System
    partCount: 5000,
    partSize: 0.045,
    partOpacity: 0.5,
    partSpread: 45,
    partSpeedX: 0.008,
    partSpeedY: 0.012,
    partSpeedZ: 0.005,
    partColor: '#aaffff',
    partScaleBeat: true,
    hideParticles: false,

    // Camera Options
    camAutoPan: true,
    camPanSpeed: 0.18,
    camFov: 48,
    camZ: 14.5,
    camY: 0.8,

    // Audio & Effects
    audioReactivity: 1.8,
    bloomStrength: 1.1,
    bloomRadius: 0.5,
    bloomThreshold: 0.05,
    kaleidoscope: false,
    kaleidoSides: 6,
    rgbGlitch: 0.006,
    synthVolume: 0.6
};

// Initialize background and fog now (so applyTheme works)
scene.background = new THREE.Color(params.bgColor);
scene.fog = new THREE.FogExp2(params.fogColor, params.fogDensity);

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    params.c1 = theme.c1;
    params.c2 = theme.c2;
    params.c3 = theme.c3;
    params.c4 = theme.c4;
    params.bgColor = theme.bg;
    params.fogColor = theme.bg;
    scene.background.set(params.bgColor);
    if (scene.fog) scene.fog.color.set(params.bgColor);
    // Update material uniforms if they exist
    if (shaderMaterial) {
        shaderMaterial.uniforms.uC1.value.set(params.c1);
        shaderMaterial.uniforms.uC2.value.set(params.c2);
        shaderMaterial.uniforms.uC3.value.set(params.c3);
        shaderMaterial.uniforms.uC4.value.set(params.c4);
    }
    // Update GUI controllers
    if (guiControllers) {
        guiControllers.forEach(ctrl => ctrl.updateDisplay());
    }
}

// ========== 4. SHADER MATERIAL ==========
let mesh = null;
let shaderMaterial = null;

const vertexShader = `
    uniform float uTime;
    uniform float uWaveAmp;
    uniform float uWaveFreq;
    uniform float uMorph;
    uniform float uAudioPulse;
    attribute vec3 aMorphPos;
    attribute float aOffset;
    attribute float aSpeed;
    attribute float aColorIdx;
    varying vec2 vUv;
    varying float vSpeed;
    varying float vOffset;
    varying float vColorIdx;
    void main() {
        vUv = uv;
        vSpeed = aSpeed;
        vOffset = aOffset;
        vColorIdx = aColorIdx;
        vec3 finalPos = mix(position, aMorphPos, uMorph);
        finalPos.z += sin(uv.x * uWaveFreq + uTime * 2.0 + aOffset) * (uWaveAmp + uAudioPulse * 0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform float uGlobalSpeed;
    uniform float uTrailLength;
    uniform float uAudioPulse;
    uniform float uMorph;
    uniform float uIntensity;
    uniform float uEdgeFadeAmount;
    uniform bool uReverseFlow;
    uniform vec3 uC1;
    uniform vec3 uC2;
    uniform vec3 uC3;
    uniform vec3 uC4;
    varying vec2 vUv;
    varying float vSpeed;
    varying float vOffset;
    varying float vColorIdx;
    void main() {
        float flowDir = uReverseFlow ? -1.0 : 1.0;
        float trailPos = fract(vUv.x - (uTime * uGlobalSpeed * vSpeed * flowDir) + vOffset);
        float trail = smoothstep(1.0 - mix(0.01, 0.85, uTrailLength), 1.0, trailPos);
        trail = pow(trail, mix(1.0, 3.5, uTrailLength));
        float edgeFade = (1.0 - smoothstep(0.0, uEdgeFadeAmount, vUv.x)) * (1.0 - smoothstep(1.0 - uEdgeFadeAmount, 1.0, vUv.x));
        vec3 baseColor = (vColorIdx < 0.5) ? uC1 : (vColorIdx < 1.5) ? uC2 : (vColorIdx < 2.5) ? uC3 : uC4;
        vec3 finalColor = mix(baseColor, vec3(1.0), trail * 0.85 + uAudioPulse * 0.4);
        finalColor *= uIntensity;
        finalColor = mix(finalColor, finalColor * 0.4, uMorph);
        float alpha = trail * edgeFade * mix(1.0, 0.55, uMorph);
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// ========== 5. GEOMETRY GENERATION ==========
let geometriesList = [];

function getSpiralPoint(t, radius, turns, randomAngle) {
    const angle = t * Math.PI * 2 * turns + randomAngle;
    const x = radius * (1 - t) * Math.cos(angle);
    const y = radius * (1 - t) * Math.sin(angle);
    const z = Math.sin(t * 12.0 + randomAngle) * 0.6 * (1.0 - t);
    return new THREE.Vector3(x, y, z);
}

function getSpherePoint(t, radius, sphereSize) {
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * 2 * t * 50;
    const r = radius * sphereSize;
    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
}

function updateMorphPositions() {
    if (!geometriesList.length) return;
    for (let idx = 0; idx < geometriesList.length; idx++) {
        const geometry = geometriesList[idx];
        const count = geometry.attributes.position.count;
        const posArray = geometry.attributes.position.array;
        const morphArray = geometry.attributes.aMorphPos.array;
        const randomAngle = geometry.userData.randomAngle;
        for (let i = 0; i < count; i++) {
            const t = Math.floor(i / params.radialSeg) / params.tubularSeg;
            const target = getSpherePoint(t, params.radius, params.sphereSize);
            const curr = getSpiralPoint(t, params.radius, params.turns, randomAngle);
            morphArray[i*3] = target.x + (posArray[i*3] - curr.x);
            morphArray[i*3+1] = target.y + (posArray[i*3+1] - curr.y);
            morphArray[i*3+2] = target.z + (posArray[i*3+2] - curr.z);
        }
        geometry.attributes.aMorphPos.needsUpdate = true;
    }
}

function createSpirals() {
    if (mesh) {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    }
    geometriesList = [];
    const geometries = [];
    for (let i = 0; i < params.count; i++) {
        const randomAngle = Math.random() * Math.PI * 2;
        const points = [];
        for (let j = 0; j <= params.tubularSeg; j++) {
            points.push(getSpiralPoint(j / params.tubularSeg, params.radius, params.turns, randomAngle));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, params.tubularSeg, params.tubeRadius, params.radialSeg, false);
        const count = tubeGeo.attributes.position.count;
        const morphPositions = new Float32Array(count * 3);
        const posArray = tubeGeo.attributes.position.array;
        for (let j = 0; j < count; j++) {
            const t = Math.floor(j / params.radialSeg) / params.tubularSeg;
            const target = getSpherePoint(t, params.radius, params.sphereSize);
            const curr = getSpiralPoint(t, params.radius, params.turns, randomAngle);
            morphPositions[j*3] = target.x + (posArray[j*3] - curr.x);
            morphPositions[j*3+1] = target.y + (posArray[j*3+1] - curr.y);
            morphPositions[j*3+2] = target.z + (posArray[j*3+2] - curr.z);
        }
        tubeGeo.setAttribute('aMorphPos', new THREE.BufferAttribute(morphPositions, 3));
        const offsets = new Float32Array(count);
        const speeds = new Float32Array(count);
        const colorIdx = new Float32Array(count);
        for (let j = 0; j < count; j++) {
            offsets[j] = Math.random() * 100;
            speeds[j] = 0.6 + Math.random() * 0.8;
            colorIdx[j] = Math.floor(Math.random() * 4);
        }
        tubeGeo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
        tubeGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        tubeGeo.setAttribute('aColorIdx', new THREE.BufferAttribute(colorIdx, 1));
        tubeGeo.userData = { randomAngle };
        geometriesList.push(tubeGeo);
        geometries.push(tubeGeo);
    }
    const mergedGeo = BufferGeometryUtils.mergeGeometries(geometries);
    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uGlobalSpeed: { value: params.baseSpeed },
            uTrailLength: { value: params.trailLength },
            uWaveAmp: { value: params.waveAmplitude },
            uWaveFreq: { value: params.waveFreq },
            uMorph: { value: params.morphTarget },
            uAudioPulse: { value: 0 },
            uIntensity: { value: params.colorIntensity },
            uEdgeFadeAmount: { value: params.edgeFadeAmount },
            uReverseFlow: { value: params.reverseFlow },
            uC1: { value: new THREE.Color(params.c1) },
            uC2: { value: new THREE.Color(params.c2) },
            uC3: { value: new THREE.Color(params.c3) },
            uC4: { value: new THREE.Color(params.c4) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        wireframe: params.wireframe
    });
    mesh = new THREE.Mesh(mergedGeo, shaderMaterial);
    mesh.rotation.set(params.rotX, params.rotY, params.rotZ);
    scene.add(mesh);
}

// ========== 6. PARTICLE SYSTEM ==========
let particlesMesh = null;
let particlesGeometry = null;

function createParticles() {
    if (particlesMesh) {
        scene.remove(particlesMesh);
        if (particlesGeometry) particlesGeometry.dispose();
    }
    particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(params.partCount * 3);
    for (let i = 0; i < params.partCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * params.partSpread;
        positions[i*3+1] = (Math.random() - 0.5) * params.partSpread;
        positions[i*3+2] = (Math.random() - 0.5) * params.partSpread;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: params.partColor,
        size: params.partSize,
        transparent: true,
        opacity: params.partOpacity,
        blending: THREE.AdditiveBlending
    });
    particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    particlesMesh.visible = !params.hideParticles;
    scene.add(particlesMesh);
}

// ========== 7. AUDIO ENGINE ==========
function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = params.synthVolume;
    masterGain.connect(audioCtx.destination);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    masterGain.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Bass drone
    const bassOsc = audioCtx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 55;
    const bassGain = audioCtx.createGain();
    bassGain.gain.value = 0.3;
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start();
    audioSources.push(bassOsc, bassGain);

    // Pad drone with LFO
    const padOsc = audioCtx.createOscillator();
    padOsc.type = 'triangle';
    padOsc.frequency.value = 110;
    const padGain = audioCtx.createGain();
    padGain.gain.value = 0.2;
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);
    padOsc.connect(padGain);
    padGain.connect(masterGain);
    padOsc.start();
    lfo.start();
    audioSources.push(padOsc, padGain, lfo, lfoGain);

    // Arpeggiator
    const arpNotes = [220, 277.18, 329.63, 440];
    let arpIndex = 0;
    const arpOsc = audioCtx.createOscillator();
    arpOsc.type = 'sawtooth';
    const arpGain = audioCtx.createGain();
    arpGain.gain.value = 0.1;
    arpOsc.connect(arpGain);
    arpGain.connect(masterGain);
    arpOsc.start();
    setInterval(() => {
        if (!isAudioPlaying) return;
        arpOsc.frequency.setValueAtTime(arpNotes[arpIndex % arpNotes.length], audioCtx.currentTime);
        arpIndex++;
    }, 400);
    audioSources.push(arpOsc, arpGain);

    // Shimmer noise
    const noise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
    audioSources.push(noise, filter, noiseGain);
}

function startAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            isAudioPlaying = true;
        }).catch(e => console.warn('Audio resume failed', e));
    } else {
        isAudioPlaying = true;
    }
}

// ========== 8. POST PROCESSING ==========
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.bloomStrength, params.bloomRadius, params.bloomThreshold);
const rgbPass = new ShaderPass(RGBShiftShader);
const kaleidoShader = {
    uniforms: {
        tDiffuse: { value: null },
        sides: { value: 6.0 },
        angle: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float sides;
        uniform float angle;
        varying vec2 vUv;
        void main() {
            vec2 p = vUv - 0.5;
            float r = length(p);
            float a = mod(atan(p.y, p.x) + angle, 6.28318 / sides);
            p = r * vec2(cos(abs(a - 3.14159 / sides)), sin(abs(a - 3.14159 / sides)));
            gl_FragColor = texture2D(tDiffuse, p + 0.5);
        }
    `
};
const kaleidoPass = new ShaderPass(kaleidoShader);
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(1 / (window.innerWidth * renderer.getPixelRatio()), 1 / (window.innerHeight * renderer.getPixelRatio()));

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(rgbPass);
composer.addPass(kaleidoPass);
composer.addPass(fxaaPass);
kaleidoPass.renderToScreen = false;
fxaaPass.renderToScreen = true;

// ========== 9. GUI (50+ controls) ==========
let guiControllers = [];
function setupGUI() {
    const gui = new GUI({ title: '🌀 Cosmic Controls', width: 320 });
    guiControllers = [];

    const geomFolder = gui.addFolder('⚙️ Core Geometry');
    geomFolder.add(params, 'count', 30, 400).step(1).onFinishChange(createSpirals);
    geomFolder.add(params, 'radius', 2, 18).step(0.1).onFinishChange(createSpirals);
    geomFolder.add(params, 'turns', 1, 12).step(0.1).onFinishChange(createSpirals);
    geomFolder.add(params, 'tubeRadius', 0.002, 0.05).step(0.001).onFinishChange(createSpirals);
    geomFolder.add(params, 'radialSeg', 4, 24).step(1).onFinishChange(createSpirals);
    geomFolder.add(params, 'tubularSeg', 80, 800).step(10).onFinishChange(createSpirals);
    geomFolder.add(params, 'sphereSize', 0.2, 1.8).step(0.01).onChange(() => updateMorphPositions());
    geomFolder.add(params, 'wireframe').onChange(v => { if (shaderMaterial) shaderMaterial.wireframe = v; });
    geomFolder.open();

    const lookFolder = gui.addFolder('🎨 Look & Feel');
    lookFolder.add(params, 'morphTarget', 0, 1).step(0.01).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uMorph.value = v; });
    lookFolder.add(params, 'colorIntensity', 0.2, 2.5).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uIntensity.value = v; });
    lookFolder.add(params, 'edgeFadeAmount', 0.01, 0.2).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uEdgeFadeAmount.value = v; });
    lookFolder.addColor(params, 'c1').onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uC1.value.set(v); });
    lookFolder.addColor(params, 'c2').onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uC2.value.set(v); });
    lookFolder.addColor(params, 'c3').onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uC3.value.set(v); });
    lookFolder.addColor(params, 'c4').onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uC4.value.set(v); });
    lookFolder.addColor(params, 'bgColor').onChange(v => { scene.background.set(v); if (scene.fog) scene.fog.color.set(v); });
    lookFolder.add(params, 'fogDensity', 0, 0.1).onChange(v => { if (scene.fog) scene.fog.density = v; });
    lookFolder.add(params, 'theme', Object.keys(themes)).onChange(v => { applyTheme(v); });
    lookFolder.open();

    const motionFolder = gui.addFolder('🌀 Motion & Waves');
    motionFolder.add(params, 'baseSpeed', -0.1, 0.1).step(0.001).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uGlobalSpeed.value = v; });
    motionFolder.add(params, 'trailLength', 0.01, 0.65).step(0.005).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uTrailLength.value = v; });
    motionFolder.add(params, 'waveAmplitude', 0, 0.03).step(0.0005).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uWaveAmp.value = v; });
    motionFolder.add(params, 'waveFreq', 2, 40).step(0.5).onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uWaveFreq.value = v; });
    motionFolder.add(params, 'reverseFlow').onChange(v => { if (shaderMaterial) shaderMaterial.uniforms.uReverseFlow.value = v; });
    motionFolder.add(params, 'autoRotateObj');
    motionFolder.add(params, 'objRotSpeed', 0, 1.5).step(0.01);
    motionFolder.add(params, 'rotX', -Math.PI, Math.PI).step(0.01).onChange(v => { if (mesh) mesh.rotation.x = v; });
    motionFolder.add(params, 'rotY', -Math.PI, Math.PI).step(0.01).onChange(v => { if (mesh) mesh.rotation.y = v; });
    motionFolder.add(params, 'rotZ', -Math.PI, Math.PI).step(0.01).onChange(v => { if (mesh) mesh.rotation.z = v; });
    motionFolder.open();

    const partFolder = gui.addFolder('✨ Particle Field');
    partFolder.add(params, 'hideParticles').onChange(v => { if (particlesMesh) particlesMesh.visible = !v; });
    partFolder.add(params, 'partCount', 100, 15000).step(100).onFinishChange(createParticles);
    partFolder.add(params, 'partSize', 0.01, 0.2).step(0.002).onChange(v => { if (particlesMesh) particlesMesh.material.size = v; });
    partFolder.add(params, 'partOpacity', 0.1, 0.9).step(0.01).onChange(v => { if (particlesMesh) particlesMesh.material.opacity = v; });
    partFolder.add(params, 'partSpread', 15, 80).step(1).onFinishChange(createParticles);
    partFolder.add(params, 'partSpeedX', -0.05, 0.05).step(0.001);
    partFolder.add(params, 'partSpeedY', -0.05, 0.05).step(0.001);
    partFolder.add(params, 'partSpeedZ', -0.05, 0.05).step(0.001);
    partFolder.addColor(params, 'partColor').onChange(v => { if (particlesMesh) particlesMesh.material.color.set(v); });
    partFolder.add(params, 'partScaleBeat');
    partFolder.open();

    const camFolder = gui.addFolder('📷 Camera');
    camFolder.add(params, 'camAutoPan');
    camFolder.add(params, 'camPanSpeed', 0.05, 0.6).step(0.01);
    camFolder.add(params, 'camFov', 30, 90).step(1).onChange(v => { camera.fov = v; camera.updateProjectionMatrix(); });
    camFolder.add(params, 'camZ', 5, 35).step(0.5);
    camFolder.add(params, 'camY', -5, 10).step(0.5);
    camFolder.open();

    const fxFolder = gui.addFolder('🎛️ Audio & FX');
    fxFolder.add(params, 'synthVolume', 0, 1).step(0.01).onChange(v => { if (masterGain) masterGain.gain.value = v; });
    fxFolder.add(params, 'audioReactivity', 0, 4).step(0.1);
    fxFolder.add(params, 'bloomStrength', 0, 2.5).step(0.01).onChange(v => { bloomPass.strength = v; });
    fxFolder.add(params, 'bloomRadius', 0.1, 1).step(0.01).onChange(v => { bloomPass.radius = v; });
    fxFolder.add(params, 'bloomThreshold', 0, 1).step(0.01).onChange(v => { bloomPass.threshold = v; });
    fxFolder.add(params, 'kaleidoscope').onChange(v => { kaleidoPass.enabled = v; });
    fxFolder.add(params, 'kaleidoSides', 2, 12).step(1).onChange(v => { kaleidoPass.uniforms.sides.value = v; });
    fxFolder.add(params, 'rgbGlitch', 0, 0.03).step(0.0005).onChange(v => { rgbPass.uniforms['amount'].value = v; });
    fxFolder.open();

    guiControllers = gui.controllersRecursive();
}

// ========== 10. ANIMATION LOOP ==========
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() / 1000;

    // FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        if (fpsCounter) fpsCounter.textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastTime = now;
    }

    // Audio reactivity
    let audioLevel = 0;
    if (isAudioPlaying && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        audioLevel = sum / (dataArray.length * 255) * params.audioReactivity;
        const meterElem = document.getElementById('audio-level');
        if (meterElem) meterElem.style.width = (audioLevel * 100) + '%';
        if (shaderMaterial) shaderMaterial.uniforms.uAudioPulse.value = audioLevel * 0.3;
        if (params.audioReactivity > 0) {
            bloomPass.strength = params.bloomStrength + audioLevel * 0.5;
        } else {
            bloomPass.strength = params.bloomStrength;
        }
        if (params.partScaleBeat && particlesMesh) {
            particlesMesh.scale.setScalar(1 + audioLevel * 0.25);
        }
    } else {
        if (shaderMaterial) shaderMaterial.uniforms.uAudioPulse.value = 0;
    }

    // Update shader time
    if (shaderMaterial) shaderMaterial.uniforms.uTime.value = time;

    // Auto-rotate object
    if (params.autoRotateObj && mesh) {
        mesh.rotation.y += params.objRotSpeed * 0.01;
    }

    // Rotate particles
    if (particlesMesh) {
        particlesMesh.rotation.x += params.partSpeedX;
        particlesMesh.rotation.y += params.partSpeedY;
        particlesMesh.rotation.z += params.partSpeedZ;
    }

    // Camera
    if (params.camAutoPan && !userInteracted) {
        const t = time * params.camPanSpeed;
        camera.position.x = Math.sin(t) * 2.5;
        camera.position.y = Math.cos(t * 0.7) * 1.8 + params.camY;
        camera.position.z = params.camZ;
        camera.lookAt(0, 0, 0);
    } else if (!userInteracted) {
        camera.position.z += (params.camZ - camera.position.z) * 0.05;
        camera.position.y += (params.camY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    }

    controls.update();

    // Kaleido angle
    if (kaleidoPass.enabled) {
        kaleidoPass.uniforms.angle.value = time * 0.15;
    }

    composer.render();
}

// ========== 11. RESIZE HANDLER ==========
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    fxaaPass.uniforms['resolution'].value.set(1 / (width * renderer.getPixelRatio()), 1 / (height * renderer.getPixelRatio()));
}
window.addEventListener('resize', onWindowResize);

// ========== 12. START SEQUENCE ==========
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('start-overlay');

function startExperience() {
    startAudio();
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 1800);
}
startBtn.addEventListener('click', startExperience);

// Initialize everything in correct order
createSpirals();
createParticles();
setupGUI();
applyTheme(params.theme); // apply theme to sync colors and GUI
animate();

console.log('🌀 Cosmic Fractal Nexus — 50+ controls ready. Enjoy the voyage!');
