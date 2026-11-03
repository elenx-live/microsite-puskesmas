/**
 * Utility functions for input sanitization and XSS prevention
 */

/**
 * Utility functions for input sanitization and XSS prevention
 */

/**
 * Decodes HTML entities if the user pasted or entered escaped HTML tags
 * e.g., &lt;h2&gt; -> <h2>, &lt;p&gt; -> <p>, &lt;strong&gt; -> <strong>
 */
function decodeEscapedTagsIfPresent(str: string): string {
  if (!str) return '';
  // Check if string contains escaped tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, etc.
  if (/&lt;\/?(h[1-6]|p|div|span|ul|ol|li|strong|b|em|i|u|s|blockquote|table|thead|tbody|tr|th|td|a|hr|br|code|pre)\b/i.test(str)) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&');
  }
  return str;
}

export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  
  let clean = decodeEscapedTagsIfPresent(html)
    // 1. Strip script tags entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // 2. Strip iframe/object/embed/applet/meta/link/style (that could contain exploits)
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    
    // 3. Strip event handlers onXXX=...
    .replace(/\bon[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]*)/gi, '')
    
    // 4. Strip javascript: and vbscript: URIs
    .replace(/href\s*=\s*['"]\s*(javascript|vbscript)\s*:[^'"]*['"]/gi, 'href="#"')
    .replace(/src\s*=\s*['"]\s*(javascript|vbscript)\s*:[^'"]*['"]/gi, 'src=""')
    
    // 5. Clean standalone JS/VBS schemes
    .replace(/(javascript|vbscript):/gi, 'no-javascript:');

  return clean;
}

/**
 * Format and prepare safe HTML for rich presentation.
 * If raw text without block tags is entered, gracefully wraps paragraphs and linebreaks.
 */
export function formatSafeHtml(rawHtml: string | undefined): string {
  if (!rawHtml) return '';
  const sanitized = sanitizeHtml(rawHtml).trim();
  if (!sanitized) return '';

  // Check if content already contains block-level HTML tags
  const hasBlockTags = /<(?:p|h[1-6]|ul|ol|li|table|blockquote|hr|div)\b/i.test(sanitized);
  
  if (!hasBlockTags) {
    // Convert double newlines to paragraphs and single newlines to <br/>
    const paragraphs = sanitized
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`);
    return paragraphs.join('\n');
  }

  return sanitized;
}

export function sanitizeText(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

