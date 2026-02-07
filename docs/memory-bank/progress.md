# Progress - TickSnap

## What Works

### Core Infrastructure

- Electron application setup with Vite
- React 19 with TypeScript configuration
- Redux Toolkit state management
- Tailwind CSS v4 styling system
- Development and build scripts
- Memory Bank system (shared between Cline and Claude Code)

### API Integration

- Binance Futures API service (BinanceApi.ts) — markets, tickers, klines via `fapi.binance.com`
- Binance Account API (BinanceAccountApi.ts) — Spot balances, Futures balances, Futures positions
- Upbit API service (UpbitApi.ts) — markets, tickers
- Upbit Account API (UpbitAccountApi.ts) — account balances via IPC
- DataManager singleton for centralized ticker data orchestration
- Binance Futures data normalization to Upbit format for unified processing
- REST polling every 1 second (initial load + USDT exchange rate only)
- Ticker WebSocket connections for registered coins (`wss://fstream.binance.com`)
- Kline WebSocket for selected coin chart (`wss://fstream.binance.com/ws/{symbol}@kline_{interval}`)
- Automatic WebSocket reconnection (5-second retry)
- Registered coin system: 10 coin limit, real-time updates via WebSocket
- WebSocket limits: Upbit 15 coins, Binance 300 coins

### Chart

- **Lightweight Charts** real-time candlestick chart (Binance Futures only)
- REST initial candle load (`/fapi/v1/klines`, 500 candles)
- Kline WebSocket real-time updates
- Interval selector: 1m / 5m / 15m / 1h / 4h / 1D
- Candlestick + volume histogram overlay
- Auto-resize via ResizeObserver
- Self-contained component (own REST + WebSocket, independent from DataManager)
- Initial zoom: `setVisibleLogicalRange()` — 최근 50개 캔들 표시 (500개 전체 줌아웃 방지)
- `rightOffset: 7` — 마지막 캔들 오른쪽 여유 공간
- High/Low markers: `createSeriesMarkers()` 화살표 + `createPriceLine()` y축 가격 (동적 업데이트)

### UI Components

- Portfolio component — Upbit KRW, Binance Spot USDT, Binance Futures positions with P&L
- ExchangePriceDisplay component — exchange logo + animated price + change %
- PriceDisplay common component — formatted price with decimal color coding
- Custom Scrollbar component
- BinanceFuturesChart — lightweight-charts real-time candle chart

### Block Components

- MarketBlock — search bar + registered coin list (My Coins / Holdings tabs)
- CoinDetailBlock — coin name/symbol + dual exchange prices + kimchi premium + real-time chart
- Base Block component (type dispatcher)

### App Layout

- Tab-based navigation: Trader / Assets (hidden pattern — both always mounted)
- Left sidebar: MarketBlock (always visible)
- Tab state preserved on switch (no re-mount, no WebSocket reconnect)

### State Management

- coinSlice: unified coin data, selected coin, usdtKrwRate, loading/error states
- registeredCoinSlice: registered coin list persisted to localStorage (defaults: BTC/ETH/XRP/SOL/DOGE)
- Store typed with TypeScript (RootState, AppDispatch)

### Electron Integration

- Context isolation enabled
- IPC handlers for Upbit REST, Binance REST, private WebSocket
- Preload script exposing safe API bridges
- JWT signing for Upbit authenticated endpoints in main process

## What's Left to Build

### Features

- Actual trading order execution (Trading component is a stub, currently removed)
- Settings/configuration panel
- API key management UI (currently hardcoded in config.js)
- Notification system for price alerts
- Error handling and user feedback improvements
- CoinInfo component reimplementation (fake data removed)

### Technical Improvements

- Comprehensive error boundaries
- Loading state indicators for async operations
- WebSocket reconnection reliability (long-session testing)
- Rate limit management
- Migrate API keys from config.js to environment variables

### Testing

- No test runner configured yet
- Unit tests, integration tests, E2E tests needed

### Build & Distribution

- Production build optimization
- Code signing, auto-update, installer
- Cross-platform builds (macOS, Linux — only Windows tested)

## Current Status

**Phase:** Active Development — Feature Building
**Version:** 0.1.0
**Last Updated:** 2026.02.07

### Summary

Core features are implemented and functional. Real-time chart with Lightweight Charts, dual-exchange price display with kimchi premium, and portfolio with P&L are working. Tab switching preserves component state. The main gap is the Trading component and production-readiness improvements.

### Recently Completed

- **Registered Coins WebSocket Migration** ✅ — Resolved Binance Futures API 429 error
- **10 Coin Registration Limit** ✅ — Addresses Upbit WebSocket 15-coin limit
- **Lightweight Charts Real-time Chart** ✅ — BinanceFuturesChart (kline REST + WebSocket)
- **Dual Exchange Price Display** ✅ — Reused ExchangePriceDisplay
- **Kimchi Premium Calculation & Display** ✅ — Based on USDT/KRW exchange rate
- **USDT/KRW Exchange Rate System** ✅ — coinSlice.usdtKrwRate (separated from unifiedCoins)
- **Tab State Preservation** ✅ — hidden CSS pattern
- **TradingViewChart Removal** ✅ — Complete replacement with Lightweight Charts
- **Chart Initial Zoom** ✅ — `setVisibleLogicalRange()` 최근 50개 캔들 표시
- **Chart High/Low Markers** ✅ — 화살표 마커 + price line y축 가격 (동적 업데이트)
- **Favorites Feature Removal** ✅ — favoriteSlice 삭제, 관련 UI/로직 전체 제거

### Known Limitations

- Trading component not functional (stub, currently removed)
- CoinInfo component removed (fake data issue)
- No test coverage

## Known Issues

### To Investigate

- WebSocket connection stability over long periods
- API rate limit handling effectiveness
- Memory usage during extended sessions
- Cross-platform compatibility (not tested on macOS/Linux)

### Technical Debt

- API keys hardcoded in config.js (security concern)
- Missing comprehensive error handling
- Missing loading states in some components
- Limited test coverage (no test runner configured)

## Milestones

### Completed

- [x] Project initialization and setup
- [x] Core component structure
- [x] API service layer implementation
- [x] Basic UI layout and styling
- [x] State management setup
- [x] Binance Futures integration (positions, balances)
- [x] Portfolio with multi-exchange support
- [x] Memory Bank documentation system
- [x] Binance Spot → Futures price migration
- [x] Registered coin system (search + register/unregister)
- [x] **Lightweight Charts real-time chart** (kline REST + WebSocket, interval selection)
- [x] **Dual exchange prices + kimchi premium**
- [x] **USDT/KRW exchange rate system** (separate Redux field)
- [x] **Tab state preservation** (hidden pattern)
- [x] **Registered coins WebSocket migration** (REST API 429 error resolution)
- [x] **10 coin registration limit** (Upbit WebSocket 15-coin limit compliance)
- [x] **Chart initial zoom** (`setVisibleLogicalRange`, 50 candles)
- [x] **Chart high/low markers** (arrows + price lines, dynamic on zoom/scroll)
- [x] **Favorites feature removal** (favoriteSlice deleted, all references removed)

### Upcoming

- [ ] Simplify CoinInfo (actual data only)
- [ ] Trading order execution
- [ ] Settings panel and API key management
- [ ] Comprehensive error handling
- [ ] Complete feature testing
- [ ] Production deployment
