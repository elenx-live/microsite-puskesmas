/**
 * Migrasi satu kali: puskesmas.db (web utama, tabel items) -> microsite.db baru.
 *
 * - TIDAK menulis apa pun ke puskesmas.db: sumber disalin dulu ke direktori
 *   sementara, lalu salinan itu dibuka read-only.
 * - Idempotent-sebagian: bila target sudah berisi microsite, skrip berhenti
 *   kecuali --force (mencegah migrasi ulang menimpa data yang sudah diedit
 *   di DB baru).
 * - Verifikasi: jumlah record + kesamaan JSON tiap record (kecuali owner_id
 *   yang memang ditambahkan) + jumlah blocks.
 *
 * Pakai: node scripts/migrate-to-microsite-db.cjs \
 *   --source /www/wwwroot/test-puskesmas.puskesmasmanding.com/puskesmas.db \
 *   --target /opt/data/microsite-puskesmas/microsite.db
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ADMIN_EMAIL = 'elengemail@gmail.com';
const ADMIN_ID = 'u-admin';

const DEFAULT_CATEGORIES = [
  { name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' },
  { name: 'Layanan Puskesmas', description: 'Akses cepat portal utama layanan rawat jalan, gawat darurat, pendaftaran online, dan jadwal poliklinik.' },
  { name: 'Program Kesehatan', description: 'Portal tematik program khusus kesehatan masyarakat seperti PIN Polio, pencegahan stunting, dan imunisasi.' },
  { name: 'Informasi Publik', description: 'Kumpulan regulasi, Standar Pelayanan Publik (SPP), maklumat, serta laporan akuntabilitas kinerja.' },
  { name: 'Kampanye & Edukasi', description: 'Materi penyuluhan kesehatan, infografis pencegahan penyakit, dan sosialisasi program hidup sehat.' }
];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  picture TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS microsites (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  owner_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  active INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_microsites_owner ON microsites(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`;

function parseArgs() {
  const out = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') out.source = argv[++i];
    else if (argv[i] === '--target') out.target = argv[++i];
    else if (argv[i] === '--force') out.force = true;
  }
  return out;
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'kategori';
}

function main() {
  const { source, target, force } = parseArgs();
  if (!source || !target) {
    console.error('Pakai: node migrate-to-microsite-db.cjs --source <puskesmas.db> --target <microsite.db> [--force]');
    process.exit(2);
  }
  if (!fs.existsSync(source)) {
    console.error(`Sumber tidak ditemukan: ${source}`);
    process.exit(2);
  }

  // Salin sumber (termasuk -wal/-shm bila ada) lalu buka salinan read-only.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-src-'));
  const base = path.basename(source);
  for (const suffix of ['', '-wal', '-shm']) {
    const src = source + suffix;
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmpDir, base + suffix));
  }
  const srcDb = new DatabaseSync(path.join(tmpDir, base), { readOnly: true });

  const targetExisted = fs.existsSync(target);
  const db = new DatabaseSync(target);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);

  const existing = db.prepare('SELECT COUNT(*) AS n FROM microsites').get().n;
  if (existing > 0 && !force) {
    console.error(`Target sudah berisi ${existing} microsite — berhenti (pakai --force untuk menimpa).`);
    process.exit(3);
  }

  const now = new Date().toISOString();

  // Admin bootstrap (akun pemilik data lama).
  db.prepare(
    `INSERT INTO users (id, email, name, picture, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', ?, ?)
     ON CONFLICT(email) DO UPDATE SET role = 'admin', updated_at = excluded.updated_at`
  ).run(ADMIN_ID, ADMIN_EMAIL, 'Administrator', '', now, now);

  // Microsites.
  const srcRows = srcDb.prepare(`SELECT id, data FROM items WHERE collection = 'microsites'`).all();
  let copied = 0;
  const verify = [];
  for (const row of srcRows) {
    let rec;
    try {
      rec = JSON.parse(row.data);
    } catch {
      console.error(`Lewati record rusak id=${row.id}`);
      continue;
    }
    if (!rec.slug) {
      console.error(`Lewati record tanpa slug id=${row.id}`);
      continue;
    }
    const withOwner = { ...rec, owner_id: ADMIN_ID };
    db.prepare(
      `INSERT INTO microsites (id, slug, owner_id, status, active, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, owner_id = excluded.owner_id,
         status = excluded.status, active = excluded.active, data = excluded.data,
         updated_at = excluded.updated_at`
    ).run(
      rec.id, rec.slug, ADMIN_ID, rec.status || 'draft', rec.active === false ? 0 : 1,
      JSON.stringify(withOwner), rec.createdAt || now, rec.updatedAt || now
    );
    copied++;
    verify.push({ id: rec.id, slug: rec.slug, source: rec, blocks: (rec.blocks || []).length });
  }

  // Kategori: dari sumber bila ada, kalau tidak pakai default.
  const srcCats = srcDb.prepare(`SELECT data FROM items WHERE collection = 'microsite_categories'`).all();
  const catList = [];
  for (const r of srcCats) {
    try {
      const c = JSON.parse(r.data);
      if (c && c.name) catList.push(c);
    } catch {}
  }
  const finalCats = catList.length > 0 ? catList : DEFAULT_CATEGORIES;
  for (const c of finalCats) {
    db.prepare(
      `INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET description = excluded.description`
    ).run('c-' + slugify(c.name), c.name, c.description || '', now);
  }

  // Settings: site_settings dari kv_store bila ada.
  let siteSettings = { siteName: 'Puskesmas Manding' };
  try {
    const kv = srcDb.prepare(`SELECT value FROM kv_store WHERE key = 'site_settings'`).get();
    if (kv) {
      const parsed = JSON.parse(kv.value);
      if (parsed && typeof parsed === 'object') siteSettings = parsed;
    }
  } catch {}
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('site_settings', ?) ON CONFLICT(key) DO NOTHING`
  ).run(JSON.stringify(siteSettings));

  // Verifikasi: baca balik target, bandingkan dengan sumber.
  let ok = true;
  const targetRows = db.prepare('SELECT id, data FROM microsites').all();
  if (targetRows.length !== copied) {
    console.error(`VERIFIKASI GAGAL: target ${targetRows.length} != sumber ${copied}`);
    ok = false;
  }
  const byId = new Map(targetRows.map((r) => [r.id, JSON.parse(r.data)]));
  for (const v of verify) {
    const t = byId.get(v.id);
    if (!t) {
      console.error(`VERIFIKASI GAGAL: ${v.slug} hilang di target`);
      ok = false;
      continue;
    }
    const { owner_id: _o, ...tNoOwner } = t;
    const sameJson = JSON.stringify(tNoOwner) === JSON.stringify(v.source);
    const sameBlocks = (t.blocks || []).length === v.blocks;
    console.log(`- ${v.slug}: blocks ${t.blocks ? t.blocks.length : 0}/${v.blocks} | json_sama=${sameJson}`);
    if (!sameJson || !sameBlocks) ok = false;
  }
  const catCount = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  console.log(`Microsite disalin: ${copied} | kategori: ${catCount} | admin: ${ADMIN_EMAIL}`);
  console.log(ok ? 'MIGRASI OK' : 'MIGRASI GAGAL (lihat kesalahan di atas)');

  srcDb.close();
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(ok ? 0 : 1);
}

main();
