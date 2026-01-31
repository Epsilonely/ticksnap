# Active Context - TickSnap

## Current Work Focus

Post core-feature implementation phase. Stabilization and improvement. Memory Bank system configured for shared access between Cline and Claude Code.

## Recent Changes

### 2026.02.01
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

Left sidebar: MarketBlock (coin list, filtering: All / Favorites / Holdings)

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
- WebSocket: connected only for favorite coins (bandwidth optimization)
- REST: 1-second interval polling (top 100 Binance coins)
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
