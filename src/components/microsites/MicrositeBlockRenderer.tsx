import React from 'react';
import { motion } from 'motion/react';
import {
  ExternalLink,
  ChevronRight,
  Sparkles,
  Flame,
  ArrowUpRight,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Download,
  Megaphone,
  AlertCircle,
  Play,
  FileText,
  Navigation,
  QrCode,
  Share2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { MicrositeBlock, MicrositeEntity } from '../../types';
import { MicrositeIcon } from './MicrositeIcon';
import { micrositeService } from '../../services/micrositeService';

interface Props {
  block: MicrositeBlock;
  index: number;
  micrositeId: string;
  themeStyle?: string;
  accentColor?: string;
}

// Helper to extract YouTube video ID
function getYouTubeEmbedUrl(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
    return `https://www.youtube-nocookie.com/embed/${str}`;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }
  return null;
}

export const MicrositeBlockRenderer: React.FC<Props> = ({
  block,
  index,
  micrositeId,
  themeStyle = 'emerald',
  accentColor = '#10b981'
}) => {
  // Check if active or within scheduled window
  if (!micrositeService.isBlockScheduledActive(block)) {
    return null;
  }

  const handleClick = () => {
    micrositeService.recordAnalyticsEvent(micrositeId, 'link_click', undefined, block.id);
  };

  // 1. HEADING BLOCK
  if (block.type === 'heading') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="pt-4 pb-1.5"
      >
        <div className="flex items-center gap-2">
          {block.icon && (
            <div className="w-5 h-5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
              <MicrositeIcon iconName={block.icon} className="w-3.5 h-3.5" />
            </div>
          )}
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text)] opacity-90">
            {block.title}
          </h3>
        </div>
        {block.subtitle && (
          <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5 ml-0.5">
            {block.subtitle}
          </p>
        )}
      </motion.div>
    );
  }

  // 2. TEXT / BIO CARD BLOCK
  if (block.type === 'text') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-sm space-y-1.5 text-left"
      >
        {block.title && (
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>{block.title}</span>
          </h4>
        )}
        {block.content && (
          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-line">
            {block.content}
          </p>
        )}
      </motion.div>
    );
  }

  // 3. ANNOUNCEMENT / ALERT BANNER
  if (block.type === 'announcement') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/40 backdrop-blur-md shadow-md space-y-2 relative overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5 animate-pulse">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {block.title || 'Pengumuman Penting'}
              </span>
              {block.badgeText && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                  {block.badgeText}
                </span>
              )}
            </div>
            {block.content && (
              <p className="text-xs text-[var(--color-text)] mt-1 leading-relaxed">
                {block.content}
              </p>
            )}
          </div>
        </div>

        {block.url && (
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="mt-2 block w-full py-2 px-3 text-center text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
          >
            {block.subtitle || 'Lihat Informasi Selengkapnya'} →
          </a>
        )}
      </motion.div>
    );
  }

  // 4. IMAGE / POSTER BANNER
  if (block.type === 'image' || block.type === 'image_link') {
    const isClickable = block.type === 'image_link' && !!block.url;
    const ImageElem = (
      <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md group">
        <img
          src={block.thumbnailUrl || block.url}
          alt={block.title || 'Banner'}
          referrerPolicy="no-referrer"
          className={`w-full max-h-56 object-cover ${isClickable ? 'group-hover:scale-105 transition-transform duration-500' : ''}`}
        />
        {(block.title || block.subtitle) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white text-left">
            {block.title && <h4 className="text-xs sm:text-sm font-bold">{block.title}</h4>}
            {block.subtitle && <p className="text-[10px] text-white/80">{block.subtitle}</p>}
          </div>
        )}
      </div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        {isClickable ? (
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block"
          >
            {ImageElem}
          </a>
        ) : (
          ImageElem
        )}
      </motion.div>
    );
  }

  // 5. VIDEO (YOUTUBE EMBED)
  if (block.type === 'video') {
    const embedUrl = getYouTubeEmbedUrl(block.url || block.content);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] shadow-md p-1.5"
      >
        {block.title && (
          <div className="px-3 py-2 text-left">
            <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-rose-500" />
              <span>{block.title}</span>
            </h4>
            {block.subtitle && (
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{block.subtitle}</p>
            )}
          </div>
        )}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={block.title || 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs p-4 text-center">
              <Play className="w-8 h-8 mb-2 opacity-50" />
              <span>URL Video YouTube Tidak Valid</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 6. WHATSAPP DIRECT CHAT BUTTON
  if (block.type === 'whatsapp') {
    const waUrl = micrositeService.formatWhatsAppUrl(block.whatsappNumber || block.url || '', block.whatsappMessage);
    return (
      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-green-600/30 hover:from-emerald-600/40 hover:to-green-600/40 border border-emerald-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/20">
            <MessageCircle className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-emerald-400 transition truncate">
                {block.title || 'Chat WhatsApp Petugas'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {block.subtitle || 'Konsultasi cepat via WhatsApp resmi'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 shrink-0 pl-2">
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </motion.a>
    );
  }

  // 7. EMERGENCY PHONE HOTLINE
  if (block.type === 'phone') {
    const telUrl = `tel:${(block.url || block.content || '').replace(/[^0-9+]/g, '')}`;
    return (
      <motion.a
        href={telUrl}
        onClick={handleClick}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-rose-600/25 to-red-600/25 hover:from-rose-600/35 hover:to-red-600/35 border border-rose-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-rose-500/20 animate-pulse">
            <Phone className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-rose-400 transition truncate">
                {block.title || 'Hotline Panggilan Darurat'}
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white uppercase">
                24 JAM
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {block.subtitle || block.url || 'Panggilan cepat tim medis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-rose-400 shrink-0 pl-2">
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </motion.a>
    );
  }

  // 8. EMAIL CONTACT
  if (block.type === 'email') {
    const mailtoUrl = `mailto:${block.url || block.content || ''}`;
    return (
      <motion.a
        href={mailtoUrl}
        onClick={handleClick}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-sky-500/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-sky-400 transition truncate block">
              {block.title || 'Surat & Email Resmi'}
            </span>
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5 font-mono">
              {block.subtitle || block.url}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-sky-400 transition-transform group-hover:translate-x-1" />
      </motion.a>
    );
  }

  // 9. LOCATION & GOOGLE MAPS CARD
  if (block.type === 'location') {
    const mapHref = block.url || `https://maps.google.com/?q=${encodeURIComponent(block.content || block.title || '')}`;
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-md space-y-2.5 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text)]">
              {block.title || 'Alamat & Lokasi Fasilitas'}
            </h4>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
              {block.content || block.subtitle || 'Jl. Raya Manding, Sumenep, Jawa Timur'}
            </p>
          </div>
        </div>
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Buka Petunjuk Arah Google Maps</span>
        </a>
      </motion.div>
    );
  }

  // 10. DOWNLOAD DOCUMENT / PDF
  if (block.type === 'download') {
    return (
      <motion.a
        href={block.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={handleClick}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md group"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-purple-400 transition truncate">
                {block.title || 'Unduh Dokumen PDF'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                {block.fileFormat || 'PDF'} {block.fileSize ? `• ${block.fileSize}` : ''}
              </span>
            </div>
            {block.subtitle && (
              <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
                {block.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
          <Download className="w-4 h-4" />
        </div>
      </motion.a>
    );
  }

  // 11. DIVIDER BLOCK
  if (block.type === 'divider') {
    return (
      <div className="py-2.5 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
        {block.title && (
          <span className="text-[10px] font-bold text-[var(--color-muted-foreground)] uppercase tracking-widest px-2">
            {block.title}
          </span>
        )}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>
    );
  }

  // 12. SPACER BLOCK
  if (block.type === 'spacer') {
    const heightClass =
      block.customStyle?.spacerHeight === 'sm' ? 'h-3' :
      block.customStyle?.spacerHeight === 'lg' ? 'h-8' :
      block.customStyle?.spacerHeight === 'xl' ? 'h-12' : 'h-5';
    return <div className={heightClass} />;
  }

  // 13. QR CODE BLOCK
  if (block.type === 'qr_code') {
    const qrUrl = block.url || window.location.href;
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
        className="p-4 rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-md shadow-md text-center space-y-2.5"
      >
        {block.title && (
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text)] flex items-center justify-center gap-1.5">
            <QrCode className="w-4 h-4 text-[var(--color-primary)]" />
            <span>{block.title}</span>
          </h4>
        )}
        <div className="w-36 h-36 mx-auto p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
          <img src={qrImg} alt="QR Code" className="w-full h-full object-contain" />
        </div>
        <p className="text-[10px] text-[var(--color-muted-foreground)]">
          {block.subtitle || 'Pindai kode QR untuk membuka tautan ini langsung dari smartphone Anda'}
        </p>
      </motion.div>
    );
  }

  // 14. DEFAULT STANDARD LINK BUTTON
  const isExternal = block.url?.startsWith('http') || block.url?.startsWith('tel:') || block.url?.startsWith('mailto:');
  const isFeatured = block.isFeatured;

  return (
    <motion.a
      href={block.url || '#'}
      target={isExternal ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onClick={handleClick}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md ${
        isFeatured
          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 border-amber-400/60 shadow-amber-500/10 hover:border-amber-400 scale-[1.02] ring-1 ring-amber-400/30'
          : 'bg-[var(--color-card)]/85 hover:bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      }`}
    >
      {/* Featured Ribbon / Badge */}
      {isFeatured && (
        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Flame className="w-2.5 h-2.5 fill-current" />
          <span>{block.badgeText || 'UNGGULAN'}</span>
        </div>
      )}

      {/* Non-featured custom badge */}
      {!isFeatured && block.badgeText && (
        <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-slate-950 text-[9px] font-bold uppercase tracking-wider shadow-sm">
          {block.badgeText}
        </div>
      )}

      {/* Left Thumbnail or Icon or Number */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {block.thumbnailUrl ? (
          <img
            src={block.thumbnailUrl}
            alt={block.title || ''}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--color-border)] shadow-sm"
          />
        ) : block.icon ? (
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <MicrositeIcon iconName={block.icon} className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {index + 1}
          </div>
        )}

        <div className="min-w-0 flex-1 text-left">
          <span className="font-semibold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition truncate block">
            {block.title || 'Tautan Tanpa Judul'}
          </span>
          {block.subtitle && (
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {block.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Action Indicator */}
      <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] shrink-0 pl-2">
        {block.clicks !== undefined && block.clicks > 0 && (
          <span className="text-[9px] font-mono text-[var(--color-muted-foreground)] opacity-70 hidden sm:inline mr-1">
            {block.clicks} klik
          </span>
        )}
        {isExternal ? (
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        )}
      </div>
    </motion.a>
  );
};
