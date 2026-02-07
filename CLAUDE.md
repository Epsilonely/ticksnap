# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TickSnap is an Electron + React desktop application for multi-exchange cryptocurrency trading and portfolio management. It integrates with **Upbit** (Korean KRW market) and **Binance** (USDT market) to provide unified real-time market data, portfolio tracking, and trading.

## Commands

- `npm run dev` — Start development (Vite dev server + Electron window, port 3000)
- `npm run start` — Vite dev server only (no Electron)
- `npm run build` — Production build to `dist/`
- `npm run electron-build:win` — Build + package Windows Electron app

No test runner is currently configured (test libraries are installed but no test script exists in package.json).

## Tech Stack

- **React 19** + **TypeScript** + **Vite** (renderer process)
- **Redux Toolkit** (state management)
- **Tailwind CSS v4** (styling, with `@tailwindcss/vite` plugin)
- **Electron 35** (desktop shell, main process in `public/main.js`)
- **Axios** (HTTP), **ws** (WebSocket), **jsonwebtoken** (Upbit JWT auth)
- **Prettier** (formatting, configured in `.prettierrc.yml`: printWidth 1000, singleQuote)

## Architecture

### Process Model (Electron)

```
Electron Main Process (public/main.js)
  ├─ Window management
  ├─ IPC handlers: private WebSocket, Upbit REST, Binance REST
  └─ JWT signing for Upbit authenticated endpoints

Preload Script (public/preload.js)
  └─ Exposes IPC bridges: window.privateWebSocketAPI, window.upbitAPI, window.binanceAPI

React Renderer Process (src/)
  ├─ Redux store → components
  └─ DataManager (singleton) → exchange APIs → Redux dispatch
```

Context isolation is enabled. All exchange account API calls go through IPC (renderer -> main -> exchange).

### Data Flow

1. `App.tsx` calls `DataManager.initialize()` on mount
2. **DataManager** (`src/services/DataManager.ts`, singleton) fetches all markets from both exchanges and builds a unified symbol mapping (Upbit `KRW-BTC` + Binance `BTCUSDT` → symbol `BTC`)
3. REST polling every 1 second updates all coin prices
4. WebSocket connections are opened only for **favorite coins** (bandwidth optimization); REST updates are skipped for coins with active WebSocket feeds
5. DataManager dispatches `setUnifiedCoins` to Redux store
6. Components subscribe to store and re-render

### Redux Store Shape

```
coin: {
  unifiedCoins: UnifiedCoinData[]  // merged data from both exchanges
  selectedCoin: string | null
  loading, error
  candleData, tickData, selectedInterval
  favoriteData, webSocketData
}
favorite: {
  favorites: string[]  // persisted to localStorage
}
```

`UnifiedCoinData` (defined in `src/utils/symbolMatcher.ts`) contains per-exchange price, change direction, change rate, and trade volume under optional `upbit` and `binance` fields.

### Key Source Directories

- `src/services/` — API clients and data orchestration
  - `DataManager.ts` — singleton that owns polling, WebSocket, and Redux dispatch
  - `UpbitApi.ts`, `BinanceApi.ts` — REST market/ticker/candle endpoints
  - `UpbitAccountApi.ts`, `BinanceAccountApi.ts` — authenticated account/position queries (run via IPC)
- `src/store/slices/` — Redux slices (`coinSlice.ts`, `favoriteSlice.ts`)
- `src/block/` — Top-level layout blocks (MarketBlock, CoinDetailBlock, Portfolio, Leaderboard)
- `src/components/` — Reusable UI components (Trading, CoinInfo, MiniChart, ExchangePriceDisplay)
- `src/common/` — Shared UI utilities (Scrollbar, PriceDisplay)
- `src/utils/` — Symbol matching/unification logic
- `public/` — Electron main process, preload script, static assets (images, fonts)

### Vite Dev Proxy

Development proxies handle CORS for exchange APIs:
- `/api/upbit` → `https://api.upbit.com`
- `/api/binance` → `https://api.binance.com`
- `/bapi` → `https://www.binance.com`

### Tailwind Customizations

Safelisted classes: `text-price-rise`, `text-price-fall`, `text-price-unchanged`. Custom font families: Pretendard, Righteous, SpoqaHanSans.

## Memory Bank

Read all files in `docs/memory-bank/` directory at session start to understand project context:

- `projectbrief.md` - Project foundation and requirements
- `productContext.md` - Project purpose and UX goals
- `activeContext.md` - Current work focus and recent changes
- `systemPatterns.md` - Architecture and design patterns
- `techContext.md` - Tech stack and development environment
- `progress.md` - Current progress and remaining work

When user requests "update memory bank", review and update all above files.

## Conventions

- API keys are loaded from `config.js` at project root (Upbit + Binance access/secret keys)
- Vite root is `./src` (not project root); build output goes to `../dist`
- ESM throughout (`"type": "module"` in package.json)
- Korean comments are common in the codebase

## Documentation Language

- **All files under `docs/` directory MUST be written in English**
- **Memory bank files (`docs/memory-bank/*.md`) MUST be written in English**
- Code comments can be in Korean (common in this codebase)
- UI text and user-facing content can be in Korean
