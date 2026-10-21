import type { SiteSettings } from '../types/index.js';
import { INITIAL_SITE_SETTINGS } from '../firebase/seedData';
import { auditService } from './auditService';
import { getSingleDocument, saveSingleDocument } from '../lib/firebase';
import { syncMetadataToServer, updateClientMetaTags } from '../utils/metaSync';
import { apiFetch } from '../lib/api.js';
import { memStore } from '../lib/memStore';

const LOCAL_STORAGE_KEY = 'puskesmas_site_settings';
const FIRESTORE_COLLECTION = 'site_settings';
const FIRESTORE_DOC_ID = 'global_settings';

const DEFAULT_FULL_SETTINGS: SiteSettings = {
  ...INITIAL_SITE_SETTINGS,
  siteName: 'Puskesmas Manding',
  shortName: 'Puskesmas Manding',
  siteTitle: 'Puskesmas Manding - Portal Resmi & Pelayanan Terpadu',
  siteDescription: 'Portal informasi dan pelayanan kesehatan resmi Puskesmas Manding: Layanan kesehatan primer, pendaftaran online, berita kesehatan, jadwal dokter, microsite, dan pengaduan masyarakat.',
  tagline: 'Bismillah Melayani, Anda Sehat Kami Puas',
  defaultDescription: 'Layanan kesehatan primer terpadu',
  defaultLanguage: 'id',
  timezone: 'Asia/Jakarta',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  defaultPage: 'home',
  
  // Profil Puskesmas & Institusi
  address: 'Jl. Raya Manding, Kec. Manding, Kab. Sumenep, Jawa Timur',
  phone: '(0328) 667123',
  email: 'puskesmasmanding@gmail.com',
  whatsapp: '081234567890',
  operatingHours: 'Senin - Sabtu: 07.30 - 14.00 WIB | UGD & Rawat Inap: 24 Jam',
  vision: 'Sumenep Unggul, Mandiri dan Sejahtera',
  mission: '1. Mewujudkan mutu layanan kesehatan.\n2. Meningkatkan pemberdayaan masyarakat dalam pembangunan kesehatan\n3. Meningkatkan manajemen puskesmas dalam integrasi lintas program dan lintas sektor.',
  history: 'Puskesmas didirikan guna melayani kebutuhan pelayanan kesehatan primer masyarakat dengan pendekatan ramah pasien dan tenaga medis profesional berbasis standar Permenkes.',
  motto: 'Bismillah Melayani, Anda Sehat Kami Puas',
  servicePromise: 'Pimpinan beserta staf penyelenggara pelayanan kesehatan Puskesmas Manding kabupaten Sumenep menyatakan sanggup menyelenggarakan pelayanan kesehatan sesuai standar pelayanan yang telah ditetapkan\nApabila dalam penyelenggaraan pelayanan kesehatan tidak sesuai dengan standar yang telah ditetapkan kami siap melakukan perbaikan secara terus menerus dan siap menerima sanksi sesuai peraturan perundang-undangan yang berlaku, dan atau memberikan kompensasi',
  headOfPuskesmas: 'dr. Nuruddin, M.Kes',
  nipHeadOfPuskesmas: '19780512 200501 1 008',
  puskesmasCode: '35290200018',
  accreditationStatus: 'Paripurna (Kemenkes RI)',
  village: 'Manding Laok',
  district: 'Kecamatan Manding',
  regency: 'Kabupaten Sumenep',
  province: 'Jawa Timur',
  postalCode: '69452',
  latitude: -6.95977323598693,
  longitude: 113.86985314130042,
  googleMapsUrl: 'https://maps.google.com',

  maintenanceMode: false,
  maintenanceMessage: 'Mohon maaf, sistem sedang dalam pemeliharaan berkala.',
  maintenanceEstimatedCompletion: '2 Jam',
  allowAdminAccessDuringMaintenance: true,
  maintenanceBackgroundPreset: 'hospital-modern',
  maintenanceCustomBackgroundUrl: '',
  maintenanceOverlayOpacity: 75,
  maintenanceOverlayStyle: 'blur',
  maintenanceShowMicrositeMenu: true,
  maintenanceShowAdminMenu: true,
  maintenanceShowEmergencyContact: true,
  maintenanceShowDokumenMenu: true,
  maintenanceShowLayananMenu: false,
  maintenanceShowPengaduanMenu: true,
  maintenanceAllowMicrositeAccess: true,
  orgName: 'Dinas Kesehatan Kabupaten Sejahtera',
  orgRegion: 'Kecamatan Mandiri',
  defaultServiceVisibility: 'public',
  serviceDisplayOrder: 'alphabetical',
  servicePublicAvailability: true,
  defaultWorkingDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  holidayHandling: 'emergency_only',
  closedMessage: 'Hari libur / di luar jam operasional. Hubungi UGD 24 Jam.',
  activeHomepage: 'standard',
  defaultSectionOrder: ['hero', 'services', 'announcements', 'stats', 'cta'],
  sectionVisibility: { hero: true, services: true, announcements: true, stats: true, cta: true },
  primaryColor: '#F59E0B',
  secondaryColor: '#10B981',
  typography: 'Plus Jakarta Sans',
  borderRadius: '16px',
  buttonStyle: 'rounded-xl',
  headerStyle: 'sticky',
  footerStyle: 'comprehensive',
  darkModePreference: 'system',
  defaultSeoTitle: 'Puskesmas Manding — Layanan Kesehatan Prima',
  defaultSeoDescription: 'Portal resmi Puskesmas Manding: Pendaftaran online, informasi layanan primer, jadwal dokter, berita kesehatan, dan pengaduan masyarakat.',
  defaultKeywords: 'puskesmas, kesehatan, pendaftaran online, bpjs, mandiri sejahtera',
  ogImageUrl: '',
  robotsConfig: 'index, follow',
  notificationChannels: ['push', 'whatsapp', 'email'],
  notificationRetentionDays: 30,
  adminAlertsEnabled: true,
  emailSenderName: 'Notifikasi Puskesmas',
  emailSenderEmail: 'noreply@puskesmas-mandiri.go.id',
  emailSmtpConfigured: true,
  whatsappStatus: 'Connected',
  whatsappApiTokenMasked: '••••••••1234',
  micrositeEnabled: true,
  micrositeDefaultTemplate: 'modern',
  micrositeDefaultTheme: 'emerald',
  micrositePasswordProtected: false,
  searchContentTypes: ['posts', 'services', 'documents', 'faqs'],
  searchMaxResults: 10,
  searchSuggestionEnabled: true,
  searchResultOrdering: 'relevance',
  sessionTimeoutMinutes: 60,
  passwordPolicyLevel: 'strict',
  loginProtectionEnabled: true,
  backupScheduleCron: '0 2 * * *',
  backupRetentionDays: 7,
  autoBackupEnabled: true,
  showPhonePublic: true,
  showEmailPublic: true,
  showWhatsappPublic: true,
  showSocialPublic: true,
  showAddressPublic: true,
  showEmergencyPublic: true
};

/** Satu entri hari operasional. */
interface OperatingDay {
  isOpen?: boolean;
  dayNameId?: string;
  day?: string;
  openTime?: string;
  closeTime?: string;
}

export function formatOperatingHoursText(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (Array.isArray(val) && val.length > 0) {
    const openDays = (val as OperatingDay[]).filter((d) => d && d.isOpen);
    if (openDays.length > 0) {
      const first = openDays[0];
      const last = openDays[openDays.length - 1];
      const firstDay = first.dayNameId || first.day || 'Senin';
      const lastDay = last.dayNameId || last.day || 'Sabtu';
      const openT = first.openTime || '07:30';
      const closeT = first.closeTime || '14:00';
      return `${firstDay} - ${lastDay}: ${openT} - ${closeT} WIB | UGD & Rawat Inap: 24 Jam`;
    }
  }
  return DEFAULT_FULL_SETTINGS.operatingHours;
}

function normalizeSettings(data: unknown): SiteSettings {
  if (!data || typeof data !== 'object') return DEFAULT_FULL_SETTINGS;
  const d = data as Record<string, unknown>;
  return {
    ...DEFAULT_FULL_SETTINGS,
    ...d,
    operatingHours: formatOperatingHoursText(d.operatingHours)
  };
}

export const siteSettingsService = {
  getCachedSettings(): SiteSettings {
    try {
      const local = memStore.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        return normalizeSettings(JSON.parse(local));
      }
    } catch {}
    return DEFAULT_FULL_SETTINGS;
  },

  async getSettings(): Promise<SiteSettings> {
    // 1. Fetch from server API (authoritative across all devices & browsers)
    try {
      const res = await fetch('/api/site-settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings && typeof json.settings === 'object') {
          const merged: SiteSettings = normalizeSettings(json.settings);
          memStore.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}

    // 2. Fallback to VPS database via /api/db/*
    const rawData = await getSingleDocument<SiteSettings>(
      FIRESTORE_COLLECTION,
      FIRESTORE_DOC_ID,
      LOCAL_STORAGE_KEY,
      DEFAULT_FULL_SETTINGS
    );
    const normalized = normalizeSettings(rawData);
    try {
      memStore.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    } catch {}
    return normalized;
  },

  async getPublicSettings(): Promise<Partial<SiteSettings>> {
    const settings = await this.getSettings();
    // Return only safe public fields
    return {
      siteName: settings.siteName,
      shortName: settings.shortName,
      siteDescription: settings.siteDescription,
      tagline: settings.tagline,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      address: settings.showAddressPublic !== false ? settings.address : undefined,
      phone: settings.showPhonePublic !== false ? settings.phone : undefined,
      email: settings.showEmailPublic !== false ? settings.email : undefined,
      whatsapp: settings.showWhatsappPublic !== false ? settings.whatsapp : undefined,
      operatingHours: settings.operatingHours,
      facebookUrl: settings.showSocialPublic !== false ? settings.facebookUrl : undefined,
      instagramUrl: settings.showSocialPublic !== false ? settings.instagramUrl : undefined,
      youtubeUrl: settings.showSocialPublic !== false ? settings.youtubeUrl : undefined,
      tiktokUrl: settings.showSocialPublic !== false ? settings.tiktokUrl : undefined,
      xUrl: settings.showSocialPublic !== false ? settings.xUrl : undefined,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage
    };
  },

  async updateSettings(updated: Partial<SiteSettings>, updatedBy?: { id?: string; email?: string; name?: string }): Promise<SiteSettings> {
    const actorId = updatedBy?.id || 'usr-superadmin-01';
    const actorEmail = updatedBy?.email || 'elengemail@gmail.com';
    const actorName = updatedBy?.name || 'Super Admin';

    // 1. Get baseline settings without blocking network call
    const current = this.getCachedSettings();
    const newSettings: SiteSettings = normalizeSettings({
      ...current,
      ...updated,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    });

    // 2. Optimistic instant write ke memori (0ms)
    try {
      memStore.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
      memStore.setItem('puskesmas_maintenance_mode', newSettings.maintenanceMode ? 'true' : 'false');
    } catch (e) {
      console.warn('LocalStorage settings save failed:', e);
    }

    // 3. Immediately notify active components in window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puskesmas_settings_updated', { detail: newSettings }));
    }

    // 4. Bi-directional synchronization to contactService (puskesmas_contact_settings_v1)
    try {
      const storedContact = memStore.getItem('puskesmas_contact_settings_v1');
      const contactObj = storedContact ? JSON.parse(storedContact) : null;
      if (contactObj) {
        if (newSettings.siteName) contactObj.name = newSettings.siteName;
        if (newSettings.tagline) contactObj.tagline = newSettings.tagline;
        if (newSettings.address) contactObj.address = newSettings.address;
        if (newSettings.village) contactObj.village = newSettings.village;
        if (newSettings.district) contactObj.district = newSettings.district;
        if (newSettings.regency) contactObj.regency = newSettings.regency;
        if (newSettings.province) contactObj.province = newSettings.province;
        if (newSettings.postalCode) contactObj.postalCode = newSettings.postalCode;
        if (newSettings.latitude) contactObj.latitude = newSettings.latitude;
        if (newSettings.longitude) contactObj.longitude = newSettings.longitude;
        if (newSettings.timezone) contactObj.timezone = newSettings.timezone;

        if (Array.isArray(contactObj.channels)) {
          if (newSettings.phone) {
            const ch = contactObj.channels.find((c: { type?: string }) => c.type === 'Phone');
            if (ch) ch.value = newSettings.phone;
          }
          if (newSettings.whatsapp) {
            const ch = contactObj.channels.find((c: { type?: string }) => c.type === 'WhatsApp');
            if (ch) ch.value = newSettings.whatsapp;
          }
          if (newSettings.email) {
            const ch = contactObj.channels.find((c: { type?: string }) => c.type === 'Email');
            if (ch) ch.value = newSettings.email;
          }
        }
        contactObj.updatedAt = new Date().toISOString();
        memStore.setItem('puskesmas_contact_settings_v1', JSON.stringify(contactObj));
        saveSingleDocument('site_settings', 'contact_settings_v1', contactObj, 'puskesmas_contact_settings_v1').catch(() => {});
        try {
          apiFetch('/api/contact-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactObj)
          }).catch(() => {});
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('puskesmas_contact_updated', { detail: contactObj }));
        }
      }
    } catch (syncErr) {
      console.warn('Sync to contact settings error:', syncErr);
    }

    // Direct server POST for immediate reflection across all devices & browsers
    try {
      apiFetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      }).catch(() => {});
    } catch {}

    // Bi-directional synchronization of primary/secondary colors to theme
    if (updated.primaryColor || updated.secondaryColor) {
      try {
        const themeRaw = memStore.getItem('puskesmas_theme_published_config');
        if (themeRaw) {
          const themeObj = JSON.parse(themeRaw);
          if (updated.primaryColor) themeObj.primaryColor = updated.primaryColor;
          if (updated.secondaryColor) themeObj.secondaryColor = updated.secondaryColor;
          themeObj.updatedAt = new Date().toISOString();
          memStore.setItem('puskesmas_theme_published_config', JSON.stringify(themeObj));
          saveSingleDocument('theme_config', 'published', themeObj, 'puskesmas_theme_published_config').catch(() => {});
          apiFetch('/api/theme/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(themeObj)
          }).catch(() => {});
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('puskesmas_theme_updated'));
          }
        }
      } catch (themeSyncErr) {
        console.warn('Sync to theme error:', themeSyncErr);
      }
    }

    // 5. Asynchronously persist to VPS database via /api/db/*
    saveSingleDocument(FIRESTORE_COLLECTION, 'global_settings', newSettings, LOCAL_STORAGE_KEY).catch(err => {
      console.warn('Background VPS DB save failed:', err);
    });
    saveSingleDocument(FIRESTORE_COLLECTION, 'global-settings', newSettings, LOCAL_STORAGE_KEY).catch(() => {});

    // 6. Sync metadata to Node.js server for instant WhatsApp & social link preview reflection
    try {
      syncMetadataToServer(newSettings).catch(() => {});
      updateClientMetaTags({
        title: newSettings.siteTitle || `${newSettings.siteName} - Portal Resmi`,
        description: newSettings.siteDescription,
        siteName: newSettings.siteName,
        image: newSettings.ogImageUrl || newSettings.logoUrl
      });
    } catch {}

    // 7. Record audit log without blocking main flow
    auditService.recordLog({
      userId: actorId,
      userEmail: actorEmail,
      userName: actorName,
      action: 'SETTINGS_CHANGE',
      module: 'SETTINGS',
      targetId: 'global-settings',
      targetName: newSettings.siteName,
      description: `Memperbarui konfigurasi profil & pengaturan umum sistem (Maintenance Mode: ${newSettings.maintenanceMode ? 'AKTIF' : 'NONAKTIF'}).`
    }).catch(err => console.warn('Audit log error:', err));

    return newSettings;
  },

  async resetToDefault(updatedBy: { id: string; email: string; name: string }): Promise<SiteSettings> {
    await saveSingleDocument(FIRESTORE_COLLECTION, FIRESTORE_DOC_ID, DEFAULT_FULL_SETTINGS, LOCAL_STORAGE_KEY);
    memStore.setItem('puskesmas_maintenance_mode', 'false');
    const defaults = await this.getSettings();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puskesmas_settings_updated', { detail: defaults }));
      try {
        syncMetadataToServer(defaults).catch(() => {});
        updateClientMetaTags({
          title: defaults.siteTitle || `${defaults.siteName} - Portal Resmi`,
          description: defaults.siteDescription,
          siteName: defaults.siteName,
          image: defaults.ogImageUrl || defaults.logoUrl
        });
      } catch {}
    }

    await auditService.recordLog({
      userId: updatedBy.id,
      userEmail: updatedBy.email,
      userName: updatedBy.name,
      action: 'SETTINGS_CHANGE',
      module: 'SETTINGS',
      targetId: 'global-settings',
      targetName: 'Default Settings',
      description: 'Mengembalikan konfigurasi sistem ke pengaturan default pabrik.'
    });

    return defaults;
  }
};
