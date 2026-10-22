/**
 * Klien API dashboard/admin/profil microsite mandiri.
 *
 * Semua panggilan memakai cookie sesi httpOnly (credentials: same-origin);
 * tidak ada token di JavaScript maupun di storage browser.
 */
import type { MicrositeEntity, MicrositeBlock, MicrositeCategory } from '../types/index.js';
import type { AuthUser } from '../stores/auth.svelte.js';

export interface DashboardMicrosite extends MicrositeEntity {
  owner_id?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
}

export interface CategoryRow extends MicrositeCategory {
  id: string;
}

export interface AdminUserRow extends AuthUser {
  micrositeCount: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init });
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    // Biarkan penanganan error di bawah memakai status HTTP.
  }
  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

/** Daftar microsite: milik sendiri (user) atau semua (petugas/admin). */
export async function getDashboardMicrosites(): Promise<DashboardMicrosite[]> {
  const json = await api<{ success: boolean; data: DashboardMicrosite[] }>('/api/dashboard/microsites');
  return json.data;
}

export interface MicrositeInput {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  template?: string;
  theme?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  footerImageUrl?: string;
  status?: 'published' | 'draft';
  active?: boolean;
}

/** Buat microsite baru (status awal draf). */
export async function createMicrosite(input: MicrositeInput): Promise<DashboardMicrosite> {
  const json = await api<{ success: boolean; data: DashboardMicrosite }>('/api/dashboard/microsites', {
    method: 'POST',
    ...jsonBody(input)
  });
  return json.data;
}

/** Ambil satu microsite untuk edit (wajib pemilik/petugas/admin). */
export async function getDashboardMicrosite(id: string): Promise<DashboardMicrosite> {
  const json = await api<{ success: boolean; data: DashboardMicrosite }>(
    `/api/dashboard/microsites/${encodeURIComponent(id)}`
  );
  return json.data;
}

/** Ubah metadata microsite (sebagian field saja boleh dikirim). */
export async function updateMicrosite(
  id: string,
  patch: Partial<MicrositeInput>
): Promise<DashboardMicrosite> {
  const json = await api<{ success: boolean; data: DashboardMicrosite }>(
    `/api/dashboard/microsites/${encodeURIComponent(id)}`,
    { method: 'PATCH', ...jsonBody(patch) }
  );
  return json.data;
}

/** Hapus microsite permanen. */
export async function deleteMicrosite(id: string): Promise<void> {
  await api(`/api/dashboard/microsites/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Daftar blok sebuah microsite. */
export async function getBlocks(micrositeId: string): Promise<MicrositeBlock[]> {
  const json = await api<{ success: boolean; blocks: MicrositeBlock[] }>(
    `/api/dashboard/microsites/${encodeURIComponent(micrositeId)}/blocks`
  );
  return json.blocks;
}

/** Simpan seluruh daftar blok (urutan = urutan array). */
export async function saveBlocks(
  micrositeId: string,
  blocks: MicrositeBlock[]
): Promise<MicrositeBlock[]> {
  const json = await api<{ success: boolean; blocks: MicrositeBlock[] }>(
    `/api/dashboard/microsites/${encodeURIComponent(micrositeId)}/blocks`,
    { method: 'PUT', ...jsonBody({ blocks }) }
  );
  return json.blocks;
}

/** Daftar kategori (login wajib; dipakai form microsite + kelola kategori). */
export async function getDashboardCategories(): Promise<CategoryRow[]> {
  const json = await api<{ success: boolean; data: CategoryRow[] }>('/api/dashboard/categories');
  return json.data;
}

/** Tambah kategori (petugas/admin). */
export async function createCategory(name: string, description: string): Promise<CategoryRow> {
  const json = await api<{ success: boolean; data: CategoryRow }>('/api/dashboard/categories', {
    method: 'POST',
    ...jsonBody({ name, description })
  });
  return json.data;
}

/** Ubah kategori (petugas/admin; ganti nama dipropagasi ke microsite). */
export async function updateCategory(
  id: string,
  patch: { name?: string; description?: string }
): Promise<CategoryRow> {
  const json = await api<{ success: boolean; data: CategoryRow }>(
    `/api/dashboard/categories/${encodeURIComponent(id)}`,
    { method: 'PATCH', ...jsonBody(patch) }
  );
  return json.data;
}

/** Hapus kategori (petugas/admin; ditolak bila 'Umum' atau sedang dipakai). */
export async function deleteCategory(id: string): Promise<void> {
  await api(`/api/dashboard/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Daftar user (admin saja). */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const json = await api<{ success: boolean; data: AdminUserRow[] }>('/api/users');
  return json.data;
}

/** Ubah role user (admin saja). */
export async function updateUserRole(
  id: string,
  role: 'admin' | 'petugas' | 'user'
): Promise<AuthUser> {
  const json = await api<{ success: boolean; user: AuthUser }>(
    `/api/users/${encodeURIComponent(id)}/role`,
    { method: 'PATCH', ...jsonBody({ role }) }
  );
  return json.user;
}

/** Ubah nama tampilan profil sendiri. */
export async function updateProfileName(name: string): Promise<AuthUser> {
  const json = await api<{ success: boolean; user: AuthUser }>('/api/profile', {
    method: 'PATCH',
    ...jsonBody({ name })
  });
  return json.user;
}
