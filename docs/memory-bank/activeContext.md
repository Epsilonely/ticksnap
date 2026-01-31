# Active Context - TickSnap

## Current Work Focus

Setting up Memory Bank system for better project context management across sessions.

## Recent Changes

- 2026.02.01: Initialized Memory Bank structure with 6 core files
- Moved Memory Bank to `docs/memory-bank/` for shared access between Cline and Claude Code
- Project is in active development state
- Core features implemented: Portfolio, Trading, Market view, Leaderboard

## Next Steps

1. Review existing codebase for any issues or improvements
2. Ensure all API integrations are working correctly
3. Test real-time data updates
4. Verify trading functionality
5. Check error handling and edge cases

## Active Decisions and Considerations

### Architecture

- Using Redux Toolkit for state management
- Separate service layer for API calls
- Component-based architecture with clear separation of concerns

### API Integration

- WebSocket connections for real-time data
- REST APIs for account operations and trading
- Need to handle rate limits and connection stability

### UI/UX

- Tailwind CSS for styling
- Custom scrollbar components
- Price display components with color coding

## Important Patterns and Preferences

### Code Organization

- Services in `src/services/` for API logic
- Components in `src/components/` for reusable UI
- Blocks in `src/block/` for larger UI sections
- Common utilities in `src/common/`

### Naming Conventions

- PascalCase for components
- camelCase for functions and variables
- Descriptive names that indicate purpose

### State Management

- Redux slices for different domains (coins, favorites)
- Centralized store configuration
- Type-safe actions and reducers

## Learnings and Project Insights

### Technical Insights

- Electron + Vite provides fast development experience
- WebSocket management requires careful connection handling
- TypeScript helps catch API integration issues early

### Development Workflow

- `npm run dev` for Electron development
- `npm start` for web-only testing
- Hot reload works well with Vite

### Challenges to Watch

- API rate limits from exchanges
- WebSocket connection stability
- Secure credential storage
- Cross-platform compatibility
