/**
 * Pengganti ringan `apiFetch` web utama untuk aplikasi microsite mandiri.
 *
 * Halaman publik tidak memakai login, jadi tidak ada header auth: cukup
 * `fetch` same-origin ke backend aplikasi ini sendiri.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { ...init });
}
