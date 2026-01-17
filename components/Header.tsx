
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b-[6px] border-black px-8 py-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#FF0000] border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tighter">WebSnap <span className="text-gray-400">/ Resizer</span></h1>
      </div>
      
      <div className="hidden md:flex gap-1 h-12">
        <div className="w-4 bg-[#FFFF00] border-l-[4px] border-black"></div>
        <div className="w-8 bg-[#0000FF] border-l-[4px] border-black"></div>
      </div>
    </header>
  );
};
