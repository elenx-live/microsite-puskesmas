<!-- @component Template microsite "Minimalist Gallery" — studio seni kontemporer & tipografi tajam. -->
<script lang="ts">
  import {
    ArrowLeft,
    QrCode,
    Share2,
    Check
  } from 'lucide-svelte';
  import type { MicrositeEntity, BackgroundAnimationType } from '../../../shared/types/index.js';
  import ArtisticBackgroundCanvas from '../components/ArtisticBackgroundCanvas.svelte';
  import MicrositeContentList from '../components/MicrositeContentList.svelte';
  import MicrositeHeaderRenderer from '../components/MicrositeHeaderRenderer.svelte';
  import MicrositeFooterRenderer from '../components/MicrositeFooterRenderer.svelte';

  let {
    microsite,
    isPreviewMode,
    onOpenQR,
    onCopyLink,
    copied,
    activeAnimation = 'subtle_glow'
  }: {
    microsite: MicrositeEntity;
    isPreviewMode?: boolean;
    onOpenQR: () => void;
    onCopyLink: () => void;
    copied: boolean;
    activeAnimation?: BackgroundAnimationType;
  } = $props();

  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 20) / 100;
  const bgBlur =
    microsite.themeCustomization?.bgImageBlur === 'lg'
      ? 'blur(16px)'
      : microsite.themeCustomization?.bgImageBlur === 'md'
      ? 'blur(8px)'
      : microsite.themeCustomization?.bgImageBlur === 'sm'
      ? 'blur(4px)'
      : 'none';
</script>

<div class="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-12 px-4 font-sans">
  {#if bgImg}
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <img
        src={bgImg}
        alt="Latar Belakang"
        referrerPolicy="no-referrer"
        class="w-full h-full object-cover scale-105"
        style={`opacity: ${bgOpacity}; filter: ${bgBlur}`}
      />
      <div class="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/85 via-[var(--color-bg)]/70 to-[var(--color-bg)]/95" />
    </div>
  {/if}

  <ArtisticBackgroundCanvas type={activeAnimation} intensity="subtle" />

  <div class="relative z-10 w-full max-w-lg flex justify-between items-center px-1 mb-8">
    <a
      href="#/"
      class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>INDEX</span>
    </a>

    <div class="flex items-center gap-3">
      <button
        onclick={onCopyLink}
        class="text-xs font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition flex items-center gap-1"
        title="Salin Tautan"
      >
        {#if copied}<Check class="w-3.5 h-3.5 text-emerald-500" />{:else}<Share2 class="w-3.5 h-3.5" />{/if}
        <span class="hidden sm:inline">SHARE</span>
      </button>
      <button
        onclick={onOpenQR}
        class="text-xs font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition flex items-center gap-1"
        title="QR Code"
      >
        <QrCode class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">QR</span>
      </button>
    </div>
  </div>

  <div class="relative z-10 w-full max-w-lg space-y-8">

    <MicrositeHeaderRenderer
      {microsite}
      {onOpenQR}
      {onCopyLink}
      {copied}
    />

    <div class="space-y-3">
      <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] px-1">
        <span>INDEX / BLOCKS</span>
        <span>{(microsite.blocks?.length || microsite.links?.length || 0)} ENTRIES</span>
      </div>

      <MicrositeContentList
        {microsite}
        themeStyle="neutral"
        accentColor="#64748b"
      />
    </div>

    {#if microsite.phone || microsite.email || microsite.address}
      <div class="pt-6 border-t border-[var(--color-border)] space-y-3 text-xs">
        <span class="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] block">
          CONTACT & LOCATION
        </span>

        <div class="grid grid-cols-1 gap-2">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="p-3 rounded-xl border border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-card)] transition text-[var(--color-text)]"
            >
              <span class="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">PHONE</span>
              <span class="font-mono font-medium">{microsite.phone}</span>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="p-3 rounded-xl border border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-card)] transition text-[var(--color-text)]"
            >
              <span class="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">EMAIL</span>
              <span class="font-mono font-medium">{microsite.email}</span>
            </a>
          {/if}

          {#if microsite.address}
            <div class="p-3 rounded-xl border border-[var(--color-border)] space-y-2 text-[var(--color-text)]">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">LOCATION</span>
                {#if microsite.mapUrl}
                  <a
                    href={microsite.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[10px] font-mono text-[var(--color-primary)] hover:underline"
                  >
                    VIEW MAP ➔
                  </a>
                {/if}
              </div>
              <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                {microsite.address}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <MicrositeFooterRenderer
      {microsite}
      {onOpenQR}
      {onCopyLink}
      {copied}
    />

  </div>
</div>
