
export const MULTI_PRODUCT_HOME_SETTINGS = {
    /* pf-k-hero-peek-slider: Hero Peek Slider */
    "pf-k-hero-peek-slider": {
        use_kluck_ai_metafields: false,
        "height_desktop": 550,
        "height_mobile": 300,
        "border_radius": 0,
        "autoplay_speed": 5000,
        "zoom_duration": 3,
        "padding_top": 5,
        color_scheme: "scheme-1",

        blocks: [
            {
                type: "slide",
                settings: {
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b009f66a_zambeel_ai_generated_image.jpg",
                    overlay: 0,
                    product: "",
                    slide_color_scheme: "scheme-1",
                    eyebrow: "Enter your text",
                    heading: "Enter your text",
                    btn_text: "Shop Now",
                    h_size: 40,
                    h_weight: "500",
                    content_max_width: 600,
                    e_size: 16,
                    h_align: "flex-start",
                    v_align: "center",
                    text_align: "left"
                }
            },
            {
                type: "slide",
                settings: {
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/759f44d3_zambeel_ai_generated_image.jpg",
                    overlay: 0,
                    product: "",
                    slide_color_scheme: "scheme-1",
                    eyebrow: "Enter your text",
                    heading: "Enter your text",
                    btn_text: "Shop Now",
                    h_size: 40,
                    h_weight: "500",
                    content_max_width: 600,
                    e_size: 16,
                    h_align: "flex-start",
                    v_align: "center",
                    text_align: "left"
                }
            },
            {
                type: "slide",
                settings: {
                    overlay: 0,
                    product: "",
                    slide_color_scheme: "scheme-1",
                    eyebrow: "Enter your text",
                    heading: "Enter your text",
                    btn_text: "Shop Now",
                    h_size: 40,
                    h_weight: "500",
                    content_max_width: 600,
                    e_size: 16,
                    h_align: "flex-start",
                    v_align: "center",
                    text_align: "left"
                }
            }
        ]
    },

    /* pf-inline-headline: Inline Image Headline */
    "pf-inline-headline": {
        // Layout & Colors
        color_scheme: "scheme-1",

        // Global Typography
        size_desktop: 69,
        size_mobile: 45,
        line_height: 1.6,
        max_width: 1100,

        // Spacing
        padding_top: 70,
        padding_bottom: 100,

        // Blocks (order: text_segment, image_pill, text_segment, line_break, text_segment, image_pill, text_segment, image_pill)
        blocks: [
            { type: "text_segment", settings: { text: "Be your ", italic: false, font_family: "heading", text_scale: 100 } },
            { type: "image_pill", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0f1a84aa_zambeel_ai_generated_image.png", link: "" } },
            { type: "text_segment", settings: { text: "own eurus", italic: true, font_family: "accent", text_scale: 100 } },
            { type: "text_segment", settings: { text: ". Feeling", italic: false, font_family: "heading", text_scale: 100 } },
            { type: "line_break", settings: {} },
            { type: "text_segment", settings: { text: "confident ", italic: false, font_family: "heading", text_scale: 100 } },
            { type: "image_pill", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/34cd8af6_zambeel_ai_generated_image.jpg", link: "" } },
            { type: "text_segment", settings: { text: " in the skin ", italic: false, font_family: "heading", text_scale: 100 } },
            { type: "image_pill", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/81a9537f_zambeel_ai_generated_image.jpg", link: "" } },
            { type: "text_segment", settings: { text: " you are in.", italic: false, font_family: "heading", text_scale: 100 } }
        ]
    },

    /* pf-feature-product-section: Featured Products Slider */
    "pf-feature-product-section": {
        use_kluck_ai_metafields: false,
        title: "Our Featured Products",
        shop_btn_label: "Shop Now",
        color_scheme: "scheme-2",
        card_color_scheme: "scheme-2",
        container_pl: 20,
        track_offset: 0,
        card_width_d: 400,
        gap_d: 30,
        img_height_d: 300,
        card_width_m: 85,
        gap_m: 16,
        img_height_m: 250,
        card_radius: 20,
        show_shadow: false,
        btn_size_d: 12,
        btn_size_m: 11,
        btn_radius: 4,
        h_size_d: 42,
        h_size_m: 32,
        card_h_size_d: 20,
        card_h_size_m: 18,
        card_p_size_d: 16,
        card_p_size_m: 14,
        pt_d: 60,
        pb_d: 60,
        pt_m: 40,
        pb_m: 40,

        blocks: [
            {
                type: "product_card",
                settings: {
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e27ca92b_zambeel_ai_generated_image.png",
                    heading: "Glowy Warmth Bronzer",
                    text: "Love this sunscreen! It's non-greasy and blends well with makeup.",
                    product: {
                        title: "Glowy Warmth Bronzer",
                        featured_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e27ca92b_zambeel_ai_generated_image.png",

                    }
                }
            },
            {
                type: "product_card",
                settings: {
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa0bd95e_zambeel_ai_generated_image.png",
                    heading: "Summer Essentials",
                    text: "Curated picks for your routine.",
                    product: {
                        title: "Summer Essentials",
                        featured_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa0bd95e_zambeel_ai_generated_image.png",
                    }
                }
            },
            {
                type: "product_card",
                settings: {
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f7d895e5_zambeel_ai_generated_image.png",
                    heading: "Kitchen & Home",
                    text: "Tools that make everyday cooking easier.",
                    product: {
                        title: "Kitchen & Home",
                        featured_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f7d895e5_zambeel_ai_generated_image.png",
                    }
                }
            }
        ]
    },

    /* pf-collection-showcase: Collection Card Slider (Roarr - Collections) */
    "pf-collection-showcase": {
        use_kluck_ai_metafields: false,
        title: "Shop by Collection",
        main_h_size: 42,
        card_width_d: 85,
        desktop_height: 550,
        card_radius: 20,
        slide_gap: 20,
        track_offset: 48,
        container_pl: 20,
        h_size_d: 48,
        h_size_m: 32,
        p_size_d: 16,
        p_size_m: 14,
        color_scheme: "scheme-1",
        padding_top: 60,
        padding_bottom: 60,

        blocks: [
            {
                type: "collection_card",
                settings: {
                    collection: "",
                    layout_d: "row",
                    text_align: "center",
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b009f66a_zambeel_ai_generated_image.jpg",
                    eyebrow: "Featured",
                    title: "Glowy Warmth Bronzer",
                    text: "Love this sunscreen! It's non-greasy and blends well with makeup.",
                    btn_label: "Shop Now",
                    btn_link: "",
                    color_scheme: "scheme-2"
                }
            },
            {
                type: "collection_card",
                settings: {
                    collection: "",
                    layout_d: "row",
                    text_align: "center",
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/759f44d3_zambeel_ai_generated_image.jpg",
                    eyebrow: "Featured",
                    title: "Summer Essentials",
                    text: "Curated picks for your routine.",
                    btn_label: "Shop Now",
                    btn_link: "",
                    color_scheme: "scheme-2"
                }
            },
            {
                type: "collection_card",
                settings: {
                    collection: "",
                    layout_d: "row",
                    text_align: "center",
                    image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/217ae9c8_zambeel_ai_generated_image.jpg",
                    eyebrow: "Featured",
                    title: "Kitchen & Home",
                    text: "Tools that make everyday cooking easier.",
                    btn_label: "Shop Now",
                    btn_link: "",
                    color_scheme: "scheme-2"
                }
            }
        ]
    },

    /* infinite-marquee: Infinite Marquee */
    // "infinite-marquee": {
    //     bg_color: "#eae2d6",
    //     text_color: "#333333",
    //     speed: 120,
    //     icon_width: 30,
    //     gap: 50,
    //     pause_on_hover: true,
    //     padding_y: 15,

    //     blocks: [
    //         { type: "item", settings: { text: "Vegan", icon: "" } },
    //         { type: "item", settings: { text: "Cruelty-Free", icon: "" } },
    //         { type: "item", settings: { text: "Silicone-Free", icon: "" } },
    //         { type: "item", settings: { text: "Color-Safe", icon: "" } }
    //     ]
    // },

    /* pf-product-lookbook: Shoppable Bundle */
    // "pf-product-lookbook": {
    //     main_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e27ca92b_zambeel_ai_generated_image.png",
    //     image_radius: 16,
    //     desktop_layout: "left",
    //     subtitle: "Shop Skincare Set",
    //     title: "Level up skincare routine with the bundle",
    //     heading_size: 42,
    //     button_label: "Add All To Cart",
    //     color_scheme: "scheme-1",
    //     sale_color: "#d32f2f",
    //     pin_bg_color: "#ffffff",
    //     pin_text_color: "#000000",
    //     padding_top: 60,
    //     padding_bottom: 60,
    //     padding_top_mobile: 40,
    //     padding_bottom_mobile: 40,

    //     blocks: [
    //         {
    //             type: "product",
    //             settings: {
    //                 product: "annas-wild-yam-cream",
    //                 pos_x: 29,
    //                 pos_y: 40
    //             }
    //         },
    //         {
    //             type: "product",
    //             settings: {
    //                 product: "aloe-sun-shield",
    //                 pos_x: 71,
    //                 pos_y: 76
    //             }
    //         },
    //         {
    //             type: "product",
    //             settings: {
    //                 product: "benvoro™️-pro-ear-cleaner-1",
    //                 pos_x: 50,
    //                 pos_y: 50
    //             }
    //         }
    //     ]
    // },

    /* pf-product-grid1x1: Tabbed Product Grid (3 tabs × 3 products; handles whats-hot, best-sellers, on-sale) */
    "pf-product-grid1x1": {
        cols_desktop: 3,
        cols_mobile: "2",
        grid_gap: 30,
        card_radius: 16,
        tab_label_1: "What's Hot",
        tab_label_2: "Best Sellers",
        tab_label_3: "On Sale",
        link_text: "Explore All",
        link_text_mobile: "Explore All Products",
        link_url: "/collections/all",
        color_scheme: "scheme-1",
        sale_color: "#cf2e2e",
        badge_sale_bg: "#cf2e2e",
        badge_sale_text: "#ffffff",
        badge_custom_bg: "#000000",
        badge_custom_text: "#ffffff",

        blocks: []
    },

    /* marquee-scrolling-banner: Marquee Banner */
    "marquee-scrolling-banner": {
        use_kluck_ai_metafields: false,
        direction: "left",
        pause_hover: false,
        show_border_top: true,
        show_border_bottom: true,
        color_scheme: "scheme-1",
        font_family: "heading",
        speed_d: 20,
        font_size_d: 32,
        img_height_d: 60,
        gap_d: 50,
        padding_d: 30,
        speed_m: 15,
        font_size_m: 24,
        img_height_m: 40,
        gap_m: 30,
        padding_m: 20,
        font_weight: "400",
        img_radius: 100,

        blocks: [
            { type: "text", settings: { text: "Made with love" } },
            { type: "image", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0f1a84aa_zambeel_ai_generated_image.png" } },
            { type: "text", settings: { text: "New Season Essential" } },
            { type: "image", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/34cd8af6_zambeel_ai_generated_image.jpg" } },
            { type: "text", settings: { text: "New Season Essential" } },
            { type: "image", settings: { image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/81a9537f_zambeel_ai_generated_image.jpg" } },
            { type: "text", settings: { text: "Pure & Natural" } }
        ]
    },

    /* pf-split-feature: Split Feature Banner */
    "pf-split-feature": {
        use_kluck_ai_metafields: false,
        section_width: 1300,
        text_column_width: 50,
        border_radius: 20,
        color_scheme: "scheme-1",
        card_color_scheme: "scheme-2",
        image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa0bd95e_zambeel_ai_generated_image.png",
        eyebrow: "INNOVATIVE SELF-CARE",
        heading: "Elevate Your Daily Rituals",
        text: "We combine smart technology with gentle design to bring you personal care tools that truly understand your body.",
        heading_size: 55,
        body_size: 19,
        eyebrow_size: 15,
        watermark_text: "",
        font_watermark: "serif",
        watermark_color: "#ffffff",
        btn_label: "Shop Best Sellers",
        btn_link: "shopify://products/benvoro™️-pro-ear-cleaner",
        padding_top: 60,
        padding_bottom: 60
    },

    /* pf-trust-badges: Trust Badges / Features */
    "pf-trust-badges": {
        color_scheme: "scheme-1",
        badge_color_scheme: "scheme-1",
        max_width: 1400,
        alignment: "center",
        mobile_auto_scroll: true,
        scroll_speed: 20,
        border_width: 1,
        border_radius: 50,
        font_family: "body",
        font_weight: 400,
        pt_d: 40,
        pb_d: 70,
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

    /* pf-selected-prod-3in1: Product Star 3-Col */
    "pf-selected-prod-3in1": {
        use_kluck_ai_metafields: false,
        heading_part_1: "Star Product",
        heading_part_2: "of this season",
        color_scheme: "scheme-1",
        col_2_color_scheme: "scheme-1",
        col_3_color_scheme: "scheme-2",
        section_height: 600,
        border_radius: 20,
        video_url: "",
        image_media: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b009f66a_zambeel_ai_generated_image.jpg",
        product_ref: "24k-gold-eye-patches",
        show_float_badge: true,
        float_badge_text: "BEST SELLER",
        show_stars: false,
        review_count_manual: "",
        show_pill: true,
        pill_text: "Cruelty-free",
        pill_icon_select: "heart",
        show_btn: true,
        btn_label: "Shop Now",
        feat_h_size: 16,
        feat_p_size: 13,

        blocks: [
            { type: "feature", settings: { icon_select: "drop", heading: "Deeply hydrating", text: "Up to 130% increase in skin hydration." } },
            { type: "feature", settings: { icon_select: "star", heading: "Deeply hydrating", text: "Up to 130% increase in skin hydration." } },
            { type: "feature", settings: { icon_select: "leaf", heading: "Deeply hydrating", text: "Up to 130% increase in skin hydration." } },
            { type: "feature", settings: { icon_select: "moon", heading: "Deeply hydrating", text: "Up to 130% increase in skin hydration." } }
        ]
    },

    /* collection-list: Collection List */
    // "collection-list": {
    //     collection_list: ["beauty-items", "health-wellness", "kitchen-equipment", "serums", "electronics-gadgets"],
    //     layout_type: "bento",
    //     carousel_on_mobile: false,
    //     columns: 4,
    //     mobile_columns: "2",
    //     columns_gap: 8,
    //     bento_gap: 8,
    //     rows_gap: 8,
    //     max_collections: 4,
    //     section_width: "page-width",
    //     color_scheme: "scheme-1",
    //     gap: 12,
    //     padding_block_start: 24,
    //     padding_block_end: 24
    // },

    /* pf-testimonials01: Testimonials Slider */
    "pf-testimonials01": {
        section_full_width: false,
        section_max_width: 1320,
        color_scheme: "scheme-1",
        card_color_scheme: "scheme-2",
        padding_top: 100,
        padding_bottom: 60,
        heading: "<p>Customer <em>Love & Feedback</em></p>",
        card_width_desktop: 320,
        card_width_mobile: 280,
        card_radius: 20,
        star_color: "#D4AF37",
        image_border_width: 1,

        blocks: [

            {
                type: "testimonial",
                settings: {
                    author_image: "",
                    author_name: "Enter Name",
                    stars: 5,
                    review_text: "Enter Your Text"
                }
            },
            {
                type: "testimonial",
                settings: {
                    author_image: "",
                    author_name: "Enter Name",
                    stars: 5,
                    review_text: "Enter Your Text"
                }
            },
            {
                type: "testimonial",
                settings: {
                    author_image: "",
                    author_name: "Enter Name",
                    stars: 5,
                    review_text: "Enter Your Text"
                }
            },
            {
                type: "testimonial",
                settings: {
                    author_image: "",
                    author_name: "Enter Name",
                    stars: 5,
                    review_text: "Enter Your Text"
                }
            },
            {
                type: "testimonial",
                settings: {
                    author_image: "",
                    author_name: "Enter Name",
                    stars: 5,
                    review_text: "Enter Your Text"
                }
            }
        ]
    },

    /* pf-faq-splitimage: FAQ & Showcase */
    "pf-faq-splitimage": {
        use_kluck_ai_metafields: false,
        section_full_width: false,
        section_max_width: 1300,
        color_scheme: "scheme-1",
        faq_color_scheme: "scheme-1",
        image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/34cd8af6_zambeel_ai_generated_image.jpg",
        heading: "We're answerable!",
        text: "<p>Any question about our products? Check here.</p>",
        btn_label: "Buy Now",
        btn_link: "shopify://pages/faqs",
        padding_top: 60,
        padding_bottom: 60,

        blocks: [
            { type: "faq_item", settings: { title: "How long does shipping take?", content: "3-5 business days." } },
            { type: "faq_item", settings: { title: "How long does shipping take?", content: "3-5 business days." } },
            { type: "faq_item", settings: { title: "How long does shipping take?", content: "3-5 business days." } }
        ]
    }
};
