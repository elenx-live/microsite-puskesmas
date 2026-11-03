import React from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  QrCode,
  Share2,
  Check,
  Facebook,
  Instagram,
  Youtube,
  Send,
  HeartPulse,
  ChevronRight
} from 'lucide-react';
import { MicrositeEntity, BackgroundAnimationType } from '../../../types';
import { ArtisticBackgroundCanvas } from '../../artistic/ArtisticBackgroundCanvas';
import { MicrositeContentList } from '../MicrositeContentList';
import { MicrositeHeaderRenderer } from '../MicrositeHeaderRenderer';
import { MicrositeFooterRenderer } from '../MicrositeFooterRenderer';
import { Link } from 'react-router-dom';
import { generateSmartShareUrl } from '../../../utils/shareUtils';

interface Props {
  microsite: MicrositeEntity;
  isPreviewMode?: boolean;
  onOpenQR: () => void;
  onCopyLink: () => void;
  copied: boolean;
  activeAnimation?: BackgroundAnimationType;
}

export const ClassicHubMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'none'
}) => {
  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 20) / 100;
  const bgBlur =
    microsite.themeCustomization?.bgImageBlur === 'lg'
      ? 'blur(16px)'
      : microsite.themeCustomization?.bgImageBlur === 'md'
      ? 'blur(8px)'
      : microsite.themeCustomization?.bgImageBlur === 'sm'
      ? 'blur(4px)'
      : 'none';

  const theme = microsite.themeCustomization?.theme || 'emerald';
  const buttonStyle = microsite.themeCustomization?.buttonStyle || 'rounded';

  // CSS Styles based on themes
  const themeStyles: Record<string, { bg: string; card: string; text: string; subText: string; btn: string }> = {
    emerald: {
      bg: 'bg-gradient-to-b from-[#064e3b]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    sky: {
      bg: 'bg-gradient-to-b from-[#0c4a6e]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-sky-600 hover:bg-sky-500 text-white'
    },
    rose: {
      bg: 'bg-gradient-to-b from-[#881337]/30 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)]/90 border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
    neutral: {
      bg: 'bg-gradient-to-b from-zinc-900/40 to-[var(--color-bg)]',
      card: 'bg-[var(--color-card)] border-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
      subText: 'text-[var(--color-muted-foreground)]',
      btn: 'bg-[var(--color-surface)] hover:bg-zinc-700 text-[var(--color-text)]'
    },
    light: {
      bg: 'bg-gradient-to-b from-slate-100 to-slate-50',
      card: 'bg-white border-slate-200 shadow-md',
      text: 'text-slate-900',
      subText: 'text-slate-500',
      btn: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    dark: {
      bg: 'bg-black',
      card: 'bg-zinc-950 border-amber-500/20 shadow-amber-500/10',
      text: 'text-amber-100',
      subText: 'text-zinc-400',
      btn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold'
    }
  };

  const currentStyle = themeStyles[theme] || themeStyles.emerald;

  const buttonRadius = {
    sharp: 'rounded-none',
    rounded: 'rounded-2xl',
    pill: 'rounded-full'
  }[buttonStyle] || 'rounded-2xl';

  return (
    <div className={`relative min-h-screen ${currentStyle.bg} flex flex-col items-center py-10 px-4 space-y-6 overflow-hidden`}>
      {/* Background Image Layer */}
      {bgImg && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src={bgImg}
            alt="Latar Belakang"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105"
            style={{ opacity: bgOpacity, filter: bgBlur }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/85 via-[var(--color-bg)]/70 to-[var(--color-bg)]/95" />
        </div>
      )}

      {/* Background Canvas */}
      {activeAnimation !== 'none' && (
        <ArtisticBackgroundCanvas type={activeAnimation} intensity="subtle" />
      )}

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-lg flex justify-between items-center px-2">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Website Utama</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${microsite.description ? microsite.description + '\n\n' : ''}${generateSmartShareUrl({
              title: microsite.name,
              description: microsite.description,
              imageUrl: microsite.ogImageUrl || microsite.profileImageUrl || microsite.logoUrl,
              targetPath: `/m/${microsite.slug}`
            })}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bagikan ke WA</span>
          </a>
          <button
            onClick={onCopyLink}
            className="p-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition"
            title="Salin Tautan"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--color-primary)]" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenQR}
            className="p-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition"
            title="Tampilkan QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        
        {/* Dynamic Multi-Style Header */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Link / Content Blocks List */}
        <div className="space-y-3">
          <MicrositeContentList
            microsite={microsite}
            themeStyle="emerald"
            accentColor="#10b981"
          />
        </div>

        {/* Contact and Operational Information */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <div className={`p-6 border ${currentStyle.card} rounded-3xl space-y-4 backdrop-blur-md`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest text-center ${currentStyle.text}`}>Hubungi Kami</h4>
            
            <div className="space-y-3 text-xs">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface)]/20 transition text-[var(--color-text)]"
                >
                  <Phone className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Telepon Hub</p>
                    <p className="font-bold truncate">{microsite.phone}</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-primary)] font-semibold font-mono">TELP</span>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface)]/20 transition text-[var(--color-text)]"
                >
                  <Mail className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Surat Elektronik</p>
                    <p className="font-bold truncate">{microsite.email}</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-primary)] font-semibold font-mono">EMAIL</span>
                </a>
              )}

              {microsite.address && (
                <div className="flex items-start gap-3 p-3 rounded-2xl text-[var(--color-text)]">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Lokasi & Posko</p>
                    <p className="leading-relaxed text-xs">{microsite.address}</p>
                    
                    {microsite.mapUrl && (
                      <a
                        href={microsite.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] font-bold rounded-xl transition"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Lihat Peta Lokasi</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Customizable Footer */}
        <MicrositeFooterRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

      </div>
    </div>
  );
};
