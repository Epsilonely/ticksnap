import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarkets, fetchTickers } from '../../services/UpbitApi';

interface CoinState {
  markets: Array<{ market: string; korean_name: string }>;
  tickers: any[];
  selectedCoin: string | null;
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: CoinState = {
  markets: [],
  tickers: [],
  selectedCoin: null,
  loading: true,
  error: null,
};

// 비동기 액션
export const fetchMarketsAsync = createAsyncThunk('coin/fetchMarkets', async () => {
  return await fetchMarkets();
});

export const fetchTickersAsync = createAsyncThunk('coin/fetchTickers', async (marketCodes: string[]) => {
  return await fetchTickers(marketCodes);
});

const coinSlice = createSlice({
  name: 'coin',
  initialState,
  reducers: {
    selectCoin: (state, action: PayloadAction<string>) => {
      state.selectedCoin = action.payload;
    },
    updateTickers: (state, action: PayloadAction<any[]>) => {
      state.tickers = action.payload;
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
      });
  },
});

export const { selectCoin, updateTickers } = coinSlice.actions;
export default coinSlice.reducer;
