export interface UpbitAPI {
  getAccounts: (accessKey: string, secretKey: string) => Promise<any>;
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
