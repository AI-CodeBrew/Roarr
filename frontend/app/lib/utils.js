// General-purpose utilities for routes/components.
// Keep these small and focused; avoid pulling in React here.

/**
 * Smoothly scrolls a container (or window) to the top.
 * Resolves once we're effectively at the top or after a short timeout.
 *
 * @param {HTMLElement | Window | null} container
 * @param {number} [maxWaitMs=700]
 * @returns {Promise<void>}
 */
export function scrollToTopSmooth(container, maxWaitMs = 700) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const target =
      container && "scrollTop" in container ? container : window;

    const getPos = () => {
      if (target === window) return window.scrollY || 0;
      return target.scrollTop || 0;
    };

    const scrollToTop = () => {
      const supportsSmooth =
        "scrollTo" in target &&
        typeof target.scrollTo === "function";

      if (supportsSmooth) {
        target.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === window) {
        window.scrollTo(0, 0);
      } else {
        target.scrollTop = 0;
      }
    };

    // If we're already at the top, don't animate.
    if (getPos() <= 0) {
      resolve();
      return;
    }

    const startedAt = performance.now();

    const tick = () => {
      if (getPos() <= 0 || performance.now() - startedAt > maxWaitMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };

    try {
      scrollToTop();
    } catch {
      // Fallback to an immediate jump.
      if (target === window) {
        window.scrollTo(0, 0);
      } else {
        target.scrollTop = 0;
      }
      resolve();
      return;
    }

    requestAnimationFrame(tick);
  });
}

/**
 * Convert a chunk of HTML into plain text in a safe, browser-only way.
 *
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return typeof html === "string" ? html : "";
  }

  const safe = typeof html === "string" ? html : "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = safe;
  return tempDiv.textContent || tempDiv.innerText || "";
}

/**
 * Capitalize known product sources (e.g., "shopify" -> "Shopify").
 * Falls back to capitalizing the first letter.
 *
 * @param {string | null} source
 * @returns {string | null}
 */
export function normalizeProductSource(source) {
  if (!source) return null;
  const lower = source.toLowerCase();

  if (lower === "shopify") return "Shopify";

  return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
}

/**
 * Normalized category mapping used across the app.
 *
 * @param {string | null | undefined} rawCategory
 * @param {string} [defaultCategory="general"]
 * @returns {string}
 */
export function normalizeCategory(rawCategory, defaultCategory = "general") {
  if (!rawCategory || typeof rawCategory !== "string") {
    return defaultCategory;
  }

  const lower = rawCategory.toLowerCase().replace(/\s+/g, "_");

  const valid = [
    "health_beauty",
    "fashion",
    "home_kitchen",
    "kids_toys",
    "car_accessories",
    "general",
  ];
  if (valid.includes(lower)) return lower;

  switch (lower) {
    case "health-beauty":
    case "health&beauty":
      return "health_beauty";
    case "home_kitchen":
    case "home-kitchen":
      return "home_kitchen";
    case "kids_toys":
    case "kids-toys":
      return "kids_toys";
    case "car_accessories":
    case "car-accessories":
      return "car_accessories";
    default:
      return defaultCategory;
  }
}

/**
 * Creates an abort controller for request cancellation.
 * Returns a cleanup function that aborts the request.
 *
 * @returns {{ controller: AbortController, cleanup: () => void }}
 */
export function createRequestController() {
  const controller = new AbortController();
  return {
    controller,
    cleanup: () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    },
  };
}

/**
 * Simple in-memory cache with TTL for API responses.
 * Used to avoid redundant API calls for the same data.
 */
class SimpleCache {
  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Export singleton instances for common use cases
export const productDetailsCache = new SimpleCache(10 * 60 * 1000); // 10 minutes for product details
