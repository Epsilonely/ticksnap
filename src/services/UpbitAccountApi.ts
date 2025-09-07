import API_KEYS from '../../config.js';

export interface AccountBalance {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

class UpbitAccountApi {
  private accessKey: string;
  private secretKey: string;

  constructor() {
    this.accessKey = API_KEYS.UPBIT_ACCESS_KEY;
    this.secretKey = API_KEYS.UPBIT_SECRET_KEY;
  }

  async getAccounts(): Promise<AccountBalance[]> {
    try {
      // Electron의 IPC를 통해 메인 프로세스에서 API 호출
      if (window.upbitAPI) {
        const data = await window.upbitAPI.getAccounts(this.accessKey, this.secretKey);
        return data;
      } else {
        throw new Error('Electron API가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('계좌 조회 실패:', error);
      throw error;
    }
  }

  async getOrdersChance(market: string): Promise<any> {
    try {
      // Electron의 IPC를 통해 메인 프로세스에서 API 호출
      if (window.upbitAPI) {
        const data = await window.upbitAPI.getOrdersChance(this.accessKey, this.secretKey, market);
        return data;
      } else {
        throw new Error('Electron API가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('주문 가능 정보 조회 실패:', error);
      throw error;
    }
  }
}

export const upbitAccountApi = new UpbitAccountApi();
