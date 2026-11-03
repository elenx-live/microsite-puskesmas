import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

const MicrositesManagement = lazy(() => import('./pages/admin/MicrositesManagement'));

declare global {
  interface Window {
    google?: any;
  }
}

/** Muat script Google Identity Services sekali. */
function loadGsi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById('gsi-client') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.id = 'gsi-client';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const gbtn = useRef<HTMLDivElement | null>(null);

  // Pasang tombol "Sign in with Google" (GIS).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetch('/api/auth/config', { credentials: 'include' })
          .then((r) => r.json())
          .catch(() => ({}));
        const clientId = cfg?.googleClientId;
        if (!clientId) {
          setErr('Google Client ID belum dikonfigurasi di server.');
          return;
        }
        await loadGsi();
        if (cancelled || !window.google?.accounts?.id || !gbtn.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            setBusy(true);
            setErr(null);
            try {
              await loginWithGoogle(resp.credential);
              window.location.replace('/admin/microsites');
            } catch (e: any) {
              setErr(e?.message || 'Login Google gagal.');
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(gbtn.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          locale: 'id',
        });
      } catch {
        /* GIS gagal dimuat — fallback kata sandi tetap tersedia */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email.trim().toLowerCase(), password);
      window.location.replace('/admin/microsites');
    } catch (e: any) {
      setErr(e?.message || 'Login gagal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      {/* Latar dekoratif lembut */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/12 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[var(--color-accent)]/12 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="studio-card studio-fade-in p-7">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span
              aria-hidden
              className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-lg font-extrabold text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)]"
            >
              M
            </span>
            <div className="leading-tight">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                Microsite Studio
              </h1>
              <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">
                Masuk untuk mengelola microsite Puskesmas
              </p>
            </div>
          </div>

          <div ref={gbtn} className="mb-4 flex justify-center" />

          <div className="mb-4 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            atau kata sandi
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="username"
              type="email"
            />
            <Input
              label="Kata sandi"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <label className="-mt-1.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <input
                type="checkbox"
                checked={showPwd}
                onChange={(e) => setShowPwd(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-primary)]"
              />
              Tampilkan kata sandi
            </label>
            {err && (
              <p
                role="alert"
                className="rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-3 py-2 text-[13px] font-medium text-[var(--color-danger)]"
              >
                {err}
              </p>
            )}
            <Button type="submit" disabled={busy} isLoading={busy} className="w-full">
              Masuk ke Studio
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--color-muted-foreground)]">
            <a
              href="/"
              className="font-medium transition-colors hover:text-[var(--color-primary)]"
            >
              ← Kembali ke halaman publik
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Router ADMIN app Microsite (admin.html).
 * Guard: hanya render Studio bila sesi server valid.
 */
export default function AdminApp() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-muted-foreground)]">
        Memuat…
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (pathname === '/admin/microsites' || pathname.startsWith('/admin')) {
    return (
      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--color-muted-foreground)]">Memuat Studio…</div>
        }
      >
        <MicrositesManagement />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-[var(--color-muted-foreground)]">Memuat…</div>}
    >
      <MicrositesManagement />
    </Suspense>
  );
}
