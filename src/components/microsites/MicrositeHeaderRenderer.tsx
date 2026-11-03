import React from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Share2,
  QrCode,
  Check,
  Send,
  Building2,
  Leaf
} from 'lucide-react';
import {
  MicrositeEntity,
  MicrositeHeaderStyle,
  MicrositeAvatarShape,
  MicrositeHeaderHeight
} from '../../types';

interface Props {
  microsite: MicrositeEntity;
  onOpenQR?: () => void;
  onCopyLink?: () => void;
  copied?: boolean;
}

export const MicrositeHeaderRenderer: React.FC<Props> = ({
  microsite,
  onOpenQR,
  onCopyLink,
  copied
}) => {
  const headerConfig = microsite.headerConfig || microsite.themeCustomization?.headerConfig;
  const style: MicrositeHeaderStyle = headerConfig?.style || 'banner_hero';
  const height: MicrositeHeaderHeight = headerConfig?.height || 'medium';
  const avatarShape: MicrositeAvatarShape =
    headerConfig?.avatarShape ||
    microsite.themeCustomization?.avatarStyle ||
    'circle';

  const showVerified =
    headerConfig?.showVerifiedBadge ??
    microsite.themeCustomization?.verifiedBadge ??
    true;

  const showCategoryBadge = headerConfig?.showCategoryBadge ?? true;
  const categoryText =
    headerConfig?.categoryBadgeText ||
    microsite.category ||
    'Portal Layanan Resmi';

  const bannerImg =
    microsite.bannerImageUrl ||
    microsite.profileImageUrl ||
    microsite.themeCustomization?.bgImageUrl;

  const overlayOpacity = headerConfig?.bannerOverlayOpacity ?? 50;
  const alignment = headerConfig?.alignment || 'center';

  // Avatar Shape Classes
  const avatarShapeClass =
    avatarShape === 'circle'
      ? 'rounded-full'
      : avatarShape === 'square'
      ? 'rounded-none'
      : avatarShape === 'hexagon'
      ? 'rounded-3xl rotate-3'
      : 'rounded-2xl';

  // Banner Height Classes
  const bannerHeightClass =
    height === 'compact'
      ? 'h-28 sm:h-36'
      : height === 'tall'
      ? 'h-48 sm:h-64'
      : 'h-36 sm:h-48';

  // Render Logo / Avatar Element
  const renderLogo = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass =
      size === 'sm'
        ? 'w-14 h-14'
        : size === 'lg'
        ? 'w-24 h-24'
        : 'w-20 h-20';

    return (
      <div className="relative inline-block shrink-0">
        {microsite.logoUrl ? (
          <img
            src={microsite.logoUrl}
            alt={microsite.name}
            referrerPolicy="no-referrer"
            className={`${sizeClass} ${avatarShapeClass} object-cover border-2 border-emerald-400/40 bg-white p-1.5 shadow-xl transition duration-300 hover:scale-105`}
          />
        ) : (
          <div
            className={`${sizeClass} ${avatarShapeClass} bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 border-2 border-amber-400/50 text-amber-300 flex items-center justify-center font-bold shadow-xl shadow-emerald-950/40`}
          >
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
        )}

        {showVerified && (
          <div
            className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md border-2 border-[var(--color-card)]"
            title="Layanan Resmi Terverifikasi"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    );
  };

  // 1. STYLE: BANNER HERO (Cover with overlapping avatar)
  if (style === 'banner_hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
      >
        {/* Banner Cover */}
        {bannerImg ? (
          <div className={`relative w-full ${bannerHeightClass} overflow-hidden bg-slate-900`}>
            <img
              src={bannerImg}
              alt="Header Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-black/40 to-transparent"
              style={{ opacity: overlayOpacity / 100 }}
            />
          </div>
        ) : (
          <div
            className={`w-full ${height === 'compact' ? 'h-24' : 'h-32'} bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[var(--color-card)] to-transparent" />
          </div>
        )}

        {/* Overlapping Avatar & Content Body */}
        <div
          className={`relative px-6 pb-6 -mt-10 sm:-mt-12 space-y-4 ${
            alignment === 'left' ? 'text-left' : 'text-center'
          }`}
        >
          {/* Logo */}
          <div className={alignment === 'left' ? 'flex items-end gap-4' : 'inline-block'}>
            {renderLogo('md')}
          </div>

          {/* Title & Badge */}
          <div className="space-y-1.5">
            {showCategoryBadge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
                <Award className="w-3 h-3" />
                <span>{categoryText}</span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight leading-snug">
              {headerConfig?.customTitle || microsite.name}
            </h1>
          </div>

          {/* Description */}
          {(headerConfig?.customSubtitle || microsite.description) && (
            <p className="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
              {headerConfig?.customSubtitle || microsite.description}
            </p>
          )}

          {/* Verification Pill */}
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--color-muted-foreground)] border-t border-[var(--color-border)]/50">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Puskesmas Terakreditasi Paripurna</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Cepat 24 Jam</span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. STYLE: COMPACT INLINE (Logo on Left, Text on Right)
  if (style === 'compact_inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-6 rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-xl flex items-center gap-4 sm:gap-5"
      >
        {renderLogo('md')}
        <div className="flex-1 min-w-0 space-y-1">
          {showCategoryBadge && (
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
              {categoryText}
            </span>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text)] tracking-tight truncate">
            {headerConfig?.customTitle || microsite.name}
          </h1>
          {(headerConfig?.customSubtitle || microsite.description) && (
            <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
              {headerConfig?.customSubtitle || microsite.description}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // 3. STYLE: GLASSMORPHISM CARD (Centered Glass Floating Card)
  if (style === 'glassmorphism_card') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-[var(--color-card)]/80 via-[var(--color-card)]/60 to-[var(--color-card)]/80 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.12)] text-center space-y-4 overflow-hidden"
      >
        {/* Top Glow bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />

        {renderLogo('lg')}

        <div className="space-y-1.5">
          {showCategoryBadge && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{categoryText}</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            {headerConfig?.customTitle || microsite.name}
          </h1>
        </div>

        {bannerImg && (
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
            <img
              src={bannerImg}
              alt="Banner"
              referrerPolicy="no-referrer"
              className="w-full h-36 object-cover"
            />
          </div>
        )}

        {(headerConfig?.customSubtitle || microsite.description) && (
          <p className="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
            {headerConfig?.customSubtitle || microsite.description}
          </p>
        )}
      </motion.div>
    );
  }

  // 4. STYLE: MINIMAL TEXT (Clean editorial typography)
  if (style === 'minimal_text') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`py-4 px-2 space-y-3 ${alignment === 'left' ? 'text-left' : 'text-center'}`}
      >
        <div className={alignment === 'left' ? 'inline-block' : 'flex justify-center'}>
          {renderLogo('sm')}
        </div>
        <div className="space-y-1">
          {showCategoryBadge && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-primary)]">
              {categoryText}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-light text-[var(--color-text)] tracking-tight">
            {headerConfig?.customTitle || microsite.name}
          </h1>
          {(headerConfig?.customSubtitle || microsite.description) && (
            <p className="text-xs text-[var(--color-muted-foreground)] max-w-md mx-auto">
              {headerConfig?.customSubtitle || microsite.description}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // 5. STYLE: SPLIT COVER (Split 2-columns)
  if (style === 'split_cover') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 gap-0"
      >
        {bannerImg && (
          <div className="sm:col-span-5 h-44 sm:h-full relative bg-slate-900">
            <img
              src={bannerImg}
              alt="Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div
          className={`${
            bannerImg ? 'sm:col-span-7' : 'sm:col-span-12'
          } p-6 flex flex-col justify-center space-y-3`}
        >
          <div className="flex items-center gap-3">
            {renderLogo('sm')}
            <div>
              {showCategoryBadge && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
                  {categoryText}
                </span>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight">
                {headerConfig?.customTitle || microsite.name}
              </h1>
            </div>
          </div>
          {(headerConfig?.customSubtitle || microsite.description) && (
            <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              {headerConfig?.customSubtitle || microsite.description}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // DEFAULT / AVATAR TOP (Avatar Centered Top)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-7 sm:p-8 rounded-3xl bg-[var(--color-card)]/85 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl text-center space-y-4"
    >
      {renderLogo('lg')}

      <div className="space-y-1.5">
        {showCategoryBadge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
            <Award className="w-3 h-3" />
            <span>{categoryText}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {headerConfig?.customTitle || microsite.name}
        </h1>
      </div>

      {bannerImg && (
        <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
          <img
            src={bannerImg}
            alt="Banner"
            referrerPolicy="no-referrer"
            className="w-full h-40 object-cover"
          />
        </div>
      )}

      {(headerConfig?.customSubtitle || microsite.description) && (
        <p className="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-md mx-auto">
          {headerConfig?.customSubtitle || microsite.description}
        </p>
      )}

      <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--color-muted-foreground)]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Layanan Terverifikasi</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Akses 24 Jam</span>
        </span>
      </div>
    </motion.div>
  );
};
