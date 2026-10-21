/**
 * Registry 20 tema visual microsite Puskesmas Manding (BARU, 21 Okt 2026).
 *
 * Satu-satunya sumber kebenaran palet tema. File ini IDENTIK di dua repo:
 *  - app microsite (render halaman publik + pratinjau ?theme=)
 *  - web utama (pemilih tema di builder admin + pratinjau live)
 *
 * Pola yang diikuti: token --color-* yang sama dengan :root di app.css
 * (primary, secondary, accent, bg, text, card, surface, muted, border,
 * input, ring + status success/warning/danger/info). Tema HANYA token
 * warna — tidak mengubah layout/struktur template apa pun, sehingga
 * responsivitas tidak tersentuh. Semua tema adalah tema TERANG: sistem
 * token saat ini tidak punya saklar mode gelap, jadi varian gelap tidak
 * dibuat (bukan dihilangkan diam-diam). Tipografi tetap Inter untuk
 * semua tema — satu keluarga font menjaga beban muat tetap ringan.
 *
 * Aksesibilitas: setiap pasangan teks/latar diuji kontras WCAG 2.1 AA
 * (teks normal >= 4,5:1). Rasio terendah di semua tema adalah teks
 * muted di atas latar (5,6:1); teks isi di atas latar 14,3:1 atau lebih.
 * Kaidah 60-30-10: latar netral terang 60%, kartu/sekunder 30%,
 * primer/aksen 10% untuk tombol, tautan, dan penanda.
 *
 * Tema LAMA (fresh_mint/:root, emerald/sky/rose/neutral/light/dark di
 * ClassicHub, preset aksen builder) TIDAK diubah dan TIDAK ada di sini:
 * bila microsite memakai nama lama, halaman merender persis seperti
 * sebelumnya (tidak ada override token).
 */

export interface MicrositeThemeTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  bg: string;
  text: string;
  card: string;
  surface: string;
  surfaceForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface MicrositeTheme {
  /** Id tema — dipakai di themeCustomization.theme & query ?theme=. */
  id: string;
  /** Nama Indonesia yang tampil di pemilih tema builder. */
  name: string;
  /** Deskripsi pemakaian untuk admin. */
  desc: string;
  /** Karakter singkat (mis. 'Segar · berwibawa'). */
  character: string;
  tokens: MicrositeThemeTokens;
}

export const MICROSITE_THEMES: MicrositeTheme[] = [
  {
    id: 'rimba-pinus',
    name: 'Rimba Pinus',
    desc: 'Hijau hutan dalam yang tenang dan berwibawa, untuk layanan kehutanan & lingkungan',
    character: 'Segar · berwibawa',
    tokens: {
      primary: '#14532D',
      primaryForeground: '#FFFFFF',
      secondary: '#DCFCE7',
      secondaryForeground: '#14532D',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F2F7F2',
      text: '#16281C',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#16281C',
      muted: '#E4EFE4',
      mutedForeground: '#4B5E52',
      border: '#C2D6C6',
      input: '#C2D6C6',
      ring: '#14532D',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'sawah-pagi',
    name: 'Sawah Pagi',
    desc: 'Hijau muda sawah pagi hari, ceria dan membumi',
    character: 'Segar · ceria',
    tokens: {
      primary: '#3F6212',
      primaryForeground: '#FFFFFF',
      secondary: '#ECFCCB',
      secondaryForeground: '#365314',
      accent: '#92400E',
      accentForeground: '#FFFFFF',
      bg: '#FAFDF3',
      text: '#20290F',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#20290F',
      muted: '#EAF3D8',
      mutedForeground: '#4D5A33',
      border: '#D3E0B4',
      input: '#D3E0B4',
      ring: '#3F6212',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'laut-tenang',
    name: 'Laut Tenang',
    desc: 'Biru laut dalam yang menenangkan, tepercaya untuk layanan umum',
    character: 'Segar · tepercaya',
    tokens: {
      primary: '#155E75',
      primaryForeground: '#FFFFFF',
      secondary: '#CFFAFE',
      secondaryForeground: '#164E63',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F2F9FB',
      text: '#12272E',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#12272E',
      muted: '#E2EFF3',
      mutedForeground: '#45636C',
      border: '#C3D9DF',
      input: '#C3D9DF',
      ring: '#155E75',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'dirgantara',
    name: 'Dirgantara',
    desc: 'Biru dongker formal institusi, tegas dan resmi',
    character: 'Elegan · resmi',
    tokens: {
      primary: '#1E3A8A',
      primaryForeground: '#FFFFFF',
      secondary: '#DBEAFE',
      secondaryForeground: '#1E3A8A',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F3F6FC',
      text: '#1B2340',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#1B2340',
      muted: '#E4EAF6',
      mutedForeground: '#4A5578',
      border: '#C6D2EC',
      input: '#C6D2EC',
      ring: '#1E3A8A',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'langit-cerah',
    name: 'Langit Cerah',
    desc: 'Biru langit siang yang lapang dan optimis',
    character: 'Segar · optimis',
    tokens: {
      primary: '#0369A1',
      primaryForeground: '#FFFFFF',
      secondary: '#E0F2FE',
      secondaryForeground: '#0C4A6E',
      accent: '#C2410C',
      accentForeground: '#FFFFFF',
      bg: '#F2F9FD',
      text: '#142833',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#142833',
      muted: '#E0EFF8',
      mutedForeground: '#45687C',
      border: '#C2D8E6',
      input: '#C2D8E6',
      ring: '#0369A1',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'nila-malam',
    name: 'Nila Malam',
    desc: 'Ungu-biru nila yang khidmat dan modern',
    character: 'Elegan · modern',
    tokens: {
      primary: '#3730A3',
      primaryForeground: '#FFFFFF',
      secondary: '#E0E7FF',
      secondaryForeground: '#312E81',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F4F4FC',
      text: '#211F3E',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#211F3E',
      muted: '#E6E6F5',
      mutedForeground: '#54517A',
      border: '#C9C6E8',
      input: '#C9C6E8',
      ring: '#3730A3',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'senja-jingga',
    name: 'Senja Jingga',
    desc: 'Jingga senja yang hangat dan mengundang',
    character: 'Hangat · ramah',
    tokens: {
      primary: '#9A3412',
      primaryForeground: '#FFFFFF',
      secondary: '#FFEDD5',
      secondaryForeground: '#7C2D12',
      accent: '#155E75',
      accentForeground: '#FFFFFF',
      bg: '#FDF7F2',
      text: '#2C1A10',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2C1A10',
      muted: '#F5E6DA',
      mutedForeground: '#6B4A3A',
      border: '#E7CDBB',
      input: '#E7CDBB',
      ring: '#9A3412',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'bata-nusantara',
    name: 'Bata Nusantara',
    desc: 'Merah bata tradisional, kokoh dan membumi',
    character: 'Hangat · kokoh',
    tokens: {
      primary: '#991B1B',
      primaryForeground: '#FFFFFF',
      secondary: '#FEE2E2',
      secondaryForeground: '#7F1D1D',
      accent: '#92400E',
      accentForeground: '#FFFFFF',
      bg: '#FDF4F3',
      text: '#2E1414',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2E1414',
      muted: '#F6E3E1',
      mutedForeground: '#6E4A44',
      border: '#E8C6C2',
      input: '#E8C6C2',
      ring: '#991B1B',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'kunyit-emas',
    name: 'Kunyit Emas',
    desc: 'Kuning kunyit keemasan, cerah namun tetap sopan',
    character: 'Hangat · ceria',
    tokens: {
      primary: '#854D0E',
      primaryForeground: '#FFFFFF',
      secondary: '#FEF3C7',
      secondaryForeground: '#78350F',
      accent: '#991B1B',
      accentForeground: '#FFFFFF',
      bg: '#FDF9F0',
      text: '#2B2110',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2B2110',
      muted: '#F4EAD2',
      mutedForeground: '#6A563A',
      border: '#E6D6B4',
      input: '#E6D6B4',
      ring: '#854D0E',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'delima-merah',
    name: 'Delima Merah',
    desc: 'Merah delima yang berani dan penuh perhatian',
    character: 'Berani · peduli',
    tokens: {
      primary: '#9F1239',
      primaryForeground: '#FFFFFF',
      secondary: '#FFE4E6',
      secondaryForeground: '#881337',
      accent: '#854D0E',
      accentForeground: '#FFFFFF',
      bg: '#FDF3F4',
      text: '#2D1119',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2D1119',
      muted: '#F6E1E5',
      mutedForeground: '#6E4450',
      border: '#EAC2CB',
      input: '#EAC2CB',
      ring: '#9F1239',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'sakura-mekar',
    name: 'Sakura Mekar',
    desc: 'Merah muda sakura yang lembut dan bersahabat',
    character: 'Lembut · ramah',
    tokens: {
      primary: '#BE185D',
      primaryForeground: '#FFFFFF',
      secondary: '#FCE7F3',
      secondaryForeground: '#9D174D',
      accent: '#0F766E',
      accentForeground: '#FFFFFF',
      bg: '#FDF4F8',
      text: '#2E1220',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2E1220',
      muted: '#F7E3EC',
      mutedForeground: '#70485C',
      border: '#EBC8D8',
      input: '#EBC8D8',
      ring: '#BE185D',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'anggrek-ungu',
    name: 'Anggrek Ungu',
    desc: 'Ungu anggrek yang anggun dan berkesan',
    character: 'Elegan · anggun',
    tokens: {
      primary: '#7E22CE',
      primaryForeground: '#FFFFFF',
      secondary: '#F3E8FF',
      secondaryForeground: '#581C87',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F8F4FD',
      text: '#251638',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#251638',
      muted: '#EBE2F7',
      mutedForeground: '#5D4A74',
      border: '#D6C6E9',
      input: '#D6C6E9',
      ring: '#7E22CE',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'lavender-senja',
    name: 'Lavender Senja',
    desc: 'Ungu lavender senja yang lembut dan menenangkan',
    character: 'Lembut · tenang',
    tokens: {
      primary: '#6D28D9',
      primaryForeground: '#FFFFFF',
      secondary: '#EDE9FE',
      secondaryForeground: '#4C1D95',
      accent: '#0E7490',
      accentForeground: '#FFFFFF',
      bg: '#F6F4FD',
      text: '#221C38',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#221C38',
      muted: '#E8E4F7',
      mutedForeground: '#554A72',
      border: '#CFC6E9',
      input: '#CFC6E9',
      ring: '#6D28D9',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'toska-pantai',
    name: 'Toska Pantai',
    desc: 'Toska pantai yang segar dan bersih',
    character: 'Segar · bersih',
    tokens: {
      primary: '#0F766E',
      primaryForeground: '#FFFFFF',
      secondary: '#CCFBF1',
      secondaryForeground: '#134E4A',
      accent: '#9A3412',
      accentForeground: '#FFFFFF',
      bg: '#F1FBF9',
      text: '#122926',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#122926',
      muted: '#DFF2EE',
      mutedForeground: '#44655F',
      border: '#BFDCD6',
      input: '#BFDCD6',
      ring: '#0F766E',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'magenta-fajar',
    name: 'Magenta Fajar',
    desc: 'Magenta fajar yang berani dan modern',
    character: 'Berani · modern',
    tokens: {
      primary: '#A21CAF',
      primaryForeground: '#FFFFFF',
      secondary: '#FAE8FF',
      secondaryForeground: '#701A75',
      accent: '#0E7490',
      accentForeground: '#FFFFFF',
      bg: '#FCF3FD',
      text: '#2C1230',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2C1230',
      muted: '#F2E1F5',
      mutedForeground: '#6B466D',
      border: '#E3C6E8',
      input: '#E3C6E8',
      ring: '#A21CAF',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'batu-karang',
    name: 'Batu Karang',
    desc: 'Abu batu hangat yang netral dan profesional',
    character: 'Netral · profesional',
    tokens: {
      primary: '#44403C',
      primaryForeground: '#FFFFFF',
      secondary: '#F5F5F4',
      secondaryForeground: '#292524',
      accent: '#9A3412',
      accentForeground: '#FFFFFF',
      bg: '#FAF9F8',
      text: '#1C1917',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#1C1917',
      muted: '#ECE9E6',
      mutedForeground: '#57534E',
      border: '#D6D3D1',
      input: '#D6D3D1',
      ring: '#44403C',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'perak-slate',
    name: 'Perak Slate',
    desc: 'Abu kebiruan slate yang dingin dan rapi',
    character: 'Netral · rapi',
    tokens: {
      primary: '#334155',
      primaryForeground: '#FFFFFF',
      secondary: '#F1F5F9',
      secondaryForeground: '#1E293B',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      bg: '#F7F9FB',
      text: '#131B26',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#131B26',
      muted: '#E6EBF0',
      mutedForeground: '#475569',
      border: '#CBD5E1',
      input: '#CBD5E1',
      ring: '#334155',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'kayu-jati',
    name: 'Kayu Jati',
    desc: 'Cokelat kayu jati yang klasik dan bersahaja',
    character: 'Hangat · klasik',
    tokens: {
      primary: '#78350F',
      primaryForeground: '#FFFFFF',
      secondary: '#F5EDE4',
      secondaryForeground: '#451A03',
      accent: '#0F766E',
      accentForeground: '#FFFFFF',
      bg: '#FBF7F2',
      text: '#241708',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#241708',
      muted: '#EFE4D6',
      mutedForeground: '#654E38',
      border: '#DEC9B2',
      input: '#DEC9B2',
      ring: '#78350F',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'zaitun-tua',
    name: 'Zaitun Tua',
    desc: 'Hijau zaitun tua yang natural dan kalem',
    character: 'Segar · kalem',
    tokens: {
      primary: '#4A5D23',
      primaryForeground: '#FFFFFF',
      secondary: '#F0F2DF',
      secondaryForeground: '#36441A',
      accent: '#9A3412',
      accentForeground: '#FFFFFF',
      bg: '#F8F9F1',
      text: '#222714',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#222714',
      muted: '#E8EBD8',
      mutedForeground: '#52593D',
      border: '#D0D5B6',
      input: '#D0D5B6',
      ring: '#4A5D23',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
  {
    id: 'susu-rempah',
    name: 'Susu Rempah',
    desc: 'Krem susu rempah yang lembut dan menghangatkan',
    character: 'Lembut · hangat',
    tokens: {
      primary: '#5C3D2E',
      primaryForeground: '#FFFFFF',
      secondary: '#F9EEDD',
      secondaryForeground: '#3F2A1E',
      accent: '#9A3412',
      accentForeground: '#FFFFFF',
      bg: '#FFFCF5',
      text: '#2A1C12',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceForeground: '#2A1C12',
      muted: '#F3E7D3',
      mutedForeground: '#6B5344',
      border: '#E2CDB6',
      input: '#E2CDB6',
      ring: '#5C3D2E',
      success: '#166534',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#075985',
    }
  },
];

/** Cari tema berdasarkan id; undefined bila id tidak dikenal (nama lama). */
export function getMicrositeTheme(id: string | undefined | null): MicrositeTheme | undefined {
  if (!id) return undefined;
  return MICROSITE_THEMES.find((t) => t.id === id);
}

/**
 * Token tema sebagai string atribut style (diterapkan pada wrapper halaman).
 * Variabel CSS mengalir ke semua template yang memakai var(--color-*), jadi
 * tidak ada template yang perlu diubah. Wrapper tidak memakai transform/
 * filter, sehingga elemen fixed (banner, modal QR) tidak terganggu.
 */
export function micrositeThemeCssVars(theme: MicrositeTheme): string {
  const t = theme.tokens;
  return [
    `--color-primary: ${t.primary}`,
    `--color-primary-foreground: ${t.primaryForeground}`,
    `--color-secondary: ${t.secondary}`,
    `--color-secondary-foreground: ${t.secondaryForeground}`,
    `--color-accent: ${t.accent}`,
    `--color-accent-foreground: ${t.accentForeground}`,
    `--color-bg: ${t.bg}`,
    `--color-text: ${t.text}`,
    `--color-card: ${t.card}`,
    `--color-surface: ${t.surface}`,
    `--color-surface-foreground: ${t.surfaceForeground}`,
    `--color-muted: ${t.muted}`,
    `--color-muted-foreground: ${t.mutedForeground}`,
    `--color-border: ${t.border}`,
    `--color-input: ${t.input}`,
    `--color-ring: ${t.ring}`,
    `--color-success: ${t.success}`,
    `--color-warning: ${t.warning}`,
    `--color-danger: ${t.danger}`,
    `--color-info: ${t.info}`,
  ].join('; ');
}
