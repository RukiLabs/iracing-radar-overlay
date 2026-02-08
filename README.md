# iRacing Proximity Radar Overlay

A Windows desktop overlay for iRacing that shows a **real-time proximity radar** and **spotter side bars** (left/right), similar to iOverlay or benofficial2 spotter overlay. Built with Electron, React, and TypeScript.

## Features

- **Proximity radar** — Top-down 2D radar with player at center, nearby cars color-coded by distance (red/amber/gray), track edges, grid rings, danger zone. When a track layout exists for the current circuit (e.g. Charlotte in mock), the radar shows the circuit shape at scale.
- **Side spotter bars** — Left and right vertical bars showing where other cars overlap your car (front-to-rear); fill moves as cars overtake
- **Settings panel** — Slide-out drawer: radar zoom/size/track width, side bar size, car size/color, proximity audio, export/import JSON
- **Proximity audio** — Optional beeps with stereo panning (left/right) and intensity by distance (Howler.js)
- **Persistence** — All settings saved with electron-store; export/import as JSON

## Requirements

- **Windows** (iRacing shared memory is Windows-only)
- **iRacing** in borderless windowed mode for the overlay to sit on top
- **Node.js** 18+ (LTS recommended)

## Quick Start

```bash
npm install
npm run build
npm start
```

For development (hot reload):

```bash
npm run dev
```

## Using GitHub (clone on another PC or share)

You can put this project on GitHub and use it from any PC.

1. **Create a repo on GitHub** (github.com → New repository). Don’t add a README if this folder already has one.
2. **On this PC**, in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: iRacing radar overlay"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. **On the other PC** (or anyone else):
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   npm install
   npm run build
   npm start
   ```
   To build an installer there: `npm run dist` and use the `.exe` in `release/`.

The `.gitignore` already excludes `node_modules/`, `dist/`, and `release/` so they aren’t pushed to GitHub.

---

## Using with iRacing (checklist)

1. **Build and run the overlay**
   - `npm run build` then `npm start`, or from Manager: open the app and enable "Proximity Radar".

2. **Set iRacing to borderless windowed**
   - iRacing → **Options** → **Graphics** → set **Window mode** to **Borderless** (or windowed). The overlay must run over a windowed game to stay on top.

3. **Optional: full car list**
   - In iRacing Graphics, set **Max cars** to **63** so telemetry includes all cars.

4. **Position the overlay**
   - Drag the **top edge** to move; use the **bottom-right corner** to resize (easiest in Resize mode — see shortcuts). Use **F9** to cycle Normal → Off → Resize; **F10** to toggle click-through when visible.

5. **Live vs mock data**
   - If you see **"○ iRacing disconnected"**, the overlay is using **mock data** (moving dots for testing). The radar and UI still work.
   - For **live positions** from iRacing, install the native SDK: `npm install node-irsdk` (requires Visual Studio Build Tools). After a successful install and restart, with iRacing running you should see **"● iRacing connected"** and real car positions.

---

- **F8** — Open overlay settings (use when overlay is click-through so the gear icon can’t be clicked)
- **F9** — Cycle overlay: Normal → Off → Resize (move/resize in Resize mode)
- **F10** — Toggle click-through when visible
- **Position** — Drag top edge to move; bottom-right corner to resize (easier in Resize mode)
- **Settings** — Gear icon next to radar (clickable in Resize mode), or tray → Open Manager
- **Tray** — Right-click for Open Manager, Show Overlay, Quit  

## Project Structure

```
src/
  main/           # Electron main process
    main.ts       # Window, tray, shortcuts, IPC
    preload.ts    # contextBridge for renderer
    irsdk.ts      # Telemetry polling (mock or node-irsdk)
    store.ts      # electron-store settings
  renderer/       # React UI (Vite)
    App.tsx
    components/   # Radar, SideBar, SettingsPanel, Widget
    hooks/        # useTelemetry, useSettings
    lib/          # overlap, radarMath, audio
  shared/         # Types and constants (main + renderer)
    constants.ts, settings.ts, telemetry.ts
```

## iRacing Connection

Out of the box the app runs with **mock telemetry** so you can use the UI without iRacing. To connect to live iRacing:

1. Install the native SDK (optional; requires build tools):
   ```bash
   npm install node-irsdk
   ```
   Note: `node-irsdk` uses native bindings and may need Visual Studio Build Tools and a compatible Node version (e.g. Node 18). If install fails, the overlay still runs with mock data.

2. Run iRacing in **borderless windowed** mode.

3. In iRacing graphics options, set **max cars** to 63 for full telemetry.

When connected, the status line shows “● iRacing connected”. When not, it shows “○ iRacing disconnected”.

## Proximity Audio

Add these files for beep warnings (optional):

- `public/sounds/beep-low.mp3`  — far threat
- `public/sounds/beep-mid.mp3`  — close threat  
- `public/sounds/beep-high.mp3` — danger

If missing, the app works normally but no sound plays. You can generate short tones in Audacity.

## Building for Distribution

```bash
npm run build
npm run dist
```

Output is in `release/`. The installer is Windows-only.

## Using the overlay on another PC

You have two options.

### Option A: Installer (recommended — no Node.js on the other PC)

1. **On this PC** (where you have the project):
   ```bash
   npm run build
   npm run dist
   ```
2. In the project folder, open the **`release/`** folder. You’ll see:
   - **`iRacing Radar Overlay Setup 1.0.0.exe`** (or similar) — Windows installer
3. Copy that installer to the other PC (USB drive, cloud, network share).
4. **On the other PC**: Run the installer, then start **“iRacing Radar Overlay”** from the Start menu or desktop. No Node.js or npm needed.

### Option B: Copy project and run from source

Use this if the other PC already has Node.js 18+.

1. Copy the whole project folder (e.g. **Overlay iRacing**) to the other PC.
2. **On the other PC**:
   ```bash
   cd "Overlay iRacing"
   npm install
   npm run build
   npm start
   ```
3. Optional: for live iRacing data, install the SDK there too: `npm install node-irsdk` (requires build tools if you use it).

**Both PCs**: Use iRacing in **borderless windowed** mode so the overlay can sit on top. Settings (position, size, radar options) are stored per PC in the app data folder.

## License

MIT.
