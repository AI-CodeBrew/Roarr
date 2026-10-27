/** Store templates offered by the store flow and showcased on the Entire store hub. */

import {
  getDemoPreviewEyeThumbUrl,
  getDemoPreviewThumbUrl,
  getDemoPreviewUrl,
  STORE_DEMO_VARIANTS,
} from "../../../lib/demoPreviewUrls.js";
import { getLumenookStorePreview } from "../../../lib/lumenookPreviews.js";

/** Single store: Swift only (homepage checkout, no premium PDP). */
export const PREPAID_CLASSIC_THEME_COMBO = {
  id: "prepaid-classic",
  pack: "classic",
  template: null,
  includePremium: false,
  title: "Swift",
  blurb: "Single-product store with on-page checkout",
  defaultView: "Home",
  cardPageType: "home-page",
};

/** Multi store: Swift only (store home, no premium PDPs). */
export const MULTI_THEME_COMBOS = [
  {
    id: "luminous",
    includePremium: false,
    template: null,
    title: "Swift",
    blurb: "Multi-product storefront with collections",
    defaultView: "Home",
    cardPageType: "home-page",
  },
  {
    id: "lumenook",
    pack: "lumenook",
    includePremium: false,
    template: null,
    title: "Lumenook",
    badge: { label: "New", tone: "new" },
    blurb: "Warm editorial storefront, full-bleed hero",
    defaultView: "Home",
    cardPageType: "home-page",
  },
];

/**
 * Card picture, scrolling eye screenshot and demo HTML for a store template in a category.
 * @returns {{ thumbUrl: string | null, hoverImageUrl: string | null, prebuiltHtmlUrl: string | null, demoVariant: string | null }}
 */
export function getStoreComboCardMedia(combo, category = "general") {
  if (combo.pack === "lumenook") {
    // Fixed real-photo screenshot (built by scripts/build-lumenook-previews.mjs) — the real
    // Lumenook look doesn't rotate per merchant category.
    return { ...getLumenookStorePreview(), prebuiltHtmlUrl: null, demoVariant: "lumenook-home" };
  }
  const cat = String(category || "general").toLowerCase();
  if (combo.id === PREPAID_CLASSIC_THEME_COMBO.id) {
    const variant = STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID;
    const shot = cat.includes("health") || cat.includes("car") ? "20261008-qc2" : "20261008-qc";
    return {
      thumbUrl: getDemoPreviewThumbUrl({ family: "store", variant, category }),
      hoverImageUrl: `${getDemoPreviewEyeThumbUrl({ family: "store", variant, category })}&shot=${shot}`,
      prebuiltHtmlUrl: getDemoPreviewUrl({ family: "store", variant, category }),
      demoVariant: variant,
    };
  }
  const variant = STORE_DEMO_VARIANTS.LUMINOUS_HOME;
  const shot = cat.includes("health") ? "20261008-luminous-hb" : "20261008-luminous";
  return {
    thumbUrl: getDemoPreviewThumbUrl({ family: "store", variant, category }),
    hoverImageUrl: `${getDemoPreviewEyeThumbUrl({ family: "store", variant, category })}&shot=${shot}`,
    prebuiltHtmlUrl: null,
    demoVariant: STORE_DEMO_VARIANTS.MULTI_HOME,
  };
}
