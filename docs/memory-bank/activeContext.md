# Active Context - TickSnap

## Current Work Focus

Lightweight Charts real-time chart integration completed. CoinDetailBlock displays prices from both exchanges + kimchi premium.

**Key Decision**: Chart displays Binance Futures data only. Upbit chart not implemented.

## Recent Changes

### 2026.02.07 (PM) — Registered Coins WebSocket Migration + 10 Coin Limit ✅

#### Completed Work

- **Registered Coins WebSocket Migration** — Resolved REST API 429 error
  - DataManager: Both registered + favorite coins now use WebSocket for real-time updates
  - `connectWebSockets()`: Merges registered and favorite coins for WebSocket connection (deduplication)
  - Upbit: 15 coin limit (warning log if exceeded, only 15 connected)
  - Binance: No practical limit (stable up to 300)
  - REST API now only for initial load + USDT exchange rate (1-second polling maintained)
  - **Result**: Binance Futures API 429 error completely resolved ✅
- **10 Coin Registration Limit** — MarketBlock.tsx
  - `handleRegister()`: Alert and block registration when exceeding 10 coins
  - Safe operation within Upbit WebSocket 15-coin limit (10 registered + 5 favorites buffer)

#### Technical Decisions

- **Hybrid Approach Maintained**: WebSocket (real-time) + REST (initial load + exchange rate)
- **Registration Limit**: 10 coins to safely operate within Upbit's 15-coin limit
- **WebSocket Priority**: Registered/favorite coins use WebSocket for real-time updates, REST as backup

### 2026.02.07 (AM) — Lightweight Charts Integration + Kimchi Premium + Tab State Preservation ✅

#### Completed Work

- **Lightweight Charts Real-time Chart Implementation** — Replaced TradingView embedded widget
  - Installed `lightweight-charts` npm package
  - Created `BinanceFuturesChart.tsx` component (Binance Futures only)
  - REST: Load 500 initial candles via `/fapi/v1/klines`
  - WebSocket: Real-time updates via `wss://fstream.binance.com/ws/{symbol}@kline_{interval}`
  - Interval selector UI: 1m / 5m / 15m / 1h / 4h / 1D
  - Candlestick + volume histogram (bottom 20%)
  - Auto-resize on container size change via ResizeObserver
  - 5-second auto-reconnect, cancelled flag to prevent race conditions
  - Chart colors: `--color-rise` (#639d01) / `--color-fall` (#ea0070)
  - Deleted `TradingViewChart.tsx`
- **Added kline REST function to BinanceApi.ts**
  - `BinanceKline` interface, `KlineInterval` type
  - `fetchBinanceKlines(symbol, interval, limit)` function (uses existing `/fapi` proxy)
- **CoinDetailBlock Dual Exchange Prices + Kimchi Premium Display**
  - Display Upbit + Binance prices simultaneously (reused ExchangePriceDisplay)
  - Kimchi premium: `(UpbitKRW / (BinanceUSDT * USDTRate) - 1) * 100`
  - Positive: green background, Negative: red background
  - No kimchi premium display for coins listed on only one exchange
- **USDT/KRW Exchange Rate System**
  - Added `usdtKrwRate` field to `coinSlice` (separated from `unifiedCoins`)
  - DataManager: `extractUsdtRate()` — Extracts Upbit KRW-USDT price every second
  - `getRegisteredExchangeSymbols()` always fetches KRW-USDT
  - Both CoinDetailBlock and Portfolio query rate from `state.coin.usdtKrwRate`
  - **Lesson**: Putting USDT in `unifiedCoins` causes it to appear in MarketBlock coin list → manage rate as separate field
- **Tab State Preservation (hidden pattern)**
  - App.tsx: Changed from `switch` conditional rendering → `hidden` CSS pattern
  - Both tabs (CoinDetailBlock, Portfolio) always mounted, inactive tab is `hidden`
  - Chart WebSocket/candle data and portfolio state preserved on tab switch

### 2026.02.01 (4th) — TradingView Chart Integration Complete ✅

- Complete App.tsx layout reconstruction (Flexbox responsive)
- Complete CoinDetailBlock rewrite (3-tier structure)
- TradingViewChart component (direct script injection) — Later replaced with Lightweight Charts

### 2026.02.01 (earlier)

- Binance Spot → Futures migration
- Registered coin system
- Removed Leaderboard/MiniChart
- Established Memory Bank system

## Current App Layout

Tab-based navigation structure (hidden pattern — both tabs always mounted):

- **Trader tab**: Coin name/symbol + Upbit/Binance dual prices + kimchi premium + Lightweight Charts real-time chart
- **Assets tab**: Portfolio — Upbit KRW, Binance Spot USDT, Binance Futures positions

Left sidebar: MarketBlock

- Search bar (top) — Search and register/unregister coins from all markets
- Tabs: My Coins (registered) / Favorites (watchlist) / Holdings (not implemented)

## Next Steps

1. Simplify CoinInfo (remove fake buy/sell data, show only actual volume)
2. Improve Trading stub
3. Implement actual order functionality
4. Strengthen error handling and user feedback
5. Settings panel and API key management

## Active Decisions and Considerations

### Architecture

- Redux Toolkit for state management
- Service layer pattern separating API calls from UI
- IPC for authenticated API calls (prevents API key exposure in renderer)
- Binance data normalized to Upbit format for unified processing
- Chart component self-contained (own REST fetch + kline WebSocket, not using DataManager)

### API Integration

- **Binance Futures API** (`fapi.binance.com`) — Migrated from Spot to Futures
- **Ticker WebSocket** (DataManager): Both registered + favorite coins via `wss://fstream.binance.com` `@ticker` stream
- **Kline WebSocket** (BinanceFuturesChart): Single selected coin `@kline_{interval}` stream
- REST: 1-second polling (initial load + USDT rate only, WebSocket handles real-time updates)
- Automatic reconnection (5-second retry)
- **WebSocket Limits**: Upbit 15 coins, Binance 300 coins (safe operation with 10-coin registration limit)

### UI/UX

- Tailwind CSS v4 styling
- Price change animations (rise=#639d01, fall=#ea0070)
- Custom scrollbar components
- Lightweight Charts real-time candlestick chart (interval selection support)
- Tab state preservation (hidden CSS pattern)

## Important Patterns and Preferences

### Code Organization

- `src/services/` — API logic and data orchestration
- `src/components/` — Reusable UI components
- `src/block/` — Layout-level block components
- `src/common/` — Shared UI utilities
- `src/utils/` — Symbol matching/unification logic

### State Management

- coinSlice: coin market data (unifiedCoins, selectedCoin, usdtKrwRate, loading, error)
- favoriteSlice: favorites (persisted to localStorage)
- registeredCoinSlice: registered coin list (persisted to localStorage, defaults: BTC/ETH/XRP/SOL/DOGE)

## Learnings and Project Insights

### Technical Insights

- DataManager singleton is the core of ticker data flow — ~670 lines
- Chart kline WebSocket is managed separately from DataManager (different concern)
- lightweight-charts v4+ uses `addSeries(CandlestickSeries)` not `addCandlestickSeries()`
- USDT must be fetched separately as exchange rate, NOT put in unifiedCoins (causes flickering in MarketBlock)
- Tab content should use hidden CSS pattern instead of conditional rendering to preserve component state
- Binance Futures kline WebSocket: `wss://fstream.binance.com/ws/{symbol}@kline_{interval}`

### Challenges to Watch

- API rate limits (exchange-specific restrictions)
- WebSocket long-session connection stability
- API keys hardcoded in config.js — should migrate to environment variables
- Cross-platform compatibility (only Windows tested so far)
