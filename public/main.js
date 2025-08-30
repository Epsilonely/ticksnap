const { app, BrowserWindow, ipcMain } = await import('electron');
const path = await import('path');
const { fileURLToPath } = await import('url');
const isDev = await import('electron-is-dev');
const crypto = await import('crypto');
const { v4: uuidv4 } = await import('uuid');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      devTools: isDev,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenu(null); // 기본 상단 메뉴바 제거

  // 개발모드 - 로컬서버 실행 <> 프로덕션모드 - 빌드파일 실행
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`);

  // 개발 모드인 경우에는 개발자도구 자동으로 켜짐
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.setResizable(true); // 윈도우 크기 변경 가능
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
  mainWindow.focus();
}

// Electron 준비되면 새 Browser Window 생성
// app.on('ready', createWindow)
app.whenReady().then(createWindow);

// Brower Window가 열려있지 않을 때 앱을 활성화하면
// 새 Browswer Window 생성
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// macOS가 아닌 운영체제에서는 창을 종료하면 앱이 완전히 종료되기 때문에
// 창이 모두 꺼지면('window-all-closed') 앱도 종료시킴
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Upbit API 관련 함수들
class UpbitAPI {
  constructor(accessKey, secretKey) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.serverUrl = 'https://api.upbit.com';
  }

  base64UrlEncode(str) {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  async generateAuthToken(query = '') {
    const payload = {
      access_key: this.accessKey,
      nonce: uuidv4(),
    };

    if (query) {
      const queryHash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
      payload.query_hash = queryHash;
      payload.query_hash_alg = 'SHA512';
    }

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    const message = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(message).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return `${message}.${signature}`;
  }

  async getAccounts() {
    try {
      const authToken = await this.generateAuthToken();

      const response = await fetch(`${this.serverUrl}/v1/accounts`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('계좌 조회 실패:', error);
      throw error;
    }
  }

  async getOrdersChance(market) {
    try {
      const query = `market=${market}`;
      const authToken = await this.generateAuthToken(query);

      const response = await fetch(`${this.serverUrl}/v1/orders/chance?${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('주문 가능 정보 조회 실패:', error);
      throw error;
    }
  }
}

// IPC 핸들러 등록
ipcMain.handle('upbit-get-accounts', async (event, { accessKey, secretKey }) => {
  try {
    const upbitAPI = new UpbitAPI(accessKey, secretKey);
    return await upbitAPI.getAccounts();
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle('upbit-get-orders-chance', async (event, { accessKey, secretKey, market }) => {
  try {
    const upbitAPI = new UpbitAPI(accessKey, secretKey);
    return await upbitAPI.getOrdersChance(market);
  } catch (error) {
    throw new Error(error.message);
  }
});
