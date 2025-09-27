import { fetchMarkets as fetchUpbitMarkets, fetchTickers as fetchUpbitTickers } from './UpbitApi';
import { fetchBinanceMarkets, fetchBinanceTickers, convertBinanceTickerToUpbitFormat } from './BinanceApi';
import { matchSymbols, combineExchangeData, UnifiedCoinData } from '../utils/symbolMatcher';

export class UnifiedExchangeService {
  private upbitMarkets: any[] = [];
  private binanceMarkets: any[] = [];
  private matchingResult: any = null;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 30000; // 30초

  // 마켓 정보 초기화 및 매칭
  async initializeMarkets(): Promise<void> {
    try {
      console.log('거래소 마켓 정보 초기화 시작...');

      // 업비트와 바인낸스 마켓 정보 동시 가져오기
      const [upbitMarkets, binanceMarkets] = await Promise.all([fetchUpbitMarkets(), fetchBinanceMarkets()]);

      this.upbitMarkets = upbitMarkets;
      this.binanceMarkets = binanceMarkets;

      // 심볼 매칭 수행
      this.matchingResult = matchSymbols(upbitMarkets, binanceMarkets);

      console.log('매칭 결과:', {
        matched: this.matchingResult.matched.length,
        upbitOnly: this.matchingResult.upbitOnly.length,
        binanceOnly: this.matchingResult.binanceOnly.length,
      });

      this.lastUpdateTime = Date.now();
    } catch (error) {
      console.error('마켓 정보 초기화 실패:', error);
      throw error;
    }
  }

  // 통합 현재가 정보 가져오기
  async getUnifiedTickers(): Promise<UnifiedCoinData[]> {
    try {
      // 마켓 정보가 없거나 오래된 경우 재초기화
      if (!this.matchingResult || Date.now() - this.lastUpdateTime > this.updateInterval) {
        await this.initializeMarkets();
      }

      // 업비트 현재가 정보 가져오기
      const upbitMarketCodes = this.upbitMarkets.map((market) => market.market);
      const upbitTickers = await fetchUpbitTickers(upbitMarketCodes);

      // 바인낸스 현재가 정보 가져오기 (매칭된 심볼들만)
      const binanceSymbols = [
        ...this.matchingResult.matched.map((pair: any) => pair.binance),
        ...this.matchingResult.binanceOnly.slice(0, 50).map((item: any) => item.binance), // 상위 50개만
      ];

      const binanceTickersRaw = await fetchBinanceTickers(binanceSymbols);

      // 바인낸스 데이터를 업비트 형식으로 변환
      const binanceTickers = binanceTickersRaw.map(convertBinanceTickerToUpbitFormat);

      // 데이터 통합
      const unifiedData = combineExchangeData(this.matchingResult.matched, this.matchingResult.upbitOnly, this.matchingResult.binanceOnly, upbitTickers, binanceTickers);

      return unifiedData;
    } catch (error) {
      console.error('통합 현재가 정보 가져오기 실패:', error);
      return [];
    }
  }

  // 웹소켓용 심볼 목록 가져오기
  getWebSocketSymbols(): { upbit: string[]; binance: string[] } {
    if (!this.matchingResult) {
      return { upbit: [], binance: [] };
    }

    const upbitSymbols = [...this.matchingResult.matched.map((pair: any) => pair.upbit), ...this.matchingResult.upbitOnly.map((item: any) => item.upbit)];

    const binanceSymbols = [
      ...this.matchingResult.matched.map((pair: any) => pair.binance),
      ...this.matchingResult.binanceOnly.slice(0, 50).map((item: any) => item.binance), // 상위 50개만
    ];

    return {
      upbit: upbitSymbols,
      binance: binanceSymbols,
    };
  }

  // 매칭 결과 가져오기
  getMatchingResult() {
    return this.matchingResult;
  }

  // 특정 코인의 통합 정보 가져오기
  getCoinInfo(coinSymbol: string): any {
    if (!this.matchingResult) return null;

    // 매칭된 코인에서 찾기
    const matchedCoin = this.matchingResult.matched.find((pair: any) => pair.coin === coinSymbol);
    if (matchedCoin) return matchedCoin;

    // 업비트 전용 코인에서 찾기
    const upbitCoin = this.matchingResult.upbitOnly.find((item: any) => item.coin === coinSymbol);
    if (upbitCoin) return { ...upbitCoin, binance: null };

    // 바인낸스 전용 코인에서 찾기
    const binanceCoin = this.matchingResult.binanceOnly.find((item: any) => item.coin === coinSymbol);
    if (binanceCoin) return { ...binanceCoin, upbit: null, name: coinSymbol };

    return null;
  }

  // 강제 업데이트
  async forceUpdate(): Promise<void> {
    this.lastUpdateTime = 0; // 강제로 오래된 것으로 만들기
    await this.initializeMarkets();
  }
}

// 싱글톤 인스턴스
let unifiedExchangeService: UnifiedExchangeService | null = null;

export const getUnifiedExchangeService = (): UnifiedExchangeService => {
  if (!unifiedExchangeService) {
    unifiedExchangeService = new UnifiedExchangeService();
  }
  return unifiedExchangeService;
};
