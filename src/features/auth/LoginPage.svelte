<!-- @component Halaman login microsite — tombol Google Identity Services (GIS). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';

  const GOOGLE_CLIENT_ID =
    '936354706213-o3189kpkb6vrlvdal3gb9mut8717me6i.apps.googleusercontent.com';

  interface GisCredentialResponse {
    credential: string;
  }

  interface GisAccounts {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GisCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: { theme?: string; size?: string; text?: string; width?: number }
      ) => void;
    };
  }

  let gisState = $state<'loading' | 'ready' | 'error'>('loading');
  let loginError = $state('');
  let busy = $state(false);
  let buttonBox: HTMLDivElement | undefined = $state();

  function loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        if ((window as unknown as { google?: { accounts: GisAccounts } }).google?.accounts) {
          resolve();
        } else {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('gagal memuat')));
        }
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gagal memuat'));
      document.head.appendChild(script);
    });
  }

  async function handleCredential(response: GisCredentialResponse): Promise<void> {
    loginError = '';
    busy = true;
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        loginError = (json as { error?: string }).error || 'Login gagal. Coba lagi.';
        return;
      }
      await authStore.load(true);
      navigate('/dashboard');
    } catch {
      loginError = 'Tidak dapat menghubungi server. Coba lagi.';
    } finally {
      busy = false;
    }
  }

  onMount(async () => {
    await authStore.load();
    if (authStore.user) return;
    try {
      await loadGisScript();
      const google = (window as unknown as { google?: { accounts: GisAccounts } }).google;
      if (!google?.accounts || !buttonBox) {
        gisState = 'error';
        return;
      }
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      google.accounts.id.renderButton(buttonBox, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 280
      });
      gisState = 'ready';
    } catch {
      gisState = 'error';
    }
  });
</script>

<div class="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
  <div
    class="w-full max-w-sm rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-8 space-y-6 text-center"
  >
    <div class="space-y-2">
      <h1 class="text-xl font-bold text-[var(--color-text)]">Masuk Pengelola Microsite</h1>
      <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
        Masuk dengan akun Google untuk membuat dan mengelola microsite Puskesmas Manding.
      </p>
    </div>

    {#if authStore.loaded && authStore.user}
      <div class="space-y-4">
        <p class="text-sm text-[var(--color-text)]">
          Anda sudah masuk sebagai <span class="font-semibold">{authStore.user.name}</span>
          ({authStore.user.email}).
        </p>
        <div class="flex flex-col gap-2">
          <a
            href="/dashboard"
            onclick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            class="w-full inline-flex justify-center px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold hover:opacity-90 transition"
          >
            Buka Dashboard
          </a>
          <a
            href="/"
            onclick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            class="text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 transition"
          >
            Kembali ke Beranda Microsite
          </a>
        </div>
      </div>
    {:else}
      {#if gisState === 'loading'}
        <p class="text-xs text-[var(--color-muted-foreground)]">Memuat tombol Google…</p>
      {:else if gisState === 'error'}
        <div class="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-left space-y-2">
          <p class="text-xs font-bold text-[var(--color-text)]">Tombol Google tidak tampil</p>
          <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            Kemungkinan domain microsite.puskesmasmanding.com belum diizinkan di konsol Google
            Cloud (Authorized JavaScript origins) atau jaringan memblokir script Google. Minta
            admin menambahkan origin tersebut di GCP, lalu muat ulang halaman ini.
          </p>
        </div>
      {/if}
      <div bind:this={buttonBox} class="flex justify-center min-h-[44px]"></div>
      {#if busy}
        <p class="text-xs text-[var(--color-muted-foreground)]">Memverifikasi akun…</p>
      {/if}
      {#if loginError}
        <p class="text-xs font-semibold text-red-500">{loginError}</p>
      {/if}
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
        class="inline-block text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 transition"
      >
        Kembali ke Beranda Microsite
      </a>
    {/if}
  </div>
</div>
