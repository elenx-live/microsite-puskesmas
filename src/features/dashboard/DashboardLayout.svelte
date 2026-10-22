<!-- @component Tata letak halaman terotentikasi (dashboard, profil, admin, editor blok). -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import AuthMenu from '../auth/AuthMenu.svelte';
  import { authStore } from '../../shared/stores/auth.svelte.js';
  import { navigate } from '../../app/router.svelte.js';

  interface Props {
    /** Judul halaman yang tampil di bilah atas. */
    title: string;
    /** Isi halaman. */
    children?: Snippet;
  }

  const { title, children }: Props = $props();

  function go(path: string): void {
    navigate(path);
  }
</script>

<div class="min-h-screen bg-[var(--color-bg)]">
  <div class="border-b border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-sm sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onclick={() => go('/')}
          class="text-sm font-bold text-[var(--color-text)] truncate hover:text-[var(--color-primary)] transition"
        >
          Microsite Puskesmas Manding
        </button>
        <nav class="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onclick={() => go('/dashboard')}
            class="px-3 py-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
          >
            Dashboard
          </button>
          <button
            type="button"
            onclick={() => go('/profil')}
            class="px-3 py-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
          >
            Profil
          </button>
          {#if authStore.isAdmin}
            <button
              type="button"
              onclick={() => go('/admin')}
              class="px-3 py-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
            >
              Kelola User
            </button>
          {/if}
        </nav>
      </div>
      <AuthMenu />
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-[var(--color-text)] mb-6">{title}</h1>
    {@render children?.()}
  </div>
</div>
