import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

/**
 * Select Studio v2 — tinggi seragam dengan Input, chevron kustom, ring fokus.
 */
export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-semibold text-[var(--color-text)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full appearance-none rounded-[var(--input-radius)] border bg-[var(--color-card)]',
            'px-3.5 py-2.5 pr-10 text-sm text-[var(--color-text)]',
            'shadow-[var(--shadow-xs)] transition-all duration-200',
            'hover:border-[var(--color-border-strong)]',
            'focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-primary)_16%,transparent)]',
            error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && (
        <span className="text-xs font-medium text-[var(--color-danger)]">{error}</span>
      )}
    </div>
  );
};
