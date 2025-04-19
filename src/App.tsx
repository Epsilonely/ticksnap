import Block, { BlockType } from './block/Block';

function App() {
  return (
    <div className="flex justify-center w-full h-screen bg-[#333333]">
      <div className="grid grid-cols-12 grid-rows-[auto_1fr_1fr] gap-6 max-w-[1128px] w-full mx-auto h-full p-4">
        {/* 상단 행: 왼쪽 블록 (7/12) - 마켓 블록 */}
        <div className="col-span-7">
          <Block type={BlockType.BLOCK_TY_MARKET} />
        </div>

        {/* 상단 행: 오른쪽 블록 (5/12) */}
        <div className="col-span-5">
          <Block type={BlockType.BLOCK_TY_ALARM_HISTORY} />
        </div>

        {/* 중간 행: 전체 너비 블록 */}
        <div className="col-span-12">
          <Block />
        </div>

        {/* 하단 행: 전체 너비 블록 */}
        <div className="col-span-12">
          <Block />
        </div>
      </div>
    </div>
  );
}

export default App;
