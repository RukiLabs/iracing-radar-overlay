import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('managerAPI', {
  getEnabledOverlays: () => ipcRenderer.invoke('get-enabled-overlays'),
  setEnabledOverlays: (overlays: unknown) => ipcRenderer.invoke('set-enabled-overlays', overlays),
  openOverlaySettings: () => ipcRenderer.send('open-overlay-settings'),
  showOverlay: () => ipcRenderer.send('show-overlay'),
  showManager: () => ipcRenderer.send('show-manager'),
});
