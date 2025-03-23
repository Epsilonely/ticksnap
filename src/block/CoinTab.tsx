import { useState, useRef, useEffect } from 'react';

type CoinTabProps = {
  coin: any;
};

function CoinTab({ coin }: CoinTabProps) {
  const coinSymbol = coin.market.split('-')[1];

  const prePriceRef = useRef(coin.trade_price);
  const [priceChangeAnimation, setPriceChangeAnimation] = useState('none');

  const iconUrl = `https://static.upbit.com/logos/${coinSymbol}.png`;

  function formatCurrency(value: number) {
    if (!value) return '-';
    if (value >= 1000000000000) {
      return (value / 1000000000000).toFixed(2) + '조';
    } else if (value >= 100000000) {
      return (value / 100000000).toFixed(2) + '억';
    } else if (value >= 10000) {
      return (value / 10000).toFixed(2) + '만';
    } else {
      return value.toLocaleString();
    }
  }

  const formattedPrice = formatCurrency(coin.acc_trade_price);

  useEffect(() => {
    if (prePriceRef.current !== coin.trade_price) {
      if (coin.trade_price > prePriceRef.current) {
        setPriceChangeAnimation('up');
      } else if (coin.trade_price < prePriceRef.current) {
        setPriceChangeAnimation('down');
      }

      prePriceRef.current = coin.trade_price;

      const timer = setTimeout(() => {
        setPriceChangeAnimation('none');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [coin.trade_price]);

  const animationClass = priceChangeAnimation === 'up' ? 'price-up-animation' : priceChangeAnimation === 'down' ? 'price-down-animation' : '';

  return (
    <div className="flex justify-between items-center p-1 px-1.5 border-b border-[#CCCCCC] text-[12px] hover:bg-[#F5F5F5] h-14">
      {/* 코인 아이콘 */}
      <div className="flex min-w-[28px] max-w-[28px] mr-1.5">
        <img src={iconUrl} alt={`${coinSymbol} 아이콘`} className="rounded-full"></img>
      </div>
      {/* 코인명 */}
      <div className="flex flex-col items-start min-w-[116px] h-full justify-center bg-emerald-50">
        <div className="font-bold text-[#333333]">{coin.korean_name}</div>
        <div className="font-extralight text-[#5C5C5C]">{coin.market.split('-')[1]}</div>
      </div>
      {/* 가격 */}
      <div className={`flex flex-row w-fit h-full ${coin.change === 'RISE' ? 'text-[#F1295A]' : coin.change === 'FALL' ? 'text-[#3F51B5]' : 'text-[#333333]'}`}>
        <div className="flex items-start h-full">
          <div className="flex items-end justify-end min-w-[110px] h-1/2 pr-2 bg-amber-50">
            <div className="font-semibold">{coin.trade_price ? coin.trade_price.toLocaleString() : '-'}</div>
            <div className="text-[8px] font-normal ml-0.5 mb-0.5">KRW</div>
          </div>
        </div>
        <div className={`flex-col font-normal w-[100px] h-full px-1 ${animationClass}`}>
          <div className="flex items-end justify-end h-1/2 bg-amber-000">{(coin.change_rate * 100).toFixed(2)}%</div>
          <div className="flex items-start justify-end pt-[1px] h-1/2 bg-amber-000">
            {coin.change_price}
            {coin.change === 'RISE' ? ' ▲' : coin.change === 'FALL' ? ' ▼' : ' -'}
          </div>
        </div>
      </div>
      {/* 거래대금 */}
      <div className="flex flex-row h-full items-start justify-end w-full bg-fuchsia-50">{formattedPrice}</div>
    </div>
  );
}

export default CoinTab;
