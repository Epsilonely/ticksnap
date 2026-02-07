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
│  │  - coinSlice (+ usdtKrwRate) │  │
│  │  - registeredCoinSlice       │  │
│  └──────────────────────────────┘  │
│                 │                   │
│  ┌──────────────┴──────────────┐  │
│  │                              │  │
│  ▼                              ▼  │
│ Components                  Blocks │
│ - BinanceFuturesChart    - Market  │
│ - Portfolio              - Detail  │
│ - ExchangePriceDisplay   - Board   │
│                                     │
└─────────────────────────────────────┘
        │                    │
        ▼                    ▼
┌──────────────┐  ┌──────────────────┐
│ DataManager  │  │ Kline WebSocket  │
│ (ticker)     │  │ (chart-owned)    │
│ - REST poll  │  │ - per coin+intv  │
│ - WS ticker  │  │ - fstream.bin... │
└──────────────┘  └──────────────────┘
        │                    │
        ▼                    ▼
┌─────────────────────────────────────┐
│      External APIs                  │
│  - Binance Futures REST/WebSocket  │
│  - Upbit REST/WebSocket            │
└─────────────────────────────────────┘
```

### App Layout Structure

```
┌──────────────────────────────────────────────┐
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │             │  │ [Trader | Assets]     │  │
│  │  MarketBlock│  ├──────────────────────┤  │
│  │  (left      │  │ (hidden pattern:     │  │
│  │   sidebar)  │  │  both always mounted)│  │
│  │             │  │                      │  │
│  │  [Search]   │  │  Trader: chart+price │  │
│  │  My Coins/  │  │  Assets: portfolio   │  │
│  │  Holdings   │  │                      │  │
│  └─────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

Tab navigation: hidden CSS pattern (both tabs always mounted, inactive hidden via `display: none`).

## Design Patterns in Use

### Singleton Pattern (DataManager)
- Single instance coordinates all ticker data flow
- Owns polling intervals, ticker WebSocket connections, and Redux dispatch
- `DataManager.getInstance()` for access across the app
- `initialize()` called once from App.tsx on mount
- `destroy()` for cleanup
- Does NOT manage chart kline data (chart is self-contained)

### Self-Contained Chart Pattern (BinanceFuturesChart)
- Chart component manages its own data lifecycle independently from DataManager
- Own REST fetch for historical candles (`fetchBinanceKlines`)
- Own kline WebSocket connection (`wss://fstream.binance.com/ws/{symbol}@kline_{interval}`)
- Local state for candle data (not in Redux — view-specific, high-frequency)
- Two useEffects with distinct responsibilities:
  - Chart instance creation (deps: `[theme]`)
  - Data loading + WebSocket (deps: `[symbol, interval]`)
- Cleanup on unmount: WebSocket close, fetch cancellation

### Hidden Tab Pattern (App.tsx)
- Both tab contents (CoinDetailBlock, Portfolio) are always rendered
- Inactive tab uses `hidden` CSS class (`display: none`)
- Preserves component state, WebSocket connections, and chart data across tab switches
- Avoids costly re-mount and re-fetch on every tab change

### USDT Exchange Rate Pattern
- USDT/KRW rate stored as separate Redux field (`coinSlice.usdtKrwRate`), NOT in `unifiedCoins`
- DataManager always fetches KRW-USDT from Upbit alongside registered coins
- `extractUsdtRate()` extracts rate from ticker response and dispatches to Redux
- Consumers read from `state.coin.usdtKrwRate`
- **Key learning**: Adding USDT to `unifiedCoins` caused it to appear in MarketBlock coin list + flickering

### Service Layer Pattern
- Separate API logic from UI components
- Each exchange has dedicated service files (Api + AccountApi)
- DataManager orchestrates ticker data across services
- AccountApi services communicate via IPC (renderer → main → exchange)

### Data Normalization Pattern
- Binance **Futures** data converted to Upbit-compatible format
- `convertBinanceTickerToUpbitFormat()` in BinanceApi.ts
- Unified `UnifiedCoinData` structure merges both exchanges
- Symbol mapping: Upbit `KRW-BTC` + Binance Futures `BTCUSDT` → symbol `BTC`

### IPC Bridge Pattern (Electron Security)
- Context isolation enabled — renderer cannot access Node.js directly
- Preload script exposes typed API bridges
- Main process handles authentication (JWT signing, API key usage)
- Renderer never sees raw API keys

### Registered Coin Pattern
- Users register coins they want to track
- `registeredCoinSlice` (localStorage persist, default: BTC/ETH/XRP/SOL/DOGE)
- DataManager polls only registered coins (+ USDT for exchange rate)
- App.tsx store subscription syncs changes to DataManager

### Bandwidth Optimization Pattern
- Ticker WebSocket for registered coins (`@ticker` stream)
- Kline WebSocket for selected coin only (`@kline_{interval}` stream)
- REST polling for USDT exchange rate only (1-second interval)

### Chart High/Low Markers Pattern (BinanceFuturesChart)
- `createSeriesMarkers()` plugin for arrow markers (no text — avoids clipping at chart edges)
- `createPriceLine()` for price display on y-axis (dashed line, always visible)
- Updated on `subscribeVisibleLogicalRangeChange` — dynamic on zoom/scroll
- Old price lines removed and recreated on each update
- Shares handler with infinite scroll (past data loading)

## Component Relationships

### Core Components
- **App.tsx:** Root, initializes DataManager, manages tabs (hidden pattern)
- **Portfolio.tsx:** Holdings — Upbit KRW, Binance Spot, Binance Futures with P&L
- **BinanceFuturesChart.tsx:** Lightweight Charts candle chart with kline WebSocket

### Block Components
- **MarketBlock.tsx:** Search + registered coin list (My Coins / Holdings tabs)
- **CoinDetailBlock.tsx:** Dual-exchange prices + kimchi premium + real-time chart
- **Block.tsx:** Block type dispatcher

### Common Components
- **PriceDisplay.tsx:** Formatted price with decimal color coding
- **Scrollbar.tsx:** Custom scrollbar styling
- **ExchangePriceDisplay.tsx:** Exchange logo + animated price + change %

## Critical Implementation Paths

### Real-time Price Updates
1. DataManager fetches all markets from both exchanges
2. Symbol mapping built (Upbit + Binance → unified symbol)
3. Registered coins use ticker WebSocket for real-time updates
4. USDT rate extracted separately → `setUsdtKrwRate` dispatch
6. Redux store updated via `setUnifiedCoins` dispatch
7. Components re-render with new prices + animations

### Real-time Chart (Kline)
1. User selects coin → CoinDetailBlock passes `{symbol}USDT` to BinanceFuturesChart
2. Chart fetches 500 historical candles via REST (`/fapi/v1/klines`)
3. Chart opens kline WebSocket (`{symbol}@kline_{interval}`)
4. Each WebSocket message → `series.update()` for real-time candle
5. On coin/interval change: cleanup old WS → new REST fetch → new WS
6. On unmount: WebSocket close, cancelled flag prevents stale data

### Kimchi Premium Calculation
1. DataManager fetches KRW-USDT ticker from Upbit → dispatches `setUsdtKrwRate`
2. CoinDetailBlock reads `usdtKrwRate` from Redux
3. Formula: `(upbitKRW / (binanceUSDT * usdtKrwRate) - 1) * 100`
4. Only shown when both exchanges have data and rate > 0
