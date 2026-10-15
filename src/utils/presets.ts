import { BackgroundSettings, SubjectAdjustments, ExportSettings } from '../types';

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-portrait',
    name: 'Portrait Model',
    category: 'Person',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-product',
    name: 'Sneaker Product',
    category: 'E-commerce',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-pet',
    name: 'Golden Dog',
    category: 'Pet',
    thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-car',
    name: 'Sports Car',
    category: 'Vehicle',
    thumbnail: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=85'
  }
];

export interface ColorPreset {
  name: string;
  hex: string;
  category: 'Neutral' | 'Vibrant' | 'Social' | 'Pastel';
}

export const COLOR_PRESETS: ColorPreset[] = [
  // Neutrals
  { name: 'Pure White', hex: '#FFFFFF', category: 'Neutral' },
  { name: 'Studio Grey', hex: '#E2E8F0', category: 'Neutral' },
  { name: 'Slate Gray', hex: '#64748B', category: 'Neutral' },
  { name: 'Charcoal', hex: '#1E293B', category: 'Neutral' },
  { name: 'Deep Black', hex: '#000000', category: 'Neutral' },
  { name: 'Warm Cream', hex: '#FDFBF7', category: 'Neutral' },
  // Social & Brand
  { name: 'LinkedIn Blue', hex: '#0A66C2', category: 'Social' },
  { name: 'YouTube Red', hex: '#FF0000', category: 'Social' },
  { name: 'Instagram Pink', hex: '#E1306C', category: 'Social' },
  { name: 'Discord Blurple', hex: '#5865F2', category: 'Social' },
  { name: 'Spotify Green', hex: '#1DB954', category: 'Social' },
  // Vibrant & Studio
  { name: 'Electric Violet', hex: '#7C3AED', category: 'Vibrant' },
  { name: 'Vibrant Amber', hex: '#F59E0B', category: 'Vibrant' },
  { name: 'Emerald Gem', hex: '#10B981', category: 'Vibrant' },
  { name: 'Cyan Neon', hex: '#06B6D4', category: 'Vibrant' },
  { name: 'Luxury Gold', hex: '#D97706', category: 'Vibrant' },
  // Pastels
  { name: 'Soft Peach', hex: '#FED7AA', category: 'Pastel' },
  { name: 'Lavender Mist', hex: '#E9D5FF', category: 'Pastel' },
  { name: 'Mint Frost', hex: '#A7F3D0', category: 'Pastel' },
  { name: 'Sky Baby Blue', hex: '#BAE6FD', category: 'Pastel' },
];

export interface GradientPreset {
  name: string;
  css: string;
  type: 'linear' | 'radial';
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: 'Sunset Glow',
    css: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    type: 'linear'
  },
  {
    name: 'Studio Softbox',
    css: 'radial-gradient(circle at 50% 30%, #475569 0%, #0F172A 100%)',
    type: 'radial'
  },
  {
    name: 'Neon Cyber',
    css: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #3B82F6 100%)',
    type: 'linear'
  },
  {
    name: 'Deep Ocean',
    css: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
    type: 'linear'
  },
  {
    name: 'Aurora Borealis',
    css: 'linear-gradient(135deg, #059669 0%, #0284C7 50%, #6366F1 100%)',
    type: 'linear'
  },
  {
    name: 'Warm Amber',
    css: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
    type: 'linear'
  },
  {
    name: 'Rose Petal',
    css: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 50%, #FEE2E2 100%)',
    type: 'linear'
  },
  {
    name: 'Clean Studio Light',
    css: 'radial-gradient(circle at center, #FFFFFF 0%, #E2E8F0 100%)',
    type: 'radial'
  },
  {
    name: 'Midnight Purple',
    css: 'linear-gradient(135deg, #311042 0%, #150928 100%)',
    type: 'linear'
  },
  {
    name: 'Mojito Fresh',
    css: 'linear-gradient(135deg, #34D399 0%, #A7F3D0 100%)',
    type: 'linear'
  },
  {
    name: 'Hyper Lemon',
    css: 'linear-gradient(135deg, #FDE047 0%, #F97316 100%)',
    type: 'linear'
  },
  {
    name: 'Silver Titanium',
    css: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 50%, #64748B 100%)',
    type: 'linear'
  }
];

export interface StockBackdrop {
  id: string;
  name: string;
  category: 'Studio' | 'Interior' | 'Nature' | 'Urban' | 'Texture';
  thumbnail: string;
  url: string;
}

export const STOCK_BACKDROPS: StockBackdrop[] = [
  {
    id: 'studio-white',
    name: 'Minimal White Studio',
    category: 'Studio',
    thumbnail: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'luxury-interior',
    name: 'Modern Luxury Interior',
    category: 'Interior',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'cozy-cafe',
    name: 'Aesthetic Cafe',
    category: 'Interior',
    thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'city-bokeh',
    name: 'City Night Bokeh',
    category: 'Urban',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'scenic-nature',
    name: 'Lush Forest Light',
    category: 'Nature',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'white-marble',
    name: 'Carrara Marble Wall',
    category: 'Texture',
    thumbnail: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'wood-table',
    name: 'Warm Wooden Table',
    category: 'Texture',
    thumbnail: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'neon-cyberpunk',
    name: 'Cyberpunk Tokyo Lights',
    category: 'Urban',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=85'
  }
];

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: 'transparent',
  color: '#FFFFFF',
  gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
  imageUrl: null,
  blur: 0
};

export const DEFAULT_ADJUSTMENTS: SubjectAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hueRotate: 0,
  posX: 0,
  posY: 0,
  scale: 1.0,
  defringe: 0,
  edgeChoke: 0,
  smoothEdge: false,
  shadowEnabled: false,
  shadowColor: 'rgba(0, 0, 0, 0.4)',
  shadowBlur: 15,
  shadowOffsetX: 0,
  shadowOffsetY: 12,
  shadowOpacity: 0.45,
  strokeEnabled: false,
  strokeColor: '#FFFFFF',
  strokeWidth: 6
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'png',
  quality: 0.92,
  scale: 1.0,
  lockAspect: true
};
