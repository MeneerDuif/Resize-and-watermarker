
import { WatermarkSettings, WatermarkPosition, ResizeSettings, ProcessedImage } from '../types';

export const processImage = (
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

        // Calculate resize dimensions
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (img.width > resize.maxWidth) {
          const ratio = resize.maxWidth / img.width;
          targetWidth = resize.maxWidth;
          targetHeight = img.height * ratio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw background image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Watermark Styling
        ctx.globalAlpha = watermark.opacity;
        ctx.fillStyle = watermark.color;
        
        // Relative font size based on image width to keep it consistent
        const scaleFactor = targetWidth / 1000; 
        const actualFontSize = Math.max(watermark.fontSize * scaleFactor, 12);
        ctx.font = `bold ${actualFontSize}px "Inter", sans-serif`;
        ctx.textBaseline = 'middle';
        
        const metrics = ctx.measureText(watermark.text);
        const textWidth = metrics.width;
        const textHeight = actualFontSize;

        // Apply Rotation and Contrast logic
        const drawWatermarkAt = (x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((watermark.rotation * Math.PI) / 180);
            
            // Apply contrast filter if not 0
            if (watermark.contrast !== 0) {
              const contrastValue = 1 + (watermark.contrast / 100);
              ctx.filter = `contrast(${contrastValue})`;
            }

            ctx.fillText(watermark.text, -textWidth / 2, 0);
            ctx.restore();
        };

        const padding = watermark.padding * scaleFactor;
        
        if (watermark.position === WatermarkPosition.TILED) {
            // Tiling Gap logic: 
            // 100% gap = 1 text width/height between tiles.
            // Using tilingGap to calculate steps.
            const gapX = textWidth * (watermark.tilingGap / 100);
            const gapY = textHeight * (watermark.tilingGap / 100);
            const stepX = textWidth + gapX;
            const stepY = textHeight + gapY;

            // Offset the start slightly to ensure coverage
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
        
        // Estimation of size from base64
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
