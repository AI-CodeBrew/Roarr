/**
 * Prefetch prebuilt demo HTML into the in-memory liquid preview cache
 * so eye-modal Home/Product switches are instant (Forge-style).
 */

import {
  getLiquidPreviewCache,
  setLiquidPreviewCache,
} from "./liquidPreviewCache.js";

/** @type {Map<string, Promise<string|null>>} */
const inflight = new Map();

export function prebuiltCacheKey(url) {
  return url ? `prebuilt:${url}` : null;
}

/**
 * Fetch one demo HTML URL into memory (no-op if already cached).
 * @param {string|null|undefined} url
 * @returns {Promise<string|null>}
 */
export function prefetchDemoPreviewHtml(url) {
  if (!url || typeof url !== "string") return Promise.resolve(null);
  const key = prebuiltCacheKey(url);
  const existing = getLiquidPreviewCache(key);
  if (existing) return Promise.resolve(existing);

  const pending = inflight.get(url);
  if (pending) return pending;

  const job = fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    // Prefer CDN / disk cache when the browser already has it.
    cache: "force-cache",
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const text = await res.text();
      if (text && text.length > 100) {
        setLiquidPreviewCache(key, text);
        return text;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, job);
  return job;
}

/**
 * Prefetch multiple demo URLs in parallel (deduped).
 * @param {Array<string|null|undefined>} urls
 */
export function prefetchDemoPreviewHtmlMany(urls) {
  const unique = [...new Set((urls || []).filter(Boolean))];
  return Promise.all(unique.map((u) => prefetchDemoPreviewHtml(u)));
}

/**
 * Warm browser image cache for eye-modal JPG posters (instant first paint).
 * @param {Array<string|null|undefined>} urls
 */
export function prefetchDemoPreviewImages(urls) {
  if (typeof Image === "undefined") return;
  const unique = [...new Set((urls || []).filter(Boolean))];
  for (const url of unique) {
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    } catch {
      // ignore
    }
  }
}
