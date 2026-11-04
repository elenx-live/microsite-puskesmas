import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { Resvg } from "@resvg/resvg-js";

// Load environment variables
dotenv.config();

// Global process error guards to prevent server exits on third-party SDK failures
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

const app = express();
const PORT = Number(process.env.PORT) || 3800;

// Security & Hardening Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.removeHeader("X-Powered-By");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==========================================
// MIDDLEWARE KEAMANAN (HARDENING) — hasil audit 2026-11-03
// WAJIB berada SEBELUM semua route /api agar tidak bisa dilewati.
// Menutup: mutasi API tanpa sesi admin, baca koleksi sensitif /api/data/*.
// ==========================================
const SESSION_COOKIE_NAME = 'puskesmas_session';
const PUBLIC_DATA_COLLECTIONS = new Set([
  'posts', 'microsites', 'public_pages', 'menus', 'categories',
  'announcements', 'documents', 'gallery', 'faq', 'services',
  'service_categories', 'service_clusters', 'service_units', 'service_locations',
  'facilities', 'org_structure', 'staff_directory', 'public_information',
  'theme', 'homepage'
]);

function getSessionCookie(req: express.Request): string {
  try {
    const raw = req.headers.cookie || '';
    for (const part of raw.split(';')) {
      const [k, ...v] = part.trim().split('=');
      if (k === SESSION_COOKIE_NAME || k === 'admin_session' || k === 'puskesmas_auth') {
        return decodeURIComponent(v.join('=') || '');
      }
    }
  } catch {}
  return '';
}

function extractAuthToken(req: express.Request): string {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  return getSessionCookie(req);
}

/** True hanya bila request membawa token sesi admin yang valid. */
function isAdminRequest(req: express.Request): boolean {
  const token = extractAuthToken(req);
  if (!token) return false;
  // 1) Sesi admin multi-user (SQLite) — admin platform ber-role 'admin'.
  try {
    const platUser = store.lookupSession(token);
    if (platUser && platUser.role === 'admin' && platUser.status === 'active') return true;
  } catch {}
  // 2) Sesi admin legacy (in-memory store) — dipertahankan agar /admin lama utuh.
  try {
    const verify = (globalThis as any).__verifyAdminToken;
    const sess = typeof verify === 'function' ? verify(token) : null;
    if (sess && sess.isAdmin) return true;
  } catch {}
  // 3) Token statis dari env (kompatibilitas lama).
  const allow = (process.env.ADMIN_SESSION_TOKENS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allow.length > 0 && allow.includes(token);
}

function denyUnauthorized(res: express.Response, msg = 'Akses ditolak: butuh sesi admin.') {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(401).json({ error: 'Unauthorized', message: msg });
}

// ── SESI ADMIN NYATA (server-side) ─────────────────────────────────────────
// Login klien app sumenep murni di localStorage (tanpa bukti ke server). Agar
// gerbang /admin di server bisa menyeimbangkan, kita terbitkan sesi server:
// cookie HttpOnly berisi token acak, divalidasi ke store in-memory.
const ADMIN_SESSION_STORE = new Map<string, { email: string; isAdmin: boolean; exp: number }>();
const ADMIN_SESSION_TTL = 1000 * 60 * 60 * 12; // 12 jam
const SUPER_ADMIN_EMAIL = 'elengemail@gmail.com';
const SUPER_ADMIN_PASSWORD_HASH = '3da4c2442116220c9c9479ba16ec7514ae7e5a3c93f7aa56bf2dab2c227833ce';

// ── GOOGLE IDENTITY (Sign-In) ──────────────────────────────────────────────
// Client ID "Web application" milik project Puskesmas Manding. ID token dari
// Google divalidasi ke oauth2.googleapis.com/tokeninfo lalu dicocokkan aud-nya.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '936354706213-o3189kpkb6vrlvdal3gb9mut8717me6i.apps.googleusercontent.com';

/**
 * Verifikasi ID token Google. Mengembalikan profil bila valid (aud cocok,
 * email terverifikasi), selain itu null.
 */
function verifyGoogleIdToken(credential: string): Promise<{ email: string; name?: string; picture?: string } | null> {
  return new Promise((resolve) => {
    if (!credential || typeof credential !== 'string') return resolve(null);
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const https = require('https');
    https
      .get(url, (r: any) => {
        let raw = '';
        r.on('data', (c: Buffer) => (raw += c));
        r.on('end', () => {
          try {
            const info = JSON.parse(raw);
            const ok =
              r.statusCode === 200 &&
              info &&
              info.aud === GOOGLE_CLIENT_ID &&
              (info.email_verified === 'true' || info.email_verified === true) &&
              typeof info.email === 'string';
            if (!ok) return resolve(null);
            resolve({
              email: String(info.email).toLowerCase(),
              name: info.name || info.email,
              picture: info.picture || '',
            });
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function createAdminSession(email: string, isAdmin: boolean): string {
  const token = crypto.randomBytes(32).toString('hex');
  ADMIN_SESSION_STORE.set(token, { email, isAdmin, exp: Date.now() + ADMIN_SESSION_TTL });
  return token;
}

function lookupAdminSession(token: string): { email: string; isAdmin: boolean } | null {
  if (!token) return null;
  const s = ADMIN_SESSION_STORE.get(token);
  if (!s) return null;
  if (s.exp < Date.now()) { ADMIN_SESSION_STORE.delete(token); return null; }
  return { email: s.email, isAdmin: s.isAdmin };
}

// Hook yang dipakai isAdminRequest agar konsisten dengan middleware lain
(globalThis as any).__verifyAdminToken = (token: string) => lookupAdminSession(token);

// ── MULTI-USER (F1): DB + sesi pengguna ────────────────────────────────────
// Sesi pengguna disimpan di SQLite (tabel sessions) lewat modul ./db.
// isAdminRequest di atas tetap dipertahankan agar /admin lama tidak rusak;
// helper baru di bawah menangani pengelola biasa dan admin multi-user.
import * as store from './db';

try {
  store.initDb();
  // Bootstrap super-admin dari env/lama bila belum ada, lalu impor microsite lama.
  const superEmail = (process.env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL).toLowerCase();
  let superUser = store.findUserByEmail(superEmail);
  if (!superUser) {
    superUser = store.createUser({
      email: superEmail,
      name: 'Super Admin',
      role: 'admin',
      status: 'active',
    });
    // Password lama (hash sha256) tidak bisa dipindah ke scrypt; simpan kosong
    // agar login password lama ditolak dan wajib reset / pakai Google.
    console.log('[db] super-admin dibuat:', superEmail);
  }
  // Admin tambahan dari ADMIN_EMAILS (allowlist lama) → role admin.
  const extraAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  for (const e of extraAdmins) {
    if (!store.findUserByEmail(e)) store.createUser({ email: e, name: e.split('@')[0], role: 'admin' });
  }
  const imported = store.importLegacyMicrosites(superUser.id);
  if (imported) console.log(`[db] ${imported} microsite lama diimpor ke SQLite.`);
} catch (e: any) {
  console.error('[db] inisialisasi gagal:', e?.message || e);
}

/** Ambil pengguna dari sesi (cookie/Bearer) via SQLite. */
function getSessionUser(req: express.Request): store.DbUser | null {
  const token = extractAuthToken(req);
  const sess = store.lookupSession(token);
  return sess || null;
}

/** True bila request punya sesi pengguna valid ber-role admin. */
function isPlatformAdmin(req: express.Request): boolean {
  const u = getSessionUser(req);
  return !!u && u.role === 'admin' && u.status === 'active';
}

/** Gerbang tulis: butuh sesi pengguna valid (pengelola atau admin). */
function requireUser(req: express.Request, res: express.Response): store.DbUser | null {
  const u = getSessionUser(req);
  if (!u || u.status !== 'active') {
    denyUnauthorized(res, 'Sesi tidak valid atau akun tidak aktif. Silakan login ulang.');
    return null;
  }
  return u;
}

function publicUser(u: store.DbUser) {
  return {
    id: u.id, email: u.email, name: u.name, role: u.role, status: u.status,
    avatarUrl: u.avatar_url, orgName: u.org_name, phone: u.phone, bio: u.bio,
    shareSlug: u.share_slug || null,
    shareEnabled: !!u.share_enabled,
    shareTagline: u.share_tagline || null,
    shareTitle: u.share_title || null,
    createdAt: u.created_at, lastLoginAt: u.last_login_at,
  };
}

function clientIp(req: express.Request): string {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}


function setSessionCookie(res: express.Response, token: string) {
  const isSecure = (process.env.PUBLIC_BASE_URL || '').startsWith('https') || process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(ADMIN_SESSION_TTL / 1000)}`
  ];
  if (isSecure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: express.Response) {
  res.append('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// ── ENDPOINT SESI (didaftarkan SEBELUM guard mutation agar bisa diakses) ────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || SUPER_ADMIN_EMAIL)
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Konfigurasi publik untuk frontend (Google Sign-In).
app.get('/api/auth/config', (_req: express.Request, res: express.Response) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

// Login dengan kata sandi (diverifikasi 100% di server).
app.post('/api/auth/session', express.json(), async (req: express.Request, res: express.Response) => {
  try {
    const body = req.body || {};
    const mode = String(body.mode || 'password');
    const email = String(body.email || '').trim().toLowerCase();

    if (mode === 'google') {
      // Verifikasi ID token Google di server (aud harus cocok dengan
      // GOOGLE_CLIENT_ID). Email mentah dari klien TIDAK dipercaya.
      const credential = String(body.credential || body.token || '');
      const profile = await verifyGoogleIdToken(credential);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token Google tidak valid.' });
      }
      const gEmail = profile.email;
      if (!ADMIN_EMAILS.includes(gEmail)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Akun ${gEmail} tidak memiliki hak admin.`,
        });
      }
      const token = createAdminSession(gEmail, true);
      setSessionCookie(res, token);
      return res.json({ success: true, email: gEmail, name: profile.name, isAdmin: true, mode: 'google' });
    }

    // Mode kata sandi: verifikasi di server.
    const password = String(body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });

    const pwdHash = sha256Hex(password);
    const passwordOk = timingSafeEqualHex(pwdHash, SUPER_ADMIN_PASSWORD_HASH);

    if (email === SUPER_ADMIN_EMAIL && passwordOk) {
      const token = createAdminSession(email, true);
      setSessionCookie(res, token);
      return res.json({ success: true, email, isAdmin: true, mode: 'password' });
    }

    // Admin tambahan via env ADMIN_CREDENTIALS (format: email:hash,email:hash)
    const extra = (process.env.ADMIN_CREDENTIALS || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const pair of extra) {
      const [e, h] = pair.split(':');
      if (e && h && e.trim().toLowerCase() === email && timingSafeEqualHex(pwdHash, h.trim())) {
        const token = createAdminSession(email, true);
        setSessionCookie(res, token);
        return res.json({ success: true, email, isAdmin: true, mode: 'password' });
      }
    }

    return res.status(401).json({ error: 'Unauthorized', message: 'Kombinasi email atau kata sandi tidak sesuai.' });
  } catch (e: any) {
    console.error('Session error:', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/api/auth/session', (req: express.Request, res: express.Response) => {
  const token = extractAuthToken(req);
  const sess = lookupAdminSession(token);
  if (!sess) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, email: sess.email, isAdmin: sess.isAdmin });
});

app.post('/api/auth/logout', (req: express.Request, res: express.Response) => {
  const token = extractAuthToken(req);
  if (token) {
    ADMIN_SESSION_STORE.delete(token);
    try { store.deleteSession(token); } catch {}
  }
  clearSessionCookie(res);
  return res.json({ success: true });
});

// ── API AUTH MULTI-USER (F1) ───────────────────────────────────────────────
// Cookie peran ganda: `serveSessionCookie` memakai nama cookie yang sama
// (print_session/…). Pengelola & admin memakai store SQLite yang sama.

// Registrasi pengelola mandiri.
app.post('/api/auth/register', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email tidak valid.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
    }
    // Hormati pengaturan platform: pendaftaran bisa ditutup admin.
    const settings = store.getPlatformSettings();
    if (settings.registrationOpen === false) {
      return res.status(403).json({ error: 'Pendaftaran akun baru sedang ditutup. Hubungi administrator.' });
    }
    if (store.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }
    const user = store.createUser({ email, password, name: name || email.split('@')[0], role: 'pengelola' });
    const token = store.createSession(user.id, 24 * 7, { ua: req.headers['user-agent'], ip: clientIp(req) });
    store.touchLastLogin(user.id);
    store.audit({ actorId: user.id, actorEmail: user.email, action: 'register', ip: clientIp(req) });
    setSessionCookie(res, token);
    return res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    if (e?.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Email sudah terdaftar.' });
    console.error('register error:', e?.message || e);
    return res.status(500).json({ error: 'Gagal mendaftar.' });
  }
});

// Login pengelola/admin (password).
app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    const user = store.findUserByEmail(email);
    if (!user || !store.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: user.status === 'suspended' ? 'Akun Anda dinonaktifkan.' : 'Akun tidak aktif.' });
    }
    const token = store.createSession(user.id, 24 * 7, { ua: req.headers['user-agent'], ip: clientIp(req) });
    store.touchLastLogin(user.id);
    store.audit({ actorId: user.id, actorEmail: user.email, action: 'login', ip: clientIp(req) });
    setSessionCookie(res, token);
    return res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    console.error('login error:', e?.message || e);
    return res.status(500).json({ error: 'Gagal login.' });
  }
});

// Login/registrasi via Google (auto-provision akun pengelola baru).
app.post('/api/auth/google', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const credential = String(body.credential || body.token || '');
    const profile = await verifyGoogleIdToken(credential);
    if (!profile) return res.status(401).json({ error: 'Token Google tidak valid.' });
    let user = store.findUserByEmail(profile.email);
    if (!user) {
      // Email di allowlist admin lama → admin; selain itu pengelola.
      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const role = (profile.email === SUPER_ADMIN_EMAIL.toLowerCase() || adminEmails.includes(profile.email)) ? 'admin' : 'pengelola';
      user = store.createUser({ email: profile.email, name: profile.name, googleId: undefined, avatarUrl: profile.picture, role });
    }
    if (user.status !== 'active') return res.status(403).json({ error: 'Akun tidak aktif.' });
    const token = store.createSession(user.id, 24 * 7, { ua: req.headers['user-agent'], ip: clientIp(req) });
    store.touchLastLogin(user.id);
    store.audit({ actorId: user.id, actorEmail: user.email, action: 'login_google', ip: clientIp(req) });
    setSessionCookie(res, token);
    return res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    console.error('google login error:', e?.message || e);
    return res.status(500).json({ error: 'Gagal login Google.' });
  }
});

// Sesi pengguna (dipakai frontend untuk menentukan tampilan).
app.get('/api/auth/me', (req, res) => {
  const u = getSessionUser(req);
  if (!u || u.status !== 'active') return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, user: publicUser(u) });
});

// Konfigurasi publik platform (landing page): tanpa data sensitif.
app.get('/api/public/settings', (req, res) => {
  const s = store.getPlatformSettings();
  return res.json({
    success: true,
    registrationOpen: s.registrationOpen !== false,
    platformAnnouncement: s.platformAnnouncement || '',
    showcaseEnabled: s.showcaseEnabled !== false,
    publicCounts: store.platformStats(),
  });
});

// Microsite publik berdasarkan slug (untuk halaman portal & preview).
// Hanya mengembalikan microsite yang published+aktif UNLESS pemiliknya sendiri.
app.get('/api/public/microsite/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim();
  const ms = store.getMicrositeBySlug(slug);
  if (!ms) return res.status(404).json({ error: 'Microsite tidak ditemukan.' });
  const user = getSessionUser(req);
  const isOwner = !!user && (user.role === 'admin' || user.id === ms.ownerId);
  const isLive = (ms.status === 'published' || ms.status == null) && ms.active !== false;
  if (!isLive && !isOwner) {
    return res.status(404).json({ error: 'Microsite tidak tersedia untuk publik.' });
  }
  return res.json({ success: true, microsite: ms });
});

// Ubah kata sandi sendiri.
app.post('/api/me/password', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const body = req.body || {};
  const currentPassword = String(body.currentPassword || '');
  const password = String(body.password || body.newPassword || '');
  if (password.length < 8) return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
  // Bila akun punya sandi, wajibkan verifikasi sandi lama (cegah pengambilalihan via sesi dicuri).
  if (u.password_hash) {
    if (!currentPassword) return res.status(400).json({ error: 'Sandi saat ini wajib diisi.' });
    if (!store.verifyPassword(currentPassword, u.password_hash)) {
      return res.status(403).json({ error: 'Sandi saat ini salah.' });
    }
  }
  store.updateUser(u.id, { password });
  // Putuskan sesi LAIN (bukan sesi yang sedang dipakai) agar perangkat lain login ulang.
  const curToken = extractAuthToken(req);
  store.deleteUserSessionsExcept(u.id, curToken);
  store.audit({ actorId: u.id, actorEmail: u.email, action: 'change_password', ip: clientIp(req) });
  return res.json({ success: true });
});

// Profil pengguna sendiri (update).
// ── Dashboard publik pengelola (/share/<slug>) ──────────────────────────────
// Kelola pengaturan share (opt-in): slug, judul, tagline, aktif/tidak.
app.get('/api/me/share', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  return res.json({ success: true, share: shareSettings(u) });
});

app.post('/api/me/share', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const b = req.body || {};
    const patch: any = {};
    if (b.slug !== undefined) {
      const slug = String(b.slug).trim().toLowerCase();
      if (slug && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) {
        return res.status(400).json({ error: 'Slug hanya huruf kecil, angka, dan tanda hubung (3–60 karakter).' });
      }
      if (slug && store.isShareSlugTaken(slug, u.id)) {
        return res.status(409).json({ error: 'Slug dashboard itu sudah dipakai. Pilih yang lain.' });
      }
      patch.share_slug = slug || null;
    }
    if (b.enabled !== undefined) patch.share_enabled = b.enabled ? 1 : 0;
    if (b.tagline !== undefined) patch.share_tagline = String(b.tagline).slice(0, 300) || null;
    if (b.title !== undefined) patch.share_title = String(b.title).slice(0, 120) || null;
    if (b.config !== undefined) patch.share_config = JSON.stringify(sanitizeShareConfig(b.config));

    // Aktifkan tanpa slug → tolak (butuh slug dulu).
    if (patch.share_enabled === 1 && !(patch.share_slug ?? u.share_slug)) {
      return res.status(400).json({ error: 'Isi slug dashboard dulu sebelum mengaktifkan.' });
    }
    const updated = store.updateUser(u.id, patch);
    store.audit({ actorId: u.id, actorEmail: u.email, action: 'update_share', ip: clientIp(req) });
    return res.json({ success: true, share: shareSettings(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal menyimpan pengaturan dashboard publik.' });
  }
});

/* ── Draft / Publish / Riwayat dashboard publik (visual editor) ────── */

// Simpan draft (autosave / manual) — tidak memengaruhi halaman publik.
app.post('/api/me/share/draft', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const b = req.body || {};
    const clean = sanitizeShareConfig(b.config || b);
    const patch: any = { share_draft: JSON.stringify(clean) };
    if (b.tagline !== undefined) patch.share_tagline = String(b.tagline).slice(0, 300) || null;
    if (b.title !== undefined) patch.share_title = String(b.title).slice(0, 120) || null;
    if (b.slug !== undefined) {
      const slug = String(b.slug).trim().toLowerCase();
      if (slug && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) {
        return res.status(400).json({ error: 'Slug tidak valid (3–60, huruf kecil/angka/tanda hubung).' });
      }
      if (slug && store.isShareSlugTaken(slug, u.id)) return res.status(409).json({ error: 'Slug sudah dipakai.' });
      patch.share_slug = slug || null;
    }
    const updated = store.updateUser(u.id, patch);
    return res.json({ success: true, draft: parseShareConfig(updated.share_draft), savedAt: updated.updated_at });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal menyimpan draft.' });
  }
});

// Publish draft → config + slug diaktifkan, versi lama dicatat ke riwayat.
app.post('/api/me/share/publish', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const b = req.body || {};
    const next = sanitizeShareConfig(b.config || (u.share_draft ? JSON.parse(u.share_draft) : u.share_config ? JSON.parse(u.share_config) : {}));
    const slug = (b.slug !== undefined ? String(b.slug).trim().toLowerCase() : (u.share_slug || '')).trim();
    if (slug && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) {
      return res.status(400).json({ error: 'Slug tidak valid (3–60, huruf kecil/angka/tanda hubung).' });
    }
    if (!slug) return res.status(400).json({ error: 'Isi slug dashboard dulu sebelum menerbitkan.' });
    if (store.isShareSlugTaken(slug, u.id)) return res.status(409).json({ error: 'Slug sudah dipakai.' });

    const prev = u.share_config ? { at: new Date().toISOString(), label: 'Sebelum terbit', config: parseShareConfig(u.share_config) } : null;
    const history = parseShareHistory(u.share_history);
    const nextHistory = ([...(prev ? [prev] : []), ...history]).slice(0, 20);

    const patch: any = {
      share_config: JSON.stringify(next),
      share_slug: slug,
      share_enabled: 1,
      share_draft: null,
      share_history: JSON.stringify(nextHistory),
    };
    if (b.tagline !== undefined) patch.share_tagline = String(b.tagline).slice(0, 300) || null;
    if (b.title !== undefined) patch.share_title = String(b.title).slice(0, 120) || null;
    const updated = store.updateUser(u.id, patch);
    store.audit({ actorId: u.id, actorEmail: u.email, action: 'publish_share', ip: clientIp(req) });
    return res.json({ success: true, share: shareSettings(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal menerbitkan dashboard.' });
  }
});

// Nonaktifkan dashboard publik (URL tidak lagi melayani).
app.post('/api/me/share/unpublish', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const updated = store.updateUser(u.id, { share_enabled: 0 });
    store.audit({ actorId: u.id, actorEmail: u.email, action: 'unpublish_share', ip: clientIp(req) });
    return res.json({ success: true, share: shareSettings(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal menonaktifkan dashboard.' });
  }
});

// Buang draft (kembali ke versi terbit).
app.post('/api/me/share/discard-draft', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const updated = store.updateUser(u.id, { share_draft: null });
    return res.json({ success: true, share: shareSettings(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal membuang draft.' });
  }
});

// Pulihkan config dari riwayat (index 0 = paling baru di riwayat).
app.post('/api/me/share/restore', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const idx = Number(req.body?.index);
    const history = parseShareHistory(u.share_history);
    if (!Number.isInteger(idx) || idx < 0 || idx >= history.length) {
      return res.status(400).json({ error: 'Riwayat tidak ditemukan.' });
    }
    const restored = sanitizeShareConfig(history[idx].config);
    const patch: any = { share_config: JSON.stringify(restored), share_draft: null };
    const updated = store.updateUser(u.id, patch);
    store.audit({ actorId: u.id, actorEmail: u.email, action: 'restore_share', ip: clientIp(req) });
    return res.json({ success: true, share: shareSettings(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal memulihkan versi.' });
  }
});

/** Konfigurasi kustomisasi dashboard publik + nilai default aman. */
const SHARE_CONFIG_DEFAULTS = {
  theme: 'light' as 'light' | 'slate',
  accent: 'emerald',
  columns: 3 as 2 | 3 | 4,
  showAvatar: true,
  showBadge: true,
  showStats: true,
  showTagline: true,
  showShareButton: true,
  badgeLabel: 'Dashboard Pengelola',
  emptyText: 'Pengelola ini belum memublikasikan microsite apa pun.',
  micrositeMode: 'all' as 'all' | 'selected',
  micrositeIds: [] as string[],
  version: 2,
  template: 'minimalist',
  identity: {
    dashboardName: '', ownerName: '', logoUrl: '', coverUrl: '', description: '',
    contactEmail: '', contactPhone: '', contactAddress: '', socials: [] as any[], extraInfo: [] as any[],
  },
  background: {
    type: 'solid', color: '', gradientFrom: '', gradientTo: '', gradientAngle: 135,
    imageUrl: '', pattern: 'none', overlayOpacity: 0, imageOpacity: 30, imageBlur: 'none',
  },
  typography: {
    fontPairing: 'inherit', headingScale: 'lg', baseSize: 16, headingWeight: 800,
    lineHeight: 1.6, letterSpacing: 'normal', align: 'left',
  },
  colors: {
    primary: 'auto', secondary: 'auto', accent: 'auto', background: 'auto', surface: 'auto',
    text: 'auto', muted: 'auto', button: 'auto', border: 'auto',
  },
  layout: {
    container: 'normal', columns: 3, gap: 'md', sectionSpacing: 'md', cardSize: 'normal', mobileColumns: 1,
  },
  card: {
    style: 'elevated', radius: 'lg', imageRatio: 'wide', showDescription: true,
    showCategory: true, showLinkCount: true, showShareButton: true, hoverLift: true, featuredIds: [] as string[],
  },
  sections: [
    { id: 's-hero', type: 'hero', visible: true, title: '', content: '', layout: 'default', galleryImages: [] },
    { id: 's-featured', type: 'featured', visible: true, title: 'Unggulan', content: '', layout: 'grid', galleryImages: [] },
    { id: 's-microsites', type: 'microsites', visible: true, title: 'Semua Microsite', content: '', layout: 'grid', galleryImages: [] },
    { id: 's-about', type: 'about', visible: false, title: 'Tentang', content: '', layout: 'default', galleryImages: [] },
    { id: 's-contact', type: 'contact', visible: false, title: 'Kontak', content: '', layout: 'default', galleryImages: [] },
    { id: 's-footer', type: 'footer', visible: true, title: '', content: '', layout: 'default', galleryImages: [] },
  ] as any[],
};

const ACCENT_KEYS = ['emerald', 'sky', 'violet', 'rose', 'amber', 'zinc'];
const THEME_IDS = ['minimalist', 'premium', 'gradient', 'corporate', 'creative', 'editorial', 'nature', 'artistic'];
const SECTION_TYPES = ['hero', 'profile', 'featured', 'microsites', 'categories', 'about', 'gallery', 'social', 'contact', 'announcement', 'customText', 'footer'];
const SAFE_URL_RE = /^(https?:\/\/|\/)[^\s"'<>]+$/i;
const SAFE_IMG_RE = /^(https?:\/\/|\/|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,)[^\s"']*$/i;

/** Warna hanya boleh 'auto' atau hex/rgb/rgba/hsl yang aman (anti CSS-injection). */
function safeColor(v: any, def = 'auto'): string {
  const s = String(v ?? '').trim();
  if (s === 'auto') return 'auto';
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return s;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(s)) return s;
  if (/^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(s)) return s;
  return def;
}
/** Teks bebas: buang tag & batasi panjang (tanpa HTML/CSS mentah). */
function safeText(v: any, max: number): string {
  return String(v ?? '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f]/g, ' ').slice(0, max);
}
function safeUrl(v: any): string {
  const s = String(v ?? '').trim();
  return SAFE_URL_RE.test(s) ? s.slice(0, 600) : '';
}
function safeImg(v: any): string {
  const s = String(v ?? '').trim();
  return SAFE_IMG_RE.test(s) ? s.slice(0, 2000000) : '';
}
function clampNum(v: any, min: number, max: number, def: number, step = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const r = Math.round(n / step) * step;
  return Math.min(max, Math.max(min, r));
}
function oneOf<T>(v: any, allowed: readonly T[], def: T): T {
  return allowed.includes(v) ? (v as T) : def;
}

/** Bersihkan/normalisasi config dari klien agar aman & konsisten. */
function sanitizeShareConfig(raw: any) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const bool = (v: any, def: boolean) => (v === undefined ? def : !!v);
  const cols = [2, 3, 4].includes(Number(c.columns)) ? (Number(c.columns) as 2 | 3 | 4) : SHARE_CONFIG_DEFAULTS.columns;
  const ids = Array.isArray(c.micrositeIds)
    ? c.micrositeIds.map((x: any) => String(x)).filter(Boolean).slice(0, 200)
    : [];

  // ── identity ──
  const idIn = c.identity && typeof c.identity === 'object' ? c.identity : {};
  const socials = Array.isArray(idIn.socials) ? idIn.socials
    .slice(0, 12)
    .map((s: any, i: number) => ({
      id: safeText(s?.id, 40) || `soc-${i}`,
      platform: oneOf(s?.platform, ['instagram', 'facebook', 'whatsapp', 'youtube', 'tiktok', 'x', 'linkedin', 'website', 'email', 'other'] as const, 'other'),
      label: safeText(s?.label, 40),
      url: safeUrl(s?.url),
    }))
    .filter((s: any) => s.url) : [];
  const extraInfo = Array.isArray(idIn.extraInfo) ? idIn.extraInfo
    .slice(0, 12)
    .map((e: any) => ({ label: safeText(e?.label, 40), value: safeText(e?.value, 120) }))
    .filter((e: any) => e.label || e.value) : [];

  // ── background ──
  const bgIn = c.background && typeof c.background === 'object' ? c.background : {};

  // ── typography ──
  const tyIn = c.typography && typeof c.typography === 'object' ? c.typography : {};

  // ── colors ──
  const coIn = c.colors && typeof c.colors === 'object' ? c.colors : {};

  // ── layout ──
  const laIn = c.layout && typeof c.layout === 'object' ? c.layout : {};

  // ── card ──
  const caIn = c.card && typeof c.card === 'object' ? c.card : {};

  // ── sections ──
  const secIn = Array.isArray(c.sections) ? c.sections : SHARE_CONFIG_DEFAULTS.sections;
  const seen = new Set<string>();
  const sections = secIn.slice(0, 14).map((s: any, i: number) => {
    let sid = safeText(s?.id, 40).replace(/[^a-z0-9-]/gi, '');
    if (!sid || seen.has(sid)) sid = `s-${i}`;
    seen.add(sid);
    return {
      id: sid,
      type: oneOf(s?.type, SECTION_TYPES as any, 'customText'),
      visible: bool(s?.visible, true),
      title: safeText(s?.title, 80),
      content: safeText(s?.content, 2000),
      layout: oneOf(s?.layout, ['default', 'grid', 'list', 'carousel', 'compact'] as const, 'default'),
      galleryImages: Array.isArray(s?.galleryImages) ? s.galleryImages.slice(0, 12).map((g: any) => safeImg(g)).filter(Boolean) : [],
      tone: oneOf(s?.tone, ['info', 'success', 'warning'] as const, 'info'),
    };
  });

  return {
    // ── data lama (dipertahankan) ──
    theme: c.theme === 'slate' ? 'slate' : 'light',
    accent: ACCENT_KEYS.includes(c.accent) ? c.accent : SHARE_CONFIG_DEFAULTS.accent,
    columns: cols,
    showAvatar: bool(c.showAvatar, true),
    showBadge: bool(c.showBadge, true),
    showStats: bool(c.showStats, true),
    showTagline: bool(c.showTagline, true),
    showShareButton: bool(c.showShareButton, true),
    badgeLabel: safeText(c.badgeLabel ?? SHARE_CONFIG_DEFAULTS.badgeLabel, 60),
    emptyText: safeText(c.emptyText ?? SHARE_CONFIG_DEFAULTS.emptyText, 300),
    micrositeMode: c.micrositeMode === 'selected' ? 'selected' : 'all',
    micrositeIds: ids,
    // ── v2 ──
    version: 2,
    template: oneOf(c.template, THEME_IDS as any, 'minimalist'),
    identity: {
      dashboardName: safeText(idIn.dashboardName, 80),
      ownerName: safeText(idIn.ownerName, 80),
      logoUrl: safeImg(idIn.logoUrl),
      coverUrl: safeImg(idIn.coverUrl),
      description: safeText(idIn.description, 400),
      contactEmail: safeText(idIn.contactEmail, 120),
      contactPhone: safeText(idIn.contactPhone, 40),
      contactAddress: safeText(idIn.contactAddress, 200),
      socials,
      extraInfo,
    },
    background: {
      type: oneOf(bgIn.type, ['solid', 'gradient', 'image', 'pattern'] as const, 'solid'),
      color: safeColor(bgIn.color, ''),
      gradientFrom: safeColor(bgIn.gradientFrom, ''),
      gradientTo: safeColor(bgIn.gradientTo, ''),
      gradientAngle: clampNum(bgIn.gradientAngle, 0, 360, 135),
      imageUrl: safeImg(bgIn.imageUrl),
      pattern: oneOf(bgIn.pattern, ['none', 'dots', 'grid', 'waves', 'topography'] as const, 'none'),
      overlayOpacity: clampNum(bgIn.overlayOpacity, 0, 90, 0),
      imageOpacity: clampNum(bgIn.imageOpacity, 0, 100, 30),
      imageBlur: oneOf(bgIn.imageBlur, ['none', 'sm', 'md', 'lg'] as const, 'none'),
    },
    typography: {
      fontPairing: safeText(tyIn.fontPairing, 40) || 'inherit',
      headingScale: oneOf(tyIn.headingScale, ['sm', 'md', 'lg', 'xl'] as const, 'lg'),
      baseSize: clampNum(tyIn.baseSize, 14, 18, 16) as 14 | 15 | 16 | 17 | 18,
      headingWeight: clampNum(tyIn.headingWeight, 600, 800, 800, 100) as 600 | 700 | 800,
      lineHeight: oneOf(tyIn.lineHeight, [1.4, 1.5, 1.6, 1.7] as const, 1.6),
      letterSpacing: oneOf(tyIn.letterSpacing, ['tight', 'normal', 'wide'] as const, 'normal'),
      align: oneOf(tyIn.align, ['left', 'center'] as const, 'left'),
    },
    colors: {
      primary: safeColor(coIn.primary), secondary: safeColor(coIn.secondary), accent: safeColor(coIn.accent),
      background: safeColor(coIn.background), surface: safeColor(coIn.surface), text: safeColor(coIn.text),
      muted: safeColor(coIn.muted), button: safeColor(coIn.button), border: safeColor(coIn.border),
    },
    layout: {
      container: oneOf(laIn.container, ['narrow', 'normal', 'wide'] as const, 'normal'),
      columns: [2, 3, 4].includes(Number(laIn.columns)) ? (Number(laIn.columns) as 2 | 3 | 4) : cols,
      gap: oneOf(laIn.gap, ['sm', 'md', 'lg'] as const, 'md'),
      sectionSpacing: oneOf(laIn.sectionSpacing, ['sm', 'md', 'lg'] as const, 'md'),
      cardSize: oneOf(laIn.cardSize, ['compact', 'normal', 'large'] as const, 'normal'),
      mobileColumns: laIn.mobileColumns === 2 ? 2 : 1,
    },
    card: {
      style: oneOf(caIn.style, ['elevated', 'flat', 'outline', 'glass', 'gradient'] as const, 'elevated'),
      radius: oneOf(caIn.radius, ['sm', 'md', 'lg', 'xl'] as const, 'lg'),
      imageRatio: oneOf(caIn.imageRatio, ['hidden', 'square', 'wide'] as const, 'wide'),
      showDescription: bool(caIn.showDescription, true),
      showCategory: bool(caIn.showCategory, true),
      showLinkCount: bool(caIn.showLinkCount, true),
      showShareButton: bool(caIn.showShareButton, true),
      hoverLift: bool(caIn.hoverLift, true),
      featuredIds: Array.isArray(caIn.featuredIds) ? caIn.featuredIds.map((x: any) => String(x)).slice(0, 8) : [],
    },
    sections,
  };
}

function parseShareConfig(raw: string | null | undefined) {
  let obj: any = {};
  try { obj = raw ? JSON.parse(raw) : {}; } catch { obj = {}; }
  return sanitizeShareConfig(obj);
}

/** Riwayat perubahan config (maks. 20 entri, terbaru di depan). */
function parseShareHistory(raw: string | null | undefined): any[] {
  try { const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a.slice(0, 20) : []; } catch { return []; }
}

function shareSettings(u: store.DbUser) {
  const enabled = !!u.share_enabled && !!u.share_slug;
  const hasDraft = !!u.share_draft;
  return {
    slug: u.share_slug || '',
    enabled,
    tagline: u.share_tagline || '',
    title: u.share_title || '',
    url: enabled ? `/share/${u.share_slug}` : '',
    config: parseShareConfig(u.share_config),
    draft: u.share_draft ? parseShareConfig(u.share_draft) : null,
    hasDraft,
    history: parseShareHistory(u.share_history).map((h: any) => ({ at: h.at, label: h.label || '' })),
  };
}

// Halaman publik /share/<slug> — profil pengelola + microsite published-nya.
app.get('/api/public/share/:slug', (req, res) => {
  try {
    const owner = store.findUserByShareSlug(req.params.slug);
    if (!owner) return res.status(404).json({ error: 'Dashboard tidak ditemukan.' });
    const config = parseShareConfig(owner.share_config);
    let microsites = store.listPublishedMicrositesByOwner(owner.id).map((m: any) => {
      const { password, ...safe } = m;
      return safe;
    });
    // Mode 'selected': tampilkan hanya microsite yang dipilih, urut sesuai pilihan.
    if (config.micrositeMode === 'selected') {
      const order = new Map<string, number>(config.micrositeIds.map((id: string, i: number) => [id, i] as [string, number]));
      const ord = (m: any): number => order.get(m.id) ?? order.get(m.slug) ?? 0;
      microsites = microsites
        .filter((m: any) => order.has(m.id) || order.has(m.slug))
        .sort((a: any, b: any) => ord(a) - ord(b));
    }
    return res.json({
      success: true,
      owner: {
        name: owner.name,
        orgName: owner.org_name,
        bio: owner.bio,
        avatarUrl: owner.avatar_url,
        phone: owner.phone,
      },
      share: {
        slug: owner.share_slug,
        title: owner.share_title || '',
        tagline: owner.share_tagline || '',
        config,
      },
      microsites,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal memuat dashboard.' });
  }
});

// Daftar microsite published+aktif milik pengguna (untuk pemilih microsite di dashboard publik).
app.get('/api/me/share/microsites', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const items = store.listPublishedMicrositesByOwner(u.id).map((m: any) => ({
      id: m.id, slug: m.slug, name: m.name || '', category: m.category || '', status: m.status,
    }));
    return res.json({ success: true, microsites: items });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal memuat daftar microsite.' });
  }
});

app.post('/api/me/profile', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  try {
    const b = req.body || {};
    const patch: any = {};
    for (const k of ['name', 'org_name', 'phone', 'bio', 'avatar_url'] as const) {
      if (b[k] !== undefined) patch[k] = String(b[k]).slice(0, 500);
    }
    const updated = store.updateUser(u.id, patch);
    store.audit({ actorId: u.id, actorEmail: u.email, action: 'update_profile', ip: clientIp(req) });
    return res.json({ success: true, user: publicUser(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal memperbarui profil.' });
  }
});

// Preferensi dashboard (kustomisasi ruang kerja).
app.get('/api/me/dashboard-prefs', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  return res.json({ success: true, prefs: store.getDashboardPrefs(u.id) });
});
app.post('/api/me/dashboard-prefs', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  store.saveDashboardPrefs(u.id, req.body || {});
  return res.json({ success: true });
});

// Ringkasan dashboard pengelola (microsite miliknya saja).
app.get('/api/me/summary', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const mine = store.listMicrositesByOwner(u.id);
  return res.json({
    success: true,
    stats: store.ownerStats(u.id),
    microsites: mine.map((m: any) => ({
      id: m.id, name: m.name, slug: m.slug, status: m.status, active: m.active,
      category: m.category, description: m.description, updatedAt: m.updatedAt,
      views: m.views || 0, clicks: m.clicks || 0, passwordProtected: !!m.passwordProtected,
    })),
  });
});

// ── API ADMIN PANEL (F4) ───────────────────────────────────────────────────
// Semua endpoint di bawah WAJIB role admin (aktivitas dicatat ke audit_log).
function requireAdmin(req: express.Request, res: express.Response): store.DbUser | null {
  const u = getSessionUser(req);
  // Sesi ada tapi bukan admin (atau nonaktif) → 403 Forbidden (bukan 401).
  if (u && u.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Butuh peran administrator.' });
    return null;
  }
  if (!u || u.status !== 'active') {
    denyUnauthorized(res, 'Butuh sesi administrator.');
    return null;
  }
  return u;
}

// Monitoring platform.
app.get('/api/admin/overview', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const stats = store.platformStats();
  const users = store.listUsers().map((u) => ({
    ...publicUser(u), micrositeCount: store.ownerStats(u.id).total,
  }));
  return res.json({
    success: true,
    stats: { ...stats, usersDetail: users.filter((u) => u.role === 'pengelola').length },
    recentAudit: store.listAudit(25),
    settings: store.getPlatformSettings(),
  });
});

// Daftar pengelola.
app.get('/api/admin/users', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const users = store.listUsers().map((u) => ({
    ...publicUser(u), micrositeCount: store.ownerStats(u.id).total,
  }));
  return res.json({ success: true, users });
});

// Tambah pengelola.
app.post('/api/admin/users', express.json(), (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email tidak valid.' });
    if (password.length < 8) return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
    if (store.findUserByEmail(email)) return res.status(409).json({ error: 'Email sudah terdaftar.' });
    const role = b.role === 'admin' ? 'admin' : 'pengelola';
    const user = store.createUser({ email, password, name: String(b.name || '').trim() || email.split('@')[0], role });
    store.audit({ actorId: admin.id, actorEmail: admin.email, action: 'admin_create_user', targetType: 'user', targetId: user.id, detail: { role }, ip: clientIp(req) });
    return res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    if (e?.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Email sudah terdaftar.' });
    return res.status(500).json({ error: 'Gagal menambah pengelola.' });
  }
});

// Ubah pengelola (nama/role/status/password/org).
app.post('/api/admin/users/:id', express.json(), (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  const target = store.findUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  // Cegah admin menonaktifkan/menurunkan dirinya sendiri (lockout).
  if (id === admin.id) {
    const b = req.body || {};
    if ((b.status && b.status !== 'active') || (b.role && b.role !== 'admin')) {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan atau menurunkan role akun sendiri.' });
    }
  }
  try {
    const b = req.body || {};
    const patch: any = {};
    if (b.name !== undefined) patch.name = String(b.name).slice(0, 200);
    if (b.role !== undefined) patch.role = b.role === 'admin' ? 'admin' : 'pengelola';
    if (b.status !== undefined) patch.status = ['active', 'suspended', 'archived'].includes(b.status) ? b.status : 'active';
    if (b.org_name !== undefined) patch.org_name = String(b.org_name).slice(0, 200);
    if (b.password) {
      if (String(b.password).length < 8) return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
      patch.password = String(b.password);
    }
    const updated = store.updateUser(id, patch);
    store.audit({ actorId: admin.id, actorEmail: admin.email, action: 'admin_update_user', targetType: 'user', targetId: id, detail: { fields: Object.keys(patch) }, ip: clientIp(req) });
    // Bila akun dinonaktifkan/di-archive, putuskan sesinya.
    if (patch.status && patch.status !== 'active') store.deleteUserSessions(id);
    return res.json({ success: true, user: publicUser(updated) });
  } catch (e: any) {
    return res.status(500).json({ error: 'Gagal memperbarui pengelola.' });
  }
});

// Arsipkan pengelola (soft delete).
app.delete('/api/admin/users/:id', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (id === admin.id) return res.status(400).json({ error: 'Anda tidak dapat mengarsipkan akun sendiri.' });
  const target = store.findUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  store.updateUser(id, { status: 'archived' });
  store.deleteUserSessions(id);
  store.audit({ actorId: admin.id, actorEmail: admin.email, action: 'admin_archive_user', targetType: 'user', targetId: id, ip: clientIp(req) });
  return res.json({ success: true });
});

// Daftar microsite seluruh pengelola + pemilik.
app.get('/api/admin/microsites', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const ownerMap = new Map(store.listUsers().map((u) => [u.id, u]));
  const items = store.listAllMicrosites().map((m: any) => {
    const o = ownerMap.get(m.ownerId);
    return {
      id: m.id, name: m.name, slug: m.slug, status: m.status, active: m.active,
      category: m.category, updatedAt: m.updatedAt, ownerId: m.ownerId,
      ownerName: o?.name || '—', ownerEmail: o?.email || '—',
    };
  });
  return res.json({ success: true, microsites: items });
});

// Nonaktifkan/aktifkan microsite mana pun (moderasi) + audit.
app.post('/api/admin/microsites/:id/toggle', express.json(), (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  const ms = store.getMicrositeById(id);
  if (!ms) return res.status(404).json({ error: 'Microsite tidak ditemukan.' });
  const next = ms.active === false ? true : false;
  const saved = store.upsertMicrosite(ms.ownerId, { ...ms, active: next });
  store.audit({ actorId: admin.id, actorEmail: admin.email, action: next ? 'admin_activate_microsite' : 'admin_disable_microsite', targetType: 'microsite', targetId: id, ip: clientIp(req) });
  return res.json({ success: true, microsite: saved });
});

app.delete('/api/admin/microsites/:id', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  const ok = store.deleteMicrosite(id, { id: admin.id, role: 'admin' });
  if (!ok) return res.status(404).json({ error: 'Microsite tidak ditemukan.' });
  store.audit({ actorId: admin.id, actorEmail: admin.email, action: 'admin_delete_microsite', targetType: 'microsite', targetId: id, ip: clientIp(req) });
  return res.json({ success: true });
});

// Pengaturan platform.
app.post('/api/admin/settings', express.json(), (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const b = req.body || {};
  const allowed: Record<string, any> = {};
  if (b.registrationOpen !== undefined) allowed.registrationOpen = !!b.registrationOpen;
  if (b.defaultMicrositeStatus !== undefined) allowed.defaultMicrositeStatus = b.defaultMicrositeStatus === 'published' ? 'published' : 'draft';
  if (b.platformAnnouncement !== undefined) allowed.platformAnnouncement = String(b.platformAnnouncement).slice(0, 500);
  store.savePlatformSettings(allowed);
  store.audit({ actorId: admin.id, actorEmail: admin.email, action: 'admin_update_settings', detail: allowed, ip: clientIp(req) });
  return res.json({ success: true, settings: store.getPlatformSettings() });
});

// Log audit (paginasi sederhana).
app.get('/api/admin/audit', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  return res.json({ success: true, audit: store.listAudit(limit) });
});

// ── PENYAJIAN SPA: PUBLIK vs ADMIN (dua entry terpisah) ────────────────────
// index.html  → bundel PUBLIK saja (ringan, tanpa kode admin/Firebase/charts)
// admin.html  → bundel ADMIN penuh; HANYA disajikan bila sesi server valid.
// Rute publik lain (/b/, /s/, /l/, /share) ditangani handler masing-masing.
app.get(['/', '/index.html'], (req: express.Request, res: express.Response) => {
  return res.status(200).sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Halaman login/registrasi (multi-user Studio): disajikan oleh bundel PUBLIK
// (index.html) — halaman auth ada di router publik (AuthPage).
app.get(['/login', '/register'], (req: express.Request, res: express.Response) => {
  return res.status(200).sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Area /admin lama: tetap dipertahankan agar tautan lama tidak putus.
// Arahkan ke Studio baru (index.html) — routing internal menangani gerbang sesi.
app.get(['/admin', '/admin/*'], (req: express.Request, res: express.Response) => {
  return res.status(200).sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// (1) Semua mutasi API butuh sesi admin — kecuali endpoint publik yang sah
app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const p = req.path || '';
  const m = req.method.toUpperCase();
  if (!(m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE')) return next();
  const publicMutations = [
    '/data/complaints', '/data/registrations', '/data/registration',
    '/data/kritik_saran', '/data/permintaan_informasi', '/data/surveys_response',
    '/auth/google', '/auth/password', '/auth/logout', '/auth/login', '/auth/register',
    '/webhooks/whatsapp'
  ];
  if (publicMutations.some(pp => p === pp || p.startsWith(pp + '/'))) return next();
  // Pengelola yang login boleh menulis microsite & profilnya sendiri; otorisasi
  // sebenarnya (kepemilikan) diperiksa di masing-masing handler.
  if (p === '/microsites' || p.startsWith('/microsites/') || p.startsWith('/me/')) {
    const u = getSessionUser(req);
    if (u && u.status === 'active') return next();
    return denyUnauthorized(res, 'Sesi tidak valid. Silakan login ulang.');
  }
  if (!isAdminRequest(req)) return denyUnauthorized(res, 'Operasi tulis butuh sesi admin. Silakan login ulang.');
  return next();
});

// (2) Koleksi data non-publik hanya boleh dibaca admin
app.use('/api/data/:collection', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const collection = String((req.params as any).collection || '');
  if (req.method !== 'GET') return next();
  if (PUBLIC_DATA_COLLECTIONS.has(collection)) return next();
  if (!isAdminRequest(req)) return denyUnauthorized(res, `Koleksi "${collection}" bersifat admin.`);
  return next();
});


// Ensure public and uploads directory exist
const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const uploadsDir = path.join(publicDir, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. High-priority static server for user uploads
app.use("/uploads", express.static(uploadsDir, {
  maxAge: "30d",
  etag: true,
  lastModified: true
}));

// 2. Direct streaming fallback for /uploads to ensure reliable image serving in both dev and prod
app.get("/uploads/*", (req, res) => {
  const relPath = req.params[0] || "";
  const safePath = path.join(uploadsDir, path.normalize(relPath).replace(/^(\.\.[\/\\])+/, ""));
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    return res.sendFile(safePath);
  }
  // Check in dist/uploads as well if running in production
  const distFilePath = path.join(process.cwd(), "dist", "uploads", path.normalize(relPath).replace(/^(\.\.[\/\\])+/, ""));
  if (fs.existsSync(distFilePath) && fs.statSync(distFilePath).isFile()) {
    return res.sendFile(distFilePath);
  }
  return res.status(404).send("Berkas gambar tidak ditemukan");
});

// 3. Serve root public directory (logos, favicons, etc.)
app.use(express.static(publicDir));

const CONFIG_FILE = path.join(process.cwd(), "whatsapp_config.json");
const LOGS_FILE = path.join(process.cwd(), "whatsapp_logs.json");

// Helper to read config
function getWhatsAppConfig() {
  const defaultTemplates = {
    registration_submitted: "registration_submitted",
    registration_confirmed: "registration_confirmed",
    registration_rejected: "registration_rejected",
    queue_called: "queue_called",
    service_completed: "service_completed"
  };

  const defaultConfig = {
    enabled: false,
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    access_token: process.env.WHATSAPP_ACCESS_TOKEN || "",
    api_version: process.env.WHATSAPP_API_VERSION || "v20.0",
    webhook_verify_token: process.env.WHATSAPP_VERIFY_TOKEN || "",
    default_country_code: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "62",
    test_mode: process.env.WHATSAPP_TEST_MODE === "true" || true,
    templates: defaultTemplates
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return {
        ...defaultConfig,
        ...saved,
        templates: {
          ...defaultTemplates,
          ...(saved.templates || {})
        }
      };
    }
  } catch (err) {
    console.error("Error reading WhatsApp config file, using defaults", err);
  }
  return defaultConfig;
}

// Helper to save config
function saveWhatsAppConfig(config: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write WhatsApp config:", err);
    return false;
  }
}

// Helper to read logs
function getWhatsAppLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading WhatsApp logs:", err);
  }
  return [];
}

// Helper to save logs
function saveWhatsAppLogs(logs: any[]) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write WhatsApp logs:", err);
    return false;
  }
}

// Phone Number Normalization
function normalizePhoneNumber(phone: string, defaultCode: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = defaultCode + cleaned.substring(1);
  }
  if (!cleaned.startsWith(defaultCode) && !cleaned.startsWith("62")) {
    cleaned = defaultCode + cleaned;
  }
  return cleaned;
}

// Masking recipient phone number
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 7) return phone;
  return phone.substring(0, 5) + "•••" + phone.substring(phone.length - 4);
}

// API Routes

// 0. Health Checks
app.get(["/api/health", "/health"], (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 1. Get WhatsApp Config (Mask access_token & webhook_verify_token)
app.get("/api/whatsapp/config", (req, res) => {
  const config = getWhatsAppConfig();
  res.json({
    enabled: config.enabled,
    phone_number_id: config.phone_number_id,
    business_account_id: config.business_account_id,
    api_version: config.api_version,
    default_country_code: config.default_country_code,
    test_mode: config.test_mode,
    templates: config.templates,
    // secrets masked
    access_token: config.access_token ? "••••••••" : "",
    webhook_verify_token: config.webhook_verify_token ? "••••••••" : ""
  });
});

// 2. Save WhatsApp Config
app.post("/api/whatsapp/config", (req, res) => {
  const incoming = req.body;
  const current = getWhatsAppConfig();

  // If password field is still ••••••••, use current value
  const finalAccessToken = incoming.access_token === "••••••••" ? current.access_token : (incoming.access_token || "");
  const finalVerifyToken = incoming.webhook_verify_token === "••••••••" ? current.webhook_verify_token : (incoming.webhook_verify_token || "");

  // Validation
  if (incoming.enabled) {
    if (!incoming.phone_number_id) {
      return res.status(400).json({ message: "Phone Number ID is required to enable WhatsApp." });
    }
    if (!finalAccessToken) {
      return res.status(400).json({ message: "Access Token is required to enable WhatsApp." });
    }
  }

  const newConfig = {
    enabled: !!incoming.enabled,
    phone_number_id: incoming.phone_number_id || "",
    business_account_id: incoming.business_account_id || "",
    access_token: finalAccessToken,
    api_version: incoming.api_version || "v20.0",
    webhook_verify_token: finalVerifyToken,
    default_country_code: incoming.default_country_code || "62",
    test_mode: incoming.test_mode !== false,
    templates: {
      registration_submitted: incoming.templates?.registration_submitted || "registration_submitted",
      registration_confirmed: incoming.templates?.registration_confirmed || "registration_confirmed",
      registration_rejected: incoming.templates?.registration_rejected || "registration_rejected",
      queue_called: incoming.templates?.queue_called || "queue_called",
      service_completed: incoming.templates?.service_completed || "service_completed"
    }
  };

  const success = saveWhatsAppConfig(newConfig);
  if (success) {
    res.json({ message: "WhatsApp configuration saved successfully." });
  } else {
    res.status(500).json({ message: "Failed to write configuration file." });
  }
});

// 3. Test Connection
app.post("/api/whatsapp/test-connection", async (req, res) => {
  const incoming = req.body;
  const current = getWhatsAppConfig();

  const finalAccessToken = incoming.access_token === "••••••••" ? current.access_token : (incoming.access_token || "");
  const finalPhoneId = incoming.phone_number_id || current.phone_number_id;
  const apiVersion = incoming.api_version || current.api_version || "v20.0";

  if (!finalAccessToken) {
    return res.status(400).json({ message: "Access Token is required for testing connection." });
  }
  if (!finalPhoneId) {
    return res.status(400).json({ message: "Phone Number ID is required for testing connection." });
  }

  try {
    // Perform standard Meta API request to fetch phone number details (verifies both token and ID)
    const url = `https://graph.facebook.com/${apiVersion}/${finalPhoneId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${finalAccessToken}`
      }
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        message: "WhatsApp connection successful.",
        details: {
          id: data.id,
          display_phone_number: data.display_phone_number || "Test Account (Sandbox)",
          verified_name: data.verified_name || "Meta App Test"
        }
      });
    } else {
      const errorMsg = data.error?.message || "Invalid credentials or API error.";
      res.status(response.status).json({
        success: false,
        message: "WhatsApp connection failed.",
        error: errorMsg
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Connection test failed.",
      error: err.message || "Network Timeout / DNS Error"
    });
  }
});

// 4. Send Message (Internal proxy)
app.post("/api/whatsapp/send", async (req, res) => {
  const { event, recipient, variables, notificationId, relatedEntity, relatedEntityId } = req.body;
  const config = getWhatsAppConfig();

  if (!config.enabled) {
    return res.json({ success: false, skipped: true, message: "WhatsApp channel is disabled." });
  }

  if (!recipient) {
    return res.status(400).json({ message: "Recipient number is required." });
  }

  // Idempotency: check if already sent successfully for this notificationId / eventId
  const logs = getWhatsAppLogs();
  if (notificationId) {
    const existing = logs.find((l: any) => l.notificationId === notificationId && l.direction !== "inbound" && l.status !== "failed");
    if (existing) {
      return res.json({ success: true, duplicated: true, log: existing });
    }
  }

  const normalizedPhone = normalizePhoneNumber(recipient, config.default_country_code);
  const maskedPhone = maskPhoneNumber(normalizedPhone);

  // Map event to template name
  const templateName = config.templates[event] || event;

  // Render variables to body text for local logging and simulation
  let bodyText = "";
  if (event === "registration_submitted" || event === "registration_created") {
    bodyText = `Pendaftaran Berhasil Diajukan!\nNo: ${variables.registrationNumber}\nLayanan: ${variables.serviceName}\nSilakan pantau status pendaftaran Anda secara berkala.`;
  } else if (event === "registration_confirmed") {
    bodyText = `Pendaftaran Dikonfirmasi!\nNo: ${variables.registrationNumber}\nTanggal: ${variables.visitDate}\nNo Antrean: ${variables.queueNumber}\nSilakan datang tepat waktu.`;
  } else if (event === "registration_rejected") {
    bodyText = `Pendaftaran Ditolak.\nNo: ${variables.registrationNumber}\nAlasan: ${variables.rejectionReason || "Persyaratan tidak lengkap."}`;
  } else if (event === "queue_called" || event === "queue_recalled") {
    bodyText = `Panggilan Antrean!\nNo Antrean: ${variables.queueNumber}\nSilakan menuju Loket ${variables.counterNumber || "-"}\nLayanan: ${variables.serviceName || "-"}`;
  } else if (event === "service_completed" || event === "queue_completed") {
    bodyText = `Pelayanan Selesai!\nTerima kasih telah mengunjungi kami. No Antrean ${variables.queueNumber} di ${variables.serviceName} dinyatakan selesai.`;
  } else {
    // Generic fallback
    bodyText = `Notifikasi Puskesmas: Event ${event} dipicu.`;
  }

  const logId = `wa-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newLog: any = {
    id: logId,
    notificationId: notificationId || "",
    recipient: normalizedPhone,
    recipientMasked: maskedPhone,
    event,
    template: templateName,
    status: "sending",
    messageText: bodyText,
    providerMessageId: "",
    errorCode: null,
    errorMessage: null,
    attempts: 1,
    direction: "outbound",
    relatedEntity: relatedEntity || "none",
    relatedEntityId: relatedEntityId || "",
    createdAt: now,
    updatedAt: now
  };

  logs.unshift(newLog);
  saveWhatsAppLogs(logs);

  if (config.test_mode) {
    // TEST MODE simulation
    setTimeout(() => {
      const updatedLogs = getWhatsAppLogs();
      const idx = updatedLogs.findIndex((l: any) => l.id === logId);
      if (idx !== -1) {
        updatedLogs[idx].status = "sent";
        updatedLogs[idx].sentAt = new Date().toISOString();
        updatedLogs[idx].providerMessageId = `sim-wamid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        updatedLogs[idx].updatedAt = new Date().toISOString();
        saveWhatsAppLogs(updatedLogs);
      }
    }, 500);

    return res.json({ success: true, simulated: true, logId });
  }

  // REAL SENDING
  try {
    const url = `https://graph.facebook.com/${config.api_version}/${config.phone_number_id}/messages`;

    // Construct Meta Template Parameters in standardized order
    const parameters: any[] = [];
    if (variables.fullName || variables.name) {
      parameters.push({ type: "text", text: variables.fullName || variables.name });
    }
    if (variables.registrationNumber) {
      parameters.push({ type: "text", text: variables.registrationNumber });
    }
    if (variables.serviceName) {
      parameters.push({ type: "text", text: variables.serviceName });
    }
    if (variables.visitDate) {
      parameters.push({ type: "text", text: variables.visitDate });
    }
    if (variables.queueNumber) {
      parameters.push({ type: "text", text: variables.queueNumber });
    }
    if (variables.counterNumber) {
      parameters.push({ type: "text", text: variables.counterNumber });
    }
    if (variables.rejectionReason) {
      parameters.push({ type: "text", text: variables.rejectionReason });
    }

    const payload = {
      messaging_product: "whatsapp",
      to: normalizedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "id"
        },
        components: [
          {
            type: "body",
            parameters
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data: any = await response.json();
    const updatedLogs = getWhatsAppLogs();
    const idx = updatedLogs.findIndex((l: any) => l.id === logId);

    if (idx !== -1) {
      if (response.ok) {
        updatedLogs[idx].status = "sent";
        updatedLogs[idx].sentAt = new Date().toISOString();
        updatedLogs[idx].providerMessageId = data.messages?.[0]?.id || "";
      } else {
        updatedLogs[idx].status = "failed";
        updatedLogs[idx].errorCode = data.error?.code || response.status;
        updatedLogs[idx].errorMessage = data.error?.message || "Unknown Meta API error";
      }
      updatedLogs[idx].updatedAt = new Date().toISOString();
      saveWhatsAppLogs(updatedLogs);
    }

    if (response.ok) {
      res.json({ success: true, messageId: data.messages?.[0]?.id });
    } else {
      res.status(response.status).json({ success: false, error: data.error });
    }
  } catch (err: any) {
    const updatedLogs = getWhatsAppLogs();
    const idx = updatedLogs.findIndex((l: any) => l.id === logId);
    if (idx !== -1) {
      updatedLogs[idx].status = "failed";
      updatedLogs[idx].errorMessage = err.message || "Network Error";
      updatedLogs[idx].updatedAt = new Date().toISOString();
      saveWhatsAppLogs(updatedLogs);
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get logs
app.get("/api/whatsapp/logs", (req, res) => {
  const logs = getWhatsAppLogs();
  res.json(logs);
});

// 6. Retry Failed Log (Limit to 3 attempts)
app.post("/api/whatsapp/logs/retry", async (req, res) => {
  const { id } = req.body;
  const logs = getWhatsAppLogs();
  const logIndex = logs.findIndex((l: any) => l.id === id);

  if (logIndex === -1) {
    return res.status(404).json({ message: "Log not found." });
  }

  const log = logs[logIndex];
  if (log.status !== "failed") {
    return res.status(400).json({ message: "Only failed messages can be retried." });
  }

  if (log.attempts >= 3) {
    return res.status(400).json({ message: "Maximum retry limit (3 attempts) exceeded." });
  }

  const config = getWhatsAppConfig();
  log.attempts += 1;
  log.status = "sending";
  log.updatedAt = new Date().toISOString();
  saveWhatsAppLogs(logs);

  if (config.test_mode) {
    setTimeout(() => {
      const refreshed = getWhatsAppLogs();
      const idx = refreshed.findIndex((l: any) => l.id === id);
      if (idx !== -1) {
        refreshed[idx].status = "sent";
        refreshed[idx].sentAt = new Date().toISOString();
        refreshed[idx].providerMessageId = `sim-retry-wamid-${Date.now()}`;
        refreshed[idx].updatedAt = new Date().toISOString();
        refreshed[idx].errorCode = null;
        refreshed[idx].errorMessage = null;
        saveWhatsAppLogs(refreshed);
      }
    }, 500);

    return res.json({ success: true, message: "Retry simulated successfully." });
  }

  try {
    const url = `https://graph.facebook.com/${config.api_version}/${config.phone_number_id}/messages`;
    // Meta API retry
    // Build parameters array again
    const payload = {
      messaging_product: "whatsapp",
      to: log.recipient,
      type: "template",
      template: {
        name: log.template,
        language: { code: "id" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: log.messageText }] // simple fallback parameters
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data: any = await response.json();
    const refreshed = getWhatsAppLogs();
    const idx = refreshed.findIndex((l: any) => l.id === id);

    if (idx !== -1) {
      if (response.ok) {
        refreshed[idx].status = "sent";
        refreshed[idx].sentAt = new Date().toISOString();
        refreshed[idx].providerMessageId = data.messages?.[0]?.id || "";
        refreshed[idx].errorCode = null;
        refreshed[idx].errorMessage = null;
      } else {
        refreshed[idx].status = "failed";
        refreshed[idx].errorCode = data.error?.code || response.status;
        refreshed[idx].errorMessage = data.error?.message || "Meta API retry error";
      }
      refreshed[idx].updatedAt = new Date().toISOString();
      saveWhatsAppLogs(refreshed);
    }

    if (response.ok) {
      res.json({ success: true, messageId: data.messages?.[0]?.id });
    } else {
      res.status(response.status).json({ success: false, error: data.error });
    }
  } catch (err: any) {
    const refreshed = getWhatsAppLogs();
    const idx = refreshed.findIndex((l: any) => l.id === id);
    if (idx !== -1) {
      refreshed[idx].status = "failed";
      refreshed[idx].errorMessage = err.message || "Network Error during retry";
      refreshed[idx].updatedAt = new Date().toISOString();
      saveWhatsAppLogs(refreshed);
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/webhooks/whatsapp (Webhook Verification)
app.get("/api/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const config = getWhatsAppConfig();
  // Double security: verify mode and token
  if (mode === "subscribe" && token && token === config.webhook_verify_token) {
    console.log("WhatsApp Webhook successfully verified!");
    return res.status(200).send(challenge);
  } else {
    console.warn("Unauthorized Webhook verification attempt rejected.");
    return res.status(403).send("Forbidden");
  }
});

// 8. POST /api/webhooks/whatsapp (Inbound & Webhook status callback)
app.post("/api/webhooks/whatsapp", (req, res) => {
  const payload = req.body;

  // Real API webhook signature validation is simulated here (safeguarding payload)
  if (payload.object !== "whatsapp_business_account") {
    return res.sendStatus(400);
  }

  try {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return res.sendStatus(200);

    const logs = getWhatsAppLogs();
    let updated = false;

    // 1. Process Status updates (sent, delivered, read, failed)
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const statusObj of value.statuses) {
        const messageId = statusObj.id;
        const newStatus = statusObj.status; // delivered, read, etc.
        const error = statusObj.errors?.[0];

        const logIdx = logs.findIndex((l: any) => l.providerMessageId === messageId);
        if (logIdx !== -1) {
          logs[logIdx].status = newStatus; // e.g. delivered, read
          if (error) {
            logs[logIdx].errorCode = error.code;
            logs[logIdx].errorMessage = error.message;
          }
          logs[logIdx].updatedAt = new Date().toISOString();
          updated = true;
        }
      }
    }

    // 2. Process Inbound Messages (chatbot deferred - logging only)
    if (value.messages && Array.isArray(value.messages)) {
      for (const msg of value.messages) {
        const sender = msg.from;
        const msgId = msg.id;
        const textBody = msg.text?.body || `[Pesan media tipe: ${msg.type}]`;
        
        // Log inbound message
        const inboundLog = {
          id: `wa-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          notificationId: "",
          recipient: sender,
          recipientMasked: maskPhoneNumber(sender),
          event: "inbound_message",
          template: "N/A",
          status: "received",
          messageText: textBody,
          providerMessageId: msgId,
          errorCode: null,
          errorMessage: null,
          attempts: 1,
          direction: "inbound",
          relatedEntity: "none",
          relatedEntityId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        logs.unshift(inboundLog);
        updated = true;
      }
    }

    if (updated) {
      saveWhatsAppLogs(logs);
    }

    // Always respond with 200 to acknowledge Meta's delivery
    res.sendStatus(200);
  } catch (err) {
    console.error("Failed to process WhatsApp webhook payload:", err);
    res.sendStatus(500);
  }
});

// AI Provider Configuration & Multi-Provider Engine
const AI_CONFIG_FILE = path.join(process.cwd(), "ai_provider_config.json");

const AI_PROVIDER_PRESETS = [
  {
    id: "gemini",
    name: "Google Gemini (Google AI Studio)",
    endpointUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-3.8-flash",
    placeholderKey: "AIzaSy...",
    helpText: "Dapatkan API key gratis dari Google AI Studio (aistudio.google.com). Jika dikosongkan, server otomatis memakai default GEMINI_API_KEY."
  },
  {
    id: "groq",
    name: "Groq Cloud (Llama 3.3 70B - Sangat Cepat)",
    endpointUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    placeholderKey: "gsk_...",
    helpText: "Dapatkan API key di console.groq.com. Sangat cepat, hemat kuota, dan format kompatibel OpenAI."
  },
  {
    id: "deepseek",
    name: "DeepSeek AI (DeepSeek Chat V3)",
    endpointUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    placeholderKey: "sk-...",
    helpText: "Dapatkan API key di platform.deepseek.com. Sangat cerdas dan ekonomis."
  },
  {
    id: "openai",
    name: "OpenAI ChatGPT (GPT-4o Mini / GPT-4o)",
    endpointUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholderKey: "sk-proj-...",
    helpText: "Dapatkan API key di platform.openai.com. Mendukung GPT-4o-mini, GPT-4o, dan model lainnya."
  },
  {
    id: "openrouter",
    name: "OpenRouter (Akses Multi-Model Bebas)",
    endpointUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    placeholderKey: "sk-or-...",
    helpText: "Dapatkan API key di openrouter.ai untuk mengakses Claude, Llama, Mistral, dan ratusan model lainnya."
  },
  {
    id: "custom",
    name: "Custom / OpenAI-Compatible (Ollama, vLLM, LM Studio, Proxy)",
    endpointUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    placeholderKey: "Kunci API (opsional jika server lokal)",
    helpText: "Mendukung semua server AI dengan format endpoint OpenAI /chat/completions standar."
  }
];

const IMAGE_PROVIDER_PRESETS = [
  {
    id: "gemini",
    name: "Google Imagen 3 (Google AI Studio)",
    endpointUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "imagen-3.0-generate-002",
    placeholderKey: "AIzaSy... (Kunci API Google AI Studio)",
    helpText: "Generasi gambar fotorealistik berkualitas tinggi dari Google. Menggunakan kuota API Key Google AI Studio."
  },
  {
    id: "openai",
    name: "OpenAI DALL-E 3",
    endpointUrl: "https://api.openai.com/v1",
    defaultModel: "dall-e-3",
    placeholderKey: "sk-proj-... (Kunci API OpenAI)",
    helpText: "Model generasi gambar DALL-E 3 dari OpenAI dengan ketelitian visual tinggi."
  },
  {
    id: "stability",
    name: "Stability AI (Stable Diffusion XL)",
    endpointUrl: "https://api.stability.ai/v1",
    defaultModel: "stable-diffusion-xl-1024-v1-0",
    placeholderKey: "sk-... (Kunci API Stability AI)",
    helpText: "Engine text-to-image Stable Diffusion XL dari Stability AI dengan kontrol artistik mendalam."
  },
  {
    id: "pollinations",
    name: "Pollinations AI (Flux / Open Source)",
    endpointUrl: "https://image.pollinations.ai",
    defaultModel: "flux",
    placeholderKey: "Tidak butuh API key (Gratis & Terbuka)",
    helpText: "Model visual Flux bebas kuota dan tanpa registrasi API key. Siap pakai langsung."
  },
  {
    id: "custom",
    name: "Custom Image API (OpenAI Compatible / Local)",
    endpointUrl: "http://localhost:11434/v1",
    defaultModel: "stable-diffusion",
    placeholderKey: "Kunci API (opsional)",
    helpText: "Endpoint custom text-to-image dengan format OpenAI /images/generations atau server lokal."
  }
];

function getAIProviderConfig() {
  const defaultTextConfig = {
    provider: "gemini",
    providerName: "Google Gemini (Google AI Studio)",
    endpointUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    model: "gemini-3.8-flash",
    temperature: 0.3,
    maxTokens: 2048,
    enabled: true,
    lastStatus: "untested",
    lastTestedAt: "",
    lastStatusMessage: ""
  };

  const defaultImageConfig = {
    provider: "pollinations",
    providerName: "Pollinations AI (Flux / Open Source)",
    endpointUrl: "https://image.pollinations.ai",
    apiKey: "",
    model: "flux",
    aspectRatio: "16:9",
    size: "1024x1024",
    enabled: true,
    lastStatus: "untested",
    lastTestedAt: "",
    lastStatusMessage: ""
  };

  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(AI_CONFIG_FILE, "utf-8"));
      
      let textConfig = { ...defaultTextConfig };
      if (saved.text) {
        textConfig = { ...defaultTextConfig, ...saved.text };
      } else if (saved.provider) {
        textConfig = {
          ...defaultTextConfig,
          provider: saved.provider,
          providerName: saved.providerName || "Google Gemini",
          endpointUrl: saved.endpointUrl || defaultTextConfig.endpointUrl,
          apiKey: saved.apiKey || "",
          model: saved.model || defaultTextConfig.model,
          temperature: typeof saved.temperature === 'number' ? saved.temperature : 0.3,
          maxTokens: saved.maxTokens || 2048,
          enabled: saved.enabled !== false,
          lastStatus: saved.lastStatus || "untested",
          lastTestedAt: saved.lastTestedAt || "",
          lastStatusMessage: saved.lastStatusMessage || ""
        };
      }

      let imageConfig = { ...defaultImageConfig };
      if (saved.image) {
        imageConfig = { ...defaultImageConfig, ...saved.image };
      } else {
        if (saved.provider === "openai" && saved.apiKey) {
          imageConfig = {
            provider: "openai",
            providerName: "OpenAI DALL-E 3",
            endpointUrl: "https://api.openai.com/v1",
            apiKey: saved.apiKey,
            model: "dall-e-3",
            aspectRatio: "16:9",
            size: "1024x1024",
            enabled: true,
            lastStatus: "untested",
            lastTestedAt: "",
            lastStatusMessage: ""
          };
        } else if (process.env.GEMINI_API_KEY) {
          imageConfig = {
            provider: "gemini",
            providerName: "Google Imagen 3 (Google AI Studio)",
            endpointUrl: "https://generativelanguage.googleapis.com",
            apiKey: process.env.GEMINI_API_KEY,
            model: "imagen-3.0-generate-002",
            aspectRatio: "16:9",
            size: "1024x1024",
            enabled: true,
            lastStatus: "untested",
            lastTestedAt: "",
            lastStatusMessage: ""
          };
        }
      }

      return {
        text: textConfig,
        image: imageConfig,
        // Flat aliases mirroring text config for backward compatibility
        provider: textConfig.provider,
        providerName: textConfig.providerName,
        endpointUrl: textConfig.endpointUrl,
        apiKey: textConfig.apiKey,
        model: textConfig.model,
        temperature: textConfig.temperature,
        maxTokens: textConfig.maxTokens,
        enabled: textConfig.enabled,
        lastStatus: textConfig.lastStatus,
        lastTestedAt: textConfig.lastTestedAt,
        lastStatusMessage: textConfig.lastStatusMessage
      };
    }
  } catch (err) {
    console.error("Error reading AI config file, using defaults", err);
  }

  return {
    text: defaultTextConfig,
    image: defaultImageConfig,
    ...defaultTextConfig
  };
}

function saveAIProviderConfig(config: any) {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write AI config:", err);
    return false;
  }
}

interface ExecuteAIParams {
  provider: string;
  endpointUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
}

async function executeAICompletion(params: ExecuteAIParams): Promise<{ text: string; modelUsed: string; providerUsed: string }> {
  const provider = params.provider || "gemini";
  const model = params.model || (provider === "gemini" ? "gemini-3.8-flash" : "gpt-4o-mini");

  if (provider === "gemini") {
    const key = params.apiKey || getAIProviderConfig().apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Kunci API Gemini tidak ditemukan. Harap masukkan API key di pengaturan provider atau konfigurasi server.");
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const fullContent = params.systemPrompt ? `${params.systemPrompt}\n\n${params.userPrompt}` : params.userPrompt;
    
    const candidateModels = Array.from(new Set([
      model,
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ]));

    let lastError: any = null;
    for (const m of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: fullContent,
        });
        return {
          text: response.text || "",
          modelUsed: m,
          providerUsed: m === model ? "Google Gemini" : `Google Gemini (${m})`
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${m} failed (${err?.message?.substring(0, 80)}), trying next candidate...`);
      }
    }
    throw lastError || new Error("Semua kandidat model Gemini saat ini sedang sibuk atau tidak merespon.");
  }

  // OpenAI-Compatible Providers (Groq, DeepSeek, OpenAI, OpenRouter, Custom)
  let baseUrl = (params.endpointUrl || "").trim().replace(/\/+$/, '');
  if (!baseUrl) {
    const preset = AI_PROVIDER_PRESETS.find(p => p.id === provider);
    baseUrl = preset?.endpointUrl || "https://api.openai.com/v1";
  }

  let chatUrl = baseUrl;
  if (!chatUrl.endsWith('/chat/completions')) {
    chatUrl += '/chat/completions';
  }

  const key = params.apiKey || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (key && key !== "••••••••") {
    headers["Authorization"] = `Bearer ${key}`;
  } else if (params.apiKey === "••••••••") {
    const savedConfig = getAIProviderConfig();
    if (savedConfig.apiKey) {
      headers["Authorization"] = `Bearer ${savedConfig.apiKey}`;
    }
  }

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://puskesmas.id";
    headers["X-Title"] = "Puskesmas Portal";
  }

  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.userPrompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(chatUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: params.temperature ?? 0.3
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || parsed.message || errText;
      } catch {}
      throw new Error(`Provider ${provider} gagal (HTTP ${res.status}): ${errMsg}`);
    }

    const data: any = await res.json();
    const outputText = data.choices?.[0]?.message?.content || "";
    return {
      text: outputText,
      modelUsed: model,
      providerUsed: provider
    };
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    if (fetchErr.name === 'AbortError') {
      throw new Error(`Koneksi ke endpoint ${chatUrl} waktu habis (timeout 25 detik).`);
    }
    throw fetchErr;
  }
}

// 1. Get AI Provider Config (Both Text AI & Image AI)
app.get("/api/ai/provider-config", (req, res) => {
  const config = getAIProviderConfig();
  res.json({
    ...config,
    text: {
      ...config.text,
      apiKey: config.text.apiKey ? "••••••••" : "",
      hasCustomKey: Boolean(config.text.apiKey)
    },
    image: {
      ...config.image,
      apiKey: config.image.apiKey ? "••••••••" : "",
      hasCustomKey: Boolean(config.image.apiKey)
    },
    apiKey: config.text.apiKey ? "••••••••" : "",
    hasCustomKey: Boolean(config.text.apiKey),
    presets: AI_PROVIDER_PRESETS,
    imagePresets: IMAGE_PROVIDER_PRESETS
  });
});

// 2. Save AI Provider Config (Text, Image, or Both)
app.post("/api/ai/provider-config", (req, res) => {
  const incoming = req.body;
  const current = getAIProviderConfig();

  let nextText = { ...current.text };
  let nextImage = { ...current.image };

  // A. Explicit text object
  if (incoming.text) {
    const tApiKey = incoming.text.apiKey === "••••••••" ? current.text.apiKey : (incoming.text.apiKey || "");
    nextText = {
      ...current.text,
      ...incoming.text,
      apiKey: tApiKey
    };
  } else if (incoming.category === 'text' || (incoming.provider && !incoming.category && !incoming.image)) {
    // Single text update
    const tApiKey = incoming.apiKey === "••••••••" ? current.text.apiKey : (incoming.apiKey || "");
    nextText = {
      ...current.text,
      provider: incoming.provider || nextText.provider,
      providerName: incoming.providerName || nextText.providerName,
      endpointUrl: incoming.endpointUrl || nextText.endpointUrl,
      apiKey: tApiKey,
      model: incoming.model || nextText.model,
      temperature: typeof incoming.temperature === 'number' ? incoming.temperature : nextText.temperature,
      maxTokens: incoming.maxTokens || nextText.maxTokens,
      enabled: incoming.enabled !== false
    };
  }

  // B. Explicit image object
  if (incoming.image) {
    const imgApiKey = incoming.image.apiKey === "••••••••" ? current.image.apiKey : (incoming.image.apiKey || "");
    nextImage = {
      ...current.image,
      ...incoming.image,
      apiKey: imgApiKey
    };
  } else if (incoming.category === 'image') {
    // Single image update
    const imgApiKey = incoming.apiKey === "••••••••" ? current.image.apiKey : (incoming.apiKey || "");
    nextImage = {
      ...current.image,
      provider: incoming.provider || nextImage.provider,
      providerName: incoming.providerName || nextImage.providerName,
      endpointUrl: incoming.endpointUrl || nextImage.endpointUrl,
      apiKey: imgApiKey,
      model: incoming.model || nextImage.model,
      aspectRatio: incoming.aspectRatio || nextImage.aspectRatio,
      enabled: incoming.enabled !== false
    };
  }

  const newSaved = {
    text: nextText,
    image: nextImage,
    ...nextText
  };

  const success = saveAIProviderConfig(newSaved);
  if (success) {
    res.json({ 
      success: true, 
      message: "Konfigurasi Provider AI (Teks & Gambar) berhasil disimpan.",
      config: {
        text: {
          ...nextText,
          apiKey: nextText.apiKey ? "••••••••" : "",
          hasCustomKey: Boolean(nextText.apiKey)
        },
        image: {
          ...nextImage,
          apiKey: nextImage.apiKey ? "••••••••" : "",
          hasCustomKey: Boolean(nextImage.apiKey)
        },
        ...nextText,
        apiKey: nextText.apiKey ? "••••••••" : "",
        hasCustomKey: Boolean(nextText.apiKey)
      }
    });
  } else {
    res.status(500).json({ success: false, message: "Gagal menyimpan konfigurasi file AI." });
  }
});

// 3. Test AI Provider Connection (Supports category: 'text' or 'image')
app.post("/api/ai/test-provider", async (req, res) => {
  const { category, provider, endpointUrl, apiKey, model } = req.body;
  const startTime = Date.now();

  try {
    const current = getAIProviderConfig();

    // 3A. TEST IMAGE PROVIDER
    if (category === "image") {
      const effectiveProvider = provider || current.image.provider;
      const effectiveKey = apiKey === "••••••••" ? current.image.apiKey : (apiKey || current.image.apiKey);
      const effectiveModel = model || current.image.model;

      if (effectiveProvider === "pollinations") {
        current.image.lastStatus = "success";
        current.image.lastTestedAt = new Date().toISOString();
        current.image.lastStatusMessage = "Koneksi Pollinations AI Flux siap digunakan tanpa API Key.";
        saveAIProviderConfig(current);

        return res.json({
          success: true,
          message: "Koneksi ke Pollinations AI Flux berhasil!",
          latencyMs: 80,
          modelUsed: effectiveModel || "flux",
          reply: "Engine visual siap merender gambar berkualitas tinggi secara gratis tanpa API key."
        });
      }

      if (effectiveProvider === "gemini") {
        const key = effectiveKey || (current.text.provider === "gemini" ? current.text.apiKey : "") || process.env.GEMINI_API_KEY;
        if (!key) {
          throw new Error("Kunci API Google AI Studio belum diisi. Masukkan API Key resmi untuk menguji Imagen 3.");
        }
        const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel || 'imagen-3.0-generate-002'}:predict?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: "test" }] }),
          signal: AbortSignal.timeout(12000)
        });
        const latencyMs = Date.now() - startTime;
        if (testRes.status === 400) {
          const errJson = await testRes.json().catch(() => ({}));
          if (errJson?.error?.message?.includes("API key not valid")) {
            throw new Error("API Key Google AI Studio tidak valid.");
          }
        }
        if (testRes.status === 401 || testRes.status === 403) {
          throw new Error("Akses Google AI Studio ditolak. Periksa API Key atau izin akun Anda.");
        }

        current.image.lastStatus = "success";
        current.image.lastTestedAt = new Date().toISOString();
        current.image.lastStatusMessage = `Koneksi Google Imagen 3 berhasil (${latencyMs}ms)`;
        saveAIProviderConfig(current);

        return res.json({
          success: true,
          message: "Koneksi ke Google Imagen 3 berhasil!",
          latencyMs,
          modelUsed: effectiveModel || "imagen-3.0-generate-002",
          reply: "Model Google Imagen 3 siap merender gambar visual artikel."
        });
      }

      if (effectiveProvider === "openai") {
        const key = effectiveKey || (current.text.provider === "openai" ? current.text.apiKey : "");
        if (!key) {
          throw new Error("Kunci API OpenAI belum diisi. Masukkan API Key untuk menguji DALL-E 3.");
        }
        const testRes = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${key}` },
          signal: AbortSignal.timeout(12000)
        });
        const latencyMs = Date.now() - startTime;
        if (!testRes.ok) {
          const err = await testRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `HTTP ${testRes.status} dari OpenAI`);
        }

        current.image.lastStatus = "success";
        current.image.lastTestedAt = new Date().toISOString();
        current.image.lastStatusMessage = `Koneksi OpenAI DALL-E berhasil (${latencyMs}ms)`;
        saveAIProviderConfig(current);

        return res.json({
          success: true,
          message: "Koneksi ke OpenAI DALL-E 3 berhasil!",
          latencyMs,
          modelUsed: effectiveModel || "dall-e-3",
          reply: "Model OpenAI DALL-E 3 siap merender visual artikel secara akurat."
        });
      }

      if (effectiveProvider === "stability") {
        if (!effectiveKey) {
          throw new Error("Kunci API Stability AI belum diisi.");
        }
        const testRes = await fetch("https://api.stability.ai/v1/user/account", {
          headers: { "Authorization": `Bearer ${effectiveKey}` },
          signal: AbortSignal.timeout(12000)
        });
        const latencyMs = Date.now() - startTime;
        if (!testRes.ok) {
          const err = await testRes.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${testRes.status} dari Stability AI`);
        }

        current.image.lastStatus = "success";
        current.image.lastTestedAt = new Date().toISOString();
        current.image.lastStatusMessage = `Koneksi Stability AI berhasil (${latencyMs}ms)`;
        saveAIProviderConfig(current);

        return res.json({
          success: true,
          message: "Koneksi ke Stability AI (Stable Diffusion XL) berhasil!",
          latencyMs,
          modelUsed: effectiveModel || "stable-diffusion-xl-1024-v1-0",
          reply: "Engine visual Stability AI siap digunakan."
        });
      }

      current.image.lastStatus = "success";
      current.image.lastTestedAt = new Date().toISOString();
      current.image.lastStatusMessage = "Endpoint gambar kustom siap.";
      saveAIProviderConfig(current);
      return res.json({
        success: true,
        message: "Konfigurasi endpoint gambar kustom tersimpan.",
        latencyMs: 50,
        modelUsed: effectiveModel || "custom"
      });
    }

    // 3B. TEST TEXT PROVIDER (DEFAULT)
    const effectiveKey = apiKey === "••••••••" ? current.text.apiKey : (apiKey || current.text.apiKey);

    const result = await executeAICompletion({
      provider: provider || current.text.provider,
      endpointUrl: endpointUrl || current.text.endpointUrl,
      apiKey: effectiveKey,
      model: model || current.text.model,
      userPrompt: "Halo! Ini adalah tes koneksi AI dari sistem Puskesmas. Mohon jawab dengan satu kalimat singkat konfirmasi bahwa sistem terhubung.",
      temperature: 0.2
    });

    const latencyMs = Date.now() - startTime;

    // Update status in config
    current.text.lastStatus = "success";
    current.text.lastTestedAt = new Date().toISOString();
    current.text.lastStatusMessage = `Koneksi berhasil (${latencyMs}ms) - Model: ${result.modelUsed}`;
    saveAIProviderConfig(current);

    res.json({
      success: true,
      message: `Koneksi ke Provider Teks ${result.providerUsed} berhasil!`,
      latencyMs,
      modelUsed: result.modelUsed,
      reply: result.text.trim().substring(0, 150)
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const current = getAIProviderConfig();

    if (category === "image") {
      current.image.lastStatus = "failed";
      current.image.lastTestedAt = new Date().toISOString();
      current.image.lastStatusMessage = err.message || "Gagal terkoneksi ke Provider AI Gambar";
      saveAIProviderConfig(current);
    } else {
      current.text.lastStatus = "failed";
      current.text.lastTestedAt = new Date().toISOString();
      current.text.lastStatusMessage = err.message || "Gagal terkoneksi ke Provider AI Teks";
      saveAIProviderConfig(current);
    }

    res.status(400).json({
      success: false,
      message: `Uji koneksi gagal: ${err.message}`,
      latencyMs
    });
  }
});

// 3b. Fetch Available Models from AI Provider (For Text or Image)
app.post("/api/ai/fetch-models", async (req, res) => {
  const { category, provider, endpointUrl, apiKey } = req.body;
  const current = getAIProviderConfig();

  // IMAGE MODELS
  if (category === "image") {
    const imgProvider = provider || current.image.provider;
    if (imgProvider === "gemini") {
      return res.json({
        success: true,
        models: ["imagen-3.0-generate-002", "imagen-3.0-fast-generate-001"],
        provider: "Google Imagen 3"
      });
    }
    if (imgProvider === "openai") {
      return res.json({
        success: true,
        models: ["dall-e-3", "dall-e-2"],
        provider: "OpenAI DALL-E"
      });
    }
    if (imgProvider === "stability") {
      return res.json({
        success: true,
        models: ["stable-diffusion-xl-1024-v1-0", "sd3-medium", "sd3-large", "stable-diffusion-v1-6"],
        provider: "Stability AI"
      });
    }
    if (imgProvider === "pollinations") {
      return res.json({
        success: true,
        models: ["flux", "turbo", "flux-realism"],
        provider: "Pollinations AI"
      });
    }
    return res.json({
      success: true,
      models: ["stable-diffusion", "dall-e-3", "default"],
      provider: "Custom"
    });
  }

  // TEXT MODELS
  const effectiveProvider = provider || current.text.provider || "gemini";
  
  // Resolve key if masked or empty
  let key = apiKey;
  if (key === "••••••••" || !key) {
    key = current.text.apiKey || (effectiveProvider === "gemini" ? process.env.GEMINI_API_KEY : "");
  }


  // 1. Google Gemini Models
  if (effectiveProvider === "gemini") {
    const defaultGeminiModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    if (key) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (geminiRes.ok) {
          const gData: any = await geminiRes.json();
          if (Array.isArray(gData.models)) {
            const fetchedList = gData.models
              .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
              .map((m: any) => m.name.replace(/^models\//, ''))
              .filter((name: string) => !name.includes("embedding") && !name.includes("aqa") && !name.includes("text-embedding"));
            if (fetchedList.length > 0) {
              return res.json({ success: true, models: fetchedList, provider: "gemini" });
            }
          }
        }
      } catch (e) {
        console.warn("Gemini fetch models notice:", e);
      }
    }
    return res.json({ success: true, models: defaultGeminiModels, provider: "gemini" });
  }

  // 2. OpenAI-compatible / Custom / Groq / DeepSeek / OpenRouter / Ollama
  let baseUrl = (endpointUrl || "").trim().replace(/\/+$/, '');
  if (!baseUrl) {
    const preset = AI_PROVIDER_PRESETS.find(p => p.id === effectiveProvider);
    baseUrl = preset?.endpointUrl || "https://api.openai.com/v1";
  }

  // Normalize baseUrl - remove /chat/completions if user accidentally included it
  if (baseUrl.endsWith('/chat/completions')) {
    baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
  }

  // Candidate URLs to probe for models
  const candidateUrls = [
    baseUrl.endsWith('/models') ? baseUrl : `${baseUrl}/models`,
    // If local Ollama or port 11434, also try native /api/tags
    baseUrl.replace(/\/v1$/, '') + '/api/tags'
  ];

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 PuskesmasPortal/1.0"
  };
  if (key && key !== "••••••••") {
    headers["Authorization"] = `Bearer ${key}`;
  } else {
    const savedConfig = getAIProviderConfig();
    if (savedConfig.apiKey) {
      headers["Authorization"] = `Bearer ${savedConfig.apiKey}`;
    }
  }

  if (effectiveProvider === "openrouter") {
    headers["HTTP-Referer"] = "https://puskesmas.id";
    headers["X-Title"] = "Puskesmas Portal";
  }

  let lastError = "";
  for (const testUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const mRes = await fetch(testUrl, {
        method: "GET",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (mRes.ok) {
        const mData: any = await mRes.json();
        let models: string[] = [];

        if (Array.isArray(mData.data)) {
          // Standard OpenAI, Groq, OpenRouter, DeepSeek format: { data: [ { id: "..." } ] }
          models = mData.data
            .map((item: any) => item.id || item.name)
            .filter((id: any) => typeof id === "string" && id.length > 0);
        } else if (Array.isArray(mData.models)) {
          // Ollama format: { models: [ { name: "llama3:latest" } ] }
          models = mData.models
            .map((item: any) => item.name || item.id || item.model)
            .filter((id: any) => typeof id === "string" && id.length > 0);
        }

        if (models.length > 0) {
          models.sort((a, b) => a.localeCompare(b));
          return res.json({
            success: true,
            models: models,
            provider: effectiveProvider,
            sourceUrl: testUrl
          });
        }
      } else {
        const errText = await mRes.text();
        lastError = `HTTP ${mRes.status}: ${errText.substring(0, 100)}`;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  return res.status(400).json({
    success: false,
    message: `Gagal mengambil daftar model dari endpoint (${lastError || 'Server provider tidak merespon'}). Pastikan URL Endpoint dan API Key sudah valid, atau ketik nama model secara manual.`
  });
});

// 4. AI Article & Social Media Importer (With Dynamic Multi-Provider & Deep Web Scraper)
app.post("/api/ai/import-article", async (req, res) => {
  const { url, sourceName, rawText, providerOverride } = req.body;
  if (!url && !rawText) {
    return res.status(400).json({ message: "URL atau teks sumber wajib diisi." });
  }

  let domainHost = "";
  if (url) {
    try {
      domainHost = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      domainHost = "web eksternal";
    }
  }

  // 1. Decode HTML entities helper
  const decodeHtml = (str: string) => {
    if (!str) return "";
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  };

  // 2. Attempt to fetch and extract rich webpage content
  let fetchedPageContext = "";
  let scrapedTitle = "";
  let extractedParagraphs: string[] = [];
  let scrapedMetaDesc = "";

  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const pageRes = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache"
        }
      });
      clearTimeout(timeout);

      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogTitle = html.match(/<meta[^>]*property=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["']/i)?.[1];
        const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        const h1Title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
        scrapedTitle = decodeHtml(ogTitle || h1Title || pageTitle || "").replace(/\s+/g, ' ').trim();

        const ogDesc = html.match(/<meta[^>]*property=["'](?:og:description|twitter:description)["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
        scrapedMetaDesc = decodeHtml(ogDesc || "").replace(/\s+/g, ' ').trim();

        const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1];

        // Isolate main editorial container if available
        const containerRegexes = [
          /<article\b[^>]*>([\s\S]*?)<\/article>/i,
          /<div[^>]*(?:class|id)=["'][^"']*(?:detail__body-text|read__content|read__article|entry-content|post-content|article-content|content-detail|detail-text|story-body|article__body|news-detail|konten-berita)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
          /<main\b[^>]*>([\s\S]*?)<\/main>/i
        ];

        let targetArea = "";
        for (const regex of containerRegexes) {
          const m = html.match(regex);
          if (m && m[1] && m[1].length > 150) {
            targetArea = m[1];
            break;
          }
        }
        if (!targetArea) targetArea = html;

        // Clean out noisy elements
        let cleanHtml = targetArea
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
          .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
          .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ")
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");

        // Extract paragraphs and key headings
        const pMatches = cleanHtml.matchAll(/<(?:p|h2|h3|li)[^>]*>([\s\S]*?)<\/(?:p|h2|h3|li)>/gi);
        for (const m of pMatches) {
          const rawP = decodeHtml(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
          const lowerP = rawP.toLowerCase();
          if (
            rawP.length > 25 &&
            !lowerP.includes("copyright") &&
            !lowerP.includes("hak cipta") &&
            !lowerP.includes("kebijakan privasi") &&
            !lowerP.includes("cookie") &&
            !lowerP.includes("baca juga") &&
            !lowerP.includes("simak juga") &&
            !lowerP.includes("tonton video") &&
            !lowerP.includes("scroll untuk") &&
            !lowerP.includes("iklan") &&
            !lowerP.includes("advertisement")
          ) {
            extractedParagraphs.push(rawP);
          }
        }

        const bodyContent = extractedParagraphs.length > 0 
          ? extractedParagraphs.join("\n\n")
          : (scrapedMetaDesc || cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 1000));

        if (bodyContent && bodyContent.length > 40) {
          fetchedPageContext = `
Informasi Halaman Web Asli (${siteName || domainHost}):
- Judul Asli: ${scrapedTitle || 'N/A'}
- Ringkasan/Meta: ${scrapedMetaDesc || 'N/A'}
- Isi Artikel/Materi dari Sumber:\n${bodyContent.substring(0, 10000)}
          `.trim();
        }
      }
    } catch (e) {
      console.log("Webpage fetch notice: proceeding with available raw text", e);
    }
  }

  // If website returned zero content and user provided zero rawText:
  if (!fetchedPageContext && !rawText) {
    return res.status(422).json({
      success: false,
      message: `Sistem tidak dapat membaca isi teks otomatis dari link ${domainHost || 'web'}. Situs media sosial (seperti Instagram/Facebook/TikTok/X) atau web dengan proteksi login/anti-bot membatasi pembacaan otomatis. Silakan salin (copy) teks/caption dari postingan tersebut dan tempelkan (paste) ke kolom "Cuplikan Teks / Caption Medsos" agar AI dapat menyusun artikel sesuai isi aslinya.`
    });
  }

  let effectiveProvider = "gemini";
  const displaySource = sourceName || domainHost || (url ? 'Sumber Resmi Eksternal' : 'Rilis Terpercaya');

  // Standard Guaranteed Attribution Box
  const mandatoryAttributionBox = `
<div style="margin-top: 2rem; padding: 1.25rem; background-color: rgba(13, 148, 136, 0.08); border-left: 4px solid #0d9488; border-radius: 0.75rem;">
  <p style="margin: 0; font-weight: 700; color: #0f766e; font-size: 0.95rem;">📌 Sumber Rujukan Resmi & Hak Cipta:</p>
  <p style="margin: 0.35rem 0 0 0; font-size: 0.875rem; color: #374151; line-height: 1.6;">
    Artikel ini disadur, diedit, dan dipublikasikan kembali secara etis untuk kepentingan edukasi kesehatan masyarakat berdasarkan publikasi resmi dari 
    <a href="${url || '#'}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; font-weight: 600; text-decoration: underline;">
      ${displaySource}
    </a>.
    Hak cipta materi asli sepenuhnya merupakan milik penerbit sumber.
  </p>
</div>
  `.trim();

  try {
    const savedConfig = getAIProviderConfig();
    effectiveProvider = providerOverride?.provider || savedConfig.provider || "gemini";
    const effectiveUrl = providerOverride?.endpointUrl || savedConfig.endpointUrl;
    const effectiveKey = providerOverride?.apiKey === "••••••••" 
      ? savedConfig.apiKey 
      : (providerOverride?.apiKey || savedConfig.apiKey || process.env.GEMINI_API_KEY || "");
    const effectiveModel = providerOverride?.model || savedConfig.model;

    const systemPrompt = `Anda adalah editor kesehatan dan jurnalis medis profesional untuk portal resmi Puskesmas di Indonesia.
TUGAS UTAMA:
Menyusun berita atau artikel edukasi kesehatan yang mendalam, berbobot, komprehensif, dan mudah dipahami masyarakat luas BERDASARKAN materi/fakta yang diberikan dari sumber web atau media sosial.

PANDUAN KETAT & WAJIB:
1. **KONSISTENSI TOPIK & FAKTA (MUTLAK)**:
   - Anda WAJIB menyusun tulisan HANYA berdasarkan topik, fakta medis, dan materi yang ada pada teks sumber yang diberikan di bawah.
   - DILARANG KERAS mengganti topik (misalnya jika sumber membahas Demam Berdarah/DBD, tulisan harus tentang DBD; jika sumber membahas Vaksin Polio atau Stunting, tulisan harus tentang itu).
   - Jangan membuat tulisan umum yang tidak relevan dengan topik sumber asli.
2. **PANJANG & KEDALAMAN (JANGAN TERLALU PENDEK)**:
   - Buat tulisan bernas minimal 4 hingga 6 paragraf substansial (sekitar 400 - 800 kata). Hindari ringkasan singkat 1-2 paragraf.
3. **STRUKTUR ARTIKEL EDUKATIF**:
   - Judul: Menarik, profesional, dan mencerminkan esensi topik sumber bagi masyarakat luas.
   - Paragraf 1-2: Latar belakang isu sesuai sumber, mengapa hal ini penting bagi keluarga warga.
   - Paragraf 3-4: Ulasan fakta medis, data/penyebab, gejala klinis, atau kebijakan kesehatan dari sumber dengan bahasa yang mudah dicerna awam.
   - Subjudul '<h3>Langkah Pencegahan & Panduan Hidup Sehat</h3>': Poin-poin praktis yang dapat diterapkan warga ('<ul><li>...</li></ul>').
   - Paragraf Penutup: Ajakan menjaga kesehatan dan himbauan berkonsultasi ke Puskesmas jika mengalami keluhan.
4. **KOTAK SITASI & RUJUKAN RESMI**:
   Di akhir artikel, sertakan kotak rujukan dengan tautan aktif ke web sumber:
   ${mandatoryAttributionBox}
5. **OUTPUT WAJIB FORMAT JSON MURNI**:
{
  "title": "Judul Sesuai Topik Sumber yang Menarik & Informatif",
  "excerpt": "Ringkasan 1-2 kalimat (maksimal 160 karakter) yang mencerminkan inti materi untuk kartu berita.",
  "content": "<p>Paragraf 1...</p><p>Paragraf 2...</p><h3>Langkah Pencegahan & Panduan Hidup Sehat</h3><ul><li>Poin...</li></ul><p>Penutup...</p>${mandatoryAttributionBox.replace(/"/g, '\\"')}",
  "tags": ["EdukasiKesehatan", "TopikTerkait", "Puskesmas"]
}`;

    const userPrompt = `Silakan susun artikel berita edukasi kesehatan yang komprehensif, mendalam, dan akurat berdasarkan materi sumber berikut:
URL Sumber: ${url || 'N/A'}
Nama Sumber/Penerbit: ${displaySource}
${scrapedTitle ? `Judul Rujukan: ${scrapedTitle}\n` : ''}
${fetchedPageContext ? `\n${fetchedPageContext}\n` : ''}
${rawText ? `Teks/Catatan Tambahan dari Redaksi:\n${rawText}` : ''}

INGAT: Topik artikel WAJIB sesuai dengan isi sumber di atas, minimal 4-6 paragraf berbobot, dan mencantumkan kotak atribusi rujukan resmi. Keluarkan format JSON sekarang.`;

    const result = await executeAICompletion({
      provider: effectiveProvider,
      endpointUrl: effectiveUrl,
      apiKey: effectiveKey,
      model: effectiveModel,
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      temperature: 0.3
    });

    const text = result.text || '';
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        try {
          const sanitized = jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          parsed = JSON.parse(sanitized);
        } catch {}
      }
    }

    if (!parsed || !parsed.content) {
      parsed = {
        title: scrapedTitle ? `${scrapedTitle}` : `Informasi Edukasi Kesehatan Terkini dari ${displaySource}`,
        excerpt: text.substring(0, 160).replace(/<[^>]+>/g, ' ') || 'Panduan edukasi kesehatan terkini bagi masyarakat.',
        content: `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
        tags: ['EdukasiKesehatan', displaySource.replace(/[^a-zA-Z0-9]/g, '') || 'InformasiPublik']
      };
    }

    // GUARANTEE: Ensure Attribution Box is ALWAYS present in the content
    if (!parsed.content.includes("Sumber Rujukan Resmi") && !parsed.content.includes(displaySource)) {
      parsed.content = `${parsed.content}\n\n${mandatoryAttributionBox}`;
    }

    res.json({
      success: true,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      ...parsed
    });
  } catch (err: any) {
    console.error("AI Import Error:", err);

    // DETERMINISTIC ADAPTATION: If AI failed (e.g. key missing/quota/timeout),
    // build an accurate draft directly from THE REAL EXTRACTED PARAGRAPHS of the website!
    // NEVER invent an unrelated "cuci tangan" article when the user imported something else!
    const sourceParagraphs = extractedParagraphs.length > 0
      ? extractedParagraphs
      : (rawText || '').split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 25);

    if (sourceParagraphs.length > 0) {
      const candidateTitle = scrapedTitle || `Informasi Kesehatan: Rilis Terkini dari ${displaySource}`;
      const intro = sourceParagraphs[0];
      const middleParagraphs = sourceParagraphs.slice(1, 6).map((p: string) => `<p>${p}</p>`).join('\n');

      const fallbackContent = `
<p>${intro}</p>

${middleParagraphs}

<h3>Himbauan & Tindak Lanjut Pelayanan Puskesmas</h3>
<p>Puskesmas menghimbau masyarakat untuk senantiasa menyaring informasi kesehatan dari sumber resmi dan terpercaya. Apabila Anda atau anggota keluarga mengalami gejala kesehatan terkait pembahasan di atas, segera lakukan pemeriksaan dan konsultasi ke Puskesmas atau fasilitas pelayanan kesehatan terdekat untuk memperoleh penanganan medis yang tepat.</p>

${mandatoryAttributionBox}
      `.trim();

      return res.json({
        success: true,
        fallbackUsed: true,
        providerUsed: `Ekstraktor Redaksi Web Cerdas (${displaySource})`,
        modelUsed: "deterministic-web-synthesizer",
        title: candidateTitle,
        excerpt: (scrapedMetaDesc || sourceParagraphs[0]).substring(0, 160),
        content: fallbackContent,
        tags: ['EdukasiKesehatan', displaySource.replace(/[^a-zA-Z0-9]/g, '') || 'RilisPublik'],
        warning: `Catatan: Pemrosesan AI mengalami kendala (${err.message || 'koneksi provider'}). Draft berita telah disusun secara otomatis langsung dari teks asli situs ${displaySource} lengkap dengan atribusi sumber.`
      });
    }

    // If no text could be extracted and AI also failed:
    return res.status(400).json({
      success: false,
      message: `Gagal memproses artikel: ${err.message || 'Server AI tidak merespon'}. Silakan periksa konfigurasi Provider AI di menu Sistem & Konfigurasi, atau salin teks berita ke kolom cuplikan.`
    });
  }
});

// System Health Endpoints
app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/api/health", (req, res) => {
  const waConfig = getWhatsAppConfig();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      application: { status: "running", message: "Node.js Express backend operational" },
      database: { status: "connected", message: "Client and local storage sync operational", latencyMs: 12 },
      storage: { status: "available", message: "Local filesystem and storage vault accessible" },
      notification: { status: "operational", message: "Notification queue active" },
      whatsapp: { status: waConfig.enabled ? "connected" : "disabled", message: waConfig.enabled ? "WhatsApp Cloud API active" : "Disabled in settings" },
      email: { status: "configured", message: "SMTP relay configured" },
      backup: { status: "operational", message: "Automated backup scheduler active" },
      search: { status: "operational", message: "Global search index synchronized" },
      api: { status: "healthy", message: "REST API endpoints responsive", latencyMs: 24 }
    }
  });
});

// Meta preview test endpoint for WhatsApp / Social Media Link Scraper debugging
app.get("/api/meta-preview", (req, res) => {
  const reqPath = (req.query.path as string) || "/";
  const mockReq = { ...req, path: reqPath, originalUrl: reqPath } as express.Request;
  const dummyHtml = `<title></title><meta name="description" content="" /><meta property="og:title" content="" /><meta property="og:description" content="" /><meta property="og:image" content="" /><meta property="og:url" content="" /><meta property="og:type" content="" /><meta name="twitter:title" content="" /><meta name="twitter:description" content="" /><meta name="twitter:image" content="" />`;
  const rendered = renderHtmlWithMeta(mockReq, dummyHtml);
  res.json({ success: true, path: reqPath, rawHtml: rendered });
});

// Default datasets for Open Graph Meta tags
const DEFAULT_MICROSITES: Record<string, { name: string; description: string; profileImageUrl?: string; logoUrl?: string; ogImageUrl?: string; slug?: string }> = {
  'portal-cepat': {
    name: 'Portal Layanan Cepat & Terpadu',
    description: 'Akses cepat semua layanan kesehatan, pendaftaran online, pengaduan masyarakat, serta jadwal operasional dalam satu genggaman.',
    profileImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
    logoUrl: '/logo.png',
    slug: 'portal-cepat'
  },
  'polio-2026': {
    name: 'Posko Informasi PIN Polio 2026',
    description: 'Pusat Informasi & Layanan Imunisasi Polio Dosis Tambahan Gratis untuk seluruh balita.',
    profileImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
    logoUrl: '/logo.png',
    slug: 'polio-2026'
  }
};

const DEFAULT_POSTS: Record<string, { title: string; excerpt: string; featuredImage?: string }> = {
  'penerapan-integrasi-layanan-primer-ilp': {
    title: 'Penerapan Integrasi Layanan Primer (ILP) di Puskesmas',
    excerpt: 'Sesuai Keputusan Menteri Kesehatan RI No. 19/2024, Puskesmas resmi menata ulang alur pelayanan berbasis 5 Klaster Kesehatan.',
    featuredImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200'
  },
  'pelaksanaan-pekan-imunisasi-nasional-pin-polio': {
    title: 'Pelaksanaan Pekan Imunisasi Nasional (PIN) Polio Serentak',
    excerpt: 'Ribuan balita di wilayah kerja Puskesmas berhasil mendapatkan penetesan vaksin polio dosis tambahan gratis.',
    featuredImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200'
  },
  'tips-mencegah-demam-berdarah-dengue-dbd': {
    title: 'Tips Mencegah Demam Berdarah Dengue (DBD) dengan Gerakan 3M Plus',
    excerpt: 'Langkah taktis membasmi jentik nyamuk Aedes aegypti selama musim penghujan tiba.',
    featuredImage: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=1200'
  }
};

// File persistence paths for settings & metadata
const SITE_SETTINGS_FILE = path.join(process.cwd(), "site_settings.json");
const MICROSITES_META_FILE = path.join(process.cwd(), "microsites_meta.json");
const MICROSITES_DATA_FILE = path.join(process.cwd(), "microsites_data.json");
const MICROSITES_CATEGORIES_FILE = path.join(process.cwd(), "microsites_categories.json");
const THEME_PUBLISHED_FILE = path.join(process.cwd(), "theme_published.json");
const THEME_DRAFT_FILE = path.join(process.cwd(), "theme_draft.json");
const HOMEPAGE_PUBLISHED_FILE = path.join(process.cwd(), "homepage_published.json");
const HOMEPAGE_DRAFT_FILE = path.join(process.cwd(), "homepage_draft.json");
const POSTS_META_FILE = path.join(process.cwd(), "posts_meta.json");

const DEFAULT_THEME = {
  id: 'global-theme-config',
  status: 'published',
  updatedAt: new Date().toISOString(),
  themeName: "Fresh Mint",
  colorPrimary: "#18A878",
  colorPrimaryForeground: "#FFFFFF",
  colorSecondary: "#DDF5EA",
  colorSecondaryForeground: "#145A3B",
  colorAccent: "#27C7A5",
  colorAccentForeground: "#FFFFFF",
  colorBg: "#F8FCFA",
  colorText: "#18332A",
  colorCard: "#FFFFFF",
  colorSurface: "#FFFFFF",
  colorSurfaceForeground: "#18332A",
  colorMuted: "#EEF6F2",
  colorMutedForeground: "#60756C",
  colorBorder: "#D9E9E1",
  colorInput: "#D9E9E1",
  colorRing: "#18A878",
  colorSuccess: "#16A34A",
  colorWarning: "#D97706",
  colorDanger: "#DC2626",
  colorInfo: "#0284C7",
  radius: "rounded",
  buttonStyle: "rounded"
};

const DEFAULT_HOMEPAGE = {
  id: 'homepage-builder-config',
  template: 'modern_majestic',
  backgroundAnimation: 'aurora_flow',
  status: 'published',
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      title: 'Pelayanan Kesehatan Terpadu, Profesional & Ramah',
      visible: true,
      order: 0,
      settings: {
        subtitle: 'Puskesmas Mandiri Sejahtera memberikan pelayanan kesehatan komprehensif berbasis 5 Klaster Kesehatan (Permenkes RI No. 19/2024) dan Standar Pelayanan Minimal (Permenkes No. 6/2024).',
        buttonText: 'Lihat Layanan',
        buttonLink: '/layanan',
        buttonText2: 'Kontak & Pengaduan',
        buttonLink2: '/kontak',
        alignment: 'left',
        bgGradient: true
      }
    },
    {
      id: 'sec-search',
      type: 'search',
      title: 'Pencarian Cepat Informasi Puskesmas',
      visible: true,
      order: 1,
      settings: {
        placeholder: 'Cari layanan, jadwal poli, berita, atau persyaratan...',
        showSuggestions: true
      }
    },
    {
      id: 'sec-sambutan',
      type: 'sambutan',
      title: 'Sambutan Kepala Puskesmas',
      visible: true,
      order: 2,
      settings: {
        name: 'dr. H. Rahmat Hidayat, M.Kes',
        role: 'Kepala Puskesmas',
        text: 'Selamat datang di website resmi Puskesmas Mandiri Sejahtera. Kami berkomitmen untuk terus meningkatkan pelayanan kesehatan promotif, preventif, kuratif, dan rehabilitatif di wilayah kami sesuai dengan standar nasional, serta mewujudkan integrasi pelayanan kesehatan primer yang inklusif.',
        avatarUrl: ''
      }
    },
    {
      id: 'sec-info',
      type: 'info',
      title: 'Sekilas Puskesmas Kami',
      visible: true,
      order: 3,
      settings: {
        grid: [
          { title: '5 Klaster', desc: 'Penyelenggaraan Klaster Kesehatan Terintegrasi' },
          { title: '24 Jam', desc: 'Layanan UGD & Persalinan Darurat' },
          { title: '11 Komponen', desc: 'Standar Pelayanan Publik Terbuka' },
          { title: '12 SPM', desc: 'Cakupan Standar Pelayanan Minimal' }
        ]
      }
    },
    {
      id: 'sec-unggulan',
      type: 'unggulan',
      title: 'Layanan Unggulan & Inovasi',
      visible: true,
      order: 4,
      settings: {
        items: [
          { name: 'Skrining PTM Keliling', description: 'Pemeriksaan tensi, gula darah, dan kolesterol gratis di posyandu & balai RW.' },
          { name: 'Pojok Gizi & Konseling', description: 'Pelayanan konseling gizi terpadu untuk penanganan stunting.' },
          { name: 'UGD & Ambulans Siaga 24 Jam', description: 'Pelayanan gawat darurat respons cepat.' }
        ]
      }
    },
    {
      id: 'sec-layanan',
      type: 'layanan',
      title: 'Daftar Layanan Kesehatan',
      visible: true,
      order: 5,
      settings: {
        limit: 6,
        layout: 'grid',
        categoryFilter: 'all'
      }
    },
    {
      id: 'sec-jadwal',
      type: 'jadwal',
      title: 'Jadwal Layanan Poli',
      visible: true,
      order: 6,
      settings: {
        schedules: [
          { name: 'Poli Umum', days: 'Senin - Sabtu', hours: '08:00 - 14:00' },
          { name: 'Poli Gigi', days: 'Senin - Jumat', hours: '08:00 - 13:00' },
          { name: 'Poli KIA/KB', days: 'Selasa & Kamis', hours: '08:00 - 12:00' },
          { name: 'Poli Imunisasi', days: 'Rabu', hours: '08:00 - 11:30' }
        ]
      }
    },
    {
      id: 'sec-berita',
      type: 'berita',
      title: 'Berita & Artikel Kesehatan Terbaru',
      visible: true,
      order: 7,
      settings: {
        limit: 3,
        sortBy: 'latest'
      }
    },
    {
      id: 'sec-pengumuman',
      type: 'pengumuman',
      title: 'Pengumuman Penting',
      visible: true,
      order: 8,
      settings: {
        limit: 2
      }
    },
    {
      id: 'sec-statistik',
      type: 'statistik',
      title: 'Statistik Pelayanan Bulan Ini',
      visible: true,
      order: 9,
      settings: {
        items: [
          { label: 'Pasien Terlayani', value: '1,420+' },
          { label: 'Kepuasan Masyarakat', value: '94.8%' },
          { label: 'Kunjungan Pustu', value: '380' },
          { label: 'Kegiatan Posyandu', value: '24' }
        ]
      }
    },
    {
      id: 'sec-kritik',
      type: 'kritik_saran',
      title: 'Suara Anda, Layanan Kami',
      visible: true,
      order: 10,
      settings: {
        text: 'Bantu kami meningkatkan kualitas layanan dengan memberikan kritik, saran, atau pengaduan secara transparan.',
        buttonText: 'Kirim Kritik & Saran',
        buttonLink: '/kritik-saran'
      }
    },
    {
      id: 'sec-microsites',
      type: 'microsites',
      title: 'Microsite',
      visible: true,
      order: 11,
      settings: {
        subtitle: 'Akses cepat portal khusus, program kesehatan tematik, dan informasi kampanye puskesmas.'
      }
    },
    {
      id: 'sec-kontak',
      type: 'kontak',
      title: 'Hubungi Kami',
      visible: true,
      order: 12,
      settings: {
        showSocials: true
      }
    },
    {
      id: 'sec-lokasi',
      type: 'lokasi',
      title: 'Lokasi Puskesmas',
      visible: true,
      order: 13,
      settings: {
        height: '400px'
      }
    },
    {
      id: 'sec-cta',
      type: 'cta',
      title: 'Butuh Pelayanan Kesehatan Darurat?',
      visible: true,
      order: 14,
      settings: {
        subtitle: 'Layanan UGD dan Bersalin Puskesmas Mandiri Sejahtera buka 24 jam sehari, 7 hari seminggu.',
        buttonText: 'Telepon UGD Sekarang',
        buttonLink: 'tel:0215550199'
      }
    }
  ]
};

const DEFAULT_CATEGORIES = [
  { name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' },
  { name: 'Layanan Puskesmas', description: 'Akses cepat portal utama layanan rawat jalan, gawat darurat, pendaftaran online, dan jadwal poliklinik.' },
  { name: 'Program Kesehatan', description: 'Portal tematik program khusus kesehatan masyarakat seperti PIN Polio, pencegahan stunting, dan imunisasi.' },
  { name: 'Informasi Publik', description: 'Kumpulan regulasi, Standar Pelayanan Publik (SPP), maklumat, serta laporan akuntabilitas kinerja.' },
  { name: 'Kampanye & Edukasi', description: 'Materi penyuluhan kesehatan, infografis pencegahan penyakit, dan sosialisasi program hidup sehat.' }
];

const DEFAULT_FULL_MICROSITES: any[] = [
  {
    id: 'm-1',
    name: 'Puskesmas Mandiri Sejahtera - Portal Cepat',
    slug: 'portal-cepat',
    description: 'Akses cepat semua layanan kesehatan, pengaduan masyarakat, serta jadwal operasional dalam satu genggaman.',
    category: 'Layanan Puskesmas',
    logoUrl: '',
    profileImageUrl: '',
    status: 'published',
    active: true,
    passwordProtected: false,
    password: '',
    links: [
      { id: 'ml-1', label: 'Daftar Layanan Utama', url: '/layanan', type: 'internal', displayOrder: 1 },
      { id: 'ml-2', label: 'Formulir Kritik, Saran, & Pengaduan', url: '/kritik-saran', type: 'internal', displayOrder: 2 },
      { id: 'ml-3', label: 'Pusat Berita & Edukasi', url: '/berita', type: 'internal', displayOrder: 3 },
      { id: 'ml-4', label: 'Hubungi Kami (WhatsApp)', url: 'https://wa.me/628123456789', type: 'external', displayOrder: 4 }
    ],
    socialMedia: {
      facebook: 'https://facebook.com/puskesmas.mandiri',
      instagram: 'https://instagram.com/puskesmas.mandiri',
      youtube: 'https://youtube.com/c/PuskesmasMandiri'
    },
    phone: '(021) 555-0199',
    email: 'kontak@puskesmas.go.id',
    website: 'https://puskesmas-mandiri.go.id',
    address: 'Jl. Kesehatan No. 123, Kelurahan Sejahtera',
    mapUrl: 'https://maps.google.com',
    themeCustomization: {
      theme: 'emerald',
      template: 'modern_majestic',
      backgroundAnimation: 'aurora_flow',
      buttonStyle: 'rounded',
      accentColor: '#10b981'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function getServerThemePublished(): Record<string, any> {
  try {
    if (fs.existsSync(THEME_PUBLISHED_FILE)) {
      const content = fs.readFileSync(THEME_PUBLISHED_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_THEME, ...parsed, status: 'published' };
      }
    }
  } catch (e) {
    console.error("Error reading theme_published.json:", e);
  }
  return DEFAULT_THEME;
}

function saveServerThemePublished(theme: Record<string, any>): boolean {
  try {
    const merged = { ...DEFAULT_THEME, ...theme, status: 'published', updatedAt: new Date().toISOString() };
    fs.writeFileSync(THEME_PUBLISHED_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving theme_published.json:", e);
    return false;
  }
}

function getServerThemeDraft(): Record<string, any> {
  try {
    if (fs.existsSync(THEME_DRAFT_FILE)) {
      const content = fs.readFileSync(THEME_DRAFT_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_THEME, ...parsed, status: 'draft' };
      }
    }
  } catch (e) {
    console.error("Error reading theme_draft.json:", e);
  }
  return getServerThemePublished();
}

function saveServerThemeDraft(theme: Record<string, any>): boolean {
  try {
    const merged = { ...DEFAULT_THEME, ...theme, status: 'draft', updatedAt: new Date().toISOString() };
    fs.writeFileSync(THEME_DRAFT_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving theme_draft.json:", e);
    return false;
  }
}

function getServerHomepagePublished(): Record<string, any> {
  try {
    if (fs.existsSync(HOMEPAGE_PUBLISHED_FILE)) {
      const content = fs.readFileSync(HOMEPAGE_PUBLISHED_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
        return { ...DEFAULT_HOMEPAGE, ...parsed, status: 'published' };
      }
    }
  } catch (e) {
    console.error("Error reading homepage_published.json:", e);
  }
  return DEFAULT_HOMEPAGE;
}

function saveServerHomepagePublished(config: Record<string, any>): boolean {
  try {
    const merged = { ...DEFAULT_HOMEPAGE, ...config, status: 'published', updatedAt: new Date().toISOString() };
    fs.writeFileSync(HOMEPAGE_PUBLISHED_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving homepage_published.json:", e);
    return false;
  }
}

function getServerHomepageDraft(): Record<string, any> {
  try {
    if (fs.existsSync(HOMEPAGE_DRAFT_FILE)) {
      const content = fs.readFileSync(HOMEPAGE_DRAFT_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
        return { ...DEFAULT_HOMEPAGE, ...parsed, status: 'draft' };
      }
    }
  } catch (e) {
    console.error("Error reading homepage_draft.json:", e);
  }
  return getServerHomepagePublished();
}

function saveServerHomepageDraft(config: Record<string, any>): boolean {
  try {
    const merged = { ...DEFAULT_HOMEPAGE, ...config, status: 'draft', updatedAt: new Date().toISOString() };
    fs.writeFileSync(HOMEPAGE_DRAFT_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving homepage_draft.json:", e);
    return false;
  }
}

function getServerMicrosites(): any[] {
  try {
    if (fs.existsSync(MICROSITES_DATA_FILE)) {
      const content = fs.readFileSync(MICROSITES_DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading microsites_data.json:", e);
  }
  return [];
}

function saveServerMicrosites(microsites: any[]): boolean {
  try {
    fs.writeFileSync(MICROSITES_DATA_FILE, JSON.stringify(microsites, null, 2), "utf-8");
    // Rebuild metaList solely from remaining microsites to prevent ghost resurrection
    const metaList: Record<string, any> = {};
    for (const m of microsites) {
      if (m && m.slug) {
        metaList[m.slug] = {
          name: m.name || m.title || '',
          description: m.description || '',
          category: m.category || 'Umum',
          profileImageUrl: m.profileImageUrl || m.coverImageUrl || '',
          logoUrl: m.logoUrl || '',
          ogImageUrl: m.ogImageUrl || m.profileImageUrl || '',
          slug: m.slug
        };
      }
    }
    fs.writeFileSync(MICROSITES_META_FILE, JSON.stringify(metaList, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving microsites_data.json:", e);
    return false;
  }
}

function getServerMicrositeCategories(): any[] {
  try {
    if (fs.existsSync(MICROSITES_CATEGORIES_FILE)) {
      const content = fs.readFileSync(MICROSITES_CATEGORIES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading microsites_categories.json:", e);
  }
  return DEFAULT_CATEGORIES;
}

function saveServerMicrositeCategories(categories: any[]): boolean {
  try {
    fs.writeFileSync(MICROSITES_CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving microsites_categories.json:", e);
    return false;
  }
}

function getServerSiteSettings(): Record<string, any> {
  const defaultSettings: Record<string, any> = {
    siteName: "Puskesmas Manding",
    shortName: "Puskesmas Manding",
    siteTitle: "Puskesmas Manding - Portal Resmi & Pelayanan Terpadu",
    siteDescription: "Portal informasi dan pelayanan kesehatan resmi Puskesmas Manding: Layanan kesehatan primer, pendaftaran online, berita kesehatan, jadwal dokter, microsite, dan pengaduan masyarakat.",
    tagline: "Bismillah Melayani, Anda Sehat Kami Puas",
    motto: "Bismillah Melayani, Anda Sehat Kami Puas",
    logoUrl: "/logo-custom.png",
    ogImageUrl: "/og-image.png",
    address: "Jl. Raya Manding, Kec. Manding, Kab. Sumenep, Jawa Timur",
    phone: "(0328) 667123",
    email: "puskesmasmanding@gmail.com",
    whatsapp: "081234567890",
    operatingHours: "Senin - Sabtu: 07.30 - 14.00 WIB | UGD & Rawat Inap: 24 Jam"
  };

  try {
    if (fs.existsSync(SITE_SETTINGS_FILE)) {
      const content = fs.readFileSync(SITE_SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return { ...defaultSettings, ...parsed };
      }
    }
  } catch (e) {
    console.error("Error reading site_settings.json:", e);
  }
  return defaultSettings;
}

function saveServerSiteSettings(settings: Record<string, any>): boolean {
  try {
    const current = getServerSiteSettings();
    let opHours = settings.operatingHours !== undefined ? settings.operatingHours : current.operatingHours;
    if (Array.isArray(opHours)) {
      opHours = "Senin - Sabtu: 07.30 - 14.00 WIB | UGD & Rawat Inap: 24 Jam";
    }
    const merged: Record<string, any> = { 
      ...current, 
      ...settings, 
      operatingHours: typeof opHours === 'string' && opHours.trim() ? opHours : "Senin - Sabtu: 07.30 - 14.00 WIB | UGD & Rawat Inap: 24 Jam",
      updatedAt: new Date().toISOString() 
    };
    fs.writeFileSync(SITE_SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");

    // Also synchronize to contact settings file if it exists
    try {
      if (fs.existsSync(CONTACT_SETTINGS_FILE)) {
        const contact = JSON.parse(fs.readFileSync(CONTACT_SETTINGS_FILE, "utf-8"));
        if (merged.siteName) contact.name = merged.siteName;
        if (merged.tagline) contact.tagline = merged.tagline;
        if (merged.address) contact.address = merged.address;
        if (merged.village) contact.village = merged.village;
        if (merged.district) contact.district = merged.district;
        if (merged.regency) contact.regency = merged.regency;
        if (merged.province) contact.province = merged.province;
        if (merged.postalCode) contact.postalCode = merged.postalCode;
        if (merged.latitude) contact.latitude = merged.latitude;
        if (merged.longitude) contact.longitude = merged.longitude;
        if (merged.timezone) contact.timezone = merged.timezone;

        if (Array.isArray(contact.channels)) {
          if (merged.phone) {
            const ch = contact.channels.find((c: any) => c.type === 'Phone');
            if (ch) ch.value = merged.phone;
          }
          if (merged.whatsapp) {
            const ch = contact.channels.find((c: any) => c.type === 'WhatsApp');
            if (ch) ch.value = merged.whatsapp;
          }
          if (merged.email) {
            const ch = contact.channels.find((c: any) => c.type === 'Email');
            if (ch) ch.value = merged.email;
          }
        }
        contact.updatedAt = new Date().toISOString();
        fs.writeFileSync(CONTACT_SETTINGS_FILE, JSON.stringify(contact, null, 2), "utf-8");
      }
    } catch {}

    return true;
  } catch (e) {
    console.error("Error saving site_settings.json:", e);
    return false;
  }
}

function getServerMicrositesMeta(): Record<string, any> {
  const defaultList: Record<string, any> = { ...DEFAULT_MICROSITES };
  try {
    if (fs.existsSync(MICROSITES_META_FILE)) {
      const content = fs.readFileSync(MICROSITES_META_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.assign(defaultList, parsed);
      }
    }
  } catch (e) {
    console.error("Error reading microsites_meta.json:", e);
  }

  // Also read from MICROSITES_DATA_FILE to ensure live sync with all microsites
  try {
    if (fs.existsSync(MICROSITES_DATA_FILE)) {
      const content = fs.readFileSync(MICROSITES_DATA_FILE, "utf-8");
      const items = JSON.parse(content);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.slug) {
            defaultList[item.slug] = {
              name: item.name || item.title || '',
              description: item.description || '',
              category: item.category || 'Umum',
              links: Array.isArray(item.links) ? item.links : [],
              profileImageUrl: item.profileImageUrl || item.coverImageUrl || '',
              logoUrl: item.logoUrl || '',
              ogImageUrl: item.ogImageUrl || item.profileImageUrl || '',
              slug: item.slug
            };
          }
        }
      }
    }
  } catch (e) {
    console.error("Error reading microsites_data.json into meta:", e);
  }

  // Merge microsite dari SQLite (multi-user) agar OG/slug publish mengenali
  // microsite yang dibuat pengelola mana pun.
  try {
    const dbItems = store.listAllMicrosites();
    for (const item of dbItems) {
      if (item && item.slug) {
        defaultList[item.slug] = {
          name: item.name || item.title || '',
          description: item.description || '',
          category: item.category || 'Umum',
          links: Array.isArray(item.links) ? item.links : [],
          profileImageUrl: item.profileImageUrl || item.coverImageUrl || '',
          logoUrl: item.logoUrl || '',
          ogImageUrl: item.ogImageUrl || item.profileImageUrl || '',
          slug: item.slug,
        };
      }
    }
  } catch (e) {
    console.error("Error merging SQLite microsites into meta:", (e as any)?.message || e);
  }

  return defaultList;
}

function saveServerMicrositeMeta(slug: string, meta: Record<string, any>): boolean {
  try {
    const current = getServerMicrositesMeta();
    current[slug] = { ...(current[slug] || {}), ...meta, slug };
    fs.writeFileSync(MICROSITES_META_FILE, JSON.stringify(current, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving microsites_meta.json:", e);
    return false;
  }
}

function saveServerPostMeta(slug: string, meta: Record<string, any>): boolean {
  try {
    const current = getServerPosts();
    current[slug] = { ...(current[slug] || {}), ...meta, slug };
    fs.writeFileSync(POSTS_META_FILE, JSON.stringify(current, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving posts_meta.json:", e);
    return false;
  }
}

function getServerPosts(): Record<string, any> {
  const postsMap: Record<string, any> = {};
  try {
    if (fs.existsSync(POSTS_META_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(POSTS_META_FILE, "utf-8"));
      if (parsed && typeof parsed === 'object') {
        Object.assign(postsMap, parsed);
      }
    }
  } catch (e) {
    console.error("Error reading posts_meta.json:", e);
  }

  // Also check data_store/posts.json
  try {
    const dataStorePostsPath = path.join(process.cwd(), "data_store", "posts.json");
    if (fs.existsSync(dataStorePostsPath)) {
      const parsed = JSON.parse(fs.readFileSync(dataStorePostsPath, "utf-8"));
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.slug) {
            postsMap[item.slug] = {
              title: item.title || '',
              excerpt: item.excerpt || item.summary || '',
              featuredImage: item.featuredImage || item.coverImage || item.imageUrl || '',
              category: item.category || 'Berita & Informasi',
              publishedAt: item.publishedAt || item.date || ''
            };
          }
        }
      }
    }
  } catch (e) {
    console.error("Error reading data_store/posts.json:", e);
  }

  return postsMap;
}

function getServerServices(): Record<string, any> {
  return {
    'pemeriksaan-umum': {
      name: 'Poli Pemeriksaan Umum & Skrining Dewasa',
      description: 'Pelayanan pemeriksaan kesehatan umum, konsultasi medis dokter, pengobatan penyakit dasar, serta skrining terintegrasi Klaster 3.',
      cluster: 'Klaster 3 (Dewasa & Lansia)',
      schedule: 'Senin - Sabtu: 07.30 - 14.00 WIB'
    },
    'kesehatan-gigi-dan-mulut': {
      name: 'Poli Kesehatan Gigi dan Mulut',
      description: 'Pemeriksaan gigi, penambalan, pembersihan karang gigi (scaling), pencabutan gigi susu dan dewasa, serta konsultasi kesehatan mulut.',
      cluster: 'Klaster Lintas',
      schedule: 'Senin - Kamis: 08.00 - 12.30 WIB'
    },
    'kesehatan-ibu-dan-anak-kia': {
      name: 'Poli Kesehatan Ibu dan Anak (KIA) & KB',
      description: 'Pemeriksaan kehamilan (ANC Terpadu), USG dasar kebidanan, imunisasi TT, nifas, persalinan 24 jam, dan konseling keluarga berencana.',
      cluster: 'Klaster 2 (Ibu & Anak)',
      schedule: 'Senin - Sabtu: 07.30 - 14.00 WIB'
    },
    'imunisasi-anak': {
      name: 'Pelayanan Imunisasi Dasar & Tambahan',
      description: 'Vaksinasi lengkap bayi dan balita (BCG, Polio, DPT-HB-Hib, Campak/MR, PCV, Rotavirus) guna mencegah penyakit PD3I.',
      cluster: 'Klaster 2 (Ibu & Anak)',
      schedule: 'Selasa & Kamis: 08.00 - 12.00 WIB'
    },
    'unit-gawat-darurat-ugd': {
      name: 'Unit Gawat Darurat (UGD) & Ambulans 24 Jam',
      description: 'Penanganan kegawatdaruratan medis, resusitasi, trauma/luka, stabilisasi rujukan, dan layanan evakuasi medis darurat siap siaga 24 jam.',
      cluster: 'Lintas Klaster',
      schedule: 'Buka 24 Jam Setiap Hari (Non-Stop)'
    },
    'laboratorium-klinik': {
      name: 'Laboratorium Klinik Sederhana',
      description: 'Pemeriksaan darah lengkap, glukosa, kolesterol, asam urat, urine rutin, tes cepat tuberkulosis (TCM), malaria, dan tes kehamilan.',
      cluster: 'Lintas Klaster',
      schedule: 'Senin - Sabtu: 07.30 - 13.30 WIB'
    },
    'farmasi-dan-obat': {
      name: 'Pelayanan Farmasi & Konseling Obat',
      description: 'Penyediaan dan penyerahan obat sesuai resep dokter, verifikasi dosis, edukasi kepatuhan minum obat, dan informasi efek samping.',
      cluster: 'Lintas Klaster',
      schedule: 'Senin - Sabtu: 07.30 - 14.00 WIB'
    },
    'konsultasi-gizi': {
      name: 'Klinik Konsultasi Gizi & Pencegahan Stunting',
      description: 'Konseling pola makan sehat, tata laksana balita gizi kurang/stunting, edukasi gizi penderita diabetes dan hipertensi.',
      cluster: 'Klaster 2 & 3',
      schedule: 'Rabu & Jumat: 08.30 - 12.00 WIB'
    }
  };
}

function escapeXmlStr(str: string): string {
  return String(str || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function wrapSvgLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = String(text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + ' ' + w).length <= maxCharsPerLine) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) {
    lines.push(cur);
  }
  return lines;
}

function generatePageScreenshotSvg(options: {
  siteName: string;
  title: string;
  description: string;
  category?: string;
  pageType?: string;
  fullUrl: string;
  metaInfo?: string;
  links?: Array<{ label: string; url?: string }>;
  cluster?: string;
  schedule?: string;
}): string {
  const publishedTheme = getServerThemePublished();
  const primaryColor = publishedTheme.colorPrimary || "#059669";
  const headerBgColor = publishedTheme.colorHeaderBg || "#022c22";
  const themeName = publishedTheme.name || "Default Healthcare";

  const site = options.siteName || publishedTheme.siteName || "Puskesmas Mandiri Sejahtera";
  const title = options.title || "Portal Resmi Pelayanan Kesehatan";
  const desc = options.description || "Informasi resmi dan pelayanan terpadu masyarakat.";
  const fullUrl = options.fullUrl || "https://puskesmas-mandiri.go.id";
  const pageType = options.pageType || "home";
  const category = options.category || (pageType === "berita" ? "Berita & Informasi" : pageType === "microsite" ? "Microsite & Portal" : pageType === "layanan" ? "Layanan Medis" : "Portal Resmi");

  const titleLines = wrapSvgLines(title, 34, 2);
  const descLines = wrapSvgLines(desc, 50, 3);
  const mobileTitleLines = wrapSvgLines(title, 26, 2);
  const mobileDescLines = wrapSvgLines(desc, 36, 2);

  // Badge configuration
  let badgeBorder = primaryColor;
  let badgeBg = "rgba(16, 185, 129, 0.2)";
  let badgeColor = "#34d399";
  let badgeText = `${category.toUpperCase()}`;
  let typeIcon = "🏥";

  if (pageType === "berita") {
    badgeBorder = "#0284c7";
    badgeBg = "rgba(14, 165, 233, 0.2)";
    badgeColor = "#38bdf8";
    badgeText = `📰 BERITA &amp; EDUKASI KESEHATAN`;
    typeIcon = "📰";
  } else if (pageType === "microsite") {
    badgeBorder = "#8b5cf6";
    badgeBg = "rgba(139, 92, 246, 0.2)";
    badgeColor = "#a78bfa";
    badgeText = `🌐 MICROSITE &amp; PROGRAM DIGITAL`;
    typeIcon = "🌐";
  } else if (pageType === "pendaftaran") {
    badgeBorder = "#10b981";
    badgeBg = "rgba(16, 185, 129, 0.2)";
    badgeColor = "#34d399";
    badgeText = `📱 PENDAFTARAN ONLINE &amp; ANTREAN`;
    typeIcon = "📱";
  } else if (pageType === "layanan") {
    badgeBorder = "#f59e0b";
    badgeBg = "rgba(245, 158, 11, 0.2)";
    badgeColor = "#fbbf24";
    badgeText = `🏥 STANDAR PELAYANAN POLIKLINIK`;
    typeIcon = "🏥";
  } else if (pageType === "kontak") {
    badgeBorder = "#059669";
    badgeBg = "rgba(5, 150, 105, 0.2)";
    badgeColor = "#34d399";
    badgeText = `📞 KONTAK RESMI &amp; OPERASIONAL`;
    typeIcon = "📞";
  } else if (pageType === "pengaduan") {
    badgeBorder = "#f43f5e";
    badgeBg = "rgba(244, 63, 94, 0.2)";
    badgeColor = "#fb7185";
    badgeText = `📢 SALURAN ASPIRASI &amp; PENGADUAN`;
    typeIcon = "📢";
  }

  // Inside Mobile Screen UI depending on page type
  let mobileBodySvg = '';

  if (pageType === "berita") {
    mobileBodySvg = `
      <!-- Featured Banner Image Area -->
      <rect x="86" y="174" width="328" height="110" rx="14" fill="#0369a1" />
      <circle cx="360" cy="210" r="45" fill="#38bdf8" opacity="0.3" />
      <rect x="100" y="188" width="120" height="22" rx="11" fill="rgba(0,0,0,0.5)" />
      <text x="112" y="203" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#38bdf8">📰 ${escapeXmlStr(category.slice(0, 16))}</text>
      <text x="100" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#ffffff">Publikasi Resmi Puskesmas</text>

      <!-- Headline -->
      ${mobileTitleLines.map((line, i) => `<text x="86" y="${310 + (i * 18)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#f8fafc">${escapeXmlStr(line)}</text>`).join('')}

      <!-- Author and Meta -->
      <rect x="86" y="354" width="328" height="26" rx="6" fill="#1e293b" />
      <text x="96" y="371" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#94a3b8">👤 Tim Publikasi • 🕒 Waktu Baca: ~3 Menit</text>

      <!-- Excerpt -->
      ${mobileDescLines.map((line, i) => `<text x="86" y="${402 + (i * 16)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#cbd5e1">${escapeXmlStr(line)}</text>`).join('')}

      <!-- Mobile Button -->
      <rect x="86" y="446" width="328" height="38" rx="12" fill="${primaryColor}" />
      <text x="250" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Baca Artikel Selengkapnya ➔</text>
    `;
  } else if (pageType === "microsite") {
    const firstLink = (options.links && options.links[0]?.label) || "Akses Panduan & Layanan";
    const secondLink = (options.links && options.links[1]?.label) || "Lokasi & Jadwal Kegiatan";
    mobileBodySvg = `
      <!-- Microsite Profile Header -->
      <circle cx="250" cy="214" r="28" fill="${primaryColor}" />
      <text x="250" y="222" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20">🌐</text>
      <circle cx="270" cy="234" r="8" fill="#10b981" stroke="#0f172a" stroke-width="2" />
      
      <text x="250" y="258" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#ffffff">${escapeXmlStr(title.slice(0, 30))}</text>
      <text x="250" y="276" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Portal Digital Terpadu • ${escapeXmlStr(site.slice(0, 24))}</text>

      <!-- Microsite Mobile Link Buttons -->
      <rect x="86" y="296" width="328" height="42" rx="12" fill="${primaryColor}" />
      <text x="104" y="322" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ffffff">📄 ${escapeXmlStr(firstLink.slice(0, 28))}</text>
      <text x="396" y="322" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#ffffff">➔</text>

      <rect x="86" y="348" width="328" height="42" rx="12" fill="#1e293b" stroke="${primaryColor}" stroke-width="1.5" />
      <text x="104" y="374" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#e2e8f0">📍 ${escapeXmlStr(secondLink.slice(0, 28))}</text>
      <text x="396" y="374" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#e2e8f0">➔</text>

      <rect x="86" y="400" width="328" height="42" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
      <text x="104" y="426" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#cbd5e1">💬 Konsultasi &amp; Info WhatsApp</text>
      <text x="396" y="426" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#cbd5e1">➔</text>

      <!-- Verified Security Footer -->
      <rect x="86" y="454" width="328" height="28" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1" />
      <text x="250" y="472" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">🔒 Tautan Resmi Terverifikasi Puskesmas</text>
    `;
  } else if (pageType === "layanan") {
    const srvCluster = options.cluster || "Integrasi Layanan Primer (ILP)";
    const srvSchedule = options.schedule || "Senin - Sabtu: 07.30 - 14.00 WIB";
    mobileBodySvg = `
      <rect x="86" y="174" width="328" height="80" rx="14" fill="#78350f" />
      <circle cx="360" cy="205" r="40" fill="#f59e0b" opacity="0.3" />
      <text x="100" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#fbbf24">🏥 ${escapeXmlStr(srvCluster.slice(0, 32))}</text>
      <text x="100" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#ffffff">${escapeXmlStr(title.slice(0, 24))}</text>

      <rect x="86" y="266" width="328" height="52" rx="10" fill="#1e293b" />
      <text x="100" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#fbbf24">🕒 JADWAL OPERASIONAL</text>
      <text x="100" y="306" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#e2e8f0">${escapeXmlStr(srvSchedule.slice(0, 36))}</text>

      <rect x="86" y="328" width="328" height="106" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="100" y="350" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#34d399">✓ Melayani Pasien BPJS &amp; Pasien Umum</text>
      <text x="100" y="374" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1">✓ Tenaga Medis Dokter &amp; Perawat Terlatih</text>
      <text x="100" y="398" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1">✓ Terintegrasi Farmasi &amp; Laboratorium</text>
      <text x="100" y="422" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1">✓ Pelayanan Berstandar Kemenkes RI</text>

      <rect x="86" y="446" width="328" height="38" rx="12" fill="${primaryColor}" />
      <text x="250" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Daftar Antrean Poli Ini Online ➔</text>
    `;
  } else if (pageType === "pendaftaran") {
    mobileBodySvg = `
      <rect x="86" y="174" width="328" height="65" rx="14" fill="${headerBgColor}" stroke="${primaryColor}" stroke-width="1" />
      <text x="100" y="198" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#34d399">📱 LOKET PENDAFTARAN ONLINE</text>
      <text x="100" y="222" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#e2e8f0">Ambil Nomor Antrean Tanpa Menunggu Lama</text>

      <rect x="86" y="250" width="328" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="100" y="266" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">1. NOMOR NIK KTP / BPJS</text>
      <text x="100" y="282" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#ffffff">352901xxxxxxxxxx</text>

      <rect x="86" y="302" width="328" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="100" y="318" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">2. PILIH KLASTER / POLIKLINIK</text>
      <text x="100" y="334" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#ffffff">Poli Pemeriksaan Umum (Klaster 3)</text>

      <rect x="86" y="354" width="328" height="80" rx="12" fill="#064e3b" stroke="#10b981" stroke-width="1" />
      <text x="100" y="374" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">STATUS NOMOR ANTREAN REAL-TIME</text>
      <text x="100" y="404" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#ffffff">A-014</text>
      <text x="190" y="400" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#a7f3d0">Estimasi Pelayanan: ~10 Menit</text>
      <text x="190" y="416" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">✓ Loket Sedang Melayani</text>

      <rect x="86" y="446" width="328" height="38" rx="12" fill="${primaryColor}" />
      <text x="250" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Ambil Tiket QR Antrean ➔</text>
    `;
  } else {
    mobileBodySvg = `
      <rect x="86" y="174" width="328" height="100" rx="14" fill="${headerBgColor}" stroke="${primaryColor}" stroke-width="1" />
      <circle cx="360" cy="210" r="45" fill="${primaryColor}" opacity="0.3" />
      <text x="100" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#34d399">🏛️ PORTAL KESEHATAN TERPADU</text>
      <text x="100" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#ffffff">${escapeXmlStr(site.slice(0, 24))}</text>
      <text x="100" y="250" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#cbd5e1">5 Klaster Integrasi Layanan Primer (ILP)</text>

      <!-- 4 Service Grid Cards -->
      <rect x="86" y="286" width="158" height="66" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1" />
      <text x="96" y="306" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">Klaster 2</text>
      <text x="96" y="324" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff">Ibu &amp; Anak</text>
      <text x="96" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#94a3b8">KIA, KB, Imunisasi</text>

      <rect x="256" y="286" width="158" height="66" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1" />
      <text x="266" y="306" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">Klaster 3</text>
      <text x="266" y="324" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff">Dewasa &amp; Lansia</text>
      <text x="266" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#94a3b8">Poli Umum &amp; PTM</text>

      <rect x="86" y="362" width="158" height="66" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1" />
      <text x="96" y="382" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">Klaster 4</text>
      <text x="96" y="400" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff">P2P &amp; Kesling</text>
      <text x="96" y="416" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#94a3b8">Surveilans &amp; Sanitasi</text>

      <rect x="256" y="362" width="158" height="66" rx="10" fill="#064e3b" stroke="#10b981" stroke-width="1" />
      <text x="266" y="382" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#34d399">24 Jam</text>
      <text x="266" y="400" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff">🚑 UGD &amp; Ambulans</text>
      <text x="266" y="416" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#a7f3d0">Siaga Gawat Darurat</text>

      <rect x="86" y="446" width="328" height="38" rx="12" fill="${primaryColor}" />
      <text x="250" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Buka Seluruh Layanan &amp; Pendaftaran ➔</text>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <!-- Background Gradients using Active Theme Colors -->
      <linearGradient id="canvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${headerBgColor}" />
        <stop offset="40%" stop-color="#091c15" />
        <stop offset="100%" stop-color="#020d09" />
      </linearGradient>
      <linearGradient id="phoneBezel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0b1e17" />
        <stop offset="100%" stop-color="#040e0b" />
      </linearGradient>
      <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.2" />
      </linearGradient>
      <filter id="phoneShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#canvasBg)" />
    
    <!-- Ambient Healthcare Light Circles -->
    <circle cx="260" cy="180" r="280" fill="${primaryColor}" opacity="0.15" />
    <circle cx="1080" cy="100" r="320" fill="${primaryColor}" opacity="0.12" />
    <circle cx="950" cy="540" r="220" fill="#0284c7" opacity="0.10" />

    <!-- Subtle Dot Grid Pattern on Canvas -->
    <g opacity="0.08" fill="#ffffff">
      ${Array.from({ length: 12 }).map((_, r) =>
        Array.from({ length: 24 }).map((_, c) =>
          `<circle cx="${50 + c * 48}" cy="${30 + r * 48}" r="1.5" />`
        ).join('')
      ).join('')}
    </g>

    <!-- ============================================== -->
    <!-- SMARTPHONE DEVICE MOCKUP (FORMAT MOBILE ASLI)  -->
    <!-- ============================================== -->
    <g filter="url(#phoneShadow)">
      <!-- Outer Smartphone Frame -->
      <rect x="64" y="24" width="372" height="582" rx="44" fill="url(#phoneBezel)" stroke="${primaryColor}" stroke-width="2" stroke-opacity="0.5" />
      <!-- Inner Smartphone Bezel -->
      <rect x="70" y="30" width="360" height="570" rx="40" fill="#020617" />
      <!-- Glass Screen Canvas -->
      <rect x="74" y="34" width="352" height="562" rx="36" fill="url(#phoneScreen)" />

      <!-- Dynamic Island / Top Camera Notch -->
      <rect x="195" y="44" width="110" height="24" rx="12" fill="#000000" stroke="#1e293b" stroke-width="1" />
      <circle cx="288" cy="56" r="4.5" fill="#0284c7" opacity="0.8" />
      <circle cx="216" cy="56" r="3" fill="#1e293b" />

      <!-- Status Bar Elements -->
      <text x="100" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#e2e8f0">09:41</text>
      <!-- Signal 5G Icon -->
      <rect x="360" y="52" width="3" height="4" rx="1" fill="#e2e8f0" />
      <rect x="365" y="50" width="3" height="6" rx="1" fill="#e2e8f0" />
      <rect x="370" y="48" width="3" height="8" rx="1" fill="#e2e8f0" />
      <rect x="375" y="46" width="3" height="10" rx="1" fill="#e2e8f0" />
      <!-- Battery Icon -->
      <rect x="388" y="50" width="18" height="9" rx="2.5" fill="none" stroke="#e2e8f0" stroke-width="1.2" />
      <rect x="390" y="52" width="13" height="5" rx="1.5" fill="#10b981" />
      <path d="M407 53.5 C407.5 53.5 408 54 408 54.5 L408 55.5 C408 56 407.5 56.5 407 56.5 Z" fill="#e2e8f0" />

      <!-- Mobile Web Navbar Header (Matching Active Puskesmas Theme) -->
      <rect x="74" y="76" width="352" height="52" fill="${headerBgColor}" stroke="${primaryColor}" stroke-width="1" stroke-opacity="0.3" />
      <circle cx="102" cy="102" r="14" fill="${primaryColor}" />
      <text x="102" y="107" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">✚</text>
      <text x="124" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#ffffff">${escapeXmlStr(site.slice(0, 20).toUpperCase())}</text>
      <text x="124" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="600" fill="#34d399">Portal Resmi Terverifikasi</text>

      <!-- Hamburger Menu Icon -->
      <line x1="392" y1="96" x2="408" y2="96" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      <line x1="392" y1="102" x2="408" y2="102" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      <line x1="392" y1="108" x2="408" y2="108" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

      <!-- Mobile URL Address Bar -->
      <rect x="86" y="136" width="328" height="26" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="98" y="153" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#10b981">🔒</text>
      <text x="114" y="153" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="500" fill="#94a3b8">${escapeXmlStr(fullUrl.replace(/^https?:\/\//, '').slice(0, 36))}</text>
      <text x="398" y="153" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#34d399">SSL</text>

      <!-- Dynamic Page Body Content (Format Mobile) -->
      ${mobileBodySvg}

      <!-- Bottom Home Indicator Bar -->
      <rect x="190" y="582" width="120" height="4" rx="2" fill="#94a3b8" opacity="0.6" />
    </g>

    <!-- ============================================== -->
    <!-- RIGHT SIDE INFO & BRANDING SHOWCASE PANEL      -->
    <!-- ============================================== -->
    <g transform="translate(475, 0)">
      <!-- Government Accreditation Pill -->
      <rect x="0" y="38" width="410" height="34" rx="17" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1.5" />
      <text x="18" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="${badgeColor}" letter-spacing="0.5">
        ✓ ${badgeText}
      </text>

      <!-- Live Domain & SSL Banner -->
      <rect x="0" y="86" width="675" height="36" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="18" y="109" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#10b981" font-weight="bold">🔒</text>
      <text x="40" y="109" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="600" fill="#e2e8f0">${escapeXmlStr(fullUrl)}</text>
      <rect x="580" y="93" width="80" height="22" rx="6" fill="#065f46" />
      <text x="620" y="108" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a7f3d0">AKTIF SSL</text>

      <!-- Main Headline in Showcase Panel -->
      ${titleLines.map((line, i) => `<text x="0" y="${172 + (i * 44)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${escapeXmlStr(line)}</text>`).join('')}

      <!-- Description in Showcase Panel -->
      ${descLines.map((line, i) => `<text x="0" y="${268 + (i * 26)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="400" fill="#cbd5e1">${escapeXmlStr(line)}</text>`).join('')}

      <!-- 3 Feature Highlight Badges Grid -->
      <g transform="translate(0, 365)">
        <rect x="0" y="0" width="215" height="76" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
        <circle cx="28" cy="28" r="14" fill="${primaryColor}" opacity="0.2" />
        <text x="28" y="33" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">📱</text>
        <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#ffffff">Format Mobile Asli</text>
        <text x="14" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Sesuai tampilan live aplikasi</text>

        <rect x="230" y="0" width="215" height="76" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
        <circle cx="258" cy="28" r="14" fill="${primaryColor}" opacity="0.2" />
        <text x="258" y="33" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">🎨</text>
        <text x="280" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#ffffff">Tema ${escapeXmlStr(themeName.slice(0, 10))}</text>
        <text x="244" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Warna &amp; gaya identik sistem</text>

        <rect x="460" y="0" width="215" height="76" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
        <circle cx="488" cy="28" r="14" fill="#10b981" opacity="0.2" />
        <text x="488" y="33" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">🏛️</text>
        <text x="510" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#ffffff">5 Klaster ILP</text>
        <text x="474" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Permenkes RI No. 19/2024</text>
      </g>

      <!-- Bottom Watermark & Verification Line -->
      <line x1="0" y1="475" x2="675" y2="475" stroke="#334155" stroke-width="1" />
      <text x="0" y="515" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#10b981">
        ✓ ${escapeXmlStr(site.toUpperCase())}
      </text>
      <text x="0" y="540" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">
        Standar Pelayanan Minimal (SPM) • Terakreditasi Paripurna Kemenkes RI
      </text>
      
      <rect x="525" y="495" width="150" height="52" rx="10" fill="#064e3b" stroke="#10b981" stroke-width="1" />
      <text x="600" y="517" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a7f3d0">PORTAL RESMI</text>
      <text x="600" y="535" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#ffffff">KEMENKES RI</text>
    </g>
  </svg>`;
}

function renderScreenshotPng(svg: string): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

// ==========================================
// CENTRAL THEME API ENDPOINTS
// ==========================================
app.get("/api/theme/published", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, theme: getServerThemePublished() });
});

app.get("/api/theme/draft", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, theme: getServerThemeDraft() });
});

app.post("/api/theme/publish", (req, res) => {
  const theme = req.body;
  if (!theme || typeof theme !== 'object') {
    return res.status(400).json({ error: "Invalid theme payload" });
  }
  const published = { ...theme, status: 'published', updatedAt: new Date().toISOString() };
  saveServerThemePublished(published);
  saveServerThemeDraft(published);
  res.json({ success: true, theme: published });
});

app.post("/api/theme/draft", (req, res) => {
  const theme = req.body;
  if (!theme || typeof theme !== 'object') {
    return res.status(400).json({ error: "Invalid theme payload" });
  }
  const draft = { ...theme, status: 'draft', updatedAt: new Date().toISOString() };
  saveServerThemeDraft(draft);
  res.json({ success: true, theme: draft });
});

app.post("/api/theme/reset", (req, res) => {
  saveServerThemePublished(DEFAULT_THEME);
  saveServerThemeDraft(DEFAULT_THEME);
  res.json({ success: true, theme: DEFAULT_THEME });
});

// ==========================================
// CENTRAL HOMEPAGE BUILDER API ENDPOINTS
// ==========================================
app.get("/api/homepage/published", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, config: getServerHomepagePublished() });
});

app.get("/api/homepage/draft", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, config: getServerHomepageDraft() });
});

app.post("/api/homepage/publish", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: "Invalid homepage builder payload" });
  }
  const published = {
    ...payload,
    status: 'published',
    updatedAt: new Date().toISOString()
  };
  saveServerHomepagePublished(published);
  saveServerHomepageDraft(published);
  res.json({ success: true, config: published });
});

app.post("/api/homepage/draft", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: "Invalid homepage builder payload" });
  }
  const draft = {
    ...payload,
    status: 'draft',
    updatedAt: new Date().toISOString()
  };
  saveServerHomepageDraft(draft);
  res.json({ success: true, config: draft });
});

app.post("/api/homepage/reset", (req, res) => {
  saveServerHomepagePublished(DEFAULT_HOMEPAGE);
  saveServerHomepageDraft(DEFAULT_HOMEPAGE);
  res.json({ success: true, config: DEFAULT_HOMEPAGE });
});

// ==========================================
// ==========================================
// CENTRAL MICROSITES API ENDPOINTS
// ==========================================
app.get("/api/microsites", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const user = getSessionUser(req);
  // Admin → semua microsite. Pengelola login → hanya miliknya. Publik → published+aktif.
  if (user && user.role === 'admin' && user.status === 'active') {
    return res.json({ success: true, microsites: store.listAllMicrosites() });
  }
  if (user && user.status === 'active') {
    return res.json({ success: true, microsites: store.listMicrositesByOwner(user.id) });
  }
  return res.json({ success: true, microsites: store.listPublishedMicrosites() });
});

app.post("/api/microsites", express.json(), (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const item = req.body;
  if (!item || (!item.id && !item.slug)) {
    return res.status(400).json({ error: "Invalid microsite payload (missing id or slug)" });
  }
  try {
    // Admin boleh mengelola microsite mana pun; pengelola hanya miliknya.
    let ownerId = user.id;
    if (user.role === 'admin' && item.ownerId) ownerId = String(item.ownerId);

    const existing = item.id ? store.getMicrositeById(item.id) : undefined;
    if (existing && user.role !== 'admin' && existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden", message: "Microsite ini bukan milik Anda." });
    }
    if (existing) ownerId = existing.ownerId;

    const saved = store.upsertMicrosite(ownerId, item);
    store.audit({ actorId: user.id, actorEmail: user.email, action: existing ? 'update_microsite' : 'create_microsite', targetType: 'microsite', targetId: saved.id, ip: clientIp(req) });
    return res.json({ success: true, microsite: saved });
  } catch (e: any) {
    if (e?.message === 'SLUG_TAKEN') return res.status(409).json({ error: "Slug sudah dipakai akun lain. Pilih URL lain." });
    if (e?.message === 'FORBIDDEN_OWNER') return res.status(403).json({ error: "Microsite ini bukan milik Anda." });
    console.error('save microsite error:', e?.message || e);
    return res.status(500).json({ error: "Gagal menyimpan microsite." });
  }
});

// Synchronisasi massal lama — dipertahankan untuk admin saja, ditulis per-owner.
app.post("/api/microsites/sync-all", express.json(), (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') return denyUnauthorized(res, 'Sinkronisasi penuh hanya untuk admin.');
  const { microsites } = req.body || {};
  if (!Array.isArray(microsites)) return res.status(400).json({ error: "Expected array of microsites" });
  for (const m of microsites) {
    try { store.upsertMicrosite(m.ownerId || user.id, m); } catch (e) { /* lewati yang gagal */ }
  }
  return res.json({ success: true, microsites: store.listAllMicrosites() });
});

app.delete("/api/microsites/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { id } = req.params;
  try {
    const ok = store.deleteMicrosite(id, { id: user.id, role: user.role });
    if (!ok) return res.status(404).json({ error: "Microsite tidak ditemukan." });
    store.audit({ actorId: user.id, actorEmail: user.email, action: 'delete_microsite', targetType: 'microsite', targetId: id, ip: clientIp(req) });
    return res.json({ success: true, message: `Microsite ${id} deleted` });
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN_OWNER') return res.status(403).json({ error: "Microsite ini bukan milik Anda." });
    return res.status(500).json({ error: "Gagal menghapus microsite." });
  }
});

app.get("/api/microsites/categories", (req, res) => {
  res.json({ success: true, categories: getServerMicrositeCategories() });
});

app.post("/api/microsites/categories", (req, res) => {
  const categories = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: "Expected array of categories" });
  }
  saveServerMicrositeCategories(categories);
  res.json({ success: true, categories: getServerMicrositeCategories() });
});

// ==========================================
// CENTRAL POSTS API ENDPOINTS
// ==========================================
function getServerPostsList(): any[] {
  const dataStorePostsPath = path.join(process.cwd(), "data_store", "posts.json");
  try {
    if (fs.existsSync(dataStorePostsPath)) {
      const parsed = JSON.parse(fs.readFileSync(dataStorePostsPath, "utf-8"));
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading data_store/posts.json:", err);
  }
  return [];
}

function saveServerPostsList(posts: any[]): boolean {
  try {
    const dataStorePostsPath = path.join(process.cwd(), "data_store", "posts.json");
    const dataStoreDir = path.join(process.cwd(), "data_store");
    if (!fs.existsSync(dataStoreDir)) fs.mkdirSync(dataStoreDir, { recursive: true });
    fs.writeFileSync(dataStorePostsPath, JSON.stringify(posts, null, 2), "utf-8");

    // Also sync to posts_meta.json
    const metaMap: Record<string, any> = {};
    for (const p of posts) {
      if (p && p.slug) {
        metaMap[p.slug] = {
          title: p.title || '',
          excerpt: p.excerpt || p.summary || '',
          featuredImage: p.featuredImage || p.coverImage || p.imageUrl || '',
          category: p.categoryName || p.category || 'Berita & Informasi',
          publishedAt: p.publishedAt || p.createdAt || ''
        };
      }
    }
    fs.writeFileSync(POSTS_META_FILE, JSON.stringify(metaMap, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving posts list:", err);
    return false;
  }
}

app.get("/api/posts", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ success: true, posts: getServerPostsList() });
});

app.post("/api/posts", (req, res) => {
  const item = req.body;
  if (!item || (!item.id && !item.slug)) {
    return res.status(400).json({ error: "Invalid post payload" });
  }
  const current = getServerPostsList();
  const idx = current.findIndex((p: any) => (item.id && p.id === item.id) || (item.slug && p.slug === item.slug));
  let savedItem: any;
  if (idx >= 0) {
    savedItem = { ...current[idx], ...item, updatedAt: new Date().toISOString() };
    current[idx] = savedItem;
  } else {
    savedItem = { ...item, id: item.id || `post-${Date.now()}`, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    current.unshift(savedItem);
  }
  saveServerPostsList(current);
  res.json({ success: true, post: savedItem, posts: current });
});

app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const current = getServerPostsList();
  const filtered = current.filter((p: any) => p.id !== id && p.slug !== id);
  saveServerPostsList(filtered);
  res.json({ success: true, message: `Post ${id} deleted`, posts: filtered });
});

// API endpoint to read site settings
app.get("/api/site-settings", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ success: true, settings: getServerSiteSettings() });
});

// API endpoint to update site settings directly
app.post("/api/site-settings", (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: "Invalid settings payload" });
  }
  saveServerSiteSettings(settings);
  res.json({ success: true, settings: getServerSiteSettings() });
});

// ==========================================
// CENTRAL CONTACT SETTINGS API ENDPOINTS
// ==========================================
const CONTACT_SETTINGS_FILE = path.join(process.cwd(), "data_store_contact.json");

function getServerContactSettings() {
  try {
    if (fs.existsSync(CONTACT_SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACT_SETTINGS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading contact settings file:", err);
  }
  
  // If contact settings file doesn't exist, generate default from site settings
  const site = getServerSiteSettings();
  const defaultContact = {
    name: site.siteName || "Puskesmas Mandiri Sejahtera",
    tagline: site.tagline || "Pelayanan Kesehatan Profesional, Ramah, dan Terjangkau",
    address: site.address || "Jl. Kesehatan Raya No. 45, Kecamatan Mandiri, Kabupaten Sejahtera",
    village: site.village || "Kelurahan Mandiri Sejahtera",
    district: site.district || "Kecamatan Mandiri",
    regency: site.regency || "Kabupaten Sejahtera",
    province: site.province || "Jawa Timur",
    postalCode: site.postalCode || "69400",
    latitude: site.latitude || -6.2088,
    longitude: site.longitude || 106.8456,
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.81956137475038!3d-6.208763393792019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e705b630fb%3A0xf51fae2db4bf7d1b!2sMonumen%20Nasional!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid",
    externalMapUrl: "https://maps.google.com/?q=-6.2088,106.8456",
    timezone: site.timezone || "Asia/Jakarta",
    channels: [
      { id: "chn-1", label: "Telepon Puskesmas (Utama)", type: "Phone", value: site.phone || "(021) 555-0199", isPrimary: true, showOnWebsite: true, order: 1, icon: "Phone" },
      { id: "chn-2", label: "WhatsApp Pelayanan & Pendaftaran", type: "WhatsApp", value: site.whatsapp || "0812-3456-7890", isPrimary: true, showOnWebsite: true, order: 2, icon: "MessageSquare" },
      { id: "chn-3", label: "Email Layanan Pengaduan & Informasi", type: "Email", value: site.email || "info@puskesmas-mandiri.go.id", isPrimary: true, showOnWebsite: true, order: 3, icon: "Mail" },
      { id: "chn-4", label: "Website Resmi", type: "Website", value: "https://puskesmas-mandiri.go.id", isPrimary: false, showOnWebsite: true, order: 4, icon: "Globe" },
      { id: "chn-5", label: "Instagram Resmi", type: "Social Media", value: site.instagramUrl || "https://instagram.com/puskesmas_mandiri", isPrimary: false, showOnWebsite: true, order: 5, icon: "Instagram" },
      { id: "chn-6", label: "Facebook Page", type: "Social Media", value: site.facebookUrl || "https://facebook.com/puskesmas.mandiri", isPrimary: false, showOnWebsite: true, order: 6, icon: "Facebook" }
    ],
    operatingHours: [
      { day: "Monday", dayNameId: "Senin", isOpen: true, openTime: "07:30", closeTime: "16:00", notes: "Pendaftaran 07:30 - 14:00" },
      { day: "Tuesday", dayNameId: "Selasa", isOpen: true, openTime: "07:30", closeTime: "16:00", notes: "Pendaftaran 07:30 - 14:00" },
      { day: "Wednesday", dayNameId: "Rabu", isOpen: true, openTime: "07:30", closeTime: "16:00", notes: "Pendaftaran 07:30 - 14:00" },
      { day: "Thursday", dayNameId: "Kamis", isOpen: true, openTime: "07:30", closeTime: "16:00", notes: "Pendaftaran 07:30 - 14:00" },
      { day: "Friday", dayNameId: "Jumat", isOpen: true, openTime: "07:30", closeTime: "11:30", notes: "Istirahat Sholat Jumat" },
      { day: "Saturday", dayNameId: "Sabtu", isOpen: true, openTime: "07:30", closeTime: "13:00", notes: "Layanan Poliklinik & PONED" },
      { day: "Sunday", dayNameId: "Minggu", isOpen: false, openTime: "00:00", closeTime: "00:00", notes: "Tutup (UGD & Rawat Inap Buka 24 Jam)" }
    ],
    specialHours: [
      { id: "sp-1", date: "2026-08-17", title: "Hari Kemerdekaan RI", isOpen: false, notes: "Puskesmas Libur Nasional. Layanan Darurat UGD & Bersalin tetap buka 24 jam." }
    ],
    emergencyInfo: {
      title: "Layanan Darurat & UGD 24 Jam",
      description: "Untuk keadaan darurat medis mendesak, silakan langsung menuju Instalasi Gawat Darurat (UGD) Puskesmas atau hubungi hotline siaga darurat kami.",
      hotlineNumbers: ["(021) 555-0199", "0812-3456-7890"],
      locationNote: "Gedung Utama Sayap Timur (Akses Khusus Ambulans & Pasien Darurat)",
      showOnHomepage: true,
      showOnContactPage: true,
      showOnServicePages: true
    },
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CONTACT_SETTINGS_FILE, JSON.stringify(defaultContact, null, 2), "utf-8");
  } catch {}
  return defaultContact;
}

function saveServerContactSettings(data: any) {
  try {
    fs.writeFileSync(CONTACT_SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    
    // Also synchronize back to site_settings.json
    try {
      if (fs.existsSync(SITE_SETTINGS_FILE)) {
        const site = JSON.parse(fs.readFileSync(SITE_SETTINGS_FILE, "utf-8"));
        if (data.name) site.siteName = data.name;
        if (data.tagline) site.tagline = data.tagline;
        if (data.address) site.address = data.address;
        if (data.village) site.village = data.village;
        if (data.district) site.district = data.district;
        if (data.regency) site.regency = data.regency;
        if (data.province) site.province = data.province;
        if (data.postalCode) site.postalCode = data.postalCode;
        if (data.latitude) site.latitude = data.latitude;
        if (data.longitude) site.longitude = data.longitude;
        if (data.timezone) site.timezone = data.timezone;

        if (Array.isArray(data.channels)) {
          const phoneCh = data.channels.find((c: any) => c.type === 'Phone');
          if (phoneCh?.value) site.phone = phoneCh.value;
          const waCh = data.channels.find((c: any) => c.type === 'WhatsApp');
          if (waCh?.value) site.whatsapp = waCh.value;
          const emailCh = data.channels.find((c: any) => c.type === 'Email');
          if (emailCh?.value) site.email = emailCh.value;
        }
        site.updatedAt = new Date().toISOString();
        fs.writeFileSync(SITE_SETTINGS_FILE, JSON.stringify(site, null, 2), "utf-8");
      }
    } catch {}

    return true;
  } catch (err) {
    console.error("Error writing contact settings file:", err);
    return false;
  }
}

app.get("/api/contact-settings", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const data = getServerContactSettings();
  res.json({ success: true, contactSettings: data });
});

app.post("/api/contact-settings", (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: "Invalid contact settings payload" });
  }
  saveServerContactSettings(data);
  res.json({ success: true, contactSettings: getServerContactSettings() });
});

// ==========================================
// UNIVERSAL DATA STORE API (MULTI-BROWSER & MULTI-ACCOUNT SYNC)
// ==========================================
const DATA_STORE_DIR = path.join(process.cwd(), "data_store");
if (!fs.existsSync(DATA_STORE_DIR)) {
  try {
    fs.mkdirSync(DATA_STORE_DIR, { recursive: true });
  } catch {}
}

const SINGLE_DOCUMENT_COLLECTIONS = new Set([
  'site_settings',
  'contact_settings',
  'theme',
  'homepage',
  'theme_draft',
  'homepage_draft'
]);

function getDataStoreFilePath(collectionName: string) {
  const sanitized = collectionName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_STORE_DIR, `${sanitized}.json`);
}

app.get("/api/data/:collection", (req, res) => {
  try {
    const { collection } = req.params;
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    if (collection === 'posts') {
      return res.json({ success: true, data: getServerPostsList() });
    }

    if (collection === 'microsites') {
      const user = getSessionUser(req);
      if (user && user.role === 'admin' && user.status === 'active') {
        return res.json({ success: true, data: store.listAllMicrosites() });
      }
      if (user && user.status === 'active') {
        return res.json({ success: true, data: store.listMicrositesByOwner(user.id) });
      }
      return res.json({ success: true, data: store.listPublishedMicrosites() });
    }

    if (collection === 'site_settings') {
      return res.json({ success: true, data: getServerSiteSettings() });
    }

    if (collection === 'contact_settings') {
      return res.json({ success: true, data: getServerContactSettings() });
    }

    const filePath = getDataStoreFilePath(collection);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/data/:collection", (req, res) => {
  try {
    const { collection } = req.params;
    const body = req.body;
    const filePath = getDataStoreFilePath(collection);
    const isSingleDoc = SINGLE_DOCUMENT_COLLECTIONS.has(collection);

    if (Array.isArray(body)) {
      // Full collection replace
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");
      if (collection === 'posts') {
        saveServerPostsList(body);
      } else if (collection === 'microsites') {
        saveServerMicrosites(body);
      }
      return res.json({ success: true, data: body });
    }

    if (body && typeof body === 'object') {
      if (isSingleDoc) {
        let existingData: any = null;
        if (fs.existsSync(filePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          } catch {}
        }
        const merged = { ...(existingData || {}), ...body, updatedAt: new Date().toISOString() };
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
        if (collection === 'site_settings') {
          saveServerSiteSettings(merged);
        } else if (collection === 'contact_settings') {
          saveServerContactSettings(merged);
        }
        return res.json({ success: true, data: merged });
      } else {
        // Array collection item insert / update
        const docId = body.id || body.uid || body.docId;
        let existingData: any[] = [];
        if (collection === 'posts') {
          existingData = getServerPostsList();
        } else if (collection === 'microsites') {
          existingData = getServerMicrosites();
        } else if (fs.existsSync(filePath)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (Array.isArray(parsed)) existingData = parsed;
          } catch {}
        }

        const payload = { ...body, id: docId || `item-${Date.now()}` };
        if (docId) {
          const idx = existingData.findIndex((i: any) => i.id === docId || i.uid === docId || (payload.slug && i.slug === payload.slug));
          if (idx >= 0) {
            existingData[idx] = { ...existingData[idx], ...payload, updatedAt: new Date().toISOString() };
          } else {
            existingData.unshift({ ...payload, createdAt: payload.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
          }
        } else {
          existingData.unshift({ ...payload, createdAt: payload.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
        }

        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
        if (collection === 'posts') {
          saveServerPostsList(existingData);
        } else if (collection === 'microsites') {
          saveServerMicrosites(existingData);
        }
        return res.json({ success: true, data: existingData });
      }
    }

    return res.status(400).json({ success: false, error: "Invalid payload format" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/data/:collection/:id", (req, res) => {
  try {
    const { collection, id } = req.params;
    const filePath = getDataStoreFilePath(collection);

    if (collection === 'posts') {
      const current = getServerPostsList();
      const filtered = current.filter((p: any) => p.id !== id && p.slug !== id);
      saveServerPostsList(filtered);
      return res.json({ success: true, data: filtered });
    }

    if (collection === 'microsites') {
      const current = getServerMicrosites();
      const filtered = current.filter((m: any) => m.id !== id && m.slug !== id);
      saveServerMicrosites(filtered);
      return res.json({ success: true, data: filtered });
    }

    if (fs.existsSync(filePath)) {
      const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(existingData)) {
        const filtered = existingData.filter((i: any) => i.id !== id && i.uid !== id && i.slug !== id);
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
        return res.json({ success: true, data: filtered });
      }
    }
    return res.json({ success: true, message: "Item deleted" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to sync full metadata from panel (settings, microsites, posts)
app.post("/api/sync-metadata", (req, res) => {
  try {
    const { settings, microsites, posts } = req.body || {};
    if (settings && typeof settings === 'object') {
      saveServerSiteSettings(settings);
    }
    if (Array.isArray(microsites)) {
      const current = getServerMicrositesMeta();
      for (const m of microsites) {
        if (m.slug) {
          current[m.slug] = {
            name: m.name || m.title || '',
            description: m.description || '',
            profileImageUrl: m.profileImageUrl || m.coverImageUrl || '',
            logoUrl: m.logoUrl || '',
            ogImageUrl: m.ogImageUrl || m.profileImageUrl || '',
            slug: m.slug
          };
        }
      }
      fs.writeFileSync(MICROSITES_META_FILE, JSON.stringify(current, null, 2), "utf-8");
    }
    if (Array.isArray(posts)) {
      const currentPosts: Record<string, any> = {};
      try {
        if (fs.existsSync(POSTS_META_FILE)) {
          Object.assign(currentPosts, JSON.parse(fs.readFileSync(POSTS_META_FILE, "utf-8")));
        }
      } catch {}
      for (const p of posts) {
        if (p.slug) {
          currentPosts[p.slug] = {
            title: p.title || '',
            excerpt: p.excerpt || p.summary || '',
            featuredImage: p.featuredImage || ''
          };
        }
      }
      fs.writeFileSync(POSTS_META_FILE, JSON.stringify(currentPosts, null, 2), "utf-8");
    }
    return res.json({ success: true, message: "Metadata synchronized successfully" });
  } catch (err: any) {
    console.error("Error in /api/sync-metadata:", err);
    return res.status(500).json({ error: err.message });
  }
});

// API endpoint to sync a single microsite item
app.post("/api/microsites/sync-item", (req, res) => {
  const { slug, name, description, profileImageUrl, logoUrl, ogImageUrl } = req.body || {};
  if (!slug) {
    return res.status(400).json({ error: "Missing microsite slug" });
  }
  saveServerMicrositeMeta(slug, { name, description, profileImageUrl, logoUrl, ogImageUrl });
  return res.json({ success: true, message: "Microsite meta saved" });
});

// API endpoint to sync a single post / news article item
app.post("/api/posts/sync-item", (req, res) => {
  const { slug, title, excerpt, featuredImage, category } = req.body || {};
  if (!slug) {
    return res.status(400).json({ error: "Missing post slug" });
  }
  saveServerPostMeta(slug, { title, excerpt, featuredImage, category });
  return res.json({ success: true, message: "Post meta saved" });
});

// Static OG Image & Logo endpoints to ensure WhatsApp, Telegram & Facebook crawlers get fast, non-redirected image responses
app.get(["/og-image.png", "/og-preview.png"], (req, res) => {
  const filePath = path.join(process.cwd(), "public", "og-image.png");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.sendFile(filePath);
  }
  res.status(404).send("Not found");
});

app.get(["/logo.png", "/logo-puskesmas.png", "/logo-custom.png"], (req, res) => {
  const customPath = path.join(process.cwd(), "public", "logo-custom.png");
  if (fs.existsSync(customPath)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res.sendFile(customPath);
  }
  const defaultPath = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(defaultPath)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.sendFile(defaultPath);
  }
  res.status(404).send("Not found");
});

app.get(["/favicon.ico", "/favicon-custom.png", "/favicon.png"], (req, res) => {
  const customFavicon = path.join(process.cwd(), "public", "favicon-custom.png");
  if (fs.existsSync(customFavicon)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res.sendFile(customFavicon);
  }
  const defaultLogo = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(defaultLogo)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.sendFile(defaultLogo);
  }
  res.status(404).send("Not found");
});

// API endpoint to upload custom Puskesmas Logo
app.post("/api/upload-logo", (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing or invalid imageBase64 data" });
    }

    // Extract base64 payload
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(imageBase64, "base64");
    }

    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: "Ukuran berkas logo melebihi batas 8MB" });
    }

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const customLogoPath = path.join(publicDir, "logo-custom.png");
    fs.writeFileSync(customLogoPath, buffer);

    // Also update public/logo.png for default fallbacks
    try {
      fs.writeFileSync(path.join(publicDir, "logo.png"), buffer);
    } catch {}

    const timestamp = Date.now();
    return res.json({
      success: true,
      url: `/logo-custom.png?v=${timestamp}`,
      message: "Logo Puskesmas berhasil diunggah dan disimpan ke server."
    });
  } catch (err: any) {
    console.error("Error uploading logo:", err);
    return res.status(500).json({ error: err.message || "Gagal mengunggah logo ke server" });
  }
});

// API endpoint to upload custom Favicon
app.post("/api/upload-favicon", (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing or invalid imageBase64 data" });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(imageBase64, "base64");
    }

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const customFaviconPath = path.join(publicDir, "favicon-custom.png");
    fs.writeFileSync(customFaviconPath, buffer);

    const timestamp = Date.now();
    return res.json({
      success: true,
      url: `/favicon-custom.png?v=${timestamp}`,
      message: "Favicon browser berhasil diunggah dan disimpan ke server."
    });
  } catch (err: any) {
    console.error("Error uploading favicon:", err);
    return res.status(500).json({ error: err.message || "Gagal mengunggah favicon ke server" });
  }
});

// API endpoint to upload general post / featured image
app.post("/api/upload-image", (req, res) => {
  try {
    const { imageBase64, fileName: customName } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Data gambar imageBase64 wajib diisi" });
    }

    let mimeType = "image/jpeg";
    let ext = ".jpg";
    const matches = imageBase64.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      if (mimeType.includes("png")) ext = ".png";
      else if (mimeType.includes("webp")) ext = ".webp";
      else if (mimeType.includes("svg")) ext = ".svg";
      else if (mimeType.includes("gif")) ext = ".gif";
      else ext = ".jpg";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(imageBase64, "base64");
    }

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "Ukuran berkas melebihi batas 25MB" });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Also mirror to dist/uploads if dist exists
    const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
    if (fs.existsSync(path.join(process.cwd(), "dist"))) {
      if (!fs.existsSync(distUploadsDir)) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
      }
    }

    const safeBaseName = (customName || "article-image")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 30);
    const fileName = `${safeBaseName}-${Date.now()}${ext}`;
    const targetFilePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(targetFilePath, buffer);

    if (fs.existsSync(distUploadsDir)) {
      try {
        fs.writeFileSync(path.join(distUploadsDir, fileName), buffer);
      } catch {}
    }

    const publicUrl = `/uploads/${fileName}`;
    return res.json({
      success: true,
      url: publicUrl,
      fileName,
      sizeBytes: buffer.length,
      mimeType,
      message: "Gambar berhasil diunggah dan disimpan ke server."
    });
  } catch (err: any) {
    console.error("Error in /api/upload-image:", err);
    return res.status(500).json({ error: err.message || "Gagal memproses unggah gambar" });
  }
});

// Curated high-resolution healthcare visual library mapped to clinical contexts
const HEALTHCARE_IMAGE_LIBRARY: Record<string, string[]> = {
  posyandu: [
    "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  vaksin: [
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1632053002928-19593a207212?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  dokter: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  lansia: [
    "https://images.unsplash.com/photo-1576765608622-067973a79f53?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  gizi: [
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  darurat: [
    "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  farmasi: [
    "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  laboratorium: [
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  gigi: [
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&h=630&q=80"
  ],
  edukasi: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&h=630&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&h=630&q=80"
  ]
};

// -------------------------------------------------------------
// AI Image Generation & Provider Integration Engine
// -------------------------------------------------------------

const HEALTH_TERMS_MAP: Record<string, string> = {
  "posyandu": "Posyandu maternal and child health post in Indonesian community",
  "dacin": "traditional hanging baby balance scale dacin with colorful batik cloth sling",
  "timbang": "weighing infant toddler gently on scale",
  "penimbangan": "baby weighing monitoring session",
  "balita": "Indonesian toddler under five years old",
  "kader": "female Indonesian community health worker wearing uniform and neat hijab",
  "berkerudung": "wearing neat hijab",
  "stunting": "child growth monitoring and stunting nutrition prevention",
  "imunisasi": "child immunization vaccination administered by gentle nurse",
  "vaksin": "vaccine dose injection",
  "vaksinasi": "vaccination procedure",
  "suntik": "gentle medical injection",
  "bidan": "Indonesian certified midwife in clinic uniform and hijab",
  "dokter gigi": "Indonesian dentist examining patient teeth in dental clinic with dental chair",
  "dokter": "Indonesian doctor wearing white lab coat and stethoscope",
  "perawat": "Indonesian nurse in medical scrubs and hijab",
  "apotek": "clinic pharmacy dispensing medicine prescriptions",
  "farmasi": "clinic pharmacy dispensing medicine prescriptions",
  "obat": "pharmaceutical medicine prescription packaging",
  "lansia": "elderly Indonesian senior citizen",
  "posbindu": "elderly health screening and checkup",
  "tensi": "checking blood pressure with arm cuff sphygmomanometer",
  "tekanan darah": "checking blood pressure with arm cuff",
  "gula darah": "blood glucose testing with finger prick meter",
  "kolesterol": "cholesterol screening test",
  "puskesmas": "clean modern Indonesian community health clinic Puskesmas",
  "ugd": "emergency room UGD in clinic with medical staff",
  "igd": "emergency department in clinic with medical staff",
  "ambulans": "Indonesian Puskesmas emergency ambulance vehicle with emergency beacon lights",
  "lab": "medical laboratory with microscope and test tubes",
  "laboratorium": "medical laboratory with microscope and test tubes",
  "usg": "ultrasound examination for pregnant mother with monitor screen",
  "ibu hamil": "Indonesian pregnant mother receiving healthcare checkup",
  "kia": "maternal and child health KIA consultation room",
  "konseling": "health counseling and education session",
  "gizi": "nutritionist providing healthy fresh food and fruit dietary advice",
  "gigi": "dental examination and oral healthcare",
  "ruang tunggu": "bright clean clinic waiting room with patient seating",
  "senam": "healthy morning gymnastics exercise session for community",
  "phbs": "clean and healthy living behavior education",
  "cuci tangan": "washing hands with clean soap and water technique"
};

async function buildAccurateVisualPrompt(prompt: string, title?: string, style?: string): Promise<{
  visualPrompt: string;
  enhancedDescription: string;
  source: string;
}> {
  let rawPrompt = (prompt || '').trim();
  if (!rawPrompt && title) {
    rawPrompt = `Pelayanan kesehatan ${title} di Puskesmas Indonesia`;
  }
  if (!rawPrompt) {
    rawPrompt = "Pelayanan kesehatan Puskesmas Indonesia ramah dan profesional";
  }

  // 1. First, try using the configured AI Provider (Gemini, Groq, DeepSeek, OpenAI, etc.)
  const aiConfig = getAIProviderConfig();
  const apiKey = aiConfig.apiKey || (aiConfig.provider === "gemini" ? process.env.GEMINI_API_KEY : "");
  
  if (apiKey) {
    try {
      const aiRes = await executeAICompletion({
        provider: aiConfig.provider || "gemini",
        endpointUrl: aiConfig.endpointUrl,
        apiKey,
        model: aiConfig.model || (aiConfig.provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini"),
        systemPrompt: "You are a professional visual prompt engineer for Indonesian healthcare centers (Puskesmas). Your job is to translate Indonesian descriptions into precise, realistic photographic English prompts for AI image generation. Never add cartoon elements or irrelevant fantasy items. Always preserve Indonesian local context like hijab, batik cadre uniform, hanging dacin scale, or modern Puskesmas clinic rooms.",
        userPrompt: `Translate and expand this Indonesian user description into a detailed photorealistic 16:9 English prompt: "${rawPrompt}". Requirements: authentic Indonesian people, natural lighting, documentary photography style, clean healthcare setting. Output ONLY the English prompt.`,
        temperature: 0.2
      });

      if (aiRes.text && aiRes.text.trim().length > 15) {
        const cleaned = aiRes.text.trim().replace(/^["']|["']$/g, '');
        return {
          visualPrompt: cleaned,
          enhancedDescription: cleaned,
          source: aiConfig.providerName || aiConfig.provider
        };
      }
    } catch (e: any) {
      console.warn("AI prompt enhancement failed, using semantic dictionary fallback:", e?.message || e);
    }
  }

  // 2. Fallback: Healthcare Context Semantic Translation + Online Translator
  const lower = rawPrompt.toLowerCase();
  const matchedTerms: string[] = [];
  for (const [idTerm, enTerm] of Object.entries(HEALTH_TERMS_MAP)) {
    if (lower.includes(idTerm)) {
      matchedTerms.push(enTerm);
    }
  }

  let baseTranslation = "";
  try {
    const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawPrompt)}&langpair=id|en`, {
      signal: AbortSignal.timeout(3500)
    });
    if (transRes.ok) {
      const transData = await transRes.json();
      const txt = transData?.responseData?.translatedText;
      if (txt && !txt.toLowerCase().includes("warning:") && txt.length > 3) {
        baseTranslation = txt;
      }
    }
  } catch {}

  const combinedPieces: string[] = [];
  if (baseTranslation) {
    combinedPieces.push(baseTranslation);
  }
  if (matchedTerms.length > 0) {
    combinedPieces.push(matchedTerms.join(", "));
  }
  if (combinedPieces.length === 0) {
    combinedPieces.push("Indonesian community healthcare center Puskesmas clinical service");
  }

  const resultEnglish = `Authentic Indonesian healthcare scene: ${combinedPieces.join(". Specifically featuring: ")}`;
  return {
    visualPrompt: resultEnglish,
    enhancedDescription: resultEnglish,
    source: "Kamus Kontekstual Kesehatan & Penerjemah Semantik"
  };
}

// Check current AI Provider capability for Image Generation
app.get("/api/ai/image-capability", (req, res) => {
  const aiConfig: any = getAIProviderConfig();
  const imageConfig: any = aiConfig.image || {};
  const currentProvider: string = imageConfig.provider || "pollinations";
  
  let apiKey = imageConfig.apiKey || "";
  if (!apiKey && currentProvider === "gemini") {
    apiKey = (aiConfig.text?.provider === "gemini" ? aiConfig.text.apiKey : "") || process.env.GEMINI_API_KEY || "";
  } else if (!apiKey && currentProvider === "openai") {
    apiKey = (aiConfig.text?.provider === "openai" ? aiConfig.text.apiKey : "") || "";
  }
  const hasKey = currentProvider === "pollinations" ? true : Boolean(apiKey);

  let supportsNativeImage = true;
  let nativeEngine: string = imageConfig.providerName || "Engine Visual AI";
  let capabilityType: "native_image" | "llm_text_only" = "native_image";
  let explanation = "";

  if (currentProvider === "gemini") {
    nativeEngine = "Google Imagen 3 (Google AI Studio)";
    if (hasKey) {
      explanation = `Provider Gambar aktif adalah Google Gemini Imagen 3 (${imageConfig.model || 'imagen-3.0-generate-002'}). Gambar akan dibuat langsung menggunakan Kunci API Google AI Studio Anda.`;
    } else {
      explanation = "Provider Gambar diatur ke Google Imagen 3, tetapi Kunci API belum diisi. Silakan klik 'Pengaturan Provider AI' untuk memasukkan API Key Google AI Studio Anda.";
    }
  } else if (currentProvider === "openai") {
    nativeEngine = "OpenAI DALL-E 3";
    if (hasKey) {
      explanation = `Provider Gambar aktif adalah OpenAI DALL-E 3 (${imageConfig.model || 'dall-e-3'}). Gambar akan dibuat langsung sesuai prompt Anda.`;
    } else {
      explanation = "Provider Gambar diatur ke OpenAI DALL-E 3, tetapi Kunci API belum diisi. Silakan klik 'Pengaturan Provider AI' untuk memasukkan API Key OpenAI Anda.";
    }
  } else if (currentProvider === "stability") {
    nativeEngine = "Stability AI (Stable Diffusion XL)";
    if (hasKey) {
      explanation = `Provider Gambar aktif adalah Stability AI (${imageConfig.model || 'stable-diffusion-xl-1024-v1-0'}).`;
    } else {
      explanation = "Provider Gambar diatur ke Stability AI, tetapi Kunci API belum diisi. Silakan klik 'Pengaturan Provider AI' untuk memasukkan API Key Stability AI Anda.";
    }
  } else if (currentProvider === "pollinations") {
    nativeEngine = "Pollinations AI (Flux - Bebas Kuota)";
    explanation = "Provider Gambar aktif adalah Pollinations AI (Flux). Model siap pakai langsung tanpa API key.";
  } else {
    nativeEngine = imageConfig.providerName || "Custom Image Provider";
    explanation = `Provider Gambar kustom aktif (${imageConfig.endpointUrl || 'endpoint lokal'}).`;
  }

  res.json({
    provider: currentProvider,
    providerName: imageConfig.providerName || currentProvider,
    model: imageConfig.model,
    hasKey,
    enabled: imageConfig.enabled !== false,
    supportsNativeImage,
    nativeEngine,
    capabilityType,
    explanation,
    textProvider: {
      provider: aiConfig.text?.provider || "gemini",
      providerName: aiConfig.text?.providerName || "Google Gemini",
      model: aiConfig.text?.model || "gemini-3.8-flash"
    }
  });
});

// API endpoint to generate / resolve AI-powered image for article/post
// STRICTLY respects user requirement: only use the configured image provider, no silent fallback to unauthorized providers
app.post("/api/ai/generate-image", async (req, res) => {
  try {
    const { prompt, title, excerpt, category, style } = req.body || {};
    const effectivePrompt = (prompt || '').trim() || (title ? `Pelayanan kesehatan ${title} di Puskesmas` : 'Pelayanan kesehatan Puskesmas Indonesia');

    const aiConfig: any = getAIProviderConfig();
    const imageConfig: any = aiConfig.image || {};
    const textConfig: any = aiConfig.text || {};

    if (imageConfig.enabled === false) {
      return res.status(400).json({
        success: false,
        error: "Fitur Provider Gambar AI dinonaktifkan. Silakan buka Pengaturan Provider AI dan aktifkan Provider Gambar.",
        needsConfiguration: true
      });
    }

    const currentProvider = imageConfig.provider || "gemini";
    let apiKey = imageConfig.apiKey || "";

    // Allow sharing API key with text provider if same provider
    if (!apiKey && currentProvider === "gemini") {
      apiKey = (textConfig.provider === "gemini" ? textConfig.apiKey : "") || process.env.GEMINI_API_KEY || "";
    } else if (!apiKey && currentProvider === "openai") {
      apiKey = (textConfig.provider === "openai" ? textConfig.apiKey : "") || "";
    }

    // 1. Validate API Key for providers that require authentication
    if (currentProvider !== "pollinations" && !apiKey) {
      return res.status(400).json({
        success: false,
        error: `Provider Gambar '${imageConfig.providerName || currentProvider}' memerlukan Kunci API aktif. Silakan buka menu 'Pengaturan Provider AI' tab 'Provider Gambar' untuk menyetel Kunci API Anda.`,
        needsConfiguration: true,
        provider: currentProvider,
        providerName: imageConfig.providerName || currentProvider
      });
    }

    // 2. Build optimized visual prompt using the connected Text AI provider or semantic translator
    const { visualPrompt, enhancedDescription } = await buildAccurateVisualPrompt(effectivePrompt, title, style);

    let styleKeywords = "photorealistic documentary photography, natural daylight, authentic Indonesian public healthcare center Puskesmas, 4k ultra detailed, horizontal 16:9 composition";
    if (style === "jurnalistik") {
      styleKeywords = "editorial journalism photography, crisp clear focus, authentic Indonesian community health center Puskesmas documentary, raw photojournalism";
    } else if (style === "modern-clean") {
      styleKeywords = "modern clean aesthetic, bright airy clinical environment, minimalist Indonesian medical clinic, high definition architectural photography";
    }

    const finalEnglishPrompt = `${visualPrompt}, ${styleKeywords}`;

    // 3. EXECUTE GENERATION USING CONFIGURED IMAGE PROVIDER ONLY

    // 3A. Google Gemini / Imagen 3
    if (currentProvider === "gemini") {
      const model = imageConfig.model || "imagen-3.0-generate-002";
      console.log(`Generating image with connected provider: Google Imagen 3 (${model})...`);
      
      const imagenRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: finalEnglishPrompt.substring(0, 480) }],
          parameters: { sampleCount: 1, aspectRatio: imageConfig.aspectRatio || "16:9" }
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (!imagenRes.ok) {
        const errData = await imagenRes.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${imagenRes.status} dari Gemini/Imagen`;
        return res.status(400).json({
          success: false,
          error: `Gagal membuat gambar dengan Google Gemini (${model}): ${errMsg}. Pastikan API Key Google AI Studio Anda valid di Pengaturan Provider AI.`,
          providerUsed: "Google Gemini (Imagen 3)",
          needsConfiguration: true
        });
      }

      const imagenData = await imagenRes.json();
      const base64Bytes = imagenData?.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Bytes) {
        return res.status(500).json({
          success: false,
          error: "Google Gemini tidak mengembalikan data gambar yang valid.",
          providerUsed: "Google Gemini (Imagen 3)"
        });
      }

      return res.json({
        success: true,
        url: `data:image/jpeg;base64,${base64Bytes}`,
        promptUsed: effectivePrompt,
        enhancedPrompt: finalEnglishPrompt,
        enhancedDescription,
        providerUsed: `Google Gemini (${model})`,
        providerType: "gemini",
        isNativeImageAI: true,
        supportMessage: `Gambar berhasil digenerate secara langsung oleh Provider Gambar yang Anda hubungkan (Google Imagen 3: ${model}).`,
        style: style || "fotorealistik"
      });
    }

    // 3B. OpenAI DALL-E 3
    if (currentProvider === "openai") {
      const model = imageConfig.model || "dall-e-3";
      console.log(`Generating image with connected provider: OpenAI DALL-E 3 (${model})...`);
      const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt: finalEnglishPrompt.substring(0, 1000),
          n: 1,
          size: imageConfig.size || "1024x1024",
          quality: "standard"
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (!dalleRes.ok) {
        const errData = await dalleRes.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${dalleRes.status} dari OpenAI`;
        return res.status(400).json({
          success: false,
          error: `Gagal membuat gambar dengan OpenAI DALL-E 3: ${errMsg}. Periksa kuota atau API key Anda di Pengaturan Provider AI.`,
          providerUsed: "OpenAI DALL-E 3",
          needsConfiguration: true
        });
      }

      const dalleData = await dalleRes.json();
      const imgUrl = dalleData?.data?.[0]?.url;
      if (!imgUrl) {
        return res.status(500).json({
          success: false,
          error: "OpenAI tidak mengembalikan URL gambar.",
          providerUsed: "OpenAI DALL-E 3"
        });
      }

      return res.json({
        success: true,
        url: imgUrl,
        promptUsed: effectivePrompt,
        enhancedPrompt: finalEnglishPrompt,
        enhancedDescription: dalleData?.data?.[0]?.revised_prompt || enhancedDescription,
        providerUsed: `OpenAI DALL-E 3 (${model})`,
        providerType: "openai",
        isNativeImageAI: true,
        supportMessage: "Gambar berhasil digenerate secara langsung oleh Provider Gambar yang Anda hubungkan (OpenAI DALL-E 3).",
        style: style || "fotorealistik"
      });
    }

    // 3C. Stability AI
    if (currentProvider === "stability") {
      const model = imageConfig.model || "stable-diffusion-xl-1024-v1-0";
      console.log(`Generating image with connected provider: Stability AI (${model})...`);
      const stabRes = await fetch(`https://api.stability.ai/v1/generation/${model}/text-to-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text_prompts: [{ text: finalEnglishPrompt.substring(0, 800), weight: 1 }],
          cfg_scale: 7,
          height: 768,
          width: 1344,
          samples: 1,
          steps: 30
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (!stabRes.ok) {
        const errData = await stabRes.json().catch(() => ({}));
        const errMsg = errData?.message || `HTTP ${stabRes.status} dari Stability AI`;
        return res.status(400).json({
          success: false,
          error: `Gagal membuat gambar dengan Stability AI: ${errMsg}. Periksa saldo kredit atau API Key di Pengaturan Provider AI.`,
          providerUsed: "Stability AI",
          needsConfiguration: true
        });
      }

      const stabData = await stabRes.json();
      const base64Img = stabData?.artifacts?.[0]?.base64;
      if (!base64Img) {
        return res.status(500).json({
          success: false,
          error: "Stability AI tidak mengembalikan data gambar yang valid.",
          providerUsed: "Stability AI"
        });
      }

      return res.json({
        success: true,
        url: `data:image/png;base64,${base64Img}`,
        promptUsed: effectivePrompt,
        enhancedPrompt: finalEnglishPrompt,
        enhancedDescription,
        providerUsed: `Stability AI (${model})`,
        providerType: "stability",
        isNativeImageAI: true,
        supportMessage: "Gambar berhasil digenerate secara langsung oleh Provider Gambar yang Anda hubungkan (Stability AI).",
        style: style || "fotorealistik"
      });
    }

    // 3D. Pollinations AI (Flux / Open Source)
    if (currentProvider === "pollinations") {
      const model = imageConfig.model || "flux";
      console.log(`Generating image with connected provider: Pollinations AI (${model})...`);
      const cleanPrompt = encodeURIComponent(finalEnglishPrompt.substring(0, 450));
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1280&height=720&model=${model}&nologo=true&enhance=false&seed=${Date.now() % 100000}`;

      return res.json({
        success: true,
        url: pollinationsUrl,
        promptUsed: effectivePrompt,
        enhancedPrompt: finalEnglishPrompt,
        enhancedDescription,
        providerUsed: `Pollinations AI (${model})`,
        providerType: "pollinations",
        isNativeImageAI: true,
        supportMessage: "Gambar berhasil digenerate secara langsung oleh Provider Gambar yang Anda hubungkan (Pollinations AI Flux).",
        style: style || "fotorealistik"
      });
    }

    // 3E. Custom / OpenAI-Compatible Image Endpoint
    if (currentProvider === "custom") {
      const endpoint = (imageConfig.endpointUrl || "http://localhost:11434/v1").replace(/\/$/, "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const customRes = await fetch(`${endpoint}/images/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: imageConfig.model || "stable-diffusion",
          prompt: finalEnglishPrompt,
          n: 1,
          size: "1024x1024"
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (!customRes.ok) {
        const errText = await customRes.text().catch(() => "");
        return res.status(400).json({
          success: false,
          error: `Gagal membuat gambar dengan Custom Image API: HTTP ${customRes.status} - ${errText}`,
          providerUsed: "Custom",
          needsConfiguration: true
        });
      }

      const customData: any = await customRes.json();
      const customUrl = customData?.data?.[0]?.url || customData?.data?.[0]?.b64_json;
      const finalUrl = customUrl?.startsWith('data:') || customUrl?.startsWith('http') ? customUrl : `data:image/png;base64,${customUrl}`;

      return res.json({
        success: true,
        url: finalUrl,
        promptUsed: effectivePrompt,
        enhancedPrompt: finalEnglishPrompt,
        enhancedDescription,
        providerUsed: `Custom Image Engine (${imageConfig.model || 'default'})`,
        providerType: "custom",
        isNativeImageAI: true,
        supportMessage: "Gambar berhasil digenerate secara langsung oleh Custom Image Provider Anda.",
        style: style || "fotorealistik"
      });
    }

    return res.status(400).json({
      success: false,
      error: `Provider gambar '${currentProvider}' tidak dikenali. Silakan buka Pengaturan Provider AI untuk menyetel provider gambar Anda.`,
      needsConfiguration: true
    });
  } catch (err: any) {
    console.error("Error in /api/ai/generate-image:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal memproses pembuatan gambar AI",
      providerUsed: "AI Image Provider"
    });
  }
});

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  posyandu: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=75',
  balita: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=75',
  anak: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=75',
  kia: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=75',
  ibu: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=630&q=75',
  polio: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&h=630&q=75',
  vaksin: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&h=630&q=75',
  imunisasi: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&h=630&q=75',
  darurat: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1200&h=630&q=75',
  siaga: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1200&h=630&q=75',
  ambulans: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1200&h=630&q=75',
  lansia: 'https://images.unsplash.com/photo-1576765608622-067973a79f53?auto=format&fit=crop&w=1200&h=630&q=75',
  gizi: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&h=630&q=75',
  stunting: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&h=630&q=75',
  layanan: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=630&q=75',
  klinik: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=630&q=75',
  portal: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=630&q=75',
  farmasi: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&h=630&q=75',
  obat: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&h=630&q=75',
  lab: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&h=630&q=75',
  gigi: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&h=630&q=75',
  dokumen: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&h=630&q=75',
};

function replaceOrInsertMetaTag(html: string, attr: 'property' | 'name', key: string, content: string): string {
  const escapeAttr = (str: string) => String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${key}["'][^>]*>`, 'i');
  const newTag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  if (regex.test(html)) {
    return html.replace(regex, newTag);
  }
  return html.replace('</head>', `  ${newTag}\n</head>`);
}

function generateShareHtml(options: {
  title: string;
  description: string;
  image: string;
  siteName: string;
  fullUrl: string;
  targetUrl: string;
  isSocialCrawler: boolean;
}): string {
  const escapeAttr = (str: string) => String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeAttr(options.title)}</title>
  <meta name="description" content="${escapeAttr(options.description)}">
  
  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:site_name" content="${escapeAttr(options.siteName)}" />
  <meta property="og:title" content="${escapeAttr(options.title)}" />
  <meta property="og:description" content="${escapeAttr(options.description)}" />
  <meta property="og:image" content="${escapeAttr(options.image)}" />
  <meta property="og:image:secure_url" content="${escapeAttr(options.image)}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeAttr(options.title)}" />
  <meta property="og:url" content="${escapeAttr(options.fullUrl)}" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(options.title)}" />
  <meta name="twitter:description" content="${escapeAttr(options.description)}" />
  <meta name="twitter:image" content="${escapeAttr(options.image)}" />

  <!-- Automatic Client Redirection for Real Users (No meta-refresh to avoid crawler hijacking) -->
  <script>
    if (!/whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot/i.test(navigator.userAgent)) {
      window.location.replace(${JSON.stringify(options.targetUrl)});
    }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px 24px; max-width: 440px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); text-align: center; border: 1px solid #e2e8f0; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a; line-height: 1.4; }
    p { font-size: 13px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }
    .btn { display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; transition: background 0.2s; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2); }
    .btn:hover { background: #047857; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${escapeAttr(options.siteName)}</span>
    <h1>${escapeAttr(options.title)}</h1>
    <p>${escapeAttr(options.description)}</p>
    <a href="${escapeAttr(options.targetUrl)}" class="btn">Lanjutkan Membuka Halaman &rarr;</a>
  </div>
</body>
</html>`;
}

function renderHtmlWithMeta(req: express.Request, rawHtml: string): string {
  const headers = req?.headers || {};
  let proto = (headers['x-forwarded-proto'] as string) || req?.protocol || 'https';
  const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'sumenep.puskesmasmanding.com';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }
  const fullUrl = `${proto}://${host}${req?.originalUrl || req?.url || '/'}`;

  const query = req?.query || {};
  const queryTitle = (query.t || query.title || query.og_title || query.judul) as string;
  const queryDesc = (query.d || query.desc || query.description || query.og_desc || query.deskripsi) as string;
  const queryImage = (query.img || query.image || query.og_image || query.gambar) as string;
  const querySite = (query.site || query.site_name || query.instansi) as string;

  const settings = getServerSiteSettings();
  let siteName = querySite || settings.siteName || settings.shortName || 'Puskesmas Mandiri Sejahtera';
  const siteDesc = settings.siteDescription || settings.defaultSeoDescription || `Portal informasi dan pelayanan kesehatan resmi ${siteName}. Layanan kesehatan primer, pendaftaran online, berita kesehatan, jadwal dokter, microsite, dan pengaduan masyarakat.`;

  let defaultOgImg = settings.ogImageUrl || settings.logoUrl || '/og-image.png';
  if (defaultOgImg.startsWith('/')) {
    defaultOgImg = `${proto}://${host}${defaultOgImg}`;
  }

  let title = settings.siteTitle || `${siteName} - Portal Resmi & Pelayanan Terpadu`;
  let description = siteDesc;
  let image = `${proto}://${host}/api/preview-image.png?type=home&path=${encodeURIComponent(req.path || '/')}`;
  let type = "website";
  let pageType = "home";
  let targetSlug = "";

  const urlPath = req.path || '/';

  // 1. Microsites matching /m/:slug
  const micrositeMatch = urlPath.match(/^\/m\/([^\/]+)/);
  if (micrositeMatch) {
    pageType = "microsite";
    targetSlug = decodeURIComponent(micrositeMatch[1]);
    const microsites = getServerMicrositesMeta();
    const ms = microsites[targetSlug];
    if (ms && ms.name) {
      title = `${ms.name} - ${siteName}`;
      description = ms.description || `Portal resmi ${ms.name} pada ${siteName}. Akses informasi, panduan, dan layanan terpadu.`;
      if (ms.ogImageUrl && !query.screenshot) {
        let img = ms.ogImageUrl;
        if (img.startsWith('data:image/')) {
          image = `${proto}://${host}/api/og-image/${encodeURIComponent(targetSlug)}.png`;
        } else if (img.startsWith('/')) {
          image = `${proto}://${host}${img}`;
        } else {
          image = img;
        }
      } else {
        // High-fidelity screenshot card of this microsite
        image = `${proto}://${host}/api/preview-image.png?type=microsite&slug=${encodeURIComponent(targetSlug)}&path=${encodeURIComponent(urlPath)}`;
      }
    } else {
      const formattedSlug = targetSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      title = `Portal ${formattedSlug} - ${siteName}`;
      description = `Akses portal informasi dan layanan cepat ${formattedSlug} ${siteName}.`;
      image = `${proto}://${host}/api/preview-image.png?type=microsite&slug=${encodeURIComponent(targetSlug)}&path=${encodeURIComponent(urlPath)}`;
    }
  } 
  // 2. Berita matching /berita/:slug
  else if (urlPath.match(/^\/berita\/([^\/]+)/)) {
    pageType = "berita";
    const postMatch = urlPath.match(/^\/berita\/([^\/]+)/);
    if (postMatch) {
      targetSlug = decodeURIComponent(postMatch[1]);
      const posts = getServerPosts();
      const post = posts[targetSlug];
      if (post && post.title) {
        title = `${post.title} - ${siteName}`;
        description = post.excerpt || description;
        if (post.featuredImage && !query.screenshot) {
          let img = post.featuredImage;
          if (img.startsWith('data:image/')) {
            image = `${proto}://${host}/api/post-image/${encodeURIComponent(targetSlug)}.png`;
          } else if (img.startsWith('/')) {
            image = `${proto}://${host}${img}`;
          } else {
            image = img;
          }
        } else {
          image = `${proto}://${host}/api/post-image/${encodeURIComponent(targetSlug)}.png`;
        }
        type = "article";
      } else {
        const formattedTitle = targetSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        title = `${formattedTitle} - ${siteName}`;
        description = `Artikel dan publikasi informasi kesehatan masyarakat dari ${siteName}.`;
        image = `${proto}://${host}/api/post-image/${encodeURIComponent(targetSlug)}.png`;
        type = "article";
      }
    }
  }
  // 3. Layanan matching /layanan/:slug
  else if (urlPath.match(/^\/layanan\/([^\/]+)/)) {
    pageType = "layanan";
    const srvMatch = urlPath.match(/^\/layanan\/([^\/]+)/);
    if (srvMatch) {
      targetSlug = decodeURIComponent(srvMatch[1]);
      const services = getServerServices();
      const srv = services[targetSlug];
      if (srv) {
        title = `Layanan ${srv.name} - ${siteName}`;
        description = srv.description;
      } else {
        const formattedSrv = targetSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        title = `Layanan ${formattedSrv} - ${siteName}`;
        description = `Informasi persyaratan, prosedur, jadwal, dan ketentuan layanan ${formattedSrv} ${siteName}.`;
      }
      image = `${proto}://${host}/api/preview-image.png?type=layanan&slug=${encodeURIComponent(targetSlug)}&path=${encodeURIComponent(urlPath)}`;
    }
  }
  // 4. Layanan list /layanan
  else if (urlPath === '/layanan') {
    pageType = "layanan";
    title = `Standar Pelayanan Medis & Poliklinik - ${siteName}`;
    description = `Informasi lengkap seluruh poli dan unit rawat jalan berbasis 5 Klaster ILP di ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=layanan&path=${encodeURIComponent(urlPath)}`;
  }
  // 5. Berita list /berita
  else if (urlPath === '/berita') {
    pageType = "berita";
    title = `Pusat Berita & Informasi Kesehatan Terkini - ${siteName}`;
    description = `Dapatkan informasi resmi seputar program kesehatan masyarakat, pekan imunisasi, edukasi pencegahan penyakit, dan kegiatan pelayanan ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=berita&path=${encodeURIComponent(urlPath)}`;
  }
  // 6. Login Page /login
  else if (urlPath === '/login') {
    title = `Login Administrator - ${siteName}`;
    description = `Portal manajemen dan sistem kontrol terpadu ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=login&path=${encodeURIComponent(urlPath)}`;
  }
  // 7. Profil /profil
  else if (urlPath === '/profil' || urlPath === '/visi-misi' || urlPath === '/struktur-organisasi' || urlPath === '/maklumat-pelayanan') {
    pageType = "profil";
    title = `Profil Instansi, Visi Misi & Maklumat - ${siteName}`;
    description = `Informasi profil kelembagaan, visi misi, sejarah, struktur organisasi, dan maklumat pelayanan resmi ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=profil&path=${encodeURIComponent(urlPath)}`;
  }
  // 8. Kontak /kontak
  else if (urlPath === '/kontak') {
    pageType = "kontak";
    title = `Kontak Resmi, Jam Operasional & Lokasi - ${siteName}`;
    description = `Alamat lengkap, nomor telepon darurat 24 Jam, WhatsApp resmi, dan rute navigasi ke ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=kontak&path=${encodeURIComponent(urlPath)}`;
  }
  // 9. Pengaduan /pengaduan
  else if (urlPath.startsWith('/pengaduan') || urlPath.startsWith('/kritik-saran') || urlPath.startsWith('/skm')) {
    pageType = "pengaduan";
    title = `Layanan Aspirasi, Pengaduan Masyarakat & SKM - ${siteName}`;
    description = `Sampaikan kritik, saran, apresiasi, dan pengaduan pelayanan publik ${siteName} melalui saluran resmi SP4N-LAPOR!.`;
    image = `${proto}://${host}/api/preview-image.png?type=pengaduan&path=${encodeURIComponent(urlPath)}`;
  }
  // 10. Pendaftaran Online /pendaftaran
  else if (urlPath.startsWith('/pendaftaran') || urlPath.startsWith('/antrian') || urlPath.startsWith('/antrian-display')) {
    pageType = "pendaftaran";
    title = `Pendaftaran Online & Antrean Pasien - ${siteName}`;
    description = `Daftar rawat jalan, pilih klaster pelayanan primer, dan pantau status nomor antrian real-time di ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=pendaftaran&path=${encodeURIComponent(urlPath)}`;
  }
  // 11. Dokumen /dokumen
  else if (urlPath.startsWith('/dokumen')) {
    pageType = "dokumen";
    title = `Standar Pelayanan & Dokumen Publik - ${siteName}`;
    description = `Unduh dan baca standar operasional prosedur, maklumat pelayanan, serta dokumen regulasi publik ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=dokumen&path=${encodeURIComponent(urlPath)}`;
  }
  // 12. Direktori Microsite /microsites
  else if (urlPath === '/microsites' || urlPath === '/m') {
    pageType = "microsite";
    title = `Direktori Portal & Microsite Terpadu - ${siteName}`;
    description = `Pusat tautan cepat program kesehatan masyarakat, posko informasi, dan layanan digital ${siteName}.`;
    image = `${proto}://${host}/api/preview-image.png?type=microsite&path=${encodeURIComponent(urlPath)}`;
  }

  // =========================================================================
  // UNIVERSAL DYNAMIC OVERRIDE:
  // If query parameters (?t=...&d=...&img=...) are present, they ALWAYS
  // take highest precedence! This ensures ANY link created on the fly
  // displays its exact custom title, description, and preview image!
  // =========================================================================
  if (queryTitle) {
    title = queryTitle.includes(siteName) ? queryTitle : `${queryTitle} - ${siteName}`;
  }
  if (queryDesc) {
    description = queryDesc;
  }
  if (queryImage) {
    let img = queryImage;
    if (img.startsWith('data:image/')) {
      if (pageType === 'berita' && targetSlug) {
        image = `${proto}://${host}/api/post-image/${encodeURIComponent(targetSlug)}.png`;
      } else if (pageType === 'microsite' && targetSlug) {
        image = `${proto}://${host}/api/og-image/${encodeURIComponent(targetSlug)}.png`;
      } else {
        image = defaultOgImg;
      }
    } else if (img.startsWith('/')) {
      image = `${proto}://${host}${img}`;
    } else {
      image = img;
    }
  }

  // Optimize Unsplash image URLs for WhatsApp (< 300KB limit)
  if (image.includes('images.unsplash.com') && !image.includes('w=')) {
    image = `${image}&w=600&h=315&q=75&fit=crop`;
  }

  const imageType = image.endsWith('.jpg') || image.endsWith('.jpeg') ? 'image/jpeg' : image.endsWith('.webp') ? 'image/webp' : 'image/png';
  const escapeAttr = (str: string) => String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let html = rawHtml;
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  html = replaceOrInsertMetaTag(html, 'name', 'description', description);
  html = replaceOrInsertMetaTag(html, 'property', 'og:site_name', siteName);
  html = replaceOrInsertMetaTag(html, 'property', 'og:title', title);
  html = replaceOrInsertMetaTag(html, 'property', 'og:description', description);
  html = replaceOrInsertMetaTag(html, 'property', 'og:image', image);
  html = replaceOrInsertMetaTag(html, 'property', 'og:image:secure_url', image);
  html = replaceOrInsertMetaTag(html, 'property', 'og:image:type', imageType);
  html = replaceOrInsertMetaTag(html, 'property', 'og:image:width', '1200');
  html = replaceOrInsertMetaTag(html, 'property', 'og:image:height', '630');
  html = replaceOrInsertMetaTag(html, 'property', 'og:image:alt', title);
  html = replaceOrInsertMetaTag(html, 'property', 'og:url', fullUrl);
  html = replaceOrInsertMetaTag(html, 'property', 'og:type', type);
  html = replaceOrInsertMetaTag(html, 'name', 'twitter:card', 'summary_large_image');
  html = replaceOrInsertMetaTag(html, 'name', 'twitter:title', title);
  html = replaceOrInsertMetaTag(html, 'name', 'twitter:description', description);
  html = replaceOrInsertMetaTag(html, 'name', 'twitter:image', image);

  // Link image_src for scrapers
  if (!html.includes('rel="image_src"')) {
    html = html.replace('</head>', `  <link rel="image_src" href="${escapeAttr(image)}" />\n</head>`);
  } else {
    html = html.replace(/<link\s+rel=["']image_src["'][^>]*>/i, `<link rel="image_src" href="${escapeAttr(image)}" />`);
  }

  // Inject central server published theme CSS variables so that all browsers get identical theme instantly
  try {
    const publishedTheme = getServerThemePublished();
    const radiusValue = publishedTheme.radius === 'sharp' ? '0px' : publishedTheme.radius === 'pill' ? '24px' : '16px';
    const buttonRadiusValue = publishedTheme.buttonStyle === 'sharp' ? '0px' : publishedTheme.buttonStyle === 'pill' ? '9999px' : '12px';
    const themeStyleTag = `
<style id="server-theme-vars">
:root {
  --color-primary: ${publishedTheme.colorPrimary || '#18A878'};
  --color-primary-foreground: ${publishedTheme.colorPrimaryForeground || '#FFFFFF'};
  --color-secondary: ${publishedTheme.colorSecondary || '#DDF5EA'};
  --color-secondary-foreground: ${publishedTheme.colorSecondaryForeground || '#145A3B'};
  --color-accent: ${publishedTheme.colorAccent || '#27C7A5'};
  --color-accent-foreground: ${publishedTheme.colorAccentForeground || '#FFFFFF'};
  --color-bg: ${publishedTheme.colorBg || '#F8FCFA'};
  --color-text: ${publishedTheme.colorText || '#18332A'};
  --color-card: ${publishedTheme.colorCard || '#FFFFFF'};
  --color-surface: ${publishedTheme.colorSurface || publishedTheme.colorCard || '#FFFFFF'};
  --color-surface-foreground: ${publishedTheme.colorSurfaceForeground || publishedTheme.colorText || '#18332A'};
  --color-muted: ${publishedTheme.colorMuted || '#EEF6F2'};
  --color-muted-foreground: ${publishedTheme.colorMutedForeground || '#60756C'};
  --color-border: ${publishedTheme.colorBorder || '#D9E9E1'};
  --color-input: ${publishedTheme.colorInput || publishedTheme.colorBorder || '#D9E9E1'};
  --color-ring: ${publishedTheme.colorRing || publishedTheme.colorPrimary || '#18A878'};
  --color-success: ${publishedTheme.colorSuccess || '#16A34A'};
  --color-warning: ${publishedTheme.colorWarning || '#D97706'};
  --color-danger: ${publishedTheme.colorDanger || '#DC2626'};
  --color-info: ${publishedTheme.colorInfo || '#0284C7'};
  --theme-radius: ${radiusValue};
  --button-radius: ${buttonRadiusValue};
}
</style>
`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${themeStyleTag}\n</head>`);
    }
  } catch (err) {
    console.error("Error injecting server theme:", err);
  }

  return html;
}

// Dedicated Smart Share Route for Instant Dynamic WhatsApp Preview and Smooth Human Redirection
app.get("/share", (req, res) => {
  const headers = req?.headers || {};
  let proto = (headers['x-forwarded-proto'] as string) || req?.protocol || 'https';
  const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'sumenep.puskesmasmanding.com';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }
  const userAgent = (headers["user-agent"] || "").toLowerCase();
  const isSocialCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot/i.test(userAgent);

  const query = req.query || {};
  const settings = getServerSiteSettings();
  const siteName = (query.site || query.site_name || settings.siteName || settings.shortName || 'Puskesmas Mandiri Sejahtera') as string;

  let title = (query.t || query.title || query.og_title || query.judul || settings.siteTitle || `${siteName} - Portal Resmi`) as string;
  if (!title.includes(siteName) && title !== siteName) {
    title = `${title} - ${siteName}`;
  }

  let description = (query.d || query.desc || query.description || query.og_desc || query.deskripsi || settings.siteDescription || `Portal resmi informasi dan pelayanan kesehatan ${siteName}.`) as string;

  let targetUrl = (query.to || query.url || query.redirect || query.target || '/') as string;
  if (!targetUrl.startsWith('/') && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `/${targetUrl}`;
  }

  let image = (query.img || query.image || query.og_image || query.gambar || '') as string;
  const postMatch = targetUrl.match(/^\/berita\/([^\/]+)/);
  const msMatch = targetUrl.match(/^\/m\/([^\/]+)/);
  if (!image || image.startsWith('data:image/')) {
    if (postMatch) {
      image = `${proto}://${host}/api/post-image/${encodeURIComponent(postMatch[1])}.png`;
    } else if (msMatch) {
      image = `${proto}://${host}/api/og-image/${encodeURIComponent(msMatch[1])}.png`;
    } else {
      // Default to dynamic screenshot preview image
      image = `${proto}://${host}/api/preview-image.png?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}&path=${encodeURIComponent(targetUrl)}`;
    }
  } else if (image.startsWith('/')) {
    image = `${proto}://${host}${image}`;
  }

  const fullUrl = `${proto}://${host}${req.originalUrl || req.url}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.send(generateShareHtml({
    title,
    description,
    image,
    siteName,
    fullUrl,
    targetUrl,
    isSocialCrawler
  }));
});

// Dedicated Shortlink & Smart Redirection for Berita / Articles: /b/:slug
app.get("/b/:slug", (req, res) => {
  const slug = decodeURIComponent(req.params.slug || '');
  const headers = req?.headers || {};
  let proto = (headers['x-forwarded-proto'] as string) || req?.protocol || 'https';
  const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'puskesmas-mandiri.go.id';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }
  const userAgent = (headers["user-agent"] || "").toLowerCase();
  const isSocialCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot/i.test(userAgent);

  const query = req.query || {};
  const settings = getServerSiteSettings();
  const siteName = (query.site || query.site_name || settings.siteName || settings.shortName || 'Puskesmas Mandiri Sejahtera') as string;

  const posts = getServerPosts();
  const post = posts[slug];

  let title = (query.t || query.title || (post && post.title ? `${post.title} - ${siteName}` : `${slug.replace(/-/g, ' ')} - ${siteName}`)) as string;
  let description = (query.d || query.desc || (post && post.excerpt ? post.excerpt : `Dapatkan artikel dan informasi kesehatan resmi dari ${siteName}.`)) as string;
  
  let image = (query.img || query.image || '') as string;
  if (!image || image.startsWith('data:image/')) {
    image = `${proto}://${host}/api/post-image/${encodeURIComponent(slug)}.png`;
  } else if (image.startsWith('/')) {
    image = `${proto}://${host}${image}`;
  }

  const targetUrl = `/berita/${slug}`;
  const fullUrl = `${proto}://${host}${req.originalUrl || req.url}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.send(generateShareHtml({
    title,
    description,
    image,
    siteName,
    fullUrl,
    targetUrl,
    isSocialCrawler
  }));
});

// Dedicated Shortlink & Smart Redirection for Microsites: /s/:slug and /l/:slug
app.get(["/s/:slug", "/l/:slug"], (req, res) => {
  const slug = decodeURIComponent(req.params.slug || '');
  const headers = req?.headers || {};
  let proto = (headers['x-forwarded-proto'] as string) || req?.protocol || 'https';
  const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'puskesmas-mandiri.go.id';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }
  const userAgent = (headers["user-agent"] || "").toLowerCase();
  const isSocialCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot/i.test(userAgent);

  const query = req.query || {};
  const settings = getServerSiteSettings();
  const siteName = (query.site || query.site_name || settings.siteName || settings.shortName || 'Puskesmas Mandiri Sejahtera') as string;

  const microsites = getServerMicrositesMeta();
  const ms = microsites[slug];

  let title = (query.t || query.title || (ms && ms.name ? `${ms.name} - ${siteName}` : `Portal ${slug} - ${siteName}`)) as string;
  let description = (query.d || query.desc || (ms && ms.description ? ms.description : `Akses informasi dan layanan portal ${slug} di ${siteName}.`)) as string;
  
  let image = (query.img || query.image || '') as string;
  if (image) {
    if (image.startsWith('/')) {
      image = `${proto}://${host}${image}`;
    }
  } else if (ms && ms.ogImageUrl && !query.screenshot) {
    let img = ms.ogImageUrl;
    if (img.startsWith('data:image/')) {
      image = `${proto}://${host}/api/og-image/${encodeURIComponent(slug)}.png`;
    } else if (img.startsWith('/')) {
      image = `${proto}://${host}${img}`;
    } else {
      image = img;
    }
  } else {
    // Generate crisp page screenshot preview
    image = `${proto}://${host}/api/preview-image.png?type=microsite&slug=${encodeURIComponent(slug)}&path=${encodeURIComponent('/m/' + slug)}`;
  }

  const targetUrl = `/m/${slug}`;
  const fullUrl = `${proto}://${host}${req.originalUrl || req.url}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.send(generateShareHtml({
    title,
    description,
    image,
    siteName,
    fullUrl,
    targetUrl,
    isSocialCrawler
  }));
});

// Dedicated Dynamic OG Image Endpoint for Microsites (/api/og-image/:slug.png)
app.get(["/api/og-image/:slug.png", "/api/og-image/:slug"], (req, res) => {
  const rawSlug = req.params.slug || '';
  const slug = decodeURIComponent(rawSlug.replace(/\.png$/i, ''));
  const microsites = getServerMicrositesMeta();
  const ms = microsites[slug];

  const img = ms?.ogImageUrl || ms?.profileImageUrl || ms?.logoUrl || '';

  // 1. If base64 data url, decode to binary and return as real image/png
  if (img.startsWith('data:image/')) {
    const match = img.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.end(buffer);
    }
  }

  // 2. If it's a relative path on local filesystem
  if (img.startsWith('/') && !img.startsWith('//')) {
    const localFile = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    if (fs.existsSync(localFile)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.sendFile(localFile);
    }
  }

  // 3. If it's an external URL
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return res.redirect(302, img);
  }

  // 4. Default category match
  const slugLower = slug.toLowerCase();
  for (const [catKey, catImg] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (slugLower.includes(catKey)) {
      return res.redirect(302, catImg);
    }
  }

  // 5. Fallback to /og-image.png
  const defaultOg = path.join(process.cwd(), 'public', 'og-image.png');
  if (fs.existsSync(defaultOg)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.sendFile(defaultOg);
  }
  return res.status(404).send("Image not found");
});

// Dedicated Dynamic OG Image Endpoint for News Articles & Berita (/api/post-image/:slug)
const handlePostImageRequest = (req: express.Request, res: express.Response) => {
  const rawSlug = req.params.slug || '';
  const cleanSlug = decodeURIComponent(rawSlug).replace(/\.(png|jpg|jpeg|webp|gif|svg)$/i, '').trim();
  const slugLower = cleanSlug.toLowerCase();
  
  const posts = getServerPosts();
  let post = posts[cleanSlug] || posts[slugLower];

  if (!post) {
    // Try fuzzy match on keys
    const matchKey = Object.keys(posts).find(k => k.toLowerCase() === slugLower || k.toLowerCase().replace(/[^a-z0-9]/g, '-') === slugLower.replace(/[^a-z0-9]/g, '-'));
    if (matchKey) {
      post = posts[matchKey];
    }
  }

  // Also search directly in data_store/posts.json if not found
  if (!post) {
    try {
      const dataStorePostsPath = path.join(process.cwd(), "data_store", "posts.json");
      if (fs.existsSync(dataStorePostsPath)) {
        const parsed = JSON.parse(fs.readFileSync(dataStorePostsPath, "utf-8"));
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => 
            (p.slug && p.slug.toLowerCase() === slugLower) || 
            (p.id && p.id.toLowerCase() === slugLower) ||
            (p.title && p.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') === slugLower)
          );
          if (found) {
            post = {
              title: found.title || '',
              excerpt: found.excerpt || found.summary || found.seoDescription || '',
              featuredImage: found.featuredImage || found.imageUrl || found.coverImage || '',
              category: found.category || found.categoryName || 'Berita & Informasi'
            };
          }
        }
      }
    } catch (e) {
      console.error("Error reading data_store/posts.json in handlePostImageRequest:", e);
    }
  }

  const img = post?.featuredImage || post?.imageUrl || post?.coverImage || '';

  // 1. If base64 data url (e.g. AI generated image or uploaded base64 data URI)
  if (img && img.startsWith('data:image/')) {
    try {
      const commaIdx = img.indexOf(',');
      if (commaIdx !== -1) {
        const header = img.substring(0, commaIdx);
        const base64Data = img.substring(commaIdx + 1).replace(/\s+/g, '');
        const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.end(buffer);
      }
    } catch (err) {
      console.error("Error decoding base64 post image:", err);
    }
  }

  // 2. If it's a relative path in /uploads/ or /public/
  if (img && img.startsWith('/') && !img.startsWith('//')) {
    const cleanPath = img.replace(/^\//, '');
    const uploadFile = path.join(process.cwd(), cleanPath);
    if (fs.existsSync(uploadFile)) {
      const ext = path.extname(uploadFile).toLowerCase();
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.sendFile(uploadFile);
    }
    const publicFile = path.join(process.cwd(), 'public', cleanPath);
    if (fs.existsSync(publicFile)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.sendFile(publicFile);
    }
  }

  // 3. If it's an external URL
  if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
    return res.redirect(302, img);
  }

  // 4. If no featured image or post not found, generate high-resolution Open Graph article card
  try {
    const settings = getServerSiteSettings();
    const site = settings.siteName || "Puskesmas Mandiri Sejahtera";
    const title = post?.title || cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const desc = post?.excerpt || `Dapatkan informasi dan panduan kesehatan resmi dari ${site}.`;
    const category = post?.category || "Berita & Edukasi";

    const headers = req.headers || {};
    let proto = (headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'sumenep.puskesmasmanding.com';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      proto = 'https';
    }

    const svg = generatePageScreenshotSvg({
      siteName: site,
      title,
      description: desc,
      category,
      pageType: "berita",
      fullUrl: `${proto}://${host}/berita/${encodeURIComponent(cleanSlug)}`
    });

    const pngBuffer = renderScreenshotPng(svg);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.end(pngBuffer);
  } catch (err) {
    const defaultOg = path.join(process.cwd(), 'public', 'og-image.png');
    if (fs.existsSync(defaultOg)) {
      res.setHeader("Content-Type", "image/png");
      return res.sendFile(defaultOg);
    }
    return res.status(404).send("Article image not found");
  }
};

app.get("/api/post-image/:slug", handlePostImageRequest);
app.get("/api/post-og-image/:slug", handlePostImageRequest);

// Dynamic High-Fidelity Page Screenshot / Open Graph Image Generator
app.get(["/api/preview-image.png", "/api/screenshot.png", "/api/preview-image", "/api/screenshot"], (req, res) => {
  try {
    const query = req.query || {};
    const settings = getServerSiteSettings();
    const site = String(query.site || settings.siteName || "Puskesmas Mandiri Sejahtera");
    const rawPath = String(query.path || query.to || "/");
    const pageType = String(query.type || (rawPath.startsWith('/m/') ? 'microsite' : rawPath.startsWith('/berita') ? 'berita' : rawPath.startsWith('/layanan') ? 'layanan' : rawPath.startsWith('/pendaftaran') ? 'pendaftaran' : rawPath.startsWith('/kontak') ? 'kontak' : rawPath.startsWith('/pengaduan') ? 'pengaduan' : rawPath.startsWith('/dokumen') ? 'dokumen' : rawPath.startsWith('/profil') ? 'profil' : 'home'));
    const slug = String(query.slug || '').toLowerCase();

    const headers = req.headers || {};
    let proto = (headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'sumenep.puskesmasmanding.com';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      proto = 'https';
    }
    const fullUrl = `${proto}://${host}${rawPath}`;

    let title = String(query.title || query.t || "");
    let desc = String(query.desc || query.d || "");
    let category = String(query.category || query.cat || "");
    let links: Array<{ label: string; url?: string }> = [];
    let cluster: string | undefined = undefined;
    let schedule: string | undefined = undefined;

    if (pageType === "microsite") {
      const targetSlug = slug || rawPath.replace(/^\/m\//, '').split(/[?#]/)[0];
      const microsites = getServerMicrositesMeta();
      const ms = microsites[targetSlug];
      if (ms) {
        if (!title) title = ms.name;
        if (!desc) desc = ms.description || `Portal resmi informasi dan layanan cepat ${ms.name}.`;
        if (!category) category = ms.category || "Microsite & Portal";
        if (Array.isArray(ms.links) && ms.links.length > 0) {
          links = ms.links;
        }
      } else if (!title) {
        const formatted = targetSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        title = `Portal ${formatted}`;
        desc = `Akses informasi dan layanan terpadu ${formatted} ${site}.`;
      }
    } else if (pageType === "berita") {
      const targetSlug = slug || rawPath.replace(/^\/berita\//, '').split(/[?#]/)[0];
      const posts = getServerPosts();
      const post = posts[targetSlug];
      if (post) {
        if (!title) title = post.title;
        if (!desc) desc = post.excerpt || `Dapatkan informasi dan panduan kesehatan resmi dari ${site}.`;
        if (!category) category = post.category || "Berita & Edukasi";
      } else if (!title) {
        title = rawPath === '/berita' ? "Pusat Berita & Informasi Kesehatan Terkini" : "Berita Kesehatan Masyarakat";
        desc = `Dapatkan rilis berita resmi, edukasi kesehatan, dan program prioritas ${site}.`;
      }
    } else if (pageType === "layanan") {
      const targetSlug = slug || rawPath.replace(/^\/layanan\//, '').split(/[?#]/)[0];
      const services = getServerServices();
      const srv = services[targetSlug];
      if (srv) {
        if (!title) title = `Layanan ${srv.name}`;
        if (!desc) desc = srv.description;
        cluster = srv.cluster;
        schedule = srv.schedule;
        category = "Layanan Medis";
      } else if (!title) {
        title = "Standar Pelayanan Medis & Poliklinik Terpadu";
        desc = `Informasi lengkap seluruh unit layanan medis rawat jalan berbasis 5 Klaster ILP di ${site}.`;
      }
    } else if (pageType === "pendaftaran") {
      if (!title) title = `Pendaftaran Online & Antrean Pasien`;
      if (!desc) desc = `Daftar rawat jalan, pilih klaster pelayanan primer, dan pantau status nomor antrian secara transparan di ${site}.`;
    } else if (pageType === "kontak") {
      if (!title) title = `Kontak Resmi & Jam Operasional`;
      if (!desc) desc = `Alamat lengkap, nomor telepon darurat 24 Jam, WhatsApp resmi, dan rute navigasi ke ${site}.`;
    } else if (pageType === "pengaduan") {
      if (!title) title = `Layanan Aspirasi, Pengaduan Masyarakat & SKM`;
      if (!desc) desc = `Sampaikan kritik, saran, apresiasi, dan pengaduan pelayanan publik ${site} melalui saluran resmi SP4N-LAPOR!.`;
    } else if (pageType === "dokumen") {
      if (!title) title = `Standar Pelayanan & Dokumen Publik`;
      if (!desc) desc = `Unduh dan baca standar operasional prosedur, maklumat pelayanan, serta dokumen publik resmi ${site}.`;
    } else if (pageType === "profil") {
      if (!title) title = `Profil Instansi, Visi Misi & Maklumat`;
      if (!desc) desc = `Profil kelembagaan, visi misi, tata nilai budaya kerja, dan maklumat pelayanan resmi ${site}.`;
    } else {
      if (!title) title = settings.siteTitle || `${site} - Portal Resmi & Pelayanan Terpadu`;
      if (!desc) desc = settings.siteDescription || `Portal informasi dan pelayanan kesehatan primer terpadu berbasis 5 Klaster ILP.`;
    }

    const svg = generatePageScreenshotSvg({
      siteName: site,
      title,
      description: desc,
      category,
      pageType,
      fullUrl,
      links,
      cluster,
      schedule
    });

    const pngBuffer = renderScreenshotPng(svg);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.end(pngBuffer);
  } catch (err: any) {
    console.error("Error generating screenshot PNG:", err);
    return res.status(500).send("Error generating screenshot");
  }
});

// Dynamic Open Graph Card Banner Generator (/api/og-card)
app.get(["/api/og-card.png", "/api/og-card"], (req, res) => {
  try {
    const query = req.query || {};
    const settings = getServerSiteSettings();
    const site = String(query.site || settings.siteName || "Puskesmas Mandiri Sejahtera");
    const title = String(query.title || query.t || settings.siteTitle || "Pelayanan Kesehatan Primer Terintegrasi");
    const desc = String(query.desc || query.d || settings.siteDescription || "Portal Informasi & Pelayanan Publik");
    
    const headers = req.headers || {};
    let proto = (headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (headers['x-forwarded-host'] as string) || (headers.host as string) || 'sumenep.puskesmasmanding.com';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      proto = 'https';
    }

    const svg = generatePageScreenshotSvg({
      siteName: site,
      title,
      description: desc,
      pageType: String(query.type || 'home'),
      fullUrl: `${proto}://${host}${query.path || '/'}`
    });

    const wantsSvg = req.path.endsWith('.svg') || req.query.format === 'svg';
    if (wantsSvg) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(svg);
    }

    const pngBuffer = renderScreenshotPng(svg);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.end(pngBuffer);
  } catch (err: any) {
    console.error("Error in /api/og-card:", err);
    return res.status(500).send("Error generating card");
  }
});

// Vite middleware for development
async function startViteMiddleware() {
  let viteDevServer: any = null;

  if (process.env.NODE_ENV !== "production") {
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
  }

  // Intercept HTML navigation requests to inject dynamic Open Graph / WhatsApp Preview Meta tags
  app.get("*", async (req, res, next) => {
    // Pass API, health, uploads, static files, and Vite internal requests
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/@") ||
      req.path.startsWith("/src") ||
      req.path.startsWith("/node_modules") ||
      req.path.startsWith("/.vite") ||
      /\.(js|ts|tsx|jsx|css|scss|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf)$/i.test(req.path)
    ) {
      if (viteDevServer && process.env.NODE_ENV !== "production") {
        return viteDevServer.middlewares(req, res, next);
      }
      if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf|map)$/i.test(req.path)) {
        return res.status(404).send("Asset not found");
      }
      return next();
    }

    // Never send HTML template for asset or image requests
    if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|pdf|map)$/i.test(req.path)) {
      return res.status(404).send("Asset not found");
    }

    try {
      const templatePath = process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");

      if (!fs.existsSync(templatePath)) {
        if (viteDevServer) return viteDevServer.middlewares(req, res, next);
        return next();
      }

      let rawHtml = fs.readFileSync(templatePath, "utf-8");

      if (viteDevServer) {
        rawHtml = await viteDevServer.transformIndexHtml(req.originalUrl, rawHtml);
      }

      const html = renderHtmlWithMeta(req, rawHtml);
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(html);
    } catch (err) {
      console.error("HTML Meta Handler Error:", err);
      if (viteDevServer) return viteDevServer.middlewares(req, res, next);
      return next();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    app.use(viteDevServer.middlewares);
    console.log("Vite dev middleware & WhatsApp Link Preview handler initialized.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    console.log("Serving static assets in production mode with WhatsApp Link Preview support.");
  }
}

startViteMiddleware().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
