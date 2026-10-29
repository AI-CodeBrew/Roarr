/**
 * Prepaid single Velvet product tab: a Vibe product page for the same
 * product already shown on that category's cinematic homepage.
 */
import { getDefaultColor, getDefaultMagicResponses } from "../../../_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

function pick(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function shortPhrase(value, maxWords = 6) {
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

function plainTitle(value) {
  return String(value || "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** New product-page shots of the cinematic homepage product. Not the homepage files. */
const VELVET_PDP_IMAGES = {
  kids_toys: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
  general: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
  fashion: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
  health_beauty: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
  home_kitchen: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
  car_accessories: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
    feature_image: "",
    problem_solving_image: "",
    happy_customer_image_1: "",
    happy_customer_image_2: "",
    happy_customer_image_3: "",
  },
};

export function buildVelvetHomeProductPageData(category = "general") {
  const key = String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const home = getHomeDataForPreview("single", key, "cinematic") || {};
  const vibe = getDefaultMagicResponses(key, { template: 2 }) || {};
  const source = home.text || {};
  const shots = VELVET_PDP_IMAGES[key] || VELVET_PDP_IMAGES.general || {};
  const text = { ...(vibe.text || {}) };

  const title = pick(plainTitle(source.product_story_heading), text.product_title);
  const eyebrow = pick(source.product_story_eyebrow, source.inspiration_line_1);
  const body = pick(source.product_story_body, text.product_subtitle);

  text.product_title = title;
  text.product_subtitle = pick(body, eyebrow);

  for (let i = 1; i <= 4; i += 1) {
    const name = pick(source[`orbit_${i}_title`], source[`why_${i}_title`], source[`feature_ticker_${i}`]);
    const desc = pick(source[`orbit_${i}_text`], source[`why_${i}_text`]);
    if (name) text[`badge_text_${i}`] = name;
    if (name) text[`creative_sassy_product_subheading_${i}`] = name;
    if (desc) text[`creative_sassy_product_subheading_${i}_description`] = shortPhrase(desc, 6);
    if (name) text[`circular_feature_${i}_name`] = name;
    if (desc) text[`circular_feature_${i}_desc`] = desc;
    if (name) text[`four_blocks_block_${i}_name`] = pick(source[`why_${i}_title`], name);
    if (desc) text[`four_blocks_block_${i}_desc`] = pick(source[`why_${i}_text`], desc);
  }

  text.marquee_text_1 = pick(source.feature_ticker_1, source.orbit_1_title, text.marquee_text_1);
  text.marquee_text_2 = pick(source.feature_ticker_2, source.orbit_2_title, text.marquee_text_2);
  text.marquee_text_3 = pick(source.feature_ticker_3, source.orbit_3_title, text.marquee_text_3);

  text.creative_sassy_product_heading = pick(source.orbit_heading, title);
  text.circular_features_heading = pick(source.orbit_heading, text.circular_features_heading);
  text.circular_features_subheading = pick(eyebrow, text.circular_features_subheading);
  text.four_blocks_heading = pick(source.why_shop_heading, text.four_blocks_heading);
  text.four_blocks_subheading = pick(body, text.four_blocks_subheading);
  text.pillow_banner_heading = title;
  text.pillow_banner_subheading = pick(eyebrow, shortPhrase(body, 8));

  text.stats_section_heading = pick(source.why_shop_heading, source.orbit_heading);
  for (let i = 1; i <= 3; i += 1) {
    text[`stats_section_point_${i}_heading`] = pick(
      source[`why_${i}_title`],
      source[`orbit_${i}_title`],
    );
    text[`stats_section_point_${i}_desc`] = pick(
      source[`why_${i}_text`],
      source[`orbit_${i}_text`],
    );
  }

  text.what_set_us_apart_subheading = pick(body, text.what_set_us_apart_subheading);
  text.what_sets_us_apart_feature_1 = pick(source.orbit_1_title, text.what_sets_us_apart_feature_1);
  text.what_sets_us_apart_feature_2 = pick(source.orbit_2_title, text.what_sets_us_apart_feature_2);
  text.what_sets_us_apart_feature_3 = pick(source.orbit_3_title, text.what_sets_us_apart_feature_3);

  for (let i = 1; i <= 4; i += 1) {
    const question = pick(source[`faq_${i}_q`]);
    const answer = pick(source[`faq_${i}_a`]);
    if (question) {
      text[`faq_question_${i}`] = question;
      text[`product_question_${i}`] = question;
    }
    if (answer) {
      text[`faq_answer_${i}`] = answer;
      text[`product_question_${i}_answer`] = answer;
    }
  }

  const product_images = {
    product_image_1: shots.product_image_1,
    product_image_2: shots.product_image_2,
    product_image_3: shots.product_image_3,
    product_image_4: shots.product_image_4,
    product_image_5: shots.product_image_5,
  };

  const body_images = {
    feature_image: shots.product_image_4,
    product_impact_image: shots.feature_image,
    problem_solving_image: shots.problem_solving_image,
    happy_customer_image_1: shots.happy_customer_image_1,
    happy_customer_image_2: shots.happy_customer_image_2,
    happy_customer_image_3: shots.happy_customer_image_3,
    product_highlight_1: shots.product_image_2,
    product_highlight_2: shots.product_image_3,
    product_highlight_3: shots.product_image_5,
    product_highlight_4: shots.feature_image,
  };

  return {
    text,
    images: { body_images, product_images },
    selected_color: getDefaultColor(key, { template: 2 }) || vibe.color,
  };
}
