import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MicrositeEntity, ShareConfig, DEFAULT_SHARE_CONFIG } from '../../types';
import {
  Globe,
  Link2,
  LayoutGrid,
  Share2,
  Copy,
  Check,
  Loader2,
  Compass,
  ArrowRight,
  Construction,
} from 'lucide-react';

/**
 * Dashboard publik pengelola — /share/<slug>
 *
 * Halaman yang DIBAGIKAN pengelola (opt-in). Menampilkan profil singkat
 * pengelola + microsite published miliknya yang dipilih, dikelompokkan per
 * kategori. Seluruh elemen tampilan mengikuti `config` (kustomisasi pengelola).
 * Halaman ini tidak ditautkan dari navigasi utama.
 */

interface ShareOwner {
  name: string;
  orgName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
}
interface ShareData {
  slug: string;
  title: string;
  tagline: string;
  config?: ShareConfig;
}

const catKey = (c?: string | null) => (c || 'Umum').trim();

/** Palet aksen → warna HSL untuk CSS var. */
const ACCENT_COLORS: Record<string, string> = {
  emerald: '#0e8a63',
  sky: '#0284c7',
  violet: '#7c3aed',
  rose: '#e11d48',
  amber: '#d97706',
  zinc: '#52525b',
};

/** Ambil slug dari pathname: /share/<slug> */
function slugFromPath(pathname: string): string {
  const clean = (pathname || '').replace(/^\/+|\/+$/g, '');
  if (!clean.startsWith('share/')) return '';
  const rest = clean.slice('share/'.length).split('?')[0].split('#')[0];
  if (!rest || rest.includes('/')) return '';
  try {
    return decodeURIComponent(rest).trim();
  } catch {
    return rest.trim();
  }
}

export default function ShareDashboardPage() {
  const { pathname } = useLocation();
  const slug = slugFromPath(pathname || (typeof window !== 'undefined' ? window.location.pathname : ''));

  const [owner, setOwner] = useState<ShareOwner | null>(null);
  const [share, setShare] = useState<ShareData | null>(null);
  const [microsites, setMicrosites] = useState<MicrositeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/public/share/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return;
        setOwner(data.owner || null);
        setShare(data.share || null);
        setMicrosites(Array.isArray(data.microsites) ? data.microsites : []);
        setNotFound(false);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const cfg: ShareConfig = { ...DEFAULT_SHARE_CONFIG, ...(share?.config || {}) };

  /** Kelompokkan microsite per kategori (kategori kosong → Umum). */
  const groups = useMemo(() => {
    const map = new Map<string, MicrositeEntity[]>();
    for (const m of microsites) {
      const key = catKey(m.category);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => {
        const au = a.name.toLowerCase() === 'umum' ? -1 : 0;
        const bu = b.name.toLowerCase() === 'umum' ? -1 : 0;
        if (au !== bu) return au - bu;
        return a.name.localeCompare(b.name, 'id');
      });
  }, [microsites]);

  const totalLinks = microsites.reduce((n, m) => n + (m.links?.length || 0), 0);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {
      /* clipboard tak tersedia */
    }
  };

  const shareMicrosite = async (m: MicrositeEntity) => {
    const mSlug = (m.slug || m.id || '').trim();
    const url = `${window.location.origin}/m/${mSlug}`;
    const title = (m as any).name || (m as any).title || 'Microsite';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* dibatalkan → fallback salin */
      }
    }
    copy(url, `m-${mSlug}`);
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-muted-foreground)]">Memuat dashboard…</span>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !owner) {
    return (
      <PublicLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 px-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
            <Compass className="h-8 w-8" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
              Dashboard tidak ditemukan
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Link ini tidak aktif atau belum dibagikan oleh pengelolanya.
            </p>
          </div>
          <a
            href="/microsites"
            className="inline-flex items-center gap-2 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-strong)] active:scale-[0.97]"
          >
            <LayoutGrid className="h-4 w-4" />
            Lihat Direktori Microsite
          </a>
        </div>
      </PublicLayout>
    );
  }

  const displayName = owner.orgName || owner.name || 'Pengelola';
  const initials = displayName.slice(0, 1).toUpperCase();
  const accentHex = ACCENT_COLORS[cfg.accent] || ACCENT_COLORS.emerald;
  const gridCls = cfg.columns === 2 ? 'md:grid-cols-2' : cfg.columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3';
  const isDark = cfg.theme === 'slate';

  return (
    <PublicLayout>
      <div
        data-share-theme={cfg.theme}
        style={{ ['--share-accent' as any]: accentHex }}
        className={isDark ? 'bg-slate-900 text-slate-100' : ''}
      >
        {/* ── HERO PROFIL ─────────────────────────────────────────────── */}
        <section className={`relative overflow-hidden border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-[var(--color-border)] bg-[var(--color-card)]'}`}>
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="aurora-blob absolute -left-24 -top-32 h-80 w-80 rounded-full blur-3xl" style={{ background: `${accentHex}2e` }} />
            <div className="aurora-blob absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: `${accentHex}2e` }} />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              {cfg.showAvatar && (owner.avatarUrl ? (
                <img
                  src={owner.avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 shrink-0 rounded-[var(--radius-lg)] object-cover shadow-[var(--shadow-md)] sm:h-24 sm:w-24"
                />
              ) : (
                <span
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-[var(--radius-lg)] font-display text-3xl font-extrabold text-white shadow-[var(--shadow-md)] sm:h-24 sm:w-24"
                  style={{ background: accentHex }}
                >
                  {initials}
                </span>
              ))}
              <div className="min-w-0 flex-1">
                {cfg.showBadge && cfg.badgeLabel && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'}`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {cfg.badgeLabel}
                  </span>
                )}
                <h1 className={`mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-[var(--color-text)]'} sm:text-4xl`}>
                  {share?.title || displayName}
                </h1>
                {owner.orgName && share?.title && (
                  <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[var(--color-muted-foreground)]'}`}>{owner.orgName}</p>
                )}
                {cfg.showTagline && (
                  <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[var(--color-muted-foreground)]'}`}>
                    {share?.tagline || owner.bio || 'Kumpulan microsite publik dalam satu dashboard yang dapat dibagikan.'}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  {cfg.showStats && (
                    <>
                      <Badge variant="emerald" size="sm">
                        <Globe className="mr-1 h-3.5 w-3.5" />
                        {microsites.length} microsite
                      </Badge>
                      <Badge variant="zinc" size="sm">
                        <Link2 className="mr-1 h-3.5 w-3.5" />
                        {totalLinks} tautan
                      </Badge>
                    </>
                  )}
                  {cfg.showShareButton && (
                    <Button variant="outline" size="sm" onClick={() => copy(`${window.location.origin}/share/${slug}`, 'dash')}>
                      {copiedKey === 'dash' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedKey === 'dash' ? 'Tersalin' : 'Bagikan dashboard'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── DAFTAR MICROSITE PER KATEGORI ───────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
          {microsites.length === 0 ? (
            <div className="studio-card flex flex-col items-center gap-4 p-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
                <Construction className="h-7 w-7" />
              </span>
              <div>
                <h2 className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[var(--color-text)]'}`}>
                  Belum ada microsite publik
                </h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-[var(--color-muted-foreground)]'}`}>
                  {cfg.emptyText}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.name}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)]" style={{ background: `${accentHex}1f`, color: accentHex }}>
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <h2 className={`font-display text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[var(--color-text)]'}`}>
                      {group.name}
                    </h2>
                    <span className={`studio-num text-xs ${isDark ? 'text-slate-400' : 'text-[var(--color-muted-foreground)]'}`}>
                      {group.items.length} microsite
                    </span>
                  </div>
                  <div className={`grid grid-cols-1 gap-5 ${gridCls}`}>
                    {group.items.map((m) => {
                      const mSlug = (m.slug || m.id || '').trim();
                      const title = (m as any).name || (m as any).title || 'Microsite';
                      const desc = (m as any).description || '';
                      const linkCount = m.links?.length || 0;
                      return (
                        <article
                          key={m.id || mSlug}
                          className={`studio-card studio-card-interactive flex flex-col gap-3 p-5 ${isDark ? '!bg-slate-800 !border-slate-700' : ''}`}
                        >
                          <h3 className={`font-display text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-[var(--color-text)]'}`}>
                            {title}
                          </h3>
                          {desc && (
                            <p className={`line-clamp-2 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[var(--color-muted-foreground)]'}`}>
                              {desc}
                            </p>
                          )}
                          <div className={`mt-auto flex items-center justify-between gap-2 border-t pt-3 ${isDark ? 'border-slate-700' : 'border-[var(--color-border)]'}`}>
                            <span className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-[var(--color-muted-foreground)]'}`}>
                              <Link2 className="h-3.5 w-3.5" />
                              {linkCount} tautan
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => shareMicrosite(m)} title="Bagikan microsite ini">
                                {copiedKey === `m-${mSlug}` ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                              </Button>
                              <a
                                href={`/m/${mSlug}`}
                                className="inline-flex items-center gap-1.5 rounded-[var(--button-radius)] px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                                style={{ background: accentHex }}
                              >
                                Kunjungi
                                <ArrowRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
