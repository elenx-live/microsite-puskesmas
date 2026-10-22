<!-- @component Halaman admin: daftar user + ubah role (khusus admin). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardLayout from '../dashboard/DashboardLayout.svelte';
  import Button from '../../shared/ui/Button.svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';
  import {
    getAdminUsers,
    updateUserRole,
    type AdminUserRow
  } from '../../shared/services/dashboardService.js';

  const ROLES: Array<{ id: 'admin' | 'petugas' | 'user'; label: string }> = [
    { id: 'admin', label: 'Admin (semua + kelola user)' },
    { id: 'petugas', label: 'Petugas (kelola semua microsite + kategori)' },
    { id: 'user', label: 'User (hanya microsite sendiri)' }
  ];

  let users = $state<AdminUserRow[]>([]);
  let loading = $state(true);
  let loadError = $state('');
  let notice = $state('');
  let savingId = $state<string | null>(null);

  onMount(async () => {
    await authStore.load();
    if (!authStore.user) {
      loading = false;
      return;
    }
    if (!authStore.isAdmin) {
      loading = false;
      return;
    }
    try {
      users = await getAdminUsers();
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Gagal memuat daftar user';
    } finally {
      loading = false;
    }
  });

  async function changeRole(user: AdminUserRow, role: 'admin' | 'petugas' | 'user'): Promise<void> {
    if (role === user.role) return;
    savingId = user.id;
    notice = '';
    loadError = '';
    try {
      const updated = await updateUserRole(user.id, role);
      users = users.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u));
      notice = `Role ${user.name} diubah menjadi ${role}.`;
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Gagal mengubah role';
    } finally {
      savingId = null;
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  const cardClass =
    'rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-5';
  const selectClass =
    'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition';
</script>

<DashboardLayout title="Kelola User">
  {#if !authStore.loaded || loading}
    <p class="text-sm text-[var(--color-muted-foreground)]">Memuat…</p>
  {:else if !authStore.user}
    <div class={cardClass}>
      <p class="text-sm text-[var(--color-text)] mb-4">Anda harus masuk.</p>
      <Button onclick={() => navigate('/login')}>Masuk dengan Google</Button>
    </div>
  {:else if !authStore.isAdmin}
    <div class={cardClass}>
      <p class="text-sm font-semibold text-red-500">
        Halaman ini khusus admin. Role Anda: {authStore.user.role}.
      </p>
    </div>
  {:else}
    {#if notice}
      <p class="mb-4 text-xs font-semibold text-emerald-600">{notice}</p>
    {/if}
    {#if loadError}
      <p class="mb-4 text-xs font-semibold text-red-500">{loadError}</p>
    {/if}
    {#if users.length === 0}
      <div class={cardClass}>
        <p class="text-sm text-[var(--color-muted-foreground)]">Belum ada user.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each users as user (user.id)}
          <div class="{cardClass} flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-3 flex-1 min-w-[220px]">
              {#if user.picture}
                <img
                  src={user.picture}
                  alt=""
                  referrerpolicy="no-referrer"
                  class="w-10 h-10 rounded-xl object-cover"
                />
              {:else}
                <span
                  class="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center font-bold"
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
              {/if}
              <div class="min-w-0">
                <p class="text-sm font-bold text-[var(--color-text)] truncate">{user.name}</p>
                <p class="text-xs text-[var(--color-muted-foreground)] truncate">
                  {user.email} · bergabung {formatDate(user.createdAt)} · {user.micrositeCount} microsite
                </p>
              </div>
            </div>
            <select
              value={user.role}
              disabled={savingId === user.id}
              onchange={(e) =>
                changeRole(user, (e.target as HTMLSelectElement).value as 'admin' | 'petugas' | 'user')}
              class={selectClass}
              aria-label={`Role untuk ${user.name}`}
            >
              {#each ROLES as role (role.id)}
                <option value={role.id}>{role.label}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
      <p class="text-[11px] text-[var(--color-muted-foreground)] mt-4">
        Catatan: user tidak dapat dihapus dari halaman ini (sesuai ketentuan). Admin terakhir
        tidak dapat diturunkan rolenya.
      </p>
    {/if}
  {/if}
</DashboardLayout>
