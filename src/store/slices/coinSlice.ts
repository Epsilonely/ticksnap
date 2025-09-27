import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarkets, fetchTickers, fetchCandles, CandleData } from '../../services/UpbitApi';
import { getUnifiedExchangeService } from '../../services/UnifiedExchangeService';
import { CoinState, IntervalType, TickData } from '../types';
import { UnifiedCoinData } from '../../utils/symbolMatcher';

// 초기 상태
const initialState: CoinState = {
  markets: [],
  tickers: [],
  unifiedCoins: [],
  selectedCoin: null,
  loading: true,
  error: null,
  webSocketData: null,
  favoriteData: {},
  candleData: [],
  selectedInterval: '1',
  tickData: [],
};

// 비동기 액션
export const fetchMarketsAsync = createAsyncThunk('coin/fetchMarkets', async () => {
  return await fetchMarkets();
});

export const fetchTickersAsync = createAsyncThunk('coin/fetchTickers', async (marketCodes: string[]) => {
  return await fetchTickers(marketCodes);
});

export const fetchCandlesAsync = createAsyncThunk('coin/fetchCandles', async ({ market, interval }: { market: string; interval: IntervalType }) => {
  return await fetchCandles(market, interval, 36);
});

// 통합 거래소 데이터 가져오기
export const fetchUnifiedCoinsAsync = createAsyncThunk('coin/fetchUnifiedCoins', async () => {
  const unifiedService = getUnifiedExchangeService();
  return await unifiedService.getUnifiedTickers();
});

const coinSlice = createSlice({
  name: 'coin',
  initialState,
  reducers: {
    selectCoin: (state, action: PayloadAction<string>) => {
      state.selectedCoin = action.payload;
    },
    addTickData: (state, action: PayloadAction<TickData>) => {
      state.tickData.push(action.payload);
      // 최대 30개 유지
      if (state.tickData.length > 30) {
        state.tickData.shift();
      }
    },
    clearTickData: (state) => {
      state.tickData = [];
    },
    setSelectedInterval: (state, action: PayloadAction<IntervalType>) => {
      state.selectedInterval = action.payload;
    },
    updateTickers: (state, action: PayloadAction<any[]>) => {
      state.tickers = action.payload;
    },
    updateWebSocketData: (state, action: PayloadAction<any>) => {
      state.webSocketData = action.payload;
    },
    updateFavoriteData: (state, action: PayloadAction<any>) => {
      const data = action.payload;
      if (data && data.code) {
        state.favoriteData[data.code] = data;
      }
    },
    updateCandleData: (state, action: PayloadAction<CandleData[]>) => {
      state.candleData = action.payload;
    },
    updateUnifiedCoins: (state, action: PayloadAction<UnifiedCoinData[]>) => {
      state.unifiedCoins = action.payload;
    },
    updateUnifiedCoinData: (state, action: PayloadAction<{ coinSymbol: string; data: any; exchange: 'upbit' | 'binance' }>) => {
      const { coinSymbol, data, exchange } = action.payload;
      const coinIndex = state.unifiedCoins.findIndex((coin) => coin.coinSymbol === coinSymbol);

      if (coinIndex !== -1) {
        if (exchange === 'upbit') {
          state.unifiedCoins[coinIndex].upbit = {
            symbol: data.code || data.market,
            price: data.trade_price,
            change: data.change,
            changeRate: data.change_rate,
            changePrice: data.change_price,
            tradeVolume: data.acc_trade_price_24h || data.acc_trade_price,
          };
        } else if (exchange === 'binance') {
          state.unifiedCoins[coinIndex].binance = {
            symbol: data.code || data.market,
            price: data.trade_price,
            change: data.change,
            changeRate: data.change_rate,
            changePrice: data.change_price,
            tradeVolume: data.acc_trade_price,
          };
        }

        // 최대 거래량 업데이트
        const upbitVolume = state.unifiedCoins[coinIndex].upbit?.tradeVolume || 0;
        const binanceVolume = state.unifiedCoins[coinIndex].binance?.tradeVolume || 0;
        state.unifiedCoins[coinIndex].maxTradeVolume = Math.max(upbitVolume, binanceVolume);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMarketsAsync.fulfilled, (state, action) => {
        state.markets = action.payload;
        if (state.markets.length > 0) {
          state.loading = false;
        }
      })
      .addCase(fetchMarketsAsync.rejected, (state, action) => {
        state.error = '마켓 목록을 불러오는 중 오류가 발생했습니다.';
        state.loading = false;
      })
      .addCase(fetchTickersAsync.fulfilled, (state, action) => {
        state.tickers = action.payload;
        if (state.tickers.length > 0) {
          state.loading = false;
        }
      })
      .addCase(fetchTickersAsync.rejected, (state, action) => {
        state.error = '현재가 정보를 가져오는 중 오류가 발생했습니다.';
      })
      .addCase(fetchCandlesAsync.fulfilled, (state, action) => {
        state.candleData = action.payload;
      })
      .addCase(fetchCandlesAsync.rejected, (state, action) => {
        state.error = '캔들 데이터를 가져오는 중 오류가 발생했습니다.';
      })
      .addCase(fetchUnifiedCoinsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnifiedCoinsAsync.fulfilled, (state, action) => {
        state.unifiedCoins = action.payload;
        state.loading = false;
      })
      .addCase(fetchUnifiedCoinsAsync.rejected, (state, action) => {
        state.error = '통합 거래소 데이터를 가져오는 중 오류가 발생했습니다.';
        state.loading = false;
      });
  },
});

export const { selectCoin, setSelectedInterval, updateTickers, updateWebSocketData, updateFavoriteData, updateCandleData, addTickData, clearTickData, updateUnifiedCoins, updateUnifiedCoinData } = coinSlice.actions;
export default coinSlice.reducer;
