/**
 * Lumenook multi demo: the real Lumenook brand photography (hero, category banners, after-dark
 * split — from the actual Lumenook theme repo, not AI stock photos), with store-level copy in the
 * Lumenook voice. Used only for the in-app preview/card before a merchant generates their own
 * store; real generation still creates fresh AI images from the merchant's own products.
 */

const REAL = {
  hero: "/lumenook-assets/hero.jpg",
  lighting: "/lumenook-assets/category-lighting.jpg",
  desk: "/lumenook-assets/category-desk.jpg",
  afterDark: "/lumenook-assets/after-dark.jpg",
};

const LUMENOOK_STORE_TEXT = {
  marquee_text_1: "Free delivery over $75",
  marquee_text_2: "Easy 14-day returns",
  marquee_text_3: "Packed with care",

  banner_heading_1: "Considered pieces for a calmer day",
  banner_eyebrow_1: "Thoughtfully chosen objects that bring focus, comfort and style to your space.",

  top_product_punchline_1: "Sculptural Lighting",
  top_product_punchline_1_description: "Warm touch lamps and ambient evening glow.",
  collection_1: "lighting",
  top_product_punchline_2: "Considered Desk Objects",
  top_product_punchline_2_description: "Smart clocks, trays and tactile desk pieces.",
  collection_2: "desk-objects",

  featured_product_subheadline_1: "Best seller",
  featured_product_subheadline_2: "New in",
  featured_product_subheadline_3: "Staff pick",

  highlight_banner_section_subheading: "After hours",
  highlight_banner_section_heading: "Made for slow evenings",
  highlight_banner_section_description:
    "Softly considered pieces for the end of the day. Warm, calm and made to be lived with long after sunset.",

  star_product_feature_1: "Considered quality",
  star_product_feature_1_desc: "Chosen to last and to look good for years.",
  star_product_feature_2: "Delivered with care",
  star_product_feature_2_desc: "Packed carefully and sent straight to your door.",
  star_product_feature_3: "Easy returns",
  star_product_feature_3_desc: "Not quite right? Send it back within 14 days.",
  star_product_feature_4: "Ready to gift",
  star_product_feature_4_desc: "Beautifully boxed, with room for a handwritten note.",

  punchy_poetic_headline: "Light for your quiet corner.",

  faq_question_1: "How long does delivery take?",
  faq_answer_1: "Orders ship within 1 to 2 working days and arrive in 2 to 5 days, carefully packed.",
  faq_question_2: "Can I return an item?",
  faq_answer_2: "Yes. Send unused pieces back within 14 days for an exchange or a full refund.",
  faq_question_3: "Do you offer gift wrapping?",
  faq_answer_3: "Every order arrives beautifully boxed, and we can add a handwritten note at checkout.",
};

const LUMENOOK_STORE_IMAGES = {
  banner_image_1: REAL.hero,
  banner_image: REAL.hero,
  product_impact_image_1: REAL.lighting,
  product_impact_image_2: REAL.desk,
  highlight_image: REAL.afterDark,
  banner_image_2: REAL.afterDark,
};

/** Three real-photo demo "products" for the card/preview grid (no per-item SKU photography exists). */
const LUMENOOK_DEMO_PRODUCTS = [
  { title: "Desk Clock", description: "A quiet clock for a tidy desk.", image: REAL.hero },
  { title: "Table Lamp", description: "A warm touch lamp for evening light.", image: REAL.lighting },
  { title: "Desk Tray", description: "A considered tray for everyday carry.", image: REAL.desk },
];

/** Store-level home data for the Lumenook template demo/preview. Category is ignored: the real
 * Lumenook store has one consistent look, not a per-category rotation. */
export function buildLumenookHomeData() {
  return {
    text: { ...LUMENOOK_STORE_TEXT },
    images: { ...LUMENOOK_STORE_IMAGES },
  };
}

/** Product-grid cards for the Lumenook template demo/preview, built from the real brand photos. */
export function buildLumenookDemoGridProducts() {
  return LUMENOOK_DEMO_PRODUCTS.map((p, index) => {
    const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      id: `lumenook-grid-${index + 1}`,
      title: p.title,
      handle,
      description: p.description,
      featuredImage: { url: p.image, altText: p.title },
      images: { edges: [{ node: { url: p.image, altText: p.title } }] },
      variants: { edges: [{ node: { id: `lumenook-grid-variant-${index + 1}`, price: "29.00" } }] },
    };
  });
}
