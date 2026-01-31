import { configureStore } from '@reduxjs/toolkit';
import coinReducer from './slices/coinSlice';
import favoriteReducer from './slices/favoriteSlice';
import registeredCoinReducer from './slices/registeredCoinSlice';

export const store = configureStore({
  reducer: {
    coin: coinReducer,
    favorite: favoriteReducer,
    registeredCoin: registeredCoinReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
