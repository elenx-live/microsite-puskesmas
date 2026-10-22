<!-- @component Editor blok microsite: tambah/edit/hapus/susun ulang blok konten. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardLayout from './DashboardLayout.svelte';
  import Button from '../../shared/ui/Button.svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';
  import {
    getDashboardMicrosite,
    getBlocks,
    saveBlocks,
    type DashboardMicrosite
  } from '../../shared/services/dashboardService.js';
  import type { MicrositeBlock, MicrositeBlockType } from '../../shared/types/index.js';

  interface Props {
    /** ID microsite yang bloknya dikelola. */
    micrositeId: string;
  }

  const { micrositeId }: Props = $props();

  /** Field yang ditampilkan per tipe blok (sesuai MicrositeBlockRenderer). */
  const FIELDS: Record<string, Array<{ key: string; label: string; multiline?: boolean }>> = {
    heading: [
      { key: 'title', label: 'Judul' },
      { key: 'subtitle', label: 'Subjudul' },
      { key: 'icon', label: 'Ikon (nama Lucide, cth. HeartPulse)' }
    ],
    text: [
      { key: 'title', label: 'Judul' },
      { key: 'content', label: 'Isi teks', multiline: true }
    ],
    announcement: [
      { key: 'title', label: 'Judul pengumuman' },
      { key: 'content', label: 'Isi pengumuman', multiline: true },
      { key: 'subtitle', label: 'Teks tombol' },
      { key: 'url', label: 'Tautan tombol' },
      { key: 'badgeText', label: 'Label badge (cth. BARU)' }
    ],
    link: [
      { key: 'title', label: 'Judul tautan' },
      { key: 'subtitle', label: 'Subjudul' },
      { key: 'url', label: 'URL tujuan' },
      { key: 'icon', label: 'Ikon (nama Lucide)' },
      { key: 'badgeText', label: 'Label badge' },
      { key: 'thumbnailUrl', label: 'URL gambar mini (opsional)' }
    ],
    image: [
      { key: 'title', label: 'Judul gambar' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'thumbnailUrl', label: 'URL gambar' }
    ],
    image_link: [
      { key: 'title', label: 'Judul gambar' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'thumbnailUrl', label: 'URL gambar' },
      { key: 'url', label: 'URL tujuan saat diklik' }
    ],
    video: [
      { key: 'title', label: 'Judul video' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'URL / ID YouTube' }
    ],
    whatsapp: [
      { key: 'title', label: 'Judul tombol' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'whatsappNumber', label: 'Nomor WhatsApp (cth. 6281234567890)' },
      { key: 'whatsappMessage', label: 'Pesan otomatis', multiline: true }
    ],
    phone: [
      { key: 'title', label: 'Judul' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'Nomor telepon' }
    ],
    email: [
      { key: 'title', label: 'Judul' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'Alamat email' }
    ],
    location: [
      { key: 'title', label: 'Judul lokasi' },
      { key: 'content', label: 'Alamat', multiline: true },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'URL Google Maps (kosongkan untuk otomatis)' }
    ],
    download: [
      { key: 'title', label: 'Judul dokumen' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'URL file' },
      { key: 'fileFormat', label: 'Format (cth. PDF)' },
      { key: 'fileSize', label: 'Ukuran (cth. 2,4 MB)' }
    ],
    divider: [{ key: 'title', label: 'Label pemisah (opsional)' }],
    spacer: [],
    qr_code: [
      { key: 'title', label: 'Judul' },
      { key: 'subtitle', label: 'Keterangan' },
      { key: 'url', label: 'URL yang dikodekan' }
    ]
  };

  const TYPE_LABELS: Record<string, string> = {
    heading: 'Judul Bagian',
    text: 'Teks Informasi',
    announcement: 'Pengumuman',
    link: 'Tombol Tautan',
    image: 'Gambar',
    image_link: 'Gambar + Tautan',
    video: 'Video YouTube',
    whatsapp: 'Chat WhatsApp',
    phone: 'Telepon',
    email: 'Email',
    location: 'Lokasi',
    download: 'Unduh Dokumen',
    divider: 'Garis Pemisah',
    spacer: 'Spasi',
    qr_code: 'Kode QR'
  };

  let microsite = $state<DashboardMicrosite | null>(null);
  let blocks = $state<MicrositeBlock[]>([]);
  let loading = $state(true);
  let loadError = $state('');
  let saveError = $state('');
  let saveNotice = $state('');
  let saving = $state(false);
  let dirty = $state(false);
  let newType = $state<MicrositeBlockType>('link');

  function newBlockId(): string {
    return `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function setField(block: MicrositeBlock, key: string, value: string): void {
    const target = blocks.find((b) => b.id === block.id);
    if (!target) return;
    (target as unknown as Record<string, unknown>)[key] = value;
    dirty = true;
  }

  function moveBlock(index: number, delta: number): void {
    const to = index + delta;
    if (to < 0 || to >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(index, 1);
    copy.splice(to, 0, moved);
    blocks = copy.map((b, i) => ({ ...b, displayOrder: i }));
    dirty = true;
  }

  function removeBlock(index: number): void {
    if (!window.confirm('Hapus blok ini?')) return;
    blocks = blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, displayOrder: i }));
    dirty = true;
  }

  function addBlock(): void {
    blocks = [
      ...blocks,
      {
        id: newBlockId(),
        type: newType,
        title: '',
        active: true,
        displayOrder: blocks.length
      } as MicrositeBlock
    ];
    dirty = true;
  }

  async function handleSave(): Promise<void> {
    saveError = '';
    saveNotice = '';
    saving = true;
    try {
      const saved = await saveBlocks(micrositeId, blocks);
      blocks = saved;
      dirty = false;
      saveNotice = 'Blok tersimpan dan langsung tampil di halaman publik.';
    } catch (e) {
      saveError = e instanceof Error ? e.message : 'Gagal menyimpan blok';
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    await authStore.load();
    if (!authStore.user) {
      loading = false;
      return;
    }
    try {
      const [m, b] = await Promise.all([getDashboardMicrosite(micrositeId), getBlocks(micrositeId)]);
      microsite = m;
      blocks = [...b].sort((a, b2) => (a.displayOrder ?? 0) - (b2.displayOrder ?? 0));
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Gagal memuat blok';
    } finally {
      loading = false;
    }
  });

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition';
  const labelClass = 'block text-[11px] font-bold text-[var(--color-muted-foreground)] mb-1';
</script>

<DashboardLayout title="Kelola Blok">
  {#if !authStore.loaded || loading}
    <p class="text-sm text-[var(--color-muted-foreground)]">Memuat…</p>
  {:else if !authStore.user}
    <div class="rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-5">
      <p class="text-sm text-[var(--color-text)] mb-4">Anda harus masuk untuk mengelola blok.</p>
      <Button onclick={() => navigate('/login')}>Masuk dengan Google</Button>
    </div>
  {:else if loadError}
    <p class="text-sm font-semibold text-red-500">{loadError}</p>
    <div class="mt-4">
      <Button variant="secondary" onclick={() => navigate('/dashboard')}>Kembali ke Dashboard</Button>
    </div>
  {:else if microsite}
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <p class="text-sm text-[var(--color-muted-foreground)]">
          Microsite: <span class="font-bold text-[var(--color-text)]">{microsite.name}</span>
          (/{microsite.slug}) · {blocks.length} blok
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          href={`/${microsite.slug}?preview=true`}
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:opacity-80 transition"
        >
          Pratinjau
        </a>
        <a
          href={`/${microsite.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:opacity-80 transition"
        >
          Buka Halaman Publik
        </a>
        <Button variant="secondary" onclick={() => navigate('/dashboard')}>Kembali</Button>
      </div>
    </div>

    {#if saveNotice}
      <p class="mb-4 text-xs font-semibold text-emerald-600">{saveNotice}</p>
    {/if}
    {#if saveError}
      <p class="mb-4 text-xs font-semibold text-red-500">{saveError}</p>
    {/if}

    <div class="space-y-3 mb-6">
      {#each blocks as block, i (block.id)}
        <article class="rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
              >
                {TYPE_LABELS[block.type] ?? block.type}
              </span>
              <label class="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <input
                  type="checkbox"
                  checked={block.active !== false}
                  onchange={(e) => {
                    const target = blocks.find((b) => b.id === block.id);
                    if (target) {
                      target.active = (e.target as HTMLInputElement).checked;
                      dirty = true;
                    }
                  }}
                />
                Aktif
              </label>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                disabled={i === 0}
                onclick={() => moveBlock(i, -1)}
                title="Pindah ke atas"
                class="px-2 py-1 rounded-lg border border-[var(--color-border)] text-xs font-bold disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === blocks.length - 1}
                onclick={() => moveBlock(i, 1)}
                title="Pindah ke bawah"
                class="px-2 py-1 rounded-lg border border-[var(--color-border)] text-xs font-bold disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onclick={() => removeBlock(i)}
                class="px-2 py-1 rounded-lg border border-red-500/40 text-xs font-bold text-red-500"
              >
                Hapus
              </button>
            </div>
          </div>
          {#if (FIELDS[block.type] ?? []).length === 0}
            <p class="text-xs text-[var(--color-muted-foreground)]">
              Blok spasi — tidak ada field. Gunakan tombol panah untuk mengatur jarak antar blok.
            </p>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each FIELDS[block.type] ?? [] as field (field.key)}
                <div class={field.multiline ? 'md:col-span-2' : ''}>
                  <label class={labelClass} for={`blk-${block.id}-${field.key}`}>{field.label}</label>
                  {#if field.multiline}
                    <textarea
                      id={`blk-${block.id}-${field.key}`}
                      rows="3"
                      value={(block as unknown as Record<string, string>)[field.key] ?? ''}
                      oninput={(e) =>
                        setField(block, field.key, (e.target as HTMLTextAreaElement).value)}
                      class={inputClass}
                    ></textarea>
                  {:else}
                    <input
                      id={`blk-${block.id}-${field.key}`}
                      value={(block as unknown as Record<string, string>)[field.key] ?? ''}
                      oninput={(e) =>
                        setField(block, field.key, (e.target as HTMLInputElement).value)}
                      class={inputClass}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
      {#if blocks.length === 0}
        <p class="text-sm text-[var(--color-muted-foreground)]">
          Belum ada blok. Tambah blok pertama di bawah.
        </p>
      {/if}
    </div>

    <div
      class="rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-4 flex flex-wrap items-center gap-3"
    >
      <label class="text-xs font-bold text-[var(--color-text)]" for="new-block-type">
        Tambah blok:
      </label>
      <select
        id="new-block-type"
        value={newType}
        onchange={(e) => (newType = (e.target as HTMLSelectElement).value as MicrositeBlockType)}
        class="{inputClass} !w-auto"
      >
        {#each Object.entries(TYPE_LABELS) as [type, label] (type)}
          <option value={type}>{label}</option>
        {/each}
      </select>
      <Button variant="secondary" onclick={addBlock}>＋ Tambah Blok</Button>
      <div class="flex-1"></div>
      <Button disabled={!dirty || saving} onclick={handleSave}>
        {saving ? 'Menyimpan…' : dirty ? 'Simpan Blok *' : 'Blok Tersimpan'}
      </Button>
    </div>
    {#if dirty}
      <p class="text-[11px] text-[var(--color-muted-foreground)] mt-2">
        * Ada perubahan belum tersimpan.
      </p>
    {/if}
  {/if}
</DashboardLayout>
