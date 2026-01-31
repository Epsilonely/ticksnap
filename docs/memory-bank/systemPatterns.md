# System Patterns - TickSnap

## System Architecture

### High-Level Structure

```
┌─────────────────────────────────────┐
│         Electron Main Process       │
│  (main.js, preload.js)             │
│  - Window management               │
│  - IPC handlers                    │
│  - JWT signing (Upbit auth)        │
│  - Binance REST proxying           │
└─────────────────────────────────────┘
                 │ IPC
                 ▼
┌─────────────────────────────────────┐
│      React Renderer Process         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Redux Store             │  │
│  │  - coinSlice                 │  │
│  │  - favoriteSlice             │  │
│  │  - registeredCoinSlice       │  │
│  └──────────────────────────────┘  │
│                 │                   │
│  ┌──────────────┴──────────────┐  │
│  │                              │  │
│  ▼                              ▼  │
│ Components                  Blocks │
│ - Portfolio                - Market│
│ - Trading                  - Detail│
│ - CoinInfo                 - Board │
│                                     │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Service Layer               │
│  - DataManager (singleton)         │
│  - BinanceApi / BinanceAccountApi  │
│  - UpbitApi / UpbitAccountApi      │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      External APIs                  │
│  - Binance WebSocket/REST          │
│  - Upbit WebSocket/REST            │
└─────────────────────────────────────┘
```

### App Layout Structure

```
┌──────────────────────────────────────────────┐
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │             │  │ [Trader | Assets]     │  │
│  │  MarketBlock│  ├──────────────────────┤  │
│  │  (left      │  │                      │  │
│  │   sidebar)  │  │  Active Tab Content  │  │
│  │             │  │  - CoinDetailBlock   │  │
│  │  [검색바]   │  │  - Portfolio         │  │
│  │  내코인/    │  │                      │  │
│  │  관심/보유  │  │                      │  │
│  └─────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

Tab navigation managed by local state in App.tsx (`activeMiddleTab`):
- `'exchange'` → CoinDetailBlock
- `'investment'` → Portfolio

## Key Technical Decisions

### Frontend Framework
- **React 19:** Latest features, concurrent rendering
- **TypeScript:** Type safety for complex data structures
- **Redux Toolkit:** Simplified state management with less boilerplate

### Desktop Framework
- **Electron 35:** Cross-platform desktop capabilities
- **Vite:** Fast build tool with HMR for development

### Styling
- **Tailwind CSS 4:** Utility-first CSS with modern features
- **Custom fonts:** Pretendard, Spoqa Han Sans Neo for Korean support

### API Communication
- **axios:** HTTP requests for REST APIs
- **ws:** WebSocket library for real-time data
- **jsonwebtoken:** For Upbit API authentication (JWT)

## Design Patterns in Use

### Singleton Pattern (DataManager)
- Single instance coordinates all data flow
- Owns polling intervals, WebSocket connections, and Redux dispatch
- `DataManager.getInstance()` for access across the app
- `initialize()` called once from App.tsx on mount
- `destroy()` for cleanup

### Service Layer Pattern
- Separate API logic from UI components
- Each exchange has dedicated service files (Api + AccountApi)
- DataManager orchestrates across services
- AccountApi services communicate via IPC (renderer → main → exchange)

### Data Normalization Pattern
- Binance **Futures** data converted to Upbit-compatible format
- `convertBinanceTickerToUpbitFormat()` and `convertBinanceCandleToUpbitFormat()` in BinanceApi.ts
- Unified `UnifiedCoinData` structure merges both exchanges
- Symbol mapping: Upbit `KRW-BTC` + Binance Futures `BTCUSDT` → symbol `BTC`

### IPC Bridge Pattern (Electron Security)
- Context isolation enabled — renderer cannot access Node.js directly
- Preload script exposes typed API bridges:
  - `window.privateWebSocketAPI` — Upbit private WebSocket
  - `window.upbitAPI` — Upbit REST endpoints
  - `window.binanceAPI` — Binance REST endpoints
- Main process handles authentication (JWT signing, API key usage)
- Renderer never sees raw API keys

### Observer Pattern
- WebSocket connections observe exchange data streams
- Components subscribe to Redux store changes
- Real-time updates propagate: WebSocket → Service → Redux → Component

### Registered Coin Pattern
- 사용자가 검색으로 보고 싶은 코인을 등록/해제
- `registeredCoinSlice` (localStorage persist, 기본값: BTC/ETH/XRP/SOL/DOGE)
- DataManager는 등록 코인만 REST 폴링 (기존 전체 수백 개 → 등록된 코인만)
- App.tsx에서 store subscribe로 등록 코인 변경 시 DataManager 자동 동기화

### Bandwidth Optimization Pattern
- WebSocket connections opened only for favorite coins (`wss://fstream.binance.com`)
- REST polling handles registered coins only (1-second interval)
- REST updates skipped for coins with active WebSocket feeds
- Binance Futures ticker: 전체 fetch + client-side filter (Futures API 제약)

### Component Composition
- Small, reusable components (PriceDisplay, ExchangePriceDisplay)
- Larger block components compose smaller ones
- Blocks handle layout; components handle specific features

## Component Relationships

### Core Components
- **App.tsx:** Root component, initializes DataManager, manages tab navigation
- **Portfolio.tsx:** User's holdings — Upbit KRW, Binance Spot, Binance Futures with P&L
- **Trading.tsx:** Order placement interface (currently a stub)
- **CoinInfo.tsx:** Bid/ask ratio visualization

### Block Components
- **MarketBlock.tsx:** 검색바 + 등록 코인 리스트 (내 코인 / 관심 / 보유 탭)
- **CoinDetailBlock.tsx:** Selected coin details — price, chart, trading panel
- **Block.tsx:** Block type dispatcher

### Common Components
- **PriceDisplay.tsx:** Formatted price with decimal color coding
- **Scrollbar.tsx:** Custom scrollbar styling
- **ExchangePriceDisplay.tsx:** Exchange logo + animated price + change %
- Chart component planned for reimplementation

## Critical Implementation Paths

### Real-time Price Updates
1. DataManager initializes and fetches all markets from both exchanges (Upbit KRW + Binance Futures PERPETUAL)
2. Symbol mapping built (Upbit + Binance → unified symbol)
3. 등록 코인만 REST 폴링 (1초 간격)
4. 관심(favorite) 코인은 WebSocket 실시간 업데이트 (REST 스킵)
5. Data normalized to UnifiedCoinData format
6. Redux store updated via `setUnifiedCoins` dispatch
7. Components re-render with new prices + animations

### Portfolio Calculation
1. Fetch Upbit account balances via IPC (`upbit-get-accounts`)
2. Fetch Binance Spot balances via IPC (`binance-get-accounts`)
3. Fetch Binance Futures balances + positions via IPC
4. Get current prices from unified coin data
5. Calculate total value and P&L per asset
6. Display in Portfolio component with exchange separation

### Trading Flow (Planned)
1. User inputs order details in Trading component
2. Validation of inputs (amount, price, balance)
3. API call to exchange via IPC (AccountApi service)
4. Response handling (success/error)
5. Portfolio update on successful trade
6. User feedback via UI notifications

### Data Synchronization
1. DataManager coordinates multiple data sources
2. Periodic REST refresh for registered coins only
3. Continuous WebSocket updates for favorites (`wss://fstream.binance.com`)
4. State reconciliation on reconnection (5-second retry)
5. Error recovery with automatic retry
6. 등록 코인 변경 시 즉시 데이터 갱신 (`refreshRegisteredCoinData()`)
