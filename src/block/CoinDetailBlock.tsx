import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import BinanceFuturesChart from '../components/BinanceFuturesChart';
import ExchangePriceDisplay from '../components/ExchangePriceDisplay';

function CoinDetailBlock() {
  const dispatch = useDispatch();
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const unifiedCoins = useSelector((state: RootState) => state.coin.unifiedCoins);
  const favorites = useSelector((state: RootState) => state.favorite.favorites);

  // 현재 선택된 코인이 즐겨찾기에 있는지 확인
  const isFavorite = selectedCoin ? favorites.includes(selectedCoin) : false;

  // USDT/KRW 환율
  const usdtToKrw = useSelector((state: RootState) => state.coin.usdtKrwRate);

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

  // 김치프리미엄 계산: (업비트KRW가 / (바이낸스USDT가 * USDT환율) - 1) * 100
  const kimchiPremium = selectedCoinData.upbit && selectedCoinData.binance && usdtToKrw > 0 ? ((selectedCoinData.upbit.price / (selectedCoinData.binance.price * usdtToKrw) - 1) * 100) : null;

  return (
    <div className="h-full flex flex-col bg-[#F2F2F2] rounded-md p-4">
      {/* 헤더 - 코인 정보 및 관심 버튼 */}
      <div className="flex-shrink-0 flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[24px] font-bold text-[#26262C]">{selectedCoinData.name}</h2>
          <span className="text-[16px] text-[#666666]">{selectedCoinData.coinSymbol}</span>
        </div>
        <button onClick={handleToggleFavorite} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isFavorite ? 'bg-[#4C4C57] text-[#FFFFFF] hover:bg-[#26262C]' : 'bg-[#5FC26A] text-[#FFFFFF] hover:bg-[#4CAE57]'}`}>
          {isFavorite ? '★ 관심 해제' : '☆ 관심 등록'}
        </button>
      </div>

      {/* 거래소별 가격 + 김치프리미엄 */}
      <div className="flex-shrink-0 flex items-center gap-4 mb-3">
        {selectedCoinData.upbit && <ExchangePriceDisplay exchange="upbit" price={selectedCoinData.upbit.price} change={selectedCoinData.upbit.change as 'RISE' | 'FALL' | 'EVEN'} changeRate={selectedCoinData.upbit.changeRate} coinSymbol={selectedCoinData.coinSymbol} />}
        {selectedCoinData.binance && <ExchangePriceDisplay exchange="binance" price={selectedCoinData.binance.price} change={selectedCoinData.binance.change as 'RISE' | 'FALL' | 'EVEN'} changeRate={selectedCoinData.binance.changeRate} coinSymbol={selectedCoinData.coinSymbol} />}
        {kimchiPremium !== null && (
          <div className={`text-[13px] font-semibold px-2 py-0.5 rounded ${kimchiPremium >= 0 ? 'text-price-rise bg-[#639d01]/10' : 'text-price-fall bg-[#ea0070]/10'}`}>
            김프 {kimchiPremium >= 0 ? '+' : ''}{kimchiPremium.toFixed(2)}%
          </div>
        )}
      </div>

      {/* 차트 - 남은 공간 모두 차지 */}
      <div className="flex-1 min-h-0 w-full">
        {selectedCoinData.binance ? (
          <BinanceFuturesChart symbol={`${selectedCoinData.coinSymbol}USDT`} theme="light" />
        ) : (
          <div className="h-full flex items-center justify-center text-[#666666]">바이낸스 차트만 지원됩니다.</div>
        )}
      </div>
    </div>
  );
}

export default CoinDetailBlock;
