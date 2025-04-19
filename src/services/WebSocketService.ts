// 업비트 웹소켓 서비스
export class UpbitWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private markets: string[] = [];

  constructor(private onMessage: (data: any) => void) {}

  // 웹소켓 연결
  connect(markets: string[]) {
    this.markets = markets;

    if (this.socket) {
      this.socket.close();
    }

    // 업비트 웹소켓 연결
    this.socket = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.socket.onopen = () => {
      console.log('웹소켓 연결 성공');
      this.sendPingMessage();
      this.subscribe();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.socket.onclose = () => {
      console.log('웹소켓 연결 종료');
      // 재연결 시도
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      this.reconnectTimer = setTimeout(() => this.connect(this.markets), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('웹소켓 오류:', error);
    };
  }

  // 구독 메시지 전송
  private subscribe() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const message = JSON.stringify([
      { ticket: 'UNIQUE_TICKET' },
      {
        type: 'ticker',
        codes: this.markets,
        isOnlyRealtime: true,
      },
    ]);

    this.socket.send(message);
  }

  // 연결 유지를 위한 ping 메시지
  private sendPingMessage() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const message = JSON.stringify({ type: 'ping' });
    this.socket.send(message);

    // 30초마다 ping 메시지 전송
    setTimeout(() => this.sendPingMessage(), 30000);
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
    this.markets = markets;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.subscribe();
    } else {
      this.connect(markets);
    }
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
