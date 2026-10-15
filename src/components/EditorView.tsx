import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Crop, 
  Paintbrush, 
  Layers, 
  Sliders, 
  Image as ImageIcon, 
  Palette, 
  Sun, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Upload, 
  CheckCircle2,
  FileImage,
  RefreshCw,
  Box,
  Share2,
  Move
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ImageItem, 
  BackgroundSettings, 
  SubjectAdjustments, 
  ExportSettings, 
  ExportFormat 
} from '../types';
import { 
  COLOR_PRESETS, 
  GRADIENT_PRESETS, 
  STOCK_BACKDROPS, 
  DEFAULT_BACKGROUND_SETTINGS, 
  DEFAULT_ADJUSTMENTS, 
  DEFAULT_EXPORT_SETTINGS 
} from '../utils/presets';
import { 
  renderCompositeCanvas, 
  exportCanvasToBlob, 
  downloadBlob, 
  copyCanvasToClipboard, 
  addToHistory 
} from '../utils/canvasUtils';
import { CropModal } from './CropModal';
import { TouchupModal } from './TouchupModal';

interface EditorViewProps {
  item: ImageItem;
  onBack: () => void;
  onUpdateItem: (updated: Partial<ImageItem>) => void;
}

type ActiveTab = 'background' | 'adjustments' | 'tools' | 'export';

export const EditorView: React.FC<EditorViewProps> = ({
  item,
  onBack,
  onUpdateItem
}) => {
  // Active cutout source (retouched or AI processed or original fallback)
  const currentCutoutUrl = item.retouchedDataUrl || item.processedUrl || item.originalUrl;

  // Editor states
  const [activeTab, setActiveTab] = useState<ActiveTab>('background');
  const [background, setBackground] = useState<BackgroundSettings>(DEFAULT_BACKGROUND_SETTINGS);
  const [adjustments, setAdjustments] = useState<SubjectAdjustments>(DEFAULT_ADJUSTMENTS);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    customWidth: item.processedWidth || item.originalWidth || 800,
    customHeight: item.processedHeight || item.originalHeight || 600
  });

  // Canvas preview rendering
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isCheckerLight, setIsCheckerLight] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Subject direct interactive canvas dragging / positioning
  const [isDraggingSubject, setIsDraggingSubject] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startPosX: number; startPosY: number } | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary click
    setIsDraggingSubject(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPosX: adjustments.posX || 0,
      startPosY: adjustments.posY || 0
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingSubject || !dragStartRef.current) return;
    const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
    const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;
    setAdjustments(prev => ({
      ...prev,
      posX: Math.round(dragStartRef.current!.startPosX + dx),
      posY: Math.round(dragStartRef.current!.startPosY + dy)
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingSubject(false);
    dragStartRef.current = null;
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDraggingSubject(true);
      dragStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        startPosX: adjustments.posX || 0,
        startPosY: adjustments.posY || 0
      };
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingSubject || !dragStartRef.current || e.touches.length !== 1) return;
    const dx = (e.touches[0].clientX - dragStartRef.current.mouseX) / zoom;
    const dy = (e.touches[0].clientY - dragStartRef.current.mouseY) / zoom;
    setAdjustments(prev => ({
      ...prev,
      posX: Math.round(dragStartRef.current!.startPosX + dx),
      posY: Math.round(dragStartRef.current!.startPosY + dy)
    }));
  };

  const handleCanvasTouchEnd = () => {
    setIsDraggingSubject(false);
    dragStartRef.current = null;
  };

  // Modals
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  const [isTouchupOpen, setIsTouchupOpen] = useState<boolean>(false);

  // Custom BG file upload ref
  const customBgInputRef = useRef<HTMLInputElement>(null);

  // Update export settings dimensions when item dimensions change
  useEffect(() => {
    const w = item.processedWidth || item.originalWidth || 800;
    const h = item.processedHeight || item.originalHeight || 600;
    setExportSettings(prev => ({
      ...prev,
      customWidth: Math.round(w * prev.scale),
      customHeight: Math.round(h * prev.scale)
    }));
  }, [item.processedWidth, item.processedHeight, item.originalWidth, item.originalHeight]);

  // Render composite canvas preview
  const refreshPreview = useCallback(async () => {
    if (!previewCanvasRef.current || !currentCutoutUrl) return;
    setIsRendering(true);

    try {
      const composite = await renderCompositeCanvas(
        currentCutoutUrl,
        background,
        adjustments,
        item.processedWidth || item.originalWidth || 800,
        item.processedHeight || item.originalHeight || 600
      );

      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      canvas.width = composite.width;
      canvas.height = composite.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(composite, 0, 0);
      }
    } catch (err) {
      console.error('Failed to render preview canvas:', err);
    } finally {
      setIsRendering(false);
    }
  }, [currentCutoutUrl, background, adjustments, item.processedWidth, item.processedHeight, item.originalWidth, item.originalHeight]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  // Dimension scaling logic
  const handleScaleChange = (scale: number) => {
    const baseW = item.processedWidth || item.originalWidth || 800;
    const baseH = item.processedHeight || item.originalHeight || 600;
    setExportSettings(prev => ({
      ...prev,
      scale,
      customWidth: Math.round(baseW * scale),
      customHeight: Math.round(baseH * scale)
    }));
  };

  const handleCustomWidthChange = (val: number) => {
    const baseW = item.processedWidth || item.originalWidth || 800;
    const baseH = item.processedHeight || item.originalHeight || 600;
    const aspect = baseW / baseH;
    setExportSettings(prev => ({
      ...prev,
      customWidth: val,
      customHeight: prev.lockAspect ? Math.round(val / aspect) : prev.customHeight
    }));
  };

  const handleCustomHeightChange = (val: number) => {
    const baseW = item.processedWidth || item.originalWidth || 800;
    const baseH = item.processedHeight || item.originalHeight || 600;
    const aspect = baseW / baseH;
    setExportSettings(prev => ({
      ...prev,
      customHeight: val,
      customWidth: prev.lockAspect ? Math.round(val * aspect) : prev.customWidth
    }));
  };

  // Custom background image upload
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setBackground(prev => ({
        ...prev,
        type: 'image',
        imageUrl: url
      }));
    }
  };

  // Trigger download
  const handleDownload = async () => {
    if (!currentCutoutUrl) return;
    setIsExporting(true);

    try {
      const baseW = item.processedWidth || item.originalWidth || 800;
      const baseH = item.processedHeight || item.originalHeight || 600;
      const targetW = exportSettings.customWidth || baseW;
      const targetH = exportSettings.customHeight || baseH;

      const fullCanvas = await renderCompositeCanvas(
        currentCutoutUrl,
        background,
        adjustments,
        targetW,
        targetH
      );

      const blob = await exportCanvasToBlob(
        fullCanvas,
        exportSettings.format,
        exportSettings.quality,
        targetW,
        targetH
      );

      const baseName = item.name.replace(/\.[^/.]+$/, '');
      const ext = exportSettings.format === 'jpeg' ? 'jpg' : exportSettings.format;
      const filename = `${baseName}-omnibg.${ext}`;

      downloadBlob(blob, filename);

      // Save to recent history
      try {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 160;
        thumbCanvas.height = Math.round((160 / targetW) * targetH);
        const tctx = thumbCanvas.getContext('2d');
        if (tctx) {
          tctx.drawImage(fullCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
          const thumbUrl = thumbCanvas.toDataURL('image/webp', 0.7);
          const fullDataUrl = fullCanvas.toDataURL(`image/${exportSettings.format}`, exportSettings.quality);

          addToHistory({
            name: item.name,
            thumbnail: thumbUrl,
            dataUrl: fullDataUrl,
            width: targetW,
            height: targetH,
            format: ext
          });
        }
      } catch (histErr) {
        console.warn('History save skipped:', histErr);
      }

      // Celebrate
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error('Download export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    if (!currentCutoutUrl) return;
    try {
      const baseW = item.processedWidth || item.originalWidth || 800;
      const baseH = item.processedHeight || item.originalHeight || 600;
      const fullCanvas = await renderCompositeCanvas(
        currentCutoutUrl,
        background,
        adjustments,
        baseW,
        baseH
      );
      await copyCanvasToClipboard(fullCanvas);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Crop callback
  const handleCropComplete = (croppedDataUrl: string, width: number, height: number) => {
    onUpdateItem({
      retouchedDataUrl: croppedDataUrl,
      processedWidth: width,
      processedHeight: height
    });
  };

  // Touch-up callback
  const handleTouchupSave = (newCutoutDataUrl: string) => {
    onUpdateItem({
      retouchedDataUrl: newCutoutDataUrl
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-[650px] bg-slate-950 text-slate-100 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Action Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="truncate max-w-[200px] sm:max-w-xs">
            <h2 className="text-sm font-bold text-white truncate" title={item.name}>
              {item.name}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {item.processedWidth || item.originalWidth} × {item.processedHeight || item.originalHeight} px
            </p>
          </div>
        </div>

        {/* Center Comparison Toggle */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition select-none ${
              isComparing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Press and hold to compare with original photo"
          >
            {isComparing ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            Hold for Original
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
            title="Copy cutout to clipboard"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </header>

      {/* Main Workspace: Split between Canvas and Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Interactive Canvas Viewport */}
        <div className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden">
          {/* Canvas Toolbar overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg">
            <button
              onClick={() => setZoom(z => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-[10px] font-mono transition"
              title="Reset 100%"
            >
              1:1
            </button>
            <div className="w-px h-3.5 bg-slate-700" />
            <button
              onClick={() => setIsCheckerLight(l => !l)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Toggle light / dark transparency pattern"
            >
              {isCheckerLight ? 'Dark BG' : 'Light BG'}
            </button>
          </div>

          {/* Canvas Floating Top Info */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
            <span className="text-slate-400">Position:</span>
            <span className="font-mono text-indigo-400 font-semibold">{adjustments.posX || 0}px, {adjustments.posY || 0}px</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Scale:</span>
            <span className="font-mono text-indigo-400 font-semibold">{Math.round((adjustments.scale || 1.0) * 100)}%</span>
            <button
              onClick={() => setAdjustments(prev => ({ ...prev, posX: 0, posY: 0, scale: 1.0 }))}
              className="ml-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
              title="Reset position to center"
            >
              Center
            </button>
          </div>

          {/* Quick tool pills on canvas */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
            <button
              onClick={() => setIsCropOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              Crop / Rotate
            </button>
            <button
              onClick={() => setIsTouchupOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              <Paintbrush className="w-3.5 h-3.5 text-emerald-400" />
              Magic Eraser & Restore
            </button>
            <div className="hidden sm:flex items-center text-[10px] text-slate-400 px-2 py-1 bg-slate-950/60 rounded-md border border-slate-800">
              ✋ Drag image directly to move
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className={`flex-1 relative flex items-center justify-center p-6 overflow-auto select-none ${
            isCheckerLight ? 'bg-checkerboard-light' : 'bg-checkerboard'
          }`}>
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out'
              }}
              className="relative shadow-2xl rounded-lg overflow-hidden flex items-center justify-center"
            >
              {/* Processed Composite Canvas */}
              <canvas
                ref={previewCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasTouchStart}
                onTouchMove={handleCanvasTouchMove}
                onTouchEnd={handleCanvasTouchEnd}
                className={`max-h-[68vh] max-w-[90vw] lg:max-w-[55vw] object-contain block cursor-grab active:cursor-grabbing ${
                  isComparing ? 'opacity-0' : 'opacity-100'
                }`}
                title="Click and drag to move image anywhere on canvas"
              />

              {/* Original Image comparison overlay */}
              {isComparing && (
                <img
                  src={item.originalUrl}
                  alt="Original reference"
                  className="max-h-[68vh] max-w-[90vw] lg:max-w-[55vw] object-contain block absolute inset-0 m-auto"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right / Side Panel: Controls Tabs */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col flex-shrink-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition ${
                activeTab === 'background'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Backdrop
            </button>
            <button
              onClick={() => setActiveTab('adjustments')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition ${
                activeTab === 'adjustments'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Adjust
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition ${
                activeTab === 'tools'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Touch-Up
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. BACKGROUND TAB */}
            {activeTab === 'background' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Mode Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
                    Background Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setBackground(prev => ({ ...prev, type: 'transparent' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        background.type === 'transparent'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setBackground(prev => ({ ...prev, type: 'color' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        background.type === 'color'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Color
                    </button>
                    <button
                      onClick={() => setBackground(prev => ({ ...prev, type: 'gradient' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        background.type === 'gradient'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Gradient
                    </button>
                    <button
                      onClick={() => setBackground(prev => ({ ...prev, type: 'image' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        background.type === 'image'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Photo
                    </button>
                  </div>
                </div>

                {/* Solid Color Options */}
                {background.type === 'color' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Custom Color:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={background.color}
                          onChange={(e) => setBackground(prev => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-xs font-mono text-indigo-400 uppercase">
                          {background.color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Preset Palettes:</span>
                      <div className="grid grid-cols-5 gap-2">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setBackground(prev => ({ ...prev, color: c.hex }))}
                            className={`group relative h-9 rounded-xl border transition flex items-center justify-center ${
                              background.color.toUpperCase() === c.hex.toUpperCase()
                                ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/30'
                                : 'border-slate-700/60 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} (${c.hex})`}
                          >
                            {background.color.toUpperCase() === c.hex.toUpperCase() && (
                              <Check className={`w-4 h-4 ${c.hex === '#FFFFFF' || c.hex === '#E2E8F0' || c.hex === '#FED7AA' || c.hex === '#A7F3D0' || c.hex === '#BAE6FD' ? 'text-slate-900' : 'text-white'}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gradient Presets */}
                {background.type === 'gradient' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-400 block">Preset Gradients:</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.name}
                          onClick={() => setBackground(prev => ({ ...prev, gradient: g.css }))}
                          className={`h-16 rounded-xl border transition p-1.5 flex flex-col justify-end text-left relative overflow-hidden ${
                            background.gradient === g.css
                              ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/30'
                              : 'border-slate-700/60 hover:scale-102'
                          }`}
                          style={{ background: g.css }}
                        >
                          <span className="text-[10px] font-bold text-white bg-slate-950/60 backdrop-blur-xs px-1.5 py-0.5 rounded truncate max-w-full">
                            {g.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image / Stock Backdrop */}
                {background.type === 'image' && (
                  <div className="space-y-4">
                    {/* Custom upload */}
                    <input
                      type="file"
                      ref={customBgInputRef}
                      onChange={handleCustomBgUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => customBgInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-dashed border-indigo-500/40 rounded-xl text-xs font-semibold text-indigo-300 hover:text-indigo-200 flex items-center justify-center gap-2 transition"
                    >
                      <Upload className="w-4 h-4 text-indigo-400" />
                      Upload Custom Backdrop Image
                    </button>

                    {/* DSLR Blur Slider */}
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-indigo-400" />
                          DSLR Background Blur
                        </span>
                        <span className="font-mono text-indigo-400">{background.blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={background.blur}
                        onChange={(e) => setBackground(prev => ({ ...prev, blur: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">
                        Simulate professional depth of field / bokeh on the background layer
                      </p>
                    </div>

                    {/* Stock Library */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Curated Stock Backdrops:</span>
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {STOCK_BACKDROPS.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setBackground(prev => ({ ...prev, imageUrl: b.url }))}
                            className={`group relative h-20 rounded-xl overflow-hidden border transition text-left ${
                              background.imageUrl === b.url
                                ? 'border-indigo-400 ring-2 ring-indigo-500/50'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <img
                              src={b.thumbnail}
                              alt={b.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[10px] font-semibold text-white truncate">
                                {b.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ADJUSTMENTS TAB */}
            {activeTab === 'adjustments' && (
              <div className="space-y-6 animate-fadeIn">
                {/* A. Position & Scale (Move Image) */}
                <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-indigo-400" />
                      Move & Scale Subject
                    </span>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, posX: 0, posY: 0, scale: 1.0 }))}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Center
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 Click and drag the subject directly on the preview canvas, or adjust sliders below:
                  </p>

                  {/* Subject Scale */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Subject Size</span>
                      <span className="font-mono text-indigo-400">{Math.round((adjustments.scale || 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.0"
                      step="0.05"
                      value={adjustments.scale || 1.0}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, scale: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Position X and Y Sliders */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Offset X</span>
                        <span className="font-mono text-indigo-400">{adjustments.posX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-400"
                        max="400"
                        value={adjustments.posX || 0}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, posX: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Offset Y</span>
                        <span className="font-mono text-indigo-400">{adjustments.posY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-400"
                        max="400"
                        value={adjustments.posY || 0}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, posY: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Align Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-semibold mr-1">Align:</span>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, posX: 0, posY: 0 }))}
                      className="flex-1 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/60 transition"
                    >
                      Center
                    </button>
                    <button
                      onClick={() => {
                        const h = item.processedHeight || item.originalHeight || 600;
                        const s = adjustments.scale || 1.0;
                        const bottomY = Math.round((h * (1 - s)) / 2);
                        setAdjustments(prev => ({ ...prev, posX: 0, posY: bottomY }));
                      }}
                      className="flex-1 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/60 transition"
                      title="Align portrait to bottom"
                    >
                      Bottom Center
                    </button>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, posX: -100 }))}
                      className="py-1 px-2.5 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/60 transition"
                    >
                      Left
                    </button>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, posX: 100 }))}
                      className="py-1 px-2.5 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/60 transition"
                    >
                      Right
                    </button>
                  </div>
                </div>

                {/* B. Edge Matting & White Halo Removal (Fix White Background Bleed) */}
                <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      White Halo & Edge Clean
                    </span>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, defringe: 80, edgeChoke: 2 }))}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto Clean Halo
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Fixes the white glowing edge / matte fringe around hair and body when extracted from light backgrounds.
                  </p>

                  {/* De-fringe slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Remove White Halo (De-fringe)</span>
                      <span className="font-mono text-amber-400">{adjustments.defringe || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.defringe || 0}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, defringe: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">Decontaminates white background bleed and restores rich hair color</p>
                  </div>

                  {/* Edge Choke (Alpha Trim) */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Trim Edge Boundary (Choke)</span>
                      <span className="font-mono text-amber-400">{adjustments.edgeChoke || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={adjustments.edgeChoke || 0}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, edgeChoke: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">Trims outer boundary by 1-4 pixels to eliminate fuzzy white borders</p>
                  </div>
                </div>

                {/* C. Color and Contrast Adjustments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subject Color Filters
                    </label>
                    <button
                      onClick={() => setAdjustments(prev => ({ ...prev, brightness: 0, contrast: 0, saturation: 0, hueRotate: 0 }))}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Brightness</span>
                      <span className="font-mono text-indigo-400">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={adjustments.brightness}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Contrast</span>
                      <span className="font-mono text-indigo-400">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Saturation</span>
                      <span className="font-mono text-indigo-400">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={adjustments.saturation}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Hue Rotate */}
                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Hue Shift</span>
                      <span className="font-mono text-indigo-400">{adjustments.hueRotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={adjustments.hueRotate}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, hueRotate: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Studio Drop Shadow */}
                <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-indigo-400" />
                      Studio Drop Shadow
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adjustments.shadowEnabled}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, shadowEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {adjustments.shadowEnabled && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Shadow Blur</span>
                        <span className="font-mono text-indigo-400">{adjustments.shadowBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={adjustments.shadowBlur}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, shadowBlur: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Vertical Offset</span>
                        <span className="font-mono text-indigo-400">{adjustments.shadowOffsetY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={adjustments.shadowOffsetY}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, shadowOffsetY: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Sticker Outline / Stroke */}
                <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      Sticker Outline (Thumbnail Border)
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adjustments.strokeEnabled}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, strokeEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {adjustments.strokeEnabled && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Outline Width</span>
                        <span className="font-mono text-indigo-400">{adjustments.strokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="24"
                        value={adjustments.strokeWidth}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, strokeWidth: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Outline Color</span>
                        <input
                          type="color"
                          value={adjustments.strokeColor}
                          onChange={(e) => setAdjustments(prev => ({ ...prev, strokeColor: e.target.value }))}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. TOOLS TAB (Crop & Magic Brush) */}
            {activeTab === 'tools' && (
              <div className="space-y-5 animate-fadeIn">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Fine-Tuning & Cropping
                </label>

                {/* Magic Eraser Card */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Paintbrush className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Magic Eraser & Restore</h4>
                      <p className="text-xs text-slate-400">Manual pixel brush to clean edges or bring back removed subject areas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTouchupOpen(true)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Paintbrush className="w-4 h-4" />
                    Open Brush Studio
                  </button>
                </div>

                {/* Crop & Rotate Card */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Crop className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Crop & Orientation</h4>
                      <p className="text-xs text-slate-400">Custom aspect ratios (1:1, 16:9, Stories 9:16), 90° rotation, and flips</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCropOpen(true)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Crop className="w-4 h-4" />
                    Open Crop Tool
                  </button>
                </div>
              </div>
            )}

            {/* 4. EXPORT TAB */}
            {activeTab === 'export' && (
              <div className="space-y-6 animate-fadeIn">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Export Settings
                </label>

                {/* Format Selector */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Image Format:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportSettings(prev => ({ ...prev, format: fmt }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition flex flex-col items-center gap-1 ${
                          exportSettings.format === fmt
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                        <span className="text-[9px] font-normal normal-case opacity-75">
                          {fmt === 'png' ? 'Transparent' : fmt === 'jpeg' ? 'Small Size' : 'Modern Web'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider (for JPEG and WebP) */}
                {exportSettings.format !== 'png' && (
                  <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Compression Quality</span>
                      <span className="font-mono text-indigo-400">
                        {Math.round(exportSettings.quality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={exportSettings.quality}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Resolution / Scale Presets */}
                <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block">Resolution Scale:</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.25, 0.5, 0.75, 1.0, 2.0].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleScaleChange(s)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                          exportSettings.scale === s
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {s * 100}%
                      </button>
                    ))}
                  </div>

                  {/* Custom Dimensions */}
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Custom Dimensions:</span>
                      <button
                        onClick={() => setExportSettings(prev => ({ ...prev, lockAspect: !prev.lockAspect }))}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          exportSettings.lockAspect ? 'bg-indigo-900/60 text-indigo-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {exportSettings.lockAspect ? '🔒 Aspect Locked' : '🔓 Unlocked'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <input
                        type="number"
                        min="50"
                        max="8000"
                        value={exportSettings.customWidth || ''}
                        onChange={(e) => handleCustomWidthChange(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center"
                      />
                      <span className="text-slate-500">×</span>
                      <input
                        type="number"
                        min="50"
                        max="8000"
                        value={exportSettings.customHeight || ''}
                        onChange={(e) => handleCustomHeightChange(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center"
                      />
                      <span className="text-slate-500 text-xs">px</span>
                    </div>
                  </div>
                </div>

                {/* Instant Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/25 transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exporting Image...' : `Download ${exportSettings.format.toUpperCase()} (${exportSettings.customWidth}×${exportSettings.customHeight})`}
                  </button>

                  <button
                    onClick={handleCopyClipboard}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied Cutout to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy PNG to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageUrl={currentCutoutUrl}
        onCropComplete={handleCropComplete}
      />

      <TouchupModal
        isOpen={isTouchupOpen}
        onClose={() => setIsTouchupOpen(false)}
        cutoutUrl={currentCutoutUrl}
        originalUrl={item.originalUrl}
        onSave={handleTouchupSave}
      />
    </div>
  );
};
