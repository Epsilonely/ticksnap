import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { dataManager } from './services/DataManager';
import Block, { BlockType } from './block/Block';

type MiddleTabType = 'exchange' | 'investment' | 'leaderboard';

function App() {
  const [activeMiddleTab, setActiveMiddleTab] = useState<MiddleTabType>('exchange');

  // DataManager 초기화
  useEffect(() => {
    const initializeDataManager = async () => {
      try {
        // Redux dispatch 설정
        dataManager.setDispatch(store.dispatch);

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

    // 컴포넌트 언마운트 시 정리
    return () => {
      dataManager.destroy();
    };
  }, []);

  return (
    <Provider store={store}>
      <div className="flex justify-center w-full h-screen bg-[#F5F5F5]">
        <div className="flex gap-2 md:max-w-[1024px] lg:max-w-[1128px] xl:max-w-[1980px] 2xl:max-w-[2400px] w-full mx-auto h-full p-2 sm:p-1 lg:p-2">
          {/* 왼쪽 사이드바 - 마켓 블록 */}
          <div className="min-w-[380px]">
            <Block type={BlockType.BLOCK_TY_MARKET} />
          </div>

          <div className="flex-1 grid grid-rows-[1fr_auto_1fr] gap-2">
            {/* 상단 행 */}
            <div>
              <Block type={BlockType.BLOCK_TY_ALARM_HISTORY} />
            </div>

            {/* 중간 행: 탭이 있는 블록 */}
            <div className="min-h-[680px] max-h-[1000px] overflow-hidden">
              {/* 탭 헤더 */}
              <div className="flex bg-[#F5F5F5] font-semibold rounded-2xl mb-2">
                <button className={`flex-1 m-1 px-6 py-2 text-base transition-colors rounded-xl ${activeMiddleTab === 'exchange' ? 'bg-white text-[#212833]' : 'text-[#999999] hover:text-[#FFFFFF] hover:bg-[#999999]'}`} onClick={() => setActiveMiddleTab('exchange')}>
                  Trader
                </button>
                <button className={`flex-1 m-1 px-6 py-2 text-base  transition-colors rounded-xl ${activeMiddleTab === 'investment' ? 'bg-white text-[#212833]' : 'text-[#999999] hover:text-[#FFFFFF] hover:bg-[#999999]'}`} onClick={() => setActiveMiddleTab('investment')}>
                  Assets
                </button>
                <button className={`flex-1 m-1 px-6 py-2 text-base transition-colors rounded-xl ${activeMiddleTab === 'leaderboard' ? 'bg-white text-[#212833]' : 'text-[#999999] hover:text-[#FFFFFF] hover:bg-[#999999]'}`} onClick={() => setActiveMiddleTab('leaderboard')}>
                  Leaderboard
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="h-[calc(100%-52px)]">
                {(() => {
                  switch (activeMiddleTab) {
                    case 'exchange':
                      return <Block type={BlockType.BLOCK_TY_COIN_DETAIL} />;
                    case 'investment':
                      return <Block type={BlockType.BLOCK_TY_PORTFOLIO} />;
                    case 'leaderboard':
                      return <Block type={BlockType.BLOCK_TY_LEADERBOARD} />;
                    default:
                      return <Block type={BlockType.BLOCK_TY_COIN_DETAIL} />;
                  }
                })()}
              </div>
            </div>

            {/* 하단 행: 전체 너비 블록 */}
            <div>
              <Block />
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
