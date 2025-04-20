import { useSelector } from 'react-redux';
import { RootState } from '../store';

function CoinDetailBlock() {
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const markets = useSelector((state: RootState) => state.coin.markets);
  const coinData = useSelector((state: RootState) => state.coin.webSocketData);

  if (!selectedCoin) {
    return (
      <div className="h-full flex items-center justify-center bg-[#333333] text-white rounded-md">
        <p>코인을 선택해주세요.</p>
      </div>
    );
  }

  const selectedCoinInfo = markets.find((market) => market.market === selectedCoin);

  // 선택된 코인과 웹소켓 데이터의 코인 코드가 일치하는지 확인
  const isCorrectCoinData = coinData && coinData.code === selectedCoin;

  return (
    <div className="h-full bg-[#c14545] text-white p-4 rounded-md">
      <h2 className="text-xl font-bold mb-4">
        {selectedCoinInfo?.korean_name} ({selectedCoin})
      </h2>

      {isCorrectCoinData ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#444444] p-3 rounded-md">
            <h3 className="text-lg mb-2">가격 정보</h3>
            <p>현재가: {coinData.trade_price?.toLocaleString()} KRW</p>
            <p>시가: {coinData.opening_price?.toLocaleString()} KRW</p>
            <p>고가: {coinData.high_price?.toLocaleString()} KRW</p>
            <p>저가: {coinData.low_price?.toLocaleString()} KRW</p>
            <p>전일 종가: {coinData.prev_closing_price?.toLocaleString()} KRW</p>
          </div>

          <div className="bg-[#444444] p-3 rounded-md">
            <h3 className="text-lg mb-2">거래량 정보</h3>
            <p>24시간 거래량: {coinData.acc_trade_volume_24h?.toLocaleString()}</p>
            <p>24시간 거래대금: {coinData.acc_trade_price_24h?.toLocaleString()} KRW</p>
            <p>최근 거래량: {coinData.trade_volume?.toLocaleString()}</p>
            <p>매수 누적량: {coinData.acc_bid_volume?.toLocaleString()}</p>
            <p>매도 누적량: {coinData.acc_ask_volume?.toLocaleString()}</p>
          </div>

          <div className="bg-[#444444] p-3 rounded-md col-span-2">
            <h3 className="text-lg mb-2">추가 정보</h3>
            <p>변동률: {coinData.signed_change_rate ? (coinData.signed_change_rate * 100).toFixed(2) + '%' : '-'}</p>
            <p>변동금액: {coinData.signed_change_price?.toLocaleString()} KRW</p>
            <p>
              거래 시각: {coinData.trade_date} {coinData.trade_time}
            </p>
            <p>마켓 상태: {coinData.market_state}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p>데이터를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}

export default CoinDetailBlock;
