# Bastion

A system-level distraction blocker for Windows, built with Tauri and Rust.

---

## What It Does

Bastion blocks distracting websites and applications at the operating system level. Unlike browser extensions, it cannot be bypassed by switching browsers or using incognito mode.

**Core functionality:**
- Modifies the Windows hosts file to block website domains
- Monitors and terminates blocked application processes
- Supports scheduled focus sessions with optional "Hardcore" mode (prevents unblocking during active sessions)
- Tracks focus statistics locally with zero telemetry

## Screenshots

to be added*

## Installation

### Download

Pre-built Windows binaries are available on the [Releases](https://github.com/shubham-pathak1/bastion/releases) page.

### Build from Source

**Requirements:**
- [Rust](https://www.rust-lang.org/tools/install) (1.70+)
- [Node.js](https://nodejs.org/) (v18+)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows)

```bash
# Clone
git clone https://github.com/shubham-pathak1/bastion.git
cd bastion

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production binary
npm run tauri build
```

The compiled binary will be in `src-tauri/target/release/`.

## How It Works

### Website Blocking
Bastion writes entries to the Windows hosts file (`C:\Windows\System32\drivers\etc\hosts`), redirecting blocked domains to `127.0.0.1`. This requires Administrator privileges.

### Application Blocking
A background loop monitors running processes every 3 seconds. When a blocked application is detected, it is terminated and a warning modal is displayed with your custom message.

### Data Storage
All data is stored locally in a SQLite database. No cloud sync, no accounts, no tracking.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Tauri 2.0, Rust, Tokio |
| Database | SQLite (local) |
| Blocking | Windows hosts file, process monitoring via `sysinfo` crate |

## Project Structure

```
bastion/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route pages (Dashboard, Blocks, etc.)
│   └── lib/                # API bindings to Tauri commands
├── src-tauri/              # Rust backend
│   └── src/
│       ├── lib.rs          # Tauri commands
│       ├── blocking.rs     # Hosts file & process blocking logic
│       ├── storage.rs      # SQLite database operations
│       └── session.rs      # Focus session & Pomodoro timer
└── package.json
```

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

For bugs, please open an issue with steps to reproduce.

## Current Limitations

- **Windows only** (macOS/Linux support planned)
- **Requires Administrator privileges** for website blocking
- Browser DNS caching may delay blocks taking effect (restart browser or use "Leak Prevention" feature)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**Note:** This project is under active development. APIs and features may change.

