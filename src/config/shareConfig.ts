import {
  DEFAULT_SHARE_CONFIG,
  DEFAULT_SHARE_SECTIONS,
  type ShareConfig,
  type ShareSection,
  type ShareDecor,
} from '../types';
import { getTheme, DEFAULT_THEME_ID, FONT_PAIRINGS, type ThemeDef } from '../config/dashboardThemes';

/**
 * Gabungkan config tersimpan (mungkin dari versi lama) dengan default v2.
 * TIDAK PERNAH menghapus field; config lama tetap terbaca (kompatibel).
 */
export function normalizeShareConfig(raw: any): ShareConfig {
  const c = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_SHARE_CONFIG;

  const legacyTheme = c.theme === 'slate' ? 'slate' : 'light';
  // Data lama tidak punya `template` → petakan ke tema paling dekat.
  const legacyTemplate = legacyTheme === 'slate' ? 'premium' : 'minimalist';

  const sections: ShareSection[] = Array.isArray(c.sections) && c.sections.length
    ? c.sections.map((s: any, i: number) => ({
        id: String(s?.id || `s-${i}`),
        type: s?.type || 'customText',
        visible: s?.visible !== false,
        title: String(s?.title ?? ''),
        content: String(s?.content ?? ''),
        layout: s?.layout || 'default',
        galleryImages: Array.isArray(s?.galleryImages) ? s.galleryImages.map(String) : [],
        tone: s?.tone || 'info',
      }))
    : DEFAULT_SHARE_SECTIONS.map((s) => ({ ...s }));

  return {
    // ── data lama ──
    theme: legacyTheme,
    accent: c.accent || d.accent,
    columns: ([2, 3, 4].includes(Number(c.columns)) ? Number(c.columns) : d.columns) as 2 | 3 | 4,
    showAvatar: c.showAvatar !== false,
    showBadge: c.showBadge !== false,
    showStats: c.showStats !== false,
    showTagline: c.showTagline !== false,
    showShareButton: c.showShareButton !== false,
    badgeLabel: c.badgeLabel ?? d.badgeLabel,
    emptyText: c.emptyText ?? d.emptyText,
    micrositeMode: c.micrositeMode === 'selected' ? 'selected' : 'all',
    micrositeIds: Array.isArray(c.micrositeIds) ? c.micrositeIds.map(String) : [],
    // ── v2 (merge dalam) ──
    version: 2,
    template: c.template || legacyTemplate,
    identity: { ...d.identity, ...(c.identity || {}), socials: Array.isArray(c.identity?.socials) ? c.identity.socials : [], extraInfo: Array.isArray(c.identity?.extraInfo) ? c.identity.extraInfo : [] },
    background: { ...d.background, ...(c.background || {}) },
    typography: { ...d.typography, ...(c.typography || {}) },
    colors: { ...d.colors, ...(c.colors || {}) },
    layout: {
      ...d.layout,
      ...(c.layout || {}),
      // columns lama jadi sumber layout.columns bila layout baru kosong
      columns: c.layout?.columns && [2, 3, 4].includes(Number(c.layout.columns)) ? Number(c.layout.columns) : ([2, 3, 4].includes(Number(c.columns)) ? Number(c.columns) : d.layout.columns),
    },
    card: { ...d.card, ...(c.card || {}) },
    // lapisan artistik: default aman untuk data lama (tanpa `decor`)
    decor: { ...DEFAULT_DECOR, ...(c.decor || {}) },
    sections,
  };
}

/** Default lapisan artistik — dipakai bila config lama belum punya `decor`. */
export const DEFAULT_DECOR: ShareDecor = {
  aurora: true,
  auroraIntensity: 'sedang',
  grain: true,
  grainOpacity: 0.05,
  ornament: 'arc',
  tilt: true,
  parallax: true,
  stagger: 70,
  frame: false,
};

export function themeOf(cfg: ShareConfig): ThemeDef {
  return getTheme(cfg.template || DEFAULT_THEME_ID);
}

export function fontPairingOf(cfg: ShareConfig) {
  return FONT_PAIRINGS.find((f) => f.id === cfg.typography?.fontPairing) || FONT_PAIRINGS[0];
}

/** Susun daftar URL Google Fonts unik untuk semua pairing yang dibutuhkan. */
export function googleFontsHref(pairingId?: string): string {
  const fp = FONT_PAIRINGS.find((f) => f.id === pairingId);
  const parts = new Set<string>();
  if (fp?.google) parts.add(fp.google);
  // selalu sediakan beberapa yang umum agar pratinjau tema lancar
  FONT_PAIRINGS.filter((f) => f.google).forEach((f) => parts.add(f.google));
  return 'https://fonts.googleapis.com/css2?' + Array.from(parts).map((p) => 'family=' + p).join('&') + '&display=swap';
}

const IDENTITY_BG: Record<string, string> = {
  sm: '4px', md: '8px', lg: '14px', xl: '22px',
};
const GAP: Record<string, string> = { sm: '14px', md: '22px', lg: '32px' };
const SPACE: Record<string, string> = { sm: '26px', md: '44px', lg: '68px' };
const CONTAINER: Record<string, string> = { narrow: '880px', normal: '1120px', wide: '1360px' };
const HEADING_SIZE: Record<string, { h1: string; h2: string }> = {
  sm: { h1: '1.75rem', h2: '1.2rem' },
  md: { h1: '2.15rem', h2: '1.4rem' },
  lg: { h1: '2.6rem', h2: '1.6rem' },
  xl: { h1: '3.2rem', h2: '1.85rem' },
};

/** Konversi config menjadi CSS custom properties untuk halaman publik. */
export function buildShareCssVars(cfg: ShareConfig): React.CSSProperties {
  const t = themeOf(cfg);
  const c: any = cfg.colors || {};
  const pick = (val: any, fb: string): string => (val && val !== 'auto' ? String(val) : fb);
  const pair = fontPairingOf(cfg);

  const headingScale = cfg.typography?.headingScale || (t.style.density === 'dense' ? 'md' : 'lg');
  const lineHeight = cfg.typography?.lineHeight || (t.style.density === 'airy' ? 1.7 : 1.6);

  const vars: Record<string, string> = {
    '--sh-bg': pick(c.background, t.vars.bg),
    '--sh-surface': pick(c.surface, t.vars.surface),
    '--sh-surface-alt': t.vars.surfaceAlt,
    '--sh-text': pick(c.text, t.vars.text),
    '--sh-muted': pick(c.muted, t.vars.muted),
    '--sh-primary': pick(c.primary, t.vars.primary),
    '--sh-primary-fg': t.vars.primaryFg,
    '--sh-accent': pick(c.accent, t.vars.accent),
    '--sh-button': pick(c.button, pick(c.primary, t.vars.primary)),
    '--sh-border': pick(c.border, t.vars.border),
    '--sh-secondary': pick(c.secondary, t.vars.accent),
    '--sh-hero-from': t.vars.heroFrom,
    '--sh-hero-to': t.vars.heroTo,
    '--sh-radius': IDENTITY_BG[cfg.card?.radius || t.style.radius] || '14px',
    '--sh-gap': GAP[cfg.layout?.gap || 'md'],
    '--sh-space': SPACE[cfg.layout?.sectionSpacing || 'md'],
    '--sh-container': CONTAINER[cfg.layout?.container || 'normal'],
    '--sh-font-display': pair.display,
    '--sh-font-body': pair.body,
    '--sh-base-size': `${cfg.typography?.baseSize || 16}px`,
    '--sh-h1': HEADING_SIZE[headingScale]?.h1 || '2.6rem',
    '--sh-h2': HEADING_SIZE[headingScale]?.h2 || '1.6rem',
    '--sh-hweight': String(cfg.typography?.headingWeight || 800),
    '--sh-lh': String(lineHeight),
    '--sh-tracking': cfg.typography?.letterSpacing === 'tight' ? '-0.02em' : cfg.typography?.letterSpacing === 'wide' ? '0.04em' : 'normal',
    '--sh-align': cfg.typography?.align || 'left',
    '--sh-mobile-cols': String(cfg.layout?.mobileColumns || 1),
    '--sh-cols': String(cfg.layout?.columns || 3),
  };

  // latar gradien
  if (cfg.background?.type === 'gradient') {
    const from = cfg.background.gradientFrom || t.background.from;
    const to = cfg.background.gradientTo || t.background.to;
    vars['--sh-bg'] = `linear-gradient(${cfg.background.gradientAngle || 135}deg, ${from}, ${to})`;
  } else if (cfg.background?.type === 'solid' && cfg.background.color) {
    vars['--sh-bg'] = cfg.background.color;
  }

  return vars as unknown as React.CSSProperties;
}

/** Overlay/pattern/image layer untuk latar (dipakai halaman publik). */
export function backgroundLayerStyle(cfg: ShareConfig): React.CSSProperties | null {
  const bg = cfg.background;
  if (!bg) return null;
  if (bg.type === 'image' && bg.imageUrl) {
    return { backgroundImage: `url(${bg.imageUrl})`, opacity: (bg.imageOpacity ?? 30) / 100 };
  }
  if (bg.type === 'pattern' && bg.pattern && bg.pattern !== 'none') {
    return { pattern: bg.pattern } as any;
  }
  return null;
}
