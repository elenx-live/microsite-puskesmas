<!-- @component Renderer header microsite — 5 gaya header (banner_hero, compact_inline, glassmorphism_card, minimal_text, split_cover, avatar_top). -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    HeartPulse,
    Sparkles,
    ShieldCheck,
    Award,
    CheckCircle2,
    Clock
  } from 'lucide-svelte';
  import type {
    MicrositeEntity,
    MicrositeHeaderStyle,
    MicrositeAvatarShape,
    MicrositeHeaderHeight
  } from '../../../shared/types/index.js';

  let {
    microsite,
    onOpenQR,
    onCopyLink,
    copied
  }: {
    microsite: MicrositeEntity;
    onOpenQR?: () => void;
    onCopyLink?: () => void;
    copied?: boolean;
  } = $props();

  const headerConfig = microsite.headerConfig || microsite.themeCustomization?.headerConfig;
  const style: MicrositeHeaderStyle = headerConfig?.style || 'banner_hero';
  const height: MicrositeHeaderHeight = headerConfig?.height || 'medium';
  const avatarShape: MicrositeAvatarShape =
    headerConfig?.avatarShape ||
    microsite.themeCustomization?.avatarStyle ||
    'circle';

  const showVerified =
    headerConfig?.showVerifiedBadge ??
    microsite.themeCustomization?.verifiedBadge ??
    true;

  const showCategoryBadge = headerConfig?.showCategoryBadge ?? true;
  const categoryText =
    headerConfig?.categoryBadgeText ||
    microsite.category ||
    'Portal Layanan Resmi';

  const bannerImg =
    microsite.bannerImageUrl ||
    microsite.profileImageUrl ||
    microsite.themeCustomization?.bgImageUrl;

  const overlayOpacity = headerConfig?.bannerOverlayOpacity ?? 50;
  const alignment = headerConfig?.alignment || 'center';

  const avatarShapeClass =
    avatarShape === 'circle'
      ? 'rounded-full'
      : avatarShape === 'square'
      ? 'rounded-none'
      : avatarShape === 'hexagon'
      ? 'rounded-3xl rotate-3'
      : 'rounded-2xl';

  const bannerHeightClass =
    height === 'compact'
      ? 'h-28 sm:h-36'
      : height === 'tall'
      ? 'h-48 sm:h-64'
      : 'h-36 sm:h-48';

  const logoSizeClass = (size: 'sm' | 'md' | 'lg') =>
    size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
</script>

{#snippet logo(size: 'sm' | 'md' | 'lg' = 'md')}
  <div class="relative inline-block shrink-0">
    {#if microsite.logoUrl}
      <img
        src={microsite.logoUrl}
        alt={microsite.name}
        referrerPolicy="no-referrer"
        class={`${logoSizeClass(size)} ${avatarShapeClass} object-cover border-2 border-emerald-400/40 bg-white p-1.5 shadow-xl transition duration-300 hover:scale-105`}
      />
    {:else}
      <div
        class={`${logoSizeClass(size)} ${avatarShapeClass} bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 border-2 border-amber-400/50 text-amber-300 flex items-center justify-center font-bold shadow-xl shadow-emerald-950/40`}
      >
        <HeartPulse class="w-8 h-8 animate-pulse" />
      </div>
    {/if}

    {#if showVerified}
      <div
        class="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md border-2 border-[var(--color-card)]"
        title="Layanan Resmi Terverifikasi"
      >
        <CheckCircle2 class="w-3.5 h-3.5" />
      </div>
    {/if}
  </div>
{/snippet}

{#if style === 'banner_hero'}
  <div
    in:fade={{ duration: 400 }}
    class="relative rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
  >
    {#if bannerImg}
      <div class={`relative w-full ${bannerHeightClass} overflow-hidden bg-slate-900`}>
        <img
          src={bannerImg}
          alt="Header Banner"
          referrerPolicy="no-referrer"
          class="w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-black/40 to-transparent"
          style={`opacity: ${overlayOpacity / 100}`}
        />
      </div>
    {:else}
      <div
        class={`w-full ${height === 'compact' ? 'h-24' : 'h-32'} bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 relative overflow-hidden`}
      >
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
        <div class="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[var(--color-card)] to-transparent" />
      </div>
    {/if}

    <div
      class={`relative px-6 pb-6 -mt-10 sm:-mt-12 space-y-4 ${
        alignment === 'left' ? 'text-left' : 'text-center'
      }`}
    >
      <div class={alignment === 'left' ? 'flex items-end gap-4' : 'inline-block'}>
        {@render logo('md')}
      </div>

      <div class="space-y-1.5">
        {#if showCategoryBadge}
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
            <Award class="w-3 h-3" />
            <span>{categoryText}</span>
          </div>
        {/if}
        <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight leading-snug">
          {headerConfig?.customTitle || microsite.name}
        </h1>
      </div>

      {#if headerConfig?.customSubtitle || microsite.description}
        <p class="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
          {headerConfig?.customSubtitle || microsite.description}
        </p>
      {/if}

      <div class="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--color-muted-foreground)] border-t border-[var(--color-border)]/50">
        <span class="flex items-center gap-1">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
          <span>Puskesmas Terakreditasi Paripurna</span>
        </span>
        <span>•</span>
        <span class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5 text-amber-400" />
          <span>Akses Cepat 24 Jam</span>
        </span>
      </div>
    </div>
  </div>
{:else if style === 'compact_inline'}
  <div
    in:fade={{ duration: 400 }}
    class="p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-xl flex items-center gap-4 sm:gap-5"
  >
    {@render logo('md')}
    <div class="flex-1 min-w-0 space-y-1">
      {#if showCategoryBadge}
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
          {categoryText}
        </span>
      {/if}
      <h1 class="text-lg sm:text-xl font-bold text-[var(--color-text)] tracking-tight truncate">
        {headerConfig?.customTitle || microsite.name}
      </h1>
      {#if headerConfig?.customSubtitle || microsite.description}
        <p class="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
          {headerConfig?.customSubtitle || microsite.description}
        </p>
      {/if}
    </div>
  </div>
{:else if style === 'glassmorphism_card'}
  <div
    in:fade={{ duration: 400 }}
    class="relative p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-[var(--color-card)]/80 via-[var(--color-card)]/60 to-[var(--color-card)]/80 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.12)] text-center space-y-4 overflow-hidden"
  >
    <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />

    {@render logo('lg')}

    <div class="space-y-1.5">
      {#if showCategoryBadge}
        <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
          <Sparkles class="w-3 h-3 text-amber-400" />
          <span>{categoryText}</span>
        </div>
      {/if}
      <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
        {headerConfig?.customTitle || microsite.name}
      </h1>
    </div>

    {#if bannerImg}
      <div class="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
        <img
          src={bannerImg}
          alt="Banner"
          referrerPolicy="no-referrer"
          class="w-full h-36 object-cover"
        />
      </div>
    {/if}

    {#if headerConfig?.customSubtitle || microsite.description}
      <p class="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
        {headerConfig?.customSubtitle || microsite.description}
      </p>
    {/if}
  </div>
{:else if style === 'minimal_text'}
  <div
    in:fade={{ duration: 400 }}
    class={`py-4 px-2 space-y-3 ${alignment === 'left' ? 'text-left' : 'text-center'}`}
  >
    <div class={alignment === 'left' ? 'inline-block' : 'flex justify-center'}>
      {@render logo('sm')}
    </div>
    <div class="space-y-1">
      {#if showCategoryBadge}
        <span class="text-[10px] font-mono uppercase tracking-widest text-[var(--color-primary)]">
          {categoryText}
        </span>
      {/if}
      <h1 class="text-2xl sm:text-3xl font-light text-[var(--color-text)] tracking-tight">
        {headerConfig?.customTitle || microsite.name}
      </h1>
      {#if headerConfig?.customSubtitle || microsite.description}
        <p class="text-xs text-[var(--color-muted-foreground)] max-w-md mx-auto">
          {headerConfig?.customSubtitle || microsite.description}
        </p>
      {/if}
    </div>
  </div>
{:else if style === 'split_cover'}
  <div
    in:fade={{ duration: 400 }}
    class="rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 gap-0"
  >
    {#if bannerImg}
      <div class="sm:col-span-5 h-44 sm:h-full relative bg-slate-900">
        <img
          src={bannerImg}
          alt="Banner"
          referrerPolicy="no-referrer"
          class="w-full h-full object-cover"
        />
      </div>
    {/if}
    <div
      class={`${
        bannerImg ? 'sm:col-span-7' : 'sm:col-span-12'
      } p-6 flex flex-col justify-center space-y-3`}
    >
      <div class="flex items-center gap-3">
        {@render logo('sm')}
        <div>
          {#if showCategoryBadge}
            <span class="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
              {categoryText}
            </span>
          {/if}
          <h1 class="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight">
            {headerConfig?.customTitle || microsite.name}
          </h1>
        </div>
      </div>
      {#if headerConfig?.customSubtitle || microsite.description}
        <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
          {headerConfig?.customSubtitle || microsite.description}
        </p>
      {/if}
    </div>
  </div>
{:else}
  <!-- DEFAULT / AVATAR TOP -->
  <div
    in:fade={{ duration: 400 }}
    class="p-7 sm:p-8 rounded-3xl bg-[var(--color-card)]/85 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl text-center space-y-4"
  >
    {@render logo('lg')}

    <div class="space-y-1.5">
      {#if showCategoryBadge}
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
          <Award class="w-3 h-3" />
          <span>{categoryText}</span>
        </div>
      {/if}
      <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
        {headerConfig?.customTitle || microsite.name}
      </h1>
    </div>

    {#if bannerImg}
      <div class="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
        <img
          src={bannerImg}
          alt="Banner"
          referrerPolicy="no-referrer"
          class="w-full h-40 object-cover"
        />
      </div>
    {/if}

    {#if headerConfig?.customSubtitle || microsite.description}
      <p class="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
        {headerConfig?.customSubtitle || microsite.description}
      </p>
    {/if}

    <div class="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--color-muted-foreground)]">
      <span class="flex items-center gap-1">
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
        <span>Layanan Terverifikasi</span>
      </span>
      <span>•</span>
      <span class="flex items-center gap-1">
        <Clock class="w-3.5 h-3.5 text-amber-400" />
        <span>Akses 24 Jam</span>
      </span>
    </div>
  </div>
{/if}
