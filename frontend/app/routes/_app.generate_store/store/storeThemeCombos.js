/** Store templates offered by the store flow and showcased on the Entire store hub. */

import {
  getDemoPreviewEyeThumbUrl,
  getDemoPreviewThumbUrl,
  getDemoPreviewUrl,
  STORE_DEMO_VARIANTS,
} from "../../../lib/demoPreviewUrls.js";
import { getLumenookStorePreview } from "../../../lib/lumenookPreviews.js";

/** Single store: Swift (homepage checkout, no premium PDP). */
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

/** Single store: Maison (quiet-luxury homepage only, no premium PDP). */
export const MAISON_THEME_COMBO = {
  id: "maison",
  pack: "maison",
  template: null,
  includePremium: false,
  title: "Maison",
  badge: { label: "New", tone: "new" },
  blurb: "Quiet-luxury single-product store in ivory and champagne",
  defaultView: "Home",
  cardPageType: "home-page",
};

/** Single store: Tempo (bright gadget homepage in peach, navy and orange; no premium PDP). */
export const TEMPO_THEME_COMBO = {
  id: "tempo",
  pack: "tempo",
  template: null,
  includePremium: false,
  title: "Tempo",
  badge: { label: "New", tone: "new" },
  blurb: "Bright single-product store in peach, navy and coral with a product slider",
  defaultView: "Home",
  cardPageType: "home-page",
};

/** Single store templates, in picker order. */
export const SINGLE_THEME_COMBOS = [PREPAID_CLASSIC_THEME_COMBO, MAISON_THEME_COMBO, TEMPO_THEME_COMBO];

/** Fixed card screenshots for Tempo, built by scripts/build-tempo-previews.mjs. */
const TEMPO_PREVIEW_BASE = "/demo-previews/tempo";

/** Fixed card screenshots for Maison, built by scripts/build-maison-previews.mjs. */
const MAISON_PREVIEW_BASE = "/demo-previews/maison";

/** Fixed card screenshots for Lustre, built by scripts/build-lustre-previews.mjs. */
const LUSTRE_PREVIEW_BASE = "/demo-previews/lustre";

/** Fixed card screenshots for Velour, built by scripts/build-velour-previews.mjs. */
const VELOUR_PREVIEW_BASE = "/demo-previews/velour";

/** Fixed card screenshots for Hearth, built by scripts/build-hearth-previews.mjs. */
const HEARTH_PREVIEW_BASE = "/demo-previews/hearth";

/** Fixed card screenshots for Simmer, built by scripts/build-simmer-previews.mjs. */
const SIMMER_PREVIEW_BASE = "/demo-previews/simmer";

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
  {
    id: "lustre",
    pack: "lustre",
    includePremium: false,
    template: null,
    title: "Lustre",
    badge: { label: "New", tone: "new" },
    blurb: "Polished fashion and jewelry store with filters and collections",
    defaultView: "Home",
    cardPageType: "home-page",
  },
  {
    id: "velour",
    pack: "velour",
    includePremium: false,
    template: null,
    title: "Velour",
    badge: { label: "New", tone: "new" },
    blurb: "Editorial clothing store with lookbook, quick view and cart drawer",
    defaultView: "Home",
    cardPageType: "home-page",
  },
  {
    id: "hearth",
    pack: "hearth",
    includePremium: false,
    template: null,
    title: "Hearth",
    badge: { label: "New", tone: "new" },
    blurb: "Kitchen accessories store for three products, with lookbook and quick view",
    defaultView: "Home",
    cardPageType: "home-page",
  },
  {
    id: "simmer",
    pack: "simmer",
    includePremium: false,
    template: null,
    title: "Simmer",
    badge: { label: "New", tone: "new" },
    blurb: "Kitchen electronics store for three products, with category picks, gallery and video",
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
  if (combo.pack === "lustre") {
    return {
      thumbUrl: `${LUSTRE_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${LUSTRE_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${LUSTRE_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "lustre-home",
    };
  }
  if (combo.pack === "velour") {
    return {
      thumbUrl: `${VELOUR_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${VELOUR_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${VELOUR_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "velour-home",
    };
  }
  if (combo.pack === "hearth") {
    return {
      thumbUrl: `${HEARTH_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${HEARTH_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${HEARTH_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "hearth-home",
    };
  }
  if (combo.pack === "simmer") {
    return {
      thumbUrl: `${SIMMER_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${SIMMER_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${SIMMER_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "simmer-home",
    };
  }
  if (combo.pack === "tempo") {
    // One house look for every category, so one fixed screenshot.
    return {
      thumbUrl: `${TEMPO_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${TEMPO_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${TEMPO_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "tempo-home",
    };
  }
  if (combo.pack === "maison") {
    // One house look for every category, so one fixed screenshot.
    return {
      thumbUrl: `${MAISON_PREVIEW_BASE}/store.jpg`,
      hoverImageUrl: `${MAISON_PREVIEW_BASE}/store.eye.jpg`,
      cardUrl: `${MAISON_PREVIEW_BASE}/store.eye-sm.jpg`,
      prebuiltHtmlUrl: null,
      demoVariant: "maison-home",
    };
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
