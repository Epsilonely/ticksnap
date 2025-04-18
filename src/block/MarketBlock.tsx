import { useState, useEffect, useRef } from 'react';
import { fetchMarkets, fetchTickers } from '../services/UpbitApi';
import Scrollbar from '../common/Scrollbar';

function MarketBlock() {
  const [markets, setMarkets] = useState<{ market: string; korean_name: string }[]>([]);
  const [tickers, setTikers] = useState<any[]>([]);
  const [prevTickers, setPrevTickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatingItems, setAnimatingItems] = useState<Record<string, string>>({});

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

  // 이전 가격 데이터를 저장하기 위한 ref
  const prevPricesRef = useRef<Record<string, number>>({});

  // 현재가 정보 가져오기
  const updateTickers = async () => {
    if (isTickerLoadingRef.current || markets.length === 0) return;

    isTickerLoadingRef.current = true;
    try {
      const marketCodes = markets.map((market) => market.market);
      const data = await fetchTickers(marketCodes);

      // 새로운 애니메이션 항목 초기화
      const newAnimatingItems: Record<string, string> = {};

      // 현재 가격 데이터를 저장할 객체
      const currentPrices: Record<string, number> = {};

      // 각 티커에 대해 가격 변화 확인
      data.forEach((ticker: any) => {
        const market = ticker.market;
        const currentPrice = Number(ticker.trade_price);

        // 현재 가격 저장
        currentPrices[market] = currentPrice;

        // 이전 가격이 있는 경우에만 비교
        if (market in prevPricesRef.current) {
          const prevPrice = prevPricesRef.current[market];

          // 가격이 실제로 변경되었는지 확인 (소수점 오차 고려)
          if (Math.abs(currentPrice - prevPrice) > 0.00001) {
            // 가격이 올랐는지 내렸는지 확인
            const animationClass = currentPrice > prevPrice ? 'price-up-animation' : 'price-down-animation';

            // 콘솔에 가격 변화 로깅 (디버깅용)
            // console.log(`${market}: ${prevPrice} -> ${currentPrice}, 차이: ${currentPrice - prevPrice}, ${animationClass}`);

            // 애니메이션 클래스 설정
            newAnimatingItems[market] = animationClass;

            // 애니메이션 종료 후 클래스 제거를 위한 타이머 설정
            setTimeout(() => {
              setAnimatingItems((prev) => {
                const updated = { ...prev };
                if (updated[market] === animationClass) {
                  delete updated[market];
                }
                return updated;
              });
            }, 200); // 애니메이션 지속 시간(0.2s)보다 약간 길게 설정
          }
        }
      });

      // 애니메이션 항목이 있는 경우에만 상태 업데이트
      if (Object.keys(newAnimatingItems).length > 0) {
        setAnimatingItems((prev) => {
          // 이전 애니메이션 항목과 새 항목을 병합하되, 중복되는 경우 새 항목으로 대체
          return { ...prev, ...newAnimatingItems };
        });
      }

      // 현재 가격을 이전 가격으로 저장
      prevPricesRef.current = currentPrices;

      // 티커 데이터 업데이트
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

  // 거래대금 가져오기 (원래 단위: 원)
  const getTradeVolume = (acc_trade_price_24h: number) => {
    if (!acc_trade_price_24h) return 0;
    return acc_trade_price_24h; // 원 단위
  };

  // 거래대금 포맷팅 (단위: 조, 억, 천만, 백만원)
  const formatTradeVolume = (volume: number) => {
    if (volume === 0) return { value: '0', unit: '원' };

    if (volume >= 1000000000000) {
      // 1조원 이상
      return { value: (volume / 1000000000000).toFixed(1), unit: '조' };
    } else if (volume >= 100000000) {
      // 1억원 이상
      return { value: (volume / 100000000).toFixed(1), unit: '억' };
    } else if (volume >= 10000000) {
      // 1천만원 이상
      return { value: (volume / 10000000).toFixed(1), unit: '천만' };
    } else if (volume >= 1000000) {
      // 1백만원 이상
      return { value: (volume / 1000000).toFixed(1), unit: '백만' };
    } else {
      return { value: volume.toFixed(0), unit: '원' };
    }
  };

  return (
    <div className="h-full overflow-hidden bg-[#333333] text-white">
      {/* 카테고리 */}
      <div className="bg-[#444444] flex px-3 py-0.5 text-[10.8px] gap-[24px] text-[#CCCCCC] border-b border-[#5C5C5C]">
        <div className="w-[200px] min-w-[200px] pl-[46px]">이름</div>
        <div className="w-[126px] min-w-[126px] text-right">현재가</div>
        <div className="w-[122px] min-w-[122px] text-right px-1">전일대비</div>
        <div className="w-[80px] min-w-[80px] text-right">거래대금</div>
      </div>

      <Scrollbar maxHeight="350px" className="h-[calc(100%-4rem)] text-[16px]">
        {combineData.map((item) => {
          // 가격 변동률 계산
          const changeRate = item.change === 'RISE' ? item.change_rate * 100 : item.change === 'FALL' ? -item.change_rate * 100 : 0;

          // 가격 변동에 따른 색상 설정
          const priceColor = item.change === 'RISE' ? 'text-[#F84F71]' : item.change === 'FALL' ? 'text-[#60A5FA]' : 'text-gray-300';

          // 거래대금 가져오기 (원 단위)
          const tradeVolume = getTradeVolume(item.acc_trade_price_24h);

          // 코인 아이콘 URL (실제로는 업비트 API에서 제공하지 않으므로 임의의 아이콘 사용)
          const coinIconUrl = `https://static.upbit.com/logos/${item.market.split('-')[1]}.png`;

          return (
            // 코인 리스트
            <div key={item.market} className="flex px-3 py-1.5 gap-[24px] border-b border-[rgba(92,92,92,0.7)] hover:bg-[rgba(92,92,92,0.3)]">
              <div className="flex items-center w-[200px] min-w-[200px] gap-[10px]">
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
                  <div className="font-bold text-[#F5F5F5]">{item.korean_name}</div>
                  <div className="font-extralight text-[#CCCCCC]">{item.market}</div>
                </div>
              </div>

              <div className="w-[126px] min-w-[126px] text-right items-start justify-end">
                <div className="flex justify-end items-end gap-[2px]">
                  <span className={`${priceColor} font-semibold`}>{item.trade_price?.toLocaleString() || '-'}</span>
                  <span className={`${priceColor} text-[11px] font-normal pb-0.5`}>KRW</span>
                </div>
              </div>

              <div className={`w-[122px] min-w-[122px] text-right px-1 ${animatingItems[item.market] || ''}`}>
                <div className={`${priceColor} font-light`}>{changeRate ? `${changeRate > 0 ? '▲' : '▼'} ${Math.abs(changeRate).toFixed(2)}%` : '-'}</div>
                <div className={`${priceColor} font-light`}>{item.change_price ? (item.change === 'RISE' ? '+' : item.change === 'FALL' ? '-' : '') + item.change_price.toLocaleString() : '-'}</div>
              </div>

              <div className="w-[80px] min-w-[80px] text-right">
                <div className="flex justify-end items-center">
                  {(() => {
                    const formatted = formatTradeVolume(tradeVolume);
                    return (
                      <>
                        <span className="text-[#F5F5F5] font-normal text-right">{formatted.value}</span>
                        <span className="text-[#F5F5F5] font-normal text-sm">{formatted.unit}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </Scrollbar>
    </div>
  );
}

export default MarketBlock;
