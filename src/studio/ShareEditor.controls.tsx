import React from 'react';

/* ── Kontrol dasar bersama untuk editor dashboard publik ─────────────── */

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] leading-snug text-slate-400">{hint}</span>}
  </label>
);

export const TextInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; mono?: boolean }> = ({ value, onChange, placeholder, maxLength, mono }) => (
  <input
    value={value ?? ''} placeholder={placeholder} maxLength={maxLength}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 ${mono ? 'font-mono text-[12.5px]' : ''}`}
  />
);

export const TextArea: React.FC<{ value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number }> = ({ value, onChange, rows = 3, placeholder, maxLength }) => (
  <textarea
    value={value ?? ''} rows={rows} placeholder={placeholder} maxLength={maxLength}
    onChange={(e) => onChange(e.target.value)}
    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400"
  />
);

export const Segmented = <T extends string | number,>({ value, options, onChange, cols }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; cols?: number }) => (
  <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" style={cols ? { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` } : undefined}>
    {options.map((o) => (
      <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
        className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-center text-[11.5px] font-semibold transition ${value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        {o.label}
      </button>
    ))}
  </div>
);

export const Select: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const Range: React.FC<{ label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, suffix = '', onChange }) => (
  <Field label={`${label}: ${value}${suffix}`}>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-slate-800" />
  </Field>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left">
    <span className="text-[12.5px] font-medium text-slate-700">{label}</span>
    <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
  </button>
);

export const Btn: React.FC<{ onClick: () => void; children: React.ReactNode; variant?: 'ghost' | 'solid' | 'danger'; full?: boolean; disabled?: boolean }> = ({ onClick, children, variant = 'ghost', full, disabled }) => {
  const cls = variant === 'solid' ? 'bg-slate-900 text-white hover:bg-slate-800'
    : variant === 'danger' ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
      : 'border border-slate-200 text-slate-700 hover:bg-slate-50';
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition disabled:opacity-40 ${full ? 'w-full' : ''} ${cls}`}>{children}</button>;
};

/** Pemilih warna: preset swatch + color picker + input hex + opsi 'auto' (ikut tema). */
export const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void; allowAuto?: boolean }> = ({ label, value, onChange, allowAuto }) => {
  const isAuto = value === 'auto' || value === '';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-600">{label}</span>
        {allowAuto && (
          <button type="button" onClick={() => onChange('auto')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${isAuto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>auto</button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200"
          style={{ background: isAuto ? 'repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 4px,#f1f5f9 4px,#f1f5f9 8px)' : value }}>
          {!isAuto && <input type="color" value={value?.startsWith('#') ? value : '#94a3b8'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />}
        </span>
        <input value={isAuto ? '' : value} placeholder={isAuto ? 'ikut tema' : '#000000'} maxLength={9}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-[12px] text-slate-700 outline-none focus:border-slate-400" />
      </div>
    </div>
  );
};
