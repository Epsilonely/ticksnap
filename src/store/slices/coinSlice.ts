import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UnifiedCoinData } from '../../services/DataManager';

// 간소화된 코인 상태
interface SimpleCoinState {
  unifiedCoins: UnifiedCoinData[];
  selectedCoin: string | null;
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: SimpleCoinState = {
  unifiedCoins: [],
  selectedCoin: null,
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
    
    // 코인 선택
    selectCoin: (state, action: PayloadAction<string>) => {
      state.selectedCoin = action.payload;
    },
  },
});

export const { setUnifiedCoins, selectCoin } = coinSlice.actions;
export default coinSlice.reducer;
