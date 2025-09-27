import React from 'react';
import UpbitLogo from '../../public/img/UPBIT_LOGO.svg';
import BinanceLogo from '../../public/img/BINANCE_LOGO.svg';

interface ExchangePriceDisplayProps {
  exchange: 'upbit' | 'binance';
  price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  changeRate: number;
  currency?: string;
}

const ExchangePriceDisplay: React.FC<ExchangePriceDisplayProps> = ({ exchange, price, change, changeRate, currency = '' }) => {
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
        <div className="flex gap-1 font-light text-[14px]">
          <span className={`min-w-[84px] ${getColorClass(change)}`}>
            {currency}
            {price.toLocaleString()}
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
