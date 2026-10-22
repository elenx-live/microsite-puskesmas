<!--
  @component Router aplikasi microsite mandiri (path-based, tanpa hash).

  Rute: "/" daftar microsite, "/:slug" halaman microsite, "/m/:slug" dan
  "/microsite/:slug" diterima sebagai alias (kompatibel tautan lama).
  Rute aplikasi yang dicadangkan (diperiksa SEBELUM slug): "/login",
  "/profil", "/dashboard", "/dashboard/:id/blok", "/admin".
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { routerState, syncRouterFromLocation } from './app/router.svelte.js';
  import { authStore } from './shared/stores/auth.svelte.js';
  import CategoriesPage from './features/microsite/MicrositeCategoriesPage.svelte';
  import MicrositePage from './features/microsite/index.svelte';
  import LoginPage from './features/auth/LoginPage.svelte';
  import ProfilePage from './features/profile/ProfilePage.svelte';
  import DashboardPage from './features/dashboard/DashboardPage.svelte';
  import BlockEditorPage from './features/dashboard/BlockEditorPage.svelte';
  import AdminUsersPage from './features/admin/AdminUsersPage.svelte';

  onMount(() => {
    syncRouterFromLocation();
    // Muat sesi lebih awal supaya halaman publik tahu apakah draf boleh dibuka.
    authStore.load();
  });

  const pathParts = $derived(
    routerState.path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  );

  const isLogin = $derived(routerState.path === '/login');
  const isProfile = $derived(routerState.path === '/profil');
  const isAdminPage = $derived(routerState.path === '/admin');
  const isDashboard = $derived(routerState.path === '/dashboard');
  const blockEditorId = $derived(
    pathParts[0] === 'dashboard' && pathParts[2] === 'blok' && pathParts[1]
      ? pathParts[1]
      : ''
  );

  const slug = $derived.by(() => {
    const p = routerState.path.replace(/^\/+|\/+$/g, '');
    if (!p) return '';
    const parts = p.split('/');
    // Rute aplikasi bukan slug microsite.
    if (['login', 'profil', 'dashboard', 'admin'].includes(parts[0])) return '';
    if (parts.length === 1) return parts[0];
    if ((parts[0] === 'm' || parts[0] === 'microsite') && parts[1]) return parts[1];
    return '';
  });
</script>

{#if isLogin}
  <LoginPage />
{:else if isProfile}
  <ProfilePage />
{:else if isDashboard}
  <DashboardPage />
{:else if blockEditorId}
  <BlockEditorPage micrositeId={blockEditorId} />
{:else if isAdminPage}
  <AdminUsersPage />
{:else if routerState.path === '/' || routerState.path === '' || routerState.path === '/m' || routerState.path === '/microsites'}
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
