import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/PublicAuthContext';
import { micrositeService } from '../../services/micrositeService';
import { MicrositeEntity, HomepageTemplateType, BackgroundAnimationType } from '../../types';
import { MicrositeTemplateRenderer } from '../../components/microsites/MicrositeTemplateRenderer';
import { updateClientMetaTags } from '../../utils/metaSync';
import { siteSettingsService } from '../../services/siteSettingsService';
import {
  Lock,
  AlertTriangle,
  ArrowLeft,
  HeartPulse,
  Eye,
  X,
  Download,
  Copy,
  Check,
  Globe
} from 'lucide-react';

export default function MicrositePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true' || Boolean(user);

  // Robust slug extraction from URL params or location pathname
  const rawPath = location.pathname || window.location.pathname;
  const cleanPath = rawPath.replace(/^\/+|\/+$/g, '');
  let pathSlug = '';
  if (cleanPath.startsWith('m/')) {
    // rute lama: /m/<slug>
    pathSlug = cleanPath.slice(2).split('?')[0].split('#')[0];
  } else if (cleanPath && !cleanPath.includes('/') && !['microsites', 'login', 'admin'].includes(cleanPath)) {
    // rute slug langsung: /<slug> (mis. /tu-pkm, /festival-nusantara)
    pathSlug = cleanPath;
  }
  const rawSlug = params.slug || pathSlug || '';
  let slug = rawSlug.trim();
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  slug = slug.replace(/^\/+|\/+$/g, '').trim();

  const [microsite, setMicrosite] = useState<MicrositeEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDraftUnpublished, setIsDraftUnpublished] = useState(false);

  // Password Protection State
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Sharing & QR state
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedModalUrl, setCopiedModalUrl] = useState(false);

  // Live Template & Animation overrides for visitor experimentation
  const [currentTemplate, setCurrentTemplate] = useState<HomepageTemplateType>('modern_majestic');
  const [currentAnimation, setCurrentAnimation] = useState<BackgroundAnimationType>('aurora_flow');
  
  // Guard to ensure page view is recorded only once per visit
  const viewRecordedForSlugRef = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPage = async (isInitial = false) => {
      if (!slug) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      if (isInitial) {
        setLoading(true);
      }
      setNotFound(false);
      setIsDraftUnpublished(false);
      try {
        const data = await micrositeService.getMicrositeBySlug(slug);
        if (!isMounted) return;

        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Access checks for non-admin visitors
        if (!isPreviewMode) {
          if (data.status !== 'published' || !data.active) {
            setIsDraftUnpublished(true);
            setMicrosite(data);
            setLoading(false);
            return;
          }
        }

        setMicrosite(data);

        // Update Dynamic Meta Tags & Title based on Panel Settings & Microsite Content
        try {
          const cachedSettings = siteSettingsService.getCachedSettings();
          const siteName = cachedSettings?.siteName || cachedSettings?.shortName || 'Puskesmas Manding';
          updateClientMetaTags({
            title: `${data.name} - ${siteName}`,
            description: data.description || `Portal resmi ${data.name} pada ${siteName}.`,
            image: data.ogImageUrl || data.profileImageUrl || data.logoUrl,
            siteName: siteName,
            url: window.location.href
          });
        } catch {}
        
        // Track page view in analytics (only once per unique slug session)
        if (viewRecordedForSlugRef.current !== data.id) {
          viewRecordedForSlugRef.current = data.id;
          micrositeService.recordAnalyticsEvent(data.id, 'page_view');
        }
        
        // Initialize template & animation
        const initTemplate = data.themeCustomization?.template || 'modern_majestic';
        setCurrentTemplate(initTemplate);

        const defaultAnim: Record<HomepageTemplateType, BackgroundAnimationType> = {
          modern_majestic: 'aurora_flow',
          artistic_bio: 'bioluminescent',
          avant_garde: 'geometric_waves',
          nusantara_art: 'golden_radiance',
          minimal_gallery: 'subtle_glow',
          classic: 'none'
        };

        const initAnim = data.themeCustomization?.backgroundAnimation || defaultAnim[initTemplate] || 'aurora_flow';
        setCurrentAnimation(initAnim);

        // If password protected, load lock state
        if (data.passwordProtected) {
          setIsUnlocked(false);
        } else {
          setIsUnlocked(true);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPage(true);

    const handleUpdate = () => {
      if (!isMounted) return;
      loadPage(false);
    };

    window.addEventListener('puskesmas_microsites_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('puskesmas_microsites_updated', handleUpdate);
    };
  }, [slug, isPreviewMode]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!microsite) return;
    
    setPasswordError(false);
    const valid = await micrositeService.verifyPassword(microsite.id, passwordInput);
    if (valid) {
      setIsUnlocked(true);
    } else {
      setPasswordError(true);
    }
  };

  const handleCopyLink = () => {
    if (!microsite) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyModalUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedModalUrl(true);
    setTimeout(() => setCopiedModalUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        {/* Skeleton halaman portal — meniru struktur header + daftar tautan */}
        <div className="mx-auto max-w-xl px-4 pt-14">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
            <div className="h-5 w-48 animate-pulse rounded-full bg-[var(--color-muted)]" />
            <div className="h-3.5 w-64 animate-pulse rounded-full bg-[var(--color-muted)]" />
          </div>
          <div className="mt-10 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 w-full animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            <HeartPulse className="h-4 w-4 animate-pulse text-[var(--color-primary)]" />
            Memuat portal…
          </p>
        </div>
      </div>
    );
  }

  // If portal is in draft/inactive state and accessed by normal visitors
  if (isDraftUnpublished && microsite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--color-bg)] p-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Portal Belum Dipublikasikan
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Portal <span className="font-semibold text-[var(--color-text)]">"{microsite.name}"</span> masih
          berstatus{' '}
          <span className="font-mono font-bold text-[var(--color-warning)]">
            {microsite.status.toUpperCase()}
          </span>{' '}
          atau dinonaktifkan sementara oleh pengelola.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/microsites"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
          >
            <Globe className="h-4 w-4 text-[var(--color-primary)]" />
            Lihat Microsite Lain
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !microsite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--color-bg)] p-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Portal Tidak Ditemukan
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Portal yang Anda cari tidak tersedia, dinonaktifkan sementara, atau URL slug telah diubah.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/microsites"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
          >
            <Globe className="h-4 w-4 text-[var(--color-primary)]" />
            Jelajahi Microsite
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Render Lock Screen if Protected
  if (!isUnlocked) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] p-6">
        {isPreviewMode && (
          <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-[var(--color-primary)] py-2 text-center text-xs font-bold text-[var(--color-primary-foreground)]">
            <Eye className="h-4 w-4" />
            <span>PRATINJAU DRAF PORTAL (PREVIEW MODE)</span>
          </div>
        )}

        <div className="studio-card studio-fade-in w-full max-w-md space-y-6 p-8 shadow-2xl">
          <div className="space-y-3 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[var(--color-text)]">
              Portal Dilindungi Sandi
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Masukkan kata sandi resmi untuk membuka akses informasi portal ini.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="access-password"
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]"
              >
                Kata Sandi Akses
              </label>
              <input
                id="access-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi…"
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                required
                autoFocus
              />
              {passwordError && (
                <p role="alert" className="text-[11px] font-medium text-[var(--color-danger)]">
                  Kata sandi yang Anda masukkan salah. Silakan coba lagi.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
            >
              Buka Portal
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Banner Preview Mode */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-50 shadow-lg">
          <Eye className="w-4 h-4" />
          <span>PRATINJAU PORTAL (PREVIEW MODE) - DRAFT DATA</span>
        </div>
      )}

      {/* Render Template Component */}
      <MicrositeTemplateRenderer
        microsite={microsite}
        templateOverride={currentTemplate}
        animationOverride={currentAnimation}
        isPreviewMode={isPreviewMode}
        onOpenQR={() => setShowQR(true)}
        onCopyLink={handleCopyLink}
        copied={copied}
      />

      {/* QR Code Modal Dialog */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-5 text-center shadow-2xl relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 rounded-2xl text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)]">{microsite.name}</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">Pindai QR Code untuk akses langsung</p>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block border border-[var(--color-border)] shadow-md">
              <img
                src={micrositeService.generateQRCodeURL(microsite.slug)}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-mono break-all text-[var(--color-muted-foreground)] bg-[var(--color-bg)] p-2 rounded-xl border border-[var(--color-border)]">
                {window.location.href}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyModalUrl}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--button-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] py-2.5 text-xs font-bold text-[var(--color-text)] transition-all hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border)] active:scale-[0.97]"
                >
                  {copiedModalUrl ? (
                    <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedModalUrl ? 'Tersalin' : 'Salin URL'}</span>
                </button>
                <a
                  href={micrositeService.generateQRCodeURL(microsite.slug)}
                  download={`QR_${microsite.slug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--button-radius)] bg-[var(--color-primary)] py-2.5 text-xs font-bold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-strong)] active:scale-[0.97]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh QR</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
