/**
 * Lapisan data baca (mayoritas) untuk aplikasi microsite mandiri.
 *
 * Menggantikan `lib/firebase.ts` web utama TANPA dependensi Firebase: fungsi
 * yang dipakai `micrositeService`/`siteSettingsService` diimplementasikan
 * langsung terhadap endpoint `/api/db/*` backend aplikasi ini, yang membaca
 * tabel `items`/`kv_store` di puskesmas.db yang sama dengan web utama.
 *
 * Hanya operasi baca yang dipakai jalur publik. `saveDocumentData` /
 * `saveSingleDocument` dipertahankan untuk kompatibilitas signature dan
 * diteruskan ke backend (dipakai jalur admin di web utama, bukan di sini).
 */

import { apiFetch } from './api';
import { memStore } from './memStore';

function memGet<T>(key: string): T | null {
  try {
    const raw = memStore.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function memSet(key: string, value: unknown): void {
  try {
    memStore.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function getCollectionData<T extends { id?: string; uid?: string }>(
  collectionName: string,
  cacheKey: string,
  defaultInitialData: T[] = []
): Promise<T[]> {
  const cached = memGet<T[]>(cacheKey);
  const fetchFromServer = async (): Promise<T[] | null> => {
    try {
      const res = await apiFetch(`/api/db/${collectionName}?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) return json.data as T[];
        if (json.docs && Array.isArray(json.docs)) return json.docs as T[];
        if (Array.isArray(json)) return json as T[];
      }
    } catch {}
    return null;
  };

  // Render instan dari cache, lalu perbarui dari server di latar.
  if (cached && cached.length > 0) {
    fetchFromServer().then((list) => {
      if (list) memSet(cacheKey, list);
    });
    return cached;
  }
  const serverList = await fetchFromServer();
  if (serverList) {
    memSet(cacheKey, serverList);
    return serverList;
  }
  return defaultInitialData;
}

export async function saveDocumentData<T extends { id?: string; uid?: string; slug?: string }>(
  collectionName: string,
  doc: T
): Promise<T> {
  const res = await apiFetch(`/api/db/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc)
  });
  if (!res.ok) throw new Error(`Gagal menyimpan ${collectionName}`);
  const json = await res.json();
  return (json.data ?? doc) as T;
}

export async function deleteDocumentData(collectionName: string, docId: string): Promise<void> {
  const res = await apiFetch(`/api/db/${collectionName}/${encodeURIComponent(docId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Gagal menghapus ${collectionName}/${docId}`);
}

export async function saveSingleDocument<T>(collectionName: string, doc: T): Promise<T> {
  const res = await apiFetch(`/api/db/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc)
  });
  if (!res.ok) throw new Error(`Gagal menyimpan ${collectionName}`);
  const json = await res.json();
  return (json.data ?? doc) as T;
}

export async function getSingleDocument<T>(collectionName: string): Promise<T | null> {
  try {
    const res = await apiFetch(`/api/db/${collectionName}?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data !== undefined) return json.data as T;
      if (json.docs) return json.docs as T;
    }
  } catch {}
  return null;
}
