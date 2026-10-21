/**
 * In-memory storage — pengganti drop-in untuk localStorage/sessionStorage.
 *
 * ATURAN: jangan simpan data di browser. Modul ini meniru API
 * localStorage (getItem/setItem/removeItem) tetapi menyimpan semuanya
 * di memori saja. Data hilang saat halaman di-refresh.
 *
 * Penggunaan: ganti `localStorage` -> `memStore` (atau `sessionStorage` -> `memStore`)
 * dan tambahkan import: `import { memStore } from '../lib/memStore';`
 * (sesuaikan path relatif).
 */

const store = new Map<string, string>();

export const memStore = {
  getItem(key: string): string | null {
    return store.has(key) ? store.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    store.set(key, String(value));
  },
  removeItem(key: string): void {
    store.delete(key);
  },
  /** Alias agar kompatibel dengan pola sessionStorage */
  clear(): void {
    store.clear();
  }
};

export default memStore;
