# Active Context - TickSnap

## Current Work Focus

Trading UI layout preparation and WebSocket optimization. CoinDetailBlock now split into chart + order/position panels.

**Key Decision**: Chart displays Binance Futures data only. Upbit chart not implemented.

## Recent Changes

### 2026.02.08 — Trading Layout + WebSocket Fix + Position Side BOTH Support ✅

#### Completed Work

- **CoinDetailBlock 3-Section Layout** — Split into chart + order + position sections
  - Left: Chart area (`flex-1`)
  - Right top: Order panel (400px width, `flex-1` height) - placeholder
  - Right bottom: Current position panel (400px width, 200px fixed height) - placeholder
  - Order and position UI not yet implemented (layout structure only)
- **Position Side "BOTH" Support** — BinanceFuturesChart
  - Handle `positionSide` = "BOTH" in One-Way Mode
  - Determine actual direction from `positionAmt` sign: `> 0` → LONG, `< 0` → SHORT
  - Chart entry price line color now displays correctly based on actual position direction
- **429 Error Complete Fix** — DataManager WebSocket activation
  - Added `connectWebSockets()` call in `initialize()` (was missing)
  - Modified `updateTickerData()`: Fetch only USDT exchange rate via REST API (1-second interval)
  - Registered coins now use WebSocket for real-time updates (no REST API calls)
  - Added WebSocket reconnection in `refreshRegisteredCoinData()` (on coin register/unregister)
  - **Result**: Binance Futures API 429 error completely resolved ✅

#### Technical Decisions

- **CoinDetailBlock Layout**: Flexbox 3-section (chart + order + position)
- **Position Side Logic**: "BOTH" → check positionAmt sign (One-Way Mode support)
- **WebSocket Priority**: REST API for USDT rate only, registered coins use WebSocket exclusively

### 2026.02.07 (Evening) — Chart UX Improvements + Favorites Removal + Position Display ✅

#### Completed Work

- **Chart Initial Zoom Level** — `fitContent()` → `setVisibleLogicalRange()` (recent 50 candles)
  - Fixed zoom-out issue showing all 500 candles
  - Added `rightOffset: 7` for breathing room on right edge
- **Chart High/Low Price Markers** — Dynamic display of highest/lowest prices in visible range
  - Arrow markers via `createSeriesMarkers()` plugin (no text)
  - Price display on y-axis via `createPriceLine()` (dashed line, always visible)
  - Dynamic updates on `subscribeVisibleLogicalRangeChange` (zoom/scroll)
  - Coexists with infinite scroll past data loading (same handler)
- **Favorites Feature Complete Removal** — Completely deleted favorites feature
  - Deleted: `src/store/slices/favoriteSlice.ts`
  - `store/index.ts`: removed favoriteReducer
  - `App.tsx`: removed localStorage favorites restoration logic
  - `MarketBlock.tsx`: removed "Favorites" tab, favorites selector, DataManager sync useEffect, isFavorite styling
  - `CoinDetailBlock.tsx`: removed "Add/Remove Favorite" button, toggleFavorite handler, dispatch
  - `DataManager.ts`: removed `favoriteCoins` property, `updateFavoriteCoins()`, favorites WebSocket/REST logic
- **Futures Position Display on Chart** — Show current position entry price on chart
  - `coinSlice`: added `futuresPositions` state (BinanceFuturesPosition[])
  - `CoinDetailBlock`: fetch positions via REST API every 30s, match with selected coin
  - `BinanceFuturesChart`: added `position` prop, display entry price line
  - LONG: Blue (#2196F3), SHORT: Orange (#FF9800), solid line
  - Y-axis label: "Entry: $XX,XXX.XX" format showing entry price

#### Technical Decisions

- **lightweight-charts v4+ markers**: `series.setMarkers()` removed → use `createSeriesMarkers()` plugin
- **Price line for labels**: Marker text clips at chart edges → use price line's y-axis label instead
- **Favorites removal**: Registered coin system replaces favorites, WebSocket connections only for registered coins
- **Position price line**: Solid line (high/low use dashed) for distinction, auto-removed when no position

### 2026.02.07 (PM) — Registered Coins WebSocket Migration + 10 Coin Limit ✅

#### Completed Work

- **Registered Coins WebSocket Migration** — Resolved REST API 429 error
  - DataManager: Registered coins use WebSocket for real-time updates
  - Upbit: 15 coin limit (warning log if exceeded, only 15 connected)
  - Binance: No practical limit (stable up to 300)
  - REST API now only for initial load + USDT exchange rate (1-second polling maintained)
  - **Result**: Binance Futures API 429 error completely resolved ✅
- **10 Coin Registration Limit** — MarketBlock.tsx
  - `handleRegister()`: Alert and block registration when exceeding 10 coins
  - Safe operation within Upbit WebSocket 15-coin limit

#### Technical Decisions

- **Hybrid Approach Maintained**: WebSocket (real-time) + REST (initial load + exchange rate)
- **Registration Limit**: 10 coins to safely operate within Upbit's 15-coin limit

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
- Tabs: My Coins (registered) / Holdings (not implemented)

## Next Steps

1. **Implement Order Panel** — Order UI (Market/Limit, Long/Short, quantity/price input)
2. **Implement Position Panel** — Display current position details (entry price, quantity, P&L, liquidation price, etc.)
3. Implement actual order execution (Binance Futures API)
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
- **Ticker WebSocket** (DataManager): Registered coins via `wss://fstream.binance.com` `@ticker` stream
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

- coinSlice: coin market data (unifiedCoins, selectedCoin, usdtKrwRate, futuresPositions, loading, error)
- registeredCoinSlice: registered coin list (persisted to localStorage, defaults: BTC/ETH/XRP/SOL/DOGE)

## Learnings and Project Insights

### Technical Insights

- DataManager singleton is the core of ticker data flow — ~670 lines
- Chart kline WebSocket is managed separately from DataManager (different concern)
- lightweight-charts v4+ uses `addSeries(CandlestickSeries)` not `addCandlestickSeries()`
- lightweight-charts v4+: `series.setMarkers()` removed → use `createSeriesMarkers()` plugin
- lightweight-charts markers text clips at chart edges → use price line y-axis label instead
- USDT must be fetched separately as exchange rate, NOT put in unifiedCoins (causes flickering in MarketBlock)
- Tab content should use hidden CSS pattern instead of conditional rendering to preserve component state
- Binance Futures kline WebSocket: `wss://fstream.binance.com/ws/{symbol}@kline_{interval}`
- **Binance Futures Position Mode**: "BOTH" (One-Way) vs "LONG"/"SHORT" (Hedge) — must determine direction from positionAmt sign
- **WebSocket must be initialized**: Missing `connectWebSockets()` call causes only REST API usage leading to 429 error

### Challenges to Watch

- API rate limits (exchange-specific restrictions)
- WebSocket long-session connection stability
- API keys hardcoded in config.js — should migrate to environment variables
- Cross-platform compatibility (only Windows tested so far)
