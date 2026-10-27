/** Product page templates offered by the product flow and showcased on the Product pages hub. */

import { getDemoPreviewEyeThumbUrl, getDemoPreviewThumbUrl } from "../../../lib/demoPreviewUrls.js";
import { getLumenookProductPreview } from "../../../lib/lumenookPreviews.js";

export const PRODUCT_TEMPLATE_OPTIONS = [
  {
    id: 3,
    title: "Aura",
    badge: { label: "Top rated", tone: "top" },
    blurb: "Serif headlines and a cream, results-led layout",
    thumbVariant: "glow",
    thumbCategory: "health_beauty",
    shot: "20261010-glow-faq",
    eyeShot: "20261010-glow-faq",
  },
  {
    id: 4,
    title: "Lumenook",
    badge: { label: "New", tone: "new" },
    blurb: "Warm ivory and brass with editorial serif type",
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
  if (!option.thumbVariant) {
    return { thumbUrl: null, hoverImageUrl: null, demoVariant: null };
  }
  const source = { family: "pdp", variant: option.thumbVariant, category: option.thumbCategory };
  return {
    thumbUrl: `${getDemoPreviewThumbUrl(source)}&shot=${option.shot}`,
    hoverImageUrl: `${getDemoPreviewEyeThumbUrl(source)}&shot=${option.eyeShot}`,
    demoVariant: option.thumbVariant,
  };
}
