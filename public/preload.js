const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('upbitAPI', {
  getAccounts: (accessKey, secretKey) => ipcRenderer.invoke('upbit-get-accounts', { accessKey, secretKey }),
  getOrdersChance: (accessKey, secretKey, market) => ipcRenderer.invoke('upbit-get-orders-chance', { accessKey, secretKey, market }),
});
