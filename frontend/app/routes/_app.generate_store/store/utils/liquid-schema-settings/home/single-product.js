/**
 * Single Product Home Page - Section settings for Liquid preview
 * Used when rendering home page layout for single-product stores
 */

export const SINGLE_PRODUCT_HOME_SETTINGS = {
    /* pf-k-hero-peek-slider: Hero Pro Slider */
    "pf-k-hero-peek-slider": {
        "height_desktop": 550,
        "height_mobile": 300,
        "border_radius": 0,
        "autoplay_speed": 5000,
        "zoom_duration": 3,
        "padding_top": 5,
        "color_scheme": "scheme-1",

        // Blocks (slides)
        blocks: [
            {
                type: "slide",
                settings: {
                    image: "",
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
        ],




    },

    /* marquee-scrolling-banner: Marquee Banner */
    "marquee-scrolling-banner": {
        use_roarr_metafields: false,
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

        // Blocks
        blocks: [
            { type: "text", settings: { text: "Made with love" } },
            {
                type: "image",
                settings: {
                    image: "",
                }
            },
            { type: "text", settings: { text: "New Season Essential" } },
            {
                type: "image",
                settings: {
                    image: "",
                }
            },
            { type: "text", settings: { text: "Pure & Natural" } }
        ],
    },

    /* pf-custom-new-image-with-text: Custom Image with Text */
    "pf-custom-new-image-with-text": {
        use_roarr_metafields: false,
        layout: "image_right",
        max_width: 1250,
        desktop_gap: 80,
        color_scheme: "scheme-1",
        image_1: "",
        image_ratio: "1 / 1",
        image_border_radius: 30,
        heading: "THE IDEAL SHAPE OF THE EYEBROWS IS YOUR OWN",
        text_1: "SAYEAH BEAUTY eyebrow pencil is designed to emphasize and set this beauty.",
        text_2: "The thin tip and rich color help you draw contours and realistic hair strokes for a naturally polished look.",
        feature_1_stat: "12K+",
        feature_1_text: "Happy customers",
        feature_2_stat: "24H",
        feature_2_text: "Long-lasting hold",
        feature_3_stat: "4.9",
        feature_3_text: "Average rating",
        heading_transform: "uppercase",
        heading_size_desktop: 42,
        heading_size_mobile: 28,
        text_size_desktop: 16,
        text_size_mobile: 14,
        stat_size_desktop: 30,
        stat_size_mobile: 22,
        feature_text_size_desktop: 14,
        feature_text_size_mobile: 12,
        btn_label: "Buy Now",
        btn_link: "shopify://pages/faqs",
        btn_border_radius: 30,
        btn_padding_y: 15,
        btn_padding_x: 30,
        btn_font_size: 16,
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40
    },

    /* pf-new-features-center-image: Features Center Image */
    "pf-new-features-center-image": {
        use_roarr_metafields: false,
        // Main Settings
        heading: "Reasons to be fussy",
        center_image: "",
        max_width: 1250,
        section_color_scheme: "scheme-1",
        card_color_scheme: "scheme-1",

        // Layout & Sizing
        center_image_width_desktop: 350,
        center_image_width_mobile: 280,
        center_image_radius: 0,
        desktop_column_gap: 50,
        vertical_gap: 60,
        icon_size: 40,

        // Card Format
        enable_card_format: false,
        card_padding: 25,
        card_border_width: 1,
        card_border_radius: 10,
        "card_border_color": "#dddddd",
        card_shadow_opacity: 30,

        // Typography
        heading_size_desktop: 54,
        heading_size_mobile: 32,
        heading_spacing: 60,
        block_title_size: 24,
        block_text_size: 16,

        // Section Padding
        padding_top_desktop: 80,
        padding_bottom_desktop: 80,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40,

        // Blocks
        blocks: [
            {
                type: "feature",
                settings: {
                    position: "left",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "PRO-PLANET",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: 50
                }
            },
            {
                type: "feature",
                settings: {
                    position: "left",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "CONVENIENT",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: 0
                }
            },
            {
                type: "feature",
                settings: {
                    position: "left",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "Feature Title",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: 50
                }
            },
            {
                type: "feature",
                settings: {
                    position: "right",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "24HR PROTECTION",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: -50
                }
            },
            {
                type: "feature",
                settings: {
                    position: "right",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "PLANT POWERED",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: 0
                }
            },
            {
                type: "feature",
                settings: {
                    position: "right",
                    icon_image: "",
                    raw_svg: '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width="800px" height="800px" viewbox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#292D32"></path>\n</svg>',
                    title: "Feature Title",
                    text: "Add a short description explaining this feature.",
                    text_align: "center",
                    horizontal_offset: -50
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

        // Blocks
        blocks: [
            {
                type: "text_segment",
                settings: {
                    text: "Make you look classy",
                    italic: false,
                    font_family: "heading",
                    text_scale: 100
                }
            },
            {
                type: "image_pill",
                settings: {
                    image: "",
                    link: ""
                }
            },
            {
                type: "text_segment",
                settings: {
                    text: "and",
                    italic: false,
                    font_family: "heading",
                    text_scale: 100
                }
            },
            {
                type: "line_break",
                settings: {}
            },
            {
                type: "text_segment",
                settings: {
                    text: "feel glowy",
                    italic: false,
                    font_family: "heading",
                    text_scale: 100
                }
            },
            {
                type: "image_pill",
                settings: {
                    image: "",
                    link: ""
                }
            },
            {
                type: "text_segment",
                settings: {
                    text: "and healthy",
                    italic: false,
                    font_family: "heading",
                    text_scale: 100
                }
            },
            {
                type: "image_pill",
                settings: {
                    image: "",
                    link: ""
                }
            }
        ]
    },

    /* pf-new-ingreds-features: Multi-Purpose Image Accordion */
    "pf-new-ingreds-features": {
        use_roarr_metafields: false,
        // Layout Settings
        desktop_layout: "image_left",
        max_width: 1250,
        border_radius: 30,
        section_color_scheme: "scheme-1",
        container_color_scheme: "scheme-2",
        border_color: "#c4c0b5",

        // Main Heading
        main_heading: "Explore Features",
        main_heading_size_desktop: 42,
        main_heading_size_mobile: 32,
        title_spacing_desktop: 50,
        title_spacing_mobile: 30,

        // Accordion Typography
        acc_heading_size_desktop: 28,
        acc_heading_size_mobile: 22,
        body_size_desktop: 16,
        body_size_mobile: 15,

        // Section Padding
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 0,

        // Blocks
        blocks: [
            {
                type: "accordion_item",
                settings: {
                    title: "Feature One",
                    description: "Add details about this specific item here. When this tab is clicked, the associated image will display.",
                    btn_label: "LEARN MORE",
                    btn_link: "",
                    image: ""
                }
            },
            {
                type: "accordion_item",
                settings: {
                    title: "Feature Two",
                    description: "Add details about this specific item here. When this tab is clicked, the associated image will display.",
                    btn_label: "LEARN MORE",
                    btn_link: "",
                    image: ""
                }
            },
            {
                type: "accordion_item",
                settings: {
                    title: "Feature Three",
                    description: "Add details about this specific item here. When this tab is clicked, the associated image will display.",
                    btn_label: "LEARN MORE",
                    btn_link: "",
                    image: ""
                }
            },
            {
                type: "accordion_item",
                settings: {
                    title: "Feature Three",
                    description: "Add details about this specific item here. When this tab is clicked, the associated image will display.",
                    btn_label: "LEARN MORE",
                    btn_link: "",
                    image: ""
                }
            }
        ]
    },

    /* pf-trust-badges: Trust Badges / Features */
    "pf-trust-badges": {
        // Color Schemes
        color_scheme: "scheme-1",
        badge_color_scheme: "scheme-1",

        // Layout
        max_width: 1400,
        alignment: "center",

        // Mobile Auto-Scroll
        mobile_auto_scroll: true,
        scroll_speed: 20,

        // Badge Styling
        border_width: 1,
        border_radius: 50,

        // Typography
        font_family: "body",
        font_weight: 400,

        // Desktop Settings
        pt_d: 40,
        pb_d: 70,
        gap_d: 20,
        font_size_d: 16,
        icon_size_d: 32,
        item_pad_x_d: 20,
        item_pad_y_d: 10,

        // Mobile Settings
        pt_m: 30,
        pb_m: 30,
        gap_m: 12,
        font_size_m: 14,
        icon_size_m: 28,
        item_pad_x_m: 15,
        item_pad_y_m: 8,

        // Blocks
        blocks: [
            {
                type: "badge",
                settings: {
                    text: "Free Shipping",
                    custom_icon: ""
                }
            },
            {
                type: "badge",
                settings: {
                    text: "Money Guarantee",
                    custom_icon: ""
                }
            },
            {
                type: "badge",
                settings: {
                    text: "Flexible Payment",
                    custom_icon: ""
                }
            },
            {
                type: "badge",
                settings: {
                    text: "Online Support",
                    custom_icon: ""
                }
            }
        ]
    },

    /* pf-new-default-product-hero: Roarr Hero Section */
    "pf-new-default-product-hero": {
        product: "",
        container_width: 1400,
        corner_radius: 18,
        button_radius: 40,
        block_spacing: 8,
        show_sticky_cart: false,
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

    /* pf-testimonials01: Testimonials Slider */
    "pf-testimonials01": {
        // Section Layout & Width
        section_full_width: false,
        section_max_width: 1320,
        color_scheme: "scheme-1",
        card_color_scheme: "scheme-2",
        padding_top: 60,
        padding_bottom: 60,
        heading: "<p>Customer <em>Love & Feedback</em></p>",

        // Card Style & Widths
        card_width_desktop: 250,
        card_width_mobile: 280,
        card_radius: 20,
        star_color: "#D4AF37",
        image_border_width: 1,

        // Blocks
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

    /* pf-split-feature: Split Feature Banner */
    "pf-split-feature": {
        use_roarr_metafields: false,
        // Section Layout
        section_width: 1300,
        text_column_width: 50,
        border_radius: 30,

        // Color Schemes
        color_scheme: "scheme-1",
        card_color_scheme: "scheme-2",

        // Text Customization
        eyebrow: "INNOVATIVE SELF-CARE",
        heading: "Elevate Your Daily Rituals",
        text: "We combine smart technology with gentle design to bring you personal care tools that truly understand your body.",
        heading_size: 55,
        body_size: 19,
        eyebrow_size: 15,

        // Watermark Feature
        watermark_text: "",
        font_watermark: "serif",
        watermark_color: "#ffffff",

        // Button Settings
        btn_label: "Shop Best Sellers",
        btn_link: "shopify://products/benvoro™-pro-ear-cleaner",

        // Media
        image: "",

        // Spacing
        padding_top: 60,
        padding_bottom: 60
    },

    /* pf-faq-splitimage: FAQ & Showcase */
    "pf-faq-splitimage": {
        use_roarr_metafields: false,
        // Layout & Sizing
        section_full_width: false,
        section_max_width: 1240,

        // Color Schemes
        color_scheme: "scheme-1",
        faq_color_scheme: "scheme-1",

        // Text Content
        heading: "We're answerable!",
        text: "Any question about our products? Check here.",
        // Button
        btn_label: "See More Answers",
        btn_link: "shopify://pages/faqs",

        // Image Showcase
        image: "",

        // Spacing
        padding_top: 60,
        padding_bottom: 60,

        // Blocks
        blocks: [
            {
                type: "faq_item",
                settings: {
                    title: "How long does shipping take?",
                    content: "3-5 business days."
                }
            },
            {
                type: "faq_item",
                settings: {
                    title: "How long does shipping take?",
                    content: "3-5 business days."
                }
            },
            {
                type: "faq_item",
                settings: {
                    title: "How long does shipping take?",
                    content: "3-5 business days."
                }
            }
        ]
    },
}
