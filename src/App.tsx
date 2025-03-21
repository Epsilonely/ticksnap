import Block, { BlockType } from "./block/Block";



function App() {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-0 w-full h-screen bg-[#FF0000]/15 p-4">
        <Block type={BlockType.BLOCK_TY_MARKET}/>
        <Block />
        <Block />
        <Block />
        <Block type={BlockType.BLOCK_TY_MARKET}/>
        <Block />
        <Block />
        <Block />
    </div>
  );
}

export default App;