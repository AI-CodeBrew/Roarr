/**
 * Dynamic CSS generation from StoreFlow style preferences.
 * Only ONE dynamic color changes in schemes; all other colors are fixed (theme-settings.json).
 * scheme-1: dynamicColor → primary_button_background
 * scheme-2: dynamicColor → background, primary_button_text, primary_button_hover_background
 */

// Font display name → Google Fonts API slug
const GOOGLE_FONT_SLUGS = {
  Poppins: "Poppins",
  Montserrat: "Montserrat",
  Inter: "Inter",
  "Playfair Display": "Playfair+Display",
  Lora: "Lora",
  Roboto: "Roboto",
  "Open Sans": "Open+Sans",
  Nunito: "Nunito",
  "Source Sans 3": "Source+Sans+3",
  Oswald: "Oswald",
  Rajdhani: "Rajdhani",
  Barlow: "Barlow",
  "Barlow Condensed": "Barlow+Condensed",
  Dosis: "Dosis",
  "DM Sans": "DM+Sans",
  Merriweather: "Merriweather",
  Muli: "Muli",
  Comfortaa: "Comfortaa",
  Prompt: "Prompt",
};

function toGoogleFontUrl(fontName) {
  const slug = GOOGLE_FONT_SLUGS[fontName] || fontName.replace(/\s+/g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${slug}:wght@400;500;600;700&display=swap');`;
}

/**
 * Generate color scheme CSS from stylePreferences.dynamicColor (single color).
 * Only dynamicColor changes; all other values fixed per theme-settings.json.
 * scheme-1: dynamicColor → primary_button_background
 * scheme-2: dynamicColor → background, primary_button_text, primary_button_hover_background
 * Optional sectionColors: { [sectionKey]: "#hex" | { background, button, text } }
 * → .color-scheme-roarr-* classes with independent solid colors.
 */
export function generateColorSchemeCss(dynamicColor, sectionColors = null) {
  const color = dynamicColor || "#bca38f";
  const color80 = withOpacity(color, 0.8);
  const color30 = withOpacity(color, 0.3);
  const contrastText = pickContrastText(color);
  const mutedText =
    contrastText === "#000000" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
  const onAccent = pickContrastText(color);
  const onAccentMuted =
    onAccent === "#000000" ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.55)";

  // Semantic aliases used by cinematic pack (layout from React; colors from selection).
  const semantic = `
  --color-accent: ${color};
  --color-accent-soft: ${color30};
  --color-on-accent: ${onAccent};
  --color-on-accent-muted: ${onAccentMuted};
`;

  // scheme-1: Light - fixed values, only primary_button_background is dynamic
  const scheme1 = `
/* scheme-1: Light - dynamic accent */
.color-scheme-1 {
  --color-background: #ffffff;
  --color-foreground-heading: #000000;
  --color-foreground: #000000;
  --color-foreground-muted: rgba(0, 0, 0, 0.55);
  --color-primary: #000000;
  --color-primary-hover: #000000;
  --color-border: #0000000f;
  --color-shadow: #000000;
  --color-primary-button-background: ${color80};
  --color-primary-button-text: #ffffff;
  --color-primary-button-border: rgba(0, 0, 0, 0);
  --color-primary-button-hover-background: ${color80};
  --color-primary-button-hover-text: #ffffff;
  --color-primary-button-hover-border: ${color80};
  --color-secondary-button-background: #e6e6e6;
  --color-secondary-button-text: #000000;
  --color-secondary-button-border: #0000000f;
  --color-secondary-button-hover-background: #333333;
  --color-secondary-button-hover-text: #ffffff;
  --color-secondary-button-hover-border: #333333;${semantic}
}`;

  // scheme-2: Accent - dynamicColor for background, primary_button_text, primary_button_hover_background
  const scheme2 = `
/* scheme-2: Accent - dynamic accent */
.color-scheme-2 {
  --color-background: ${color30};
  --color-foreground-heading: ${contrastText};
  --color-foreground: ${contrastText};
  --color-foreground-muted: ${mutedText};
  --color-primary: #000000;
  --color-primary-hover: #000000;
  --color-border: #dfdfdf;
  --color-shadow: #000000;
  --color-primary-button-background: ${color80};
  --color-primary-button-text: #ffffff;
  --color-primary-button-border: rgba(0, 0, 0, 0);
  --color-primary-button-hover-background: ${color80};
  --color-primary-button-hover-text: #ffffff;
  --color-primary-button-hover-border: ${color80};
  --color-secondary-button-background: #ffffffb0;
  --color-secondary-button-text: #000000;
  --color-secondary-button-border: #ffffffb0;
  --color-secondary-button-hover-background: #ffffff;
  --color-secondary-button-hover-text: #000000;
  --color-secondary-button-hover-border: #ffffff;${semantic}
}`;

  const sectionBlocks = [];
  if (sectionColors && typeof sectionColors === "object") {
    const globalAccent = color;
    for (const [sectionKey, entry] of Object.entries(sectionColors)) {
      if (!sectionKey || entry == null) continue;
      const slots = normalizeSectionColorsForCss(entry);
      for (const [slotKey, fieldOverrides] of Object.entries(slots)) {
        const schemeClass = cssClassForSectionSlot(sectionKey, slotKey);
        if (!schemeClass) continue;
        const defaults = defaultFieldsForSlot(slotKey, globalAccent);
        const fields = { ...defaults, ...fieldOverrides };
        sectionBlocks.push(`
/* ${schemeClass}: Shopify-style (${slotKey}) */
.${schemeClass} {
${fieldsToCssLines(fields)}
}`);
      }
    }
  }

  return `/**
 * Color Schemes - Dynamic from category + user selection (StoreFlow)
 */
${scheme1}
${scheme2}
${sectionBlocks.join("\n")}
`;
}

function cssClassForSectionSlot(sectionKey, slotKey) {
  const sec = String(sectionKey || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!sec) return null;
  if (slotKey === "color_scheme" || slotKey === "section_color_scheme") {
    return `color-scheme-roarr-${sec}`;
  }
  const slot = String(slotKey || "")
    .replace(/_color_scheme$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `color-scheme-roarr-${sec}-${slot || "slot"}`;
}

function normalizeSectionColorsForCss(entry) {
  if (typeof entry === "string") {
    const hex = entry.trim();
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return {};
    return { color_scheme: { primary_button_background: hex } };
  }
  if (!entry || typeof entry !== "object") return {};
  if (
    (entry.background || entry.button || entry.text || entry.accent) &&
    !Object.keys(entry).some((k) => k === "color_scheme" || k.endsWith("_color_scheme"))
  ) {
    const flat = {};
    if (typeof entry.background === "string") flat.background = entry.background.trim();
    if (typeof (entry.button ?? entry.accent) === "string") {
      flat.primary_button_background = String(entry.button ?? entry.accent).trim();
    }
    if (typeof entry.text === "string") {
      flat.foreground = entry.text.trim();
      flat.foreground_heading = entry.text.trim();
    }
    return Object.keys(flat).length ? { color_scheme: flat } : {};
  }
  const out = {};
  for (const [slotKey, fields] of Object.entries(entry)) {
    if (!(slotKey === "color_scheme" || slotKey.endsWith("_color_scheme"))) continue;
    if (!fields || typeof fields !== "object") continue;
    out[slotKey] = fields;
  }
  return out;
}

function defaultFieldsForSlot(slotKey, globalAccent) {
  const prefersAccent = /card|faq|container|panel|form|col_/i.test(String(slotKey));
  const accent = globalAccent || "#bca38f";
  if (prefersAccent) {
    return {
      background: accent,
      foreground_heading: "#ffffff",
      foreground: "#ffffff",
      primary_button_background: "#ffffff",
      primary_button_text: accent,
      secondary_button_background: "#ffffffb0",
      secondary_button_text: "#000000",
    };
  }
  return {
    background: "#ffffff",
    foreground_heading: "#000000",
    foreground: "#000000",
    primary_button_background: accent,
    primary_button_text: "#ffffff",
    secondary_button_background: "#e6e6e6",
    secondary_button_text: "#000000",
  };
}

function fieldsToCssLines(fields) {
  const f = fields || {};
  const bg = f.background || "#ffffff";
  const heading = f.foreground_heading || f.foreground || "#000000";
  const text = f.foreground || "#000000";
  const btnBg = f.primary_button_background || "#000000";
  const btnText = f.primary_button_text || "#ffffff";
  const secBg = f.secondary_button_background || "#e6e6e6";
  const secText = f.secondary_button_text || "#000000";
  return [
    `  --color-background: ${bg};`,
    `  --color-foreground-heading: ${heading};`,
    `  --color-foreground: ${text};`,
    `  --color-foreground-muted: ${text};`,
    `  --color-primary: ${text};`,
    `  --color-primary-hover: ${text};`,
    `  --color-border: #0000000f;`,
    `  --color-shadow: #000000;`,
    `  --color-primary-button-background: ${btnBg};`,
    `  --color-primary-button-text: ${btnText};`,
    `  --color-primary-button-border: rgba(0, 0, 0, 0);`,
    `  --color-primary-button-hover-background: ${btnBg};`,
    `  --color-primary-button-hover-text: ${btnText};`,
    `  --color-primary-button-hover-border: ${btnBg};`,
    `  --color-secondary-button-background: ${secBg};`,
    `  --color-secondary-button-text: ${secText};`,
    `  --color-secondary-button-border: ${secBg};`,
    `  --color-secondary-button-hover-background: ${btnBg};`,
    `  --color-secondary-button-hover-text: ${btnText};`,
    `  --color-secondary-button-hover-border: ${btnBg};`,
    `  --color-accent: ${btnBg};`,
    `  --color-accent-soft: ${bg};`,
    `  --color-on-accent: ${btnText};`,
    `  --color-on-accent-muted: ${text};`,
  ].join("\n");
}

function pickContrastText(color) {
  const rgb = parseHexToRgb(color);
  if (!rgb) return "#ffffff";
  const { r, g, b } = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

function parseHexToRgb(color) {
  const hex = String(color || "").trim();
  if (/^#([0-9a-f]{3})$/i.test(hex)) {
    const [, short] = /^#([0-9a-f]{3})$/i.exec(hex) || [];
    const full = short.split("").map((c) => c + c).join("");
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    const [, full] = /^#([0-9a-f]{6})$/i.exec(hex) || [];
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  return null;
}

function withOpacity(color, alpha) {
  const hex = String(color || "").trim();
  if (/^#([0-9a-f]{3})$/i.test(hex)) {
    const [, short] = /^#([0-9a-f]{3})$/i.exec(hex) || [];
    const full = short.split("").map((c) => c + c).join("");
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    const [, full] = /^#([0-9a-f]{6})$/i.exec(hex) || [];
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/**
 * Generate typography override CSS from stylePreferences.headingFont and bodyFont
 * Injects @import for fonts and overrides --font-*-family variables
 */
export function generateTypographyOverrideCss(headingFont, bodyFont) {
  const heading = headingFont || "Poppins";
  const body = bodyFont || "Inter";

  const imports = [];
  if (heading !== body) {
    imports.push(toGoogleFontUrl(heading));
    imports.push(toGoogleFontUrl(body));
  } else {
    imports.push(toGoogleFontUrl(heading));
  }

  const headingFamily = `${heading}, sans-serif`;
  const bodyFamily = `${body}, sans-serif`;

  return `/**
 * Typography override - from user selection (StoreFlow)
 */
${imports.join("\n")}

:root {
  --font-heading--family: ${headingFamily};
  --font-subheading--family: ${headingFamily};
  --font-body--family: ${bodyFamily};
  --font-accent--family: ${bodyFamily};
}
`;
}

/**
 * Build dynamic CSS string from stylePreferences.
 * @param {Object} stylePreferences - { dynamicColor, headingFont, bodyFont }
 * @param {string} baseCss - Full static CSS (from theme-content)
 * @returns {string} CSS with dynamic overrides appended
 */
export function buildDynamicCss(stylePreferences, baseCss) {
  if (!stylePreferences || typeof stylePreferences !== "object") {
    return baseCss;
  }

  const { dynamicColor, headingFont, bodyFont, sectionColors } = stylePreferences;
  const overrides = [];

  if (dynamicColor || (sectionColors && Object.keys(sectionColors).length > 0)) {
    overrides.push(generateColorSchemeCss(dynamicColor, sectionColors));
  }
  if (headingFont || bodyFont) {
    overrides.push(generateTypographyOverrideCss(headingFont, bodyFont));
  }

  if (overrides.length === 0) return baseCss;

  return baseCss + "\n" + overrides.join("\n");
}
