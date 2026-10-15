import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Paintbrush, RotateCcw, RotateCw, Check, X, ZoomIn, ZoomOut, Move, Eye, EyeOff, Sparkles, Wand2 } from 'lucide-react';
import { loadImage, processCutoutEdges } from '../utils/canvasUtils';

interface TouchupModalProps {
  isOpen: boolean;
  onClose: () => void;
  cutoutUrl: string;
  originalUrl: string;
  onSave: (newCutoutDataUrl: string) => void;
}

export const TouchupModal: React.FC<TouchupModalProps> = ({
  isOpen,
  onClose,
  cutoutUrl,
  originalUrl,
  onSave
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showOriginalOverlay, setShowOriginalOverlay] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  // Undo / Redo history stack of ImageData
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const isDrawing = useRef<boolean>(false);
  const lastCoord = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function init() {
      try {
        const [cutoutImg, origImg] = await Promise.all([
          loadImage(cutoutUrl),
          loadImage(originalUrl)
        ]);

        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = cutoutImg.naturalWidth;
        canvas.height = cutoutImg.naturalHeight;

        // Pre-render original image to an exact-dimension offscreen canvas for pixel-perfect pattern restore
        const origCanvas = document.createElement('canvas');
        origCanvas.width = canvas.width;
        origCanvas.height = canvas.height;
        const octx = origCanvas.getContext('2d');
        if (octx) {
          octx.drawImage(origImg, 0, 0, canvas.width, canvas.height);
        }
        origCanvasRef.current = origCanvas;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cutoutImg, 0, 0);

        // Save initial state to undo stack
        const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([initialData]);
        setRedoStack([]);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } catch (err) {
        console.error('Failed to init touchup canvas:', err);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [isOpen, cutoutUrl, originalUrl]);

  // Convert mouse/touch event to canvas coordinates
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Save current state for undo
  const saveStateForUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-15), data]);
    setRedoStack([]);
  }, []);

  // High-performance continuous paint function
  const paintStroke = useCallback((x: number, y: number, isStarting: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();

    if (mode === 'erase') {
      // destination-out erases existing pixels
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Connect line between previous point and current point
      if (!isStarting && lastCoord.current) {
        ctx.beginPath();
        ctx.moveTo(lastCoord.current.x, lastCoord.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Restore mode: perfectly restores original pixels from origCanvas
      if (!origCanvasRef.current) return;
      ctx.globalCompositeOperation = 'source-over';

      const pattern = ctx.createPattern(origCanvasRef.current, 'no-repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.strokeStyle = pattern;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (!isStarting && lastCoord.current) {
          ctx.beginPath();
          ctx.moveTo(lastCoord.current.x, lastCoord.current.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Fallback using clip
        ctx.beginPath();
        if (!isStarting && lastCoord.current) {
          ctx.lineWidth = brushSize;
          ctx.lineCap = 'round';
          ctx.moveTo(lastCoord.current.x, lastCoord.current.y);
          ctx.lineTo(x, y);
        }
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(origCanvasRef.current, 0, 0);
      }
    }

    ctx.restore();
    lastCoord.current = { x, y };
  }, [mode, brushSize]);

  // Handlers for mouse drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    saveStateForUndo();
    isDrawing.current = true;
    lastCoord.current = coords;
    paintStroke(coords.x, coords.y, true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true
      });
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    paintStroke(coords.x, coords.y, false);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setIsPanning(false);
    lastCoord.current = null;
  };

  const handleMouseLeave = () => {
    isDrawing.current = false;
    setIsPanning(false);
    lastCoord.current = null;
    setCursorPos(prev => ({ ...prev, visible: false }));
  };

  // Touch handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 1) {
      // Multi-touch for pan
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    saveStateForUndo();
    isDrawing.current = true;
    lastCoord.current = coords;
    paintStroke(coords.x, coords.y, true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isPanning && e.touches.length > 1) {
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
      return;
    }

    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    paintStroke(coords.x, coords.y, false);
  };

  const handleTouchEnd = () => {
    isDrawing.current = false;
    setIsPanning(false);
    lastCoord.current = null;
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = undoStack[undoStack.length - 1];
    const prev = undoStack[undoStack.length - 2];

    ctx.putImageData(prev, 0, 0);
    setRedoStack(r => [...r, current]);
    setUndoStack(u => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const next = redoStack[redoStack.length - 1];
    ctx.putImageData(next, 0, 0);
    setUndoStack(u => [...u, next]);
    setRedoStack(r => r.slice(0, -1));
  };

  // 1-Click Auto Remove White Halo directly in touch-up studio
  const handleAutoDefringe = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveStateForUndo();

    const cleaned = processCutoutEdges(canvas, 75, 2, false);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cleaned, 0, 0);
    }
  };

  // Save changes
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Magic Eraser & Restore Brush</h2>
              <p className="text-xs text-slate-400">Erase white fringes or paint back subject parts from the original photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-sm">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setMode('erase')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'erase'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Erase Edge / Fringes
            </button>
            <button
              onClick={() => setMode('restore')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'restore'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              Restore Subject
            </button>
          </div>

          {/* Quick Auto Clean White Halo */}
          <button
            onClick={handleAutoDefringe}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition shadow-xs"
            title="Automatically clean white glow & tighten edges"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Auto Clean White Halo
          </button>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 font-medium">Brush Size:</span>
            <input
              type="range"
              min="5"
              max="120"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-indigo-400 w-8">{brushSize}px</span>
          </div>

          {/* Zoom & Pan Controls */}
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/40">
            <button
              onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1.5">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition text-xs font-mono"
              title="Reset View"
            >
              1:1
            </button>
          </div>

          {/* Peek Original Photo */}
          <button
            onMouseDown={() => setShowOriginalOverlay(true)}
            onMouseUp={() => setShowOriginalOverlay(false)}
            onTouchStart={() => setShowOriginalOverlay(true)}
            onTouchEnd={() => setShowOriginalOverlay(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 select-none transition"
            title="Hold to see original"
          >
            {showOriginalOverlay ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            Hold to Peek Original
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="p-2 text-slate-300 hover:text-white disabled:text-slate-600 rounded-lg hover:bg-slate-800 transition"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 text-slate-300 hover:text-white disabled:text-slate-600 rounded-lg hover:bg-slate-800 transition"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-checkerboard overflow-hidden flex items-center justify-center cursor-crosshair select-none touch-none"
        >
          {/* Custom floating brush circle */}
          {cursorPos.visible && !isPanning && (
            <div
              className={`absolute pointer-events-none rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-75 ${
                mode === 'erase' ? 'border-rose-400 bg-rose-500/20' : 'border-emerald-400 bg-emerald-500/20'
              }`}
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${brushSize * zoom}px`,
                height: `${brushSize * zoom}px`
              }}
            />
          )}

          {/* Canvas Wrapper transformed by zoom & pan */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.08s ease-out'
            }}
            className="relative shadow-2xl rounded"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="max-w-none block bg-transparent"
            />

            {/* Original image overlay when peeking */}
            {showOriginalOverlay && (
              <img
                src={originalUrl}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
              />
            )}
          </div>

          <div className="absolute bottom-3 left-4 text-xs text-slate-400/80 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-none">
            💡 Drag mouse or touch to paint • Restore mode paints back original pixels • Shift+Drag to pan
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
