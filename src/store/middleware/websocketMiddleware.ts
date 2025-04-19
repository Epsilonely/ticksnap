import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { selectCoin } from '../slices/coinSlice';
import { toggleFavorite } from '../slices/favoriteSlice';
import { getWebSocketService } from '../../services/WebSocketService';

const websocketMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // 선택된 코인이 변경되었을 때 웹소켓 연결 업데이트
  if (selectCoin.match(action)) {
    const state = store.getState();
    const selectedCoin = state.coin.selectedCoin;

    if (selectedCoin) {
      const webSocketService = getWebSocketService((data) => {
        store.dispatch({ type: 'coin/updateWebSocketData', payload: data });
      });

      webSocketService.updateMarkets([selectedCoin]);
    }
  }

  // 즐겨찾기 목록이 변경되었을 때 웹소켓 연결 업데이트
  if (toggleFavorite.match(action)) {
    const state = store.getState();
    const favorites = state.favorite.favorites;

    if (favorites.length > 0) {
      const webSocketService = getWebSocketService((data) => {
        store.dispatch({ type: 'coin/updateFavoriteData', payload: data });
      });

      webSocketService.updateMarkets(favorites);
    }
  }

  return result;
};

export default websocketMiddleware;
