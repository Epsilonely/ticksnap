type CoinTabProps = {
  coin: any;
};

function CoinTab({ coin }: CoinTabProps) {
  return (
    <div className="flex justify-between items-center p-1 px-1.5 border-b border-[#CCCCCC] text-sm hover:bg-[#F5F5F5] h-14">
      <div className="flex flex-col items-start max-w-[134px] min-w-[134px] bg-emerald-400">
        <div className="font-bold text-[#333333]">{coin.korean_name}</div>
        <div className="font-extralight">{coin.market}</div>
      </div>
      <div className={`flex flex-row w-fit bg-black ${coin.signed_change_rate > 0 ? 'text-[#F1295A]' : coin.signed_change_rate == 0 ? 'text-[#333333]' : 'text-[#3F51B5]'}`}>
        <div className="flex items-start h-full bg-blue-500">
          <div className="flex items-end justify-end max-w-[124px] min-w-[124px] bg-amber-300">
            <div className="text-sm font-medium">{coin.trade_price ? coin.trade_price.toLocaleString() : '-'}</div>
            <div className="text-[8px] font-normal ml-0.5 mb-0.5">KRW</div>
          </div>
        </div>
        <div className="flex-col text-right min-w-[100px] max-w-[100px] bg-cyan-300">
          <div className="text-sm">{(coin.signed_change_rate * 100).toFixed(2)}%</div>
          <div>변동금액</div>
        </div>
      </div>
      <div className="flex w-1/3 text-sm">거래대금</div>
    </div>
  );
}

export default CoinTab;
