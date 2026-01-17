import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import JSZip from 'jszip';

// --- CONFIGURATION & TYPES ---

const WatermarkPosition = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center',
  TILED: 'tiled'
} as const;

type WatermarkPositionType = typeof WatermarkPosition[keyof typeof WatermarkPosition];

interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPositionType;
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

// --- PURE BROWSER IMAGE PROCESSING ---

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
        if (!ctx) return reject('Failed to obtain 2D context');

        // Logic for resizing
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (img.width > resize.maxWidth) {
          const ratio = resize.maxWidth / img.width;
          targetWidth = resize.maxWidth;
          targetHeight = img.height * ratio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw original image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Watermark Setup
        ctx.globalAlpha = watermark.opacity;
        ctx.fillStyle = watermark.color;
        
        const scaleFactor = targetWidth / 1000; 
        const actualFontSize = Math.max(watermark.fontSize * scaleFactor, 12);
        ctx.font = `900 ${actualFontSize}px "Inter", sans-serif`;
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
        const sizeInBytes = Math.round((processedUrl.length * 3) / 4);

        resolve({
          id: Math.random().toString(36).substring(7),
          originalName: file.name,
          previewUrl: URL.createObjectURL(file),
          processedUrl,
          width: Math.round(targetWidth),
          height: Math.round(targetHeight),
          size: sizeInBytes
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject('Error reading input file');
    reader.readAsDataURL(file);
  });
};

// --- UI COMPONENTS ---

const Header: React.FC = () => (
  <header className="bg-white border-b-[8px] border-black px-8 py-6 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-[#FF0000] border-[5px] border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">WebSnap</h1>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Local Image Processing</p>
      </div>
    </div>
    <div className="hidden md:flex gap-2">
      <div className="w-6 h-14 bg-[#FFFF00] border-[4px] border-black"></div>
      <div className="w-12 h-14 bg-[#0000FF] border-[4px] border-black"></div>
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
  const updateWatermark = (key: keyof WatermarkSettings, value: any) => setWatermark(prev => ({ ...prev, [key]: value }));
  const updateResize = (key: keyof ResizeSettings, value: any) => setResize(prev => ({ ...prev, [key]: value }));

  return (
    <aside className="w-full lg:w-[400px] bg-white border-b-[8px] lg:border-b-0 lg:border-r-[8px] border-black h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto overflow-x-hidden">
      <div className="p-8 space-y-12">
        {/* Resize Controls */}
        <section className="space-y-6">
          <div className="bg-yellow-400 border-[5px] border-black p-3 -ml-10 pr-10 w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase tracking-widest">Global Resize</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase mb-2">Max Width (PX)</label>
              <input type="number" value={resize.maxWidth} onChange={(e) => updateResize('maxWidth', parseInt(e.target.value))} className="w-full px-4 py-4 bg-white border-[5px] border-black focus:bg-blue-50 focus:outline-none font-black text-lg" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-2 flex justify-between">Export Quality <span>{Math.round(resize.quality * 100)}%</span></label>
              <input type="range" min="0.1" max="1" step="0.05" value={resize.quality} className="w-full h-10 cursor-pointer" onChange={(e) => updateResize('quality', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-2">Output Format</label>
              <select value={resize.format} onChange={(e) => updateResize('format', e.target.value as any)} className="w-full px-4 py-4 bg-white border-[5px] border-black focus:outline-none font-black text-lg appearance-none cursor-pointer">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </div>
          </div>
        </section>

        {/* Watermark Controls */}
        <section className="space-y-6">
          <div className="bg-blue-600 border-[5px] border-black p-3 -ml-10 pr-10 w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase tracking-widest !text-white">Watermark Overlay</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase mb-2">Text Label</label>
              <input type="text" value={watermark.text} onChange={(e) => updateWatermark('text', e.target.value)} className="w-full px-4 py-4 bg-white border-[5px] border-black focus:bg-red-50 focus:outline-none font-black" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Font Weight</label>
                <input type="number" value={watermark.fontSize} onChange={(e) => updateWatermark('fontSize', parseInt(e.target.value))} className="w-full px-4 py-4 bg-white border-[5px] border-black font-black" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Tilt (DEG)</label>
                <input type="number" value={watermark.rotation} onChange={(e) => updateWatermark('rotation', parseInt(e.target.value))} className="w-full px-4 py-4 bg-white border-[5px] border-black font-black" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-2">Color Palette</label>
              <div className="flex gap-4">
                <input type="color" value={watermark.color} onChange={(e) => updateWatermark('color', e.target.value)} className="w-20 h-16 bg-white border-[5px] border-black cursor-pointer p-2" />
                <input type="text" value={watermark.color.toUpperCase()} readOnly className="flex-1 px-4 py-4 bg-gray-100 border-[5px] border-black font-black uppercase text-center" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-2 flex justify-between">Visibility <span>{Math.round(watermark.opacity * 100)}%</span></label>
              <input type="range" min="0" max="1" step="0.1" value={watermark.opacity} onChange={(e) => updateWatermark('opacity', parseFloat(e.target.value))} className="w-full h-10" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-2">Anchor Position</label>
              <div className="grid grid-cols-3 gap-0 border-[5px] border-black">
                {Object.values(WatermarkPosition).map((pos) => (
                  <button 
                    key={pos} 
                    onClick={() => updateWatermark('position', pos)} 
                    className={`px-1 py-4 text-[9px] font-black uppercase border-black border-r border-b last:border-r-0 transition-all ${watermark.position === pos ? 'bg-[#FF0000] !text-white' : 'bg-white hover:bg-yellow-200'}`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isProcessing && (
          <div className="flex items-center justify-center p-8 bg-black border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(255,0,0,1)]">
             <span className="text-white text-sm font-black uppercase tracking-[0.2em] animate-pulse">Processing Canvas...</span>
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
    <div className="max-w-4xl w-full p-6">
      <div 
        onClick={() => inputRef.current?.click()} 
        className="relative border-[10px] border-black p-24 text-center cursor-pointer hover:bg-yellow-50 transition-all duration-300 bg-white shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] group"
      >
        <input type="file" ref={inputRef} multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <div className="flex flex-col items-center gap-10">
          <div className="w-32 h-32 bg-yellow-400 border-[8px] border-black flex items-center justify-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
            <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="space-y-4">
            <h3 className="text-5xl font-black uppercase tracking-tighter">Load Collection</h3>
            <p className="font-black uppercase text-xs tracking-[0.3em] opacity-40">Drop images here or click to browse files</p>
          </div>
          <div className="flex gap-4">
            {['JPEG', 'PNG', 'WEBP'].map(ext => (
              <span key={ext} className="text-[12px] font-black border-[4px] border-black px-6 py-2 uppercase bg-white">{ext}</span>
            ))}
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
      const zip = new JSZip();
      images.forEach((img, i) => {
        const base64Data = img.processedUrl.split(',')[1];
        zip.file(`WEBSNAP_${i + 1}_${img.originalName}`, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `WEBSNAP_BUNDLE_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) { 
      console.error('Batch ZIP generation failed', e); 
    } finally { 
      setIsZipping(false); 
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {images.length > 0 && (
        <div className="flex justify-end pr-4">
          <button 
            onClick={handleDownloadAll} 
            disabled={isZipping} 
            className="group relative flex items-center gap-6 bg-black px-12 py-5 border-[6px] border-black hover:bg-[#0000FF] transition-all disabled:opacity-50 shadow-[10px_10px_0px_0px_rgba(255,0,0,1)]"
          >
            <span className="text-lg font-black uppercase tracking-[0.1em] !text-white">
                {isZipping ? 'Bundling...' : 'Export Collection (ZIP)'}
            </span>
            <div className="w-10 h-10 bg-[#FFFF00] border-[4px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {images.map((img) => (
          <div key={img.id} className="bg-white border-[8px] border-black overflow-hidden flex flex-col group shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(255,0,0,1)] transition-all">
            <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center border-b-[8px] border-black overflow-hidden">
              <img src={img.processedUrl} alt={img.originalName} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 p-8">
                <button 
                  onClick={() => handleDownload(img)} 
                  className="w-full bg-blue-600 border-[6px] border-black py-4 text-sm font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  Direct Export
                </button>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-lg font-black uppercase tracking-tight truncate">{img.originalName}</p>
              <div className="flex flex-wrap gap-3">
                <span className="text-[11px] font-black uppercase border-[4px] border-black px-4 py-2 bg-white">{img.width} × {img.height}</span>
                <span className="text-[11px] font-black uppercase border-[4px] border-black px-4 py-2 bg-[#0000FF] !text-white">{(img.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <div className="h-8 flex border-t-[8px] border-black mt-auto">
               <div className="flex-1 bg-[#FF0000]"></div>
               <div className="flex-[0.5] bg-[#FFFF00] border-l-[8px] border-black"></div>
               <div className="flex-[0.2] bg-white border-l-[8px] border-black"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- APPLICATION ENTRY POINT ---

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    text: '© WEBSNAP CORE',
    fontSize: 32,
    color: '#000000',
    opacity: 0.7,
    position: WatermarkPosition.BOTTOM_RIGHT,
    padding: 30,
    rotation: -15,
    tilingGap: 40,
    contrast: 0
  });

  const [resize, setResize] = useState<ResizeSettings>({ 
    maxWidth: 1600, 
    quality: 0.9, 
    format: 'image/jpeg' 
  });

  const runPipeline = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const results = await Promise.all(files.map(file => processImage(file, watermark, resize)));
      setProcessedImages(results);
    } catch (e) { 
      console.error('Core Pipeline Error:', e); 
    } finally { 
      setIsProcessing(false); 
    }
  }, [files, watermark, resize]);

  useEffect(() => { 
    if (files.length > 0) runPipeline(); 
  }, [watermark, resize, files, runPipeline]);

  return (
    <div className="flex flex-col min-h-screen bg-white lg:flex-row">
      {/* Tool Controls */}
      <Sidebar 
        watermark={watermark} 
        setWatermark={setWatermark} 
        resize={resize} 
        setResize={setResize} 
        isProcessing={isProcessing} 
      />

      {/* Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-10 overflow-y-auto bg-[#fafafa]">
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Dropzone onFilesAdded={setFiles} />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white border-[8px] border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Collection Workspace</h2>
                  <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mt-2">{processedImages.length} Assets Loaded</p>
                </div>
                <div className="flex gap-6 w-full sm:w-auto">
                  <button 
                    onClick={() => { setFiles([]); setProcessedImages([]); }} 
                    className="flex-1 px-10 py-4 text-sm font-black uppercase border-[6px] border-black hover:bg-red-600 transition-colors bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={runPipeline} 
                    disabled={isProcessing} 
                    className="flex-1 px-12 py-4 text-sm font-black uppercase bg-yellow-400 border-[6px] border-black hover:bg-blue-600 hover:!text-white transition-all disabled:opacity-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
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

// --- INITIALIZATION ---

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}