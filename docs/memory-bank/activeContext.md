# Active Context - TickSnap

## Current Work Focus

등록 코인 시스템 구현 완료 + Binance Futures 가격 전환 완료. 안정화 및 추가 기능 개발 단계.

## Recent Changes

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
- **Trader tab**: Coin detail info, price, order panel (CoinDetailBlock)
- **Assets tab**: Portfolio — Upbit KRW, Binance Spot USDT, Binance Futures positions (Portfolio)

Left sidebar: MarketBlock
- 검색바 (상단) — 전체 마켓에서 코인 검색 및 등록/해제
- 탭: 내 코인 (등록된 코인) / 관심 (즐겨찾기) / 보유 (미구현)

## Next Steps

1. Implement actual order functionality in Trading component (currently a stub)
2. Strengthen error handling and user feedback
3. Verify WebSocket reconnection stability
4. Add loading state indicators
5. Implement settings/configuration panel
6. Build API key management UI (currently hardcoded in config.js)

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
- Chart component planned for reimplementation

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
