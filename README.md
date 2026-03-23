# 🌌 Cosmic Fractal Nexus

**An immersive 3D visualizer with 50+ real‑time parameters, generative audio, and advanced post‑processing effects.** Built with Three.js, Web Audio API, and lil‑gui. Experience infinite fractal spirals, particle fields, and audio‑reactive visuals.

[![Live Demo](https://img.shields.io/badge/Live-Demo-ff69b4?style=for-the-badge)](https://pankajtiwari-art.github.io/cosmic-fractal-nexus/)

---

## 📑 Table of Contents
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Controls Overview](#%EF%B8%8F-controls-overview)
- [Generative Audio](#-generative-audio)
- [Built With](#%EF%B8%8F-built-with)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **50+ Interactive Controls** – Tweak geometry, colors, motion, particles, camera, and effects in real time.
- **Generative Ambient Audio** – A rich, evolving soundscape created with oscillators, LFOs, and noise, all reactive to visual parameters.
- **Audio Reactivity** – Bloom intensity, particle scale, and wave modulation respond to the generated audio.
- **Advanced Post‑Processing** – Bloom, RGB shift, kaleidoscope, and FXAA anti‑aliasing.
- **Fractal Spiral Morphing** – Smoothly transition between spirals and spherical shapes.
- **Particle Field** – Thousands of glowing particles with independent rotation and scale.
- **Theme Presets** – Zen, Cosmic, Nature, Fire, Neon – one‑click color schemes.
- **Orbit Controls** – Free camera navigation with auto‑pan option.
- **Performance Monitor** – Real‑time FPS display.

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari) with WebGL and Web Audio support.
- A local web server (optional but recommended for full functionality). You can use:
  - [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (VS Code Extension)
  - `python -m http.server` (Python 3)
  - `npx serve` (Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/pankajtiwari-art/cosmic-fractal-nexus.git](https://github.com/pankajtiwari-art/cosmic-fractal-nexus.git)
   ```

2. Navigate into the project folder:
   ```bash
   cd cosmic-fractal-nexus
   ```

3. Start a local server (example with Python):
   ```bash
   python -m http.server
   ```

4. Open your browser and go to `http://localhost:8000`.

### Quick Start
* Click **“Enter The Void”** to begin the experience.
* Use the GUI panel (top‑right) to adjust all parameters.
* Press `F11` for full immersion.
* **Mouse / Touch:**
  * Drag to rotate camera
  * Right‑click + drag to pan
  * Scroll to zoom

---

## 🎛️ Controls Overview

| Category | Parameters (Examples) |
| :--- | :--- |
| **Core Geometry** | Count, Radius, Turns, Tube Radius, Segments, Sphere Size, Wireframe |
| **Look & Feel** | Morph to Sphere, Color Intensity, Edge Fade, 4 Custom Colors, Background, Fog, Theme |
| **Motion & Waves** | Speed, Trail Length, Wave Amplitude, Wave Frequency, Reverse Flow, Auto‑Rotate, Manual Rotation |
| **Particle Field** | Count, Size, Opacity, Spread, Rotation Speeds, Color, Scale Beat |
| **Camera** | Auto‑Pan, Pan Speed, Field of View, Z‑distance, Y‑offset |
| **Audio & FX** | Volume, Reactivity, Bloom Strength/Radius/Threshold, Kaleidoscope, RGB Glitch |

> **Note:** Some geometry parameters rebuild the entire mesh; others (like `sphereSize`) only update morph targets for better performance.

---

## 🎵 Generative Audio

The audio is generated entirely in the browser using the Web Audio API. It consists of:

* Deep bass drone (sine wave)
* Evolving pad with LFO‑modulated volume
* Gentle arpeggiator (sawtooth)
* High‑frequency shimmer (filtered noise)

All audio reacts to the visual parameters and vice‑versa, creating a symbiotic experience.

---

## 🛠️ Built With

- **[Three.js](https://threejs.org/)** – 3D graphics engine
- **[lil-gui](https://lil-gui.georgealways.com/)** – Parameter controls
- **Web Audio API** – Generative sound
- **EffectComposer** – Post‑processing stack

---

## 📁 Project Structure

```text
cosmic-fractal-nexus/
├── index.html          # Main HTML file
├── style.css           # Styling and overlay animations
├── script.js           # All Three.js logic, audio, GUI
└── README.md           # This file
```

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new effects, optimizations, or bug fixes, please open an issue or submit a pull request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the `LICENSE` file for details.

---

## 🙏 Acknowledgments

- Inspired by the beauty of fractals and generative art.
- Thanks to the Three.js community for countless examples and resources.
- Special thanks to you for exploring the Cosmos! 🌠

---

**[Live Demo](https://pankajtiwari-art.github.io/cosmic-fractal-nexus/)** | **[Report Issues](https://github.com/pankajtiwari-art/cosmic-fractal-nexus/issues)**

Enjoy the journey into the void! 🌀
