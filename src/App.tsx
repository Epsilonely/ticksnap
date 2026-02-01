import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { dataManager } from './services/DataManager';
import Block, { BlockType } from './block/Block';

type MiddleTabType = 'exchange' | 'investment';

function App() {
  const [activeMiddleTab, setActiveMiddleTab] = useState<MiddleTabType>('exchange');

  // DataManager 초기화
  useEffect(() => {
    const initializeDataManager = async () => {
      try {
        // Redux dispatch 설정
        dataManager.setDispatch(store.dispatch);

        // 등록 코인 로드 → DataManager에 전달 (초기화 전)
        const registeredCoins = store.getState().registeredCoin.registeredCoins;
        dataManager.updateRegisteredCoins(registeredCoins);

        // DataManager 초기화
        await dataManager.initialize();

        // localStorage에서 기존 관심 코인 불러와서 웹소켓 연결
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          console.log('기존 관심 코인 복원:', favorites);

          // 관심 코인 심볼들을 추출 (코인 심볼로 변환)
          const favoriteSymbols = favorites.map((fav: string) => {
            // KRW-BTC -> BTC, BTCUSDT -> BTC 형태로 변환
            if (fav.startsWith('KRW-')) {
              return fav.replace('KRW-', '');
            }
            if (fav.endsWith('USDT')) {
              return fav.replace('USDT', '');
            }
            return fav;
          });

          // DataManager에 관심 코인 전달하여 웹소켓 연결
          dataManager.updateFavoriteCoins(favoriteSymbols);
        }

        console.log('앱 초기화 완료');
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      }
    };

    initializeDataManager();

    // 등록 코인 변경 감지 → DataManager 동기화
    let prevRegisteredCoins = store.getState().registeredCoin.registeredCoins;
    const unsubscribe = store.subscribe(() => {
      const currentRegisteredCoins = store.getState().registeredCoin.registeredCoins;
      if (currentRegisteredCoins !== prevRegisteredCoins) {
        prevRegisteredCoins = currentRegisteredCoins;
        dataManager.updateRegisteredCoins(currentRegisteredCoins);
      }
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      unsubscribe();
      dataManager.destroy();
    };
  }, []);

  return (
    <Provider store={store}>
      <div className="flex w-full h-screen bg-gradient-to-b from-white to-gray-200 p-2">
        <div className="flex gap-4 w-full h-full">
          {/* 왼쪽 사이드바 - 마켓 블록 */}
          <div className="min-w-[380px]">
            <Block type={BlockType.BLOCK_TY_MARKET} />
          </div>

          <div className="flex flex-col w-full h-full">
            {/* 탭이 있는 블록 */}
            <div className="flex flex-col w-full h-full">
              {/* 탭 헤더 */}
              <div className="flex-shrink-0 flex w-fit self-center bg-[#F5F5F5] font-semibold rounded-2xl mb-2">
                <button className={`flex-1 m-1 px-6 py-2 text-base transition-colors rounded-xl ${activeMiddleTab === 'exchange' ? 'bg-white text-[#212833] font-bold' : 'text-[#999999] hover:text-[#FFFFFF] hover:bg-[#999999]'}`} onClick={() => setActiveMiddleTab('exchange')}>
                  Trader
                </button>
                <button className={`flex-1 m-1 px-6 py-2 text-base  transition-colors rounded-xl ${activeMiddleTab === 'investment' ? 'bg-white text-[#212833] font-bold' : 'text-[#999999] hover:text-[#FFFFFF] hover:bg-[#999999]'}`} onClick={() => setActiveMiddleTab('investment')}>
                  Assets
                </button>
              </div>

              {/* 탭 컨텐츠 - 남은 공간 모두 차지 */}
              <div className="flex-1 min-h-0 w-full">
                {(() => {
                  switch (activeMiddleTab) {
                    case 'exchange':
                      return <Block type={BlockType.BLOCK_TY_COIN_DETAIL} />;
                    case 'investment':
                      return <Block type={BlockType.BLOCK_TY_PORTFOLIO} />;
                    default:
                      return <Block type={BlockType.BLOCK_TY_COIN_DETAIL} />;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
