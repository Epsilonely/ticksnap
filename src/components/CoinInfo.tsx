import { useSelector, useDispatch } from 'react-redux';
import { IntervalType } from '../store/types';
import { setSelectedInterval, fetchCandlesAsync } from '../store/slices/coinSlice';
import MiniChart from './MiniChart';

interface CoinInfoProps {
  coinData: any;
  selectedCoin: string;
  candleData: any[];
  tickData: any[];
  selectedInterval: IntervalType;
}

function CoinInfo({ coinData, selectedCoin, candleData, tickData, selectedInterval }: CoinInfoProps) {
  const dispatch = useDispatch();

  return (
    <div className="bg-[#FFFFFF] p-4 rounded-md border-1 border-[#CCCCCC]">
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
      <div className="text-sm space-y-1">
        <p>24시간 거래량: {coinData.acc_trade_volume_24h?.toLocaleString()}</p>
        <p>24시간 거래대금: {coinData.acc_trade_price_24h?.toLocaleString()} KRW</p>
        <p>최근 거래량: {coinData.trade_volume?.toLocaleString()}</p>
        <p>매수 누적량: {coinData.acc_bid_volume?.toLocaleString()}</p>
        <p>매도 누적량: {coinData.acc_ask_volume?.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default CoinInfo;
