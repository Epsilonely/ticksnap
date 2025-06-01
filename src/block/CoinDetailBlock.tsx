import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';

function CoinDetailBlock() {
  const dispatch = useDispatch();
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const markets = useSelector((state: RootState) => state.coin.markets);
  const coinData = useSelector((state: RootState) => state.coin.webSocketData);
  const favorites = useSelector((state: RootState) => state.favorite.favorites);

  // 현재 선택된 코인이 즐겨찾기에 있는지 확인
  const isFavorite = selectedCoin ? favorites.includes(selectedCoin) : false;

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
    <div className="h-full bg-[#F5F5F5] text-[#26262C] p-4 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[20px] font-bold">
          {selectedCoinInfo?.korean_name} ({selectedCoin})
        </h2>
        <button onClick={handleToggleFavorite} className={`px-3 py-1.5 rounded-md text-sm font-medium ${isFavorite ? 'bg-[#4C4C57] text-[#FFFFFF]  hover:bg-[#26262C]' : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'}`}>
          {isFavorite ? '관심 해제' : '관심 등록'}
        </button>
      </div>

      {isCorrectCoinData ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FFFFFF] p-3 rounded-md">
            <h3 className="text-lg mb-2">가격 정보</h3>
            <p>현재가: {coinData.trade_price?.toLocaleString()} KRW</p>
            <p>시가: {coinData.opening_price?.toLocaleString()} KRW</p>
            <p>고가: {coinData.high_price?.toLocaleString()} KRW</p>
            <p>저가: {coinData.low_price?.toLocaleString()} KRW</p>
            <p>전일 종가: {coinData.prev_closing_price?.toLocaleString()} KRW</p>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-md">
            <h3 className="text-lg mb-2">거래량 정보</h3>
            <p>24시간 거래량: {coinData.acc_trade_volume_24h?.toLocaleString()}</p>
            <p>24시간 거래대금: {coinData.acc_trade_price_24h?.toLocaleString()} KRW</p>
            <p>최근 거래량: {coinData.trade_volume?.toLocaleString()}</p>
            <p>매수 누적량: {coinData.acc_bid_volume?.toLocaleString()}</p>
            <p>매도 누적량: {coinData.acc_ask_volume?.toLocaleString()}</p>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-md col-span-2">
            <h3 className="text-lg mb-2">추가 정보</h3>
            <p>변동률: {coinData.signed_change_rate ? (coinData.signed_change_rate * 100).toFixed(2) + '%' : '-'}</p>
            <p>변동금액: {coinData.signed_change_price?.toLocaleString()} KRW</p>
            <p>
              거래 시각: {coinData.trade_date} {coinData.trade_time}
            </p>
            <p>마켓 상태: {coinData.market_state}</p>
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
