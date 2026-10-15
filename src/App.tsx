/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  History as HistoryIcon, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Layers, 
  Download, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileImage,
  RefreshCw,
  FolderArchive,
  BookOpen
} from 'lucide-react';
import JSZip from 'jszip';
import { ImageItem, HistoryItem } from './types';
import { SAMPLE_IMAGES } from './utils/presets';
import { executeBackgroundRemoval } from './services/bgRemoval';
import { 
  getHistoryItems, 
  addToHistory, 
  removeFromHistory, 
  clearHistory, 
  subscribeToHistory, 
  downloadBlob, 
  loadImage 
} from './utils/canvasUtils';
import { BatchQueue } from './components/BatchQueue';
import { EditorView } from './components/EditorView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { DocsModal } from './components/DocsModal';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'medium' | 'small' | 'large'>('medium');
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from IndexedDB/localStorage & subscribe to real-time events
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      const list = await getHistoryItems();
      if (isMounted) setHistoryItems(list);
    };

    fetchHistory();
    const unsubscribe = subscribeToHistory(() => {
      fetchHistory();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update history items list manually if needed
  const refreshHistory = async () => {
    const list = await getHistoryItems();
    setHistoryItems(list);
  };

  // Helper to create an ImageItem from File or URL
  const createImageItem = async (fileOrUrl: File | string, name?: string): Promise<ImageItem> => {
    let url: string;
    let fileName = name || 'image';
    let fileObj: File | undefined = undefined;

    if (fileOrUrl instanceof File) {
      fileObj = fileOrUrl;
      fileName = fileOrUrl.name;
      url = URL.createObjectURL(fileOrUrl);
    } else {
      url = fileOrUrl;
    }

    // Measure natural dimensions
    let width = 800;
    let height = 600;
    try {
      const img = await loadImage(url);
      width = img.naturalWidth;
      height = img.naturalHeight;
    } catch (e) {
      console.warn('Could not read image dimensions:', e);
    }

    return {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: fileName,
      file: fileObj,
      originalUrl: url,
      originalWidth: width,
      originalHeight: height,
      processedBlob: null,
      processedUrl: null,
      processedWidth: width,
      processedHeight: height,
      status: 'idle',
      progress: {
        step: 'Queued',
        percent: 0
      }
    };
  };

  // Add multiple files into queue
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: ImageItem[] = [];
    for (const file of fileArray) {
      if (file.type.startsWith('image/')) {
        const item = await createImageItem(file);
        newItems.push(item);
      }
    }

    setItems(prev => [...prev, ...newItems]);

    // Automatically trigger processing for newly added items
    newItems.forEach(item => {
      processSingleItem(item.id, item.file || item.originalUrl);
    });
  };

  // Load sample image
  const handleLoadSample = async (sample: typeof SAMPLE_IMAGES[0]) => {
    setIsLoadingSample(sample.id);
    try {
      const item = await createImageItem(sample.url, `${sample.name}.jpg`);
      setItems(prev => [item, ...prev]);
      setActiveItemId(item.id);
      // Process right away
      processSingleItem(item.id, sample.url);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setIsLoadingSample(null);
    }
  };

  // Process a single item
  const processSingleItem = useCallback(async (itemId: string, source: Blob | File | string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: 'processing',
          progress: { step: 'Initializing AI Engine...', percent: 10 }
        };
      }
      return item;
    }));

    try {
      const resultBlob = await executeBackgroundRemoval(
        source,
        selectedModel,
        (progress) => {
          setItems(prev => prev.map(item => {
            if (item.id === itemId) {
              return { ...item, progress };
            }
            return item;
          }));
        }
      );

      const processedUrl = URL.createObjectURL(resultBlob);
      const img = await loadImage(processedUrl);

      // Automatically save completed cutout to history
      try {
        const thumbCanvas = document.createElement('canvas');
        const maxDim = 200;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        thumbCanvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        thumbCanvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const tctx = thumbCanvas.getContext('2d');
        if (tctx) {
          tctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
          const thumbUrl = thumbCanvas.toDataURL('image/webp', 0.8);
          const currentItem = items.find(i => i.id === itemId);
          addToHistory({
            name: currentItem?.name || 'cutout',
            thumbnail: thumbUrl,
            dataUrl: processedUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            format: 'png'
          });
        }
      } catch (histErr) {
        console.warn('Auto history save error:', histErr);
      }

      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'done',
            processedBlob: resultBlob,
            processedUrl: processedUrl,
            processedWidth: img.naturalWidth,
            processedHeight: img.naturalHeight,
            progress: { step: 'Cutout Complete', percent: 100 }
          };
        }
        return item;
      }));
    } catch (err) {
      const errorMsg = (err as Error)?.message || 'Processing failed';
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'error',
            errorMessage: errorMsg,
            progress: { step: 'Failed', percent: 0 }
          };
        }
        return item;
      }));
    }
  }, [selectedModel]);

  // Process all idle items in batch
  const handleProcessBatch = async () => {
    if (isProcessingBatch) return;
    setIsProcessingBatch(true);

    const pending = items.filter(i => i.status === 'idle' || i.status === 'error');
    for (const item of pending) {
      await processSingleItem(item.id, item.file || item.originalUrl);
    }

    setIsProcessingBatch(false);
  };

  // Download all completed as ZIP
  const handleDownloadZip = async () => {
    const completed = items.filter(i => i.status === 'done' && (i.retouchedDataUrl || i.processedUrl));
    if (completed.length === 0) return;

    try {
      const zip = new JSZip();
      const folder = zip.folder('OmniBG-Cutouts');

      for (const item of completed) {
        const url = item.retouchedDataUrl || item.processedUrl;
        if (!url) continue;

        const res = await fetch(url);
        const blob = await res.blob();
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        folder?.file(`${baseName}-transparent.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `OmniBG-Batch-Cutouts-${Date.now()}.zip`);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  // Retry item
  const handleRetryItem = (item: ImageItem) => {
    processSingleItem(item.id, item.file || item.originalUrl);
  };

  // Update item from editor (retouch, crop, etc.)
  const handleUpdateItem = (updated: Partial<ImageItem>) => {
    if (!activeItemId) return;
    setItems(prev => prev.map(i => (i.id === activeItemId ? { ...i, ...updated } : i)));
  };

  // Find active item
  const activeItem = items.find(i => i.id === activeItemId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  OmniBG Remover
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-400 border border-indigo-500/30">
                  Enhanced v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                100% Free Client-Side AI • Unlimited • Zero Cloud Cost
              </p>
            </div>
          </div>

          {/* Model Selector & Privacy Badge & History */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Privacy indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Private (On-Device)</span>
            </div>

            {/* Model Quality Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                AI Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'medium' | 'small' | 'large')}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer pr-2 py-1"
              >
                <option value="medium" className="bg-slate-900 text-white">Balanced (FP16)</option>
                <option value="small" className="bg-slate-900 text-white">Fast (Quint8)</option>
                <option value="large" className="bg-slate-900 text-white">High Quality (ISNet)</option>
              </select>
            </div>

            {/* Docs & User Guide Trigger */}
            <button
              onClick={() => setIsDocsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 transition shadow-xs"
              title="Read full user guide and documentation"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Docs / Guide</span>
            </button>

            {/* History Drawer Trigger */}
            <button
              onClick={() => {
                refreshHistory();
                setIsHistoryOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 transition"
              title="Recent cutouts history"
            >
              <HistoryIcon className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">History</span>
              {historyItems.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-in fade-in zoom-in duration-200">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col">
        {/* If an item is being edited, show the full EditorView */}
        {activeItem ? (
          <EditorView
            item={activeItem}
            onBack={() => setActiveItemId(null)}
            onUpdateItem={handleUpdateItem}
          />
        ) : (
          <div className="flex-1 flex flex-col space-y-6">
            {/* If queue has items, show Batch Queue at the top */}
            {items.length > 0 && (
              <BatchQueue
                items={items}
                isProcessingBatch={isProcessingBatch}
                onProcessBatch={handleProcessBatch}
                onDownloadZip={handleDownloadZip}
                onOpenEditor={(item) => setActiveItemId(item.id)}
                onRemoveItem={handleRemoveItem}
                onAddFiles={handleAddFiles}
                onRetryItem={handleRetryItem}
              />
            )}

            {/* Main Upload Dropzone Hero */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-14 text-center flex flex-col items-center justify-center group overflow-hidden ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              {/* Background ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shadow-xl shadow-indigo-500/15">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                Drop your photos here, or <span className="text-indigo-400 underline decoration-indigo-500/40 underline-offset-4">browse files</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
                Automatic client-side background removal with precision edge matting. Supports multiple images (batch processing), PNG, JPG, and WebP.
              </p>

              {/* Feature Highlights Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  100% Free & Unlimited
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  No Upload to Servers (Private)
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  HD Cutouts & Magic Eraser
                </span>
              </div>
            </div>

            {/* Sample Images Gallery */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    Try with Sample Images (1-Click Test)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No image handy? Test the AI edge matting with these high-resolution samples:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample)}
                    disabled={isLoadingSample === sample.id}
                    className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 text-left bg-slate-950/60 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-98"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden">
                      <img
                        src={sample.thumbnail}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                          {sample.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sample.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition">
                        {isLoadingSample === sample.id ? 'Loading...' : 'Try It'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Cards Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Full-Featured Photo Editor</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transparent, solid colors, gradient backdrops, stock photography scenes, and DSLR background blur slider.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Magic Eraser & Restore Brush</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Need surgical touch-ups? Manually erase stubborn background artifacts or restore accidentally cut subject areas with undo/redo.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Multi-Format & Batch Export</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export PNG, JPEG, or WebP with custom resolution scaling (up to 200% Ultra HD), custom dimensions, and one-click ZIP batch downloads.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/80">
        <p>
          OmniBG Remover Enhanced Edition v2.0 • Powered by client-side WebAssembly & ONNX Runtime • Zero server fees • 100% Free
        </p>
      </footer>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={async (historyItem) => {
          const item = await createImageItem(historyItem.dataUrl, historyItem.name);
          item.status = 'done';
          item.processedUrl = historyItem.dataUrl;
          item.processedWidth = historyItem.width;
          item.processedHeight = historyItem.height;
          setItems(prev => [item, ...prev]);
          setActiveItemId(item.id);
        }}
        onDelete={async (id) => {
          const updated = await removeFromHistory(id);
          setHistoryItems(updated);
        }}
        onClear={() => {
          clearHistory();
          setHistoryItems([]);
        }}
      />

      {/* Docs / User Guide Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
