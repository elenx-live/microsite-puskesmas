<!-- @component Halaman publik microsite per-slug — render template fullscreen mandiri (tanpa layout), mode pratinjau draf, proteksi sandi, & modal QR/bagikan. -->
<script lang="ts">
  import {
    Lock,
    AlertTriangle,
    ArrowLeft,
    HeartPulse,
    Eye,
    X,
    Download,
    Copy,
    Check,
    Globe
  } from 'lucide-svelte';
  import { routerState } from '../../app/router.svelte.js';
  import { micrositeService } from '../../shared/services/micrositeService.js';
  import { siteSettingsService } from '../../shared/services/siteSettingsService.js';
  import { updateClientMetaTags } from '../../shared/utils/metaSync.js';
  import type {
    MicrositeEntity,
    HomepageTemplateType,
    BackgroundAnimationType
  } from '../../shared/types/index.js';
  import MicrositeTemplateRenderer from './components/MicrositeTemplateRenderer.svelte';

  let { slug: slugProp = '' }: { slug?: string } = $props();

  // Robust slug extraction dari prop router (pengganti useParams)
  const slug = $derived.by(() => {
    let s = (slugProp || '').trim();
    try {
      s = decodeURIComponent(s);
    } catch {}
    return s.replace(/^\/+|\/+$/g, '').trim();
  });

  // Query dari routerState (pengganti useSearchParams)
  // Aplikasi mandiri tanpa login: pratinjau draf hanya lewat ?preview=true.
  const isPreviewMode = $derived(routerState.query['preview'] === 'true');

  let microsite = $state<MicrositeEntity | null>(null);
  let loading = $state(true);
  let notFound = $state(false);
  let isDraftUnpublished = $state(false);

  // Password Protection State
  let passwordInput = $state('');
  let isUnlocked = $state(false);
  let passwordError = $state(false);

  // Sharing & QR state
  let showQR = $state(false);
  let copied = $state(false);
  let copiedModalUrl = $state(false);

  // Live Template & Animation overrides for visitor experimentation
  let currentTemplate = $state<HomepageTemplateType>('modern_majestic');
  let currentAnimation = $state<BackgroundAnimationType>('aurora_flow');

  // Guard to ensure page view is recorded only once per visit
  let viewRecordedForSlug: string | null = null;

  $effect(() => {
    const currentSlug = slug;
    const preview = isPreviewMode;
    let isMounted = true;

    const loadPage = async (isInitial = false) => {
      if (!currentSlug) {
        if (isMounted) {
          notFound = true;
          loading = false;
        }
        return;
      }
      if (isInitial) {
        loading = true;
      }
      notFound = false;
      isDraftUnpublished = false;
      try {
        const data = await micrositeService.getMicrositeBySlug(currentSlug);
        if (!isMounted) return;

        if (!data) {
          notFound = true;
          loading = false;
          return;
        }

        // Access checks for non-admin visitors
        if (!preview) {
          if (data.status !== 'published' || !data.active) {
            isDraftUnpublished = true;
            microsite = data;
            loading = false;
            return;
          }
        }

        microsite = data;

        // Update Dynamic Meta Tags & Title based on Panel Settings & Microsite Content
        try {
          const cachedSettings = siteSettingsService.getCachedSettings();
          const siteName = cachedSettings?.siteName || cachedSettings?.shortName || 'Puskesmas Manding';
          updateClientMetaTags({
            title: `${data.name} - ${siteName}`,
            description: data.description || `Portal resmi ${data.name} pada ${siteName}.`,
            image: data.ogImageUrl || data.profileImageUrl || data.logoUrl,
            siteName: siteName,
            url: window.location.href
          });
        } catch {}

        // Track page view in analytics (only once per unique slug session)
        if (viewRecordedForSlug !== data.id) {
          viewRecordedForSlug = data.id;
          micrositeService.recordAnalyticsEvent(data.id, 'page_view');
        }

        // Initialize template & animation
        const initTemplate = data.themeCustomization?.template || 'modern_majestic';
        currentTemplate = initTemplate;

        const defaultAnim: Record<HomepageTemplateType, BackgroundAnimationType> = {
          modern_majestic: 'aurora_flow',
          artistic_bio: 'bioluminescent',
          avant_garde: 'geometric_waves',
          nusantara_art: 'golden_radiance',
          minimal_gallery: 'subtle_glow',
          classic: 'none'
        };

        const initAnim = data.themeCustomization?.backgroundAnimation || defaultAnim[initTemplate] || 'aurora_flow';
        currentAnimation = initAnim;

        // If password protected, load lock state
        if (data.passwordProtected) {
          isUnlocked = false;
        } else {
          isUnlocked = true;
        }
      } catch (e) {
        console.error(e);
        if (isMounted) notFound = true;
      } finally {
        if (isMounted) loading = false;
      }
    };

    loadPage(true);

    const handleUpdate = () => {
      if (!isMounted) return;
      loadPage(false);
    };

    window.addEventListener('puskesmas_microsites_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('puskesmas_microsites_updated', handleUpdate);
    };
  });

  async function handlePasswordSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!microsite) return;

    passwordError = false;
    const valid = await micrositeService.verifyPassword(microsite.id, passwordInput);
    if (valid) {
      isUnlocked = true;
    } else {
      passwordError = true;
    }
  }

  function handleCopyLink() {
    if (!microsite) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function handleCopyModalUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    copiedModalUrl = true;
    setTimeout(() => (copiedModalUrl = false), 2000);
  }
</script>

{#if loading}
  <div class="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-[var(--color-muted-foreground)]">
    <HeartPulse class="w-10 h-10 text-[var(--color-primary)] animate-pulse mb-3" />
    <p class="text-xs font-mono">Memuat portal informasi cepat...</p>
  </div>
{:else if isDraftUnpublished && microsite}
  <!-- If portal is in draft/inactive state and accessed by normal visitors -->
  <div class="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center space-y-6">
    <div class="p-4 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
      <AlertTriangle class="w-12 h-12" />
    </div>
    <h1 class="text-2xl font-light text-[var(--color-text)]">Portal Belum Dipublikasikan</h1>
    <p class="text-[var(--color-muted-foreground)] text-xs max-w-sm leading-relaxed">
      Portal <span class="font-semibold text-[var(--color-text)]">"{microsite.name}"</span> saat ini masih dalam status <span class="font-mono text-amber-400 font-bold">{microsite.status.toUpperCase()}</span> atau nonaktif sementara oleh pengelola Puskesmas.
    </p>
    <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
      <a
        href="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs hover:border-[var(--color-primary)] transition"
      >
        <Globe class="w-4 h-4 text-[var(--color-primary)]" />
        Lihat Katalog Microsite Lainnya
      </a>
      <a
        href="#/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold text-xs hover:opacity-90 transition"
      >
        <ArrowLeft class="w-4 h-4" />
        Kembali ke Beranda Utama
      </a>
    </div>
  </div>
{:else if notFound || !microsite}
  <div class="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center space-y-6">
    <div class="p-4 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
      <AlertTriangle class="w-12 h-12" />
    </div>
    <h1 class="text-2xl font-light text-[var(--color-text)]">Portal Tidak Ditemukan</h1>
    <p class="text-[var(--color-muted-foreground)] text-xs max-w-sm leading-relaxed">
      Portal informasi cepat yang Anda cari tidak tersedia, dinonaktifkan sementara, atau URL slug telah diubah.
    </p>
    <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
      <a
        href="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs hover:border-[var(--color-primary)] transition"
      >
        <Globe class="w-4 h-4 text-[var(--color-primary)]" />
        Jelajahi Portal Microsite
      </a>
      <a
        href="#/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold text-xs hover:opacity-90 transition"
      >
        <ArrowLeft class="w-4 h-4" />
        Kembali ke Beranda Utama
      </a>
    </div>
  </div>
{:else if !isUnlocked}
  <!-- Render Lock Screen if Protected -->
  <div class="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 relative">
    {#if isPreviewMode}
      <div class="absolute top-0 left-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-50">
        <Eye class="w-4 h-4" />
        <span>PRATINJAU DRAF PORTAL (PREVIEW MODE)</span>
      </div>
    {/if}

    <div class="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-2xl">
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] mx-auto">
          <Lock class="w-8 h-8" />
        </div>
        <h1 class="text-xl font-bold text-[var(--color-text)] tracking-tight">Portal Dilindungi Sandi</h1>
        <p class="text-xs text-[var(--color-muted-foreground)]">Silakan masukkan kata sandi resmi untuk membuka akses informasi portal ini.</p>
      </div>

      <form onsubmit={handlePasswordSubmit} class="space-y-4">
        <div class="space-y-1.5">
          <label for="access-password" class="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted-foreground)]">Kata Sandi Akses</label>
          <input
            id="access-password"
            type="password"
            bind:value={passwordInput}
            placeholder="Masukkan kata sandi..."
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none rounded-2xl px-4 py-3 text-sm text-[var(--color-text)]"
            required
            autofocus
          />
          {#if passwordError}
            <p class="text-[11px] text-rose-500 font-medium">Kata sandi yang Anda masukkan salah. Silakan coba lagi.</p>
          {/if}
        </div>

        <button
          type="submit"
          class="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold text-xs transition"
        >
          Verifikasi Sandi Akses
        </button>
      </form>

      <div class="text-center pt-2">
        <a href="#/" class="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] flex items-center justify-center gap-1.5">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali ke Website Utama</span>
        </a>
      </div>
    </div>
  </div>
{:else}
  <div class="relative min-h-screen">
    <!-- Banner Preview Mode -->
    {#if isPreviewMode}
      <div class="fixed top-0 left-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-50 shadow-lg">
        <Eye class="w-4 h-4" />
        <span>PRATINJAU PORTAL (PREVIEW MODE) - DRAFT DATA</span>
      </div>
    {/if}

    <!-- Render Template Component -->
    <MicrositeTemplateRenderer
      microsite={microsite}
      templateOverride={currentTemplate}
      animationOverride={currentAnimation}
      isPreviewMode={isPreviewMode}
      onOpenQR={() => (showQR = true)}
      onCopyLink={handleCopyLink}
      copied={copied}
    />

    <!-- QR Code Modal Dialog -->
    {#if showQR}
      <div class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-5 text-center shadow-2xl relative">
          <button
            type="button"
            onclick={() => (showQR = false)}
            class="absolute top-4 right-4 p-2 rounded-2xl text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition"
          >
            <X class="w-4 h-4" />
          </button>

          <div class="space-y-1">
            <h3 class="text-base font-bold text-[var(--color-text)]">{microsite.name}</h3>
            <p class="text-xs text-[var(--color-muted-foreground)]">Pindai QR Code untuk akses langsung</p>
          </div>

          <div class="bg-white p-4 rounded-2xl inline-block border border-[var(--color-border)] shadow-md">
            <img
              src={micrositeService.generateQRCodeURL(microsite.slug)}
              alt="QR Code"
              class="w-48 h-48 mx-auto"
            />
          </div>

          <div class="space-y-2">
            <p class="text-[11px] font-mono break-all text-[var(--color-muted-foreground)] bg-[var(--color-bg)] p-2 rounded-xl border border-[var(--color-border)]">
              {window.location.href}
            </p>

            <div class="flex gap-2">
              <button
                type="button"
                onclick={handleCopyModalUrl}
                class="flex-1 py-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-zinc-700 text-[var(--color-text)] text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {#if copiedModalUrl}
                  <Check class="w-3.5 h-3.5 text-emerald-400" />
                {:else}
                  <Copy class="w-3.5 h-3.5" />
                {/if}
                <span>{copiedModalUrl ? 'Tersalin' : 'Salin URL'}</span>
              </button>
              <a
                href={micrositeService.generateQRCodeURL(microsite.slug)}
                download={`QR_${microsite.slug}.png`}
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download class="w-3.5 h-3.5" />
                <span>Unduh QR</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
