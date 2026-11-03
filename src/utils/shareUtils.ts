/**
 * WhatsApp & Social Media Dynamic Link Generator
 * Memastikan setiap tautan yang dibagikan ke WhatsApp memiliki judul, deskripsi,
 * dan gambar yang dinamis serta lolos dari agresifnya cache WhatsApp.
 */

export interface ShareLinkOptions {
  title: string;
  description?: string;
  imageUrl?: string;
  targetPath?: string;
  siteName?: string;
  useShortlink?: boolean;
}

export function getPublicCanonicalOrigin(): string {
  if (typeof window === 'undefined') return 'https://puskesmasmanding.com';
  
  // 1. Check if user configured a production custom domain in site settings
  try {
    const rawSettings = localStorage.getItem('puskesmas_site_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed.siteUrl && (parsed.siteUrl.startsWith('http://') || parsed.siteUrl.startsWith('https://'))) {
        return parsed.siteUrl.replace(/\/+$/, '');
      }
    }
  } catch {}

  const current = window.location.origin;
  // If running on local dev machine, return placeholder production domain for sharing
  if (current.includes('localhost') || current.includes('127.0.0.1')) {
    return 'https://puskesmasmanding.com';
  }
  // If deployed or running on live cloud URL (such as run.app or custom domain), use live origin
  return current;
}

/**
 * Menghasilkan URL share dinamis yang telah dioptimalkan untuk crawler WhatsApp/Facebook
 */
export function generateSmartShareUrl(options: ShareLinkOptions): string {
  const origin = getPublicCanonicalOrigin();
  const targetPath = options.targetPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  
  const params = new URLSearchParams();
  
  if (options.title) {
    params.set('t', options.title.trim());
  }
  if (options.description) {
    params.set('d', options.description.trim());
  }
  
  let resolvedImg = options.imageUrl?.trim() || '';
  const postMatch = targetPath.match(/^\/berita\/([^\/]+)/);
  const msMatch = targetPath.match(/^\/m\/([^\/]+)/);

  if (resolvedImg) {
    // Convert base64 data URLs to dedicated binary image endpoints so WhatsApp scrapers can fetch them
    if (resolvedImg.startsWith('data:image/')) {
      if (postMatch) {
        resolvedImg = `${origin}/api/post-image/${encodeURIComponent(postMatch[1])}.png`;
      } else if (msMatch) {
        resolvedImg = `${origin}/api/og-image/${encodeURIComponent(msMatch[1])}.png`;
      } else {
        resolvedImg = `${origin}/og-image.png`;
      }
    } else if (resolvedImg.startsWith('/')) {
      resolvedImg = `${origin}${resolvedImg}`;
    }
    params.set('img', resolvedImg);
  } else {
    // If no explicit image provided, link directly to the dynamic post image endpoint
    if (postMatch) {
      params.set('img', `${origin}/api/post-image/${encodeURIComponent(postMatch[1])}.png`);
    } else if (msMatch) {
      params.set('img', `${origin}/api/og-image/${encodeURIComponent(msMatch[1])}.png`);
    }
  }

  if (options.siteName) {
    params.set('site', options.siteName.trim());
  }
  
  // Menambahkan path tujuan agar pengunjung langsung dialihkan ke halaman yang benar
  params.set('to', targetPath);
  
  // Menambahkan timestamp singkat jika perlu cache buster
  params.set('v', Date.now().toString(36));

  return `${origin}/share?${params.toString()}`;
}

/**
 * Menghasilkan tautan langsung ke WhatsApp Web / WhatsApp Mobile
 */
export function generateWhatsAppShareHref(options: ShareLinkOptions): string {
  const smartUrl = generateSmartShareUrl(options);
  const text = `${options.title}\n${options.description ? options.description + '\n\n' : '\n'}${smartUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Membuka jendela bagikan ke WhatsApp secara langsung
 */
export function openWhatsAppShare(options: ShareLinkOptions): void {
  const href = generateWhatsAppShareHref(options);
  if (typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
}
