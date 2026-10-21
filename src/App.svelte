<!--
  @component Router aplikasi microsite mandiri (path-based, tanpa hash).

  Rute: "/" daftar microsite, "/:slug" halaman microsite, "/m/:slug" dan
  "/microsite/:slug" diterima sebagai alias (kompatibel tautan lama).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { routerState, syncRouterFromLocation } from './app/router.svelte.js';
  import CategoriesPage from './features/microsite/MicrositeCategoriesPage.svelte';
  import MicrositePage from './features/microsite/index.svelte';

  onMount(() => {
    syncRouterFromLocation();
  });

  const slug = $derived.by(() => {
    const p = routerState.path.replace(/^\/+|\/+$/g, '');
    if (!p) return '';
    const parts = p.split('/');
    if (parts.length === 1) return parts[0];
    if ((parts[0] === 'm' || parts[0] === 'microsite') && parts[1]) return parts[1];
    return '';
  });
</script>

{#if routerState.path === '/' || routerState.path === '' || routerState.path === '/m' || routerState.path === '/microsites'}
  <CategoriesPage />
{:else if slug}
  <MicrositePage slug={slug} />
{:else}
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-family:Inter,system-ui,sans-serif;text-align:center;padding:24px">
    <h1 style="font-size:22px;font-weight:700">Microsite tidak ditemukan</h1>
    <p style="color:#60756C">Tautan yang Anda buka tidak mengarah ke microsite yang aktif.</p>
    <a href="/" style="color:#18A878;font-weight:600">Kembali ke daftar microsite</a>
  </div>
{/if}
