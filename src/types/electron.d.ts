export interface UpbitAPI {
  getAccounts: (accessKey: string, secretKey: string) => Promise<any>;
  getOrdersChance: (accessKey: string, secretKey: string, market: string) => Promise<any>;
}

declare global {
  interface Window {
    upbitAPI: UpbitAPI;
    versions: {
      node: () => string;
      chrome: () => string;
      electron: () => string;
    };
  }
}
