<!-- @component Formulir metadata microsite (buat baru / edit) — input uncontrolled via FormData. -->
<script lang="ts">
  import Button from '../../shared/ui/Button.svelte';
  import { MICROSITE_THEMES } from '../../shared/themes/micrositeThemes.js';
  import type { CategoryRow, MicrositeInput } from '../../shared/services/dashboardService.js';

  interface Props {
    /** Nilai awal (kosong untuk microsite baru). */
    initial?: Partial<MicrositeInput> & { slug?: string };
    /** Daftar kategori untuk dropdown. */
    categories: CategoryRow[];
    /** Judul tombol simpan. */
    submitLabel: string;
    /** Pesan error dari server (bila ada). */
    error?: string;
    /** True saat menyimpan. */
    busy?: boolean;
    /** Dipanggil dengan data formulir saat submit. */
    onsubmit: (input: MicrositeInput) => void;
    /** Dipanggil saat tombol batal ditekan. */
    oncancel: () => void;
  }

  const {
    initial = {},
    categories,
    submitLabel,
    error = '',
    busy = false,
    onsubmit,
    oncancel
  }: Props = $props();

  const TEMPLATES: Array<{ id: string; label: string }> = [
    { id: 'modern_majestic', label: 'Modern Majestic (bawaan)' },
    { id: 'nusantara_art', label: 'Harmoni Nusantara' },
    { id: 'avant_garde', label: 'Avant Garde' },
    { id: 'artistic_bio', label: 'Bio Luminescent' },
    { id: 'minimal_gallery', label: 'Minimalist Gallery' },
    { id: 'classic', label: 'Classic Hub' }
  ];

  let slugInput: HTMLInputElement | undefined = $state();
  let slugTouched = $state(false);

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Isi slug otomatis dari nama selama pengguna belum mengubah slug manual. */
  function handleNameInput(e: Event): void {
    if (slugTouched || !slugInput) return;
    const name = (e.target as HTMLInputElement).value;
    slugInput.value = slugify(name);
  }

  function handleSubmit(e: SubmitEvent): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const get = (key: string): string => {
      const value = data.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };
    onsubmit({
      name: get('name'),
      slug: get('slug'),
      description: get('description'),
      category: get('category'),
      template: get('template'),
      theme: get('theme'),
      phone: get('phone'),
      email: get('email'),
      website: get('website'),
      address: get('address')
    });
  }

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition';
  const labelClass = 'block text-xs font-bold text-[var(--color-text)] mb-1.5';
</script>

<form
  onsubmit={handleSubmit}
  class="rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-6 space-y-5"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
      <label class={labelClass} for="ms-name">Nama microsite *</label>
      <input
        id="ms-name"
        name="name"
        required
        value={initial.name ?? ''}
        oninput={handleNameInput}
        placeholder="cth. Tata Usaha Puskesmas Manding 2026"
        class={inputClass}
      />
    </div>
    <div>
      <label class={labelClass} for="ms-slug">Slug (URL) *</label>
      <input
        id="ms-slug"
        name="slug"
        required
        bind:this={slugInput}
        value={initial.slug ?? ''}
        oninput={() => (slugTouched = true)}
        placeholder="cth. tu-pkm"
        class={inputClass}
      />
      <p class="text-[11px] text-[var(--color-muted-foreground)] mt-1">
        Hanya huruf kecil, angka, dan tanda -. Halaman publik: /{initial.slug || 'slug-anda'}
      </p>
    </div>
    <div class="md:col-span-2">
      <label class={labelClass} for="ms-desc">Deskripsi</label>
      <textarea
        id="ms-desc"
        name="description"
        rows="3"
        value={initial.description ?? ''}
        placeholder="Penjelasan singkat tentang microsite ini"
        class={inputClass}
      ></textarea>
    </div>
    <div>
      <label class={labelClass} for="ms-category">Kategori</label>
      <select id="ms-category" name="category" value={initial.category ?? 'Umum'} class={inputClass}>
        {#each categories as cat (cat.id)}
          <option value={cat.name}>{cat.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class={labelClass} for="ms-template">Template tampilan</label>
      <select
        id="ms-template"
        name="template"
        value={initial.template ?? 'modern_majestic'}
        class={inputClass}
      >
        {#each TEMPLATES as tpl (tpl.id)}
          <option value={tpl.id}>{tpl.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class={labelClass} for="ms-theme">Tema warna</label>
      <select id="ms-theme" name="theme" value={initial.theme ?? 'emerald'} class={inputClass}>
        <option value="emerald">Bawaan (Emerald)</option>
        {#each MICROSITE_THEMES as theme (theme.id)}
          <option value={theme.id}>{theme.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class={labelClass} for="ms-phone">Telepon</label>
      <input id="ms-phone" name="phone" value={initial.phone ?? ''} class={inputClass} />
    </div>
    <div>
      <label class={labelClass} for="ms-email">Email</label>
      <input
        id="ms-email"
        name="email"
        type="email"
        value={initial.email ?? ''}
        class={inputClass}
      />
    </div>
    <div>
      <label class={labelClass} for="ms-website">Website</label>
      <input id="ms-website" name="website" value={initial.website ?? ''} class={inputClass} />
    </div>
    <div class="md:col-span-2">
      <label class={labelClass} for="ms-address">Alamat</label>
      <input id="ms-address" name="address" value={initial.address ?? ''} class={inputClass} />
    </div>
  </div>

  {#if error}
    <p class="text-xs font-semibold text-red-500">{error}</p>
  {/if}

  <div class="flex flex-wrap gap-2">
    <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : submitLabel}</Button>
    <Button type="button" variant="secondary" onclick={oncancel}>Batal</Button>
  </div>
</form>
