import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { selectCoin } from '../store/slices/coinSlice';
import { registerCoin, unregisterCoin } from '../store/slices/registeredCoinSlice';
import { dataManager } from '../services/DataManager';
import Scrollbar from '../common/Scrollbar';
import ExchangePriceDisplay from '../components/ExchangePriceDisplay';

type FilterTab = 'mycoins' | 'holdings';

function MarketBlock() {
  const dispatch = useDispatch<AppDispatch>();
  const { unifiedCoins, loading, error, selectedCoin } = useSelector((state: RootState) => state.coin);
  const registeredCoins = useSelector((state: RootState) => state.registeredCoin.registeredCoins);
  const [activeTab, setActiveTab] = useState<FilterTab>('mycoins');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const allCoins = dataManager.getAvailableCoins();
    const lowerQuery = searchQuery.toLowerCase();
    return allCoins.filter((coin) => coin.coinSymbol.toLowerCase().includes(lowerQuery) || coin.name.toLowerCase().includes(lowerQuery)).slice(0, 50);
  }, [searchQuery]);

  // 검색 핸들러
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  };

  // 탭별 데이터 필터링
  const getFilteredData = () => {
    switch (activeTab) {
      case 'holdings':
        return [];
      case 'mycoins':
      default:
        return unifiedCoins;
    }
  };

  const filteredData = getFilteredData();

  // 코인 선택 핸들러
  const handleSelectCoin = (market: string) => {
    dispatch(selectCoin(market));
  };

  // 코인 등록 핸들러
  const handleRegister = (coinSymbol: string) => {
    if (registeredCoins.length >= 10) {
      alert('최대 10개의 코인만 등록할 수 있습니다.');
      return;
    }
    dispatch(registerCoin(coinSymbol));
  };

  // 코인 해제 핸들러
  const handleUnregister = (coinSymbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(unregisterCoin(coinSymbol));
  };

  return (
    <div className="h-full overflow-hidden bg-[#ffffff]">
      {/* 검색바 */}
      <div className="px-2.5 py-2 border-b border-[#e9ecef]">
        <div className="relative">
          <input type="text" placeholder="코인 검색 (심볼 또는 이름)" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-[#ddd] rounded-md focus:outline-none focus:border-[#007bff] bg-[#f8f9fa]" />
          {searchQuery && (
            <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 오버레이 */}
      {isSearching ? (
        <Scrollbar className="h-[calc(100%-52px)]">
          {searchResults.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">검색 결과가 없습니다.</div>
          ) : (
            searchResults.map((coin) => {
              const isRegistered = registeredCoins.includes(coin.coinSymbol);
              const coinIconUrl = `https://static.upbit.com/logos/${coin.coinSymbol}.png`;
              return (
                <div key={coin.coinSymbol} className="flex px-2.5 py-2 gap-2 border-b border-[rgba(225,225,225,0.8)] hover:bg-[#F2F2F2] items-center">
                  <div className="flex items-center flex-1 gap-2">
                    <div className="w-[20px] h-[20px] overflow-hidden">
                      <img src={coinIconUrl} alt={coin.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-semibold text-[13px] text-[#26262C]">{coin.name}</div>
                      <div className="text-[11px] text-[#999]">{coin.coinSymbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#999]">
                    {coin.upbitSymbol && <span className="px-1 py-0.5 bg-[#093687]/10 text-[#093687] rounded">UPB</span>}
                    {coin.binanceSymbol && <span className="px-1 py-0.5 bg-[#F0B90B]/10 text-[#F0B90B] rounded">BIN</span>}
                  </div>
                  <button
                    onClick={() => (isRegistered ? dispatch(unregisterCoin(coin.coinSymbol)) : handleRegister(coin.coinSymbol))}
                    className={`px-3 py-1 text-xs rounded font-medium ${isRegistered ? 'bg-[#f0f0f0] text-[#999] hover:bg-[#e0e0e0]' : 'bg-[#007bff] text-white hover:bg-[#0056b3]'}`}
                  >
                    {isRegistered ? '해제' : '등록'}
                  </button>
                </div>
              );
            })
          )}
        </Scrollbar>
      ) : (
        <>
          {/* 필터링 탭 */}
          <div className="flex bg-[#f8f9fa] border-b border-[#e9ecef]">
            <button className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'mycoins' ? 'bg-white text-[#333] border-b-2 border-[#007bff]' : 'text-[#666] hover:text-[#333] hover:bg-[#f1f3f4]'}`} onClick={() => setActiveTab('mycoins')}>
              내 코인
            </button>
            <button className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'holdings' ? 'bg-white text-[#333] border-b-2 border-[#007bff]' : 'text-[#666] hover:text-[#333] hover:bg-[#f1f3f4]'}`} onClick={() => setActiveTab('holdings')}>
              보유
            </button>
          </div>

          {/* 카테고리 헤더 */}
          <div className="bg-[#444444] flex px-2.5 py-1 text-[11px] gap-2 text-[#ffffff] font-light border-b border-[#5C5C5C]">
            <div className="min-w-[154px]">이름</div>
            <div className="min-w-[104px]">현재가</div>
            <div>전일대비</div>
          </div>

          <Scrollbar className="h-[calc(100%-1rem)] text-[14px]">
            {filteredData.length === 0 && activeTab === 'holdings' ? (
              <div className="flex items-center justify-center h-32 text-gray-500">보유 코인 기능은 아직 개발 중입니다.</div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 gap-2">
                <span>등록된 코인이 없습니다.</span>
                <span className="text-xs text-gray-400">상단 검색창에서 코인을 검색하여 등록하세요.</span>
              </div>
            ) : (
              [...filteredData]
                .sort((a, b) => b.maxTradeVolume - a.maxTradeVolume)
                .map((coin) => {
                  const coinIconUrl = `https://static.upbit.com/logos/${coin.coinSymbol}.png`;
                  const selectSymbol = coin.upbit?.symbol || coin.binance?.symbol || coin.coinSymbol;

                  return (
                    <div key={coin.coinSymbol} className="flex px-2.5 py-1.5 gap-2 border-b border-[rgba(225,225,225,0.8)] hover:bg-[#F2F2F2] cursor-pointer group" onClick={() => handleSelectCoin(selectSymbol)}>
                      {/* 코인 정보 */}
                      <div className="flex items-center min-w-[154px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-[20px] h-[20px] overflow-hidden">
                              <img src={coinIconUrl} alt={coin.name} className="w-full h-full object-cover overflow-hidden" />
                            </div>
                            <div className="font-semibold text-[14px] text-[#26262C]">{coin.name}</div>
                          </div>
                          <div className="font-normal text-[14px] text-[#4C4C57]">{coin.coinSymbol}</div>
                        </div>
                      </div>

                      {/* 가격 정보 */}
                      <div className="flex-1 flex flex-col gap-1">
                        {coin.upbit && <ExchangePriceDisplay key={`${coin.coinSymbol}-upbit`} exchange="upbit" price={coin.upbit.price} change={coin.upbit.change as 'RISE' | 'FALL' | 'EVEN'} changeRate={coin.upbit.changeRate} coinSymbol={coin.coinSymbol} />}
                        {coin.binance && <ExchangePriceDisplay key={`${coin.coinSymbol}-binance`} exchange="binance" price={coin.binance.price} change={coin.binance.change as 'RISE' | 'FALL' | 'EVEN'} changeRate={coin.binance.changeRate} coinSymbol={coin.coinSymbol} />}
                      </div>

                      {/* 해제 버튼 (내 코인 탭에서만 호버 시 표시) */}
                      {activeTab === 'mycoins' && (
                        <button onClick={(e) => handleUnregister(coin.coinSymbol, e)} className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 text-[#999] hover:text-[#ff4444] text-sm self-center" title="등록 해제">
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })
            )}
          </Scrollbar>
        </>
      )}
    </div>
  );
}

export default MarketBlock;
