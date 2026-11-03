import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Globe2, Settings, ScrollText, LogOut, Menu, X,
  ArrowLeft, ShieldCheck, Search, Power, Trash2, Plus, CheckCircle2, Ban, Archive, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { platformApi } from '../services/platformApi';
import { useToast } from '../context/ToastContext';

type Tab = 'overview' | 'users' | 'microsites' | 'settings' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ReactNode; href: string }[] = [
  { key: 'overview', label: 'Ikhtisar', icon: <LayoutDashboard className="h-4 w-4" />, href: '/admin-panel' },
  { key: 'users', label: 'Pengguna', icon: <Users className="h-4 w-4" />, href: '/admin-panel/users' },
  { key: 'microsites', label: 'Semua Microsite', icon: <Globe2 className="h-4 w-4" />, href: '/admin-panel/microsites' },
  { key: 'settings', label: 'Pengaturan Platform', icon: <Settings className="h-4 w-4" />, href: '/admin-panel/settings' },
  { key: 'audit', label: 'Log Audit', icon: <ScrollText className="h-4 w-4" />, href: '/admin-panel/audit' },
];

export default function AdminPanelApp() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const active: Tab =
    pathname === '/admin-panel' || pathname === '/admin-panel/' ? 'overview'
    : pathname.startsWith('/admin-panel/users') ? 'users'
    : pathname.startsWith('/admin-panel/microsites') ? 'microsites'
    : pathname.startsWith('/admin-panel/settings') ? 'settings'
    : pathname.startsWith('/admin-panel/audit') ? 'audit'
    : 'overview';

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true, state: { from: pathname } });
  }, [loading, user, pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  // Gerbang admin — pengelola biasa tidak boleh masuk.
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--color-bg)] px-4 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-[var(--radius-lg)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]">
          <Ban className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-xl font-extrabold">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Halaman ini hanya untuk administrator.
          </p>
        </div>
        <Link to="/studio"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Kembali ke Studio</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-card)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] lg:hidden" aria-label="Menu">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin-panel" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-danger)] to-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-extrabold tracking-tight">Admin Panel</span>
                <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">Microsite Platform</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/studio" className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:inline-flex">
              <ArrowLeft className="h-4 w-4" /> Studio
            </Link>
            <button onClick={logout} title="Keluar" className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {TABS.map((t) => {
              const on = t.key === active;
              return (
                <Link key={t.key} to={t.href}
                  className={['flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors',
                    on ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]' : 'text-[var(--color-text)]/70 hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]'].join(' ')}>
                  <span className={on ? 'text-[var(--color-primary)]' : ''}>{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <nav className="absolute left-0 top-0 h-full w-64 bg-[var(--color-card)] p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm font-bold">Menu Admin</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Tutup"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-1">
                {TABS.map((t) => (
                  <Link key={t.key} to={t.href}
                    className={['flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium',
                      t.key === active ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]' : 'text-[var(--color-text)]/80'].join(' ')}>
                    {t.icon}{t.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}

        <main className="min-w-0 flex-1">
          {active === 'overview' && <AdminOverview />}
          {active === 'users' && <AdminUsers />}
          {active === 'microsites' && <AdminMicrosites />}
          {active === 'settings' && <AdminSettings />}
          {active === 'audit' && <AdminAudit />}
        </main>
      </div>
    </div>
  );
}

/* ── Ikhtisar ──────────────────────────────────────────────────────────── */
function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { platformApi.adminOverview().then(setData).catch(() => setData({})).finally(() => setLoading(false)); }, []);

  const s = data?.stats || {};
  const cards = [
    { label: 'Total Pengguna', value: s.users ?? '—', tone: 'primary' },
    { label: 'Total Microsite', value: s.microsites ?? '—', tone: 'success' },
    { label: 'Tayang', value: s.published ?? '—', tone: 'info' },
    { label: 'Draf', value: s.draft ?? '—', tone: 'warning' },
  ];
  const toneClass: Record<string, string> = {
    primary: 'text-[var(--color-primary)] bg-[var(--color-secondary)]',
    success: 'text-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)]',
    info: 'text-[var(--color-info)] bg-[color-mix(in_oklab,var(--color-info)_12%,transparent)]',
    warning: 'text-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Ikhtisar Platform</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Ringkasan seluruh aktivitas platform.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="studio-card flex flex-col gap-2 p-5">
            <span className={`inline-grid h-2 w-2 rounded-full ${toneClass[c.tone]}`} />
            <p className="studio-num font-display text-2xl font-extrabold">{loading ? '—' : c.value}</p>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="studio-card p-6">
        <h2 className="mb-4 font-display text-base font-bold">Aktivitas Terbaru</h2>
        {(data?.recentAudit || []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Belum ada aktivitas.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {(data!.recentAudit || []).slice(0, 8).map((a: any, i: number) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{a.action}{a.actorEmail ? ` · ${a.actorEmail}` : ''}</span>
                <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">{a.at ? new Date(a.at).toLocaleString('id-ID') : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Pengguna ──────────────────────────────────────────────────────────── */
function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = () => { setLoading(true); platformApi.adminUsers().then((d) => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const act = async (id: string, fn: () => Promise<any>, msg: string) => {
    setBusyId(id);
    try { await fn(); showToast(msg, 'success'); load(); }
    catch (e: any) { showToast(e?.message || 'Aksi gagal.', 'error'); }
    finally { setBusyId(''); }
  };

  const filtered = users.filter((u) =>
    !q || (u.email || '').toLowerCase().includes(q.toLowerCase()) || (u.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Pengguna</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{users.length} akun terdaftar.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari email / nama…"
            className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
      </div>

      <div className="studio-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-[var(--color-muted)]" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">Tidak ada pengguna.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {filtered.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] text-xs font-bold">
                    {(u.name || u.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.name || '—'}</p>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">{u.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={u.role === 'admin' ? 'purple' : 'emerald'} size="sm">{u.role === 'admin' ? 'Admin' : 'Pengelola'}</Badge>
                  <Badge variant={u.status === 'active' ? 'emerald' : u.status === 'suspended' ? 'amber' : 'zinc'} size="sm">{u.status || 'active'}</Badge>
                  {u.role !== 'admin' && (
                    <>
                      {u.status !== 'active' ? (
                        <button disabled={busyId === u.id} onClick={() => act(u.id, () => platformApi.adminUpdateUser(u.id, { status: 'active' }), 'Akun diaktifkan.')}
                          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:border-[var(--color-success)] hover:text-[var(--color-success)]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan
                        </button>
                      ) : (
                        <button disabled={busyId === u.id} onClick={() => act(u.id, () => platformApi.adminUpdateUser(u.id, { status: 'suspended' }), 'Akun ditangguhkan.')}
                          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]">
                          <Ban className="h-3.5 w-3.5" /> Tangguhkan
                        </button>
                      )}
                      <button disabled={busyId === u.id} onClick={() => act(u.id, () => platformApi.adminArchiveUser(u.id), 'Akun diarsipkan.')}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]">
                        <Archive className="h-3.5 w-3.5" /> Arsipkan
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Semua Microsite ───────────────────────────────────────────────────── */
function AdminMicrosites() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = () => { setLoading(true); platformApi.adminMicrosites().then((d) => setItems(d.microsites || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const act = async (id: string, fn: () => Promise<any>, msg: string) => {
    setBusyId(id);
    try { await fn(); showToast(msg, 'success'); load(); }
    catch (e: any) { showToast(e?.message || 'Aksi gagal.', 'error'); }
    finally { setBusyId(''); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Semua Microsite</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Kendali penuh atas seluruh microsite pengguna.</p>
      </div>

      <div className="studio-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded bg-[var(--color-muted)]" />)}</div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">Belum ada microsite.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="truncate font-mono text-[11px] text-[var(--color-muted-foreground)]">/m/{m.slug} · {m.ownerEmail || m.ownerId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.status === 'published' ? 'emerald' : 'zinc'} size="sm">{m.status === 'published' ? 'Tayang' : 'Draf'}</Badge>
                  <button disabled={busyId === m.id} onClick={() => act(m.id, () => platformApi.adminToggleMicrosite(m.id), 'Status diubah.')}
                    className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" title="Aktif/Nonaktif">
                    <Power className="h-4 w-4" />
                  </button>
                  <button disabled={busyId === m.id}
                    onClick={() => { if (confirm(`Hapus microsite "${m.name}"?`)) act(m.id, () => platformApi.adminDeleteMicrosite(m.id), 'Microsite dihapus.'); }}
                    className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Pengaturan Platform ───────────────────────────────────────────────── */
function AdminSettings() {
  const { showToast } = useToast();
  const [s, setS] = useState({ registrationOpen: true, showcaseEnabled: true, platformAnnouncement: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformApi.adminOverview().then((d) => { if (d?.settings) setS((p) => ({ ...p, ...d.settings })); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await platformApi.adminSaveSettings(s); showToast('Pengaturan disimpan.', 'success'); }
    catch (e: any) { showToast(e?.message || 'Gagal menyimpan.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Pengaturan Platform</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Kendali operasional platform.</p>
      </div>

      <div className="studio-card max-w-2xl space-y-5 p-6">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Registrasi Terbuka</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Izinkan pengguna baru mendaftar sendiri.</p>
          </div>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={!!s.registrationOpen} onChange={(e) => setS({ ...s, registrationOpen: e.target.checked })} />
        </label>

        <label className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5">
          <div>
            <p className="text-sm font-semibold">Showcase di Landing</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Tampilkan galeri microsite publik di halaman utama.</p>
          </div>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={!!s.showcaseEnabled} onChange={(e) => setS({ ...s, showcaseEnabled: e.target.checked })} />
        </label>

        <div className="border-t border-[var(--color-border)] pt-5">
          <label className="mb-1.5 block text-sm font-semibold">Pengumuman Platform</label>
          <textarea rows={3} value={s.platformAnnouncement || ''} onChange={(e) => setS({ ...s, platformAnnouncement: e.target.value })}
            placeholder="Pesan yang tampil di landing/dashboard…"
            className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} isLoading={saving}>Simpan Pengaturan</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Log Audit ─────────────────────────────────────────────────────────── */
function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { platformApi.adminAudit(150).then((d) => setRows(d.audit || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Log Audit</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Jejak aktivitas penting pada platform.</p>
      </div>
      <div className="studio-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--color-muted)]" />)}</div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">Belum ada log.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold">Aktor</th>
                  <th className="px-4 py-2.5 font-semibold">Aksi</th>
                  <th className="px-4 py-2.5 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[var(--color-muted-foreground)]">{r.at ? new Date(r.at).toLocaleString('id-ID') : '—'}</td>
                    <td className="px-4 py-2.5">{r.actorEmail || r.actorId || '—'}</td>
                    <td className="px-4 py-2.5"><Badge variant="zinc" size="sm">{r.action}</Badge></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted-foreground)]">{r.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
