import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  GripVertical,
  Globe,
  Palette,
  Settings,
  Share2,
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Link2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Video,
  Megaphone,
  Image as ImageIcon,
  FolderPlus,
  Clock,
  Lock,
  Layers,
  Flame,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Sliders,
  RotateCcw,
  Upload,
  Info,
  LayoutTemplate,
  ShieldCheck,
  AlignCenter,
  AlignLeft,
  Award,
  HeartPulse,
  Building2,
  Footprints
} from 'lucide-react';
import {
  MicrositeEntity,
  MicrositeBlock,
  MicrositeBlockType,
  MicrositeGroup,
  HomepageTemplateType,
  BackgroundAnimationType,
  ContentStatus,
  MicrositeHeaderConfig,
  MicrositeHeaderStyle,
  MicrositeFooterConfig,
  MicrositeFooterStyle,
  MicrositeFooterLink
} from '../../../types';
import { MicrositeTemplateRenderer } from '../MicrositeTemplateRenderer';
import { MicrositeIcon } from '../MicrositeIcon';
import { MicrositeImageUploadField } from './MicrositeImageUploadField';
import { micrositeService } from '../../../services/micrositeService';
import { useToast } from '../../../context/ToastContext';

interface Props {
  microsite: MicrositeEntity;
  onSave: (data: Partial<MicrositeEntity>) => Promise<void>;
  onClose: () => void;
  onDuplicate?: (id: string) => Promise<void>;
  categories?: { name: string }[];
  suggestedLinks?: { title: string; url: string; category?: string }[];
}

const BLOCK_TYPE_CONFIGS: {
  type: MicrositeBlockType;
  label: string;
  description: string;
  icon: any;
  color: string;
  defaultTitle: string;
}[] = [
  {
    type: 'link',
    label: 'Tautan Kustom',
    description: 'Tautan ke website, halaman, atau portal layanan',
    icon: Link2,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    defaultTitle: 'Tautan Layanan'
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp Chat',
    description: 'Tombol chat langsung ke nomor CS / Petugas Medis',
    icon: MessageCircle,
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
    defaultTitle: 'Konsultasi WhatsApp'
  },
  {
    type: 'phone',
    label: 'Panggilan Darurat',
    description: 'Hotline telepon darurat (klik langsung mendial)',
    icon: Phone,
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    defaultTitle: 'Hotline IGD 24 Jam'
  },
  {
    type: 'announcement',
    label: 'Pengumuman / Alert',
    description: 'Kotak banner pemberitahuan penting beranimasi',
    icon: Megaphone,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    defaultTitle: 'Pengumuman Pelayanan'
  },
  {
    type: 'heading',
    label: 'Judul Bagian',
    description: 'Pemisah kategori teks heading antar grup tautan',
    icon: FileText,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    defaultTitle: 'Layanan Poli & Konsultasi'
  },
  {
    type: 'text',
    label: 'Kartu Teks / Bio',
    description: 'Paragraf penjelasan informasi atau jadwal singkat',
    icon: Info,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    defaultTitle: 'Informasi Alur Layanan'
  },
  {
    type: 'image_link',
    label: 'Poster / Banner Klik',
    description: 'Gambar banner flyer edukasi yang bisa diklik',
    icon: ImageIcon,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    defaultTitle: 'Brosur Program Kesehatan'
  },
  {
    type: 'video',
    label: 'Video YouTube',
    description: 'Sematkan video edukasi dari YouTube secara responsif',
    icon: Video,
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
    defaultTitle: 'Video Edukasi Kesehatan'
  },
  {
    type: 'location',
    label: 'Lokasi & Maps',
    description: 'Alamat fasilitas dan tombol navigasi Google Maps',
    icon: MapPin,
    color: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    defaultTitle: 'Lokasi Puskesmas'
  },
  {
    type: 'download',
    label: 'Unduh Dokumen / PDF',
    description: 'Tombol unduh berkas formulir atau panduan PDF',
    icon: Download,
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    defaultTitle: 'Formulir Pendaftaran Pasien'
  },
  {
    type: 'email',
    label: 'Kontak Email',
    description: 'Tombol kirim surel ke alamat resmi',
    icon: Mail,
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    defaultTitle: 'Surat & Pengaduan Email'
  },
  {
    type: 'qr_code',
    label: 'Kode QR Halaman',
    description: 'Tampilkan QR Code interaktif untuk dipindai',
    icon: QrCode,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    defaultTitle: 'QR Code Bio Link'
  },
  {
    type: 'divider',
    label: 'Garis Pemisah',
    description: 'Garis tipis estetik untuk memisahkan konten',
    icon: Layers,
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    defaultTitle: 'Pemisah'
  }
];

const TEMPLATE_OPTIONS: { id: HomepageTemplateType; name: string; desc: string; icon: string }[] = [
  { id: 'modern_majestic', name: 'Grand Majestic', desc: 'Desain elegan kemilau emas & emerald resmi', icon: 'Sparkles' },
  { id: 'artistic_bio', name: 'Bio-Luminescent', desc: 'Gaya hayati bercahaya teal & cyan segar', icon: 'Leaf' },
  { id: 'avant_garde', name: 'Avant-Garde Cyber', desc: 'Nuansa futuristik modern telemetry cyan & dark', icon: 'Zap' },
  { id: 'nusantara_art', name: 'Harmoni Nusantara', desc: 'Aksara & ukiran klasik warisan budaya amber', icon: 'Award' },
  { id: 'minimal_gallery', name: 'Minimalist Studio', desc: 'Tipografi bersih, monokrom rapi & profesional', icon: 'Layers' },
  { id: 'classic', name: 'Classic Hub', desc: 'Tampilan kartu standar bio-link cepat', icon: 'Globe' }
];

const HEADER_STYLE_OPTIONS: { id: MicrositeHeaderStyle; name: string; desc: string }[] = [
  { id: 'banner_hero', name: 'Hero Banner Cover', desc: 'Foto sampul lanskap di atas dengan avatar menonjol' },
  { id: 'avatar_top', name: 'Avatar Kemilau Tengah', desc: 'Fokus logo di tengah dengan ring kemilau elegan' },
  { id: 'glassmorphism_card', name: 'Glassmorphism Floating', desc: 'Kartu kaca transparan melayang modern' },
  { id: 'compact_inline', name: 'Kompak Horizontal', desc: 'Logo & teks sejajar dalam 1 baris hemat ruang' },
  { id: 'minimal_text', name: 'Minimalist Clean', desc: 'Tipografi bersih monokrom fokus teks' },
  { id: 'split_cover', name: 'Split Cover Duo', desc: 'Layout split 2 kolom kontras tinggi' }
];

const FOOTER_STYLE_OPTIONS: {
  id: MicrositeFooterStyle;
  name: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'card_clean',
    name: 'Kartu Modern (Default)',
    desc: 'Panel kaca elegan dengan tombol aksi cepat, media sosial, dan hak cipta rapi',
    badge: 'Populer'
  },
  {
    id: 'government_formal',
    name: 'Format Resmi Instansi',
    desc: 'Standar resmi Puskesmas/Dinkes dengan lencana Kemenkes, GERMAS, dan kontak terpadu',
    badge: 'Resmi'
  },
  {
    id: 'minimal',
    name: 'Minimalis Bersih',
    desc: 'Teks simpel tanpa kartu pembatas, cocok untuk tema modern minimalis',
    badge: 'Ringan'
  },
  {
    id: 'compact_badge',
    name: 'Kapsul Mengambang',
    desc: 'Badge kapsul mengambang dengan logo, status verifikasi, dan tombol aksi cepat',
    badge: 'Elegan'
  },
  {
    id: 'floating_bar',
    name: 'Bar Aksi Bawah',
    desc: 'Navigasi bawah terpadu dengan indikator status aktif & tombol cepat',
    badge: 'Interaktif'
  },
  {
    id: 'hidden',
    name: 'Sembunyikan Footer',
    desc: 'Tidak menampilkan komponen footer sama sekali di bagian bawah halaman',
    badge: 'Polos'
  }
];

const ANIMATION_OPTIONS: { id: BackgroundAnimationType; name: string }[] = [
  { id: 'aurora_flow', name: 'Aurora Gelombang (Menenangkan)' },
  { id: 'bioluminescent', name: 'Bioluminescent Partikel Hayati' },
  { id: 'geometric_waves', name: 'Geometric Grid Waves' },
  { id: 'golden_radiance', name: 'Golden Radiance Emas' },
  { id: 'subtle_glow', name: 'Subtle Glow Halus' },
  { id: 'none', name: 'Tanpa Animasi (Static)' }
];

const ICON_PRESETS = [
  'Globe', 'HeartPulse', 'Stethoscope', 'MessageCircle', 'Phone', 'Mail',
  'MapPin', 'FileText', 'Download', 'Calendar', 'Video', 'Megaphone',
  'Sparkles', 'ShieldCheck', 'Clock', 'User', 'HelpCircle', 'Folder'
];

export const MicrositeStudioEditor: React.FC<Props> = ({
  microsite: initialMicrosite,
  onSave,
  onClose,
  onDuplicate,
  categories = [],
  suggestedLinks = []
}) => {
  const { showToast } = useToast();

  // Core metadata state
  const [name, setName] = useState(initialMicrosite.name || '');
  const [slug, setSlug] = useState(initialMicrosite.slug || '');
  const [description, setDescription] = useState(initialMicrosite.description || '');
  const [category, setCategory] = useState(initialMicrosite.category || 'Umum');
  const [logoUrl, setLogoUrl] = useState(initialMicrosite.logoUrl || '');
  const [profileImageUrl, setProfileImageUrl] = useState(initialMicrosite.profileImageUrl || '');
  const [bannerImageUrl, setBannerImageUrl] = useState(initialMicrosite.bannerImageUrl || initialMicrosite.profileImageUrl || '');
  const [status, setStatus] = useState<ContentStatus>(initialMicrosite.status || 'published');
  const [active, setActive] = useState(initialMicrosite.active ?? true);

  // Header Customization State
  const [headerStyle, setHeaderStyle] = useState<MicrositeHeaderStyle>(
    initialMicrosite.headerConfig?.style || 'banner_hero'
  );
  const [headerHeight, setHeaderHeight] = useState<'compact' | 'medium' | 'tall'>(
    initialMicrosite.headerConfig?.height || 'medium'
  );
  const [avatarShape, setAvatarShape] = useState<'circle' | 'rounded' | 'square' | 'hexagon'>(
    initialMicrosite.headerConfig?.avatarShape || 'circle'
  );
  const [showCategoryBadge, setShowCategoryBadge] = useState(
    initialMicrosite.headerConfig?.showCategoryBadge ?? true
  );
  const [categoryBadgeText, setCategoryBadgeText] = useState(
    initialMicrosite.headerConfig?.categoryBadgeText || ''
  );
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(
    initialMicrosite.headerConfig?.showVerifiedBadge ?? true
  );
  const [customTitle, setCustomTitle] = useState(
    initialMicrosite.headerConfig?.customTitle || ''
  );
  const [customSubtitle, setCustomSubtitle] = useState(
    initialMicrosite.headerConfig?.customSubtitle || ''
  );
  const [bannerOverlayOpacity, setBannerOverlayOpacity] = useState(
    initialMicrosite.headerConfig?.bannerOverlayOpacity ?? 40
  );
  const [headerAlignment, setHeaderAlignment] = useState<'center' | 'left'>(
    initialMicrosite.headerConfig?.alignment || 'center'
  );

  // Background Image State
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    initialMicrosite.backgroundImageUrl || initialMicrosite.themeCustomization?.bgImageUrl || ''
  );
  const [bgImageOpacity, setBgImageOpacity] = useState(
    initialMicrosite.themeCustomization?.bgImageOpacity ?? 25
  );
  const [bgImageBlur, setBgImageBlur] = useState<'none' | 'sm' | 'md' | 'lg'>(
    initialMicrosite.themeCustomization?.bgImageBlur || 'none'
  );

  // Footer Customization State
  const initialFooterConfig = initialMicrosite.footerConfig || initialMicrosite.themeCustomization?.footerConfig || {};
  const [footerStyle, setFooterStyle] = useState<MicrositeFooterStyle>(initialFooterConfig.style || 'card_clean');
  const [customCopyrightText, setCustomCopyrightText] = useState(initialFooterConfig.customCopyrightText || '');
  const [customTagline, setCustomTagline] = useState(
    initialFooterConfig.customTagline !== undefined
      ? initialFooterConfig.customTagline
      : 'Portal Akses Cepat Informasi & Layanan Kesehatan Masyarakat'
  );
  const [showSocialLinks, setShowSocialLinks] = useState(initialFooterConfig.showSocialLinks ?? true);
  const [socialStyle, setSocialStyle] = useState<'pills' | 'floating_icons' | 'rounded_cards'>(
    initialFooterConfig.socialStyle || 'rounded_cards'
  );
  const [showContactSummary, setShowContactSummary] = useState(initialFooterConfig.showContactSummary ?? false);
  const [showBackToTop, setShowBackToTop] = useState(initialFooterConfig.showBackToTop ?? true);
  const [showShareButton, setShowShareButton] = useState(initialFooterConfig.showShareButton ?? true);
  const [showQRButton, setShowQRButton] = useState(initialFooterConfig.showQRButton ?? true);
  const [showGovernmentBadges, setShowGovernmentBadges] = useState(initialFooterConfig.showGovernmentBadges ?? true);
  const [governmentBadges, setGovernmentBadges] = useState<('germas' | 'kemenkes' | 'akreditasi' | 'puskesmas')[]>(
    initialFooterConfig.governmentBadges || ['kemenkes', 'germas', 'akreditasi']
  );
  const [customBadgesText, setCustomBadgesText] = useState(initialFooterConfig.customBadgesText || '');
  const [footerLinks, setFooterLinks] = useState<MicrositeFooterLink[]>(initialFooterConfig.links || []);
  const [footerAlignment, setFooterAlignment] = useState<'center' | 'left'>(initialFooterConfig.alignment || 'center');

  // Social & contact state
  const [phone, setPhone] = useState(initialMicrosite.phone || '');
  const [email, setEmail] = useState(initialMicrosite.email || '');
  const [website, setWebsite] = useState(initialMicrosite.website || '');
  const [address, setAddress] = useState(initialMicrosite.address || '');

  // Theme & Appearance
  const [template, setTemplate] = useState<HomepageTemplateType>(
    initialMicrosite.themeCustomization?.template || 'modern_majestic'
  );
  const [backgroundAnimation, setBackgroundAnimation] = useState<BackgroundAnimationType>(
    initialMicrosite.themeCustomization?.backgroundAnimation || 'aurora_flow'
  );
  const [accentColor, setAccentColor] = useState(
    initialMicrosite.themeCustomization?.accentColor || '#10b981'
  );
  const [themePreset, setThemePreset] = useState(
    initialMicrosite.themeCustomization?.theme || 'emerald'
  );

  // Security
  const [passwordProtected, setPasswordProtected] = useState(initialMicrosite.passwordProtected ?? false);
  const [password, setPassword] = useState('');

  // Blocks & Groups state
  const [blocks, setBlocks] = useState<MicrositeBlock[]>(() => {
    if (initialMicrosite.blocks && initialMicrosite.blocks.length > 0) {
      return initialMicrosite.blocks;
    }
    if (initialMicrosite.links && initialMicrosite.links.length > 0) {
      return initialMicrosite.links.map(l => ({
        id: l.id,
        type: (l.type === 'whatsapp' ? 'whatsapp' : l.type === 'call' ? 'phone' : l.type === 'email' ? 'email' : l.type === 'pdf' ? 'download' : l.type === 'youtube' ? 'video' : 'link') as MicrositeBlockType,
        title: l.label,
        subtitle: l.subtitle,
        url: l.url,
        icon: l.icon,
        thumbnailUrl: l.thumbnailUrl,
        badgeText: l.badgeText,
        isFeatured: l.isFeatured,
        active: !l.archived,
        scheduledStart: l.scheduledStart,
        scheduledEnd: l.scheduledEnd,
        clicks: l.clicks || 0,
        displayOrder: l.displayOrder
      }));
    }
    return [];
  });

  const [groups, setGroups] = useState<MicrositeGroup[]>(initialMicrosite.groups || []);

  // UI Studio State
  const [studioTab, setStudioTab] = useState<'blocks' | 'header' | 'footer' | 'design' | 'settings' | 'groups'>('blocks');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Construct Live Virtual Entity for realtime Simulator
  const liveEntity: MicrositeEntity = {
    ...initialMicrosite,
    name: name || 'Nama Portal Anda',
    slug: slug || 'slug-portal',
    description,
    category,
    logoUrl,
    profileImageUrl: bannerImageUrl || profileImageUrl,
    bannerImageUrl: bannerImageUrl || profileImageUrl,
    backgroundImageUrl,
    status,
    active,
    phone,
    email,
    website,
    address,
    passwordProtected,
    blocks,
    groups,
    headerConfig: {
      style: headerStyle,
      height: headerHeight,
      avatarShape,
      showCategoryBadge,
      categoryBadgeText,
      showVerifiedBadge,
      customTitle,
      customSubtitle,
      bannerOverlayOpacity,
      alignment: headerAlignment
    },
    footerConfig: {
      style: footerStyle,
      customCopyrightText,
      customTagline,
      showSocialLinks,
      socialStyle,
      showContactSummary,
      showBackToTop,
      showShareButton,
      showQRButton,
      showGovernmentBadges,
      governmentBadges,
      customBadgesText,
      links: footerLinks,
      alignment: footerAlignment
    },
    themeCustomization: {
      theme: themePreset as any,
      template,
      backgroundAnimation,
      buttonStyle: 'rounded',
      accentColor,
      bgImageUrl: backgroundImageUrl,
      bgImageOpacity,
      bgImageBlur,
      headerConfig: {
        style: headerStyle,
        height: headerHeight,
        avatarShape,
        showCategoryBadge,
        categoryBadgeText,
        showVerifiedBadge,
        customTitle,
        customSubtitle,
        bannerOverlayOpacity,
        alignment: headerAlignment
      },
      footerConfig: {
        style: footerStyle,
        customCopyrightText,
        customTagline,
        showSocialLinks,
        socialStyle,
        showContactSummary,
        showBackToTop,
        showShareButton,
        showQRButton,
        showGovernmentBadges,
        governmentBadges,
        customBadgesText,
        links: footerLinks,
        alignment: footerAlignment
      }
    }
  };

  // Footer Link Manipulation
  const addFooterLink = (label: string, url: string, isExternal = false) => {
    const newLnk: MicrositeFooterLink = {
      id: 'fl-' + Math.random().toString(36).substring(2, 7),
      label,
      url,
      isExternal
    };
    setFooterLinks(prev => [...prev, newLnk]);
  };

  const removeFooterLink = (id: string) => {
    setFooterLinks(prev => prev.filter(l => l.id !== id));
  };

  const updateFooterLink = (id: string, updates: Partial<MicrositeFooterLink>) => {
    setFooterLinks(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const toggleBadge = (badge: 'germas' | 'kemenkes' | 'akreditasi' | 'puskesmas') => {
    setGovernmentBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  // Block Manipulation Methods
  const addBlock = (type: MicrositeBlockType) => {
    const config = BLOCK_TYPE_CONFIGS.find(c => c.type === type);
    const newBlock: MicrositeBlock = {
      id: 'blk-' + Math.random().toString(36).substring(2, 9),
      type,
      title: config?.defaultTitle || 'Blok Baru',
      subtitle: type === 'whatsapp' ? 'Hubungi layanan sekarang' : undefined,
      url: type === 'link' ? 'https://' : type === 'whatsapp' ? '6281234567890' : '',
      whatsappNumber: type === 'whatsapp' ? '6281234567890' : undefined,
      whatsappMessage: type === 'whatsapp' ? 'Halo Admin Puskesmas Manding, saya ingin bertanya tentang:' : undefined,
      icon: type === 'whatsapp' ? 'MessageCircle' : type === 'phone' ? 'Phone' : type === 'email' ? 'Mail' : type === 'location' ? 'MapPin' : 'Globe',
      active: true,
      isFeatured: false,
      clicks: 0,
      displayOrder: blocks.length + 1
    };

    setBlocks(prev => [...prev, newBlock]);
    setExpandedBlockId(newBlock.id);
    setIsAddBlockOpen(false);
    showToast(`Blok "${config?.label || type}" berhasil ditambahkan!`, 'success');
  };

  const updateBlock = (id: string, updates: Partial<MicrositeBlock>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (expandedBlockId === id) setExpandedBlockId(null);
    showToast('Blok dihapus', 'info');
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const reordered = [...blocks];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;
    // update displayOrder
    reordered.forEach((b, idx) => (b.displayOrder = idx + 1));
    setBlocks(reordered);
  };

  // Group Manipulation
  const addGroup = () => {
    const newGroup: MicrositeGroup = {
      id: 'grp-' + Math.random().toString(36).substring(2, 9),
      name: 'Grup Baru',
      collapsible: true,
      displayOrder: groups.length + 1
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    // Clear groupId from blocks
    setBlocks(prev => prev.map(b => (b.groupId === groupId ? { ...b, groupId: undefined } : b)));
  };

  // Handle Save
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Nama microsite tidak boleh kosong', 'error');
      return;
    }
    if (!slug.trim()) {
      showToast('Slug microsite tidak boleh kosong', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description,
        category,
        logoUrl,
        profileImageUrl: bannerImageUrl || profileImageUrl,
        bannerImageUrl: bannerImageUrl || profileImageUrl,
        backgroundImageUrl,
        status,
        active,
        phone,
        email,
        website,
        address,
        passwordProtected,
        password: passwordProtected && password ? password : initialMicrosite.password,
        blocks,
        groups,
        headerConfig: {
          style: headerStyle,
          height: headerHeight,
          avatarShape,
          showCategoryBadge,
          categoryBadgeText,
          showVerifiedBadge,
          customTitle,
          customSubtitle,
          bannerOverlayOpacity,
          alignment: headerAlignment
        },
        themeCustomization: {
          theme: themePreset as any,
          template,
          backgroundAnimation,
          buttonStyle: 'rounded',
          accentColor,
          bgImageUrl: backgroundImageUrl,
          bgImageOpacity,
          bgImageBlur
        }
      });
      showToast('Perubahan microsite berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan microsite', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Tautan publik berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col text-slate-100 font-sans overflow-hidden">
      {/* Top Studio Action Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Tutup Studio"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-xs">
                {name || 'Studio Editor Microsite'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {status === 'published' ? 'Live' : 'Draft'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate hidden sm:block">
              /m/{slug || '...'}
            </p>
          </div>
        </div>

        {/* Device Switcher (Desktop view only) */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Smartphone (375px)"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'tablet' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Tablet (640px)"
          >
            <Tablet className="w-4 h-4" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'desktop' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Layar Penuh"
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPublicLink}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Salin Tautan Publik"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? 'Tersalin' : 'Bagikan'}</span>
          </button>

          <button
            onClick={() => setQrModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold transition"
            title="Lihat QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan & Rilis'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Controls & Block Builder */}
        <div className="w-full lg:w-[480px] xl:w-[540px] border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0 z-10">
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-800 px-3 bg-slate-900/90 shrink-0 gap-1 pt-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setStudioTab('blocks')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'blocks'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Blok ({blocks.length})</span>
            </button>
            <button
              onClick={() => setStudioTab('header')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'header'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Ubah Header</span>
            </button>
            <button
              onClick={() => setStudioTab('footer')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'footer'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Ubah Footer</span>
            </button>
            <button
              onClick={() => setStudioTab('design')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'design'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Tema & Latar</span>
            </button>
            <button
              onClick={() => setStudioTab('settings')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'settings'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Info & Kontak</span>
            </button>
            <button
              onClick={() => setStudioTab('groups')}
              className={`pb-2.5 px-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
                studioTab === 'groups'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Grup ({groups.length})</span>
            </button>
          </div>

          {/* Left Tab Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            {/* TAB 1: BLOCKS BUILDER */}
            {studioTab === 'blocks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Struktur Blok Bio-Link
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Susun, atur jadwal, atau sematkan blok baru
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddBlockOpen(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Blok</span>
                  </button>
                </div>

                {/* Blocks List */}
                {blocks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 space-y-3">
                    <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Belum ada blok konten.</p>
                    <button
                      onClick={() => setIsAddBlockOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Pilih Blok Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {blocks.map((block, idx) => {
                      const isExpanded = expandedBlockId === block.id;
                      const blockConfig = BLOCK_TYPE_CONFIGS.find(c => c.type === block.type);
                      const IconComponent = blockConfig?.icon || Link2;

                      return (
                        <div
                          key={block.id}
                          className={`rounded-2xl border transition-all duration-200 ${
                            isExpanded
                              ? 'border-emerald-500/60 bg-slate-850 shadow-lg ring-1 ring-emerald-500/20'
                              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                          }`}
                        >
                          {/* Block Header Row */}
                          <div className="p-3.5 flex items-center justify-between gap-2.5 select-none">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex flex-col gap-0.5 text-slate-500">
                                <button
                                  disabled={idx === 0}
                                  onClick={() => moveBlock(idx, 'up')}
                                  className="p-0.5 hover:text-white disabled:opacity-20 transition"
                                  title="Pindah ke Atas"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={idx === blocks.length - 1}
                                  onClick={() => moveBlock(idx, 'down')}
                                  className="p-0.5 hover:text-white disabled:opacity-20 transition"
                                  title="Pindah ke Bawah"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </button>
                              </div>

                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                  blockConfig?.color || 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>

                              <div
                                onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                                className="min-w-0 flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-white truncate">
                                    {block.title || 'Blok Tanpa Judul'}
                                  </span>
                                  {block.isFeatured && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                                      UNGGULAN
                                    </span>
                                  )}
                                  {!block.active && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                                      NONAKTIF
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {blockConfig?.label} {block.subtitle ? `• ${block.subtitle}` : ''}
                                </p>
                              </div>
                            </div>

                            {/* Quick Action Toggles */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateBlock(block.id, { active: !block.active })}
                                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                  block.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
                                }`}
                                title={block.active ? 'Nonaktifkan Blok' : 'Aktifkan Blok'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Block Detail Accordion Form */}
                          {isExpanded && (
                            <div className="p-4 pt-2 border-t border-slate-800 space-y-3.5 text-xs bg-slate-900/40 rounded-b-2xl">
                              {/* Title & Subtitle */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Judul Blok
                                  </label>
                                  <input
                                    type="text"
                                    value={block.title || ''}
                                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                    placeholder="Judul tombol atau banner"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Subjudul / Keterangan
                                  </label>
                                  <input
                                    type="text"
                                    value={block.subtitle || ''}
                                    onChange={e => updateBlock(block.id, { subtitle: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                    placeholder="Keterangan singkat tambahan"
                                  />
                                </div>
                              </div>

                              {/* WhatsApp specific inputs */}
                              {block.type === 'whatsapp' && (
                                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                                  <div>
                                    <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                                      Nomor WhatsApp (Format: 08xx atau 628xx)
                                    </label>
                                    <input
                                      type="text"
                                      value={block.whatsappNumber || ''}
                                      onChange={e => updateBlock(block.id, { whatsappNumber: e.target.value })}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                                      placeholder="Contoh: 081234567890"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                                      Template Pesan Awal (Opsional)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={block.whatsappMessage || ''}
                                      onChange={e => updateBlock(block.id, { whatsappMessage: e.target.value })}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-white text-xs focus:border-emerald-400 focus:outline-none"
                                      placeholder="Contoh: Halo Admin Puskesmas Manding, saya ingin informasi jadwal..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* General URL / Link Input */}
                              {block.type !== 'divider' && block.type !== 'spacer' && block.type !== 'text' && block.type !== 'whatsapp' && (
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    {block.type === 'video' ? 'URL Video YouTube' : block.type === 'phone' ? 'Nomor Telepon Hotline' : block.type === 'email' ? 'Alamat Email' : 'URL Tujuan'}
                                  </label>
                                  <input
                                    type="text"
                                    value={block.url || ''}
                                    onChange={e => updateBlock(block.id, { url: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                    placeholder={block.type === 'video' ? 'https://www.youtube.com/watch?v=...' : block.type === 'phone' ? '08123456789' : 'https://...'}
                                  />
                                </div>
                              )}

                              {/* Content area for Text/Bio/Announcement/Location */}
                              {(block.type === 'text' || block.type === 'announcement' || block.type === 'location') && (
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Isi Konten Teks Lengkap
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={block.content || ''}
                                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                    placeholder="Tuliskan isi informasi, pengumuman, atau alamat lengkap di sini..."
                                  />
                                </div>
                              )}

                              {/* Image thumbnail / Poster URL */}
                              {(block.type === 'link' || block.type === 'image' || block.type === 'image_link') && (
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    URL Gambar / Poster Banner
                                  </label>
                                  <input
                                    type="text"
                                    value={block.thumbnailUrl || ''}
                                    onChange={e => updateBlock(block.id, { thumbnailUrl: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                    placeholder="https://images.unsplash.com/..."
                                  />
                                </div>
                              )}

                              {/* Badge, Icon & Featured */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Pita Badge Text
                                  </label>
                                  <input
                                    type="text"
                                    value={block.badgeText || ''}
                                    onChange={e => updateBlock(block.id, { badgeText: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                    placeholder="Contoh: BARU / POPULER"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Ikon Pilihan
                                  </label>
                                  <select
                                    value={block.icon || 'Globe'}
                                    onChange={e => updateBlock(block.id, { icon: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                  >
                                    {ICON_PRESETS.map(iconName => (
                                      <option key={iconName} value={iconName}>
                                        {iconName}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                                    Grup Kategori
                                  </label>
                                  <select
                                    value={block.groupId || ''}
                                    onChange={e => updateBlock(block.id, { groupId: e.target.value || undefined })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                                  >
                                    <option value="">Tanpa Grup (Utama)</option>
                                    {groups.map(g => (
                                      <option key={g.id} value={g.id}>
                                        {g.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Highlight Toggle & Scheduling */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={block.isFeatured || false}
                                    onChange={e => updateBlock(block.id, { isFeatured: e.target.checked })}
                                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                                  />
                                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                                    <Flame className="w-3.5 h-3.5" />
                                    <span>Sorot Sebagai Unggulan</span>
                                  </span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => removeBlock(block.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1.5 transition ml-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Blok</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UBAH HEADER & FOTO */}
            {studioTab === 'header' && (
              <div className="space-y-5 text-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                    <LayoutTemplate className="w-4 h-4 text-emerald-400" />
                    <span>Gaya & Layout Header</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Pilih tata letak header yang paling representatif untuk portal Puskesmas
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HEADER_STYLE_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setHeaderStyle(opt.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          headerStyle === opt.id
                            ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{opt.name}</span>
                          {headerStyle === opt.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Logo Resmi / Avatar Profil */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Logo Resmi / Avatar Profil</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Upload logo instansi, puskesmas, atau foto profil penanggung jawab
                      </p>
                    </div>
                  </div>

                  <MicrositeImageUploadField
                    label="Upload File Logo"
                    value={logoUrl}
                    onChange={url => setLogoUrl(url)}
                    presetType="logo"
                    aspectRatio="square"
                    placeholder="Pilih file logo PNG/JPG/WebP atau masukkan tautan URL..."
                  />

                  {/* Avatar Shape Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Bentuk Logo / Avatar</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['circle', 'rounded', 'square', 'hexagon'] as const).map(shape => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => setAvatarShape(shape)}
                          className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold capitalize transition ${
                            avatarShape === shape
                              ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {shape === 'circle' ? 'Bulat' : shape === 'rounded' ? 'Melengkung' : shape === 'square' ? 'Kotak' : 'Heksagon'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload Banner / Foto Sampul Header */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Banner / Sampul Header</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Foto gedung fasilitas kesehatan, tim medis, atau pemandangan lanskap
                      </p>
                    </div>
                  </div>

                  <MicrositeImageUploadField
                    label="Upload File Banner"
                    value={bannerImageUrl}
                    onChange={url => {
                      setBannerImageUrl(url);
                      setProfileImageUrl(url);
                    }}
                    presetType="banner"
                    aspectRatio="banner"
                    placeholder="Pilih foto sampul lanskap PNG/JPG/WebP atau tautan..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Tinggi Banner</label>
                      <select
                        value={headerHeight}
                        onChange={e => setHeaderHeight(e.target.value as 'compact' | 'medium' | 'tall')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      >
                        <option value="compact">Ringkas (Compact ~140px)</option>
                        <option value="medium">Sedang Standar (~190px)</option>
                        <option value="tall">Tinggi Megah (~260px)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-400">Kegelapan Overlay</label>
                        <span className="text-[10px] text-emerald-400 font-mono">{bannerOverlayOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        value={bannerOverlayOpacity}
                        onChange={e => setBannerOverlayOpacity(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Typography & Badges */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lencana & Penataan Teks Header</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Perataan Teks</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHeaderAlignment('center')}
                          className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                            headerAlignment === 'center'
                              ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                          <span>Tengah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderAlignment('left')}
                          className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                            headerAlignment === 'left'
                              ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                          <span>Kiri</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <input
                          type="checkbox"
                          checked={showVerifiedBadge}
                          onChange={e => setShowVerifiedBadge(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                        <span className="text-[11px] font-bold text-slate-300">Lencana Terverifikasi (Resmi)</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCategoryBadge}
                        onChange={e => setShowCategoryBadge(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500"
                      />
                      <span className="text-[11px] font-bold text-slate-300">Tampilkan Kategori Badge di Header</span>
                    </label>
                    {showCategoryBadge && (
                      <input
                        type="text"
                        value={categoryBadgeText}
                        onChange={e => setCategoryBadgeText(e.target.value)}
                        placeholder={`Kustom teks badge (kosongkan untuk default: "${category}")`}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FOOTER CUSTOMIZATION */}
            {studioTab === 'footer' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Gaya Tata Letak Footer</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Pilih format visual bagian bawah microsite sesuai kebutuhan institusi atau estetika Anda
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FOOTER_STYLE_OPTIONS.map(opt => {
                      const isSelected = footerStyle === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setFooterStyle(opt.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30 shadow-md'
                              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              {opt.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {opt.badge}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Perataan & Tampilan Dasar */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <AlignCenter className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Perataan & Orientasi Konten</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFooterAlignment('center')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        footerAlignment === 'center'
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignCenter className="w-4 h-4" />
                      <span>Rata Tengah (Center)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterAlignment('left')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        footerAlignment === 'left'
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignLeft className="w-4 h-4" />
                      <span>Rata Kiri (Left)</span>
                    </button>
                  </div>
                </div>

                {/* Teks Hak Cipta & Slogan */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Teks Hak Cipta & Slogan Pelayanan</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Teks Hak Cipta (Copyright)
                    </label>
                    <input
                      type="text"
                      value={customCopyrightText}
                      onChange={e => setCustomCopyrightText(e.target.value)}
                      placeholder={`Contoh: © ${new Date().getFullYear()} ${name || 'Puskesmas Manding'}. All Rights Reserved.`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Kosongkan untuk memakai teks otomatis default dengan nama microsite.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Slogan / Motto Pelayanan
                    </label>
                    <input
                      type="text"
                      value={customTagline}
                      onChange={e => setCustomTagline(e.target.value)}
                      placeholder="Contoh: Portal Akses Cepat Layanan Kesehatan Masyarakat"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 self-center">Preset:</span>
                      {[
                        'Portal Akses Cepat Informasi & Layanan Kesehatan Masyarakat',
                        'Melayani dengan Hati, Sehat Bersama Masyarakat',
                        'Puskesmas Ramah, Sigap, dan Terpercaya',
                        'Mewujudkan Generasi Sehat, Tangguh & Mandiri'
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCustomTagline(preset)}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          {preset.length > 28 ? preset.substring(0, 28) + '...' : preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lencana Resmi & Akreditasi */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lencana Resmi & Akreditasi</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGovernmentBadges}
                        onChange={e => setShowGovernmentBadges(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {showGovernmentBadges && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <p className="text-[11px] text-slate-400">
                        Pilih lencana legitimasi instansi yang ditampilkan:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'kemenkes', label: 'Kemenkes RI', sub: 'Kementerian Kesehatan', icon: HeartPulse },
                          { id: 'germas', label: 'GERMAS', sub: 'Gerakan Hidup Sehat', icon: ShieldCheck },
                          { id: 'akreditasi', label: 'Paripurna', sub: 'Akreditasi Tertinggi', icon: Award },
                          { id: 'puskesmas', label: 'Puskesmas Resmi', sub: 'Dinas Kesehatan Kab.', icon: Building2 }
                        ].map(b => {
                          const isChecked = governmentBadges.includes(b.id as any);
                          const IconComp = b.icon;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => toggleBadge(b.id as any)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                                isChecked
                                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300'
                                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold truncate">{b.label}</div>
                                <div className="text-[9px] text-slate-500 truncate">{b.sub}</div>
                              </div>
                              {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Catatan / Keterangan Tambahan Lencana
                        </label>
                        <input
                          type="text"
                          value={customBadgesText}
                          onChange={e => setCustomBadgesText(e.target.value)}
                          placeholder="Contoh: Terakreditasi Paripurna Kemenkes RI No: 440/123/2024"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Interaktif & Aksi Cepat */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tombol Aksi Cepat & Navigasi</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850 cursor-pointer hover:border-slate-700 transition">
                      <div className="flex items-center gap-2">
                        <MoveUp className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Tombol "Kembali ke Atas"</span>
                          <span className="text-[10px] text-slate-400">Memudahkan pengunjung melompat ke bagian atas</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showBackToTop}
                        onChange={e => setShowBackToTop(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850 cursor-pointer hover:border-slate-700 transition">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-sky-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Tombol "Bagikan Portal"</span>
                          <span className="text-[10px] text-slate-400">Salin link atau buka dialog bagikan cepat</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showShareButton}
                        onChange={e => setShowShareButton(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850 cursor-pointer hover:border-slate-700 transition">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Tombol "Kode QR"</span>
                          <span className="text-[10px] text-slate-400">Tampilkan modal scan QR code untuk pengunjung</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showQRButton}
                        onChange={e => setShowQRButton(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850 cursor-pointer hover:border-slate-700 transition">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-rose-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Ringkasan Kontak Footer</span>
                          <span className="text-[10px] text-slate-400">Tampilkan ringkasan nomor telepon, email, & alamat</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showContactSummary}
                        onChange={e => setShowContactSummary(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                      />
                    </label>
                  </div>
                </div>

                {/* Media Sosial Footer */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ikon Media Sosial Footer</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSocialLinks}
                        onChange={e => setShowSocialLinks(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {showSocialLinks && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Gaya Tampilan Ikon Sosial
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'rounded_cards', label: 'Kotak Kaca' },
                          { id: 'pills', label: 'Kapsul Label' },
                          { id: 'floating_icons', label: 'Ikon Bulat' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSocialStyle(st.id as any)}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition ${
                              socialStyle === st.id
                                ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tautan Navigasi Footer Tambahan */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tautan Navigasi Footer (Quick Links)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => addFooterLink('Maklumat Pelayanan', '/maklumat-pelayanan')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Tautan</span>
                    </button>
                  </div>

                  {/* Preset Quick Links */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Tambah Cepat Tautan Standar Instansi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Maklumat Pelayanan', url: '/maklumat' },
                        { label: 'Standar Pelayanan (SPP)', url: '/standar-pelayanan' },
                        { label: 'Pengaduan SP4N-LAPOR!', url: 'https://www.lapor.go.id', isExternal: true },
                        { label: 'Kebijakan Privasi', url: '/privacy' },
                        { label: 'Website Dinkes', url: 'https://dinkes.sumenepkab.go.id', isExternal: true }
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => addFooterLink(preset.label, preset.url, preset.isExternal)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links List */}
                  {footerLinks.length === 0 ? (
                    <div className="p-3 text-center rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500">
                      Belum ada tautan navigasi khusus di footer.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {footerLinks.map(fl => (
                        <div
                          key={fl.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={fl.label}
                              onChange={e => updateFooterLink(fl.id, { label: e.target.value })}
                              placeholder="Label Tautan (contoh: Maklumat)"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                            />
                            <input
                              type="text"
                              value={fl.url}
                              onChange={e => updateFooterLink(fl.id, { url: e.target.value })}
                              placeholder="URL Tautan (https:// atau /path)"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFooterLink(fl.id)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition"
                            title="Hapus Tautan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DESIGN & BACKGROUND */}
            {studioTab === 'design' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Pilihan Tema Visual Master
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Pilih arsitektur template estetika berkelas untuk bio link
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TEMPLATE_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setTemplate(opt.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          template === opt.id
                            ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{opt.name}</span>
                          {template === opt.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Background Image */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>Upload Gambar Latar Belakang (Background)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sematkan foto latar belakang artistik untuk seluruh halaman microsite
                  </p>

                  <MicrositeImageUploadField
                    label="Upload File Background"
                    value={backgroundImageUrl}
                    onChange={url => setBackgroundImageUrl(url)}
                    presetType="background"
                    aspectRatio="background"
                    placeholder="Pilih foto wallpaper PNG/JPG/WebP atau tautan..."
                  />

                  {backgroundImageUrl && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-400">Transparansi Latar</label>
                          <span className="text-[10px] text-emerald-400 font-mono">{bgImageOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={bgImageOpacity}
                          onChange={e => setBgImageOpacity(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Efek Blur Latar</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['none', 'sm', 'md', 'lg'] as const).map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBgImageBlur(b)}
                              className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-bold uppercase transition ${
                                bgImageBlur === b
                                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                                  : 'border-slate-800 bg-slate-900 text-slate-400'
                              }`}
                            >
                              {b === 'none' ? '0' : b}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Animasi Latar Belakang (Artistic Canvas)
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Efek gelombang partikel dinamis yang meredakan ketegangan mata
                  </p>
                  <select
                    value={backgroundAnimation}
                    onChange={e => setBackgroundAnimation(e.target.value as BackgroundAnimationType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    {ANIMATION_OPTIONS.map(anim => (
                      <option key={anim.id} value={anim.id}>
                        {anim.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Warna Aksen & Preset Tone
                  </h3>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { name: 'Emerald', color: '#10b981', preset: 'emerald' },
                      { name: 'Teal', color: '#14b8a6', preset: 'teal' },
                      { name: 'Amber Gold', color: '#f59e0b', preset: 'amber' },
                      { name: 'Cyan Modern', color: '#06b6d4', preset: 'cyan' },
                    ].map(p => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setAccentColor(p.color);
                          setThemePreset(p.preset);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          accentColor === p.color
                            ? 'border-emerald-400 bg-slate-800'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full mx-auto mb-1.5 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-[10px] font-semibold text-slate-300 block truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS & METADATA */}
            {studioTab === 'settings' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama Microsite / Portal</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    placeholder="Contoh: Portal Informasi Cepat Puskesmas Manding"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Slug URL (/m/slug)</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                      placeholder="portal-cepat"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Kategori</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Deskripsi Ringkas</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    placeholder="Deskripsi singkat portal untuk pengunjung..."
                  />
                </div>

                {/* Upload Logo & Banner Quick Section in Settings */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Media Logo & Foto Sampul
                  </h4>
                  <div className="space-y-3">
                    <MicrositeImageUploadField
                      label="Logo Resmi"
                      value={logoUrl}
                      onChange={url => setLogoUrl(url)}
                      presetType="logo"
                      aspectRatio="square"
                      placeholder="Upload logo resmi..."
                    />
                    <MicrositeImageUploadField
                      label="Banner Sampul Header"
                      value={bannerImageUrl}
                      onChange={url => {
                        setBannerImageUrl(url);
                        setProfileImageUrl(url);
                      }}
                      presetType="banner"
                      aspectRatio="banner"
                      placeholder="Upload banner sampul..."
                    />
                  </div>
                </div>

                {/* Kontak & Lokasi Posko */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Kontak & Posko Pelayanan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      placeholder="Hotline Telepon"
                    />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      placeholder="Email Resmi"
                    />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    placeholder="Alamat Fasilitas Kesehatan"
                  />
                </div>

                {/* Status Publikasi & Password */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-300 block">Status Publikasi</span>
                      <span className="text-[10px] text-slate-500">Live dapat diakses publik</span>
                    </div>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as ContentStatus)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    >
                      <option value="published">Published (Aktif)</option>
                      <option value="draft">Draft (Konsep)</option>
                      <option value="archived">Archived (Arsip)</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={passwordProtected}
                        onChange={e => setPasswordProtected(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500"
                      />
                      <span className="font-bold text-slate-300">Proteksi PIN / Password</span>
                    </label>
                    {passwordProtected && (
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Masukkan PIN / Password akses"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GROUPS ORGANIZER */}
            {studioTab === 'groups' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Grup & Kategori Blok
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Kelompokkan tautan ke dalam folder / accordion
                    </p>
                  </div>
                  <button
                    onClick={addGroup}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Grup</span>
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
                    Belum ada grup. Semua blok akan ditampilkan dalam satu daftar bersambung.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {groups.map((grp, idx) => (
                      <div
                        key={grp.id}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={grp.name}
                            onChange={e =>
                              setGroups(prev =>
                                prev.map(g => (g.id === grp.id ? { ...g, name: e.target.value } : g))
                              )
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold"
                            placeholder="Nama Grup"
                          />
                          <button
                            onClick={() => removeGroup(grp.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={grp.collapsible ?? true}
                              onChange={e =>
                                setGroups(prev =>
                                  prev.map(g => (g.id === grp.id ? { ...g, collapsible: e.target.checked } : g))
                                )
                              }
                              className="rounded text-emerald-500"
                            />
                            <span>Bisa Dilipat (Accordion)</span>
                          </label>
                          <span className="font-mono text-[10px]">
                            {blocks.filter(b => b.groupId === grp.id).length} Blok
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Device Simulator */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px] font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pratinjau Langsung</span>
            </span>
          </div>

          {/* Device Frame */}
          <div
            className={`transition-all duration-300 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl bg-[var(--color-bg)] overflow-hidden flex flex-col ${
              deviceMode === 'mobile'
                ? 'w-[375px] h-[720px] max-h-[90vh]'
                : deviceMode === 'tablet'
                ? 'w-[600px] h-[760px] max-h-[90vh]'
                : 'w-full max-w-2xl h-[780px] max-h-[90vh]'
            }`}
          >
            {/* Phone Speaker Notch */}
            {deviceMode === 'mobile' && (
              <div className="w-full h-5 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-16 h-1 rounded-full bg-slate-700" />
              </div>
            )}

            {/* Scrollable Live Interactive Preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <MicrositeTemplateRenderer
                microsite={liveEntity}
                templateOverride={template}
                animationOverride={backgroundAnimation}
                isPreviewMode={true}
                onOpenQR={() => setQrModalOpen(true)}
                onCopyLink={handleCopyPublicLink}
                copied={copiedLink}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD BLOCK SELECTOR PALETTE */}
      <AnimatePresence>
        {isAddBlockOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Pilih Jenis Blok Konten</h3>
                    <p className="text-[11px] text-slate-400">Pilih modul yang ingin disematkan ke bio link</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddBlockOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 custom-scrollbar">
                {BLOCK_TYPE_CONFIGS.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addBlock(item.type)}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 text-left transition flex items-start gap-3 group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition block">
                          {item.label}
                        </span>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: QR CODE PREVIEW & DOWNLOAD */}
      <AnimatePresence>
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white">QR Code Microsite</h3>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
                <img
                  src={micrositeService.generateQRCodeURL(slug)}
                  alt="QR Code"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">{name}</p>
                <p className="text-[11px] font-mono text-emerald-400 mt-0.5">/m/{slug}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={micrositeService.generateQRCodeURL(slug)}
                  download={`qr-microsite-${slug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Gambar QR</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
