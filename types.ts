
export enum WatermarkPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center',
  TILED = 'tiled'
}

export interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  padding: number;
  rotation: number;
  tilingGap: number;
  contrast: number; // New property for controlling watermark contrast
}

export interface ResizeSettings {
  maxWidth: number;
  quality: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  previewUrl: string;
  processedUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface FileData {
  file: File;
  id: string;
}
