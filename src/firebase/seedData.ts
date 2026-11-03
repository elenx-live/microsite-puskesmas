import { UserRole, UserPermission, AppUser, SiteSettings, AuditLog, ComplaintEntity } from '../types';

export const DEFAULT_PERMISSIONS: UserPermission[] = [
  // CORE & USERS
  { id: 'p-1', code: 'manage_users', name: 'Kelola Pengguna', module: 'Sistem', description: 'Membuat, mengubah, dan mentransfer status pengguna.' },
  { id: 'p-2', code: 'manage_roles_permissions', name: 'Kelola Peran & Izin', module: 'Sistem', description: 'Mengatur peran RBAC dan izin granular.' },
  { id: 'p-3', code: 'view_audit_logs', name: 'Lihat Audit Log', module: 'Sistem', description: 'Melihat riwayat aktivitas dan jejak audit keamanan.' },
  { id: 'p-4', code: 'manage_site_settings', name: 'Kelola Pengaturan Situs', module: 'Sistem', description: 'Mengubah profil Puskesmas, kontak, dan alamat.' },

  // CONTENT & MEDIA
  { id: 'p-5', code: 'manage_pages_menus', name: 'Kelola Halaman & Menu', module: 'Konten', description: 'Mengatur halaman dinamis dan navigasi menu.' },
  { id: 'p-6', code: 'manage_posts_announcements', name: 'Kelola Berita & Pengumuman', module: 'Konten', description: 'Menulis, mengedit, dan mempublikasikan artikel.' },
  { id: 'p-7', code: 'manage_media', name: 'Kelola Media Library', module: 'Konten', description: 'Mengunggah dan mengorganisir dokumen & gambar.' },

  // HEALTH SERVICES (PERMENKES 19/2024)
  { id: 'p-8', code: 'manage_services_clusters', name: 'Kelola Klaster & Layanan', module: 'Pelayanan', description: 'Mengelola 5 klaster kesehatan dan unit pelayanan.' },
  { id: 'p-9', code: 'manage_service_standards', name: 'Kelola Standar Pelayanan', module: 'Pelayanan', description: 'Mengisi 11 komponen Standar Pelayanan Publik.' },
  { id: 'p-15', code: 'view_service_requirements', name: 'Lihat Persyaratan Layanan', module: 'Pelayanan', description: 'Melihat dokumen persyaratan pelayanan.' },
  { id: 'p-16', code: 'create_service_requirements', name: 'Tambah Persyaratan Layanan', module: 'Pelayanan', description: 'Menambahkan butir persyaratan baru.' },
  { id: 'p-17', code: 'edit_service_requirements', name: 'Edit Persyaratan Layanan', module: 'Pelayanan', description: 'Memperbarui dan menyusun ulang persyaratan.' },
  { id: 'p-18', code: 'archive_service_requirements', name: 'Arsip Persyaratan Layanan', module: 'Pelayanan', description: 'Mengarsipkan atau mengaktifkan persyaratan.' },
  { id: 'p-19', code: 'view_service_procedures', name: 'Lihat Prosedur Layanan', module: 'Pelayanan', description: 'Melihat alur dan langkah pelayanan.' },
  { id: 'p-20', code: 'create_service_procedures', name: 'Tambah Prosedur Layanan', module: 'Pelayanan', description: 'Menambahkan langkah alur pelayanan baru.' },
  { id: 'p-21', code: 'edit_service_procedures', name: 'Edit Prosedur Layanan', module: 'Pelayanan', description: 'Memperbarui dan reorder langkah alur.' },
  { id: 'p-22', code: 'archive_service_procedures', name: 'Arsip Prosedur Layanan', module: 'Pelayanan', description: 'Mengarsipkan alur langkah pelayanan.' },
  { id: 'p-23', code: 'view_service_products', name: 'Lihat Produk Layanan', module: 'Pelayanan', description: 'Melihat hasil/produk output pelayanan.' },
  { id: 'p-24', code: 'create_service_products', name: 'Tambah Produk Layanan', module: 'Pelayanan', description: 'Menambahkan produk pelayanan baru.' },
  { id: 'p-25', code: 'edit_service_products', name: 'Edit Produk Layanan', module: 'Pelayanan', description: 'Memperbarui produk output pelayanan.' },
  { id: 'p-26', code: 'archive_service_products', name: 'Arsip Produk Layanan', module: 'Pelayanan', description: 'Mengarsipkan produk pelayanan.' },
  { id: 'p-27', code: 'view_service_standards', name: 'Lihat Standar Pelayanan', module: 'Pelayanan', description: 'Melihat rincian komponen standar pelayanan.' },
  { id: 'p-28', code: 'edit_service_standards', name: 'Edit Standar Pelayanan', module: 'Pelayanan', description: 'Memperbarui informasi standar pelayanan.' },

  // PHASE 4D: JADWAL & TARIF
  { id: 'p-29', code: 'view_service_schedules', name: 'Lihat Jadwal Layanan', module: 'Pelayanan', description: 'Melihat jam operasional dan jadwal mingguan layanan.' },
  { id: 'p-30', code: 'create_service_schedules', name: 'Tambah Jadwal Layanan', module: 'Pelayanan', description: 'Menyiapkan aturan jadwal mingguan layanan baru.' },
  { id: 'p-31', code: 'edit_service_schedules', name: 'Edit Jadwal Layanan', module: 'Pelayanan', description: 'Mengatur jam buka, tutup, dan istirahat operasional.' },
  { id: 'p-32', code: 'archive_service_schedules', name: 'Arsip Jadwal Layanan', module: 'Pelayanan', description: 'Mengubah status ketersediaan jadwal operasional.' },

  { id: 'p-33', code: 'view_service_schedule_exceptions', name: 'Lihat Jadwal Khusus', module: 'Pelayanan', description: 'Melihat pengecualian tanggal/jam operasional khusus.' },
  { id: 'p-34', code: 'create_service_schedule_exceptions', name: 'Tambah Jadwal Khusus', module: 'Pelayanan', description: 'Menambahkan tanggal libur/perubahan jam operasional.' },
  { id: 'p-35', code: 'edit_service_schedule_exceptions', name: 'Edit Jadwal Khusus', module: 'Pelayanan', description: 'Memperbarui jam/alasan perubahan jadwal khusus.' },
  { id: 'p-36', code: 'archive_service_schedule_exceptions', name: 'Hapus/Arsip Jadwal Khusus', module: 'Pelayanan', description: 'Mengapus/mengarsipkan pengecualian jadwal khusus.' },

  { id: 'p-37', code: 'view_service_pricing', name: 'Lihat Informasi Tarif', module: 'Pelayanan', description: 'Melihat kategori dan nominal tarif layanan.' },
  { id: 'p-38', code: 'create_service_pricing', name: 'Tambah Informasi Tarif', module: 'Pelayanan', description: 'Mendaftarkan skema dan nominal tarif baru.' },
  { id: 'p-39', code: 'edit_service_pricing', name: 'Edit Informasi Tarif', module: 'Pelayanan', description: 'Memperbarui tarif, unit, dan tanggal berlaku.' },
  { id: 'p-40', code: 'archive_service_pricing', name: 'Arsip Informasi Tarif', module: 'Pelayanan', description: 'Mengarsipkan histori informasi tarif layanan.' },

  // DESIGN & BUILDER
  { id: 'p-10', code: 'manage_homepage_builder', name: 'Kelola Homepage Builder', module: 'Tampilan', description: 'Menyusun section dan tata letak halaman utama.' },
  { id: 'p-11', code: 'publish_homepage', name: 'Publikasi Homepage', module: 'Tampilan', description: 'Mempublikasikan perubahan visual beranda.' },
  { id: 'p-12', code: 'manage_theme_header_footer', name: 'Kelola Tema, Header & Footer', module: 'Tampilan', description: 'Mengatur skema warna, logo, dan footer.' },

  // MICROSITE
  { id: 'p-13', code: 'manage_microsites', name: 'Kelola Microsite', module: 'Tampilan', description: 'Membuat dan mengedit portal microsite independen.' },
  { id: 'p-14', code: 'manage_microsite_passwords', name: 'Kelola Keamanan Microsite', module: 'Tampilan', description: 'Mengatur kata sandi dan akses terproteksi.' },

  // PHASE 4F: KRITIK, SARAN & PENGADUAN
  { id: 'p-41', code: 'view_complaints', name: 'Lihat Pengaduan & Feedback', module: 'Pengaduan', description: 'Melihat daftar dan rincian pengaduan masyarakat.' },
  { id: 'p-42', code: 'create_complaints', name: 'Tambah Pengaduan', module: 'Pengaduan', description: 'Menginput pengaduan baru dari internal.' },
  { id: 'p-43', code: 'edit_complaints', name: 'Edit & Tanggapi Pengaduan', module: 'Pengaduan', description: 'Menambahkan catatan internal dan menanggapi pengaduan.' },
  { id: 'p-44', code: 'assign_complaints', name: 'Tugaskan Petugas Pengaduan', module: 'Pengaduan', description: 'Menugaskan tindak lanjut pengaduan ke petugas.' },
  { id: 'p-45', code: 'change_complaint_status', name: 'Ubah Status Pengaduan', module: 'Pengaduan', description: 'Memperbarui status dan prioritas pengaduan.' },
  { id: 'p-46', code: 'archive_complaints', name: 'Arsip / Hapus Pengaduan', module: 'Pengaduan', description: 'Mengarsipkan atau menghapus berkas pengaduan.' },

  // PHASE 4H: DATA MANAGEMENT & BULK OPERATIONS
  { id: 'p-47', code: 'bulk_edit_services', name: 'Aksi Massal Layanan', module: 'Pelayanan', description: 'Mengubah status, klaster, kategori, unit, dan lokasi layanan secara massal.' },
  { id: 'p-48', code: 'import_services', name: 'Import Data Layanan', module: 'Pelayanan', description: 'Mengunggah dan mengimpor data berkas layanan dari CSV.' },
  { id: 'p-49', code: 'export_services', name: 'Export Data Layanan', module: 'Pelayanan', description: 'Mengekspor data katalog layanan ke dalam format berkas CSV.' },

  // PHASE 4I: APPROVAL & PUBLISHING WORKFLOW
  { id: 'p-50', code: 'submit_review_services', name: 'Kirim Layanan untuk Review', module: 'Pelayanan', description: 'Mengajukan perubahan/draf layanan kesehatan untuk ditinjau reviewer.' },
  { id: 'p-51', code: 'approve_services', name: 'Setujui Pengajuan Layanan', module: 'Pelayanan', description: 'Menyetujui pengajuan draf layanan kesehatan yang menunggu review.' },
  { id: 'p-52', code: 'reject_services', name: 'Kembalikan/Tolak Pengajuan Layanan', module: 'Pelayanan', description: 'Mengembalikan pengajuan layanan kepada editor beserta alasan perbaikan.' },
  { id: 'p-53', code: 'publish_services', name: 'Publikasikan Layanan', module: 'Pelayanan', description: 'Menerbitkan layanan yang telah disetujui agar tayang di direktori publik.' },
  { id: 'p-54', code: 'unpublish_services', name: 'Batal Publikasikan Layanan', module: 'Pelayanan', description: 'Menarik layanan yang sedang tayang dari direktori publik kembali ke draf.' },
  { id: 'p-55', code: 'view_operational_dashboard', name: 'Lihat Dashboard Operasional', module: 'Operasional', description: 'Melihat dashboard operasional pelayanan real-time.' },
  { id: 'p-56', code: 'view_service_monitoring', name: 'Monitor Pelayanan', module: 'Operasional', description: 'Memantau kondisi antrean, pendaftaran, dan status layanan.' },
  { id: 'p-57', code: 'export_service_reports', name: 'Ekspor Laporan Pelayanan', module: 'Operasional', description: 'Mengekspor laporan pendaftaran dan pelayanan ke CSV.' },
  { id: 'p-58', code: 'manage_operational_settings', name: 'Kelola Pengaturan Operasional', module: 'Operasional', description: 'Mengubah threshold alert dan batas antrean operasional.' },
  { id: 'p-59', code: 'view_surveys', name: 'Lihat Daftar Survei', module: 'Survei', description: 'Melihat daftar kuesioner dan status survei kepuasan.' },
  { id: 'p-60', code: 'manage_surveys', name: 'Kelola Survei', module: 'Survei', description: 'Membuat, memperbarui, dan menghapus kuesioner survei.' },
  { id: 'p-61', code: 'publish_surveys', name: 'Publikasikan/Tutup Survei', module: 'Survei', description: 'Mengubah status survei menjadi Published, Closed, atau Archived.' },
  { id: 'p-62', code: 'view_survey_results', name: 'Lihat Hasil Survei', module: 'Survei', description: 'Melihat statistik dan grafik indeks kepuasan masyarakat (IKM/SKM).' },
  { id: 'p-63', code: 'export_survey_results', name: 'Ekspor Hasil Survei', module: 'Survei', description: 'Mengekspor data respons survei ke format CSV.' },
  { id: 'p-64', code: 'moderate_survey_comments', name: 'Moderasi Masukan', module: 'Survei', description: 'Memoderasi komentar dan saran terbuka dari masyarakat.' },
  { id: 'p-65', code: 'view_public_information', name: 'Lihat Informasi Publik', module: 'Informasi Publik', description: 'Melihat rincian informasi publik dan transparansi layanan.' },
  { id: 'p-66', code: 'manage_public_information', name: 'Kelola Informasi Publik', module: 'Informasi Publik', description: 'Membuat dan mengedit informasi publik & daftar informasi.' },
  { id: 'p-67', code: 'publish_public_information', name: 'Publikasi Informasi Publik', module: 'Informasi Publik', description: 'Menerbitkan atau mengarsipkan informasi publik.' },
  { id: 'p-68', code: 'manage_information_requests', name: 'Kelola Permintaan Informasi', module: 'Informasi Publik', description: 'Mengelola permohonan informasi publik dari masyarakat.' },
  { id: 'p-69', code: 'process_information_requests', name: 'Proses Permintaan Informasi', module: 'Informasi Publik', description: 'Memverifikasi dan memproses permohonan informasi.' },
  { id: 'p-70', code: 'respond_information_requests', name: 'Tanggapi Permintaan Informasi', module: 'Informasi Publik', description: 'Memberikan tanggapan publik dan catatan internal.' },
  { id: 'p-71', code: 'export_information_requests', name: 'Ekspor Permintaan Informasi', module: 'Informasi Publik', description: 'Mengekspor laporan permohonan informasi publik.' },
  { id: 'p-72', code: 'manage_information_settings', name: 'Kelola Pengaturan Informasi', module: 'Informasi Publik', description: 'Mengatur SLA dan konfigurasi transparansi.' },

  // PHASE 5J: BERITA, ARTIKEL, PENGUMUMAN & AGENDA DINAMIS
  { id: 'p-73', code: 'view_content', name: 'Lihat Konten', module: 'Konten Dinamis', description: 'Melihat daftar dan rincian konten publik.' },
  { id: 'p-74', code: 'create_content', name: 'Buat Konten', module: 'Konten Dinamis', description: 'Membuat draf berita, artikel, agenda, atau pengumuman baru.' },
  { id: 'p-75', code: 'edit_content', name: 'Edit Konten', module: 'Konten Dinamis', description: 'Mengubah isi, lampiran, dan metadata konten.' },
  { id: 'p-76', code: 'submit_content_review', name: 'Kirim Review Konten', module: 'Konten Dinamis', description: 'Mengajukan draf konten untuk ditinjau reviewer.' },
  { id: 'p-77', code: 'publish_content', name: 'Publikasi Konten', module: 'Konten Dinamis', description: 'Menerbitkan atau menjadwalkan publikasi konten.' },
  { id: 'p-78', code: 'unpublish_content', name: 'Batal Publikasi Konten', module: 'Konten Dinamis', description: 'Menarik konten tayang kembali menjadi draf.' },
  { id: 'p-79', code: 'archive_content', name: 'Arsip Konten', module: 'Konten Dinamis', description: 'Mengarsipkan atau menghapus konten.' },
  { id: 'p-80', code: 'manage_categories', name: 'Kelola Kategori Konten', module: 'Konten Dinamis', description: 'Membuat dan mengatur taksonomi kategori.' },
  { id: 'p-81', code: 'manage_tags', name: 'Kelola Tag Konten', module: 'Konten Dinamis', description: 'Mengelola tag dan pengelompokan konten.' },
  { id: 'p-82', code: 'manage_content_settings', name: 'Kelola Pengaturan Konten', module: 'Konten Dinamis', description: 'Mengatur konfigurasi umum CMS konten.' },

  // PHASE 5K: DIREKTORI PETUGAS & STRUKTUR ORGANISASI
  { id: 'p-83', code: 'view_staff_directory', name: 'Lihat Direktori Petugas', module: 'Kepegawaian', description: 'Melihat direktori petugas dan struktur organisasi puskesmas.' },
  { id: 'p-84', code: 'manage_staff_profiles', name: 'Kelola Profil Petugas', module: 'Kepegawaian', description: 'Membuat, mengubah, dan mengarsipkan profil publik petugas.' },
  { id: 'p-85', code: 'manage_organization_structure', name: 'Kelola Struktur Organisasi', module: 'Kepegawaian', description: 'Mengatur hierarki posisi dan struktur unit organisasi.' },
  { id: 'p-86', code: 'manage_staff_assignments', name: 'Kelola Penugasan Petugas', module: 'Kepegawaian', description: 'Menugaskan petugas ke unit, lokasi, dan layanan.' },
  { id: 'p-87', code: 'publish_staff_profiles', name: 'Publikasi Profil Petugas', module: 'Kepegawaian', description: 'Menyetujui dan mempublikasikan profil petugas ke website publik.' },

  // PHASE 5L: SARANA, PRASARANA, FASILITAS & INFORMASI LOKASI
  { id: 'p-88', code: 'view_facilities', name: 'Lihat Fasilitas', module: 'Fasilitas', description: 'Melihat daftar dan rincian fasilitas serta sarana prasarana.' },
  { id: 'p-89', code: 'manage_facilities', name: 'Kelola Fasilitas', module: 'Fasilitas', description: 'Membuat, mengubah, dan mengarsipkan data fasilitas puskesmas.' },
  { id: 'p-90', code: 'publish_facilities', name: 'Publikasi Fasilitas', module: 'Fasilitas', description: 'Mengatur visibilitas publik (Show on Website) dan status publikasi fasilitas.' },
  { id: 'p-91', code: 'manage_facility_categories', name: 'Kelola Kategori Fasilitas', module: 'Fasilitas', description: 'Mengatur klasifikasi kategori sarana dan prasarana.' },
  { id: 'p-92', code: 'manage_facility_locations', name: 'Kelola Lokasi Fasilitas', module: 'Fasilitas', description: 'Mengatur titik gedung, lantai, dan zonasi lokasi fasilitas.' },

  // PHASE 5M: KONTAK, JAM OPERASIONAL & INFORMASI AKSES PUBLIK
  { id: 'p-93', code: 'view_contact_settings', name: 'Lihat Pengaturan Kontak', module: 'Kontak', description: 'Melihat informasi kontak resmi dan jam operasional.' },
  { id: 'p-94', code: 'manage_contact_settings', name: 'Kelola Pengaturan Kontak', module: 'Kontak', description: 'Mengatur kanal kontak resmi, telepon, email, dan alamat.' },
  { id: 'p-95', code: 'manage_operating_hours', name: 'Kelola Jam Operasional', module: 'Kontak', description: 'Mengatur jadwal jam buka/tutup harian dan libur khusus.' },
  { id: 'p-96', code: 'manage_emergency_information', name: 'Kelola Informasi Darurat', module: 'Kontak', description: 'Mengatur kontak darurat dan pengumuman siaga IGD.' },
  { id: 'p-97', code: 'publish_contact_information', name: 'Publikasi Informasi Kontak', module: 'Kontak', description: 'Mengatur visibilitas publik kanal komunikasi website.' },

  // PHASE 5N: FAQ, KNOWLEDGE BASE & PUSAT BANTUAN MASYARAKAT
  { id: 'p-98', code: 'view_faq', name: 'Lihat FAQ & Pusat Bantuan', module: 'FAQ', description: 'Melihat daftar FAQ dan panduan pusat bantuan.' },
  { id: 'p-99', code: 'manage_faq', name: 'Kelola FAQ', module: 'FAQ', description: 'Membuat, mengubah, dan mengarsipkan FAQ.' },
  { id: 'p-100', code: 'publish_faq', name: 'Publikasi FAQ', module: 'FAQ', description: 'Mempublikasikan atau menyembunyikan FAQ.' },
  { id: 'p-101', code: 'manage_guides', name: 'Kelola Panduan (Knowledge Base)', module: 'FAQ', description: 'Membuat dan mengubah panduan langkah demi langkah.' },
  { id: 'p-102', code: 'publish_guides', name: 'Publikasi Panduan', module: 'FAQ', description: 'Mempublikasikan panduan ke pusat bantuan.' },
  { id: 'p-103', code: 'manage_faq_categories', name: 'Kelola Kategori FAQ', module: 'FAQ', description: 'Mengatur kategori FAQ dan panduan.' },
];

export const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'role-superadmin',
    name: 'Super Admin',
    description: 'Akses penuh tanpa batas ke seluruh modul sistem, pengaturan, dan manajemen peran.',
    permissions: DEFAULT_PERMISSIONS.map(p => p.code),
    isSystemRole: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-adminwebsite',
    name: 'Admin Website',
    description: 'Mengelola konten, layanan, homepage builder, tema, dan pengaturan situs.',
    permissions: [
      'manage_pages_menus',
      'manage_posts_announcements',
      'manage_media',
      'manage_services_clusters',
      'manage_service_standards',
      'manage_homepage_builder',
      'publish_homepage',
      'manage_theme_header_footer',
      'manage_microsites',
      'manage_microsite_passwords',
      'manage_site_settings',
      'view_audit_logs',
      'view_complaints',
      'create_complaints',
      'edit_complaints',
      'assign_complaints',
      'change_complaint_status',
      'archive_complaints',
      'bulk_edit_services',
      'import_services',
      'export_services',
      'view_operational_dashboard',
      'view_service_monitoring',
      'export_service_reports',
      'manage_operational_settings',
      'view_surveys',
      'manage_surveys',
      'publish_surveys',
      'view_survey_results',
      'export_survey_results',
      'moderate_survey_comments',
      'view_content',
      'create_content',
      'edit_content',
      'submit_content_review',
      'publish_content',
      'unpublish_content',
      'archive_content',
      'manage_categories',
      'manage_tags',
      'manage_content_settings'
    ],
    isSystemRole: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-editor',
    name: 'Editor Konten',
    description: 'Membuat dan mengedit berita, pengumuman, halaman, dan mengunggah media.',
    permissions: [
      'manage_pages_menus',
      'manage_posts_announcements',
      'manage_media',
      'manage_services_clusters',
      'manage_microsites',
      'view_content',
      'create_content',
      'edit_content',
      'submit_content_review',
      'publish_content',
      'manage_categories',
      'manage_tags'
    ],
    isSystemRole: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-operator',
    name: 'Operator Pelayanan',
    description: 'Mengelola jadwal layanan, standar pelayanan publik, dan informasi kesehatan.',
    permissions: [
      'manage_services_clusters',
      'manage_service_standards',
      'manage_media',
      'view_complaints',
      'edit_complaints',
      'change_complaint_status',
      'view_operational_dashboard',
      'view_service_monitoring'
    ],
    isSystemRole: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-viewer',
    name: 'Viewer (Read-Only)',
    description: 'Akses lihat-saja untuk keperluan pemantauan dan pratinjau internal.',
    permissions: [],
    isSystemRole: true,
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_SUPER_ADMIN: AppUser = {
  uid: 'usr-superadmin-01',
  email: 'elengemail@gmail.com',
  displayName: 'Super Admin',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  roleId: 'role-superadmin',
  roleName: 'Super Admin',
  permissions: DEFAULT_PERMISSIONS.map(p => p.code),
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString()
};

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  id: 'global-settings',
  siteName: 'Puskesmas Manding',
  shortName: 'Puskesmas Manding',
  siteTitle: 'Puskesmas Manding - Portal Resmi & Pelayanan Terpadu',
  siteDescription: 'Portal informasi dan pelayanan kesehatan resmi Puskesmas Manding: Layanan kesehatan primer, pendaftaran online, berita kesehatan, jadwal dokter, microsite, dan pengaduan masyarakat.',
  tagline: 'Bismillah Melayani, Anda Sehat Kami Puas',
  logoUrl: '/logo-custom.png',
  address: 'Jl. Raya Manding, Kec. Manding, Kab. Sumenep, Jawa Timur',
  phone: '(0328) 667123',
  email: 'puskesmasmanding@gmail.com',
  whatsapp: '081234567890',
  operatingHours: 'Senin - Sabtu: 07.30 - 14.00 WIB | UGD & Rawat Inap: 24 Jam',
  facebookUrl: 'https://facebook.com/puskesmas.manding.7',
  instagramUrl: 'https://instagram.com/puskesmasmanding',
  youtubeUrl: 'https://youtube.com',
  latitude: -6.95977323598693,
  longitude: 113.86985314130042,
  googleMapsUrl: 'https://maps.google.com',
  updatedAt: new Date().toISOString(),
  updatedBy: 'usr-superadmin-01'
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    userId: 'usr-superadmin-01',
    userEmail: 'admin@puskesmas.go.id',
    userName: 'Administrator Utama',
    action: 'LOGIN',
    module: 'AUTH',
    description: 'Berhasil melakukan otentikasi login ke Dashboard Admin CMS.',
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-102',
    userId: 'usr-superadmin-01',
    userEmail: 'admin@puskesmas.go.id',
    userName: 'Administrator Utama',
    action: 'SETTINGS_CHANGE',
    module: 'SETTINGS',
    targetId: 'global-settings',
    targetName: 'Puskesmas Manding',
    description: 'Inisialisasi konfigurasi profil umum Puskesmas dan jam operasional.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const INITIAL_COMPLAINTS: ComplaintEntity[] = [
  {
    id: 'cmp-001',
    ticketNumber: 'PSM-2026-000001',
    type: 'pengaduan',
    title: 'Waktu tunggu pendaftaran Poli Umum lama',
    senderName: 'Budi Santoso',
    senderEmail: 'budi.santoso@example.com',
    senderPhone: '081234567891',
    isAnonymous: false,
    serviceId: 'srv-001',
    serviceName: 'Pemeriksaan Umum & Lansia',
    content: 'Waktu tunggu di antrean Pendaftaran Poli Umum agak lama pada jam 09.00 WIB. Mohon ditambah loket pendaftaran di jam sibuk.',
    status: 'processing',
    priority: 'normal',
    assignedTo: 'usr-superadmin-01',
    assignedToName: 'Administrator Utama',
    internalNotes: [
      {
        id: 'note-01',
        authorId: 'usr-superadmin-01',
        authorName: 'Administrator Utama',
        note: 'Loket pendaftaran cadangan sudah diinstruksikan untuk dibuka pada jam 08.30 - 10.30 WIB.',
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 'cmp-002',
    ticketNumber: 'PSM-2026-000002',
    type: 'apresiasi',
    title: 'Apresiasi keramahan bidan dan dokter KIA',
    senderName: 'Siti Aminah',
    senderEmail: 'siti.aminah@example.com',
    senderPhone: '085678901234',
    isAnonymous: false,
    serviceId: 'srv-002',
    serviceName: 'Pelayanan Ibu & Anak (KIA)',
    content: 'Sangat mengapresiasi keramahan bidan dan dokter di Poli KIA. Penjelasannya sangat jelas dan komunikatif.',
    status: 'completed',
    priority: 'low',
    assignedTo: 'usr-superadmin-01',
    assignedToName: 'Administrator Utama',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedBy: 'Administrator Utama'
  },
  {
    id: 'cmp-003',
    ticketNumber: 'PSM-2026-000003',
    type: 'saran',
    title: 'Saran papan petunjuk arah ruang obat',
    isAnonymous: true,
    serviceId: '',
    serviceName: 'Tidak terkait layanan tertentu',
    content: 'Saran untuk menambah papan petunjuk arah ruang obat/apotek di dekat koridor utama agar pasien lansia tidak bingung.',
    status: 'new',
    priority: 'normal',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

