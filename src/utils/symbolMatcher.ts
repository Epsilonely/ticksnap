import { BinanceSymbolInfo } from '../services/BinanceApi';

// 업비트 심볼에서 코인 심볼 추출
export const extractCoinSymbol = (upbitSymbol: string): string => {
  return upbitSymbol.replace('KRW-', ''); // 'KRW-BTC' → 'BTC'
};

// 바인낸스에서 해당 코인의 USDT 페어 찾기
export const findBinanceSymbol = (coinSymbol: string, binanceSymbols: BinanceSymbolInfo[]): string | null => {
  const targetSymbol = `${coinSymbol}USDT`;
  const found = binanceSymbols.find((symbol) => symbol.symbol === targetSymbol);
  return found ? found.symbol : null;
};

// 업비트와 바인낸스 심볼 자동 매칭
export const matchSymbols = (upbitMarkets: any[], binanceMarkets: BinanceSymbolInfo[]) => {
  const matchedPairs: Array<{
    coin: string;
    upbit: string;
    binance: string;
    name: string;
  }> = [];

  const unmatchedUpbit: Array<{
    coin: string;
    upbit: string;
    name: string;
  }> = [];

  const unmatchedBinance: Array<{
    coin: string;
    binance: string;
  }> = [];

  // 업비트 마켓을 기준으로 매칭 시도
  upbitMarkets.forEach((upbitMarket) => {
    const coinSymbol = extractCoinSymbol(upbitMarket.market);
    const binanceSymbol = findBinanceSymbol(coinSymbol, binanceMarkets);

    if (binanceSymbol) {
      matchedPairs.push({
        coin: coinSymbol,
        upbit: upbitMarket.market,
        binance: binanceSymbol,
        name: upbitMarket.korean_name,
      });
    } else {
      unmatchedUpbit.push({
        coin: coinSymbol,
        upbit: upbitMarket.market,
        name: upbitMarket.korean_name,
      });
    }
  });

  // 바인낸스에만 있는 코인들 찾기
  const matchedBinanceSymbols = new Set(matchedPairs.map((pair) => pair.binance));
  binanceMarkets.forEach((binanceMarket) => {
    if (!matchedBinanceSymbols.has(binanceMarket.symbol)) {
      const coinSymbol = binanceMarket.baseAsset;
      unmatchedBinance.push({
        coin: coinSymbol,
        binance: binanceMarket.symbol,
      });
    }
  });

  return {
    matched: matchedPairs,
    upbitOnly: unmatchedUpbit,
    binanceOnly: unmatchedBinance,
  };
};

// 통합 코인 데이터 인터페이스
export interface UnifiedCoinData {
  coinSymbol: string; // 'BTC'
  name: string; // '비트코인'
  maxTradeVolume: number; // 두 거래소 중 높은 거래량
  upbit?: {
    symbol: string;
    price: number;
    change: 'RISE' | 'FALL' | 'EVEN';
    changeRate: number;
    changePrice: number;
    tradeVolume: number;
  };
  binance?: {
    symbol: string;
    price: number;
    change: 'RISE' | 'FALL' | 'EVEN';
    changeRate: number;
    changePrice: number;
    tradeVolume: number;
  };
}

// 업비트와 바인낸스 데이터를 통합
export const combineExchangeData = (
  matchedPairs: Array<{
    coin: string;
    upbit: string;
    binance: string;
    name: string;
  }>,
  upbitOnly: Array<{
    coin: string;
    upbit: string;
    name: string;
  }>,
  binanceOnly: Array<{
    coin: string;
    binance: string;
  }>,
  upbitTickers: any[],
  binanceTickers: any[]
): UnifiedCoinData[] => {
  const unifiedData: UnifiedCoinData[] = [];

  // 매칭된 코인들 처리
  matchedPairs.forEach((pair) => {
    const upbitTicker = upbitTickers.find((t) => t.market === pair.upbit);
    const binanceTicker = binanceTickers.find((t) => t.market === pair.binance);

    const upbitVolume = upbitTicker?.acc_trade_price_24h || 0;
    const binanceVolume = binanceTicker?.acc_trade_price || 0;

    const unified: UnifiedCoinData = {
      coinSymbol: pair.coin,
      name: pair.name,
      maxTradeVolume: Math.max(upbitVolume, binanceVolume),
      upbit: upbitTicker
        ? {
            symbol: upbitTicker.market,
            price: upbitTicker.trade_price,
            change: upbitTicker.change,
            changeRate: upbitTicker.change_rate,
            changePrice: upbitTicker.change_price,
            tradeVolume: upbitTicker.acc_trade_price_24h,
          }
        : undefined,
      binance: binanceTicker
        ? {
            symbol: binanceTicker.market,
            price: binanceTicker.trade_price,
            change: binanceTicker.change,
            changeRate: binanceTicker.change_rate,
            changePrice: binanceTicker.change_price,
            tradeVolume: binanceTicker.acc_trade_price,
          }
        : undefined,
    };

    unifiedData.push(unified);
  });

  // 업비트에만 있는 코인들 처리
  upbitOnly.forEach((upbitCoin) => {
    const upbitTicker = upbitTickers.find((t) => t.market === upbitCoin.upbit);

    if (upbitTicker) {
      const unified: UnifiedCoinData = {
        coinSymbol: upbitCoin.coin,
        name: upbitCoin.name,
        maxTradeVolume: upbitTicker.acc_trade_price_24h || 0,
        upbit: {
          symbol: upbitTicker.market,
          price: upbitTicker.trade_price,
          change: upbitTicker.change,
          changeRate: upbitTicker.change_rate,
          changePrice: upbitTicker.change_price,
          tradeVolume: upbitTicker.acc_trade_price_24h,
        },
      };

      unifiedData.push(unified);
    }
  });

  // 바인낸스에만 있는 코인들 처리 (상위 거래량만)
  binanceOnly
    .map((binanceCoin) => {
      const binanceTicker = binanceTickers.find((t) => t.market === binanceCoin.binance);
      return { ...binanceCoin, ticker: binanceTicker };
    })
    .filter((item) => item.ticker && item.ticker.acc_trade_price > 1000000) // 거래대금 100만 USDT 이상만
    .sort((a, b) => b.ticker.acc_trade_price - a.ticker.acc_trade_price)
    .slice(0, 50) // 상위 50개만
    .forEach((item) => {
      const unified: UnifiedCoinData = {
        coinSymbol: item.coin,
        name: item.coin, // 바인낸스는 한글명이 없으므로 심볼 사용
        maxTradeVolume: item.ticker.acc_trade_price,
        binance: {
          symbol: item.ticker.market,
          price: item.ticker.trade_price,
          change: item.ticker.change,
          changeRate: item.ticker.change_rate,
          changePrice: item.ticker.change_price,
          tradeVolume: item.ticker.acc_trade_price,
        },
      };

      unifiedData.push(unified);
    });

  // 최대 거래량 기준으로 정렬
  return unifiedData.sort((a, b) => b.maxTradeVolume - a.maxTradeVolume);
};
