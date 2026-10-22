/**
 * Backend aplikasi microsite mandiri — NOL dependensi eksternal.
 *
 * Menyajikan:
 *  - file statis hasil build Vite (dist/)
 *  - API publik microsite dari DB SENDIRI (microsite.db): microsites,
 *    categories, settings — TIDAK lagi membaca puskesmas.db web utama.
 *  - autentikasi Google (GIS): POST /api/auth/google memverifikasi ID token
 *    ke oauth2.googleapis.com/tokeninfo, lalu sesi cookie httpOnly.
 *  - API dashboard CRUD (login wajib) + API admin kelola user.
 *  - injeksi meta Open Graph untuk /:slug yang published (pratinjau WhatsApp)
 *  - pengalihan /uploads/* ke web utama (media microsite tetap tinggal di sana)
 *
 * Port default 3404. DB: env MICROSITE_DB_PATH atau
 * /opt/data/microsite-puskesmas/microsite.db (file yang sama dengan folder
 * aplikasi ini). Migrasi awal dari puskesmas.db: scripts/migrate-to-microsite-db.cjs
 */
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3404);
const HOST = process.env.HOST || '127.0.0.1';
const APP_ROOT = __dirname;
const DIST_DIR = path.join(APP_ROOT, 'dist');
const DB_PATH =
  process.env.MICROSITE_DB_PATH ||
  '/opt/data/microsite-puskesmas/microsite.db';
const MAIN_WEB = 'https://sumenep.puskesmasmanding.com';

// Google Identity Services — client web yang sama dengan web utama.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '936354706213-o3189kpkb6vrlvdal3gb9mut8717me6i.apps.googleusercontent.com';
const ADMIN_BOOTSTRAP_EMAIL = 'elengemail@gmail.com';
const SESSION_COOKIE = 'microsite_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 hari (detik)

const DEFAULT_CATEGORIES = [
  { name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' },
  { name: 'Layanan Puskesmas', description: 'Akses cepat portal utama layanan rawat jalan, gawat darurat, pendaftaran online, dan jadwal poliklinik.' },
  { name: 'Program Kesehatan', description: 'Portal tematik program khusus kesehatan masyarakat seperti PIN Polio, pencegahan stunting, dan imunisasi.' },
  { name: 'Informasi Publik', description: 'Kumpulan regulasi, Standar Pelayanan Publik (SPP), maklumat, serta laporan akuntabilitas kinerja.' },
  { name: 'Kampanye & Edukasi', description: 'Materi penyuluhan kesehatan, infografis pencegahan penyakit, dan sosialisasi program hidup sehat.' }
];

// Slug yang dicadangkan untuk rute aplikasi (tidak boleh dipakai microsite).
const RESERVED_SLUGS = new Set([
  'login', 'profil', 'dashboard', 'admin', 'm', 'microsite', 'microsites',
  'api', 'assets', 'uploads', 'favicon.svg', 'logo.png'
]);

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

let db = null;
function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
    db.exec(SCHEMA);
    db.prepare(
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('site_settings', ?)`
    ).run(JSON.stringify({ siteName: 'Puskesmas Manding' }));
  }
  return db;
}

// ---------- util ----------

function sendJson(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...(extraHeaders || {})
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 15 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    role: row.role,
    createdAt: row.created_at
  };
}

/** Ambil user dari cookie sesi (null bila tidak ada/kedaluwarsa). */
function getSessionUser(req) {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token) return null;
    getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
    const row = getDb()
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`
      )
      .get(sha256(token), new Date().toISOString());
    return publicUser(row);
  } catch (e) {
    console.error('[auth] getSessionUser:', e.message);
    return null;
  }
}

function setSessionCookie(res, token) {
  const cookie =
    `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
}

function isStaff(user) {
  return !!user && (user.role === 'admin' || user.role === 'petugas');
}

/** Pemilik/petugas/admin boleh mengelola microsite ini. */
function canManage(user, micro) {
  if (!user || !micro) return false;
  if (isStaff(user)) return true;
  return micro.owner_id === user.id;
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function validSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !RESERVED_SLUGS.has(slug);
}

// ---------- data microsite ----------

/** Record publik: data JSON + owner_id, TANPA field password. */
function toPublicRecord(row) {
  try {
    const data = JSON.parse(row.data);
    const { password: _p, ...rest } = data;
    return { ...rest, owner_id: row.owner_id };
  } catch {
    return null;
  }
}

function getMicrositeRowById(id) {
  try {
    return getDb().prepare('SELECT * FROM microsites WHERE id = ?').get(id) || null;
  } catch {
    return null;
  }
}

function getMicrositeRowBySlug(slug) {
  try {
    return getDb().prepare('SELECT * FROM microsites WHERE slug = ?').get(slug) || null;
  } catch {
    return null;
  }
}

/** Daftar microsite sesuai hak lihat: anonim hanya yang terbit+aktif. */
function listMicrositesFor(user) {
  const rows = getDb()
    .prepare('SELECT * FROM microsites ORDER BY updated_at DESC')
    .all();
  const out = [];
  for (const row of rows) {
    const rec = toPublicRecord(row);
    if (!rec) continue;
    if (isStaff(user)) {
      out.push(rec);
    } else if (user) {
      if ((rec.status === 'published' && rec.active !== false) || rec.owner_id === user.id) out.push(rec);
    } else if (rec.status === 'published' && rec.active !== false) {
      out.push(rec);
    }
  }
  return out;
}

function listCategories() {
  try {
    const rows = getDb().prepare('SELECT * FROM categories ORDER BY name ASC').all();
    if (rows.length > 0) {
      return rows.map((r) => ({ id: r.id, name: r.name, description: r.description }));
    }
  } catch (e) {
    console.error('[db] categories:', e.message);
  }
  return DEFAULT_CATEGORIES.map((c) => ({ id: `c-${slugify(c.name)}`, ...c }));
}

function getSiteSettings() {
  try {
    const row = getDb().prepare(`SELECT value FROM settings WHERE key = 'site_settings'`).get();
    if (row) {
      const parsed = JSON.parse(row.value);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error('[db] site_settings:', e.message);
  }
  return { siteName: 'Puskesmas Manding' };
}

// ---------- Google tokeninfo ----------

function verifyGoogleToken(credential) {
  return new Promise((resolve) => {
    if (!credential || typeof credential !== 'string') return resolve(null);
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          if (res.statusCode !== 200 || !info || info.aud !== GOOGLE_CLIENT_ID) return resolve(null);
          const expMs = Number(info.exp) * 1000;
          if (!expMs || expMs <= Date.now()) return resolve(null);
          if (info.email_verified !== 'true' && info.email_verified !== true) return resolve(null);
          if (!info.email) return resolve(null);
          resolve({ email: info.email, name: info.name || info.email, picture: info.picture || '' });
        } catch {
          resolve(null);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

// ---------- blok ----------

const BLOCK_TYPES = new Set([
  'link', 'heading', 'text', 'announcement', 'image', 'image_link', 'video',
  'whatsapp', 'phone', 'email', 'location', 'download', 'divider', 'spacer',
  'qr_code', 'social_icons'
]);

const BLOCK_TEXT_FIELDS = [
  'title', 'subtitle', 'content', 'url', 'icon', 'thumbnailUrl', 'badgeText',
  'group', 'groupId', 'whatsappNumber', 'whatsappMessage', 'fileSize', 'fileFormat'
];

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || typeof b !== 'object' || !BLOCK_TYPES.has(b.type)) return null;
    const clean = {
      id: typeof b.id === 'string' && b.id ? b.id : `blk-${crypto.randomBytes(4).toString('hex')}`,
      type: b.type,
      active: b.active !== false,
      displayOrder: i
    };
    for (const f of BLOCK_TEXT_FIELDS) {
      if (typeof b[f] === 'string' && b[f] !== '') clean[f] = b[f].slice(0, 4000);
    }
    if (b.isFeatured === true) clean.isFeatured = true;
    if (b.customStyle && typeof b.customStyle === 'object') {
      const cs = {};
      for (const k of ['backgroundColor', 'textColor', 'buttonVariant', 'alignment', 'spacerHeight']) {
        if (typeof b.customStyle[k] === 'string') cs[k] = b.customStyle[k].slice(0, 100);
      }
      if (Object.keys(cs).length > 0) clean.customStyle = cs;
    }
    out.push(clean);
  }
  return out;
}

// ---------- MIME & OG ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function indexHtmlWithMeta(microsite) {
  let html = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  if (!microsite) return html;
  const title = `${microsite.name || 'Microsite'} - Puskesmas Manding`;
  const desc = microsite.description || 'Portal informasi Puskesmas Manding.';
  const img = microsite.ogImageUrl || microsite.profileImageUrl || microsite.logoUrl || '/logo.png';
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${escapeHtml(img)}" />`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(desc)}" />`
  );
  return html;
}

// ---------- server ----------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    }

    // ---- Auth ----
    if (req.method === 'POST' && pathname === '/api/auth/google') {
      const body = await readBody(req);
      const info = await verifyGoogleToken(body.credential);
      if (!info) return sendJson(res, 401, { error: 'Token Google tidak valid' });
      const now = new Date().toISOString();
      const existing = getDb().prepare('SELECT * FROM users WHERE email = ?').get(info.email);
      let userId;
      let role;
      if (existing) {
        // Email bootstrap selalu admin; user lain mempertahankan role-nya.
        role = info.email === ADMIN_BOOTSTRAP_EMAIL ? 'admin' : existing.role;
        getDb()
          .prepare('UPDATE users SET name = ?, picture = ?, role = ?, updated_at = ? WHERE id = ?')
          .run(info.name, info.picture, role, now, existing.id);
        userId = existing.id;
      } else {
        const userCount = getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n;
        role = userCount === 0 || info.email === ADMIN_BOOTSTRAP_EMAIL ? 'admin' : 'user';
        userId = crypto.randomUUID();
        getDb()
          .prepare('INSERT INTO users (id, email, name, picture, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(userId, info.email, info.name, info.picture, role, now, now);
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
      getDb()
        .prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(sha256(token), userId, expires, now);
      setSessionCookie(res, token);
      const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(userId);
      return sendJson(res, 200, { success: true, user: publicUser(row) });
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const token = parseCookies(req)[SESSION_COOKIE];
      if (token) {
        getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
      }
      clearSessionCookie(res);
      return sendJson(res, 200, { success: true });
    }

    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      const count = getDb()
        .prepare('SELECT COUNT(*) AS n FROM microsites WHERE owner_id = ?')
        .get(user.id).n;
      return sendJson(res, 200, { success: true, user: { ...user, micrositeCount: count } });
    }

    if (req.method === 'PATCH' && pathname === '/api/profile') {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      const body = await readBody(req);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 100) {
        return sendJson(res, 400, { error: 'Nama tampilan wajib diisi (maks 100 karakter)' });
      }
      getDb()
        .prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
        .run(name, new Date().toISOString(), user.id);
      const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      return sendJson(res, 200, { success: true, user: publicUser(row) });
    }

    // ---- Admin: kelola user ----
    if (req.method === 'GET' && pathname === '/api/users') {
      const user = getSessionUser(req);
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Khusus admin' });
      const rows = getDb()
        .prepare(
          `SELECT u.*, (SELECT COUNT(*) FROM microsites m WHERE m.owner_id = u.id) AS microsite_count
           FROM users u ORDER BY u.created_at ASC`
        )
        .all();
      return sendJson(res, 200, {
        success: true,
        data: rows.map((r) => ({ ...publicUser(r), micrositeCount: r.microsite_count }))
      });
    }

    const roleMatch = pathname.match(/^\/api\/users\/([^/]+)\/role$/);
    if (req.method === 'PATCH' && roleMatch) {
      const user = getSessionUser(req);
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Khusus admin' });
      const body = await readBody(req);
      if (!['admin', 'petugas', 'user'].includes(body.role)) {
        return sendJson(res, 400, { error: 'Role tidak valid' });
      }
      const target = getDb().prepare('SELECT * FROM users WHERE id = ?').get(decodeURIComponent(roleMatch[1]));
      if (!target) return sendJson(res, 404, { error: 'User tidak ditemukan' });
      if (target.role === 'admin' && body.role !== 'admin') {
        const adminCount = getDb().prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).get().n;
        if (adminCount <= 1) {
          return sendJson(res, 400, { error: 'Tidak bisa menurunkan admin terakhir' });
        }
      }
      getDb()
        .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
        .run(body.role, new Date().toISOString(), target.id);
      return sendJson(res, 200, { success: true, user: publicUser({ ...target, role: body.role }) });
    }

    // ---- API baca publik (bentuk respons sama seperti sebelumnya) ----
    if (req.method === 'GET' && pathname === '/api/db/microsites') {
      const user = getSessionUser(req);
      return sendJson(res, 200, { success: true, data: listMicrositesFor(user) });
    }
    if (req.method === 'GET' && pathname === '/api/db/microsite_categories') {
      return sendJson(res, 200, { success: true, data: listCategories() });
    }
    if (req.method === 'GET' && pathname === '/api/db/site_settings') {
      return sendJson(res, 200, { success: true, data: getSiteSettings() });
    }
    if (req.method === 'GET' && pathname === '/api/microsites/categories') {
      return sendJson(res, 200, { success: true, categories: listCategories() });
    }
    if (req.method === 'GET' && pathname === '/api/site-settings') {
      return sendJson(res, 200, getSiteSettings());
    }

    // Halaman publik per-slug dengan gating draf: draf/inaktif hanya untuk
    // pemilik/petugas/admin yang login; selain itu hanya info status minimal.
    const bySlugMatch = pathname.match(/^\/api\/microsites\/by-slug\/(.+)$/);
    if (req.method === 'GET' && bySlugMatch) {
      const slug = decodeURIComponent(bySlugMatch[1]).replace(/^\/+|\/+$/g, '');
      const row = getMicrositeRowBySlug(slug);
      if (!row) return sendJson(res, 404, { error: 'Microsite tidak ditemukan' });
      const rec = toPublicRecord(row);
      const published = rec.status === 'published' && rec.active !== false;
      if (published) return sendJson(res, 200, { success: true, data: rec });
      const user = getSessionUser(req);
      if (canManage(user, rec)) return sendJson(res, 200, { success: true, data: rec });
      return sendJson(res, 200, {
        success: true,
        draft: true,
        data: { name: rec.name, slug: rec.slug, status: rec.status, active: rec.active }
      });
    }

    // No-op sinkronisasi dari klien (dipakai jalur admin web utama, bukan publik)
    if (
      req.method === 'POST' &&
      (pathname === '/api/sync-metadata' || pathname === '/api/microsites/sync-item')
    ) {
      await readBody(req);
      return sendJson(res, 200, { success: true });
    }
    // Upsert kompatibilitas (saveDocumentData) — kini wajib petugas/admin.
    if (req.method === 'POST' && pathname === '/api/db/microsites') {
      const user = getSessionUser(req);
      if (!isStaff(user)) return sendJson(res, 403, { error: 'Khusus petugas/admin' });
      const body = await readBody(req);
      const id = body.id || body.slug;
      if (!id) return sendJson(res, 400, { error: 'Missing id' });
      const now = new Date().toISOString();
      const existingRow = getMicrositeRowById(id) || getMicrositeRowBySlug(body.slug || '');
      const ownerId = existingRow ? existingRow.owner_id : user.id;
      const { password: _p, ...safeBody } = body;
      const record = { ...safeBody, owner_id: ownerId };
      getDb()
        .prepare(
          `INSERT INTO microsites (id, slug, owner_id, status, active, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, owner_id = excluded.owner_id,
             status = excluded.status, active = excluded.active, data = excluded.data,
             updated_at = excluded.updated_at`
        )
        .run(id, body.slug || null, ownerId, body.status || 'draft', body.active === false ? 0 : 1,
          JSON.stringify(record), existingRow ? existingRow.created_at : now, now);
      return sendJson(res, 200, { success: true, data: record });
    }
    // Simpan kategori massal (kompatibilitas micrositeService.saveCategories).
    if (req.method === 'POST' && pathname === '/api/microsites/categories') {
      const user = getSessionUser(req);
      if (!isStaff(user)) return sendJson(res, 403, { error: 'Khusus petugas/admin' });
      const body = await readBody(req);
      if (!Array.isArray(body)) return sendJson(res, 400, { error: 'Kategori harus array' });
      const now = new Date().toISOString();
      const names = new Set();
      const cleaned = [];
      for (const c of body) {
        if (!c || typeof c.name !== 'string' || !c.name.trim()) continue;
        const name = c.name.trim();
        if (names.has(name.toLowerCase())) continue;
        names.add(name.toLowerCase());
        cleaned.push({ name, description: typeof c.description === 'string' ? c.description : '' });
      }
      if (!cleaned.some((c) => c.name.toLowerCase() === 'umum')) {
        cleaned.unshift({ name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' });
      }
      getDb().prepare('DELETE FROM categories').run();
      for (const c of cleaned) {
        getDb()
          .prepare('INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)')
          .run('c-' + slugify(c.name), c.name, c.description, now);
      }
      return sendJson(res, 200, { success: true, categories: listCategories() });
    }

    // ---- Dashboard: microsite ----
    if (pathname === '/api/dashboard/microsites') {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      if (req.method === 'GET') {
        const rows = getDb()
          .prepare(
            `SELECT m.*, u.name AS owner_name, u.email AS owner_email FROM microsites m
             LEFT JOIN users u ON u.id = m.owner_id ORDER BY m.updated_at DESC`
          )
          .all();
        const out = [];
        for (const row of rows) {
          const rec = toPublicRecord(row);
          if (!rec) continue;
          if (isStaff(user) || rec.owner_id === user.id) {
            out.push({ ...rec, ownerName: row.owner_name || null, ownerEmail: row.owner_email || null });
          }
        }
        return sendJson(res, 200, { success: true, data: out });
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) return sendJson(res, 400, { error: 'Nama microsite wajib diisi' });
        let slug = typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(name);
        if (!validSlug(slug)) {
          return sendJson(res, 400, { error: 'Slug tidak valid atau dicadangkan (pakai huruf, angka, tanda -)' });
        }
        if (getMicrositeRowBySlug(slug)) {
          return sendJson(res, 409, { error: `Slug "${slug}" sudah digunakan` });
        }
        const now = new Date().toISOString();
        const id = 'm-' + crypto.randomBytes(4).toString('hex');
        const theme = typeof body.theme === 'string' ? body.theme : 'emerald';
        const template = typeof body.template === 'string' ? body.template : 'modern_majestic';
        const record = {
          id,
          name,
          slug,
          description: typeof body.description === 'string' ? body.description : '',
          category: typeof body.category === 'string' ? body.category : 'Umum',
          status: 'draft',
          active: true,
          passwordProtected: false,
          links: [],
          blocks: [],
          groups: [],
          phone: typeof body.phone === 'string' ? body.phone : '',
          email: typeof body.email === 'string' ? body.email : '',
          website: typeof body.website === 'string' ? body.website : '',
          address: typeof body.address === 'string' ? body.address : '',
          logoUrl: '',
          profileImageUrl: '',
          bannerImageUrl: '',
          backgroundImageUrl: '',
          footerImageUrl: '',
          themeCustomization: { template, theme },
          createdAt: now,
          updatedAt: now,
          owner_id: user.id
        };
        getDb()
          .prepare('INSERT INTO microsites (id, slug, owner_id, status, active, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(id, slug, user.id, 'draft', 1, JSON.stringify(record), now, now);
        return sendJson(res, 201, { success: true, data: record });
      }
    }

    const dashMatch = pathname.match(/^\/api\/dashboard\/microsites\/([^/]+)$/);
    if (dashMatch) {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      const row = getMicrositeRowById(decodeURIComponent(dashMatch[1]));
      if (!row) return sendJson(res, 404, { error: 'Microsite tidak ditemukan' });
      const rec = toPublicRecord(row);
      if (!canManage(user, rec)) return sendJson(res, 403, { error: 'Bukan microsite Anda' });
      if (req.method === 'GET') {
        const owner = row.owner_id
          ? getDb().prepare('SELECT name, email FROM users WHERE id = ?').get(row.owner_id)
          : null;
        return sendJson(res, 200, {
          success: true,
          data: { ...rec, ownerName: owner ? owner.name : null, ownerEmail: owner ? owner.email : null }
        });
      }
      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const now = new Date().toISOString();
        const next = { ...rec };
        const textFields = [
          'name', 'description', 'category', 'phone', 'email', 'website', 'address',
          'logoUrl', 'profileImageUrl', 'bannerImageUrl', 'backgroundImageUrl', 'footerImageUrl'
        ];
        for (const f of textFields) {
          if (typeof body[f] === 'string') next[f] = body[f].slice(0, 4000);
        }
        if (typeof body.name === 'string' && !body.name.trim()) {
          return sendJson(res, 400, { error: 'Nama microsite wajib diisi' });
        }
        if (body.status === 'published' || body.status === 'draft') next.status = body.status;
        if (typeof body.active === 'boolean') next.active = body.active;
        if (typeof body.slug === 'string' && body.slug.trim()) {
          const newSlug = slugify(body.slug);
          if (!validSlug(newSlug)) {
            return sendJson(res, 400, { error: 'Slug tidak valid atau dicadangkan' });
          }
          if (newSlug !== rec.slug && getMicrositeRowBySlug(newSlug)) {
            return sendJson(res, 409, { error: `Slug "${newSlug}" sudah digunakan` });
          }
          next.slug = newSlug;
        }
        if (typeof body.template === 'string' || typeof body.theme === 'string') {
          next.themeCustomization = {
            ...(rec.themeCustomization || {}),
            ...(typeof body.template === 'string' ? { template: body.template } : {}),
            ...(typeof body.theme === 'string' ? { theme: body.theme } : {})
          };
        }
        next.updatedAt = now;
        next.owner_id = rec.owner_id;
        getDb()
          .prepare(
            `UPDATE microsites SET slug = ?, status = ?, active = ?, data = ?, updated_at = ? WHERE id = ?`
          )
          .run(next.slug, next.status, next.active === false ? 0 : 1, JSON.stringify(next), now, row.id);
        return sendJson(res, 200, { success: true, data: next });
      }
      if (req.method === 'DELETE') {
        getDb().prepare('DELETE FROM microsites WHERE id = ?').run(row.id);
        return sendJson(res, 200, { success: true });
      }
    }

    const blocksMatch = pathname.match(/^\/api\/dashboard\/microsites\/([^/]+)\/blocks$/);
    if (blocksMatch) {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      const row = getMicrositeRowById(decodeURIComponent(blocksMatch[1]));
      if (!row) return sendJson(res, 404, { error: 'Microsite tidak ditemukan' });
      const rec = toPublicRecord(row);
      if (!canManage(user, rec)) return sendJson(res, 403, { error: 'Bukan microsite Anda' });
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, blocks: Array.isArray(rec.blocks) ? rec.blocks : [] });
      }
      if (req.method === 'PUT') {
        const body = await readBody(req);
        const clean = sanitizeBlocks(body.blocks);
        if (clean === null) {
          return sendJson(res, 400, { error: 'Daftar blok tidak valid (tipe blok tidak dikenal)' });
        }
        const now = new Date().toISOString();
        const next = { ...rec, blocks: clean, updatedAt: now, owner_id: rec.owner_id };
        getDb()
          .prepare('UPDATE microsites SET data = ?, updated_at = ? WHERE id = ?')
          .run(JSON.stringify(next), now, row.id);
        return sendJson(res, 200, { success: true, blocks: clean });
      }
    }

    // ---- Dashboard: kategori ----
    if (pathname === '/api/dashboard/categories') {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, data: listCategories() });
      }
      if (req.method === 'POST') {
        if (!isStaff(user)) return sendJson(res, 403, { error: 'Khusus petugas/admin' });
        const body = await readBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) return sendJson(res, 400, { error: 'Nama kategori wajib diisi' });
        const dup = getDb()
          .prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)')
          .get(name);
        if (dup) return sendJson(res, 409, { error: `Kategori "${name}" sudah ada` });
        const now = new Date().toISOString();
        const id = 'c-' + crypto.randomBytes(4).toString('hex');
        getDb()
          .prepare('INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)')
          .run(id, name, typeof body.description === 'string' ? body.description : '', now);
        return sendJson(res, 201, { success: true, data: { id, name, description: body.description || '' } });
      }
    }

    const catMatch = pathname.match(/^\/api\/dashboard\/categories\/([^/]+)$/);
    if (catMatch) {
      const user = getSessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Belum login' });
      if (!isStaff(user)) return sendJson(res, 403, { error: 'Khusus petugas/admin' });
      const cat = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(decodeURIComponent(catMatch[1]));
      if (!cat) return sendJson(res, 404, { error: 'Kategori tidak ditemukan' });
      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const newName = typeof body.name === 'string' ? body.name.trim() : cat.name;
        const newDesc = typeof body.description === 'string' ? body.description : cat.description;
        if (!newName) return sendJson(res, 400, { error: 'Nama kategori wajib diisi' });
        if (cat.name.toLowerCase() === 'umum' && newName.toLowerCase() !== 'umum') {
          return sendJson(res, 400, { error: "Kategori 'Umum' tidak boleh diubah namanya" });
        }
        if (newName.toLowerCase() !== cat.name.toLowerCase()) {
          const dup = getDb()
            .prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?')
            .get(newName, cat.id);
          if (dup) return sendJson(res, 409, { error: `Kategori "${newName}" sudah ada` });
          // Propagasi nama baru ke microsite yang memakai kategori lama.
          const micros = getDb().prepare('SELECT * FROM microsites').all();
          for (const m of micros) {
            try {
              const data = JSON.parse(m.data);
              if (typeof data.category === 'string' && data.category.toLowerCase() === cat.name.toLowerCase()) {
                data.category = newName;
                data.updatedAt = new Date().toISOString();
                getDb()
                  .prepare('UPDATE microsites SET data = ?, updated_at = ? WHERE id = ?')
                  .run(JSON.stringify(data), data.updatedAt, m.id);
              }
            } catch {}
          }
        }
        getDb()
          .prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?')
          .run(newName, newDesc, cat.id);
        return sendJson(res, 200, { success: true, data: { id: cat.id, name: newName, description: newDesc } });
      }
      if (req.method === 'DELETE') {
        if (cat.name.toLowerCase() === 'umum') {
          return sendJson(res, 400, { error: "Kategori 'Umum' tidak dapat dihapus" });
        }
        let used = 0;
        const micros = getDb().prepare('SELECT data FROM microsites').all();
        for (const m of micros) {
          try {
            const data = JSON.parse(m.data);
            if (typeof data.category === 'string' && data.category.toLowerCase() === cat.name.toLowerCase()) used++;
          } catch {}
        }
        if (used > 0) {
          return sendJson(res, 400, { error: `Kategori masih dipakai ${used} microsite` });
        }
        getDb().prepare('DELETE FROM categories WHERE id = ?').run(cat.id);
        return sendJson(res, 200, { success: true });
      }
    }

    // ---- Media: arahkan ke web utama ----
    if (pathname.startsWith('/uploads/')) {
      res.writeHead(302, { Location: MAIN_WEB + pathname });
      return res.end();
    }

    // ---- File statis ----
    if (pathname.startsWith('/assets/') || pathname === '/favicon.svg' || pathname === '/logo.png') {
      const file = path.join(DIST_DIR, pathname);
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        const ext = path.extname(file);
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600'
        });
        return fs.createReadStream(file).pipe(res);
      }
    }

    // ---- SPA fallback + OG untuk /:slug yang terbit ----
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      let slug = parts.length > 0 ? parts[parts.length - 1] : '';
      if (['m', 'microsite', 'microsites', 'login', 'profil', 'dashboard', 'admin'].includes(slug)) {
        slug = parts.length > 1 ? parts[parts.length - 1] : '';
        if (['login', 'profil', 'dashboard', 'admin'].includes(parts[0])) slug = '';
      }
      let micro = null;
      if (slug) {
        const row = getMicrositeRowBySlug(slug);
        if (row) {
          const rec = toPublicRecord(row);
          if (rec.status === 'published' && rec.active !== false) micro = rec;
        }
      }
      const html = indexHtmlWithMeta(micro);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return res.end(html);
    }

    return sendJson(res, 404, { error: 'Tidak ditemukan' });
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: 'Kesalahan server' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Microsite Puskesmas berjalan di http://${HOST}:${PORT} (DB: ${DB_PATH})`);
});
