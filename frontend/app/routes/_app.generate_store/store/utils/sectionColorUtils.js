/**
 * Per-section Shopify-style color schemes for Entire Store preview + publish.
 *
 * Stored on home_page.section_colors[sectionKey] as:
 *   {
 *     color_scheme: { background, foreground, primary_button_background, ... },
 *     faq_color_scheme: { ... },   // only slots that exist on that section
 *   }
 *
 * Legacy formats still accepted:
 *   "#RRGGBB" → primary button on color_scheme
 *   { background, button, text } → mapped into color_scheme fields
 */

import { liquidPreviewSectionIdToTemplatePath } from "../../../../lib/liquidTemplateDisplayNames.js";
import { SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/home/single-product.js";
import { MULTI_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/home/multi-product.js";
import { CINEMATIC_SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/packs/cinematic/single-product.js";
import { AMOUR_SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/packs/amour/single-product.js";

/** Preview section key → live theme section `type` (templates/index.json). */
export const PREVIEW_SECTION_KEY_TO_LIVE_TYPES = {
  "pf-k-hero-peek-slider": ["kluck-ai-home-hero-section"],
  "pf-inline-headline": ["kluck-ai-headline-section"],
  "pf-collection-showcase": ["kluck-ai-collection-showcase-section"],
  "pf-feature-product-section": ["kluck-ai-feature-product-section"],
  "pf-testimonials01": ["kluck-ai-testimonials-section"],
  "pf-product-grid1x1": ["kluck-ai-tabbed-grid-section"],
  "marquee-scrolling-banner": ["kluck-ai-marquee-section-2"],
  "pf-split-feature": ["kluck-ai-image-with-text-3-section"],
  "pf-trust-badges": ["kluck-ai-trust-badge-2-section", "kluck-ai-trust-badge-section"],
  "pf-selected-prod-3in1": ["kluck-ai-product-column-section"],
  "pf-faq-splitimage": ["kluck-ai-faq-section-home-1"],
  "pf-custom-new-image-with-text": ["kluck-ai-image-with-text-section", "kluck-ai-image-with-text-1-section"],
  "pf-new-features-center-image": ["kluck-ai-features-center-section"],
  "pf-new-ingreds-features": ["kluck-ai-image-with-text-2-section"],
  "pf-new-default-product-hero": ["kluck-ai-product-hero-section"],
  "infinite-marquee": ["kluck-ai-infinite-marquee-section"],
  "pf-product-lookbook": ["kluck-ai-product-lookbook-section"],
  "collection-list": ["kluck-ai-collection-list-section"],
  // Live cinematic section types match liquid filenames (no `-section` suffix).
  "pf-cinematic-hero": ["kluck-ai-cinematic-hero", "kluck-ai-home-hero-section"],
  "pf-cinematic-announcement": ["kluck-ai-cinematic-announcement"],
  "pf-cinematic-trust": ["kluck-ai-cinematic-trust"],
  "pf-cinematic-product-story": ["kluck-ai-cinematic-product-story"],
  "pf-cinematic-inspiration": ["kluck-ai-cinematic-inspiration"],
  "pf-cinematic-feature-ticker": ["kluck-ai-cinematic-feature-ticker"],
  "pf-cinematic-why-shop": ["kluck-ai-cinematic-why-shop"],
  "pf-cinematic-feature-orbit": ["kluck-ai-cinematic-feature-orbit"],
  "pf-cinematic-reviews": ["kluck-ai-cinematic-reviews", "kluck-ai-testimonials-section"],
  "pf-cinematic-faq": ["kluck-ai-cinematic-faq", "kluck-ai-faq-section-home-1"],
  "pf-cinematic-sticky-bar": ["kluck-ai-cinematic-sticky-bar"],
  "pf-amour-hero": ["kluck-ai-amour-hero"],
  "pf-amour-showcase": ["kluck-ai-amour-showcase"],
  "pf-amour-countdown": ["kluck-ai-amour-countdown"],
  "pf-amour-lookbook": ["kluck-ai-amour-lookbook"],
  "pf-amour-ribbons": ["kluck-ai-amour-ribbons"],
  "pf-amour-split": ["kluck-ai-amour-split"],
  "pf-amour-editorial": ["kluck-ai-amour-editorial"],
  "pf-amour-banner": ["kluck-ai-amour-banner"],
  "pf-amour-story": ["kluck-ai-amour-story"],
  "pf-amour-reviews": ["kluck-ai-amour-reviews"],
  "pf-amour-tabs": ["kluck-ai-amour-tabs"],
  "pf-amour-promise": ["kluck-ai-amour-promise"],
  "pf-amour-gallery": ["kluck-ai-amour-gallery"],
};

/**
 * Shopify-like color scheme fields (what merchants edit in theme editor).
 * Each maps 1:1 to a CSS variable — changing one does not rewrite the others.
 */
export const SHOPIFY_SCHEME_COLOR_FIELDS = [
  { key: "background", label: "Background", cssVar: "--color-background" },
  { key: "foreground_heading", label: "Heading", cssVar: "--color-foreground-heading" },
  { key: "foreground", label: "Text", cssVar: "--color-foreground" },
  {
    key: "primary_button_background",
    label: "Primary button",
    cssVar: "--color-primary-button-background",
  },
  {
    key: "primary_button_text",
    label: "Primary button label",
    cssVar: "--color-primary-button-text",
  },
  {
    key: "secondary_button_background",
    label: "Secondary button",
    cssVar: "--color-secondary-button-background",
  },
  {
    key: "secondary_button_text",
    label: "Secondary button label",
    cssVar: "--color-secondary-button-text",
  },
];

/** Minimal surface colors (no CTAs). */
const FIELDS_SURFACE = ["background", "foreground_heading", "foreground"];
/** Surface + one CTA. */
const FIELDS_WITH_PRIMARY = [
  "background",
  "foreground_heading",
  "foreground",
  "primary_button_background",
  "primary_button_text",
];
/** Surface + primary + secondary CTAs. */
const FIELDS_WITH_BOTH_BUTTONS = [
  "background",
  "foreground_heading",
  "foreground",
  "primary_button_background",
  "primary_button_text",
  "secondary_button_background",
  "secondary_button_text",
];
/** Nested card / FAQ panel schemes — usually fill + type only. */
const FIELDS_NESTED_PANEL = ["background", "foreground_heading", "foreground"];

/**
 * Which Shopify color fields exist on each section’s main scheme.
 * Derived from liquid/CSS usage so the editor only shows real controls.
 */
export const SECTION_COLOR_FIELD_KEYS = {
  "pf-k-hero-peek-slider": [
    "background",
    "foreground",
    "primary_button_background",
    "primary_button_text",
  ],
  "pf-inline-headline": FIELDS_SURFACE,
  "marquee-scrolling-banner": ["background", "foreground"],
  "infinite-marquee": ["background", "foreground"],
  "collection-list": FIELDS_SURFACE,
  "pf-collection-showcase": FIELDS_WITH_BOTH_BUTTONS,
  "pf-feature-product-section": FIELDS_WITH_BOTH_BUTTONS,
  "pf-feature-banner": FIELDS_WITH_BOTH_BUTTONS,
  "pf-custom-new-image-with-text": [
    "background",
    "foreground",
    "primary_button_background",
    "primary_button_text",
  ],
  "pf-faq-splitimage": FIELDS_WITH_PRIMARY,
  "pf-new-features-center-image": FIELDS_SURFACE,
  "pf-new-ingreds-features": FIELDS_SURFACE,
  "pf-product-grid1x1": FIELDS_WITH_PRIMARY,
  "pf-product-lookbook": FIELDS_WITH_PRIMARY,
  "pf-selected-prod-3in1": FIELDS_WITH_PRIMARY,
  "pf-split-feature": FIELDS_WITH_PRIMARY,
  "pf-testimonials01": FIELDS_SURFACE,
  "pf-trust-badges": ["background", "foreground"],
  "pf-new-default-product-hero": FIELDS_WITH_BOTH_BUTTONS,
  "pf-cinematic-hero": FIELDS_WITH_PRIMARY,
  "pf-cinematic-announcement": ["background", "foreground"],
  "pf-cinematic-trust": FIELDS_SURFACE,
  "pf-cinematic-product-story": FIELDS_WITH_PRIMARY,
  "pf-cinematic-inspiration": ["background", "foreground", "primary_button_background", "primary_button_text"],
  "pf-cinematic-feature-ticker": FIELDS_SURFACE,
  "pf-cinematic-why-shop": FIELDS_SURFACE,
  "pf-cinematic-feature-orbit": FIELDS_WITH_PRIMARY,
  "pf-cinematic-reviews": FIELDS_SURFACE,
  "pf-cinematic-faq": FIELDS_SURFACE,
  "pf-cinematic-sticky-bar": [
    "background",
    "foreground",
    "primary_button_background",
    "primary_button_text",
  ],  "pf-amour-hero": FIELDS_WITH_PRIMARY,
  "pf-amour-showcase": FIELDS_WITH_PRIMARY,
  "pf-amour-countdown": FIELDS_WITH_PRIMARY,
  "pf-amour-lookbook": FIELDS_WITH_PRIMARY,
  "pf-amour-ribbons": FIELDS_WITH_PRIMARY,
  "pf-amour-split": FIELDS_WITH_PRIMARY,
  "pf-amour-editorial": FIELDS_WITH_PRIMARY,
  "pf-amour-banner": FIELDS_WITH_PRIMARY,
  "pf-amour-story": FIELDS_WITH_PRIMARY,
  "pf-amour-reviews": FIELDS_WITH_PRIMARY,
  "pf-amour-tabs": FIELDS_WITH_PRIMARY,
  "pf-amour-promise": FIELDS_WITH_PRIMARY,
  "pf-amour-gallery": FIELDS_WITH_PRIMARY,
};

/**
 * Fields available for a section + scheme slot.
 * Nested slots (cards / FAQ / badges) only expose panel colors.
 */
export function getSchemeFieldsForSection(sectionKey, slotKey = "color_scheme") {
  const slot = String(slotKey || "color_scheme");
  if (
    slot !== "color_scheme" &&
    slot !== "section_color_scheme" &&
    slot.endsWith("_color_scheme")
  ) {
    // Cards / FAQ / badges / containers — panel colors only
    return SHOPIFY_SCHEME_COLOR_FIELDS.filter((f) =>
      FIELDS_NESTED_PANEL.includes(f.key),
    );
  }
  const keys = SECTION_COLOR_FIELD_KEYS[sectionKey] || FIELDS_SURFACE;
  const set = new Set(keys);
  return SHOPIFY_SCHEME_COLOR_FIELDS.filter((f) => set.has(f.key));
}

/** @deprecated kept for old editor imports */
export const SECTION_COLOR_ROLES = [
  { key: "background", label: "Background" },
  { key: "button", label: "Primary button" },
  { key: "text", label: "Text" },
];

const SLOT_LABELS = {
  color_scheme: "Section",
  section_color_scheme: "Section",
  card_color_scheme: "Cards",
  faq_color_scheme: "FAQ",
  badge_color_scheme: "Badges",
  container_color_scheme: "Container",
  panel_color_scheme: "Panel",
  form_color_scheme: "Form",
  col_2_color_scheme: "Column 2",
  col_3_color_scheme: "Column 3",
};

export function resolveHomeSectionKey(selectedSection) {
  if (!selectedSection) return null;
  let normalized = String(selectedSection);
  const fromWrapper = liquidPreviewSectionIdToTemplatePath(normalized);
  if (fromWrapper) normalized = fromWrapper;
  if (normalized.startsWith("home/")) normalized = normalized.slice(5);
  if (normalized.startsWith("packs/cinematic/home/")) {
    normalized = normalized.slice("packs/cinematic/home/".length);
  }
  if (normalized.startsWith("packs/amour/home/")) {
    normalized = normalized.slice("packs/amour/home/".length);
  }
  if (normalized.startsWith("product/")) {
    normalized = normalized.slice("product/".length);
  }
  if (normalized.includes("_") && !normalized.includes("/")) {
    const withoutSuffix = normalized.replace(/_(\d+)$/, "");
    normalized = withoutSuffix.replace(/_/g, "-");
  }
  return normalized || null;
}

export function normalizeHexColor(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

function humanizeSlotKey(key) {
  if (SLOT_LABELS[key]) return SLOT_LABELS[key];
  return String(key)
    .replace(/_color_scheme$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function lookupSectionSettings(sectionKey) {
  if (!sectionKey) return null;
  return (
    SINGLE_PRODUCT_HOME_SETTINGS[sectionKey] ||
    MULTI_PRODUCT_HOME_SETTINGS[sectionKey] ||
    CINEMATIC_SINGLE_PRODUCT_HOME_SETTINGS[sectionKey] ||
    AMOUR_SINGLE_PRODUCT_HOME_SETTINGS[sectionKey] ||
    null
  );
}

/**
 * Color scheme slots that exist on this section (Shopify: each color_scheme setting).
 * @returns {{ key: string, label: string, defaultScheme: string }[]}
 */
export function getSectionColorSchemeSlots(sectionKey) {
  const settings = lookupSectionSettings(sectionKey) || {};
  const slots = [];
  for (const key of Object.keys(settings)) {
    if (key === "blocks" || key === "homeData") continue;
    if (key === "color_scheme" || key.endsWith("_color_scheme")) {
      const def = typeof settings[key] === "string" ? settings[key] : "scheme-1";
      slots.push({
        key,
        label: humanizeSlotKey(key),
        defaultScheme: def || "scheme-1",
      });
    }
  }
  if (slots.length === 0) {
    slots.push({
      key: "color_scheme",
      label: "Section",
      defaultScheme: "scheme-1",
    });
  }
  return slots;
}

export function schemeSlugForSectionKey(sectionKey) {
  return String(sectionKey || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function schemeSlugForSlot(slotKey) {
  return String(slotKey || "color_scheme")
    .trim()
    .toLowerCase()
    .replace(/_color_scheme$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "section";
}

/** Custom scheme id for a section + slot, e.g. scheme-roarr-pf-faq-faq */
export function schemeIdForSectionSlot(sectionKey, slotKey = "color_scheme") {
  const sec = schemeSlugForSectionKey(sectionKey);
  const slot = schemeSlugForSlot(slotKey);
  if (!sec) return "scheme-roarr-section";
  // Primary section slot keeps shorter id for backwards compat
  if (slotKey === "color_scheme" || slotKey === "section_color_scheme") {
    return `scheme-roarr-${sec}`;
  }
  return `scheme-roarr-${sec}-${slot}`;
}

export function schemeIdForSectionKey(sectionKey) {
  return schemeIdForSectionSlot(sectionKey, "color_scheme");
}

/** Default Shopify scheme colors (scheme-1 light), with optional accent on primary button. */
export function getDefaultSchemeFieldValues(baseScheme = "scheme-1", globalAccent = "#BCA38F") {
  const accent = normalizeHexColor(globalAccent) || "#BCA38F";
  if (String(baseScheme).includes("2")) {
    return {
      background: accent,
      foreground_heading: "#FFFFFF",
      foreground: "#FFFFFF",
      primary_button_background: "#FFFFFF",
      primary_button_text: accent,
      secondary_button_background: "#FFFFFFB0",
      secondary_button_text: "#000000",
    };
  }
  return {
    background: "#FFFFFF",
    foreground_heading: "#000000",
    foreground: "#000000",
    primary_button_background: accent,
    primary_button_text: "#FFFFFF",
    secondary_button_background: "#E6E6E6",
    secondary_button_text: "#000000",
  };
}

/**
 * Normalize stored entry for one section into { [slotKey]: { field: hex } }.
 */
export function normalizeSectionColorEntry(value) {
  if (typeof value === "string") {
    const button = normalizeHexColor(value);
    return button
      ? { color_scheme: { primary_button_background: button } }
      : {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  // Legacy flat { background, button, text }
  if (
    value.background != null ||
    value.button != null ||
    value.text != null ||
    value.accent != null
  ) {
    const hasSlotKeys = Object.keys(value).some(
      (k) => k === "color_scheme" || k.endsWith("_color_scheme"),
    );
    if (!hasSlotKeys) {
      const flat = {};
      const bg = normalizeHexColor(value.background);
      const btn = normalizeHexColor(value.button ?? value.accent);
      const tx = normalizeHexColor(value.text);
      if (bg) flat.background = bg;
      if (btn) flat.primary_button_background = btn;
      if (tx) {
        flat.foreground = tx;
        flat.foreground_heading = tx;
      }
      return Object.keys(flat).length ? { color_scheme: flat } : {};
    }
  }

  const out = {};
  for (const [slotKey, fields] of Object.entries(value)) {
    if (!(slotKey === "color_scheme" || slotKey.endsWith("_color_scheme"))) continue;
    if (!fields || typeof fields !== "object") continue;
    const cleaned = {};
    for (const field of SHOPIFY_SCHEME_COLOR_FIELDS) {
      const hex = normalizeHexColor(fields[field.key]);
      if (hex) cleaned[field.key] = hex;
    }
    // Also accept legacy button key inside a slot
    const legacyBtn = normalizeHexColor(fields.button ?? fields.accent);
    if (legacyBtn && !cleaned.primary_button_background) {
      cleaned.primary_button_background = legacyBtn;
    }
    if (Object.keys(cleaned).length) out[slotKey] = cleaned;
  }
  return out;
}

/** @deprecated */
export function normalizeSectionColorEntryLegacyRoles(value) {
  const n = normalizeSectionColorEntry(value);
  const main = n.color_scheme || {};
  return {
    background: main.background || null,
    button: main.primary_button_background || null,
    text: main.foreground || null,
  };
}

export function sectionHasCustomColors(entry) {
  const n = normalizeSectionColorEntry(entry);
  return Object.keys(n).length > 0;
}

/**
 * Resolve display values for one slot = defaults merged with overrides.
 */
export function resolveSlotColorFields(sectionKey, slotKey, entry, globalAccent) {
  const slots = getSectionColorSchemeSlots(sectionKey);
  const slotMeta = slots.find((s) => s.key === slotKey) || slots[0];
  const defaults = getDefaultSchemeFieldValues(
    slotMeta?.defaultScheme || "scheme-1",
    globalAccent,
  );
  const normalized = normalizeSectionColorEntry(entry);
  const overrides = normalized[slotKey] || normalized.color_scheme || {};
  return { ...defaults, ...overrides };
}

/**
 * Map of sectionKey → normalized slot→fields (only sections with overrides).
 */
export function getSectionColorsMap(homeData) {
  const raw = homeData?.section_colors;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key) continue;
    const entry = normalizeSectionColorEntry(value);
    if (Object.keys(entry).length) out[key] = entry;
  }
  return out;
}

/** Apply custom scheme ids onto the matching *color_scheme settings only. */
export function applySectionColorSchemesToSettings(settings, sectionKey, sectionEntry) {
  const normalized = normalizeSectionColorEntry(sectionEntry);
  if (!settings || typeof settings !== "object" || !Object.keys(normalized).length) {
    return settings;
  }
  const next = { ...settings };
  for (const slotKey of Object.keys(normalized)) {
    next[slotKey] = schemeIdForSectionSlot(sectionKey, slotKey);
  }
  return next;
}

/** @deprecated */
export function applySchemeIdToSectionSettings(settings, schemeId) {
  if (!settings || typeof settings !== "object") {
    return { color_scheme: schemeId };
  }
  const next = { ...settings };
  next.color_scheme = schemeId;
  if ("section_color_scheme" in next) next.section_color_scheme = schemeId;
  return next;
}

export function liveTypesForSectionKey(sectionKey) {
  return PREVIEW_SECTION_KEY_TO_LIVE_TYPES[sectionKey] || [];
}

/** Build CSS custom properties block for one scheme class from field map. */
export function schemeFieldsToCssVars(fields) {
  const f = fields || {};
  const bg = f.background || "#FFFFFF";
  const heading = f.foreground_heading || f.foreground || "#000000";
  const text = f.foreground || "#000000";
  const btnBg = f.primary_button_background || "#000000";
  const btnText = f.primary_button_text || "#FFFFFF";
  const secBg = f.secondary_button_background || "#E6E6E6";
  const secText = f.secondary_button_text || "#000000";
  return {
    "--color-background": bg,
    "--color-foreground-heading": heading,
    "--color-foreground": text,
    "--color-foreground-muted": text,
    "--color-primary": text,
    "--color-primary-hover": text,
    "--color-border": "#0000000f",
    "--color-shadow": "#000000",
    "--color-primary-button-background": btnBg,
    "--color-primary-button-text": btnText,
    "--color-primary-button-border": "rgba(0,0,0,0)",
    "--color-primary-button-hover-background": btnBg,
    "--color-primary-button-hover-text": btnText,
    "--color-primary-button-hover-border": btnBg,
    "--color-secondary-button-background": secBg,
    "--color-secondary-button-text": secText,
    "--color-secondary-button-border": secBg,
    "--color-secondary-button-hover-background": btnBg,
    "--color-secondary-button-hover-text": btnText,
    "--color-secondary-button-hover-border": btnBg,
    "--color-accent": btnBg,
    "--color-accent-soft": bg,
    "--color-on-accent": btnText,
    "--color-on-accent-muted": text,
  };
}
