# Bastion

**Unbreakable focus for deep work.**

Bastion is a privacy-first, high-performance productivity shell designed to neutralize digital distractions. Built with Tauri and React, it provides a hardcore environment for professionals who require absolute concentration.

## Core Features

### 🛡️ Defense Perimeter
- **Zero-Bypass Blocking**: Block websites at the system level via an integrated Rust-powered blocking engine.
- **Protocol Templates**: Pre-configured blocking profiles for Social Media, Entertainment, and custom categories.
- **Hardcore Mode**: Permanent session locking. Once established, the defense cannot be breached until the timer expires.

### 📊 Tactical Analytics
- **Intensity Heatmap**: Visualize daily focus depth and consistency.
- **Trajectory Tracking**: Monitor focus hours and distraction prevention metrics over time.
- **Privacy-First**: All data is stored locally. Zero telemetry, zero accounts, zero external dependencies.

### ⚡ Performance & UX
- **Monochromatic Aesthetic**: A premium, high-contrast dark theme designed to minimize visual fatigue.
- **Tauri 2.0 Backend**: Lightweight system resource usage with a secure Rust foundation.
- **Integrated Pomodoro**: A customized timer system for structured deep work intervals.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- **Backend**: Tauri 2.0 (Rust), tokio, axum.
- **Styling**: Premium monochromatic design system with glassmorphism components.

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18+)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows only)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bastion.git
   cd bastion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development environment:
   ```bash
   npm run tauri dev
   ```

## Architecture

Bastion operates as a secure bridge between a modern web interface and a robust Rust core. The backend manages low-level system operations (blocking, file I/O), while the React frontend handles the tactical user interface.

## License

MIT
