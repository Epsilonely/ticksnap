# System Patterns - TickSnap

## System Architecture

### High-Level Structure

```
┌─────────────────────────────────────┐
│         Electron Main Process       │
│  (main.js, preload.js)             │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      React Renderer Process         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Redux Store             │  │
│  │  - coinSlice                 │  │
│  │  - favoriteSlice             │  │
│  └──────────────────────────────┘  │
│                 │                   │
│  ┌──────────────┴──────────────┐  │
│  │                              │  │
│  ▼                              ▼  │
│ Components                  Blocks │
│ - Portfolio                - Market│
│ - Trading                  - Detail│
│ - CoinInfo                 - Board │
│                                     │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Service Layer               │
│  - BinanceApi / BinanceAccountApi  │
│  - UpbitApi / UpbitAccountApi      │
│  - DataManager                      │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      External APIs                  │
│  - Binance WebSocket/REST          │
│  - Upbit WebSocket/REST            │
└─────────────────────────────────────┘
```

## Key Technical Decisions

### Frontend Framework

- **React 19:** Latest features, concurrent rendering
- **TypeScript:** Type safety for complex data structures
- **Redux Toolkit:** Simplified state management with less boilerplate

### Desktop Framework

- **Electron 35:** Cross-platform desktop capabilities
- **Vite:** Fast build tool with HMR for development

### Styling

- **Tailwind CSS 4:** Utility-first CSS with modern features
- **Custom fonts:** Pretendard, Spoqa Han Sans Neo for Korean support

### API Communication

- **axios:** HTTP requests for REST APIs
- **ws:** WebSocket library for real-time data
- **jsonwebtoken:** For API authentication

## Design Patterns in Use

### Service Layer Pattern

- Separate API logic from UI components
- Each exchange has dedicated service files
- DataManager for centralized data operations

### Component Composition

- Small, reusable components (PriceDisplay, MiniChart)
- Larger block components compose smaller ones
- Clear separation between presentational and container components

### State Management Pattern

- Redux slices for domain-specific state
- Normalized state structure for efficient updates
- Selectors for derived data

### Observer Pattern

- WebSocket connections observe exchange data streams
- Components subscribe to Redux store changes
- Real-time updates propagate through the system

## Component Relationships

### Core Components

- **App.tsx:** Root component, main layout
- **Portfolio.tsx:** User's holdings and balances
- **Trading.tsx:** Order placement interface
- **CoinInfo.tsx:** Detailed coin information

### Block Components

- **MarketBlock.tsx:** Market overview and coin list
- **CoinDetailBlock.tsx:** Detailed view of selected coin
- **Leaderboard.tsx:** Top performing coins
- **Block.tsx:** Base block component

### Common Components

- **PriceDisplay.tsx:** Formatted price with color coding
- **Scrollbar.tsx:** Custom scrollbar styling
- **ExchangePriceDisplay.tsx:** Price comparison across exchanges
- **MiniChart.tsx:** Small price chart visualization

## Critical Implementation Paths

### Real-time Price Updates

1. WebSocket connection established in service layer
2. Price data received and normalized
3. Redux store updated via dispatch
4. Components re-render with new prices
5. UI updates with smooth transitions

### Trading Flow

1. User inputs order details in Trading component
2. Validation of inputs (amount, price, balance)
3. API call to exchange via AccountApi service
4. Response handling (success/error)
5. Portfolio update on successful trade
6. User feedback via UI notifications

### Portfolio Calculation

1. Fetch balances from exchange APIs
2. Get current prices for held assets
3. Calculate total value in base currency
4. Compute profit/loss percentages
5. Display in Portfolio component

### Data Synchronization

1. DataManager coordinates multiple data sources
2. Periodic refresh of account data
3. Continuous WebSocket updates for prices
4. State reconciliation on reconnection
5. Error recovery and retry logic
