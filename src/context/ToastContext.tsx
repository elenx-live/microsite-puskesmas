import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Studio v2 — permukaan kartu terang yang konsisten dengan tema aplikasi.
 * MEMPERBAIKI BUG: versi lama memakai warna dark-mode (bg-emerald-950/text-emerald-200)
 * sehingga toast nyaris tak terbaca di tema terang. Kini memakai token tema.
 */
const STYLES: Record<ToastType, { wrap: string; icon: React.ReactNode }> = {
  success: {
    wrap: 'border-[color-mix(in_oklab,var(--color-success)_35%,var(--color-border))]',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />,
  },
  error: {
    wrap: 'border-[color-mix(in_oklab,var(--color-danger)_35%,var(--color-border))]',
    icon: <AlertCircle className="h-5 w-5 shrink-0 text-[var(--color-danger)]" />,
  },
  warning: {
    wrap: 'border-[color-mix(in_oklab,var(--color-warning)_35%,var(--color-border))]',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />,
  },
  info: {
    wrap: 'border-[color-mix(in_oklab,var(--color-info)_35%,var(--color-border))]',
    icon: <Info className="h-5 w-5 shrink-0 text-[var(--color-info)]" />,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container toast: kanan bawah (desktop) / atas-tengah (mobile) */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col-reverse items-center gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => {
          const s = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              className={[
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border',
                'bg-[var(--color-card)] p-3.5 shadow-[var(--shadow-lg)]',
                'animate-[toastIn_320ms_cubic-bezier(0.22,1,0.36,1)_both]',
                s.wrap,
              ].join(' ')}
            >
              <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}`}</style>
              <span className="mt-0.5">{s.icon}</span>
              <span className="flex-1 text-[13px] font-medium leading-relaxed text-[var(--color-text)]">
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Tutup notifikasi"
                className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
