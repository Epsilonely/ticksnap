import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Scrollbar from '../common/Scrollbar';
import { upbitAccountApi, AccountBalance } from '../services/UpbitAccountApi';
import { binanceAccountApi, BinanceBalance, BinanceFuturesBalance } from '../services/BinanceAccountApi';
import { UnifiedCoinData } from '../services/DataManager';
import UpbitSvg from '../../public/img/UPBIT_SVG.svg';
import BinanceSvg from '../../public/img/BINANCE_SVG.svg';
import PriceDisplay from '../common/PriceDisplay';

const SVG_SIZE_CLASS = 'size-[22px]';

interface PortfolioItem {
  market: string;
  korean_name: string;
  balance: number;
  avg_buy_price: number;
  current_price: number;
  exchange: 'upbit' | 'binance' | 'binance-futures';
  unrealizedProfit?: number;
}

function Portfolio() {
  const { unifiedCoins } = useSelector((state: RootState) => state.coin);
  const [upbitPortfolio, setUpbitPortfolio] = useState<PortfolioItem[]>([]);
  const [binanceSpotPortfolio, setBinanceSpotPortfolio] = useState<PortfolioItem[]>([]);
  const [binanceFuturesPortfolio, setBinanceFuturesPortfolio] = useState<PortfolioItem[]>([]);
  const [upbitKRW, setUpbitKRW] = useState<number>(0);
  const [binanceSpotUSDT, setBinanceSpotUSDT] = useState<number>(0);
  const [binanceFuturesUSDT, setBinanceFuturesUSDT] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REST API로 주기적으로 자산 정보 가져오기
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        // 업비트 자산 조회
        const upbitAssets = await upbitAccountApi.getAccountsViaREST();
        console.log('📊 Portfolio: 업비트 자산 조회 완료', upbitAssets);

        // 원화 잔액 추출
        const krwAccount = upbitAssets.find((account) => account.currency === 'KRW');
        const krwBalance = krwAccount ? parseFloat(krwAccount.balance) : 0;
        setUpbitKRW(krwBalance);
        console.log('💰 업비트 원화 잔액:', krwBalance.toLocaleString(), '원');

        const upbitItems: PortfolioItem[] = upbitAssets
          .filter((account) => account.currency !== 'KRW' && parseFloat(account.balance) > 0)
          .map((account: AccountBalance) => {
            const market = `KRW-${account.currency}`;
            return {
              market,
              korean_name: account.currency,
              balance: parseFloat(account.balance),
              avg_buy_price: parseFloat(account.avg_buy_price),
              current_price: 0,
              exchange: 'upbit' as const,
            };
          });

        // 바이낸스 자산 조회
        const binanceAssets = await binanceAccountApi.getAccountsViaREST();
        console.log('📊 Portfolio: 바이낸스 자산 조회 완료', binanceAssets);
        console.log('📊 Portfolio: 바이낸스 원본 데이터 개수:', binanceAssets.length);

        // Spot USDT 잔액 추출
        const spotUsdtBalance = binanceAssets.find((balance) => balance.asset === 'USDT');
        const spotUsdtAmount = spotUsdtBalance ? parseFloat(spotUsdtBalance.free) + parseFloat(spotUsdtBalance.locked) : 0;
        setBinanceSpotUSDT(spotUsdtAmount);
        console.log('💰 바이낸스 Spot USDT 잔액:', spotUsdtAmount.toFixed(2), 'USDT');

        const binanceSpotItems: PortfolioItem[] = binanceAssets
          .filter((balance) => {
            const hasBalance = parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0;
            const isNotUSDT = balance.asset !== 'USDT';
            console.log(`🔍 바이낸스 필터링: ${balance.asset} - free: ${balance.free}, locked: ${balance.locked}, hasBalance: ${hasBalance}, isNotUSDT: ${isNotUSDT}`);
            return isNotUSDT && hasBalance;
          })
          .map((balance: BinanceBalance) => {
            const symbol = `${balance.asset}USDT`;
            const item = {
              market: symbol,
              korean_name: balance.asset,
              balance: parseFloat(balance.free) + parseFloat(balance.locked),
              avg_buy_price: 0, // 바이낸스는 평균 매수가 정보 없음
              current_price: 0,
              exchange: 'binance' as const,
            };
            console.log('✅ 바이낸스 포트폴리오 아이템 생성:', item);
            return item;
          });

        // 바이낸스 Futures 자산 조회
        const binanceFuturesAssets = await binanceAccountApi.getFuturesAccountsViaREST();
        console.log('📊 Portfolio: 바이낸스 Futures 자산 조회 완료', binanceFuturesAssets);

        // Futures USDT 잔액 추출
        const futuresUsdtBalance = binanceFuturesAssets.find((balance) => balance.asset === 'USDT');
        const futuresUsdtAmount = futuresUsdtBalance ? parseFloat(futuresUsdtBalance.walletBalance || '0') : 0;
        setBinanceFuturesUSDT(futuresUsdtAmount);
        console.log('💰 바이낸스 Futures USDT 잔액:', futuresUsdtAmount.toFixed(2), 'USDT');

        const binanceFuturesItems: PortfolioItem[] = binanceFuturesAssets
          .filter((balance) => {
            const hasBalance = parseFloat(balance.walletBalance || '0') > 0;
            const isNotUSDT = balance.asset !== 'USDT';
            return isNotUSDT && hasBalance;
          })
          .map((balance: BinanceFuturesBalance) => {
            const symbol = `${balance.asset}USDT`;
            return {
              market: symbol,
              korean_name: balance.asset,
              balance: parseFloat(balance.walletBalance || '0'),
              avg_buy_price: 0,
              current_price: 0,
              exchange: 'binance-futures' as const,
              unrealizedProfit: parseFloat(balance.unrealizedProfit || '0'),
            };
          });

        console.log('📊 Portfolio: 최종 바이낸스 Spot 아이템 개수:', binanceSpotItems.length);
        console.log('📊 Portfolio: 최종 바이낸스 Futures 아이템 개수:', binanceFuturesItems.length);
        console.log('📊 Portfolio: 최종 업비트 아이템 개수:', upbitItems.length);

        setUpbitPortfolio(upbitItems);
        setBinanceSpotPortfolio(binanceSpotItems);
        setBinanceFuturesPortfolio(binanceFuturesItems);
        setLoading(false);
      } catch (error) {
        console.error('자산 조회 실패:', error);
        setError('자산 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    // 즉시 1회 실행
    fetchAssets();

    // 30초마다 자산 정보 갱신
    const intervalId = setInterval(fetchAssets, 30000);

    // cleanup 함수: interval 정리
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 업비트 현재가 정보 업데이트
  const upbitWithCurrentPrice = upbitPortfolio.map((item) => {
    const coinInfo = unifiedCoins.find((coin: UnifiedCoinData) => coin.upbit?.symbol === item.market);
    return {
      ...item,
      korean_name: coinInfo?.name || item.korean_name,
      current_price: coinInfo?.upbit?.price || 0,
    };
  });

  // 바이낸스 Spot 현재가 정보 업데이트
  const binanceSpotWithCurrentPrice = binanceSpotPortfolio.map((item) => {
    const coinInfo = unifiedCoins.find((coin: UnifiedCoinData) => coin.binance?.symbol === item.market);
    return {
      ...item,
      korean_name: coinInfo?.name || item.korean_name,
      current_price: coinInfo?.binance?.price || 0,
    };
  });

  // 바이낸스 Futures 현재가 정보 업데이트
  const binanceFuturesWithCurrentPrice = binanceFuturesPortfolio.map((item) => {
    const coinInfo = unifiedCoins.find((coin: UnifiedCoinData) => coin.binance?.symbol === item.market);
    return {
      ...item,
      korean_name: coinInfo?.name || item.korean_name,
      current_price: coinInfo?.binance?.price || 0,
    };
  });

  // 업비트 총 자산 계산
  const upbitTotalValue = upbitWithCurrentPrice.reduce((total, item) => total + item.balance * item.current_price, 0);
  const upbitTotalInvestment = upbitWithCurrentPrice.reduce((total, item) => total + item.balance * item.avg_buy_price, 0);
  const upbitProfitLoss = upbitTotalValue - upbitTotalInvestment;
  const upbitProfitLossRate = upbitTotalInvestment > 0 ? (upbitProfitLoss / upbitTotalInvestment) * 100 : 0;

  // 바이낸스 Spot 총 자산 계산 (USDT 기준)
  const binanceSpotTotalValue = binanceSpotWithCurrentPrice.reduce((total, item) => total + item.balance * item.current_price, 0);

  // 바이낸스 Futures 총 자산 계산 (USDT 기준)
  const binanceFuturesTotalValue = binanceFuturesWithCurrentPrice.reduce((total, item) => total + item.balance * item.current_price, 0);
  const binanceFuturesTotalUnrealizedProfit = binanceFuturesWithCurrentPrice.reduce((total, item) => total + (item.unrealizedProfit || 0), 0);

  const binanceTotalValue = binanceSpotUSDT + binanceSpotTotalValue + binanceFuturesUSDT + binanceFuturesTotalValue;

  // USDT/KRW 환율 가져오기 (unifiedCoins에서 USDT 정보 추출)
  const usdtCoin = unifiedCoins.find((coin: UnifiedCoinData) => coin.coinSymbol === 'USDT');
  const usdtToKrw = usdtCoin?.upbit?.price || 0; // 업비트 USDT 현재가

  // 전체 총 자산 (업비트 KRW + 바이낸스 USDT를 KRW로 환산)
  const totalInvestment = upbitTotalInvestment;
  const totalProfitLoss = upbitProfitLoss;
  const totalProfitLossRate = upbitProfitLossRate;

  return (
    <div className="h-full bg-white tracking-normal">
      {/* 총 자산 요약 */}
      <div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col p-4 gap-2 bg-[#0F0F0F]">
            <div className="text-[12px] text-[#CCCCCC] font-light">Total Assets</div>
            {/* upbit */}
            <div className="flex gap-2 items-center">
              <div className={`${SVG_SIZE_CLASS} overflow-hidden`}>
                <img src={UpbitSvg} alt="upbit_svg" className="w-full h-full object-cover" />
              </div>
              <div className="flex text-[24px] font-medium items-center leading-[1] font-['Pretendard'] text-[#f5f5f5]">
                <PriceDisplay price={upbitKRW + upbitTotalValue} className="" decimalPlaces={3} />
              </div>
            </div>
            {/* binance all */}
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <div className={`${SVG_SIZE_CLASS} overflow-hidden`}>
                  <img src={BinanceSvg} alt="binance_svg" className="w-full h-full object-cover" />
                </div>
                <div className="flex text-[24px] font-medium items-center leading-[1] font-['Pretendard'] text-[#F5F5F5]">
                  <PriceDisplay price={binanceTotalValue} className="" decimalPlaces={6} />
                </div>
              </div>
              <div className="flex text-sm ml-[32px] font-['Pretendard'] text-[#8BA3D4]">
                ≈
                <PriceDisplay price={binanceTotalValue * usdtToKrw} className="" decimalPlaces={6} />
              </div>
            </div>
            <div className="flex w-full">
              {/* binance spot */}
              <div className="flex flex-1 flex-col font-['Pretendard']">
                <span className="text-[12px] text-[#cccccc] font-light">Spot</span>
                <PriceDisplay price={binanceSpotUSDT + binanceSpotTotalValue} className="font-medium text-[#F5F5F5]" decimalPlaces={6} />
              </div>
              {/* binance futures */}
              <div className="flex flex-1 flex-col font-['Pretendard']">
                <span className="text-[12px] text-[#cccccc] font-light">USDⓈ-M Futures</span>
                <PriceDisplay price={binanceFuturesUSDT + binanceFuturesTotalValue} className="font-medium text-[#F5F5F5]" decimalPlaces={6} />
              </div>
            </div>
          </div>
          <div className="bg-amber-400">
            <div className="text-sm text-gray-600">총 투자금</div>
            <div className="text-lg font-bold text-[#333]">{Math.floor(totalInvestment).toLocaleString()}원</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">손익</div>
            <div className={`text-lg font-bold ${totalProfitLoss >= 0 ? 'text-[#F84F71]' : 'text-[#3578FF]'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}
              {Math.floor(totalProfitLoss).toLocaleString()}원
              <div className="text-sm">
                ({totalProfitLossRate >= 0 ? '+' : ''}
                {totalProfitLossRate.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 보유 자산 목록 헤더 */}
      <div className="bg-[#444444] flex px-4 py-2 text-[11px] gap-2 text-[#ffffff] font-light border-b border-[#5C5C5C]">
        <div className="min-w-[120px]">코인명</div>
        <div className="min-w-[80px] text-right">보유수량</div>
        <div className="min-w-[100px] text-right">평균매수가</div>
        <div className="min-w-[100px] text-right">현재가</div>
        <div className="min-w-[100px] text-right">평가금액</div>
        <div className="min-w-[100px] text-right">손익률</div>
      </div>

      {/* 보유 자산 목록 */}
      <Scrollbar className="h-[calc(100%-140px)]">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <div>계좌 정보를 불러오는 중...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">⚠️ 오류</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        ) : upbitWithCurrentPrice.length === 0 && binanceSpotWithCurrentPrice.length === 0 && binanceFuturesWithCurrentPrice.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">보유 중인 자산이 없습니다.</div>
        ) : (
          <>
            {/* 업비트 자산 */}
            {upbitWithCurrentPrice.length > 0 && (
              <>
                <div className="bg-[#f0f0f0] px-4 py-2 font-semibold text-sm text-[#333] sticky top-0">업비트 (Upbit) - {upbitWithCurrentPrice.length}개 자산</div>
                {upbitWithCurrentPrice.map((item) => {
                  const evaluationAmount = item.balance * item.current_price;
                  const investmentAmount = item.balance * item.avg_buy_price;
                  const profitLoss = evaluationAmount - investmentAmount;
                  const profitLossRate = investmentAmount > 0 ? (profitLoss / investmentAmount) * 100 : 0;
                  const profitColor = profitLoss >= 0 ? 'text-[#F84F71]' : 'text-[#3578FF]';

                  return (
                    <div key={`upbit-${item.market}`} className="flex px-4 py-3 gap-2 border-b border-[rgba(225,225,225,0.4)] hover:bg-[#F2F2F2]">
                      <div className="min-w-[120px]">
                        <div className="font-semibold text-[#26262C]">{item.korean_name}</div>
                        {/* <div className="text-xs text-[#4C4C57]">{item.market}</div> */}
                      </div>

                      <div className="min-w-[80px] text-right">
                        <div className="font-medium">{item.balance.toLocaleString()}</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium">{Math.floor(item.avg_buy_price).toLocaleString()}원</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium">{Math.floor(item.current_price).toLocaleString()}원</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-bold">{Math.floor(evaluationAmount).toLocaleString()}원</div>
                      </div>

                      <div className={`min-w-[100px] text-right ${profitColor}`}>
                        <div className="font-bold">
                          {profitLoss >= 0 ? '+' : ''}
                          {Math.floor(profitLoss).toLocaleString()}원
                        </div>
                        <div className="text-sm">
                          ({profitLossRate >= 0 ? '+' : ''}
                          {profitLossRate.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* 바이낸스 Spot 자산 */}
            {binanceSpotWithCurrentPrice.length > 0 && (
              <>
                <div className="bg-[#f0f0f0] px-4 py-2 font-semibold text-sm text-[#333] sticky top-0">바이낸스 Spot (Binance Spot) - {binanceSpotWithCurrentPrice.length}개 자산</div>
                {binanceSpotWithCurrentPrice.map((item) => {
                  const evaluationAmount = item.balance * item.current_price;

                  return (
                    <div key={`binance-spot-${item.market}`} className="flex px-4 py-3 gap-2 border-b border-[rgba(225,225,225,0.4)] hover:bg-[#F2F2F2]">
                      <div className="min-w-[120px]">
                        <div className="font-semibold text-[#26262C]">{item.korean_name}</div>
                        <div className="text-xs text-[#4C4C57]">{item.market}</div>
                      </div>

                      <div className="min-w-[80px] text-right">
                        <div className="font-medium">{item.balance.toLocaleString()}</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium text-gray-400">-</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium">{item.current_price.toFixed(2)} USDT</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-bold">{evaluationAmount.toFixed(2)} USDT</div>
                      </div>

                      <div className="min-w-[100px] text-right text-gray-400">
                        <div className="font-medium text-sm">-</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* 바이낸스 Futures 자산 */}
            {binanceFuturesWithCurrentPrice.length > 0 && (
              <>
                <div className="bg-[#f0f0f0] px-4 py-2 font-semibold text-sm text-[#333] sticky top-0">
                  바이낸스 Futures (Binance Futures) - {binanceFuturesWithCurrentPrice.length}개 자산
                  <span className="ml-2 text-xs text-[#666]">
                    (미실현 손익: {binanceFuturesTotalUnrealizedProfit >= 0 ? '+' : ''}
                    {binanceFuturesTotalUnrealizedProfit.toFixed(2)} USDT)
                  </span>
                </div>
                {binanceFuturesWithCurrentPrice.map((item) => {
                  const evaluationAmount = item.balance * item.current_price;
                  const unrealizedProfit = item.unrealizedProfit || 0;
                  const profitColor = unrealizedProfit >= 0 ? 'text-[#F84F71]' : 'text-[#3578FF]';

                  return (
                    <div key={`binance-futures-${item.market}`} className="flex px-4 py-3 gap-2 border-b border-[rgba(225,225,225,0.4)] hover:bg-[#F2F2F2]">
                      <div className="min-w-[120px]">
                        <div className="font-semibold text-[#26262C]">{item.korean_name}</div>
                        <div className="text-xs text-[#4C4C57]">{item.market}</div>
                      </div>

                      <div className="min-w-[80px] text-right">
                        <div className="font-medium">{item.balance.toFixed(4)}</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium text-gray-400">-</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-medium">{item.current_price.toFixed(2)} USDT</div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <div className="font-bold">{evaluationAmount.toFixed(2)} USDT</div>
                      </div>

                      <div className={`min-w-[100px] text-right ${profitColor}`}>
                        <div className="font-bold text-sm">
                          미실현: {unrealizedProfit >= 0 ? '+' : ''}
                          {unrealizedProfit.toFixed(2)} USDT
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </Scrollbar>
    </div>
  );
}

export default Portfolio;
