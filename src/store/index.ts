import { configureStore } from '@reduxjs/toolkit';
import coinReducer from './slices/coinSlice';
import registeredCoinReducer from './slices/registeredCoinSlice';

export const store = configureStore({
  reducer: {
    coin: coinReducer,
    registeredCoin: registeredCoinReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
