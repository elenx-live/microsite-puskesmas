/**
 * State sesi login aplikasi microsite (Svelte 5 runes).
 *
 * Sesi disimpan di cookie httpOnly `microsite_session` oleh server — TIDAK
 * ada data di localStorage/sessionStorage/IndexedDB. Modul ini hanya
 * menyimpan profil user di memori selama halaman terbuka; setiap refresh
 * halaman memanggil lagi GET /api/auth/me.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: 'admin' | 'petugas' | 'user';
  createdAt: string;
  micrositeCount?: number;
}

export class AuthStore {
  /** Profil user login, null bila belum login / belum dimuat. */
  user = $state<AuthUser | null>(null);
  /** True setelah /api/auth/me pertama selesai (berhasil maupun 401). */
  loaded = $state(false);
  private pending: Promise<AuthUser | null> | null = null;

  /** Muat profil dari server (di-cache selama satu siklus halaman). */
  load(force = false): Promise<AuthUser | null> {
    if (this.loaded && !force) return Promise.resolve(this.user);
    if (this.pending && !force) return this.pending;
    this.pending = fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) {
          this.user = null;
          return null;
        }
        const json = await res.json();
        this.user = (json.user ?? null) as AuthUser | null;
        return this.user;
      })
      .catch(() => {
        this.user = null;
        return null;
      })
      .finally(() => {
        this.loaded = true;
        this.pending = null;
      });
    return this.pending;
  }

  /** Keluar: hapus sesi di server lalu kosongkan state lokal. */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Abaikan — state lokal tetap dibersihkan.
    }
    this.user = null;
  }

  /** True bila user login adalah admin. */
  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  /** True bila user login adalah admin atau petugas. */
  get isStaff(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'petugas';
  }
}

export const authStore = new AuthStore();
