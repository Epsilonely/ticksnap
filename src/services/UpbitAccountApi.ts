import API_KEYS from '../../config.js';

export interface AccountBalance {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

type AssetUpdateCallback = (assets: AccountBalance[]) => void;

declare global {
  interface Window {
    privateWebSocketAPI: {
      connect: (accessKey: string, secretKey: string) => Promise<{success: boolean, error?: string}>;
      disconnect: () => Promise<{success: boolean, error?: string}>;
      getCurrentAssets: () => Promise<{success: boolean, assets?: AccountBalance[], error?: string}>;
      onAssetUpdate: (callback: (assets: AccountBalance[]) => void) => void;
      offAssetUpdate: (callback: (assets: AccountBalance[]) => void) => void;
    };
  }
}

class UpbitAccountApi {
  private accessKey: string;
  private secretKey: string;
  private assetUpdateCallbacks: AssetUpdateCallback[] = [];
  private isConnected: boolean = false;

  constructor() {
    this.accessKey = API_KEYS.UPBIT_ACCESS_KEY;
    this.secretKey = API_KEYS.UPBIT_SECRET_KEY;
  }

  // 프라이빗 웹소켓 연결 (메인 프로세스를 통해)
  async connectPrivateWebSocket(): Promise<void> {
    if (this.isConnected) {
      console.log('프라이빗 웹소켓이 이미 연결되어 있습니다.');
      return;
    }

    try {
      if (window.privateWebSocketAPI) {
        const result = await window.privateWebSocketAPI.connect(this.accessKey, this.secretKey);
        
        if (result.success) {
          console.log('🔒 프라이빗 웹소켓 연결 성공 (IPC)');
          this.isConnected = true;
          
          // 메인 프로세스에서 오는 자산 업데이트 리스너 등록
          window.privateWebSocketAPI.onAssetUpdate(this.handleAssetUpdate.bind(this));
        } else {
          throw new Error(result.error || '웹소켓 연결 실패');
        }
      } else {
        throw new Error('privateWebSocketAPI가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('프라이빗 웹소켓 연결 실패:', error);
      throw error;
    }
  }

  // 메인 프로세스에서 오는 자산 업데이트 처리
  private handleAssetUpdate(assets: AccountBalance[]): void {
    console.log('📊 Portfolio: 실시간 자산 업데이트 받음 (IPC)', assets);
    
    // 콜백 함수들 호출
    this.assetUpdateCallbacks.forEach(callback => {
      callback([...assets]);
    });
  }

  // 자산 업데이트 콜백 등록
  onAssetUpdate(callback: AssetUpdateCallback): void {
    this.assetUpdateCallbacks.push(callback);
  }

  // 자산 업데이트 콜백 제거
  offAssetUpdate(callback: AssetUpdateCallback): void {
    const index = this.assetUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.assetUpdateCallbacks.splice(index, 1);
    }
  }

  // 현재 자산 정보 반환 (메인 프로세스에서 가져옴)
  async getCurrentAssets(): Promise<AccountBalance[]> {
    try {
      if (window.privateWebSocketAPI) {
        const result = await window.privateWebSocketAPI.getCurrentAssets();
        if (result.success) {
          return result.assets || [];
        } else {
          throw new Error(result.error || '자산 조회 실패');
        }
      } else {
        throw new Error('privateWebSocketAPI가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('자산 조회 실패:', error);
      return [];
    }
  }

  // 웹소켓 연결 해제 (메인 프로세스를 통해)
  async disconnectPrivateWebSocket(): Promise<void> {
    try {
      if (window.privateWebSocketAPI && this.isConnected) {
        const result = await window.privateWebSocketAPI.disconnect();
        if (result.success) {
          console.log('프라이빗 웹소켓 수동 연결 해제 (IPC)');
          this.isConnected = false;
        } else {
          throw new Error(result.error || '웹소켓 해제 실패');
        }
      }
    } catch (error) {
      console.error('프라이빗 웹소켓 해제 실패:', error);
    }
  }
}

export const upbitAccountApi = new UpbitAccountApi();
