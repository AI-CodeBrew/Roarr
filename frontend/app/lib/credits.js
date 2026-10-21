/**
 * Credits library — frontend mirror of the Python `app/constants/credits.py`.
 *
 * Source of truth still lives in the backend (balance + optional Dynamo
 * per-country prices, returned with /api/credits/balance), but having the same
 * shape locally lets us render
 * cost labels and pack info without waiting on the network roundtrip.
 *
 * If the backend changes feature costs or pack pricing, these constants are
 * still safe to render — `useCredits()` uses the live values returned by
 * the balance endpoint and falls back to these defaults.
 */

export const FEATURE_COSTS_DEFAULT = Object.freeze({
  store_creation: 300,
  page_generation: 200,
  // Aura (template 3) product page — all categories.
  page_generation_glow: 150,
  image_regenerate: 5,
  // Brand ads: one campaign produces 3 creatives at 10 credits each = 30.
  brand_ads_campaign: 30,
});

/** Entire-store generation credits by mode + market (mirrors backend STORE_CREATION_COSTS). */
export const STORE_CREATION_COSTS_DEFAULT = Object.freeze({
  multi_product: Object.freeze({ cod: 900, prepaid: 900 }),
  multi_product_basic: Object.freeze({ cod: 300, prepaid: 300 }),
  single_product: Object.freeze({ cod: 500, prepaid: 500 }),
  single_product_basic: Object.freeze({ cod: 500, prepaid: 300 }),
});

/** Linen (classic homepage + Sleek PDP) on single-product prepaid and COD. */
export const LINEN_SINGLE_STORE_CREDITS = 300;

/** Amour (editorial homepage + simple product page) on single prepaid and COD. Mirrors backend AMOUR_SINGLE_STORE_CREDITS. */
export const AMOUR_SINGLE_STORE_CREDITS = 300;

export const CREDIT_PACKS_DEFAULT = Object.freeze({
  starter: {
    name: "Starter",
    price: "20.00",
    credits: 600,
    description: "Try us out, build a few product pages.",
  },
  value: {
    name: "Value",
    price: "39.00",
    credits: 1200,
    description: "Best value for growing stores.",
  },
  agency: {
    name: "Growth",
    price: "69.00",
    credits: 2500,
    description: "For agencies and high-volume merchants.",
  },
});

export const PACK_ORDER = ["starter", "value", "agency"];

export const FEATURE_LABELS = Object.freeze({
  store_creation: "Revamp Entire Store",
  page_generation: "Generate Product Page",
  page_generation_glow: "Generate Product Page",
  image_regenerate: "Image Regeneration",
  brand_ads_campaign: "Brand Ads Campaign",
});

/**
 * Format a credit count with thousand separators, e.g. 1200 -> "1,200 cr" or "1,200 credits".
 */
export function formatCredits(n, unit = "cr") {
  const num = Number(n) || 0;
  const suffix = unit ? ` ${unit}` : "";
  return `${num.toLocaleString()}${suffix}`;
}

/**
 * Resolved cost for `featureKey` using API-backed costs when provided, else defaults.
 */
/** Feature key for a product page: Aura (template 3) has its own price. */
export function pageGenerationFeatureKey(_category, template) {
  return Number(template) === 3 ? "page_generation_glow" : "page_generation";
}

export function resolveFeatureCost(featureKey, featureCosts) {
  const raw =
    featureCosts?.[featureKey] ?? FEATURE_COSTS_DEFAULT[featureKey] ?? 0;
  return Number(raw) || 0;
}

/**
 * Credits to generate an entire store for store type + market.
 * @param {"single" | "multi" | "single_product" | "multi_product"} storeType
 * @param {"cod" | "prepaid" | string | null | undefined} marketType
 * @param {object | null | undefined} storeCreationCosts API-backed tier map
 * @param {"classic" | "cinematic" | string | null | undefined} storeTemplatePack
 * @param {boolean} [includePremiumPdps=true] Multi only: false → store-only (300)
 * @param {number|null} [selectedTemplate] 1 = Sleek (Linen when classic), 2 = Vibe
 */
export function getStoreCreationCost(
  storeType,
  marketType,
  storeCreationCosts = STORE_CREATION_COSTS_DEFAULT,
  storeTemplatePack = "classic",
  includePremiumPdps = true,
  selectedTemplate = null,
) {
  const mode =
    storeType === "multi" || storeType === "multi_product"
      ? "multi_product"
      : "single_product";
  const pack = String(storeTemplatePack || "classic").trim().toLowerCase();
  // Amour: homepage-only single store. Same 300 credits on prepaid and COD.
  if (mode === "single_product" && pack === "amour") {
    return AMOUR_SINGLE_STORE_CREDITS;
  }
  // Linen is classic + Sleek. Same 300 credits on prepaid and COD.
  if (
    mode === "single_product" &&
    includePremiumPdps &&
    pack === "classic" &&
    Number(selectedTemplate) === 1
  ) {
    return LINEN_SINGLE_STORE_CREDITS;
  }
  const market =
    String(marketType || "prepaid").trim().toLowerCase() === "cod"
      ? "cod"
      : "prepaid";
  const tiers =
    storeCreationCosts && typeof storeCreationCosts === "object"
      ? storeCreationCosts
      : STORE_CREATION_COSTS_DEFAULT;
  // Single + multi: with premium PDPs vs store-only / Classic prepaid.
  // storeTemplatePack kept for call-site compatibility.
  void storeTemplatePack;
  const modeKey =
    !includePremiumPdps && mode === "multi_product"
      ? "multi_product_basic"
      : !includePremiumPdps && mode === "single_product"
        ? "single_product_basic"
        : mode;
  const modeTier = tiers[modeKey] || tiers[mode] || tiers.single_product || {};
  const raw = modeTier[market] ?? modeTier.prepaid ?? FEATURE_COSTS_DEFAULT.store_creation;
  return Number(raw) || 0;
}

/**
 * Whether the wallet can afford `cost`. Zero cost is always allowed.
 */
export function hasEnoughCredits(balance, cost) {
  const c = Number(cost) || 0;
  if (c <= 0) return true;
  return typeof balance === "number" && balance >= c;
}

function isTruthyShopFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value == null || value === 0) return false;
  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

/** Internal / allow_bypass shops skip purchase and credit-spend gates. */
export function shopSkipsCreditGates(storeDetails) {
  return (
    isTruthyShopFlag(storeDetails?.is_internal) ||
    isTruthyShopFlag(storeDetails?.allow_bypass)
  );
}

/**
 * Cost label suitable for inline use in buttons:
 * "Generate page (200 cr)".
 */
export function costLabel(feature, costs = FEATURE_COSTS_DEFAULT) {
  const cost = costs?.[feature] ?? FEATURE_COSTS_DEFAULT[feature];
  if (cost == null) return "";
  return `(${formatCredits(cost)})`;
}

/**
 * USD price label for a pack: "$20.00".
 */
export function priceLabel(pack) {
  if (!pack?.price) return "";
  const num = Number(pack.price);
  if (Number.isNaN(num)) return `$${pack.price}`;
  return `$${num.toFixed(2)}`;
}

/**
 * Per-credit cost-effectiveness for the pack picker.
 * Returns "$0.040 / credit", lower is better.
 */
export function costPerCredit(pack) {
  const price = Number(pack?.price);
  const credits = Number(pack?.credits);
  if (!price || !credits) return "";
  return `$${(price / credits).toFixed(3)} / credit`;
}

/**
 * Detect a 402 response from a Remix action / fetch and extract the
 * insufficient-credits payload from the backend (which has shape
 * { balance, required, feature, error }).
 *
 * Returns null if the response was not a 402 / does not match the shape.
 * Otherwise returns { balance, required, feature, message }.
 */
export function parseInsufficientCredits(response, parsedBody) {
  if (!response || response.status !== 402) return null;
  const body = parsedBody || {};
  if (typeof body.balance !== "number" || typeof body.required !== "number") {
    return null;
  }
  return {
    balance: body.balance,
    required: body.required,
    feature: body.feature || null,
    message: body.error || "Insufficient credits.",
  };
}
