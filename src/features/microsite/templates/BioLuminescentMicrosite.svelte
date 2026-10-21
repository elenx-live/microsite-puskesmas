<!-- @component Template microsite "Bio-Luminescent" — pendaran hayati teal & cyan segar. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    Globe,
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    QrCode,
    Share2,
    Check,
    Send
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
    activeAnimation = 'bioluminescent'
  }: {
    microsite: MicrositeEntity;
    isPreviewMode?: boolean;
    onOpenQR: () => void;
    onCopyLink: () => void;
    copied: boolean;
    activeAnimation?: BackgroundAnimationType;
  } = $props();

  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 25) / 100;
  const bgBlur =
    microsite.themeCustomization?.bgImageBlur === 'lg'
      ? 'blur(16px)'
      : microsite.themeCustomization?.bgImageBlur === 'md'
      ? 'blur(8px)'
      : microsite.themeCustomization?.bgImageBlur === 'sm'
      ? 'blur(4px)'
      : 'none';
</script>

<div class="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-10 px-4">
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

  <ArtisticBackgroundCanvas type={activeAnimation} intensity="vibrant" />

  <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[400px] bg-teal-500/20 rounded-full blur-[110px] pointer-events-none -z-10 animate-pulse" />
  <div class="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />

  <div class="relative z-10 w-full max-w-lg flex justify-between items-center px-2 mb-6">
    <a
      href="/"
      class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-xs font-semibold text-teal-300 backdrop-blur-md transition shadow-lg shadow-teal-950/20"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>Beranda</span>
    </a>

    <div class="flex items-center gap-2">
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${window.location.href}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        class="px-3.5 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-md shadow-lg shadow-emerald-950/20"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Bagikan</span>
      </a>
      <button
        onclick={onCopyLink}
        class="p-2.5 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-teal-300 backdrop-blur-md transition shadow-md"
        title="Salin Tautan"
      >
        {#if copied}<Check class="w-4 h-4 text-emerald-400" />{:else}<Share2 class="w-4 h-4" />{/if}
      </button>
      <button
        onclick={onOpenQR}
        class="p-2.5 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-teal-300 backdrop-blur-md transition shadow-md"
        title="Pindai QR"
            aria-label="Pindai QR"
      >
        <QrCode class="w-4 h-4 text-teal-300" />
      </button>
    </div>
  </div>

  <div class="relative z-10 w-full max-w-lg space-y-6">

    <MicrositeHeaderRenderer
      {microsite}
      {onOpenQR}
      {onCopyLink}
      {copied}
    />

    <div class="space-y-3">
      <MicrositeContentList
        {microsite}
        themeStyle="teal"
        accentColor="#14b8a6"
      />
    </div>

    {#if microsite.phone || microsite.email || microsite.address}
      <div
        in:fade={{ duration: 400, delay: 200 }}
        class="p-6 rounded-[2rem] bg-[var(--color-card)]/80 backdrop-blur-xl border border-teal-500/25 space-y-4 shadow-xl shadow-teal-950/20"
      >
        <h4 class="text-xs font-bold uppercase tracking-widest text-teal-300 text-center">
          Layanan & Akses Posko
        </h4>

        <div class="space-y-2.5 text-xs">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition text-[var(--color-text)]"
            >
              <Phone class="w-4 h-4 text-teal-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-teal-400/80">Hotline Pelayanan</p>
                <p class="font-bold truncate">{microsite.phone}</p>
              </div>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition text-[var(--color-text)]"
            >
              <Mail class="w-4 h-4 text-teal-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-teal-400/80">Email Koordinator</p>
                <p class="font-bold truncate">{microsite.email}</p>
              </div>
            </a>
          {/if}

          {#if microsite.address}
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[var(--color-text)]">
              <MapPin class="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-[10px] uppercase font-bold text-teal-400/80">Lokasi Kegiatan</p>
                <p class="text-xs leading-relaxed mt-0.5">{microsite.address}</p>
                {#if microsite.mapUrl}
                  <a
                    href={microsite.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow-md transition"
                  >
                    <Globe class="w-3 h-3" />
                    <span>Buka di Peta</span>
                  </a>
                {/if}
              </div>
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
