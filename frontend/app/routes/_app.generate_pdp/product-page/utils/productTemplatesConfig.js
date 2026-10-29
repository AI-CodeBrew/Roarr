import {
  DEFAULT_SHOP,
  BEFORE_AFTER_BLOCK,
  LOVED_BY_EVERYONE_BLOCK,
  IMAGE_WITH_TEXT_BLOCK,
  HERO_SECTION_BLOCK,
  TEXT_MARQUEE_BLOCK,
  HEADING_SUBHEADING_BLOCK,
  CIRCULAR_FEATURE_RING_BLOCK,
  IMPACT_STAT_BLOCK,
  FOUR_BLOCKS_BLOCK,
  COMPARISON_TABLE_BLOCK,
  FAQ_BLOCK,
  NEW_FAQ_BLOCK,
  buildFbtProductList,
  BENTO_GRID_BLOCK,
  PILLOW_BANNER_BLOCK,
  TRUST_BADGES_BLOCK,
  getBlockSettings
} from "./liquid-schema-settings";
/**
 * Category values from the app / detect-store-category (snake_case) → liquid-schema folder names.
 * Must stay in sync with `CATEGORY_OPTIONS` in ProductFlowStructure / StoreFlowStructure.
 */
const STOCK_CATEGORY_SLUG_TO_FOLDER = {
  car_accessories: "car-accessories",
  fashion: "fashion",
  health_beauty: "health-beauty",
  home_kitchen: "home-kitchen",
  kids_toys: "kids-toys",
  general: "general",
};

/**
 * Maps detected category to folder/key used for template flow
 */
export function getCategoryFolder(category) {
  if (category == null || String(category).trim() === "") return "general";
  const normalized = String(category).trim().toLowerCase().replace(/\s+/g, "_");
  if (STOCK_CATEGORY_SLUG_TO_FOLDER[normalized]) {
    return STOCK_CATEGORY_SLUG_TO_FOLDER[normalized];
  }
  // Free-text / legacy API responses
  const categoryLower = normalized;
  if (categoryLower.includes("health") || categoryLower.includes("beauty")) {
    return "health-beauty";
  }
  if (categoryLower.includes("home") || categoryLower.includes("kitchen")) {
    return "home-kitchen";
  }
  if (categoryLower.includes("fashion") || categoryLower.includes("apparel")) {
    return "fashion";
  }
  if (categoryLower.includes("car") || categoryLower.includes("vehicle")) {
    return "car-accessories";
  }
  if (categoryLower.includes("kids") || categoryLower.includes("toys") || categoryLower.includes("children")) {
    return "kids-toys";
  }
  return "general";
}

/**
 * Builds block with template settings
 */
export function blockWithSettings(Block, blockKey, categoryFolder, templateNumber, overrides = {}) {
  const settings = { ...getBlockSettings(categoryFolder, templateNumber, blockKey), ...overrides };
  // Liquid `trust-badges` reads `badge_text_N`; category JSON uses `badge_N_text`.
  for (let i = 1; i <= 5; i++) {
    const liquidKey = `badge_text_${i}`;
    const schemaKey = `badge_${i}_text`;
    if (settings[schemaKey] && !settings[liquidKey]) settings[liquidKey] = settings[schemaKey];
    if (settings[liquidKey] && !settings[schemaKey]) settings[schemaKey] = settings[liquidKey];
    const liquidIcon = `badge_icon_${i}`;
    const schemaIcon = `badge_${i}_icon`;
    if (settings[schemaIcon] && !settings[liquidIcon]) settings[liquidIcon] = settings[schemaIcon];
    if (settings[liquidIcon] && !settings[schemaIcon]) settings[schemaIcon] = settings[liquidIcon];
  }
  const uniqueId = blockKey.replace(/-/g, '_');
  return { ...Block, id: uniqueId, settings };
}

/**
 * Generates templatesConfig for a specific template number
 */
export function generateTemplateConfig(detectedCategory, productData, templateNumber, form = {}) {
  const categoryFolder = getCategoryFolder(detectedCategory);
  const product = productData?.product;
  const shop = DEFAULT_SHOP;

  const pillowBlock = {
    ...PILLOW_BANNER_BLOCK,
    settings: {
      ...getBlockSettings(categoryFolder, templateNumber, "pillow-banner"),
      show_background: form.show_background !== false && form.show_background !== "false"
    }
  };

  let rows;

  // Frost (template 6) — same layout for every category
  if (templateNumber === 6) {
    const frostSection = (id, displayName) => [{
      template: id.replace(/_/g, "-"),
      displayName,
      context: { product, block: { id, settings: {} }, shop },
    }];
    return [
      frostSection("frost_hero", "Hero"),
      frostSection("frost_bento", "Highlights"),
      frostSection("frost_steps", "How it works"),
      frostSection("frost_specs", "Specifications"),
      frostSection("frost_faq", "Quick answers"),
      frostSection("frost_promise", "Promise"),
      frostSection("frost_closing", "Closing"),
    ];
  }

  // Noir (template 5) — same layout for every category
  if (templateNumber === 5) {
    const noirSection = (id, displayName) => [{
      template: id.replace(/_/g, "-"),
      displayName,
      context: { product, block: { id, settings: {} }, shop },
    }];
    return [
      noirSection("noir_hero", "Hero"),
      noirSection("noir_ticker", "Ticker"),
      noirSection("noir_statement", "Statement"),
      noirSection("noir_craft", "The craft"),
      noirSection("noir_compare", "Comparison"),
      noirSection("noir_faq", "FAQs"),
      noirSection("noir_closing", "Closing"),
    ];
  }

  // Lumenook (template 4) — same layout for every category
  if (templateNumber === 4) {
    const lumenSection = (id, displayName) => [{
      template: id.replace(/_/g, "-"),
      displayName,
      context: { product, block: { id, settings: {} }, shop },
    }];
    return [
      lumenSection("lumen_hero", "Hero"),
      lumenSection("lumen_detail", "In detail"),
      lumenSection("lumen_feature", "Feature"),
      lumenSection("lumen_details", "The details"),
      lumenSection("lumen_circle", "Chosen with care"),
      lumenSection("lumen_mood", "Mood"),
    ];
  }

  // Aura (template 3) — same layout for every category
  if (templateNumber === 3) {
    const glowSection = (id, displayName) => [{
      template: id.replace(/_/g, "-"),
      displayName,
      context: { product, block: { id, settings: {} }, shop },
    }];
    return [
      glowSection("glow_hero", "Hero"),
      glowSection("glow_special", "Why it's special"),
      glowSection("glow_stats", "Results"),
      glowSection("glow_ingredients", "Ingredients"),
      glowSection("glow_steps", "How to use"),
      glowSection("glow_faq", "FAQs"),
    ];
  }

  // Template configurations for different categories
  if (categoryFolder === "health-beauty") {
    if (templateNumber === 2) {
      rows = [
        [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 2, { product_list: buildFbtProductList(product) }), shop } }],
        [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 2), shop } }],
        [{ template: "heading-subheading", context: { product, block: blockWithSettings(HEADING_SUBHEADING_BLOCK, "heading-subheading", categoryFolder, 2), shop } }],
        [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", categoryFolder, 2), shop } }],
        [{ template: "before-after", context: { product, block: blockWithSettings(BEFORE_AFTER_BLOCK, "before-after", categoryFolder, 2), shop } }],
        [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 2), shop } }],
        [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 2), shop } }],
        [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 2), shop } }],
        [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", categoryFolder, 2), shop } }],
        [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 2), shop } }],
        [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", categoryFolder, 2), shop } }],
      ];
      return rows;
    }
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 1, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 1), shop } }],
      [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", categoryFolder, 1), shop } }],
      [{ template: "before-after", context: { product, block: blockWithSettings(BEFORE_AFTER_BLOCK, "before-after", categoryFolder, 1), shop } }],
      [{ template: "text-marquee", context: { product: { ...product, color_schema: null }, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee-2", categoryFolder, 1), shop } }],
      [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 1), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 1), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 1), shop } }],
      [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", categoryFolder, 1), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 1), shop } }],
      [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 1), shop } }],
      [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", categoryFolder, 1), shop } }],
    ];
    return rows;
  }

  if (categoryFolder === "fashion") {
    // Premium PDP stacks (same style as other categories). Do not route Sleek/Vibe
    // to store simple `product.roarr-fashion-*` templates — that looked like the
    // simple product page in Entire Store demo preview.
    if (templateNumber === 2) {
      rows = [
        [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 2, { product_list: buildFbtProductList(product) }), shop } }],
        [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 2), shop } }],
        [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", categoryFolder, 2), shop } }],
        [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 2), shop } }],
        [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 2), shop } }],
        [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 2), shop } }],
        [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 2), shop } }],
        [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 2), shop } }],
        [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", categoryFolder, 2), shop } }],
      ];
      return rows;
    }
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 1, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", "fashion", 1), shop } }],
      [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", "fashion", 1), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", "fashion", 1), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", "fashion", 1), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", "fashion", 1), shop } }],
      [{ template: "pillow-banner", context: { product, block: blockWithSettings(PILLOW_BANNER_BLOCK, "pillow-banner", "fashion", 1), shop } }],
      [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", "fashion", 1), shop } }],
    ];
    return rows;
  }

  if (categoryFolder === "home-kitchen") {
    if (templateNumber === 2) {
      rows = [
        [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 2, { product_list: buildFbtProductList(product) }), shop } }],
        [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 2), shop } }],
        [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", categoryFolder, 2), shop } }],
        [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 2), shop } }],
        [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 2), shop } }],
        [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 2), shop } }],
        [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 2), shop } }],
        [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 2), shop } }],
        [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", categoryFolder, 2), shop } }],
      ];
      return rows;
    }
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 1, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 1), shop } }],
      [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", categoryFolder, 1), shop } }],
      [{ template: "text-marquee", context: { product: { ...product, color_schema: null }, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee-2", categoryFolder, 1), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 1), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 1), shop } }],
      [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 1), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 1), shop } }],
      [{ template: "pillow-banner", context: { product, block: pillowBlock, shop } }],
      [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 1), shop } }],
      [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", categoryFolder, 1), shop } }],
    ];
    return rows;
  }

  if (categoryFolder === "kids-toys") {
    if (templateNumber === 3) {
      const playSection = (id, displayName) => [{
        template: id.replace(/_/g, "-"),
        displayName,
        context: { product, block: { id, settings: {} }, shop },
      }];
      return [
        playSection("play_hero", "Hero"),
        playSection("play_marquee", "Ticker"),
        playSection("play_features", "Features"),
        playSection("play_promo", "Promo"),
        playSection("play_story", "Story"),
        playSection("play_designed", "Thoughtfully Designed"),
        playSection("play_badges", "Badges"),
        playSection("play_circles", "Round photos"),
        playSection("play_reviews", "Reviews"),
        playSection("play_instagram", "Instagram"),
      ];
    }
    if (templateNumber === 2) {
      rows = [
        [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", "kids-toys", 2, { product_list: buildFbtProductList(product) }), shop } }],
        [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", "kids-toys", 2), shop } }],
        [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", "kids-toys", 2), shop } }],
        [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", "kids-toys", 2), shop } }],
        [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", "kids-toys", 2), shop } }],
        [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", "kids-toys", 2), shop } }],
        [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", "kids-toys", 2), shop } }],
        [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", "kids-toys", 2), shop } }],
        [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", "kids-toys", 2), shop } }],
        [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", "kids-toys", 2), shop } }],
      ];
      return rows;
    }
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", "kids-toys", 1, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", "kids-toys", 1), shop } }],
      [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", "kids-toys", 1), shop } }],
      [{ template: "text-marquee", context: { product: { ...product, color_schema: null }, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee-2", "kids-toys", 1), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", "kids-toys", 1), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", "kids-toys", 1), shop } }],
      [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", "kids-toys", 1), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", "kids-toys", 1), shop } }],
      [{ template: "pillow-banner", context: { product, block: blockWithSettings(PILLOW_BANNER_BLOCK, "pillow-banner", "kids-toys", 1), shop } }],
      [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", "kids-toys", 1), shop } }],
      [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", "kids-toys", 1), shop } }],
    ];
    return rows;
  }

  if (categoryFolder === "car-accessories") {
    if (templateNumber === 2) {
      rows = [
        [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", "car-accessories", 2, { product_list: buildFbtProductList(product) }), shop } }],
        [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", "car-accessories", 2), shop } }],
        [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", "car-accessories", 2), shop } }],
        [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", "car-accessories", 2), shop } }],
        [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", "car-accessories", 2), shop } }],
        [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", "car-accessories", 2), shop } }],
        [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", "car-accessories", 2), shop } }],
        [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", "car-accessories", 2), shop } }],
        [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", "car-accessories", 2), shop } }],
        [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", "car-accessories", 2), shop } }],
      ];
      return rows;
    }
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", "car-accessories", 1, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", "car-accessories", 1), shop } }],
      [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", "car-accessories", 1), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", "car-accessories", 1), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", "car-accessories", 1), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", "car-accessories", 1), shop } }],
      [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", "car-accessories", 1), shop } }],
      [{ template: "text-marquee", context: { product: { ...product, color_schema: null }, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee-2", "car-accessories", 1), shop } }],
      [{ template: "pillow-banner", context: { product, block: blockWithSettings(PILLOW_BANNER_BLOCK, "pillow-banner", "car-accessories", 1), shop } }],
      [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", "car-accessories", 1), shop } }],
      [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", "car-accessories", 1), shop } }],
    ];
    return rows;
  }

  // General category (default)
  if (templateNumber === 2) {
    rows = [
      [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 2, { product_list: buildFbtProductList(product) }), shop } }],
      [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 2), shop } }],
      [{ template: "loved-by-everyone", context: { product, block: blockWithSettings(LOVED_BY_EVERYONE_BLOCK, "loved-by-everyone", categoryFolder, 2), shop } }],
      [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 2), shop } }],
      [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 2), shop } }],
      [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 2), shop } }],
      [{ template: "four-blocks", context: { product, block: blockWithSettings(FOUR_BLOCKS_BLOCK, "four-blocks", categoryFolder, 2), shop } }],
      [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", categoryFolder, 2), shop } }],
      [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 2), shop } }],
      [{ template: "faq", context: { product, block: blockWithSettings(FAQ_BLOCK, "faq", categoryFolder, 2), shop } }],
    ];
    return rows;
  }
  rows = [
    [{ template: "hero-section", context: { product, block: blockWithSettings(HERO_SECTION_BLOCK, "hero-section", categoryFolder, 1, { product_list: buildFbtProductList(product) }), shop } }],
    [{ template: "text-marquee", context: { product, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee", categoryFolder, 1), shop } }],
    [{ template: "bento-grid", context: { product, block: blockWithSettings(BENTO_GRID_BLOCK, "bento-grid", categoryFolder, 1), shop } }],
    [{ template: "image-with-text", context: { product, block: blockWithSettings(IMAGE_WITH_TEXT_BLOCK, "image-with-text", categoryFolder, 1), shop } }],
    [{ template: "trust-badges", context: { product, block: blockWithSettings(TRUST_BADGES_BLOCK, "trust-badges", categoryFolder, 1), shop } }],
    [{ template: "circular-feature-ring", context: { product, block: blockWithSettings(CIRCULAR_FEATURE_RING_BLOCK, "circular-feature-ring", categoryFolder, 1), shop } }],
    [{ template: "impact-stat", context: { product, block: blockWithSettings(IMPACT_STAT_BLOCK, "impact-stat", categoryFolder, 1), shop } }],
    [{ template: "text-marquee", context: { product: { ...product, color_schema: null }, block: blockWithSettings(TEXT_MARQUEE_BLOCK, "text-marquee-2", categoryFolder, 1), shop } }],
    [{ template: "pillow-banner", context: { product, block: pillowBlock, shop } }],
    [{ template: "comparison-table", context: { product, block: blockWithSettings(COMPARISON_TABLE_BLOCK, "comparison-table", categoryFolder, 1), shop } }],
    [{ template: "new-faq", context: { product, block: blockWithSettings(NEW_FAQ_BLOCK, "new-faq", categoryFolder, 1), shop } }],
  ];
  return rows;
}
