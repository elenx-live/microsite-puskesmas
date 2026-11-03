import React, { useState, useEffect, useMemo } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { micrositeService } from '../../services/micrositeService';
import { MicrositeEntity, MicrositeCategory } from '../../types';
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Search,
  Link2,
  LayoutGrid,
  Sparkles,
  FolderOpen,
  X,
} from 'lucide-react';

const catKey = (c?: string | null) => (c || 'Umum').trim().toLowerCase();
const isGeneral = (c?: string | null) => catKey(c) === 'umum';

/**
 * Halaman direktori microsite v2 — "Aurora Klinis".
 * Hero bernuansa aurora dengan statistik hidup, pencarian instan,
 * kartu kategori informatif (pratinjau tautan nyata), tata letak cards
 * yang seragam. Semua warna lewat token tema.
 */
export default function MicrositeCategoriesPage() {
  const [microsites, setMicrosites] = useState<MicrositeEntity[]>([]);
  const [categories, setCategories] = useState<MicrositeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, cList] = await Promise.all([
        micrositeService.getPublishedAndActiveMicrosites(),
        micrositeService.getCategories(),
      ]);
      setMicrosites(mList);
      setCategories(cList);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const inCategory = (m: MicrositeEntity, name: string) =>
    catKey(m.category) === catKey(name) || (isGeneral(name) && !m.category);

  const metrics = useMemo(() => {
    const links = microsites.reduce((n, m) => n + (m.links?.length || 0), 0);
    return { categories: categories.length, microsites: microsites.length, links };
  }, [categories, microsites]);

  const matchesQuery = (m: MicrositeEntity, q: string) => {
    if (!q) return true;
    const hay = [m.name, m.description, m.category, ...(m.links || []).map((l) => l.label || l.url)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  };

  const selectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setQuery('');
    const url = new URL(window.location.href);
    url.searchParams.set('category', catName);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToCategories = () => {
    setSelectedCategory(null);
    setQuery('');
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.pushState({}, '', url.toString());
  };

  const q = query.trim().toLowerCase();
  const filtered = selectedCategory
    ? microsites.filter((m) => inCategory(m, selectedCategory)).filter((m) => matchesQuery(m, q))
    : microsites.filter((m) => matchesQuery(m, q));

  return (
    <PublicLayout activeNav="microsite">
      {/* ── HERO AURORA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-blob absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[var(--color-primary)]/18 blur-3xl" />
          <div className="aurora-blob absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--color-accent)]/18 blur-3xl" />
          <div className="aurora-blob absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[var(--color-info)]/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="emerald" className="mb-4">
                <Sparkles className="h-3 w-3" />
                Direktori Microsite
              </Badge>
              <h1 className="font-display text-[32px] font-extrabold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-[44px]">
                {selectedCategory ? (
                  selectedCategory
                ) : (
                  <>
                    Satu tempat untuk seluruh{' '}
                    <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                      microsite unit
                    </span>{' '}
                    &amp; program
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
                {selectedCategory
                  ? `Daftar microsite pada kategori ${selectedCategory} — lengkap dengan pratinjau tautannya.`
                  : 'Setiap unit Puskesmas Manding punya halaman sendiri: tautan penting, layanan, dan informasi publik dalam satu tempat.'}
              </p>

              {/* Pencarian instan */}
              {!selectedCategory && (
                <div className="relative mt-6 max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari microsite, layanan, atau tautan…"
                    className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] py-3 pl-10 pr-10 text-sm text-[var(--color-text)] shadow-[var(--shadow-sm)] transition-all placeholder:text-[var(--color-muted-foreground)]/70 hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
                    aria-label="Cari microsite"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      aria-label="Bersihkan pencarian"
                      className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {selectedCategory && (
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={backToCategories}>
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Kategori
                  </Button>
                </div>
              )}
            </div>

            {!loading && (
              <dl className="grid shrink-0 grid-cols-3 gap-3 sm:gap-4">
                {[
                  { v: metrics.categories, l: 'Kategori', tone: 'primary' as const },
                  { v: metrics.microsites, l: 'Microsite', tone: 'plain' as const },
                  { v: metrics.links, l: 'Tautan', tone: 'plain' as const },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)]/80 px-4 py-3 text-center shadow-[var(--shadow-xs)] backdrop-blur-sm"
                  >
                    <dd
                      className={
                        'studio-num font-display text-2xl font-extrabold ' +
                        (s.tone === 'primary'
                          ? 'text-[var(--color-primary)]'
                          : 'text-[var(--color-text)]')
                      }
                    >
                      {s.v}
                    </dd>
                    <dt className="mt-0.5 text-[11px] font-medium text-[var(--color-muted-foreground)]">
                      {s.l}
                    </dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* ── KONTEN ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="studio-card animate-pulse p-6">
                <div className="h-3 w-24 rounded bg-[var(--color-muted)]" />
                <div className="mt-4 h-6 w-2/3 rounded bg-[var(--color-muted)]" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-[var(--color-muted)]" />
                  <div className="h-6 w-20 rounded-full bg-[var(--color-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : !selectedCategory ? (
          /* ── 1. GRID KATEGORI ─────────────────────────────────────── */
          categories.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6" />}
              title="Belum ada kategori microsite"
              body="Administrator dapat membuat kategori melalui Dashboard Studio. Setelah dibuat, kategori akan tampil di sini."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {categories.map((cat, idx) => {
                const items = microsites.filter((m) => inCategory(m, cat.name));
                const links = items.reduce((n, m) => n + (m.links?.length || 0), 0);
                const preview = items
                  .flatMap((m) => (m.links || []).map((l) => l.label || l.url))
                  .filter(Boolean)
                  .slice(0, 3);

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => selectCategory(cat.name)}
                    style={{ animationDelay: `${Math.min(idx, 6) * 45}ms` }}
                    className={
                      'studio-card studio-card-interactive studio-rise group flex cursor-pointer flex-col gap-4 p-6 text-left' +
                      (idx === categories.length - 1 && categories.length % 2 === 1
                        ? ' md:col-span-2'
                        : '')
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted-foreground)]">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Kategori
                      </span>
                      <span className="studio-num text-xs text-[var(--color-muted-foreground)]">
                        <b className="text-[var(--color-primary)]">{items.length}</b> microsite
                        {links > 0 && <> · {links} tautan</>}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-105"
                      >
                        <Globe className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold leading-tight text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {preview.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {preview.map((label, i) => (
                          <span
                            key={i}
                            className="max-w-full truncate rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-xs leading-none text-[var(--color-secondary-foreground)]"
                          >
                            {label}
                          </span>
                        ))}
                        {links > preview.length && (
                          <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-foreground)]">
                            +{links - preview.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[var(--color-muted-foreground)]">
                        Belum ada tautan di kategori ini.
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3.5 text-sm font-semibold text-[var(--color-primary)]">
                      <span>Lihat daftar</span>
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-secondary)] transition-transform duration-200 group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : /* ── 2. DAFTAR MICROSITE DALAM KATEGORI ───────────────────── */
        filtered.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-6 w-6" />}
            title={
              q ? 'Tidak ada microsite yang cocok' : 'Belum ada microsite dalam kategori ini'
            }
            body={
              q
                ? `Tidak ada hasil untuk “${query}” pada kategori ${selectedCategory}.`
                : `Administrator dapat menambahkan atau menetapkan microsite ke kategori "${selectedCategory}" melalui Dashboard Studio.`
            }
            action={
              q ? (
                <Button onClick={() => setQuery('')} variant="outline" size="sm">
                  Bersihkan pencarian
                </Button>
              ) : (
                <Button onClick={backToCategories} variant="outline" size="sm">
                  Pilih Kategori Lain
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m, idx) => {
              const links = m.links || [];
              const thumb = m.ogImageUrl || m.bannerImageUrl || m.profileImageUrl || m.logoUrl;
              const preview = links
                .map((l) => l.label || l.url)
                .filter(Boolean)
                .slice(0, 3);
              return (
                <article
                  key={m.id}
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                  className="studio-card studio-card-interactive studio-rise flex flex-col gap-4 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                      >
                        <Globe className="h-5 w-5" />
                      </span>
                    )}
                    {m.passwordProtected && (
                      <Badge variant="amber">
                        <Lock className="h-3 w-3" />
                        Terproteksi
                      </Badge>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold leading-tight text-[var(--color-text)]">
                      {m.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                      {m.description || 'Portal informasi, tautan penting, dan layanan khusus.'}
                    </p>
                  </div>

                  {preview.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preview.map((label, i) => (
                        <span
                          key={i}
                          className="max-w-full truncate rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-xs leading-none text-[var(--color-secondary-foreground)]"
                        >
                          {label}
                        </span>
                      ))}
                      {links.length > preview.length && (
                        <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-foreground)]">
                          +{links.length - preview.length}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                      <Link2 className="h-3.5 w-3.5" />
                      <span className="studio-num">{links.length} tautan</span>
                      {m.passwordProtected && (
                        <span className="ml-1 inline-flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" /> privat
                        </span>
                      )}
                    </span>
                    <a
                      href={`/m/${m.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-3.5 py-2 text-xs font-bold text-[var(--color-primary-foreground)] shadow-[var(--shadow-xs)] transition-all hover:bg-[var(--color-primary-strong)] hover:shadow-[var(--shadow-sm)] active:scale-[0.97]"
                    >
                      <span>Kunjungi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}> = ({ icon, title, body, action }) => (
  <div className="studio-card studio-rise mx-auto max-w-lg p-10 text-center">
    <div
      aria-hidden
      className="mx-auto grid h-14 w-14 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
    >
      {icon}
    </div>
    <h4 className="mt-4 font-display text-base font-bold text-[var(--color-text)]">{title}</h4>
    <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
      {body}
    </p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
