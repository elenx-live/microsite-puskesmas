<!-- @component Template microsite "Grand Majestic" — kemegahan emerald & aksen emas (default). -->
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
    Sparkles,
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
    activeAnimation = 'aurora_flow'
  }: {
    microsite: MicrositeEntity;
    isPreviewMode?: boolean;
    onOpenQR: () => void;
    onCopyLink: () => void;
    copied: boolean;
    activeAnimation?: BackgroundAnimationType;
  } = $props();

  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 30) / 100;
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

  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-amber-500/10 to-transparent blur-xl pointer-events-none -z-10" />

  <div class="relative z-10 w-full max-w-xl flex justify-between items-center px-2 mb-6">
    <a
      href="/"
      class="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] backdrop-blur-sm transition shadow-sm"
    >
      <ArrowLeft class="w-3.5 h-3.5 text-[var(--color-primary)]" />
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
        class="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-sm"
        title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Bagikan</span>
      </a>
      <button
        onclick={onCopyLink}
        class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur-sm transition shadow-sm"
        title="Salin Tautan"
      >
        {#if copied}<Check class="w-4 h-4 text-emerald-400" />{:else}<Share2 class="w-4 h-4" />{/if}
      </button>
      <button
        onclick={onOpenQR}
        class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur-sm transition shadow-sm"
        title="Tampilkan QR Code"
            aria-label="Tampilkan QR Code"
      >
        <QrCode class="w-4 h-4 text-amber-400" />
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

    <div class="space-y-3">
      <div class="flex items-center justify-between px-2">
        <h3 class="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-amber-400" />
          <span>Menu & Tautan Resmi</span>
        </h3>
        <span class="text-[10px] font-mono text-[var(--color-muted-foreground)]">
          {(microsite.blocks?.length || microsite.links?.length || 0)} Konten
        </span>
      </div>

      <MicrositeContentList
        {microsite}
        themeStyle="emerald"
        accentColor="#10b981"
      />
    </div>

    {#if microsite.phone || microsite.email || microsite.address}
      <div
        in:fade={{ duration: 400, delay: 200 }}
        class="p-6 rounded-3xl bg-[var(--color-card)]/80 backdrop-blur-sm border border-[var(--color-border)] space-y-4 shadow-lg"
      >
        <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h4 class="text-xs font-bold uppercase tracking-widest text-[var(--color-text)] flex items-center gap-2">
            <Building2 class="w-4 h-4 text-emerald-400" />
            <span>Posko & Informasi Kontak</span>
          </h4>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            Aktif
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="p-3 rounded-2xl bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-3 transition group"
            >
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Phone class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Hotline</p>
                <p class="font-bold text-[var(--color-text)] truncate">{microsite.phone}</p>
              </div>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="p-3 rounded-2xl bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-3 transition group"
            >
              <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Email</p>
                <p class="font-bold text-[var(--color-text)] truncate">{microsite.email}</p>
              </div>
            </a>
          {/if}
        </div>

        {#if microsite.address}
          <div class="p-3.5 rounded-2xl bg-[var(--color-bg)]/60 border border-[var(--color-border)] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Alamat Posko / Pelayanan</p>
              <p class="text-xs text-[var(--color-text)] leading-relaxed mt-0.5">{microsite.address}</p>
              {#if microsite.mapUrl}
                <a
                  href={microsite.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md transition"
                >
                  <Globe class="w-3.5 h-3.5" />
                  <span>Petunjuk Arah Google Maps</span>
                </a>
              {/if}
            </div>
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
