import axios from 'axios';

interface MarketData {
  market: string;
  korean_name: string;
}

interface TickerData {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  acc_trade_price_24h: number;
}

export const fetchMarkets = async () => {
  try {
    const response = await axios.get('/api/upbit/v1/market/all');
    return response.data.filter((data: MarketData) => data.market.startsWith('KRW'));
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return [];
  }
};

export const fetchTickers = async (markets: string[]): Promise<TickerData[]> => {
  try {
    const marketCodes = markets.join(',');
    const response = await axios.get(`/api/upbit/v1/ticker?markets=${marketCodes}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tickers:', error);
    return [];
  }
};
