import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  description?: string;
}

/**
 * Modal Studio v2 — dialog yang tenang: backdrop gelap-lembut, panel rounded,
 * animasi masuk halus, ESC + klik backdrop menutup, body scroll lock,
 * dan fokus dipindah ke dalam dialog saat dibuka.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  description,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => panelRef.current?.focus(), 40);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '4xl': 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-4 animate-[fadeIn_180ms_ease-out_both]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes panelIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}`}</style>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'flex w-full flex-col overflow-hidden bg-[var(--color-card)] outline-none',
          'border border-[var(--color-border)] shadow-[var(--shadow-xl)]',
          'max-h-[92dvh] rounded-t-[var(--radius-xl)] sm:max-h-[88dvh] sm:rounded-[var(--radius-xl)]',
          'animate-[panelIn_260ms_cubic-bezier(0.22,1,0.36,1)_both]',
          sizeClasses[size] || 'max-w-lg',
        ].join(' ')}
      >
        {/* Grip bar untuk mobile */}
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[var(--color-border-strong)] sm:hidden" />

        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-bold leading-snug text-[var(--color-text)]">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted-foreground)]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse items-stretch gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-muted)]/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
