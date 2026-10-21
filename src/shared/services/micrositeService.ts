import type {
  MicrositeEntity,
  ContentStatus,
  MicrositeCategory,
  MicrositeBlock,
  MicrositeBlockType,
  MicrositeLink,
  MicrositeGroup
} from '../types/index.js';
import { auditService } from './auditService';
import { apiFetch } from '../lib/api';
import { sanitizeText, sanitizeHtml } from '../utils/sanitize';
import { getCollectionData, saveDocumentData, deleteDocumentData } from '../lib/firebase';
import { syncMicrositeItemToServer, syncMetadataToServer } from '../utils/metaSync';
import { memStore } from '../lib/memStore';

const MICROSITES_STORAGE_KEY = 'puskesmas_microsites';
const FIRESTORE_COLLECTION = 'microsites';
const CATEGORIES_STORAGE_KEY = 'puskesmas_cms_microsite_categories';

const INITIAL_CATEGORIES: MicrositeCategory[] = [
  { name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' },
  { name: 'Layanan Puskesmas', description: 'Akses cepat portal utama layanan rawat jalan, gawat darurat, pendaftaran online, dan jadwal poliklinik.' },
  { name: 'Program Kesehatan', description: 'Portal tematik program khusus kesehatan masyarakat seperti PIN Polio, pencegahan stunting, dan imunisasi.' },
  { name: 'Informasi Publik', description: 'Kumpulan regulasi, Standar Pelayanan Publik (SPP), maklumat, serta laporan akuntabilitas kinerja.' },
  { name: 'Kampanye & Edukasi', description: 'Materi penyuluhan kesehatan, infografis pencegahan penyakit, dan sosialisasi program hidup sehat.' }
];

// Simple hashing function to avoid plaintext storage
function hashPassword(password: string): string {
  if (!password) return '';
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'pw_hash_' + Math.abs(hash).toString(36);
}

const INITIAL_MICROSITES: MicrositeEntity[] = [
  {
    id: 'm-1',
    name: 'Puskesmas Manding - Portal Cepat',
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
      {
        id: 'ml-1',
        label: 'Daftar Layanan Utama',
        url: '/layanan',
        type: 'internal',
        displayOrder: 1
      },
      {
        id: 'ml-2',
        label: 'Formulir Kritik, Saran, & Pengaduan',
        url: '/kritik-saran',
        type: 'internal',
        displayOrder: 2
      },
      {
        id: 'ml-3',
        label: 'Pusat Berita & Edukasi',
        url: '/berita',
        type: 'internal',
        displayOrder: 3
      },
      {
        id: 'ml-4',
        label: 'Hubungi Kami (WhatsApp)',
        url: 'https://wa.me/628123456789',
        type: 'external',
        displayOrder: 4
      }
    ],
    socialMedia: {
      facebook: 'https://facebook.com/puskesmas.mandiri',
      instagram: 'https://instagram.com/puskesmas.mandiri',
      youtube: 'https://youtube.com/c/PuskesmasMandiri'
    },
    phone: '(0328) 667123',
    email: 'puskesmas.manding@gmail.com',
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
    updatedAt: new Date().toISOString(),
    createdBy: { id: 'usr-superadmin-01', name: 'Administrator Utama' }
  },
  {
    id: 'm-2',
    name: 'Program Imunisasi Polio Nasional 2026',
    slug: 'pin-polio',
    description: 'Halaman resmi Pekan Imunisasi Nasional (PIN) Polio tingkat Puskesmas Manding. Lindungi buah hati Anda sekarang.',
    category: 'Program Kesehatan',
    logoUrl: '',
    profileImageUrl: '',
    status: 'published',
    active: true,
    passwordProtected: false,
    password: '',
    links: [
      {
        id: 'ml-5',
        label: 'Jadwal Posyandu & Lokasi PIN',
        url: '/berita/jadwal-pin-polio',
        type: 'internal',
        displayOrder: 1
      },
      {
        id: 'ml-6',
        label: 'Konsultasi Dokter Anak (BPJS)',
        url: '/layanan/pemeriksaan-anak',
        type: 'internal',
        displayOrder: 2
      }
    ],
    socialMedia: {
      instagram: 'https://instagram.com/puskesmas.mandiri'
    },
    phone: '(0328) 667123',
    email: 'puskesmas.manding@gmail.com',
    address: 'Gedung Serbaguna Sejahtera, Kec. Sehat Selalu',
    themeCustomization: {
      theme: 'sky',
      template: 'artistic_bio',
      backgroundAnimation: 'bioluminescent',
      buttonStyle: 'pill',
      accentColor: '#0ea5e9'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { id: 'usr-superadmin-01', name: 'Administrator Utama' }
  },
  {
    id: 'm-3',
    name: 'Posko Darurat & Siaga Bencana Medis',
    slug: 'siaga-darurat',
    description: 'Pusat komando tanggap darurat, nomor ambulans 24 jam, dan panduan evakuasi medis terpadu.',
    category: 'Layanan Darurat',
    logoUrl: '',
    profileImageUrl: '',
    status: 'published',
    active: true,
    passwordProtected: false,
    password: '',
    links: [
      {
        id: 'ml-7',
        label: 'Hubungi Hotline Ambulans 119',
        url: 'tel:119',
        type: 'external',
        displayOrder: 1
      },
      {
        id: 'ml-8',
        label: 'Lokasi Shelter & Posko Terdekat',
        url: '/layanan/posko-darurat',
        type: 'internal',
        displayOrder: 2
      },
      {
        id: 'ml-9',
        label: 'Stok Darah & Bank Darah Siaga',
        url: '/layanan/darah',
        type: 'internal',
        displayOrder: 3
      }
    ],
    socialMedia: {
      whatsapp: 'https://wa.me/628123456789'
    },
    phone: '119 / (0328) 667123',
    email: 'darurat@puskesmas.go.id',
    address: 'Instalasi Gawat Darurat Puskesmas Manding',
    themeCustomization: {
      theme: 'rose',
      template: 'avant_garde',
      backgroundAnimation: 'geometric_waves',
      buttonStyle: 'sharp',
      accentColor: '#06b6d4'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { id: 'usr-superadmin-01', name: 'Administrator Utama' }
  },
  {
    id: 'm-4',
    name: 'Festival Jamu & Warisan Sehat Nusantara',
    slug: 'festival-nusantara',
    description: 'Pemberdayaan obat tradisional ramuan herbal nusantara dan TOGA (Tanaman Obat Keluarga) terstandar BPOM.',
    category: 'Promosi Kesehatan',
    logoUrl: '',
    profileImageUrl: '',
    status: 'published',
    active: true,
    passwordProtected: false,
    password: '',
    links: [
      {
        id: 'ml-10',
        label: 'Katalog Tanaman Obat Keluarga (TOGA)',
        url: '/berita/katalog-toga',
        type: 'internal',
        displayOrder: 1
      },
      {
        id: 'ml-11',
        label: 'Jadwal Lokakarya Pembuatan Jamu Sehat',
        url: '/berita/workshop-jamu',
        type: 'internal',
        displayOrder: 2
      }
    ],
    socialMedia: {
      instagram: 'https://instagram.com/puskesmas.mandiri',
      youtube: 'https://youtube.com/c/PuskesmasMandiri'
    },
    phone: '(0328) 667123',
    email: 'promkes@puskesmas.go.id',
    address: 'Kebun Toga Edukasi Puskesmas Manding',
    themeCustomization: {
      theme: 'dark',
      template: 'nusantara_art',
      backgroundAnimation: 'golden_radiance',
      buttonStyle: 'rounded',
      accentColor: '#d97706'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { id: 'usr-superadmin-01', name: 'Administrator Utama' }
  },
  {
    id: 'm-5',
    name: 'Ruang Dialog & Kurasi Sehat Jiwa',
    slug: 'sehat-jiwa',
    description: 'Konseling psikologi dan ruang tenang pemulihan kesehatan mental masyarakat bersama pakar.',
    category: 'Kesehatan Jiwa',
    logoUrl: '',
    profileImageUrl: '',
    status: 'published',
    active: true,
    passwordProtected: false,
    password: '',
    links: [
      {
        id: 'ml-12',
        label: 'Jadwalkan Sesi Konseling Privat',
        url: '/layanan/konseling-jiwa',
        type: 'internal',
        displayOrder: 1
      },
      {
        id: 'ml-13',
        label: 'Tes Mandiri Skrining Kesehatan Mental',
        url: '/layanan/skrining-mandiri',
        type: 'internal',
        displayOrder: 2
      }
    ],
    socialMedia: {
      instagram: 'https://instagram.com/puskesmas.mandiri'
    },
    phone: '(0328) 667123',
    email: 'jiwasehat@puskesmas.go.id',
    address: 'Klinik Psikologi Puskesmas Manding',
    themeCustomization: {
      theme: 'neutral',
      template: 'minimal_gallery',
      backgroundAnimation: 'subtle_glow',
      buttonStyle: 'pill',
      accentColor: '#71717a'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { id: 'usr-superadmin-01', name: 'Administrator Utama' }
  }
];

function getStoredMicrosites(): MicrositeEntity[] {
  try {
    const data = memStore.getItem(MICROSITES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    const legacyData = memStore.getItem('puskesmas_cms_microsites');
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      if (Array.isArray(parsed)) {
        memStore.setItem(MICROSITES_STORAGE_KEY, legacyData);
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function saveStoredMicrosites(microsites: MicrositeEntity[], emitEvent: boolean = true) {
  try {
    memStore.setItem(MICROSITES_STORAGE_KEY, JSON.stringify(microsites));
    memStore.setItem('puskesmas_cms_microsites', JSON.stringify(microsites));
    if (emitEvent) {
      window.dispatchEvent(new CustomEvent('puskesmas_microsites_updated', { detail: microsites }));
    }
    // Asynchronously notify Node.js server for instant WhatsApp preview updates
    try {
      const published = microsites
        .filter(m => m.status === 'published' || !m.status)
        .map(m => ({
          slug: m.slug,
          name: m.name,
          description: m.description,
          profileImageUrl: m.profileImageUrl,
          logoUrl: m.logoUrl,
          ogImageUrl: m.ogImageUrl || m.profileImageUrl || m.logoUrl
        }));
      fetch('/api/sync-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ microsites: published })
      }).catch(() => {});
    } catch {}
  } catch {}
}

async function fetchMicrosites(): Promise<MicrositeEntity[]> {
  return getCollectionData<MicrositeEntity>(FIRESTORE_COLLECTION, MICROSITES_STORAGE_KEY, INITIAL_MICROSITES);
}

export const micrositeService = {
  async getMicrosites(): Promise<MicrositeEntity[]> {
    return fetchMicrosites();
  },

  async getCategories(): Promise<MicrositeCategory[]> {
    let localCategories = INITIAL_CATEGORIES;
    try {
      const data = memStore.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localCategories = parsed;
        }
      }
    } catch {}

    // Fetch from server API
    try {
      const res = await fetch('/api/microsites/categories');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.categories) && json.categories.length > 0) {
          let serverCats: MicrositeCategory[] = json.categories;
          if (!serverCats.some(c => c.name?.toLowerCase() === 'umum')) {
            serverCats.unshift({ name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' });
          }
          memStore.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(serverCats));
          return serverCats;
        }
      }
    } catch {}

    return localCategories;
  },

  async saveCategories(categories: MicrositeCategory[], actor?: { id: string; email: string; name: string }): Promise<void> {
    const hasUmum = categories.some(c => c.name.toLowerCase() === 'umum');
    const finalCategories = hasUmum ? categories : [{ name: 'Umum', description: 'Portal informasi umum, layanan harian, dan tautan serbaguna Puskesmas.' }, ...categories];
    memStore.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(finalCategories));

    // Save to server
    try {
      await fetch('/api/microsites/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalCategories)
      });
    } catch (err) {
      console.warn('Server save for categories failed:', err);
    }

    if (actor) {
      await auditService.recordLog({
        userId: actor.id,
        userEmail: actor.email,
        userName: actor.name,
        action: 'UPDATE',
        module: 'MICROSITES',
        targetId: 'categories-config',
        targetName: 'Kategori Microsite',
        description: `Memperbarui daftar kategori microsite.`
      });
    }
  },

  async deleteCategory(categoryName: string, actor?: { id: string; email: string; name: string }): Promise<void> {
    if (categoryName.toLowerCase() === 'umum') {
      throw new Error("Kategori 'Umum' adalah kategori khusus yang wajib ada dan tidak dapat dihapus.");
    }
    const categories = await this.getCategories();
    const updatedCategories = categories.filter(c => c.name.toLowerCase() !== categoryName.toLowerCase());
    
    // Reassign microsites in this category to 'Umum'
    const microsites = await fetchMicrosites();
    let reassignCount = 0;
    const updatedMicrosites = microsites.map(m => {
      if ((m.category || 'Layanan Puskesmas').toLowerCase() === categoryName.toLowerCase()) {
        reassignCount++;
        return { ...m, category: 'Umum', updatedAt: new Date().toISOString() };
      }
      return m;
    });

    saveStoredMicrosites(updatedMicrosites);
    
    // Sync all updated microsites to server
    try {
      fetch('/api/microsites/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ microsites: updatedMicrosites })
      }).catch(() => {});
    } catch {}

    await this.saveCategories(updatedCategories, actor);

    if (actor) {
      await auditService.recordLog({
        userId: actor.id,
        userEmail: actor.email,
        userName: actor.name,
        action: 'DELETE',
        module: 'MICROSITES',
        targetId: categoryName,
        targetName: `Kategori: ${categoryName}`,
        description: `Menghapus kategori microsite "${categoryName}" dan mengalihkan ${reassignCount} portal ke kategori "Umum".`
      });
    }
  },

  async getPublishedAndActiveMicrosites(): Promise<MicrositeEntity[]> {
    const list = await fetchMicrosites();
    return list
      .filter(m => m.status === 'published' && m.active)
      .map(m => {
        const { password, ...safeItem } = m;
        return safeItem as MicrositeEntity;
      });
  },

  async getMicrositeById(id: string): Promise<MicrositeEntity | null> {
    const list = await fetchMicrosites();
    const item = list.find(m => m.id === id);
    if (!item) return null;
    const { password, ...safeItem } = item;
    return safeItem as MicrositeEntity;
  },

  async getMicrositeBySlug(slug: string): Promise<MicrositeEntity | null> {
    let cleanSlug = (slug || '').trim().toLowerCase();
    try {
      cleanSlug = decodeURIComponent(cleanSlug);
    } catch {}
    cleanSlug = cleanSlug.replace(/^\/+|\/+$/g, '').trim();

    if (!cleanSlug) return null;

    // 1. Check in local cache / collection sync (VPS database only, no Firestore fallback)
    const list = await fetchMicrosites();
    let item = list.find(m => {
      const itemSlug = (m.slug || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const itemId = (m.id || '').trim().toLowerCase();
      return (
        itemSlug === cleanSlug ||
        itemId === cleanSlug ||
        itemSlug.replace(/[^a-z0-9]/g, '') === cleanSlug.replace(/[^a-z0-9]/g, '')
      );
    });

    if (!item) return null;
    const { password, ...safeItem } = item;
    return safeItem as MicrositeEntity;
  },

  async createMicrosite(
    data: Partial<MicrositeEntity>,
    actor: { id: string; email: string; name: string }
  ): Promise<MicrositeEntity> {
    const list = await fetchMicrosites();
    
    // Check slug uniqueness
    const slug = (data.slug || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    if (list.some(m => (m.slug || '').trim().toLowerCase() === slug)) {
      throw new Error(`Slug "${slug}" sudah digunakan.`);
    }

    // Process password if provided
    let storedPassword = '';
    if (data.passwordProtected && data.password) {
      storedPassword = hashPassword(data.password);
    }

    const cleanName = sanitizeText(data.name || 'Microsite Baru');
    const cleanDesc = sanitizeText(data.description || '');

    const sanitizedBlocks: MicrositeBlock[] = (data.blocks && data.blocks.length > 0)
      ? data.blocks.map(b => ({
          ...b,
          active: b.active !== false,
          title: b.title ? sanitizeText(b.title) : undefined,
          subtitle: b.subtitle ? sanitizeText(b.subtitle) : undefined,
          content: b.content ? sanitizeText(b.content) : undefined,
          url: b.url || undefined,
          badgeText: b.badgeText ? sanitizeText(b.badgeText) : undefined,
          whatsappNumber: b.whatsappNumber ? sanitizeText(b.whatsappNumber) : undefined,
          whatsappMessage: b.whatsappMessage ? sanitizeText(b.whatsappMessage) : undefined,
        }))
      : (data.links || []).map(l => ({
          id: l.id || 'blk-' + Math.random().toString(36).substring(2, 9),
          type: (l.type === 'whatsapp' ? 'whatsapp' : l.type === 'call' ? 'phone' : l.type === 'email' ? 'email' : l.type === 'pdf' ? 'download' : l.type === 'youtube' ? 'video' : 'link') as MicrositeBlockType,
          title: sanitizeText(l.label),
          subtitle: l.subtitle ? sanitizeText(l.subtitle) : undefined,
          url: l.url,
          icon: l.icon,
          thumbnailUrl: l.thumbnailUrl,
          badgeText: l.badgeText ? sanitizeText(l.badgeText) : undefined,
          isFeatured: l.isFeatured,
          active: !l.archived,
          scheduledStart: l.scheduledStart,
          scheduledEnd: l.scheduledEnd,
          clicks: l.clicks || 0,
          displayOrder: l.displayOrder
        }));

    const sanitizedLinks: MicrositeLink[] = (data.links && data.links.length > 0)
      ? data.links.map(l => ({
          ...l,
          label: sanitizeText(l.label),
          url: l.url
        }))
      : sanitizedBlocks
          .filter(b => b.type === 'link' || b.type === 'whatsapp' || b.type === 'phone' || b.type === 'email' || b.type === 'download' || b.type === 'image_link')
          .map(b => ({
            id: b.id,
            label: b.title || 'Tautan',
            subtitle: b.subtitle,
            url: b.url || (b.type === 'whatsapp' ? `https://wa.me/${b.whatsappNumber || ''}` : '#'),
            type: (b.type === 'whatsapp' ? 'whatsapp' : b.type === 'phone' ? 'call' : b.type === 'email' ? 'email' : b.type === 'download' ? 'pdf' : 'internal') as any,
            displayOrder: b.displayOrder,
            icon: b.icon,
            thumbnailUrl: b.thumbnailUrl,
            badgeText: b.badgeText,
            isFeatured: b.isFeatured,
            clicks: b.clicks || 0,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            archived: !b.active
          }));

    const newMicrosite: MicrositeEntity = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      name: cleanName,
      slug,
      description: cleanDesc,
      category: data.category || 'Umum',
      logoUrl: data.logoUrl || '',
      profileImageUrl: data.profileImageUrl || '',
      bannerImageUrl: data.bannerImageUrl || '',
      status: data.status || 'published',
      active: data.active ?? true,
      passwordProtected: data.passwordProtected ?? false,
      password: storedPassword,
      links: sanitizedLinks,
      blocks: sanitizedBlocks,
      groups: data.groups || [],
      socialMedia: data.socialMedia || {},
      phone: sanitizeText(data.phone || ''),
      email: sanitizeText(data.email || ''),
      website: sanitizeText(data.website || ''),
      address: sanitizeText(data.address || ''),
      mapUrl: data.mapUrl || '',
      themeCustomization: data.themeCustomization || {
        theme: 'emerald',
        template: 'modern_majestic',
        backgroundAnimation: 'aurora_flow',
        buttonStyle: 'rounded',
        accentColor: '#10b981'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: actor.id, name: actor.name }
    };

    list.push(newMicrosite);
    saveStoredMicrosites(list);

    // Save to Node.js backend server
    try {
      fetch('/api/microsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMicrosite)
      }).catch(err => console.warn('Server save microsite error:', err));
    } catch {}

    await saveDocumentData(FIRESTORE_COLLECTION, newMicrosite.id, newMicrosite, MICROSITES_STORAGE_KEY);

    await auditService.recordLog({
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      action: 'CREATE',
      module: 'MICROSITES',
      targetId: newMicrosite.id,
      targetName: newMicrosite.name,
      description: `Membuat microsite baru: "${newMicrosite.name}" (Slug: ${newMicrosite.slug})`
    });

    return newMicrosite;
  },

  async updateMicrosite(
    id: string,
    data: Partial<MicrositeEntity>,
    actor: { id: string; email: string; name: string }
  ): Promise<MicrositeEntity> {
    const list = await fetchMicrosites();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Microsite tidak ditemukan.');
    }

    const existing = list[index];

    // Check slug uniqueness if changed
    if (data.slug && data.slug.toLowerCase() !== existing.slug.toLowerCase()) {
      const slug = data.slug.trim().toLowerCase();
      if (list.some(m => m.slug.toLowerCase() === slug && m.id !== id)) {
        throw new Error(`Slug "${slug}" sudah digunakan.`);
      }
    }

    // Process password update
    let storedPassword = existing.password;
    if (data.passwordProtected) {
      if (data.password && !data.password.startsWith('pw_hash_')) {
        storedPassword = hashPassword(data.password);
      }
    } else {
      storedPassword = '';
    }

    // Sanitize any updated string fields
    let updatedBlocks: MicrositeBlock[] | undefined = undefined;
    if (data.blocks !== undefined) {
      updatedBlocks = data.blocks.map(b => ({
        ...b,
        active: b.active !== false,
        title: b.title ? sanitizeText(b.title) : undefined,
        subtitle: b.subtitle ? sanitizeText(b.subtitle) : undefined,
        content: b.content ? sanitizeText(b.content) : undefined,
        url: b.url || undefined,
        badgeText: b.badgeText ? sanitizeText(b.badgeText) : undefined,
        whatsappNumber: b.whatsappNumber ? sanitizeText(b.whatsappNumber) : undefined,
        whatsappMessage: b.whatsappMessage ? sanitizeText(b.whatsappMessage) : undefined,
      }));
    }

    let updatedLinks: MicrositeLink[] | undefined = undefined;
    if (data.links !== undefined) {
      updatedLinks = data.links.map(l => ({
        ...l,
        label: sanitizeText(l.label),
        url: l.url
      }));
    } else if (updatedBlocks !== undefined) {
      // Sync links from updatedBlocks
      updatedLinks = updatedBlocks
        .filter(b => b.type === 'link' || b.type === 'whatsapp' || b.type === 'phone' || b.type === 'email' || b.type === 'download' || b.type === 'image_link')
        .map(b => ({
          id: b.id,
          label: b.title || 'Tautan',
          subtitle: b.subtitle,
          url: b.url || (b.type === 'whatsapp' ? `https://wa.me/${b.whatsappNumber || ''}` : '#'),
          type: (b.type === 'whatsapp' ? 'whatsapp' : b.type === 'phone' ? 'call' : b.type === 'email' ? 'email' : b.type === 'download' ? 'pdf' : 'internal') as any,
          displayOrder: b.displayOrder,
          icon: b.icon,
          thumbnailUrl: b.thumbnailUrl,
          badgeText: b.badgeText,
          isFeatured: b.isFeatured,
          clicks: b.clicks || 0,
          scheduledStart: b.scheduledStart,
          scheduledEnd: b.scheduledEnd,
          archived: !b.active
        }));
    }

    const sanitizedUpdates: Partial<MicrositeEntity> = {
      ...data,
      ...(data.name !== undefined ? { name: sanitizeText(data.name) } : {}),
      ...(data.description !== undefined ? { description: sanitizeText(data.description) } : {}),
      ...(data.phone !== undefined ? { phone: sanitizeText(data.phone) } : {}),
      ...(data.email !== undefined ? { email: sanitizeText(data.email) } : {}),
      ...(data.website !== undefined ? { website: sanitizeText(data.website) } : {}),
      ...(data.address !== undefined ? { address: sanitizeText(data.address) } : {}),
      ...(updatedLinks !== undefined ? { links: updatedLinks } : {}),
      ...(updatedBlocks !== undefined ? { blocks: updatedBlocks } : {}),
    };

    const updated: MicrositeEntity = {
      ...existing,
      ...sanitizedUpdates,
      password: storedPassword,
      updatedAt: new Date().toISOString(),
      updatedBy: { id: actor.id, name: actor.name }
    };

    list[index] = updated;
    saveStoredMicrosites(list);

    // Save to Node.js backend server
    try {
      fetch('/api/microsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(err => console.warn('Server update microsite error:', err));
    } catch {}

    await saveDocumentData(FIRESTORE_COLLECTION, updated.id, updated, MICROSITES_STORAGE_KEY);

    await auditService.recordLog({
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      action: data.status === 'published' ? 'PUBLISH' : 'UPDATE',
      module: 'MICROSITES',
      targetId: updated.id,
      targetName: updated.name,
      description: `Memperbarui microsite: "${updated.name}" (Status: ${updated.status})`
    });

    return updated;
  },

  async duplicateMicrosite(
    sourceId: string,
    actor: { id: string; email: string; name: string }
  ): Promise<MicrositeEntity> {
    const list = await fetchMicrosites();
    const source = list.find(m => m.id === sourceId);
    if (!source) {
      throw new Error('Microsite sumber tidak ditemukan.');
    }

    // Generate unique slug
    let newSlug = `${source.slug}-salinan`;
    let counter = 1;
    while (list.some(m => (m.slug || '').toLowerCase() === newSlug.toLowerCase())) {
      counter++;
      newSlug = `${source.slug}-salinan-${counter}`;
    }

    // Clone blocks with new unique IDs and zero clicks
    const clonedBlocks = (source.blocks || []).map((b, idx) => ({
      ...b,
      id: 'blk-' + Math.random().toString(36).substring(2, 9),
      clicks: 0,
      displayOrder: idx + 1
    }));

    const clonedLinks = (source.links || []).map((l, idx) => ({
      ...l,
      id: 'ml-' + Math.random().toString(36).substring(2, 9),
      clicks: 0,
      displayOrder: idx + 1
    }));

    const duplicateEntity: MicrositeEntity = {
      ...source,
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      name: `${source.name} (Duplikat)`,
      slug: newSlug,
      status: 'draft',
      active: true,
      viewCount: 0,
      clickCount: 0,
      views: 0,
      clicks: 0,
      blocks: clonedBlocks,
      links: clonedLinks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: actor.id, name: actor.name }
    };

    list.push(duplicateEntity);
    saveStoredMicrosites(list);

    // Save to Node.js backend server
    try {
      fetch('/api/microsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateEntity)
      }).catch(err => console.warn('Server duplicate microsite error:', err));
    } catch {}

    await saveDocumentData(FIRESTORE_COLLECTION, duplicateEntity.id, duplicateEntity, MICROSITES_STORAGE_KEY);

    await auditService.recordLog({
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      action: 'CREATE',
      module: 'MICROSITES',
      targetId: duplicateEntity.id,
      targetName: duplicateEntity.name,
      description: `Menduplikasi microsite "${source.name}" menjadi "${duplicateEntity.name}" (Slug: ${duplicateEntity.slug})`
    });

    return duplicateEntity;
  },

  exportMicrositeJSON(id: string): string {
    const list = getStoredMicrosites();
    const target = list.find(m => m.id === id);
    if (!target) throw new Error('Microsite tidak ditemukan untuk diekspor.');

    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      entity: {
        ...target,
        id: undefined, // remove ID so imported as new
        password: undefined,
        viewCount: 0,
        clickCount: 0,
        views: 0,
        clicks: 0
      }
    };
    return JSON.stringify(exportData, null, 2);
  },

  exportMicrositeToJSON(microsite: MicrositeEntity): string {
    return this.exportMicrositeJSON(microsite.id);
  },

  async importMicrositeJSON(
    jsonContent: string,
    actor: { id: string; email: string; name: string }
  ): Promise<MicrositeEntity> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Format berkas JSON tidak valid.');
    }

    const payload = parsed.entity || parsed;
    if (!payload.name || !payload.slug) {
      throw new Error('Data konfigurasi JSON tidak lengkap (memerlukan nama dan slug).');
    }

    const list = await fetchMicrosites();
    let uniqueSlug = (payload.slug || 'impor-microsite').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    let counter = 1;
    while (list.some(m => m.slug.toLowerCase() === uniqueSlug.toLowerCase())) {
      uniqueSlug = `${payload.slug}-impor-${counter}`;
      counter++;
    }

    return this.createMicrosite(
      {
        ...payload,
        name: `${payload.name} (Hasil Impor)`,
        slug: uniqueSlug,
        status: 'draft',
        passwordProtected: false,
        password: ''
      },
      actor
    );
  },

  async importMicrositeFromJSON(
    jsonContent: string,
    actor: { id: string; email: string; name: string }
  ): Promise<MicrositeEntity> {
    return this.importMicrositeJSON(jsonContent, actor);
  },

  formatWhatsAppUrl(phoneNumber: string, presetMessage?: string): string {
    let clean = (phoneNumber || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '628' + clean.slice(1);
    }
    const baseUrl = `https://wa.me/${clean}`;
    if (presetMessage && presetMessage.trim()) {
      return `${baseUrl}?text=${encodeURIComponent(presetMessage.trim())}`;
    }
    return baseUrl;
  },

  isBlockScheduledActive(block: MicrositeBlock): boolean {
    if (block.active === false) return false;
    const now = new Date();
    if (block.scheduledStart && typeof block.scheduledStart === 'string' && block.scheduledStart.trim()) {
      const start = new Date(block.scheduledStart);
      if (!isNaN(start.getTime()) && now < start) return false;
    }
    if (block.scheduledEnd && typeof block.scheduledEnd === 'string' && block.scheduledEnd.trim()) {
      const end = new Date(block.scheduledEnd);
      if (!isNaN(end.getTime()) && now > end) return false;
    }
    return true;
  },

  async deleteMicrosite(
    id: string,
    actor: { id: string; email: string; name: string }
  ): Promise<void> {
    const list = await fetchMicrosites();
    const target = list.find(m => m.id === id);
    if (!target) return;

    const filtered = list.filter(m => m.id !== id);
    saveStoredMicrosites(filtered);

    // Delete from Node.js backend server
    try {
      apiFetch(`/api/microsites/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Server delete microsite error:', err));
    } catch {}

    await deleteDocumentData(FIRESTORE_COLLECTION, id, MICROSITES_STORAGE_KEY);

    await auditService.recordLog({
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      action: 'DELETE',
      module: 'MICROSITES',
      targetId: target.id,
      targetName: target.name,
      description: `Menghapus microsite: "${target.name}"`
    });
  },

  async recordAnalyticsEvent(
    micrositeId: string,
    eventType: 'page_view' | 'link_click' | 'social_click' | 'qr_scan' | 'contact_click' | 'share',
    linkId?: string,
    blockId?: string
  ): Promise<void> {
    try {
      const list = getStoredMicrosites();
      const target = list.find(m => m.id === micrositeId);
      if (target) {
        if (eventType === 'page_view') {
          target.viewCount = (target.viewCount || 0) + 1;
          target.views = (target.views || 0) + 1;
        } else if (eventType === 'link_click' || eventType === 'contact_click') {
          target.clickCount = (target.clickCount || 0) + 1;
          target.clicks = (target.clicks || 0) + 1;
          
          if (linkId && target.links) {
            const link = target.links.find(l => l.id === linkId);
            if (link) {
              link.clicks = (link.clicks || 0) + 1;
            }
          }
          if (blockId && target.blocks) {
            const block = target.blocks.find(b => b.id === blockId);
            if (block) {
              block.clicks = (block.clicks || 0) + 1;
            }
          }
        }
        saveStoredMicrosites(list, false);
      }

      // Save event log locally
      const eventKey = `puskesmas_microsite_analytics_${micrositeId}`;
      const existingEventsStr = memStore.getItem(eventKey);
      const events: any[] = existingEventsStr ? JSON.parse(existingEventsStr) : [];
      events.push({
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        micrositeId,
        linkId: linkId || blockId,
        eventType,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      });
      if (events.length > 100) events.splice(0, events.length - 100);
      memStore.setItem(eventKey, JSON.stringify(events));
    } catch (e) {
      console.warn('Analytics tracking error:', e);
    }
  },

  getAnalyticsSummary(micrositeId: string): { views: number; clicks: number; ctr: string } {
    const list = getStoredMicrosites();
    const target = list.find(m => m.id === micrositeId);
    const views = target?.views || target?.viewCount || 0;
    const clicks = target?.clicks || target?.clickCount || 0;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0.0%';
    return { views, clicks, ctr };
  },

  getDetailedAnalytics(micrositeId: string) {
    const eventKey = `puskesmas_microsite_analytics_${micrositeId}`;
    const existingEventsStr = memStore.getItem(eventKey);
    const events: any[] = existingEventsStr ? JSON.parse(existingEventsStr) : [];
    
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    events.forEach(e => {
      const ua = (e.userAgent || '').toLowerCase();
      if (/tablet|ipad|playbook|silk/i.test(ua)) {
        tabletCount++;
      } else if (/mobile|iphone|android|touch/i.test(ua)) {
        mobileCount++;
      } else {
        desktopCount++;
      }
    });

    return {
      events,
      deviceBreakdown: {
        mobile: mobileCount,
        desktop: desktopCount,
        tablet: tabletCount,
        total: events.length
      }
    };
  },

  async verifyPassword(id: string, passwordPlain: string): Promise<boolean> {
    const list = await fetchMicrosites();
    const item = list.find(m => m.id === id);
    if (!item || !item.passwordProtected) return true;
    
    return item.password === hashPassword(passwordPlain);
  },

  generateQRCodeURL(slug: string): string {
    const origin = window.location.origin;
    const url = `${origin}/m/${slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
  }
};
