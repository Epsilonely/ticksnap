export interface UpbitAPI {
  getAccounts: (accessKey: string, secretKey: string) => Promise<any>;
  getOrdersChance: (accessKey: string, secretKey: string, market: string) => Promise<any>;
}

export interface BinanceLoginAPI {
  login: () => Promise<{
    success: boolean;
    cookies?: any[];
    csrfToken?: string;
    bncUuid?: string;
    sessionExpiry?: number;
    sessionExpiryDate?: string;
    cookiesWithExpiry?: Array<{
      name: string;
      expires: number;
      expiresDate: string;
      remainingDays: number;
    }>;
    error?: string;
  }>;
  isLoggedIn: () => Promise<{
    success: boolean;
    isLoggedIn?: boolean;
    error?: string;
  }>;
  closeBrowser: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    upbitAPI: UpbitAPI;
    binanceLoginAPI: BinanceLoginAPI;
    versions: {
      node: () => string;
      chrome: () => string;
      electron: () => string;
    };
  }
}
