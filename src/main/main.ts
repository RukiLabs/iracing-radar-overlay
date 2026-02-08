import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen } from 'electron';
import path from 'path';
import { initIrsdk, stopIrsdk } from './irsdk';
import { getSettings, setSettings, getSettingsJson, setSettingsFromJson, getEnabledOverlays, setEnabledOverlays, getOverlayBounds, setOverlayBounds } from './store';

let mainWindow: BrowserWindow | null = null;
let managerWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clickThrough = true;

/** F9 cycle: 1 = normal (visible, click-through), 2 = off (hidden), 3 = resize (visible, interactive) */
let overlayTape: 1 | 2 | 3 = 1;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function applyOverlayVisibility(): void {
  const enabled = getEnabledOverlays();
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (enabled.proximityRadar) {
      mainWindow.show();
      overlayTape = 1;
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.hide();
      overlayTape = 2;
    }
  }
}

function applyTapeState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (overlayTape === 2) {
    mainWindow.hide();
    return;
  }
  mainWindow.show();
  if (overlayTape === 1) {
    const win = mainWindow as BrowserWindow & { _ignoreMouseOverride?: boolean };
    if (!win._ignoreMouseOverride) mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
  mainWindow.webContents.send('overlay-tape', overlayTape);
}

let saveBoundsTimeout: ReturnType<typeof setTimeout> | null = null;

function createWindow(): void {
  const bounds = getOverlayBounds();
  const primary = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = primary.workAreaSize;
  const useCenter = bounds.x === 0 && bounds.y === 0;
  const x = useCenter ? Math.max(0, Math.floor((sw - bounds.width) / 2)) : bounds.x;
  const y = useCenter ? Math.max(0, Math.floor((sh - bounds.height) / 2)) : bounds.y;
  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x,
    y,
    minWidth: 300,
    minHeight: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const saveBounds = () => {
    if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout);
    saveBoundsTimeout = setTimeout(() => {
      if (win && !win.isDestroyed()) {
        const [x, y] = win.getPosition();
        const [w, h] = win.getSize();
        setOverlayBounds({ x, y, width: w, height: h });
      }
      saveBoundsTimeout = null;
    }, 150);
  };

  win.on('move', saveBounds);
  win.on('resize', saveBounds);

  const showWindow = () => {
    const [x, y] = win!.getPosition();
    const [w, h] = win!.getSize();
    const primary = screen.getPrimaryDisplay();
    const { workArea } = primary;
    const inBounds = x >= workArea.x && y >= workArea.y && x + w <= workArea.x + workArea.width && y + h <= workArea.y + workArea.height;
    if (!inBounds) {
      win!.setPosition(Math.max(workArea.x, Math.floor(workArea.x + (workArea.width - w) / 2)), Math.max(workArea.y, Math.floor(workArea.y + (workArea.height - h) / 2)));
    }
    win!.show();
    win!.focus();
    if (!win!.isDestroyed()) win!.webContents.send('overlay-tape', overlayTape);
  };

  if (isDev) {
    win.loadURL('http://localhost:5173').catch(() => {
      const errorHtml = `data:text/html,${encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Overlay</title></head>
        <body style="margin:0;padding:24px;font-family:sans-serif;background:#1a1b1e;color:#e4e4e7;">
          <h1 style="color:#f59e0b;">Dev server not running</h1>
          <p>The overlay could not load from <code>http://localhost:5173</code>.</p>
          <p><strong>Do this:</strong></p>
          <ol style="line-height:1.8;">
            <li>Close this window (or press F9).</li>
            <li>In a terminal, run: <code style="background:#2d2d2d;padding:4px 8px;border-radius:4px;">npm run dev</code></li>
            <li>Wait until Vite is ready, then the overlay window will open again with the app.</li>
          </ol>
          <p>Or to run the built app without Vite: run <code style="background:#2d2d2d;padding:4px 8px;">npm run build</code> then <code style="background:#2d2d2d;padding:4px 8px;">npm start</code>.</p>
        </body></html>
      `)}`;
      win!.loadURL(errorHtml).then(showWindow);
    });
    win.webContents.once('did-finish-load', () => {
      const url = win!.webContents.getURL();
      if (url.startsWith('chrome-error:') || url === 'about:blank') {
        const errorHtml = `data:text/html,${encodeURIComponent(`
          <!DOCTYPE html><html><head><meta charset="utf-8"><title>Overlay</title></head>
          <body style="margin:0;padding:24px;font-family:sans-serif;background:#1a1b1e;color:#e4e4e7;">
            <h1 style="color:#f59e0b;">Could not load overlay</h1>
            <p>Start the dev server first: open a terminal and run <code style="background:#2d2d2d;padding:4px 8px;">npm run dev</code></p>
            <p>Or build and run: <code style="background:#2d2d2d;padding:4px 8px;">npm run build</code> then <code style="background:#2d2d2d;padding:4px 8px;">npm start</code></p>
          </body></html>
        `)}`;
        win!.loadURL(errorHtml).then(showWindow);
      } else {
        win!.webContents.openDevTools({ mode: 'detach' });
        if (getEnabledOverlays().proximityRadar) showWindow();
      }
    });
  } else {
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    win.loadFile(indexPath).then(() => {
      if (getEnabledOverlays().proximityRadar) showWindow();
    }).catch((err: Error) => {
      console.error('Failed to load index.html:', err);
      const errorHtml = `data:text/html,${encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Overlay</title></head>
        <body style="margin:0;padding:24px;font-family:sans-serif;background:#1a1b1e;color:#e4e4e7;">
          <h1 style="color:#ef4444;">Failed to load app</h1>
          <p>Build the app first: <code style="background:#2d2d2d;padding:4px 8px;">npm run build</code> then <code style="background:#2d2d2d;padding:4px 8px;">npm start</code></p>
          <p>Expected: dist/renderer/index.html</p>
        </body></html>
      `)}`;
      win!.loadURL(errorHtml).then(showWindow);
    });
  }

  win.setIgnoreMouseEvents(clickThrough, { forward: true });
  mainWindow = win;
  (win as BrowserWindow & { _ignoreMouseOverride?: boolean })._ignoreMouseOverride = false;

  initIrsdk(win);

  win.once('ready-to-show', () => {
    if (!win!.isVisible() && getEnabledOverlays().proximityRadar) showWindow();
  });

  win.on('closed', () => {
    mainWindow = null;
    stopIrsdk();
  });
}

function createManagerWindow(): void {
  if (managerWindow && !managerWindow.isDestroyed()) {
    managerWindow.show();
    managerWindow.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 420,
    height: 520,
    minWidth: 360,
    minHeight: 400,
    show: false,
    title: 'iRacing Overlay Manager',
    backgroundColor: '#0c0d12',
    webPreferences: {
      preload: path.join(__dirname, 'preloadManager.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  managerWindow = win;
  if (isDev) {
    win.loadURL('http://localhost:5173/manager.html').then(() => win.show());
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'manager.html')).then(() => win.show());
  }
  win.on('closed', () => {
    managerWindow = null;
  });
}

function createTray(): void {
  try {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    const iconIco = path.join(__dirname, '../../assets/icon.ico');
    const fs = require('fs');
    const p = fs.existsSync(iconPath) ? iconPath : fs.existsSync(iconIco) ? iconIco : null;
    if (p) tray = new Tray(p);
  } catch {
    // No tray icon found; app still works without tray
  }
  if (!tray) return;
  tray.setToolTip('iRacing Overlay Manager');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Manager', click: () => createManagerWindow() },
      { label: 'Show Overlay', click: () => { overlayTape = 1; applyTapeState(); } },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
}

app.whenReady().then(() => {
  createWindow();
  createManagerWindow();
  createTray();

  globalShortcut.register('F10', () => {
    clickThrough = !clickThrough;
    mainWindow?.setIgnoreMouseEvents(clickThrough, { forward: true });
  });

  globalShortcut.register('F9', () => {
    if (!mainWindow?.isDestroyed()) {
      overlayTape = (overlayTape === 1 ? 2 : overlayTape === 2 ? 3 : 1) as 1 | 2 | 3;
      applyTapeState();
    }
  });

  globalShortcut.register('F8', () => {
    if (!mainWindow?.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        overlayTape = 1;
        mainWindow.show();
      }
      mainWindow.focus();
      mainWindow.webContents.send('toggle-settings');
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (tray) tray.destroy();
  tray = null;
  app.quit();
});

app.on('before-quit', () => {
  stopIrsdk();
});

// IPC: settings
ipcMain.handle('get-settings', () => getSettings());
ipcMain.handle('set-settings', (_e, settings: unknown) => {
  setSettings(settings as Parameters<typeof setSettings>[0]);
});
ipcMain.handle('get-settings-json', () => getSettingsJson());
ipcMain.handle('import-settings-json', (_e, json: string) => setSettingsFromJson(json));
ipcMain.on('set-click-through', (_e, value: boolean) => {
  clickThrough = value;
  if (overlayTape === 3) {
    mainWindow?.setIgnoreMouseEvents(false);
    return;
  }
  const win = mainWindow as BrowserWindow & { _ignoreMouseOverride?: boolean } | null;
  if (win?._ignoreMouseOverride) return;
  mainWindow?.setIgnoreMouseEvents(clickThrough, { forward: true });
});

ipcMain.on('set-overlay-ignore-mouse', (_e, ignore: boolean) => {
  if (overlayTape === 3) {
    mainWindow?.setIgnoreMouseEvents(false);
    return;
  }
  const win = mainWindow as BrowserWindow & { _ignoreMouseOverride?: boolean } | null;
  if (win) win._ignoreMouseOverride = !ignore;
  mainWindow?.setIgnoreMouseEvents(ignore, ignore ? { forward: true } : undefined);
});

ipcMain.handle('get-overlay-size', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return { width: 500, height: 400 };
  const [w, h] = mainWindow.getSize();
  return { width: w, height: h };
});

ipcMain.on('set-overlay-size', (_e, width: number, height: number) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const w = Math.max(300, Math.min(1200, Math.round(width)));
  const h = Math.max(200, Math.min(800, Math.round(height)));
  mainWindow.setSize(w, h);
});

// IPC: overlay manager
ipcMain.handle('get-enabled-overlays', () => getEnabledOverlays());
ipcMain.handle('set-enabled-overlays', (_e, overlays: unknown) => {
  setEnabledOverlays(overlays as Parameters<typeof setEnabledOverlays>[0]);
  applyOverlayVisibility();
});
ipcMain.on('open-overlay-settings', () => {
  mainWindow?.show();
  mainWindow?.focus();
  mainWindow?.webContents.send('toggle-settings');
});
ipcMain.on('show-overlay', () => {
  mainWindow?.show();
});
ipcMain.on('show-manager', () => {
  createManagerWindow();
});
