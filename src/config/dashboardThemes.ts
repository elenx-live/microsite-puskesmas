import type { DashboardTemplateId } from '../types';

/**
 * THEME GALLERY — Dashboard Publik (Personal Website Builder)
 * -----------------------------------------------------------------
 * 8 tema dengan konsep desain yang benar-benar berbeda: palet, tipografi,
 * gaya kartu, sudut, dan nuansa latar masing-masing punya karakter sendiri —
 * bukan sekadar pergantian warna dari satu struktur.
 *
 * Nilai di sini adalah SUMBER untuk:
 *  - thumbnail & preview di Theme Gallery
 *  - nilai awal saat tema diterapkan (bisa diubah pengelola setelahnya)
 *
 * Semua nilai aman (tanpa CSS/HTML mentah). Front-end memakai `vars` sebagai
 * CSS custom properties sehingga tema tidak bisa merusak layout.
 */

export interface ThemeDef {
  id: DashboardTemplateId;
  name: string;
  category: string;
  description: string;
  /** Nuansa singkat untuk badge, mis. "Whitespace luas". */
  vibe: string;
  /** Font pairing: display (heading) + body. */
  fonts: { display: string; body: string };
  /** Token warna inti (dipakai untuk CSS var). */
  vars: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    muted: string;
    primary: string;
    primaryFg: string;
    accent: string;
    border: string;
    /** Gradien opsional (header/hero). */
    heroFrom: string;
    heroTo: string;
  };
  /** Gaya visual per-tema. */
  style: {
    radius: 'sm' | 'md' | 'lg' | 'xl';
    cardStyle: 'elevated' | 'flat' | 'outline' | 'glass' | 'gradient';
    heroStyle: 'plain' | 'gradient' | 'image' | 'split' | 'bold' | 'editorial';
    headingCase: 'none' | 'upper' | 'tight';
    density: 'airy' | 'normal' | 'dense';
    accentShape: 'underline' | 'bar' | 'dot' | 'none';
  };
  /** Latar default (kalau pengelola tidak mengubah). */
  background: { type: 'solid' | 'gradient' | 'pattern'; from: string; to: string; pattern: 'none' | 'dots' | 'grid' | 'waves' | 'topography' };
  /** Preview swatch untuk kartu di gallery. */
  swatch: string[];
  dark: boolean;
}

export const DASHBOARD_THEMES: ThemeDef[] = [
  {
    id: 'minimalist',
    name: 'Aurora Bersih',
    category: 'Modern Minimalist',
    description: 'Bersih, lapang, banyak whitespace. Tipografi modern dengan aksen halus.',
    vibe: 'Whitespace luas',
    fonts: { display: "'Plus Jakarta Sans', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F7F8F7', text: '#121815',
      muted: '#6B7280', primary: '#111827', primaryFg: '#FFFFFF', accent: '#10B981',
      border: '#E8EAED', heroFrom: '#FFFFFF', heroTo: '#F3F6F4',
    },
    style: { radius: 'lg', cardStyle: 'outline', heroStyle: 'plain', headingCase: 'tight', density: 'airy', accentShape: 'dot' },
    background: { type: 'solid', from: '#FFFFFF', to: '#FFFFFF', pattern: 'none' },
    swatch: ['#FFFFFF', '#111827', '#10B981', '#E8EAED'],
    dark: false,
  },
  {
    id: 'premium',
    name: 'Obsidian Luxe',
    category: 'Premium & Elegant',
    description: 'Tampilan mewah gelap dengan emas. Komposisi visual matang dan berkarakter.',
    vibe: 'Mewah & gelap',
    fonts: { display: "'Playfair Display', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#0B0B0D', surface: '#141417', surfaceAlt: '#1B1B20', text: '#F5F1E8',
      muted: '#A8A29A', primary: '#C9A227', primaryFg: '#141417', accent: '#E5C76B',
      border: '#2A2A30', heroFrom: '#141417', heroTo: '#0B0B0D',
    },
    style: { radius: 'md', cardStyle: 'elevated', heroStyle: 'split', headingCase: 'none', density: 'normal', accentShape: 'bar' },
    background: { type: 'gradient', from: '#0B0B0D', to: '#1B1B20', pattern: 'none' },
    swatch: ['#0B0B0D', '#C9A227', '#F5F1E8', '#2A2A30'],
    dark: true,
  },
  {
    id: 'gradient',
    name: 'Neon Flow',
    category: 'Gradient & Futuristic',
    description: 'Gradien hidup, efek visual dinamis, nuansa futuristik kontemporer.',
    vibe: 'Gradien dinamis',
    fonts: { display: "'Space Grotesk', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#0A0A18', surface: '#14143333', surfaceAlt: '#1C1C3A', text: '#F2F2FF',
      muted: '#A5A5C4', primary: '#8B5CF6', primaryFg: '#FFFFFF', accent: '#22D3EE',
      border: '#2E2E55', heroFrom: '#7C3AED', heroTo: '#0EA5E9',
    },
    style: { radius: 'xl', cardStyle: 'glass', heroStyle: 'gradient', headingCase: 'tight', density: 'normal', accentShape: 'none' },
    background: { type: 'gradient', from: '#7C3AED', to: '#0EA5E9', pattern: 'dots' },
    swatch: ['#0A0A18', '#8B5CF6', '#22D3EE', '#2E2E55'],
    dark: true,
  },
  {
    id: 'corporate',
    name: 'Institusi Tegas',
    category: 'Professional & Corporate',
    description: 'Formal dan terstruktur. Kokoh untuk organisasi dan institusi.',
    vibe: 'Formal & tertata',
    fonts: { display: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#F4F6FA', surface: '#FFFFFF', surfaceAlt: '#EEF2F8', text: '#0F1B2D',
      muted: '#5A6B85', primary: '#1D4ED8', primaryFg: '#FFFFFF', accent: '#0F766E',
      border: '#D6DEEA', heroFrom: '#1D4ED8', heroTo: '#0F1B2D',
    },
    style: { radius: 'sm', cardStyle: 'flat', heroStyle: 'bold', headingCase: 'none', density: 'normal', accentShape: 'bar' },
    background: { type: 'solid', from: '#F4F6FA', to: '#F4F6FA', pattern: 'grid' },
    swatch: ['#F4F6FA', '#1D4ED8', '#0F172A', '#D6DEEA'],
    dark: false,
  },
  {
    id: 'creative',
    name: 'Pesta Warna',
    category: 'Creative & Colorful',
    description: 'Ekspresif dan hidup. Kombinasi warna berani untuk personal branding.',
    vibe: 'Warna berani',
    fonts: { display: "'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif", body: "'Nunito', 'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#FFF8F1', surface: '#FFFFFF', surfaceAlt: '#FFF1E6', text: '#2B1B3D',
      muted: '#7A6A8C', primary: '#FF5D8F', primaryFg: '#FFFFFF', accent: '#FFB020',
      border: '#FFD9C7', heroFrom: '#FF5D8F', heroTo: '#FFB020',
    },
    style: { radius: 'xl', cardStyle: 'gradient', heroStyle: 'gradient', headingCase: 'none', density: 'normal', accentShape: 'dot' },
    background: { type: 'solid', from: '#FFF8F1', to: '#FFF1E6', pattern: 'dots' },
    swatch: ['#FF5D8F', '#FFB020', '#7C3AED', '#FFF8F1'],
    dark: false,
  },
  {
    id: 'editorial',
    name: 'Kabar Pagi',
    category: 'Editorial & Magazine',
    description: 'Layout majalah digital. Tipografi kuat, penekanan konten dan gambar.',
    vibe: 'Majalah digital',
    fonts: { display: "'Libre Baskerville', Georgia, serif", body: "'Source Serif 4', Georgia, serif" },
    vars: {
      bg: '#FBF8F1', surface: '#FFFFFF', surfaceAlt: '#F3EDE0', text: '#1A1712',
      muted: '#6B6256', primary: '#9A3412', primaryFg: '#FFFFFF', accent: '#1A1712',
      border: '#E3D9C6', heroFrom: '#FBF8F1', heroTo: '#F3EDE0',
    },
    style: { radius: 'sm', cardStyle: 'flat', heroStyle: 'editorial', headingCase: 'none', density: 'dense', accentShape: 'underline' },
    background: { type: 'solid', from: '#FBF8F1', to: '#FBF8F1', pattern: 'none' },
    swatch: ['#FBF8F1', '#9A3412', '#1A1712', '#E3D9C6'],
    dark: false,
  },
  {
    id: 'nature',
    name: 'Hutan Tenang',
    category: 'Nature & Soft',
    description: 'Warna lembut dan natural. Nyaman dipandang, menenangkan.',
    vibe: 'Lembut natural',
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
    vars: {
      bg: '#F3F7F2', surface: '#FFFFFF', surfaceAlt: '#E7F0E6', text: '#1F2A22',
      muted: '#5F6F62', primary: '#3F7D5A', primaryFg: '#FFFFFF', accent: '#A3B18A',
      border: '#D3E0D3', heroFrom: '#E7F0E6', heroTo: '#F3F7F2',
    },
    style: { radius: 'lg', cardStyle: 'flat', heroStyle: 'plain', headingCase: 'none', density: 'airy', accentShape: 'dot' },
    background: { type: 'solid', from: '#F3F7F2', to: '#E7F0E6', pattern: 'none' },
    swatch: ['#3F7D5A', '#A3B18A', '#E7F0E6', '#1F2A22'],
    dark: false,
  },
  {
    id: 'artistic',
    name: 'Kanvas Berani',
    category: 'Bold & Artistic',
    description: 'Berani dengan karakter visual kuat. Komposisi tidak monoton.',
    vibe: 'Bold & artistik',
    fonts: { display: "'Archivo Black', 'Plus Jakarta Sans', system-ui, sans-serif", body: "'Space Grotesk', system-ui, sans-serif" },
    vars: {
      bg: '#111013', surface: '#1A181D', surfaceAlt: '#232029', text: '#FAF7F2',
      muted: '#9A929E', primary: '#FF4D2E', primaryFg: '#FFFFFF', accent: '#FFD23F',
      border: '#302C36', heroFrom: '#FF4D2E', heroTo: '#111013',
    },
    style: { radius: 'sm', cardStyle: 'outline', heroStyle: 'bold', headingCase: 'upper', density: 'normal', accentShape: 'bar' },
    background: { type: 'solid', from: '#111013', to: '#1A181D', pattern: 'topography' },
    swatch: ['#111013', '#FF4D2E', '#FFD23F', '#302C36'],
    dark: true,
  },
];

export const DEFAULT_THEME_ID: DashboardTemplateId = 'minimalist';

export function getTheme(id?: string | null): ThemeDef {
  return DASHBOARD_THEMES.find((t) => t.id === id) || DASHBOARD_THEMES[0];
}

/** Aturan keselamatan kustomisasi (batas min/max) — dipakai editor & server. */
export const SHARE_LIMITS = {
  dashboardNameMax: 80,
  ownerNameMax: 80,
  descriptionMax: 400,
  sectionTitleMax: 80,
  sectionContentMax: 2000,
  maxSections: 14,
  maxSocials: 12,
  maxGalleryImages: 12,
  maxFeatured: 8,
  containerWidths: { narrow: '880px', normal: '1120px', wide: '1360px' },
} as const;

/** Preset pasangan warna harmonis (kontras terjaga). */
export const COLOR_PRESETS: { id: string; name: string; primary: string; accent: string; text: string; bg: string }[] = [
  { id: 'emerald', name: 'Zamrud', primary: '#059669', accent: '#10B981', text: '#0B3B2C', bg: '#FFFFFF' },
  { id: 'ocean', name: 'Samudra', primary: '#0284C7', accent: '#38BDF8', text: '#0C2A3B', bg: '#FFFFFF' },
  { id: 'violet', name: 'Ungu', primary: '#7C3AED', accent: '#A78BFA', text: '#241245', bg: '#FFFFFF' },
  { id: 'rose', name: 'Mawar', primary: '#E11D48', accent: '#FB7185', text: '#3B0A16', bg: '#FFFFFF' },
  { id: 'amber', name: 'Amber', primary: '#D97706', accent: '#FBBF24', text: '#3A2406', bg: '#FFFFFF' },
  { id: 'slate', name: 'Netral', primary: '#334155', accent: '#0EA5E9', text: '#0F172A', bg: '#FFFFFF' },
  { id: 'forest', name: 'Rimba', primary: '#3F7D5A', accent: '#A3B18A', text: '#1F2A22', bg: '#F3F7F2' },
  { id: 'gold', name: 'Emas', primary: '#B45309', accent: '#F59E0B', text: '#2A1B06', bg: '#FFFBF3' },
];

/** Font pairing tersedia (aman, dimuat lewat CSS @import di runtime). */
export const FONT_PAIRINGS: { id: string; name: string; display: string; body: string; google: string }[] = [
  { id: 'inherit', name: 'Bawaan aplikasi', display: "'Plus Jakarta Sans', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", google: '' },
  { id: 'jakarta-inter', name: 'Jakarta + Inter', display: "'Plus Jakarta Sans', sans-serif", body: "'Inter', sans-serif", google: '' },
  { id: 'playfair-inter', name: 'Playfair + Inter (mewah)', display: "'Playfair Display', serif", body: "'Inter', sans-serif", google: 'Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700' },
  { id: 'space-inter', name: 'Space Grotesk + Inter (modern)', display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", google: 'Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700' },
  { id: 'libre-source', name: 'Libre Baskerville + Source Serif (majalah)', display: "'Libre Baskerville', serif", body: "'Source Serif 4', serif", google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600' },
  { id: 'fraunces-inter', name: 'Fraunces + Inter (natural)', display: "'Fraunces', serif", body: "'Inter', sans-serif", google: 'Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600;700' },
  { id: 'archivo-space', name: 'Archivo Black + Space Grotesk (bold)', display: "'Archivo Black', sans-serif", body: "'Space Grotesk', sans-serif", google: 'Archivo+Black&family=Space+Grotesk:wght@400;500;600;700' },
  { id: 'fredoka-nunito', name: 'Fredoka + Nunito (ceria)', display: "'Fredoka', sans-serif", body: "'Nunito', sans-serif", google: 'Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700' },
];
