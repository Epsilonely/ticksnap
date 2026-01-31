import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import CoinInfo from '../components/CoinInfo';
import Trading from '../components/Trading';

function CoinDetailBlock() {
  const dispatch = useDispatch();
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const unifiedCoins = useSelector((state: RootState) => state.coin.unifiedCoins);
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

  // 선택된 코인 정보 찾기
  const selectedCoinData = unifiedCoins.find((coin) => 
    coin.upbit?.symbol === selectedCoin || 
    coin.binance?.symbol === selectedCoin ||
    coin.coinSymbol === selectedCoin
  );

  if (!selectedCoinData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F2F2F2] text-[#26262C] p-4">
        <p>선택된 코인 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 표시할 가격 정보 (업비트 우선, 없으면 바이낸스)
  const priceData = selectedCoinData.upbit || selectedCoinData.binance;

  return (
    <div className="h-full bg-[#F2F2F2] text-[#26262C] p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-bold">{selectedCoinData.name}</h2>
          <div className="text-[14px]">{selectedCoinData.coinSymbol}</div>
        </div>
        <button 
          onClick={handleToggleFavorite} 
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            isFavorite 
              ? 'bg-[#4C4C57] text-[#FFFFFF] hover:bg-[#26262C]' 
              : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'
          }`}
        >
          {isFavorite ? '관심 해제' : '관심 등록'}
        </button>
      </div>

      {priceData ? (
        <div className="space-y-2">
          <div className="flex gap-2 text-[32px] font-black text-[#4C4C57]">
            <div>{priceData.price?.toLocaleString()}</div>
            <div className={`${
              priceData.change === 'RISE' ? 'text-red-500' : 
              priceData.change === 'FALL' ? 'text-blue-500' : 
              'text-gray-500'
            }`}>
              {priceData.change === 'RISE' ? '▲' : priceData.change === 'FALL' ? '▼' : '-'}
            </div>
            <div className={`${
              priceData.change === 'RISE' ? 'text-red-500' : 
              priceData.change === 'FALL' ? 'text-blue-500' : 
              'text-gray-500'
            }`}>
              {(priceData.changeRate * 100).toFixed(2)}%
            </div>
            <div className={`${
              priceData.change === 'RISE' ? 'text-red-500' : 
              priceData.change === 'FALL' ? 'text-blue-500' : 
              'text-gray-500'
            }`}>
              {priceData.changePrice?.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CoinInfo
              coinData={{
                acc_trade_volume_24h: priceData.tradeVolume,
                acc_trade_price_24h: priceData.tradeVolume,
                trade_volume: 0,
                acc_bid_volume: 0,
                acc_ask_volume: 0,
                prev_closing_price: priceData.price - priceData.changePrice
              }}
              selectedCoin={selectedCoin}
            />

            {/* 주문창 */}
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
