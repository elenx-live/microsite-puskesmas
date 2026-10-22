<!-- @component Dashboard pengelola microsite: daftar, buat/edit metadata, terbit/draf, hapus, kelola kategori. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardLayout from './DashboardLayout.svelte';
  import MicrositeForm from './MicrositeForm.svelte';
  import Button from '../../shared/ui/Button.svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';
  import {
    getDashboardMicrosites,
    createMicrosite,
    updateMicrosite,
    deleteMicrosite,
    getDashboardCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type DashboardMicrosite,
    type CategoryRow,
    type MicrositeInput
  } from '../../shared/services/dashboardService.js';

  type View = 'list' | 'create' | 'edit';

  let view = $state<View>('list');
  let microsites = $state<DashboardMicrosite[]>([]);
  let categories = $state<CategoryRow[]>([]);
  let editing = $state<DashboardMicrosite | null>(null);
  let loading = $state(true);
  let listError = $state('');
  let notice = $state('');
  let formError = $state('');
  let formBusy = $state(false);
  let deleteConfirmId = $state<string | null>(null);
  let copiedSlug = $state<string | null>(null);
  let togglingId = $state<string | null>(null);

  // State kelola kategori (petugas/admin).
  let catError = $state('');
  let catNotice = $state('');
  let catBusy = $state(false);
  let editingCatId = $state<string | null>(null);
  let editingCatName = $state('');
  let editingCatDesc = $state('');

  function publicUrl(slug: string, preview = false): string {
    return `${window.location.origin}/${slug}${preview ? '?preview=true' : ''}`;
  }

  async function loadData(): Promise<void> {
    loading = true;
    listError = '';
    try {
      const [list, cats] = await Promise.all([getDashboardMicrosites(), getDashboardCategories()]);
      microsites = list;
      categories = cats;
    } catch (e) {
      listError = e instanceof Error ? e.message : 'Gagal memuat data';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await authStore.load();
    if (authStore.user) await loadData();
    else loading = false;
  });

  function startCreate(): void {
    editing = null;
    formError = '';
    view = 'create';
  }

  function startEdit(m: DashboardMicrosite): void {
    editing = m;
    formError = '';
    view = 'edit';
  }

  function backToList(): void {
    view = 'list';
    editing = null;
    formError = '';
  }

  async function handleFormSubmit(input: MicrositeInput): Promise<void> {
    formError = '';
    formBusy = true;
    try {
      if (view === 'edit' && editing) {
        await updateMicrosite(editing.id, input);
        notice = `Microsite "${input.name}" diperbarui.`;
      } else {
        const created = await createMicrosite(input);
        notice = `Microsite "${created.name}" dibuat sebagai draf. Terbitkan bila sudah siap.`;
      }
      await loadData();
      backToList();
    } catch (e) {
      formError = e instanceof Error ? e.message : 'Gagal menyimpan';
    } finally {
      formBusy = false;
    }
  }

  async function togglePublish(m: DashboardMicrosite): Promise<void> {
    togglingId = m.id;
    try {
      const next = m.status === 'published' ? 'draft' : 'published';
      await updateMicrosite(m.id, { status: next });
      notice = next === 'published' ? `"${m.name}" diterbitkan.` : `"${m.name}" dikembalikan ke draf.`;
      await loadData();
    } catch (e) {
      listError = e instanceof Error ? e.message : 'Gagal mengubah status';
    } finally {
      togglingId = null;
    }
  }

  async function confirmDelete(m: DashboardMicrosite): Promise<void> {
    if (deleteConfirmId !== m.id) {
      deleteConfirmId = m.id;
      return;
    }
    deleteConfirmId = null;
    try {
      await deleteMicrosite(m.id);
      notice = `"${m.name}" dihapus.`;
      await loadData();
    } catch (e) {
      listError = e instanceof Error ? e.message : 'Gagal menghapus';
    }
  }

  async function copyLink(slug: string, preview = false): Promise<void> {
    const url = publicUrl(slug, preview);
    try {
      await navigator.clipboard.writeText(url);
      copiedSlug = slug + (preview ? '?preview' : '');
      setTimeout(() => {
        copiedSlug = null;
      }, 2000);
    } catch {
      window.prompt('Salin tautan berikut:', url);
    }
  }

  async function handleAddCategory(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const description = String(data.get('description') || '').trim();
    catError = '';
    catBusy = true;
    try {
      await createCategory(name, description);
      catNotice = `Kategori "${name}" ditambahkan.`;
      form.reset();
      categories = await getDashboardCategories();
    } catch (err) {
      catError = err instanceof Error ? err.message : 'Gagal menambah kategori';
    } finally {
      catBusy = false;
    }
  }

  function startEditCategory(cat: CategoryRow): void {
    editingCatId = cat.id;
    editingCatName = cat.name;
    editingCatDesc = cat.description;
    catError = '';
  }

  async function saveCategory(cat: CategoryRow): Promise<void> {
    catError = '';
    catBusy = true;
    try {
      await updateCategory(cat.id, { name: editingCatName.trim(), description: editingCatDesc.trim() });
      catNotice = 'Kategori diperbarui.';
      editingCatId = null;
      categories = await getDashboardCategories();
      await loadData();
    } catch (err) {
      catError = err instanceof Error ? err.message : 'Gagal mengubah kategori';
    } finally {
      catBusy = false;
    }
  }

  async function removeCategory(cat: CategoryRow): Promise<void> {
    if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    catError = '';
    try {
      await deleteCategory(cat.id);
      catNotice = `Kategori "${cat.name}" dihapus.`;
      categories = await getDashboardCategories();
    } catch (err) {
      catError = err instanceof Error ? err.message : 'Gagal menghapus kategori';
    }
  }

  const cardClass =
    'rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-5';
  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition';
</script>

<DashboardLayout title="Dashboard Microsite">
  {#if !authStore.loaded || loading}
    <p class="text-sm text-[var(--color-muted-foreground)]">Memuat…</p>
  {:else if !authStore.user}
    <div class={cardClass}>
      <p class="text-sm text-[var(--color-text)] mb-4">
        Anda harus masuk untuk mengelola microsite.
      </p>
      <Button onclick={() => navigate('/login')}>Masuk dengan Google</Button>
    </div>
  {:else}
    {#if notice}
      <p class="mb-4 text-xs font-semibold text-emerald-600">{notice}</p>
    {/if}
    {#if listError}
      <p class="mb-4 text-xs font-semibold text-red-500">{listError}</p>
    {/if}

    {#if view === 'list'}
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p class="text-sm text-[var(--color-muted-foreground)]">
          {authStore.isStaff
            ? 'Anda melihat semua microsite.'
            : 'Anda melihat microsite milik Anda.'}
          Total: {microsites.length}
        </p>
        <Button onclick={startCreate}>＋ Buat Microsite</Button>
      </div>

      {#if microsites.length === 0}
        <div class={cardClass}>
          <p class="text-sm text-[var(--color-muted-foreground)]">
            Belum ada microsite. Buat microsite pertama Anda lewat tombol di atas.
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each microsites as m (m.id)}
            <article class={cardClass}>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="font-bold text-[var(--color-text)] truncate">{m.name}</h2>
                  <p class="text-xs text-[var(--color-muted-foreground)] truncate">/{m.slug}</p>
                  {#if m.description}
                    <p class="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
                      {m.description}
                    </p>
                  {/if}
                </div>
                <span
                  class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full {m.status === 'published'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'}"
                >
                  {m.status === 'published' ? 'TERBIT' : 'DRAF'}
                </span>
              </div>
              <p class="text-[11px] text-[var(--color-muted-foreground)] mt-3">
                Kategori: {m.category || 'Umum'}
                {#if authStore.isStaff && m.ownerName}
                  · Pemilik: {m.ownerName} ({m.ownerEmail})
                {/if}
              </p>
              <div class="flex flex-wrap gap-2 mt-4">
                <a
                  href={publicUrl(m.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold hover:opacity-90 transition"
                >
                  Buka
                </a>
                <button
                  type="button"
                  onclick={() => copyLink(m.slug)}
                  class="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:opacity-80 transition"
                >
                  {copiedSlug === m.slug ? 'Tersalin!' : 'Salin Tautan'}
                </button>
                <button
                  type="button"
                  onclick={() => navigate(`/dashboard/${m.id}/blok`)}
                  class="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:opacity-80 transition"
                >
                  Kelola Blok
                </button>
                <button
                  type="button"
                  onclick={() => startEdit(m)}
                  class="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:opacity-80 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={togglingId === m.id}
                  onclick={() => togglePublish(m)}
                  class="px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/40 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition disabled:opacity-50"
                >
                  {m.status === 'published' ? 'Jadikan Draf' : 'Terbitkan'}
                </button>
                <button
                  type="button"
                  onclick={() => confirmDelete(m)}
                  class="px-3 py-1.5 rounded-xl border border-red-500/40 text-xs font-semibold {deleteConfirmId === m.id
                    ? 'bg-red-500 text-white'
                    : 'text-red-500'} hover:opacity-90 transition"
                >
                  {deleteConfirmId === m.id ? 'Hapus Permanen?' : 'Hapus'}
                </button>
              </div>
            </article>
          {/each}
        </div>
      {/if}

      {#if authStore.isStaff}
        <section class="mt-10">
          <h2 class="text-lg font-bold text-[var(--color-text)] mb-3">Kelola Kategori</h2>
          {#if catNotice}
            <p class="mb-3 text-xs font-semibold text-emerald-600">{catNotice}</p>
          {/if}
          {#if catError}
            <p class="mb-3 text-xs font-semibold text-red-500">{catError}</p>
          {/if}
          <div class="{cardClass} space-y-3 mb-4">
            {#each categories as cat (cat.id)}
              <div class="flex flex-wrap items-center gap-2 py-1">
                {#if editingCatId === cat.id}
                  <input
                    value={editingCatName}
                    oninput={(e) => (editingCatName = (e.target as HTMLInputElement).value)}
                    class="{inputClass} !w-auto flex-1 min-w-[140px]"
                  />
                  <input
                    value={editingCatDesc}
                    oninput={(e) => (editingCatDesc = (e.target as HTMLInputElement).value)}
                    class="{inputClass} !w-auto flex-1 min-w-[180px]"
                    placeholder="Deskripsi"
                  />
                  <Button size="sm" disabled={catBusy} onclick={() => saveCategory(cat)}>Simpan</Button>
                  <Button size="sm" variant="secondary" onclick={() => (editingCatId = null)}>Batal</Button>
                {:else}
                  <div class="flex-1 min-w-[160px]">
                    <p class="text-sm font-bold text-[var(--color-text)]">{cat.name}</p>
                    {#if cat.description}
                      <p class="text-xs text-[var(--color-muted-foreground)]">{cat.description}</p>
                    {/if}
                  </div>
                  <Button size="sm" variant="secondary" onclick={() => startEditCategory(cat)}>Edit</Button>
                  <Button size="sm" variant="danger" onclick={() => removeCategory(cat)}>Hapus</Button>
                {/if}
              </div>
            {/each}
          </div>
          <form
            onsubmit={handleAddCategory}
            class="{cardClass} flex flex-wrap items-end gap-2"
          >
            <div class="flex-1 min-w-[160px]">
              <label class="block text-xs font-bold text-[var(--color-text)] mb-1" for="cat-name">
                Nama kategori baru
              </label>
              <input id="cat-name" name="name" required class={inputClass} />
            </div>
            <div class="flex-[2] min-w-[200px]">
              <label class="block text-xs font-bold text-[var(--color-text)] mb-1" for="cat-desc">
                Deskripsi
              </label>
              <input id="cat-desc" name="description" class={inputClass} />
            </div>
            <Button type="submit" disabled={catBusy}>Tambah Kategori</Button>
          </form>
        </section>
      {/if}
    {:else if view === 'create'}
      <div class="max-w-3xl">
        <MicrositeForm
          categories={categories}
          submitLabel="Buat Microsite"
          error={formError}
          busy={formBusy}
          onsubmit={handleFormSubmit}
          oncancel={backToList}
        />
      </div>
    {:else if view === 'edit' && editing}
      <div class="max-w-3xl">
        {#key editing.id}
          <MicrositeForm
          initial={{
            name: editing.name,
            slug: editing.slug,
            description: editing.description,
            category: editing.category,
            template: editing.themeCustomization?.template ?? 'modern_majestic',
            theme: editing.themeCustomization?.theme ?? 'emerald',
            phone: editing.phone,
            email: editing.email,
            website: editing.website,
            address: editing.address
          }}
          categories={categories}
          submitLabel="Simpan Perubahan"
          error={formError}
          busy={formBusy}
          onsubmit={handleFormSubmit}
          oncancel={backToList}
        />
        {/key}
      </div>
    {/if}
  {/if}
</DashboardLayout>
