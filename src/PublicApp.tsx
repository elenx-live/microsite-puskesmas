import React, { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const MicrositeCategoriesPage = lazy(() => import('./pages/public/MicrositeCategoriesPage'));
const MicrositePage = lazy(() => import('./pages/public/MicrositePage'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const StudioApp = lazy(() => import('./studio/StudioApp'));
const AdminPanelApp = lazy(() => import('./admin/AdminPanelApp'));

/**
 * Suspense fallback v2 — skeleton halus bertema token.
 * Mengganti fallback lama (bg-slate-50) yang bocor dari template lama.
 */
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <span className="text-sm font-medium text-[var(--color-muted-foreground)]">Memuat…</span>
      </div>
    </div>
  );
}

/** Halaman 404 v2 — token tema, bukan slate/teal hard-code. */
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--color-bg)] px-4 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
        <Compass className="h-8 w-8" />
      </span>
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
          404
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Halaman microsite tidak ditemukan.
        </p>
      </div>
      <a
        href="/microsites"
        className="inline-flex items-center gap-2 rounded-[var(--button-radius)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-strong)] active:scale-[0.97]"
      >
        <Home className="h-4 w-4" />
        Lihat daftar microsite
      </a>
    </div>
  );
}

/**
 * Router PUBLIK app Microsite (index.html).
 * Menangani /microsites (daftar), /m/:slug dan /<slug> (microsite individual).
 */
export default function PublicApp() {
  const { pathname } = useLocation();

  const render = () => {
    if (pathname === '/' || pathname === '') {
      return <LandingPage />;
    }
    if (pathname === '/login') {
      return <AuthPage mode="login" />;
    }
    if (pathname === '/register') {
      return <AuthPage mode="register" />;
    }
    if (pathname === '/microsites' || pathname === '/microsites/') {
      return <MicrositeCategoriesPage />;
    }
    if (pathname.startsWith('/studio')) {
      return <StudioApp />;
    }
    if (pathname.startsWith('/admin-panel')) {
      return <AdminPanelApp />;
    }
    if (pathname.startsWith('/m/')) {
      return <MicrositePage />;
    }
    // Rute slug langsung: /<slug> (mis. /tu-pkm, /festival-nusantara).
    const seg = pathname.replace(/^\/+|\/+$/g, '');
    if (seg && !seg.includes('/')) {
      return <MicrositePage />;
    }
    return <NotFound />;
  };

  return <Suspense fallback={<Loading />}>{render()}</Suspense>;
}
