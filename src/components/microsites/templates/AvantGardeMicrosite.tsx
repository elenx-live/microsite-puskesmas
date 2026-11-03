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
  Zap,
  Radio,
  Cpu,
  Eye,
  Server,
  Radar,
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

export const AvantGardeMicrosite: React.FC<Props> = ({
  microsite,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied,
  activeAnimation = 'geometric_waves'
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

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden flex flex-col items-center py-10 px-4 font-sans">
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

      {/* Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 w-full max-w-xl flex justify-between items-center px-2 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-[11px] font-mono font-bold text-cyan-400 backdrop-blur-md transition shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[SYS: BACK_TO_ROOT]</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${microsite.name}\n${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5 transition backdrop-blur-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>TRANSMIT_WA</span>
          </a>
          <button
            onClick={onCopyLink}
            className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 backdrop-blur-md transition"
            title="Copy Endpoint URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenQR}
            className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 backdrop-blur-md transition"
            title="Scan Matrix QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl space-y-6">
        
        {/* Dynamic Multi-Style Header */}
        <MicrositeHeaderRenderer
          microsite={microsite}
          onOpenQR={onOpenQR}
          onCopyLink={onCopyLink}
          copied={copied}
        />

        {/* Links & Content Telemetry Modules */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
            <span>[AVAILABLE_ACTION_ENDPOINTS]</span>
            <span>COUNT: {(microsite.blocks?.length || microsite.links?.length || 0)}</span>
          </div>

          <MicrositeContentList
            microsite={microsite}
            themeStyle="cyan"
            accentColor="#06b6d4"
          />
        </div>

        {/* Contact and Posko Telemetry */}
        {(microsite.phone || microsite.email || microsite.address) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-[var(--color-card)]/85 backdrop-blur-xl border border-cyan-500/30 space-y-3"
          >
            <div className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>[COMMS_&_COORDINATES]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {microsite.phone && (
                <a
                  href={`tel:${microsite.phone.replace(/[^0-9+]/g, '')}`}
                  className="p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-2.5 transition text-[var(--color-text)]"
                >
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <p className="text-[9px] text-cyan-400">TEL_LINE</p>
                    <p className="font-bold truncate">{microsite.phone}</p>
                  </div>
                </a>
              )}

              {microsite.email && (
                <a
                  href={`mailto:${microsite.email}`}
                  className="p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-2.5 transition text-[var(--color-text)]"
                >
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <p className="text-[9px] text-cyan-400">SMTP_MAIL</p>
                    <p className="font-bold truncate">{microsite.email}</p>
                  </div>
                </a>
              )}
            </div>

            {microsite.address && (
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono">
                <p className="text-[9px] text-cyan-400">PHYSICAL_GEO_LOCATION</p>
                <p className="text-xs text-[var(--color-text)] mt-0.5">{microsite.address}</p>
                {microsite.mapUrl && (
                  <a
                    href={microsite.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-bold transition"
                  >
                    <Globe className="w-3 h-3" />
                    <span>LAUNCH_MAPS_GPS</span>
                  </a>
                )}
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
