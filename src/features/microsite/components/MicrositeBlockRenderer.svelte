<!-- @component Renderer satu blok konten microsite — 13 tipe blok (heading, teks, pengumuman, gambar, video, whatsapp, telepon, email, lokasi, unduh, divider, spacer, QR). -->
<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import {
    ChevronRight,
    Flame,
    ArrowUpRight,
    MessageCircle,
    Phone,
    Mail,
    MapPin,
    Download,
    Megaphone,
    Play,
    Navigation,
    QrCode,
    Info
  } from 'lucide-svelte';
  import type { MicrositeBlock } from '../../../shared/types/index.js';
  import MicrositeIcon from './MicrositeIcon.svelte';
  import { resolveMicrositeLinkUrl } from '../../../shared/utils/siteLinks.js';
  import { micrositeService } from '../../../shared/services/micrositeService.js';

  let {
    block,
    index,
    micrositeId,
    themeStyle = 'emerald',
    accentColor = '#10b981'
  }: {
    block: MicrositeBlock;
    index: number;
    micrositeId: string;
    themeStyle?: string;
    accentColor?: string;
  } = $props();

  const isActive = micrositeService.isBlockScheduledActive(block);

  const handleClick = () => {
    micrositeService.recordAnalyticsEvent(micrositeId, 'link_click', undefined, block.id);
  };

  function getYouTubeEmbedUrl(urlOrId?: string): string | null {
    if (!urlOrId) return null;
    const str = urlOrId.trim();
    if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
      return `https://www.youtube-nocookie.com/embed/${str}`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube-nocookie.com/embed/${match[2]}`;
    }
    return null;
  }

  const telUrl = $derived(`tel:${(block.url || block.content || '').replace(/[^0-9+]/g, '')}`);
  const mailtoUrl = $derived(`mailto:${block.url || block.content || ''}`);
  const mapHref = $derived(block.url || `https://maps.google.com/?q=${encodeURIComponent(block.content || block.title || '')}`);
  const waUrl = $derived(micrositeService.formatWhatsAppUrl(block.whatsappNumber || block.url || '', block.whatsappMessage));
  const isClickableImage = $derived(block.type === 'image_link' && !!block.url);
  const embedUrl = $derived(block.type === 'video' ? getYouTubeEmbedUrl(block.url || block.content) : null);
  const qrImg = $derived(
    block.type === 'qr_code'
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(block.url || (typeof window !== 'undefined' ? window.location.href : ''))}`
      : ''
  );
  const spacerHeightClass = $derived(
    block.customStyle?.spacerHeight === 'sm' ? 'h-3' :
    block.customStyle?.spacerHeight === 'lg' ? 'h-8' :
    block.customStyle?.spacerHeight === 'xl' ? 'h-12' : 'h-5'
  );
  const isExternalLink = $derived(block.url?.startsWith('http') || block.url?.startsWith('tel:') || block.url?.startsWith('mailto:'));
  const isFeatured = block.isFeatured;
  const anim = { y: 15, duration: 300, delay: index * 30 };
</script>

{#if isActive}
  {#if block.type === 'heading'}
    <div in:fly={{ ...anim, y: 8 }} class="pt-4 pb-1.5">
      <div class="flex items-center gap-2">
        {#if block.icon}
          <div class="w-5 h-5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
            <MicrositeIcon iconName={block.icon} className="w-3.5 h-3.5" />
          </div>
        {/if}
        <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text)] opacity-90">
          {block.title}
        </h3>
      </div>
      {#if block.subtitle}
        <p class="text-[11px] text-[var(--color-muted-foreground)] mt-0.5 ml-0.5">
          {block.subtitle}
        </p>
      {/if}
    </div>
  {:else if block.type === 'text'}
    <div
      in:fly={anim}
      class="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-sm space-y-1.5 text-left"
    >
      {#if block.title}
        <h4 class="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
          <Info class="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>{block.title}</span>
        </h4>
      {/if}
      {#if block.content}
        <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-line">
          {block.content}
        </p>
      {/if}
    </div>
  {:else if block.type === 'announcement'}
    <div
      in:scale={{ duration: 300, delay: index * 30, start: 0.98 }}
      class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/40 backdrop-blur-md shadow-md space-y-2 relative overflow-hidden"
    >
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5 animate-pulse">
          <Megaphone class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-black uppercase tracking-wider text-amber-400">
              {block.title || 'Pengumuman Penting'}
            </span>
            {#if block.badgeText}
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                {block.badgeText}
              </span>
            {/if}
          </div>
          {#if block.content}
            <p class="text-xs text-[var(--color-text)] mt-1 leading-relaxed">
              {block.content}
            </p>
          {/if}
        </div>
      </div>

      {#if block.url}
        <a
          href={resolveMicrositeLinkUrl(block.url)}
          target="_blank"
          rel="noopener noreferrer"
          onclick={handleClick}
          class="mt-2 block w-full py-2 px-3 text-center text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
        >
          {block.subtitle || 'Lihat Informasi Selengkapnya'} →
        </a>
      {/if}
    </div>
  {:else if block.type === 'image' || block.type === 'image_link'}
    {#snippet imageElem()}
      <div class="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md group">
        <img
          src={block.thumbnailUrl || block.url}
          alt={block.title || 'Banner'}
          referrerPolicy="no-referrer"
          class={`w-full max-h-56 object-cover ${isClickableImage ? 'group-hover:scale-105 transition-transform duration-500' : ''}`}
        />
        {#if block.title || block.subtitle}
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white text-left">
            {#if block.title}<h4 class="text-xs sm:text-sm font-bold">{block.title}</h4>{/if}
            {#if block.subtitle}<p class="text-[10px] text-white/80">{block.subtitle}</p>{/if}
          </div>
        {/if}
      </div>
    {/snippet}
    <div in:fly={anim}>
      {#if isClickableImage}
        <a href={resolveMicrositeLinkUrl(block.url)} target="_blank" rel="noopener noreferrer" onclick={handleClick} class="block">
          {@render imageElem()}
        </a>
      {:else}
        {@render imageElem()}
      {/if}
    </div>
  {:else if block.type === 'video'}
    <div
      in:fly={anim}
      class="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] shadow-md p-1.5"
    >
      {#if block.title}
        <div class="px-3 py-2 text-left">
          <h4 class="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <Play class="w-3.5 h-3.5 text-rose-500" />
            <span>{block.title}</span>
          </h4>
          {#if block.subtitle}
            <p class="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{block.subtitle}</p>
          {/if}
        </div>
      {/if}
      <div class="relative aspect-video rounded-xl overflow-hidden bg-black">
        {#if embedUrl}
          <iframe
            src={embedUrl}
            title={block.title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="w-full h-full border-0"
          ></iframe>
        {:else}
          <div class="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs p-4 text-center">
            <Play class="w-8 h-8 mb-2 opacity-50" />
            <span>URL Video YouTube Tidak Valid</span>
          </div>
        {/if}
      </div>
    </div>
  {:else if block.type === 'whatsapp'}
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onclick={handleClick}
      in:fly={anim}
      class="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-green-600/30 hover:from-emerald-600/40 hover:to-green-600/40 border border-emerald-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
    >
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/20">
          <MessageCircle class="w-5 h-5 fill-current" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-emerald-400 transition truncate">
              {block.title || 'Chat WhatsApp Petugas'}
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ONLINE
            </span>
          </div>
          <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
            {block.subtitle || 'Konsultasi cepat via WhatsApp resmi'}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1 text-emerald-400 shrink-0 pl-2">
        <ArrowUpRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  {:else if block.type === 'phone'}
    <a
      href={telUrl}
      onclick={handleClick}
      in:fly={anim}
      class="p-4 rounded-2xl bg-gradient-to-r from-rose-600/25 to-red-600/25 hover:from-rose-600/35 hover:to-red-600/35 border border-rose-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
    >
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-rose-500/20 animate-pulse">
          <Phone class="w-5 h-5 fill-current" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-rose-400 transition truncate">
              {block.title || 'Hotline Panggilan Darurat'}
            </span>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white uppercase">
              24 JAM
            </span>
          </div>
          <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
            {block.subtitle || block.url || 'Panggilan cepat tim medis'}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1 text-rose-400 shrink-0 pl-2">
        <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  {:else if block.type === 'email'}
    <a
      href={mailtoUrl}
      onclick={handleClick}
      in:fly={anim}
      class="p-4 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-sky-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
    >
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Mail class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <span class="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-sky-400 transition truncate block">
            {block.title || 'Surat & Email Resmi'}
          </span>
          <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5 font-mono">
            {block.subtitle || block.url}
          </p>
        </div>
      </div>
      <ChevronRight class="w-4 h-4 text-sky-400 transition-transform group-hover:translate-x-1" />
    </a>
  {:else if block.type === 'location'}
    <div
      in:fly={anim}
      class="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-md space-y-2.5 text-left"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
          <MapPin class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="font-bold text-xs sm:text-sm text-[var(--color-text)]">
            {block.title || 'Alamat & Lokasi Fasilitas'}
          </h4>
          <p class="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
            {block.content || block.subtitle || 'Jl. Raya Manding, Sumenep, Jawa Timur'}
          </p>
        </div>
      </div>
      <a
        href={mapHref}
        target="_blank"
        rel="noopener noreferrer"
        onclick={handleClick}
        class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
      >
        <Navigation class="w-3.5 h-3.5" />
        <span>Buka Petunjuk Arah Google Maps</span>
      </a>
    </div>
  {:else if block.type === 'download'}
    <a
      href={block.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      download
      onclick={handleClick}
      in:fly={anim}
      class="p-4 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
    >
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Download class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-purple-400 transition truncate">
              {block.title || 'Unduh Dokumen PDF'}
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              {block.fileFormat || 'PDF'} {block.fileSize ? `• ${block.fileSize}` : ''}
            </span>
          </div>
          {#if block.subtitle}
            <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {block.subtitle}
            </p>
          {/if}
        </div>
      </div>
      <div class="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
        <Download class="w-4 h-4" />
      </div>
    </a>
  {:else if block.type === 'divider'}
    <div class="py-2.5 flex items-center gap-3">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      {#if block.title}
        <span class="text-[10px] font-bold text-[var(--color-muted-foreground)] uppercase tracking-widest px-2">
          {block.title}
        </span>
      {/if}
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
    </div>
  {:else if block.type === 'spacer'}
    <div class={spacerHeightClass} />
  {:else if block.type === 'qr_code'}
    <div
      in:scale={{ duration: 300, delay: index * 30, start: 0.95 }}
      class="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-md text-center space-y-2.5"
    >
      {#if block.title}
        <h4 class="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center justify-center gap-1.5">
          <QrCode class="w-4 h-4 text-[var(--color-primary)]" />
          <span>{block.title}</span>
        </h4>
      {/if}
      <div class="w-36 h-36 mx-auto p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
        <img src={qrImg} alt="QR Code" class="w-full h-full object-contain" />
      </div>
      <p class="text-[10px] text-[var(--color-muted-foreground)]">
        {block.subtitle || 'Pindai kode QR untuk membuka tautan ini langsung dari smartphone Anda'}
      </p>
    </div>
  {:else}
    <!-- DEFAULT: STANDARD LINK BUTTON -->
    <a
      href={block.url || '#'}
      target={isExternalLink ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onclick={handleClick}
      in:fly={anim}
      class={`group relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md ${
        isFeatured
          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 border-amber-400/60 shadow-amber-500/10 hover:border-amber-400 scale-[1.02] ring-1 ring-amber-400/30'
          : 'bg-[var(--color-card)]/85 hover:bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      }`}
    >
      {#if isFeatured}
        <div class="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Flame class="w-2.5 h-2.5 fill-current" />
          <span>{block.badgeText || 'UNGGULAN'}</span>
        </div>
      {:else if block.badgeText}
        <div class="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-slate-950 text-[9px] font-bold uppercase tracking-wider shadow-sm">
          {block.badgeText}
        </div>
      {/if}

      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        {#if block.thumbnailUrl}
          <img
            src={block.thumbnailUrl}
            alt={block.title || ''}
            referrerPolicy="no-referrer"
            class="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--color-border)] shadow-sm"
          />
        {:else if block.icon}
          <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <MicrositeIcon iconName={block.icon} className="w-4 h-4" />
          </div>
        {:else}
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {index + 1}
          </div>
        {/if}

        <div class="min-w-0 flex-1 text-left">
          <span class="font-semibold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition truncate block">
            {block.title || 'Tautan Tanpa Judul'}
          </span>
          {#if block.subtitle}
            <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {block.subtitle}
            </p>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] shrink-0 pl-2">
        {#if block.clicks !== undefined && block.clicks > 0}
          <span class="text-[9px] font-mono text-[var(--color-muted-foreground)] opacity-70 hidden sm:inline mr-1">
            {block.clicks} klik
          </span>
        {/if}
        {#if isExternalLink}
          <ArrowUpRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        {:else}
          <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
        {/if}
      </div>
    </a>
  {/if}
{/if}
