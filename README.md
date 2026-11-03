# Microsite Puskesmas Manding

Aplikasi **platform microsite multi-pengguna** Puskesmas Manding — live di
`microsite.puskesmasmanding.com`. Awalnya dilepas dari web utama
(`sumenep.puskesmasmanding.com`) menjadi aplikasi mandiri, kini tumbuh menjadi
platform multi-tenant penuh dengan Studio pengelola + Admin Panel.

## Stack

- **Frontend:** React 19 + Vite 6 + Tailwind v4 + React Router 7 (SPA, di `src/`).
- **Backend:** Express di `server.ts` (~6.0k baris), dikompilasi ke `dist/server.cjs`
  dengan esbuild.
- **DB:** SQLite via `better-sqlite3` (layer `db.ts`) — tabel `users`, `sessions`,
  `microsites`, `audit_log`, `dashboard_prefs`, `platform_settings`.
- **Auth:** sesi cookie HttpOnly (tabel `sessions`) + Google Sign-In (ID token).

## Rute utama

- `/` — landing promosi platform; `/microsites` — direktori microsite.
- `/m/:slug` (fallback `/:slug`) — portal publik microsite.
- `/login`, `/register` — masuk/daftar (email + Google).
- `/studio/*` — **Studio pengelola** (Ringkasan, Microsite Saya, Kustomisasi,
  Profil, Pengaturan) — butuh sesi.
- `/admin-panel/*` — **Admin Panel** (Ikhtisar, Pengguna, Semua Microsite,
  Pengaturan Platform, Log Audit) — butuh role `admin`.

## Peran & isolasi

- **pengelola** — hanya microsite miliknya (owner-scoped; `403` untuk milik orang lain).
- **admin** — semua microsite + pengguna + pengaturan platform.
- **publik** — hanya microsite `published` + `aktif`.
Isolasi ditegakkan di backend (`db.ts`), bukan hanya menyembunyikan menu.

## Build & jalankan

```bash
npm install
npm run build        # vite build + esbuild server.ts → dist/server.cjs
npm start            # node dist/server.cjs  (PORT default 3800)
```

Dev: `npm run dev` (tsx server.ts). Type-check: `npm run lint` (tsc --noEmit).

## Deploy produksi (VPS)

- Service systemd `microsite-studio.service` (User www, `WorkingDirectory`
  app dir, `PORT=3800`, `ExecStart=node dist/server.cjs`).
- **Wajib rebuild dua tahap** lalu restart: `vite build` saja tidak memperbarui
  `dist/server.cjs`.
- Sesudah restart: pastikan `/proc/<pid>/cwd` menunjuk app dir dan **hanya satu**
  listener di :3800.

## Berkas live (tidak dilacak)

`.env`, `*.db` (+`-wal`/`-shm`), `data_store/`, `*_data.json`, `site_settings.json`,
`public/uploads/` — semuanya masuk `.gitignore` (data/rahasia).
