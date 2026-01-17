
import React, { useRef } from 'react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="max-w-3xl w-full p-4"
    >
      <div 
        onClick={() => inputRef.current?.click()}
        className="relative border-[8px] border-black p-16 text-center cursor-pointer hover:bg-yellow-50 transition-all duration-300 bg-white"
      >
        <input 
          type="file" 
          ref={inputRef}
          multiple 
          accept="image/*" 
          onChange={handleFileChange}
          className="hidden" 
        />
        
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-24 bg-yellow-400 border-[6px] border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter">Import Canvas</h3>
            <p className="text-gray-600 font-bold uppercase text-sm tracking-widest">Select files to begin</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {['JPG', 'PNG', 'WEBP'].map(ext => (
              <span key={ext} className="text-[10px] font-black border-[4px] border-black px-3 py-1 uppercase">{ext}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
