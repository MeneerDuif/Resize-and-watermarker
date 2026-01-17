
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dropzone } from './components/Dropzone';
import { ImageGrid } from './components/ImageGrid';
import { WatermarkSettings, WatermarkPosition, ResizeSettings, FileData, ProcessedImage } from './types';
import { processImage } from './services/imageProcessor';

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
    contrast: 0 // Default contrast value
  });

  const [resize, setResize] = useState<ResizeSettings>({
    maxWidth: 1200,
    quality: 0.85,
    format: 'image/jpeg'
  });

  const handleFilesAdded = (newFiles: File[]) => {
    const fileData: FileData[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));
    setFiles(prev => [...prev, ...fileData]);
  };

  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const results = await Promise.all(
        files.map(f => processImage(f.file, watermark, resize))
      );
      setProcessedImages(results);
    } catch (error) {
      console.error("Processing failed", error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, watermark, resize]);

  useEffect(() => {
    if (files.length > 0) {
      handleProcessAll();
    }
  }, [watermark, resize, files.length]);

  const clearAll = () => {
    setFiles([]);
    setProcessedImages([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white lg:flex-row">
      <Sidebar 
        watermark={watermark} 
        setWatermark={setWatermark} 
        resize={resize}
        setResize={setResize}
        isProcessing={isProcessing}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Dropzone onFilesAdded={handleFilesAdded} />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-[4px] border-black p-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Collection ({processedImages.length})
                </h2>
                <div className="flex gap-4">
                  <button 
                    onClick={clearAll}
                    className="px-6 py-2 text-sm font-black uppercase border-[4px] border-black hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleProcessAll}
                    disabled={isProcessing}
                    className="px-8 py-2 text-sm font-black uppercase bg-yellow-400 border-[4px] border-black hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
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

export default App;
