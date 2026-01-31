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
│  │  Coin list  │  │  - Portfolio         │  │
│  │  + filters  │  │                      │  │
│  │             │  │                      │  │
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
- Binance data converted to Upbit-compatible format
- `convertBinanceTickerToUpbitFormat()` and `convertBinanceCandleToUpbitFormat()` in BinanceApi.ts
- Unified `UnifiedCoinData` structure merges both exchanges
- Symbol mapping: Upbit `KRW-BTC` + Binance `BTCUSDT` → symbol `BTC`

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

### Bandwidth Optimization Pattern
- WebSocket connections opened only for favorite coins
- REST polling handles all other coins (1-second interval)
- REST updates skipped for coins with active WebSocket feeds
- Top 100 Binance coins fetched per polling cycle

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
- **MarketBlock.tsx:** Coin list with filtering (All / Favorites / Holdings)
- **CoinDetailBlock.tsx:** Selected coin details — price, chart, trading panel
- **Block.tsx:** Block type dispatcher

### Common Components
- **PriceDisplay.tsx:** Formatted price with decimal color coding
- **Scrollbar.tsx:** Custom scrollbar styling
- **ExchangePriceDisplay.tsx:** Exchange logo + animated price + change %
- Chart component planned for reimplementation

## Critical Implementation Paths

### Real-time Price Updates
1. DataManager initializes and fetches all markets from both exchanges
2. Symbol mapping built (Upbit + Binance → unified symbol)
3. REST polling every 1 second for all coins
4. WebSocket connections for favorite coins (higher frequency)
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
2. Periodic REST refresh for all coins
3. Continuous WebSocket updates for favorites
4. State reconciliation on reconnection (5-second retry)
5. Error recovery with automatic retry
