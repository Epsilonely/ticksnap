const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

// 프라이빗 웹소켓 API
contextBridge.exposeInMainWorld('privateWebSocketAPI', {
  connect: (accessKey, secretKey) => ipcRenderer.invoke('private-websocket-connect', { accessKey, secretKey }),
  disconnect: () => ipcRenderer.invoke('private-websocket-disconnect'),
  getCurrentAssets: () => ipcRenderer.invoke('private-websocket-get-assets'),
  onAssetUpdate: (callback) => ipcRenderer.on('asset-update', (event, assets) => callback(assets)),
  offAssetUpdate: (callback) => ipcRenderer.removeListener('asset-update', callback),
});
