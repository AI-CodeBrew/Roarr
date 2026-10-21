/**
 * Prepaid single Linen product tab: a Sleek product page for the same
 * product already shown on that category's classic homepage.
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

/** New product-page shots of the homepage product. Not the homepage files. */
const LINEN_PDP_IMAGES = {
  kids_toys: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1a888703_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ee5b4eb7_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/80a6953c_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a2d88346_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/29045ac9_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/801226ca_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/60a89be0_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6ede743e_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/917910f9_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3cf250b4_zambeel_ai_generated_image.jpg",
  },
  general: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a198aaff_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7d660c08_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3caf18c4_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8db94019_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/16c24621_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/db09e1dd_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c343c842_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c3436c22_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/785923a8_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0e1eb8bf_zambeel_ai_generated_image.jpg",
  },
  fashion: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6aed3c5b_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/222b8acd_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8247ed07_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b035c369_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/91817e84_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/60b0e67f_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/86a00c68_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/94ab7f16_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5cd31259_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3c9b988e_zambeel_ai_generated_image.jpg",
  },
  health_beauty: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7566d74e_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/63072bbb_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7639670b_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7409593c_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1c1ea534_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/19f6f878_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b0d62baa_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e2cab8db_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2842fbf6_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8498da1b_zambeel_ai_generated_image.jpg",
  },
  home_kitchen: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fa1dafb9_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/da7be67a_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2a541098_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/efa81935_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/af7ec920_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74ad34af_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/62fb21c6_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/05162104_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/93e95483_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9f68e112_zambeel_ai_generated_image.jpg",
  },
  car_accessories: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f211e449_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/67b47309_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/bfa6d728_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e9b24d48_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c1cc6117_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b2e48321_zambeel_ai_generated_image.png",
    problem_solving_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c1c4f0bc_zambeel_ai_generated_image.png",
    happy_customer_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/32408b8b_zambeel_ai_generated_image.jpg",
    happy_customer_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/acc4cddb_zambeel_ai_generated_image.jpg",
    happy_customer_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/27643c4a_zambeel_ai_generated_image.jpg",
  },
};

export function buildLinenHomeProductPageData(category = "general") {
  const key = String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const home = getHomeDataForPreview("single", key, "classic") || {};
  const sleek = getDefaultMagicResponses(key, { template: 1 }) || {};
  const source = home.text || {};
  const shots = LINEN_PDP_IMAGES[key] || LINEN_PDP_IMAGES.general;
  const text = { ...(sleek.text || {}) };

  const title = pick(source.banner_heading, text.product_title);
  const eyebrow = pick(source.banner_eyebrow, source.image_with_text_subheading);

  text.product_title = title;
  text.product_subtitle = pick(eyebrow, source.image_with_text_description, text.product_subtitle);

  for (let i = 1; i <= 4; i += 1) {
    const name = pick(source[`feature_name_${i}`], source[`why_choose_us_reason_${i}_heading`]);
    const desc = pick(source[`feature_desc_${i}`], source[`why_choose_us_reason_${i}_description`]);
    if (name) text[`badge_text_${i}`] = name;
    if (name) text[`creative_sassy_product_subheading_${i}`] = name;
    if (desc) text[`creative_sassy_product_subheading_${i}_description`] = shortPhrase(desc, 6);
    if (name) text[`circular_feature_${i}_name`] = name;
    if (desc) text[`circular_feature_${i}_desc`] = desc;
    if (name) text[`four_blocks_block_${i}_name`] = pick(source[`why_choose_us_reason_${i}_heading`], name);
    if (desc) {
      text[`four_blocks_block_${i}_desc`] = pick(
        source[`why_choose_us_reason_${i}_description`],
        desc,
      );
    }
  }

  text.marquee_text_1 = pick(source.marquee_text_1, text.badge_text_1, text.marquee_text_1);
  text.marquee_text_2 = pick(source.marquee_text_2, text.badge_text_2, text.marquee_text_2);
  text.marquee_text_3 = pick(source.marquee_text_3, text.badge_text_3, text.marquee_text_3);

  text.creative_sassy_product_heading = pick(
    source.image_with_text_heading,
    text.creative_sassy_product_heading,
  );
  text.circular_features_heading = pick(source.feature_section_heading, text.circular_features_heading);
  text.circular_features_subheading = pick(
    source.image_with_text_subheading,
    text.circular_features_subheading,
  );
  text.four_blocks_heading = pick(source.why_choose_us_heading, text.four_blocks_heading);
  text.four_blocks_subheading = pick(source.punchy_poetic_headline, text.four_blocks_subheading);
  text.pillow_banner_heading = pick(source.highlight_banner_section_heading, title);
  text.pillow_banner_subheading = pick(
    source.highlight_banner_section_subheading,
    source.highlight_banner_section_description,
  );

  text.stats_section_heading = pick(source.why_choose_us_heading, source.feature_section_heading);
  for (let i = 1; i <= 3; i += 1) {
    text[`stats_section_point_${i}_heading`] = pick(
      source[`why_choose_us_reason_${i}_heading`],
      source[`feature_name_${i}`],
    );
    text[`stats_section_point_${i}_desc`] = pick(
      source[`why_choose_us_reason_${i}_description`],
      source[`feature_desc_${i}`],
    );
  }

  text.what_set_us_apart_subheading = pick(
    source.image_with_text_description,
    text.what_set_us_apart_subheading,
  );
  text.what_sets_us_apart_feature_1 = pick(source.feature_name_1, text.what_sets_us_apart_feature_1);
  text.what_sets_us_apart_feature_2 = pick(source.feature_name_2, text.what_sets_us_apart_feature_2);
  text.what_sets_us_apart_feature_3 = pick(source.feature_name_3, text.what_sets_us_apart_feature_3);

  text.bento_stat_1 = pick(source.feature_name_1, text.bento_stat_1);
  text.bento_stat_description_1 = pick(source.feature_desc_1, text.bento_stat_description_1);
  text.bento_stat_2 = pick(source.feature_name_2, text.bento_stat_2);
  text.bento_stat_description_2 = pick(source.feature_desc_2, text.bento_stat_description_2);

  for (let i = 1; i <= 3; i += 1) {
    const question = pick(source[`faq_question_${i}`]);
    const answer = pick(source[`faq_answer_${i}`]);
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
    // Text panel wants a tall lifestyle frame. Circular ring gets the in-use gallery shot.
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
    selected_color: getDefaultColor(key, { template: 1 }) || sleek.color,
  };
}
