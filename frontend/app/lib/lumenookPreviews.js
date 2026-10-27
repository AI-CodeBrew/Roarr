/**
 * Card screenshots for the Lumenook templates, served by the app from public/demo-previews/lumenook/
 * (built by `npx vite-node scripts/build-lumenook-previews.mjs`, then `python scripts/downscale-lumenook-previews.py`
 * for the small `cardUrl` versions).
 * One fixed look for each: the real Lumenook demo doesn't rotate per merchant category.
 */

const BASE = "/demo-previews/lumenook";

/** @returns {{ thumbUrl: string, hoverImageUrl: string, cardUrl: string }} */
export function getLumenookProductPreview() {
  return {
    thumbUrl: `${BASE}/product.jpg`,
    hoverImageUrl: `${BASE}/product.eye.jpg`,
    cardUrl: `${BASE}/product.eye-sm.jpg`,
  };
}

/** @returns {{ thumbUrl: string, hoverImageUrl: string, cardUrl: string }} */
export function getLumenookStorePreview() {
  return {
    thumbUrl: `${BASE}/store.jpg`,
    hoverImageUrl: `${BASE}/store.eye.jpg`,
    cardUrl: `${BASE}/store.eye-sm.jpg`,
  };
}
