<!-- @component Tombol tautan microsite (mode legacy links) — dengan badge unggulan, thumbnail/ikon, dan pelacakan klik. -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { ChevronRight, Flame, ArrowUpRight } from 'lucide-svelte';
  import type { MicrositeLink } from '../../../shared/types/index.js';
  import MicrositeIcon from './MicrositeIcon.svelte';
  import { micrositeService } from '../../../shared/services/micrositeService.js';
  import { resolveMicrositeLinkUrl } from '../../../shared/utils/siteLinks.js';

  let {
    link,
    index,
    micrositeId,
    themeStyle = 'emerald',
    variant = 'default'
  }: {
    link: MicrositeLink;
    index: number;
    micrositeId: string;
    themeStyle?: string;
    variant?: 'default' | 'minimal' | 'cyber' | 'glass' | 'card';
  } = $props();

  // Sembunyikan jika diarsipkan atau di luar jendela jadwal
  const now = new Date().toISOString();
  const isHidden =
    link.archived ||
    (link.scheduledStart ? link.scheduledStart > now : false) ||
    (link.scheduledEnd ? link.scheduledEnd < now : false);

  const isExternal = $derived(
    link.type === 'external' ||
      link.type === 'whatsapp' ||
      link.type === 'youtube' ||
      link.type === 'pdf' ||
      link.url.startsWith('http') ||
      link.url.startsWith('tel:') ||
      link.url.startsWith('mailto:')
  );

  const handleClick = () => {
    micrositeService.recordAnalyticsEvent(micrositeId, 'link_click', link.id);
  };

  const isFeatured = link.isFeatured;
</script>

{#if !isHidden}
  {#if link.type === 'header'}
    <div class="pt-4 pb-1">
      <h4 class="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] flex items-center gap-2">
        {#if link.icon}<MicrositeIcon iconName={link.icon} className="w-3.5 h-3.5 text-[var(--color-primary)]" />{/if}
        <span>{link.label}</span>
      </h4>
      {#if link.subtitle}
        <p class="text-[10px] text-[var(--color-muted-foreground)] opacity-80 mt-0.5">{link.subtitle}</p>
      {/if}
    </div>
  {:else}
    <a
      href={resolveMicrositeLinkUrl(link.url)}
      target={isExternal ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onclick={handleClick}
      in:fly={{ y: 15, duration: 300, delay: index * 40 }}
      class={`group relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-sm flex items-center justify-between transition-all duration-300 shadow-md ${
        isFeatured
          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 border-amber-400/60 shadow-amber-500/10 hover:border-amber-400 scale-[1.02] ring-1 ring-amber-400/30'
          : 'bg-[var(--color-card)]/85 hover:bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      }`}
    >
      {#if isFeatured}
        <div class="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Flame class="w-2.5 h-2.5 fill-current" />
          <span>{link.badgeText || 'UNGGULAN'}</span>
        </div>
      {:else if link.badgeText}
        <div class="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-slate-950 text-[9px] font-bold uppercase tracking-wider shadow-sm">
          {link.badgeText}
        </div>
      {/if}

      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        {#if link.thumbnailUrl}
          <img
            src={link.thumbnailUrl}
            alt={link.label}
            referrerPolicy="no-referrer"
            class="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--color-border)] shadow-sm"
          />
        {:else if link.icon}
          <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <MicrositeIcon iconName={link.icon} className="w-4 h-4" />
          </div>
        {:else}
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {index + 1}
          </div>
        {/if}

        <div class="min-w-0 flex-1">
          <span class="font-semibold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition truncate block">
            {link.label}
          </span>
          {#if link.subtitle}
            <p class="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {link.subtitle}
            </p>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] shrink-0 pl-2">
        {#if link.clicks !== undefined && link.clicks > 0}
          <span class="text-[9px] font-mono text-[var(--color-muted-foreground)] opacity-70 hidden sm:inline mr-1">
            {link.clicks} klik
          </span>
        {/if}
        {#if isExternal}
          <ArrowUpRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        {:else}
          <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
        {/if}
      </div>
    </a>
  {/if}
{/if}
