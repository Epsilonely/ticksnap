import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import { fetchCandlesAsync, setSelectedInterval, addTickData, clearTickData } from '../store/slices/coinSlice';
import CoinInfo from '../components/CoinInfo';
import Trading from '../components/Trading';

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
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-bold">{selectedCoinInfo?.korean_name}</h2>
          <div className="text-[14px]">{selectedCoin}</div>
        </div>
        <button onClick={handleToggleFavorite} className={`px-3 py-1.5 rounded-md text-sm font-medium ${isFavorite ? 'bg-[#4C4C57] text-[#FFFFFF]  hover:bg-[#26262C]' : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'}`}>
          {isFavorite ? '관심 해제' : '관심 등록'}
        </button>
      </div>

      {isCorrectCoinData ? (
        <div className="space-y-2">
          <div className="flex gap-2 text-[32px] font-black text-[#4C4C57]">
            <div>{coinData.trade_price?.toLocaleString()}</div>
            <div>{coinData.change}</div>
            <div>{Math.abs(coinData.change_rate * 100).toFixed(2)}"</div>
            <div>{coinData.change_price?.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/*차트*/}
            <CoinInfo coinData={coinData} selectedCoin={selectedCoin} candleData={candleData} tickData={tickData} selectedInterval={selectedInterval} />

            {/*주문창*/}
            <Trading />
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
