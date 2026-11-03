// Uji modul DB F1 — dijalankan dengan tsx, DB di file sementara.
import {
  initDb, createUser, findUserByEmail, verifyPassword, hashPassword,
  createSession, lookupSession, deleteSession, updateUser,
  upsertMicrosite, listMicrositesByOwner, listAllMicrosites, listPublishedMicrosites,
  getMicrositeBySlug, ownerStats, audit, listAudit,
  getDashboardPrefs, saveDashboardPrefs, platformStats, deleteMicrosite,
} from './db';
import fs from 'node:fs';

const tmp = '/tmp/f1-db-test.sqlite';
for (const f of [tmp, tmp + '-wal', tmp + '-shm']) { try { fs.unlinkSync(f); } catch {} }
initDb(tmp);

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

// 1. Users + password
const a = createUser({ email: 'a@test.id', name: 'Pengelola A', password: 'rahasia1' });
const b = createUser({ email: 'b@test.id', name: 'Pengelola B', password: 'rahasia2' });
const adm = createUser({ email: 'admin@test.id', name: 'Admin', password: 'adminpw', role: 'admin' });
ok(!!a.id && a.role === 'pengelola', 'createUser pengelola A');
ok(findUserByEmail('A@TEST.ID')?.id === a.id, 'findUserByEmail case-insensitive');
ok(verifyPassword('rahasia1', a.password_hash), 'verifyPassword benar');
ok(!verifyPassword('salah', a.password_hash), 'verifyPassword salah ditolak');
ok(!verifyPassword('x', hashPassword('y')), 'verifyPassword hash lain ditolak');
ok(a.role === 'pengelola' && adm.role === 'admin', 'role tersimpan');
let dup = false; try { createUser({ email: 'a@test.id', password: 'z' }); } catch (e: any) { dup = e.message === 'EMAIL_EXISTS'; }
ok(dup, 'email duplikat ditolak');

// 2. Sessions
const tok = createSession(a.id, 1, { ua: 'test', ip: '127.0.0.1' });
ok(lookupSession(tok)?.id === a.id, 'lookupSession valid');
ok(lookupSession('bogus') === undefined, 'lookupSession token palsu ditolak');
const expired = createSession(a.id, -1);
ok(lookupSession(expired) === undefined, 'sesi kedaluwarsa ditolak');
deleteSession(tok);
ok(lookupSession(tok) === undefined, 'logout menghapus sesi');

// 3. Microsites + isolasi owner
const msA = upsertMicrosite(a.id, { slug: 'a-portal', name: 'Portal A', status: 'published', links: [{ url: 'https://a.id' }] });
const msB = upsertMicrosite(b.id, { slug: 'b-portal', name: 'Portal B', status: 'draft', links: [] });
ok(listMicrositesByOwner(a.id).length === 1 && listMicrositesByOwner(a.id)[0].slug === 'a-portal', 'A hanya lihat microsite A');
ok(listMicrositesByOwner(b.id).length === 1 && listMicrositesByOwner(b.id)[0].slug === 'b-portal', 'B hanya lihat microsite B');
ok(listAllMicrosites().length === 2, 'admin lihat semua (2)');
ok(listPublishedMicrosites().length === 1 && listPublishedMicrosites()[0].slug === 'a-portal', 'publik hanya published+aktif');
ok(getMicrositeBySlug('a-portal')?.ownerId === a.id, 'slug lookup membawa ownerId');

// 4. A tidak boleh mengubah microsite B
let forb = false; try { upsertMicrosite(a.id, { ...msB, slug: 'b-portal' }); } catch (e: any) { forb = e.message === 'FORBIDDEN_OWNER'; }
ok(forb, 'A DILARANG mengubah microsite B');
let forbDel = false; try { deleteMicrosite(msB.id, { id: a.id, role: 'pengelola' }); } catch (e: any) { forbDel = e.message === 'FORBIDDEN_OWNER'; }
ok(forbDel, 'A DILARANG menghapus microsite B');
ok(deleteMicrosite(msB.id, { id: adm.id, role: 'admin' }) === true, 'admin BOLEH menghapus microsite B');

// 5. Slug bentrok antar-owner
let clash = false; try { upsertMicrosite(b.id, { slug: 'a-portal', name: 'x' }); } catch (e: any) { clash = e.message === 'SLUG_TAKEN'; }
ok(clash, 'slug duplikat antar-owner ditolak');

// 6. Owner stats
const st = ownerStats(a.id);
ok(st.total === 1 && st.published === 1 && st.draft === 0, 'ownerStats A benar');

// 7. Prefs + platform settings + audit
saveDashboardPrefs(a.id, { theme: 'dark', widgets: ['stats'] });
ok(getDashboardPrefs(a.id).theme === 'dark', 'dashboard prefs tersimpan');
audit({ actorId: adm.id, actorEmail: adm.email, action: 'delete_microsite', targetId: msB.id });
ok(listAudit(10).length >= 1, 'audit tercatat');
const ps = platformStats();
ok(ps.users === 2 && ps.microsites === 1 && ps.published === 1, 'platformStats benar (2 pengelola, 1 microsite)');

// 8. updateUser
const up = updateUser(a.id, { name: 'Pengelola A Baru', org_name: 'Org A' });
ok(up.name === 'Pengelola A Baru' && up.org_name === 'Org A', 'updateUser profil');

console.log(`\nRESULT: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
