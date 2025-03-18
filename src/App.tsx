import React from 'react';
import logo from './logo.svg';
import reference from './reference.svg';

function App() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className='flex flex-col items-start relative'>
        <div className='items-center justify-center gap-1 px-5 py-1.5 bg-[#333333] flex relative self-stretch w-full flex-[0_0_auto]'>
          <img className='relative w-10 h-10' alt="upbit" src={logo}/>
          <div className='relative w-fit mt-[-1.00] font-medium text-[#F5F5F5] text-2xl text-center tracking-[-0.35px] leading-[19.6px] whitespace-nowrap'>
            거래소
          </div>
        </div>
        <div className='flex-col items-start px-2 py-0.5 border-b-[0.2px] [border-bottom-style:solid] border-[#5c5c5c] flex relative self-stretch w-full flex-[0_0_auto]'>
          empty
        </div>
      </div>
    </div>
  );
}

export default App;