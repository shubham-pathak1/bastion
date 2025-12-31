# Bastion

**Focused workstation shell for deep work.**

> [!IMPORTANT]
> **Status: Under Development**
> Bastion is currently in active development. Features and APIs are subject to change.

Bastion is a privacy-first, high-performance productivity interface designed to minimize digital distractions. Built with Tauri and Rust, it provides a stable and secure environment for long-term concentration.

## Key Features

### 🛡️ Website & Application Blocking
- **System-Level Control**: Integrated Rust-powered engine for reliable blocking of web domains.
- **Session Locking**: Optional "Hardcore" mode which prevents session termination or blocklist modification during active focus periods.
- **Custom Schedules**: Define automated focus intervals and recurring blocking profiles.

### 📊 Performance Analytics
- **Local Statistics**: Track focus duration, blocked distractions, and session consistency over time.
- **Privacy Centric**: All session data and statistics are stored locally. There is no telemetry, cloud dependency, or external data tracking.
- **Visual Heatmap**: Monitor activity depth and historical trends directly within the application.

### ⚡ Technical Design
- **Minimalist Aesthetic**: Premium monochromatic dark interface designed for clarity and reduced visual fatigue.
- **Lightweight Architecture**: Built on Tauri 2.0 and Rust to ensure low system resource impact.
- **Integrated Timer**: Native Pomodoro-based timer system with customizable intervals.

## Development Setup

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18+)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows only)

### Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shubham-pathak1/bastion.git
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

## Tech Stack
- **Interface**: React 18, TypeScript, Tailwind CSS, Framer Motion.
- **Core Engine**: Tauri 2.0 (Rust), Tokio, Axum for low-level system communication.
- **Storage**: SQLite (Local) for session history and application configuration.

## License
MIT
