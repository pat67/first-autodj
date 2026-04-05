# FIRST AutoDJ — Windows Desktop App Setup

This project has been configured to run as a native Windows desktop app using **Electron**.

---

## Prerequisites

Make sure you have the following installed on your Windows machine:

- **Node.js** (v18 or newer) — https://nodejs.org
- **Git** (optional, if cloning fresh) — https://git-scm.com

---

## Quick Start

Open a terminal (PowerShell or Command Prompt) in this folder and run:

```bash
# 1. Install all dependencies (only needed once)
npm install

# 2. Build the Windows installer
npm run electron:build
```

The installer will be saved to:
```
dist-electron\FIRST AutoDJ Setup 1.0.0.exe
```

Double-click it to install — it will add **FIRST AutoDJ** to your Start Menu and Desktop.

---

## Development Mode (live-reloading)

To run the app in development mode with hot reload:

```bash
npm run electron:dev
```

This starts the Vite dev server and opens the Electron window simultaneously.

---

## What was changed from the web app

| File | Change |
|------|--------|
| `electron/main.ts` | New — Electron main process: creates the window, loads the app |
| `electron/preload.ts` | New — sandboxed bridge between Electron and the renderer |
| `tsconfig.electron.json` | New — TypeScript config for the Electron files |
| `vite.config.ts` | Added `base: "./"` so assets load correctly from a file:// URL |
| `package.json` | Added `electron`, `electron-builder`, build scripts & NSIS config |

---

## Notes

- All audio playback uses the Web Audio API — no native audio libraries needed.
- Folder selection uses the browser's `webkitdirectory` API — fully supported in Electron's Chromium.
- The installer is built with **NSIS** and installs per-user by default (no admin required).
