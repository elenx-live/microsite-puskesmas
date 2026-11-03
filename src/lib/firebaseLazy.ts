/**
 * firebaseLazy.ts — VERSI APP MICROSITE MANDIRI (berbasis REST server, tanpa Firebase SDK).
 *
 * App microsite sengaja TIDAK memuat Firebase. Semua data microsite dibaca/ditulis
 * lewat API server (/api/microsites, ...). Modul ini menyediakan tanda tangan fungsi
 * yang sama dengan versi panel, tetapi implementasinya memakai fetch ke server.
 */

export const getCollectionData = async <T extends { id?: string; uid?: string }>(
  collectionName: string,
  _storageKey: string,
  seedData?: T[]
): Promise<T[]> => {
  try {
    const res = await fetch(`/api/data/${encodeURIComponent(collectionName)}`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      const items = json.items ?? json.data ?? json;
      if (Array.isArray(items)) return items as T[];
    }
  } catch {}
  return seedData ?? [];
};

export const getSingleDocument = async <T>(
  collectionName: string,
  docId: string,
  _storageKey: string,
  fallbackSeed?: T
): Promise<T> => {
  const all = await getCollectionData<{ id?: string; uid?: string }>(collectionName, _storageKey);
  const found = all.find((x) => x.id === docId || (x as any).uid === docId);
  return (found as unknown as T) ?? (fallbackSeed as T);
};

export const saveDocumentData = async <T extends { id?: string; uid?: string; slug?: string }>(
  collectionName: string,
  docId: string,
  data: T,
  _storageKey: string
): Promise<void> => {
  try {
    await fetch(`/api/data/${encodeURIComponent(collectionName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: docId, data }),
    });
  } catch {}
};

export const deleteDocumentData = async (
  collectionName: string,
  docId: string,
  _storageKey: string
): Promise<void> => {
  try {
    await fetch(`/api/data/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {}
};

export const saveSingleDocument = saveDocumentData;

/**
 * Tidak ada Firestore langsung di app mandiri (standalone).
 * Kembalikan helper no-op bertipe longgar agar jalur fallback di
 * pemanggil tetap lolos type-check dan error-nya tertangkap try/catch.
 */
export const getFirestoreHelpers = async (): Promise<{
  db: unknown;
  collection: (...args: any[]) => any;
  query: (...args: any[]) => any;
  where: (...args: any[]) => any;
  getDocs: (...args: any[]) => Promise<any>;
}> => {
  throw new Error('Firestore langsung tidak tersedia di app Microsite mandiri.');
};
