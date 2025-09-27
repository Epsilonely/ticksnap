export class BinanceWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private symbols: string[] = [];
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  constructor(private onMessage: (data: any) => void) {}

  // 웹소켓 연결
  connect(symbols: string[]) {
    // 이미 연결 중이면 중복 연결 방지
    if (this.isConnecting) {
      console.log('이미 바인낸스 웹소켓 연결 중입니다.');
      return;
    }

    this.isConnecting = true;
    this.symbols = symbols.map((symbol) => symbol.toUpperCase());

    // 이미 연결된 소켓이 있고 정상 상태면 재사용
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('기존 바인낸스 웹소켓 연결 사용');
      this.subscribe();
      this.isConnecting = false;
      return;
    }

    // 기존 소켓이 있지만 정상 상태가 아니면 닫기
    if (this.socket) {
      console.log('기존 바인낸스 웹소켓 연결 종료 후 재연결');
      this.socket.close();
    }

    // 바인낸스 웹소켓 연결 - 개별 ticker 스트림 사용
    const streamNames = this.symbols.map((symbol) => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('바인낸스 웹소켓 연결 성공');
      this.isConnecting = false;
      this.reconnectAttempts = 0; // 연결 성공 시 재연결 시도 횟수 초기화
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('바인낸스 수신된 데이터:', data);

        // 바인낸스 ticker 데이터를 업비트 형식으로 변환
        const convertedData = this.convertBinanceTickerData(data);
        this.onMessage(convertedData);
      } catch (error) {
        console.error('바인낸스 웹소켓 데이터 파싱 오류:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`바인낸스 웹소켓 연결 종료 (코드: ${event.code}, 이유: ${event.reason || '알 수 없음'})`);
      this.isConnecting = false;

      // 최대 재연결 시도 횟수를 초과하지 않았을 때만 재연결 시도
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`바인낸스 재연결 시도 ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.symbols);
        }, this.reconnectDelay);
      } else {
        console.log('바인낸스 최대 재연결 시도 횟수 초과. 재연결을 중단합니다.');
      }
    };

    this.socket.onerror = (error) => {
      console.error('바인낸스 웹소켓 오류:', error);
    };
  }

  // 바인낸스 ticker 데이터를 업비트 형식으로 변환
  private convertBinanceTickerData(data: any) {
    if (!data || !data.s) return null;

    const changeRate = parseFloat(data.P) / 100; // 변화율 (%)
    const changePrice = parseFloat(data.p); // 변화량

    return {
      type: 'ticker',
      code: data.s, // 심볼 (BTCUSDT)
      trade_price: parseFloat(data.c), // 현재가
      prev_closing_price: parseFloat(data.x), // 이전 종가
      change: changePrice > 0 ? 'RISE' : changePrice < 0 ? 'FALL' : 'EVEN',
      change_price: Math.abs(changePrice),
      change_rate: Math.abs(changeRate),
      signed_change_rate: changeRate,
      acc_trade_price: parseFloat(data.q), // 24시간 거래대금
      acc_trade_price_24h: parseFloat(data.q),
      high_price: parseFloat(data.h), // 고가
      low_price: parseFloat(data.l), // 저가
      trade_volume: parseFloat(data.v), // 거래량
      timestamp: data.E, // 이벤트 시간
      exchange: 'binance', // 거래소 구분자 추가
    };
  }

  // 구독 메시지 전송 (바인낸스는 URL에서 스트림을 지정하므로 별도 구독 메시지 불필요)
  private subscribe() {
    // 바인낸스는 연결 시 URL에서 스트림을 지정하므로 별도 구독 메시지가 필요 없음
    console.log('바인낸스 웹소켓 구독 완료');
  }

  // 연결 종료
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 구독 심볼 업데이트
  updateSymbols(symbols: string[]) {
    const newSymbols = symbols.map((symbol) => symbol.toUpperCase());

    // 심볼 목록이 변경되었는지 확인
    const symbolsChanged = this.hasSymbolsChanged(this.symbols, newSymbols);

    if (!symbolsChanged) {
      console.log('바인낸스 심볼 목록이 변경되지 않았습니다. 업데이트 생략');
      return;
    }

    console.log('바인낸스 심볼 목록 업데이트:', newSymbols);
    this.symbols = newSymbols;

    // 바인낸스는 스트림 변경을 위해 재연결이 필요
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    if (!this.isConnecting) {
      this.connect(newSymbols);
    }
  }

  // 심볼 목록 변경 여부 확인
  private hasSymbolsChanged(oldSymbols: string[], newSymbols: string[]): boolean {
    if (oldSymbols.length !== newSymbols.length) {
      return true;
    }

    // 정렬 후 비교하여 내용이 같은지 확인
    const sortedOld = [...oldSymbols].sort();
    const sortedNew = [...newSymbols].sort();

    for (let i = 0; i < sortedOld.length; i++) {
      if (sortedOld[i] !== sortedNew[i]) {
        return true;
      }
    }

    return false;
  }
}

// 웹소켓 서비스 인스턴스 생성 및 내보내기
let binanceWebsocketService: BinanceWebSocketService | null = null;

export const getBinanceWebSocketService = (onMessage: (data: any) => void) => {
  if (!binanceWebsocketService) {
    binanceWebsocketService = new BinanceWebSocketService(onMessage);
  }
  return binanceWebsocketService;
};
