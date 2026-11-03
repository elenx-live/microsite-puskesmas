import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { micrositeService } from '../../services/micrositeService';
import { MicrositeEntity, ContentStatus, MicrositeCategory } from '../../types';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  QrCode,
  ExternalLink,
  Lock,
  Unlock,
  Archive,
  Eye,
  CheckCircle,
  XCircle,
  PlusCircle,
  MoveUp,
  MoveDown,
  Info,
  Palette,
  Phone,
  Settings,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Link2,
  Folder,
  Tag,
  Sparkles,
  BarChart3,
  TrendingUp,
  Flame,
  Image,
  Layers,
  CheckSquare,
  HelpCircle,
  Stethoscope,
  Send,
  MessageCircle,
  Video,
  FileText,
  Calendar,
  MousePointerClick,
  CopyPlus,
  UploadCloud,
  DownloadCloud,
  PieChart
} from 'lucide-react';
import { MicrositeIcon } from '../../components/microsites/MicrositeIcon';
import { MicrositeStudioEditor } from '../../components/microsites/builder/MicrositeStudioEditor';
import { generateSmartShareUrl, openWhatsAppShare } from '../../utils/shareUtils';

type Tone = 'default' | 'primary' | 'danger' | 'success' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  default:
    'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]',
  primary:
    'bg-[var(--color-secondary)] text-[var(--color-primary)] hover:brightness-[0.97]',
  danger:
    'bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[var(--color-danger)] hover:bg-[color-mix(in_oklab,var(--color-danger)_20%,transparent)]',
  success:
    'bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)] hover:bg-[color-mix(in_oklab,var(--color-success)_22%,transparent)]',
  muted: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]',
};

/** Tombol ikon aksi kartu — konsisten, aksesibel (title + aria-label), area sentuh 32px. */
const IconAction: React.FC<{
  onClick: () => void;
  title: string;
  tone?: Tone;
  children: React.ReactNode;
}> = ({ onClick, title, tone = 'default', children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] transition-all active:scale-90 ${TONE_CLASS[tone]}`}
  >
    {children}
  </button>
);

/** Kartu metrik ringkasan di dialog analitik. */
const STAT_TONE: Record<string, string> = {
  info: 'text-[var(--color-info)]',
  primary: 'text-[var(--color-primary)]',
  warning: 'text-[var(--color-warning)]',
};
const StatTile: React.FC<{
  icon: React.ReactNode;
  tone: 'info' | 'primary' | 'warning';
  label: string;
  value: React.ReactNode;
  hint: string;
}> = ({ icon, tone, label, value, hint }) => (
  <div className="space-y-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${STAT_TONE[tone]}`}>
      {icon}
      <span>{label}</span>
    </div>
    <p className="studio-num text-2xl font-bold text-[var(--color-text)]">{value}</p>
    <p className="text-[10px] text-[var(--color-muted-foreground)]">{hint}</p>
  </div>
);

/** Tombol aksi sekunder bergaya kartu (ikon di atas label) di dialog QR. */
const ShareAction: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({
  onClick,
  icon,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-3 text-[11px] font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-border-strong)] hover:bg-[var(--color-muted)] active:scale-[0.97]"
  >
    <span className="text-[var(--color-primary)]">{icon}</span>
    {label}
  </button>
);


export default function MicrositesManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [microsites, setMicrosites] = useState<MicrositeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrMicrosite, setQrMicrosite] = useState<MicrositeEntity | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Studio Visual Editor State
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioMicrosite, setStudioMicrosite] = useState<MicrositeEntity | null>(null);

  // Advanced Analytics State
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedAnalyticsMicrosite, setSelectedAnalyticsMicrosite] = useState<MicrositeEntity | null>(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState<{
    views: number;
    clicks: number;
    ctr: string;
    deviceBreakdown?: Record<string, number>;
    referrerBreakdown?: Record<string, number>;
    blockClicks?: Record<string, number>;
  } | null>(null);

  // File Input Ref for JSON Import
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Categories state
  const [categories, setCategories] = useState<MicrositeCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [category, setCategory] = useState('Umum');

  useEffect(() => {
    loadMicrosites();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await micrositeService.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Nama kategori wajib diisi.', 'warning');
      return;
    }
    const nameTrim = newCategoryName.trim();
    if (categories.some(c => c.name.toLowerCase() === nameTrim.toLowerCase())) {
      showToast('Kategori sudah ada.', 'warning');
      return;
    }
    const updated: MicrositeCategory[] = [
      ...categories,
      { name: nameTrim, description: newCategoryDescription.trim() || `Kategori portal khusus untuk ${nameTrim}.` }
    ];
    try {
      const actor = {
        id: user?.uid || 'usr-admin',
        email: user?.email || 'admin@puskesmas.go.id',
        name: user?.displayName || 'Administrator'
      };
      await micrositeService.saveCategories(updated, actor);
      setCategories(updated);
      setNewCategoryName('');
      setNewCategoryDescription('');
      showToast('Kategori berhasil ditambahkan.');
    } catch {
      showToast('Gagal menyimpan kategori.', 'error');
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (catToDelete.toLowerCase() === 'umum') {
      showToast('Kategori "Umum" adalah kategori khusus yang wajib ada dan tidak dapat dihapus.', 'warning');
      return;
    }
    
    try {
      const actor = {
        id: user?.uid || 'usr-admin',
        email: user?.email || 'admin@puskesmas.go.id',
        name: user?.displayName || 'Administrator'
      };
      await micrositeService.deleteCategory(catToDelete, actor);
      await loadCategories();
      await loadMicrosites();
      showToast(`Kategori "${catToDelete}" berhasil dihapus dan portal dialihkan ke "Umum".`);
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus kategori.', 'error');
    }
  };

  const loadMicrosites = async () => {
    setLoading(true);
    try {
      const data = await micrositeService.getMicrosites();
      setMicrosites(data);
    } catch {
      showToast('Gagal memuat microsite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    handleOpenStudio();
  };

  const handleOpenEdit = (m: MicrositeEntity) => {
    handleOpenStudio(m);
  };

  const handleToggleStatus = async (m: MicrositeEntity) => {
    const nextStatus: ContentStatus = m.status === 'published' ? 'draft' : 'published';
    try {
      await micrositeService.updateMicrosite(m.id, { status: nextStatus }, {
        id: user?.uid || 'usr-anon',
        email: user?.email || 'anon@puskesmas.go.id',
        name: user?.displayName || 'Admin'
      });
      showToast(`Status "${m.name}" diubah ke ${nextStatus === 'published' ? 'Dipublikasikan' : 'Draft'}.`);
      loadMicrosites();
    } catch {
      showToast('Gagal merubah status microsite.', 'error');
    }
  };

  const handleToggleActive = async (m: MicrositeEntity) => {
    try {
      await micrositeService.updateMicrosite(m.id, { active: !m.active }, {
        id: user?.uid || 'usr-anon',
        email: user?.email || 'anon@puskesmas.go.id',
        name: user?.displayName || 'Admin'
      });
      showToast(`Microsite "${m.name}" berhasil ${!m.active ? 'diaktifkan' : 'dinonaktifkan'}.`);
      loadMicrosites();
    } catch {
      showToast('Gagal merubah keaktifan microsite.', 'error');
    }
  };

  const handleDelete = async (m: MicrositeEntity) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus microsite "${m.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await micrositeService.deleteMicrosite(m.id, {
        id: user?.uid || 'usr-anon',
        email: user?.email || 'anon@puskesmas.go.id',
        name: user?.displayName || 'Admin'
      });
      showToast(`Microsite "${m.name}" berhasil dihapus.`);
      loadMicrosites();
    } catch {
      showToast('Gagal menghapus microsite', 'error');
    }
  };

  const handleOpenQR = (m: MicrositeEntity) => {
    setQrMicrosite(m);
    setQrModalOpen(true);
    setCopiedUrl(false);
  };

  const handleCopyQRUrl = () => {
    if (!qrMicrosite) return;
    const url = `${window.location.origin}/m/${qrMicrosite.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showToast('Tautan microsite berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrMicrosite) return;
    const qrUrl = micrositeService.generateQRCodeURL(qrMicrosite.slug);
    const a = document.createElement('a');
    a.href = qrUrl;
    a.target = '_blank';
    a.download = `QR_Code_Microsite_${qrMicrosite.slug}.png`;
    a.click();
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrMicrosite) return;
    const qrUrl = micrositeService.generateQRCodeURL(qrMicrosite.slug);
    const targetUrl = `${window.location.origin}/m/${qrMicrosite.slug}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR Code - ${qrMicrosite.name}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: white; color: black; }
            .card { border: 2px solid #ccc; border-radius: 16px; padding: 30px; display: inline-block; max-width: 400px; }
            img { width: 250px; height: 250px; margin: 20px 0; }
            h2 { margin: 10px 0; font-weight: normal; }
            p { font-size: 14px; color: #555; margin: 5px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <h2>${qrMicrosite.name}</h2>
            <p>Pindai QR Code di bawah untuk mengakses informasi cepat:</p>
            <img src="${qrUrl}" alt="QR Code"/>
            <p style="font-weight: bold; color: #10b981;">${targetUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenStudio = (m?: MicrositeEntity) => {
    if (m) {
      setStudioMicrosite(m);
    } else {
      const newBlank: MicrositeEntity = {
        id: 'new',
        name: 'Portal Layanan Baru',
        slug: 'layanan-' + Math.random().toString(36).substring(2, 6),
        description: 'Pusat informasi dan kontak resmi Puskesmas Manding',
        category: category || 'Umum',
        status: 'published',
        active: true,
        passwordProtected: false,
        views: 0,
        clicks: 0,
        links: [],
        blocks: [],
        groups: [],
        themeCustomization: {
          theme: 'emerald',
          template: 'modern_majestic',
          backgroundAnimation: 'aurora_flow',
          buttonStyle: 'rounded',
          accentColor: '#10b981'
        },
        createdBy: {
          id: user?.uid || 'admin',
          name: user?.displayName || 'Administrator'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setStudioMicrosite(newBlank);
    }
    setStudioOpen(true);
  };

  const handleStudioSave = async (data: Partial<MicrositeEntity>) => {
    if (!studioMicrosite) return;
    const actor = {
      id: user?.uid || 'usr-admin',
      email: user?.email || 'admin@puskesmas.go.id',
      name: user?.displayName || 'Administrator'
    };

    let savedResult: MicrositeEntity | undefined;
    if (studioMicrosite.id && studioMicrosite.id !== 'new') {
      savedResult = await micrositeService.updateMicrosite(studioMicrosite.id, data, actor);
    } else {
      savedResult = await micrositeService.createMicrosite(data as any, actor);
    }

    if (savedResult) {
      setStudioMicrosite(savedResult);
    }

    await loadMicrosites();
    // Tetap berada di Studio Visual Editor agar pengguna dapat terus mengatur elemen lain
  };

  const handleDuplicate = async (m: MicrositeEntity) => {
    try {
      const actor = {
        id: user?.uid || 'usr-admin',
        email: user?.email || 'admin@puskesmas.go.id',
        name: user?.displayName || 'Administrator'
      };
      const duplicated = await micrositeService.duplicateMicrosite(m.id, actor);
      if (duplicated) {
        showToast(`Microsite berhasil diduplikasi menjadi "${duplicated.name}"!`, 'success');
        loadMicrosites();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menduplikasi microsite', 'error');
    }
  };

  const handleExportJSON = (m: MicrositeEntity) => {
    const jsonStr = micrositeService.exportMicrositeToJSON(m);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microsite-${m.slug}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Konfigurasi microsite berhasil diekspor!', 'success');
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const actor = {
        id: user?.uid || 'usr-admin',
        email: user?.email || 'admin@puskesmas.go.id',
        name: user?.displayName || 'Administrator'
      };
      const imported = await micrositeService.importMicrositeFromJSON(text, actor);
      if (imported) {
        showToast(`Microsite "${imported.name}" berhasil diimpor!`, 'success');
        loadMicrosites();
      } else {
        showToast('Gagal memproses berkas konfigurasi JSON.', 'error');
      }
    } catch (err: any) {
      showToast('Format berkas tidak valid.', 'error');
    }
    e.target.value = '';
  };

  const handleOpenAnalytics = async (m: MicrositeEntity) => {
    setSelectedAnalyticsMicrosite(m);
    setAnalyticsModalOpen(true);
    try {
      const summary = await micrositeService.getAnalyticsSummary(m.id);
      setDetailedAnalytics(summary);
    } catch {
      setDetailedAnalytics({
        views: m.views || 0,
        clicks: m.clicks || 0,
        ctr: m.views ? (((m.clicks || 0) / m.views) * 100).toFixed(1) + '%' : '0.0%'
      });
    }
  };

  const filteredMicrosites = microsites.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      bare
      activeTab="microsites"
      title="Microsite Saya"
      subtitle="Buat halaman praktis (link-in-bio) dengan QR Code dinamis untuk mempercepat distribusi info posyandu, PIN polio, dan layanan."
    >
      <div className="space-y-6">
        {/* ── Toolbar aksi ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau slug…"
              aria-label="Cari microsite"
              className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] shadow-[var(--shadow-xs)] transition-all placeholder:text-[var(--color-muted-foreground)]/70 hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSONFile}
              accept=".json,application/json"
              className="hidden"
            />
            <Button onClick={handleImportJSONClick} variant="secondary" size="sm">
              <UploadCloud className="h-4 w-4" />
              <span>Impor JSON</span>
            </Button>
            <Button onClick={() => setCategoryModalOpen(true)} variant="secondary" size="sm">
              <Folder className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Kelola Kategori</span>
            </Button>
            <Button onClick={() => handleOpenStudio()} variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              <span>Buat Microsite</span>
            </Button>
          </div>
        </div>

        {/* ── Daftar microsite ─────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, g) => (
              <div
                key={g}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]/60 p-5"
              >
                <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--color-muted)]" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="studio-card animate-pulse p-5">
                      <div className="h-4 w-2/3 rounded bg-[var(--color-muted)]" />
                      <div className="mt-2 h-3 w-1/3 rounded bg-[var(--color-muted)]" />
                      <div className="mt-4 h-3 w-full rounded bg-[var(--color-muted)]" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-[var(--color-muted)]" />
                      <div className="mt-4 flex gap-2">
                        <div className="h-6 w-20 rounded-full bg-[var(--color-muted)]" />
                        <div className="h-6 w-16 rounded-full bg-[var(--color-muted)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredMicrosites.length === 0 ? (
          <div className="studio-card studio-rise mx-auto max-w-lg p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-secondary)] text-[var(--color-primary)]">
              <Globe className="h-6 w-6" />
            </div>
            <p className="mt-4 font-display text-base font-bold text-[var(--color-text)]">
              {searchQuery ? 'Tidak ada microsite yang cocok' : 'Belum ada Microsite'}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {searchQuery
                ? `Tidak ada hasil untuk “${searchQuery}”.`
                : 'Mulailah dengan membuat microsite baru untuk kebutuhan Pekan Imunisasi, Layanan Ramah Anak, atau Program Promkes.'}
            </p>
            {searchQuery ? (
              <div className="mt-5 flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Bersihkan pencarian
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex justify-center">
                <Button variant="primary" size="sm" onClick={() => handleOpenStudio()}>
                  <Plus className="h-4 w-4" />
                  Buat Microsite
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((catObj) => {
              const catName = catObj.name;
              const catDesc = catObj.description;
              const items = filteredMicrosites.filter(
                (m) =>
                  (m.category || 'Umum').toLowerCase() === catName.toLowerCase() ||
                  (catName.toLowerCase() === 'umum' && !m.category),
              );
              if (items.length === 0 && searchQuery) return null;

              return (
                <section
                  key={catName}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]/50 p-4 sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-secondary)] text-[var(--color-primary)]">
                        <Folder className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-[15px] font-bold text-[var(--color-text)]">
                          {catName}
                        </h2>
                        <p className="line-clamp-1 text-[11px] text-[var(--color-muted-foreground)]">
                          {catDesc}
                        </p>
                      </div>
                    </div>
                    <Badge variant="zinc" size="sm">
                      <span className="studio-num">{items.length}</span> portal
                    </Badge>
                  </div>

                  {items.length === 0 ? (
                    <div className="py-8 text-center text-xs italic text-[var(--color-muted-foreground)]">
                      Belum ada microsite dalam kategori ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((m, idx) => (
                        <Card
                          key={m.id}
                          className="studio-rise flex flex-col justify-between gap-4"
                          style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2.5">
                                {m.ogImageUrl || m.profileImageUrl || m.logoUrl ? (
                                  <img
                                    src={m.ogImageUrl || m.profileImageUrl || m.logoUrl}
                                    alt=""
                                    loading="lazy"
                                    className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] object-cover"
                                  />
                                ) : (
                                  <span
                                    aria-hidden
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                                  >
                                    <Globe className="h-4 w-4" />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <h3 className="line-clamp-1 font-display text-[15px] font-bold leading-snug text-[var(--color-text)]">
                                    {m.name}
                                  </h3>
                                  <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-muted-foreground)]">
                                    /m/{m.slug}
                                  </p>
                                </div>
                              </div>
                              {m.passwordProtected ? (
                                <Badge variant="amber" size="sm">
                                  <Lock className="h-3 w-3" />
                                  Sandi
                                </Badge>
                              ) : (
                                <Badge variant="emerald" size="sm">
                                  <Unlock className="h-3 w-3" />
                                  Publik
                                </Badge>
                              )}
                            </div>

                            <p className="line-clamp-2 h-10 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                              {m.description || 'Tidak ada deskripsi portal.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant={m.status === 'published' ? 'emerald' : 'zinc'} size="sm">
                                {m.status === 'published'
                                  ? 'Published'
                                  : m.status === 'draft'
                                    ? 'Draft'
                                    : 'Arsip'}
                              </Badge>
                              <Badge variant={m.active ? 'blue' : 'red'} size="sm">
                                {m.active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                              <span className="ml-auto flex items-center gap-2.5 text-[11px] text-[var(--color-muted-foreground)]">
                                <span className="flex items-center gap-0.5">
                                  <Eye className="h-3 w-3" />
                                  <span className="studio-num">{m.views || 0}</span>
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <MousePointerClick className="h-3 w-3" />
                                  <span className="studio-num">{m.clicks || 0}</span>
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">
                              Update{' '}
                              {new Date(m.updatedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>

                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenStudio(m)}
                                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-secondary)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-secondary-foreground)] transition-all hover:brightness-[0.97] active:scale-[0.97]"
                                title="Buka Studio Builder Visual"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Studio</span>
                              </button>
                              <IconAction onClick={() => handleOpenAnalytics(m)} title="Statistik & Analitik Lengkap">
                                <PieChart className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction onClick={() => handleDuplicate(m)} title="Duplikasi Microsite">
                                <CopyPlus className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction onClick={() => handleExportJSON(m)} title="Ekspor JSON Konfigurasi">
                                <DownloadCloud className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction
                                onClick={() => window.open(`/m/${m.slug}`, '_blank')}
                                title="Buka Link Publik"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction onClick={() => handleOpenQR(m)} title="QR Code & Bagikan" tone="primary">
                                <QrCode className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction
                                onClick={() =>
                                  openWhatsAppShare({
                                    title: m.name,
                                    description: m.description,
                                    imageUrl: m.ogImageUrl || m.profileImageUrl || m.logoUrl,
                                    targetPath: `/m/${m.slug}`,
                                  })
                                }
                                title="Bagikan ke WhatsApp"
                                tone="success"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction
                                onClick={() => handleToggleStatus(m)}
                                title={m.status === 'published' ? 'Tarik dari Publik' : 'Terbitkan ke Publik'}
                                tone={m.status === 'published' ? 'primary' : 'muted'}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </IconAction>
                              <IconAction onClick={() => handleDelete(m)} title="Hapus Portal" tone="danger">
                                <Trash2 className="h-3.5 w-3.5" />
                              </IconAction>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* QR Code & Information Share Modal */}
        <Modal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="QR Code & Bagikan Portal"
          size="md"
          footer={
            <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
              <div className="text-[11px] text-[var(--color-muted-foreground)]">
                QR dinamis tidak akan berubah jika isi portal diubah.
              </div>
              <Button onClick={() => setQrModalOpen(false)} variant="secondary" size="sm">
                Selesai
              </Button>
            </div>
          }
        >
          {qrMicrosite && (
            <div className="space-y-5 py-1 text-center">
              <div className="inline-block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-lg)]">
                <img
                  src={micrositeService.generateQRCodeURL(qrMicrosite.slug)}
                  alt={`QR Code ${qrMicrosite.name}`}
                  className="mx-auto h-52 w-52 bg-white"
                />
                <div className="mt-4">
                  <span className="block font-display text-sm font-bold text-slate-900">
                    {qrMicrosite.name}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] text-slate-500">
                    /m/{qrMicrosite.slug}
                  </span>
                </div>
              </div>

              <div className="mx-auto max-w-sm space-y-3">
                <div className="flex items-center gap-2 rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/60 p-2">
                  <span className="flex-1 select-all truncate px-2 font-mono text-[11px] text-[var(--color-muted-foreground)]">
                    {`${window.location.origin}/m/${qrMicrosite.slug}`}
                  </span>
                  <button
                    onClick={handleCopyQRUrl}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-all hover:bg-[var(--color-primary-strong)] active:scale-90"
                    title="Salin tautan"
                    aria-label="Salin tautan"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <ShareAction onClick={handleDownloadQR} icon={<Download className="h-4 w-4" />} label="Unduh PNG" />
                  <ShareAction onClick={handlePrintQR} icon={<Printer className="h-4 w-4" />} label="Cetak Brosur" />
                  <ShareAction
                    onClick={() => window.open(`/m/${qrMicrosite.slug}`, '_blank')}
                    icon={<ExternalLink className="h-4 w-4" />}
                    label="Buka Link"
                  />
                </div>

                {/* Kartu bagikan WhatsApp — token tema, bukan warna dark-mode */}
                <div className="space-y-2 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-success)_28%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-success)]">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Link Khusus WhatsApp
                    </span>
                    <Badge variant="emerald" size="sm">
                      Pratinjau Dinamis
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--color-muted-foreground)]">
                    Gunakan tautan ini agar WhatsApp langsung menampilkan nama, foto, dan deskripsi
                    microsite ini tanpa tertahan cache lama.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() =>
                        openWhatsAppShare({
                          title: qrMicrosite.name,
                          description: qrMicrosite.description,
                          imageUrl: qrMicrosite.ogImageUrl || qrMicrosite.profileImageUrl || qrMicrosite.logoUrl,
                          targetPath: `/m/${qrMicrosite.slug}`,
                        })
                      }
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Bagikan
                    </Button>
                    <Button
                      onClick={() => {
                        const smartUrl = generateSmartShareUrl({
                          title: qrMicrosite.name,
                          description: qrMicrosite.description,
                          imageUrl: qrMicrosite.ogImageUrl || qrMicrosite.profileImageUrl || qrMicrosite.logoUrl,
                          targetPath: `/m/${qrMicrosite.slug}`,
                        });
                        navigator.clipboard.writeText(smartUrl);
                        showToast('Smart Link WhatsApp berhasil disalin!');
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Salin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Category Management Modal */}
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Pengaturan Kategori Microsite"
          size="md"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setCategoryModalOpen(false)} variant="secondary" size="sm">
                Tutup
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
              <label className="text-[13px] font-bold text-[var(--color-text)]">Tambah Kategori Baru</label>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori (contoh: Layanan Darurat)…"
                  className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
                />
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={e => setNewCategoryDescription(e.target.value)}
                  placeholder="Keterangan singkat kategori…"
                  className="w-full rounded-[var(--input-radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
                />
                <Button onClick={handleAddCategory} variant="primary" size="sm" className="w-full">
                  <Plus className="h-4 w-4" />
                  Tambah Kategori
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-bold text-[var(--color-text)]">Daftar Kategori Aktif</label>
              <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div
                    key={cat.name}
                    className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3.5"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                        <span className="text-[13px] font-bold text-[var(--color-text)]">{cat.name}</span>
                        {cat.name.toLowerCase() === 'umum' && (
                          <Badge variant="emerald" size="sm">Wajib</Badge>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[var(--color-muted-foreground)]">
                        {cat.description}
                      </p>
                    </div>
                    {cat.name.toLowerCase() !== 'umum' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.name);
                        }}
                        className={`shrink-0 active:scale-90 ${TONE_CLASS.danger} grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] transition-all`}
                        title="Hapus Kategori (Portal dialihkan ke Umum)"
                        aria-label="Hapus kategori"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="shrink-0 pt-1 text-[10px] italic text-[var(--color-muted-foreground)]">
                        Tidak dapat dihapus
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        {/* Detailed Analytics Modal */}
        <Modal
          isOpen={analyticsModalOpen}
          onClose={() => setAnalyticsModalOpen(false)}
          title={`Statistik & Analitik: ${selectedAnalyticsMicrosite?.name || ''}`}
          size="lg"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setAnalyticsModalOpen(false)} variant="secondary" size="sm">
                Tutup
              </Button>
            </div>
          }
        >
          {selectedAnalyticsMicrosite && detailedAnalytics && (
            <div className="space-y-6">
              {/* Ringkasan metrik */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                  icon={<Eye className="h-4 w-4" />}
                  tone="info"
                  label="Total Kunjungan"
                  value={detailedAnalytics.views}
                  hint="Page views tercatat"
                />
                <StatTile
                  icon={<MousePointerClick className="h-4 w-4" />}
                  tone="primary"
                  label="Total Klik Interaksi"
                  value={detailedAnalytics.clicks}
                  hint="Klik tautan & tombol"
                />
                <StatTile
                  icon={<TrendingUp className="h-4 w-4" />}
                  tone="warning"
                  label="Click-Through Rate"
                  value={detailedAnalytics.ctr}
                  hint="Efektivitas interaksi"
                />
              </div>

              {/* Distribusi perangkat */}
              {detailedAnalytics.deviceBreakdown && Object.keys(detailedAnalytics.deviceBreakdown).length > 0 && (
                <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-muted-foreground)]">
                    Distribusi Perangkat Pengunjung
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {Object.entries(detailedAnalytics.deviceBreakdown).map(([dev, count]) => (
                      <div key={dev} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                          {dev}
                        </span>
                        <span className="studio-num text-lg font-bold text-[var(--color-text)]">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performa blok / tautan */}
              <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-muted-foreground)]">
                  Performa Blok & Tautan Aktif
                </h4>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {(selectedAnalyticsMicrosite.blocks && selectedAnalyticsMicrosite.blocks.length > 0
                    ? selectedAnalyticsMicrosite.blocks
                    : selectedAnalyticsMicrosite.links
                  )?.map((item: any, idx: number) => {
                    const title = item.title || item.label || 'Tautan';
                    const clicks = item.clicks || (detailedAnalytics.blockClicks?.[item.id] ?? 0);
                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="studio-num text-[10px] text-[var(--color-muted-foreground)]">
                            #{idx + 1}
                          </span>
                          <span className="truncate font-semibold text-[var(--color-text)]">{title}</span>
                          <span className="hidden truncate text-[10px] text-[var(--color-muted-foreground)] sm:inline">
                            {item.url}
                          </span>
                        </div>
                        <span className="studio-num ml-3 shrink-0 font-bold text-[var(--color-primary)]">
                          {clicks} klik
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Full-Screen Visual Studio Builder */}
        {studioOpen && studioMicrosite && (
          <MicrositeStudioEditor
            microsite={studioMicrosite}
            categories={categories}
            onSave={handleStudioSave}
            onClose={() => setStudioOpen(false)}
            onDuplicate={handleDuplicate as any}
          />
        )}

      </div>
    </AdminLayout>
  );
}
