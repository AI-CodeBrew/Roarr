/** Google font family names for store / liquid preview typography pickers (sorted). */
export const LIQUID_PREVIEW_FONT_OPTIONS = [
  "Poppins",
  "Montserrat",
  "Inter",
  "Playfair Display",
  "Lora",
  "Oswald",
  "Roboto",
  "Open Sans",
  "Nunito",
  "Source Sans 3",
  "Rajdhani",
  "Barlow",
  "Barlow Condensed",
  "Dosis",
  "DM Sans",
  "Merriweather",
  "Muli",
].sort((a, b) => a.localeCompare(b));

/** Builds a Google Fonts stylesheet URL for preview dropdowns (all weights used in theme). */
export function getLiquidPreviewGoogleFontsHref() {
  const query = LIQUID_PREVIEW_FONT_OPTIONS.map(
    (f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
