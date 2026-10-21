export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole?: boolean;
  updatedAt?: string;
}

export interface UserPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  roleId: string;
  roleName?: string;
  permissions?: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  shortName?: string;
  siteDescription: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  
  // Website
  siteTitle?: string;
  defaultDescription?: string;
  defaultLanguage?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  defaultPage?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceEstimatedCompletion?: string;
  allowAdminAccessDuringMaintenance?: boolean;
  maintenanceBackgroundPreset?: string;
  maintenanceCustomBackgroundUrl?: string;
  maintenanceOverlayOpacity?: number;
  maintenanceOverlayStyle?: 'dark' | 'glass' | 'blur' | 'gradient';
  maintenanceShowMicrositeMenu?: boolean;
  maintenanceShowAdminMenu?: boolean;
  maintenanceShowEmergencyContact?: boolean;
  maintenanceShowDokumenMenu?: boolean;
  maintenanceShowLayananMenu?: boolean;
  maintenanceShowPengaduanMenu?: boolean;
  maintenanceAllowMicrositeAccess?: boolean;

  // Organization
  orgName?: string;
  orgRegion?: string;

  // Institutional Profile (Profil Puskesmas)
  vision?: string;
  mission?: string;
  history?: string;
  motto?: string;
  servicePromise?: string;
  headOfPuskesmas?: string;
  nipHeadOfPuskesmas?: string;
  puskesmasCode?: string;
  accreditationStatus?: string;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  postalCode?: string;

  // Contact
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  operatingHours: string;
  
  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;

  // Location
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;

  // Service
  defaultServiceVisibility?: 'public' | 'internal';
  serviceDisplayOrder?: 'alphabetical' | 'custom' | 'popularity';
  servicePublicAvailability?: boolean;

  // Schedule
  defaultWorkingDays?: string[];
  holidayHandling?: 'close' | 'emergency_only';
  closedMessage?: string;

  // Homepage
  activeHomepage?: string;
  defaultSectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;

  // Theme
  primaryColor?: string;
  secondaryColor?: string;
  typography?: string;
  borderRadius?: string;
  buttonStyle?: string;
  headerStyle?: string;
  footerStyle?: string;
  darkModePreference?: 'light' | 'dark' | 'system';

  // SEO
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultKeywords?: string;
  ogImageUrl?: string;
  robotsConfig?: string;

  // Notification
  notificationChannels?: string[];
  notificationRetentionDays?: number;
  adminAlertsEnabled?: boolean;

  // Email
  emailSenderName?: string;
  emailSenderEmail?: string;
  emailSmtpConfigured?: boolean;

  // WhatsApp
  whatsappStatus?: 'Connected' | 'Disconnected' | 'Configuration Error';
  whatsappApiTokenMasked?: string;

  // Microsite
  micrositeEnabled?: boolean;
  micrositeDefaultTemplate?: string;
  micrositeDefaultTheme?: string;
  micrositePasswordProtected?: boolean;

  // Search
  searchContentTypes?: string[];
  searchMaxResults?: number;
  searchSuggestionEnabled?: boolean;
  searchResultOrdering?: 'relevance' | 'date';

  // Security
  sessionTimeoutMinutes?: number;
  passwordPolicyLevel?: 'standard' | 'strict';
  loginProtectionEnabled?: boolean;

  // Backup
  backupScheduleCron?: string;
  backupRetentionDays?: number;
  autoBackupEnabled?: boolean;

  // Public Display Toggles
  showPhonePublic?: boolean;
  showEmailPublic?: boolean;
  showWhatsappPublic?: boolean;
  showSocialPublic?: boolean;
  showAddressPublic?: boolean;
  showEmergencyPublic?: boolean;

  // Feature Flags / Modular Toggles
  featureFlags?: Partial<SiteFeatureFlags>;

  updatedAt: string;
  updatedBy?: string;
}

export interface SiteFeatureFlags {
  onlineQueue: boolean;        // Pendaftaran & Antrean Online (/pendaftaran, /antrian, /antrian-display)
  complaints: boolean;         // Keluhan, Pengaduan, & Kritik Saran (/pengaduan, /kritik-saran)
  skm: boolean;                // Survei Kepuasan Masyarakat (SKM) (/survei)
  microsite: boolean;          // Microsite & Portal Khusus (/microsites, /m/:slug)
  publicInfoRequests: boolean; // Permintaan Informasi & PPID (/permintaan-informasi, /informasi-publik)
  news: boolean;               // Berita & Artikel Edukasi Kesehatan (/berita)
  documents: boolean;          // Dokumen Publik, Regulasi SPP & SOP (/dokumen)
  gallery: boolean;            // Galeri Foto Dokumentasi Kegiatan (/galeri)
  faq: boolean;                // FAQ & Pusat Bantuan (/faq, /pusat-bantuan)
  staffDirectory: boolean;     // Direktori Petugas / Tenaga Medis (/profil/petugas)
  orgStructure: boolean;       // Struktur Organisasi (/profil/struktur-organisasi)
  facilities: boolean;         // Sarana & Fasilitas (/fasilitas)
  notifications: boolean;      // Notifikasi & Pengumuman Terkini (/notifications)
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PUBLISH' | 'UNPUBLISH' | 'ROLE_CHANGE' | 'SETTINGS_CHANGE' | 'EXPORT';
  module: 'AUTH' | 'USERS' | 'ROLES' | 'PERMISSIONS' | 'PAGES' | 'SERVICES' | 'HOMEPAGE' | 'THEME' | 'MICROSITES' | 'SETTINGS' | 'MEDIA' | 'SERVICE_CLUSTERS' | 'SERVICE_CATEGORIES' | 'CMS_CATEGORY' | 'POSTS' | 'DOCUMENTS' | 'SERVICE_UNITS' | 'SERVICE_LOCATIONS' | 'SERVICE_REQUIREMENTS' | 'SERVICE_PROCEDURES' | 'SERVICE_PRODUCTS' | 'SERVICE_STANDARDS' | 'SERVICE_SCHEDULES' | 'SERVICE_EXCEPTIONS' | 'SERVICE_PRICING' | 'COMPLAINTS' | 'ONLINE_REGISTRATIONS' | 'SURVEYS' | 'PUBLIC_INFO' | 'INFORMATION_REQUESTS';
  targetId?: string;
  targetName?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  mimeType: string;
  size: number; // in bytes
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  category?: string;
  usedInCount?: number;
  usedInDetails?: { type: string; title: string; id: string }[];
}

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived' | 'Draft' | 'Published' | 'Unpublished' | 'Archived';

export interface PageEntity {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Sanitized HTML or structured block content
  featuredImage?: string;
  status: ContentStatus;
  visibility: 'public' | 'private' | 'password';
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  updatedBy: { id: string; name: string; email: string };
  publishedAt?: string;
  publishedBy?: { id: string; name: string };
  version: number;
}

export interface PageRevision {
  id: string;
  pageId: string;
  title: string;
  content: string;
  excerpt: string;
  modifiedBy: { id: string; name: string };
  modifiedAt: string;
  version: number;
}

export interface PostEntity {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  categoryName?: string;
  tagIds: string[];
  tagNames?: string[];
  authorId: string;
  authorName: string;
  status: ContentStatus;
  publishedAt?: string;
  publishedBy?: { id: string; name: string };
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
}

export interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'post' | 'document' | 'service' | 'general';
  parentId?: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface TagEntity {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
}

export type PriorityLevel = 'normal' | 'high' | 'urgent';

export interface AnnouncementEntity {
  id: string;
  title: string;
  content: string;
  priority: PriorityLevel;
  startDate?: string;
  endDate?: string;
  status: ContentStatus;
  createdAt: string;
  createdBy: { id: string; name: string };
  updatedAt: string;
  updatedBy?: { id: string; name: string };
}

export interface DocumentEntity {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  publishedAt?: string;
  status: ContentStatus;
  downloadCount: number;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  
  // Phase 5H additions
  serviceId?: string;
  serviceName?: string;
  unitId?: string;
  unitName?: string;
  documentNumber?: string;
  version: string;
  isCurrentVersion: boolean;
  originalDocId?: string;
  validFrom?: string;
  visibility: 'public' | 'private';
  isForm?: boolean;
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  displayOrder: number;
}

export interface FormEntity {
  id: string;
  title: string;
  description?: string;
  version: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  categoryName?: string;
  unitId?: string;
  unitName?: string;
  locationId?: string;
  locationName?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export interface FormSubmissionEntity {
  id: string;
  trackingNumber: string;
  formId: string;
  formTitle: string;
  formVersion: string;
  submittedAt: string;
  status: 'received' | 'processing' | 'completed' | 'rejected';
  response: Record<string, any>;
  attachments?: { fieldId: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
  processedBy?: { id: string; name: string };
  processedAt?: string;
  notes?: string;
  history: { status: string; updatedAt: string; updatedBy: { id: string; name: string }; notes?: string }[];
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage: string;
  images: { id: string; url: string; caption?: string }[];
  status: ContentStatus;
  publishedAt?: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export type MenuItemType = 'page' | 'post' | 'service' | 'category' | 'microsite' | 'external' | 'custom';

export interface MenuItem {
  id: string;
  label: string;
  type: MenuItemType;
  targetId?: string;
  url?: string;
  parentId?: string;
  order: number;
  enabled: boolean;
  openInNewTab: boolean;
  visibility: 'all' | 'guest' | 'authenticated';
  createdAt: string;
  updatedAt?: string;
}

export interface MenuTreeItem extends MenuItem {
  children?: MenuTreeItem[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string;
  type: 'service' | 'news' | 'article' | 'announcement' | 'faq' | 'guide' | 'document' | 'agenda' | 'facility' | 'staff' | 'public-info' | 'page';
  url: string;
  publishedAt?: string;
  category?: string;
  image?: string;
  badge: string;
  relevanceScore?: number;
}

export type ServiceStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived' | 'inactive';
export type ActiveStatus = 'active' | 'inactive' | 'archived';

export interface ServiceCategoryEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  clusterId?: string;
  clusterName?: string;
  status: ActiveStatus;
  displayOrder: number;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceClusterEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: ActiveStatus;
  displayOrder: number;
  categoryCount?: number;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceUnitEntity {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: ActiveStatus;
  displayOrder: number;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceLocationEntity {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  description?: string;
  status: ActiveStatus;
  displayOrder: number;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceEntity {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: ServiceStatus;
  categoryId?: string;
  categoryName?: string;
  clusterId?: string;
  clusterName?: string;
  unitId?: string;
  unitName?: string;
  locationId?: string;
  locationName?: string;
  featured: boolean;
  displayOrder: number;
  onlineRegistrationEnabled?: boolean; // Toggle for online registration
  queueEnabled?: boolean; // Toggle for digital queue
  queuePrefix?: string; // Queue prefix, e.g., "A", "UM"
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
  submittedAt?: string;
  submittedBy?: { id: string; name: string; email?: string };
  reviewedAt?: string;
  reviewedBy?: { id: string; name: string; email?: string };
  publishedAt?: string;
  publishedBy?: { id: string; name: string };
  rejectionReason?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

// Phase 4C Entities
export interface ServiceRequirementEntity {
  id: string;
  serviceId: string;
  title: string;
  description?: string;
  required: boolean;
  displayOrder: number;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceProcedureEntity {
  id: string;
  serviceId: string;
  stepNumber: number;
  title: string;
  description?: string;
  displayOrder: number;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceProductEntity {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export interface ServiceStandardEntity {
  id: string;
  serviceId: string;
  requirementsSummary?: string;
  procedureSummary?: string;
  serviceTime?: string;
  serviceProductSummary?: string;
  facilities?: string;
  executorCompetency?: string;
  supervision?: string;
  complaintChannelSummary?: string;
  evaluation?: string;
  additionalInformation?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

// Phase 4D Entities
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ServiceScheduleRuleEntity {
  id: string;
  serviceId: string;
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime?: string; // HH:mm
  closeTime?: string; // HH:mm
  breakStart?: string; // HH:mm
  breakEnd?: string; // HH:mm
  displayOrder: number;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceScheduleEntity {
  id: string;
  serviceId: string;
  timezone: string; // default "Asia/Jakarta"
  status: ActiveStatus;
  rules: ServiceScheduleRuleEntity[];
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export type ScheduleExceptionType = 'closed' | 'special_hours' | 'modified_hours';

export interface ServiceScheduleExceptionEntity {
  id: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  type: ScheduleExceptionType;
  isOpen: boolean;
  openTime?: string; // HH:mm
  closeTime?: string; // HH:mm
  breakStart?: string; // HH:mm
  breakEnd?: string; // HH:mm
  reason: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

export type PricingType = 'free' | 'fixed' | 'variable' | 'according_to_regulation' | 'insurance_covered' | 'not_available';

export interface ServicePricingEntity {
  id: string;
  serviceId: string;
  pricingType: PricingType;
  amount?: number | null;
  currency: string; // default "IDR"
  unit?: string; // e.g., "per layanan", "per tindakan"
  description?: string;
  status: ActiveStatus;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email?: string };
  updatedBy?: { id: string; name: string; email?: string };
}

// PHASE 4F: KRITIK, SARAN & PENGADUAN
export type ComplaintType = 'kritik' | 'saran' | 'pengaduan' | 'apresiasi' | 'informasi';
export type ComplaintStatus = 'new' | 'verified' | 'assigned' | 'processing' | 'pending_info' | 'completed' | 'closed' | 'rejected';
export type ComplaintPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ComplaintAttachment {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
}

export interface InternalNoteItem {
  id: string;
  authorId: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface PublicResponseItem {
  id: string;
  authorName: string;
  response: string;
  createdAt: string;
}

export interface ComplaintEntity {
  id: string;
  ticketNumber: string; // e.g. ADU-2026-000123
  type: ComplaintType;
  title: string; // Added: Title of complaint
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  isAnonymous: boolean;
  serviceId?: string; // Optional related service ID
  serviceName?: string; // Cache service name or "Tidak terkait layanan tertentu"
  unitId?: string; // Optional unit ID
  unitName?: string; // Cache unit name
  locationId?: string; // Optional location ID
  locationName?: string; // Cache location name
  category?: string; // Configurable category
  occurrenceDate?: string; // YYYY-MM-DD
  content: string;
  attachment?: ComplaintAttachment;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string; // User ID
  assignedToName?: string; // User Display Name
  internalNotes?: InternalNoteItem[];
  publicResponses?: PublicResponseItem[]; // Added: public visible responses
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  isDuplicate?: boolean; // Is marked duplicate
  duplicateOfTicket?: string; // Ticket number of original if duplicate
  targetResponseTime?: string; // SLA Target response ISO string
  targetResolutionTime?: string; // SLA Target resolution ISO string
  satisfactionRating?: number; // 1-5 rating if surveyed
  satisfactionComment?: string; // text comment if surveyed
}

export type MicrositeLinkType = 'internal' | 'external' | 'whatsapp' | 'call' | 'email' | 'youtube' | 'pdf' | 'header' | 'service' | 'post' | 'page';

export type MicrositeBlockType =
  | 'link'           // Tombol Tautan Kustom
  | 'heading'        // Judul Bagian / Group Divider
  | 'text'           // Teks Informasi / Kartu Bio
  | 'announcement'   // Banner Pengumuman Penting / Alert
  | 'image'          // Banner Gambar / Poster Flyer
  | 'image_link'     // Poster Gambar dengan Link Klik
  | 'video'          // Embed YouTube / Video Edukasi
  | 'whatsapp'       // Tombol Chat WhatsApp Resmi + Pesan Otomatis
  | 'phone'          // Hotline Panggilan Darurat / Ambulans
  | 'email'          // Kontak Email Resmi
  | 'location'       // Peta Lokasi / Google Maps
  | 'download'       // Tombol Download Dokumen / Panduan PDF
  | 'divider'        // Garis Pemisah Artistik
  | 'spacer'         // Spasi / Jarak Antar Elemen
  | 'qr_code'        // Kartu QR Code Cepat
  | 'social_icons';   // Deretan Ikon Media Sosial

export interface MicrositeBlock {
  id: string;
  type: MicrositeBlockType;
  title?: string;
  subtitle?: string;
  content?: string;             // Text body, HTML/Markdown, video ID, or custom description
  url?: string;                 // Destination link, download link, or embed source
  icon?: string;                // Lucide icon identifier
  thumbnailUrl?: string;        // Thumbnail or poster image
  badgeText?: string;           // e.g. "HOT", "BARU", "24 JAM", "GRATIS"
  isFeatured?: boolean;         // Pulsing / glowing featured styling
  active: boolean;              // Toggle visibility
  scheduledStart?: string;      // ISO datetime start publish
  scheduledEnd?: string;        // ISO datetime end publish
  clicks?: number;              // Click count analytics
  displayOrder: number;
  group?: string;               // Optional group / category name
  groupId?: string;             // Optional group ID reference
  // WhatsApp specific config
  whatsappNumber?: string;      // 628xxxx
  whatsappMessage?: string;     // Auto-filled message preset
  // Download specific config
  fileSize?: string;            // e.g. "2.4 MB"
  fileFormat?: string;          // e.g. "PDF", "DOCX"
  // Styling overrides
  customStyle?: {
    backgroundColor?: string;
    textColor?: string;
    buttonVariant?: 'filled' | 'outline' | 'glass' | 'shadow' | 'gradient';
    alignment?: 'left' | 'center' | 'right';
    spacerHeight?: 'sm' | 'md' | 'lg' | 'xl';
  };
}

export interface MicrositeGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isCollapsible?: boolean;
  collapsible?: boolean;
  isDefaultCollapsed?: boolean;
  displayOrder: number;
  active?: boolean;
}

export interface MicrositeLink {
  id: string;
  label: string;
  subtitle?: string;
  url: string;
  type: MicrositeLinkType | 'internal' | 'external';
  displayOrder: number;
  icon?: string; // lucide icon identifier e.g. 'Stethoscope', 'Phone', 'FileText', 'Calendar', 'Shield', 'HelpCircle', 'Video', 'MapPin'
  thumbnailUrl?: string; // image thumbnail next to link button
  isFeatured?: boolean; // Highlighted / Pulsing badge
  badgeText?: string; // e.g. "HOT", "BARU", "24 JAM", "GRATIS"
  clicks?: number; // Click count analytics
  scheduledStart?: string; // ISO date for timed link reveal
  scheduledEnd?: string; // ISO date for timed link expire
  archived?: boolean; // toggle visibility
}

export interface MicrositeCategory {
  name: string;
  description: string;
}

export interface MicrositeAnalyticsEvent {
  id: string;
  micrositeId: string;
  linkId?: string; // If link click
  blockId?: string; // If block click
  eventType: 'page_view' | 'link_click' | 'social_click' | 'qr_scan' | 'contact_click' | 'share';
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export type MicrositeHeaderStyle =
  | 'banner_hero'          // Banner gambar besar di atas dengan avatar menumpuk
  | 'avatar_top'           // Logo / avatar melingkar di atas, judul di tengah
  | 'glassmorphism_card'   // Kartu kaca transparan elegan dengan border aksen
  | 'compact_inline'       // Baris ringkas horizontal (Logo kiri, teks kanan)
  | 'minimal_text'         // Tipografi bersih minimalis tanpa kartu tebal
  | 'split_cover';         // Header split dua kolom modern

export type MicrositeHeaderHeight = 'compact' | 'medium' | 'tall';
export type MicrositeAvatarShape = 'circle' | 'rounded' | 'square' | 'hexagon';
export type MicrositeBackgroundType = 'animation' | 'image' | 'solid' | 'gradient';

export type MicrositeFooterStyle =
  | 'minimal'           // Teks simpel & hak cipta
  | 'card_clean'        // Kartu modern dengan aksi cepat & media sosial
  | 'government_formal' // Format resmi instansi (Logo Kemenkes/GERMAS, Akreditasi, Maklumat, Kontak)
  | 'compact_badge'     // Badge kapsul mengambang elegan
  | 'floating_bar'      // Bar navigasi bawah mengambang
  | 'hidden';           // Sembunyikan footer

export interface MicrositeFooterLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
  isExternal?: boolean;
}

export interface MicrositeFooterConfig {
  style?: MicrositeFooterStyle;
  customCopyrightText?: string;
  customTagline?: string;
  showSocialLinks?: boolean;
  socialStyle?: 'pills' | 'floating_icons' | 'rounded_cards';
  showContactSummary?: boolean;
  showBackToTop?: boolean;
  showShareButton?: boolean;
  showQRButton?: boolean;
  showGovernmentBadges?: boolean;
  governmentBadges?: ('germas' | 'kemenkes' | 'akreditasi' | 'puskesmas')[];
  customBadgesText?: string;
  links?: MicrositeFooterLink[];
  alignment?: 'center' | 'left';
  textColor?: string;
}

export interface MicrositeHeaderConfig {
  style?: MicrositeHeaderStyle;
  height?: MicrositeHeaderHeight;
  avatarShape?: MicrositeAvatarShape;
  showCategoryBadge?: boolean;
  categoryBadgeText?: string;
  showVerifiedBadge?: boolean;
  customTitle?: string;
  customSubtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  bannerOverlayOpacity?: number; // 0 to 100
  bannerOverlayGradient?: boolean;
  alignment?: 'center' | 'left';
  showShareButton?: boolean;
  showQRButton?: boolean;
}

export interface MicrositeThemeCustomization {
  theme: 'fresh_mint' | 'sehat_hijau' | 'sage_wellness' | 'teal_health' | 'aqua_sehat' | 'government_health' | 'emerald' | 'sky' | 'rose' | 'neutral' | 'light' | 'dark' | 'custom' | string;
  template?: HomepageTemplateType;
  backgroundAnimation?: BackgroundAnimationType;
  backgroundType?: MicrositeBackgroundType;
  accentColor?: string; // hex
  buttonStyle?: 'pill' | 'rounded' | 'sharp';
  buttonVariant?: 'filled' | 'outline' | 'glass' | 'shadow' | 'gradient';
  backgroundColor?: string; // hex or CSS gradient
  bgImageUrl?: string;
  bgImageOpacity?: number; // 0 to 100
  bgImageBlur?: 'none' | 'sm' | 'md' | 'lg';
  bgPattern?: 'none' | 'dots' | 'grid' | 'waves';
  cardGlassmorphism?: boolean;
  avatarStyle?: MicrositeAvatarShape;
  verifiedBadge?: boolean;
  headerConfig?: MicrositeHeaderConfig;
  footerConfig?: MicrositeFooterConfig;
}

export interface MicrositeEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  ogImageUrl?: string;
  headerConfig?: MicrositeHeaderConfig;
  footerConfig?: MicrositeFooterConfig;
  status: ContentStatus;
  active: boolean;
  passwordProtected: boolean;
  password?: string;
  links: MicrositeLink[];
  blocks?: MicrositeBlock[];
  groups?: MicrositeGroup[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    whatsapp?: string;
    telegram?: string;
    tiktok?: string;
    linkedin?: string;
    spotify?: string;
    threads?: string;
  };
  socialPosition?: 'top' | 'bottom' | 'both';
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  mapUrl?: string;
  themeCustomization?: MicrositeThemeCustomization;
  seoTitle?: string;
  seoDescription?: string;
  viewCount?: number;
  clickCount?: number;
  views?: number;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

export interface GlobalThemeConfig {
  id: string;
  themeName: string;
  colorPrimary: string; // hex
  colorSecondary: string; // hex
  colorAccent: string; // hex
  colorBg: string; // hex
  colorText: string; // hex
  colorCard: string; // hex
  colorBorder: string; // hex
  colorPrimaryForeground?: string;
  colorSecondaryForeground?: string;
  colorAccentForeground?: string;
  colorSurface?: string;
  colorSurfaceForeground?: string;
  colorMuted?: string;
  colorMutedForeground?: string;
  colorInput?: string;
  colorRing?: string;
  colorSuccess?: string;
  colorWarning?: string;
  colorDanger?: string;
  colorInfo?: string;
  radius: 'sharp' | 'rounded' | 'pill';
  buttonStyle: 'sharp' | 'rounded' | 'pill';
  fontFamily?: string;
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy?: string;
}

export type HomepageTemplateType = 
  | 'modern_majestic'
  | 'artistic_bio'
  | 'avant_garde'
  | 'nusantara_art'
  | 'minimal_gallery'
  | 'classic';

export type BackgroundAnimationType = 
  | 'aurora_flow'
  | 'particle_mesh'
  | 'bioluminescent'
  | 'geometric_waves'
  | 'golden_radiance'
  | 'subtle_glow'
  | 'none';

export interface HomepageSection {
  id: string;
  type: 'hero' | 'sambutan' | 'info' | 'unggulan' | 'layanan' | 'jadwal' | 'berita' | 'pengumuman' | 'statistik' | 'kritik_saran' | 'kontak' | 'lokasi' | 'cta' | 'search' | 'microsites';
  title: string;
  visible: boolean;
  order: number;
  settings: Record<string, any>;
}

export interface HomepageBuilderConfig {
  id: string;
  template?: HomepageTemplateType;
  backgroundAnimation?: BackgroundAnimationType;
  heroStyle?: 'grand_split' | 'cinematic_centered' | 'asymmetric_art' | 'immersive_showcase';
  artisticLighting?: boolean;
  sections: HomepageSection[];
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy?: string;
}

// PHASE 5A: ONLINE SERVICE REGISTRATION
export type RegistrationStatus = 'waiting' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface RegistrationHistoryItem {
  status: RegistrationStatus;
  updatedBy: string;
  updatedAt: string;
  notes?: string;
}

export interface ServiceRegistrationEntity {
  id: string;
  registrationNumber: string; // e.g. REG-2026-000001
  fullName: string;
  identityNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'L' | 'P'; // Laki-laki / Perempuan
  phoneNumber: string;
  whatsappConsent?: boolean;
  serviceId: string;
  serviceName: string;
  visitDate: string; // YYYY-MM-DD
  notes?: string;
  adminNotes?: string;
  status: RegistrationStatus;
  rejectionReason?: string;
  queueNumber?: string;
  queueStatus?: 'waiting' | 'calling' | 'serving' | 'completed' | 'skipped' | 'cancelled';
  queueCalledAt?: string;
  counterNumber?: number;
  createdAt: string;
  updatedAt: string;
  history: RegistrationHistoryItem[];
}

export interface NotificationEntity {
  id: string;
  userId: string; // user's uid, or identityNumber for public mapping
  title: string;
  message: string;
  type: 'system' | 'registration' | 'queue' | 'complaint' | 'survey' | 'document' | 'content' | 'approval' | 'schedule' | 'facility' | 'information';
  priority?: 'Normal' | 'Important' | 'Urgent';
  status: 'unread' | 'read' | 'archived';
  channel: 'in_app' | 'whatsapp' | 'email' | 'sms';
  createdAt: string;
  readAt?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  actionUrl?: string;
}

export interface NotificationTemplate {
  id: string;
  event: string; // e.g. 'registration_created', 'registration_confirmed', 'queue_called', etc.
  titleTemplate: string;
  messageTemplate: string;
  variables: string[]; // variables used, e.g. {registrationNumber}
  isActive: boolean;
}

export interface NotificationPreference {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  eventPreferences?: Record<string, { inApp: boolean; email: boolean; whatsapp: boolean }>;
}

export interface NotificationJob {
  id: string;
  recipient: string; // uid or email/phone
  type: string;
  channel: 'in_app' | 'whatsapp' | 'email' | 'sms';
  status: 'pending' | 'processing' | 'sent' | 'failed';
  errorMessage?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  createdAt: string;
  sentAt?: string;
}

export type SurveyStatus = 'draft' | 'published' | 'closed' | 'archived';
export type SurveyQuestionType = 'rating' | 'multiple_choice' | 'text';

export interface SurveyScaleLabel {
  score: number;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  text: string;
  required: boolean;
  options?: string[]; // for multiple_choice
  scaleLabels?: SurveyScaleLabel[]; // for rating (e.g. [{score: 1, label: "Sangat Tidak Puas"}, ...])
}

export interface SurveyEntity {
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  version: number;
  slug: string;
  startDate: string;
  endDate: string;
  questions: SurveyQuestion[];
  isLinkedToRegistration: boolean; // if true, requires surveyResponseToken
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | number; // multiple_choice value or text value or rating number
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyVersion: number;
  serviceId?: string;
  serviceName?: string;
  unitId?: string;
  unitName?: string;
  locationId?: string;
  locationName?: string;
  registrationId?: string;
  registrationNumber?: string;
  answers: SurveyAnswer[];
  saran?: string;
  saranStatus: 'approved' | 'hidden' | 'flagged' | 'archived';
  isAnonymous: boolean;
  createdAt: string;
}

// PHASE 5I: INFORMASI PUBLIK & TRANSPARANSI PELAYANAN
export type PublicInfoCategory = 
  | 'Profil Puskesmas' 
  | 'Layanan' 
  | 'Standar Pelayanan' 
  | 'Persyaratan' 
  | 'Tarif' 
  | 'Jadwal' 
  | 'Dokumen' 
  | 'Pengumuman' 
  | 'Statistik Pelayanan' 
  | 'Informasi Publik Lainnya' 
  | 'Informasi Berkala' 
  | 'Informasi Serta-Merta' 
  | 'Informasi Setiap Saat';

export type PublicInfoStatus = 'Draft' | 'Published' | 'Unpublished' | 'Archived';
export type InformationInfoStatusType = 'Tersedia' | 'Dalam Pembaruan' | 'Tidak Tersedia';

export interface PublicInfoEntity {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: PublicInfoCategory;
  serviceId?: string;
  serviceName?: string;
  unitId?: string;
  unitName?: string;
  locationId?: string;
  locationName?: string;
  publicationDate: string;
  effectiveDate?: string;
  status: PublicInfoStatus;
  infoStatus?: InformationInfoStatusType;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  };
  updatePeriod?: string; // e.g. 'Bulanan', 'Tahunan'
  lastUpdatedDate?: string;
  nextReviewDate?: string;
  priority?: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

export type InformationRequestStatus = 'Diterima' | 'Diverifikasi' | 'Diproses' | 'Perlu Klarifikasi' | 'Selesai' | 'Ditolak';

export interface InformationRequestEntity {
  id: string;
  trackingNumber: string; // e.g. INFO-2026-000001
  requesterName?: string;
  contact: string; // phone or email
  informationRequested: string;
  purpose?: string;
  desiredFormat: 'Email (PDF)' | 'WhatsApp (Dokumen)' | 'Ambil Langsung ke Puskesmas' | 'Lainnya';
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  };
  status: InformationRequestStatus;
  rejectionReason?: string;
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: {
    id: string;
    authorId: string;
    authorName: string;
    note: string;
    createdAt: string;
  }[];
  publicResponses?: {
    id: string;
    authorName: string;
    response: string;
    createdAt: string;
  }[];
  slaTargetResponse?: string;
  slaTargetCompletion?: string;
  submittedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  history: {
    status: string;
    updatedAt: string;
    updatedBy: { id: string; name: string };
    notes?: string;
  }[];
}

// PHASE 5J: BERITA, ARTIKEL, PENGUMUMAN & AGENDA DINAMIS
export type ContentType = 'berita' | 'artikel' | 'pengumuman' | 'agenda' | 'kegiatan' | 'edukasi' | 'prestasi';
export type DynamicContentStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'unpublished' | 'archived' | 'expired';

export interface ContentRevision {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  modifiedBy: { id: string; name: string };
  modifiedAt: string;
  version: number;
}

export interface AgendaDetails {
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  organizer: string;
  registrationLink?: string;
}

export interface DynamicContentEntity {
  id: string;
  contentType: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  status: DynamicContentStatus;
  publishAt?: string;
  expireAt?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: { id: string; name: string };
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  pinned?: boolean;
  featured?: boolean;
  relatedServiceId?: string;
  relatedDocumentIds?: string[];
  viewCount: number;
  agendaDetails?: AgendaDetails;
  revisions?: ContentRevision[];
  version: number;
}

export interface ContentCategoryEntity {
  id: string;
  name: string;
  slug: string;
  contentType: ContentType | 'general';
  description?: string;
  createdAt: string;
}

export interface ContentTagEntity {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
}

export interface OrganizationNode {
  id: string;
  name: string;
  title: string;
  parentId?: string;
  order: number;
  description?: string;
  status: 'active' | 'inactive';
  showOnWebsite: boolean;
  userId?: string; // Linked staff user ID if any
  createdAt: string;
  updatedAt: string;
}

export interface StaffProfile {
  id: string;
  userId: string; // Linked system user ID
  name: string;
  photoUrl?: string;
  positionTitle: string;
  unitId: string;
  unitName: string;
  serviceIds: string[];
  primaryServiceId?: string;
  locationId?: string;
  bio?: string;
  education?: string;
  scheduleSummary?: string;
  showOnWebsite: boolean;
  status: 'active' | 'inactive' | 'archived';
  reviewStatus: 'approved' | 'pending_review' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface StaffAssignmentHistory {
  id: string;
  staffId: string;
  staffName: string;
  previousUnitName?: string;
  newUnitName: string;
  changedAt: string;
  changedBy: { id: string; name: string };
}

export interface FacilityEntity {
  id: string;
  name: string;
  category: string;
  description: string;
  photos: string[];
  location: string;
  floor?: string;
  unitId?: string;
  unitName?: string;
  relatedServiceIds: string[];
  status: 'Available' | 'Limited' | 'Temporarily Unavailable' | 'Unavailable' | 'Archived';
  showOnWebsite: boolean;
  order: number;
  accessibility: {
    wheelchairAccessible: boolean;
    ramp: boolean;
    accessibleToilet: boolean;
    prioritySeating: boolean;
    disabledParking: boolean;
    brailleSignage: boolean;
  };
  parkingInfo?: {
    motorCapacity?: string;
    carCapacity?: string;
    notes?: string;
  };
  externalMapUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

// PHASE 5M: KONTAK, JAM OPERASIONAL & INFORMASI AKSES PUBLIK
export interface ContactChannelEntity {
  id: string;
  label: string;
  type: 'Phone' | 'WhatsApp' | 'Email' | 'Website' | 'Social Media' | 'Other';
  value: string;
  isPrimary: boolean;
  showOnWebsite: boolean;
  order: number;
  icon?: string;
}

export interface OperatingDayEntity {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dayNameId: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  notes?: string;
}

export interface SpecialHourEntity {
  id: string;
  date: string;
  title: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  notes?: string;
}

export interface EmergencyInfoEntity {
  title: string;
  description: string;
  hotlineNumbers: string[];
  locationNote: string;
  showOnHomepage: boolean;
  showOnContactPage: boolean;
  showOnServicePages: boolean;
}

export interface PuskesmasContactSettings {
  name: string;
  tagline: string;
  address: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  mapEmbedUrl: string;
  externalMapUrl: string;
  timezone: string;
  channels: ContactChannelEntity[];
  operatingHours: OperatingDayEntity[];
  specialHours: SpecialHourEntity[];
  emergencyInfo: EmergencyInfoEntity;
  updatedAt: string;
  updatedBy: { id: string; name: string };
}

// PHASE 5N: FAQ & KNOWLEDGE BASE TYPES

export interface FaqEntity {
  id: string;
  question: string;
  answer: string;
  category: string;
  serviceId?: string;
  documentId?: string;
  tags: string[];
  status: ContentStatus;
  order: number;
  featured: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  needsReview: boolean;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface GuideEntity {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  featuredImage?: string;
  relatedServiceId?: string;
  relatedDocumentId?: string;
  steps: GuideStep[];
  status: ContentStatus;
  publishAt?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

export interface GuideCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

// AI IMPORT & PROVIDER CONFIGURATION (TEXT & IMAGE DUAL CONFIG)
export type AIProviderType = 'gemini' | 'groq' | 'deepseek' | 'openai' | 'openrouter' | 'custom';
export type TextAIProviderType = AIProviderType;
export type ImageAIProviderType = 'gemini' | 'openai' | 'stability' | 'pollinations' | 'custom';

export interface AIProviderPreset {
  id: AIProviderType;
  name: string;
  endpointUrl: string;
  defaultModel: string;
  helpText: string;
  placeholderKey: string;
}

export interface ImageAIProviderPreset {
  id: ImageAIProviderType;
  name: string;
  endpointUrl: string;
  defaultModel: string;
  helpText: string;
  placeholderKey: string;
}

export interface TextAIConfig {
  provider: AIProviderType;
  providerName: string;
  endpointUrl: string;
  apiKey: string;
  hasCustomKey?: boolean;
  model: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
  lastTestedAt?: string;
  lastStatus?: 'success' | 'failed' | 'untested';
  lastStatusMessage?: string;
}

export interface ImageAIConfig {
  provider: ImageAIProviderType;
  providerName: string;
  endpointUrl: string;
  apiKey: string;
  hasCustomKey?: boolean;
  model: string;
  aspectRatio?: string;
  size?: string;
  enabled: boolean;
  lastTestedAt?: string;
  lastStatus?: 'success' | 'failed' | 'untested';
  lastStatusMessage?: string;
}

// Full provider configuration supporting both Text AI and Image AI
export interface FullAIConfig {
  text: TextAIConfig;
  image: ImageAIConfig;
  // Backward-compatibility aliases (mirroring text configuration)
  provider?: AIProviderType;
  providerName?: string;
  endpointUrl?: string;
  apiKey?: string;
  hasCustomKey?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
  lastTestedAt?: string;
  lastStatus?: 'success' | 'failed' | 'untested';
  lastStatusMessage?: string;
}

export type AIProviderConfig = FullAIConfig;












