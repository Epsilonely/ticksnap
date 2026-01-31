# Tech Context - TickSnap

## Technologies Used

### Core Stack

- **React 19.0.0:** UI framework
- **TypeScript 4.9.5:** Type-safe JavaScript
- **Electron 35.0.2:** Desktop application framework
- **Vite 6.2.2:** Build tool and dev server

### State Management

- **Redux Toolkit 2.7.0:** State management
- **React-Redux 9.2.0:** React bindings for Redux

### Styling

- **Tailwind CSS 4.0.14:** Utility-first CSS framework
- **@tailwindcss/vite 4.0.14:** Vite plugin for Tailwind
- **lightningcss 1.29.3:** Fast CSS processing

### API & Data

- **axios 1.12.2:** HTTP client
- **ws 8.18.3:** WebSocket client
- **jsonwebtoken 9.0.2:** JWT handling for API auth
- **uuid 11.1.0:** Unique identifier generation

### Development Tools

- **@vitejs/plugin-react 4.3.4:** React support for Vite
- **concurrently 9.1.2:** Run multiple commands simultaneously
- **cross-env 7.0.3:** Cross-platform environment variables
- **wait-on 8.0.3:** Wait for resources before starting
- **electron-builder 25.1.8:** Package and build Electron apps

### Testing

- **@testing-library/react 16.2.0:** React testing utilities
- **@testing-library/jest-dom 6.6.3:** Jest DOM matchers
- **@testing-library/user-event 13.5.0:** User interaction simulation

## Development Setup

### Prerequisites

- Node.js (version compatible with Electron 35)
- npm or yarn package manager
- Git for version control

### Installation

```bash
npm install
# or
yarn install
```

### Environment

- **Development:** `NODE_ENV=development`
- **Port:** 3000 (Vite dev server)
- **Hot Reload:** Enabled via Vite HMR

### Scripts

- `npm start`: Web dev server only (port 3000)
- `npm run dev`: Electron + Vite dev mode (concurrently: Vite + wait-on + Electron)
- `npm run build`: Production build to `dist/`
- `npm run preview`: Preview production build
- `npm run electron-build`: Build Electron app
- `npm run electron-build:win`: Build for Windows x64

### Vite Dev Proxy

Development proxies handle CORS for exchange APIs:
- `/api/upbit` → `https://api.upbit.com` (rewrite: prefix 제거)
- `/api/binance` → `https://api.binance.com` (rewrite: prefix 제거)
- `/bapi` → `https://www.binance.com`
- `/fapi` → `https://fapi.binance.com` (Binance USD-M Futures)

Vite root is `./src` (not project root); build output goes to `../dist`.

## Technical Constraints

### Electron Constraints

- Main process vs Renderer process separation
- IPC communication between processes
- Security considerations (nodeIntegration, contextIsolation)
- Native module compatibility

### API Constraints

- **Binance Futures:** Rate limits, 단일 연결당 최대 1024 스트림, 초당 10개 수신 메시지
- **Binance Futures ticker:** `?symbols=[]` 미지원 → 전체 fetch + client-side filter
- **Upbit:** Rate limits, JWT authentication
- WebSocket connection limits (Futures: `wss://fstream.binance.com`)
- Network latency considerations

### Performance Constraints

- Real-time updates must be < 1 second
- UI must remain responsive during data updates
- Memory management for long-running sessions
- Efficient state updates to prevent re-renders

### Platform Constraints

- Primary target: Windows 11
- Potential for cross-platform (macOS, Linux)
- File system access for credential storage
- System tray integration considerations

## Dependencies

### Production Dependencies

```json
{
  "@reduxjs/toolkit": "^2.7.0",
  "@tailwindcss/vite": "^4.0.14",
  "axios": "^1.12.2",
  "electron-is-dev": "^3.0.1",
  "jsonwebtoken": "^9.0.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-redux": "^9.2.0",
  "tailwindcss": "^4.0.14",
  "typescript": "^4.9.5",
  "uuid": "^11.1.0",
  "ws": "^8.18.3"
}
```

### Development Dependencies

```json
{
  "@vitejs/plugin-react": "^4.3.4",
  "concurrently": "^9.1.2",
  "cross-env": "^7.0.3",
  "electron": "^35.0.2",
  "electron-builder": "^25.1.8",
  "vite": "^6.2.2",
  "wait-on": "^8.0.3"
}
```

## Tool Usage Patterns

### Development Workflow

1. Start dev server: `npm run dev`
2. Vite starts on port 3000
3. wait-on waits for server ready
4. Electron launches automatically
5. Changes hot-reload in both web and Electron

### Building

1. Vite builds React app to `dist/`
2. electron-builder packages with Electron
3. Output in `dist/` or `release/` directory

### Debugging

- Chrome DevTools in Electron
- React DevTools extension
- Redux DevTools for state inspection
- Console logging in both main and renderer

### Code Quality

- TypeScript for compile-time checks
- ESLint configuration (react-app preset)
- Prettier for code formatting (.prettierrc.yml: printWidth 1000, singleQuote)
- No test runner configured (test libraries installed but no test script in package.json)

### Version Control

- Git repository
- GitHub remote: https://github.com/Epsilonely/ticksnap.git
- .gitignore configured for node_modules, dist, etc.
- Memory Bank docs in `docs/memory-bank/` (shared between Cline and Claude Code)
- `CLAUDE.md` provides Claude Code project context and references Memory Bank
