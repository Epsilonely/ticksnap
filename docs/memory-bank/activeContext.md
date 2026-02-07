# Active Context - TickSnap

## Current Work Focus

Chart UX improvements and feature cleanup. Favorites feature removed entirely — only registered coins remain.

**Key Decision**: Chart displays Binance Futures data only. Upbit chart not implemented.

## Recent Changes

### 2026.02.07 (Evening) — Chart UX Improvements + Favorites Removal + Position Display ✅

#### Completed Work

- **Chart Initial Zoom Level** — `fitContent()` → `setVisibleLogicalRange()` (최근 50개 캔들)
  - 500개 캔들 전체를 보여주던 줌아웃 문제 해결
  - `rightOffset: 7` 추가로 마지막 캔들 오른쪽 여유 공간 확보
- **Chart High/Low Price Markers** — 보이는 범위의 최고/최저가 동적 표시
  - `createSeriesMarkers()` 플러그인으로 화살표 마커 (텍스트 없음)
  - `createPriceLine()` 으로 y축에 가격 표시 (점선, 항상 보임)
  - `subscribeVisibleLogicalRangeChange`로 줌/스크롤 시 동적 업데이트
  - 과거 데이터 무한 스크롤과 공존 (같은 핸들러에서 처리)
- **Favorites Feature Complete Removal** — 관심 코인 기능 전체 삭제
  - Deleted: `src/store/slices/favoriteSlice.ts`
  - `store/index.ts`: favoriteReducer 제거
  - `App.tsx`: localStorage favorites 복원 로직 제거
  - `MarketBlock.tsx`: "관심" 탭, favorites selector, DataManager 동기화 useEffect, isFavorite 스타일링 제거
  - `CoinDetailBlock.tsx`: "관심 등록/해제" 버튼, toggleFavorite 핸들러, dispatch 제거
  - `DataManager.ts`: `favoriteCoins` 프로퍼티, `updateFavoriteCoins()`, favorites WebSocket/REST 로직 제거
- **Futures Position Display on Chart** — 현재 포지션 진입가 차트 표시
  - `coinSlice`: `futuresPositions` state 추가 (BinanceFuturesPosition[])
  - `CoinDetailBlock`: 30초마다 포지션 REST API 호출, 선택된 코인과 매칭
  - `BinanceFuturesChart`: `position` prop 추가, 진입가 price line 표시
  - LONG: 파란색 (#2196F3), SHORT: 주황색 (#FF9800), 실선
  - y축 라벨: "Entry: $XX,XXX.XX" 형식으로 진입가 표시

#### Technical Decisions

- **lightweight-charts v4+ markers**: `series.setMarkers()` 제거됨 → `createSeriesMarkers()` 플러그인 방식 사용
- **Price line for labels**: 마커 텍스트가 차트 끝에서 잘리는 문제 → price line의 y축 라벨로 대체
- **Favorites 제거**: 등록 코인 시스템이 favorites를 대체, WebSocket 연결은 등록 코인만 사용
- **Position price line**: 실선 (high/low는 점선)으로 구분, 포지션 없으면 자동 제거

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
- lightweight-charts v4+: `series.setMarkers()` 제거됨 → `createSeriesMarkers()` 플러그인 방식 사용
- lightweight-charts markers 텍스트는 차트 끝에서 잘림 → price line y축 라벨로 대체
- USDT must be fetched separately as exchange rate, NOT put in unifiedCoins (causes flickering in MarketBlock)
- Tab content should use hidden CSS pattern instead of conditional rendering to preserve component state
- Binance Futures kline WebSocket: `wss://fstream.binance.com/ws/{symbol}@kline_{interval}`

### Challenges to Watch

- API rate limits (exchange-specific restrictions)
- WebSocket long-session connection stability
- API keys hardcoded in config.js — should migrate to environment variables
- Cross-platform compatibility (only Windows tested so far)
