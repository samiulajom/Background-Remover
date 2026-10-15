import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Crop as CropIcon, Check, X, RefreshCw } from 'lucide-react';
import { createCroppedRotatedCanvas } from '../utils/canvasUtils';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string, width: number, height: number) => void;
}

interface AspectOption {
  label: string;
  value: number | undefined;
  sub: string;
}

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Free', value: undefined, sub: 'Custom' },
  { label: '1:1', value: 1, sub: 'Square' },
  { label: '16:9', value: 16 / 9, sub: 'Landscape' },
  { label: '9:16', value: 9 / 16, sub: 'Story / Reel' },
  { label: '4:3', value: 4 / 3, sub: 'Standard' },
  { label: '3:2', value: 3 / 2, sub: 'Photo' }
];

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // When image loads in dialog, initialize centered crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect || width / height,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current && newAspect) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 85,
          },
          newAspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  };

  const rotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const toggleFlipH = () => setFlipH(prev => !prev);
  const toggleFlipV = () => setFlipV(prev => !prev);

  const resetAll = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspect(undefined);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
      });
    }
  };

  const handleApply = async () => {
    if (!imgRef.current) return;
    setIsApplying(true);

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Determine pixel crop area
      let pixelCrop = completedCrop;
      if (!pixelCrop || pixelCrop.width === 0 || pixelCrop.height === 0) {
        pixelCrop = {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
          unit: 'px'
        };
      }

      // Convert to natural image dimensions
      const cropArea = {
        x: pixelCrop.x * scaleX,
        y: pixelCrop.y * scaleY,
        width: pixelCrop.width * scaleX,
        height: pixelCrop.height * scaleY
      };

      const croppedCanvas = await createCroppedRotatedCanvas(
        image,
        cropArea,
        rotation,
        flipH,
        flipV
      );

      const croppedDataUrl = croppedCanvas.toDataURL('image/png');
      onCropComplete(croppedDataUrl, croppedCanvas.width, croppedCanvas.height);
      onClose();
    } catch (err) {
      console.error('Error applying crop:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <CropIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Crop & Rotate Tool</h2>
              <p className="text-xs text-slate-400">Trim dimensions, change aspect ratio, rotate, or flip your image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio & Transform Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-sm">
          {/* Aspect Ratios */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Ratio:</span>
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAspectChange(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  aspect === opt.value
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {opt.label}
                <span className="text-[10px] ml-1 opacity-70">({opt.sub})</span>
              </button>
            ))}
          </div>

          {/* Orientation Controls */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={rotateLeft}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={rotateRight}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={toggleFlipH}
              className={`p-2 rounded-lg transition ${
                flipH ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFlipV}
              className={`p-2 rounded-lg transition ${
                flipV ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={resetAll}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
              title="Reset All"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cropping Canvas Viewport */}
        <div className="relative flex-1 bg-checkerboard overflow-hidden flex items-center justify-center p-4 select-none">
          <div
            style={{
              transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="max-h-[60vh] max-w-[80vw] flex items-center justify-center"
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageUrl}
                onLoad={onImageLoad}
                className="max-h-[60vh] max-w-full object-contain block select-none pointer-events-none"
              />
            </ReactCrop>
          </div>

          {/* Current Rotation badge */}
          {rotation !== 0 && (
            <div className="absolute top-4 right-4 bg-slate-900/90 text-indigo-400 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono">
              Rotation: {rotation}°
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isApplying ? 'Applying Crop...' : 'Apply Crop & Orientation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
