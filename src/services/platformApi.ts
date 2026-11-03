/**
 * platformApi.ts — Klien API multi-user (pengelola & admin).
 * Semua panggilan membawa cookie sesi (credentials: 'include').
 */

async function req<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || (data as any)?.message || 'Permintaan gagal.');
  return data as T;
}

export interface DashboardPrefs {
  theme?: 'light' | 'dark' | 'teal' | 'slate';
  layout?: 'grid' | 'list';
  accent?: string;
  widgets?: string[];
  shortcuts?: string[];
  showStats?: boolean;
  showRecent?: boolean;
  showTips?: boolean;
}

export const platformApi = {
  // Profil & dashboard pengelola
  getPrefs: () => req<{ prefs: DashboardPrefs }>('/api/me/dashboard-prefs'),
  savePrefs: (prefs: DashboardPrefs) =>
    req('/api/me/dashboard-prefs', { method: 'POST', body: JSON.stringify(prefs) }),
  getSummary: () => req<{ stats: any; microsites: any[] }>('/api/me/summary'),
  updateProfile: (patch: Record<string, any>) =>
    req('/api/me/profile', { method: 'POST', body: JSON.stringify(patch) }),

  // Microsite (owner-scoped di backend)
  listMicrosites: () => req<{ microsites: any[] }>('/api/microsites'),
  saveMicrosite: (m: any) => req<{ microsite: any }>('/api/microsites', { method: 'POST', body: JSON.stringify(m) }),
  deleteMicrosite: (id: string) => req(`/api/microsites/${id}`, { method: 'DELETE' }),
  getPublicMicrosite: (slug: string) => req<{ microsite: any }>(`/api/public/microsite/${encodeURIComponent(slug)}`),

  // Admin Panel
  adminOverview: () => req<any>('/api/admin/overview'),
  adminUsers: () => req<{ users: any[] }>('/api/admin/users'),
  adminCreateUser: (u: any) => req('/api/admin/users', { method: 'POST', body: JSON.stringify(u) }),
  adminUpdateUser: (id: string, patch: any) => req(`/api/admin/users/${id}`, { method: 'POST', body: JSON.stringify(patch) }),
  adminArchiveUser: (id: string) => req(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminMicrosites: () => req<{ microsites: any[] }>('/api/admin/microsites'),
  adminToggleMicrosite: (id: string) => req(`/api/admin/microsites/${id}/toggle`, { method: 'POST', body: '{}' }),
  adminDeleteMicrosite: (id: string) => req(`/api/admin/microsites/${id}`, { method: 'DELETE' }),
  adminSaveSettings: (s: any) => req('/api/admin/settings', { method: 'POST', body: JSON.stringify(s) }),
  adminAudit: (limit = 100) => req<{ audit: any[] }>(`/api/admin/audit?limit=${limit}`),
};
