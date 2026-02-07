import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setFuturesPositions } from '../store/slices/coinSlice';
import BinanceFuturesChart from '../components/BinanceFuturesChart';
import ExchangePriceDisplay from '../components/ExchangePriceDisplay';
import { binanceAccountApi } from '../services/BinanceAccountApi';

function CoinDetailBlock() {
  const dispatch = useDispatch();
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const unifiedCoins = useSelector((state: RootState) => state.coin.unifiedCoins);
  const futuresPositions = useSelector((state: RootState) => state.coin.futuresPositions);

  // USDT/KRW 환율
  const usdtToKrw = useSelector((state: RootState) => state.coin.usdtKrwRate);

  // Futures 포지션 주기적으로 fetch (30초 간격)
  useEffect(() => {
    const fetchPositions = async () => {
      const positions = await binanceAccountApi.getFuturesPositionsViaREST();
      // positionAmt가 0이 아닌 포지션만 필터링
      const activePositions = positions.filter((p) => parseFloat(p.positionAmt) !== 0);
      dispatch(setFuturesPositions(activePositions));
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

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
  const kimchiPremium = selectedCoinData.upbit && selectedCoinData.binance && usdtToKrw > 0 ? (selectedCoinData.upbit.price / (selectedCoinData.binance.price * usdtToKrw) - 1) * 100 : null;

  // 바이낸스 Futures 가격 정보 (메인 표시용)
  const binancePrice = selectedCoinData.binance?.price || 0;
  const binanceChange = selectedCoinData.binance?.change || 'EVEN';
  const binanceChangeRate = selectedCoinData.binance?.changeRate || 0;

  // 현재 선택된 코인의 Futures 포지션 찾기
  const currentSymbol = `${selectedCoinData.coinSymbol}USDT`;
  const currentPosition = futuresPositions.find((p) => p.symbol === currentSymbol);
  const positionData = currentPosition
    ? {
        entryPrice: parseFloat(currentPosition.entryPrice),
        positionAmt: parseFloat(currentPosition.positionAmt),
        positionSide: currentPosition.positionSide as 'LONG' | 'SHORT' | 'BOTH',
      }
    : null;

  return (
    <div className="h-full flex flex-col bg-[#F2F2F2] rounded-md p-4">
      {/* 헤더 - 코인 이름 */}
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h2 className="text-[24px] font-bold text-[#26262C]">{selectedCoinData.name} {selectedCoinData.coinSymbol}</h2>
      </div>

      {/* 메인 가격 표시 영역 */}
      <div className="flex-shrink-0 flex items-center gap-8 mb-4">
        {/* 큰 가격 */}
        <div className="text-[40px] font-extrabold text-[#26262C] leading-none">{binancePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

        {/* 변동률 */}
        <div className={`text-[40px] font-bold leading-none ${binanceChange === 'RISE' ? 'text-price-rise' : binanceChange === 'FALL' ? 'text-price-fall' : 'text-[#26262C]'}`}>
          {binanceChange === 'RISE' ? '▲' : binanceChange === 'FALL' ? '▼' : ''}
          {Math.abs(binanceChangeRate * 100).toFixed(2)}%
        </div>
      </div>

      {/* 거래소별 가격 + 김치프리미엄 */}
      <div className="flex-shrink-0 flex items-center gap-4 mb-4">
        {selectedCoinData.upbit && <ExchangePriceDisplay exchange="upbit" price={selectedCoinData.upbit.price} change={selectedCoinData.upbit.change as 'RISE' | 'FALL' | 'EVEN'} changeRate={selectedCoinData.upbit.changeRate} coinSymbol={selectedCoinData.coinSymbol} />}
        {kimchiPremium !== null && (
          <div className={`text-[13px] font-semibold px-2 py-0.5 rounded ${kimchiPremium >= 0 ? 'text-price-rise bg-[#639d01]/10' : 'text-price-fall bg-[#ea0070]/10'}`}>
            김프 {kimchiPremium >= 0 ? '+' : ''}
            {kimchiPremium.toFixed(2)}%
          </div>
        )}
      </div>

      {/* 차트 - 남은 공간 모두 차지 */}
      <div className="flex-1 min-h-0 w-full">{selectedCoinData.binance ? <BinanceFuturesChart symbol={`${selectedCoinData.coinSymbol}USDT`} theme="light" position={positionData} /> : <div className="h-full flex items-center justify-center text-[#666666]">바이낸스 차트만 지원됩니다.</div>}</div>
    </div>
  );
}

export default CoinDetailBlock;
