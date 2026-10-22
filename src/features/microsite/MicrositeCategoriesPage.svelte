<!-- @component Katalog microsite publik — grid kategori lalu daftar microsite per kategori terpilih (filter lewat query router). -->
<script lang="ts">
  import { Globe, ArrowRight, Lock, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-svelte';
  import Button from '../../shared/ui/Button.svelte';
  import { routerState, navigate } from '../../app/router.svelte.js';
  import { micrositeService } from '../../shared/services/micrositeService.js';
  import type { MicrositeEntity, MicrositeCategory } from '../../shared/types/index.js';

  let microsites = $state<MicrositeEntity[]>([]);
  let categories = $state<MicrositeCategory[]>([]);
  let loading = $state(true);

  // Kategori terpilih mengikuti query router (?category=...) — pengganti pushState manual
  let selectedCategory = $derived<string | null>(routerState.query['category'] ?? null);

  $effect(() => {
    loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const [mList, cList] = await Promise.all([
        micrositeService.getPublishedAndActiveMicrosites(),
        micrositeService.getCategories()
      ]);
      microsites = mList;
      categories = cList;
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      loading = false;
    }
  }

  function handleSelectCategory(catName: string) {
    const path = routerState.path || '/m';
    navigate(`${path}?category=${encodeURIComponent(catName)}`);
  }

  function handleBackToCategories() {
    navigate(routerState.path || '/m');
  }

  const filteredMicrosites = $derived(
    selectedCategory
      ? microsites.filter(
          m =>
            (m.category || 'Umum').toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategory.toLowerCase() === 'umum' && !m.category)
        )
      : microsites
  );

  function countForCategory(catName: string): number {
    return microsites.filter(
      m =>
        (m.category || 'Umum').toLowerCase() === catName.toLowerCase() ||
        (catName.toLowerCase() === 'umum' && !m.category)
    ).length;
  }
</script>

<!-- Bar atas: navigasi utama microsite -->
<div class="border-b border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
    <a href="/" class="flex items-center gap-2 min-w-0">
      <span class="text-sm font-bold text-[var(--color-text)] truncate">Microsite Puskesmas Manding</span>
    </a>
    <a
      href="https://sumenep.puskesmasmanding.com"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)] shadow-sm hover:opacity-90 transition"
    >
      <Globe class="w-4 h-4" />
      <span>Web Puskesmas</span>
    </a>
  </div>
</div>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">

  <!-- Breadcrumb & Header -->
  <div class="space-y-4">
    <div class="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
      <a href="/" class="hover:text-[var(--color-primary)] transition">Beranda</a>
      <span>/</span>
      <button type="button" onclick={handleBackToCategories} class={`hover:text-[var(--color-primary)] transition ${selectedCategory ? '' : 'text-[var(--color-text)] font-bold'}`}>
        Microsite
      </button>
      {#if selectedCategory}
        <span>/</span>
        <span class="text-[var(--color-text)] font-bold">{selectedCategory}</span>
      {/if}
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-card)] border theme-border p-6 sm:p-8 rounded-3xl shadow-sm">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold tracking-wider uppercase">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Microsite</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-light text-[var(--color-text)]">
          {selectedCategory ? `Microsite: ${selectedCategory}` : 'Microsite'}
        </h1>
        <p class="text-xs sm:text-sm text-[var(--color-muted-foreground)] max-w-2xl leading-relaxed">
          {selectedCategory
            ? `Berikut adalah daftar microsite untuk kategori ${selectedCategory}.`
            : 'Pilih kategori untuk melihat daftar microsite yang tersedia.'}
        </p>
      </div>

      {#if selectedCategory}
        <Button
          variant="outline"
          onclick={handleBackToCategories}
          class="inline-flex items-center gap-2 self-start md:self-auto rounded-xl text-xs"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Kategori</span>
        </Button>
      {/if}
    </div>
  </div>

  <!-- Content View -->
  {#if !selectedCategory}
    <!-- 1. CATEGORIES GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each categories as cat (cat.name)}
        <div
          onclick={() => handleSelectCategory(cat.name)}
          onkeydown={(e) => e.key === 'Enter' && handleSelectCategory(cat.name)}
          role="button"
          tabindex="0"
          class="group bg-[var(--color-card)] border theme-border p-6 sm:p-8 rounded-3xl hover:border-[var(--color-primary)]/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-6"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition">
                <Globe class="w-6 h-6" />
              </div>
              <span class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--color-bg)] border theme-border text-[var(--color-muted-foreground)]">
                {countForCategory(cat.name)} Microsite Tersedia
              </span>
            </div>

            <div class="space-y-2">
              <h3 class="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition">
                {cat.name}
              </h3>
              <p class="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                {cat.description}
              </p>
            </div>
          </div>

          <div class="pt-4 border-t theme-border flex items-center justify-between text-xs font-bold text-[var(--color-primary)]">
            <span>Lihat Daftar Microsite</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- 2. MICROSITE LIST FOR SELECTED CATEGORY -->
    <div class="space-y-6">
      {#if loading}
        <div class="p-12 text-center text-xs font-mono text-[var(--color-muted-foreground)]">
          Memuat daftar microsite...
        </div>
      {:else if filteredMicrosites.length === 0}
        <div class="bg-[var(--color-card)] border theme-border p-12 text-center rounded-3xl space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-[var(--color-muted)]/20 flex items-center justify-center mx-auto text-[var(--color-muted-foreground)]">
            <Globe class="w-6 h-6" />
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-[var(--color-text)]">Belum ada microsite dalam kategori ini</h4>
            <p class="text-xs text-[var(--color-muted-foreground)]">
              Administrator dapat menambahkan atau menetapkan microsite ke kategori "{selectedCategory}" melalui Dashboard Admin.
            </p>
          </div>
          <Button onclick={handleBackToCategories} variant="outline" class="text-xs">
            Pilih Kategori Lain
          </Button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredMicrosites as m (m.id)}
            <div
              class="bg-[var(--color-card)] border theme-border p-6 rounded-3xl space-y-5 hover:border-[var(--color-primary)]/40 transition flex flex-col justify-between shadow-sm"
            >
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                    <Globe class="w-5 h-5" />
                  </div>
                  {#if m.passwordProtected}
                    <span class="inline-flex items-center gap-1 text-[10px] font-mono bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-2.5 py-0.5 rounded-full font-semibold">
                      <Lock class="w-3 h-3" />
                      Terproteksi Sandi
                    </span>
                  {/if}
                </div>

                <div class="space-y-1">
                  <h3 class="text-sm font-bold text-[var(--color-text)] leading-tight">{m.name}</h3>
                  <p class="text-xs text-[var(--color-muted-foreground)] line-clamp-2 leading-relaxed">
                    {m.description || 'Portal informasi, tautan penting, dan layanan khusus.'}
                  </p>
                </div>
              </div>

              <div class="pt-4 border-t theme-border flex items-center justify-between">
                <span class="text-[10px] font-mono text-[var(--color-muted-foreground)]">
                  {(m.links || []).length} Tautan Utama
                </span>
                <a
                  href={`/${m.slug}`}
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition shadow-sm"
                >
                  <span>Kunjungi</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

</div>
