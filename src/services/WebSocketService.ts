export class UpbitWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private markets: string[] = [];
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  constructor(private onMessage: (data: any) => void) {}

  // 웹소켓 연결
  connect(markets: string[]) {
    // 이미 연결 중이면 중복 연결 방지
    if (this.isConnecting) {
      console.log('이미 웹소켓 연결 중입니다.');
      return;
    }

    this.isConnecting = true;
    this.markets = markets.map((market) => market.toUpperCase());

    // 이미 연결된 소켓이 있고 정상 상태면 재사용
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('기존 웹소켓 연결 사용');
      this.subscribe();
      this.isConnecting = false;
      return;
    }

    // 기존 소켓이 있지만 정상 상태가 아니면 닫기
    if (this.socket) {
      console.log('기존 웹소켓 연결 종료 후 재연결');
      this.socket.close();
    }

    // 업비트 웹소켓 연결
    this.socket = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      console.log('웹소켓 연결 성공');
      this.isConnecting = false;
      this.reconnectAttempts = 0; // 연결 성공 시 재연결 시도 횟수 초기화
      this.subscribe();
    };

    this.socket.onmessage = async (event) => {
      try {
        const text = new TextDecoder('utf-8').decode(event.data);
        console.log('수신된 데이터:', text);
        const data = JSON.parse(text);
        this.onMessage(data);
      } catch (error) {
        console.error('웹소켓 데이터 파싱 오류:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`웹소켓 연결 종료 (코드: ${event.code}, 이유: ${event.reason || '알 수 없음'})`);
      this.isConnecting = false;

      // 최대 재연결 시도 횟수를 초과하지 않았을 때만 재연결 시도
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`재연결 시도 ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.markets);
        }, this.reconnectDelay);
      } else {
        console.log('최대 재연결 시도 횟수 초과. 재연결을 중단합니다.');
      }
    };

    this.socket.onerror = (error) => {
      console.error('웹소켓 오류:', error);
    };
  }

  // 구독 메시지 전송
  private subscribe() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // 업비트 웹소켓 API 형식에 맞게 메시지 구성
    const message = JSON.stringify([
      { ticket: `UNIQUE_TICKET_${new Date().getTime()}` },
      {
        type: 'ticker',
        codes: this.markets,
        isOnlyRealtime: false,
      },
    ]);

    console.log('전송 메시지:', message);
    this.socket.send(message);
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

  // 구독 마켓 업데이트
  updateMarkets(markets: string[]) {
    const newMarkets = markets.map((market) => market.toUpperCase());

    // 마켓 목록이 변경되었는지 확인
    const marketsChanged = this.hasMarketsChanged(this.markets, newMarkets);

    if (!marketsChanged) {
      console.log('마켓 목록이 변경되지 않았습니다. 업데이트 생략');
      return;
    }

    console.log('마켓 목록 업데이트:', newMarkets);
    this.markets = newMarkets;

    // 소켓이 열려있으면 구독만 업데이트, 아니면 새로 연결
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.subscribe();
    } else if (!this.isConnecting) {
      // 연결 중이 아닐 때만 새로 연결 시도
      this.connect(newMarkets);
    }
  }

  // 마켓 목록 변경 여부 확인
  private hasMarketsChanged(oldMarkets: string[], newMarkets: string[]): boolean {
    if (oldMarkets.length !== newMarkets.length) {
      return true;
    }

    // 정렬 후 비교하여 내용이 같은지 확인
    const sortedOld = [...oldMarkets].sort();
    const sortedNew = [...newMarkets].sort();

    for (let i = 0; i < sortedOld.length; i++) {
      if (sortedOld[i] !== sortedNew[i]) {
        return true;
      }
    }

    return false;
  }
}

// 웹소켓 서비스 인스턴스 생성 및 내보내기
let websocketService: UpbitWebSocketService | null = null;

export const getWebSocketService = (onMessage: (data: any) => void) => {
  if (!websocketService) {
    websocketService = new UpbitWebSocketService(onMessage);
  }
  return websocketService;
};
