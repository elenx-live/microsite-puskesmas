<!-- @component Halaman profil user login: info akun, jumlah microsite, edit nama, keluar. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardLayout from '../dashboard/DashboardLayout.svelte';
  import Button from '../../shared/ui/Button.svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';
  import { updateProfileName } from '../../shared/services/dashboardService.js';

  let editMode = $state(false);
  let formError = $state('');
  let formNotice = $state('');
  let busy = $state(false);

  onMount(async () => {
    await authStore.load();
  });

  async function handleNameSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    formError = '';
    formNotice = '';
    busy = true;
    try {
      const updated = await updateProfileName(name);
      authStore.user = { ...authStore.user, ...updated } as typeof authStore.user;
      formNotice = 'Nama tampilan diperbarui.';
      editMode = false;
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Gagal menyimpan nama';
    } finally {
      busy = false;
    }
  }

  async function doLogout(): Promise<void> {
    await authStore.logout();
    navigate('/');
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  const cardClass =
    'rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-6';
  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition';
</script>

<DashboardLayout title="Profil Saya">
  {#if !authStore.loaded}
    <p class="text-sm text-[var(--color-muted-foreground)]">Memuat…</p>
  {:else if !authStore.user}
    <div class={cardClass}>
      <p class="text-sm text-[var(--color-text)] mb-4">Anda belum masuk.</p>
      <Button onclick={() => navigate('/login')}>Masuk dengan Google</Button>
    </div>
  {:else}
    <div class="max-w-2xl space-y-4">
      <div class={cardClass}>
        <div class="flex items-center gap-4">
          {#if authStore.user.picture}
            <img
              src={authStore.user.picture}
              alt=""
              referrerpolicy="no-referrer"
              class="w-16 h-16 rounded-2xl object-cover"
            />
          {:else}
            <span
              class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center text-2xl font-bold"
            >
              {authStore.user.name.trim().charAt(0).toUpperCase()}
            </span>
          {/if}
          <div class="min-w-0">
            <h2 class="text-lg font-bold text-[var(--color-text)] truncate">{authStore.user.name}</h2>
            <p class="text-sm text-[var(--color-muted-foreground)] truncate">{authStore.user.email}</p>
            <p class="text-xs text-[var(--color-muted-foreground)] mt-1">
              Role:
              <span class="font-bold text-[var(--color-text)]">{authStore.user.role}</span>
              · Bergabung {formatDate(authStore.user.createdAt)}
              · {authStore.user.micrositeCount ?? 0} microsite milik Anda
            </p>
          </div>
        </div>
      </div>

      <div class={cardClass}>
        {#if !editMode}
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-bold text-[var(--color-text)] text-sm">Nama tampilan</h3>
              <p class="text-xs text-[var(--color-muted-foreground)] mt-1">
                Nama ini tampil sebagai pemilik microsite Anda di dashboard.
              </p>
            </div>
            <Button variant="secondary" onclick={() => (editMode = true)}>Ubah Nama</Button>
          </div>
        {:else}
          <form onsubmit={handleNameSubmit} class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[var(--color-text)] mb-1.5" for="profile-name">
                Nama tampilan
              </label>
              <input
                id="profile-name"
                name="name"
                required
                maxlength="100"
                value={authStore.user.name}
                class={inputClass}
              />
            </div>
            {#if formError}
              <p class="text-xs font-semibold text-red-500">{formError}</p>
            {/if}
            <div class="flex gap-2">
              <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Nama'}</Button>
              <Button type="button" variant="secondary" onclick={() => (editMode = false)}>Batal</Button>
            </div>
          </form>
        {/if}
        {#if formNotice}
          <p class="text-xs font-semibold text-emerald-600 mt-3">{formNotice}</p>
        {/if}
      </div>

      <div class={cardClass}>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-[var(--color-text)] text-sm">Sesi</h3>
            <p class="text-xs text-[var(--color-muted-foreground)] mt-1">
              Keluar menghapus sesi di perangkat ini.
            </p>
          </div>
          <Button variant="danger" onclick={doLogout}>Keluar</Button>
        </div>
      </div>
    </div>
  {/if}
</DashboardLayout>
