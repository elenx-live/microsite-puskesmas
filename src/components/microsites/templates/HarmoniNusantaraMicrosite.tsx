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
  Award,
  Crown,
  BookOpen,
  ChevronRight,
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

export const HarmoniNusantaraMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'golden_radiance'
}) => {
  const navigate = useNavigate();
  const bgImg = microsite.backgroundImageUrl || microsite.themeCustomization?.bgImageUrl;
  const bgOpacity = (microsite.themeCustomization?.bgImageOpacity ?? 25) / 100;
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

      {/* Background Kinetic Canvas */}
      <ArtisticBackgroundCanvas type={activeAnimation} intensity="medium" />

      {/* Warm Golden Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-amber-600/15 via-orange-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-lg flex justify-between items-center px-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-xs font-semibold text-amber-200 backdrop-blur-md transition shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
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
            className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-md"
            title="Bagikan ke WhatsApp dengan Pratinjau Gambar"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </a>
          <button
            onClick={onCopyLink}
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-amber-300 backdrop-blur-md transition shadow-sm"
            title="Salin Tautan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenQR}
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-amber-500/30 text-amber-300 backdrop-blur-md transition shadow-sm"
            title="Pindai QR"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg space-y-6">
        
        {/* Dynamic Multi-Style Header */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Links Grid */}
        <div className="space-y-3">
          <MicrositeContentList
            microsite={microsite}
            themeStyle="amber"
            accentColor="#f59e0b"
          />
        </div>

        {/* Contact & Posko Box */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-[var(--color-card)]/85 backdrop-blur-xl border border-amber-500/25 space-y-4 shadow-xl"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-300 text-center flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Akses Kontak & Lokasi Posko</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition text-[var(--color-text)]"
                >
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-amber-400/80">Telepon</p>
                    <p className="font-bold truncate">{microsite.phone}</p>
                  </div>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition text-[var(--color-text)]"
                >
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-amber-400/80">Email</p>
                    <p className="font-bold truncate">{microsite.email}</p>
                  </div>
                </a>
              )}

              {microsite.address && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[var(--color-text)]">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-amber-400/80">Alamat</p>
                    <p className="text-xs leading-relaxed mt-0.5">{microsite.address}</p>
                    {microsite.mapUrl && (
                      <a
                        href={microsite.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-md transition"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Peta Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
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
