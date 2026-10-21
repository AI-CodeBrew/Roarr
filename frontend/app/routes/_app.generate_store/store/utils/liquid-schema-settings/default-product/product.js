/**
 * Default product page config for pf-new-default-product-hero + pf-trust-badges
 * Used when rendering Product view in StoreFlow
 */

export const DEFAULT_PRODUCT_PAGE_SETTINGS = {
    "pf-new-default-product-hero": {
        product: "",
        container_width: 1400,
        corner_radius: 18,
        button_radius: 40,
        block_spacing: 8,
        show_sticky_cart: true,
        title_size: 42,
        color_scheme: "scheme-1",
        image_bg: "#f4f4f4",
        accent_color: "#d32f2f",
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40,
        blocks: [
            {
                type: "badges",
                settings: {
                    show_new: true,
                    new_text: "New",
                    new_bg: "#4caf50",
                    new_color: "#ffffff",
                    show_sale: true,
                    sale_text: "Save [%]"
                }
            },
            {
                type: "title",
                settings: {
                    show_reviews: true,
                    review_text: "Top Quality"
                }
            },
            { type: "price", settings: {} },
            { type: "description", settings: {} },
            {
                type: "stock",
                settings: {
                    stock_text: "In stock and ready to ship",
                    stock_color: "#4caf50"
                }
            },
            {
                type: "variants",
                settings: {
                    enable_swatches: true,
                    swatch_trigger: "color,colour"
                }
            },
            {
                type: "bundle",
                settings: {}
            },
            {
                type: "buy_buttons",
                settings: {
                    add_to_cart_text: "Add To Cart",
                    show_dynamic_checkout: true
                }
            },
            {
                type: "trust_badges",
                settings: {
                    trust_1: "Orders over $50 ship free",
                    trust_2: "30 day returns"
                }
            },
            {
                type: "accordion",
                settings: {
                    title: "Shipping & Delivery",
                    content: "<p>Put your product details, ingredients, or how to use instructions here.</p>"
                }
            },
            {
                type: "accordion",
                settings: {
                    title: "Guarantee",
                    content: "<p>Put your product details, ingredients, or how to use instructions here.</p>"
                }
            },
            {
                type: "accordion",
                settings: {
                    title: "Friendly Support",
                    content: "<p>Put your product details, ingredients, or how to use instructions here.</p>"
                }
            }
        ]
    },
    "pf-trust-badges": {
        max_width: 1400,
        alignment: "center",
        color_scheme: "scheme-1",
        badge_color_scheme: "scheme-1",
        mobile_auto_scroll: true,
        scroll_speed: 20,
        border_width: 1,
        border_radius: 50,
        font_family: "body",
        font_weight: 400,
        pt_d: 40,
        pb_d: 40,
        gap_d: 20,
        font_size_d: 16,
        icon_size_d: 32,
        item_pad_x_d: 20,
        item_pad_y_d: 10,
        pt_m: 30,
        pb_m: 30,
        gap_m: 12,
        font_size_m: 14,
        icon_size_m: 28,
        item_pad_x_m: 15,
        item_pad_y_m: 8,
        blocks: [
            { type: "badge", settings: { text: "Free Shipping" } },
            { type: "badge", settings: { text: "Money Guarantee" } },
            { type: "badge", settings: { text: "Flexible Payment" } },
            { type: "badge", settings: { text: "Online Support" } }
        ]
    },
    "pf-split-feature": {
        use_kluck_ai_metafields: false,
        section_width: 1400,
        text_column_width: 50,
        border_radius: 20,
        color_scheme: "scheme-1",
        card_color_scheme: "scheme-2",
        image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa0bd95e_zambeel_ai_generated_image.png",
        eyebrow: "Gentle And Safe",
        heading: "Made for sensitive skin",
        text: "We create safe products that really work.",
        heading_size: 42,
        body_size: 16,
        eyebrow_size: 14,
        watermark_text: "",
        font_watermark: "serif",
        watermark_color: "#ffffff",
        btn_label: "Shop Now",
        btn_link: "",
        padding_top: 60,
        padding_bottom: 60
    },
    "pf-new-defaultprod-FAQ": {
        heading: "Questions check here",
        heading_alignment: "center",
        open_first: true,
        auto_close: true,
        container_width: 900,
        heading_size_desktop: 48,
        heading_size_mobile: 36,
        question_size: 22,
        bg_color: "#ffffff",
        text_color: "#000000",
        border_color: "#e0e0e0",
        padding_top_desktop: 80,
        padding_bottom_desktop: 80,
        padding_top_mobile: 50,
        padding_bottom_mobile: 50,
        blocks: [
            {
                type: "faq_item",
                settings: {
                    title: "How long does shipping take?",
                    answer: "<p>Shipping typically takes 5–7 business days within the United States. For international orders, shipping can take 10–15 business days, depending on the destination and customs processing times. You will receive a tracking number once your order has shipped so you can monitor its progress.</p>"
                }
            },
            {
                type: "faq_item",
                settings: {
                    title: "Does my piece come in any packaging?",
                    answer: "<p>Yes, all items arrive carefully packaged in our signature branded boxes.</p>"
                }
            },
            {
                type: "faq_item",
                settings: {
                    title: "Do you ship internationally?",
                    answer: "<p>Yes, we ship to over 50 countries worldwide. Shipping rates will be calculated at checkout.</p>"
                }
            },
            {
                type: "faq_item",
                settings: {
                    title: "What payment methods do you accept?",
                    answer: "<p>We accept all major credit cards, PayPal, Apple Pay, and Google Pay.</p>"
                }
            }
        ]
    }
};
