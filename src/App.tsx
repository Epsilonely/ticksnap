import { Provider } from 'react-redux';
import { store } from './store';
import Block, { BlockType } from './block/Block';

function App() {
  return (
    <Provider store={store}>
      <div className="flex justify-center w-full h-screen bg-[#CCCCCC]">
        <div className="flex gap-2 sm:gap-2 lg:gap-4 md:max-w-[1024px] lg:max-w-[1128px] xl:max-w-[1980px] 2xl:max-w-[2400px] w-full mx-auto h-full p-2 sm:p-4 lg:p-6">
          {/* 왼쪽 사이드바 - 전체 너비의 약 30% - 마켓 블록 */}
          <div className="min-w-[430px]">
            <Block type={BlockType.BLOCK_TY_MARKET} />
          </div>

          <div className="flex-1 grid grid-rows-[1fr_auto_1fr] gap-4 sm:gap-6 lg:gap-8">
            {/* 상단 행: 오른쪽 블록 (5/12) */}
            <div>
              <Block type={BlockType.BLOCK_TY_ALARM_HISTORY} />
            </div>

            {/* 중간 행: 전체 너비 블록 */}
            <div className="min-h-[680px] max-h-[680px]">
              <Block type={BlockType.BLOCK_TY_COIN_DETAIL} />
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
