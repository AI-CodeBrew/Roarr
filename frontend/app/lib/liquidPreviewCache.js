/** In-memory HTML cache for `/api/liquid-preview` demo/configure previews. */

/**
 * Bump when liquid section CSS/layout changes so demo/configure previews
 * do not keep serving stale cached HTML (content fingerprints alone miss CSS).
 */
export const LIQUID_PREVIEW_LAYOUT_REV = "cinematic-orbit-circle-fill-v2";

const MAX_ENTRIES = 48;
/** @type {Map<string, string>} */
const cache = new Map();

export function getLiquidPreviewCache(key) {
  if (!key) return null;
  const html = cache.get(key);
  if (!html) return null;
  // Touch entry for simple LRU behavior.
  cache.delete(key);
  cache.set(key, html);
  return html;
}

export function setLiquidPreviewCache(key, html) {
  if (!key || !html) return;
  if (cache.has(key)) cache.delete(key);
  cache.set(key, html);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
}

export function clearLiquidPreviewCache() {
  cache.clear();
}

/**
 * Stable short fingerprint for a media URL / nested image map.
 * Prefer length + URL tail — CDN/S3 hosts share long prefixes, so slicing the
 * start of the URL caused regenerate-to-save to keep serving cached HTML.
 */
export function fingerprintMediaValue(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (typeof value.src === "string") return fingerprintMediaValue(value.src);
    if (!Array.isArray(value)) return fingerprintMediaMap(value);
    return `arr:${value.length}`;
  }
  const s = String(value);
  if (s.length <= 72) return s;
  return `${s.length}:${s.slice(-64)}`;
}

export function fingerprintMediaMap(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return "";
  return Object.keys(map)
    .sort()
    .map((k) => `${k}:${fingerprintMediaValue(map[k])}`)
    .join("|");
}

export function fingerprintTextMap(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return "";
  return Object.keys(map)
    .sort()
    .map((k) => {
      const s = String(map[k] ?? "");
      if (s.length <= 32) return `${k}:${s}`;
      return `${k}:${s.length}:${s.slice(0, 16)}:${s.slice(-16)}`;
    })
    .join("|");
}

/** Fingerprint home/product payloads so liquid-preview cache keys change on edits. */
export function fingerprintPageContent(pageData) {
  if (!pageData || typeof pageData !== "object") return "";
  const text =
    pageData.text && typeof pageData.text === "object" ? pageData.text : {};
  const images =
    pageData.images && typeof pageData.images === "object" ? pageData.images : {};
  return `${fingerprintTextMap(text)}::${fingerprintMediaMap(images)}`;
}
