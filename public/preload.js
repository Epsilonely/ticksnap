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

// 업비트 REST API
contextBridge.exposeInMainWorld('upbitAPI', {
  getAccounts: (accessKey, secretKey) => ipcRenderer.invoke('upbit-get-accounts', { accessKey, secretKey }),
});

// 바이낸스 REST API
contextBridge.exposeInMainWorld('binanceAPI', {
  getAccounts: (apiKey, apiSecret) => ipcRenderer.invoke('binance-get-accounts', { apiKey, apiSecret }),
  getFuturesAccounts: (apiKey, apiSecret) => ipcRenderer.invoke('binance-get-futures-accounts', { apiKey, apiSecret }),
  getFuturesPositions: (apiKey, apiSecret) => ipcRenderer.invoke('binance-get-futures-positions', { apiKey, apiSecret }),
});

// 바이낸스 QR 로그인 API
contextBridge.exposeInMainWorld('binanceQRLoginAPI', {
  precheck: () => ipcRenderer.invoke('binance-qr-precheck'),
  checkResult: (sessionId) => ipcRenderer.invoke('binance-qr-check-result', { sessionId }),
  getQRCode: (random, sessionId) => ipcRenderer.invoke('binance-qr-get-code', { random, sessionId }),
  queryStatus: (qrCode, random, sessionId) => ipcRenderer.invoke('binance-qr-query-status', { qrCode, random, sessionId }),
  isLoggedIn: () => ipcRenderer.invoke('binance-is-logged-in'),
  logout: () => ipcRenderer.invoke('binance-logout'),
});
