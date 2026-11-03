import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, LayoutGrid, ExternalLink, ShieldCheck, LogIn, Home, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PublicLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

/**
 * Shell publik Studio v2 — "Aurora Klinis".
 * Header kaca mengambang, wordmark berkarakter, navigasi responsif dengan
 * menu mobile drawer, footer informatif. Semua warna lewat token tema.
 */
export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, activeNav }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const onList = pathname === '/' || pathname.startsWith('/microsites');
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup drawer ketika rute berubah
  useEffect(() => setMenuOpen(false), [pathname]);

  const NavLink: React.FC<{ href: string; active?: boolean; children: React.ReactNode }> = ({
    href,
    active,
    children,
  }) => (
    <Link
      to={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'relative rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text)]/70 hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-primary)]"
        />
      )}
    </Link>
  );

  const Brand: React.FC<{ compact?: boolean }> = () => (
    <Link to="/" className="group flex items-center gap-2.5">
      <span
        aria-hidden
        className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[15px] font-extrabold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-transform duration-200 group-hover:scale-105"
      >
        M
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-2 ring-[var(--color-card)]" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] font-extrabold tracking-tight text-[var(--color-text)]">
          Microsite
        </span>
        <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
          Puskesmas Manding
        </span>
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/80 surface-glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Brand />

          {/* Navigasi desktop */}
          <nav className="hidden items-center gap-1.5 sm:flex">
            <NavLink href="/" active={pathname === '/'}>
              <Home className="mr-1 inline h-4 w-4 align-[-2px]" />
              Beranda
            </NavLink>
            <NavLink href="/microsites" active={onList && pathname !== '/'}>
              Direktori
            </NavLink>
            <a
              href="https://sumenep.puskesmasmanding.com"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Portal Utama
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
            <span aria-hidden className="mx-1 h-5 w-px bg-[var(--color-border)]" />
            {user ? (
              <>
                <Link
                  to="/studio"
                  className="inline-flex items-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.97]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Studio
                </Link>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-text)]/80 transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.97]"
                >
                  <LogIn className="h-4 w-4" />
                  Daftar
                </Link>
              </>
            )}
          </nav>

          {/* Tombol menu mobile */}
          <button
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Drawer mobile */}
        {menuOpen && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 sm:hidden animate-[drawer_220ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <style>{`@keyframes drawer{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-muted)]"
            >
              <Home className="h-4 w-4 text-[var(--color-primary)]" />
              Beranda
            </Link>
            <Link
              to="/microsites"
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-muted)]"
            >
              <LayoutGrid className="h-4 w-4 text-[var(--color-primary)]" />
              Direktori Microsite
            </Link>
            <a
              href="https://sumenep.puskesmasmanding.com"
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-muted)]"
            >
              <ExternalLink className="h-4 w-4 text-[var(--color-primary)]" />
              Portal Utama Puskesmas
            </a>
            {user ? (
              <>
                <Link
                  to="/studio"
                  className="mt-1.5 flex items-center justify-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Buka Dashboard Studio
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-danger)]"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="mt-1.5 flex items-center justify-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)]"
                >
                  <LogIn className="h-4 w-4" />
                  Daftar Sekarang
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-text)]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Masuk
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xs font-extrabold text-[var(--color-primary-foreground)]"
            >
              M
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-[var(--color-text)]">
                Microsite Puskesmas Manding
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                © {new Date().getFullYear()} Puskesmas Manding. Seluruh hak cipta.
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              to="/microsites"
              className="font-medium text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-primary)]"
            >
              Direktori
            </Link>
            <a
              href="https://sumenep.puskesmasmanding.com"
              className="font-medium text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-primary)]"
            >
              Portal Utama
            </a>
            {user ? (
              <Link
                to="/studio"
                className="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
              >
                Buka Studio
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-medium text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-primary)]"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
                >
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
};
