import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { selectCoin } from '../slices/coinSlice';
import { toggleFavorite } from '../slices/favoriteSlice';
import { getWebSocketService } from '../../services/WebSocketService';

// 디바운스 함수 구현
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

// 웹소켓 서비스 인스턴스 초기화 (한 번만 생성)
let webSocketService: any = null;

// 마켓 업데이트 함수 (디바운스 적용)
const updateMarketsDebounced = debounce((markets: string[]) => {
  if (webSocketService) {
    console.log('디바운스된 마켓 업데이트 실행:', markets);
    webSocketService.updateMarkets(markets);
  }
}, 300); // 300ms 디바운스

const websocketMiddleware: Middleware<{}, RootState> = (store) => {
  // 미들웨어 초기화 시 웹소켓 서비스 인스턴스 생성 (한 번만)
  if (!webSocketService) {
    webSocketService = getWebSocketService((data) => {
      // 데이터 타입에 따라 적절한 액션 디스패치
      if (data && data.code) {
        const state = store.getState();
        const selectedCoin = state.coin.selectedCoin;
        const favorites = state.favorite.favorites;

        // 선택된 코인 데이터인 경우
        if (selectedCoin && data.code === selectedCoin) {
          store.dispatch({ type: 'coin/updateWebSocketData', payload: data });
        }

        // 즐겨찾기 코인 데이터인 경우
        if (favorites.includes(data.code)) {
          store.dispatch({ type: 'coin/updateFavoriteData', payload: data });
        }
      }
    });
  }

  return (next) => (action) => {
    const result = next(action);

    // 선택된 코인이 변경되었을 때 웹소켓 연결 업데이트
    if (selectCoin.match(action)) {
      const state = store.getState();
      const selectedCoin = state.coin.selectedCoin;

      if (selectedCoin) {
        updateMarketsDebounced([selectedCoin]);
      }
    }

    // 즐겨찾기 목록이 변경되었을 때 웹소켓 연결 업데이트
    if (toggleFavorite.match(action)) {
      const state = store.getState();
      const favorites = state.favorite.favorites;

      if (favorites.length > 0) {
        updateMarketsDebounced(favorites);
      }
    }

    return result;
  };
};

export default websocketMiddleware;
