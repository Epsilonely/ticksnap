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
    
    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // 에러 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUnifiedCoins, selectCoin, setLoading, setError } = coinSlice.actions;
export default coinSlice.reducer;
