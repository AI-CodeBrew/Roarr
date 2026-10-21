/**
 * Category-based defaults for home page (fonts + prompt content).
 * Hardcoded per category - no template settings lookup.
 */

const CATEGORY_DEFAULTS = {
  car_accessories: {
    headingFont: "Rajdhani",
    bodyFont: "Barlow",
    eyebrow: "Relaxation",
    heading: "Transform Your Routine",
  },
  fashion: {
    headingFont: "Oswald",
    bodyFont: "Roboto",
    eyebrow: "Transform Your Routine",
    heading: "Discover what makes us different.",
  },
  health_beauty: {
    headingFont: "Barlow Condensed",
    bodyFont: "Barlow",
    eyebrow: "Relaxation",
    heading: "Transform Your Routine",
  },
  kids_toys: {
    headingFont: "Dosis",
    bodyFont: "DM Sans",
    eyebrow: "Relaxation",
    heading: "Transform Your Routine",
  },
  home_kitchen: {
    headingFont: "Merriweather",
    bodyFont: "Muli",
    eyebrow: "Relaxation",
    heading: "Transform Your Routine",
  },
  general: {
    headingFont: "Montserrat",
    bodyFont: "Open Sans",
    eyebrow: "Transform Your Routine",
    heading: "Discover what makes us different.",
  },
};

function normalizeCategory(category) {
  const c = (category || "").toLowerCase().trim().replace(/-/g, "_");
  if (c.includes("health") || c.includes("beauty")) return "health_beauty";
  if (c.includes("home") || c.includes("kitchen")) return "home_kitchen";
  if (c.includes("fashion") || c.includes("apparel")) return "fashion";
  if (c.includes("car") || c.includes("vehicle")) return "car_accessories";
  if (c.includes("kids") || c.includes("toys") || c.includes("children")) return "kids_toys";
  return "general";
}

/**
 * Get category defaults for home page (fonts + prompt content).
 * @param {string} category - e.g. "car_accessories", "health_beauty", "general"
 * @returns {{ headingFont: string, bodyFont: string, eyebrow: string, heading: string }}
 */
export function getCategoryTemplate1Defaults(category) {
  const key = normalizeCategory(category);
  return CATEGORY_DEFAULTS[key] ?? CATEGORY_DEFAULTS.general;
}
