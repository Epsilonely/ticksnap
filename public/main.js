const { app, BrowserWindow, BrowserView, ipcMain } = await import('electron');
const path = await import('path');
const { fileURLToPath } = await import('url');
const isDev = await import('electron-is-dev');
const crypto = await import('crypto');
const { v4: uuidv4 } = await import('uuid');
const WebSocket = await import('ws');
const jwt = await import('jsonwebtoken');
const https = await import('https');

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

      const jwtToken = jwt.default.sign(payload, this.secretKey);
      console.log('🔑 JWT 토큰 생성됨 (jsonwebtoken):', jwtToken.substring(0, 50) + '...');

      // 공식 문서 방식: Authorization 헤더에 토큰 포함
      this.webSocket = new WebSocket.default('wss://api.upbit.com/websocket/v1/private', {
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      this.webSocket.on('open', () => {
        console.log('🔒 업비트 프라이빗 웹소켓 연결됨 (공식 방식)');

        // 공식 문서 방식: ticket은 UUID 사용
        const subscribeMessage = JSON.stringify([{ ticket: uuidv4() }, { type: 'myAsset' }, { format: 'JSON_LIST' }]);

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
      시간: new Date().toLocaleTimeString(),
    });

    // 현재 자산 업데이트
    const existingIndex = this.currentAssets.findIndex((asset) => asset.currency === assetData.currency);

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

// 바이낸스 로그인 상태
let loginCookies = [];

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

// REST API로 업비트 자산 조회
ipcMain.handle('upbit-get-accounts', async (event, { accessKey, secretKey }) => {
  return new Promise((resolve, reject) => {
    try {
      const payload = {
        access_key: accessKey,
        nonce: uuidv4(),
      };

      const jwtToken = jwt.default.sign(payload, secretKey);

      const options = {
        hostname: 'api.upbit.com',
        path: '/v1/accounts',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const accounts = JSON.parse(data);
            console.log('✅ 업비트 REST API 자산 조회 성공:', accounts.length, '개 항목');
            resolve({ success: true, accounts });
          } catch (error) {
            console.error('❌ 업비트 REST API 응답 파싱 오류:', error);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 업비트 REST API 요청 오류:', error);
        resolve({ success: false, error: error.message });
      });

      req.end();
    } catch (error) {
      console.error('❌ 업비트 REST API 자산 조회 실패:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// 바이낸스 서버 시간 조회 함수
async function getBinanceServerTime() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.binance.com',
      path: '/api/v3/time',
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const timeData = JSON.parse(data);
          resolve(timeData.serverTime);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// REST API로 바이낸스 Spot 자산 조회
ipcMain.handle('binance-get-accounts', async (event, { apiKey, apiSecret }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 먼저 바이낸스 서버 시간을 조회하여 시간 차이 계산
      let serverTime;
      try {
        serverTime = await getBinanceServerTime();
        const localTime = Date.now();
        const timeDiff = localTime - serverTime;
        console.log('⏰ 시간 동기화:', {
          로컬시간: localTime,
          서버시간: serverTime,
          시간차이: `${timeDiff}ms`,
        });
      } catch (error) {
        console.warn('⚠️ 서버 시간 조회 실패, 로컬 시간 사용:', error.message);
        serverTime = Date.now();
      }

      // 2. 서버 시간 기준으로 타임스탬프 생성 (약간의 여유를 두고 -1000ms)
      const timestamp = serverTime - 1000;
      const recvWindow = 10000; // 허용 시간 범위를 10초로 설정
      const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

      // 3. HMAC SHA256 서명 생성
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');

      const options = {
        hostname: 'api.binance.com',
        path: `/api/v3/account?${queryString}&signature=${signature}`,
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const accountData = JSON.parse(data);

            if (accountData.code) {
              // 에러 응답
              console.error('❌ 바이낸스 Spot API 오류:', accountData.msg);
              resolve({ success: false, error: accountData.msg });
              return;
            }

            // balances 배열에서 잔액이 있는 것만 필터링
            const balances = accountData.balances
              .filter((balance) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
              .map((balance) => ({
                asset: balance.asset,
                free: balance.free,
                locked: balance.locked,
              }));

            console.log('✅ 바이낸스 Spot REST API 자산 조회 성공:', balances.length, '개 항목');
            resolve({ success: true, balances });
          } catch (error) {
            console.error('❌ 바이낸스 Spot REST API 응답 파싱 오류:', error);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 바이낸스 Spot REST API 요청 오류:', error);
        resolve({ success: false, error: error.message });
      });

      req.end();
    } catch (error) {
      console.error('❌ 바이낸스 Spot REST API 자산 조회 실패:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// 바이낸스 QR 로그인 - Precheck
ipcMain.handle('binance-qr-precheck', async () => {
  return new Promise((resolve) => {
    try {
      console.log('🔐 바이낸스 QR Precheck 시작...');

      const postData = JSON.stringify({ bizType: 'qrcode_login' });

      const options = {
        hostname: 'accounts.binance.com',
        path: '/bapi/accounts/v1/public/account/security/request/precheck',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('✅ Precheck 성공:', result);
            resolve({ success: true, data: result.data });
          } catch (error) {
            console.error('❌ Precheck 응답 파싱 오류:', error);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Precheck 요청 오류:', error);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.error('❌ Precheck 실패:', error);
      resolve({ success: false, error: error.message });
    }
  });
});


// REST API로 바이낸스 Futures 자산 조회
ipcMain.handle('binance-get-futures-accounts', async (event, { apiKey, apiSecret }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 바이낸스 서버 시간 조회
      let serverTime;
      try {
        serverTime = await getBinanceServerTime();
      } catch (error) {
        console.warn('⚠️ 서버 시간 조회 실패, 로컬 시간 사용:', error.message);
        serverTime = Date.now();
      }

      // 2. 타임스탬프 생성
      const timestamp = serverTime - 1000;
      const recvWindow = 10000;
      const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

      // 3. HMAC SHA256 서명 생성
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');

      const options = {
        hostname: 'fapi.binance.com',
        path: `/fapi/v2/account?${queryString}&signature=${signature}`,
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const accountData = JSON.parse(data);

            if (accountData.code) {
              console.error('❌ 바이낸스 Futures API 오류:', accountData.msg);
              resolve({ success: false, error: accountData.msg });
              return;
            }

            // assets 배열에서 잔액이 있는 것만 필터링
            const balances = accountData.assets
              .filter((asset) => parseFloat(asset.availableBalance) > 0 || parseFloat(asset.walletBalance) > 0)
              .map((asset) => ({
                asset: asset.asset,
                free: asset.availableBalance,
                locked: (parseFloat(asset.walletBalance) - parseFloat(asset.availableBalance)).toString(),
                walletBalance: asset.walletBalance,
                unrealizedProfit: asset.unrealizedProfit,
              }));

            console.log('✅ 바이낸스 Futures REST API 자산 조회 성공:', balances.length, '개 항목');
            resolve({ success: true, balances });
          } catch (error) {
            console.error('❌ 바이낸스 Futures REST API 응답 파싱 오류:', error);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 바이낸스 Futures REST API 요청 오류:', error);
        resolve({ success: false, error: error.message });
      });

      req.end();
    } catch (error) {
      console.error('❌ 바이낸스 Futures REST API 자산 조회 실패:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// REST API로 바이낸스 Futures 포지션 조회
ipcMain.handle('binance-get-futures-positions', async (event, { apiKey, apiSecret }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 바이낸스 서버 시간 조회
      let serverTime;
      try {
        serverTime = await getBinanceServerTime();
      } catch (error) {
        console.warn('⚠️ 서버 시간 조회 실패, 로컬 시간 사용:', error.message);
        serverTime = Date.now();
      }

      // 2. 타임스탬프 생성
      const timestamp = serverTime - 1000;
      const recvWindow = 10000;
      const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

      // 3. HMAC SHA256 서명 생성
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');

      const options = {
        hostname: 'fapi.binance.com',
        path: `/fapi/v2/positionRisk?${queryString}&signature=${signature}`,
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const positionsData = JSON.parse(data);

            if (positionsData.code) {
              console.error('❌ 바이낸스 Futures 포지션 API 오류:', positionsData.msg);
              resolve({ success: false, error: positionsData.msg });
              return;
            }

            // 포지션이 있는 것만 필터링 (positionAmt가 0이 아닌 것)
            const positions = positionsData
              .filter((position) => parseFloat(position.positionAmt) !== 0)
              .map((position) => ({
                symbol: position.symbol,
                positionAmt: position.positionAmt,
                entryPrice: position.entryPrice,
                markPrice: position.markPrice,
                unRealizedProfit: position.unRealizedProfit,
                liquidationPrice: position.liquidationPrice,
                leverage: position.leverage,
                marginType: position.marginType,
                isolatedMargin: position.isolatedMargin,
                positionSide: position.positionSide,
              }));

            console.log('✅ 바이낸스 Futures 포지션 조회 성공:', positions.length, '개 포지션');
            resolve({ success: true, positions });
          } catch (error) {
            console.error('❌ 바이낸스 Futures 포지션 응답 파싱 오류:', error);
            resolve({ success: false, error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 바이낸스 Futures 포지션 요청 오류:', error);
        resolve({ success: false, error: error.message });
      });

      req.end();
    } catch (error) {
      console.error('❌ 바이낸스 Futures 포지션 조회 실패:', error);
      resolve({ success: false, error: error.message });
    }
  });
});
