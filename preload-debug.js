const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('debugBridge', {
  onMessage: (callback) => {
    ipcRenderer.on('debug-message', (event, type, msg) => callback(type, msg));
  },
  evalInMain: (code) => ipcRenderer.invoke('debug:eval', code),
});
