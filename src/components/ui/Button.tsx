import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Button Studio v2.
 * Variant `primary` memakai --color-primary-foreground (putih) — memperbaiki
 * bug kontras lama yang memakai --color-text (teks gelap di atas tombol hijau).
 * Tidak lagi uppercase tracking lebar (terasa "template"); label kalimat normal.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'group/btn relative inline-flex items-center justify-center gap-2 font-semibold ' +
    'select-none whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]';

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-2 rounded-[var(--radius-sm)]',
    md: 'text-sm px-4 py-2.5 rounded-[var(--button-radius)]',
    lg: 'text-[15px] px-6 py-3.5 rounded-[var(--button-radius)]',
    icon: 'h-10 w-10 rounded-[var(--radius-sm)]',
  };

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] ' +
      'shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-strong)] hover:shadow-[var(--shadow-md)] ' +
      'active:scale-[0.97]',
    secondary:
      'bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)] ' +
      'shadow-[var(--shadow-xs)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-muted)] active:scale-[0.98]',
    soft:
      'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] ' +
      'hover:brightness-[0.97] active:scale-[0.98]',
    danger:
      'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] ' +
      'shadow-[var(--shadow-sm)] hover:brightness-95 active:scale-[0.97]',
    ghost:
      'bg-transparent text-[var(--color-text)]/75 hover:bg-[var(--color-muted)] hover:text-[var(--color-text)] active:scale-[0.98]',
    outline:
      'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] ' +
      'hover:bg-[var(--color-secondary)] active:scale-[0.98]',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>Memuat…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
