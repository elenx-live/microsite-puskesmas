import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input Studio v2 — label kalimat (bukan uppercase kecil), fokus ring jelas,
 * state error dengan ikon warna danger. Mendukung affordance ikon kiri/kanan
 * lewat className saja (tanpa API baru).
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-semibold text-[var(--color-text)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full rounded-[var(--input-radius)] border bg-[var(--color-card)] px-3.5 py-2.5',
          'text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted-foreground)]/70',
          'shadow-[var(--shadow-xs)] transition-all duration-200',
          'hover:border-[var(--color-border-strong)]',
          'focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]',
          error
            ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[color-mix(in_oklab,var(--color-danger)_16%,transparent)]'
            : 'border-[var(--color-border)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && (
        <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-danger)]">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-xs text-[var(--color-muted-foreground)]">{helperText}</span>
      )}
    </div>
  );
};
