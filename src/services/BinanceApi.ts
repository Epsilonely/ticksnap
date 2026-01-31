import axios from 'axios';

type IntervalType = 'tick' | '1' | '5' | '15' | '1hour' | '4hour' | 'day' | 'week';

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

interface BinanceCandleData {
  openTime: number; // 시작 시간
  open: string; // 시가
  high: string; // 고가
  low: string; // 저가
  close: string; // 종가
  volume: string; // 거래량
  closeTime: number; // 종료 시간
  quoteAssetVolume: string; // 거래대금
  numberOfTrades: number; // 거래 횟수
  takerBuyBaseAssetVolume: string; // Taker 매수 거래량
  takerBuyQuoteAssetVolume: string; // Taker 매수 거래대금
  ignore: string; // 무시
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

// 바인낸스 캔들 데이터 가져오기
export const fetchBinanceCandles = async (symbol: string, interval: IntervalType = '1', limit: number = 30): Promise<BinanceCandleData[]> => {
  try {
    // 업비트 인터벌을 바인낸스 인터벌로 변환
    let binanceInterval = '1m';
    switch (interval) {
      case 'tick':
        // 바인낸스는 틱 데이터를 캔들로 제공하지 않음
        return [];
      case '1':
        binanceInterval = '1m';
        break;
      case '5':
        binanceInterval = '5m';
        break;
      case '15':
        binanceInterval = '15m';
        break;
      case '1hour':
        binanceInterval = '1h';
        break;
      case '4hour':
        binanceInterval = '4h';
        break;
      case 'day':
        binanceInterval = '1d';
        break;
      case 'week':
        binanceInterval = '1w';
        break;
      default:
        binanceInterval = '1m';
    }

    const response = await axios.get<BinanceCandleData[]>(`/fapi/v1/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`);

    return response.data;
  } catch (error) {
    console.error('Failed to fetch Binance candles:', error);
    return [];
  }
};

// 바인낸스 데이터를 업비트 형식으로 변환하는 유틸리티 함수들
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

export const convertBinanceCandleToUpbitFormat = (binanceCandle: BinanceCandleData, symbol: string) => {
  return {
    market: symbol,
    candle_date_time_utc: new Date(binanceCandle.openTime).toISOString(),
    candle_date_time_kst: new Date(binanceCandle.openTime + 9 * 60 * 60 * 1000).toISOString(),
    opening_price: parseFloat(binanceCandle.open),
    high_price: parseFloat(binanceCandle.high),
    low_price: parseFloat(binanceCandle.low),
    trade_price: parseFloat(binanceCandle.close),
    timestamp: binanceCandle.openTime,
    candle_acc_trade_price: parseFloat(binanceCandle.quoteAssetVolume),
    candle_acc_trade_volume: parseFloat(binanceCandle.volume),
    unit: 1, // 기본값
  };
};

export type { BinanceTickerData, BinanceCandleData, BinanceSymbolInfo };
