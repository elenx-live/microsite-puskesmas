/**
 * Backend aplikasi microsite mandiri — NOL dependensi eksternal.
 *
 * Menyajikan:
 *  - file statis hasil build Vite (dist/)
 *  - API baca microsite dari puskesmas.db YANG SAMA dengan web utama
 *    (tabel `items` + `kv_store`, mode WAL sehingga aman dibaca bersama
 *    service web utama; proses ini hanya SELECT kecuali upsert eksplisit)
 *  - injeksi meta Open Graph untuk /:slug (pratinjau tautan WhatsApp)
 *  - pengalihan /uploads/* ke web utama (media microsite tinggal di sana)
 *
 * Port default 3404. DB: env MICROSITE_DB_PATH atau path produksi web utama.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3404);
const HOST = process.env.HOST || '127.0.0.1';
const APP_ROOT = __dirname;
const DIST_DIR = path.join(APP_ROOT, 'dist');
const DB_PATH =
  process.env.MICROSITE_DB_PATH ||
  '/www/wwwroot/test-puskesmas.puskesmasmanding.com/puskesmas.db';
const MAIN_WEB = 'https://sumenep.puskesmasmanding.com';

const DEFAULT_CATEGORIES = [
  { name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' },
  { name: 'Layanan Puskesmas', description: 'Akses cepat portal utama layanan rawat jalan, gawat darurat, pendaftaran online, dan jadwal poliklinik.' },
  { name: 'Program Kesehatan', description: 'Portal tematik program khusus kesehatan masyarakat seperti PIN Polio, pencegahan stunting, dan imunisasi.' },
  { name: 'Informasi Publik', description: 'Kumpulan regulasi, Standar Pelayanan Publik (SPP), maklumat, serta laporan akuntabilitas kinerja.' },
  { name: 'Kampanye & Edukasi', description: 'Materi penyuluhan kesehatan, infografis pencegahan penyakit, dan sosialisasi program hidup sehat.' }
];

let db = null;
function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  }
  return db;
}

function itemsAll(collection) {
  try {
    const rows = getDb()
      .prepare('SELECT data FROM items WHERE collection = ? ORDER BY updated_at DESC')
      .all(collection);
    const out = [];
    for (const r of rows) {
      try {
        out.push(JSON.parse(r.data));
      } catch {}
    }
    return out;
  } catch (e) {
    console.error(`[db] itemsAll ${collection}:`, e.message);
    return [];
  }
}

function kvGetJson(key) {
  try {
    const row = getDb().prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch {
      return null;
    }
  } catch (e) {
    console.error(`[db] kvGet ${key}:`, e.message);
    return null;
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(body);
}

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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    }

    // ---- API baca ----
    if (req.method === 'GET' && pathname === '/api/db/microsites') {
      return sendJson(res, 200, { success: true, data: itemsAll('microsites') });
    }
    if (req.method === 'GET' && pathname === '/api/db/microsite_categories') {
      const list = itemsAll('microsite_categories');
      return sendJson(res, 200, { success: true, data: list.length > 0 ? list : DEFAULT_CATEGORIES });
    }
    if (req.method === 'GET' && pathname === '/api/db/site_settings') {
      return sendJson(res, 200, { success: true, data: kvGetJson('site_settings') });
    }
    if (req.method === 'GET' && pathname === '/api/microsites/categories') {
      const list = itemsAll('microsite_categories');
      return sendJson(res, 200, {
        success: true,
        categories: list.length > 0 ? list : DEFAULT_CATEGORIES
      });
    }
    if (req.method === 'GET' && pathname === '/api/site-settings') {
      const s = kvGetJson('site_settings');
      return sendJson(res, 200, s || { siteName: 'Puskesmas Manding' });
    }
    // No-op sinkronisasi dari klien (dipakai jalur admin web utama, bukan publik)
    if (
      req.method === 'POST' &&
      (pathname === '/api/sync-metadata' || pathname === '/api/microsites/sync-item')
    ) {
      await readBody(req);
      return sendJson(res, 200, { success: true });
    }
    // Upsert satu dokumen (kompatibilitas saveDocumentData; tidak dipakai jalur publik)
    if (req.method === 'POST' && pathname === '/api/db/microsites') {
      const body = await readBody(req);
      const id = body.id || body.slug;
      if (!id) return sendJson(res, 400, { error: 'Missing id' });
      const now = new Date().toISOString();
      getDb()
        .prepare(
          `INSERT INTO items (collection, id, data, slug, status, updated_at) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, slug = excluded.slug, status = excluded.status, updated_at = excluded.updated_at`
        )
        .run('microsites', id, JSON.stringify(body), body.slug || null, body.status || null, now);
      return sendJson(res, 200, { success: true, data: body });
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
        const isIndex = false;
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600'
        });
        return fs.createReadStream(file).pipe(res);
      }
    }

    // ---- SPA fallback + OG untuk /:slug ----
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      const slug = pathname.replace(/^\/+|\/+$/g, '').split('/').pop();
      let micro = null;
      if (slug && slug !== 'm' && slug !== 'microsite' && slug !== 'microsites') {
        micro = itemsAll('microsites').find((m) => m.slug === slug) || null;
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
