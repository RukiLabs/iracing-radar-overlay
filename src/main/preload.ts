import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('set-settings', settings),
  getSettingsJson: () => ipcRenderer.invoke('get-settings-json'),
  importSettingsJson: (json: string) => ipcRenderer.invoke('import-settings-json', json),
  onTelemetryUpdate: (fn: (state: unknown) => void) => {
    ipcRenderer.on('telemetry-update', (_e, state) => fn(state));
  },
  onToggleSettings: (fn: () => void) => {
    ipcRenderer.on('toggle-settings', () => fn());
  },
  onOverlayTapeChange: (fn: (tape: number) => void) => {
    ipcRenderer.on('overlay-tape', (_e, tape: number) => fn(tape));
  },
  setClickThrough: (value: boolean) => ipcRenderer.send('set-click-through', value),
  setOverlayIgnoreMouse: (ignore: boolean) => ipcRenderer.send('set-overlay-ignore-mouse', ignore),
  getOverlaySize: () => ipcRenderer.invoke('get-overlay-size'),
  setOverlaySize: (width: number, height: number) => ipcRenderer.send('set-overlay-size', width, height),
});
