import React, { useState, useEffect, useRef } from 'react';
import UpbitLogo from '../../public/img/UPBIT_LOGO.svg';
import BinanceLogo from '../../public/img/BINANCE_LOGO.svg';

interface ExchangePriceDisplayProps {
  exchange: 'upbit' | 'binance';
  price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  changeRate: number;
  coinSymbol: string; // 고유 식별자 추가
}

const ExchangePriceDisplay: React.FC<ExchangePriceDisplayProps> = ({ exchange, price, change, changeRate, coinSymbol }) => {
  const [animationClass, setAnimationClass] = useState<string>('');
  const prevPriceRef = useRef<number | null>(null);
  const uniqueKey = `${coinSymbol}-${exchange}`; // 고유 키 생성

  // 가격 변동 감지 및 애니메이션 처리
  useEffect(() => {
    if (prevPriceRef.current !== null && prevPriceRef.current !== price) {
      const prevPrice = prevPriceRef.current;

      if (Math.abs(price - prevPrice) > 0.00001) {
        // 미세한 변동 무시
        if (price > prevPrice) {
          setAnimationClass('price-up-animation');
        } else if (price < prevPrice) {
          setAnimationClass('price-down-animation');
        }

        // 애니메이션 제거
        const timer = setTimeout(() => {
          setAnimationClass('');
        }, 250); // 0.25초 후 애니메이션 클래스 제거

        return () => clearTimeout(timer);
      }
    }

    prevPriceRef.current = price;
  }, [price, uniqueKey]); // uniqueKey 의존성 추가

  const getColorClass = (changeType: 'RISE' | 'FALL' | 'EVEN') => {
    switch (changeType) {
      case 'RISE':
        return 'text-price-rise';
      case 'FALL':
        return 'text-price-fall';
      default:
        return 'text-price-unchanged';
    }
  };

  const getChangeIcon = (changeType: 'RISE' | 'FALL' | 'EVEN') => {
    switch (changeType) {
      case 'RISE':
        return '▲';
      case 'FALL':
        return '▼';
      default:
        return '';
    }
  };

  const getLogo = (exchangeType: 'upbit' | 'binance') => {
    return exchangeType === 'upbit' ? UpbitLogo : BinanceLogo;
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-1">
        <div className="w-[16px] h-[16px] rounded-full overflow-hidden flex-shrink-0">
          <img
            src={getLogo(exchange)}
            alt={`${exchange}_logo`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.backgroundColor = '#777';
              (e.target as HTMLImageElement).style.display = 'block';
              (e.target as HTMLImageElement).src = '';
            }}
          />
        </div>
        <div className="flex gap-1 font-medium text-[14px]">
          <span className={`min-w-[84px] ${getColorClass(change)} ${animationClass}`}>{price.toLocaleString()}</span>
          <span className={getColorClass(change)}>
            {getChangeIcon(change)}
            {(changeRate * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExchangePriceDisplay;
