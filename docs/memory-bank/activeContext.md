# Active Context - TickSnap

## Current Work Focus

TradingView 차트 통합 완료. 다음 단계: Lightweight Charts로 교체하여 **바이낸스 Futures 전용** 실시간 차트 구현 예정.

**중요 결정**: 차트는 바이낸스 Futures 데이터만 표시. 업비트 차트는 구현하지 않음.

## Recent Changes

### 2026.02.01 (4차) — TradingView 차트 통합 완료 ✅

#### 완료된 작업

- **App.tsx 레이아웃 완전 재구성** — Flexbox 반응형 레이아웃으로 전환
  - ALARM_HISTORY, DEFAULT 블록 제거 (단순화)
  - 복잡한 `h-[calc(100%-52px)]` 제거 → `flex-1 min-h-0`로 교체
  - 오른쪽 컬럼: `flex flex-col h-full`
  - 탭 헤더: `flex-shrink-0` (내용물 크기만큼)
  - 탭 컨텐츠: `flex-1 min-h-0` (남은 공간 모두 차지)
  - 완전 반응형: 윈도우 크기 변경 시 차트 자동 확장/축소
- **CoinDetailBlock 완전 재작성** — 깔끔한 3단 구조
  - 헤더 (`flex-shrink-0`): 코인 이름 + 심볼 + 관심 버튼
  - 가격 정보 (`flex-shrink-0`): 현재가 + 등락 + 등락률 + 등락폭
  - 차트 (`flex-1 min-h-0`): TradingViewChart (남은 공간 모두 차지)
- **TradingViewChart 컴포넌트 수정**
  - `innerHTML = ''` 제거 → React 렌더링 `.tradingview-widget-container__widget` 유지
  - `scriptRef`로 스크립트만 관리 (코인 변경 시 스크립트 교체)
  - 올바른 HTML 구조: `<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div><script></script></div>`
  - **차트 표시 성공** ✅

#### 발견된 이슈: TradingView 가격 업데이트 지연

- **문제**: TradingView 무료 위젯은 지연된 데이터 제공 (수 초~수십 초)
- **원인**: TradingView 서버에서 독립적으로 데이터 가져옴 (DataManager WebSocket과 별개)
- **현재 상태**:
  - CoinDetailBlock 상단 가격: 실시간 (DataManager WebSocket, 1초 이내)
  - TradingView 차트: 지연 있음 (TradingView 서버, 무료 제약)

### 2026.02.01 (3차) — CoinDetailBlock 재구성 진행 중

#### 완료된 작업

- **TradingViewChart 컴포넌트 생성** (`src/components/TradingViewChart.tsx`)
  - TradingView Advanced Chart 위젯 래퍼 (스크립트 직접 주입 방식, npm 패키지 X)
  - Props: `symbol`, `theme`, `interval`
  - `useEffect` + `useRef`로 스크립트 라이프사이클 관리
  - `key={coinSymbol}`로 코인 전환 시 리마운트
  - 심볼 매핑: `BINANCE:${symbol}USDT` (바이낸스 Futures 전용)
- **CoinDetailBlock에 TradingViewChart 연결**
  - CoinInfo, Trading 컴포넌트 임시 제거 (가짜 데이터 문제)
  - 가격 색상 토큰 `text-red-500`/`text-blue-500` → `text-price-rise`/`text-price-fall`로 수정
- **App.tsx 레이아웃 수정**
  - `items-center` 제거 → 컨텐츠 전체 너비 사용
  - 탭 헤더에 `w-fit self-center` 추가 → Trader/Assets 버튼 컴팩트 유지
- **Block.tsx** — 디버그용 `bg-green-400` 제거

### 2026.02.01 (2차)

- **Binance Spot → Futures 전환** — BinanceApi.ts 전체 엔드포인트를 `fapi.binance.com` Futures API로 교체
  - `fetchBinanceMarkets()`: PERPETUAL 계약만 필터링
  - `fetchBinanceTickers()`: Futures는 `?symbols=[]` 미지원 → 전체 fetch + client-side filter
  - WebSocket URL: `wss://fstream.binance.com` (Futures 전용)
  - Vite 프록시: `/fapi` → `https://fapi.binance.com` 추가
- **등록 코인 시스템** — 사용자가 보고 싶은 코인만 등록하여 표시
  - `registeredCoinSlice.ts` 신규 생성 (localStorage persist, 기본값: BTC/ETH/XRP/SOL/DOGE)
  - DataManager: 등록 코인만 REST 폴링 (기존: 전체 수백 개 → 등록된 10~30개만)
  - MarketBlock UI 재설계: 검색바 + "내 코인/관심/보유" 탭
  - App.tsx: store subscription으로 등록 코인 변경 시 DataManager 자동 동기화

### 2026.02.01 (1차)

- **Removed Leaderboard feature** — deleted `Leaderboard.tsx`, removed tab/enum/switch/API code
- **Removed MiniChart component** — deleted `MiniChart.tsx`, removed from CoinInfo props and rendering (to be reimplemented later)
- Cleaned up `store/types.ts` — removed `TickData`, `IntervalType`, chart-related state fields
- Moved `IntervalType` to local definitions in `BinanceApi.ts` and `UpbitApi.ts`
- Moved Memory Bank to `docs/memory-bank/` for shared Cline/Claude Code access
- Added Memory Bank reference section to `CLAUDE.md`
- Deleted QR login feature (PR #21 — added then removed by decision)
- UI layout edits and improvements

### Recent Feature History (from git log)

- **Binance Futures position query** (`getFuturesPositionsViaREST`) implemented (#20)
- **Binance login/authentication** added (#20)
- **Leaderboard tab** added — Binance Futures leaderboard nickname search (#20)
- **Portfolio view improvement** — separate display for Upbit / Binance Spot / Binance Futures (#15)
- **Price display decimal formatting** improvements (#15, #17)
- **API optimization** — REST polling and WebSocket efficiency
- **Favorite icon** change
- **PriceDisplay decimal color** bug fix
- **Binance logo** updated (larger size + gradient)
- Unused code cleanup

## Current App Layout

Tab-based navigation structure:

- **Trader tab**: 코인 이름/심볼 + 가격 + TradingView 차트 (CoinDetailBlock) — CoinInfo/Trading 임시 제거
- **Assets tab**: Portfolio — Upbit KRW, Binance Spot USDT, Binance Futures positions (Portfolio)

Left sidebar: MarketBlock

- 검색바 (상단) — 전체 마켓에서 코인 검색 및 등록/해제
- 탭: 내 코인 (등록된 코인) / 관심 (즐겨찾기) / 보유 (미구현)

## Next Steps

1. **[계획] Lightweight Charts로 교체** — 바이낸스 Futures 전용 실시간 차트 구현
   - `npm install lightweight-charts` 설치
   - `LightweightChart.tsx` 컴포넌트 생성 (바이낸스 Futures 데이터만)
   - DataManager의 바이낸스 WebSocket 데이터 직접 연결
   - 초기 데이터: 바이낸스 Futures REST API로 캔들 데이터 로드
   - 실시간 업데이트: 바이낸스 WebSocket 가격 변동 시 차트 업데이트
   - **업비트 차트는 구현하지 않음** (바이낸스 Futures만)
2. CoinDetailBlock에 양쪽 거래소 가격 표시 (ExchangePriceDisplay 재활용)
3. CoinInfo 간소화 (가짜 매수/매도 데이터 제거, 실제 거래량만)
4. Trading stub 개선
5. Implement actual order functionality
6. Strengthen error handling and user feedback

## Active Decisions and Considerations

### Architecture

- Redux Toolkit for state management
- Service layer pattern separating API calls from UI
- IPC for authenticated API calls (prevents API key exposure in renderer)
- Binance data normalized to Upbit format for unified processing

### API Integration

- **Binance Futures API** (`fapi.binance.com`) — Spot에서 Futures로 전환 완료
- WebSocket: 관심(favorite) 코인만 연결 (`wss://fstream.binance.com`)
- REST: 1초 간격 폴링 (등록된 코인만, 기존 전체 수백 개에서 최적화)
- REST updates skipped for coins with active WebSocket feeds
- Automatic reconnection (5-second retry)

### UI/UX

- Tailwind CSS v4 styling
- Price change animations (red=rise, blue=fall)
- Custom scrollbar components
- TradingView Advanced Chart 통합 진행 중 (컨테이너 높이 문제 해결 필요)

### Layout Height Chain Issue (현재 블로커)

App.tsx의 오른쪽 컬럼 레이아웃이 CSS height를 제대로 전파하지 못하는 구조:

```
div.flex-col (NOT flex!) ← flex 아님, flex-col/gap 무효
  ├ div (alarm history)
  ├ div.flex.flex-col.min-h-[680px].max-h-[1000px] ← 명시적 height 없음
  │  ├ div (tab header)
  │  └ div.h-[calc(100%-52px)] ← 부모에 definite height 없어서 0으로 해석
  │     └ Block.h-full → CoinDetailBlock.h-full → chart height = 0
  └ div (bottom block)
```

해결 방향: 오른쪽 컬럼을 실제 flex 컨테이너로 만들거나, 중간 섹션에 명시적 height 부여

## Important Patterns and Preferences

### Code Organization

- `src/services/` — API logic and data orchestration
- `src/components/` — Reusable UI components
- `src/block/` — Layout-level block components
- `src/common/` — Shared UI utilities
- `src/utils/` — Symbol matching/unification logic

### Naming Conventions

- PascalCase for components
- camelCase for functions and variables
- Korean comments are common in the codebase

### Documentation Standards

- **Memory Bank files**: Written in English only for compatibility with AI assistants
- **Code comments**: Korean is acceptable and common in the codebase
- **Commit messages**: Korean or English

### State Management

- coinSlice: coin market data (unifiedCoins, selectedCoin, loading, error)
- favoriteSlice: favorites (persisted to localStorage)
- registeredCoinSlice: 등록 코인 목록 (persisted to localStorage, 기본값: BTC/ETH/XRP/SOL/DOGE)

## Learnings and Project Insights

### Technical Insights

- DataManager singleton is the core of all data flow — ~571 lines
- Binance data converted to Upbit format and merged into UnifiedCoinData structure
- WebSocket limited to favorite coins for bandwidth efficiency
- Electron context isolation + IPC maintains security

### Challenges to Watch

- API rate limits (exchange-specific restrictions)
- WebSocket long-session connection stability
- API keys hardcoded in config.js — should migrate to environment variables
- Cross-platform compatibility (only Windows tested so far)
