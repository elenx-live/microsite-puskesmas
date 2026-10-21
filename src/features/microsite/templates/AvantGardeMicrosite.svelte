<!-- @component Template microsite "Avant-Garde" — nuansa cyber futuristik telemetry cyan & dark. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    Globe,
    ArrowLeft,
    Phone,
    Mail,
    QrCode,
    Share2,
    Check,
    Send,
    Radio
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
    activeAnimation = 'geometric_waves'
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

<div class="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-10 px-4 font-sans">
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

  <ArtisticBackgroundCanvas type={activeAnimation} intensity="medium" />

  <div class="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

  <div class="relative z-10 w-full max-w-xl flex justify-between items-center px-2 mb-6">
    <a
      href="#/"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-[11px] font-mono font-bold text-cyan-400 backdrop-blur-md transition shadow-md"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>[SYS: BACK_TO_ROOT]</span>
    </a>

    <div class="flex items-center gap-2">
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${window.location.href}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5 transition backdrop-blur-md"
      >
        <Send class="w-3.5 h-3.5" />
        <span>TRANSMIT_WA</span>
      </a>
      <button
        onclick={onCopyLink}
        class="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 backdrop-blur-md transition"
        title="Copy Endpoint URL"
      >
        {#if copied}<Check class="w-4 h-4 text-emerald-400" />{:else}<Share2 class="w-4 h-4" />{/if}
      </button>
      <button
        onclick={onOpenQR}
        class="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 backdrop-blur-md transition"
        title="Scan Matrix QR"
            aria-label="Scan Matrix QR"
      >
        <QrCode class="w-4 h-4" />
      </button>
    </div>
  </div>

  <div class="relative z-10 w-full max-w-xl space-y-6">

    <MicrositeHeaderRenderer
      {microsite}
      {onOpenQR}
      {onCopyLink}
      {copied}
    />

    <div class="space-y-2.5">
      <div class="flex items-center justify-between px-1 font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
        <span>[AVAILABLE_ACTION_ENDPOINTS]</span>
        <span>COUNT: {(microsite.blocks?.length || microsite.links?.length || 0)}</span>
      </div>

      <MicrositeContentList
        {microsite}
        themeStyle="cyan"
        accentColor="#06b6d4"
      />
    </div>

    {#if microsite.phone || microsite.email || microsite.address}
      <div
        in:fade={{ duration: 400, delay: 200 }}
        class="p-5 rounded-2xl bg-[var(--color-card)]/85 backdrop-blur-xl border border-cyan-500/30 space-y-3"
      >
        <div class="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Radio class="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>[COMMS_&_COORDINATES]</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-2.5 transition text-[var(--color-text)]"
            >
              <Phone class="w-4 h-4 text-cyan-400 shrink-0" />
              <div class="min-w-0 flex-1 truncate">
                <p class="text-[9px] text-cyan-400">TEL_LINE</p>
                <p class="font-bold truncate">{microsite.phone}</p>
              </div>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-2.5 transition text-[var(--color-text)]"
            >
              <Mail class="w-4 h-4 text-cyan-400 shrink-0" />
              <div class="min-w-0 flex-1 truncate">
                <p class="text-[9px] text-cyan-400">SMTP_MAIL</p>
                <p class="font-bold truncate">{microsite.email}</p>
              </div>
            </a>
          {/if}
        </div>

        {#if microsite.address}
          <div class="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono">
            <p class="text-[9px] text-cyan-400">PHYSICAL_GEO_LOCATION</p>
            <p class="text-xs text-[var(--color-text)] mt-0.5">{microsite.address}</p>
            {#if microsite.mapUrl}
              <a
                href={microsite.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-bold transition"
              >
                <Globe class="w-3 h-3" />
                <span>LAUNCH_MAPS_GPS</span>
              </a>
            {/if}
          </div>
        {/if}
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
