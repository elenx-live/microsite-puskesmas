import React from 'react';

type BadgeVariant =
  | 'primary'
  | 'amber'
  | 'emerald'
  | 'red'
  | 'zinc'
  | 'blue'
  | 'rose'
  | 'sky'
  | 'slate'
  | 'purple'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge Studio v2 — pil halus dengan border lembut.
 * Variant `primary` memakai --color-primary-foreground (perbaikan kontras).
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent',
    amber: 'bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] text-[var(--color-warning)] border-[color-mix(in_oklab,var(--color-warning)_28%,transparent)]',
    emerald: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border-[color-mix(in_oklab,var(--color-primary)_22%,transparent)]',
    red: 'bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[var(--color-danger)] border-[color-mix(in_oklab,var(--color-danger)_28%,transparent)]',
    zinc: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border-[var(--color-border)]',
    blue: 'bg-[color-mix(in_oklab,var(--color-info)_12%,transparent)] text-[var(--color-info)] border-[color-mix(in_oklab,var(--color-info)_28%,transparent)]',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    purple: 'bg-violet-50 text-violet-600 border-violet-200',
    outline: 'bg-transparent text-[var(--color-text)] border-[var(--color-border-strong)]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-1',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-[var(--pill-radius)] border font-semibold',
        'leading-none tracking-tight',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
};
