import React from 'react';
import { History, X, Download, Trash2, Calendar, Maximize2, ExternalLink } from 'lucide-react';
import { HistoryItem } from '../types';
import { downloadBlob } from '../utils/canvasUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelect,
  onDelete,
  onClear
}) => {
  if (!isOpen) return null;

  const handleDownload = async (item: HistoryItem) => {
    try {
      const res = await fetch(item.dataUrl);
      const blob = await res.blob();
      downloadBlob(blob, `${item.name.replace(/\.[^/.]+$/, '')}-cutout.${item.format}`);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recent Edits</h3>
                <p className="text-xs text-slate-400">{items.length} saved cutouts in this browser</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/60">
                  <History className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">No recent cutouts yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  When you process and export images, they will appear here for instant re-download or re-editing.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl p-3 flex gap-3 transition shadow-sm"
                >
                  {/* Thumbnail with checkerboard */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-checkerboard flex-shrink-0 border border-slate-700">
                    <img
                      src={item.thumbnail || item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-white truncate max-w-[150px]" title={item.name}>
                          {item.name}
                        </h4>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700 text-indigo-300">
                          {item.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatDate(item.timestamp)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.width} × {item.height} px
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 pt-1 border-t border-slate-700/40">
                      <button
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-700 rounded-lg transition"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition ml-auto"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={onClear}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All History
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
