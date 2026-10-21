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
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/99582886_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/65a9f9c7_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/82bfb701_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c0925c80_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f142f150_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3c9951ff_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7d1b6d82_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/537c9104_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/19debc5a_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/735c9034_zambeel_ai_generated_image.jpg",
  },
  general: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/568766a7_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1403ff35_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/439c3e91_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/63280f38_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/086d6a7e_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7bfe4880_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/40d8dbf5_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f20b15d1_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/854b69f3_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3e89fbf2_zambeel_ai_generated_image.jpg",
  },
  fashion: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f230ce66_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/43cc3a6e_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c07955db_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1e0952c1_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3666f5a6_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0ed348d5_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/43c453db_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/738fd222_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0fce60f2_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9915cb08_zambeel_ai_generated_image.jpg",
  },
  health_beauty: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1ae12e56_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cf031fe1_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5fcb3af4_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2499eee4_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3e792dfe_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6bd577c8_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/25882ba8_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/13f8c99c_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ff74f1ff_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4a26f615_zambeel_ai_generated_image.jpg",
  },
  home_kitchen: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8d9b487b_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b0735e4e_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e3c14aae_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5aa8e5c8_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d4422ba8_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ca9457ed_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5315d56c_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/544e29be_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f1fcacab_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3452ef3c_zambeel_ai_generated_image.jpg",
  },
  car_accessories: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e95aeaa4_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3d5efcfb_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74719f23_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c0671944_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/69fa018a_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c575d67a_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/482bdb00_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/58f8063d_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4370bb92_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e8527745_zambeel_ai_generated_image.jpg",
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
