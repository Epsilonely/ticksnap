import { useState, useEffect, useRef } from 'react';
import { fetchMarkets, fetchTickers } from '../services/UpbitApi';
import Scrollbar from '../common/Scrollbar';
import CoinTab from './CoinTab';

function MarketBlock() {
  const [markets, setMarkets] = useState<{ market: string; korean_name: string }[]>([]);
  const [tickers, setTikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMarketLoadingRef = useRef(false);
  const isTickerLoadingRef = useRef(false);

  // 마켓 목록 가져오기
  const updateMarkets = async () => {
    if (isMarketLoadingRef.current) return;

    isMarketLoadingRef.current = true;
    try {
      const data = await fetchMarkets();
      setMarkets(data);
      if (loading && data.length > 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('마켓 목록 불러오기 실패:', error);
      setError('마켓 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      isMarketLoadingRef.current = false;
    }
  };

  // 현재가 정보 가져오기
  const updateTickers = async () => {
    if (isTickerLoadingRef.current || markets.length === 0) return;

    isTickerLoadingRef.current = true;
    try {
      const marketCodes = markets.map((market) => market.market);
      const data = await fetchTickers(marketCodes);
      setTikers(data);
      if (loading && data.length > 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('현재가 정보 가져오기 실패:', error);
      setError('현재가 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      isTickerLoadingRef.current = false;
    }
  };

  // 마켓 목록과 현재가 정보 합치기
  const combineData = markets.map((market) => {
    const ticker = tickers.find((t) => t.market === market.market);
    return {
      ...market,
      ...ticker,
    };
  });

  useEffect(() => {
    updateMarkets();

    const marketsIntervalId = setInterval(() => {
      updateMarkets();
    }, 30_000); // 30초마다 업데이트

    return () => clearInterval(marketsIntervalId);
  }, []);

  useEffect(() => {
    if (markets.length > 0) {
      updateTickers();

      const tickersIntervalId = setInterval(() => {
        updateTickers();
      }, 200); // 1초당 5번 호출

      return () => clearInterval(tickersIntervalId);
    }
  }, [markets]);

  return (
    <div className="w-full h-full bg-[#FFFFFF] p-2 flex flex-col">
      {loading ? (
        <div>
          <p>로딩 중...</p>
        </div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-between h-fit items-center pb-0.5 px-1.5 border-b border-[#333333] text-[11px] text-[#333333] font-normal">
            <div className="flex min-w-[150px] justify-start ps-[34px] bg-red-000">이름</div>
            <div className="flex min-w-[110px] bg-red-000 justify-end pr-2">현재가</div>
            <div className="flex min-w-[100px] justify-end bg-amber-000 pr-1">전일대비</div>
            <div className="flex w-full justify-end">거래대금</div>
          </div>
          <Scrollbar className="flex-1 overflow-y-auto" trackClassName="bg-gray-100">
            {combineData
              .sort((a, b) => (b.acc_trade_price_24h || 0) - (a.acc_trade_price_24h || 0))
              .map((coin) => (
                <CoinTab key={coin.market} coin={coin} />
              ))}
          </Scrollbar>
        </div>
      )}
    </div>
  );
}

export default MarketBlock;
