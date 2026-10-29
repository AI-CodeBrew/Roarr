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
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
  kids_toys: {
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
  general: {
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
  health_beauty: {
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
  home_kitchen: {
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
  car_accessories: {
    product_image_1: "",
    banner_image_1: "",
    feature_image_1: "",
    product_impact_image_1: "",
    highlight_image: "",
    star_image: "",
    product_image_2: "",
    banner_image_2: "",
    feature_image_2: "",
    product_impact_image_2: "",
    product_image_3: "",
    banner_image_3: "",
    feature_image_3: "",
    product_impact_image_3: "",
  },
};

const LUMINOUS_PDP_IMAGES = {
  fashion: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
  },
  kids_toys: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
  },
  general: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
  },
  health_beauty: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
  },
  home_kitchen: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
  },
  car_accessories: {
    product_image_1: "",
    product_image_2: "",
    product_image_3: "",
    product_image_4: "",
    product_image_5: "",
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
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
  },
  kids_toys: {
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
  },
  general: {
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
  },
  health_beauty: {
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
  },
  home_kitchen: {
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
  },
  car_accessories: {
    grid_image_1: "",
    grid_image_2: "",
    grid_image_3: "",
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
