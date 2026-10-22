<!-- @component Menu akun di bilah atas: avatar + nama user login, atau tombol Masuk. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';

  let open = $state(false);

  onMount(() => {
    authStore.load();
  });

  function go(path: string): void {
    open = false;
    navigate(path);
  }

  async function doLogout(): Promise<void> {
    open = false;
    await authStore.logout();
    navigate('/');
  }

  function initialLetter(name: string): string {
    const first = (name || '?').trim().charAt(0);
    return first ? first.toUpperCase() : '?';
  }
</script>

{#if authStore.loaded && authStore.user}
  <div class="relative shrink-0">
    <button
      type="button"
      onclick={() => (open = !open)}
      aria-expanded={open}
      aria-haspopup="menu"
      class="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/90 pl-1 pr-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:opacity-90 transition"
    >
      {#if authStore.user.picture}
        <img
          src={authStore.user.picture}
          alt=""
          referrerpolicy="no-referrer"
          class="w-7 h-7 rounded-lg object-cover"
        />
      {:else}
        <span
          class="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center font-bold"
        >
          {initialLetter(authStore.user.name)}
        </span>
      {/if}
      <span class="max-w-[120px] truncate hidden sm:inline">{authStore.user.name}</span>
      <span class="text-[var(--color-muted-foreground)]">▾</span>
    </button>

    {#if open}
      <button
        type="button"
        aria-label="Tutup menu akun"
        class="fixed inset-0 z-40 cursor-default"
        onclick={() => (open = false)}
      ></button>
      <div
        role="menu"
        class="absolute right-0 z-50 mt-2 w-52 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-lg p-1.5"
      >
        <div class="px-3 py-2 border-b border-[var(--color-border)] mb-1">
          <p class="text-xs font-bold text-[var(--color-text)] truncate">{authStore.user.name}</p>
          <p class="text-[11px] text-[var(--color-muted-foreground)] truncate">
            {authStore.user.email} · {authStore.user.role}
          </p>
        </div>
        <button
          type="button"
          role="menuitem"
          onclick={() => go('/profil')}
          class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition"
        >
          Profil Saya
        </button>
        <button
          type="button"
          role="menuitem"
          onclick={() => go('/dashboard')}
          class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition"
        >
          Dashboard
        </button>
        {#if authStore.isAdmin}
          <button
            type="button"
            role="menuitem"
            onclick={() => go('/admin')}
            class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition"
          >
            Kelola User
          </button>
        {/if}
        <button
          type="button"
          role="menuitem"
          onclick={doLogout}
          class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
        >
          Keluar
        </button>
      </div>
    {/if}
  </div>
{:else if authStore.loaded}
  <a
    href="/login"
    onclick={(e) => {
      e.preventDefault();
      navigate('/login');
    }}
    class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition"
  >
    Masuk
  </a>
{/if}
