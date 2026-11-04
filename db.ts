/**
 * db.ts — Lapisan data SQLite multi-user untuk platform Microsite.
 *
 * F1 (fondasi): skema users / sessions / microsites / audit_log.
 * Fase berikutnya akan menambah tabel dashboard_prefs, platform_settings, dll.
 *
 * Prinsip:
 * - Semua akses data WAJIB lewat modul ini (tidak ada baca file JSON langsung untuk entitas ber-owner).
 * - Isolasi data ditegakkan di sini + di pemanggil (endpoint) — bukan hanya di frontend.
 * - Migrasi dari data/microsites_data.json dilakukan sekali (importLegacyMicrosites).
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

let db: Database.Database;

export function initDb(dbPath?: string): Database.Database {
  const file = dbPath || path.join(process.cwd(), 'microsite.db');
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT '',
      password_hash TEXT,
      role          TEXT NOT NULL DEFAULT 'pengelola',  -- 'admin' | 'pengelola'
      status        TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'suspended' | 'archived'
      google_id     TEXT,
      avatar_url    TEXT,
      org_name      TEXT,
      phone         TEXT,
      bio           TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      user_agent  TEXT,
      ip          TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS microsites (
      id          TEXT PRIMARY KEY,
      owner_id    TEXT NOT NULL,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'draft',
      active      INTEGER NOT NULL DEFAULT 1,
      data        TEXT NOT NULL,           -- JSON lengkap MicrositeEntity
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_microsites_owner ON microsites(owner_id);
    CREATE INDEX IF NOT EXISTS idx_microsites_slug  ON microsites(slug);

    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      at          TEXT NOT NULL,
      actor_id    TEXT,
      actor_email TEXT,
      action      TEXT NOT NULL,
      target_type TEXT,
      target_id   TEXT,
      detail      TEXT,
      ip          TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);

    CREATE TABLE IF NOT EXISTS dashboard_prefs (
      user_id    TEXT PRIMARY KEY,
      prefs      TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('DB belum diinisialisasi (panggil initDb dahulu).');
  return db;
}

// ── Util ────────────────────────────────────────────────────────────────────
export const nowIso = () => new Date().toISOString();
export const uid = (prefix = 'usr') =>
  `${prefix}-${crypto.randomBytes(9).toString('hex')}`;

export function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/** Hash kata sandi dengan scrypt + salt acak (format: scrypt$salt$hash). */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(test, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// ── Users ───────────────────────────────────────────────────────────────────
export interface DbUser {
  id: string; email: string; name: string; password_hash: string | null;
  role: 'admin' | 'pengelola'; status: 'active' | 'suspended' | 'archived';
  google_id: string | null; avatar_url: string | null; org_name: string | null;
  phone: string | null; bio: string | null;
  created_at: string; updated_at: string; last_login_at: string | null;
}

export function findUserByEmail(email: string): DbUser | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as DbUser | undefined;
}
export function findUserById(id: string): DbUser | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}
export function listUsers(): DbUser[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all() as DbUser[];
}

export function createUser(input: {
  email: string; name?: string; password?: string; role?: 'admin' | 'pengelola';
  googleId?: string; avatarUrl?: string; status?: 'active' | 'suspended' | 'archived';
}): DbUser {
  const email = input.email.trim().toLowerCase();
  if (findUserByEmail(email)) throw new Error('EMAIL_EXISTS');
  const id = uid('usr');
  const t = nowIso();
  getDb().prepare(`
    INSERT INTO users (id, email, name, password_hash, role, status, google_id, avatar_url, created_at, updated_at)
    VALUES (@id, @email, @name, @password_hash, @role, @status, @google_id, @avatar_url, @created_at, @updated_at)
  `).run({
    id, email,
    name: input.name || email.split('@')[0],
    password_hash: input.password ? hashPassword(input.password) : null,
    role: input.role || 'pengelola',
    status: input.status || 'active',
    google_id: input.googleId || null,
    avatar_url: input.avatarUrl || null,
    created_at: t, updated_at: t,
  });
  return findUserById(id)!;
}

export function updateUser(id: string, patch: Partial<DbUser> & { password?: string }): DbUser {
  const cur = findUserById(id);
  if (!cur) throw new Error('USER_NOT_FOUND');
  const fields: string[] = [];
  const params: any = { id, updated_at: nowIso() };
  const map: Record<string, string> = {
    name: 'name', role: 'role', status: 'status', org_name: 'org_name',
    phone: 'phone', bio: 'bio', avatar_url: 'avatar_url',
  };
  for (const [k, col] of Object.entries(map)) {
    if ((patch as any)[k] !== undefined) { fields.push(`${col} = @${col}`); params[col] = (patch as any)[k]; }
  }
  if (patch.password) { fields.push('password_hash = @password_hash'); params.password_hash = hashPassword(patch.password); }
  if (!fields.length) return cur;
  getDb().prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = @updated_at WHERE id = @id`).run(params);
  return findUserById(id)!;
}

export function touchLastLogin(id: string) {
  getDb().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), id);
}

// ── Sessions ────────────────────────────────────────────────────────────────
export function createSession(userId: string, ttlHours = 24 * 7, meta?: { ua?: string; ip?: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const created = nowIso();
  const expires = new Date(Date.now() + ttlHours * 3600_000).toISOString();
  getDb().prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at, user_agent, ip)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, userId, created, expires, meta?.ua || null, meta?.ip || null);
  return token;
}

export function lookupSession(token: string | undefined): (DbUser & { token: string }) | undefined {
  if (!token) return undefined;
  const row = getDb().prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(token) as
    | { user_id: string; expires_at: string } | undefined;
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return undefined;
  }
  const user = findUserById(row.user_id);
  if (!user) return undefined;
  return { ...user, token };
}

export function deleteSession(token: string) {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/** Putuskan semua sesi seorang pengguna (mis. saat akun dinonaktifkan). */
export function deleteUserSessions(userId: string): void {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

/** Putuskan semua sesi pengguna KECUALI token tertentu (mis. sesi yang sedang aktif). */
export function deleteUserSessionsExcept(userId: string, keepToken: string | undefined): void {
  if (!keepToken) return deleteUserSessions(userId);
  getDb().prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(userId, keepToken);
}

// ── Microsites (ber-owner) ──────────────────────────────────────────────────
export interface DbMicrosite {
  id: string; owner_id: string; slug: string; name: string;
  status: string; active: number; data: string;
  created_at: string; updated_at: string;
}

export function listMicrositesByOwner(ownerId: string): any[] {
  return (getDb().prepare('SELECT * FROM microsites WHERE owner_id = ? ORDER BY updated_at DESC').all(ownerId) as DbMicrosite[])
    .map(rowToEntity);
}
export function listAllMicrosites(): any[] {
  return (getDb().prepare('SELECT * FROM microsites ORDER BY updated_at DESC').all() as DbMicrosite[])
    .map(rowToEntity);
}
export function listPublishedMicrosites(): any[] {
  return (getDb().prepare("SELECT * FROM microsites WHERE status = 'published' AND active = 1 ORDER BY updated_at DESC").all() as DbMicrosite[])
    .map(rowToEntity);
}
export function getMicrositeById(id: string): any | undefined {
  const row = getDb().prepare('SELECT * FROM microsites WHERE id = ?').get(id) as DbMicrosite | undefined;
  return row ? rowToEntity(row) : undefined;
}
export function getMicrositeBySlug(slug: string): any | undefined {
  const row = getDb().prepare('SELECT * FROM microsites WHERE slug = ?').get(slug) as DbMicrosite | undefined;
  return row ? rowToEntity(row) : undefined;
}

function rowToEntity(row: DbMicrosite): any {
  try {
    const entity = JSON.parse(row.data);
    // Kolom DB adalah sumber kebenaran untuk status & flag aktif — pastikan
    // selalu ada di keluaran (rekaman lama mungkin belum punya di JSON).
    return {
      ...entity,
      id: row.id,
      slug: row.slug,
      ownerId: row.owner_id,
      status: row.status ?? entity.status,
      active: Number(row.active) === 1,
    };
  } catch {
    return { id: row.id, slug: row.slug, ownerId: row.owner_id, name: row.name, status: row.status, active: !!row.active };
  }
}

export function upsertMicrosite(ownerId: string, entity: any): any {
  const db = getDb();
  const id = entity.id || uid('ms');
  const slug = String(entity.slug || '').trim();
  if (!slug) throw new Error('SLUG_REQUIRED');
  const existing = getMicrositeById(id);
  const t = nowIso();
  const payload = { ...entity, id, ownerId, slug };

  // Cegah slug bentrok milik owner lain.
  const slugOwner = db.prepare('SELECT id, owner_id FROM microsites WHERE slug = ?').get(slug) as
    | { id: string; owner_id: string } | undefined;
  if (slugOwner && slugOwner.id !== id) throw new Error('SLUG_TAKEN');

  if (existing) {
    if (existing.ownerId !== ownerId) throw new Error('FORBIDDEN_OWNER');
    db.prepare(`
      UPDATE microsites SET slug=@slug, name=@name, status=@status, active=@active, data=@data, updated_at=@updated_at
      WHERE id=@id
    `).run({
      id, slug, name: payload.name || '', status: payload.status || 'draft',
      active: payload.active === false ? 0 : 1, data: JSON.stringify(payload), updated_at: t,
    });
  } else {
    db.prepare(`
      INSERT INTO microsites (id, owner_id, slug, name, status, active, data, created_at, updated_at)
      VALUES (@id, @owner_id, @slug, @name, @status, @active, @data, @created_at, @updated_at)
    `).run({
      id, owner_id: ownerId, slug, name: payload.name || '',
      status: payload.status || 'draft', active: payload.active === false ? 0 : 1,
      data: JSON.stringify(payload), created_at: payload.createdAt || t, updated_at: t,
    });
  }
  return getMicrositeById(id);
}

export function deleteMicrosite(id: string, actor: { id: string; role: string }): boolean {
  const cur = getMicrositeById(id);
  if (!cur) return false;
  if (actor.role !== 'admin' && cur.ownerId !== actor.id) throw new Error('FORBIDDEN_OWNER');
  getDb().prepare('DELETE FROM microsites WHERE id = ?').run(id);
  return true;
}

/** Hitung ringkasan per-owner untuk dashboard & admin monitoring. */
export function ownerStats(ownerId: string) {
  const rows = getDb().prepare('SELECT status, active FROM microsites WHERE owner_id = ?').all(ownerId) as
    { status: string; active: number }[];
  const total = rows.length;
  const published = rows.filter((r) => r.status === 'published' && r.active).length;
  const draft = rows.filter((r) => r.status !== 'published').length;
  return { total, published, draft, inactive: total - published };
}

// ── Audit ───────────────────────────────────────────────────────────────────
export function audit(entry: {
  actorId?: string; actorEmail?: string; action: string;
  targetType?: string; targetId?: string; detail?: any; ip?: string;
}) {
  getDb().prepare(`
    INSERT INTO audit_log (at, actor_id, actor_email, action, target_type, target_id, detail, ip)
    VALUES (@at, @actor_id, @actor_email, @action, @target_type, @target_id, @detail, @ip)
  `).run({
    at: nowIso(),
    actor_id: entry.actorId || null,
    actor_email: entry.actorEmail || null,
    action: entry.action,
    target_type: entry.targetType || null,
    target_id: entry.targetId || null,
    detail: entry.detail ? JSON.stringify(entry.detail) : null,
    ip: entry.ip || null,
  });
}
export function listAudit(limit = 100) {
  return getDb().prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
}

// ── Dashboard prefs ─────────────────────────────────────────────────────────
export function getDashboardPrefs(userId: string): any {
  const row = getDb().prepare('SELECT prefs FROM dashboard_prefs WHERE user_id = ?').get(userId) as
    | { prefs: string } | undefined;
  return row ? JSON.parse(row.prefs) : {};
}
export function saveDashboardPrefs(userId: string, prefs: any) {
  getDb().prepare(`
    INSERT INTO dashboard_prefs (user_id, prefs, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET prefs = excluded.prefs, updated_at = excluded.updated_at
  `).run(userId, JSON.stringify(prefs || {}), nowIso());
}

// ── Platform settings ───────────────────────────────────────────────────────
export function getPlatformSettings(): Record<string, any> {
  const rows = getDb().prepare('SELECT key, value FROM platform_settings').all() as
    { key: string; value: string }[];
  const out: Record<string, any> = {};
  for (const r of rows) { try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = r.value; } }
  return out;
}
export function savePlatformSettings(patch: Record<string, any>) {
  const stmt = getDb().prepare(`
    INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const t = nowIso();
  const tx = getDb().transaction((entries: [string, any][]) => {
    for (const [k, v] of entries) stmt.run(k, JSON.stringify(v), t);
  });
  tx(Object.entries(patch || {}));
}

/** Ringkasan platform untuk Admin Panel. */
export function platformStats() {
  const db = getDb();
  const users = (db.prepare("SELECT COUNT(*) c FROM users WHERE role='pengelola'").get() as any).c;
  const totalMs = (db.prepare('SELECT COUNT(*) c FROM microsites').get() as any).c;
  const publishedMs = (db.prepare("SELECT COUNT(*) c FROM microsites WHERE status='published' AND active=1").get() as any).c;
  return { users, microsites: totalMs, published: publishedMs, draft: totalMs - publishedMs };
}

// ── Migrasi data lama ───────────────────────────────────────────────────────
/** Impor microsite dari JSON lama (data/microsites_data.json) ke SQLite, sekali.
 *  Semua di-assign ke ownerId default (super-admin) bila belum punya owner. */
export function importLegacyMicrosites(ownerId: string) {
  const candidates = [
    path.join(process.cwd(), 'microsites_data.json'),
    path.join(process.cwd(), 'data', 'microsites_data.json'),
    path.join(process.cwd(), 'data_store', 'microsites.json'),
  ];
  let imported = 0;
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const arr = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (!Array.isArray(arr)) continue;
      for (const m of arr) {
        if (!m || !m.slug) continue;
        if (getMicrositeById(m.id || '') || getMicrositeBySlug(m.slug)) continue;
        upsertMicrosite(ownerId, { ...m, ownerId });
        imported++;
      }
    } catch (e: any) {
      console.warn('[db] impor legacy dilewati:', p, e?.message);
    }
  }
  return imported;
}
