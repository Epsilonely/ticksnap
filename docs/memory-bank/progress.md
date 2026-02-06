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

- Binance Futures API service (BinanceApi.ts) — markets, tickers, candles via `fapi.binance.com`
- Binance Account API (BinanceAccountApi.ts) — Spot balances, Futures balances, Futures positions
- Upbit API service (UpbitApi.ts) — markets, tickers, candles
- Upbit Account API (UpbitAccountApi.ts) — account balances via IPC
- DataManager singleton for centralized data orchestration
- Binance Futures data normalization to Upbit format for unified processing
- REST polling every 1 second (등록된 코인만 — 최적화됨)
- WebSocket connections for favorite coins only (`wss://fstream.binance.com`)
- Automatic WebSocket reconnection (5-second retry)
- 등록 코인 시스템: 사용자가 등록한 코인만 폴링 (기존 전체 수백 개 → 10~30개)

### UI Components

- Portfolio component — Upbit KRW, Binance Spot USDT, Binance Futures positions with P&L
- Trading component (stub — UI present, no actual order execution)
- CoinInfo component — bid/ask ratio visualization
- ExchangePriceDisplay component — exchange logo + animated price + change %
- PriceDisplay common component — formatted price with decimal color coding
- Custom Scrollbar component

### Block Components

- MarketBlock — 검색바 + 등록 코인 리스트 (내 코인 / 관심 / 보유 탭)
- CoinDetailBlock — selected coin details, price, trading panel
- Base Block component (type dispatcher)

### App Layout

- Tab-based navigation: Trader / Assets
- Left sidebar: MarketBlock (always visible)
- Main content switches by active tab

### State Management

- coinSlice: unified coin data, selected coin, loading/error states
- favoriteSlice: watchlist persisted to localStorage
- registeredCoinSlice: 등록 코인 목록 persisted to localStorage (기본값: BTC/ETH/XRP/SOL/DOGE)
- Store typed with TypeScript (RootState, AppDispatch)

### Electron Integration

- Context isolation enabled
- IPC handlers for Upbit REST, Binance REST, private WebSocket
- Preload script exposing safe API bridges
- JWT signing for Upbit authenticated endpoints in main process

### Assets

- Custom fonts (Pretendard, Spoqa Han Sans Neo, Righteous)
- Exchange logos (Binance, Upbit) in SVG format

## What's Left to Build

### Features

- Actual trading order execution (Trading component is a stub)
- Settings/configuration panel
- API key management UI (currently hardcoded in config.js)
- Notification system for price alerts
- Error handling and user feedback improvements

### Technical Improvements

- Comprehensive error boundaries
- Loading state indicators for async operations
- Retry logic for failed API calls
- WebSocket reconnection reliability (long-session testing)
- Rate limit management
- Performance optimization for large datasets
- Migrate API keys from config.js to environment variables

### Testing

- Unit tests for components
- Integration tests for API services
- E2E tests for critical flows
- Performance testing
- No test runner configured yet (test libraries installed but no test script in package.json)

### Documentation

- API documentation
- Component usage examples
- Setup instructions in README
- Deployment guide

### Build & Distribution

- Production build optimization
- Code signing for Electron app
- Auto-update mechanism
- Installer creation
- Cross-platform builds (macOS, Linux — only Windows tested)

## Current Status

**Phase:** Active Development — Stabilization
**Version:** 0.1.0
**Last Updated:** 2026.02.01

### Summary

Core features are implemented and functional. The app successfully aggregates real-time market data from Upbit and Binance and displays portfolio with P&L. The main gap is the Trading component (stub only) and production-readiness improvements.

### Recently Completed

- **TradingView 차트 통합 완료** ✅
  - App.tsx 레이아웃 완전 재구성 (Flexbox 반응형)
  - CoinDetailBlock 완전 재작성 (3단 구조)
  - TradingViewChart 컴포넌트 수정 (올바른 HTML 구조)
  - 차트 표시 성공, 윈도우 크기 변경 시 자동 확장/축소
- **TradingViewChart 컴포넌트 생성** — `src/components/TradingViewChart.tsx` (스크립트 직접 주입 방식)
- **App.tsx 레이아웃 단순화** — ALARM_HISTORY, DEFAULT 블록 제거
- **가격 색상 토큰 통일** — `text-red-500`/`text-blue-500` → `text-price-rise`/`text-price-fall`
- **Binance Spot → Futures 가격 전환** — BinanceApi.ts 엔드포인트를 fapi.binance.com으로 교체
- **등록 코인 시스템** — registeredCoinSlice, DataManager 등록 코인 기반 폴링, MarketBlock 검색 UI
- Leaderboard 및 MiniChart 제거
- Memory Bank system setup for Cline + Claude Code

### Known Limitations

- **TradingView 가격 업데이트 지연** — 무료 위젯은 지연된 데이터 제공 (수 초~수십 초)
  - 해결 계획: Lightweight Charts로 교체하여 바이낸스 Futures WebSocket 데이터 직접 사용
  - **차트는 바이낸스 Futures 전용** (업비트 차트는 구현하지 않음)

## Known Issues

### To Investigate

- WebSocket connection stability over long periods
- API rate limit handling effectiveness
- Memory usage during extended sessions
- Cross-platform compatibility (not tested on macOS/Linux)

### Technical Debt

- **App.tsx 오른쪽 컬럼 레이아웃**: `flex-col` without `flex` → flex 아님, 높이 체인 끊김
- API keys hardcoded in config.js (security concern)
- Trading component is a non-functional stub (현재 임시 제거됨)
- CoinInfo component 가짜 데이터 (acc_bid_volume, acc_ask_volume 항상 0) — 현재 임시 제거됨
- Missing comprehensive error handling
- Missing loading states in some components
- Limited test coverage (no test runner configured)

## Evolution of Project Decisions

### Initial Decisions

- Electron for desktop capabilities
- React 19 for modern features
- Redux Toolkit for state management
- Vite for fast development experience

### Refinements

- TypeScript for type safety
- Service layer pattern for API calls
- Component separation into blocks / components / common
- Binance data normalization to Upbit format for unified UnifiedCoinData
- WebSocket limited to favorites for bandwidth optimization
- Binance Spot → Futures API 전환
- 등록 코인 기반 데이터 폴링 최적화
- Tab-based navigation (Trader / Assets)

### Removed Features

- Binance QR login (PR #21 — added then deleted)
- Leaderboard tab and Binance leaderboard API (removed for simplification)
- MiniChart component (removed, planned for reimplementation)

### Future Considerations

- Bundle size optimization
- Adding more exchanges
- Backend service evaluation
- Mobile companion app

## Milestones

### Completed

- [x] Project initialization and setup
- [x] Core component structure
- [x] API service layer implementation
- [x] Basic UI layout and styling
- [x] State management setup
- [x] Binance Futures integration (positions, balances)
- [x] ~~Leaderboard feature~~ (removed)
- [x] Portfolio with multi-exchange support
- [x] Memory Bank documentation system
- [x] Binance Spot → Futures 가격 전환
- [x] 등록 코인 시스템 (검색 + 등록/해제)
- [x] TradingViewChart 컴포넌트 생성

### In Progress

- [ ] **Lightweight Charts 통합** — 바이낸스 Futures 전용 실시간 차트 구현
  - npm 패키지 설치
  - LightweightChart 컴포넌트 생성 (바이낸스 Futures 전용)
  - 바이낸스 Futures WebSocket 데이터 연결
  - 초기 캔들 데이터 로드 (바이낸스 Futures REST API)
  - 실시간 가격 업데이트 (바이낸스 WebSocket)
  - **업비트 차트는 구현하지 않음**

### Upcoming

- [ ] 양쪽 거래소 가격 동시 표시 (ExchangePriceDisplay)
- [ ] CoinInfo 간소화 (가짜 데이터 제거)
- [ ] Trading order execution
- [ ] Settings panel and API key management
- [ ] Comprehensive error handling
- [ ] Complete feature testing
- [ ] Production deployment

## Metrics

### Code Stats

- Components: ~15 (5 blocks, 4 components, 2 common)
- Services: 5 (DataManager, UpbitApi, BinanceApi, UpbitAccountApi, BinanceAccountApi)
- Redux Slices: 3 (coinSlice, favoriteSlice, registeredCoinSlice)
- Total Source Files: ~40+
- DataManager: ~571 lines

### Development

- Primary Language: TypeScript
- Test Coverage: None (tests to be written)
