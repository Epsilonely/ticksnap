import React from 'react';
import { CandleData } from '../services/UpbitApi';

interface MiniChartProps {
  candleData: CandleData[];
  prevClosingPrice: number;
  selectedInterval: string;
  onIntervalChange: (interval: string) => void;
}

const MiniChart: React.FC<MiniChartProps> = ({ candleData, prevClosingPrice, selectedInterval, onIntervalChange }) => {
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
    return maxVolume > 0 ? (volume / maxVolume) * 32 : 1; // 최대 25px
  };

  // 시간 간격에 따른 제목 생성
  const getChartTitle = () => {
    switch (selectedInterval) {
      case '1':
        return '가격 추세 (최근 30분)';
      case '5':
        return '가격 추세 (최근 2시간 30분)';
      case '15':
        return '가격 추세 (최근 7시간 30분)';
      case '1hour':
        return '가격 추세 (최근 30시간)';
      case '4hour':
        return '가격 추세 (최근 5일)';
      case 'day':
        return '가격 추세 (최근 30일)';
      case 'week':
        return '가격 추세 (최근 30주)';
      default:
        return '가격 추세';
    }
  };

  return (
    <div className="mt-3">
      {/* 가격 추세 라인 그래프 */}
      <div className="mb-2 transition-all duration-200">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-600 font-medium">{getChartTitle()}</div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => onIntervalChange('1')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === '1' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              1분
            </button>
            <button onClick={() => onIntervalChange('5')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === '5' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              5분
            </button>
            <button onClick={() => onIntervalChange('15')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === '15' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              15분
            </button>
            <button onClick={() => onIntervalChange('1hour')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === '1hour' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              1시간
            </button>
            <button onClick={() => onIntervalChange('4hour')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === '4hour' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              4시간
            </button>
            <button onClick={() => onIntervalChange('day')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === 'day' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              일봉
            </button>
            <button onClick={() => onIntervalChange('week')} className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${selectedInterval === 'week' ? 'bg-[#4C4C57] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              주봉
            </button>
          </div>
        </div>
        <div className="relative h-15 bg-[#F5F5F5] rounded px-1">
          <svg width="100%" height="60" className="absolute inset-0" viewBox="0 0 102 40" preserveAspectRatio="none">
            {/* 가격 라인 */}
            {sortedData.slice(0, -1).map((data, index) => {
              const totalBars = sortedData.length;
              const barSpacing = 100 / totalBars; // 각 막대가 차지하는 퍼센트
              const nextData = sortedData[index + 1];
              const x1 = (index + 0.8) * barSpacing;
              const y1 = getY(data.trade_price);
              const x2 = (index + 1.8) * barSpacing;
              const y2 = getY(nextData.trade_price);

              // 각 구간별로 색상 결정
              const isRising = nextData.trade_price >= prevClosingPrice;
              const lineColor = isRising ? '#F84F71' : '#3578FF';

              return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="transition-all duration-300" />;
            })}

            {/* 전일 종가 기준선 추가 */}
            <line x1="0" y1={getY(prevClosingPrice)} x2="102" y2={getY(prevClosingPrice)} stroke="#888888" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" className="transition-all duration-300" />
            {/* 가격 포인트 */}
            {sortedData.map((data, index) => {
              const totalBars = sortedData.length;
              const barSpacing = 100 / totalBars;
              const x = (index + 0.4) * barSpacing;
              const y = getY(data.trade_price) - 1;
              const barWidth = barSpacing * 0.8;
              const barHeight = 2;
              const isRising = data.trade_price >= prevClosingPrice;
              return <rect key={index} x={x} y={y} width={barWidth} height={barHeight} fill={`${isRising ? '#F84F71' : '#3578FF'}`} className="transition-all duration-300" />;
            })}
          </svg>

          {/* 가격 정보 표시 */}
          <div className="absolute top-1 left-2 text-[10px] font-light text-[#26262C] hover:bg-[#F5F5F5]/[0.7] hover:font-medium transition-all duration-100">
            <div className="bg-[#F5F5F5]/[0.4]">{maxPrice.toLocaleString()}</div>
            <div className="mt-0.5 bg-[#F5F5F5]/[0.4]">{minPrice.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 거래량 막대 그래프 */}
      <div>
        <div className="text-xs text-[#4C4C57] mb-1 font-medium">거래량</div>
        <div className="flex items-end justify-between h-10 bg-[#F5F5F5] rounded px-1">
          {sortedData.map((data, index) => (
            <div
              key={index}
              className="bg-[#5FC26A] transition-all duration-300 flex-1 mx-0.5"
              style={{
                height: `${getVolumeHeight(data.candle_acc_trade_volume)}px`,
                opacity: 0.25 + (data.candle_acc_trade_volume / maxVolume) * 0.75,
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
