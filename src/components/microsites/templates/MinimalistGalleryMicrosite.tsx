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
  Sparkles,
  ChevronRight,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { MicrositeEntity, BackgroundAnimationType } from '../../../types';
import { ArtisticBackgroundCanvas } from '../../artistic/ArtisticBackgroundCanvas';
import { MicrositeContentList } from '../MicrositeContentList';
import { MicrositeHeaderRenderer } from '../MicrositeHeaderRenderer';
import { MicrositeFooterRenderer } from '../MicrositeFooterRenderer';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  microsite: MicrositeEntity;
  isPreviewMode?: boolean;
  onOpenQR: () => void;
  onCopyLink: () => void;
  copied: boolean;
  activeAnimation?: BackgroundAnimationType;
}

export const MinimalistGalleryMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'subtle_glow'
}) => {
  const navigate = useNavigate();
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

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-12 px-4 font-sans">
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

      {/* Background Kinetic Canvas */}
      <ArtisticBackgroundCanvas type={activeAnimation} intensity="subtle" />

      {/* Top Gallery Navigation */}
      <div className="relative z-10 w-full max-w-lg flex justify-between items-center px-1 mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onCopyLink}
            className="text-xs font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition flex items-center gap-1"
            title="Salin Tautan"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">SHARE</span>
          </button>
          <button
            onClick={onOpenQR}
            className="text-xs font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition flex items-center gap-1"
            title="QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QR</span>
          </button>
        </div>
      </div>

      {/* Main Column */}
      <div className="relative z-10 w-full max-w-lg space-y-8">
        
        {/* Dynamic Multi-Style Header */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Minimalist Link & Content Stack */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] px-1">
            <span>INDEX / BLOCKS</span>
            <span>{(microsite.blocks?.length || microsite.links?.length || 0)} ENTRIES</span>
          </div>

          <MicrositeContentList
            microsite={microsite}
            themeStyle="neutral"
            accentColor="#64748b"
          />
        </div>

        {/* Contact info list */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <div className="pt-6 border-t border-[var(--color-border)] space-y-3 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] block">
              CONTACT & LOCATION
            </span>

            <div className="grid grid-cols-1 gap-2">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="p-3 rounded-xl border border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-card)] transition text-[var(--color-text)]"
                >
                  <span className="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">PHONE</span>
                  <span className="font-mono font-medium">{microsite.phone}</span>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="p-3 rounded-xl border border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-card)] transition text-[var(--color-text)]"
                >
                  <span className="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">EMAIL</span>
                  <span className="font-mono font-medium">{microsite.email}</span>
                </a>
              )}

              {microsite.address && (
                <div className="p-3 rounded-xl border border-[var(--color-border)] space-y-2 text-[var(--color-text)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[var(--color-muted-foreground)]">LOCATION</span>
                    {microsite.mapUrl && (
                      <a
                        href={microsite.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-[var(--color-primary)] hover:underline"
                      >
                        VIEW MAP ➔
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                    {microsite.address}
                  </p>
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
