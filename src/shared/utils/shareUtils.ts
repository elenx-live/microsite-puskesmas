import { memStore } from '../lib/memStore';
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
  if (typeof window === 'undefined') return 'https://puskesmas-mandiri.go.id';
  
  // 1. Check if user configured a production custom domain in site settings
  try {
    const rawSettings = memStore.getItem('puskesmas_site_settings');
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
    return 'https://puskesmas-mandiri.go.id';
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
  
  // URL pendek langsung ke artikel — OG meta tags di-inject server untuk crawler WhatsApp.
  // Tidak perlu lagi /share?t=...&d=... yang panjang.
  return `${origin}${targetPath}`;
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
