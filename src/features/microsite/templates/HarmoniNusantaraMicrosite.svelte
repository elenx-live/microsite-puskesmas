<!-- @component Template microsite "Harmoni Nusantara" — kearifan etnik & batik hangat amber. -->
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
    Send,
    Building2
  } from 'lucide-svelte';
  import type { MicrositeEntity, BackgroundAnimationType } from '../../../shared/types/index.js';
  import { generateSmartShareUrl } from '../../../shared/utils/shareUtils.js';
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
    activeAnimation = 'golden_radiance'
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

  <ArtisticBackgroundCanvas type={activeAnimation} intensity="medium" />

  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-amber-600/15 via-orange-600/10 to-transparent blur-xl pointer-events-none -z-10" />

  <div class="relative z-10 w-full max-w-lg flex justify-between items-center px-2 mb-6">
    <a
      href="/"
      class="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-xs font-semibold text-amber-200 backdrop-blur-sm transition shadow-md"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>Beranda Utama</span>
    </a>

    <div class="flex items-center gap-2">
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${microsite.description ? microsite.description + '\n\n' : ''}${generateSmartShareUrl({
          title: microsite.name,
          description: microsite.description,
          imageUrl: microsite.ogImageUrl || microsite.profileImageUrl || microsite.logoUrl,
          targetPath: `/m/${microsite.slug}`
        })}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        class="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-sm"
        title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Bagikan</span>
      </a>
      <button
        onclick={onCopyLink}
        class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-amber-300 backdrop-blur-sm transition shadow-sm"
        title="Salin Tautan"
      >
        {#if copied}<Check class="w-4 h-4 text-emerald-400" />{:else}<Share2 class="w-4 h-4" />{/if}
      </button>
      <button
        onclick={onOpenQR}
        class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-amber-300 backdrop-blur-sm transition shadow-sm"
        title="Pindai QR"
            aria-label="Pindai QR"
      >
        <QrCode class="w-4 h-4 text-amber-400" />
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
        themeStyle="amber"
        accentColor="#f59e0b"
      />
    </div>

    {#if microsite.phone || microsite.email || microsite.address}
      <div
        in:fade={{ duration: 400, delay: 200 }}
        class="p-6 rounded-3xl bg-[var(--color-card)]/85 backdrop-blur-sm border border-amber-500/25 space-y-4 shadow-xl"
      >
        <h4 class="text-xs font-bold uppercase tracking-widest text-amber-300 text-center flex items-center justify-center gap-2">
          <Building2 class="w-4 h-4" />
          <span>Akses Kontak & Lokasi Posko</span>
        </h4>

        <div class="space-y-2.5 text-xs">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition text-[var(--color-text)]"
            >
              <Phone class="w-4 h-4 text-amber-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-amber-400/80">Telepon</p>
                <p class="font-bold truncate">{microsite.phone}</p>
              </div>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition text-[var(--color-text)]"
            >
              <Mail class="w-4 h-4 text-amber-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-amber-400/80">Email</p>
                <p class="font-bold truncate">{microsite.email}</p>
              </div>
            </a>
          {/if}

          {#if microsite.address}
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[var(--color-text)]">
              <MapPin class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-[10px] uppercase font-bold text-amber-400/80">Alamat</p>
                <p class="text-xs leading-relaxed mt-0.5">{microsite.address}</p>
                {#if microsite.mapUrl}
                  <a
                    href={microsite.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-md transition"
                  >
                    <Globe class="w-3.5 h-3.5" />
                    <span>Peta Google Maps</span>
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
