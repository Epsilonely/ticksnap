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
- REST polling every 1 second (등록된 코인 + USDT 환율)
- Ticker WebSocket connections for favorite coins only (`wss://fstream.binance.com`)
- Kline WebSocket for selected coin chart (`wss://fstream.binance.com/ws/{symbol}@kline_{interval}`)
- Automatic WebSocket reconnection (5-second retry)
- 등록 코인 시스템: 사용자가 등록한 코인만 폴링

### Chart

- **Lightweight Charts** real-time candlestick chart (Binance Futures only)
- REST initial candle load (`/fapi/v1/klines`, 500 candles)
- Kline WebSocket real-time updates
- Interval selector: 1m / 5m / 15m / 1h / 4h / 1D
- Candlestick + volume histogram overlay
- Auto-resize via ResizeObserver
- Self-contained component (own REST + WebSocket, independent from DataManager)

### UI Components

- Portfolio component — Upbit KRW, Binance Spot USDT, Binance Futures positions with P&L
- ExchangePriceDisplay component — exchange logo + animated price + change %
- PriceDisplay common component — formatted price with decimal color coding
- Custom Scrollbar component
- BinanceFuturesChart — lightweight-charts real-time candle chart

### Block Components

- MarketBlock — 검색바 + 등록 코인 리스트 (내 코인 / 관심 / 보유 탭)
- CoinDetailBlock — 코인 이름/심볼 + 양쪽 거래소 가격 + 김치프리미엄 + 실시간 차트
- Base Block component (type dispatcher)

### App Layout

- Tab-based navigation: Trader / Assets (hidden pattern — both always mounted)
- Left sidebar: MarketBlock (always visible)
- Tab state preserved on switch (no re-mount, no WebSocket reconnect)

### State Management

- coinSlice: unified coin data, selected coin, usdtKrwRate, loading/error states
- favoriteSlice: watchlist persisted to localStorage
- registeredCoinSlice: 등록 코인 목록 persisted to localStorage (기본값: BTC/ETH/XRP/SOL/DOGE)
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

- **Lightweight Charts 실시간 차트** ✅ — BinanceFuturesChart (kline REST + WebSocket)
- **양쪽 거래소 가격 동시 표시** ✅ — ExchangePriceDisplay 재활용
- **김치프리미엄 계산 및 표시** ✅ — USDT/KRW 환율 기반
- **USDT/KRW 환율 시스템** ✅ — coinSlice.usdtKrwRate (unifiedCoins와 분리)
- **탭 전환 상태 유지** ✅ — hidden CSS 패턴
- **TradingViewChart 삭제** ✅ — Lightweight Charts로 완전 교체

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
- [x] Binance Spot → Futures 가격 전환
- [x] 등록 코인 시스템 (검색 + 등록/해제)
- [x] **Lightweight Charts 실시간 차트** (kline REST + WebSocket, 인터벌 선택)
- [x] **양쪽 거래소 가격 + 김치프리미엄**
- [x] **USDT/KRW 환율 시스템** (별도 Redux 필드)
- [x] **탭 전환 상태 유지** (hidden 패턴)

### Upcoming

- [ ] CoinInfo 간소화 (실제 데이터만)
- [ ] Trading order execution
- [ ] Settings panel and API key management
- [ ] Comprehensive error handling
- [ ] Complete feature testing
- [ ] Production deployment
