import React from 'react';
import { 
  Play, 
  Archive, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { ImageItem } from '../types';

interface BatchQueueProps {
  items: ImageItem[];
  isProcessingBatch: boolean;
  onProcessBatch: () => void;
  onDownloadZip: () => void;
  onOpenEditor: (item: ImageItem) => void;
  onRemoveItem: (id: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRetryItem: (item: ImageItem) => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  isProcessingBatch,
  onProcessBatch,
  onDownloadZip,
  onOpenEditor,
  onRemoveItem,
  onAddFiles,
  onRetryItem
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const completedCount = items.filter(i => i.status === 'done').length;
  const pendingCount = items.filter(i => i.status === 'idle').length;
  const isAnyProcessing = items.some(i => i.status === 'processing');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header and Batch Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Batch Queue
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              {completedCount}/{items.length} Completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Process multiple photos sequentially in your browser with 100% client-side AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Add more files */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Images
          </button>

          {/* Process Queue */}
          <button
            onClick={onProcessBatch}
            disabled={pendingCount === 0 || isAnyProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-md shadow-indigo-500/25 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            {isAnyProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing Queue...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Process All ({pendingCount})
              </>
            )}
          </button>

          {/* Download Zip */}
          <button
            onClick={onDownloadZip}
            disabled={completedCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Archive className="w-3.5 h-3.5" />
            Download ZIP ({completedCount})
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mt-4 max-h-[420px] overflow-y-auto pr-1">
        {items.map((item) => {
          const displayUrl = item.retouchedDataUrl || item.processedUrl || item.originalUrl;
          const isDone = item.status === 'done';
          const isBusy = item.status === 'processing';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`relative group bg-slate-950/70 border rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                isDone 
                  ? 'border-indigo-500/40 hover:border-indigo-400' 
                  : isBusy 
                  ? 'border-indigo-500 shadow-md shadow-indigo-500/20' 
                  : isError 
                  ? 'border-rose-500/50' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full bg-checkerboard flex items-center justify-center overflow-hidden">
                <img
                  src={displayUrl}
                  alt={item.name}
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    isDone ? 'group-hover:scale-105' : ''
                  }`}
                />

                {/* Processing Overlay */}
                {isBusy && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                    <p className="text-xs font-semibold text-white">{item.progress.step}</p>
                    <div className="w-3/4 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${item.progress.percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono mt-1">
                      {item.progress.percent}%
                    </span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {isDone && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/90 text-white shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Cutout Ready
                    </span>
                  )}
                  {isError && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/90 text-white shadow-xs">
                      <AlertCircle className="w-3 h-3" />
                      Failed
                    </span>
                  )}
                </div>

                {/* Quick Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-500 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-3 bg-slate-900/60 border-t border-slate-800/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-white truncate" title={item.name}>
                    {item.name}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {item.originalWidth > 0 ? `${item.originalWidth}×${item.originalHeight}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <button
                      onClick={() => onOpenEditor(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Open Editor
                    </button>
                  ) : isError ? (
                    <button
                      onClick={() => onRetryItem(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
                    >
                      Retry
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenEditor(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
