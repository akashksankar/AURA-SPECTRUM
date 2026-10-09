# AURA — Audio-Reactive Ambient Music Player & Visual Experience

<div align="center">

```
     █████╗ ██╗   ██╗██████╗  █████╗ 
    ██╔══██╗██║   ██║██╔══██╗██╔══██╗
    ███████║██║   ██║██████╔╝███████║
    ██╔══██║██║   ██║██╔══██╗██╔══██║
    ██║  ██║╚██████╔╝██║  ██║██║  ██║
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

**Where sound drives light, rhythm shapes motion, and listening becomes an immersive room.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Native_DSP-FA4616?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://motion.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[Features](#-key-features) • [Audio Architecture](#-web-audio-engine-graph) • [Visualizer Modes](#-visualizer-modes) • [Sound Profiles](#-sound-treatments) • [Getting Started](#-quick-start)

---

</div>

## Overview

**AURA** is a mobile-first, zero-backend music player web application designed for immersive listening. It pairs client-side audio playback with real-time frequency analysis (`AnalyserNode`), audio-reactive side lights, and 6 fluid visualizer modes animated with Framer Motion crossfades.

Users can play curated procedural synth soundscapes right out of the box, or drag-and-drop their own local files (`MP3`, `WAV`, `FLAC`, `OGG`, `AAC/M4A`). Embedded ID3 metadata and APIC album covers are extracted entirely inside the browser without transmitting private media to external servers.

---

## Key Features

- **Fluid Framer Motion Visualizer Transitions**: Seamless blur-and-scale crossfades between 6 distinct Canvas 2D spectrum modes (`Orb Mesh`, `Waveform Ribbon`, `Spectrum Bars`, `Circular Radial`, `Fluid Waves`, `Minimal Pulse`).
- **Tactile Beat Reactivity**: Dedicated `Beat -` and `Beat +` steppers with a live bouncing rhythm meter driven by real-time bass onset transient tracking.
- **Micro-Stepped Volume Controls**: Click-free scheduled linear gain ramping with instant `Volume -` / `Volume +` steppers, percentage display, and multi-state speaker icons.
- **Audio-Reactive Side Lights**: Dual ambient light pillars (and mobile background bloom) pulsating organically to low-frequency energy with smooth attack/release envelopes.
- **6 Color Presets**: *Violet Dream*, *Sunset Amber*, *Midnight Blue*, *Aurora Green*, *Cyber Coral*, and *Monochrome*.
- **Three Real-Time Sound Treatments**:
  - **Original**: Pure flat source signal.
  - **Ambient Space**: Softened tone via low-pass filter, high-shelf warmth attenuation, and spatial stereo convolution reverb.
  - **Beat Focus**: +2 dB to +14 dB sub-bass shelf boost at 85 Hz, high-frequency presence sparkle at 8 kHz, and dynamics compression.
- **Client-Side ID3 Metadata & Artwork Extraction**: Native ID3v2 tag parser reading `TIT2`, `TPE1`, `TALB`, `TYER`, and `APIC` binary cover art.
- **Procedural Offline Audio Synthesis**: Built-in multi-timbral synth and electronic tracks synthesized directly into WAV blobs via `OfflineAudioContext`.
- **Zero-Pill Typography & Touch Ergonomics**: Adheres to strict mobile thumb-zone principles with $\ge 44\text{px}$ touch hitboxes and non-blocking persistent player dock.

---

## Web Audio Engine Graph

AURA routes audio through a unified Web Audio API graph configured for real-time DSP and zero audio pops:

```
[ HTMLAudioElement ]
        │
        ▼
[ MediaElementAudioSourceNode ]
        │
        ▼
[ Beat Low-Shelf Filter (85 Hz) ]
        │
        ▼
[ Beat High-Shelf Filter (8000 Hz) ]
        │
        ▼
[ Ambient Low-Pass Filter (800-7000 Hz) ]
        │
        ▼
[ Ambient High-Shelf Filter (-4.5 dB Warmth) ]
        ├───► [ Dry Gain Node ] ───────────────┐
        │                                      │
        └───► [ ConvolverNode Reverb ] ─► [ Wet Gain ]
                                               │
                                               ▼
                              [ DynamicsCompressorNode ]
                                               │
                                               ▼
                                     [ Master GainNode ]
                                               │
                                               ▼
                                      [ AnalyserNode ] (FFT 1024)
                                               ├───► [ Canvas Spectrum Engine ]
                                               ├───► [ Side Light Engine ]
                                               ▼
                                    [ AudioDestination ] (Speakers/Headphones)
```

---

## Visualizer Modes

Every mode is rendered on a high-DPI Canvas 2D surface and crossfaded with `motion/react`:

| Mode | Visual Style | Audio Response |
| :--- | :--- | :--- |
| **Orb Mesh** | 3D wireframe ribbon sphere | Ribbon deformation and expansion linked to bass transients and mid frequencies |
| **Waveform Ribbon** | Multi-threaded undulating ribbons | Sinuous sinusoidal ribbon curves modulated by real-time time-domain waveform data |
| **Spectrum Bars** | Mirrored frequency equalizer | Frequency bin heights with smooth falling peak-hold cap indicators |
| **Circular Radial** | Radial burst surrounding cover | 72 radial ray vectors pulsing outward with rhythmic beat expansion |
| **Fluid Waves** | Layered harmonic liquid waves | Multi-octave harmonic swells driven by overall RMS sound power |
| **Minimal Pulse** | Concentric sound rings | Dynamic concentric rings expanding with bass onset triggers |

---

## Sound Treatments

### 1. Original
Bypasses active filters and sets reverb wet mix to 0. Passes audio transparently to the master gain and spectrum analyzer.

### 2. Ambient Space
Applies an adjustable low-pass filter (1200 Hz – 7000 Hz), attenuates harsh high frequencies with a high-shelf rolloff, and blends an algorithmic synthetic impulse response through a `ConvolverNode` for lush spatial acoustics.

### 3. Beat Focus
Engages a +2.0 dB to +14.0 dB low-shelf boost centered at 85 Hz, adds high-end presence sparkle at 8 kHz, and tightens dynamic range using dynamic compression.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Animation**: [Motion (Framer Motion 12)](https://motion.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Audio Processing**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (`AudioContext`, `AnalyserNode`, `BiquadFilterNode`, `ConvolverNode`, `DynamicsCompressorNode`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Metadata**: Browser-native ArrayBuffer ID3v2 & APIC parser

---

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aura-player.git

# Navigate into the project directory
cd aura-player

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
# Compile and bundle assets
npm run build

# Preview the production build locally
npm run preview
```

---

## Browser Compatibility

| Browser | Version | Web Audio API | Canvas 2D (High DPI) | Local File Decode |
| :--- | :--- | :---: | :---: | :---: |
| **Google Chrome / Chromium** | 90+ | Full | Full | Full |
| **Apple Safari / iOS Safari** | 15+ | Full | Full | Full |
| **Mozilla Firefox** | 90+ | Full | Full | Full |
| **Microsoft Edge** | 90+ | Full | Full | Full |
| **Android Chrome / Samsung Internet** | 90+ | Full | Full | Full |

---

## License

Apache-2.0 License. Designed and built for Google AI Studio.
