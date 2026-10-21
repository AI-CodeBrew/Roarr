/**
 * Amour theme accents by store category.
 * Beauty/perfume stays dark wine; kids/fashion use bright accents (not full-dark).
 */

export const AMOUR_CATEGORY_THEME = {
  health_beauty: {
    accent: "#6B0808",
    blush: "#FFE3DE",
    label: "dark wine",
  },
  fashion: {
    accent: "#EC4899",
    blush: "#FFF0F6",
    label: "bright pink",
  },
  kids_toys: {
    accent: "#EA580C",
    blush: "#FFF7ED",
    label: "bright playful",
  },
  home_kitchen: {
    accent: "#6C4E2D",
    blush: "#F5EDE4",
    label: "warm wood",
  },
  car_accessories: {
    accent: "#2563EB",
    blush: "#EFF6FF",
    label: "bright blue",
  },
  general: {
    accent: "#64748B",
    blush: "#F1F5F9",
    label: "soft slate",
  },
};

const FALLBACK = AMOUR_CATEGORY_THEME.general;

export function getAmourCategoryTheme(category) {
  const key = String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return AMOUR_CATEGORY_THEME[key] || FALLBACK;
}

export function getAmourAccentForCategory(category, overrideHex) {
  const raw = typeof overrideHex === "string" ? overrideHex.trim() : "";
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return getAmourCategoryTheme(category).accent;
}

/**
 * Deep-clone Amour home settings with category (or override) accent/blush applied.
 */
export function withAmourCategoryColors(homeSettings, category, accentOverride) {
  const theme = getAmourCategoryTheme(category);
  const accent = getAmourAccentForCategory(category, accentOverride);
  const blush = theme.blush;
  const out = {};
  for (const [key, settings] of Object.entries(homeSettings || {})) {
    if (!settings || typeof settings !== "object") {
      out[key] = settings;
      continue;
    }
    const next = { ...settings };
    if ("accent_color" in next) next.accent_color = accent;
    if ("blush_color" in next) next.blush_color = blush;
    out[key] = next;
  }
  return out;
}
