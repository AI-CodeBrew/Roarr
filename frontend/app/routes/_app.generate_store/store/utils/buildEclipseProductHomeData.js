/**
 * Prepaid single Eclipse home tab: cinematic homepage for the same product
 * already shown on that category's Sleek product page.
 */
import { getDefaultMagicResponses } from "../../../_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

function pick(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function shortPhrase(value, maxWords = 8) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  return words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[.,;:—-]+$/g, "");
}

function stackedHeading(title) {
  const words = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return words.join(" ");
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`;
}

/** New cinematic homepage shots of the Sleek product. Not the product-page files. */
const ECLIPSE_HOME_IMAGES = {
  kids_toys: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
  general: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
  fashion: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
  health_beauty: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
  home_kitchen: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
  car_accessories: {
    banner_image: "",
    banner_image_mobile: "",
    product_story_image: "",
    why_shop_image: "",
    circle_feature_image: "",
  },
};

export function buildEclipseProductHomeData(category = "general") {
  const key = String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const base = getHomeDataForPreview("single", key, "cinematic") || {};
  const sleek = getDefaultMagicResponses(key, { template: 1 }) || {};
  const source = sleek.text || {};
  const shots = ECLIPSE_HOME_IMAGES[key] || ECLIPSE_HOME_IMAGES.general || {};
  const text = { ...(base.text || {}) };

  const title = pick(source.product_title, text.product_story_heading);
  const subtitle = pick(source.product_subtitle, text.product_story_body);

  text.product_story_heading = stackedHeading(title);
  text.product_story_eyebrow = shortPhrase(subtitle, 6);
  text.product_story_body = subtitle;
  text.product_story_cta = "Shop Now";
  text.inspiration_line_1 = shortPhrase(pick(source.circular_feature_1_name, source.badge_text_1, title), 3);
  text.inspiration_line_1_accent = shortPhrase(
    pick(source.circular_feature_2_name, source.badge_text_2, subtitle),
    3,
  );
  text.inspiration_line_2 = shortPhrase(subtitle, 10);
  text.orbit_heading = pick(source.circular_features_heading, source.four_blocks_heading, title);
  text.orbit_eyebrow = "Key features";
  text.why_shop_heading = pick(source.four_blocks_heading, "Why Shop With Us?");
  text.sticky_cta = "Shop now";

  for (let i = 1; i <= 6; i += 1) {
    const orbitTitle = pick(
      source[`circular_feature_${i}_name`],
      source[`badge_text_${i}`],
      source[`four_blocks_block_${((i - 1) % 4) + 1}_name`],
    );
    const orbitText = pick(
      source[`circular_feature_${i}_desc`],
      source[`four_blocks_block_${((i - 1) % 4) + 1}_desc`],
      subtitle,
    );
    if (orbitTitle) text[`orbit_${i}_title`] = orbitTitle;
    if (orbitText) text[`orbit_${i}_text`] = shortPhrase(orbitText, 12);
    if (orbitTitle) text[`feature_ticker_${i}`] = orbitTitle;
  }

  for (let i = 1; i <= 5; i += 1) {
    const whyTitle = pick(
      source[`four_blocks_block_${i}_name`],
      source[`circular_feature_${i}_name`],
      source[`badge_text_${i}`],
    );
    const whyText = pick(
      source[`four_blocks_block_${i}_desc`],
      source[`circular_feature_${i}_desc`],
    );
    if (whyTitle) text[`why_${i}_title`] = whyTitle;
    if (whyText) text[`why_${i}_text`] = whyText;
  }

  for (let i = 1; i <= 4; i += 1) {
    const question = pick(source[`faq_question_${i}`], source[`product_question_${i}`]);
    const answer = pick(source[`faq_answer_${i}`], source[`product_question_${i}_answer`]);
    if (question) text[`faq_${i}_q`] = question;
    if (answer) text[`faq_${i}_a`] = answer;
  }

  return {
    text,
    images: {
      ...(base.images || {}),
      ...shots,
    },
  };
}
