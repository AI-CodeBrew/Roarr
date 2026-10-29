/**
 * Liquid preview constants - re-exports all template defaults and shared config.
 *
 * BLOCK_TYPOGRAPHY_SETTINGS: Edit this object to apply fonts/typography to ALL blocks.
 * Liquid reads from block.settings - no config panel needed.
 * Font objects need { family: "Font Name", fallback_families: "Arial, sans-serif" }.
 * Use null for inherit, or system fonts (Helvetica, Georgia, Arial) that require no loading.
 */

export const DEFAULT_SHOP = {
    /** Base URL for share links in section previews (Shopify `shop.url`). */
    url: "https://example.com",
    metafields: { app: { block_control: { value: true } } }
};

/** Shared typography settings – edit here to apply to all blocks. Liquid reads from block.settings. */
export const BLOCK_TYPOGRAPHY_SETTINGS = {
    use_metafields_bg: true,
    background_color: "#ffffff",
    background_opacity: 10,
    container_max_width: 1250,
    heading_font_family: { family: "Georgia", fallback_families: "serif" },
    body_font_family: { family: "Georgia", fallback_families: "serif" },
    body_size: 16,
    body_weight: 400,
    h1_size: 48,
    h1_weight: 700,
    h2_size: 36,
    h2_weight: 700,
    h3_size: 30,
    h3_weight: 600,
    h4_size: 24,
    h4_weight: 600,
    h5_size: 20,
    h5_weight: 500,
    h6_size: 16,
    h6_weight: 500
};



/** HERO Section - Combines Roarr Hero, Product Details, Buy Now Button, Delivery Estimator, Frequently Bought, Accordion */
export const HERO_SECTION_BLOCK = {
    id: "hero_section_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        background_color: "#ffffff",
        background_opacity: 10,
        pad_left_x: 20,
        pad_left_y: 40,
        pad_right_x: 40,
        pad_right_y: 40,
        show_thumbs: true,
        thumbs_count: 3,
        thumb_position: "right",
        gallery_width: 90,
        main_radius: 12,
        thumb_radius: 8,
        container_max_width: 1250,
        show_faq: false,
        faq_margin_top: 20,
        faq_bg_color: "#ffffff",
        faq_border_color: "#e0e0e0",
        faq_color_q: "#000000",
        faq_color_a: "#555555",
        faq_icon_bg: "#f0f0f0",
        faq_icon_color: "#333333",
        faq_q1: "Shipping info?",
        faq_a1: "Ships in 3 days.",
        faq_q2: "Returns?",
        faq_a2: "30-day returns.",
        faq_q3: "",
        faq_a3: "",
        faq_q4: "",
        faq_a4: "",
        faq_q5: "",
        faq_a5: "",
        /* Product Details */
        badge_text: "Featured Product",
        badge_shape: "ribbon",
        badge_align: "center",
        content_align: "center",
        show_rating: false,
        rating_text_align: "center",
        show_price: true,
        price_align: "center",
        variants_align: "center",
        variants_border_radius: 8,
        show_features: true,
        features_text: "Feature 1#Feature 2#Feature 3",
        subtitle: "<p>Enter your Text</p>",
        feature_1_text: "Natural Radiance",
        feature_2_text: "Premium Quality",
        feature_3_text: "Proven Results",
        /* Buy Now Button */
        button_text: "Buy Now",
        button_width: 100,
        button_border_radius: 12,
        button_height: 48,
        quantity_style: "option1",
        quantity_border_radius: 12,
        quantity_width: 150,
        /* Delivery Estimator */
        show_delivery_estimator: true,
        show_simple_line: false,
        processing_days: 2,
        delivery_days_after_processing: 3,
        /* Frequently Bought Together */
        show_frequently_bought: true,
        fbt_heading: "Frequently Bought Together",
        fbt_layout_mode: "slider",
        product_list: [],
        /* Accordion (below FBT) */
        show_accordion: true,
        accordion_number_of_items: 4,
        accordion_show_tick_icon: true,
        accordion_toggle_icon: "+",
        accordion_card_style: false,
        accordion_use_metafields: true,
        accordion_heading_1: "How to create a romantic mood?",
        accordion_content_1: "<p>Plug in, turn on, and enjoy dynamic peacock projections.</p>",
        accordion_heading_2: "Can I customize the lighting?",
        accordion_content_2: "<p>Yes, adjust brightness and set timers easily via remote.</p>",
        accordion_heading_3: "When will I see the full effect?",
        accordion_content_3: "<p>Immediately after turning on, enjoy vibrant, colorful displays.</p>",
        accordion_heading_4: "Is it safe for children?",
        accordion_content_4: "<p>Yes, it's battery operated with child-safe material, use under supervision.</p>"
    }
};


export const ACCORDION_BLOCK = {
    id: "accordion_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        number_of_items: 4,
        show_tick_icon: true,
        toggle_icon: "+",
        card_style: false,
        heading_1: "Enter your text!",
        content_1: "<p>Enter your text!</p>",
        heading_2: "Enter your text!",
        content_2: "<p>Enter your text!</p>",
        heading_3: "Enter your text!",
        content_3: "<p>Enter your text!</p>",
        heading_4: "Enter your text!",
        content_4: "<p>Enter your text!</p>"
    }
};

// const DEFAULT_BEFORE_IMAGE = "";
// const DEFAULT_AFTER_IMAGE = "";

export const BEFORE_AFTER_BLOCK = {
    id: "block_123",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        img_pos: "right",
        heading: "Results",
        subheading: "See the difference yourself",
        bullet_style: "check",
        bullet_shape: "circle",
        show_comparison_table: true,
        feat_1: "Visible improvement",
        feat_2: "Fast results",
        feat_3: "Easy to use",
        feat_4: "High quality",
        before_issue_1: "Dry or dull",
        before_issue_2: "Uneven tone",
        before_issue_3: "Lack of hydration",
        after_benefit_1: "Vibrant color",
        after_benefit_2: "Smooth texture",
        after_benefit_3: "Long-lasting finish",
        button_label: "Try it Yourself",
        button_radius: 8,
        before_image: null,
        after_image: null
    }
};

export const BUNDLE_BLOCK = {
    id: "bundle_1",
    settings: {}
};

/** Frequently Bought Together - mock product_list for preview */
export function buildFbtProductList(product) {
    const imgs = product?.media?.map((m) => m.preview_image) || [];
    const defaultImgs = [
    ];
    const urls = imgs.length ? imgs : defaultImgs;
    return urls.slice(0, 3).map((img, i) => {
        const v = { id: `fbt-variant-${i + 1}`, price: 1999 + i * 500, available: true };
        return {
            url: "#",
            title: `Related Product ${i + 1}`,
            featured_image: typeof img === "string" ? img : (img?.src || img?.preview_image || defaultImgs[i]),
            selected_or_first_available_variant: v
        };
    });
}

export const FREQUENTLY_BOUGHT_BLOCK = {
    id: "fbt_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        heading: "Frequently Bought Together",
        product_list: [], // populated at render time from product
        layout_mode: "slider"
    }
};

export const BUY_NOW_BUTTON_BLOCK = {
    id: "buy_now_button_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        button_text: "Buy Now",
        button_width: 100,
        button_border_radius: 12,
        button_height: 48,
        quantity_style: "option1",
        quantity_border_radius: 0,
        quantity_width: 150
    }
};

export const CIRCULAR_FEATURE_RING_BLOCK = {
    id: "circular_feature_ring_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        image: "",
        image_position: "center",
        image_border_radius: 50,
        mobile_layout: "timeline",
        mobile_cards_layout: "stacked",
        heading: "Transform Your Routine",
        subheading: "The lamp's soft, adjustable glow creates a calming environment.",
        feature1_title: "Relaxation",
        feature1_text: "Promotes a soothing atmosphere for winding down.",
        feature2_title: "Versatility",
        feature2_text: "Adjust the light to match any mood or activity.",
        feature3_title: "Comfort",
        feature3_text: "Creates a cozy space for deeper rest and recovery.",
        feature4_title: "Tranquility",
        feature4_text: "Helps you unwind and clear your mind after a long day."
    }
};

export const COMPARISON_TABLE_BLOCK = {
    id: "comparison_table_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        table_position: "right",
        text_align: "center",
        table_borders: "full",
        table_border_color: "#e5e5e5",
        subheading: "<p>Subheading</p>",
        show_shop_button: false,
        shop_button_label: "Shop now",
        shop_button_url: "",
        shop_button_radius: 8,
        feature_col_label: "Features",
        brand_label: "Us",
        // show_us_header_image: true,
        // us_column_bg: "#fafafa",
        us_column_text: "",
        others_label: "Others",
        icon_yes_char: "✓",
        icon_no_char: "✕",
        mark_circle: true,
        number_of_rows: 3,
        row1_feature: "Feature 1",
        row2_feature: "Feature 2",
        row3_feature: "Feature 3",
        row4_feature: "",
        row5_feature: ""
    }
};

export const DELIVERY_ESTIMATOR_BLOCK = {
    id: "delivery_estimator_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        show_delivery_estimator: true,
        show_simple_line: false,
        processing_days: 2,
        delivery_days_after_processing: 3,
        show_service_accordion: true,
        title_1: "Guarantee",
        content_1: "We Guarantee the effectiveness of our products.",
        title_2: "Shipping",
        content_2: "All of our orders are shipped through secure and reliable shipping partners.",
        title_3: "Support",
        content_3: "Our support team is available anytime to help you with your questions."
    }
};

export const FAQ_BLOCK = {
    id: "faq_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        question_1: "Enter your question",
        answer_1: "<p>Enter your answer here.</p>",
        question_2: "Enter your question",
        answer_2: "<p>Enter your answer here.</p>",
        question_3: "Enter your question",
        answer_3: "<p>Enter your answer here.</p>",
        question_4: "Enter your question",
        answer_4: "<p>Enter your answer here.</p>",
        question_5: "Enter your question",
        answer_5: "<p>Enter your answer here.</p>",
        hide_roarr_credit: false
    }
};

/** Roarr - FAQ Section (new design with external CSS/JS) */
export const NEW_FAQ_BLOCK = {
    id: "new_faq_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: false,
        background_color: "#ffffff",
        background_opacity: 100,
        container_max_width: 900,
        title: "Frequently Asked Questions",
        subtitle: "Our support team is here to assist with any inquiries.",
        text_alignment: "center",
        item_bg: "#F7F7F7",
        item_radius: 8,
        icon_bg: "#FFFFFF",
        icon_color: "#000000",
        question_1: "When will my order ship?",
        answer_1: "<p>We process orders quickly to ensure timely shipping. Once your order is dispatched, you'll receive a confirmation email with tracking details.</p>",
        question_2: "What is your return policy?",
        answer_2: "<p>We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a hassle-free return.</p>",
        question_3: "How can I track my order?",
        answer_3: "<p>After your order ships, you'll receive an email with a tracking number. You can also log into your account to see order status.</p>",
        question_4: "",
        answer_4: "",
        question_5: "",
        answer_5: ""
    }
};

export const TRUST_BADGES_BLOCK = {
    id: "trust_badges_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        background_color: "#ffffff",
        background_opacity: 100,
        container_max_width: 1400,
        padding_v_d: 40,
        padding_v_m: 30,
        alignment: "center",
        item_bg: "transparent",
        item_border: "#e5e5e5",
        item_text: "#000000",
        badge_radius: 50,
        gap_d: 20,
        gap_m: 15,
        // icon_bg: "#EAE2D6",
        icon_color: "#000000",
        icon_size_d: 32,
        icon_size_m: 28,
        mobile_auto_scroll: true,
        scroll_speed: 20,
        badge_1_text: "Free Shipping",
        badge_1_icon: null,
        badge_2_text: "Money Guarantee",
        badge_2_icon: null,
        badge_3_text: "Online Support",
        badge_3_icon: null,
        badge_4_text: "",
        badge_4_icon: null,
        badge_5_text: "",
        badge_5_icon: null
    }
};

export const PILLOW_BANNER_BLOCK = {
    id: "pillow_banner_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 100,
        container_max_width: 1250,
        image: null,
        corner_radius: 48,
        button_position: "top-right",
        scoop_radius: 20,
        btn_text: "Our philosophy",
        btn_link: "#",
        btn_bg: "#E6FF9E",
        btn_text_color: "#000000",
        btn_circle_bg: "#000000",
        btn_arrow_color: "#FFFFFF",
        heading: "Committed to sleep\nand second chance",
        subtext: "Rest fuels renewal, and second chances offer growth.",
        body_size: 18,
        h2_size: 64,
        h2_weight: 500
    }
};

export const BENTO_GRID_BLOCK = {
    id: "bento_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        heading_color: "#ffffff",
        text_position_vertical: "bottom",
        text_position_horizontal: "left",
        layout: "three_blocks",
        cell_1_image: null,
        cell_1_heading: "Vivid Projections",
        cell_1_text: "Displays intricate peacock feathers and animal motifs vividly.",
        cell_2_image: null,
        cell_2_heading: "Remote Control",
        cell_2_text: "Easily adjust settings from across the room.",
        cell_3_image: null,
        cell_3_heading: "Customizable Brightness",
        cell_3_text: "Set the perfect glow for every mood and occasion."
    }
};

export const FOUR_BLOCKS_BLOCK = {
    id: "four_blocks_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        layout: "layout_1",
        text_align: "center",
        show_border: true,
        image_radius: 50,
        heading: "Enter text",
        subheading: "<p>Enter text</p>",
        block_1_image: "",
        block_1_heading: "Heading 1",
        block_1_subheading: "Subheading 1",
        block_2_image: "",
        block_2_heading: "Heading 2",
        block_2_subheading: "Subheading 2",
        block_3_image: "",
        block_3_heading: "Heading 3",
        block_3_subheading: "Subheading 3",
        block_4_image: "",
        block_4_heading: "Heading 4",
        block_4_subheading: "Subheading 4"
    }
};

export const HEADING_SUBHEADING_BLOCK = {
    id: "heading_subheading_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        show_heading_subheading: true,
        heading: "Loved by thousands",
        subheading: "Discover why people trust our products.",
        show_highlights: false,
        marquee_speed: 20,
        highlights_border_radius: 24,
        heading_start: "Harness nature's power with our",
        heading_italic: "skincare."
    }
};

export const IMAGE_WITH_TEXT_BLOCK = {
    id: "image_with_text_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        image: "",
        image_position: "left",
        container_radius: 0,
        container_padding: 0,
        heading: "Enter your heading",
        subheading_1: "Subheading 1",
        subheading_1_desc: "Description for subheading 1",
        subheading_2: "Subheading 2",
        subheading_2_desc: "Description for subheading 2",
        subheading_3: "Subheading 3",
        subheading_3_desc: "Description for subheading 3",
        subheading_4: "Subheading 4",
        subheading_4_desc: "Description for subheading 4"
    }
};

// const DEFAULT_IMPACT_IMAGE = "";

export const IMPACT_STAT_BLOCK = {
    id: "impact_stat_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        heading: "Why Choose Our Peacock Lamp",
        image: null,
        row1_title: "Instant Visual Impact",
        row1_body: "<p>Enjoy mesmerizing projections immediately after activation.</p>",
        row1_percent: 95,
        row2_title: "Adjustable Brightness",
        row2_body: "<p>Customize light intensity to match your mood or setting.</p>",
        row2_percent: 92,
        row3_title: "Auto Sleep Timer",
        row3_body: "<p>Set the device to turn off after 30 or 60 minutes easily.</p>",
        row3_percent: 88
    }
};

export const LOVED_BY_EVERYONE_BLOCK = {
    id: "loved_by_everyone_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        heading: "Loved by Everyone!",
        subheading: "",
        image_1: "",
        image_2: "",
        image_3: ""
    }
};

export const PRODUCT_DETAILS_BLOCK = {
    id: "product_details_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10,
        badge_text: "Featured Product",
        badge_shape: "ribbon",
        badge_align: "center",
        content_align: "center",
        show_rating: false,
        rating_text_align: "center",
        show_price: true,
        price_align: "center",
        variants_align: "center",
        variants_border_radius: 8,
        show_features: true,
        features_text: "Feature 1#Feature 2#Feature 3"
    }
};

export const TEXT_MARQUEE_BLOCK = {
    id: "text_marquee_1",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 100,
        marquee_bg_color: null,
        direction: "left",
        speed_d: 30,
        speed_m: 15,
        rotation: 0,
        mask_width: 50,
        pause_hover: false,
        gap_d: 60,
        gap_m: 30,
        container_max_width: 2000,
        padding_v: 20,
        img_height_d: 60,
        img_height_m: 40,
        img_radius: 10,
        text_color: "#000000",
        h2_size: 64,
        h2_weight: 500,
        text_1: "Vegan",
        text_2: "Cruelty-Free",
        text_3: "Silicone-Free",
        image_1: null,
        image_2: null,
        image_3: null
    }
};

/** Block config for product-section (Roarr Hero Block) - two-panel layout with product media */
export const PRODUCT_SECTION_BLOCK = {
    id: "product-section-hero",
    settings: {
        ...BLOCK_TYPOGRAPHY_SETTINGS,
        show_media: true,
        media_corner_radius: 12,
        use_metafields: true,
        show_background: true,
        background_color: "#ffffff",
        background_opacity: 10
    }
};


import { HEALTH_BEAUTY_TEMPLATE_SETTINGS } from "./health-beauty-template-settings.js";
import { GENERAL_TEMPLATE_SETTINGS } from "./general-template-settings.js";
import { HOME_KITCHEN_TEMPLATE_SETTINGS } from "./home-kitchen-template-settings.js";
import { FASHION_TEMPLATE_SETTINGS } from "./fashion-template-settings.js";
import { CAR_ACCESSORIES_TEMPLATE_SETTINGS } from "./car-accessories-template-settings.js";
import { KIDS_TOYS_TEMPLATE_SETTINGS } from "./kids-toys-template-settings.js";

/**
 * Template presets for ALL blocks by category + template number.
 * Each block key maps to settings merged over the default block.
 * Source: JSON theme structure (sections + blocks).
 */
const TEMPLATE_PRESETS = {
    "health-beauty": HEALTH_BEAUTY_TEMPLATE_SETTINGS,
    "general": GENERAL_TEMPLATE_SETTINGS,
    "home-kitchen": HOME_KITCHEN_TEMPLATE_SETTINGS,
    "fashion": FASHION_TEMPLATE_SETTINGS,
    "car-accessories": CAR_ACCESSORIES_TEMPLATE_SETTINGS,
    "kids-toys": KIDS_TOYS_TEMPLATE_SETTINGS
};

/**
 * Returns the block key → block constant map. Defined after HERO_SECTION_BLOCK to avoid TDZ.
 */
function getBlockMap() {
    return {
        "hero-section": HERO_SECTION_BLOCK,
        "bundle": BUNDLE_BLOCK,
        "text-marquee": TEXT_MARQUEE_BLOCK,
        "text-marquee-2": TEXT_MARQUEE_BLOCK,
        "bento-grid": BENTO_GRID_BLOCK,
        "before-after": BEFORE_AFTER_BLOCK,
        "four-blocks": FOUR_BLOCKS_BLOCK,
        "circular-feature-ring": CIRCULAR_FEATURE_RING_BLOCK,
        "trust-badges": TRUST_BADGES_BLOCK,
        "impact-stat": IMPACT_STAT_BLOCK,
        "image-with-text": IMAGE_WITH_TEXT_BLOCK,
        "comparison-table": COMPARISON_TABLE_BLOCK,
        "new-faq": NEW_FAQ_BLOCK,
        "delivery-estimator": DELIVERY_ESTIMATOR_BLOCK,
        "frequently-bought": FREQUENTLY_BOUGHT_BLOCK,
        "pillow-banner": PILLOW_BANNER_BLOCK,
        "heading-subheading": HEADING_SUBHEADING_BLOCK,
        "loved-by-everyone": LOVED_BY_EVERYONE_BLOCK,
        faq: FAQ_BLOCK
    };
}

/**
 * Returns settings for a specific block type. Merges template preset over default block.
 * @param {string} category - e.g. "health-beauty", "general"
 * @param {number} templateNumber - 1 or 2
 * @param {string} blockKey - e.g. "hero-section", "text-marquee", "bento-grid"
 * @returns {object} Settings object for the block
 */
export function getBlockSettings(category, templateNumber, blockKey) {
    const cat = (category || "").toLowerCase().trim();
    const blockMap = getBlockMap();
    const block = blockMap[blockKey];
    const defaultSettings = block?.settings ?? {};

    const templates = TEMPLATE_PRESETS[cat];
    if (!templates) return { ...defaultSettings };

    const preset = templates[templateNumber];
    if (!preset) return { ...defaultSettings };

    const blockPreset = preset[blockKey];
    if (!blockPreset) return { ...defaultSettings };

    return { ...defaultSettings, ...blockPreset };
}

