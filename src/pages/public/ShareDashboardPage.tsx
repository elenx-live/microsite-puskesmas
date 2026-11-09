import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { MicrositeEntity, ShareConfig } from '../../types';
import { normalizeShareConfig, buildShareCssVars, themeOf, googleFontsHref } from '../../config/shareConfig';
import {
  Globe, Link2, LayoutGrid, Share2, Copy, Check, Loader2, Compass,
  ArrowRight, Construction, Mail, Phone, MapPin, Instagram, Facebook,
  Youtube, MessageCircle, Twitter, Linkedin, Music2, Star,
  Search, X, ChevronDown,
} from 'lucide-react';
import {
  Aurora, Grain, Ornament, Reveal, CornerFrame, SectionIndex,
  decorOf, useDecor, usePointerGlow, usePrefersReducedMotion, useParallax,
} from './shareArt';

/**
 * Dashboard publik pengelola — /share/<slug>
 *
 * Personal website builder: seluruh tampilan mengikuti `config` pengelola
 * (tema, identitas, latar, tipografi, warna, layout, gaya kartu, dan susunan
 * section). Data microsite tetap berasal dari sistem microsite yang ada —
 * tidak ada duplikasi data. Halaman ini tidak ditautkan dari navigasi utama.
 */

interface Owner {
  name: string;
  orgName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
}

/** Ambil slug dari pathname: /share/<slug> */
function slugFromPath(pathname: string): string {
  const clean = (pathname || '').replace(/^\/+|\/+$/g, '');
  if (!clean.startsWith('share/')) return '';
  const rest = clean.slice('share/'.length).split('?')[0].split('#')[0];
  if (!rest || rest.includes('/')) return '';
  try { return decodeURIComponent(rest).trim(); } catch { return rest.trim(); }
}

function socialIcon(platform: string, cls = 'h-4 w-4') {
  const p = (platform || '').toLowerCase();
  const map: Record<string, React.ReactNode> = {
    instagram: <Instagram className={cls} />, facebook: <Facebook className={cls} />,
    whatsapp: <MessageCircle className={cls} />, youtube: <Youtube className={cls} />,
    tiktok: <Music2 className={cls} />, x: <Twitter className={cls} />, twitter: <Twitter className={cls} />,
    linkedin: <Linkedin className={cls} />, website: <Globe className={cls} />, email: <Mail className={cls} />,
  };
  return map[p] || <Globe className={cls} />;
}

/** Kartu microsite — gaya mengikuti config.card & tema. */
const MicrositeCard: React.FC<{ m: MicrositeEntity; cfg: ShareConfig; index?: number; decor?: ReturnType<typeof decorOf>; id?: string; highlight?: boolean }> = ({ m, cfg, index = 0, decor, id, highlight }) => {
  const card = cfg.card;
  const d = decor || decorOf(cfg);
  const aspect = card.imageRatio === 'hidden' ? '' : card.imageRatio === 'square' ? 'aspect-square' : 'aspect-[16/9]';
  const pad = cfg.layout.cardSize === 'compact' ? 'p-4' : cfg.layout.cardSize === 'large' ? 'p-6' : 'p-5';
  const styleBg: React.CSSProperties = card.style === 'gradient'
    ? { background: 'linear-gradient(135deg, var(--sh-primary), var(--sh-accent))', color: '#fff' }
    : card.style === 'glass'
      ? { background: 'color-mix(in srgb, var(--sh-surface) 74%, transparent)', backdropFilter: 'blur(10px)', border: '1px solid var(--sh-border)', color: 'var(--sh-text)' }
      : card.style === 'outline'
        ? { background: 'var(--sh-surface)', border: '1px solid var(--sh-border)', color: 'var(--sh-text)' }
        : card.style === 'flat'
          ? { background: 'var(--sh-surface-alt)', color: 'var(--sh-text)' }
          : { background: 'var(--sh-surface)', color: 'var(--sh-text)', border: '1px solid color-mix(in srgb, var(--sh-border) 70%, transparent)' };

  const cover = m.bannerImageUrl || m.backgroundImageUrl || m.ogImageUrl;
  const linkCount = Array.isArray(m.links) ? m.links.length : 0;

  const glowRef = usePointerGlow<HTMLAnchorElement>();
  const reduced = usePrefersReducedMotion();

  return (
    <Reveal delay={Math.min(index, 8) * (d.stagger || 0)} y={26} className="sh-card-wrap">
      <a
        ref={glowRef}
        id={id}
        href={`/m/${m.slug || m.id}`}
        className={`group sh-card block overflow-hidden ${card.hoverLift && !reduced ? 'hover:-translate-y-1' : ''} ${highlight ? 'sh-card--hit' : ''}`}
        style={{ ...styleBg, borderRadius: 'var(--sh-radius)' }}
      >
        <span className="sh-card__sheen" aria-hidden />
        {cover && card.imageRatio !== 'hidden' && (
          <div className={`sh-card__cover w-full overflow-hidden ${aspect}`}>
            <img src={cover} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <div className={pad}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold leading-snug" style={{ fontFamily: 'var(--sh-font-display)' }}>{m.name}</h3>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-1" />
          </div>
          {card.showCategory && m.category && (
            <span className="sh-tier-chip mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--sh-accent) 20%, transparent)' }}>{m.category}</span>
          )}
          {card.showDescription && m.description && (
            <p className="mt-2 line-clamp-2 text-sm opacity-80" style={{ lineHeight: 'var(--sh-lh)' }}>{m.description}</p>
          )}
          {card.showLinkCount && linkCount > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs opacity-70"><Link2 className="h-3.5 w-3.5" /> {linkCount} tautan</div>
          )}
        </div>
      </a>
    </Reveal>
  );
};

export default function ShareDashboardPage({ previewConfig, previewOwner, previewMicrosites, previewTitle, previewTagline }: {
  /** Mode editor: pakai config/owner/microsite yang diberikan, tanpa fetch. */
  previewConfig?: ShareConfig | null;
  previewOwner?: Owner | null;
  previewMicrosites?: MicrositeEntity[] | null;
  previewTitle?: string;
  previewTagline?: string;
} = {}) {
  const isPreview = previewConfig !== undefined && previewConfig !== null;
  const { pathname } = useLocation();
  const slug = slugFromPath(pathname || (typeof window !== 'undefined' ? window.location.pathname : ''));

  const [owner, setOwner] = useState<Owner | null>(previewOwner ?? null);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [microsites, setMicrosites] = useState<MicrositeEntity[]>(previewMicrosites ?? []);
  const [cfg, setCfg] = useState<ShareConfig>(() => normalizeShareConfig(previewConfig ?? null));
  const [loading, setLoading] = useState(!isPreview);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  // Mode preview: update cfg/owner langsung dari props (live).
  useEffect(() => {
    if (!isPreview) return;
    setCfg(normalizeShareConfig(previewConfig ?? null));
    if (previewOwner !== undefined) setOwner(previewOwner ?? null);
    if (previewMicrosites) setMicrosites(previewMicrosites);
    if (previewTitle !== undefined) setTitle(previewTitle);
    if (previewTagline !== undefined) setTagline(previewTagline);
  }, [isPreview, previewConfig, previewOwner, previewMicrosites, previewTitle, previewTagline]);

  useEffect(() => {
    if (isPreview) { setLoading(false); return; }
    let cancelled = false;
    if (!slug) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/public/share/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        if (cancelled) return;
        setOwner(d.owner || null);
        setTitle(d.share?.title || '');
        setTagline(d.share?.tagline || '');
        setMicrosites(Array.isArray(d.microsites) ? d.microsites : []);
        setCfg(normalizeShareConfig(d.share?.config));
        setNotFound(false);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, isPreview, reloadKey]);

  const theme = useMemo(() => themeOf(cfg), [cfg]);
  const cssVars = useMemo(() => buildShareCssVars(cfg), [cfg]);
  const decor = useDecor(cfg);
  const reduced = usePrefersReducedMotion();
  const heroParallax = useParallax(decor.parallax ? 0.1 : 0);

  useEffect(() => {
    const id = 'share-fonts-all';
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet'; l.href = googleFontsHref(cfg.typography?.fontPairing);
    document.head.appendChild(l);
  }, []);

  const sections = useMemo(() => (cfg.sections || []).filter((s) => s.visible), [cfg.sections]);
  const featuredIds = cfg.card?.featuredIds || [];
  const featuredPicked = microsites.filter((m) => featuredIds.includes(m.id) || featuredIds.includes(m.slug));
  // tanpa pilihan unggulan: pakai 3 teratas supaya tab "Unggulan" tetap bermakna
  const featured = featuredPicked.length ? featuredPicked : microsites.slice(0, 3);

  const containerStyle: React.CSSProperties = { maxWidth: 'var(--sh-container)', marginInline: 'auto', paddingInline: '20px' };
  const gridStyle = (): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--sh-cols, 3), minmax(0,1fr))',
    gap: 'var(--sh-gap)',
  });

  const doShare = async () => {
    const url = `${window.location.origin}/share/${slug}`;
    try {
      if (navigator.share) { await navigator.share({ title: title || owner?.orgName || owner?.name || 'Dashboard', url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* dibatalkan */ }
  };

  /* ── Navigasi koleksi: state wajib SEBELUM early-return apa pun ── */
  const hasFeatured = featured.length > 0;
  const [navTab, setNavTab] = useState<'featured' | 'all'>('all');
  const [query, setQuery] = useState('');
  const [jump, setJump] = useState<string | null>(null);
  const navInit = React.useRef(false);

  React.useEffect(() => {
    if (navInit.current) return;
    navInit.current = true;
    setNavTab(hasFeatured ? 'featured' : 'all');
  }, [hasFeatured]);

  if (loading) {
    return (
      <PublicLayout bare>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !owner) {
    return (
      <PublicLayout bare>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-5 px-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Compass className="h-8 w-8" /></span>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-800">Dashboard tidak ditemukan</h1>
            <p className="mt-2 text-sm text-slate-500">Link ini tidak aktif atau belum dibagikan oleh pengelolanya.</p>
          </div>
          <a href="/microsites" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            <LayoutGrid className="h-4 w-4" /> Lihat Direktori Microsite
          </a>
        </div>
      </PublicLayout>
    );
  }

  /* ── Bar navigasi koleksi: tab, pencarian, dan daftar cepat ── */
  const CollectionNav: React.FC<{
    active: 'featured' | 'all';
    onTab: (t: 'featured' | 'all') => void;
    query: string;
    onQuery: (v: string) => void;
    featuredCount: number;
    allCount: number;
    featured: MicrositeEntity[];
    onPick: (id: string) => void;
    cfg: ShareConfig;
  }> = ({ active, onTab, query, onQuery, featuredCount, allCount, featured, onPick }) => {
    const [open, setOpen] = useState(false);
    const hasBoth = featuredCount > 0;
    const tabLabelAll = allCount > 0 ? allCount : 0;
    const tabsRef = React.useRef<HTMLDivElement>(null);
    const [ink, setInk] = useState({ left: 3, width: 0 });

    // ukur posisi tab aktif untuk menggeser "tinta" penyorot
    React.useEffect(() => {
      const wrap = tabsRef.current;
      if (!wrap) return;
      const btn = wrap.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`);
      if (!btn) return;
      const measure = () => setInk({ left: btn.offsetLeft, width: btn.offsetWidth });
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);
      return () => ro.disconnect();
    }, [active, featuredCount, featuredCount > 0]);

    return (
      <div className="sh-nav">
        <div className="sh-nav__bar">
          {hasBoth && (
            <div className="sh-tabs" role="tablist" aria-label="Kelompok microsite" ref={tabsRef}>
              <button role="tab" data-tab="featured" aria-selected={active === 'featured'} onClick={() => onTab('featured')}
                className={`sh-tab ${active === 'featured' ? 'is-on' : ''}`}>
                <Star className="h-3.5 w-3.5" /> Unggulan
                <span className="sh-tab__n">{featuredCount}</span>
              </button>
              <button role="tab" data-tab="all" aria-selected={active === 'all'} onClick={() => onTab('all')}
                className={`sh-tab ${active === 'all' ? 'is-on' : ''}`}>
                <LayoutGrid className="h-3.5 w-3.5" /> Semua
                <span className="sh-tab__n">{allCount}</span>
              </button>
              <span className="sh-tabs__ink" aria-hidden style={{ left: ink.left, width: ink.width }} />
            </div>
          )}

          {hasBoth && (
            <button className="sh-jump" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              Lompat ke <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}

          <label className="sh-search">
            <Search className="h-4 w-4 shrink-0 opacity-55" />
            <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Cari microsite…"
              className="w-full bg-transparent text-sm outline-none" aria-label="Cari microsite" />
            {query && (
              <button onClick={() => onQuery('')} aria-label="Hapus pencarian" className="sh-search__x">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        </div>

        {open && featured.length > 0 && (
          <div className="sh-jump__panel">
            <p className="sh-jump__hint">Pilihan unggulan — ketuk untuk menuju kartunya</p>
            <div className="flex flex-wrap gap-2">
              {featured.map((m) => (
                <button key={m.id} onClick={() => { onPick(m.id); setOpen(false); }} className="sh-chip">
                  <Star className="h-3 w-3" /> {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayName = cfg.identity?.dashboardName || title || owner.orgName || owner.name || 'Pengelola';
  const ownerName = cfg.identity?.ownerName || owner.orgName || owner.name || '';
  const avatar = cfg.identity?.logoUrl || owner.avatarUrl;
  const description = cfg.identity?.description || owner.bio || '';
  const initials = (ownerName || displayName).slice(0, 1).toUpperCase();
  const socials = cfg.identity?.socials || [];

  /* ── Navigasi koleksi: tab Unggulan/Semua + pencarian + sorot ── */

  const goToTab = (tab: 'featured' | 'all') => {
    setNavTab(tab);
    // biarkan render selesai, lalu gulir halus ke seksi terkait
    requestAnimationFrame(() => {
      const target = document.getElementById(tab === 'featured' ? 'sh-sec-featured' : 'sh-sec-all');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const onPick = (id: string) => {
    setJump(id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`sh-card-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => setJump(null), 2600);
  };

  const q = query.trim().toLowerCase();
  const matches = (m: MicrositeEntity) =>
    !q || [m.name, m.category, m.description, m.slug].filter(Boolean).join(' ').toLowerCase().includes(q);
  const shownFeatured = featured.filter(matches);
  const shownAll = microsites.filter(matches);

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-5 sh-heading" style={{ fontFamily: 'var(--sh-font-display)', fontSize: 'var(--sh-h2)', fontWeight: 'var(--sh-hweight)' as any, letterSpacing: 'var(--sh-tracking)' }}>{children}</h2>
  );

  const renderGrid = (items: MicrositeEntity[], layout: string) => {
    if (!items.length) {
      const emptyMsg = q ? `Tidak ada microsite yang cocok dengan “${query}”.` : cfg.emptyText;
      return (
        <div className="rounded-2xl border border-dashed py-14 text-center text-sm" style={{ borderColor: 'var(--sh-border)', color: 'var(--sh-muted)' }}>
          {emptyMsg}
          {q && (
            <button onClick={() => setQuery('')} className="mx-auto mt-3 block rounded-full px-4 py-1.5 text-xs font-medium sh-reset"
              style={{ border: '1px solid var(--sh-border)', color: 'var(--sh-text)' }}>
              Hapus pencarian
            </button>
          )}
        </div>
      );
    }
    const card = (m: MicrositeEntity, i: number) => (
      <MicrositeCard key={m.id} m={m} cfg={cfg} index={i} decor={decor} id={`sh-card-${m.id}`} highlight={jump === m.id} />
    );
    if (layout === 'list') {
      return <div className="flex flex-col" style={{ gap: 'var(--sh-gap)' }}>{items.map(card)}</div>;
    }
    return <div className="share-grid" style={{ gap: 'var(--sh-gap)' }}>{items.map(card)}</div>;
  };

  return (
    <PublicLayout bare>
      <div
        data-share-theme={theme.id}
        data-share-dark={theme.dark ? '1' : '0'}
        style={{
          ...cssVars,
          background: 'transparent',
          color: 'var(--sh-text)',
          /* Preview di dalam editor tidak boleh memaksa tinggi 100vh,
             karena latar absolute mengikuti tinggi wadah ini. */
          minHeight: isPreview ? '100%' : '100vh',
          position: 'relative',
          overflow: 'clip',
          isolation: 'isolate',
          fontFamily: 'var(--sh-font-body)',
          fontSize: 'var(--sh-base-size)',
          lineHeight: 'var(--sh-lh)',
          letterSpacing: 'var(--sh-tracking)',
          textAlign: 'var(--sh-align)' as any,
        }}
      >
        {/* Latar gambar + overlay */}
        {cfg.background?.type === 'image' && cfg.background.imageUrl && (
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className={`h-full w-full bg-cover bg-center ${cfg.background.imageBlur === 'sm' ? 'blur-sm' : cfg.background.imageBlur === 'md' ? 'blur-md' : cfg.background.imageBlur === 'lg' ? 'blur-lg' : ''}`}
              style={{ backgroundImage: `url(${cfg.background.imageUrl})`, opacity: (cfg.background.imageOpacity ?? 30) / 100 }} />
            {cfg.background.overlayOpacity > 0 && <div className="absolute inset-0 bg-slate-900" style={{ opacity: (cfg.background.overlayOpacity ?? 0) / 100 }} />}
          </div>
        )}
        {cfg.background?.type === 'pattern' && cfg.background.pattern !== 'none' && <div className={`sh-pattern sh-pattern-${cfg.background.pattern}`} aria-hidden />}

        {/* ── Lapisan artistik: aurora + grain (dekoratif) ── */}
        {decor.aurora && <Aurora intensity={decor.intensity} dark={theme.dark} />}
        {decor.grain && <Grain opacity={decor.grainOpacity} />}

        {sections.map((sec, secIdx) => {
          /** header seksi: nomor editorial + reveal */
          const sectionHead = (title?: string, label?: string) => (
            <Reveal delay={0}>
              <SectionIndex n={secIdx + 1} label={label} />
              {title ? <SectionTitle>{title}</SectionTitle> : null}
            </Reveal>
          );
          if (sec.type === 'hero') {
            const isBold = theme.style.heroStyle === 'gradient' || theme.style.heroStyle === 'bold';
            const heroBg: React.CSSProperties = theme.style.heroStyle === 'gradient'
              ? { background: 'linear-gradient(135deg, var(--sh-hero-from), var(--sh-hero-to))', color: '#fff' }
              : theme.style.heroStyle === 'bold'
                ? { background: 'var(--sh-hero-from)', color: '#fff' }
                : { background: 'linear-gradient(180deg, var(--sh-hero-from), transparent)' };
            const centered = cfg.typography?.align === 'center' || theme.style.heroStyle === 'editorial';
            return (
              <header key={sec.id} className="relative overflow-hidden">
                {/* latar hero + parallax + ornamen seniman */}
                <div className="absolute inset-0" style={{ ...heroBg, transform: reduced ? undefined : `translate3d(0, ${heroParallax * 0.5}px, 0) scale(1.06)` }} />
                {cfg.identity?.coverUrl && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img src={cfg.identity.coverUrl} alt="" className="h-full w-full object-cover opacity-40"
                      style={{ transform: reduced ? undefined : `translate3d(0, ${heroParallax}px, 0) scale(1.08)` }} />
                  </div>
                )}
                {decor.ornament === 'orbit' && <Ornament variant="orbit" className="right-[-140px] top-[-170px] hidden sm:block" />}
                {decor.ornament === 'arc' && <Ornament variant="arc" className="right-[-60px] bottom-[-90px] opacity-40" />}
                {decor.ornament === 'wave' && (
                  <div className="absolute inset-x-0 bottom-0" style={{ color: 'var(--sh-accent)' }}>
                    <Ornament variant="wave" />
                  </div>
                )}
                <div className="relative" style={{ ...containerStyle, paddingTop: '58px', paddingBottom: '46px' }}>
                  <div className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : 'items-start'}`}>
                    {cfg.showBadge && cfg.badgeLabel && (
                      <span className="sh-badge-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ background: isBold ? 'rgba(255,255,255,.18)' : 'color-mix(in srgb, var(--sh-accent) 20%, transparent)' }}>
                        <Share2 className="h-3.5 w-3.5" /> {cfg.badgeLabel}
                      </span>
                    )}
                    {cfg.showAvatar && (avatar ? (
                      <Reveal delay={40}>
                        <span className="sh-avatar-ring" style={{ borderRadius: 'var(--sh-radius)' }}>
                          <img src={avatar} alt={ownerName} className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-lg sm:h-24 sm:w-24" style={{ borderRadius: 'var(--sh-radius)' }} />
                        </span>
                      </Reveal>
                    ) : (
                      <Reveal delay={40}>
                        <span className="sh-avatar-ring" style={{ borderRadius: 'var(--sh-radius)' }}>
                          <span className="grid h-20 w-20 place-items-center font-display text-3xl font-extrabold text-white shadow-lg sm:h-24 sm:w-24"
                            style={{ background: 'var(--sh-primary)', borderRadius: 'var(--sh-radius)' }}>{initials}</span>
                        </span>
                      </Reveal>
                    ))}
                    <Reveal delay={110}>
                      <h1 className="sh-ink" style={{ fontFamily: 'var(--sh-font-display)', fontSize: 'var(--sh-h1)', fontWeight: 'var(--sh-hweight)' as any, letterSpacing: 'var(--sh-tracking)', lineHeight: 1.12 }}>{displayName}</h1>
                    </Reveal>
                    {ownerName && ownerName !== displayName && <Reveal delay={170}><p className="text-sm font-medium opacity-80">{ownerName}</p></Reveal>}
                    {cfg.showTagline && (tagline || description) && (
                      <Reveal delay={220}>
                        <p className={`max-w-2xl opacity-85 ${centered ? 'mx-auto' : ''}`}>{tagline || description}</p>
                      </Reveal>
                    )}
                    {cfg.showStats && (
                      <Reveal delay={280}>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                          <span className="sh-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: 'color-mix(in srgb, var(--sh-text) 8%, transparent)' }}><Globe className="h-3.5 w-3.5" /> {microsites.length} microsite</span>
                          <span className="sh-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: 'color-mix(in srgb, var(--sh-text) 8%, transparent)' }}><Link2 className="h-3.5 w-3.5" /> {microsites.reduce((n, m) => n + (Array.isArray(m.links) ? m.links.length : 0), 0)} tautan</span>
                          {cfg.showShareButton && (
                            <button onClick={doShare} className="sh-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-0.5"
                              style={{ background: 'var(--sh-button)', color: 'var(--sh-primary-fg)' }}>
                              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Tersalin' : 'Bagikan dashboard'}
                            </button>
                          )}
                        </div>
                      </Reveal>
                    )}
                  </div>
                </div>
              </header>
            );
          }

          if (sec.type === 'profile') {
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: 'var(--sh-space)', paddingBottom: 'var(--sh-space)' }}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {avatar && <img src={avatar} alt={ownerName} className="h-24 w-24 shrink-0 object-cover" style={{ borderRadius: 'var(--sh-radius)' }} />}
                  <div>
                    {sec.title && <SectionTitle>{sec.title}</SectionTitle>}
                    <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--sh-font-display)' }}>{ownerName}</h3>
                    {(sec.content || description) && <p className="mt-2 max-w-2xl opacity-80 whitespace-pre-line">{sec.content || description}</p>}
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'featured') {
            if (!featured.length) return null;
            return (
              <section id="sh-sec-featured" key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, 'Unggulan')}
                <CollectionNav active={navTab} onTab={goToTab} query={query} onQuery={setQuery}
                  featuredCount={featured.length} allCount={microsites.length}
                  featured={featured} onPick={onPick} cfg={cfg} />
                {renderGrid(navTab === 'all' ? shownAll : shownFeatured, sec.layout === 'grid' ? 'grid' : sec.layout)}
              </section>
            );
          }

          if (sec.type === 'microsites' || sec.type === 'categories') {
            return (
              <section id="sh-sec-all" key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, 'Koleksi')}
                <CollectionNav active={navTab} onTab={goToTab} query={query} onQuery={setQuery}
                  featuredCount={featured.length} allCount={microsites.length}
                  featured={featured} onPick={onPick} cfg={cfg} />
                {renderGrid(navTab === 'featured' ? shownFeatured : shownAll, sec.layout)}
              </section>
            );
          }

          if (sec.type === 'about' || sec.type === 'customText') {
            const body = sec.content || (sec.type === 'about' ? description : '');
            if (!body && !sec.title) return null;
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, sec.type === 'about' ? 'Tentang' : 'Catatan')}
                <Reveal delay={90}>
                  <CornerFrame className={decor.frame ? '' : 'sh-noframe'}>
                    <p className="max-w-3xl whitespace-pre-line opacity-85 p-4 sm:p-5" style={{ background: decor.frame ? 'color-mix(in srgb, var(--sh-surface) 55%, transparent)' : undefined, borderRadius: 'var(--sh-radius)' }}>{body}</p>
                  </CornerFrame>
                </Reveal>
              </section>
            );
          }

          if (sec.type === 'gallery') {
            const imgs = sec.galleryImages || [];
            if (!imgs.length) return null;
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, 'Galeri')}
                <div className="share-grid" style={gridStyle()}>
                  {imgs.map((src, i) => (
                    <Reveal key={i} delay={Math.min(i, 8) * (decor.stagger || 0)}>
                      <img src={src} alt="" loading="lazy" className="sh-card aspect-square w-full object-cover" style={{ borderRadius: 'var(--sh-radius)' }} />
                    </Reveal>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.type === 'social') {
            if (!socials.length) return null;
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, 'Jejaring')}
                <Reveal delay={90}>
                  <div className="flex flex-wrap gap-3">
                    {socials.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="sh-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5"
                        style={{ background: 'var(--sh-surface)', border: '1px solid var(--sh-border)', color: 'var(--sh-text)' }}>
                        {socialIcon(s.platform)} {s.label || s.platform}
                      </a>
                    ))}
                  </div>
                </Reveal>
              </section>
            );
          }

          if (sec.type === 'contact') {
            const info = cfg.identity;
            const rows: { icon: React.ReactNode; val: string; href?: string }[] = [];
            if (info?.contactEmail) rows.push({ icon: <Mail className="h-4 w-4" />, val: info.contactEmail, href: `mailto:${info.contactEmail}` });
            const ph = info?.contactPhone || owner.phone || '';
            if (ph) rows.push({ icon: <Phone className="h-4 w-4" />, val: ph, href: `tel:${ph}` });
            if (info?.contactAddress) rows.push({ icon: <MapPin className="h-4 w-4" />, val: info.contactAddress });
            if (!rows.length) return null;
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                {sectionHead(sec.title, 'Kontak')}
                <div className="flex flex-col gap-3">
                  {rows.map((r, i) => (
                    <Reveal key={i} delay={i * (decor.stagger || 0)}>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--sh-surface)', border: '1px solid var(--sh-border)' }}>{r.icon}</span>
                        {r.href ? <a href={r.href} className="opacity-85 hover:opacity-100">{r.val}</a> : <span className="opacity-85">{r.val}</span>}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.type === 'announcement') {
            const toneBg: Record<string, string> = {
              info: 'color-mix(in srgb, var(--sh-accent) 16%, var(--sh-surface))',
              success: 'color-mix(in srgb, #10b981 16%, var(--sh-surface))',
              warning: 'color-mix(in srgb, #f59e0b 20%, var(--sh-surface))',
            };
            return (
              <section key={sec.id} style={{ ...containerStyle, paddingTop: '8px', paddingBottom: 'var(--sh-space)' }}>
                <Reveal>
                  <div className="flex items-start gap-3 p-4" style={{ background: toneBg[sec.tone || 'info'], borderRadius: 'var(--sh-radius)', border: '1px solid var(--sh-border)' }}>
                    <Star className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      {sec.title && <div className="font-semibold">{sec.title}</div>}
                      {sec.content && <p className="mt-0.5 text-sm opacity-85 whitespace-pre-line">{sec.content}</p>}
                    </div>
                  </div>
                </Reveal>
              </section>
            );
          }

          if (sec.type === 'footer') {
            return (
              <footer key={sec.id} className="relative overflow-hidden" style={{ borderTop: '1px solid var(--sh-border)', background: 'var(--sh-surface)' }}>
                {decor.ornament !== 'none' && <Ornament variant="arc" className="left-1/2 top-[-10px] -translate-x-1/2 opacity-15" />}
                <Reveal>
                  <div className="relative flex flex-col items-center gap-3 text-center text-sm opacity-80" style={{ ...containerStyle, paddingTop: '26px', paddingBottom: '26px' }}>
                    <div className="sh-divider w-full max-w-sm" aria-hidden />
                    <div className="flex items-center gap-2 font-semibold" style={{ fontFamily: 'var(--sh-font-display)' }}><Globe className="h-4 w-4" /> {displayName}</div>
                    {socials.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {socials.map((s) => <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">{socialIcon(s.platform)}</a>)}
                      </div>
                    )}
                    <div className="text-xs opacity-70">© {new Date().getFullYear()} {ownerName || displayName} · Dibuat dengan Microsite Studio</div>
                  </div>
                </Reveal>
              </footer>
            );
          }

          return null;
        })}

        <style>{`
          .share-grid { grid-template-columns: repeat(var(--sh-cols), minmax(0,1fr)); }
          @media (max-width: 1023px) { .share-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
          @media (max-width: 640px) { .share-grid { grid-template-columns: repeat(var(--sh-mobile-cols), minmax(0,1fr)); } }
          .sh-pattern { position: fixed; inset: 0; z-index: -10; pointer-events: none; opacity: .5; }
          .sh-pattern-dots { background-image: radial-gradient(color-mix(in srgb, var(--sh-text) 12%, transparent) 1px, transparent 1px); background-size: 18px 18px; }
          .sh-pattern-grid { background-image: linear-gradient(color-mix(in srgb, var(--sh-text) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--sh-text) 8%, transparent) 1px, transparent 1px); background-size: 32px 32px; }
          .sh-pattern-waves { background-image: repeating-linear-gradient(45deg, color-mix(in srgb, var(--sh-text) 6%, transparent) 0 2px, transparent 2px 16px); }
          .sh-pattern-topography { background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--sh-accent) 14%, transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--sh-primary) 12%, transparent), transparent 45%); }
        `}</style>
      </div>
    </PublicLayout>
  );
}
