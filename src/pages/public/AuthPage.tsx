import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowLeft, Sparkles, UserPlus, LogIn } from 'lucide-react';

declare global {
  interface Window { google?: any }
}

interface AuthPageProps { mode: 'login' | 'register' }

/**
 * Halaman autentikasi publik (Masuk / Daftar) — tema "Aurora Klinis".
 * Dua peran: pengelola biasa dan admin (sama-sama lewat halaman ini).
 */
export default function AuthPage({ mode }: AuthPageProps) {
  const { user, login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const gbtn = useRef<HTMLDivElement>(null);

  const dest = (location.state as any)?.from || '/studio';

  // Sudah login → langsung ke dashboard.
  useEffect(() => {
    if (user) navigate(dest, { replace: true });
  }, [user]);

  // Google Sign-In (opsional; hanya bila client ID tersedia).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/config').then((r) => r.json()).then((cfg) => {
      const cid = cfg?.googleClientId;
      if (!cid || cancelled) return;
      const init = () => {
        if (!window.google?.accounts?.id || !gbtn.current) return;
        window.google.accounts.id.initialize({
          client_id: cid,
          callback: async (resp: any) => {
            setErr('');
            setBusy(true);
            try {
              await loginWithGoogle(resp.credential);
              navigate(dest, { replace: true });
            } catch (e: any) {
              setErr(e?.message || 'Login Google gagal.');
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(gbtn.current, {
          theme: 'outline', size: 'large', width: 320, text: 'signin_with', locale: 'id',
        });
      };
      if (window.google?.accounts?.id) { init(); return; }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate(dest, { replace: true });
    } catch (e: any) {
      setErr(e?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/12 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[var(--color-accent)]/12 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="studio-card studio-fade-in p-7">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span
              aria-hidden
              className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)]"
            >
              {isLogin ? <ShieldCheck className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </span>
            <div className="leading-tight">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                {isLogin ? 'Masuk ke Studio' : 'Buat Akun Pengelola'}
              </h1>
              <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">
                {isLogin
                  ? 'Kelola microsite dan dashboard Anda.'
                  : 'Gratis. Mulai bangun microsite Anda.'}
              </p>
            </div>
          </div>

          {!isLogin && (
            <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-primary)_25%,transparent)] bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)] px-3 py-2 text-[12px] text-[var(--color-primary)]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Tanpa perlu kartu kredit. Langsung bisa digunakan.
            </div>
          )}

          <div ref={gbtn} className="mb-4 flex justify-center" />

          <div className="mb-4 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            atau dengan email
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {!isLogin && (
              <Input
                label="Nama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda / unit"
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="username"
            />
            <Input
              label="Kata sandi"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : 'Minimal 8 karakter'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
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
              {isLogin ? 'Masuk' : 'Daftar & Masuk'}
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[var(--color-muted-foreground)]">
            {isLogin ? (
              <>
                Belum punya akun?{' '}
                <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:opacity-80">
                  Daftar di sini
                </Link>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:opacity-80">
                  Masuk di sini
                </Link>
              </>
            )}
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--color-muted-foreground)]">
          <LogIn className="h-3.5 w-3.5" />
          Administrator juga masuk melalui halaman ini.
        </p>
      </div>
    </div>
  );
}
