import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import { fetchCandlesAsync, setSelectedInterval, addTickData, clearTickData } from '../store/slices/coinSlice';
import MiniChart from '../components/MiniChart';

function CoinDetailBlock() {
  const dispatch = useDispatch();
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const markets = useSelector((state: RootState) => state.coin.markets);
  const coinData = useSelector((state: RootState) => state.coin.webSocketData);
  const candleData = useSelector((state: RootState) => state.coin.candleData);
  const selectedInterval = useSelector((state: RootState) => state.coin.selectedInterval);
  const tickData = useSelector((state: RootState) => state.coin.tickData);
  const favorites = useSelector((state: RootState) => state.favorite.favorites);

  // 현재 선택된 코인이 즐겨찾기에 있는지 확인
  const isFavorite = selectedCoin ? favorites.includes(selectedCoin) : false;

  // 갱신 주기 설정 함수
  const getUpdateInterval = (interval: string) => {
    switch (interval) {
      case '1':
        return 60000; // 1분마다
      case '5':
        return 300000; // 5분마다
      case '15':
        return 900000; // 15분마다
      case '1hour':
        return 3600000; // 1시간마다
      case '4hour':
        return 14400000; // 4시간마다
      case 'day':
        return 3600000; // 1시간마다 (일봉은 자주 갱신 필요 없음)
      case 'week':
        return 86400000; // 1일마다 (주봉은 더 적게 갱신)
      default:
        return 60000;
    }
  };

  // 코인 선택 시 캔들 데이터 조회
  useEffect(() => {
    if (selectedCoin) {
      dispatch(fetchCandlesAsync({ market: selectedCoin, interval: selectedInterval }) as any);
    }
  }, [selectedCoin, selectedInterval, dispatch]);

  // 웹소켓 데이터로 틱 데이터 업데이트
  useEffect(() => {
    if (coinData && selectedCoin && coinData.code === selectedCoin && selectedInterval === 'tick') {
      const newTickData = {
        timestamp: Date.now(),
        price: coinData.trade_price,
        change: coinData.change,
        volume: coinData.trade_volume,
      };
      dispatch(addTickData(newTickData));
    }
  }, [coinData, selectedCoin, selectedInterval, dispatch]);

  // 코인 변경 시 틱 데이터 초기화
  useEffect(() => {
    if (selectedCoin) {
      dispatch(clearTickData());
    }
  }, [selectedCoin, dispatch]);

  // 시간 간격에 따른 캔들 데이터 갱신
  useEffect(() => {
    if (!selectedCoin || selectedInterval === 'tick') return;

    const interval = setInterval(() => {
      dispatch(fetchCandlesAsync({ market: selectedCoin, interval: selectedInterval }) as any);
    }, getUpdateInterval(selectedInterval)); // 시간 간격에 따른 갱신

    return () => clearInterval(interval);
  }, [selectedCoin, selectedInterval, dispatch]);

  // 즐겨찾기 토글 핸들러
  const handleToggleFavorite = () => {
    if (selectedCoin) {
      dispatch(toggleFavorite(selectedCoin));
    }
  };

  if (!selectedCoin) {
    return (
      <div className="h-full flex items-center justify-center bg-[#333333] text-white rounded-md">
        <p>코인을 선택해주세요.</p>
      </div>
    );
  }

  const selectedCoinInfo = markets.find((market) => market.market === selectedCoin);

  // 선택된 코인과 웹소켓 데이터의 코인 코드가 일치하는지 확인
  const isCorrectCoinData = coinData && coinData.code === selectedCoin;

  return (
    <div className="h-full bg-[#F2F2F2] text-[#26262C] p-4">
      <div className="flex justify-between items-center mb-4">
        <div className='flex items-center gap-2'>
        <h2 className="text-[20px] font-bold">
          {selectedCoinInfo?.korean_name}
        </h2>
        <div className='text-[14px]'>{selectedCoin}</div>
        </div>
        <button onClick={handleToggleFavorite} className={`px-3 py-1.5 rounded-md text-sm font-medium ${isFavorite ? 'bg-[#4C4C57] text-[#FFFFFF]  hover:bg-[#26262C]' : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'}`}>
          {isFavorite ? '관심 해제' : '관심 등록'}
        </button>
      </div>

      <div className=' flex gap-2 text-[32px] font-black text-[#4C4C57]'>
        <div>
          {coinData.trade_price?.toLocaleString()}
        </div>
        <div>
          {coinData.change}
        </div>
        <div>
          {Math.abs(coinData.change_rate*100).toFixed(2)}"
        </div>
        <div>
          {coinData.change_price?.toLocaleString()}
        </div>
      </div>

      {isCorrectCoinData ? (
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-[#FFFFFF] p-3 rounded-md border-1 border-[#CCCCCC]">
            <h3 className="text-lg mb-3">거래 분석</h3>

            {/* 매수/매도 비율 바 */}
            <div className="mb-4">
              <div className="relative mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#F84F71]">매수</span>
                  <span className="text-sm font-medium text-[#3578FF]">매도</span>
                </div>

                {/* 거래 신호를 가운데 위치 */}
                {(() => {
                  const bidVolume = coinData.acc_bid_volume || 0;
                  const askVolume = coinData.acc_ask_volume || 0;
                  const totalVolume = bidVolume + askVolume;
                  const bidRatio = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50;
                  const askRatio = totalVolume > 0 ? (askVolume / totalVolume) * 100 : 50;

                  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{bidRatio > 60 ? <span className="text-[#F84F71] font-bold text-xs bg-white/90 px-2 py-1 rounded shadow-sm">🔥 강한 매수 압력</span> : bidRatio > 55 ? <span className="text-[#F84F71] font-medium text-xs bg-white/90 px-2 py-1 rounded shadow-sm">📈 매수 우세</span> : askRatio > 60 ? <span className="text-[#3578FF] font-bold text-xs bg-white/90 px-2 py-1 rounded shadow-sm">❄️ 강한 매도 압력</span> : askRatio > 55 ? <span className="text-[#3578FF] font-medium text-xs bg-white/90 px-2 py-1 rounded shadow-sm">📉 매도 우세</span> : <span className="text-gray-600 font-medium text-xs bg-white/90 px-2 py-1 rounded shadow-sm">⚖️ 균형 상태</span>}</div>;
                })()}
              </div>

              {(() => {
                const bidVolume = coinData.acc_bid_volume || 0;
                const askVolume = coinData.acc_ask_volume || 0;
                const totalVolume = bidVolume + askVolume;
                const bidRatio = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50;
                const askRatio = totalVolume > 0 ? (askVolume / totalVolume) * 100 : 50;

                return (
                  <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-[#F84F71] transition-all duration-500 ease-in-out flex items-center justify-start pl-2" style={{ width: `${bidRatio}%` }}>
                      {bidRatio > 15 && <span className="text-white text-xs font-bold">{bidRatio.toFixed(1)}%</span>}
                    </div>
                    <div className="absolute right-0 top-0 h-full bg-[#3578FF] transition-all duration-500 ease-in-out flex items-center justify-end pr-2" style={{ width: `${askRatio}%` }}>
                      {askRatio > 15 && <span className="text-white text-xs font-bold">{askRatio.toFixed(1)}%</span>}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 미니 차트 추가 */}
            <MiniChart
              candleData={candleData}
              tickData={tickData}
              prevClosingPrice={coinData.prev_closing_price || 0}
              selectedInterval={selectedInterval}
              onIntervalChange={(interval) => {
                dispatch(setSelectedInterval(interval));
                if (selectedCoin) {
                  dispatch(fetchCandlesAsync({ market: selectedCoin, interval }) as any);
                }
              }}
            />

            {/* 기존 거래량 정보 */}
            <h4 className="text-base mb-2 font-medium mt-4">거래량 정보</h4>
            <div className="text-sm space-y-1">
              <p>24시간 거래량: {coinData.acc_trade_volume_24h?.toLocaleString()}</p>
              <p>24시간 거래대금: {coinData.acc_trade_price_24h?.toLocaleString()} KRW</p>
              <p>최근 거래량: {coinData.trade_volume?.toLocaleString()}</p>
              <p>매수 누적량: {coinData.acc_bid_volume?.toLocaleString()}</p>
              <p>매도 누적량: {coinData.acc_ask_volume?.toLocaleString()}</p>
            </div>
          </div>

          {/*주문창*/}
          <div className="bg-[#FFFFFF] p-3 rounded-md border-1 border-[#CCCCCC]">
            <h3 className="text-lg mb-2">가격 정보</h3>
            <p>현재가: {coinData.trade_price?.toLocaleString()} KRW</p>
            <p>시가: {coinData.opening_price?.toLocaleString()} KRW</p>
            <p>고가: {coinData.high_price?.toLocaleString()} KRW</p>
            <p>저가: {coinData.low_price?.toLocaleString()} KRW</p>
            <p>전일 종가: {coinData.prev_closing_price?.toLocaleString()} KRW</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p>데이터를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}

export default CoinDetailBlock;
