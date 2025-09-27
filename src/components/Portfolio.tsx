import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Scrollbar from '../common/Scrollbar';
import { upbitAccountApi, AccountBalance } from '../services/UpbitAccountApi';

interface PortfolioItem {
  market: string;
  korean_name: string;
  balance: number;
  avg_buy_price: number;
  current_price: number;
}

function Portfolio() {
  const { tickers, markets } = useSelector((state: RootState) => state.coin);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 업비트 계좌 정보 가져오기
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setError(null);

        const accounts = await upbitAccountApi.getAccounts();

        // KRW가 아닌 자산만 필터링하고 잔고가 0이 아닌 것만
        const cryptoAccounts = accounts.filter((account) => account.currency !== 'KRW' && parseFloat(account.balance) > 0);

        const portfolioItems: PortfolioItem[] = cryptoAccounts.map((account) => {
          const market = `KRW-${account.currency}`;
          const marketInfo = markets.find((m) => m.market === market);

          return {
            market,
            korean_name: marketInfo?.korean_name || account.currency,
            balance: parseFloat(account.balance),
            avg_buy_price: parseFloat(account.avg_buy_price),
            current_price: 0, // 현재가는 아래에서 업데이트
          };
        });

        setPortfolioData(portfolioItems);
      } catch (err) {
        console.error('계좌 정보 조회 실패:', err);
        setError('계좌 정보를 불러오는데 실패했습니다. API 키를 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    if (markets.length > 0) {
      fetchAccountData();
    }
  }, [markets]);

  // 현재가 정보 업데이트
  const portfolioWithCurrentPrice = portfolioData.map((item) => {
    const ticker = tickers.find((t) => t.market === item.market);
    return {
      ...item,
      current_price: ticker?.trade_price || 0,
    };
  });

  // 총 자산 계산
  const totalAssetValue = portfolioWithCurrentPrice.reduce((total, item) => {
    return total + item.balance * item.current_price;
  }, 0);

  const totalInvestment = portfolioWithCurrentPrice.reduce((total, item) => {
    return total + item.balance * item.avg_buy_price;
  }, 0);

  const totalProfitLoss = totalAssetValue - totalInvestment;
  const totalProfitLossRate = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  return (
    <div className="h-full bg-white">
      {/* 총 자산 요약 */}
      <div className="p-4 bg-[#f8f9fa] border-b border-[#e9ecef]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">총 자산</div>
            <div className="text-lg font-bold text-[#333]">{Math.floor(totalAssetValue).toLocaleString()}원</div>
          </div>
          <div>
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
        ) : portfolioWithCurrentPrice.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">보유 중인 자산이 없습니다.</div>
        ) : (
          portfolioWithCurrentPrice.map((item) => {
            const evaluationAmount = item.balance * item.current_price;
            const investmentAmount = item.balance * item.avg_buy_price;
            const profitLoss = evaluationAmount - investmentAmount;
            const profitLossRate = investmentAmount > 0 ? (profitLoss / investmentAmount) * 100 : 0;

            const profitColor = profitLoss >= 0 ? 'text-[#F84F71]' : 'text-[#3578FF]';

            return (
              <div key={item.market} className="flex px-4 py-3 gap-2 border-b border-[rgba(225,225,225,0.4)] hover:bg-[#F2F2F2]">
                <div className="min-w-[120px]">
                  <div className="font-semibold text-[#26262C]">{item.korean_name}</div>
                  <div className="text-xs text-[#4C4C57]">{item.market}</div>
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
          })
        )}
      </Scrollbar>
    </div>
  );
}

export default Portfolio;
