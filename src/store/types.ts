export interface CoinState {
  markets: Array<{ market: string; korean_name: string }>;
  tickers: any[];
  selectedCoin: string | null;
  loading: boolean;
  error: string | null;
  webSocketData: any | null;
  favoriteData: Record<string, any>;
}

export interface FavoriteState {
  favorites: string[];
}

export interface RootState {
  coin: CoinState;
  favorite: FavoriteState;
}
