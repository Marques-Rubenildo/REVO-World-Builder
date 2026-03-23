const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('worldFS', {
  saveVersion:   (worldData) => ipcRenderer.invoke('fs:saveVersion',  worldData),
  listSaves:     ()          => ipcRenderer.invoke('fs:listSaves'),
  loadVersion:   (version)   => ipcRenderer.invoke('fs:loadVersion',  { version }),
  deleteVersion: (version)   => ipcRenderer.invoke('fs:deleteVersion',{ version }),
  savesRoot:     ()          => ipcRenderer.invoke('fs:savesRoot'),
});

// Debug eval bridge
// Preload recebe 'debug:run' do main e dispara CustomEvent na pagina
// A pagina escuta esse evento, executa o eval, e chama __debugSend
ipcRenderer.on('debug:run', (_, id, code) => {
  console.log('[PRELOAD] debug:run id=' + id);
  // dispatchEvent funciona mesmo com contextIsolation
  window.dispatchEvent(new CustomEvent('__debug_run', {
    detail: { id, code }
  }));
});

// Pagina chama __debugSend(id, result) -> preload envia ao main
contextBridge.exposeInMainWorld('__debugSend', (id, result) => {
  console.log('[PRELOAD] __debugSend id=' + id);
  ipcRenderer.send('debug:result', id, result);
});
