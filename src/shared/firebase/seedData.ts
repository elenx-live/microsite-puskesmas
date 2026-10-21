/**
 * Seed minimal pengganti `firebase/seedData` web utama.
 *
 * Hanya nilai yang dipakai jalur publik: `INITIAL_SITE_SETTINGS` untuk
 * `siteSettingsService.getCachedSettings()`. Nilai lain (mis. daftar
 * microsite awal) tidak dipakai karena data selalu dibaca dari server.
 */
export const INITIAL_SITE_SETTINGS = {
  siteName: 'Puskesmas Manding',
  shortName: 'Puskesmas Manding',
  siteTitle: 'Puskesmas Manding - Portal Resmi & Pelayanan Terpadu',
  siteDescription:
    'Portal informasi dan pelayanan kesehatan resmi Puskesmas Manding: Layanan kesehatan primer, pendaftaran online, berita kesehatan, jadwal dokter, microsite, dan pengaduan masyarakat.',
  tagline: 'Bismillah Melayani, Anda Sehat Kami Puas',
  logoUrl: '/logo.png',
  ogImageUrl: '/logo.png',
  address: 'Jl. Raya Manding, Kec. Manding, Kab. Sumenep, Jawa Timur',
  phone: '(0328) 667123',
  email: 'puskesmasmanding@gmail.com'
};

export const INITIAL_AUDIT_LOGS: unknown[] = [];
