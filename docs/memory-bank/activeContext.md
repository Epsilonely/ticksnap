# Active Context - TickSnap

## Current Work Focus

Lightweight Charts 실시간 차트 통합 완료. CoinDetailBlock에 양쪽 거래소 가격 + 김치프리미엄 표시 완료.

**중요 결정**: 차트는 바이낸스 Futures 데이터만 표시. 업비트 차트는 구현하지 않음.

## Recent Changes

### 2026.02.07 — Lightweight Charts 통합 + 김치프리미엄 + 탭 상태 유지 ✅

#### 완료된 작업

- **Lightweight Charts 실시간 차트 구현** — TradingView 임베디드 위젯 교체
  - `lightweight-charts` npm 패키지 설치
  - `BinanceFuturesChart.tsx` 컴포넌트 생성 (바이낸스 Futures 전용)
  - REST: `/fapi/v1/klines`로 500개 초기 캔들 로드
  - WebSocket: `wss://fstream.binance.com/ws/{symbol}@kline_{interval}` 실시간 업데이트
  - 인터벌 선택 UI: 1m / 5m / 15m / 1h / 4h / 1D
  - 캔들스틱 + 볼륨 히스토그램 (하단 20%)
  - ResizeObserver로 컨테이너 크기 변경 시 자동 리사이즈
  - 5초 자동 재연결, cancelled 플래그로 race condition 방지
  - 차트 색상: `--color-rise` (#639d01) / `--color-fall` (#ea0070)
  - `TradingViewChart.tsx` 삭제
- **BinanceApi.ts에 kline REST 함수 추가**
  - `BinanceKline` 인터페이스, `KlineInterval` 타입
  - `fetchBinanceKlines(symbol, interval, limit)` 함수 (기존 `/fapi` 프록시 활용)
- **CoinDetailBlock 양쪽 거래소 가격 + 김치프리미엄 표시**
  - 업비트 + 바이낸스 가격 동시 표시 (ExchangePriceDisplay 재활용)
  - 김치프리미엄: `(업비트KRW가 / (바이낸스USDT가 * USDT환율) - 1) * 100`
  - 양수: 초록 배경, 음수: 빨간 배경
  - 한쪽 거래소만 상장된 코인은 김프 미표시
- **USDT/KRW 환율 시스템**
  - `coinSlice`에 `usdtKrwRate` 필드 추가 (기존 `unifiedCoins`와 분리)
  - DataManager: `extractUsdtRate()` — 업비트 KRW-USDT 가격을 매초 별도 추출
  - `getRegisteredExchangeSymbols()`에서 KRW-USDT 항상 fetch
  - CoinDetailBlock, Portfolio 모두 `state.coin.usdtKrwRate`에서 환율 조회
  - **교훈**: USDT를 `unifiedCoins`에 넣으면 MarketBlock 코인 리스트에 나타남 → 환율은 별도 필드로 관리
- **탭 전환 시 상태 유지 (hidden 패턴)**
  - App.tsx: `switch` 조건부 렌더링 → `hidden` CSS 패턴으로 변경
  - 두 탭(CoinDetailBlock, Portfolio) 항상 마운트, 비활성 탭은 `hidden`
  - 차트 WebSocket/캔들 데이터, 포트폴리오 상태 탭 전환 시 유지

### 2026.02.01 (4차) — TradingView 차트 통합 완료 ✅

- App.tsx 레이아웃 완전 재구성 (Flexbox 반응형)
- CoinDetailBlock 완전 재작성 (3단 구조)
- TradingViewChart 컴포넌트 (스크립트 직접 주입 방식) — 이후 Lightweight Charts로 교체됨

### 2026.02.01 (earlier)

- Binance Spot → Futures 전환
- 등록 코인 시스템
- Leaderboard/MiniChart 제거
- Memory Bank 시스템 구축

## Current App Layout

Tab-based navigation structure (hidden pattern — both tabs always mounted):

- **Trader tab**: 코인 이름/심볼 + 업비트/바이낸스 양쪽 가격 + 김치프리미엄 + Lightweight Charts 실시간 차트
- **Assets tab**: Portfolio — Upbit KRW, Binance Spot USDT, Binance Futures positions

Left sidebar: MarketBlock

- 검색바 (상단) — 전체 마켓에서 코인 검색 및 등록/해제
- 탭: 내 코인 (등록된 코인) / 관심 (즐겨찾기) / 보유 (미구현)

## Next Steps

1. CoinInfo 간소화 (가짜 매수/매도 데이터 제거, 실제 거래량만)
2. Trading stub 개선
3. Implement actual order functionality
4. Strengthen error handling and user feedback
5. Settings panel and API key management

## Active Decisions and Considerations

### Architecture

- Redux Toolkit for state management
- Service layer pattern separating API calls from UI
- IPC for authenticated API calls (prevents API key exposure in renderer)
- Binance data normalized to Upbit format for unified processing
- Chart component self-contained (own REST fetch + kline WebSocket, DataManager 미사용)

### API Integration

- **Binance Futures API** (`fapi.binance.com`) — Spot에서 Futures로 전환 완료
- **Ticker WebSocket** (DataManager): 관심 코인만 `wss://fstream.binance.com` `@ticker` 스트림
- **Kline WebSocket** (BinanceFuturesChart): 선택 코인 1개 `@kline_{interval}` 스트림
- REST: 1초 간격 폴링 (등록된 코인 + USDT 환율)
- Automatic reconnection (5-second retry)

### UI/UX

- Tailwind CSS v4 styling
- Price change animations (rise=#639d01, fall=#ea0070)
- Custom scrollbar components
- Lightweight Charts 실시간 캔들스틱 차트 (인터벌 선택 지원)
- 탭 전환 시 상태 유지 (hidden CSS 패턴)

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
- registeredCoinSlice: 등록 코인 목록 (persisted to localStorage, 기본값: BTC/ETH/XRP/SOL/DOGE)

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
