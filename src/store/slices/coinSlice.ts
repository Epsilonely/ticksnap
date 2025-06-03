import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarkets, fetchTickers, fetchCandles, CandleData } from '../../services/UpbitApi';
import { CoinState } from '../types';

// 초기 상태
const initialState: CoinState = {
  markets: [],
  tickers: [],
  selectedCoin: null,
  loading: true,
  error: null,
  webSocketData: null,
  favoriteData: {},
  candleData: [],
  selectedInterval: '1',
};

// 비동기 액션
export const fetchMarketsAsync = createAsyncThunk('coin/fetchMarkets', async () => {
  return await fetchMarkets();
});

export const fetchTickersAsync = createAsyncThunk('coin/fetchTickers', async (marketCodes: string[]) => {
  return await fetchTickers(marketCodes);
});

export const fetchCandlesAsync = createAsyncThunk('coin/fetchCandles', async ({ market, interval }: { market: string; interval: string }) => {
  return await fetchCandles(market, interval, 30);
});

const coinSlice = createSlice({
  name: 'coin',
  initialState,
  reducers: {
    selectCoin: (state, action: PayloadAction<string>) => {
      state.selectedCoin = action.payload;
    },
    setSelectedInterval: (state, action: PayloadAction<string>) => {
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
      });
  },
});

export const { selectCoin, setSelectedInterval, updateTickers, updateWebSocketData, updateFavoriteData, updateCandleData } = coinSlice.actions;
export default coinSlice.reducer;
