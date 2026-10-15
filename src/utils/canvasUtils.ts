import { BackgroundSettings, SubjectAdjustments, ExportFormat, HistoryItem } from '../types';

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Renders the full composite image: background (color/gradient/image with blur) + subject cutout (with adjustments, drop shadow, and outline)
 */
export async function renderCompositeCanvas(
  cutoutSource: string | HTMLImageElement,
  background: BackgroundSettings,
  adjustments: SubjectAdjustments,
  targetWidth?: number,
  targetHeight?: number
): Promise<HTMLCanvasElement> {
  const cutoutImg = typeof cutoutSource === 'string' ? await loadImage(cutoutSource) : cutoutSource;
  
  const width = targetWidth || cutoutImg.naturalWidth || cutoutImg.width || 800;
  const height = targetHeight || cutoutImg.naturalHeight || cutoutImg.height || 600;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas 2d context');

  // 1. Draw Background
  if (background.type === 'color') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'gradient') {
    // Parse linear or radial gradient
    if (background.gradient.includes('radial-gradient')) {
      const radGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.35,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      // Fallback colors if parsing fails
      radGrad.addColorStop(0, '#475569');
      radGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = radGrad;
    } else {
      // Linear gradient
      const linGrad = ctx.createLinearGradient(0, 0, width, height);
      if (background.gradient.includes('#FF6B6B')) {
        linGrad.addColorStop(0, '#FF6B6B');
        linGrad.addColorStop(1, '#FFE66D');
      } else if (background.gradient.includes('#EC4899')) {
        linGrad.addColorStop(0, '#EC4899');
        linGrad.addColorStop(0.5, '#8B5CF6');
        linGrad.addColorStop(1, '#3B82F6');
      } else if (background.gradient.includes('#1E3A8A')) {
        linGrad.addColorStop(0, '#1E3A8A');
        linGrad.addColorStop(1, '#0F172A');
      } else if (background.gradient.includes('#059669')) {
        linGrad.addColorStop(0, '#059669');
        linGrad.addColorStop(0.5, '#0284C7');
        linGrad.addColorStop(1, '#6366F1');
      } else if (background.gradient.includes('#F59E0B')) {
        linGrad.addColorStop(0, '#F59E0B');
        linGrad.addColorStop(1, '#EA580C');
      } else if (background.gradient.includes('#F43F5E')) {
        linGrad.addColorStop(0, '#F43F5E');
        linGrad.addColorStop(0.5, '#FB7185');
        linGrad.addColorStop(1, '#FEE2E2');
      } else if (background.gradient.includes('#311042')) {
        linGrad.addColorStop(0, '#311042');
        linGrad.addColorStop(1, '#150928');
      } else if (background.gradient.includes('#34D399')) {
        linGrad.addColorStop(0, '#34D399');
        linGrad.addColorStop(1, '#A7F3D0');
      } else if (background.gradient.includes('#CBD5E1')) {
        linGrad.addColorStop(0, '#CBD5E1');
        linGrad.addColorStop(0.5, '#94A3B8');
        linGrad.addColorStop(1, '#64748B');
      } else {
        linGrad.addColorStop(0, '#6366F1');
        linGrad.addColorStop(1, '#A855F7');
      }
      ctx.fillStyle = linGrad;
    }
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'image' && background.imageUrl) {
    try {
      const bgImg = await loadImage(background.imageUrl);
      ctx.save();
      if (background.blur > 0) {
        ctx.filter = `blur(${background.blur}px)`;
        // Slightly scale to prevent white edges caused by blur
        const overscale = 1.05;
        const ow = width * overscale;
        const oh = height * overscale;
        const ox = (width - ow) / 2;
        const oy = (height - oh) / 2;
        drawImageCover(ctx, bgImg, ox, oy, ow, oh);
      } else {
        drawImageCover(ctx, bgImg, 0, 0, width, height);
      }
      ctx.restore();
    } catch (e) {
      console.warn('Failed to load background image, using transparent background', e);
    }
  }

  // 2. Process cutout for edge defringe (white halo removal) and edge choke (tightening)
  const processedCutoutCanvas = processCutoutEdges(
    cutoutImg,
    adjustments.defringe || 0,
    adjustments.edgeChoke || 0,
    adjustments.smoothEdge || false
  );

  // 3. Calculate subject positioning and scaling
  const scale = adjustments.scale || 1.0;
  const subW = width * scale;
  const subH = height * scale;
  const subX = (width - subW) / 2 + (adjustments.posX || 0);
  const subY = (height - subH) / 2 + (adjustments.posY || 0);

  // 4. Prepare Subject Filters
  const brightnessVal = 100 + adjustments.brightness; // %
  const contrastVal = 100 + adjustments.contrast; // %
  const saturateVal = 100 + adjustments.saturation; // %
  const hueVal = adjustments.hueRotate; // deg

  const filterString = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) hue-rotate(${hueVal}deg)`;

  // 5. Draw Drop Shadow if enabled
  if (adjustments.shadowEnabled) {
    ctx.save();
    ctx.shadowColor = adjustments.shadowColor || 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = adjustments.shadowBlur;
    ctx.shadowOffsetX = adjustments.shadowOffsetX;
    ctx.shadowOffsetY = adjustments.shadowOffsetY;
    ctx.drawImage(processedCutoutCanvas, subX, subY, subW, subH);
    ctx.restore();
  }

  // 6. Draw Stroke / Sticker Outline if enabled
  if (adjustments.strokeEnabled && adjustments.strokeWidth > 0) {
    drawStickerOutline(ctx, processedCutoutCanvas, subX, subY, subW, subH, width, height, adjustments.strokeWidth, adjustments.strokeColor);
  }

  // 7. Draw Subject Cutout with Color/Contrast Filters
  ctx.save();
  ctx.filter = filterString;
  ctx.drawImage(processedCutoutCanvas, subX, subY, subW, subH);
  ctx.restore();

  return canvas;
}

/**
 * Removes white edge halos (de-fringe) and erodes alpha fringes (edge choke)
 */
export function processCutoutEdges(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  defringe: number,
  edgeChoke: number,
  smoothEdge: boolean
): HTMLCanvasElement {
  const w = sourceImg instanceof HTMLImageElement ? sourceImg.naturalWidth : sourceImg.width;
  const h = sourceImg instanceof HTMLImageElement ? sourceImg.naturalHeight : sourceImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(sourceImg, 0, 0, w, h);
  if (defringe <= 0 && edgeChoke <= 0 && !smoothEdge) {
    return canvas;
  }

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Edge choke (alpha erosion): trims off the 1-4 pixel outer white fringe
  if (edgeChoke > 0) {
    const alphaCopy = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      alphaCopy[i] = data[i * 4 + 3];
    }
    const chokeR = Math.min(5, Math.max(1, Math.round(edgeChoke)));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const a = alphaCopy[idx];
        if (a === 0) continue;
        
        let minA = a;
        for (let dy = -chokeR; dy <= chokeR; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) { minA = 0; break; }
          for (let dx = -chokeR; dx <= chokeR; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) { minA = 0; break; }
            if (dx * dx + dy * dy <= chokeR * chokeR) {
              const na = alphaCopy[ny * w + nx];
              if (na < minA) minA = na;
            }
          }
        }
        data[idx * 4 + 3] = minA;
      }
    }
  }

  // 2. White Halo Decontamination (Defringe)
  // Reverses the white backdrop blending on semi-transparent edge pixels
  if (defringe > 0) {
    const factor = Math.min(1.2, defringe / 85);
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const a = data[i + 3];
      if (a > 0 && a < 252) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // White matte de-blending
        const alphaFrac = a / 255;
        const unblendedR = (r - (255 * (1 - alphaFrac) * factor)) / Math.max(0.1, alphaFrac);
        const unblendedG = (g - (255 * (1 - alphaFrac) * factor)) / Math.max(0.1, alphaFrac);
        const unblendedB = (b - (255 * (1 - alphaFrac) * factor)) / Math.max(0.1, alphaFrac);

        data[i] = Math.max(0, Math.min(255, Math.round(unblendedR)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(unblendedG)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(unblendedB)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Draws image with cover aspect ratio inside a bounding box
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let renderW = w;
  let renderH = h;
  let renderX = x;
  let renderY = y;

  if (imgRatio > canvasRatio) {
    renderW = h * imgRatio;
    renderX = x + (w - renderW) / 2;
  } else {
    renderH = w / imgRatio;
    renderY = y + (h - renderH) / 2;
  }

  ctx.drawImage(img, renderX, renderY, renderW, renderH);
}

/**
 * High-performance sticker outline around transparent cutout
 */
function drawStickerOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  strokeWidth: number,
  color: string
) {
  // Create silhouette in offscreen canvas matching canvas dimensions
  const outlineCanvas = document.createElement('canvas');
  outlineCanvas.width = canvasWidth;
  outlineCanvas.height = canvasHeight;
  const octx = outlineCanvas.getContext('2d');
  if (!octx) return;

  // Draw image at its positioned coordinates and tint solid color
  octx.drawImage(img, x, y, width, height);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = color;
  octx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw silhouette rotated in 16 directions around center to make seamless thick outline
  ctx.save();
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const dx = Math.cos(angle) * strokeWidth;
    const dy = Math.sin(angle) * strokeWidth;
    ctx.drawImage(outlineCanvas, dx, dy);
  }
  ctx.restore();
}

/**
 * Handles cropping, rotating, and flipping on an image
 */
export async function createCroppedRotatedCanvas(
  imageSource: string | HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  rotation: number = 0,
  flipH: boolean = false,
  flipV: boolean = false
): Promise<HTMLCanvasElement> {
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;

  // Intermediate canvas for rotation & flipping
  const rotCanvas = document.createElement('canvas');
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) throw new Error('No 2d context');

  const rotRad = (rotation * Math.PI) / 180;
  const is90or270 = Math.abs(rotation % 180) === 90;

  rotCanvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
  rotCanvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(rotRad);
  rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // Now crop from rotCanvas
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('No 2d context for crop');

  // Clamp crop values
  const cropX = Math.max(0, Math.min(cropArea.x, rotCanvas.width));
  const cropY = Math.max(0, Math.min(cropArea.y, rotCanvas.height));
  const cropW = Math.max(1, Math.min(cropArea.width, rotCanvas.width - cropX));
  const cropH = Math.max(1, Math.min(cropArea.height, rotCanvas.height - cropY));

  cropCanvas.width = cropW;
  cropCanvas.height = cropH;

  cropCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return cropCanvas;
}

/**
 * Exports canvas to Blob with quality and format options
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number,
  targetWidth?: number,
  targetHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let finalCanvas = canvas;

    if (targetWidth && targetHeight && (canvas.width !== targetWidth || canvas.height !== targetHeight)) {
      finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      }
    }

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const finalQuality = format === 'png' ? undefined : quality;

    finalCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate export blob'));
      },
      mimeType,
      finalQuality
    );
  });
}

/**
 * Downloads a Blob as a file with automatic anchor trigger
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Copies an image canvas directly to clipboard as PNG
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create blob for clipboard');
  
  if (navigator.clipboard && window.ClipboardItem) {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  } else {
    throw new Error('Clipboard API not supported on this device/browser');
  }
}

import { 
  addHistoryItem, 
  getHistoryItems, 
  deleteHistoryItem, 
  clearAllHistoryItems,
  subscribeToHistory
} from './historyStorage';

export {
  addHistoryItem,
  getHistoryItems,
  deleteHistoryItem,
  clearAllHistoryItems,
  subscribeToHistory
};

// Backwards-compatible aliases
export async function getHistory(): Promise<HistoryItem[]> {
  return getHistoryItems();
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  addHistoryItem(item);
}

export async function removeFromHistory(id: string): Promise<HistoryItem[]> {
  return deleteHistoryItem(id);
}

export function clearHistory(): void {
  clearAllHistoryItems();
}
