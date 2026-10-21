/**
 * Prepaid multi Luminous demo: three new products per category.
 * Homepage sections use homepage-sized shots. The product tab is product 1,
 * with its own product-page gallery.
 */
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

const LUMINOUS_PRODUCTS = {
  fashion: [
    ["Olive Linen Overshirt", "A relaxed linen layer for easy days."],
    ["Black Leather Belt", "A slim belt with a simple buckle."],
    ["Cream Wool Scarf", "A soft wool wrap for cooler days."],
  ],
  kids_toys: [
    ["Wooden Animal Puzzle", "Chunky pastel pieces for little hands."],
    ["Soft Stacking Rings", "Pastel rings on a wooden post."],
    ["Mini Hand Drum", "A small drum for first rhythms."],
  ],
  general: [
    ["Bamboo Desk Clock", "A quiet clock for a tidy desk."],
    ["Brass Bookends", "Solid brass ends for a short row of books."],
    ["Linen Notebook Set", "Linen covers for everyday notes."],
  ],
  health_beauty: [
    ["Amber Dropper Serum", "A small amber bottle for a daily serum."],
    ["Jade Gua Sha", "A smooth stone for a calm routine."],
    ["Cotton Spa Headband", "Soft cotton that keeps hair back."],
  ],
  home_kitchen: [
    ["Walnut Cutting Board", "A thick board for everyday prep."],
    ["Glass Pantry Jars", "Clear jars with wooden lids."],
    ["Stone Mortar and Pestle", "A heavy stone set for fresh herbs."],
  ],
  car_accessories: [
    ["Leather Steering Cover", "Stitched leather for the wheel."],
    ["Trunk Cargo Net", "An elastic net that holds the trunk."],
    ["Console Organizer", "A compact tray for the console."],
  ],
};

/** Homepage files are not the product-page gallery. */
const LUMINOUS_HOME_IMAGES = {
  fashion: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/853b7ce9_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1a540b05_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d267699f_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0784e31b_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cf6286e5_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b47e8639_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7e753b04_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c4cd2187_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fe595c0a_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e8a235ab_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9b99a954_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7715348d_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/edf1a67a_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/27122d8c_zambeel_ai_generated_image.png",
  },
  kids_toys: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/dd0771c2_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/646110ab_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3c6997b0_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/93199916_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2adf113b_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/488860ff_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/663c5e63_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cbd245d3_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f99c72c5_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/714103f8_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f1a5feb2_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6adea033_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fd733ca7_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b7112c27_zambeel_ai_generated_image.png",
  },
  general: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1b7048c8_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/45fcb612_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f6d434e3_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/14409355_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a231a9df_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b8e32ad2_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/50855ce8_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/82daa750_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/effb16ca_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/36a6b8cf_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/545470a0_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/145e9626_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2a11f2b3_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/07bef4c6_zambeel_ai_generated_image.png",
  },
  health_beauty: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e2e81705_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d3c7ecd6_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/48de7e6a_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4b3b076b_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74d8bbb2_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/45342ed5_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c29339e4_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/975431c3_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0b7ba986_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b80705af_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4902c51a_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9b2a4496_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0c16f3b6_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/49c51fb9_zambeel_ai_generated_image.png",
  },
  home_kitchen: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/632b5b0e_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/37229499_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7068e4ed_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/433fe4fa_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/78c10e70_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5d0463c3_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b0850f70_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2bfdc574_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3e238e39_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/427abfd7_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/04e9ca4e_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6b1ce676_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/368c348d_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6f9fd60a_zambeel_ai_generated_image.png",
  },
  car_accessories: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52450aa3_zambeel_ai_generated_image.png",
    banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9824d4da_zambeel_ai_generated_image.jpg",
    feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b111cac0_zambeel_ai_generated_image.png",
    product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/42b0d007_zambeel_ai_generated_image.png",
    highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/28d63138_zambeel_ai_generated_image.png",
    star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9e058dbc_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c9ea0e8_zambeel_ai_generated_image.png",
    banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6520e6b8_zambeel_ai_generated_image.jpg",
    feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/45d57f95_zambeel_ai_generated_image.png",
    product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/43653128_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/093cfe76_zambeel_ai_generated_image.png",
    banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9f1eee9f_zambeel_ai_generated_image.jpg",
    feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/44be49b6_zambeel_ai_generated_image.png",
    product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9bb912b9_zambeel_ai_generated_image.png",
  },
};

const LUMINOUS_PDP_IMAGES = {
  fashion: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c447c414_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74a0bfae_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/97d18753_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/283d0105_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/994bd977_zambeel_ai_generated_image.png",
  },
  kids_toys: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f52c2183_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/07786e1d_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7284bd21_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c9a68304_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2222de13_zambeel_ai_generated_image.png",
  },
  general: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ac48d87d_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0bcde49d_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e8df5cf0_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/71b63501_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2eb6ad08_zambeel_ai_generated_image.png",
  },
  health_beauty: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f78fac76_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/711e3eea_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa445c1e_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/573983b3_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/debd8bbb_zambeel_ai_generated_image.png",
  },
  home_kitchen: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/22cfe9fd_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52d271b5_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0e3dde33_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/32e662b4_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a6e70e02_zambeel_ai_generated_image.png",
  },
  car_accessories: {
    product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4f034171_zambeel_ai_generated_image.png",
    product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c4a12829_zambeel_ai_generated_image.png",
    product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4e2f3a2a_zambeel_ai_generated_image.png",
    product_image_4: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/eb2d9b12_zambeel_ai_generated_image.png",
    product_image_5: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/585c1355_zambeel_ai_generated_image.png",
  },
};

function categoryKey(category) {
  return String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function buildLuminousHomeData(category = "general") {
  const key = categoryKey(category);
  const shots = LUMINOUS_HOME_IMAGES[key];
  const products = LUMINOUS_PRODUCTS[key] || LUMINOUS_PRODUCTS.general;
  if (!shots?.banner_image_1 || !products) return null;

  const base = getHomeDataForPreview("multi", key, "classic") || {};
  const text = { ...(base.text || {}) };

  products.forEach(([title, line], index) => {
    const n = index + 1;
    text[`banner_heading_${n}`] = title;
    text[`banner_eyebrow_${n}`] = line;
    text[`featured_product_headline_${n}`] = title;
    text[`featured_product_subheadline_${n}`] = line;
    text[`top_product_punchline_${n}`] = title;
    text[`top_product_punchline_${n}_description`] = line;
  });

  text.highlight_banner_section_heading = products[0][0];
  text.highlight_banner_section_subheading = products[0][1];
  text.highlight_banner_section_description = products[0][1];
  text.marquee_text_1 = products[0][0];
  text.marquee_text_2 = products[1][0];
  text.marquee_text_3 = products[2][0];
  text.punchy_poetic_headline = `${products[0][0]} ${products[1][0]} ${products[2][0]}`;
  products.forEach(([title, line], index) => {
    const n = index + 1;
    text[`star_product_feature_${n}`] = title;
    text[`star_product_feature_${n}_desc`] = line;
    text[`faq_question_${n}`] = `What is the ${title}?`;
    text[`faq_answer_${n}`] = line;
  });
  text.star_product_feature_4 = products[0][0];
  text.star_product_feature_4_desc = products[0][1];

  return {
    text,
    images: {
      ...(base.images || {}),
      ...shots,
      product_base_image_2: shots.highlight_image,
    },
  };
}

/** 1:1 product-grid cards. Not the homepage squares and not merchant photos. */
const LUMINOUS_GRID_IMAGES = {
  fashion: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/324a5c33_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/29a1e410_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b295865d_zambeel_ai_generated_image.png",
  },
  kids_toys: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/885749fe_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/07fe8c58_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7cf3a72e_zambeel_ai_generated_image.png",
  },
  general: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/533ee352_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/20dc9da4_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/20f54732_zambeel_ai_generated_image.png",
  },
  health_beauty: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1b5bd4c0_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/685eab1b_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/81fb509b_zambeel_ai_generated_image.png",
  },
  home_kitchen: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b44d2d92_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/143e7ccc_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/98535336_zambeel_ai_generated_image.png",
  },
  car_accessories: {
    grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/15bc7d00_zambeel_ai_generated_image.png",
    grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d9614cf9_zambeel_ai_generated_image.png",
    grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/06f1f491_zambeel_ai_generated_image.png",
  },
};

/** Three demo products for the homepage product grid. */
export function buildLuminousDemoGridProducts(category = "general") {
  const key = categoryKey(category);
  const shots = LUMINOUS_GRID_IMAGES[key];
  const products = LUMINOUS_PRODUCTS[key] || LUMINOUS_PRODUCTS.general;
  if (!shots?.grid_image_1 || !products) return null;
  return products.map(([title, line], index) => {
    const url = shots[`grid_image_${index + 1}`];
    if (!url) return null;
    const handle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      id: `luminous-grid-${key}-${index + 1}`,
      title,
      handle,
      description: line,
      featuredImage: { url, altText: title },
      images: { edges: [{ node: { url, altText: title } }] },
      variants: { edges: [{ node: { id: `luminous-grid-variant-${key}-${index + 1}`, price: "29.00" } }] },
    };
  }).filter(Boolean);
}

/** Standard product-page preview for Luminous product 1. */
export function buildLuminousDemoProduct(category = "general") {
  const key = categoryKey(category);
  const shots = LUMINOUS_PDP_IMAGES[key];
  const products = LUMINOUS_PRODUCTS[key] || LUMINOUS_PRODUCTS.general;
  const title = products?.[0]?.[0];
  const urls = [1, 2, 3, 4, 5]
    .map((n) => shots?.[`product_image_${n}`])
    .filter((url) => typeof url === "string" && url.startsWith("http"));
  if (!title || urls.length === 0) return null;
  return {
    id: `luminous-demo-${key}`,
    title,
    description: products[0][1],
    featuredImage: { url: urls[0], altText: title },
    images: {
      edges: urls.map((url) => ({ node: { url, altText: title } })),
    },
  };
}
