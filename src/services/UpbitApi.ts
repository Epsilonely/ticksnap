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

interface CandleData {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number; // 시가
  high_price: number; // 고가
  low_price: number; // 저가
  trade_price: number; // 종가
  timestamp: number;
  candle_acc_trade_price: number; // 누적 거래대금
  candle_acc_trade_volume: number; // 누적 거래량
  unit: number; // 분봉 단위
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

export const fetchCandles = async (market: string, interval: string = '1', count: number = 30): Promise<CandleData[]> => {
  try {
    let endpoint = '';
    let params = `market=${market}&count=${count}`;

    // 시간대별로 적절한 엔드포인트 선택
    switch (interval) {
      case '1':
      case '5':
      case '15':
        endpoint = `/api/upbit/v1/candles/minutes/${interval}`;
        break;
      case '1hour':
        endpoint = '/api/upbit/v1/candles/minutes/60';
        break;
      case '4hour':
        endpoint = '/api/upbit/v1/candles/minutes/240';
        break;
      case 'day':
        endpoint = '/api/upbit/v1/candles/days';
        break;
      case 'week':
        endpoint = '/api/upbit/v1/candles/weeks';
        break;
      default:
        endpoint = '/api/upbit/v1/candles/minutes/1';
    }

    const response = await axios.get(`${endpoint}?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch candles:', error);
    return [];
  }
};

export type { CandleData };
