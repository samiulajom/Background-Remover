import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Move, 
  Paintbrush, 
  Layers, 
  Crop, 
  Download, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Wand2,
  Sliders,
  Archive
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocCategory = 
  | 'quickstart' 
  | 'halo' 
  | 'move' 
  | 'eraser' 
  | 'backdrop' 
  | 'crop' 
  | 'batch' 
  | 'export' 
  | 'privacy';

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<DocCategory>('quickstart');

  if (!isOpen) return null;

  const categories: { id: DocCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'quickstart', label: 'Quick Start', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { id: 'halo', label: 'Clean White Halo', icon: <Wand2 className="w-4 h-4 text-indigo-400" /> },
    { id: 'move', label: 'Move & Scale Image', icon: <Move className="w-4 h-4 text-cyan-400" /> },
    { id: 'eraser', label: 'Eraser & Restore', icon: <Paintbrush className="w-4 h-4 text-emerald-400" /> },
    { id: 'backdrop', label: 'Backdrops & Blur', icon: <Layers className="w-4 h-4 text-violet-400" /> },
    { id: 'crop', label: 'Crop & Rotate', icon: <Crop className="w-4 h-4 text-pink-400" /> },
    { id: 'batch', label: 'Batch Processing', icon: <Archive className="w-4 h-4 text-blue-400" /> },
    { id: 'export', label: 'Multi-Format Export', icon: <Download className="w-4 h-4 text-teal-400" /> },
    { id: 'privacy', label: 'Privacy & Offline', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                User Guide & Documentation
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  How To Use
                </span>
              </h2>
              <p className="text-xs text-slate-400">Complete guide on every feature of OmniBG Remover Enhanced</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout: Sidebar Tabs + Content View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left whitespace-nowrap ${
                  activeTab === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-sm leading-relaxed">
            {/* 1. QUICK START */}
            {activeTab === 'quickstart' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Quick Start in 3 Easy Steps</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="font-bold text-white text-xs">Upload or Pick Sample</h4>
                    <p className="text-xs text-slate-400">
                      Drag & drop your photos (PNG, JPG, WebP) or click any of the 4 sample demo cards for instant testing.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                    <h4 className="font-bold text-white text-xs">Automatic AI Cutout</h4>
                    <p className="text-xs text-slate-400">
                      The browser runs neural segmentation locally with zero cloud lag. Watch the real-time progress bar.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-white text-xs">Customize & Export</h4>
                    <p className="text-xs text-slate-400">
                      Drag to move your subject, replace background, clean edge halos, adjust lighting, and download high-res PNG/JPG/WebP.
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-white">AI Models Available:</p>
                    <p className="text-slate-300">
                      • <strong>Balanced (FP16):</strong> Recommended for all modern devices (great balance of speed and hair detail).<br />
                      • <strong>Fast (Quint8):</strong> Ultra-fast, ideal for low-end laptops and mobile devices.<br />
                      • <strong>High Quality (ISNet):</strong> Full neural resolution for studio product shoots.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CLEAN WHITE HALO */}
            {activeTab === 'halo' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Wand2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">How to Remove White Halos & Fringes (সাদা আভা দূর করা)</h3>
                </div>

                <p className="text-xs text-slate-300">
                  When a photo is taken against a white, grey, or bright studio background, the hair strands and edges naturally retain semi-transparent pixels with the white background color baked in. When placed on a dark or transparent canvas, this creates a white glowing border.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2 text-indigo-300">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Method 1: 1-Click Auto Clean Halo
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      In the <strong>Adjust</strong> tab on the right sidebar, simply click the <strong>"Auto Clean Halo"</strong> button. It will instantly reverse the white matte wash and tighten the boundary by 2 pixels.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2 text-amber-300">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      Method 2: Fine-Tuning Sliders
                    </h4>
                    <div className="text-xs text-slate-400 mt-2 space-y-2">
                      <p>
                        • <strong>Remove White Halo (De-fringe) (0% - 100%):</strong> Mathematically subtracts the white background light from semi-transparent edge pixels, restoring the deep rich color of the hair.
                      </p>
                      <p>
                        • <strong>Trim Edge Boundary (Choke) (0 - 6px):</strong> Physically erodes the fuzzy outer edge by 1 to 4 pixels, cutting away any stubborn halo border.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2 text-emerald-300">
                      <Paintbrush className="w-4 h-4 text-emerald-400" />
                      Method 3: In the Magic Eraser Brush Studio
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Open <strong>"Magic Eraser & Restore"</strong> and click <strong>"Auto Clean White Halo"</strong> on the top toolbar for instant cleaning right inside the touch-up workspace.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MOVE & SCALE */}
            {activeTab === 'move' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Move className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Moving, Scaling & Repositioning Your Subject</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs">Direct Canvas Dragging</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Click (or touch on mobile/tablet) directly on the cutout in the center canvas and drag it anywhere you want! The position coordinates update smoothly in real time.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs">Size & Position Sliders (in Adjust Tab)</h4>
                    <div className="text-xs text-slate-400 mt-2 space-y-1.5">
                      <p>• <strong>Subject Size:</strong> Scale between 30% and 200%.</p>
                      <p>• <strong>Offset X & Y:</strong> Fine-tune position down to individual pixels.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs">Quick Alignment Presets</h4>
                    <div className="text-xs text-slate-400 mt-2 space-y-1.5">
                      <p>• <strong>Center:</strong> Returns the subject back to exact canvas center.</p>
                      <p>• <strong>Bottom Center:</strong> Perfect for portrait, passport, and profile photos so the head is clearly visible and the chest rests naturally on the bottom border.</p>
                      <p>• <strong>Left & Right:</strong> Ideal for thumbnail compositions with text on the side.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ERASER & RESTORE */}
            {activeTab === 'eraser' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Paintbrush className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Magic Eraser & Restore Brush</h3>
                </div>

                <p className="text-xs text-slate-300">
                  Sometimes AI might accidentally remove a small piece of jewelry, glasses, or hair, or leave behind an unwanted background artifact. The brush studio gives you 100% manual control.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Erase Mode
                    </span>
                    <p className="text-xs text-slate-400">
                      Drag over leftover background fringes, spots, or unwanted objects to erase them cleanly to transparent.
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Restore Mode
                    </span>
                    <p className="text-xs text-slate-400">
                      Drag over areas where the subject was cut too aggressively to paint back original pixels from the source photo!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <p className="font-bold text-white">Pro Tips in Brush Studio:</p>
                  <p className="text-slate-400">• Use <strong>Hold to Peek Original</strong> to inspect what details were in the original photo.</p>
                  <p className="text-slate-400">• Use <strong>Zoom (+ / -)</strong> and <strong>Shift + Drag</strong> (or 2 fingers on touch) to pan around hair edges.</p>
                  <p className="text-slate-400">• Full <strong>Undo (Ctrl+Z)</strong> and <strong>Redo (Ctrl+Y)</strong> stroke history.</p>
                </div>
              </div>
            )}

            {/* 5. BACKDROPS & BLUR */}
            {activeTab === 'backdrop' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Layers className="w-5 h-5 text-violet-400" />
                  <h3 className="text-base font-bold text-white">Backdrop Replacement & DSLR Blur</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs">4 Background Modes</h4>
                    <div className="text-xs text-slate-400 mt-2 space-y-1.5">
                      <p>• <strong>Transparent:</strong> Classic checkerboard for PNG stickers and product cutouts.</p>
                      <p>• <strong>Color:</strong> Custom hex color picker + 20 curated palettes (LinkedIn Blue, Studio White, Luxury Gold, Pastels).</p>
                      <p>• <strong>Gradient:</strong> 12 modern linear & radial presets (Sunset Glow, Softbox Studio, Deep Ocean, Neon Cyber).</p>
                      <p>• <strong>Photo:</strong> Curated photography scenes (Penthouse, Modern Studio, Cafe, Nature, Marble Wall, City Lights) or upload your own!</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-xs">DSLR Background Blur Slider</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      When using a photo backdrop, drag the <strong>DSLR Background Blur</strong> slider (0px to 30px) to create professional camera lens bokeh, making your subject pop sharp in front.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CROP & ROTATE */}
            {activeTab === 'crop' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Crop className="w-5 h-5 text-pink-400" />
                  <h3 className="text-base font-bold text-white">Crop & Orientation Tool</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p>Click <strong>"Crop / Rotate"</strong> on the canvas toolbar or in the <strong>Touch-Up</strong> tab.</p>
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <p className="font-bold text-white">Preset Aspect Ratios:</p>
                    <p className="text-slate-400">• <strong>Free:</strong> Custom rectangular crop.</p>
                    <p className="text-slate-400">• <strong>1:1:</strong> Square (Instagram posts, profile avatars, eCommerce).</p>
                    <p className="text-slate-400">• <strong>16:9:</strong> Landscape (YouTube thumbnails, presentation slides).</p>
                    <p className="text-slate-400">• <strong>9:16:</strong> Vertical Stories / Reels / TikTok.</p>
                    <p className="text-slate-400">• <strong>4:3 & 3:2:</strong> Standard photography formats.</p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    <p className="font-bold text-white">Orientation Controls:</p>
                    <p className="text-slate-400">• 90° Rotate Left / Right.</p>
                    <p className="text-slate-400">• Flip Horizontal & Flip Vertical mirror transforms.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. BATCH */}
            {activeTab === 'batch' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Archive className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Batch Processing & 1-Click ZIP Download</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p>You can process tens of photos at once completely in your browser!</p>
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <p className="font-bold text-white">How it works:</p>
                    <p className="text-slate-400">1. Select or drag & drop multiple images into the upload zone.</p>
                    <p className="text-slate-400">2. The <strong>Batch Queue</strong> displays all items with real-time status badges.</p>
                    <p className="text-slate-400">3. Click <strong>"Process All"</strong> to queue sequential client-side processing without freezing browser memory.</p>
                    <p className="text-slate-400">4. Click <strong>"Download ZIP"</strong> to instantly download all transparent cutouts packaged in a single <code>.zip</code> file!</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. EXPORT */}
            {activeTab === 'export' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Download className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">Multi-Format Export & Quality</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">PNG Format</span>
                      <p className="text-slate-400 text-[11px]">Best for transparent cutouts, maximum crisp quality, no compression artifacts.</p>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">JPEG Format</span>
                      <p className="text-slate-400 text-[11px]">Best for solid color/photo backgrounds with minimal file size.</p>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">WebP Format</span>
                      <p className="text-slate-400 text-[11px]">Modern web format supporting transparency with up to 70% smaller file size.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    <p className="font-bold text-white">Resolution & Dimension Resizing:</p>
                    <p className="text-slate-400">• Scale Presets: 25%, 50%, 75%, 100%, and <strong>200% (2x Ultra HD)</strong>.</p>
                    <p className="text-slate-400">• Custom Width × Height inputs with aspect ratio lock.</p>
                    <p className="text-slate-400">• <strong>Copy to Clipboard:</strong> Instantly paste into Figma, Photoshop, Canva, Discord, or Slack.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">100% Privacy & In-Browser Processing</h3>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No Images Leave Your Computer</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Unlike traditional online background removers that upload your private photos to remote cloud servers (charging subscriptions or pay-per-image fees), <strong>OmniBG Remover Enhanced</strong> runs the entire AI segmentation model locally inside your browser using <strong>WebAssembly & ONNX Runtime</strong>.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Your personal portraits, confidential product mockups, and client photos remain 100% private on your device at all times. Once the model is cached in your browser, it even works offline without an internet connection!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            OmniBG Remover Enhanced v2.0 • 100% Free & Open Source
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            Got It! Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
