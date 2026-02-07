import axios from 'axios';

interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  contractType?: string; // PERPETUAL, CURRENT_QUARTER 등 (Futures)
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbolInfo[];
}

interface BinanceTickerData {
  symbol: string; // 심볼 (예: BTCUSDT)
  priceChange: string; // 24시간 가격 변화량
  priceChangePercent: string; // 24시간 가격 변화율
  weightedAvgPrice: string; // 가중 평균 가격
  prevClosePrice: string; // 이전 종가
  lastPrice: string; // 현재가
  lastQty: string; // 마지막 거래량
  bidPrice: string; // 매수 호가
  askPrice: string; // 매도 호가
  openPrice: string; // 시가
  highPrice: string; // 고가
  lowPrice: string; // 저가
  volume: string; // 거래량
  quoteVolume: string; // 거래대금
  openTime: number; // 시작 시간
  closeTime: number; // 종료 시간
  count: number; // 거래 횟수
}

// 바이낸스 Futures USDT 무기한 계약 목록 가져오기
export const fetchBinanceMarkets = async (): Promise<BinanceSymbolInfo[]> => {
  try {
    const response = await axios.get<BinanceExchangeInfo>('/fapi/v1/exchangeInfo');

    // USDT 무기한 계약만 필터링
    return response.data.symbols.filter((symbol) => symbol.quoteAsset === 'USDT' && symbol.status === 'TRADING' && symbol.contractType === 'PERPETUAL');
  } catch (error) {
    console.error('Failed to fetch Binance Futures markets:', error);
    return [];
  }
};

// 바이낸스 Futures 현재가 정보 가져오기
export const fetchBinanceTickers = async (symbols?: string[]): Promise<BinanceTickerData[]> => {
  try {
    // Futures API는 ?symbols=[] 미지원 → 전체 fetch 후 client-side 필터
    const response = await axios.get<BinanceTickerData[]>('/fapi/v1/ticker/24hr');
    const allTickers = Array.isArray(response.data) ? response.data : [response.data];

    if (symbols && symbols.length > 0) {
      const symbolSet = new Set(symbols);
      return allTickers.filter((t) => symbolSet.has(t.symbol));
    }
    return allTickers;
  } catch (error) {
    console.error('Failed to fetch Binance Futures tickers:', error);
    return [];
  }
};

// --- Kline/Candlestick 타입 ---

export interface BinanceKline {
  time: number; // Open time (seconds, lightweight-charts UTCTimestamp)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type KlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

// 바이낸스 Futures kline(캔들스틱) 데이터 조회
export const fetchBinanceKlines = async (symbol: string, interval: KlineInterval, limit: number = 500): Promise<BinanceKline[]> => {
  try {
    const response = await axios.get<number[][]>('/fapi/v1/klines', {
      params: { symbol, interval, limit },
    });

    return response.data.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000), // ms -> seconds (UTCTimestamp)
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  } catch (error) {
    console.error('Failed to fetch Binance Futures klines:', error);
    return [];
  }
};

// 바인낸스 데이터를 업비트 형식으로 변환하는 유틸리티 함수
export const convertBinanceTickerToUpbitFormat = (binanceTicker: BinanceTickerData) => {
  const changeRate = parseFloat(binanceTicker.priceChangePercent) / 100;
  const changePrice = parseFloat(binanceTicker.priceChange);

  return {
    market: binanceTicker.symbol,
    trade_price: parseFloat(binanceTicker.lastPrice),
    prev_closing_price: parseFloat(binanceTicker.prevClosePrice),
    change: changePrice > 0 ? 'RISE' : changePrice < 0 ? 'FALL' : 'EVEN',
    change_price: Math.abs(changePrice),
    change_rate: Math.abs(changeRate),
    signed_change_rate: changeRate,
    acc_trade_price: parseFloat(binanceTicker.quoteVolume), // 24시간 거래대금
    acc_trade_price_24h: parseFloat(binanceTicker.quoteVolume),
  };
};
