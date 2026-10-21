# Microsite Puskesmas Manding

Aplikasi publik microsite Puskesmas Manding — **dilepas dari web utama**
(`sumenep.puskesmasmanding.com`) menjadi aplikasi mandiri di
`microsite.puskesmasmanding.com`, sesuai permintaan ElenX (21 Okt 2026).

## Pembagian tugas

- **Aplikasi ini (publik, tanpa login):** daftar microsite (`/`) dan halaman
  per-slug (`/:slug`, alias `/m/:slug` dan `/microsite/:slug`), 6 template,
  injeksi meta Open Graph untuk pratinjau tautan.
- **Web utama (tetap):** modul admin `Admin > Microsites` (buat/ubah/hapus,
  builder). Admin TIDAK pindah.
- **Data:** kedua aplikasi membaca `puskesmas.db` yang sama (tabel `items`
  koleksi `microsites`/`microsite_categories` + `kv_store` `site_settings`,
  mode WAL). Aplikasi ini hanya membaca; penulisan tetap lewat web utama.

## Menjalankan

```bash
npm install
npm run build        # hasil ke dist/
PORT=3404 MICROSITE_DB_PATH=/path/ke/puskesmas.db node server.cjs
```

`server.cjs` nol dependensi (node:http + node:sqlite bawaan Node 22):
menyajikan `dist/`, API baca `/api/db/*`, `/api/microsites/categories`,
`/api/site-settings`, dan mengalihkan `/uploads/*` ke web utama.

## Adaptasi dari kode web utama

- Routing diubah dari hash (`#/m/:slug`) menjadi path (`/:slug`).
- Tanpa login: pratinjau draf hanya lewat `?preview=true` (cek `authStore`
  dihapus).
- Tautan "internal" microsite (`/layanan`, `/berita`, ...) diarahkan ke
  `https://sumenep.puskesmasmanding.com` (`shared/utils/siteLinks.ts`).
- `shared/lib/firebase.ts` ditulis ulang tanpa Firebase (langsung `/api/db`).
- `auditService` menjadi no-op (log audit hanya dipakai jalur admin).
- Token warna Fresh Mint disalin ke `:root` di `src/app.css` (pengganti
  `ThemeStyleInjector` web utama).

## Deploy produksi (VPS)

- Service `microsite.service` (User www-data, port 3404,
  `/opt/data/microsite-puskesmas/`).
- Cloudflare Tunnel ingress `microsite.puskesmasmanding.com` → `127.0.0.1:3404`
  + CNAME ke tunnel.
- Setelah rsync: `chown -R www-data:www-data` lalu restart service, dan
  verifikasi ISI konten (bukan cuma status 200).
