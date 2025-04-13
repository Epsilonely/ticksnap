import { useState, useEffect, useRef } from 'react';
import { fetchMarkets, fetchTickers } from '../services/UpbitApi';
import Scrollbar from '../common/Scrollbar';

function MarketBlock() {
  const [markets, setMarkets] = useState<{ market: string; korean_name: string }[]>([]);
  const [tickers, setTikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMarketLoadingRef = useRef(false);
  const isTickerLoadingRef = useRef(false);

  // 마켓 목록 가져오기
  const updateMarkets = async () => {
    if (isMarketLoadingRef.current) return;

    isMarketLoadingRef.current = true;
    try {
      const data = await fetchMarkets();
      setMarkets(data);
      if (loading && data.length > 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('마켓 목록 불러오기 실패:', error);
      setError('마켓 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      isMarketLoadingRef.current = false;
    }
  };

  // 현재가 정보 가져오기
  const updateTickers = async () => {
    if (isTickerLoadingRef.current || markets.length === 0) return;

    isTickerLoadingRef.current = true;
    try {
      const marketCodes = markets.map((market) => market.market);
      const data = await fetchTickers(marketCodes);
      setTikers(data);
      if (loading && data.length > 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('현재가 정보 가져오기 실패:', error);
      setError('현재가 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      isTickerLoadingRef.current = false;
    }
  };

  // 마켓 목록과 현재가 정보 합치기
  const combineData = markets.map((market) => {
    const ticker = tickers.find((t) => t.market === market.market);
    return {
      ...market,
      ...ticker,
    };
  });

  useEffect(() => {
    updateMarkets();

    const marketsIntervalId = setInterval(() => {
      updateMarkets();
    }, 30_000); // 30초마다 업데이트

    return () => clearInterval(marketsIntervalId);
  }, []);

  useEffect(() => {
    if (markets.length > 0) {
      updateTickers();

      const tickersIntervalId = setInterval(() => {
        updateTickers();
      }, 200); // 1초당 5번 호출

      return () => clearInterval(tickersIntervalId);
    }
  }, [markets]);

  // 거래대금 계산 (단위: 억원)
  const calculateTradeVolume = (price: number, volume: number) => {
    if (!price || !volume) return 0;
    return (price * volume) / 100000000; // 억 단위로 변환
  };

  return (
    <div className="h-full overflow-hidden bg-[#333333] text-white">
      <div className="flex justify-between items-center mb-2 px-3 py-2">
        <h2 className="text-lg font-bold">코인 시세</h2>
        {loading ? <span className="text-sm text-gray-400">로딩 중...</span> : error ? <span className="text-sm text-red-400">{error}</span> : <span className="text-sm text-gray-400">총 {markets.length}개</span>}
      </div>

      <div className="bg-[#444444] px-3 py-1 flex items-center text-xs text-gray-300 border-b border-gray-600">
        <div className="w-[180px] min-w-[180px] text-left">이름</div>
        <div className="flex-1 text-right">현재가</div>
        <div className="w-[100px] text-right">전일대비</div>
        <div className="w-[80px] text-right">거래대금</div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-4rem)]">
        {combineData.map((item) => {
          // 가격 변동률 계산
          const changeRate = item.change === 'RISE' ? item.change_rate * 100 : item.change === 'FALL' ? -item.change_rate * 100 : 0;

          // 가격 변동에 따른 색상 설정
          const priceColor = item.change === 'RISE' ? 'text-[#F84F71]' : item.change === 'FALL' ? 'text-[#60A5FA]' : 'text-gray-300';

          // 거래대금 계산 (억원)
          const tradeVolume = calculateTradeVolume(item.trade_price, item.acc_trade_price_24h);

          // 코인 아이콘 URL (실제로는 업비트 API에서 제공하지 않으므로 임의의 아이콘 사용)
          const coinIconUrl = `https://static.upbit.com/logos/${item.market.split('-')[1]}.png`;

          return (
            <div key={item.market} className="flex items-center py-[6px] px-3 border-b border-[rgba(92,92,92,0.7)] hover:bg-[rgba(92,92,92,0.3)]">
              <div className="flex items-center w-[180px] min-w-[180px] gap-[10px]">
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={coinIconUrl}
                    alt={item.korean_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 회색 배경으로 대체
                      (e.target as HTMLImageElement).style.backgroundColor = '#777';
                      (e.target as HTMLImageElement).style.display = 'block';
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-base text-[#F5F5F5]">{item.korean_name}</div>
                  <div className="font-extralight text-base text-[#CCCCCC]">{item.market}</div>
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="flex justify-end items-end gap-[2px]">
                  <span className={`${priceColor} font-semibold text-base`}>{item.trade_price?.toLocaleString() || '-'}</span>
                  <span className={`${priceColor} text-xs font-normal`}>KRW</span>
                </div>
              </div>

              <div className="w-[100px] text-right">
                <div className={`${priceColor} font-light text-base`}>{changeRate ? `${changeRate > 0 ? '▲' : '▼'} ${Math.abs(changeRate).toFixed(2)}%` : '-'}</div>
                <div className={`${priceColor} font-light text-base`}>{item.change_price ? (item.change_price > 0 ? '+' : '') + item.change_price.toLocaleString() : '-'}</div>
              </div>

              <div className="w-[80px] text-right">
                <div className="flex justify-end items-center">
                  <span className="text-[#F5F5F5] font-normal text-base text-right">{tradeVolume.toFixed(1)}</span>
                  <span className="text-[#F5F5F5] font-normal text-sm">억</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MarketBlock;
