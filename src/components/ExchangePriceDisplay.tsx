import React, { useState, useEffect, useRef } from 'react';
import UpbitLogo from '../../public/img/UPBIT_LOGO.svg';
import BinanceLogo from '../../public/img/BINANCE_LOGO.svg';
import PriceDisplay from '../common/PriceDisplay';

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
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uniqueKey = `${coinSymbol}-${exchange}`; // 고유 키 생성

  // 가격 변동 감지 및 애니메이션 처리
  useEffect(() => {
    if (prevPriceRef.current !== null && prevPriceRef.current !== price) {
      const prevPrice = prevPriceRef.current;

      if (Math.abs(price - prevPrice) > 0.00001) {
        // 기존 애니메이션 타이머 정리
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
          animationTimerRef.current = null;
        }

        const isUp = price > prevPrice;
        const newAnimationClass = isUp ? 'price-up-animation' : 'price-down-animation';

        // 즉시 애니메이션 적용
        setAnimationClass(newAnimationClass);

        // 새로운 타이머 설정
        animationTimerRef.current = setTimeout(() => {
          setAnimationClass('');
          animationTimerRef.current = null;
        }, 250);
      }
    }

    prevPriceRef.current = price;
  }, [price, uniqueKey, coinSymbol, exchange, change]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);

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

  const getDecimalPlaces = (number: number) => {
    const integerDigits = Math.floor(number).toString().length;
    let decimalPlaces = Math.max(0, 9 - integerDigits);

    // 뒤에 0이 있으면 제거
    const formatted = number.toFixed(decimalPlaces);
    const trimmed = formatted.replace(/\.?0+$/, '');
    const actualDecimalPlaces = trimmed.includes('.') ? trimmed.split('.')[1].length : 0;

    return actualDecimalPlaces;
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
          <span className={`min-w-[84px] ${animationClass}`}>
            <PriceDisplay price={price} className={`${getColorClass(change)}`} decimalPlaces={getDecimalPlaces(price)} />
          </span>
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
