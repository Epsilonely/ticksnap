import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchUnifiedCoinsAsync, selectCoin, updateUnifiedCoinData } from '../store/slices/coinSlice';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import { getWebSocketService } from '../services/WebSocketService';
import { getBinanceWebSocketService } from '../services/BinanceWebSocketService';
import { getUnifiedExchangeService } from '../services/UnifiedExchangeService';
import { extractCoinSymbol } from '../utils/symbolMatcher';
import Scrollbar from '../common/Scrollbar';
import ExchangePriceDisplay from '../components/ExchangePriceDisplay';

type FilterTab = 'all' | 'favorites' | 'holdings';

function MarketBlock() {
  const dispatch = useDispatch<AppDispatch>();
  const { unifiedCoins, loading, error } = useSelector((state: RootState) => state.coin);
  const favorites = useSelector((state: RootState) => state.favorite.favorites);
  const [animatingItems, setAnimatingItems] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // 통합 거래소 데이터 가져오기
  useEffect(() => {
    dispatch(fetchUnifiedCoinsAsync());

    const intervalId = setInterval(() => {
      dispatch(fetchUnifiedCoinsAsync());
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // 웹소켓 연결 설정
  useEffect(() => {
    if (unifiedCoins.length === 0) return;

    const unifiedService = getUnifiedExchangeService();
    const symbols = unifiedService.getWebSocketSymbols();

    // 업비트 웹소켓 연결
    if (symbols.upbit.length > 0) {
      const upbitWs = getWebSocketService((data) => {
        if (data && data.code) {
          const coinSymbol = extractCoinSymbol(data.code);
          dispatch(
            updateUnifiedCoinData({
              coinSymbol,
              data,
              exchange: 'upbit',
            })
          );
        }
      });
      upbitWs.connect(symbols.upbit);
    }

    // 바인낸스 웹소켓 연결
    if (symbols.binance.length > 0) {
      const binanceWs = getBinanceWebSocketService((data) => {
        if (data && data.code) {
          const coinSymbol = data.code.replace('USDT', '');
          dispatch(
            updateUnifiedCoinData({
              coinSymbol,
              data,
              exchange: 'binance',
            })
          );
        }
      });
      binanceWs.connect(symbols.binance);
    }

    return () => {
      // 컴포넌트 언마운트 시 웹소켓 연결 해제
      const upbitWs = getWebSocketService(() => {});
      const binanceWs = getBinanceWebSocketService(() => {});
      upbitWs.disconnect();
      binanceWs.disconnect();
    };
  }, [unifiedCoins, dispatch]);

  // 탭별 데이터 필터링
  const getFilteredData = () => {
    switch (activeTab) {
      case 'favorites':
        return unifiedCoins.filter((coin) => favorites.includes(coin.upbit?.symbol || '') || favorites.includes(coin.binance?.symbol || ''));
      case 'holdings':
        // 보유 코인 기능은 아직 개발되지 않았으므로 빈 배열 반환
        return [];
      case 'all':
      default:
        return unifiedCoins;
    }
  };

  const filteredData = getFilteredData();

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
      {/* 필터링 탭 */}
      <div className="flex bg-[#f8f9fa] border-b border-[#e9ecef]">
        <button className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-[#333] border-b-2 border-[#007bff]' : 'text-[#666] hover:text-[#333] hover:bg-[#f1f3f4]'}`} onClick={() => setActiveTab('all')}>
          전체
        </button>
        <button className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-white text-[#333] border-b-2 border-[#007bff]' : 'text-[#666] hover:text-[#333] hover:bg-[#f1f3f4]'}`} onClick={() => setActiveTab('favorites')}>
          관심
        </button>
        <button className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'holdings' ? 'bg-white text-[#333] border-b-2 border-[#007bff]' : 'text-[#666] hover:text-[#333] hover:bg-[#f1f3f4]'}`} onClick={() => setActiveTab('holdings')}>
          보유
        </button>
      </div>

      {/* 카테고리 헤더 */}
      <div className="bg-[#444444] flex px-2.5 py-1 text-[11px] gap-2 text-[#ffffff] font-light border-b border-[#5C5C5C]">
        <div className="min-w-[154px]">이름</div>
        <div className="min-w-[104px]">현재가</div>
        <div>전일대비</div>
      </div>

      <Scrollbar className="h-[calc(100%-1rem)] text-[14px]">
        {filteredData.length === 0 && activeTab === 'holdings' ? (
          <div className="flex items-center justify-center h-32 text-gray-500">보유 코인 기능은 아직 개발 중입니다.</div>
        ) : filteredData.length === 0 && activeTab === 'favorites' ? (
          <div className="flex items-center justify-center h-32 text-gray-500">관심 등록된 코인이 없습니다.</div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">데이터를 불러오는 중...</div>
        ) : (
          [...filteredData]
            .sort((a, b) => b.maxTradeVolume - a.maxTradeVolume)
            .map((coin) => {
              // 즐겨찾기 여부 확인 (업비트 또는 바인낸스 심볼 중 하나라도 즐겨찾기에 있으면)
              const isFavorite = favorites.includes(coin.upbit?.symbol || '') || favorites.includes(coin.binance?.symbol || '');

              // 코인 아이콘 URL
              const coinIconUrl = `https://static.upbit.com/logos/${coin.coinSymbol}.png`;

              // 선택할 심볼 (업비트 우선, 없으면 바인낸스)
              const selectSymbol = coin.upbit?.symbol || coin.binance?.symbol || coin.coinSymbol;

              return (
                <div key={coin.coinSymbol} className="flex px-2.5 py-1.5 gap-2 border-b border-[rgba(225,225,225,0.8)] hover:bg-[#F2F2F2] cursor-pointer" onClick={() => handleSelectCoin(selectSymbol)}>
                  {/* 코인 정보 */}
                  <div className="flex items-center min-w-[154px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[16px] h-[16px] rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={coinIconUrl}
                            alt={coin.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.backgroundColor = '#777';
                              (e.target as HTMLImageElement).style.display = 'block';
                              (e.target as HTMLImageElement).src = '';
                            }}
                          />
                        </div>
                        <div className="font-semibold text-[14px] text-[#26262C]">{coin.name}</div>
                      </div>
                      <div className="flex items-center">
                        <div className="font-light text-[14px] text-[#4C4C57]">{coin.coinSymbol}</div>
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

                  {/* 가격 정보 */}
                  <div className="flex-1 flex flex-col gap-1">
                    {/* 업비트 가격 */}
                    {coin.upbit && <ExchangePriceDisplay exchange="upbit" price={coin.upbit.price} change={coin.upbit.change} changeRate={coin.upbit.changeRate} />}

                    {/* 바인낸스 가격 */}
                    {coin.binance && <ExchangePriceDisplay exchange="binance" price={coin.binance.price} change={coin.binance.change} changeRate={coin.binance.changeRate} currency="$" />}
                  </div>
                </div>
              );
            })
        )}
      </Scrollbar>
    </div>
  );
}

export default MarketBlock;
