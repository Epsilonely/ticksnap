import puppeteer from 'puppeteer';

export class BinanceLoginService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookies = [];
    this.csrfToken = '';
    this.bncUuid = '';
  }

  /**
   * 수동 로그인 - 사용자가 브라우저에서 직접 구글 계정으로 로그인
   */
  async loginManual() {
    try {
      console.log('🚀 Puppeteer 브라우저 실행 중...');

      // 브라우저 실행 (UI 보이게)
      this.browser = await puppeteer.launch({
        headless: false, // UI 표시
        defaultViewport: null,
        args: ['--window-size=1200,900', '--window-position=100,100', '--disable-blink-features=AutomationControlled'],
      });

      this.page = await this.browser.newPage();

      // User-Agent 설정 (일반 브라우저처럼 보이게)
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      console.log('🌐 바이낸스 로그인 페이지로 이동 중...');

      // 로그인 페이지로 이동
      await this.page.goto('https://www.binance.com/en/login', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      console.log('🔐 브라우저에서 구글 로그인을 진행하세요...');
      console.log('⏳ 로그인 완료를 기다리는 중... (최대 5분)');

      // 로그인 완료 대기 (URL 변경 감지)
      await this.page.waitForFunction(
        () => {
          const url = window.location.href;
          // 로그인 완료 시 URL이 변경됨
          return url.includes('/en/my') || url.includes('/futures') || url.includes('/dashboard') || url.includes('/activity') || (!url.includes('/login') && !url.includes('/register'));
        },
        { timeout: 300000 } // 5분 대기
      );

      console.log('✅ 로그인 감지됨! 쿠키 추출 중...');

      // 쿠키 추출
      this.cookies = await this.page.cookies();

      // 중요한 쿠키 값 추출
      this.csrfToken = this.cookies.find((c) => c.name === 'csrftoken')?.value || '';
      this.bncUuid = this.cookies.find((c) => c.name === 'bnc-uuid')?.value || '';

      // 쿠키 만료 시간 분석
      const cookiesWithExpiry = this.cookies
        .filter((c) => c.expires && c.expires > 0)
        .map((c) => ({
          name: c.name,
          expires: c.expires,
          expiresDate: new Date(c.expires * 1000).toLocaleString('ko-KR'),
          remainingDays: Math.floor((c.expires * 1000 - Date.now()) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a, b) => a.expires - b.expires);

      // 가장 빨리 만료되는 쿠키 찾기
      const earliestExpiry = cookiesWithExpiry[0];
      const sessionExpiry = earliestExpiry ? earliestExpiry.expires * 1000 : Date.now() + 24 * 60 * 60 * 1000;

      console.log('📦 쿠키 저장 완료');
      console.log(`   - CSRF Token: ${this.csrfToken ? '✓' : '✗'}`);
      console.log(`   - BNC-UUID: ${this.bncUuid ? '✓' : '✗'}`);
      console.log(`   - 총 쿠키 수: ${this.cookies.length}`);
      console.log(`   - 만료 정보가 있는 쿠키: ${cookiesWithExpiry.length}개`);

      if (earliestExpiry) {
        console.log('\n⏰ 세션 만료 정보:');
        console.log(`   - 가장 빨리 만료되는 쿠키: ${earliestExpiry.name}`);
        console.log(`   - 만료 시간: ${earliestExpiry.expiresDate}`);
        console.log(`   - 남은 기간: 약 ${earliestExpiry.remainingDays}일`);
      }

      // 주요 쿠키들의 만료 시간 출력
      console.log('\n📋 주요 쿠키 만료 시간:');
      const importantCookies = ['csrftoken', 'bnc-uuid', 'logined', 'p20t', 'd1og'];
      importantCookies.forEach((name) => {
        const cookie = cookiesWithExpiry.find((c) => c.name === name);
        if (cookie) {
          console.log(`   - ${name}: ${cookie.expiresDate} (${cookie.remainingDays}일 남음)`);
        }
      });

      // 브라우저 닫기
      await this.browser.close();
      this.browser = null;
      this.page = null;

      console.log('\n✅ 로그인 완료!');

      return {
        success: true,
        cookies: this.cookies,
        csrfToken: this.csrfToken,
        bncUuid: this.bncUuid,
        sessionExpiry: sessionExpiry,
        sessionExpiryDate: new Date(sessionExpiry).toLocaleString('ko-KR'),
        cookiesWithExpiry: cookiesWithExpiry,
      };
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);

      // 브라우저가 열려있으면 닫기
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 저장된 쿠키 가져오기
   */
  getCookies() {
    return this.cookies;
  }

  /**
   * CSRF 토큰 가져오기
   */
  getCsrfToken() {
    return this.csrfToken;
  }

  /**
   * BNC-UUID 가져오기
   */
  getBncUuid() {
    return this.bncUuid;
  }

  /**
   * 로그인 상태 확인
   */
  isLoggedIn() {
    // 쿠키가 있고, 중요한 인증 쿠키 중 하나라도 있으면 로그인 상태로 판단
    if (this.cookies.length === 0) {
      return false;
    }

    // 중요한 인증 관련 쿠키들 확인
    const hasAuthCookie = this.cookies.some((c) => c.name === 'logined');

    return hasAuthCookie;
  }

  /**
   * 브라우저 강제 종료
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
