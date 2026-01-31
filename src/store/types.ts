import { UnifiedCoinData } from '../utils/symbolMatcher';

export interface CoinState {
  markets: Array<{ market: string; korean_name: string }>;
  tickers: any[];
  unifiedCoins: UnifiedCoinData[]; // 통합 거래소 데이터
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
