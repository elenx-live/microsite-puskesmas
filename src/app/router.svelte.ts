/**
 * Router minimal aplikasi microsite mandiri (path-based).
 *
 * Menyediakan bentuk yang sama dengan yang dipakai halaman microsite di web
 * utama (`routerState.path`, `routerState.query`, `navigate()`), supaya file
 * fitur yang disalin tidak perlu diubah. Tidak ada login di aplikasi ini:
 * tidak ada `authStore` — mode pratinjau hanya lewat `?preview=true`.
 */

export const routerState = $state({
  path: '/',
  query: {} as Record<string, string>
});

export function syncRouterFromLocation(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  routerState.path = url.pathname || '/';
  const q: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    q[k] = v;
  });
  routerState.query = q;
}

export function navigate(path: string): void {
  if (typeof window === 'undefined') return;
  window.history.pushState({}, '', path);
  syncRouterFromLocation();
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', syncRouterFromLocation);
  syncRouterFromLocation();
}
