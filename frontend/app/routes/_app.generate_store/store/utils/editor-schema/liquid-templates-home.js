/**
 * Single-product store home — keys match {@link getTemplateName} after stripping `home/`.
 * Sections align with {@link SINGLE_PRODUCT_HOME_SECTIONS}.
 */
export const HOME_SINGLE_TEMPLATE_SCHEMAS = {
    "pf-k-hero-peek-slider": {
        displayName: "Roarr - Hero Banner",
        useForm: true,
        fields: [
            { type: "image", key: "banner_image", formKey: "images.banner_image", label: "Banner image" },
            { type: "text", key: "banner_heading", formKey: "text.banner_heading", label: "Heading" },
            { type: "text", key: "banner_eyebrow", formKey: "text.banner_eyebrow", label: "Eyebrow" },
            { type: "text", key: "selected_product", formKey: "text.selected_product", label: "Product handle" }
        ]
    },
    "marquee-scrolling-banner": {
        displayName: "Roarr - Marquee Banner",
        useForm: true,
        fields: [
            { type: "text", key: "marquee_text_1", formKey: "text.marquee_text_1", label: "Marquee text 1" },
            { type: "text", key: "marquee_text_2", formKey: "text.marquee_text_2", label: "Marquee text 2" },
            { type: "text", key: "marquee_text_3", formKey: "text.marquee_text_3", label: "Marquee text 3" }
        ]
    },
    "pf-custom-new-image-with-text": {
        displayName: "Roarr - Image with Text - 1",
        useForm: true,
        fields: [
            { type: "image", key: "product_impact_image", formKey: "images.product_impact_image", label: "Center image" },
            { type: "text", key: "image_with_text_heading", formKey: "text.image_with_text_heading", label: "Heading" },
            { type: "text", key: "image_with_text_subheading", formKey: "text.image_with_text_subheading", label: "Subheading" },
            { type: "text", key: "image_with_text_description", formKey: "text.image_with_text_description", label: "Description" }
        ]
    },
    "pf-new-features-center-image": {
        displayName: "Roarr - Features Center",
        useForm: true,
        fields: [
            { type: "image", key: "feature_image", formKey: "images.feature_image", label: "Feature image" },
            { type: "text", key: "feature_section_heading", formKey: "text.feature_section_heading", label: "Section heading" },
            { type: "text", key: "feature_name_1", formKey: "text.feature_name_1", label: "Feature 1 title" },
            { type: "text", key: "feature_desc_1", formKey: "text.feature_desc_1", label: "Feature 1 description" },
            { type: "text", key: "feature_name_2", formKey: "text.feature_name_2", label: "Feature 2 title" },
            { type: "text", key: "feature_desc_2", formKey: "text.feature_desc_2", label: "Feature 2 description" },
            { type: "text", key: "feature_name_3", formKey: "text.feature_name_3", label: "Feature 3 title" },
            { type: "text", key: "feature_desc_3", formKey: "text.feature_desc_3", label: "Feature 3 description" },
            { type: "text", key: "feature_name_4", formKey: "text.feature_name_4", label: "Feature 4 title" },
            { type: "text", key: "feature_desc_4", formKey: "text.feature_desc_4", label: "Feature 4 description" },
            { type: "text", key: "feature_name_5", formKey: "text.feature_name_5", label: "Feature 5 title" },
            { type: "text", key: "feature_desc_5", formKey: "text.feature_desc_5", label: "Feature 5 description" },
            { type: "text", key: "feature_name_6", formKey: "text.feature_name_6", label: "Feature 6 title" },
            { type: "text", key: "feature_desc_6", formKey: "text.feature_desc_6", label: "Feature 6 description" }
        ]
    },
    "pf-inline-headline": {
        displayName: "Roarr - Headline",
        useForm: true,
        fields: [
            {
                type: "text", key: "punchy_poetic_headline", formKey: "text.punchy_poetic_headline", label: "Headline (images after 5 words, after 7 words, then at end)"
            },
        ]
    },
    "pf-new-ingreds-features": {
        displayName: "Roarr - Image with Text - 2",
        useForm: true,
        fields: [
            { type: "image", key: "creative_image", formKey: "images.creative_image", label: "Accordion image" },
            { type: "text", key: "why_choose_us_heading", formKey: "text.why_choose_us_heading", label: "Main heading" },
            { type: "text", key: "why_choose_us_reason_1_heading", formKey: "text.why_choose_us_reason_1_heading", label: "Item 1 heading" },
            { type: "text", key: "why_choose_us_reason_1_description", formKey: "text.why_choose_us_reason_1_description", label: "Item 1 description" },
            { type: "text", key: "why_choose_us_reason_2_heading", formKey: "text.why_choose_us_reason_2_heading", label: "Item 2 heading" },
            { type: "text", key: "why_choose_us_reason_2_description", formKey: "text.why_choose_us_reason_2_description", label: "Item 2 description" },
            { type: "text", key: "why_choose_us_reason_3_heading", formKey: "text.why_choose_us_reason_3_heading", label: "Item 3 heading" },
            { type: "text", key: "why_choose_us_reason_3_description", formKey: "text.why_choose_us_reason_3_description", label: "Item 3 description" },
            { type: "text", key: "why_choose_us_reason_4_heading", formKey: "text.why_choose_us_reason_4_heading", label: "Item 4 heading" },
            { type: "text", key: "why_choose_us_reason_4_description", formKey: "text.why_choose_us_reason_4_description", label: "Item 4 description" }
        ]
    },
    "pf-trust-badges": {
        displayName: "Roarr - Trust Badges",
        useForm: true,
        fields: [
            { type: "text", key: "why_choose_us_reason_1_heading", formKey: "text.why_choose_us_reason_1_heading", label: "Badge 1" },
            { type: "text", key: "why_choose_us_reason_2_heading", formKey: "text.why_choose_us_reason_2_heading", label: "Badge 2" },
            { type: "text", key: "why_choose_us_reason_3_heading", formKey: "text.why_choose_us_reason_3_heading", label: "Badge 3" },
            { type: "text", key: "why_choose_us_reason_4_heading", formKey: "text.why_choose_us_reason_4_heading", label: "Badge 4" }
        ]
    },
    /**
     * Prepaid single-product home embeds this Shopify product hero.
     * Title/price/images come from the selected Shopify product; these fields edit section chrome.
     */
    "pf-new-default-product-hero": {
        displayName: "Roarr Hero Section",
        useForm: true,
        fields: [
            { type: "text", key: "hero_new_badge_text", formKey: "text.hero_new_badge_text", label: "New badge text", default: "New" },
            { type: "text", key: "hero_sale_badge_text", formKey: "text.hero_sale_badge_text", label: "Sale badge text", default: "Save [%]" },
            { type: "text", key: "hero_review_text", formKey: "text.hero_review_text", label: "Review label", default: "Top Quality" },
            { type: "text", key: "hero_stock_text", formKey: "text.hero_stock_text", label: "Stock text", default: "In stock and ready to ship" },
            { type: "text", key: "hero_add_to_cart_text", formKey: "text.hero_add_to_cart_text", label: "Add to cart button", default: "Add To Cart" },
            { type: "text", key: "hero_trust_1", formKey: "text.hero_trust_1", label: "Trust line 1", default: "Orders over $50 ship free" },
            { type: "text", key: "hero_trust_2", formKey: "text.hero_trust_2", label: "Trust line 2", default: "30 day returns" },
            { type: "text", key: "hero_accordion_1_title", formKey: "text.hero_accordion_1_title", label: "Accordion 1 title", default: "Shipping & Delivery" },
            { type: "text", key: "hero_accordion_1_content", formKey: "text.hero_accordion_1_content", label: "Accordion 1 content", default: "Put your product details, ingredients, or how to use instructions here." },
            { type: "text", key: "hero_accordion_2_title", formKey: "text.hero_accordion_2_title", label: "Accordion 2 title", default: "Guarantee" },
            { type: "text", key: "hero_accordion_2_content", formKey: "text.hero_accordion_2_content", label: "Accordion 2 content", default: "Put your product details, ingredients, or how to use instructions here." },
            { type: "text", key: "hero_accordion_3_title", formKey: "text.hero_accordion_3_title", label: "Accordion 3 title", default: "Friendly Support" },
            { type: "text", key: "hero_accordion_3_content", formKey: "text.hero_accordion_3_content", label: "Accordion 3 content", default: "Put your product details, ingredients, or how to use instructions here." }
        ]
    },
    "pf-testimonials01": {
        displayName: "Roarr - Testimonials",
        useForm: true,
        fields: [
            { type: "text", key: "customer_name_1", formKey: "text.customer_name_1", label: "Customer 1 name" },
            { type: "text", key: "customer_review_1", formKey: "text.customer_review_1", label: "Customer 1 review" },
            { type: "text", key: "customer_name_2", formKey: "text.customer_name_2", label: "Customer 2 name" },
            { type: "text", key: "customer_review_2", formKey: "text.customer_review_2", label: "Customer 2 review" },
            { type: "text", key: "customer_name_3", formKey: "text.customer_name_3", label: "Customer 3 name" },
            { type: "text", key: "customer_review_3", formKey: "text.customer_review_3", label: "Customer 3 review" },
            { type: "text", key: "customer_name_4", formKey: "text.customer_name_4", label: "Customer 4 name" },
            { type: "text", key: "customer_review_4", formKey: "text.customer_review_4", label: "Customer 4 review" },
            { type: "text", key: "customer_name_5", formKey: "text.customer_name_5", label: "Customer 5 name" },
            { type: "text", key: "customer_review_5", formKey: "text.customer_review_5", label: "Customer 5 review" }
        ]
    },
    "pf-split-feature": {
        displayName: "Roarr - Image with Text - 3",
        useForm: true,
        fields: [
            { type: "image", key: "highlight_image", formKey: "images.highlight_image", label: "Banner image" },
            { type: "text", key: "highlight_banner_section_heading", formKey: "text.highlight_banner_section_heading", label: "Heading" },
            { type: "text", key: "highlight_banner_section_subheading", formKey: "text.highlight_banner_section_subheading", label: "Subheading" },
            { type: "text", key: "highlight_banner_section_description", formKey: "text.highlight_banner_section_description", label: "Description" }
        ]
    },
    "pf-faq-splitimage": {
        displayName: "Roarr - FAQ",
        useForm: true,
        fields: [
            { type: "image", key: "creative_image", formKey: "images.creative_image", label: "Showcase image" },
            { type: "text", key: "why_choose_us_heading", formKey: "text.why_choose_us_heading", label: "Section heading" },
            { type: "text", key: "faq_question_1", formKey: "text.faq_question_1", label: "FAQ 1 question" },
            { type: "text", key: "faq_answer_1", formKey: "text.faq_answer_1", label: "FAQ 1 answer" },
            { type: "text", key: "faq_question_2", formKey: "text.faq_question_2", label: "FAQ 2 question" },
            { type: "text", key: "faq_answer_2", formKey: "text.faq_answer_2", label: "FAQ 2 answer" },
            { type: "text", key: "faq_question_3", formKey: "text.faq_question_3", label: "FAQ 3 question" },
            { type: "text", key: "faq_answer_3", formKey: "text.faq_answer_3", label: "FAQ 3 answer" }
        ]
    }
};

/**
 * Multi-product store home — keys match {@link getTemplateName} after stripping `home/`.
 * Sections align with {@link MULTI_PRODUCT_HOME_SECTIONS}.
 */
export const HOME_MULTI_TEMPLATE_SCHEMAS = {
    "pf-k-hero-peek-slider": {
        displayName: "Roarr - Hero Banner",
        useForm: true,
        fields: [
            { type: "image", key: "banner_image_1", formKey: "images.banner_image_1", label: "Slide 1 image" },
            { type: "image", key: "banner_image_2", formKey: "images.banner_image_2", label: "Slide 2 image" },
            { type: "image", key: "banner_image_3", formKey: "images.banner_image_3", label: "Slide 3 image" },
            { type: "text", key: "banner_heading_1", formKey: "text.banner_heading_1", label: "Slide 1 heading" },
            { type: "text", key: "banner_heading_2", formKey: "text.banner_heading_2", label: "Slide 2 heading" },
            { type: "text", key: "banner_heading_3", formKey: "text.banner_heading_3", label: "Slide 3 heading" },
            { type: "text", key: "banner_eyebrow_1", formKey: "text.banner_eyebrow_1", label: "Slide 1 eyebrow" },
            { type: "text", key: "banner_eyebrow_2", formKey: "text.banner_eyebrow_2", label: "Slide 2 eyebrow" },
            { type: "text", key: "banner_eyebrow_3", formKey: "text.banner_eyebrow_3", label: "Slide 3 eyebrow" },
            { type: "text", key: "selected_product_1", formKey: "text.selected_product_1", label: "Slide 1 product handle" },
            { type: "text", key: "selected_product_2", formKey: "text.selected_product_2", label: "Slide 2 product handle" },
            { type: "text", key: "selected_product_3", formKey: "text.selected_product_3", label: "Slide 3 product handle" }
        ]
    },
    "marquee-scrolling-banner": {
        displayName: "Roarr - Marquee Banner",
        useForm: true,
        fields: [
            { type: "text", key: "marquee_text_1", formKey: "text.marquee_text_1", label: "Marquee text 1" },
            { type: "text", key: "marquee_text_2", formKey: "text.marquee_text_2", label: "Marquee text 2" },
            { type: "text", key: "marquee_text_3", formKey: "text.marquee_text_3", label: "Marquee text 3" }
        ]
    },
    "pf-inline-headline": {
        displayName: "Roarr - Headline",
        useForm: true,
        fields: [
            {
                type: "text",
                key: "punchy_poetic_headline",
                formKey: "text.punchy_poetic_headline",
                label: "Headline (images after 5 words, after 7 words, then at end)"
            }
        ]
    },
    "pf-collection-showcase": {
        displayName: "Roarr - Collections",
        useForm: true,
        fields: [
            { type: "image", key: "product_impact_image_1", formKey: "images.product_impact_image_1", label: "Card 1 lifestyle image" },
            { type: "image", key: "product_impact_image_2", formKey: "images.product_impact_image_2", label: "Card 2 lifestyle image" },
            { type: "image", key: "product_impact_image_3", formKey: "images.product_impact_image_3", label: "Card 3 lifestyle image" },
            { type: "text", key: "top_product_punchline_1", formKey: "text.top_product_punchline_1", label: "Card 1 title" },
            { type: "text", key: "top_product_punchline_1_description", formKey: "text.top_product_punchline_1_description", label: "Card 1 description" },
            { type: "text", key: "top_product_punchline_2", formKey: "text.top_product_punchline_2", label: "Card 2 title" },
            { type: "text", key: "top_product_punchline_2_description", formKey: "text.top_product_punchline_2_description", label: "Card 2 description" },
            { type: "text", key: "top_product_punchline_3", formKey: "text.top_product_punchline_3", label: "Card 3 title" },
            { type: "text", key: "top_product_punchline_3_description", formKey: "text.top_product_punchline_3_description", label: "Card 3 description" }
        ]

    },
    "pf-feature-product-section": {
        displayName: "Roarr - Featured Products",
        useForm: true,
        fields: [
            { type: "image", key: "feature_image_1", formKey: "images.feature_image_1", label: "Card 1 image" },
            { type: "image", key: "feature_image_2", formKey: "images.feature_image_2", label: "Card 2 image" },
            { type: "image", key: "feature_image_3", formKey: "images.feature_image_3", label: "Card 3 image" },
            { type: "text", key: "featured_product_headline_1", formKey: "text.featured_product_headline_1", label: "Card 1 headline" },
            { type: "text", key: "featured_product_headline_2", formKey: "text.featured_product_headline_2", label: "Card 2 headline" },
            { type: "text", key: "featured_product_headline_3", formKey: "text.featured_product_headline_3", label: "Card 3 headline" },
            { type: "text", key: "featured_product_subheadline_1", formKey: "text.featured_product_subheadline_1", label: "Card 1 subheadline" },
            { type: "text", key: "featured_product_subheadline_2", formKey: "text.featured_product_subheadline_2", label: "Card 2 subheadline" },
            { type: "text", key: "featured_product_subheadline_3", formKey: "text.featured_product_subheadline_3", label: "Card 3 subheadline" }
        ]
    },
    "pf-feature-banner": {
        displayName: "Roarr - Feature Banner",
        useForm: true,
        fields: [
            { type: "image", key: "feature_image_1", formKey: "images.feature_image_1", label: "Card 1 image" },
            { type: "image", key: "feature_image_2", formKey: "images.feature_image_2", label: "Card 2 image" },
            { type: "image", key: "feature_image_3", formKey: "images.feature_image_3", label: "Card 3 image" },
            { type: "text", key: "top_product_punchline_1", formKey: "text.top_product_punchline_1", label: "Card 1 title" },
            { type: "text", key: "top_product_punchline_1_description", formKey: "text.top_product_punchline_1_description", label: "Card 1 description" },
            { type: "text", key: "top_product_punchline_2", formKey: "text.top_product_punchline_2", label: "Card 2 title" },
            { type: "text", key: "top_product_punchline_2_description", formKey: "text.top_product_punchline_2_description", label: "Card 2 description" },
            { type: "text", key: "top_product_punchline_3", formKey: "text.top_product_punchline_3", label: "Card 3 title" },
            { type: "text", key: "top_product_punchline_3_description", formKey: "text.top_product_punchline_3_description", label: "Card 3 description" }
        ]
    },
    "infinite-marquee": {
        displayName: "Roarr - Infinite Marquee",
        useForm: true,
        fields: [
            { type: "text", key: "marquee_text_1", formKey: "text.marquee_text_1", label: "Text 1" },
            { type: "text", key: "marquee_text_2", formKey: "text.marquee_text_2", label: "Text 2" },
            { type: "text", key: "marquee_text_3", formKey: "text.marquee_text_3", label: "Text 3" },
            { type: "image", key: "impact_image_1", formKey: "images.impact_image_1", label: "Image 1" },
            { type: "image", key: "impact_image_2", formKey: "images.impact_image_2", label: "Image 2" },
            { type: "image", key: "impact_image_3", formKey: "images.impact_image_3", label: "Image 3" }
        ]
    },
    "pf-product-lookbook": {
        displayName: "Roarr - Product Lookbook",
        useForm: true,
        fields: []
    },
    "pf-product-grid1x1": {
        displayName: "Roarr - Products Grid",
        useForm: true,
        fields: [
            { type: "text", key: "product_grid_tab_1", formKey: "text.product_grid_tab_1", label: "Tab 1 label" },
            { type: "text", key: "product_grid_tab_2", formKey: "text.product_grid_tab_2", label: "Tab 2 label" },
            { type: "text", key: "product_grid_tab_3", formKey: "text.product_grid_tab_3", label: "Tab 3 label" },
            { type: "text", key: "product_grid_link_text", formKey: "text.product_grid_link_text", label: "Shop-all link (desktop)" },
            { type: "text", key: "product_grid_link_text_mobile", formKey: "text.product_grid_link_text_mobile", label: "Shop-all link (mobile)" },
            { type: "text", key: "product_grid_link_url", formKey: "text.product_grid_link_url", label: "Shop-all URL" }
        ]
    },
    "pf-split-feature": {
        displayName: "Roarr - Image with Text - 3",
        useForm: true,
        fields: [
            { type: "image", key: "highlight_image", formKey: "images.highlight_image", label: "Banner image" },
            { type: "text", key: "highlight_banner_section_heading", formKey: "text.highlight_banner_section_heading", label: "Heading" },
            { type: "text", key: "highlight_banner_section_subheading", formKey: "text.highlight_banner_section_subheading", label: "Subheading" },
            { type: "text", key: "highlight_banner_section_description", formKey: "text.highlight_banner_section_description", label: "Description" }
        ]
    },
    "pf-trust-badges": {
        displayName: "Roarr - Trust Badges",
        useForm: true,
        fields: [
            { type: "text", key: "star_product_feature_1", formKey: "text.star_product_feature_1", label: "Badge 1" },
            { type: "text", key: "star_product_feature_2", formKey: "text.star_product_feature_2", label: "Badge 2" },
            { type: "text", key: "star_product_feature_3", formKey: "text.star_product_feature_3", label: "Badge 3" },
            { type: "text", key: "star_product_feature_4", formKey: "text.star_product_feature_4", label: "Badge 4" }
        ]
    },
    "pf-selected-prod-3in1": {
        displayName: "Roarr - Product Column",
        useForm: true,
        fields: [
            { type: "image", key: "star_image", formKey: "images.star_image", label: "Hero image" },
            { type: "text", key: "top_product_punchline_1", formKey: "text.top_product_punchline_1", label: "Subtitle" },
            { type: "text", key: "top_product_punchline_1_description", formKey: "text.top_product_punchline_1_description", label: "Title" },
            { type: "text", key: "star_product_feature_1", formKey: "text.star_product_feature_1", label: "Feature 1 heading" },
            { type: "text", key: "star_product_feature_1_desc", formKey: "text.star_product_feature_1_desc", label: "Feature 1 description" },
            { type: "text", key: "star_product_feature_2", formKey: "text.star_product_feature_2", label: "Feature 2 heading" },
            { type: "text", key: "star_product_feature_2_desc", formKey: "text.star_product_feature_2_desc", label: "Feature 2 description" },
            { type: "text", key: "star_product_feature_3", formKey: "text.star_product_feature_3", label: "Feature 3 heading" },
            { type: "text", key: "star_product_feature_3_desc", formKey: "text.star_product_feature_3_desc", label: "Feature 3 description" }
        ]
    },
    "collection-list": {
        displayName: "Roarr - Collection List",
        useForm: true,
        fields: []
    },
    "pf-testimonials01": {
        displayName: "Roarr - Testimonials",
        useForm: true,
        fields: [
            { type: "text", key: "customer_name_1", formKey: "text.customer_name_1", label: "Customer 1 name" },
            { type: "text", key: "customer_review_1", formKey: "text.customer_review_1", label: "Customer 1 review" },
            { type: "text", key: "customer_name_2", formKey: "text.customer_name_2", label: "Customer 2 name" },
            { type: "text", key: "customer_review_2", formKey: "text.customer_review_2", label: "Customer 2 review" },
            { type: "text", key: "customer_name_3", formKey: "text.customer_name_3", label: "Customer 3 name" },
            { type: "text", key: "customer_review_3", formKey: "text.customer_review_3", label: "Customer 3 review" },
            { type: "text", key: "customer_name_4", formKey: "text.customer_name_4", label: "Customer 4 name" },
            { type: "text", key: "customer_review_4", formKey: "text.customer_review_4", label: "Customer 4 review" },
            { type: "text", key: "customer_name_5", formKey: "text.customer_name_5", label: "Customer 5 name" },
            { type: "text", key: "customer_review_5", formKey: "text.customer_review_5", label: "Customer 5 review" }
        ]
    },
    "pf-faq-splitimage": {
        displayName: "Roarr - FAQ",
        useForm: true,
        fields: [
            { type: "image", key: "highlight_image", formKey: "images.highlight_image", label: "Showcase image" },
            { type: "text", key: "highlight_banner_section_heading", formKey: "text.highlight_banner_section_heading", label: "Section heading" },
            { type: "text", key: "highlight_banner_section_description", formKey: "text.highlight_banner_section_description", label: "Intro text" },
            { type: "text", key: "faq_question_1", formKey: "text.faq_question_1", label: "FAQ 1 question" },
            { type: "text", key: "faq_answer_1", formKey: "text.faq_answer_1", label: "FAQ 1 answer" },
            { type: "text", key: "faq_question_2", formKey: "text.faq_question_2", label: "FAQ 2 question" },
            { type: "text", key: "faq_answer_2", formKey: "text.faq_answer_2", label: "FAQ 2 answer" },
            { type: "text", key: "faq_question_3", formKey: "text.faq_question_3", label: "FAQ 3 question" },
            { type: "text", key: "faq_answer_3", formKey: "text.faq_answer_3", label: "FAQ 3 answer" }
        ]
    }
};
