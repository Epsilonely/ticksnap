import axios from 'axios';

interface MarketData {
  market: string;
  korean_name: string;
}

interface TickerData {
  market: string; // 종목 구분 코드
  trade_price: number; // 현재가
  prev_closing_price: number; // 전일 종가(UTC 0시 기준)
  change: string; // EVEN: 보합, RISE: 상승, FALL:하락
  change_price: number; // 변화액의 절대값
  change_rate: number; // 변화율의 절대값
  signed_change_rate: number;
  acc_trade_price: number; // 누적 거래대금 (UTC 0시 기준)
  acc_trade_price_24h: number; // 최근 24시간 동안의 총 거래대금
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
