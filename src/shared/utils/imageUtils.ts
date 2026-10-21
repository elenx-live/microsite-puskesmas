/**
 * Image processing, compression, and preset asset library for Microsites
 */

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Compresses an uploaded image file on the client using HTML5 Canvas
 * and converts it into a high-performance Data URL (Base64)
 */
export async function compressAndConvertToBase64(
  file: File,
  options: ImageProcessOptions = {}
): Promise<string> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as Data URL to maintain vector sharpness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original Data URL
          resolve(event.target?.result as string);
          return;
        }

        // Apply smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image into canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed data url
        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch {
          // Fallback to JPEG if WebP conversion fails on older browsers
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses file gambar. Pastikan format file valid.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar dari perangkat.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Curated Health & Medical Image Presets for Logos, Header Banners, and Backgrounds
 */
export interface ImagePresetItem {
  id: string;
  name: string;
  category: string;
  url: string;
  previewUrl: string;
  tags?: string[];
}

export const LOGO_PRESETS: ImagePresetItem[] = [
  {
    id: 'logo-puskesmas-official',
    name: 'Logo Medis Puskesmas Hijau',
    category: 'Resmi',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=150&q=80',
    tags: ['puskesmas', 'kesehatan', 'resmi']
  },
  {
    id: 'logo-kemenkes-shield',
    name: 'Perisai Medis Sehat',
    category: 'Medis',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=150&q=80',
    tags: ['medis', 'perisai', 'dokter']
  },
  {
    id: 'logo-heart-pulse',
    name: 'Jantung Peduli & Kasih',
    category: 'Layanan',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=150&q=80',
    tags: ['jantung', 'peduli', 'klinik']
  },
  {
    id: 'logo-maternal-posyandu',
    name: 'Ibu & Anak Posyandu',
    category: 'Posyandu',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=150&q=80',
    tags: ['posyandu', 'balita', 'ibu']
  },
  {
    id: 'logo-pharmacy-cross',
    name: 'Palang Farmasi & Obat',
    category: 'Farmasi',
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=150&q=80',
    tags: ['farmasi', 'obat', 'laboratorium']
  }
];

export const HEADER_BANNER_PRESETS: ImagePresetItem[] = [
  {
    id: 'banner-health-center',
    name: 'Gedung Layanan Ramah Pasien',
    category: 'Fasilitas',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80',
    tags: ['gedung', 'klinik', 'puskesmas']
  },
  {
    id: 'banner-doctors-team',
    name: 'Tim Medis & Dokter Sigap',
    category: 'Layanan',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80',
    tags: ['dokter', 'tim', 'pelayanan']
  },
  {
    id: 'banner-vaccine-immunization',
    name: 'Pekan Imunisasi & Vaksinasi',
    category: 'Kampanye',
    url: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=300&q=80',
    tags: ['vaksin', 'polio', 'imunisasi']
  },
  {
    id: 'banner-maternal-care',
    name: 'Kesehatan Ibu, Balita & Gizi',
    category: 'Posyandu',
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80',
    tags: ['gizi', 'anak', 'stunting']
  },
  {
    id: 'banner-emergency-ambulance',
    name: 'Unit Gawat Darurat & Ambulans',
    category: 'Darurat',
    url: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=300&q=80',
    tags: ['ugd', 'ambulans', 'darurat']
  },
  {
    id: 'banner-consultation-desk',
    name: 'Meja Edukasi & Konseling Sehat',
    category: 'Konsultasi',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80',
    tags: ['konseling', 'edukasi', 'bimbingan']
  }
];

export const BACKGROUND_PRESETS: ImagePresetItem[] = [
  {
    id: 'bg-emerald-aurora',
    name: 'Emerald Aurora Gradient',
    category: 'Gradien',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80',
    tags: ['aurora', 'hijau', 'emerald']
  },
  {
    id: 'bg-clean-medical-bright',
    name: 'Klinik Terang & Bersih',
    category: 'Ruangan',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80',
    tags: ['putih', 'bersih', 'minimalis']
  },
  {
    id: 'bg-cyan-particles',
    name: 'Cyan Bio-Luminescence Flow',
    category: 'Abstrak',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    tags: ['cyan', 'partikel', 'teknologi']
  },
  {
    id: 'bg-warm-nusantara-amber',
    name: 'Warm Nusantara Golden Hue',
    category: 'Budaya',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
    tags: ['amber', 'emas', 'nusantara']
  },
  {
    id: 'bg-dark-obsidian-luxury',
    name: 'Dark Obsidian Sleek Grid',
    category: 'Gelap',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    tags: ['dark', 'obsidian', 'elegan']
  },
  {
    id: 'bg-nature-wellness-leaves',
    name: 'Daun Segar Hayati Alam',
    category: 'Alam',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1920&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80',
    tags: ['daun', 'segar', 'alami']
  }
];
