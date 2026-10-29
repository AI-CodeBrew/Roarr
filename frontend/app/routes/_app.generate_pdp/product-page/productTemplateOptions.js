/** Product page templates offered by the product flow and showcased on the Product pages hub. */

import { getLumenookProductPreview } from "../../../lib/lumenookPreviews.js";

export const PRODUCT_TEMPLATE_OPTIONS = [
  {
    id: 3,
    title: "Aura",
    badge: { label: "Top rated", tone: "top" },
    blurb: "Serif headlines and a cream, results-led layout",
    preview: "aura",
  },
  {
    id: 4,
    title: "Lumenook",
    badge: { label: "New", tone: "new" },
    blurb: "Warm ivory and brass with editorial serif type",
  },
  {
    id: 5,
    title: "Noir",
    badge: { label: "Premium", tone: "new" },
    blurb: "Black and champagne gold with high-contrast serif type",
    preview: "noir",
  },
  {
    id: 6,
    title: "Frost",
    badge: { label: "New", tone: "new" },
    blurb: "Crisp white and cobalt with a bold, modern sans",
    preview: "frost",
  },
];

/**
 * Card picture and scrolling eye screenshot for a product page template.
 * @returns {{ thumbUrl: string | null, hoverImageUrl: string | null, demoVariant: string | null }}
 */
export function getProductTemplateCardMedia(option) {
  if (option.id === 4) {
    // Fixed screenshot (built by scripts/build-lumenook-previews.mjs) — Lumenook has no
    // per-category prebuilt demos on S3 yet.
    return { ...getLumenookProductPreview(), demoVariant: "lumenook" };
  }
  if (option.preview) {
    // Fixed screenshots in public/demo-previews/<preview>/, built by scripts/build-product-previews.mjs.
    return {
      thumbUrl: `/demo-previews/${option.preview}/product.jpg`,
      hoverImageUrl: `/demo-previews/${option.preview}/product.eye.jpg`,
      demoVariant: option.preview,
    };
  }
  return { thumbUrl: null, hoverImageUrl: null, demoVariant: null };
}
