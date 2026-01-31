import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RegisteredCoinState {
  registeredCoins: string[]; // 코인 심볼: ["BTC", "ETH", "SOL", ...]
}

const DEFAULT_COINS = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE'];

const loadRegisteredCoinsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem('registeredCoins');
    return stored ? JSON.parse(stored) : DEFAULT_COINS;
  } catch (error) {
    console.error('등록 코인 로드 실패:', error);
    return DEFAULT_COINS;
  }
};

const initialState: RegisteredCoinState = {
  registeredCoins: loadRegisteredCoinsFromStorage(),
};

const registeredCoinSlice = createSlice({
  name: 'registeredCoin',
  initialState,
  reducers: {
    registerCoin: (state, action: PayloadAction<string>) => {
      const coinSymbol = action.payload;
      if (!state.registeredCoins.includes(coinSymbol)) {
        state.registeredCoins.push(coinSymbol);
        localStorage.setItem('registeredCoins', JSON.stringify(state.registeredCoins));
      }
    },
    unregisterCoin: (state, action: PayloadAction<string>) => {
      const index = state.registeredCoins.indexOf(action.payload);
      if (index !== -1) {
        state.registeredCoins.splice(index, 1);
        localStorage.setItem('registeredCoins', JSON.stringify(state.registeredCoins));
      }
    },
  },
});

export const { registerCoin, unregisterCoin } = registeredCoinSlice.actions;
export default registeredCoinSlice.reducer;
