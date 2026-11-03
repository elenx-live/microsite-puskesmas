import React, { useEffect, useState } from 'react';
import { LayoutGrid, ExternalLink, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  title?: string;
  subtitle?: string;
  /** Bila true, JANGAN render header sendiri — anak dirender apa adanya.
   *  Dipakai saat MicrositesManagement ditanam di dalam StudioApp (sudah punya chrome). */
  bare?: boolean;
}

/**
 * Shell admin Studio v2 — "Aurora Klinis".
 * Header kaca dengan wordmark berkarakter, identitas pengguna sebagai pil,
 * aksi publik/keluar yang jelas. Navigasi mobile jadi drawer bersih.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, bare }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const initials = (user?.email || 'A').slice(0, 1).toUpperCase();

  // Mode tertanam: tak perlu chrome/header sendiri.
  if (bare) {
    return (
      <div className="text-[var(--color-text)]">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)]">{title}</h1>}
            {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/80 surface-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <a href="/admin/microsites" className="group flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[15px] font-extrabold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105"
              >
                M
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-extrabold tracking-tight">
                  Microsite Studio
                </span>
                <span className="hidden text-[11px] font-medium text-[var(--color-muted-foreground)] sm:block">
                  Puskesmas Manding
                </span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)] sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4 opacity-70" />
              Lihat publik
            </a>

            {user?.email && (
              <span className="hidden items-center gap-2 rounded-[var(--pill-radius)] border border-[var(--color-border)] bg-[var(--color-card)] py-1 pl-1 pr-3 md:inline-flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-secondary)] text-[11px] font-bold text-[var(--color-secondary-foreground)]">
                  {initials}
                </span>
                <span className="max-w-[180px] truncate text-xs font-medium text-[var(--color-muted-foreground)]">
                  {user.email}
                </span>
              </span>
            )}

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-danger)]/50 hover:text-[var(--color-danger)]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 lg:hidden animate-[drawerA_220ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <style>{`@keyframes drawerA{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
            <a
              href="/admin/microsites"
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-[var(--color-secondary)] px-3 py-2.5 text-sm font-semibold text-[var(--color-secondary-foreground)]"
            >
              <LayoutGrid className="h-4 w-4" />
              Unit &amp; Microsite
            </a>
            <a
              href="/"
              className="mt-1 flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-muted)]"
            >
              <Home className="h-4 w-4 text-[var(--color-primary)]" />
              Lihat halaman publik
            </a>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        {(title || subtitle) && (
          <div className="mb-7">
            {title && (
              <h1 className="font-display text-[26px] font-extrabold tracking-tight text-[var(--color-text)] sm:text-[30px]">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
