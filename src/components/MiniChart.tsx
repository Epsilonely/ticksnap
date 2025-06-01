import React from 'react';
import { CandleData } from '../services/UpbitApi';

interface MiniChartProps {
  candleData: CandleData[];
}

const MiniChart: React.FC<MiniChartProps> = ({ candleData }) => {
  if (!candleData || candleData.length === 0) {
    return <div className="h-20 flex items-center justify-center text-gray-500 text-xs">차트 데이터 로딩 중...</div>;
  }

  // 데이터를 시간순으로 정렬 (오래된 것부터)
  const sortedData = [...candleData].reverse();

  // 가격 범위 계산
  const prices = sortedData.map((d) => d.trade_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // 거래량 범위 계산
  const volumes = sortedData.map((d) => d.candle_acc_trade_volume);
  const maxVolume = Math.max(...volumes);

  // 가격 좌표 계산 (Y축 반전)
  const getY = (price: number) => {
    if (priceRange === 0) return 20; // 가격 변동이 없으면 중간에
    return 35 - ((price - minPrice) / priceRange) * 30; // 35px에서 5px 사이
  };

  // 거래량 높이 계산
  const getVolumeHeight = (volume: number) => {
    return maxVolume > 0 ? (volume / maxVolume) * 25 : 1; // 최대 25px
  };

  return (
    <div className="mt-3">
      {/* 가격 추세 라인 그래프 */}
      <div className="mb-2">
        <div className="text-xs text-gray-600 mb-1">가격 추세 (최근 30분)</div>
        <div className="relative h-10 bg-gray-50 rounded">
          <svg width="100%" height="40" className="absolute inset-0">
            {/* 가격 라인 */}
            <polyline
              points={sortedData
                .map((data, index) => {
                  const x = (index / (sortedData.length - 1)) * 100;
                  const y = getY(data.trade_price);
                  return `${x}%,${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#F84F71"
              strokeWidth="2"
              className="transition-all duration-300"
            />

            {/* 가격 포인트 */}
            {sortedData.map((data, index) => {
              const x = (index / (sortedData.length - 1)) * 100;
              const y = getY(data.trade_price);
              return <circle key={index} cx={`${x}%`} cy={y} r="2" fill="#F84F71" className="transition-all duration-300" />;
            })}
          </svg>

          {/* 가격 정보 표시 */}
          <div className="absolute top-1 left-2 text-xs text-gray-600">{maxPrice.toLocaleString()}</div>
          <div className="absolute bottom-1 left-2 text-xs text-gray-600">{minPrice.toLocaleString()}</div>
        </div>
      </div>

      {/* 거래량 막대 그래프 */}
      <div>
        <div className="text-xs text-gray-600 mb-1">거래량</div>
        <div className="flex items-end justify-between h-8 bg-gray-50 rounded px-1">
          {sortedData.map((data, index) => (
            <div
              key={index}
              className="bg-blue-400 transition-all duration-300 flex-1 mx-0.5"
              style={{
                height: `${getVolumeHeight(data.candle_acc_trade_volume)}px`,
                opacity: 0.7 + (data.candle_acc_trade_volume / maxVolume) * 0.3,
              }}
              title={`${data.candle_acc_trade_volume.toFixed(2)}`}
            />
          ))}
        </div>
      </div>

      {/* 시간 라벨 */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{new Date(sortedData[0]?.candle_date_time_kst).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{new Date(sortedData[sortedData.length - 1]?.candle_date_time_kst).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default MiniChart;
