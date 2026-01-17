
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import JSZip from 'https://esm.sh/jszip@3.10.1';

// --- TYPES ---

enum WatermarkPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center',
  TILED = 'tiled'
}

interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  padding: number;
  rotation: number;
  tilingGap: number;
  contrast: number;
}

interface ResizeSettings {
  maxWidth: number;
  quality: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

interface ProcessedImage {
  id: string;
  originalName: string;
  previewUrl: string;
  processedUrl: string;
  width: number;
  height: number;
  size: number;
}

interface FileData {
  file: File;
  id: string;
}

// --- SERVICES ---

const processImage = (
  file: File, 
  watermark: WatermarkSettings, 
  resize: ResizeSettings
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        let targetWidth = img.width;
        let targetHeight = img.height;

        if (img.width > resize.maxWidth) {
          const ratio = resize.maxWidth / img.width;
          targetWidth = resize.maxWidth;
          targetHeight = img.height * ratio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        ctx.globalAlpha = watermark.opacity;
        ctx.fillStyle = watermark.color;
        
        const scaleFactor = targetWidth / 1000; 
        const actualFontSize = Math.max(watermark.fontSize * scaleFactor, 12);
        ctx.font = `bold ${actualFontSize}px "Inter", sans-serif`;
        ctx.textBaseline = 'middle';
        
        const metrics = ctx.measureText(watermark.text);
        const textWidth = metrics.width;
        const textHeight = actualFontSize;

        const drawWatermarkAt = (x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((watermark.rotation * Math.PI) / 180);
            
            if (watermark.contrast !== 0) {
              const contrastValue = 1 + (watermark.contrast / 100);
              ctx.filter = `contrast(${contrastValue})`;
            }

            ctx.fillText(watermark.text, -textWidth / 2, 0);
            ctx.restore();
        };

        const padding = watermark.padding * scaleFactor;
        
        if (watermark.position === WatermarkPosition.TILED) {
            const gapX = textWidth * (watermark.tilingGap / 100);
            const gapY = textHeight * (watermark.tilingGap / 100);
            const stepX = textWidth + gapX;
            const stepY = textHeight + gapY;

            for (let x = -textWidth; x < targetWidth + textWidth; x += stepX) {
                for (let y = -textHeight; y < targetHeight + textHeight; y += stepY) {
                    drawWatermarkAt(x, y);
                }
            }
        } else {
            let x = 0;
            let y = 0;
            switch (watermark.position) {
                case WatermarkPosition.TOP_LEFT:
                    x = padding + textWidth / 2;
                    y = padding + textHeight / 2;
                    break;
                case WatermarkPosition.TOP_RIGHT:
                    x = targetWidth - padding - textWidth / 2;
                    y = padding + textHeight / 2;
                    break;
                case WatermarkPosition.BOTTOM_LEFT:
                    x = padding + textWidth / 2;
                    y = targetHeight - padding - textHeight / 2;
                    break;
                case WatermarkPosition.BOTTOM_RIGHT:
                    x = targetWidth - padding - textWidth / 2;
                    y = targetHeight - padding - textHeight / 2;
                    break;
                case WatermarkPosition.CENTER:
                    x = targetWidth / 2;
                    y = targetHeight / 2;
                    break;
            }
            drawWatermarkAt(x, y);
        }

        const processedUrl = canvas.toDataURL(resize.format, resize.quality);
        const head = `data:${resize.format};base64,`.length;
        const size = Math.round((processedUrl.length - head) * 3 / 4);

        resolve({
          id: Math.random().toString(36).substring(7),
          originalName: file.name,
          previewUrl: URL.createObjectURL(file),
          processedUrl,
          width: Math.round(targetWidth),
          height: Math.round(targetHeight),
          size
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- COMPONENTS ---

const Header: React.FC = () => (
  <header className="bg-white border-b-[6px] border-black px-8 py-6 flex items-center justify-between sticky top-0 z-10 text-black">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-[#FF0000] border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-black uppercase tracking-tighter">WebSnap <span className="text-black opacity-50">/ Resizer</span></h1>
    </div>
    <div className="hidden md:flex gap-1 h-12">
      <div className="w-4 bg-[#FFFF00] border-l-[4px] border-black"></div>
      <div className="w-8 bg-[#0000FF] border-l-[4px] border-black"></div>
    </div>
  </header>
);

const Sidebar: React.FC<{
  watermark: WatermarkSettings;
  setWatermark: React.Dispatch<React.SetStateAction<WatermarkSettings>>;
  resize: ResizeSettings;
  setResize: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  isProcessing: boolean;
}> = ({ watermark, setWatermark, resize, setResize, isProcessing }) => {
  const handleChange = (key: keyof WatermarkSettings, value: any) => setWatermark(prev => ({ ...prev, [key]: value }));
  const handleResizeChange = (key: keyof ResizeSettings, value: any) => setResize(prev => ({ ...prev, [key]: value }));

  return (
    <aside className="w-full lg:w-96 bg-white border-b-[6px] lg:border-b-0 lg:border-r-[6px] border-black h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto text-black">
      <div className="p-8 space-y-12">
        <section className="space-y-6">
          <div className="bg-yellow-400 border-[4px] border-black p-2 -ml-8 pr-8 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase tracking-widest text-black">Dimensions</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase mb-2 text-black">Max Width (px)</label>
              <input type="number" value={resize.maxWidth} onChange={(e) => handleResizeChange('maxWidth', parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-[4px] border-black focus:bg-blue-50 focus:outline-none font-bold text-black" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 flex justify-between text-black">Quality <span>{Math.round(resize.quality * 100)}%</span></label>
              <input type="range" min="0.1" max="1" step="0.05" value={resize.quality} className="w-full h-8 appearance-none bg-white border-[4px] border-black accent-black cursor-pointer" onChange={(e) => handleResizeChange('quality', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 text-black">Format</label>
              <select value={resize.format} onChange={(e) => handleResizeChange('format', e.target.value)} className="w-full px-4 py-3 bg-white border-[4px] border-black focus:outline-none font-bold appearance-none cursor-pointer text-black">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-blue-600 border-[4px] border-black p-2 -ml-8 pr-8 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
            <h3 className="text-sm font-black uppercase tracking-widest">Watermark</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase mb-2 text-black">Text Content</label>
              <input type="text" value={watermark.text} onChange={(e) => handleChange('text', e.target.value)} className="w-full px-4 py-3 bg-white border-[4px] border-black focus:bg-blue-50 focus:outline-none font-bold text-black" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2 text-black">Font Size</label>
                <input type="number" value={watermark.fontSize} onChange={(e) => handleChange('fontSize', parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-[4px] border-black font-bold text-black" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2 text-black">Rotation</label>
                <input type="number" value={watermark.rotation} onChange={(e) => handleChange('rotation', parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-[4px] border-black font-bold text-black" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 text-black">Color</label>
              <div className="flex gap-3">
                <input type="color" value={watermark.color} onChange={(e) => handleChange('color', e.target.value)} className="w-16 h-12 bg-white border-[4px] border-black cursor-pointer appearance-none p-1" />
                <input type="text" value={watermark.color.toUpperCase()} onChange={(e) => handleChange('color', e.target.value)} className="flex-1 px-4 py-3 bg-white border-[4px] border-black font-bold uppercase text-sm text-black" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 flex justify-between text-black">Opacity <span>{watermark.opacity}</span></label>
              <input type="range" min="0.1" max="1" step="0.1" value={watermark.opacity} onChange={(e) => handleChange('opacity', parseFloat(e.target.value))} className="w-full h-8 appearance-none bg-[#FFFF00] border-[4px] border-black accent-black cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 flex justify-between text-black">Contrast <span>{watermark.contrast}</span></label>
              <input type="range" min="-100" max="100" step="1" value={watermark.contrast} onChange={(e) => handleChange('contrast', parseInt(e.target.value))} className="w-full h-8 appearance-none bg-[#FF0000] border-[4px] border-black accent-black cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-2 text-black">Position</label>
              <div className="grid grid-cols-3 gap-0 border-[4px] border-black">
                {Object.values(WatermarkPosition).map((pos) => (
                  <button key={pos} onClick={() => handleChange('position', pos)} className={`px-2 py-4 text-[9px] font-black uppercase border-black border-r border-b transition-all ${watermark.position === pos ? 'bg-red-600 text-black' : 'bg-white text-black hover:bg-yellow-200'}`}>
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isProcessing && (
          <div className="flex items-center justify-center p-6 bg-black text-black text-xs font-black uppercase tracking-widest animate-pulse border-[4px] border-black bg-opacity-20">
            Rendering...
          </div>
        )}
      </div>
    </aside>
  );
};

const Dropzone: React.FC<{ onFilesAdded: (files: File[]) => void }> = ({ onFilesAdded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onFilesAdded(Array.from(e.target.files));
  };
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) onFilesAdded(Array.from(e.dataTransfer.files)); }} className="max-w-3xl w-full p-4">
      <div onClick={() => inputRef.current?.click()} className="relative border-[8px] border-black p-16 text-center cursor-pointer hover:bg-yellow-50 transition-all duration-300 bg-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <input type="file" ref={inputRef} multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-24 bg-yellow-400 border-[6px] border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Import Canvas</h3>
            <p className="text-black font-bold uppercase text-sm tracking-widest">Select files to begin</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {['JPG', 'PNG', 'WEBP'].map(ext => <span key={ext} className="text-[10px] font-black border-[4px] border-black px-3 py-1 uppercase text-black">{ext}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageGrid: React.FC<{ images: ProcessedImage[] }> = ({ images }) => {
  const [isZipping, setIsZipping] = useState(false);
  const handleDownload = (img: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = img.processedUrl;
    link.download = `WEBSNAP_${img.originalName}`;
    link.click();
  };
  const handleDownloadAll = async () => {
    if (!images.length) return;
    setIsZipping(true);
    try {
      const zip = new (JSZip as any)();
      images.forEach((img, i) => zip.file(`WEBSNAP_${i + 1}_${img.originalName}`, img.processedUrl.split(',')[1], { base64: true }));
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `WEBSNAP_BUNDLE_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) { console.error(e); } finally { setIsZipping(false); }
  };
  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleDownloadAll} disabled={isZipping} className="group relative flex items-center gap-3 bg-black text-black px-8 py-4 border-[4px] border-black hover:bg-[#0000FF] transition-all disabled:opacity-50">
            <span className="text-sm font-black uppercase tracking-widest text-white group-hover:text-black">
                {isZipping ? 'Bundling...' : 'Download All (ZIP)'}
            </span>
            <div className="w-6 h-6 bg-[#FFFF00] border-[2px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-600 border-[2px] border-black"></div>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
        {images.map((img) => (
          <div key={img.id} className="bg-white border-[6px] border-black overflow-hidden flex flex-col group shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(255,0,0,1)] transition-all">
            <div className="relative aspect-video bg-gray-100 flex items-center justify-center border-b-[6px] border-black">
              <img src={img.processedUrl} alt={img.originalName} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => handleDownload(img)} className="bg-blue-600 text-black border-[4px] border-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors">Export</button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-black uppercase tracking-tight truncate text-black">{img.originalName}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[10px] font-black uppercase border-[3px] border-black px-2 py-1 bg-white text-black">{img.width} × {img.height}</span>
                <span className="text-[10px] font-black uppercase border-[3px] border-black px-2 py-1 bg-[#0000FF] text-black">{(img.size / 1024).toFixed(1)} KB</span>
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

// --- MAIN APP ---

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    text: '© WEBSNAP',
    fontSize: 24,
    color: '#000000',
    opacity: 0.8,
    position: WatermarkPosition.BOTTOM_RIGHT,
    padding: 20,
    rotation: 0,
    tilingGap: 50,
    contrast: 0
  });
  const [resize, setResize] = useState<ResizeSettings>({ maxWidth: 1200, quality: 0.85, format: 'image/jpeg' });

  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const results = await Promise.all(files.map(f => processImage(f.file, watermark, resize)));
      setProcessedImages(results);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  }, [files, watermark, resize]);

  useEffect(() => { if (files.length > 0) handleProcessAll(); }, [watermark, resize, files.length, handleProcessAll]);

  return (
    <div className="flex flex-col min-h-screen bg-white lg:flex-row text-black">
      <Sidebar watermark={watermark} setWatermark={setWatermark} resize={resize} setResize={setResize} isProcessing={isProcessing} />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {files.length === 0 ? <div className="h-full flex items-center justify-center text-black"><Dropzone onFilesAdded={fs => setFiles(fs.map(f => ({ file: f, id: Math.random().toString(36) })))} /></div> : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-[4px] border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Collection ({processedImages.length})</h2>
                <div className="flex gap-4">
                  <button onClick={() => { setFiles([]); setProcessedImages([]); }} className="px-6 py-2 text-sm font-black uppercase border-[4px] border-black hover:bg-red-600 hover:text-black transition-colors text-black">Clear</button>
                  <button onClick={handleProcessAll} disabled={isProcessing} className="px-8 py-2 text-sm font-black uppercase bg-yellow-400 border-[4px] border-black hover:bg-blue-600 hover:text-black transition-colors disabled:opacity-50 text-black">
                    {isProcessing ? 'Syncing...' : 'Sync Settings'}
                  </button>
                </div>
              </div>
              <ImageGrid images={processedImages} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- RENDER ---

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
