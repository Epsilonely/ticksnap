import { fetchMarkets as fetchUpbitMarkets, fetchTickers as fetchUpbitTickers } from './UpbitApi';
import { fetchBinanceMarkets, fetchBinanceTickers, convertBinanceTickerToUpbitFormat } from './BinanceApi';
import { AppDispatch } from '../store';
import { setUnifiedCoins } from '../store/slices/coinSlice';

// 통합 코인 데이터 타입
export interface UnifiedCoinData {
  coinSymbol: string; // BTC, ETH 등
  name: string;
  upbit?: {
    symbol: string;
    price: number;
    change: string;
    changeRate: number;
    changePrice: number;
    tradeVolume: number;
  };
  binance?: {
    symbol: string;
    price: number;
    change: string;
    changeRate: number;
    changePrice: number;
    tradeVolume: number;
  };
  maxTradeVolume: number;
}

// 심볼 매핑 정보
interface SymbolMapping {
  upbit?: string;
  binance?: string;
}

export class DataManager {
  private static instance: DataManager | null = null;

  // 데이터 저장
  private upbitMarkets: any[] = [];
  private binanceMarkets: any[] = [];
  private coinMapping: Map<string, SymbolMapping> = new Map();
  private unifiedCoins: UnifiedCoinData[] = [];

  // 타이머 및 웹소켓 관리
  private restApiInterval: NodeJS.Timeout | null = null;
  private upbitWebSocket: WebSocket | null = null;
  private binanceWebSocket: WebSocket | null = null;
  private favoriteCoins: string[] = [];

  // Redux store 참조
  private dispatch: AppDispatch | null = null;

  // 초기화 상태
  private isInitialized: boolean = false;
  private isUpdating: boolean = false;

  private constructor() {}

  // 싱글톤 인스턴스 가져오기
  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Redux dispatch 설정
  setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  // 초기화
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('DataManager 초기화 시작...');

      // 1. 마켓 정보 로드 및 매핑 생성
      await this.initializeMarkets();

      // 2. 초기 현재가 데이터 로드
      await this.loadInitialTickers();

      // 3. REST API 주기적 업데이트 시작
      this.startRestApiUpdates();

      this.isInitialized = true;
      console.log('DataManager 초기화 완료');
    } catch (error) {
      console.error('DataManager 초기화 실패:', error);
      throw error;
    }
  }

  // 마켓 정보 초기화 및 동적 매핑 생성
  private async initializeMarkets(): Promise<void> {
    try {
      console.log('마켓 정보 로드 중...');

      // 업비트와 바이낸스 마켓 정보 동시 가져오기
      const [upbitMarkets, binanceMarkets] = await Promise.all([fetchUpbitMarkets(), fetchBinanceMarkets()]);

      this.upbitMarkets = upbitMarkets;
      this.binanceMarkets = binanceMarkets;

      // 동적 매핑 생성
      this.createDynamicMapping();

      console.log(`매핑 완료: ${this.coinMapping.size}개 코인`);
    } catch (error) {
      console.error('마켓 정보 로드 실패:', error);
      throw error;
    }
  }

  // 동적 심볼 매핑 생성
  private createDynamicMapping(): void {
    this.coinMapping.clear();

    // 업비트 코인들 처리
    this.upbitMarkets.forEach((market) => {
      const coinSymbol = this.extractCoinSymbol(market.market);
      if (!this.coinMapping.has(coinSymbol)) {
        this.coinMapping.set(coinSymbol, {});
      }
      this.coinMapping.get(coinSymbol)!.upbit = market.market;
    });

    // 바이낸스 코인들 처리
    this.binanceMarkets.forEach((market) => {
      const coinSymbol = this.extractCoinSymbol(market.symbol);
      if (!this.coinMapping.has(coinSymbol)) {
        this.coinMapping.set(coinSymbol, {});
      }
      this.coinMapping.get(coinSymbol)!.binance = market.symbol;
    });
  }

  // 심볼에서 코인 이름 추출
  private extractCoinSymbol(symbol: string): string {
    if (symbol.startsWith('KRW-')) {
      return symbol.replace('KRW-', ''); // KRW-BTC → BTC
    }
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', ''); // BTCUSDT → BTC
    }
    return symbol;
  }

  // 초기 현재가 데이터 로드
  private async loadInitialTickers(): Promise<void> {
    try {
      console.log('초기 현재가 데이터 로드 중...');

      // 업비트 현재가 정보
      const upbitMarketCodes = this.upbitMarkets.map((market) => market.market);
      const upbitTickers = await fetchUpbitTickers(upbitMarketCodes);

      // 바이낸스 현재가 정보 (상위 100개만)
      const binanceSymbols = this.binanceMarkets.slice(0, 100).map((market) => market.symbol);
      const binanceTickersRaw = await fetchBinanceTickers(binanceSymbols);
      const binanceTickers = binanceTickersRaw.map(convertBinanceTickerToUpbitFormat);

      // 통합 데이터 생성
      this.createUnifiedData(upbitTickers, binanceTickers);

      // Redux store 업데이트
      this.updateReduxStore();

      console.log(`초기 데이터 로드 완료: ${this.unifiedCoins.length}개 코인`);
    } catch (error) {
      console.error('초기 현재가 데이터 로드 실패:', error);
    }
  }

  // 통합 데이터 생성
  private createUnifiedData(upbitTickers: any[], binanceTickers: any[]): void {
    this.unifiedCoins = [];

    // 각 코인별로 통합 데이터 생성
    this.coinMapping.forEach((mapping, coinSymbol) => {
      const upbitData = mapping.upbit ? upbitTickers.find((t) => t.market === mapping.upbit) : null;
      const binanceData = mapping.binance ? binanceTickers.find((t) => t.market === mapping.binance) : null;

      if (upbitData || binanceData) {
        const unifiedCoin: UnifiedCoinData = {
          coinSymbol,
          name: this.getCoinName(coinSymbol, upbitData, binanceData),
          maxTradeVolume: 0,
        };

        // 업비트 데이터 추가
        if (upbitData) {
          unifiedCoin.upbit = {
            symbol: upbitData.market,
            price: upbitData.trade_price,
            change: upbitData.change,
            changeRate: upbitData.change_rate,
            changePrice: upbitData.change_price,
            tradeVolume: upbitData.acc_trade_price_24h || upbitData.acc_trade_price,
          };
        }

        // 바이낸스 데이터 추가
        if (binanceData) {
          unifiedCoin.binance = {
            symbol: binanceData.market,
            price: binanceData.trade_price,
            change: binanceData.change,
            changeRate: binanceData.change_rate,
            changePrice: binanceData.change_price,
            tradeVolume: binanceData.acc_trade_price_24h || binanceData.acc_trade_price,
          };
        }

        // 최대 거래량 계산
        const upbitVolume = unifiedCoin.upbit?.tradeVolume || 0;
        const binanceVolume = unifiedCoin.binance?.tradeVolume || 0;
        unifiedCoin.maxTradeVolume = Math.max(upbitVolume, binanceVolume);

        this.unifiedCoins.push(unifiedCoin);
      }
    });

    // 거래량 순으로 정렬
    this.unifiedCoins.sort((a, b) => b.maxTradeVolume - a.maxTradeVolume);
  }

  // 코인 이름 가져오기
  private getCoinName(coinSymbol: string, upbitData?: any, binanceData?: any): string {
    if (upbitData) {
      const market = this.upbitMarkets.find((m) => m.market === upbitData.market);
      if (market) return market.korean_name;
    }
    return coinSymbol; // 기본값
  }

  // REST API 주기적 업데이트 시작 (1초에 1번 = 1000ms마다)
  private startRestApiUpdates(): void {
    if (this.restApiInterval) {
      clearInterval(this.restApiInterval);
    }

    this.restApiInterval = setInterval(async () => {
      if (!this.isUpdating) {
        this.isUpdating = true;
        await this.updateTickerData();
        this.isUpdating = false;
      }
    }, 1000); // 1000ms = 1초에 1번 (API 제한 고려)

    console.log('REST API 주기적 업데이트 시작 (1초 간격)');
  }

  // 현재가 데이터 업데이트
  private async updateTickerData(): Promise<void> {
    try {
      // 업비트 현재가 정보
      const upbitMarketCodes = this.upbitMarkets.map((market) => market.market);
      const upbitTickers = await fetchUpbitTickers(upbitMarketCodes);

      // 바이낸스 현재가 정보 (상위 100개만)
      const binanceSymbols = this.binanceMarkets.slice(0, 100).map((market) => market.symbol);
      const binanceTickersRaw = await fetchBinanceTickers(binanceSymbols);
      const binanceTickers = binanceTickersRaw.map(convertBinanceTickerToUpbitFormat);

      // 기존 데이터 업데이트
      this.updateUnifiedData(upbitTickers, binanceTickers);

      // Redux store 업데이트
      this.updateReduxStore();
    } catch (error) {
      console.error('현재가 데이터 업데이트 실패:', error);
    }
  }

  // 기존 통합 데이터 업데이트 (불변성 유지)
  private updateUnifiedData(upbitTickers: any[], binanceTickers: any[]): void {
    this.unifiedCoins = this.unifiedCoins.map((coin) => {
      const mapping = this.coinMapping.get(coin.coinSymbol);
      if (!mapping) return coin;

      // 관심 코인이고 웹소켓이 연결되어 있으면 REST API 업데이트 스킵
      const isFavorite = this.favoriteCoins.includes(coin.coinSymbol);
      const hasWebSocket = this.upbitWebSocket?.readyState === WebSocket.OPEN || this.binanceWebSocket?.readyState === WebSocket.OPEN;

      if (isFavorite && hasWebSocket) {
        return coin; // 웹소켓이 실시간 업데이트하므로 스킵
      }

      const updatedCoin = { ...coin };

      // 업비트 데이터 업데이트
      if (mapping.upbit) {
        const upbitData = upbitTickers.find((t) => t.market === mapping.upbit);
        if (upbitData && coin.upbit) {
          updatedCoin.upbit = {
            ...coin.upbit,
            price: upbitData.trade_price,
            change: upbitData.change,
            changeRate: upbitData.change_rate,
            changePrice: upbitData.change_price,
            tradeVolume: upbitData.acc_trade_price_24h || upbitData.acc_trade_price,
          };
        }
      }

      // 바이낸스 데이터 업데이트
      if (mapping.binance) {
        const binanceData = binanceTickers.find((t) => t.market === mapping.binance);
        if (binanceData && coin.binance) {
          updatedCoin.binance = {
            ...coin.binance,
            price: binanceData.trade_price,
            change: binanceData.change,
            changeRate: binanceData.change_rate,
            changePrice: binanceData.change_price,
            tradeVolume: binanceData.acc_trade_price_24h || binanceData.acc_trade_price,
          };
        }
      }

      // 최대 거래량 재계산
      const upbitVolume = updatedCoin.upbit?.tradeVolume || 0;
      const binanceVolume = updatedCoin.binance?.tradeVolume || 0;
      updatedCoin.maxTradeVolume = Math.max(upbitVolume, binanceVolume);

      return updatedCoin;
    });
  }

  // Redux store 업데이트
  private updateReduxStore(): void {
    if (this.dispatch) {
      this.dispatch(setUnifiedCoins([...this.unifiedCoins])); // 새로운 배열로 복사하여 불변성 유지
    }
  }

  // 관심 코인 업데이트 (웹소켓 연결용)
  updateFavoriteCoins(favoriteCoins: string[]): void {
    this.favoriteCoins = favoriteCoins;
    this.connectWebSockets();
  }

  // 웹소켓 연결 (관심 코인만)
  private connectWebSockets(): void {
    // 기존 웹소켓 연결 해제
    this.disconnectWebSockets();

    if (this.favoriteCoins.length === 0) return;

    // 관심 코인에 해당하는 심볼들 찾기
    const upbitSymbols: string[] = [];
    const binanceSymbols: string[] = [];

    this.favoriteCoins.forEach((coinSymbol) => {
      const mapping = this.coinMapping.get(coinSymbol);
      if (mapping?.upbit) upbitSymbols.push(mapping.upbit);
      if (mapping?.binance) binanceSymbols.push(mapping.binance);
    });

    // 업비트 웹소켓 연결
    if (upbitSymbols.length > 0) {
      this.connectUpbitWebSocket(upbitSymbols);
    }

    // 바이낸스 웹소켓 연결
    if (binanceSymbols.length > 0) {
      this.connectBinanceWebSocket(binanceSymbols);
    }

    console.log(`웹소켓 연결: 업비트 ${upbitSymbols.length}개, 바이낸스 ${binanceSymbols.length}개`);
  }

  // 업비트 웹소켓 연결
  private connectUpbitWebSocket(symbols: string[]): void {
    this.upbitWebSocket = new WebSocket('wss://api.upbit.com/websocket/v1');
    this.upbitWebSocket.binaryType = 'arraybuffer';

    this.upbitWebSocket.onopen = () => {
      console.log('업비트 웹소켓 연결됨');
      const message = JSON.stringify([
        { ticket: `TICKET_${Date.now()}` },
        {
          type: 'ticker',
          codes: symbols,
          isOnlyRealtime: true,
        },
      ]);
      this.upbitWebSocket?.send(message);
    };

    this.upbitWebSocket.onmessage = (event) => {
      try {
        const text = new TextDecoder('utf-8').decode(event.data);
        const data = JSON.parse(text);
        this.handleUpbitWebSocketData(data);
      } catch (error) {
        console.error('업비트 웹소켓 데이터 파싱 오류:', error);
      }
    };

    this.upbitWebSocket.onerror = (error) => {
      console.error('업비트 웹소켓 오류:', error);
    };

    this.upbitWebSocket.onclose = () => {
      console.log('업비트 웹소켓 연결 종료, 5초 후 재연결 시도...');
      setTimeout(() => {
        if (this.favoriteCoins.length > 0) {
          this.connectUpbitWebSocket(symbols);
        }
      }, 5000);
    };
  }

  // 바이낸스 웹소켓 연결 (멀티 스트림 방식)
  private connectBinanceWebSocket(symbols: string[]): void {
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    this.binanceWebSocket = new WebSocket(wsUrl);

    this.binanceWebSocket.onopen = () => {
      console.log('바이낸스 웹소켓 연결됨 (멀티 스트림)');
    };

    this.binanceWebSocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        // 멀티 스트림 응답 형식: { stream: "btcusdt@ticker", data: {...} }
        const data = response.data || response;
        this.handleBinanceWebSocketData(data);
      } catch (error) {
        console.error('바이낸스 웹소켓 데이터 파싱 오류:', error);
      }
    };

    this.binanceWebSocket.onerror = (error) => {
      console.error('바이낸스 웹소켓 오류:', error);
    };

    this.binanceWebSocket.onclose = () => {
      console.log('바이낸스 웹소켓 연결 종료, 5초 후 재연결 시도...');
      setTimeout(() => {
        if (this.favoriteCoins.length > 0) {
          this.connectBinanceWebSocket(symbols);
        }
      }, 5000);
    };
  }

  // 업비트 웹소켓 데이터 처리 (최적화: 해당 코인만 업데이트)
  private handleUpbitWebSocketData(data: any): void {
    if (data && data.code) {
      const coinSymbol = this.extractCoinSymbol(data.code);

      // 해당 코인의 인덱스 찾기
      const coinIndex = this.unifiedCoins.findIndex((coin) => coin.coinSymbol === coinSymbol);

      if (coinIndex !== -1 && this.unifiedCoins[coinIndex].upbit) {
        const coin = this.unifiedCoins[coinIndex];
        const upbitData = coin.upbit;

        if (!upbitData) return;

        // 새로운 배열 생성 (불변성 유지하되, 해당 코인만 업데이트)
        const updatedCoins = [...this.unifiedCoins];

        updatedCoins[coinIndex] = {
          ...coin,
          upbit: {
            symbol: upbitData.symbol,
            price: data.trade_price,
            change: data.change,
            changeRate: data.change_rate,
            changePrice: data.change_price,
            tradeVolume: data.acc_trade_price_24h || data.acc_trade_price,
          },
        };

        // 최대 거래량 재계산
        const upbitVolume = updatedCoins[coinIndex].upbit!.tradeVolume || 0;
        const binanceVolume = updatedCoins[coinIndex].binance?.tradeVolume || 0;
        updatedCoins[coinIndex].maxTradeVolume = Math.max(upbitVolume, binanceVolume);

        this.unifiedCoins = updatedCoins;

        // Redux 업데이트
        this.updateReduxStore();
      }
    }
  }

  // 바이낸스 웹소켓 데이터 처리 (최적화: 해당 코인만 업데이트)
  private handleBinanceWebSocketData(data: any): void {
    if (data && data.s) {
      const coinSymbol = this.extractCoinSymbol(data.s);
      const changeRate = parseFloat(data.P) / 100;
      const changePrice = parseFloat(data.p);

      // 해당 코인의 인덱스 찾기
      const coinIndex = this.unifiedCoins.findIndex((coin) => coin.coinSymbol === coinSymbol);

      if (coinIndex !== -1 && this.unifiedCoins[coinIndex].binance) {
        const coin = this.unifiedCoins[coinIndex];
        const binanceData = coin.binance;

        if (!binanceData) return;

        // 새로운 배열 생성 (불변성 유지하되, 해당 코인만 업데이트)
        const updatedCoins = [...this.unifiedCoins];

        updatedCoins[coinIndex] = {
          ...coin,
          binance: {
            symbol: binanceData.symbol,
            price: parseFloat(data.c),
            change: changePrice > 0 ? 'RISE' : changePrice < 0 ? 'FALL' : 'EVEN',
            changeRate: Math.abs(changeRate),
            changePrice: Math.abs(changePrice),
            tradeVolume: parseFloat(data.q),
          },
        };

        // 최대 거래량 재계산
        const upbitVolume = updatedCoins[coinIndex].upbit?.tradeVolume || 0;
        const binanceVolume = updatedCoins[coinIndex].binance!.tradeVolume || 0;
        updatedCoins[coinIndex].maxTradeVolume = Math.max(upbitVolume, binanceVolume);

        this.unifiedCoins = updatedCoins;

        // Redux 업데이트
        this.updateReduxStore();
      }
    }
  }

  // 웹소켓 연결 해제
  private disconnectWebSockets(): void {
    if (this.upbitWebSocket) {
      this.upbitWebSocket.close();
      this.upbitWebSocket = null;
    }
    if (this.binanceWebSocket) {
      this.binanceWebSocket.close();
      this.binanceWebSocket = null;
    }
  }

  // 통합 코인 데이터 가져오기
  getUnifiedCoins(): UnifiedCoinData[] {
    return this.unifiedCoins;
  }

  // 정리
  destroy(): void {
    if (this.restApiInterval) {
      clearInterval(this.restApiInterval);
      this.restApiInterval = null;
    }
    this.disconnectWebSockets();
    this.isInitialized = false;
    console.log('DataManager 정리 완료');
  }
}

// 싱글톤 인스턴스 내보내기
export const dataManager = DataManager.getInstance();
