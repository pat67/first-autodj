import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Reliable Electron detection flag for the renderer
  isElectron: true,
  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),
  // Platform info
  platform: process.platform,

  // Automation server controls
  automation: {
    /** Start the HTTP server on the given port. Returns { success, error? } */
    start: (port: number) => ipcRenderer.invoke('start-automation-server', port),
    /** Stop the HTTP server. */
    stop: () => ipcRenderer.invoke('stop-automation-server'),
    /**
     * Register a callback that fires whenever a Companion POST arrives.
     * trigger is one of: 'setAudience' | 'matchStart' | 'matchEnd' | 'postResult'
     */
    onTrigger: (callback: (trigger: string) => void) => {
      ipcRenderer.on('automation-trigger', (_event, trigger: string) => callback(trigger));
    },
    /** Remove all automation trigger listeners (call on cleanup). */
    removeTriggerListeners: () => {
      ipcRenderer.removeAllListeners('automation-trigger');
    },
  },
});
