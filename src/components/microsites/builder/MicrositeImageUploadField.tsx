import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Check,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  compressAndConvertToBase64,
  ImagePresetItem,
  LOGO_PRESETS,
  HEADER_BANNER_PRESETS,
  BACKGROUND_PRESETS
} from '../../../utils/imageUtils';

interface Props {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  presetType?: 'logo' | 'banner' | 'background';
  aspectRatio?: 'square' | 'banner' | 'background' | 'free';
  placeholder?: string;
  id?: string;
}

export const MicrositeImageUploadField: React.FC<Props> = ({
  label,
  description,
  value,
  onChange,
  presetType = 'banner',
  aspectRatio = 'banner',
  placeholder = 'https://...',
  id
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presets: ImagePresetItem[] =
    presetType === 'logo'
      ? LOGO_PRESETS
      : presetType === 'background'
      ? BACKGROUND_PRESETS
      : HEADER_BANNER_PRESETS;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas harus berupa gambar (JPG, PNG, WebP, atau SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas maksimal 10MB.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Configure compression based on usage
      const maxWidth = presetType === 'logo' ? 600 : presetType === 'background' ? 1920 : 1400;
      const maxHeight = presetType === 'logo' ? 600 : presetType === 'background' ? 1200 : 800;
      const quality = presetType === 'logo' ? 0.9 : 0.85;

      const compressedBase64 = await compressAndConvertToBase64(file, {
        maxWidth,
        maxHeight,
        quality,
        format: 'image/webp'
      });

      onChange(compressedBase64);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-2" id={id}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[11px] font-bold text-slate-300 block">{label}</label>
          {description && <p className="text-[10px] text-slate-500">{description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
              showPresets
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Preset Galeri</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
              showUrlInput
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Tautan URL</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {/* Current Preview or Upload Dropzone */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2 flex items-center gap-3">
          {/* Thumbnail preview */}
          <div
            className={`shrink-0 overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center ${
              aspectRatio === 'square'
                ? 'w-16 h-16 rounded-xl'
                : aspectRatio === 'banner'
                ? 'w-24 h-14 rounded-lg'
                : 'w-20 h-14 rounded-lg'
            }`}
          >
            <img
              src={value}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info & Actions */}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-300 block truncate">
              {value.startsWith('data:') ? 'Berkas Gambar Lokal (Tersimpan)' : value}
            </span>
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" />
              <span>Gambar Aktif Terpasang</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Ganti Gambar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
              title="Hapus Gambar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer text-center transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-950/20'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
          }`}
        >
          {isProcessing ? (
            <div className="py-2 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Mengompresi & Memuat Gambar...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition">
                <Upload className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-300">
                  <span className="text-emerald-400 hover:underline">Unggah dari Perangkat</span> atau seret gambar ke sini
                </p>
                <p className="text-[10px] text-slate-500">
                  PNG, JPG, WebP, SVG • Otomatis dikompresi ringan & tajam
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual URL Input dropdown */}
      {showUrlInput && (
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={e => setManualUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleApplyManualUrl()}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Preset Gallery Grid */}
      {showPresets && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilihan Preset Resmi Kesehatan
            </span>
            <span className="text-[9px] text-slate-500">Klik untuk langsung memasang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onChange(item.url);
                  setShowPresets(false);
                }}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer transition ${
                  value === item.url
                    ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                }`}
              >
                <div className="h-16 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-1.5 bg-slate-900/90 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-slate-300 block truncate">
                    {item.name}
                  </span>
                  <span className="text-[8px] text-slate-500">{item.category}</span>
                </div>
                {value === item.url && (
                  <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
