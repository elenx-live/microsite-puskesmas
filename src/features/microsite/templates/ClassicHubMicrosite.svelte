<!-- @component Template microsite "Classic Hub" — tampilan kartu standar bio-link cepat dengan beberapa preset tone warna. -->
<script lang="ts">
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
  import { MICROSITE_THEMES } from '../../../shared/themes/micrositeThemes.js';
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
    activeAnimation = 'none'
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

  const theme = microsite.themeCustomization?.theme || 'emerald';
  const buttonStyle = microsite.themeCustomization?.buttonStyle || 'rounded';

  // CSS Styles based on themes
  const themeStyles: Record<string, { bg: string; card: string; text: string; subText: string; btn: string }> = {
    emerald: {
      bg: 'bg-gradient-to-b from-[#064e3b]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    sky: {
      bg: 'bg-gradient-to-b from-[#0c4a6e]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-sky-600 hover:bg-sky-500 text-white'
    },
    rose: {
      bg: 'bg-gradient-to-b from-[#881337]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
    neutral: {
      bg: 'bg-gradient-to-b from-zinc-900/40 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)] border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-[var(--color-surface)] hover:bg-zinc-700 text-[var(--color-text)]'
    },
    light: {
      bg: 'bg-gradient-to-b from-slate-100 to-slate-50',
      card: 'bg-white border-slate-200 shadow-md',
      text: 'text-slate-900',
      subText: 'text-slate-500',
      btn: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    dark: {
      bg: 'bg-black',
      card: 'bg-zinc-950 border-amber-500/20 shadow-amber-500/10',
      text: 'text-amber-100',
      subText: 'text-zinc-400',
      btn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold'
    }
  };

  // 20 tema baru (registry): gaya token penuh. Kartu/teks sudah memakai
  // var(--color-*) dari wrapper halaman; gradasi & tombol mengikuti primer.
  // String kelas di bawah literal di source agar Tailwind tetap men-generate.
  const newThemeStyle = {
    bg: 'bg-gradient-to-b from-[var(--color-primary)]/30 to-[var(--color-bg)]',
    card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
    text: 'text-[var(--color-text)]',
    subText: 'text-[var(--color-muted-foreground)]',
    btn: 'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)]'
  };
  for (const t of MICROSITE_THEMES) themeStyles[t.id] = newThemeStyle;

  const currentStyle = themeStyles[theme] || themeStyles.emerald;

  const buttonRadius = {
    sharp: 'rounded-none',
    rounded: 'rounded-2xl',
    pill: 'rounded-full'
  }[buttonStyle] || 'rounded-2xl';

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${microsite.name}\n${microsite.description ? microsite.description + '\n\n' : ''}${generateSmartShareUrl({
      title: microsite.name,
      description: microsite.description,
      imageUrl: microsite.ogImageUrl || microsite.profileImageUrl || microsite.logoUrl,
      targetPath: `/m/${microsite.slug}`
    })}`
  )}`;
</script>

<div class={`relative min-h-screen ${currentStyle.bg} flex flex-col items-center py-10 px-4 space-y-6 overflow-hidden`}>
  <!-- Background Image Layer -->
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

  <!-- Background Canvas -->
  {#if activeAnimation !== 'none'}
    <ArtisticBackgroundCanvas type={activeAnimation} intensity="subtle" />
  {/if}

  <!-- Top Bar -->
  <div class="relative z-10 w-full max-w-lg flex justify-between items-center px-2">
    <a
      href="/"
      class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Website Utama</span>
    </a>

    <div class="flex items-center gap-2">
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-2 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-semibold flex items-center gap-1.5 transition"
        title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Bagikan ke WA</span>
      </a>
      <button
        type="button"
        onclick={onCopyLink}
        class="p-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition"
        title="Salin Tautan"
      >
        {#if copied}
          <Check class="w-4 h-4 text-[var(--color-primary)]" />
        {:else}
          <Share2 class="w-4 h-4" />
        {/if}
      </button>
      <button
        type="button"
        onclick={onOpenQR}
        class="p-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition"
        title="Tampilkan QR"
            aria-label="Tampilkan QR"
      >
        <QrCode class="w-4 h-4" />
      </button>
    </div>
  </div>

  <div class="relative z-10 w-full max-w-lg space-y-6">

    <!-- Dynamic Multi-Style Header -->
    <MicrositeHeaderRenderer
      microsite={microsite}
      onOpenQR={onOpenQR}
      onCopyLink={onCopyLink}
      copied={copied}
    />

    <!-- Link / Content Blocks List -->
    <div class="space-y-3">
      <MicrositeContentList
        microsite={microsite}
        themeStyle="emerald"
        accentColor="#10b981"
      />
    </div>

    <!-- Contact and Operational Information -->
    {#if microsite.phone || microsite.email || microsite.address}
      <div class={`p-6 border ${currentStyle.card} rounded-3xl space-y-4 backdrop-blur-sm`}>
        <h4 class={`text-xs font-bold uppercase tracking-widest text-center ${currentStyle.text}`}>Hubungi Kami</h4>

        <div class="space-y-3 text-xs">
          {#if microsite.phone}
            <a
              href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
              class="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface)]/20 transition text-[var(--color-text)]"
            >
              <Phone class="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Telepon Hub</p>
                <p class="font-bold truncate">{microsite.phone}</p>
              </div>
              <span class="text-[10px] text-[var(--color-primary)] font-semibold font-mono">TELP</span>
            </a>
          {/if}

          {#if microsite.email}
            <a
              href={`mailto:${microsite.email}`}
              class="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface)]/20 transition text-[var(--color-text)]"
            >
              <Mail class="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Surat Elektronik</p>
                <p class="font-bold truncate">{microsite.email}</p>
              </div>
              <span class="text-[10px] text-[var(--color-primary)] font-semibold font-mono">EMAIL</span>
            </a>
          {/if}

          {#if microsite.address}
            <div class="flex items-start gap-3 p-3 rounded-2xl text-[var(--color-text)]">
              <MapPin class="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Lokasi & Posko</p>
                <p class="leading-relaxed text-xs">{microsite.address}</p>

                {#if microsite.mapUrl}
                  <a
                    href={microsite.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] font-bold rounded-xl transition"
                  >
                    <Globe class="w-3.5 h-3.5" />
                    <span>Lihat Peta Lokasi</span>
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Dynamic Customizable Footer -->
    <MicrositeFooterRenderer
      microsite={microsite}
      onOpenQR={onOpenQR}
      onCopyLink={onCopyLink}
      copied={copied}
    />

  </div>
</div>
