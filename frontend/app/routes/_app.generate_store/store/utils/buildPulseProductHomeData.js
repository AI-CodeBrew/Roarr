/**
 * Prepaid single Pulse home tab: classic homepage for the same product
 * already shown on that category's Vibe product page.
 */
import { getDefaultMagicResponses } from "../../../_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

function pick(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** New homepage shots of the Vibe product. Not the product-page files. */
const PULSE_HOME_IMAGES = {
  kids_toys: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4fdf17a5_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2295b5bc_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/29d5e361_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e161f823_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a7be7cf7_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/562556ea_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4537bbb4_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/722507b0_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3a465a22_zambeel_ai_generated_image.png",
  },
  general: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5976d89e_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f7c5ab29_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a378a53b_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d6dcffad_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c79f1f81_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aaeed432_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7590882a_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/336704c9_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/58e900b2_zambeel_ai_generated_image.png",
  },
  fashion: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/69af7399_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2907dd45_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/317b3358_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a1cb3567_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/eea60a50_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f3989bad_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/da1daf22_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3b25dfe1_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/57ba8c95_zambeel_ai_generated_image.png",
  },
  health_beauty: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/332ec549_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/756b083f_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3db9f4e5_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/41c4381e_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2d341383_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ad2e3d1f_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52f6a191_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5bfb2b86_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f527b8db_zambeel_ai_generated_image.png",
  },
  home_kitchen: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5bfeb06d_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/49b803c8_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d1ba3121_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/96c9e32d_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1b69feb1_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4a225bce_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/eb78d039_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7dff6122_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/691771f3_zambeel_ai_generated_image.png",
  },
  car_accessories: {
    banner_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d4b782c0_zambeel_ai_generated_image.jpg",
    product_impact_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/269478d2_zambeel_ai_generated_image.png",
    feature_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/dee8f29b_zambeel_ai_generated_image.png",
    creative_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0e0e3039_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52852c25_zambeel_ai_generated_image.png",
    product_base_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/84907ee5_zambeel_ai_generated_image.png",
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ac7b7435_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6c9c973a_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/07726a16_zambeel_ai_generated_image.png",
  },
};

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

export function buildPulseProductHomeData(category = "general") {
  const key = String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const base = getHomeDataForPreview("single", key, "classic") || {};
  const vibe = getDefaultMagicResponses(key, { template: 2 }) || {};
  const source = vibe.text || {};
  const shots = PULSE_HOME_IMAGES[key] || PULSE_HOME_IMAGES.general;
  const text = { ...(base.text || {}) };

  const title = pick(source.product_title, text.banner_heading);
  const subtitle = pick(source.product_subtitle, text.banner_eyebrow);

  text.banner_heading = title;
  text.banner_eyebrow = shortPhrase(subtitle, 8);
  text.image_with_text_heading = pick(
    source.creative_sassy_product_heading,
    source.pillow_banner_heading,
    title,
  );
  text.image_with_text_subheading = pick(
    source.circular_features_subheading,
    shortPhrase(source.pillow_banner_subheading, 6),
  );
  text.image_with_text_description = pick(
    source.impactfull_poetic_product_detail_1,
    subtitle,
  );
  text.feature_section_heading = pick(
    source.circular_features_heading,
    source.four_blocks_heading,
    text.feature_section_heading,
  );

  for (let i = 1; i <= 4; i += 1) {
    text[`feature_name_${i}`] = pick(
      source[`circular_feature_${i}_name`],
      source[`four_blocks_block_${i}_name`],
      source[`badge_text_${i}`],
    );
    text[`feature_desc_${i}`] = pick(
      source[`circular_feature_${i}_desc`],
      source[`four_blocks_block_${i}_desc`],
      source[`creative_sassy_product_subheading_${i}_description`],
    );
  }
  text.feature_name_5 = pick(
    source.stats_section_point_1_heading,
    source.what_sets_us_apart_feature_1,
    text.feature_name_5,
  );
  text.feature_desc_5 = pick(
    source.stats_section_point_1_desc,
    source.impactfull_poetic_product_detail_2,
    text.feature_desc_5,
  );
  text.feature_name_6 = pick(
    source.stats_section_point_2_heading,
    source.what_sets_us_apart_feature_2,
    text.feature_name_6,
  );
  text.feature_desc_6 = pick(
    source.stats_section_point_2_desc,
    source.impactfull_poetic_product_detail_3,
    text.feature_desc_6,
  );

  text.highlight_banner_section_heading = pick(source.pillow_banner_heading, title);
  text.highlight_banner_section_subheading = shortPhrase(
    pick(source.pillow_banner_subheading, subtitle),
    8,
  );
  text.highlight_banner_section_description = pick(
    source.impactfull_poetic_product_detail_2,
    subtitle,
  );
  text.marquee_text_1 = pick(source.marquee_text_1, source.badge_text_1, text.marquee_text_1);
  text.marquee_text_2 = pick(source.marquee_text_2, source.badge_text_2, text.marquee_text_2);
  text.marquee_text_3 = pick(source.marquee_text_3, source.badge_text_3, text.marquee_text_3);
  text.punchy_poetic_headline = pick(source.pillow_banner_heading, title);

  text.why_choose_us_heading = pick(
    source.four_blocks_heading,
    source.stats_section_heading,
    text.why_choose_us_heading,
  );
  for (let i = 1; i <= 4; i += 1) {
    text[`why_choose_us_reason_${i}_heading`] = pick(
      source[`four_blocks_block_${i}_name`],
      source[`circular_feature_${i}_name`],
      text[`feature_name_${i}`],
    );
    text[`why_choose_us_reason_${i}_description`] = pick(
      source[`four_blocks_block_${i}_desc`],
      source[`circular_feature_${i}_desc`],
      text[`feature_desc_${i}`],
    );
  }

  for (let i = 1; i <= 4; i += 1) {
    const question = pick(source[`faq_question_${i}`], source[`product_question_${i}`]);
    const answer = pick(source[`faq_answer_${i}`], source[`product_question_${i}_answer`]);
    if (question) text[`faq_question_${i}`] = question;
    if (answer) text[`faq_answer_${i}`] = answer;
  }

  return {
    text,
    images: { ...shots },
  };
}
