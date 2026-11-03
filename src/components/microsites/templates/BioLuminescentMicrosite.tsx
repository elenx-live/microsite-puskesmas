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
  Leaf,
  Sun,
  Droplets,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { MicrositeEntity, BackgroundAnimationType } from '../../../types';
import { ArtisticBackgroundCanvas } from '../../artistic/ArtisticBackgroundCanvas';
import { MicrositeContentList } from '../MicrositeContentList';
import { MicrositeHeaderRenderer } from '../MicrositeHeaderRenderer';
import { MicrositeFooterRenderer } from '../MicrositeFooterRenderer';
import { Link } from 'react-router-dom';

interface Props {
  microsite: MicrositeEntity;
  isPreviewMode?: boolean;
  onOpenQR: () => void;
  onCopyLink: () => void;
  copied: boolean;
  activeAnimation?: BackgroundAnimationType;
}

export const BioLuminescentMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'bioluminescent'
}) => {
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
      <ArtisticBackgroundCanvas type={activeAnimation} intensity="vibrant" />

      {/* Bioluminescent Radiant Halos */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[400px] bg-teal-500/20 rounded-full blur-[110px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-lg flex justify-between items-center px-2 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-xs font-semibold text-teal-300 backdrop-blur-md transition shadow-lg shadow-teal-950/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Beranda</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-md shadow-lg shadow-emerald-950/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </a>
          <button
            onClick={onCopyLink}
            className="p-2.5 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-teal-300 backdrop-blur-md transition shadow-md"
            title="Salin Tautan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenQR}
            className="p-2.5 rounded-full bg-[var(--color-card)]/70 hover:bg-[var(--color-card)] border border-teal-500/30 text-teal-300 backdrop-blur-md transition shadow-md"
            title="Pindai QR"
          >
            <QrCode className="w-4 h-4 text-teal-300" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 w-full max-w-lg space-y-6">
        
        {/* Dynamic Multi-Style Header */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Content Blocks / Links Grid with Luminescent Hover */}
        <div className="space-y-3">
          <MicrositeContentList
            microsite={microsite}
            themeStyle="teal"
            accentColor="#14b8a6"
          />
        </div>

        {/* Contact and Posko Details */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-[2rem] bg-[var(--color-card)]/80 backdrop-blur-xl border border-teal-500/25 space-y-4 shadow-xl shadow-teal-950/20"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-teal-300 text-center">
              Layanan & Akses Posko
            </h4>

            <div className="space-y-2.5 text-xs">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition text-[var(--color-text)]"
                >
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-teal-400/80">Hotline Pelayanan</p>
                    <p className="font-bold truncate">{microsite.phone}</p>
                  </div>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition text-[var(--color-text)]"
                >
                  <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-teal-400/80">Email Koordinator</p>
                    <p className="font-bold truncate">{microsite.email}</p>
                  </div>
                </a>
              )}

              {microsite.address && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[var(--color-text)]">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-teal-400/80">Lokasi Kegiatan</p>
                    <p className="text-xs leading-relaxed mt-0.5">{microsite.address}</p>
                    {microsite.mapUrl && (
                      <a
                        href={microsite.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow-md transition"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Buka di Peta</span>
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
