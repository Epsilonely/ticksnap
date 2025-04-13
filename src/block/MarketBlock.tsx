import { useState, useEffect, useRef } from 'react';
import { fetchMarkets, fetchTickers } from '../services/UpbitApi';
import Scrollbar from '../common/Scrollbar';

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
    <div>
      
    </div>
  );
}

export default MarketBlock;
