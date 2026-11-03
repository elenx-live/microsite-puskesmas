import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUp,
  Share2,
  QrCode,
  ShieldCheck,
  Award,
  CheckCircle2,
  HeartPulse,
  Building2,
  ExternalLink,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Send,
  FileText,
  HelpCircle,
  Info,
  Check,
  Copy
} from 'lucide-react';
import {
  MicrositeEntity,
  MicrositeFooterConfig,
  MicrositeFooterStyle
} from '../../types';

interface Props {
  microsite: MicrositeEntity;
  onOpenQR?: () => void;
  onCopyLink?: () => void;
  copied?: boolean;
}

export const MicrositeFooterRenderer: React.FC<Props> = ({
  microsite,
  onOpenQR,
  onCopyLink,
  copied = false
}) => {
  const [internalCopied, setInternalCopied] = useState(false);

  // Merge footer config from entity or themeCustomization
  const footerConfig: MicrositeFooterConfig =
    microsite.footerConfig ||
    microsite.themeCustomization?.footerConfig ||
    {};

  const style: MicrositeFooterStyle = footerConfig.style || 'card_clean';

  // If set to hidden, do not render footer
  if (style === 'hidden') {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const copyrightText =
    footerConfig.customCopyrightText ||
    `© ${currentYear} ${microsite.name || 'UPTD Puskesmas'}. Hak Cipta Dilindungi.`;

  const tagline =
    footerConfig.customTagline !== undefined
      ? footerConfig.customTagline
      : 'Portal Akses Cepat Informasi & Layanan Kesehatan Masyarakat';

  const showSocial = footerConfig.showSocialLinks ?? true;
  const socialStyle = footerConfig.socialStyle || 'rounded_cards';
  const showBackToTop = footerConfig.showBackToTop ?? true;
  const showShare = footerConfig.showShareButton ?? true;
  const showQR = footerConfig.showQRButton ?? true;
  const showGovBadges = footerConfig.showGovernmentBadges ?? true;
  const badgesList = footerConfig.governmentBadges || ['kemenkes', 'germas', 'akreditasi'];
  const customBadgesText = footerConfig.customBadgesText;
  const showContactSummary = footerConfig.showContactSummary ?? false;
  const links = footerConfig.links || [];
  const alignment = footerConfig.alignment || 'center';

  // Back to top scroll helper
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Share link handler
  const handleShare = async () => {
    if (onCopyLink) {
      onCopyLink();
      return;
    }
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: microsite.name,
          text: microsite.description || 'Kunjungi portal microsite layanan resmi Puskesmas',
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setInternalCopied(true);
        setTimeout(() => setInternalCopied(false), 2000);
      }
    } catch {
      // Ignore user abort
    }
  };

  const isCopied = copied || internalCopied;

  // Social Links Renderer
  const renderSocialIcons = () => {
    if (!showSocial || !microsite.socialMedia) return null;
    const { instagram, facebook, youtube, whatsapp, twitter, tiktok, linkedin } = microsite.socialMedia;
    const hasAny = Boolean(instagram || facebook || youtube || whatsapp || twitter || tiktok || linkedin);
    if (!hasAny) return null;

    if (socialStyle === 'pills') {
      return (
        <div className="flex flex-wrap justify-center items-center gap-2 pt-1 pb-2">
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 text-xs font-semibold transition shadow-sm"
              title="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
          )}
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition shadow-sm"
              title="Facebook"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>
          )}
          {youtube && (
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition shadow-sm"
              title="YouTube"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition shadow-sm"
              title="WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      );
    }

    if (socialStyle === 'floating_icons') {
      return (
        <div className="flex justify-center items-center gap-3 pt-1 pb-2">
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-pink-500 hover:text-white border border-[var(--color-border)] text-pink-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-blue-600 hover:text-white border border-[var(--color-border)] text-blue-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          )}
          {youtube && (
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-rose-600 hover:text-white border border-[var(--color-border)] text-rose-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[var(--color-bg)]/80 hover:bg-emerald-600 hover:text-white border border-[var(--color-border)] text-emerald-400 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
              title="WhatsApp"
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>
      );
    }

    // Default 'rounded_cards'
    return (
      <div className="flex justify-center items-center gap-2.5 pt-1 pb-2">
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-pink-500/40 text-[var(--color-muted-foreground)] hover:text-pink-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5"
            title="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
        )}
        {facebook && (
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-blue-500/40 text-[var(--color-muted-foreground)] hover:text-blue-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5"
            title="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
        )}
        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-rose-500/40 text-[var(--color-muted-foreground)] hover:text-rose-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5"
            title="YouTube"
          >
            <Youtube className="w-4 h-4" />
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-2xl bg-[var(--color-card)]/80 hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-emerald-500/40 text-[var(--color-muted-foreground)] hover:text-emerald-400 backdrop-blur-md transition shadow-sm hover:-translate-y-0.5"
            title="WhatsApp"
          >
            <Send className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  };

  // Government / Quality Badges
  const renderBadges = () => {
    if (!showGovBadges) return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {badgesList.includes('kemenkes') && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <HeartPulse className="w-3 h-3 text-emerald-400" />
            <span>Kemenkes RI</span>
          </span>
        )}
        {badgesList.includes('germas') && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>GERMAS</span>
          </span>
        )}
        {badgesList.includes('akreditasi') && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Akreditasi Paripurna</span>
          </span>
        )}
        {badgesList.includes('puskesmas') && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span>Puskesmas Resmi</span>
          </span>
        )}
        {customBadgesText && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold">
            {customBadgesText}
          </span>
        )}
      </div>
    );
  };

  // Custom Footer Navigation Links
  const renderFooterLinks = () => {
    if (!links || links.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
        {links.map((lnk, idx) => (
          <React.Fragment key={lnk.id || idx}>
            <a
              href={lnk.url}
              target={lnk.isExternal ? '_blank' : '_self'}
              rel={lnk.isExternal ? 'noopener noreferrer' : undefined}
              className="hover:text-[var(--color-primary)] transition hover:underline inline-flex items-center gap-1"
            >
              <span>{lnk.label}</span>
              {lnk.isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
            </a>
            {idx < links.length - 1 && <span className="opacity-30">•</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Interactive Quick Action Buttons (Back to top, share, QR)
  const renderActionButtons = (compact = false) => {
    if (!showBackToTop && !showShare && !showQR) return null;
    return (
      <div className="flex items-center justify-center gap-2 pt-1">
        {showBackToTop && (
          <button
            type="button"
            onClick={handleScrollToTop}
            className={`inline-flex items-center gap-1.5 ${
              compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm group`}
            title="Kembali ke Bagian Atas Halaman"
          >
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-[var(--color-primary)]" />
            <span className="font-semibold">Ke Atas</span>
          </button>
        )}

        {showShare && (
          <button
            type="button"
            onClick={handleShare}
            className={`inline-flex items-center gap-1.5 ${
              compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm`}
            title="Bagikan Tautan Portal Ini"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="font-semibold">Bagikan</span>
              </>
            )}
          </button>
        )}

        {showQR && onOpenQR && (
          <button
            type="button"
            onClick={onOpenQR}
            className={`inline-flex items-center gap-1.5 ${
              compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } rounded-xl bg-[var(--color-bg)]/80 hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition shadow-sm`}
            title="Buka QR Code untuk Pemindaian Smartphone"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="font-semibold">Kode QR</span>
          </button>
        )}
      </div>
    );
  };

  // 1. STYLE: MINIMAL (Bersih, tipis, tanpa kartu tebal)
  if (style === 'minimal') {
    return (
      <div className={`pt-6 pb-10 space-y-3 ${alignment === 'left' ? 'text-left' : 'text-center'}`}>
        {renderSocialIcons()}
        {renderBadges()}
        {renderFooterLinks()}
        {renderActionButtons(true)}

        <div className="pt-2 text-[11px] text-[var(--color-muted-foreground)] space-y-0.5">
          <p className="font-semibold text-[var(--color-text)] opacity-90">{copyrightText}</p>
          {tagline && <p className="text-[10px] opacity-75 leading-relaxed">{tagline}</p>}
        </div>
      </div>
    );
  }

  // 2. STYLE: GOVERNMENT FORMAL (Resmi Instansi Pemerintah)
  if (style === 'government_formal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 mb-8 p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/90 border border-emerald-500/20 backdrop-blur-xl shadow-xl space-y-4"
      >
        {/* Header Instansi & Logo */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3.5">
          <div className="flex items-center gap-2.5">
            {microsite.logoUrl ? (
              <img
                src={microsite.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 border border-emerald-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                <span>{microsite.name || 'UPTD Puskesmas'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Pemerintah Kabupaten / Kota • Dinas Kesehatan</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              RESMI
            </span>
          </div>
        </div>

        {/* Badges Mutu */}
        {renderBadges()}

        {/* Contact Quick Summary */}
        {showContactSummary && (microsite.phone || microsite.email || microsite.address) && (
          <div className="p-3 rounded-2xl bg-[var(--color-bg)]/60 border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {microsite.phone && (
              <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{microsite.phone}</span>
              </div>
            )}
            {microsite.email && (
              <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{microsite.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Social Icons */}
        {renderSocialIcons()}

        {/* Links Navigation */}
        {renderFooterLinks()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Official Disclaimer */}
        <div className="pt-3 border-t border-[var(--color-border)] text-center text-[10px] text-[var(--color-muted-foreground)] space-y-1">
          <p className="font-semibold text-[var(--color-text)]">{copyrightText}</p>
          {tagline && <p className="opacity-80 italic">"{tagline}"</p>}
          <p className="opacity-60 text-[9px]">Sistem Portal Informasi Cepat Pelayanan Kesehatan Terpadu</p>
        </div>
      </motion.div>
    );
  }

  // 3. STYLE: COMPACT BADGE (Kapsul Mengambang Elegan)
  if (style === 'compact_badge') {
    return (
      <div className="pt-4 pb-8 flex flex-col items-center space-y-3">
        {renderSocialIcons()}
        {renderFooterLinks()}

        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-card)]/90 border border-[var(--color-border)] backdrop-blur-xl shadow-lg">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <HeartPulse className="w-3.5 h-3.5" />
          </div>
          <div className="text-left pr-1">
            <p className="text-[11px] font-bold text-[var(--color-text)] leading-tight">{microsite.name || 'UPTD Puskesmas'}</p>
            <p className="text-[9px] text-[var(--color-muted-foreground)]">Portal Cepat Puskesmas</p>
          </div>

          <div className="h-4 w-px bg-[var(--color-border)]" />

          <div className="flex items-center gap-1">
            {showBackToTop && (
              <button
                type="button"
                onClick={handleScrollToTop}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
                title="Ke Atas"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            {showShare && (
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] transition"
                title="Bagikan"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-[var(--color-muted-foreground)] opacity-75">{copyrightText}</p>
      </div>
    );
  }

  // 4. STYLE: FLOATING BAR (Bar Mengambang Bawah dengan Akses Cepat)
  if (style === 'floating_bar') {
    return (
      <div className="pt-6 pb-12 space-y-4">
        {renderSocialIcons()}
        {renderBadges()}
        {renderFooterLinks()}

        <div className="text-center text-[11px] text-[var(--color-muted-foreground)] space-y-0.5">
          <p className="font-semibold text-[var(--color-text)]">{copyrightText}</p>
          {tagline && <p className="text-[10px] opacity-75">{tagline}</p>}
        </div>

        {/* Floating Quick Action Bar */}
        <div className="p-2 rounded-2xl bg-[var(--color-card)]/95 border border-[var(--color-border)] backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-2 max-w-sm mx-auto">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-[var(--color-text)]">Portal Siap Diakses</span>
          </div>

          <div className="flex items-center gap-1">
            {showQR && onOpenQR && (
              <button
                type="button"
                onClick={onOpenQR}
                className="p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition border border-[var(--color-border)]"
                title="Tampilkan Kode QR"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {showShare && (
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition border border-[var(--color-border)]"
                title="Bagikan Tautan"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            )}

            {showBackToTop && (
              <button
                type="button"
                onClick={handleScrollToTop}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md"
                title="Kembali ke Atas"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. DEFAULT STYLE: CARD CLEAN (Modern Glass Card)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-6 mb-8 p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-xl shadow-lg space-y-3.5 ${
        alignment === 'left' ? 'text-left' : 'text-center'
      }`}
    >
      {/* Social Media Row */}
      {renderSocialIcons()}

      {/* Badges */}
      {renderBadges()}

      {/* Quick Navigation Links */}
      {renderFooterLinks()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Copyright and Tagline */}
      <div className="pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] space-y-1">
        <p className="font-bold text-[var(--color-text)] text-[11px]">{copyrightText}</p>
        {tagline && <p className="text-[10px] opacity-80 leading-relaxed">{tagline}</p>}
      </div>
    </motion.div>
  );
};
