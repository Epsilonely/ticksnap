import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getWebSocketService } from '../services/WebSocketService';

function CoinDetailBlock() {
  const selectedCoin = useSelector((state: RootState) => state.coin.selectedCoin);
  const markets = useSelector((state: RootState) => state.coin.markets);
  const [coinData, setCoinData] = useState<any>(null);

  // 선택된 코인이 변경될 때 웹소켓 연결
  useEffect(() => {
    if (!selectedCoin) return;

    const handleWebSocketMessage = (data: any) => {
      setCoinData(data);
    };

    const webSocketService = getWebSocketService(handleWebSocketMessage);

    webSocketService.connect([selectedCoin]);

    return () => {
      webSocketService.disconnect();
    };
  }, [selectedCoin]);

  if (!selectedCoin) {
    return (
      <div className="h-full flex items-center justify-center bg-[#333333] text-white rounded-md">
        <p>코인을 선택해주세요.</p>
      </div>
    );
  }

  const selectedCoinInfo = markets.find((market) => market.market === selectedCoin);

  return (
    <div className="h-full bg-[#333333] text-white p-4 rounded-md">
      <h2 className="text-xl font-bold mb-4">
        {selectedCoinInfo?.korean_name} ({selectedCoin})
      </h2>

      {coinData ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#444444] p-3 rounded-md">
            <h3 className="text-lg mb-2">가격 정보</h3>
            <p>현재가: {coinData.trade_price?.toLocaleString()} KRW</p>
            {/* 추가 가격 정보 표시 */}
          </div>

          <div className="bg-[#444444] p-3 rounded-md">
            <h3 className="text-lg mb-2">거래량 정보</h3>
            <p>24시간 거래량: {coinData.acc_trade_volume_24h?.toLocaleString()}</p>
            {/* 추가 거래량 정보 표시 */}
          </div>

          {/* 추가 정보 패널 */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p>데이터를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
