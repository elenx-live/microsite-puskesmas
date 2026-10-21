<!-- @component Daftar konten microsite — blok modular (dengan grup lipat) atau fallback tautan legacy. -->
<script lang="ts">
  import { ChevronDown, ChevronRight, Folder } from 'lucide-svelte';
  import type { MicrositeEntity } from '../../../shared/types/index.js';
  import MicrositeBlockRenderer from './MicrositeBlockRenderer.svelte';
  import MicrositeLinkButton from './MicrositeLinkButton.svelte';

  let {
    microsite,
    themeStyle = 'emerald',
    accentColor = '#10b981'
  }: {
    microsite: MicrositeEntity;
    themeStyle?: string;
    accentColor?: string;
  } = $props();

  const hasBlocks = $derived(!!(microsite.blocks && microsite.blocks.length > 0));
  let collapsedGroups = $state<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    collapsedGroups = { ...collapsedGroups, [groupId]: !collapsedGroups[groupId] };
  };

  const blocks = $derived(
    (microsite.blocks || []).slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  );
  const groups = $derived(microsite.groups || []);
  const validGroupIds = $derived(new Set(groups.map((g) => g.id)));
  const ungroupedBlocks = $derived(blocks.filter((b) => !b.groupId || !validGroupIds.has(b.groupId)));

  const links = $derived(
    (microsite.links || []).slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  );
</script>

{#if hasBlocks}
  {#if blocks.length === 0}
    <div class="p-8 text-center rounded-3xl bg-[var(--color-card)]/60 border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] text-xs">
      Belum ada blok konten yang disematkan di portal ini.
    </div>
  {:else if groups.length > 0}
    <div class="space-y-4">
      {#if ungroupedBlocks.length > 0}
        <div class="space-y-3">
          {#each ungroupedBlocks as block, idx (block.id)}
            <MicrositeBlockRenderer
              {block}
              index={idx}
              micrositeId={microsite.id}
              {themeStyle}
              {accentColor}
            />
          {/each}
        </div>
      {/if}

      {#each groups as group (group.id)}
        {@const groupBlocks = blocks.filter((b) => b.groupId === group.id)}
        {@const isCollapsed = group.collapsible && !!collapsedGroups[group.id]}
        {#if groupBlocks.length > 0}
          <div class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/70 backdrop-blur-md p-4 space-y-3 shadow-md overflow-hidden">
            <div
              onclick={() => group.collapsible && toggleGroup(group.id)}
              class={`flex items-center justify-between select-none ${group.collapsible ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
                  <Folder class="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                    {group.name}
                  </h4>
                  {#if group.description}
                    <p class="text-[10px] text-[var(--color-muted-foreground)]">
                      {group.description}
                    </p>
                  {/if}
                </div>
              </div>

              {#if group.collapsible}
                <div class="w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)]">
                  {#if isCollapsed}<ChevronRight class="w-3.5 h-3.5" />{:else}<ChevronDown class="w-3.5 h-3.5" />{/if}
                </div>
              {/if}
            </div>

            {#if !isCollapsed}
              <div class="space-y-3 pt-1">
                {#each groupBlocks as block, idx (block.id)}
                  <MicrositeBlockRenderer
                    {block}
                    index={idx}
                    micrositeId={microsite.id}
                    {themeStyle}
                    {accentColor}
                  />
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="space-y-3">
      {#each blocks as block, idx (block.id)}
        <MicrositeBlockRenderer
          {block}
          index={idx}
          micrositeId={microsite.id}
          {themeStyle}
          {accentColor}
        />
      {/each}
    </div>
  {/if}
{:else if links.length === 0}
  <div class="p-8 text-center rounded-3xl bg-[var(--color-card)]/60 border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] text-xs">
    Belum ada tautan yang disematkan di portal ini.
  </div>
{:else}
  <div class="space-y-3">
    {#each links as link, idx (link.id)}
      <MicrositeLinkButton
        {link}
        index={idx}
        micrositeId={microsite.id}
        {themeStyle}
      />
    {/each}
  </div>
{/if}
