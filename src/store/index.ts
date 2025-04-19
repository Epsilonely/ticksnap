import { configureStore } from '@reduxjs/toolkit';
import coinReducer from './slices/coinSlice';
import favoriteReducer from './slices/favoriteSlice';
import websocketMiddleware from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    coin: coinReducer,
    favorite: favoriteReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
