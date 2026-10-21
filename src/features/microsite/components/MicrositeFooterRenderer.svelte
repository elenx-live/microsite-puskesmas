<!-- @component Renderer footer microsite — 5 gaya footer (card_clean, government_formal, minimal, compact_badge, floating_bar, hidden). -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    ArrowUp,
    Share2,
    QrCode,
    ShieldCheck,
    Award,
    HeartPulse,
    Building2,
    ExternalLink,
    ChevronUp,
    Phone,
    Mail,
    Sparkles,
    Send,
    Check
  } from 'lucide-svelte';
  import BrandIcon from '../../../shared/components/BrandIcon.svelte';
  import { resolveMicrositeLinkUrl } from '../../../shared/utils/siteLinks.js';
  import type {
    MicrositeEntity,
    MicrositeFooterConfig,
    MicrositeFooterStyle
  } from '../../../shared/types/index.js';

  let {
    microsite,
    onOpenQR,
    onCopyLink,
    copied = false
  }: {
    microsite: MicrositeEntity;
    onOpenQR?: () => void;
    onCopyLink?: () => void;
    copied?: boolean;
  } = $props();

  let internalCopied = $state(false);

  const footerConfig: MicrositeFooterConfig =
    microsite.footerConfig ||
    microsite.themeCustomization?.footerConfig ||
    {};

  const style: MicrositeFooterStyle = footerConfig.style || 'card_clean';

  const currentYear = new Date().getFullYear();
  const copyrightText =
    footerConfig.customCopyrightText ||
    `© ${currentYear} ${microsite.name || 'UPTD Puskesmas'}. Hak Cipta Dilindungi.`;

  const tagline =
    footerConfig.customTagline !== undefined
      ? footerConfig.customTagline
      : 'Portal Akses Cepat Informasi & Layanan Kesehatan Masyarakat';

  const showSocial = footerConfig.showSocialLinks ?? true;
  const socialStyle = footerConfig.socialStyle || 'rounded_cards';
  const showBackToTop = footerConfig.showBackToTop ?? true;
  const showShare = footerConfig.showShareButton ?? true;
  const showQR = footerConfig.showQRButton ?? true;
  const showGovBadges = footerConfig.showGovernmentBadges ?? true;
  const badgesList = footerConfig.governmentBadges || ['kemenkes', 'germas', 'akreditasi'];
  const customBadgesText = footerConfig.customBadgesText;
  const showContactSummary = footerConfig.showContactSummary ?? false;
  const links = footerConfig.links || [];
  const alignment = footerConfig.alignment || 'center';

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async () => {
    if (onCopyLink) {
      onCopyLink();
      return;
    }
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: microsite.name,
          text: microsite.description || 'Kunjungi portal microsite layanan resmi Puskesmas',
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        internalCopied = true;
        setTimeout(() => (internalCopied = false), 2000);
      }
    } catch {
      // Ignore user abort
    }
  };

  const isCopied = $derived(copied || internalCopied);

  const social = $derived(microsite.socialMedia);
  const hasSocial = $derived(
    Boolean(social?.instagram || social?.facebook || social?.youtube || social?.whatsapp || social?.twitter || social?.tiktok || social?.linkedin)
  );
</script>

{#snippet socialIcons()}
  {#if showSocial && social && hasSocial}
    {#if socialStyle === 'pills'}
      <div class="flex flex-wrap justify-center items-center gap-2 pt-1 pb-2">
        {#if social.instagram}
          <a href={social.instagram} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 text-xs font-semibold transition shadow-sm" title="Instagram">
            <BrandIcon brand="instagram" class="w-3.5 h-3.5" /><span>Instagram</span>
          </a>
        {/if}
        {#if social.facebook}
          <a href={social.facebook} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition shadow-sm" title="Facebook">
            <BrandIcon brand="facebook" class="w-3.5 h-3.5" /><span>Facebook</span>
          </a>
        {/if}
        {#if social.youtube}
          <a href={social.youtube} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition shadow-sm" title="YouTube">
            <BrandIcon brand="youtube" class="w-3.5 h-3.5" /><span>YouTube</span>
          </a>
        {/if}
        {#if social.whatsapp}
          <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition shadow-sm" title="WhatsApp">
            <Send class="w-3.5 h-3.5" /><span>WhatsApp</span>
          </a>
        {/if}
      </div>
    {:else if socialStyle === 'floating_icons'}
      <div class="flex justify-center items-center gap-3 pt-1 pb-2">
        {#if social.instagram}
          <a href={social.instagram} target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-pink-500 hover:text-white border border-[var(--color-border)] text-pink-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110" title="Instagram">
            <BrandIcon brand="instagram" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.facebook}
          <a href={social.facebook} target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-blue-600 hover:text-white border border-[var(--color-border)] text-blue-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110" title="Facebook">
            <BrandIcon brand="facebook" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.youtube}
          <a href={social.youtube} target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-rose-600 hover:text-white border border-[var(--color-border)] text-rose-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110" title="YouTube">
            <BrandIcon brand="youtube" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.whatsapp}
          <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-emerald-600 hover:text-white border border-[var(--color-border)] text-emerald-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110" title="WhatsApp">
            <Send class="w-4 h-4" />
          </a>
        {/if}
      </div>
    {:else}
      <div class="flex justify-center items-center gap-2.5 pt-1 pb-2">
        {#if social.instagram}
          <a href={social.instagram} target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-pink-500/40 text-[var(--color-muted-foreground)] hover:text-pink-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5" title="Instagram">
            <BrandIcon brand="instagram" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.facebook}
          <a href={social.facebook} target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-blue-500/40 text-[var(--color-muted-foreground)] hover:text-blue-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5" title="Facebook">
            <BrandIcon brand="facebook" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.youtube}
          <a href={social.youtube} target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-rose-500/40 text-[var(--color-muted-foreground)] hover:text-rose-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5" title="YouTube">
            <BrandIcon brand="youtube" class="w-4 h-4" />
          </a>
        {/if}
        {#if social.whatsapp}
          <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-emerald-500/40 text-[var(--color-muted-foreground)] hover:text-emerald-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5" title="WhatsApp">
            <Send class="w-4 h-4" />
          </a>
        {/if}
      </div>
    {/if}
  {/if}
{/snippet}

{#snippet govBadges()}
  {#if showGovBadges}
    <div class="flex flex-wrap items-center justify-center gap-2 py-2">
      {#if badgesList.includes('kemenkes')}
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
          <HeartPulse class="w-3 h-3 text-emerald-400" /><span>Kemenkes RI</span>
        </span>
      {/if}
      {#if badgesList.includes('germas')}
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold">
          <Sparkles class="w-3 h-3 text-teal-400" /><span>GERMAS</span>
        </span>
      {/if}
      {#if badgesList.includes('akreditasi')}
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
          <Award class="w-3 h-3 text-amber-400" /><span>Akreditasi Paripurna</span>
        </span>
      {/if}
      {#if badgesList.includes('puskesmas')}
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
          <Building2 class="w-3 h-3 text-indigo-400" /><span>Puskesmas Resmi</span>
        </span>
      {/if}
      {#if customBadgesText}
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold">
          {customBadgesText}
        </span>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet footerLinks()}
  {#if links && links.length > 0}
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
      {#each links as lnk, idx (lnk.id || idx)}
        <a
          href={resolveMicrositeLinkUrl(lnk.url)}
          target={lnk.isExternal ? '_blank' : '_self'}
          rel={lnk.isExternal ? 'noopener noreferrer' : undefined}
          class="hover:text-[var(--color-primary)] transition hover:underline inline-flex items-center gap-1"
        >
          <span>{lnk.label}</span>
          {#if lnk.isExternal}<ExternalLink class="w-2.5 h-2.5 opacity-60" />{/if}
        </a>
        {#if idx < links.length - 1}<span class="opacity-30">•</span>{/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet actionButtons(compact = false)}
  {#if showBackToTop || showShare || showQR}
    <div class="flex items-center justify-center gap-2 pt-1">
      {#if showBackToTop}
        <button
          type="button"
          onclick={handleScrollToTop}
          class={`inline-flex items-center gap-1.5 ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm group`}
          title="Kembali ke Bagian Atas Halaman"
        >
          <ArrowUp class="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-[var(--color-primary)]" />
          <span class="font-semibold">Ke Atas</span>
        </button>
      {/if}

      {#if showShare}
        <button
          type="button"
          onclick={handleShare}
          class={`inline-flex items-center gap-1.5 ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm`}
          title="Bagikan Tautan Portal Ini"
        >
          {#if isCopied}
            <Check class="w-3.5 h-3.5 text-emerald-400" />
            <span class="font-semibold text-emerald-400">Tersalin!</span>
          {:else}
            <Share2 class="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span class="font-semibold">Bagikan</span>
          {/if}
        </button>
      {/if}

      {#if showQR && onOpenQR}
        <button
          type="button"
          onclick={onOpenQR}
          class={`inline-flex items-center gap-1.5 ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm`}
          title="Buka QR Code untuk Pemindaian Smartphone"
        >
          <QrCode class="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span class="font-semibold">Kode QR</span>
        </button>
      {/if}
    </div>
  {/if}
{/snippet}

{#if style !== 'hidden'}
  {#if style === 'minimal'}
    <div class={`pt-6 pb-10 space-y-3 ${alignment === 'left' ? 'text-left' : 'text-center'}`}>
      {@render socialIcons()}
      {@render govBadges()}
      {@render footerLinks()}
      {@render actionButtons(true)}

      <div class="pt-2 text-[11px] text-[var(--color-muted-foreground)] space-y-0.5">
        <p class="font-semibold text-[var(--color-text)] opacity-90">{copyrightText}</p>
        {#if tagline}<p class="text-[10px] opacity-75 leading-relaxed">{tagline}</p>{/if}
      </div>
    </div>
  {:else if style === 'government_formal'}
    <div
      in:fade={{ duration: 400 }}
      class="mt-6 mb-8 p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/90 border border-emerald-500/20 backdrop-blur-xl shadow-xl space-y-4"
    >
      <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-3.5">
        <div class="flex items-center gap-2.5">
          {#if microsite.logoUrl}
            <img
              src={microsite.logoUrl}
              alt="Logo"
              referrerPolicy="no-referrer"
              class="w-8 h-8 rounded-lg object-cover bg-white p-0.5 border border-emerald-500/30"
            />
          {:else}
            <div class="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <HeartPulse class="w-4 h-4" />
            </div>
          {/if}
          <div>
            <p class="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <span>{microsite.name || 'UPTD Puskesmas'}</span>
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 inline" />
            </p>
            <p class="text-[10px] text-[var(--color-muted-foreground)]">Pemerintah Kabupaten / Kota • Dinas Kesehatan</p>
          </div>
        </div>

        <div class="hidden sm:flex items-center gap-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            RESMI
          </span>
        </div>
      </div>

      {@render govBadges()}

      {#if showContactSummary && (microsite.phone || microsite.email || microsite.address)}
        <div class="p-3 rounded-2xl bg-[var(--color-bg)]/60 border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {#if microsite.phone}
            <div class="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <Phone class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span class="truncate">{microsite.phone}</span>
            </div>
          {/if}
          {#if microsite.email}
            <div class="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <Mail class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span class="truncate">{microsite.email}</span>
            </div>
          {/if}
        </div>
      {/if}

      {@render socialIcons()}
      {@render footerLinks()}
      {@render actionButtons()}

      <div class="pt-3 border-t border-[var(--color-border)] text-center text-[10px] text-[var(--color-muted-foreground)] space-y-1">
        <p class="font-semibold text-[var(--color-text)]">{copyrightText}</p>
        {#if tagline}<p class="opacity-80 italic">"{tagline}"</p>{/if}
        <p class="opacity-60 text-[9px]">Sistem Portal Informasi Cepat Pelayanan Kesehatan Terpadu</p>
      </div>
    </div>
  {:else if style === 'compact_badge'}
    <div class="pt-4 pb-8 flex flex-col items-center space-y-3">
      {@render socialIcons()}
      {@render footerLinks()}

      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-card)]/90 border border-[var(--color-border)] backdrop-blur-xl shadow-lg">
        <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <HeartPulse class="w-3.5 h-3.5" />
        </div>
        <div class="text-left pr-1">
          <p class="text-[11px] font-bold text-[var(--color-text)] leading-tight">{microsite.name || 'UPTD Puskesmas'}</p>
          <p class="text-[9px] text-[var(--color-muted-foreground)]">Portal Cepat Puskesmas</p>
        </div>

        <div class="h-4 w-px bg-[var(--color-border)]" />

        <div class="flex items-center gap-1">
          {#if showBackToTop}
            <button
              type="button"
              onclick={handleScrollToTop}
              class="p-1.5 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
              title="Ke Atas"
            aria-label="Ke Atas"
            >
              <ChevronUp class="w-3.5 h-3.5" />
            </button>
          {/if}
          {#if showShare}
            <button
              type="button"
              onclick={handleShare}
              class="p-1.5 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
              title="Bagikan"
            >
              {#if isCopied}<Check class="w-3.5 h-3.5 text-emerald-400" />{:else}<Share2 class="w-3.5 h-3.5" />{/if}
            </button>
          {/if}
        </div>
      </div>

      <p class="text-[10px] text-[var(--color-muted-foreground)] opacity-75">{copyrightText}</p>
    </div>
  {:else if style === 'floating_bar'}
    <div class="pt-6 pb-12 space-y-4">
      {@render socialIcons()}
      {@render govBadges()}
      {@render footerLinks()}

      <div class="text-center text-[11px] text-[var(--color-muted-foreground)] space-y-0.5">
        <p class="font-semibold text-[var(--color-text)]">{copyrightText}</p>
        {#if tagline}<p class="text-[10px] opacity-75">{tagline}</p>{/if}
      </div>

      <div class="p-2 rounded-2xl bg-[var(--color-card)]/95 border border-[var(--color-border)] backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-2 max-w-sm mx-auto">
        <div class="flex items-center gap-2 pl-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span class="text-[11px] font-bold text-[var(--color-text)]">Portal Siap Diakses</span>
        </div>

        <div class="flex items-center gap-1">
          {#if showQR && onOpenQR}
            <button
              type="button"
              onclick={onOpenQR}
              class="p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition border border-[var(--color-border)]"
              title="Tampilkan Kode QR"
            aria-label="Tampilkan Kode QR"
            >
              <QrCode class="w-4 h-4" />
            </button>
          {/if}

          {#if showShare}
            <button
              type="button"
              onclick={handleShare}
              class="p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition border border-[var(--color-border)]"
              title="Bagikan Tautan"
            >
              {#if isCopied}<Check class="w-4 h-4 text-emerald-400" />{:else}<Share2 class="w-4 h-4" />{/if}
            </button>
          {/if}

          {#if showBackToTop}
            <button
              type="button"
              onclick={handleScrollToTop}
              class="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md"
              title="Kembali ke Atas"
            aria-label="Kembali ke Atas"
            >
              <ChevronUp class="w-4 h-4" />
            </button>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- DEFAULT: CARD CLEAN -->
    <div
      in:fade={{ duration: 400 }}
      class={`mt-6 mb-8 p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-xl shadow-lg space-y-3.5 ${
        alignment === 'left' ? 'text-left' : 'text-center'
      }`}
    >
      {@render socialIcons()}
      {@render govBadges()}
      {@render footerLinks()}
      {@render actionButtons()}

      <div class="pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] space-y-1">
        <p class="font-bold text-[var(--color-text)] text-[11px]">{copyrightText}</p>
        {#if tagline}<p class="text-[10px] opacity-80 leading-relaxed">{tagline}</p>{/if}
      </div>
    </div>
  {/if}
{/if}
