const { app, BrowserWindow } = await import('electron')
const path = await import('path')
const { fileURLToPath } = await import('url')
const isDev = await import('electron-is-dev')

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      devTools: isDev,
      // preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.setMenu(null); // 기본 상단 메뉴바 제거

  // 개발모드 - 로컬서버 실행 <> 프로덕션모드 - 빌드파일 실행
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`)

  // 개발 모드인 경우에는 개발자도구 자동으로 켜짐
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })

  mainWindow.setResizable(true) // 윈도우 크기 변경 가능
  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
  mainWindow.focus()
}

// Electron 준비되면 새 Browser Window 생성
// app.on('ready', createWindow)
app.whenReady().then(createWindow);

// Brower Window가 열려있지 않을 때 앱을 활성화하면
// 새 Browswer Window 생성
app.on('activate', () => {
  if (mainWindow === null) createWindow()
});

// macOS가 아닌 운영체제에서는 창을 종료하면 앱이 완전히 종료되기 때문에 
// 창이 모두 꺼지면('window-all-closed') 앱도 종료시킴
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});