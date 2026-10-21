import type { SiteSettings } from '../types/index.js';
import { apiFetch } from '../lib/api.js';
import { memStore } from '../lib/memStore';

interface SyncMetadataPayload {
  settings?: Partial<SiteSettings>;
  microsites?: Array<{
    slug: string;
    name: string;
    description?: string;
    profileImageUrl?: string;
    logoUrl?: string;
    ogImageUrl?: string;
  }>;
  posts?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    featuredImage?: string;
    category?: string;
  }>;
}

/**
 * Synchronize settings, published microsites, and published posts/articles from client to Express server
 * so server-side Open Graph & WhatsApp link preview meta tags are 100% accurate.
 */
export async function syncMetadataToServer(customSettings?: Partial<SiteSettings>): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    let settings = customSettings;
    if (!settings) {
      const localSettings = memStore.getItem('puskesmas_site_settings');
      if (localSettings) {
        settings = JSON.parse(localSettings);
      }
    }

    const payload: SyncMetadataPayload = {};
    if (settings) {
      payload.settings = settings;
    }

    // Collect published microsites
    try {
      const localMicrosites = memStore.getItem('puskesmas_microsites_collection_v2');
      if (localMicrosites) {
        const parsed = JSON.parse(localMicrosites);
        if (Array.isArray(parsed)) {
          payload.microsites = parsed
            .filter((m: any) => m.status === 'published' || !m.status)
            .map((m: any) => ({
              slug: m.slug,
              name: m.name,
              description: m.description,
              profileImageUrl: m.profileImageUrl,
              logoUrl: m.logoUrl,
              ogImageUrl: m.ogImageUrl || m.profileImageUrl || m.logoUrl
            }));
        }
      }
    } catch {}

    // Collect published posts / news articles for Open Graph and WhatsApp Preview
    try {
      const localPosts = memStore.getItem('puskesmas_cms_posts');
      if (localPosts) {
        const parsed = JSON.parse(localPosts);
        if (Array.isArray(parsed)) {
          payload.posts = parsed
            .filter((p: any) => p.status === 'published' || !p.status)
            .map((p: any) => ({
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt || p.seoDescription || '',
              featuredImage: p.featuredImage || '',
              category: p.categoryName || p.category || 'Berita & Informasi'
            }));
        }
      }
    } catch {}

    const res = await apiFetch('/api/sync-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (e) {
    // Non-blocking sync failure
    return false;
  }
}

/**
 * Synchronize a single post / news article entity with the server
 */
export async function syncPostItemToServer(post: {
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
}): Promise<void> {
  if (!post.slug) return;
  try {
    await apiFetch('/api/posts/sync-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: post.category
      })
    });
  } catch {}
}

/**
 * Synchronize a single microsite entity with the server
 */
export async function syncMicrositeItemToServer(microsite: {
  slug: string;
  name: string;
  description?: string;
  profileImageUrl?: string;
  logoUrl?: string;
  ogImageUrl?: string;
}): Promise<void> {
  if (!microsite.slug) return;
  try {
    await apiFetch('/api/microsites/sync-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: microsite.slug,
        name: microsite.name,
        description: microsite.description,
        profileImageUrl: microsite.profileImageUrl,
        logoUrl: microsite.logoUrl,
        ogImageUrl: microsite.ogImageUrl || microsite.profileImageUrl || microsite.logoUrl
      })
    });
  } catch {}
}

/**
 * Dynamically update DOM meta tags for client-side routing & Web Share API
 */
export function updateClientMetaTags(options: {
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
  type?: 'website' | 'article';
}): void {
  if (typeof document === 'undefined') return;

  const { title, description, image, siteName, url, type = 'website' } = options;

  if (title) {
    document.title = title;
  }

  const setMeta = (attrName: string, attrValue: string, content: string | undefined) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (description) {
    setMeta('name', 'description', description);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:description', description);
  }

  if (title) {
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
  }

  if (siteName) {
    setMeta('property', 'og:site_name', siteName);
  }

  if (image) {
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:secure_url', image);
    setMeta('name', 'twitter:image', image);
  }

  if (url) {
    setMeta('property', 'og:url', url);
  }

  setMeta('property', 'og:type', type);
}
