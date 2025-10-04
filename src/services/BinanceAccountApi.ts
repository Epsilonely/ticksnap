import API_KEYS from '../../config.js';

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceFuturesBalance extends BinanceBalance {
  walletBalance?: string;
  unrealizedProfit?: string;
}

declare global {
  interface Window {
    binanceAPI: {
      getAccounts: (apiKey: string, apiSecret: string) => Promise<{ success: boolean; balances?: BinanceBalance[]; error?: string }>;
      getFuturesAccounts: (apiKey: string, apiSecret: string) => Promise<{ success: boolean; balances?: BinanceFuturesBalance[]; error?: string }>;
    };
  }
}

class BinanceAccountApi {
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = API_KEYS.BINAN_ACCESS_KEY;
    this.apiSecret = API_KEYS.BINAN_SECRTE_KEY;
  }

  // REST API로 Spot 자산 조회
  async getAccountsViaREST(): Promise<BinanceBalance[]> {
    try {
      if (window.binanceAPI) {
        const result = await window.binanceAPI.getAccounts(this.apiKey, this.apiSecret);
        if (result.success && result.balances) {
          console.log('✅ 바이낸스 Spot REST API로 자산 조회 성공:', result.balances.length, '개 항목');
          return result.balances;
        } else {
          throw new Error(result.error || 'Spot 자산 조회 실패');
        }
      } else {
        throw new Error('binanceAPI가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('❌ 바이낸스 Spot REST API 자산 조회 실패:', error);
      return [];
    }
  }

  // REST API로 Futures 자산 조회
  async getFuturesAccountsViaREST(): Promise<BinanceFuturesBalance[]> {
    try {
      if (window.binanceAPI && window.binanceAPI.getFuturesAccounts) {
        const result = await window.binanceAPI.getFuturesAccounts(this.apiKey, this.apiSecret);
        if (result.success && result.balances) {
          console.log('✅ 바이낸스 Futures REST API로 자산 조회 성공:', result.balances.length, '개 항목');
          return result.balances;
        } else {
          throw new Error(result.error || 'Futures 자산 조회 실패');
        }
      } else {
        throw new Error('binanceAPI.getFuturesAccounts가 사용 불가능합니다.');
      }
    } catch (error) {
      console.error('❌ 바이낸스 Futures REST API 자산 조회 실패:', error);
      return [];
    }
  }
}

export const binanceAccountApi = new BinanceAccountApi();
