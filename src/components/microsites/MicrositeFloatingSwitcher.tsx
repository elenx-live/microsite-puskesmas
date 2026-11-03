import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Sparkles, Check, ChevronUp, ChevronDown, X, RefreshCw } from 'lucide-react';
import { HomepageTemplateType, BackgroundAnimationType } from '../../types';

interface Props {
  currentTemplate: HomepageTemplateType;
  onSelectTemplate: (t: HomepageTemplateType) => void;
  currentAnimation: BackgroundAnimationType;
  onSelectAnimation: (a: BackgroundAnimationType) => void;
}

const TEMPLATES: { id: HomepageTemplateType; label: string; desc: string; color: string }[] = [
  { id: 'modern_majestic', label: 'Grand & Majestic', desc: 'Kemegahan abadi & aksen emas zamrud', color: 'from-emerald-600 to-amber-500' },
  { id: 'artistic_bio', label: 'Bio-Luminescent', desc: 'Pendaran alami & seluler organik', color: 'from-teal-500 to-emerald-400' },
  { id: 'avant_garde', label: 'Avant-Garde Cyber', desc: 'Telemetri medis & grid teknologi', color: 'from-cyan-500 to-blue-600' },
  { id: 'nusantara_art', label: 'Harmoni Nusantara', desc: 'Kearifan etnik & batik hangat', color: 'from-amber-600 to-orange-500' },
  { id: 'minimal_gallery', label: 'Minimalist Gallery', desc: 'Studio seni kontemporer & tipografi tajam', color: 'from-zinc-700 to-zinc-900' },
  { id: 'classic', label: 'Classic Link Hub', desc: 'Format link-in-bio ringkas standar', color: 'from-emerald-700 to-teal-900' }
];

const ANIMATIONS: { id: BackgroundAnimationType; label: string }[] = [
  { id: 'aurora_flow', label: 'Lembayung Aurora' },
  { id: 'bioluminescent', label: 'Pendar Hayati (Bio-Glow)' },
  { id: 'geometric_waves', label: 'Gelombang Kinetik' },
  { id: 'particle_mesh', label: 'Jaring Partikel' },
  { id: 'golden_radiance', label: 'Kilau Keemasan' },
  { id: 'subtle_glow', label: 'Pendaran Halus' },
  { id: 'none', label: 'Tanpa Animasi' }
];

export const MicrositeFloatingSwitcher: React.FC<Props> = ({
  currentTemplate,
  onSelectTemplate,
  currentAnimation,
  onSelectAnimation
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 sm:w-96 p-4 rounded-3xl bg-[var(--color-card)]/95 backdrop-blur-2xl border border-[var(--color-border)] shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)]">Ubah Tema Microsite</h4>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">Eksplorasi gaya visual artistik</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template choices */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] block">
                Pilihan Template Desain
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {TEMPLATES.map(t => {
                  const isSelected = currentTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTemplate(t.id)}
                      className={`w-full p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-sm'
                          : 'bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${t.color} shrink-0 shadow-sm`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                            {t.label}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)] truncate">{t.desc}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0 pl-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Animation choices */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Animasi Latar Kinetik (Canvas 60 FPS)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ANIMATIONS.map(a => {
                  const isSelected = currentAnimation === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelectAnimation(a.id)}
                      className={`p-2 rounded-xl text-[11px] font-medium border text-left truncate transition ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                          : 'bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]'
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Pill Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold text-xs shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-emerald-950/30"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Tema & Animasi</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
