
import React from 'react';
import { WatermarkSettings, WatermarkPosition, ResizeSettings } from '../types';

interface SidebarProps {
  watermark: WatermarkSettings;
  setWatermark: React.Dispatch<React.SetStateAction<WatermarkSettings>>;
  resize: ResizeSettings;
  setResize: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  isProcessing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  watermark, 
  setWatermark, 
  resize, 
  setResize,
  isProcessing 
}) => {
  const handleChange = (key: keyof WatermarkSettings, value: any) => {
    setWatermark(prev => ({ ...prev, [key]: value }));
  };

  const handleResizeChange = (key: keyof ResizeSettings, value: any) => {
    setResize(prev => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="w-full lg:w-96 bg-white border-b-[6px] lg:border-b-0 lg:border-r-[6px] border-black h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
      <div className="p-8 space-y-12">
        {/* Resize Controls */}
        <section className="space-y-6">
          <div className="bg-yellow-400 border-[4px] border-black p-2 -ml-8 pr-8 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase tracking-widest">Dimensions</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase mb-2">Max Width (px)</label>
              <input 
                type="number"
                value={resize.maxWidth}
                onChange={(e) => handleResizeChange('maxWidth', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border-[4px] border-black focus:bg-blue-50 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-2 flex justify-between">
                Quality <span>{Math.round(resize.quality * 100)}%</span>
              </label>
              <input 
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={resize.quality}
                className="w-full h-8 appearance-none bg-white border-[4px] border-black accent-black cursor-pointer"
                onChange={(e) => handleResizeChange('quality', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-2">Format</label>
              <select 
                value={resize.format}
                onChange={(e) => handleResizeChange('format', e.target.value)}
                className="w-full px-4 py-3 bg-white border-[4px] border-black focus:outline-none font-bold appearance-none cursor-pointer"
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </div>
          </div>
        </section>

        {/* Watermark Controls */}
        <section className="space-y-6">
          <div className="bg-blue-600 border-[4px] border-black p-2 -ml-8 pr-8 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
            <h3 className="text-sm font-black uppercase tracking-widest">Watermark</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase mb-2">Text Content</label>
              <input 
                type="text"
                value={watermark.text}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full px-4 py-3 bg-white border-[4px] border-black focus:bg-blue-50 focus:outline-none font-bold"
                placeholder="LABEL..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2">Font Size</label>
                <input 
                  type="number"
                  value={watermark.fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border-[4px] border-black font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Rotation</label>
                <input 
                  type="number"
                  value={watermark.rotation}
                  onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border-[4px] border-black font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2">Color</label>
                <div className="flex gap-3">
                  <input 
                    type="color"
                    value={watermark.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-16 h-12 bg-white border-[4px] border-black cursor-pointer appearance-none p-1"
                  />
                  <input 
                    type="text"
                    value={watermark.color.toUpperCase()}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="flex-1 px-4 py-3 bg-white border-[4px] border-black font-bold uppercase text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 flex justify-between">
                  Opacity <span>{watermark.opacity}</span>
                </label>
                <input 
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={watermark.opacity}
                  onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                  className="w-full h-8 appearance-none bg-[#FFFF00] border-[4px] border-black accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 flex justify-between">
                  Contrast <span>{watermark.contrast}</span>
                </label>
                <input 
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={watermark.contrast}
                  onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
                  className="w-full h-8 appearance-none bg-[#FF0000] border-[4px] border-black accent-black cursor-pointer"
                />
              </div>
            </div>

            {watermark.position === WatermarkPosition.TILED && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-xs font-black uppercase mb-2 flex justify-between">
                  Tiling Density <span>{watermark.tilingGap}%</span>
                </label>
                <input 
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={watermark.tilingGap}
                  onChange={(e) => handleChange('tilingGap', parseInt(e.target.value))}
                  className="w-full h-8 appearance-none bg-[#FFFF00] border-[4px] border-black accent-black cursor-pointer"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase mb-2">Position</label>
              <div className="grid grid-cols-3 gap-0 border-[4px] border-black">
                {Object.values(WatermarkPosition).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handleChange('position', pos)}
                    className={`px-2 py-4 text-[9px] font-black uppercase border-black border-r border-b transition-all ${
                      watermark.position === pos 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white text-black hover:bg-yellow-200'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isProcessing && (
          <div className="flex items-center justify-center p-6 bg-black text-white text-xs font-black uppercase tracking-widest animate-pulse border-[4px] border-black">
            Rendering...
          </div>
        )}
      </div>
    </aside>
  );
};
