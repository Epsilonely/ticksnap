const { app, BrowserWindow, ipcMain } = await import('electron');
const path = await import('path');
const { fileURLToPath } = await import('url');
const isDev = await import('electron-is-dev');
const crypto = await import('crypto');
const { v4: uuidv4 } = await import('uuid');
const WebSocket = await import('ws');
const jwt = await import('jsonwebtoken');

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

// 업비트 프라이빗 웹소켓 클래스
class UpbitPrivateWebSocket {
  constructor(accessKey, secretKey) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.webSocket = null;
    this.currentAssets = [];
  }

  connect() {
    if (this.webSocket) {
      console.log('프라이빗 웹소켓이 이미 연결되어 있습니다.');
      return;
    }

    try {
      // 공식 문서 방식: jsonwebtoken 라이브러리 사용
      const payload = {
        access_key: this.accessKey,
        nonce: uuidv4(),
      };

      const jwtToken = jwt.sign(payload, this.secretKey);
      console.log('🔑 JWT 토큰 생성됨 (jsonwebtoken):', jwtToken.substring(0, 50) + '...');

      // 공식 문서 방식: Authorization 헤더에 토큰 포함
      this.webSocket = new WebSocket.default('wss://api.upbit.com/websocket/v1/private', {
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      this.webSocket.on('open', () => {
        console.log('🔒 업비트 프라이빗 웹소켓 연결됨 (공식 방식)');

        // 공식 문서 방식: ticket은 UUID 사용
        const subscribeMessage = JSON.stringify([
          { ticket: uuidv4() },
          { type: 'myAsset' },
          { format: 'JSON_LIST' }
        ]);

        console.log('📤 구독 메시지 전송:', subscribeMessage);
        this.webSocket.send(subscribeMessage);
      });

      this.webSocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📥 웹소켓 메시지 수신 (전체):', JSON.stringify(message, null, 2));
          
          if (message.type === 'myAsset') {
            console.log('✅ myAsset 메시지 확인, content:', message.content);
            this.handleAssetUpdate(message.content);
          } else {
            console.log('⚠️ myAsset가 아닌 메시지 타입:', message.type);
          }
        } catch (error) {
          console.error('프라이빗 웹소켓 데이터 파싱 오류:', error);
          console.log('원본 데이터:', data.toString());
        }
      });

      this.webSocket.on('error', (error) => {
        console.error('🚨 프라이빗 웹소켓 오류:', error);
      });

      this.webSocket.on('close', (code, reason) => {
        console.log('🔌 프라이빗 웹소켓 연결 종료:', {
          code,
          reason: reason.toString(),
        });
        this.webSocket = null;

        // 인증 오류가 아닌 경우에만 재연결 시도
        if (code !== 1000 && code !== 1003 && code !== 1006) {
          setTimeout(() => {
            console.log('🔄 프라이빗 웹소켓 재연결 시도...');
            this.connect();
          }, 5000);
        } else {
          console.log('❌ 연결 종료. 재연결하지 않습니다.');
        }
      });

    } catch (error) {
      console.error('프라이빗 웹소켓 연결 실패:', error);
    }
  }

  handleAssetUpdate(assetData) {
    console.log('💰 실시간 자산 정보 업데이트:', {
      코인: assetData.currency,
      보유수량: assetData.balance,
      평균매수가: assetData.avg_buy_price,
      주문중: assetData.locked,
      시간: new Date().toLocaleTimeString()
    });

    // 현재 자산 업데이트
    const existingIndex = this.currentAssets.findIndex(
      asset => asset.currency === assetData.currency
    );

    if (existingIndex >= 0) {
      this.currentAssets[existingIndex] = assetData;
    } else {
      this.currentAssets.push(assetData);
    }

    // 렌더러 프로세스에 자산 업데이트 전송
    if (mainWindow) {
      mainWindow.webContents.send('asset-update', [...this.currentAssets]);
    }
  }

  disconnect() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
      console.log('프라이빗 웹소켓 수동 연결 해제');
    }
  }

  getCurrentAssets() {
    return [...this.currentAssets];
  }
}

// 전역 프라이빗 웹소켓 인스턴스
let privateWebSocket = null;

// IPC 핸들러들
ipcMain.handle('private-websocket-connect', async (event, { accessKey, secretKey }) => {
  try {
    if (privateWebSocket) {
      privateWebSocket.disconnect();
    }
    
    privateWebSocket = new UpbitPrivateWebSocket(accessKey, secretKey);
    privateWebSocket.connect();
    
    return { success: true };
  } catch (error) {
    console.error('프라이빗 웹소켓 연결 실패:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('private-websocket-disconnect', async () => {
  try {
    if (privateWebSocket) {
      privateWebSocket.disconnect();
      privateWebSocket = null;
    }
    return { success: true };
  } catch (error) {
    console.error('프라이빗 웹소켓 해제 실패:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('private-websocket-get-assets', async () => {
  try {
    if (privateWebSocket) {
      return { success: true, assets: privateWebSocket.getCurrentAssets() };
    }
    return { success: false, error: 'WebSocket not connected' };
  } catch (error) {
    console.error('자산 조회 실패:', error);
    return { success: false, error: error.message };
  }
});
