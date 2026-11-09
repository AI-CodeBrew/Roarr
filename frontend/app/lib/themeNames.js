/**
 * Theme display names for analytics and lists.
 * Keep in sync with the theme cards in StoreFlowStructure / ProductFlowStructure.
 */

/**
 * Product page theme name from template number + category.
 * @param {number|string|null|undefined} template 3 = Aura, 4 = Lumenook, 5 = Noir, 6 = Frost, 7 = Atelier, 8 = Bloom (all categories); 1/2 legacy Sleek/Vibe
 * @param {string|null|undefined} category
 * @returns {string}
 */
export function getProductPageThemeName(template, _category) {
  const n = Number(template);
  if (n === 8) return "Bloom";
  if (n === 7) return "Atelier";
  if (n === 6) return "Frost";
  if (n === 5) return "Noir";
  if (n === 4) return "Lumenook";
  if (n === 3) return "Aura";
  if (n === 2) return "Vibe";
  return "Sleek";
}

/**
 * Entire-store theme name from the generation settings.
 * @param {{
 *   storeType?: "single" | "multi" | string,
 *   pack?: string | null,
 *   template?: number | string | null,
 *   includePremium?: boolean,
 *   marketType?: string | null,
 * }} opts
 * @returns {string}
 */
export function getStoreThemeName({
  storeType = "single",
  pack = "classic",
  template = null,
  includePremium = true,
} = {}) {
  const packKey = String(pack || "classic").trim().toLowerCase();
  const vibe = Number(template) === 2;

  if (storeType === "multi" || storeType === "multi_product") {
    if (packKey === "lustre") return "Lustre";
    if (packKey === "velour") return "Velour";
    if (packKey === "hearth") return "Hearth";
    if (packKey === "simmer") return "Simmer";
    return packKey === "lumenook" ? "Lumenook" : "Swift";
  }

  if (packKey === "maison") return "Maison";
  if (packKey === "tempo") return "Tempo";
  if (!includePremium) return "Swift";
  if (packKey === "amour") return "Amour";
  if (packKey === "cinematic") return vibe ? "Velvet" : "Eclipse";
  return vibe ? "Pulse" : "Linen";
}
