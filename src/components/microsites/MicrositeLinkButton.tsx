import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ChevronRight, Sparkles, Flame, Eye, ArrowUpRight } from 'lucide-react';
import { MicrositeLink, MicrositeEntity } from '../../types';
import { MicrositeIcon } from './MicrositeIcon';
import { micrositeService } from '../../services/micrositeService';

interface Props {
  link: MicrositeLink;
  index: number;
  micrositeId: string;
  themeStyle?: 'emerald' | 'cyan' | 'amber' | 'neutral' | 'dark' | string;
  variant?: 'default' | 'minimal' | 'cyber' | 'glass' | 'card';
}

export const MicrositeLinkButton: React.FC<Props> = ({
  link,
  index,
  micrositeId,
  themeStyle = 'emerald',
  variant = 'default'
}) => {
  // If archived/hidden or scheduled and not in time window
  if (link.archived) return null;
  const now = new Date().toISOString();
  if (link.scheduledStart && link.scheduledStart > now) return null;
  if (link.scheduledEnd && link.scheduledEnd < now) return null;

  const isExternal = link.type === 'external' || link.type === 'whatsapp' || link.type === 'youtube' || link.type === 'pdf' || link.url.startsWith('http') || link.url.startsWith('tel:') || link.url.startsWith('mailto:');

  const handleClick = () => {
    micrositeService.recordAnalyticsEvent(micrositeId, 'link_click', link.id);
  };

  // If header section divider
  if (link.type === 'header') {
    return (
      <div className="pt-4 pb-1">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] flex items-center gap-2">
          {link.icon && <MicrositeIcon iconName={link.icon} className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
          <span>{link.label}</span>
        </h4>
        {link.subtitle && (
          <p className="text-[10px] text-[var(--color-muted-foreground)] opacity-80 mt-0.5">{link.subtitle}</p>
        )}
      </div>
    );
  }

  // Highlight / Featured pulse styles
  const isFeatured = link.isFeatured;

  return (
    <motion.a
      href={link.url}
      target={isExternal ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onClick={handleClick}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all duration-300 shadow-md ${
        isFeatured
          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 border-amber-400/60 shadow-amber-500/10 hover:border-amber-400 scale-[1.02] ring-1 ring-amber-400/30'
          : 'bg-[var(--color-card)]/85 hover:bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      }`}
    >
      {/* Featured ribbon / badge */}
      {isFeatured && (
        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Flame className="w-2.5 h-2.5 fill-current" />
          <span>{link.badgeText || 'UNGGULAN'}</span>
        </div>
      )}

      {/* Non-featured custom badge */}
      {!isFeatured && link.badgeText && (
        <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-slate-950 text-[9px] font-bold uppercase tracking-wider shadow-sm">
          {link.badgeText}
        </div>
      )}

      {/* Left Thumbnail or Icon or Number */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {link.thumbnailUrl ? (
          <img
            src={link.thumbnailUrl}
            alt={link.label}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--color-border)] shadow-sm"
          />
        ) : link.icon ? (
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <MicrositeIcon iconName={link.icon} className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {index + 1}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span className="font-semibold text-xs sm:text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition truncate block">
            {link.label}
          </span>
          {link.subtitle && (
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
              {link.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Action Indicator */}
      <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] shrink-0 pl-2">
        {link.clicks !== undefined && link.clicks > 0 && (
          <span className="text-[9px] font-mono text-[var(--color-muted-foreground)] opacity-70 hidden sm:inline mr-1">
            {link.clicks} klik
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
