export interface UpbitAPI {
  getAccounts: (accessKey: string, secretKey: string) => Promise<any>;
  getOrdersChance: (accessKey: string, secretKey: string, market: string) => Promise<any>;
}

export interface BinanceQRLoginAPI {
  precheck: () => Promise<{
    success: boolean;
    data?: {
      sessionId: string;
      captchaType?: string;
      validateId?: string;
      validationTypes?: string[];
    };
    error?: string;
  }>;
  checkResult: (sessionId: string) => Promise<{
    success: boolean;
    data?: {
      sessionId: string;
    };
    error?: string;
  }>;
  getQRCode: (
    random: string,
    sessionId: string
  ) => Promise<{
    success: boolean;
    data?: {
      qrCode: string;
      originalQrCode: string;
    };
    error?: string;
  }>;
  queryStatus: (
    qrCode: string,
    random: string,
    sessionId: string
  ) => Promise<{
    success: boolean;
    data?: {
      status: 'NEW' | 'EXPIRED' | 'CONFIRMED' | 'SUCCESS';
      token?: string;
      code?: string;
      bncLocation?: string;
    };
    error?: string;
  }>;
  isLoggedIn: () => Promise<{
    success: boolean;
    isLoggedIn?: boolean;
    error?: string;
  }>;
  logout: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    upbitAPI: UpbitAPI;
    binanceQRLoginAPI: BinanceQRLoginAPI;
    versions: {
      node: () => string;
      chrome: () => string;
      electron: () => string;
    };
  }
}
