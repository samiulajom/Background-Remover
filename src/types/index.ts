export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

export interface ImageItem {
  id: string;
  name: string;
  file?: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedWidth: number;
  processedHeight: number;
  status: ProcessStatus;
  progress: {
    step: string;
    percent: number;
  };
  errorMessage?: string;
  // If user performed manual brush touch-up, this stores the updated cutout data URL
  retouchedDataUrl?: string | null;
}

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'image';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradient: string;
  imageUrl: string | null;
  blur: number; // 0 to 40 px
}

export interface SubjectAdjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  hueRotate: number; // 0 to 360
  // Position & Scale (allows moving and resizing subject on canvas)
  posX: number;
  posY: number;
  scale: number;
  // Edge Matting & Halo Removal
  defringe: number; // 0 to 100 (% white halo decontamination)
  edgeChoke: number; // 0 to 8px (erodes edge pixels to eliminate fringe)
  smoothEdge: boolean;
  // Drop shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  // Outline / Sticker border
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect?: number;
  rotation: number; // in degrees: 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export interface ExportSettings {
  format: ExportFormat;
  quality: number; // 0.1 to 1.0
  scale: number; // 0.25 to 2.0
  customWidth?: number;
  customHeight?: number;
  lockAspect: boolean;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  thumbnail: string;
  dataUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface ModelOption {
  id: 'medium' | 'small' | 'large';
  name: string;
  description: string;
  speed: string;
  size: string;
}
