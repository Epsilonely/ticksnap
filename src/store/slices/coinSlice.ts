import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UnifiedCoinData } from '../../services/DataManager';
import { BinanceFuturesPosition } from '../../services/BinanceAccountApi';

// 간소화된 코인 상태
interface SimpleCoinState {
  unifiedCoins: UnifiedCoinData[];
  selectedCoin: string | null;
  usdtKrwRate: number; // USDT/KRW 환율 (업비트 KRW-USDT 현재가)
  futuresPositions: BinanceFuturesPosition[]; // Binance Futures 포지션 목록
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: SimpleCoinState = {
  unifiedCoins: [],
  selectedCoin: null,
  usdtKrwRate: 0,
  futuresPositions: [],
  loading: true,
  error: null,
};

const coinSlice = createSlice({
  name: 'coin',
  initialState,
  reducers: {
    // 통합 코인 데이터 업데이트 (DataManager에서 호출)
    setUnifiedCoins: (state, action: PayloadAction<UnifiedCoinData[]>) => {
      state.unifiedCoins = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    // USDT/KRW 환율 업데이트
    setUsdtKrwRate: (state, action: PayloadAction<number>) => {
      state.usdtKrwRate = action.payload;
    },

    // Futures 포지션 업데이트
    setFuturesPositions: (state, action: PayloadAction<BinanceFuturesPosition[]>) => {
      state.futuresPositions = action.payload;
    },

    // 코인 선택
    selectCoin: (state, action: PayloadAction<string>) => {
      state.selectedCoin = action.payload;
    },
  },
});

export const { setUnifiedCoins, setUsdtKrwRate, setFuturesPositions, selectCoin } = coinSlice.actions;
export default coinSlice.reducer;
