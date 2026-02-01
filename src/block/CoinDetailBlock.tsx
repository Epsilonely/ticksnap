import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import TradingViewChart from '../components/TradingViewChart';

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
      <div className="h-full flex items-center justify-center bg-[#F2F2F2] rounded-md">
        <p className="text-[#26262C]">코인을 선택해주세요.</p>
      </div>
    );
  }

  // 선택된 코인 정보 찾기
  const selectedCoinData = unifiedCoins.find((coin) => coin.upbit?.symbol === selectedCoin || coin.binance?.symbol === selectedCoin || coin.coinSymbol === selectedCoin);

  if (!selectedCoinData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F2F2F2] rounded-md">
        <p className="text-[#26262C]">선택된 코인 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 표시할 가격 정보 (업비트 우선, 없으면 바이낸스)
  const priceData = selectedCoinData.upbit || selectedCoinData.binance;

  return (
    <div className="h-full flex flex-col bg-[#F2F2F2] rounded-md p-4">
      {/* 헤더 - 코인 정보 및 관심 버튼 */}
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[24px] font-bold text-[#26262C]">{selectedCoinData.name}</h2>
          <span className="text-[16px] text-[#666666]">{selectedCoinData.coinSymbol}</span>
        </div>
        <button onClick={handleToggleFavorite} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isFavorite ? 'bg-[#4C4C57] text-[#FFFFFF] hover:bg-[#26262C]' : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'}`}>
          {isFavorite ? '★ 관심 해제' : '☆ 관심 등록'}
        </button>
      </div>

      {/* 가격 정보 */}
      {priceData && (
        <div className="flex-shrink-0 flex items-center gap-4 mb-4">
          <div className="text-[36px] font-black text-[#26262C]">{priceData.price?.toLocaleString()}</div>
          <div className={`text-[24px] font-bold ${priceData.change === 'RISE' ? 'text-price-rise' : priceData.change === 'FALL' ? 'text-price-fall' : 'text-[#666666]'}`}>{priceData.change === 'RISE' ? '▲' : priceData.change === 'FALL' ? '▼' : '-'}</div>
          <div className={`text-[20px] font-semibold ${priceData.change === 'RISE' ? 'text-price-rise' : priceData.change === 'FALL' ? 'text-price-fall' : 'text-[#666666]'}`}>{(priceData.changeRate * 100).toFixed(2)}%</div>
          <div className={`text-[18px] ${priceData.change === 'RISE' ? 'text-price-rise' : priceData.change === 'FALL' ? 'text-price-fall' : 'text-[#666666]'}`}>{priceData.changePrice?.toLocaleString()}</div>
        </div>
      )}

      {/* TradingView 차트 - 남은 공간 모두 차지 */}
      <div className="flex-1 min-h-0 w-full bg-amber-200">
        <TradingViewChart key={selectedCoinData.coinSymbol} symbol={selectedCoinData.binance ? `BINANCE:${selectedCoinData.coinSymbol}USDT` : `UPBIT:${selectedCoinData.coinSymbol}KRW`} theme="light" interval="D" />
      </div>
    </div>
  );
}

export default CoinDetailBlock;
