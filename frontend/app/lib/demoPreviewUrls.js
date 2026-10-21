/**
 * Versioned CDN URLs for prebuilt demo Liquid HTML + card/eye thumbnails.
 *
 * Prefer: npm run sync:demo-previews  (bumps version, builds HTML+JPG+eye JPG, uploads)
 * Watch:  npm run watch:demo-previews (rebuilds on demo source edits)
 *
 * Cards: .jpg. Eye modal: .html (spinner until iframe ready).
 */

import { getHomeDataForPreview } from "../routes/_app.generate_store/store/utils/default-magic-responses/home-data.js";
import { getProductImages } from "../routes/_app.generate_pdp/product-page/utils/default-magic-responses/index.js";

export const DEMO_PREVIEW_VERSION = "2026-09-20";

/** Bust browser cache for demo thumbs/HTML after S3 overwrite (immutable Cache-Control). */
export const DEMO_THUMB_CACHE_BUST = "20261021-amour-imgs2";

export const DEMO_PREVIEW_BUCKET =
  "https://product-images-zambeel.s3.eu-west-3.amazonaws.com";

export const DEMO_PREVIEW_PREFIX = `demo-previews/${DEMO_PREVIEW_VERSION}`;

function withThumbCacheBust(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${DEMO_THUMB_CACHE_BUST}`;
}

function normalizeCategory(category = "general") {
  return (
    String(category || "general")
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("-", "_") || "general"
  );
}

/**
 * @param {{ family: "store" | "pdp", variant: string, category?: string }} opts
 * @returns {string}
 */
export function getDemoPreviewUrl({ family, variant, category = "general" }) {
  const cat = normalizeCategory(category);
  // Bust HTML too — eye modal prefetches with force-cache + S3 immutable headers.
  return withThumbCacheBust(
    `${DEMO_PREVIEW_BUCKET}/${DEMO_PREVIEW_PREFIX}/${family}/${variant}/${cat}.html`,
  );
}

/**
 * Prebuilt card screenshot (WebP) next to the HTML on S3.
 * @param {{ family: "store" | "pdp", variant: string, category?: string }} opts
 * @returns {string}
 */
export function getDemoPreviewThumbUrl({ family, variant, category = "general" }) {
  const cat = normalizeCategory(category);
  return withThumbCacheBust(
    `${DEMO_PREVIEW_BUCKET}/${DEMO_PREVIEW_PREFIX}/${family}/${variant}/${cat}.jpg`,
  );
}

/** Derive card thumb URL from an HTML demo URL (same path, .jpg). */
export function demoHtmlUrlToThumbUrl(htmlUrl) {
  if (!htmlUrl || typeof htmlUrl !== "string") return null;
  return withThumbCacheBust(htmlUrl.replace(/\.html(?:\?.*)?$/i, ".jpg"));
}

/**
 * Tall eye-modal screenshot (same path, .eye.jpg). Falls back to card .jpg
 * in the renderer if the eye asset is missing.
 */
export function demoHtmlUrlToEyeThumbUrl(htmlUrl) {
  if (!htmlUrl || typeof htmlUrl !== "string") return null;
  return withThumbCacheBust(
    htmlUrl.replace(/\.html(?:\?.*)?$/i, ".eye.jpg").replace(/\?.*$/, ""),
  );
}

/**
 * @param {{ family: "store" | "pdp", variant: string, category?: string }} opts
 * @returns {string}
 */
export function getDemoPreviewEyeThumbUrl({
  family,
  variant,
  category = "general",
}) {
  const cat = normalizeCategory(category);
  return withThumbCacheBust(
    `${DEMO_PREVIEW_BUCKET}/${DEMO_PREVIEW_PREFIX}/${family}/${variant}/${cat}.eye.jpg`,
  );
}

/**
 * Instant card poster from existing CDN demo images (no screenshot required).
 * Used until/alongside .webp thumbs.
 */
export function getDemoCardPosterUrl({
  family = "store",
  variant = "classic-home",
  category = "general",
} = {}) {
  const cat = normalizeCategory(category);
  const v = String(variant || "").toLowerCase();

  const isProduct =
    family === "pdp" ||
    v.startsWith("product-") ||
    v === "sleek" ||
    v === "vibe";

  if (isProduct) {
    const vibe = v.includes("vibe");
    const imgs = getProductImages(cat, vibe ? { template: 2 } : {}) || {};
    return (
      imgs.product_image_1 ||
      imgs.product_image_2 ||
      imgs.banner_image ||
      null
    );
  }

  const pack = v.includes("cinematic")
    ? "cinematic"
    : v.includes("amour")
      ? "amour"
      : v.includes("classic-home-prepaid") || v.includes("product-prepaid")
      ? "classic-prepaid"
      : "classic";
  const storeType = v.includes("multi") ? "multi" : "single";
  const home = getHomeDataForPreview(storeType, cat, pack);
  const images = home?.images || {};
  return (
    images.banner_image ||
    images.product_impact_image ||
    images.product_image_1 ||
    images.feature_image ||
    null
  );
}

/** Store theme-card / modal demos */
export const STORE_DEMO_VARIANTS = Object.freeze({
  CLASSIC_HOME: "classic-home",
  /** Classic homepage without checkout — Linen card screenshot (heading on the banner). */
  LINEN_HOME: "linen-home",
  /** Single prepaid classic home (includes on-page checkout hero with product images). */
  CLASSIC_HOME_PREPAID: "classic-home-prepaid",
  CINEMATIC_HOME: "cinematic-home",
  MULTI_HOME: "multi-home",
  /** Luminous card: first homepage product, still and uncropped. */
  LUMINOUS_HOME: "luminous-home",
  /** Pulse homepage (classic layout, no checkout, Pulse copy and photos). */
  PULSE_HOME: "pulse-home",
  /** Eclipse homepage (cinematic layout, no checkout, Eclipse copy and photos). */
  ECLIPSE_HOME: "eclipse-home",
  /** The Collective multi homepage. */
  COLLECTIVE_HOME: "collective-home",
  /** Meridian multi homepage. */
  MERIDIAN_HOME: "meridian-home",
  PRODUCT_SLEEK: "product-sleek",
  PRODUCT_VIBE: "product-vibe",
  /** Single prepaid: checkout-on-page default PDP (not Sleek/Vibe). */
  PRODUCT_PREPAID: "product-prepaid",
  /** Linen product tab (homepage product photos, Sleek layout). */
  LINEN_PDP: "linen-pdp",
  /** Velvet product tab (cinematic homepage product photos, Vibe layout). */
  VELVET_PDP: "velvet-pdp",
  /** Amour homepage (single product, prepaid + COD, no premium PDP). */
  AMOUR_HOME: "amour-home",
});

/** Create-product-page template demos */
export const PDP_DEMO_VARIANTS = Object.freeze({
  SLEEK: "sleek",
  VIBE: "vibe",
});

/**
 * Resolve Home + Product CDN URLs for the store eye-modal (both needed for
 * Forge-style dual-pane keep-alive + prefetch).
 *
 * @param {{
 *   storeType?: string,
 *   marketType?: string,
 *   storeCategory?: string,
 *   pack?: string,
 *   productTemplate?: number|null,
 *   includePremium?: boolean|null,
 * }} opts
 * @returns {{ home: string, product: string }}
 */
export function resolveStoreDemoPairUrls({
  storeType = "single",
  marketType = "prepaid",
  storeCategory = "general",
  pack = "classic",
  productTemplate = 1,
  includePremium = null,
} = {}) {
  const cat = storeCategory || "general";
  const isMulti = storeType === "multi";
  const packLc = String(pack || "classic").toLowerCase();
  const template = Number(productTemplate) === 2 ? 2 : 1;

  let homeVariant = STORE_DEMO_VARIANTS.CLASSIC_HOME;
  if (isMulti && includePremium === false) {
    homeVariant = STORE_DEMO_VARIANTS.LUMINOUS_HOME;
  } else if (isMulti && includePremium === true && template === 2) {
    homeVariant = STORE_DEMO_VARIANTS.MERIDIAN_HOME;
  } else if (isMulti && includePremium === true) {
    homeVariant = STORE_DEMO_VARIANTS.COLLECTIVE_HOME;
  } else if (isMulti) {
    homeVariant = STORE_DEMO_VARIANTS.MULTI_HOME;
  } else if (includePremium === false) {
    homeVariant = STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID;
  } else if (packLc === "cinematic" && template === 1) {
    homeVariant = STORE_DEMO_VARIANTS.ECLIPSE_HOME;
  } else if (packLc === "cinematic") {
    homeVariant = STORE_DEMO_VARIANTS.CINEMATIC_HOME;
  } else if (template === 2) {
    homeVariant = STORE_DEMO_VARIANTS.PULSE_HOME;
  } else {
    homeVariant = STORE_DEMO_VARIANTS.LINEN_HOME;
  }

  // Luminous / Swift → simple PDP. Linen and Velvet use their own product HTML.
  // Pulse / Meridian → Vibe. Eclipse / Collective → Sleek.
  let productVariant = STORE_DEMO_VARIANTS.PRODUCT_SLEEK;
  if (includePremium === false) {
    productVariant = STORE_DEMO_VARIANTS.PRODUCT_PREPAID;
  } else if (!isMulti && packLc === "cinematic" && template === 2) {
    productVariant = STORE_DEMO_VARIANTS.VELVET_PDP;
  } else if (!isMulti && packLc !== "cinematic" && template !== 2) {
    productVariant = STORE_DEMO_VARIANTS.LINEN_PDP;
  } else if (template === 2) {
    productVariant = STORE_DEMO_VARIANTS.PRODUCT_VIBE;
  }

  return {
    home: getDemoPreviewUrl({
      family: "store",
      variant: homeVariant,
      category: cat,
    }),
    product: getDemoPreviewUrl({
      family: "store",
      variant: productVariant,
      category: cat,
    }),
  };
}

/** All store HTML URLs for a category — warm them so eye open is instant. */
export function listStoreDemoHtmlUrlsForCategory(category = "general") {
  const cat = normalizeCategory(category);
  return Object.values(STORE_DEMO_VARIANTS).map((variant) =>
    getDemoPreviewUrl({ family: "store", variant, category: cat }),
  );
}

export function listPdpDemoHtmlUrlsForCategory(category = "general") {
  const cat = normalizeCategory(category);
  return Object.values(PDP_DEMO_VARIANTS).map((variant) =>
    getDemoPreviewUrl({ family: "pdp", variant, category: cat }),
  );
}
