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
  ShieldCheck,
  Award,
  ChevronRight,
  Clock,
  Building2
} from 'lucide-react';
import { MicrositeEntity, BackgroundAnimationType } from '../../../types';
import { generateSmartShareUrl } from '../../../utils/shareUtils';
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

export const GrandMajesticMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'aurora_flow'
}) => {
  const navigate = useNavigate();
  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 30) / 100;
  const bgBlur =
    microsite.themeCustomization?.bgImageBlur === 'lg'
      ? 'blur(16px)'
      : microsite.themeCustomization?.bgImageBlur === 'md'
      ? 'blur(8px)'
      : microsite.themeCustomization?.bgImageBlur === 'sm'
      ? 'blur(4px)'
      : 'none';

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-10 px-4">
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

      {/* Background Canvas Animation */}
      <ArtisticBackgroundCanvas type={activeAnimation} intensity="medium" />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Navigation */}
      <div className="relative z-10 w-full max-w-xl flex justify-between items-center px-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] backdrop-blur-md transition shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>Kembali</span>
        </button>

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
            className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-md"
            title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </a>
          <button
            onClick={onCopyLink}
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur-md transition shadow-sm"
            title="Salin Tautan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenQR}
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur-md transition shadow-sm"
            title="Tampilkan QR Code"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-xl space-y-6">
        
        {/* Dynamic Multi-Style Header Renderer */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Links / Content Blocks Navigation Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Menu & Tautan Resmi</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--color-muted-foreground)]">
              {(microsite.blocks?.length || microsite.links?.length || 0)} Konten
            </span>
          </div>

          <MicrositeContentList
            microsite={microsite}
            themeStyle="emerald"
            accentColor="#10b981"
          />
        </div>

        {/* Contact & Posko Information Box */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="p-6 rounded-3xl bg-[var(--color-card)]/80 backdrop-blur-md border border-[var(--color-border)] space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Posko & Informasi Kontak</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="p-3 rounded-2xl bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-3 transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Hotline</p>
                    <p className="font-bold text-[var(--color-text)] truncate">{microsite.phone}</p>
                  </div>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="p-3 rounded-2xl bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-3 transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Email</p>
                    <p className="font-bold text-[var(--color-text)] truncate">{microsite.email}</p>
                  </div>
                </a>
              )}
            </div>

            {microsite.address && (
              <div className="p-3.5 rounded-2xl bg-[var(--color-bg)]/60 border border-[var(--color-border)] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Alamat Posko / Pelayanan</p>
                  <p className="text-xs text-[var(--color-text)] leading-relaxed mt-0.5">{microsite.address}</p>
                  {microsite.mapUrl && (
                    <a
                      href={microsite.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md transition"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Petunjuk Arah Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
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
