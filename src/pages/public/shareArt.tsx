import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
   Lapisan artistik dashboard publik.
   Semua elemen di sini murni dekoratif (aria-hidden, pointer-events-none) dan
   menghormati prefers-reduced-motion. Tidak menyentuh data / CMS sama sekali.
   ──────────────────────────────────────────────────────────────────────────── */

/** Apakah pengguna meminta gerakan dikurangi? */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on);
    else mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', on);
      else mq.removeListener(on);
    };
  }, []);
  return reduced;
}

/** IntersectionObserver — kembalikan ref + apakah elemen sudah pernah terlihat. */
export function useInView<T extends HTMLElement>(opts?: { once?: boolean; margin?: string }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            if (opts?.once !== false) io.unobserve(e.target);
          } else if (opts?.once === false) {
            setInView(false);
          }
        });
      },
      { rootMargin: opts?.margin || '0px 0px -8% 0px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [opts?.once, opts?.margin]);
  return { ref, inView };
}

/* ── 1. Latar seni: cahaya, kontur topografi, dan garis tangan ───────────── */

type AuroraProps = { intensity?: 'halus' | 'sedang' | 'pekat'; dark?: boolean; variant?: string };
export const Aurora: React.FC<AuroraProps> = ({ intensity = 'sedang', dark, variant = 'aurora' }) => {
  const reduced = usePrefersReducedMotion();
  const op = intensity === 'halus' ? 0.55 : intensity === 'pekat' ? 1 : 0.8;
  const still = reduced ? 'sh-static' : '';
  return (
    <div className="sh-aurora" data-dark={dark ? '1' : '0'} data-variant={variant} aria-hidden style={{ opacity: op }}>
      {/* kontur topografi — garis sepusat yang mengalir pelan */}
      <svg className={`sh-contour ${still}`} viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" fill="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <ellipse key={`a${i}`} cx={940} cy={120} rx={130 + i * 54} ry={96 + i * 40}
            stroke="currentColor" strokeWidth={i % 4 === 0 ? 2 : 1}
            opacity={0.55 - i * 0.024} transform={`rotate(${-16 + i * 0.55} 940 120)`} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse key={`b${i}`} cx={120} cy={760} rx={90 + i * 58} ry={70 + i * 44}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
            opacity={0.34 - i * 0.026} transform={`rotate(${12 - i * 0.7} 120 760)`} />
        ))}
      </svg>

      {/* sapuan kuas diagonal — tekstur cat air */}
      <svg className="sh-brush" viewBox="0 0 1200 800" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="shBrushA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="45%" stopColor="currentColor" stopOpacity=".5" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-60 620 C 220 520, 380 700, 620 600 S 1040 470, 1280 560"
          stroke="url(#shBrushA)" strokeWidth="90" strokeLinecap="round" opacity=".5" />
        <path d="M-60 700 C 260 610, 420 780, 700 680 S 1080 560, 1280 640"
          stroke="url(#shBrushA)" strokeWidth="34" strokeLinecap="round" opacity=".4" />
      </svg>

      {/* titik-titik halus bergerak (bintang pelan) */}
      <span className="sh-spark sh-spark--1" />
      <span className="sh-spark sh-spark--2" />

      <span className="sh-aurora__veil" />
    </div>
  );
};

/* ── 2. Grain: tekstur film halus supaya tidak terasa "datar digital" ─────── */

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <div className="sh-grain" aria-hidden style={{ opacity }} />
);

/* ── 3. Ornamen garis lengkung (signature seniman) ────────────────────────── */

export const Ornament: React.FC<{ variant?: 'arc' | 'orbit' | 'wave'; className?: string }> = ({
  variant = 'arc',
  className = '',
}) => {
  if (variant === 'orbit') {
    return (
      <svg className={`sh-ornament sh-ornament--orbit ${className}`} viewBox="0 0 420 420" aria-hidden fill="none">
        <circle cx="210" cy="210" r="200" stroke="currentColor" strokeWidth="1" opacity=".35" />
        <circle cx="210" cy="210" r="150" stroke="currentColor" strokeWidth="1" opacity=".5" strokeDasharray="3 7" />
        <circle cx="210" cy="210" r="96" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
        <g className="sh-ornament__spin">
          <circle cx="210" cy="10" r="4" fill="currentColor" />
          <circle cx="360" cy="300" r="2.5" fill="currentColor" opacity=".7" />
        </g>
      </svg>
    );
  }
  if (variant === 'wave') {
    return (
      <svg className={`sh-ornament sh-ornament--wave ${className}`} viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden fill="none">
        <path className="sh-ornament__draw" d="M0 110 C 200 30, 340 150, 560 90 S 940 20, 1200 80" stroke="currentColor" strokeWidth="1.6" />
        <path className="sh-ornament__draw" d="M0 140 C 240 70, 380 170, 620 120 S 980 60, 1200 110" stroke="currentColor" strokeWidth="1" opacity=".5" />
      </svg>
    );
  }
  return (
    <svg className={`sh-ornament sh-ornament--arc ${className}`} viewBox="0 0 300 300" aria-hidden fill="none">
      <path className="sh-ornament__draw" d="M10 290 A 280 280 0 0 1 290 10" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 240 A 230 230 0 0 1 240 10" stroke="currentColor" strokeWidth="1" opacity=".45" strokeDasharray="2 6" />
    </svg>
  );
};

/* ── 4. Reveal: masuk bertahap saat digulir, dengan stagger ──────────────── */

export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'li';
  style?: React.CSSProperties;
}> = ({ children, delay = 0, y = 22, className = '', as = 'div', style }) => {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={`sh-reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{
        ...style,
        ...(reduced ? {} : { '--sh-reveal-y': `${y}px`, transitionDelay: `${delay}ms` } as React.CSSProperties),
      }}
    >
      {children}
    </Tag>
  );
};

/* ── 5. Tilt + spotlight: kartu responsif terhadap kursor ────────────────── */

export function usePointerGlow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
        el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
        el.style.setProperty('--ry', `${((px - 0.5) * 7).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return ref;
}

/* ── 6. Parallax ringan untuk hero ───────────────────────────────────────── */

export function useParallax(strength = 0.12) {
  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(window.scrollY * strength));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced, strength]);
  return reduced ? 0 : offset;
}

/* ── 7. Bingkai sudut — sentuhan cetak / galeri ──────────────────────────── */

export const CornerFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`sh-frame ${className}`}>
    <span className="sh-frame__c sh-frame__c--tl" aria-hidden />
    <span className="sh-frame__c sh-frame__c--tr" aria-hidden />
    <span className="sh-frame__c sh-frame__c--bl" aria-hidden />
    <span className="sh-frame__c sh-frame__c--br" aria-hidden />
    {children}
  </div>
);

/* ── 8. Penanda nomor seksi gaya editorial ───────────────────────────────── */

export const SectionIndex: React.FC<{ n: number; label?: string }> = ({ n, label }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`sh-index ${reduced ? 'sh-static' : ''}`} aria-hidden>
      <span className="sh-index__num">{String(n).padStart(2, '0')}</span>
      <span className="sh-index__rule" />
      {label && <span className="sh-index__label">{label}</span>}
    </div>
  );
};

/** Konfigurasi dekorasi dengan nilai default aman untuk data lama. */
export function decorOf(cfg: any) {
  const d = cfg?.decor || {};
  return {
    aurora: d.aurora !== false,
    intensity: (d.auroraIntensity || 'sedang') as 'halus' | 'sedang' | 'pekat',
    grain: d.grain !== false,
    grainOpacity: typeof d.grainOpacity === 'number' ? d.grainOpacity : 0.05,
    ornament: (d.ornament || 'arc') as 'none' | 'arc' | 'orbit' | 'wave',
    tilt: d.tilt !== false,
    parallax: d.parallax !== false,
    stagger: typeof d.stagger === 'number' ? d.stagger : 70,
    frame: d.frame === true,
  };
}

export function useDecor(cfg: any) {
  return useMemo(() => decorOf(cfg), [cfg]);
}
