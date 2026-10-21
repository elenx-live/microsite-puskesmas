/**
 * Tautan dari microsite kembali ke web utama.
 *
 * Microsite menyimpan tautan "internal" seperti `/layanan` atau `/berita`
 * yang hidup di web utama. Di domain microsite sendiri tautan itu tidak
 * ada — jadi tautan internal relatif selalu diarahkan ke web utama.
 */
export const MAIN_WEB_ORIGIN = 'https://sumenep.puskesmasmanding.com';

/** Ubah URL tautan microsite menjadi URL final yang bisa diklik. */
export function resolveMicrositeLinkUrl(url: string): string {
  const u = (url || '').trim();
  if (!u) return u;
  if (u.startsWith('http') || u.startsWith('tel:') || u.startsWith('mailto:') || u.startsWith('#')) {
    return u;
  }
  if (u.startsWith('/')) return MAIN_WEB_ORIGIN + u;
  return u;
}
