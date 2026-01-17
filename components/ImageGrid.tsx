
import React, { useState } from 'react';
import { ProcessedImage } from '../types';
import JSZip from 'https://esm.sh/jszip@3.10.1';

interface ImageGridProps {
  images: ProcessedImage[];
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [isZipping, setIsZipping] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (img: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = img.processedUrl;
    link.download = `WEBSNAP_${img.originalName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      
      images.forEach((img, index) => {
        const base64Data = img.processedUrl.split(',')[1];
        const fileName = `WEBSNAP_${index + 1}_${img.originalName}`;
        zip.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `WEBSNAP_BUNDLE_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to generate ZIP archive', error);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="group relative flex items-center gap-3 bg-black text-white px-8 py-4 border-[4px] border-black hover:bg-[#0000FF] transition-all disabled:opacity-50"
          >
            <span className="text-sm font-black uppercase tracking-widest">
              {isZipping ? 'Bundling...' : 'Download All (ZIP)'}
            </span>
            <div className="w-6 h-6 bg-[#FFFF00] border-[2px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-600 border-[2px] border-black"></div>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
        {images.map((img) => (
          <div key={img.id} className="bg-white border-[6px] border-black overflow-hidden flex flex-col group shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(255,0,0,1)] transition-all">
            <div className="relative aspect-video bg-gray-100 flex items-center justify-center border-b-[6px] border-black">
              <img 
                src={img.processedUrl} 
                alt={img.originalName}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button 
                  onClick={() => handleDownload(img)}
                  className="bg-blue-600 text-white border-[4px] border-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-black transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-tight truncate" title={img.originalName}>
                  {img.originalName}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-[10px] font-black uppercase border-[3px] border-black px-2 py-1 bg-white">
                    {img.width} × {img.height}
                  </span>
                  <span className="text-[10px] font-black uppercase border-[3px] border-black px-2 py-1 bg-[#0000FF] text-white">
                    {formatSize(img.size)}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-6 flex border-t-[4px] border-black">
               <div className="flex-1 bg-red-600"></div>
               <div className="flex-[0.5] bg-yellow-400 border-l-[4px] border-black"></div>
               <div className="flex-[0.2] bg-white border-l-[4px] border-black"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
