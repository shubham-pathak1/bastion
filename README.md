# 🛡️ Bastion

**Engineered for Uncompromised Focus.**

Bastion is a high-performance, system-level distraction defense system for Windows. Built with **Tauri 2.0** and **Rust**, it acts as your digital fortress, filtering out the noise so you can build what matters.

---

## ✨ Key Features

### 🔒 Unbreakable Hardcore Mode
Once a hardcore session begins, it **cannot be broken**.
- **Kernel-Level Enforcement**: API modifications to blocklists and session controls are locked at the Rust core.
- **Process Protection**: Prevents application exit and uninstallation during active focus periods.
- **Anti-Bypass Architecture**: Hardens browser security policies to prevent DNS and proxy leaks.

### 🍅 Precision Pomodoro
A fully integrated focus timer synchronized with the system tray.
- **Native Notifications**: Real-time alerts on phase transitions (Work/Break).
- **Customizable Cycles**: Tailor work and break intervals to your cognitive flow.

### 🌐 System-Level Firewall
Unlike browser extensions, Bastion operates at the OS level.
- **Global Immunity**: Blocks websites via hosts file modification, covering all browsers and incognito modes.
- **App Guard**: Monitors and terminates distracting applications with zero-latency detection.

### 🎭 Aesthetic Interceptor
When you hit a blocked site, Bastion serves a beautiful, minimalist warning screen.
- **Personalized Nudges**: Display custom warning messages to reinforce your goals.
- **Premium Design**: Modern, glassmorphic UI that fits into your high-performance workflow.

---

## 🧪 Usage Note: Administrator Privileges

Bastion requires **Administrator privileges** for its system-level website blocking.

**Why is this needed?**
The application achieves global, browser-independent blocking by modifying the system `hosts` file. This intercepts distracting traffic at the OS level, ensuring no connection can bypass your defense. Since the `hosts` file is a protected system resource on Windows, elevated rights are necessary to apply these changes.

Without Administrator rights, Bastion can still monitor and block **applications**, but website blocking will remain inactive.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Tauri 2.0, Rust, Tokio (Async Runtime)
- **Database**: Local SQLite (Zero-latency persistence)
- **Privacy**: Zero telemetry, 100% local processing, < 30MB idle RAM.

---

## 🚀 Getting Started

### Installation
Official binaries (MSI/NSIS) are available on the [Releases](https://github.com/shubham-pathak1/bastion/releases) page.

### Build from Source
**Requirements:**
- [Rust](https://www.rust-lang.org/tools/install) (1.75+)
- [Node.js](https://nodejs.org/) (v20+)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

```bash
# Clone the repository
git clone https://github.com/shubham-pathak1/bastion.git
cd bastion

# Install dependencies
npm install

# Run dev environment
npm run tauri dev

# Build production installers
npm run tauri build
```

---

## 🏗️ Project Structure

```text
bastion/
├── src/                    # React Frontend
│   ├── components/         # Reusable UI Components
│   └── pages/              # Navigation & Main Views
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── lib.rs          # Core Logic & API Commands
│   │   ├── blocking.rs     # Process Monitor & Firewall
│   │   ├── server.rs       # Warning Page Server
│   │   └── storage.rs      # Persistence Layer
└── ...
```

---

## 📄 License

Bastion is released under the [MIT License](LICENSE).

---
