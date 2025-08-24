import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchMarketsAsync, fetchTickersAsync, selectCoin } from '../store/slices/coinSlice';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import { fetchMarkets, fetchTickers } from '../services/UpbitApi';
import Scrollbar from '../common/Scrollbar';

function MarketBlock() {
  const dispatch = useDispatch<AppDispatch>();
  const { markets, tickers, loading, error } = useSelector((state: RootState) => state.coin);
  const favorites = useSelector((state: RootState) => state.favorite.favorites);
  const [animatingItems, setAnimatingItems] = useState<Record<string, string>>({});

  // 마켓 목록 가져오기
  useEffect(() => {
    dispatch(fetchMarketsAsync());

    const marketsIntervalId = setInterval(() => {
      dispatch(fetchMarketsAsync());
    }, 30_000); // 30초마다 업데이트

    return () => clearInterval(marketsIntervalId);
  }, [dispatch]);

  // 이전 가격 데이터를 저장하기 위한 ref
  const prevPricesRef = useRef<Record<string, number>>({});

  // 현재가 정보 가져오기
  useEffect(() => {
    if (markets.length > 0) {
      const marketCodes = markets.map((markets) => markets.market);
      dispatch(fetchTickersAsync(marketCodes));

      const tickersIntervalId = setInterval(() => {
        dispatch(fetchTickersAsync(marketCodes));
      }, 200); // 1초당 5번 호출

      return () => clearInterval(tickersIntervalId);
    }
  }, [markets, dispatch]);

  // 가격 변동 감지 및 애니메이션 처리
  useEffect(() => {
    if (tickers.length === 0) return;

    const newAnimatingItems: Record<string, string> = {};

    const currentPrices: Record<string, number> = {};

    tickers.forEach((ticker: any) => {
      const market = ticker.market;
      const currentPrice = Number(ticker.trade_price);

      currentPrices[market] = currentPrice;

      if (market in prevPricesRef.current) {
        const prevPrice = prevPricesRef.current[market];

        if (Math.abs(currentPrice - prevPrice) > 0.00001) {
          const animationClass = currentPrice > prevPrice ? 'price-up-animation' : 'price-down-animation';

          newAnimatingItems[market] = animationClass;

          setTimeout(() => {
            setAnimatingItems((prev) => {
              const updated = { ...prev };
              if (updated[market] === animationClass) {
                delete updated[market];
              }
              return updated;
            });
          }, 200); // 애니메이션 지속 시간 (0.2s)보다 약간 길게 설정
        }
      }
    });

    // 애니메이션 항목이 있는 경우에만 상태 업데이트
    if (Object.keys(newAnimatingItems).length > 0) {
      setAnimatingItems((prev) => {
        return { ...prev, ...newAnimatingItems };
      });
    }

    prevPricesRef.current = currentPrices;
  }, [tickers]);

  // 마켓 목록과 현재가 정보 합치기
  const combineData = markets.map((market) => {
    const ticker = tickers.find((t) => t.market === market.market);
    return {
      ...market,
      ...ticker,
    };
  });

  // 코인 선택 핸들러
  const handleSelectCoin = (market: string) => {
    dispatch(selectCoin(market));
  };

  // 즐겨찾기 토클 핸들러
  const handleToggleFavorite = (e: React.MouseEvent, market: string) => {
    e.stopPropagation(); // 이벤트 버블링 방지ㅣ
    dispatch(toggleFavorite(market));
  };

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
    <div className="h-full overflow-hidden bg-[#ffffff]">
      {/* 카테고리 */}
      <div className="bg-[#444444] flex px-4 py-0.5 text-[11px] gap-2 text-[#ffffff] font-light border-b border-[#5C5C5C]">
        <div className="min-w-[154px]">이름</div>
        <div className="min-w-[94px] text-right">현재가 (KRW)</div>
        <div className="min-w-[100px] text-right px-1">전일대비</div>
        <div className="min-w-[82px] text-right">거래대금</div>
      </div>

      <Scrollbar className="h-[calc(100%-1rem)] text-[14px]">
        {combineData
          .sort((a, b) => b.acc_trade_price_24h - a.acc_trade_price_24h)
          .map((item) => {
            // 가격 변동률 계산
            const changeRate = item.change === 'RISE' ? item.change_rate * 100 : item.change === 'FALL' ? -item.change_rate * 100 : 0;

            // 가격 변동에 따른 색상 설정
            const priceColor = item.change === 'RISE' ? 'text-[#F84F71]' : item.change === 'FALL' ? 'text-[#3578FF]' : 'text-gray-300';

            // 거래대금 가져오기 (원 단위)
            const tradeVolume = getTradeVolume(item.acc_trade_price_24h);

            // 즐겨찾기 여부 확인
            const isFavorite = favorites.includes(item.market);

            // 코인 아이콘 URL (실제로는 업비트 API에서 제공하지 않으므로 임의의 아이콘 사용)
            const coinIconUrl = `https://static.upbit.com/logos/${item.market.split('-')[1]}.png`;

            return (
              // 코인 리스트
              <div key={item.market} className="flex px-4 py-1 gap-2 border-b border-[rgba(225,225,225,0.4)] hover:bg-[#F2F2F2] cursor-pointer" onClick={() => handleSelectCoin(item.market)}>
                <div className="flex items-center min-w-[154px]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[16px] h-[16px] rounded-full overflow-hidden flex-shrink-0">
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
                      <div className="font-semibold text-[#26262C] leading-1">{item.korean_name}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="font-light text-[12.5px] text-[#4C4C57] leading-3.5">{item.market}</div>
                      {isFavorite && (
                        <div
                          className="ml-1.5 w-[10px] h-[10px] rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #59B3FB 0%, #47EF1D 70%, #FAD0C4 100%)',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-w-[94px] text-right items-start justify-end">
                  <span className={`${priceColor} font-bold`}>{item.trade_price?.toLocaleString() || '-'}</span>
                </div>

                <div className={`min-w-[100px] text-right px-1 ${animatingItems[item.market] || ''}`}>
                  <div className={`${priceColor} font-normal`}>{changeRate ? `${changeRate > 0 ? '▲' : '▼'} ${Math.abs(changeRate).toFixed(2)}%` : '-'}</div>
                  <div className={`${priceColor} font-light`}>{item.change_price ? (item.change === 'RISE' ? '+' : item.change === 'FALL' ? '-' : '') + item.change_price.toLocaleString() : '-'}</div>
                </div>

                <div className="min-w-[82px] text-right">
                  <div className="flex justify-end items-center">
                    {(() => {
                      const formatted = formatTradeVolume(tradeVolume);
                      return (
                        <>
                          <span className="text-[#555555] font-medium text-right">{formatted.value}</span>
                          <span className="text-[#555555] font-normal text-sm">{formatted.unit}</span>
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
