import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MoreVertical, Pencil, Eye, ExternalLink, Copy, Share2, Check,
  Files, Trash2, Settings2, Globe2, FileText, LayoutGrid, X, Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { DASHBOARD_THEMES } from '../config/dashboardThemes';
import { normalizeShareConfig } from '../config/shareConfig';

export interface DashboardSummary {
  id: string;
  name: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  enabled: boolean;
  hasDraft: boolean;
  url: string;
  thumb: string;
  theme?: string;
  updatedAt: string;
  createdAt: string;
}

const CATEGORIES = ['Personal', 'Organisasi', 'Pelayanan', 'Kegiatan', 'Informasi', 'Bisnis', 'Portofolio', 'Lainnya'];

function fmtDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/* ── Kartu mini preview (representatif, tanpa render penuh) ─────────────── */
function ThemeSwatch({ themeId, className = '' }: { themeId: string; className?: string }) {
  const t = DASHBOARD_THEMES.find((x) => x.id === themeId) || DASHBOARD_THEMES[0];
  const bg = t?.background?.type === 'gradient' && t.background.from
    ? `linear-gradient(135deg, ${t.background.from}, ${t.background.to || t.background.from})`
    : (t?.vars?.bg || '#f1f5f9');
  const primary = t?.vars?.primary || '#0e8a63';
  const accent = t?.vars?.accent || '#0ea5e9';
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: bg }}>
      <div className="absolute inset-0 flex flex-col gap-2 p-3">
        <div className="h-2.5 w-16 rounded-full" style={{ background: primary }} />
        <div className="h-1.5 w-24 rounded-full opacity-60" style={{ background: accent }} />
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 rounded-md bg-white/70 shadow-sm" style={{ borderTop: `2px solid ${i % 2 ? accent : primary}` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props { showToast?: (m: string, k?: 'success' | 'error' | 'info') => void; }

export default function DashboardsManager({ showToast }: Props) {
  const navigate = useNavigate();
  const { showToast: toastCtx } = useToast();
  const notify = showToast || ((m: string, k?: any) => toastCtx?.(m, k === 'error' ? 'error' : 'info'));

  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Modal buat dashboard
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/me/dashboards', { credentials: 'include' });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'gagal');
      setDashboards(Array.isArray(d.dashboards) ? d.dashboards : []);
    } catch (e: any) {
      notify(e?.message || 'Gagal memuat daftar dashboard.', 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tutup menu saat klik di luar.
  useEffect(() => {
    const onDoc = () => setMenuFor(null);
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dashboards.filter((d) => {
      if (filter === 'published' && !d.enabled) return false;
      if (filter === 'draft' && d.enabled) return false;
      if (!q) return true;
      return (d.name + ' ' + d.slug + ' ' + d.title + ' ' + d.category).toLowerCase().includes(q);
    });
  }, [dashboards, query, filter]);

  const counts = useMemo(() => ({
    all: dashboards.length,
    published: dashboards.filter((d) => d.enabled).length,
    draft: dashboards.filter((d) => !d.enabled).length,
  }), [dashboards]);

  const fullUrl = (d: DashboardSummary) => d.url ? `${window.location.origin}${d.url}` : '';

  const doCopy = async (d: DashboardSummary) => {
    const u = fullUrl(d);
    if (!u) { notify('Dashboard belum dipublikasikan.', 'info'); return; }
    try {
      await navigator.clipboard.writeText(u);
      setCopied(d.id); setTimeout(() => setCopied(null), 1600);
      notify('URL tersalin.', 'success');
    } catch { notify('Tidak bisa menyalin URL.', 'error'); }
  };

  const doShare = async (d: DashboardSummary) => {
    const u = fullUrl(d);
    if (!u) { notify('Publikasikan dulu untuk membagikan.', 'info'); return; }
    if (navigator.share) {
      try { await navigator.share({ title: d.title || d.name, url: u }); return; } catch {}
    }
    doCopy(d);
  };

  const doDuplicate = async (d: DashboardSummary) => {
    setBusy(d.id);
    try {
      const baseSlug = `${d.slug || slugify(d.name)}-salinan`.slice(0, 60).replace(/-+$/g, '');
      const r = await fetch(`/api/me/dashboards/${d.id}/duplicate`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${d.name} (Salinan)`, slug: baseSlug }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'gagal');
      notify('Dashboard diduplikasi (status Draft).', 'success');
      await load();
    } catch (e: any) { notify(e?.message || 'Gagal menduplikasi.', 'error'); }
    finally { setBusy(null); setMenuFor(null); }
  };

  const doRename = async (d: DashboardSummary) => {
    setMenuFor(null);
    const name = window.prompt('Nama baru untuk dashboard ini:', d.name);
    if (name === null) return;
    setBusy(d.id);
    try {
      const r = await fetch(`/api/me/dashboards/${d.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || d.name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'gagal');
      notify('Nama diperbarui.', 'success');
      await load();
    } catch (e: any) { notify(e?.message || 'Gagal ganti nama.', 'error'); }
    finally { setBusy(null); }
  };

  const doTogglePublish = async (d: DashboardSummary) => {
    setMenuFor(null);
    if (!d.enabled && !d.slug) { notify('Isi slug dulu di editor sebelum menerbitkan.', 'info'); navigate(`/studio/share/editor/${d.id}`); return; }
    setBusy(d.id);
    try {
      const r = await fetch(`/api/me/dashboards/${d.id}/${d.enabled ? 'unpublish' : 'publish'}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'gagal');
      notify(d.enabled ? 'Dashboard dinonaktifkan (Draft).' : 'Dashboard diterbitkan.', 'success');
      await load();
    } catch (e: any) { notify(e?.message || 'Gagal mengubah status.', 'error'); }
    finally { setBusy(null); }
  };

  const doDelete = async (d: DashboardSummary) => {
    setMenuFor(null);
    const ok = window.confirm(`Hapus dashboard "${d.name}"? Tindakan ini permanen dan tidak dapat dibatalkan.`);
    if (!ok) return;
    if (dashboards.length <= 1) { notify('Minimal harus ada satu dashboard. Buat dashboard lain dulu sebelum menghapus ini.', 'info'); return; }
    setBusy(d.id);
    try {
      const r = await fetch(`/api/me/dashboards/${d.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || 'gagal');
      notify('Dashboard dihapus.', 'success');
      await load();
    } catch (e: any) { notify(e?.message || 'Gagal menghapus.', 'error'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Dashboard Publik</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Kelola koleksi halaman publik Anda. Setiap dashboard punya konten, desain, dan URL sendiri.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Dashboard Baru
        </Button>
      </div>

      {/* Toolbar: cari + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari dashboard (nama, slug, kategori)…"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-1">
          {([['all', `Semua (${counts.all})`], ['published', `Terbit (${counts.published})`], ['draft', `Draft (${counts.draft})`]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as any)}
              className={[
                'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all',
                filter === k ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'hover:bg-[var(--color-muted)]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-[var(--color-muted-foreground)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          Memuat dashboard…
        </div>
      ) : filtered.length === 0 ? (
        <div className="studio-card flex flex-col items-center gap-3 py-14 text-center">
          <LayoutGrid className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {dashboards.length === 0 ? 'Belum ada dashboard. Mulai dengan membuat yang pertama.' : 'Tidak ada dashboard yang cocok dengan pencarian.'}
          </p>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Buat Dashboard Baru</Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <div key={d.id} className="studio-card group relative flex flex-col overflow-hidden">
              {/* Thumbnail */}
              <button onClick={() => navigate(`/studio/share/editor/${d.id}`)} className="relative block text-left">
                <ThemeSwatch themeId={d.thumb || d.theme || ''} className="h-36 w-full" />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-2.5">
                  <span className={[
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm',
                    d.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-700/80 text-white',
                  ].join(' ')}>
                    {d.enabled ? <Globe2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {d.enabled ? 'Terbit' : 'Draft'}
                  </span>
                  {d.hasDraft && !d.enabled && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950 shadow-sm">Draft baru</span>
                  )}
                </div>
              </button>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-bold" title={d.name}>{d.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
                      {d.tagline || d.title || 'Tanpa deskripsi.'}
                    </p>
                  </div>
                  {/* Menu aksi */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === d.id ? null : d.id); }}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                      title="Menu tindakan"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuFor === d.id && (
                      <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-sm shadow-xl">
                        {[
                          { icon: <Pencil className="h-4 w-4" />, label: 'Edit Dashboard', on: () => navigate(`/studio/share/editor/${d.id}`) },
                          { icon: <Eye className="h-4 w-4" />, label: 'Preview', on: () => d.url ? window.open(fullUrl(d), '_blank') : notify('Publikasikan dulu untuk preview.', 'info') },
                          { icon: <ExternalLink className="h-4 w-4" />, label: 'Buka Halaman Publik', on: () => d.url ? window.open(fullUrl(d), '_blank') : notify('Belum dipublikasikan.', 'info') },
                          { icon: copied === d.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />, label: 'Salin URL', on: () => doCopy(d) },
                          { icon: <Share2 className="h-4 w-4" />, label: 'Bagikan', on: () => doShare(d) },
                          { icon: <Files className="h-4 w-4" />, label: 'Duplikasi Dashboard', on: () => doDuplicate(d) },
                          { icon: <Settings2 className="h-4 w-4" />, label: 'Ganti Nama', on: () => doRename(d) },
                          { icon: <Globe2 className="h-4 w-4" />, label: d.enabled ? 'Jadikan Draft' : 'Terbitkan', on: () => doTogglePublish(d) },
                          { icon: <Trash2 className="h-4 w-4" />, label: 'Hapus Dashboard', on: () => doDelete(d), danger: true },
                        ].map((item: any) => (
                          <button
                            key={item.label}
                            onClick={(e) => { e.stopPropagation(); setMenuFor(null); item.on(); }}
                            className={[
                              'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--color-muted)]',
                              item.danger ? 'text-[var(--color-danger)]' : '',
                            ].join(' ')}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* URL / kategori */}
                <div className="mt-auto space-y-1.5">
                  {d.url ? (
                    <div className="flex items-center gap-1.5">
                      <code className="min-w-0 flex-1 truncate rounded bg-[var(--color-muted)] px-2 py-1 font-mono text-[11px] text-[var(--color-muted-foreground)]">/share/{d.slug}</code>
                      <button onClick={() => doCopy(d)} className="grid h-7 w-7 place-items-center rounded border border-[var(--color-border)] hover:bg-[var(--color-muted)]" title="Salin URL">
                        {copied === d.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="inline-block rounded bg-[var(--color-muted)] px-2 py-1 text-[11px] text-[var(--color-muted-foreground)]">Belum ada URL — atur slug di editor.</span>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-muted-foreground)]">
                    <span>{d.category || 'Tanpa kategori'}</span>
                    <span title={fmtDate(d.updatedAt)}>Diperbarui {fmtDate(d.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => navigate(`/studio/share/editor/${d.id}`)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-[var(--button-radius)] border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold transition-all hover:bg-[var(--color-muted)]">
                        <ExternalLink className="h-3.5 w-3.5" /> Lihat
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {busy === d.id && <div className="absolute inset-0 grid place-items-center bg-black/10"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /></div>}
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateDashboardModal
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => { setCreateOpen(false); navigate(`/studio/share/editor/${id}`); }}
          notify={notify}
          existing={dashboards}
        />
      )}
    </div>
  );
}

/* ── Modal Buat Dashboard Baru ─────────────────────────────────────────── */
function CreateDashboardModal({
  onClose, onCreated, notify, existing,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  notify: (m: string, k?: 'success' | 'error' | 'info') => void;
  existing: DashboardSummary[];
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState('Personal');
  const [tagline, setTagline] = useState('');
  const [themeId, setThemeId] = useState(DASHBOARD_THEMES[0]?.id || 'minimalist');
  const [startFrom, setStartFrom] = useState<'theme' | 'blank' | 'duplicate'>('theme');
  const [dupId, setDupId] = useState(existing[0]?.id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const submit = async () => {
    const nm = name.trim() || 'Dashboard Baru';
    const sk = slug.trim().toLowerCase();
    if (sk && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(sk)) {
      notify('Slug tidak valid: 3–60 karakter, huruf kecil/angka/tanda hubung.', 'error'); return;
    }
    setSaving(true);
    try {
      if (startFrom === 'duplicate' && dupId) {
        const r = await fetch(`/api/me/dashboards/${dupId}/duplicate`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nm, slug: sk || undefined }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || 'gagal');
        notify('Dashboard dari duplikasi dibuat.', 'success');
        onCreated(data.dashboard.id);
        return;
      }
      const t = DASHBOARD_THEMES.find((x) => x.id === themeId) || DASHBOARD_THEMES[0];
      const config = startFrom === 'blank'
        ? normalizeShareConfig({ theme: t?.id, colors: { primary: t?.vars?.primary, accent: t?.vars?.accent } })
        : normalizeShareConfig({ theme: t?.id });
      const r = await fetch('/api/me/dashboards', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nm, slug: sk || undefined, title: nm, tagline: tagline.trim() || undefined, category, config }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'gagal');
      notify('Dashboard dibuat. Selamat mendesain! 🎨', 'success');
      onCreated(data.dashboard.id);
    } catch (e: any) {
      notify(e?.message || 'Gagal membuat dashboard.', 'error');
    } finally { setSaving(false); }
  };

  const previewTheme = DASHBOARD_THEMES.find((x) => x.id === themeId) || DASHBOARD_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">Buat Dashboard Baru</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">Isi yang perlu saja — detail lain bisa dilengkapi nanti di editor.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--color-muted)]"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-5 p-5">
          {/* Titik awal */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-[var(--color-muted-foreground)]">Mulai dari</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {([['theme', 'Template Tema', Sparkles], ['blank', 'Dashboard Kosong', LayoutGrid], ['duplicate', 'Duplikasi Dashboard', Files]] as const).map(([k, label, Icon]) => (
                <button key={k} onClick={() => setStartFrom(k as any)}
                  className={[
                    'flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm font-semibold transition-all',
                    startFrom === k ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                  ].join(' ')}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {startFrom === 'duplicate' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Pilih dashboard yang diduplikasi</span>
              <select value={dupId} onChange={(e) => setDupId(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                {existing.map((d) => <option key={d.id} value={d.id}>{d.name}{d.slug ? ` (/${d.slug})` : ''}</option>)}
              </select>
            </label>
          ) : (
            <div>
              <span className="mb-2 block text-xs font-semibold text-[var(--color-muted-foreground)]">
                {startFrom === 'blank' ? 'Warna awal (opsional)' : 'Pilih tema awal'}
              </span>
              <div className="grid max-h-56 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                {DASHBOARD_THEMES.map((t) => (
                  <button key={t.id} onClick={() => setThemeId(t.id)}
                    className={[
                      'overflow-hidden rounded-[var(--radius-sm)] border text-left transition-all',
                      themeId === t.id ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                    ].join(' ')}>
                    <ThemeSwatch themeId={t.id} className="h-16 w-full" />
                    <div className="px-2 py-1.5">
                      <div className="truncate text-[11px] font-bold">{t.name}</div>
                      <div className="truncate text-[10px] text-[var(--color-muted-foreground)]">{t.category || 'Tema'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nama dashboard" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Dashboard Personal" autoFocus />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)]">Kategori</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div>
            <Input label="Slug URL (boleh dikosongkan dulu)" value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
              placeholder="mis. personal" />
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
              URL: <span className="break-all font-mono">{window.location.origin}/share/{slug || '…'}</span>
            </p>
          </div>

          <Input label="Deskripsi singkat (opsional)" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="mis. Portal layanan & program pribadi." />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <span className="hidden items-center gap-2 text-xs text-[var(--color-muted-foreground)] sm:flex">
            <ThemeSwatch themeId={startFrom === 'duplicate' ? '' : previewTheme.id} className="h-8 w-12 rounded border border-[var(--color-border)]" />
            {startFrom === 'duplicate' ? 'Menyalin konfigurasi dashboard' : `Tema: ${previewTheme.name}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={submit} isLoading={saving}><Plus className="h-4 w-4" /> Buat & Buka Editor</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
