import React from 'react';
import { ShareConfig, ShareSectionType } from '../types';
import { DASHBOARD_THEMES, COLOR_PRESETS, FONT_PAIRINGS, ThemeDef } from '../config/dashboardThemes';
import { Field, TextInput, TextArea, Segmented, Select, Range, Toggle, Btn, ColorField, ImageUploadField } from './ShareEditor.controls';
import { Plus, Trash2, Check, Eye } from 'lucide-react';

export const SECTION_LABEL: Record<ShareSectionType, string> = {
  hero: 'Hero / Perkenalan', profile: 'Profil', featured: 'Microsite Unggulan',
  microsites: 'Semua Microsite', categories: 'Kategori', about: 'Tentang',
  gallery: 'Galeri', social: 'Media Sosial', contact: 'Kontak',
  announcement: 'Pengumuman', customText: 'Teks Kustom', footer: 'Footer',
};
export const ADDABLE_SECTIONS: ShareSectionType[] = ['featured', 'microsites', 'categories', 'about', 'gallery', 'social', 'contact', 'announcement', 'customText', 'profile'];

type Upd = (fn: (d: ShareConfig) => void) => void;

const Head: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div className="mb-3">
    <h3 className="font-display text-[15px] font-extrabold text-slate-800">{title}</h3>
    {desc && <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">{desc}</p>}
  </div>
);

/* ── THEME GALLERY ───────────────────────────────────────────────────── */
export const TemplatePanel: React.FC<{ cfg: ShareConfig; onApply: (id: string) => void }> = ({ cfg, onApply }) => (
  <div>
    <Head title="Theme Gallery" desc="Pilih titik awal desain. Setiap tema punya layout, tipografi, dan karakter kartu berbeda — bukan sekadar ganti warna." />
    <div className="flex flex-col gap-2.5">
      {DASHBOARD_THEMES.map((t) => {
        const active = cfg.template === t.id;
        return (
          <div key={t.id} className={`overflow-hidden rounded-xl border transition ${active ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
            <ThemeThumb theme={t} />
            <div className="p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-slate-800">{t.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t.category}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{t.description}</p>
              <button onClick={() => onApply(t.id)}
                className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {active ? <><Check className="h-3.5 w-3.5" /> Tema aktif</> : 'Gunakan tema'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/** Thumbnail mini yang mencerminkan token tema (warna, radius, kepadatan, gaya kartu). */
const ThemeThumb: React.FC<{ theme: ThemeDef }> = ({ theme: t }) => {
  const radius = t.style.radius === 'sm' ? 3 : t.style.radius === 'md' ? 6 : t.style.radius === 'lg' ? 10 : 14;
  const bg = t.background.type === 'gradient' ? `linear-gradient(135deg, ${t.background.from}, ${t.background.to})` : t.vars.bg;
  const pad = t.style.density === 'airy' ? 14 : t.style.density === 'dense' ? 8 : 11;
  return (
    <div className="relative h-24 w-full overflow-hidden" style={{ background: bg }}>
      {t.background.pattern === 'dots' && <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: `radial-gradient(${t.vars.primary} 1px, transparent 1px)`, backgroundSize: '9px 9px' }} />}
      {t.background.pattern === 'grid' && <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${t.vars.border} 1px, transparent 1px), linear-gradient(90deg, ${t.vars.border} 1px, transparent 1px)`, backgroundSize: '14px 14px' }} />}
      <div className="relative flex h-full w-full flex-col" style={{ padding: pad }}>
        <div className="rounded-full" style={{ background: t.vars.primary, height: 6, width: 46 }} />
        <div className="mt-1.5 rounded-full" style={{ background: t.vars.muted, height: 4, width: 64, opacity: 0.65 }} />
        <div className="mt-auto flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1" style={{
              background: t.style.cardStyle === 'gradient' ? `linear-gradient(135deg, ${t.vars.primary}, ${t.vars.accent})` : t.style.cardStyle === 'glass' ? 'rgba(255,255,255,.18)' : t.vars.surface,
              border: t.style.cardStyle === 'outline' ? `1.5px solid ${t.vars.border}` : 'none',
              borderRadius: radius, height: t.style.density === 'dense' ? 20 : 24,
              boxShadow: t.style.cardStyle === 'elevated' ? '0 2px 6px rgba(0,0,0,.18)' : 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── IDENTITY ────────────────────────────────────────────────────────── */
export const IdentityPanel: React.FC<{
  cfg: ShareConfig; update: Upd; slug: string; setSlug: (s: string) => void;
  title: string; setTitle: (s: string) => void; tagline: string; setTagline: (s: string) => void;
  owner: { name: string; orgName: string | null } | null;
}> = ({ cfg, update, slug, setSlug, title, setTitle, tagline, setTagline, owner }) => {
  const id = cfg.identity;
  return (
    <div className="flex flex-col gap-3.5">
      <Head title="Identitas" desc="Informasi utama dashboard dan tautan publiknya." />
      <Field label="Slug URL publik" hint={slug ? `…/share/${slug}` : 'Belum diisi — wajib untuk menerbitkan'}>
        <TextInput value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60))} placeholder="nama-dashboard" mono />
      </Field>
      <Field label="Judul dashboard (tab/SEO)"><TextInput value={title} onChange={setTitle} placeholder="Nama Pengelola — Dashboard" maxLength={120} /></Field>
      <Field label="Tagline"><TextInput value={tagline} onChange={setTagline} placeholder="Kumpulan karya & informasi" maxLength={160} /></Field>

      <hr className="border-slate-100" />
      <Field label="Nama dashboard"><TextInput value={id.dashboardName} onChange={(v) => update((d) => { d.identity.dashboardName = v; })} placeholder={owner?.orgName || 'Dashboard Publik'} maxLength={80} /></Field>
      <Field label="Nama pengelola"><TextInput value={id.ownerName} onChange={(v) => update((d) => { d.identity.ownerName = v; })} placeholder={owner?.name || 'Nama Anda'} maxLength={80} /></Field>
      <Field label="Deskripsi"><TextArea value={id.description} onChange={(v) => update((d) => { d.identity.description = v; })} placeholder="Tentang dashboard ini…" maxLength={400} /></Field>

      <ImageUploadField label="Gambar cover" kind="cover" value={id.coverUrl} onChange={(v) => update((d) => { d.identity.coverUrl = v; })} hint="Gambar akan dikompres otomatis di server (maks ±1920px)." />
      <ImageUploadField label="Logo" kind="logo" value={id.logoUrl} onChange={(v) => update((d) => { d.identity.logoUrl = v; })} hint="Logo disimpan kecil (maks ±512px) dan tetap tajam." />

      <Field label="Email kontak"><TextInput value={id.contactEmail} onChange={(v) => update((d) => { d.identity.contactEmail = v; })} placeholder="email@contoh.id" /></Field>
      <Field label="Telepon"><TextInput value={id.contactPhone} onChange={(v) => update((d) => { d.identity.contactPhone = v; })} placeholder="0812…" /></Field>
      <Field label="Alamat"><TextArea rows={2} value={id.contactAddress} onChange={(v) => update((d) => { d.identity.contactAddress = v; })} /></Field>

      <hr className="border-slate-100" />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-600">Media sosial</span>
        <Btn onClick={() => update((d) => { d.identity.socials.push({ id: 'so-' + Math.random().toString(36).slice(2, 8), platform: 'instagram', label: 'Instagram', url: '' }); })}><Plus className="h-3 w-3" /> Tambah</Btn>
      </div>
      {id.socials.map((s, i) => (
        <div key={s.id || i} className="flex items-center gap-1.5">
          <select value={s.platform} onChange={(e) => update((d) => { d.identity.socials[i].platform = e.target.value as typeof s.platform; if (!d.identity.socials[i].label) d.identity.socials[i].label = e.target.value; })}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]">
            {['instagram', 'facebook', 'youtube', 'tiktok', 'x', 'whatsapp', 'linkedin', 'website', 'email', 'other'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={s.url} onChange={(e) => update((d) => { d.identity.socials[i].url = e.target.value; })} placeholder="https://…"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]" />
          <button onClick={() => update((d) => { d.identity.socials.splice(i, 1); })} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}

      <hr className="border-slate-100" />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-600">Informasi tambahan</span>
        <Btn onClick={() => update((d) => { d.identity.extraInfo.push({ label: '', value: '' }); })}><Plus className="h-3 w-3" /> Tambah</Btn>
      </div>
      {id.extraInfo.map((x, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input value={x.label} onChange={(e) => update((d) => { d.identity.extraInfo[i].label = e.target.value; })} placeholder="Label"
            className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]" />
          <input value={x.value} onChange={(e) => update((d) => { d.identity.extraInfo[i].value = e.target.value; })} placeholder="Nilai"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]" />
          <button onClick={() => update((d) => { d.identity.extraInfo.splice(i, 1); })} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
};

/* ── BACKGROUND ──────────────────────────────────────────────────────── */
export const BackgroundPanel: React.FC<{ cfg: ShareConfig; update: Upd }> = ({ cfg, update }) => {
  const b = cfg.background;
  return (
    <div className="flex flex-col gap-3.5">
      <Head title="Latar Belakang" desc="Warna solid, gradasi, gambar, atau pola." />
      <Segmented value={b.type} cols={4} onChange={(v) => update((d) => { d.background.type = v; })}
        options={[{ value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Gradasi' }, { value: 'image', label: 'Gambar' }, { value: 'pattern', label: 'Pola' }]} />
      {b.type === 'solid' && <ColorField label="Warna" value={b.color} onChange={(v) => update((d) => { d.background.color = v; })} allowAuto />}
      {b.type === 'gradient' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Dari" value={b.gradientFrom} onChange={(v) => update((d) => { d.background.gradientFrom = v; })} />
            <ColorField label="Ke" value={b.gradientTo} onChange={(v) => update((d) => { d.background.gradientTo = v; })} />
          </div>
          <Range label="Sudut" value={b.gradientAngle} min={0} max={360} step={5} suffix="°" onChange={(v) => update((d) => { d.background.gradientAngle = v; })} />
        </>
      )}
      {b.type === 'image' && <ImageUploadField label="Gambar latar" kind="background" value={b.imageUrl} onChange={(v) => update((d) => { d.background.imageUrl = v; })} hint="Disimpan di server & dikompres otomatis (maks ±1920px)." />}
      {b.type === 'pattern' && (
        <Field label="Motif">
          <Segmented value={b.pattern} cols={3} onChange={(v) => update((d) => { d.background.pattern = v; })}
            options={[{ value: 'none', label: 'Tidak' }, { value: 'dots', label: 'Titik' }, { value: 'grid', label: 'Grid' }, { value: 'waves', label: 'Gelombang' }, { value: 'topography', label: 'Topografi' }]} />
        </Field>
      )}
      <Range label="Overlay gelap" value={Math.round(b.overlayOpacity * 100)} min={0} max={90} step={5} suffix="%" onChange={(v) => update((d) => { d.background.overlayOpacity = v / 100; })} />
      {b.type === 'image' && (
        <>
          <Range label="Kecerahan gambar" value={b.imageOpacity} min={10} max={100} step={5} suffix="%" onChange={(v) => update((d) => { d.background.imageOpacity = v; })} />
          <Field label="Blur gambar">
            <Segmented value={b.imageBlur} cols={4} onChange={(v) => update((d) => { d.background.imageBlur = v; })}
              options={[{ value: 'none', label: 'Tidak' }, { value: 'sm', label: 'Kecil' }, { value: 'md', label: 'Sedang' }, { value: 'lg', label: 'Besar' }]} />
          </Field>
        </>
      )}
    </div>
  );
};

/* ── TYPOGRAPHY ──────────────────────────────────────────────────────── */
export const TypographyPanel: React.FC<{ cfg: ShareConfig; update: Upd }> = ({ cfg, update }) => {
  const t = cfg.typography;
  return (
    <div className="flex flex-col gap-3.5">
      <Head title="Tipografi" desc="Pasangan font, ukuran, dan spasi teks." />
      <Field label="Pasangan font">
        <Select value={t.fontPairing} onChange={(v) => update((d) => { d.typography.fontPairing = v; })}
          options={FONT_PAIRINGS.map((f) => ({ value: f.id, label: f.name }))} />
      </Field>
      <Field label="Skala judul">
        <Segmented value={t.headingScale} cols={4} onChange={(v) => update((d) => { d.typography.headingScale = v; })}
          options={[{ value: 'sm', label: 'Kecil' }, { value: 'md', label: 'Sedang' }, { value: 'lg', label: 'Besar' }, { value: 'xl', label: 'Raksasa' }]} />
      </Field>
      <Field label="Ukuran teks dasar">
        <Segmented value={t.baseSize} onChange={(v) => update((d) => { d.typography.baseSize = v; })}
          options={[14, 15, 16, 17, 18].map((n) => ({ value: n as 14 | 15 | 16 | 17 | 18, label: String(n) }))} />
      </Field>
      <Field label="Ketebalan judul">
        <Segmented value={t.headingWeight} cols={3} onChange={(v) => update((d) => { d.typography.headingWeight = v; })}
          options={[{ value: 600, label: 'Semi' }, { value: 700, label: 'Bold' }, { value: 800, label: 'Extra' }]} />
      </Field>
      <Field label="Tinggi baris">
        <Segmented value={t.lineHeight} cols={4} onChange={(v) => update((d) => { d.typography.lineHeight = v; })}
          options={[{ value: 1.4, label: '1.4' }, { value: 1.5, label: '1.5' }, { value: 1.6, label: '1.6' }, { value: 1.7, label: '1.7' }]} />
      </Field>
      <Field label="Spasi huruf">
        <Segmented value={t.letterSpacing} cols={3} onChange={(v) => update((d) => { d.typography.letterSpacing = v; })}
          options={[{ value: 'tight', label: 'Rapat' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Lebar' }]} />
      </Field>
      <Field label="Perataan">
        <Segmented value={t.align} onChange={(v) => update((d) => { d.typography.align = v; })}
          options={[{ value: 'left', label: 'Kiri' }, { value: 'center', label: 'Tengah' }]} />
      </Field>
    </div>
  );
};

/* ── COLORS ──────────────────────────────────────────────────────────── */
const COLOR_KEYS: { key: keyof ShareConfig['colors']; label: string }[] = [
  { key: 'primary', label: 'Primer' }, { key: 'accent', label: 'Aksen' }, { key: 'secondary', label: 'Sekunder' },
  { key: 'text', label: 'Teks' }, { key: 'muted', label: 'Teks redup' }, { key: 'surface', label: 'Permukaan' },
  { key: 'border', label: 'Batas' }, { key: 'button', label: 'Tombol' }, { key: 'background', label: 'Latar' },
];
export const ColorsPanel: React.FC<{ cfg: ShareConfig; update: Upd }> = ({ cfg, update }) => (
  <div className="flex flex-col gap-3.5">
    <Head title="Warna" desc="Kosongkan (auto) = ikut tema. Preset mengisi beberapa warna sekaligus." />
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PRESETS.map((p) => (
        <button key={p.id} title={p.name}
          onClick={() => update((d) => { d.colors.primary = p.primary; d.colors.accent = p.accent; d.colors.button = p.primary; })}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:border-slate-400">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.primary }} />{p.name}
        </button>
      ))}
    </div>
    {COLOR_KEYS.map((c) => (
      <ColorField key={c.key} label={c.label} value={cfg.colors[c.key]} allowAuto
        onChange={(v) => update((d) => { d.colors[c.key] = v; })} />
    ))}
  </div>
);

/* ── LAYOUT ──────────────────────────────────────────────────────────── */
export const LayoutPanel: React.FC<{ cfg: ShareConfig; update: Upd }> = ({ cfg, update }) => (
  <div className="flex flex-col gap-3.5">
    <Head title="Layout" desc="Lebar konten, jumlah kolom, dan jarak antar elemen." />
    <Field label="Mode microsite">
      <Segmented value={cfg.micrositeMode} onChange={(v) => update((d) => { d.micrositeMode = v; })}
        options={[{ value: 'all', label: 'Semua' }, { value: 'selected', label: 'Pilih' }]} />
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Daftar pilihan & urutan ada di panel <b>Section</b>.</p>
    </Field>
    <Field label="Lebar kontainer">
      <Segmented value={cfg.layout.container} cols={3} onChange={(v) => update((d) => { d.layout.container = v; })}
        options={[{ value: 'narrow', label: 'Sempit' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Lebar' }]} />
    </Field>
    <Field label="Kolom (desktop)">
      <Segmented value={cfg.layout.columns} cols={3} onChange={(v) => update((d) => { d.layout.columns = v; })}
        options={[{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]} />
    </Field>
    <Field label="Kolom (mobile)">
      <Segmented value={cfg.layout.mobileColumns} onChange={(v) => update((d) => { d.layout.mobileColumns = v; })}
        options={[{ value: 1, label: '1' }, { value: 2, label: '2' }]} />
    </Field>
    <Field label="Jarak antar kartu">
      <Segmented value={cfg.layout.gap} cols={3} onChange={(v) => update((d) => { d.layout.gap = v; })}
        options={[{ value: 'sm', label: 'Rapat' }, { value: 'md', label: 'Sedang' }, { value: 'lg', label: 'Lapang' }]} />
    </Field>
    <Field label="Jarak antar section">
      <Segmented value={cfg.layout.sectionSpacing} cols={3} onChange={(v) => update((d) => { d.layout.sectionSpacing = v; })}
        options={[{ value: 'sm', label: 'Rapat' }, { value: 'md', label: 'Sedang' }, { value: 'lg', label: 'Lapang' }]} />
    </Field>
    <Field label="Ukuran kartu">
      <Segmented value={cfg.layout.cardSize} cols={3} onChange={(v) => update((d) => { d.layout.cardSize = v; })}
        options={[{ value: 'compact', label: 'Ringkas' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Besar' }]} />
    </Field>
  </div>
);

/* ── CARD ────────────────────────────────────────────────────────────── */
export const CardPanel: React.FC<{ cfg: ShareConfig; update: Upd; published: { id: string; slug: string; name: string }[] }> = ({ cfg, update, published }) => {
  const c = cfg.card;
  return (
    <div className="flex flex-col gap-3.5">
      <Head title="Kartu Microsite" desc="Bentuk, bayangan, dan isi kartu microsite." />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-500">
        Pemilihan & urutan microsite sekarang ada di panel <b>Section</b>.
      </div>
      <Field label="Gaya">
        <Segmented value={c.style} cols={3} onChange={(v) => update((d) => { d.card.style = v; })}
          options={[{ value: 'elevated', label: 'Bayangan' }, { value: 'flat', label: 'Flat' }, { value: 'outline', label: 'Garis' }, { value: 'glass', label: 'Kaca' }, { value: 'gradient', label: 'Gradasi' }]} />
      </Field>
      <Field label="Radius">
        <Segmented value={c.radius} cols={4} onChange={(v) => update((d) => { d.card.radius = v; })}
          options={[{ value: 'sm', label: 'Kecil' }, { value: 'md', label: 'Sedang' }, { value: 'lg', label: 'Besar' }, { value: 'xl', label: 'Penuh' }]} />
      </Field>
      <Field label="Rasio gambar">
        <Segmented value={c.imageRatio} cols={3} onChange={(v) => update((d) => { d.card.imageRatio = v; })}
          options={[{ value: 'hidden', label: 'Tanpa' }, { value: 'square', label: 'Kotak' }, { value: 'wide', label: 'Lebar' }]} />
      </Field>
      <Toggle checked={c.showCategory} onChange={(v) => update((d) => { d.card.showCategory = v; })} label="Tampilkan kategori" />
      <Toggle checked={c.showDescription} onChange={(v) => update((d) => { d.card.showDescription = v; })} label="Tampilkan deskripsi" />
      <Toggle checked={c.showLinkCount} onChange={(v) => update((d) => { d.card.showLinkCount = v; })} label="Tampilkan jumlah tautan" />
      <Toggle checked={c.showShareButton} onChange={(v) => update((d) => { d.card.showShareButton = v; })} label="Tombol bagikan" />
      <Toggle checked={c.hoverLift} onChange={(v) => update((d) => { d.card.hoverLift = v; })} label="Efek naik saat hover" />

      {cfg.micrositeMode === 'selected' && (
        <>
          <hr className="border-slate-100" />
          <p className="text-[11.5px] text-slate-500">Pilih & urutkan microsite yang tampil (klik untuk aktif/nonaktif):</p>
          {published.length === 0 && <p className="text-[11px] text-slate-400">Belum ada microsite terbit.</p>}
          {published.map((m) => {
            const idx = cfg.micrositeIds.indexOf(m.id);
            return (
              <button key={m.id} onClick={() => update((d) => { const i = d.micrositeIds.indexOf(m.id); if (i >= 0) d.micrositeIds.splice(i, 1); else d.micrositeIds.push(m.id); })}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[12px] ${idx >= 0 ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                <span className="truncate font-medium">{m.name}</span>
                {idx >= 0 && <span className="ml-2 shrink-0 rounded bg-slate-900 px-1.5 text-[10px] font-bold text-white">#{idx + 1}</span>}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
};

/* ── SECTIONS ────────────────────────────────────────────────────────── */
export const SectionsPanel: React.FC<{
  cfg: ShareConfig; update: Upd; moveSection: (i: number, d: -1 | 1) => void;
  addSection: (t: ShareSectionType) => void; removeSection: (id: string) => void;
  published?: { id: string; slug: string; name: string }[];
}> = ({ cfg, update, moveSection, addSection, removeSection, published = [] }) => {
  const [adding, setAdding] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Head title="Section & Urutan" desc="Aktifkan, geser urutan, hapus, dan tambah bagian halaman." />

      {/* ── PILIH MICROSITE: fitur utama halaman Section ── */}
      <div className="rounded-xl border border-slate-900/10 bg-slate-50/60 p-2.5">
        <Field label="Microsite yang ditampilkan">
          <Segmented value={cfg.micrositeMode} cols={2} onChange={(v) => update((d) => { d.micrositeMode = v; })}
            options={[{ value: 'all', label: 'Semua' }, { value: 'selected', label: 'Pilih sendiri' }]} />
        </Field>
        {cfg.micrositeMode === 'selected' && (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Klik untuk memilih. Angka = urutan tampil. {cfg.micrositeIds.length > 0
                ? `${cfg.micrositeIds.length} dari ${published.length} dipilih.`
                : 'Belum ada yang dipilih — halaman publik akan kosong.'}
            </p>
            {published.length === 0 && (
              <p className="text-[11px] text-slate-400">Belum ada microsite terbit.</p>
            )}
            {published.map((m) => {
              const idx = cfg.micrositeIds.indexOf(m.id);
              const on = idx >= 0;
              return (
                <div key={m.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[12px] ${on ? 'border-slate-900 bg-white' : 'border-slate-200 bg-white/60'}`}>
                  <button onClick={() => update((d) => {
                    const i = d.micrositeIds.indexOf(m.id);
                    if (i >= 0) d.micrositeIds.splice(i, 1); else d.micrositeIds.push(m.id);
                  })} className="flex flex-1 items-center gap-2 text-left">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}`}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`truncate ${on ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{m.name}</span>
                  </button>
                  {on && (
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="rounded bg-slate-900 px-1.5 text-[10px] font-bold text-white">#{idx + 1}</span>
                      <button disabled={idx === 0} title="Naikkan"
                        onClick={() => update((d) => { const i = d.micrositeIds.indexOf(m.id); if (i > 0) { [d.micrositeIds[i - 1], d.micrositeIds[i]] = [d.micrositeIds[i], d.micrositeIds[i - 1]]; } })}
                        className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25"><ArrowUpIcon /></button>
                      <button disabled={idx === cfg.micrositeIds.length - 1} title="Turunkan"
                        onClick={() => update((d) => { const i = d.micrositeIds.indexOf(m.id); if (i >= 0 && i < d.micrositeIds.length - 1) { [d.micrositeIds[i + 1], d.micrositeIds[i]] = [d.micrositeIds[i], d.micrositeIds[i + 1]]; } })}
                        className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25"><ArrowDownIcon /></button>
                    </span>
                  )}
                </div>
              );
            })}
            {published.length > 1 && (
              <div className="mt-1 flex gap-1.5">
                <button onClick={() => update((d) => { d.micrositeIds = published.map((m) => m.id); })}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-400">Pilih semua</button>
                <button onClick={() => update((d) => { d.micrositeIds = []; })}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-400">Kosongkan</button>
              </div>
            )}
          </div>
        )}
      </div>

      {cfg.sections.map((s, i) => (
        <div key={s.id} className={`rounded-xl border ${s.visible ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-70'}`}>
          <div className="flex items-center gap-1 px-2.5 py-2">
            <button onClick={() => update((d) => { d.sections[i].visible = !d.sections[i].visible; })} title="Tampil/sembunyi"
              className={`grid h-6 w-6 place-items-center rounded-md ${s.visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}><Eye className="h-3.5 w-3.5" /></button>
            <span className="flex-1 truncate text-[12.5px] font-bold text-slate-700">{SECTION_LABEL[s.type]}</span>
            <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUpIcon /></button>
            <button onClick={() => moveSection(i, 1)} disabled={i === cfg.sections.length - 1} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDownIcon /></button>
            <button onClick={() => removeSection(s.id)} title="Hapus section"
              className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          {['about', 'announcement', 'customText', 'profile', 'categories', 'gallery', 'social', 'contact'].includes(s.type) && (
            <details className="border-t border-slate-100 px-2.5 py-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">Pengaturan</summary>
              <div className="mt-2 flex flex-col gap-2">
                <TextInput value={s.title} onChange={(v) => update((d) => { d.sections[i].title = v; })} placeholder="Judul section" />
                {['about', 'announcement', 'customText', 'profile'].includes(s.type) && (
                  <TextArea rows={3} value={s.content} onChange={(v) => update((d) => { d.sections[i].content = v; })} placeholder="Isi teks…" />
                )}
                {s.type === 'announcement' && (
                  <Segmented value={s.tone || 'info'} cols={3} onChange={(v) => update((d) => { d.sections[i].tone = v; })}
                    options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Penting' }, { value: 'success', label: 'Sukses' }]} />
                )}
              </div>
            </details>
          )}
        </div>
      ))}
      <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[12px] font-bold text-slate-600 hover:border-slate-400 hover:bg-slate-50">
        <Plus className="h-3.5 w-3.5" /> Tambah section
      </button>
      {adding && (
        <div className="grid grid-cols-2 gap-1.5">
          {ADDABLE_SECTIONS.map((t) => (
            <button key={t} onClick={() => { addSection(t); setAdding(false); }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50">{SECTION_LABEL[t]}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const ArrowUpIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>;
const ArrowDownIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
