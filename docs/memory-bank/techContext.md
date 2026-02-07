# Tech Context - TickSnap

## Technologies Used

### Core Stack

- **React 19.0.0:** UI framework
- **TypeScript 4.9.5:** Type-safe JavaScript
- **Electron 35.0.2:** Desktop application framework
- **Vite 6.2.2:** Build tool and dev server

### State Management

- **Redux Toolkit 2.7.0:** State management
- **React-Redux 9.2.0:** React bindings for Redux

### Styling

- **Tailwind CSS 4.0.14:** Utility-first CSS framework
- **@tailwindcss/vite 4.0.14:** Vite plugin for Tailwind
- **lightningcss 1.29.3:** Fast CSS processing

### Charting

- **lightweight-charts:** TradingView open-source charting library (candlestick + histogram)
  - API: `createChart()`, `chart.addSeries(CandlestickSeries)`, `chart.addSeries(HistogramSeries)`
  - Data format: `{ time: UTCTimestamp (seconds), open, high, low, close }`
  - Real-time: `series.update(data)` for live candle updates

### API & Data

- **axios 1.12.2:** HTTP client
- **ws 8.18.3:** WebSocket client
- **jsonwebtoken 9.0.2:** JWT handling for API auth
- **uuid 11.1.0:** Unique identifier generation

### Development Tools

- **@vitejs/plugin-react 4.3.4:** React support for Vite
- **concurrently 9.1.2:** Run multiple commands simultaneously
- **cross-env 7.0.3:** Cross-platform environment variables
- **wait-on 8.0.3:** Wait for resources before starting
- **electron-builder 25.1.8:** Package and build Electron apps

## Development Setup

### Scripts

- `npm start`: Web dev server only (port 3000)
- `npm run dev`: Electron + Vite dev mode
- `npm run build`: Production build to `dist/`
- `npm run electron-build:win`: Build for Windows x64

### Vite Dev Proxy

- `/api/upbit` → `https://api.upbit.com`
- `/api/binance` → `https://api.binance.com`
- `/bapi` → `https://www.binance.com`
- `/fapi` → `https://fapi.binance.com` (Binance USD-M Futures — klines, exchangeInfo, ticker)

Vite root is `./src` (not project root); build output goes to `../dist`.

## Technical Constraints

### API Constraints

- **Binance Futures REST:** `/fapi/v1/klines` for candles, `/fapi/v1/ticker/24hr` for tickers, `/fapi/v1/exchangeInfo` for markets
- **Binance Futures WebSocket:**
  - Ticker stream: `wss://fstream.binance.com/stream?streams={symbol}@ticker` (DataManager)
  - Kline stream: `wss://fstream.binance.com/ws/{symbol}@kline_{interval}` (BinanceFuturesChart)
  - Max 1024 streams per connection, 10 messages/second
- **Binance Futures ticker:** `?symbols=[]` not supported → fetch all + client-side filter
- **Upbit:** Rate limits, JWT authentication, `wss://api.upbit.com/websocket/v1`

### Performance Constraints

- Real-time ticker updates < 1 second
- Chart candle updates via WebSocket (sub-second)
- Tab switch must be instant (hidden pattern, no re-mount)
- Memory management for long-running sessions

## Dependencies

### Production Dependencies

```json
{
  "@reduxjs/toolkit": "^2.7.0",
  "@tailwindcss/vite": "^4.0.14",
  "axios": "^1.12.2",
  "electron-is-dev": "^3.0.1",
  "jsonwebtoken": "^9.0.2",
  "lightweight-charts": "latest",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-redux": "^9.2.0",
  "tailwindcss": "^4.0.14",
  "typescript": "^4.9.5",
  "uuid": "^11.1.0",
  "ws": "^8.18.3"
}
```

## Code Quality

- TypeScript for compile-time checks
- Prettier (.prettierrc.yml: printWidth 1000, singleQuote)
- No test runner configured
- Git + GitHub remote
- Memory Bank docs in `docs/memory-bank/`
