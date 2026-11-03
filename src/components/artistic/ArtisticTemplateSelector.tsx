import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Palette,
  Crown,
  Leaf,
  Zap,
  LayoutGrid,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  X
} from 'lucide-react';
import { HomepageTemplateType, BackgroundAnimationType } from '../../types';

interface TemplateOption {
  id: HomepageTemplateType;
  name: string;
  tag: string;
  desc: string;
  bgAnim: BackgroundAnimationType;
  icon: any;
  color: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'modern_majestic',
    name: 'Kemegahan Mahakarya Sovereign',
    tag: 'Megah & Modern',
    desc: 'Latar aurora bersinar, tipografi editorial aristokrat, glassmorphism dengan aksen emas-zamrud.',
    bgAnim: 'aurora_flow',
    icon: Crown,
    color: 'from-amber-500 to-emerald-600'
  },
  {
    id: 'artistic_bio',
    name: 'Seni Organik Bio-Luminescence',
    tag: 'Alami & Holistik',
    desc: 'Latar partikel sel bercahaya, kurva organik lembut, pilar kesehatan holistik dan kesejahteraan.',
    bgAnim: 'bioluminescent',
    icon: Leaf,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'avant_garde',
    name: 'Avant-Garde Cyber-Clinic',
    tag: 'Futuristik Medis',
    desc: 'Matriks partikel presisi, telemetri radar antrean langsung, neon cyber-clinical modern.',
    bgAnim: 'particle_mesh',
    icon: Zap,
    color: 'from-cyan-500 to-indigo-600'
  },
  {
    id: 'nusantara_art',
    name: 'Harmoni Nusantara Modern',
    tag: 'Kearifan & Kehangatan',
    desc: 'Nuansa hangat batik geometris modern, kehangatan ramah tamah, dan maklumat pelayanan resmi.',
    bgAnim: 'golden_radiance',
    icon: Sparkles,
    color: 'from-amber-600 to-rose-600'
  },
  {
    id: 'minimal_gallery',
    name: 'Studio Seni Kontemporer',
    tag: 'Galeri Minimalis',
    desc: 'Arsitektur visual Swiss yang bersih, tipografi berskala besar, dan ruang negatif elegan.',
    bgAnim: 'geometric_waves',
    icon: Palette,
    color: 'from-slate-700 to-zinc-900'
  },
  {
    id: 'classic',
    name: 'Klasik Modular Builder',
    tag: 'Standar Fleksibel',
    desc: 'Tata letak modular standar sesuai urutan section pada Homepage Builder admin.',
    bgAnim: 'none',
    icon: LayoutGrid,
    color: 'from-blue-600 to-teal-600'
  }
];

interface ArtisticTemplateSelectorProps {
  currentTemplate: HomepageTemplateType;
  onSelectTemplate: (template: HomepageTemplateType) => void;
}

export const ArtisticTemplateSelector: React.FC<ArtisticTemplateSelectorProps> = ({
  currentTemplate,
  onSelectTemplate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeOption = TEMPLATE_OPTIONS.find(t => t.id === currentTemplate) || TEMPLATE_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Floating Selection Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-3 w-80 sm:w-96 rounded-3xl bg-[var(--color-card)]/95 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white shadow-md">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
                    Galeri Template Seniman
                  </h4>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    Ubah desain estetika halaman depan secara instan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-muted-foreground)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {TEMPLATE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = currentTemplate === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectTemplate(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start gap-3 group ${
                      isSelected
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-md'
                        : 'bg-[var(--color-bg)]/80 border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-card)]'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-tr ${opt.color} text-white shadow-sm shrink-0 mt-0.5 group-hover:scale-105 transition`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--color-text)] truncate">
                          {opt.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0" />}
                      </div>
                      <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                        {opt.tag}
                      </span>
                      <p className="text-[10px] text-[var(--color-muted-foreground)] line-clamp-2 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1 font-medium">
                <Palette className="w-3 h-3 text-[var(--color-primary)]" />
                <span>5 Template Artistik Tersedia</span>
              </span>
              <a
                href="/admin/homepage-builder"
                className="text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
              >
                <span>Kelola di Admin</span>
                <Settings className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Pill */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text)] shadow-2xl hover:shadow-[var(--color-primary)]/20 transition-all text-xs font-bold"
      >
        <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeOption.color} text-white flex items-center justify-center shadow-sm`}>
          <ActiveIcon className="w-3.5 h-3.5" />
        </div>
        <span className="hidden sm:inline">Desain: {activeOption.name}</span>
        <span className="sm:hidden">{activeOption.tag}</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
      </motion.button>
    </div>
  );
};
