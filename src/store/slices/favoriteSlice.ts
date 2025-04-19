import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoriteState {
  favorites: string[];
}

// 로컬 스토리지에서 관심코인 불러오기
const loadFavoritesFromStorage = (): string[] => {
  try {
    const storedFavorites = localStorage.getItem('favorites');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  } catch (error) {
    console.error('관심코인 로드 실패:', error);
    return [];
  }
};

// 초기 상태
const initialState: FavoriteState = {
  favorites: loadFavoritesFromStorage(),
};

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const coinId = action.payload;
      const index = state.favorites.indexOf(coinId);

      if (index === -1) {
        state.favorites.push(coinId);
      } else {
        state.favorites.splice(index, 1);
      }

      localStorage.setItem('favorites', JSON.stringify(state.favorites));
    },
  },
});

export const { toggleFavorite } = favoriteSlice.actions;
export default favoriteSlice.reducer;
