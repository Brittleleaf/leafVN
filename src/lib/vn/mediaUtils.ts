/**
 * Utility functions for handling media URLs, preventing CORS-tainting for SVG filters
 */

/**
 * Returns a proxied URL for external HTTP/HTTPS images so SVG filters (feDisplacementMap, feMorphology, etc.)
 * can safely sample pixel data without being blocked by browser cross-origin security policies.
 * Local paths (/assets/..., /projects/..., data:, blob:) are returned as-is.
 */
export function getProxiedImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Local assets, data URIs, and blobs are already origin-safe
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('./')
  ) {
    return trimmed;
  }

  // Check if it's already a proxied URL
  if (trimmed.startsWith('/api/proxy') || trimmed.includes('/api/proxy?url=')) {
    return trimmed;
  }

  // External HTTP/HTTPS URLs must be routed through the CORS proxy
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `/api/proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
