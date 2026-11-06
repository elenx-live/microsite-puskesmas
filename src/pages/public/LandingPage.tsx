import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  LayoutGrid,
  Palette,
  QrCode,
  Share2,
  ShieldCheck,
  BarChart3,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Globe,
  Rocket,
  Users,
  Link2,
  Star,
  ChevronDown,
} from 'lucide-react';

interface PublicSettings {
  registrationOpen: boolean;
  platformAnnouncement: string;
  showcaseEnabled: boolean;
  publicCounts?: { users: number; microsites: number; published: number };
}

/**
 * Landing page promosi platform (publik, tanpa login).
 * Sesuai konsep: memperkenalkan layanan microsite & mengajak masyarakat bergabung.
 */
export default function LandingPage() {
  const { user } = useAuth();
  const [s, setS] = useState<PublicSettings | null>(null);

  useEffect(() => {
    fetch('/api/public/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setS(d))
      .catch(() => setS(null));
  }, []);

  const counts = s?.publicCounts || { users: 0, microsites: 0, published: 0 };
  const studioHref = user ? '/studio' : '/login';

  return (
    <PublicLayout activeNav="home">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-blob absolute -left-24 -top-32 h-96 w-96 rounded-full bg-[var(--color-primary)]/18 blur-3xl" />
          <div className="aurora-blob absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[var(--color-accent)]/18 blur-3xl" />
          <div className="aurora-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[var(--color-info)]/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          {s?.platformAnnouncement && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--color-warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] px-4 py-1.5 text-xs font-semibold text-[var(--color-warning)]">
              <Sparkles className="h-3.5 w-3.5" />
              {s.platformAnnouncement}
            </div>
          )}

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge variant="emerald" className="mb-4">
                <Rocket className="h-3 w-3" />
                Platform Microsite Multi-Pengguna
              </Badge>
              <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-[52px]">
                Bangun halaman digital{' '}
                <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                  milik Anda sendiri
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
                Platform microsite untuk unit, program, komunitas, dan organisasi. Buat halaman
                kumpulan tautan yang menarik, atur tampilannya sesuka Anda, lalu bagikan lewat satu
                tautan atau QR Code.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={s?.registrationOpen === false ? '/login' : '/register'}>
                  <Button size="lg">
                    {s?.registrationOpen === false ? 'Masuk ke Studio' : 'Mulai Sekarang — Gratis'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/microsites">
                  <Button variant="outline" size="lg">
                    <LayoutGrid className="h-4 w-4" />
                    Jelajahi Microsite
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--color-muted-foreground)]">
                {[
                  { icon: <Users className="h-4 w-4" />, label: `${counts.users} pengelola` },
                  { icon: <Globe className="h-4 w-4" />, label: `${counts.published} microsite publik` },
                  { icon: <Link2 className="h-4 w-4" />, label: 'Gratis & tanpa coding' },
                ].map((x) => (
                  <span key={x.label} className="inline-flex items-center gap-2">
                    <span className="text-[var(--color-primary)]">{x.icon}</span>
                    {x.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Mockup pratinjau microsite */}
            <div className="relative">
              <div className="studio-rise mx-auto w-full max-w-[300px] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-lg)]">
                <div className="flex flex-col items-center gap-3">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xl font-extrabold text-[var(--color-primary-foreground)]">
                    PK
                  </span>
                  <div className="text-center">
                    <p className="font-display text-sm font-bold text-[var(--color-text)]">Puskesmas Kawasan</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">Layanan & informasi publik</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {['Pendaftaran Online', 'Jadwal Poliklinik', 'Layanan Darurat 24 Jam', 'Kontak & Lokasi'].map(
                    (t, i) => (
                      <div
                        key={t}
                        className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/60 px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text)]"
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)]">
                          <Link2 className="h-3 w-3" />
                        </span>
                        {t}
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                      </div>
                    ),
                  )}
                </div>
              </div>
              <span className="absolute -right-3 top-6 hidden rotate-6 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] shadow-[var(--shadow-md)] sm:block">
                + QR Code
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEUNGGULAN ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="zinc" className="mb-3">Keunggulan</Badge>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Semua yang Anda butuhkan dalam satu platform
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Tanpa perlu coding. Cukup susun tautan, pilih tema, dan terbitkan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Palette className="h-5 w-5" />, t: 'Desain Bebas', d: 'Pilih tema, warna, font, dan gaya komponen untuk membangun identitas visual Anda sendiri.' },
            { icon: <Link2 className="h-5 w-5" />, t: 'Kelola Tautan Mudah', d: 'Susun tautan, tombol, gambar, dan kontak dengan urutan yang Anda inginkan lewat drag-and-drop.' },
            { icon: <QrCode className="h-5 w-5" />, t: 'QR Code Otomatis', d: 'Setiap microsite punya QR Code dinamis yang siap dicetak dan ditempel di lokasi layanan.' },
            { icon: <Share2 className="h-5 w-5" />, t: 'Bagikan Sekali Klik', d: 'Bagikan tautan ke WhatsApp, media sosial, atau salin langsung — lengkap dengan pratinjau otomatis.' },
            { icon: <BarChart3 className="h-5 w-5" />, t: 'Statistik Kunjungan', d: 'Pantau jumlah kunjungan, klik, dan perangkat pengunjung untuk memahami dampak konten Anda.' },
            { icon: <ShieldCheck className="h-5 w-5" />, t: 'Aman & Terisolasi', d: 'Setiap pengelola punya ruang kerja sendiri. Data Anda tidak bercampur dengan pengguna lain.' },
          ].map((f, i) => (
            <Card key={f.t} className="studio-rise flex flex-col gap-3" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-[var(--color-primary)]">
                {f.icon}
              </span>
              <h3 className="font-display text-base font-bold text-[var(--color-text)]">{f.t}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CARA PAKAI ──────────────────────────────────────────── */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="zinc" className="mb-3">Cara Menggunakan</Badge>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Empat langkah, microsite Anda siap
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '1', t: 'Daftar & Masuk', d: 'Buat akun pengelola gratis dalam hitungan detik.' },
              { n: '2', t: 'Buat Microsite', d: 'Beri nama, pilih kategori, dan atur alamat URL Anda.' },
              { n: '3', t: 'Atur Konten & Desain', d: 'Susun tautan dan pilih tema sesuai identitas Anda.' },
              { n: '4', t: 'Terbitkan & Bagikan', d: 'Publikasikan dan bagikan tautan atau QR Code.' },
            ].map((step, i) => (
              <div key={step.n} className="studio-rise relative flex flex-col gap-3" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] font-display text-xl font-extrabold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]">
                  {step.n}
                </span>
                <h3 className="font-display text-base font-bold text-[var(--color-text)]">{step.t}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <Star className="mx-auto mb-4 h-8 w-8 text-[var(--color-primary-foreground)]" />
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-primary-foreground)] sm:text-3xl">
              Siap punya ruang digital sendiri?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-primary-foreground)]/90">
              {s?.registrationOpen === false
                ? 'Pendaftaran sedang ditutup. Silakan masuk bila Anda sudah punya akun.'
                : 'Bergabunglah dengan pengelola lain yang sudah membangun microsite mereka.'}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to={s?.registrationOpen === false ? '/login' : '/register'}>
                <Button
                  size="lg"
                  className="!bg-[var(--color-card)] !text-[var(--color-primary)] hover:!bg-[var(--color-card)]/90"
                >
                  {s?.registrationOpen === false ? 'Masuk ke Studio' : 'Daftar Sekarang'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {user && (
                <Link to={studioHref}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="!border-white/50 !text-[var(--color-primary-foreground)] hover:!bg-white/10"
                  >
                    Buka Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-card)]/60">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <Badge variant="zinc" className="mb-3">FAQ</Badge>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Pertanyaan yang sering diajukan
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {[
              { q: 'Apakah penggunaan platform ini berbayar?', a: 'Tidak. Pembuatan dan pengelolaan microsite di platform ini gratis untuk seluruh pengelola yang terdaftar.' },
              { q: 'Apakah saya perlu kemampuan coding?', a: 'Tidak sama sekali. Seluruh proses — mulai dari membuat microsite, menyusun tautan, memilih tema, hingga menerbitkan — dilakukan lewat antarmuka visual.' },
              { q: 'Apakah microsite saya bisa diakses publik?', a: 'Ya. Setelah Anda publikasikan, microsite dapat diakses siapa saja melalui tautan khusus Anda, dan bisa dibagikan lewat WhatsApp, media sosial, atau QR Code.' },
              { q: 'Apakah data saya terpisah dari pengelola lain?', a: 'Ya. Setiap pengelola memiliki ruang kerja, data, dan pengaturan sendiri yang terisolasi secara aman di sisi server.' },
              { q: 'Bisakah saya mengubah tampilan microsite?', a: 'Tentu. Anda bebas mengatur identitas, tema, warna, font, tata letak, dan gaya komponen microsite Anda.' },
            ].map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-muted)]/50"
      >
        <span className="text-sm font-semibold text-[var(--color-text)]">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{a}</p>
        </div>
      </div>
    </div>
  );
}
