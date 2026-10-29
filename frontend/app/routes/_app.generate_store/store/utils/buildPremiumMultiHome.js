/**
 * Collective (Sleek) and Meridian (Vibe) homepages.
 * Product 1 is the product already on that theme's product page.
 * Two more products in the same category fill the other homepage slots.
 * Homepage files are not the product-page gallery.
 */
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

const PRODUCTS = {
  collective: {
    fashion: [
      ["Royal Blue Crystal Silver Plated Bracelet", "Brilliant royal blue stones on silver plating."],
      ["Pearl Drop Earrings", "A pair of pearl drops on silver hooks."],
      ["Gold Chain Necklace", "A fine gold chain for everyday wear."],
    ],
    kids_toys: [
      ["Wooden Abacus & Ramp Set", "Colorful math and vehicle play in child-safe wood."],
      ["Wooden Shape Sorter", "Colorful wooden shapes for a first puzzle."],
      ["Pull-Along Wooden Dog", "A small wooden dog on wheels."],
    ],
    general: [
      ["Stanley Quencher H2.0", "Double-wall insulation that keeps a drink cold."],
      ["Insulated Travel Mug", "A lidded mug that keeps coffee hot."],
      ["Stainless Water Bottle", "A slim bottle for the day."],
    ],
    health_beauty: [
      ["Essence Matte Liquid Lipstick", "A long-wearing matte lipstick with rich color."],
      ["Soft Matte Blush Stick", "A cream blush in a slim stick."],
      ["Clear Brow Gel", "A clear gel that holds brows in place."],
    ],
    home_kitchen: [
      ["Marble Designed Chef Knife", "A chef knife with a marble-patterned handle."],
      ["Walnut Serving Board", "A long board for bread and cheese."],
      ["Olivewood Spoon Set", "Three spoons for stirring and serving."],
    ],
    car_accessories: [
      ["Premium Car Drying Towel", "An absorbent microfiber towel for a spotless dry."],
      ["Microfiber Wash Mitt", "A soft mitt for a gentle wash."],
      ["Interior Detail Brush", "A small brush for vents and seams."],
    ],
  },
  meridian: {
    fashion: [
      ["Bohemian Elegance Sapphire Gold Hoops", "Sapphire drops on gold hoops."],
      ["Gold Cuff Bracelet", "An open gold cuff with a smooth finish."],
      ["Layered Coin Necklace", "A short gold necklace with small coins."],
    ],
    kids_toys: [
      ["Cuddle Dino Plush Friend", "A soft dinosaur buddy for naps and play."],
      ["Cloud Bunny Plush", "A soft bunny for bedtime."],
      ["Knit Bear Rattle", "A small knitted bear with a gentle rattle."],
    ],
    general: [
      ["Pulse Portable Bluetooth Speaker", "Compact sound that travels from desk to park."],
      ["Compact Wireless Earbuds", "Small earbuds with a pocket case."],
      ["Desk Cable Organizer", "A short tray that hides charging cables."],
    ],
    health_beauty: [
      ["Velvet Berry Matte Lipstick", "A deep berry matte lipstick."],
      ["Rosewater Face Mist", "A light mist for a fresh face."],
      ["Silk Sleep Mask", "A soft mask for darker mornings."],
    ],
    home_kitchen: [
      ["Stoneware Pour-Over Mug Set", "A ceramic mug set for brewing and sipping."],
      ["Speckled Cereal Bowls", "A pair of stoneware bowls."],
      ["Linen Tea Towels", "Two linen towels for the kitchen."],
    ],
    car_accessories: [
      ["Magnetic Car Phone Mount", "A matte black mount that holds a phone steady."],
      ["Seat Gap Organizer", "A slim pocket for the seat gap."],
      ["Sun Visor Tissue Holder", "A small holder that clips to the visor."],
    ],
  },
};

/** Filled after image generation. */
const HOME_IMAGES = {
  collective: {
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
  },
  meridian: {
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
  },
};
const GRID_IMAGES = {
  collective: {
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
  },
  meridian: {
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
  },
};

function categoryKey(category) {
  return String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function themeKey(template) {
  return Number(template) === 2 ? "meridian" : "collective";
}

function productsFor(theme, category) {
  const catalog = PRODUCTS[theme] || PRODUCTS.collective;
  return catalog[categoryKey(category)] || catalog.general;
}

export function buildPremiumMultiHomeData(category = "general", template = 1) {
  const theme = themeKey(template);
  const key = categoryKey(category);
  const shots = HOME_IMAGES[theme]?.[key];
  const products = productsFor(theme, key);
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

/** Three demo products for the homepage product grid. */
export function buildPremiumMultiGridProducts(category = "general", template = 1) {
  const theme = themeKey(template);
  const key = categoryKey(category);
  const shots = GRID_IMAGES[theme]?.[key];
  const products = productsFor(theme, key);
  if (!shots?.grid_image_1 || !products) return null;
  return products
    .map(([title, line], index) => {
      const url = shots[`grid_image_${index + 1}`];
      if (!url) return null;
      const handle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return {
        id: `${theme}-grid-${key}-${index + 1}`,
        title,
        handle,
        description: line,
        featuredImage: { url, altText: title },
        images: { edges: [{ node: { url, altText: title } }] },
        variants: {
          edges: [{ node: { id: `${theme}-grid-variant-${key}-${index + 1}`, price: "29.00" } }],
        },
      };
    })
    .filter(Boolean);
}
