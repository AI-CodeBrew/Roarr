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
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e1858817_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3b584d6f_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8953cbcf_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e12c1783_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f03ef879_zambeel_ai_generated_image.png",
  },
  general: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ced21439_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d759adb5_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b5e55616_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ff4a7b5b_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/40521a04_zambeel_ai_generated_image.png",
  },
  fashion: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/815d9160_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d4d193d0_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ea66eba6_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0900a426_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4ce85097_zambeel_ai_generated_image.png",
  },
  health_beauty: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/35503cce_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c792591_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/54226f1f_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7d6eb07f_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9e7f6c6f_zambeel_ai_generated_image.png",
  },
  home_kitchen: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8ec9a835_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9fd2e173_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/df93981a_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fcdf930c_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8b4aa1be_zambeel_ai_generated_image.png",
  },
  car_accessories: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7bf527f9_zambeel_ai_generated_image.jpg",
    banner_image_mobile: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fbf1e7c9_zambeel_ai_generated_image.jpg",
    product_story_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/17a0927f_zambeel_ai_generated_image.png",
    why_shop_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a9da5e28_zambeel_ai_generated_image.png",
    circle_feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/83d18142_zambeel_ai_generated_image.png",
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
