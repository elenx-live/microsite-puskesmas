import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShareConfig, MicrositeEntity, ShareSectionType } from '../types';
import { FONT_PAIRINGS, getTheme, SHARE_LIMITS } from '../config/dashboardThemes';
import { normalizeShareConfig } from '../config/shareConfig';
import ShareDashboardPage from '../pages/public/ShareDashboardPage';
import {
  TemplatePanel, IdentityPanel, BackgroundPanel, TypographyPanel,
  ColorsPanel, LayoutPanel, CardPanel, SectionsPanel, SECTION_LABEL,
} from './ShareEditor.panels';
import {
  Palette, LayoutDashboard, Type as TypeIcon, Image as ImageIcon, Layers,
  Undo2, Redo2, Save, Eye, Rocket, Monitor, Tablet, Smartphone, X,
  History, Pencil, Sparkles, ListTree, Loader2, ExternalLink,
} from 'lucide-react';

interface PreviewOwner { name: string; orgName: string | null; bio: string | null; avatarUrl: string | null; phone: string | null; }
interface ShareEditorProps {
  onExit: () => void;
  user: { name?: string; email?: string; orgName?: string | null; avatarUrl?: string | null; role?: string } | null;
  onNotify?: (msg: string, kind?: 'success' | 'error') => void;
  /** ID dashboard yang diedit. Bila kosong → mode dashboard utama (kompatibel lama). */
  dashboardId?: string;
  /** Nama dashboard (judul di topbar). */
  dashboardName?: string;
}

type Panel = 'template' | 'identity' | 'background' | 'typography' | 'colors' | 'layout' | 'card' | 'sections';
type Device = 'desktop' | 'tablet' | 'mobile';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const uid = () => 's-' + Math.random().toString(36).slice(2, 8);

const PANELS: { key: Panel; label: string; icon: React.ReactNode }[] = [
  { key: 'template', label: 'Tema', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'identity', label: 'Identitas', icon: <Pencil className="h-4 w-4" /> },
  { key: 'background', label: 'Latar', icon: <ImageIcon className="h-4 w-4" /> },
  { key: 'typography', label: 'Tipografi', icon: <TypeIcon className="h-4 w-4" /> },
  { key: 'colors', label: 'Warna', icon: <Palette className="h-4 w-4" /> },
  { key: 'layout', label: 'Layout', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'card', label: 'Kartu', icon: <Layers className="h-4 w-4" /> },
  { key: 'sections', label: 'Section', icon: <ListTree className="h-4 w-4" /> },
];

export default function ShareEditor({ onExit, user, onNotify, dashboardId, dashboardName }: ShareEditorProps) {
  // Basis URL API: multi (per-id) atau tunggal (dashboard utama).
  const apiBase = dashboardId ? `/api/me/dashboards/${dashboardId}` : '/api/me/share';
  const [name, setName] = useState(dashboardName || 'Dashboard');
  // ── data server ──
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [publishedConfig, setPublishedConfig] = useState<ShareConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [history, setHistory] = useState<{ at: string; label: string }[]>([]);
  const [published, setPublished] = useState<{ id: string; slug: string; name: string; category: string }[]>([]);
  const [owner, setOwner] = useState<PreviewOwner | null>(null);
  const [microsites, setMicrosites] = useState<MicrositeEntity[]>([]);

  // ── state editor ──
  const [cfg, setCfg] = useState<ShareConfig>(() => normalizeShareConfig(null));
  const [panel, setPanel] = useState<Panel>('template');
  const [device, setDevice] = useState<Device>('desktop');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [reloadPreview, setReloadPreview] = useState(0);

  // undo/redo
  const past = useRef<ShareConfig[]>([]);
  const future = useRef<ShareConfig[]>([]);
  const [, force] = useState(0);

  const notify = useCallback((m: string, k: 'success' | 'error' = 'success') => onNotify?.(m, k), [onNotify]);

  /** Ubah config + catat ke tumpukan undo. */
  const update = useCallback((fn: (draft: ShareConfig) => void, opts?: { silent?: boolean }) => {
    setCfg((prev) => {
      const next = clone(prev);
      fn(next);
      if (!opts?.silent) {
        past.current = [...past.current.slice(-49), clone(prev)];
        future.current = [];
      }
      return next;
    });
    setDirty(true);
    if (!opts?.silent) force((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current.pop()!;
    setCfg((cur) => { future.current = [clone(cur), ...future.current].slice(0, 50); return prev; });
    setDirty(true); force((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current.shift()!;
    setCfg((cur) => { past.current = [...past.current, clone(cur)]; return next; });
    setDirty(true); force((n) => n + 1);
  }, []);

  /* ── muat data ── */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const detailUrl = dashboardId ? `/api/me/dashboards/${dashboardId}` : '/api/me/share';
    Promise.all([
      fetch(detailUrl, { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/me/share/microsites', { credentials: 'include' }).then((r) => r.json()).catch(() => ({ microsites: [] })),
      fetch('/api/me/profile', { credentials: 'include' }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, ms, prof]) => {
      if (!alive) return;
      // Bentuk data: multi → { dashboard }, tunggal → { share }
      const share = s?.dashboard || s?.share || {};
      setName(share.name || dashboardName || 'Dashboard');
      setSlug(share.slug || '');
      setTitle(share.title || '');
      setTagline(share.tagline || '');
      setEnabled(!!share.enabled);
      setHistory(Array.isArray(share.history) ? share.history : []);
      setPublishedConfig(share.enabled ? normalizeShareConfig(share.config) : null);
      setHasDraft(!!share.hasDraft);
      const start = share.hasDraft && share.draft ? normalizeShareConfig(share.draft) : normalizeShareConfig(share.config);
      setCfg(start);
      past.current = []; future.current = [];
      setPublished(Array.isArray(ms?.microsites) ? ms.microsites : []);
      const p = prof?.profile || prof?.user || prof || {};
      setOwner({
        name: p.name || user?.name || '',
        orgName: p.orgName || p.org_name || user?.orgName || null,
        bio: p.bio || null,
        avatarUrl: p.avatarUrl || p.avatar_url || user?.avatarUrl || null,
        phone: p.phone || null,
      });
      setLoading(false);
    }).catch(() => { if (alive) { setLoading(false); notify('Gagal memuat data dashboard.', 'error'); } });
    return () => { alive = false; };
  }, [user?.name, user?.orgName, user?.avatarUrl, notify, dashboardId, dashboardName]);

  /* ── microsite lengkap untuk preview ── */
  const previewMicrosites = useMemo<MicrositeEntity[]>(() => {
    const list = published.map((m) => ({
      id: m.id, slug: m.slug, name: m.name, category: m.category || '', description: '',
      status: 'published' as const, active: true, passwordProtected: false, links: [],
    })) as unknown as MicrositeEntity[];
    if (cfg.micrositeMode === 'selected') {
      const order = new Map(cfg.micrositeIds.map((id, i) => [id, i] as [string, number]));
      const ord = (m: { id: string; slug: string }) => order.get(m.id) ?? order.get(m.slug) ?? 999;
      return list.filter((m) => order.has(m.id) || order.has(m.slug)).sort((a, b) => ord(a) - ord(b));
    }
    return list;
  }, [published, cfg.micrositeMode, cfg.micrositeIds]);

  /* ── autosave draft (debounce) ── */
  const saveDraft = useCallback(async (silent = true) => {
    setSaving(true);
    try {
      const r = await fetch(`${apiBase}/draft`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg, slug, title, tagline, name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'gagal');
      setSavedAt(d.savedAt || new Date().toISOString());
      setDirty(false); setHasDraft(true);
      if (!silent) notify('Draft tersimpan.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan draft.';
      if (!silent) notify(msg, 'error');
    } finally { setSaving(false); }
  }, [cfg, slug, title, tagline, name, notify, apiBase]);

  useEffect(() => {
    if (loading || !dirty) return;
    const t = setTimeout(() => { saveDraft(true); }, 1600);
    return () => clearTimeout(t);
  }, [dirty, cfg, slug, title, tagline, loading, saveDraft]);

  /* ── publish ── */
  const publish = useCallback(async () => {
    if (!slug || !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug.trim().toLowerCase())) {
      notify('Isi slug dashboard dulu (3–60 huruf kecil/angka/tanda hubung) sebelum menerbitkan.', 'error');
      setPanel('identity'); return;
    }
    setPublishing(true);
    try {
      const r = await fetch(`${apiBase}/publish`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg, slug: slug.trim().toLowerCase(), title, tagline, name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'gagal');
      const res = d.dashboard || d.share || {};
      setEnabled(true); setHasDraft(false); setDirty(false);
      setPublishedConfig(normalizeShareConfig(res.config));
      setHistory(Array.isArray(res.history) ? res.history : []);
      notify('Dashboard berhasil diterbitkan! 🎉', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal menerbitkan.';
      notify(msg, 'error');
    } finally { setPublishing(false); }
  }, [cfg, slug, title, tagline, name, notify, apiBase]);

  const unpublish = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase}/unpublish`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!r.ok) throw new Error('gagal');
      setEnabled(false); notify('Dashboard dinonaktifkan.', 'success');
    } catch { notify('Gagal menonaktifkan.', 'error'); }
  }, [notify, apiBase]);

  const discardDraft = useCallback(async () => {
    try {
      await fetch(`${apiBase}/discard-draft`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setCfg(publishedConfig ? clone(publishedConfig) : normalizeShareConfig(null));
      setHasDraft(false); setDirty(false); notify('Draft dibuang, kembali ke versi terbit.', 'success');
    } catch { notify('Gagal membuang draft.', 'error'); }
  }, [publishedConfig, notify, apiBase]);

  const restore = useCallback(async (index: number) => {
    try {
      const r = await fetch(`${apiBase}/restore`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'gagal');
      const res = d.dashboard || d.share || {};
      setCfg(normalizeShareConfig(res.config));
      setPublishedConfig(normalizeShareConfig(res.config));
      setHistory(Array.isArray(res.history) ? res.history : []);
      setShowHistory(false); setDirty(false);
      notify('Versi dipulihkan.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memulihkan.';
      notify(msg, 'error');
    }
  }, [notify, apiBase]);

  const applyTheme = useCallback((id: string) => {
    const t = getTheme(id);
    update((d) => {
      d.template = t.id;
      // Terapkan token tema sebagai titik awal — kustomisasi lanjutan tetap milik pengelola.
      d.background = {
        ...d.background,
        type: t.background.type,
        gradientFrom: t.background.from,
        gradientTo: t.background.to,
        pattern: t.background.pattern,
        color: '',
      };
      d.colors = {
        ...d.colors,
        primary: t.vars.primary,
        secondary: t.vars.accent,
        accent: t.vars.accent,
        button: t.vars.primary,
      };
      d.layout = { ...d.layout, cardSize: t.style.density === 'airy' ? 'large' : t.style.density === 'dense' ? 'compact' : 'normal' };
      d.card = { ...d.card, radius: t.style.radius, style: t.style.cardStyle };
      const fp = FONT_PAIRINGS.find((f) => f.display === t.fonts.display);
      if (fp) d.typography = { ...d.typography, fontPairing: fp.id };
    });
    setReloadPreview((n) => n + 1);
  }, [update]);

  const resetAll = useCallback(() => {
    update((d) => { Object.assign(d, normalizeShareConfig(null)); });
    setReloadPreview((n) => n + 1);
  }, [update]);

  /* ── section ops ── */
  const moveSection = useCallback((idx: number, dir: -1 | 1) => update((d) => {
    const j = idx + dir;
    if (j < 0 || j >= d.sections.length) return;
    [d.sections[idx], d.sections[j]] = [d.sections[j], d.sections[idx]];
  }), [update]);
  const addSection = useCallback((type: ShareSectionType) => update((d) => {
    if (d.sections.length >= SHARE_LIMITS.maxSections) return;
    d.sections.push({ id: uid(), type, visible: true, title: SECTION_LABEL[type], content: '', layout: 'default', galleryImages: [], tone: 'info' } as ShareConfig['sections'][number]);
  }), [update]);
  const removeSection = useCallback((id: string) => update((d) => { d.sections = d.sections.filter((s) => s.id !== id); }), [update]);

  const deviceWidth: Record<Device, number> = { desktop: 0, tablet: 834, mobile: 390 };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  const effTheme = getTheme(cfg.template);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800 md:h-screen">
      {/* ── Topbar ── */}
      <header className="flex h-auto min-h-[3.5rem] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onExit} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50" title="Keluar editor"><X className="h-4 w-4" /></button>
          <div className="leading-tight">
            <div className="flex items-center gap-2 font-display text-sm font-extrabold">
              <span className="max-w-[40vw] truncate" title={name}>{name || 'Editor Dashboard Publik'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{effTheme.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">{saving ? 'Menyimpan…' : dirty ? 'Perubahan belum disimpan' : savedAt ? 'Draft tersimpan' : 'Siap'}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-1 hidden rounded-lg bg-slate-100 p-1 sm:flex">
            {([['desktop', <Monitor className="h-4 w-4" />], ['tablet', <Tablet className="h-4 w-4" />], ['mobile', <Smartphone className="h-4 w-4" />]] as [Device, React.ReactNode][]).map(([d, ic]) => (
              <button key={d} onClick={() => setDevice(d)} title={d} className={`grid h-7 w-7 place-items-center rounded-md ${device === d ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>{ic}</button>
            ))}
          </div>
          <button onClick={undo} disabled={!past.current.length} title="Undo" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} disabled={!future.current.length} title="Redo" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
          <button onClick={() => setShowHistory((v) => !v)} title="Riwayat" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50"><History className="h-4 w-4" /></button>
          {hasDraft && (
            <button onClick={discardDraft} title="Buang draft" className="hidden items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-[13px] font-semibold text-amber-700 hover:bg-amber-50 sm:inline-flex"><Undo2 className="h-4 w-4" /> Buang draft</button>
          )}
          <button onClick={() => saveDraft(false)} className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-semibold hover:bg-slate-50 sm:inline-flex"><Save className="h-4 w-4" /> Simpan</button>
          {enabled && slug && (
            <a href={`/share/${slug}`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-semibold hover:bg-slate-50 lg:inline-flex"><ExternalLink className="h-4 w-4" /> Buka</a>
          )}
          <button onClick={publish} disabled={publishing} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Terbitkan
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* ── Panel kiri ── */}
        <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-1.5 py-1.5 md:w-[104px] md:flex-col md:overflow-visible md:border-b-0 md:border-r md:py-2">
          {PANELS.map((p) => (
            <button key={p.key} onClick={() => setPanel(p.key)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold transition md:mx-1.5 md:w-auto md:px-1 md:py-2.5 ${panel === p.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              {p.icon}<span>{p.label}</span>
            </button>
          ))}
        </aside>

        {/* ── Kontrol panel ── */}
        <div className="max-h-[42vh] w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-4 md:max-h-none md:w-[340px] md:border-b-0 md:border-r">
          {panel === 'template' && <TemplatePanel cfg={cfg} onApply={applyTheme} />}
          {panel === 'identity' && <IdentityPanel cfg={cfg} update={update} slug={slug} setSlug={setSlug} title={title} setTitle={setTitle} tagline={tagline} setTagline={setTagline} owner={owner} />}
          {panel === 'background' && <BackgroundPanel cfg={cfg} update={update} />}
          {panel === 'typography' && <TypographyPanel cfg={cfg} update={update} />}
          {panel === 'colors' && <ColorsPanel cfg={cfg} update={update} />}
          {panel === 'layout' && <LayoutPanel cfg={cfg} update={update} />}
          {panel === 'card' && <CardPanel cfg={cfg} update={update} published={published} />}
          {panel === 'sections' && <SectionsPanel cfg={cfg} update={update} moveSection={moveSection} addSection={addSection} removeSection={removeSection} />}
        </div>

        {/* ── Preview ── */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-200/60">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Preview langsung {hasDraft && <em className="rounded bg-amber-100 px-1.5 py-0.5 not-italic text-amber-700">draft (belum terbit)</em>}</span>
            <span className="truncate">{tagline || cfg.identity.dashboardName || owner?.orgName || 'Dashboard'}</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="mx-auto h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all"
              style={{ maxWidth: device === 'desktop' ? '100%' : deviceWidth[device] }}>
              <div className="h-full overflow-y-auto" key={reloadPreview}>
                <ShareDashboardPage
                  previewConfig={cfg}
                  previewOwner={owner}
                  previewMicrosites={previewMicrosites}
                  previewTitle={title}
                  previewTagline={tagline}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Riwayat ── */}
      {showHistory && (
        <div className="absolute right-3 top-16 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold">Riwayat versi</span>
            <button onClick={() => setShowHistory(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          {!history.length && <p className="py-3 text-center text-[12px] text-slate-400">Belum ada riwayat.</p>}
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {history.map((h, i) => (
              <button key={i} onClick={() => restore(i)} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-slate-50">
                <span>{h.label || 'Versi'}</span>
                <span className="text-[10px] text-slate-400">{new Date(h.at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </button>
            ))}
          </div>
          {enabled && (
            <button onClick={unpublish} className="mt-2 w-full rounded-lg border border-rose-200 px-2 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50">Nonaktifkan dashboard</button>
          )}
        </div>
      )}
    </div>
  );
}
