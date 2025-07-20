import { CandleData } from '../services/UpbitApi';

export interface TickData {
  timestamp: number;
  price: number;
  change: string;
  volume: number;
}

export interface CoinState {
  markets: Array<{ market: string; korean_name: string }>;
  tickers: any[];
  selectedCoin: string | null;
  loading: boolean;
  error: string | null;
  webSocketData: any | null;
  favoriteData: Record<string, any>;
  candleData: CandleData[];
  selectedInterval: IntervalType;
  tickData: TickData[];
}

export interface FavoriteState {
  favorites: string[];
}

export interface RootState {
  coin: CoinState;
  favorite: FavoriteState;
}

export type IntervalType = 'tick' | '1' | '5' | '15' | '1hour' | '4hour' | 'day' | 'week';
