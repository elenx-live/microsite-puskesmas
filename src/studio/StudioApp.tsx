import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Globe2, UserCog, Palette, Settings, LogOut, Menu, X, Plus,
  Eye, MousePointerClick, FileText, ArrowRight, ExternalLink, Sparkles, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { platformApi, DashboardPrefs } from '../services/platformApi';
import { useToast } from '../context/ToastContext';
import MicrositesManagement from '../pages/admin/MicrositesManagement';

type Tab = 'overview' | 'microsites' | 'profile' | 'customize' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ReactNode; href: string }[] = [
  { key: 'overview', label: 'Ringkasan', icon: <LayoutDashboard className="h-4 w-4" />, href: '/studio' },
  { key: 'microsites', label: 'Microsite Saya', icon: <Globe2 className="h-4 w-4" />, href: '/studio/microsites' },
  { key: 'customize', label: 'Kustomisasi', icon: <Palette className="h-4 w-4" />, href: '/studio/customize' },
  { key: 'profile', label: 'Profil', icon: <UserCog className="h-4 w-4" />, href: '/studio/profile' },
  { key: 'settings', label: 'Pengaturan Akun', icon: <Settings className="h-4 w-4" />, href: '/studio/settings' },
];

const ACCENTS: { key: string; name: string; color: string }[] = [
  { key: 'emerald', name: 'Zamrud', color: '#0e8a63' },
  { key: 'teal', name: 'Teal', color: '#0d9488' },
  { key: 'sky', name: 'Langit', color: '#0284c7' },
  { key: 'violet', name: 'Violet', color: '#7c3aed' },
  { key: 'rose', name: 'Mawar', color: '#e11d48' },
  { key: 'amber', name: 'Amber', color: '#d97706' },
];

export default function StudioApp() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const active: Tab =
    pathname === '/studio' ? 'overview'
    : pathname.startsWith('/studio/microsites') ? 'microsites'
    : pathname.startsWith('/studio/customize') ? 'customize'
    : pathname.startsWith('/studio/profile') ? 'profile'
    : pathname.startsWith('/studio/settings') ? 'settings'
    : 'overview';

  // Gerbang auth: belum login → /login
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true, state: { from: pathname } });
  }, [loading, user, pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-card)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] lg:hidden"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/studio" className="group flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[15px] font-extrabold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]">
                M
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-extrabold tracking-tight">Studio</span>
                <span className="hidden text-[11px] font-medium text-[var(--color-muted-foreground)] sm:block">
                  {user.orgName || user.name}
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <Link
                to="/admin-panel"
                className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:inline-flex"
              >
                <Sparkles className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-muted)] sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4 opacity-70" /> Lihat publik
            </Link>
            <span className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-1 pl-1 pr-3 md:inline-flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-secondary)] text-[11px] font-bold text-[var(--color-secondary-foreground)]">
                {(user.name || user.email).slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[160px] truncate text-xs font-medium text-[var(--color-muted-foreground)]">
                {user.email}
              </span>
            </span>
            <button
              onClick={logout}
              title="Keluar"
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {TABS.map((t) => {
              const on = t.key === active;
              return (
                <Link
                  key={t.key}
                  to={t.href}
                  className={[
                    'flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors',
                    on
                      ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
                      : 'text-[var(--color-text)]/70 hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  <span className={on ? 'text-[var(--color-primary)]' : ''}>{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Drawer mobile nav */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <nav className="absolute left-0 top-0 h-full w-64 bg-[var(--color-card)] p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm font-bold">Menu</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {TABS.map((t) => {
                  const on = t.key === active;
                  return (
                    <Link
                      key={t.key}
                      to={t.href}
                      className={[
                        'flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium',
                        on ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]' : 'text-[var(--color-text)]/80',
                      ].join(' ')}
                    >
                      {t.icon}
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}

        {/* Konten */}
        <main className="min-w-0 flex-1">
          {active === 'overview' && <OverviewTab />}
          {active === 'microsites' && <MicrositesManagement />}
          {active === 'customize' && <CustomizeTab />}
          {active === 'profile' && <ProfileTab />}
          {active === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

/* ── Ringkasan ─────────────────────────────────────────────────────────── */
function OverviewTab() {
  const { user } = useAuth();
  const [data, setData] = useState<{ stats: any; microsites: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformApi.getSummary().then(setData).catch(() => setData({ stats: {}, microsites: [] })).finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || { total: 0, published: 0, draft: 0 };
  const cards = [
    { label: 'Total Microsite', value: stats.total, icon: <Globe2 className="h-4 w-4" />, tone: 'primary' },
    { label: 'Tayang (Publik)', value: stats.published, icon: <Eye className="h-4 w-4" />, tone: 'success' },
    { label: 'Draf', value: stats.draft, icon: <FileText className="h-4 w-4" />, tone: 'warning' },
    { label: 'Total Klik', value: (data?.microsites || []).reduce((n, m) => n + (m.clicks || 0), 0), icon: <MousePointerClick className="h-4 w-4" />, tone: 'info' },
  ];
  const toneClass: Record<string, string> = {
    primary: 'text-[var(--color-primary)] bg-[var(--color-secondary)]',
    success: 'text-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)]',
    warning: 'text-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]',
    info: 'text-[var(--color-info)] bg-[color-mix(in_oklab,var(--color-info)_12%,transparent)]',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Selamat datang, {user?.name || 'Pengelola'} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Ini ruang kerja pribadi Anda. Kelola microsite dan pengaturan dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="studio-card flex flex-col gap-3 p-5">
            <span className={`grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] ${toneClass[c.tone]}`}>
              {c.icon}
            </span>
            <div>
              <p className="studio-num font-display text-2xl font-extrabold">{loading ? '—' : c.value}</p>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="studio-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Microsite Terbaru</h2>
          <Link to="/studio/microsites" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
            Kelola semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]" />)}
          </div>
        ) : (data?.microsites || []).length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-10 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" />
            <p className="mt-3 text-sm font-semibold">Belum ada microsite</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Buat microsite pertama Anda untuk mulai.</p>
            <Link to="/studio/microsites" className="mt-4 inline-block">
              <Button size="sm"><Plus className="h-4 w-4" /> Buat Microsite</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {(data!.microsites || []).slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-secondary)] text-[var(--color-primary)]">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate font-mono text-[11px] text-[var(--color-muted-foreground)]">/m/{m.slug}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={m.status === 'published' ? 'emerald' : 'zinc'} size="sm">
                    {m.status === 'published' ? 'Tayang' : 'Draf'}
                  </Badge>
                  <a href={`/m/${m.slug}`} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]" title="Buka">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Kustomisasi Dashboard ─────────────────────────────────────────────── */
function CustomizeTab() {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<DashboardPrefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformApi.getPrefs().then((d) => setPrefs(d.prefs || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleWidget = (w: string) => {
    setPrefs((p) => {
      const set = new Set(p.widgets || ['stats', 'recent', 'tips']);
      set.has(w) ? set.delete(w) : set.add(w);
      return { ...p, widgets: Array.from(set) };
    });
  };

  const toggleShortcut = (s: string) => {
    setPrefs((p) => {
      const set = new Set(p.shortcuts || ['new', 'directory', 'profile']);
      set.has(s) ? set.delete(s) : set.add(s);
      return { ...p, shortcuts: Array.from(set) };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await platformApi.savePrefs(prefs);
      showToast('Preferensi dashboard disimpan.', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const WIDGETS = [
    { key: 'stats', label: 'Kartu Statistik' },
    { key: 'recent', label: 'Microsite Terbaru' },
    { key: 'tips', label: 'Tips & Bantuan' },
  ];
  const SHORTCUTS = [
    { key: 'new', label: 'Buat Microsite Baru' },
    { key: 'directory', label: 'Buka Direktori Publik' },
    { key: 'profile', label: 'Edit Profil' },
  ];

  if (loading) return <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Kustomisasi Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Sesuaikan tampilan ruang kerja Anda. Ini hanya preferensi tampilan dan tidak mengubah fungsi.
        </p>
      </div>

      <div className="studio-card space-y-4 p-6">
        <h2 className="font-display text-sm font-bold">Warna Aksen</h2>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => setPrefs((p) => ({ ...p, accent: a.key }))}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                prefs.accent === a.key
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
              ].join(' ')}
            >
              <span className="h-4 w-4 rounded-full" style={{ background: a.color }} />
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-card space-y-4 p-6">
        <h2 className="font-display text-sm font-bold">Mode Tampilan</h2>
        <div className="flex gap-3">
          {(['light', 'slate'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
              className={[
                'rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-semibold transition-all',
                (prefs.theme || 'light') === t
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
                  : 'border-[var(--color-border)]',
              ].join(' ')}
            >
              {t === 'light' ? 'Terang' : 'Netral'}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-card space-y-4 p-6">
        <h2 className="font-display text-sm font-bold">Widget Ringkasan</h2>
        <div className="space-y-2">
          {WIDGETS.map((w) => (
            <label key={w.key} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={(prefs.widgets || ['stats', 'recent', 'tips']).includes(w.key)}
                onChange={() => toggleWidget(w.key)}
              />
              {w.label}
            </label>
          ))}
        </div>
      </div>

      <div className="studio-card space-y-4 p-6">
        <h2 className="font-display text-sm font-bold">Shortcut Favorit</h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={(prefs.shortcuts || ['new', 'directory', 'profile']).includes(s.key)}
                onChange={() => toggleShortcut(s.key)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} isLoading={saving}>Simpan Preferensi</Button>
      </div>
    </div>
  );
}

/* ── Profil ────────────────────────────────────────────────────────────── */
function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', org_name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', org_name: user.orgName || '', phone: user.phone || '', bio: user.bio || '' });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await platformApi.updateProfile(form);
      await refreshUser();
      showToast('Profil diperbarui.', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Profil Pengelola</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Informasi ini melekat pada akun Anda dan muncul di microsite Anda (bila diaktifkan).
        </p>
      </div>

      <form onSubmit={save} className="studio-card max-w-2xl space-y-5 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-2xl font-extrabold text-[var(--color-primary-foreground)]">
            {(form.name || user?.email || 'P').slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold">{user?.email}</p>
            <Badge variant={user?.role === 'admin' ? 'purple' : 'emerald'} size="sm">
              {user?.role === 'admin' ? 'Administrator' : 'Pengelola'}
            </Badge>
          </div>
        </div>

        <Input label="Nama / Nama Unit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama Anda atau unit" />
        <Input label="Organisasi" value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} placeholder="Nama organisasi / instansi" />
        <Input label="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text)]">Bio Singkat</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            placeholder="Deskripsi singkat..."
            className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>Simpan Profil</Button>
        </div>
      </form>
    </div>
  );
}

/* ── Pengaturan Akun ───────────────────────────────────────────────────── */
function SettingsTab() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [pwd, setPwd] = useState({ current: '', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const changePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.password.length < 8) return showToast('Kata sandi minimal 8 karakter.', 'warning');
    if (pwd.password !== pwd.confirm) return showToast('Konfirmasi kata sandi tidak cocok.', 'warning');
    setSaving(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwd.current, password: pwd.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah kata sandi.');
      showToast('Kata sandi diperbarui. Sesi di perangkat lain telah diputus.', 'success');
      setPwd({ current: '', password: '', confirm: '' });
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah kata sandi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Keamanan dan sesi akun Anda.</p>
      </div>

      <div className="studio-card max-w-2xl space-y-4 p-6 text-sm">
        <div className="flex justify-between border-b border-[var(--color-border)] pb-3">
          <span className="text-[var(--color-muted-foreground)]">Email</span>
          <span className="font-medium">{user?.email}</span>
        </div>
        <div className="flex justify-between border-b border-[var(--color-border)] pb-3">
          <span className="text-[var(--color-muted-foreground)]">Peran</span>
          <span className="font-medium">{user?.role === 'admin' ? 'Administrator' : 'Pengelola'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-muted-foreground)]">Status Akun</span>
          <Badge variant="emerald" size="sm">Aktif</Badge>
        </div>
      </div>

      <form onSubmit={changePwd} className="studio-card max-w-2xl space-y-4 p-6">
        <h2 className="font-display text-sm font-bold">Ubah Kata Sandi</h2>
        <Input label="Kata Sandi Saat Ini" type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="Sandi yang sedang dipakai" autoComplete="current-password" />
        <Input label="Kata Sandi Baru" type="password" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} placeholder="Minimal 8 karakter" autoComplete="new-password" />
        <Input label="Konfirmasi Kata Sandi" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Ulangi kata sandi" />
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>Ubah Kata Sandi</Button>
        </div>
      </form>

      <div className="studio-card max-w-2xl space-y-3 p-6">
        <h2 className="font-display text-sm font-bold text-[var(--color-danger)]">Keluar dari Sesi</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Mengakhiri sesi login Anda di perangkat ini.
        </p>
        <Button variant="danger" onClick={logout}><LogOut className="h-4 w-4" /> Keluar</Button>
      </div>
    </div>
  );
}
