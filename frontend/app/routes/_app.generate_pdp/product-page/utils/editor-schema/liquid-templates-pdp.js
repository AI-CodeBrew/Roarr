/**
 * PDP (product detail page) Liquid template schemas.
 * Editable fields per template — text and image types with optional product metafield linking.
 * @see {@link TEMPLATE_SCHEMAS} for the merged map used by the product preview editor.
 */

export const PDP_TEMPLATE_SCHEMAS = {
    "accordion": {
        displayName: "Accordion",
        useForm: true,
        fields: [
            { type: "text", key: "heading_1", formKey: "text.product_question_1", label: "Item 1 Heading", placeholder: "Enter your text!", productMetafield: "kluck_ai.product_question_1" },
            { type: "text", key: "content_1", formKey: "text.product_question_1_answer", label: "Item 1 Content", placeholder: "", productMetafield: "kluck_ai.product_question_1_answer" },
            { type: "text", key: "heading_2", formKey: "text.product_question_2", label: "Item 2 Heading", placeholder: "", productMetafield: "kluck_ai.product_question_2" },
            { type: "text", key: "content_2", formKey: "text.product_question_2_answer", label: "Item 2 Content", placeholder: "", productMetafield: "kluck_ai.product_question_2_answer" },
            { type: "text", key: "heading_3", formKey: "text.product_question_3", label: "Item 3 Heading", placeholder: "", productMetafield: "kluck_ai.product_question_3" },
            { type: "text", key: "content_3", formKey: "text.product_question_3_answer", label: "Item 3 Content", placeholder: "", productMetafield: "kluck_ai.product_question_3_answer" },
            { type: "text", key: "heading_4", formKey: "text.product_question_4", label: "Item 4 Heading", placeholder: "", productMetafield: "kluck_ai.product_question_4" },
            { type: "text", key: "content_4", formKey: "text.product_question_4_answer", label: "Item 4 Content", placeholder: "", productMetafield: "kluck_ai.product_question_4_answer" }
        ]
    },
    "before-after": {
        displayName: "Before & After",
        useForm: true,
        fields: [
            { type: "image", key: "before_image", formKey: "images.body_images.before_use_image", label: "Before image", productMetafield: "kluck_ai.before_use_image" },
            { type: "image", key: "after_image", formKey: "images.body_images.after_use_image", label: "After image", productMetafield: "kluck_ai.after_use_image" },
            { type: "text", key: "heading", formKey: "text.before_after_heading", label: "Heading", placeholder: "Results", productMetafield: "kluck_ai.before_after_heading" },
            { type: "text", key: "subheading", formKey: "text.before_after_subheading", label: "Subheading", placeholder: "See the difference yourself", productMetafield: "kluck_ai.before_after_subheading" },
            { type: "text", key: "feat_1", formKey: "text.before_after_feature_1", label: "Feature 1", placeholder: "Visible improvement", productMetafield: "kluck_ai.before_after_feature_1" },
            { type: "text", key: "feat_2", formKey: "text.before_after_feature_2", label: "Feature 2", placeholder: "Fast results", productMetafield: "kluck_ai.before_after_feature_2" },
            { type: "text", key: "feat_3", formKey: "text.before_after_feature_3", label: "Feature 3", placeholder: "Easy to use", productMetafield: "kluck_ai.before_after_feature_3" },
            { type: "text", key: "feat_4", formKey: "text.before_after_feature_4", label: "Feature 4", placeholder: "High quality", productMetafield: "kluck_ai.before_after_feature_4" },
            { type: "text", key: "before_issue_1", formKey: "text.before_use_issue_1", label: "Before issue 1", placeholder: "Dry or dull", productMetafield: "kluck_ai.before_use_issue_1" },
            { type: "text", key: "before_issue_2", formKey: "text.before_use_issue_2", label: "Before issue 2", placeholder: "Uneven tone", productMetafield: "kluck_ai.before_use_issue_2" },
            { type: "text", key: "before_issue_3", formKey: "text.before_use_issue_3", label: "Before issue 3", placeholder: "Lack of hydration", productMetafield: "kluck_ai.before_use_issue_3" },
            { type: "text", key: "after_benefit_1", formKey: "text.after_use_benefit_1", label: "After benefit 1", placeholder: "Vibrant color", productMetafield: "kluck_ai.after_use_benefit_1" },
            { type: "text", key: "after_benefit_2", formKey: "text.after_use_benefit_2", label: "After benefit 2", placeholder: "Smooth texture", productMetafield: "kluck_ai.after_use_benefit_2" },
            { type: "text", key: "after_benefit_3", formKey: "text.after_use_benefit_3", label: "After benefit 3", placeholder: "Long-lasting finish", productMetafield: "kluck_ai.after_use_benefit_3" },
        ]
    },
    "bundle": {
        displayName: "Roarr Bundler",
        useForm: false,
        fields: []
    },
    "trust-badges": {
        displayName: "Trust Badges",
        useForm: true,
        fields: [
            { type: "text", key: "badge_text_1", formKey: "text.badge_text_1", label: "Badge 1", placeholder: "Free Shipping", productMetafield: "kluck_ai.badge_text_1" },
            { type: "text", key: "badge_text_2", formKey: "text.badge_text_2", label: "Badge 2", placeholder: "Money Guarantee", productMetafield: "kluck_ai.badge_text_2" },
            { type: "text", key: "badge_text_3", formKey: "text.badge_text_3", label: "Badge 3", placeholder: "Online Support", productMetafield: "kluck_ai.badge_text_3" },
            { type: "text", key: "badge_text_4", formKey: "text.badge_text_4", label: "Badge 4", placeholder: "Secure Payment", productMetafield: "kluck_ai.badge_text_4" }
        ]
    },
    "pillow-banner": {
        displayName: "Pillow Banner",
        useForm: true,
        fields: [
            { type: "text", key: "show_background", formKey: "show_background", label: "Show background (true/false)", placeholder: "true", productMetafield: null },
            { type: "image", key: "image", formKey: "images.product_images.product_image_1", label: "Banner Image", productMetafield: "kluck_ai.product_image_1" },
            { type: "text", key: "heading", formKey: "text.pillow_banner_heading", label: "Heading", placeholder: "Committed to sleep and second chance", productMetafield: "kluck_ai.pillow_banner_heading" },
            { type: "text", key: "subtext", formKey: "text.pillow_banner_subheading", label: "Subtext", placeholder: "Rest fuels renewal", productMetafield: "kluck_ai.pillow_banner_subheading" },
            { type: "text", key: "btn_text", formKey: "text.pillow_banner_button", label: "Button Label", placeholder: "Our philosophy", productMetafield: "kluck_ai.pillow_banner_button" }
        ]
    },
    "frequently-bought": {
        displayName: "Frequently Bought Together",
        useForm: false,
        fields: []
    },
    "bento-grid": {
        displayName: "Bento Grid",
        useForm: true,
        fields: [
            { type: "image", key: "cell_1_image", formKey: "images.body_images.happy_customer_image_1", label: "Cell 1 Image", productMetafield: "kluck_ai.happy_customer_image_1" },
            { type: "text", key: "cell_1_heading", formKey: "text.bento_stat_1", label: "Cell 1 Heading", placeholder: "", productMetafield: "kluck_ai.bento_stat_1" },
            { type: "text", key: "cell_1_text", formKey: "text.bento_stat_description_1", label: "Cell 1 Text", placeholder: "", productMetafield: "kluck_ai.bento_stat_description_1" },
            { type: "image", key: "cell_2_image", formKey: "images.body_images.happy_customer_image_2", label: "Cell 2 Image", productMetafield: "kluck_ai.happy_customer_image_2" },
            { type: "text", key: "cell_2_heading", formKey: "text.bento_stat_2", label: "Cell 2 Heading", placeholder: "", productMetafield: "kluck_ai.bento_stat_2" },
            { type: "text", key: "cell_2_text", formKey: "text.bento_stat_description_2", label: "Cell 2 Text", placeholder: "", productMetafield: "kluck_ai.bento_stat_description_2" },
            { type: "image", key: "cell_3_image", formKey: "images.body_images.happy_customer_image_3", label: "Cell 3 Image", productMetafield: "kluck_ai.happy_customer_image_3" },
        ]
    },
    "buy-now-button": {
        displayName: "Buy Now Button",
        useForm: false,
        fields: [
            { type: "text", key: "button_text", formKey: "button_text", label: "Button text", placeholder: "Buy Now" }
        ]
    },
    "circular-feature-ring": {
        displayName: "Circular Feature Ring",
        useForm: true,
        fields: [
            { type: "image", key: "image", formKey: "images.body_images.feature_image", label: "Circular Image", productMetafield: "kluck_ai.feature_image" },
            { type: "text", key: "heading", formKey: "text.circular_features_heading", label: "Heading", placeholder: "Transform Your Routine", productMetafield: "kluck_ai.circular_features_heading" },
            { type: "text", key: "subheading", formKey: "text.circular_features_subheading", label: "Subheading", placeholder: "The lamp's soft, adjustable glow creates a calming environment.", productMetafield: "kluck_ai.circular_features_subheading" },
            { type: "text", key: "feature1_title", formKey: "text.circular_feature_1_name", label: "Feature 1 Title", placeholder: "Relaxation", productMetafield: "kluck_ai.circular_feature_1_name" },
            { type: "text", key: "feature1_text", formKey: "text.circular_feature_1_desc", label: "Feature 1 Description", placeholder: "", productMetafield: "kluck_ai.circular_feature_1_desc" },
            { type: "text", key: "feature2_title", formKey: "text.circular_feature_2_name", label: "Feature 2 Title", placeholder: "Versatility", productMetafield: "kluck_ai.circular_feature_2_name" },
            { type: "text", key: "feature2_text", formKey: "text.circular_feature_2_desc", label: "Feature 2 Description", placeholder: "", productMetafield: "kluck_ai.circular_feature_2_desc" },
            { type: "text", key: "feature3_title", formKey: "text.circular_feature_3_name", label: "Feature 3 Title", placeholder: "Comfort", productMetafield: "kluck_ai.circular_feature_3_name" },
            { type: "text", key: "feature3_text", formKey: "text.circular_feature_3_desc", label: "Feature 3 Description", placeholder: "", productMetafield: "kluck_ai.circular_feature_3_desc" },
            { type: "text", key: "feature4_title", formKey: "text.circular_feature_4_name", label: "Feature 4 Title", placeholder: "Tranquility", productMetafield: "kluck_ai.circular_feature_4_name" },
            { type: "text", key: "feature4_text", formKey: "text.circular_feature_4_desc", label: "Feature 4 Description", placeholder: "", productMetafield: "kluck_ai.circular_feature_4_desc" }
        ]
    },
    "comparison-table": {
        displayName: "Comparison Table",
        useForm: true,
        fields: [
            { type: "text", key: "subheading", formKey: "text.what_set_us_apart_subheading", label: "Subheading", placeholder: "", productMetafield: "kluck_ai.what_set_us_apart_subheading" },
            // { type: "text", key: "feature_col_label", formKey: "feature_col_label", label: "Feature column label", placeholder: "Features" },
            // { type: "text", key: "brand_label", formKey: "brand_label", label: "Brand label", placeholder: "Us" },
            // { type: "text", key: "others_label", formKey: "others_label", label: "Others column label", placeholder: "Others" },
            { type: "text", key: "row1_feature", formKey: "text.what_sets_us_apart_feature_1", label: "Row 1 feature", placeholder: "", productMetafield: "kluck_ai.what_sets_us_apart_feature_1" },
            { type: "text", key: "row2_feature", formKey: "text.what_sets_us_apart_feature_2", label: "Row 2 feature", placeholder: "", productMetafield: "kluck_ai.what_sets_us_apart_feature_2" },
            { type: "text", key: "row3_feature", formKey: "text.what_sets_us_apart_feature_3", label: "Row 3 feature", placeholder: "", productMetafield: "kluck_ai.what_sets_us_apart_feature_3" }
        ]
    },
    "delivery-estimator": {
        displayName: "Delivery Estimator",
        useForm: false,
        fields: [
            { type: "text", key: "processing_days", formKey: "processing_days", label: "Processing days", placeholder: "2" },
            { type: "text", key: "delivery_days_after_processing", formKey: "delivery_days_after_processing", label: "Days from processing to delivery", placeholder: "3" }
        ]
    },
    "faq": {
        displayName: "FAQ",
        useForm: true,
        fields: [
            { type: "text", key: "question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "", productMetafield: "kluck_ai.faq_question_1" },
            { type: "text", key: "answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "", productMetafield: "kluck_ai.faq_answer_1" },
            { type: "text", key: "question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "", productMetafield: "kluck_ai.faq_question_2" },
            { type: "text", key: "answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "", productMetafield: "kluck_ai.faq_answer_2" },
            { type: "text", key: "question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "", productMetafield: "kluck_ai.faq_question_3" },
            { type: "text", key: "answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "", productMetafield: "kluck_ai.faq_answer_3" },
            { type: "text", key: "question_4", formKey: "text.faq_question_4", label: "Question 4", placeholder: "", productMetafield: "kluck_ai.faq_question_4" },
            { type: "text", key: "answer_4", formKey: "text.faq_answer_4", label: "Answer 4", placeholder: "", productMetafield: "kluck_ai.faq_answer_4" },
            { type: "text", key: "question_5", formKey: "text.faq_question_5", label: "Question 5", placeholder: "", productMetafield: "kluck_ai.faq_question_5" },
            { type: "text", key: "answer_5", formKey: "text.faq_answer_5", label: "Answer 5", placeholder: "", productMetafield: "kluck_ai.faq_answer_5" }
        ]
    },
    "new-faq": {
        displayName: "FAQ (Roarr)",
        useForm: true,
        fields: [
            { type: "text", key: "title", formKey: "text.faq_section_title", label: "Heading", placeholder: "Frequently Asked Questions", productMetafield: "kluck_ai.faq_section_title" },
            { type: "text", key: "subtitle", formKey: "text.faq_section_subtitle", label: "Description", placeholder: "Our support team is here to assist with any inquiries.", productMetafield: "kluck_ai.faq_section_subtitle" },
            { type: "text", key: "question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "", productMetafield: "kluck_ai.faq_question_1" },
            { type: "text", key: "answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "", productMetafield: "kluck_ai.faq_answer_1" },
            { type: "text", key: "question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "", productMetafield: "kluck_ai.faq_question_2" },
            { type: "text", key: "answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "", productMetafield: "kluck_ai.faq_answer_2" },
            { type: "text", key: "question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "", productMetafield: "kluck_ai.faq_question_3" },
            { type: "text", key: "answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "", productMetafield: "kluck_ai.faq_answer_3" },
            { type: "text", key: "question_4", formKey: "text.faq_question_4", label: "Question 4", placeholder: "", productMetafield: "kluck_ai.faq_question_4" },
            { type: "text", key: "answer_4", formKey: "text.faq_answer_4", label: "Answer 4", placeholder: "", productMetafield: "kluck_ai.faq_answer_4" },
            { type: "text", key: "question_5", formKey: "text.faq_question_5", label: "Question 5", placeholder: "", productMetafield: "kluck_ai.faq_question_5" },
            { type: "text", key: "answer_5", formKey: "text.faq_answer_5", label: "Answer 5", placeholder: "", productMetafield: "kluck_ai.faq_answer_5" }
        ]
    },
    "four-blocks": {
        displayName: "Four Blocks",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.four_blocks_heading", label: "Heading", placeholder: "Enter your Text", productMetafield: "kluck_ai.four_blocks_heading" },
            { type: "text", key: "subheading", formKey: "text.four_blocks_subheading", label: "Subheading", placeholder: "", productMetafield: "kluck_ai.four_blocks_subheading" },
            { type: "image", key: "block_1_image", formKey: "images.body_images.product_highlight_1", label: "Block 1 Image", productMetafield: "kluck_ai.product_highlight_1" },
            { type: "text", key: "block_1_heading", formKey: "text.four_blocks_block_1_name", label: "Block 1 Heading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_1_name" },
            { type: "text", key: "block_1_subheading", formKey: "text.four_blocks_block_1_desc", label: "Block 1 Subheading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_1_desc" },
            { type: "image", key: "block_2_image", formKey: "images.body_images.product_highlight_2", label: "Block 2 Image", productMetafield: "kluck_ai.product_highlight_2" },
            { type: "text", key: "block_2_heading", formKey: "text.four_blocks_block_2_name", label: "Block 2 Heading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_2_name" },
            { type: "text", key: "block_2_subheading", formKey: "text.four_blocks_block_2_desc", label: "Block 2 Subheading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_2_desc" },
            { type: "image", key: "block_3_image", formKey: "images.body_images.product_highlight_3", label: "Block 3 Image", productMetafield: "kluck_ai.product_highlight_3" },
            { type: "text", key: "block_3_heading", formKey: "text.four_blocks_block_3_name", label: "Block 3 Heading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_3_name" },
            { type: "text", key: "block_3_subheading", formKey: "text.four_blocks_block_3_desc", label: "Block 3 Subheading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_3_desc" },
            { type: "image", key: "block_4_image", formKey: "images.body_images.product_highlight_4", label: "Block 4 Image", productMetafield: "kluck_ai.product_highlight_4" },
            { type: "text", key: "block_4_heading", formKey: "text.four_blocks_block_4_name", label: "Block 4 Heading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_4_name" },
            { type: "text", key: "block_4_subheading", formKey: "text.four_blocks_block_4_desc", label: "Block 4 Subheading", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_4_desc" }
        ]
    },
    "heading-subheading": {
        displayName: "Heading Subheading",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.high_impacting_product_heading", label: "Heading", placeholder: "Enter your heading", productMetafield: "kluck_ai.high_impacting_product_heading" },
            { type: "text", key: "subheading", formKey: "text.high_impacting_product_subheading", label: "Subheading", placeholder: "", productMetafield: "kluck_ai.high_impacting_product_subheading" }
        ]
    },
    "image-with-text": {
        displayName: "Image with Text",
        useForm: true,
        fields: [
            { type: "image", key: "image", formKey: "images.body_images.product_impact_image", label: "Image", productMetafield: "kluck_ai.product_impact_image" },
            { type: "text", key: "heading", formKey: "text.creative_sassy_product_heading", label: "Heading", placeholder: "Your Product Impact", productMetafield: "kluck_ai.creative_sassy_product_heading" },
            { type: "text", key: "subheading_1", formKey: "text.creative_sassy_product_subheading_1", label: "Feature 1", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_1_desc", formKey: "text.creative_sassy_product_subheading_1_description", label: "Feature 1 description", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_2", formKey: "text.creative_sassy_product_subheading_2", label: "Feature 2", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_2_desc", formKey: "text.creative_sassy_product_subheading_2_description", label: "Feature 2 description", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_3", formKey: "text.creative_sassy_product_subheading_3", label: "Feature 3", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_3_desc", formKey: "text.creative_sassy_product_subheading_3_description", label: "Feature 3 description", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_4", formKey: "text.creative_sassy_product_subheading_4", label: "Feature 4", placeholder: "", productMetafield: null },
            { type: "text", key: "subheading_4_desc", formKey: "text.creative_sassy_product_subheading_4_description", label: "Feature 4 description", placeholder: "", productMetafield: null }
        ]
    },
    "impact-stat": {
        displayName: "Impact Stats",
        useForm: true,
        fields: [
            { type: "image", key: "image", formKey: "images.body_images.problem_solving_image", label: "Image", productMetafield: "kluck_ai.problem_solving_image" },
            { type: "text", key: "heading", formKey: "text.stats_section_heading", label: "Heading", placeholder: "Why Choose Our Peacock Lamp", productMetafield: "kluck_ai.stats_section_heading" },
            { type: "text", key: "row1_title", formKey: "text.stats_section_point_1_heading", label: "Row 1 title", placeholder: "Instant Visual Impact", productMetafield: "kluck_ai.stats_section_point_1_heading" },
            { type: "text", key: "row1_body", formKey: "text.stats_section_point_1_desc", label: "Row 1 body", placeholder: "Enjoy mesmerizing projections immediately after activation.", productMetafield: "kluck_ai.stats_section_point_1_desc" },
            { type: "text", key: "row2_title", formKey: "text.stats_section_point_2_heading", label: "Row 2 title", placeholder: "Adjustable Brightness", productMetafield: "kluck_ai.stats_section_point_2_heading" },
            { type: "text", key: "row2_body", formKey: "text.stats_section_point_2_desc", label: "Row 2 body", placeholder: "Customize light intensity to match your mood or setting.", productMetafield: "kluck_ai.stats_section_point_2_desc" },
            { type: "text", key: "row3_title", formKey: "text.stats_section_point_3_heading", label: "Row 3 title", placeholder: "Auto Sleep Timer", productMetafield: "kluck_ai.stats_section_point_3_heading" },
            { type: "text", key: "row3_body", formKey: "text.stats_section_point_3_desc", label: "Row 3 body", placeholder: "Set the device to turn off after 30 or 60 minutes easily.", productMetafield: "kluck_ai.stats_section_point_3_desc" }
        ]
    },
    "loved-by-everyone": {
        displayName: "Loved by Everyone",
        useForm: true,
        fields: [
            // { type: "text", key: "heading", formKey: "text.loved_by_everyone_heading", label: "Heading", placeholder: "Loved by Everyone!", productMetafield: null },
            { type: "image", key: "image_1", formKey: "images.body_images.happy_customer_image_1", label: "Image 1", productMetafield: "kluck_ai.happy_customer_image_1" },
            { type: "image", key: "image_2", formKey: "images.body_images.happy_customer_image_2", label: "Image 2", productMetafield: "kluck_ai.happy_customer_image_2" },
            { type: "image", key: "image_3", formKey: "images.body_images.happy_customer_image_3", label: "Image 3", productMetafield: "kluck_ai.happy_customer_image_3" }
        ]
    },
    "product-section": {
        displayName: "Roarr Hero Section",
        useForm: false,
        fields: [
            { type: "text", key: "show_media", formKey: "show_media", label: "Show product media", placeholder: "true" },
            { type: "text", key: "media_corner_radius", formKey: "media_corner_radius", label: "Media corner radius (px)", placeholder: "12" },
            { type: "text", key: "background_color", formKey: "background_color", label: "Background color", placeholder: "#ffffff" },
            { type: "text", key: "background_opacity", formKey: "background_opacity", label: "Background opacity (%)", placeholder: "10" }
        ]
    },
    "hero-section": {
        displayName: "Roarr Hero Section",
        useForm: true,
        fields: [
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" },
            // { type: "text", key: "show_media", formKey: "show_media", label: "Show product media", placeholder: "true" },
            // { type: "text", key: "media_corner_radius", formKey: "media_corner_radius", label: "Media corner radius (px)", placeholder: "12" },
            // { type: "text", key: "background_color", formKey: "background_color", label: "Background color", placeholder: "#ffffff" },
            // { type: "text", key: "background_opacity", formKey: "background_opacity", label: "Background opacity (%)", placeholder: "10" },
            // { type: "text", key: "badge_text", formKey: "badge_text", label: "Badge text", placeholder: "Featured Product" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            // { type: "text", key: "feature_1_text", formKey: "feature_1_text", label: "Feature 1", placeholder: "Feature 1" },
            // { type: "text", key: "feature_2_text", formKey: "feature_2_text", label: "Feature 2", placeholder: "Feature 2" },
            // { type: "text", key: "feature_3_text", formKey: "feature_3_text", label: "Feature 3", placeholder: "Feature 3" },
            // { type: "text", key: "button_text", formKey: "button_text", label: "Buy Now button text", placeholder: "Buy Now" },
            // { type: "text", key: "processing_days", formKey: "processing_days", label: "Processing days", placeholder: "2" },
            // { type: "text", key: "delivery_days_after_processing", formKey: "delivery_days_after_processing", label: "Delivery days after processing", placeholder: "3" },
            { type: "text", key: "heading_1", formKey: "text.product_question_1", label: "Accordion 1 question", placeholder: "", productMetafield: "kluck_ai.product_question_1" },
            { type: "text", key: "content_1", formKey: "text.product_question_1_answer", label: "Accordion 1 answer", placeholder: "", productMetafield: "kluck_ai.product_question_1_answer" },
            { type: "text", key: "heading_2", formKey: "text.product_question_2", label: "Accordion 2 question", placeholder: "", productMetafield: "kluck_ai.product_question_2" },
            { type: "text", key: "content_2", formKey: "text.product_question_2_answer", label: "Accordion 2 answer", placeholder: "", productMetafield: "kluck_ai.product_question_2_answer" },
            { type: "text", key: "heading_3", formKey: "text.product_question_3", label: "Accordion 3 question", placeholder: "", productMetafield: "kluck_ai.product_question_3" },
            { type: "text", key: "content_3", formKey: "text.product_question_3_answer", label: "Accordion 3 answer", placeholder: "", productMetafield: "kluck_ai.product_question_3_answer" },
            { type: "text", key: "heading_4", formKey: "text.product_question_4", label: "Accordion 4 question", placeholder: "", productMetafield: "kluck_ai.product_question_4" },
            { type: "text", key: "content_4", formKey: "text.product_question_4_answer", label: "Accordion 4 answer", placeholder: "", productMetafield: "kluck_ai.product_question_4_answer" }
        ]
    },
    "product-details": {
        displayName: "Product Details",
        useForm: true,
        fields: [
            { type: "text", key: "badge_text", formKey: "badge_text", label: "Badge text", placeholder: "Featured Product" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            { type: "text", key: "features_text", formKey: "features_text", label: "Features (# separated)", placeholder: "Feature 1#Feature 2#Feature 3" }
        ]
    },
    "text-marquee": {
        displayName: "Infinite Marquee",
        useForm: true,
        fields: [
            { type: "text", key: "text_1", formKey: "text.marquee_text_1", label: "Text 1", placeholder: "Vegan", productMetafield: "kluck_ai.marquee_text_1" },
            // { type: "image", key: "image_1", formKey: "images.body_images.marquee_image_1", label: "Image 1", productMetafield: "kluck_ai.marquee_image_1" },
            { type: "text", key: "text_2", formKey: "text.marquee_text_2", label: "Text 2", placeholder: "Cruelty-Free", productMetafield: "kluck_ai.marquee_text_2" },
            // { type: "image", key: "image_2", formKey: "images.body_images.marquee_image_2", label: "Image 2", productMetafield: "kluck_ai.marquee_image_2" },
            { type: "text", key: "text_3", formKey: "text.marquee_text_3", label: "Text 3", placeholder: "Silicone-Free", productMetafield: "kluck_ai.marquee_text_3" },
            // { type: "image", key: "image_3", formKey: "images.body_images.marquee_image_3", label: "Image 3", productMetafield: "kluck_ai.marquee_image_3" }
        ]
    },
    "kluck-ai-marquee-section-1": {
        displayName: "Marquee",
        useForm: true,
        fields: [
            { type: "text", key: "text_1", formKey: "text.marquee_text_1", label: "Text 1", placeholder: "Roarr Quality", productMetafield: "kluck_ai.marquee_text_1" },
            { type: "text", key: "text_2", formKey: "text.marquee_text_2", label: "Text 2", placeholder: "Roarr Quality", productMetafield: "kluck_ai.marquee_text_2" },
            { type: "text", key: "text_3", formKey: "text.marquee_text_3", label: "Text 3", placeholder: "Roarr Quality", productMetafield: "kluck_ai.marquee_text_3" }
        ]
    },
    "kluck-ai-product-feature-details-section": {
        displayName: "Detail Grid",
        useForm: true,
        fields: [
            { type: "image", key: "image_1", formKey: "images.body_images.happy_customer_image_1", label: "Image 1", productMetafield: "kluck_ai.happy_customer_image_1" },
            { type: "text", key: "text_1", formKey: "text.impactfull_poetic_product_detail_1", label: "Detail 1", placeholder: "Describe a specific detail or feature.", productMetafield: "kluck_ai.impactfull_poetic_product_detail_1" },
            { type: "image", key: "image_2", formKey: "images.body_images.happy_customer_image_2", label: "Image 2", productMetafield: "kluck_ai.happy_customer_image_2" },
            { type: "text", key: "text_2", formKey: "text.impactfull_poetic_product_detail_2", label: "Detail 2", placeholder: "Describe a specific detail or feature.", productMetafield: "kluck_ai.impactfull_poetic_product_detail_2" },
            { type: "image", key: "image_3", formKey: "images.body_images.happy_customer_image_3", label: "Image 3", productMetafield: "kluck_ai.happy_customer_image_3" },
            { type: "text", key: "text_3", formKey: "text.impactfull_poetic_product_detail_3", label: "Detail 3", placeholder: "Describe a specific detail or feature.", productMetafield: "kluck_ai.impactfull_poetic_product_detail_3" }
        ]
    },
    "kluck-ai-product-hero-section-3": {
        displayName: "Product Hero",
        useForm: true,
        fields: [
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" }
        ]
    },
    "kluck-ai-product-hero-section-2": {
        displayName: "Modern Product Hero",
        useForm: true,
        fields: [
            { type: "text", key: "product_title", formKey: "text.product_title", label: "Product title", placeholder: "", productMetafield: "kluck_ai.product_title" },
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            { type: "text", key: "heading_1", formKey: "text.product_question_1", label: "Accordion 1 title", placeholder: "", productMetafield: "kluck_ai.product_question_1" },
            { type: "text", key: "content_1", formKey: "text.product_question_1_answer", label: "Accordion 1 content", placeholder: "", productMetafield: "kluck_ai.product_question_1_answer" },
            { type: "text", key: "heading_2", formKey: "text.product_question_2", label: "Accordion 2 title", placeholder: "", productMetafield: "kluck_ai.product_question_2" },
            { type: "text", key: "content_2", formKey: "text.product_question_2_answer", label: "Accordion 2 content", placeholder: "", productMetafield: "kluck_ai.product_question_2_answer" },
            { type: "text", key: "heading_3", formKey: "text.product_question_3", label: "Accordion 3 title", placeholder: "", productMetafield: "kluck_ai.product_question_3" },
            { type: "text", key: "content_3", formKey: "text.product_question_3_answer", label: "Accordion 3 content", placeholder: "", productMetafield: "kluck_ai.product_question_3_answer" }
        ]
    },
    "kluck-ai-trust-badge-2-section": {
        displayName: "Trust Badges",
        useForm: true,
        fields: [
            { type: "text", key: "badge_text_1", formKey: "text.badge_text_1", label: "Badge 1", productMetafield: "kluck_ai.badge_text_1" },
            { type: "text", key: "badge_text_2", formKey: "text.badge_text_2", label: "Badge 2", productMetafield: "kluck_ai.badge_text_2" },
            { type: "text", key: "badge_text_3", formKey: "text.badge_text_3", label: "Badge 3", productMetafield: "kluck_ai.badge_text_3" },
            { type: "text", key: "badge_text_4", formKey: "text.badge_text_4", label: "Badge 4", productMetafield: "kluck_ai.badge_text_4" }
        ]
    },
    "kluck-ai-image-with-text-3-section-product": {
        displayName: "Split Feature Banner",
        useForm: true,
        fields: [
            { type: "image", key: "feature_image", formKey: "images.body_images.product_impact_image", label: "Feature image", productMetafield: "kluck_ai.product_impact_image" },
            { type: "text", key: "heading", formKey: "text.highlight_banner_section_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.highlight_banner_section_heading" },
            { type: "text", key: "description", formKey: "text.highlight_banner_section_description", label: "Description", placeholder: "", productMetafield: "kluck_ai.highlight_banner_section_description" }
        ]
    },
    "play-hero": {
        displayName: "Hero",
        useForm: true,
        fields: [
            { type: "text", key: "title", formKey: "text.product_title", label: "Title", placeholder: "", productMetafield: "kluck_ai.product_title" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" }
        ]
    },
    "play-marquee": {
        displayName: "Ticker",
        useForm: true,
        fields: [
            { type: "text", key: "text_1", formKey: "text.marquee_text_1", label: "Text 1", placeholder: "", productMetafield: "kluck_ai.marquee_text_1" },
            { type: "text", key: "text_2", formKey: "text.marquee_text_2", label: "Text 2", placeholder: "", productMetafield: "kluck_ai.marquee_text_2" },
            { type: "text", key: "text_3", formKey: "text.marquee_text_3", label: "Text 3", placeholder: "", productMetafield: "kluck_ai.marquee_text_3" }
        ]
    },
    "play-features": {
        displayName: "Features",
        useForm: true,
        fields: [
            { type: "text", key: "label_1", formKey: "text.feature_label_1", label: "Feature 1", placeholder: "", productMetafield: "kluck_ai.feature_label_1" },
            { type: "text", key: "label_2", formKey: "text.feature_label_2", label: "Feature 2", placeholder: "", productMetafield: "kluck_ai.feature_label_2" },
            { type: "text", key: "label_3", formKey: "text.feature_label_3", label: "Feature 3", placeholder: "", productMetafield: "kluck_ai.feature_label_3" }
        ]
    },
    "play-promo": {
        displayName: "Promo",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.pillow_banner_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.pillow_banner_heading" },
            { type: "text", key: "subheading", formKey: "text.pillow_banner_subheading", label: "Subheading", placeholder: "", productMetafield: "kluck_ai.pillow_banner_subheading" },
            { type: "text", key: "code", formKey: "text.promo_code", label: "Code", placeholder: "", productMetafield: "kluck_ai.promo_code" },
            { type: "image", key: "image", formKey: "images.body_images.feature_image", label: "Image", productMetafield: "kluck_ai.feature_image" }
        ]
    },
    "play-story": {
        displayName: "Story",
        useForm: true,
        fields: [
            { type: "image", key: "image_1", formKey: "images.body_images.product_highlight_1", label: "Photo 1", productMetafield: "kluck_ai.product_highlight_1" },
            { type: "image", key: "image_2", formKey: "images.body_images.product_highlight_2", label: "Photo 2", productMetafield: "kluck_ai.product_highlight_2" },
            { type: "image", key: "image_3", formKey: "images.body_images.product_highlight_3", label: "Photo 3", productMetafield: "kluck_ai.product_highlight_3" },
            { type: "image", key: "image_4", formKey: "images.body_images.product_highlight_4", label: "Photo 4", productMetafield: "kluck_ai.product_highlight_4" },
            { type: "text", key: "pill_1", formKey: "text.pill_1", label: "Pill 1", placeholder: "", productMetafield: "kluck_ai.pill_1" },
            { type: "text", key: "pill_2", formKey: "text.pill_2", label: "Pill 2", placeholder: "", productMetafield: "kluck_ai.pill_2" },
            { type: "text", key: "pill_3", formKey: "text.pill_3", label: "Pill 3", placeholder: "", productMetafield: "kluck_ai.pill_3" }
        ]
    },
    "play-designed": {
        displayName: "Thoughtfully Designed",
        useForm: true,
        fields: [
            { type: "image", key: "image", formKey: "images.body_images.problem_solving_image", label: "Image", productMetafield: "kluck_ai.problem_solving_image" },
            { type: "text", key: "question_1", formKey: "text.product_question_1", label: "Question 1", placeholder: "", productMetafield: "kluck_ai.product_question_1" },
            { type: "text", key: "answer_1", formKey: "text.product_question_1_answer", label: "Answer 1", placeholder: "", productMetafield: "kluck_ai.product_question_1_answer" },
            { type: "text", key: "question_2", formKey: "text.product_question_2", label: "Question 2", placeholder: "", productMetafield: "kluck_ai.product_question_2" },
            { type: "text", key: "answer_2", formKey: "text.product_question_2_answer", label: "Answer 2", placeholder: "", productMetafield: "kluck_ai.product_question_2_answer" },
            { type: "text", key: "question_3", formKey: "text.product_question_3", label: "Question 3", placeholder: "", productMetafield: "kluck_ai.product_question_3" },
            { type: "text", key: "answer_3", formKey: "text.product_question_3_answer", label: "Answer 3", placeholder: "", productMetafield: "kluck_ai.product_question_3_answer" }
        ]
    },
    "play-badges": {
        displayName: "Badges",
        useForm: true,
        fields: [
            { type: "text", key: "text_1", formKey: "text.badge_text_1", label: "Text 1", placeholder: "", productMetafield: "kluck_ai.badge_text_1" },
            { type: "text", key: "text_2", formKey: "text.badge_text_2", label: "Text 2", placeholder: "", productMetafield: "kluck_ai.badge_text_2" },
            { type: "text", key: "text_3", formKey: "text.badge_text_3", label: "Text 3", placeholder: "", productMetafield: "kluck_ai.badge_text_3" },
            { type: "text", key: "text_4", formKey: "text.badge_text_4", label: "Text 4", placeholder: "", productMetafield: "kluck_ai.badge_text_4" }
        ]
    },
    "play-circles": {
        displayName: "Round photos",
        useForm: true,
        fields: [
            { type: "image", key: "image_1", formKey: "images.body_images.happy_customer_image_1", label: "Photo 1", productMetafield: "kluck_ai.happy_customer_image_1" },
            { type: "text", key: "caption_1", formKey: "text.circle_1", label: "Caption 1", placeholder: "", productMetafield: "kluck_ai.circle_1" },
            { type: "image", key: "image_2", formKey: "images.body_images.happy_customer_image_2", label: "Photo 2", productMetafield: "kluck_ai.happy_customer_image_2" },
            { type: "text", key: "caption_2", formKey: "text.circle_2", label: "Caption 2", placeholder: "", productMetafield: "kluck_ai.circle_2" },
            { type: "image", key: "image_3", formKey: "images.body_images.happy_customer_image_3", label: "Photo 3", productMetafield: "kluck_ai.happy_customer_image_3" },
            { type: "text", key: "caption_3", formKey: "text.circle_3", label: "Caption 3", placeholder: "", productMetafield: "kluck_ai.circle_3" },
            { type: "text", key: "caption_4", formKey: "text.circle_4", label: "Caption 4", placeholder: "", productMetafield: "kluck_ai.circle_4" }
        ]
    },
    "play-reviews": {
        displayName: "Reviews",
        useForm: true,
        fields: [
            { type: "text", key: "title_1", formKey: "text.review_title_1", label: "Review 1 title", placeholder: "", productMetafield: "kluck_ai.review_title_1" },
            { type: "text", key: "body_1", formKey: "text.review_body_1", label: "Review 1 text", placeholder: "", productMetafield: "kluck_ai.review_body_1" },
            { type: "text", key: "name_1", formKey: "text.review_name_1", label: "Review 1 name", placeholder: "", productMetafield: "kluck_ai.review_name_1" },
            { type: "text", key: "title_2", formKey: "text.review_title_2", label: "Review 2 title", placeholder: "", productMetafield: "kluck_ai.review_title_2" },
            { type: "text", key: "body_2", formKey: "text.review_body_2", label: "Review 2 text", placeholder: "", productMetafield: "kluck_ai.review_body_2" },
            { type: "text", key: "name_2", formKey: "text.review_name_2", label: "Review 2 name", placeholder: "", productMetafield: "kluck_ai.review_name_2" },
            { type: "text", key: "title_3", formKey: "text.review_title_3", label: "Review 3 title", placeholder: "", productMetafield: "kluck_ai.review_title_3" },
            { type: "text", key: "body_3", formKey: "text.review_body_3", label: "Review 3 text", placeholder: "", productMetafield: "kluck_ai.review_body_3" },
            { type: "text", key: "name_3", formKey: "text.review_name_3", label: "Review 3 name", placeholder: "", productMetafield: "kluck_ai.review_name_3" },
            { type: "text", key: "title_4", formKey: "text.review_title_4", label: "Review 4 title", placeholder: "", productMetafield: "kluck_ai.review_title_4" },
            { type: "text", key: "body_4", formKey: "text.review_body_4", label: "Review 4 text", placeholder: "", productMetafield: "kluck_ai.review_body_4" },
            { type: "text", key: "name_4", formKey: "text.review_name_4", label: "Review 4 name", placeholder: "", productMetafield: "kluck_ai.review_name_4" }
        ]
    },
    "play-instagram": {
        displayName: "Instagram",
        useForm: true,
        fields: [
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Photo 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Photo 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Photo 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Photo 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Photo 5", productMetafield: "kluck_ai.product_image_5" }
        ]
    },
    "glow-hero": {
        displayName: "Hero",
        useForm: true,
        fields: [
            { type: "text", key: "title", formKey: "text.product_title", label: "Title", placeholder: "", productMetafield: "kluck_ai.product_title" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            { type: "text", key: "badge_1", formKey: "text.badge_text_1", label: "Check 1", placeholder: "", productMetafield: "kluck_ai.badge_text_1" },
            { type: "text", key: "badge_2", formKey: "text.badge_text_2", label: "Check 2", placeholder: "", productMetafield: "kluck_ai.badge_text_2" },
            { type: "text", key: "badge_3", formKey: "text.badge_text_3", label: "Check 3", placeholder: "", productMetafield: "kluck_ai.badge_text_3" },
            { type: "text", key: "delivery", formKey: "text.delivery_line", label: "Delivery line", placeholder: "", productMetafield: "kluck_ai.delivery_line" },
            { type: "text", key: "shipping", formKey: "text.shipping_line", label: "Shipping line", placeholder: "", productMetafield: "kluck_ai.shipping_line" },
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" }
        ]
    },
    "glow-special": {
        displayName: "Why it's special",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.circular_features_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.circular_features_heading" },
            { type: "image", key: "image_1", formKey: "images.body_images.product_highlight_1", label: "Photo 1", productMetafield: "kluck_ai.product_highlight_1" },
            { type: "text", key: "name_1", formKey: "text.circular_feature_1_name", label: "Point 1", placeholder: "", productMetafield: "kluck_ai.circular_feature_1_name" },
            { type: "text", key: "desc_1", formKey: "text.circular_feature_1_desc", label: "Point 1 text", placeholder: "", productMetafield: "kluck_ai.circular_feature_1_desc" },
            { type: "image", key: "image_2", formKey: "images.body_images.product_highlight_2", label: "Photo 2", productMetafield: "kluck_ai.product_highlight_2" },
            { type: "text", key: "name_2", formKey: "text.circular_feature_2_name", label: "Point 2", placeholder: "", productMetafield: "kluck_ai.circular_feature_2_name" },
            { type: "text", key: "desc_2", formKey: "text.circular_feature_2_desc", label: "Point 2 text", placeholder: "", productMetafield: "kluck_ai.circular_feature_2_desc" },
            { type: "image", key: "image_3", formKey: "images.body_images.product_highlight_3", label: "Photo 3", productMetafield: "kluck_ai.product_highlight_3" },
            { type: "text", key: "name_3", formKey: "text.circular_feature_3_name", label: "Point 3", placeholder: "", productMetafield: "kluck_ai.circular_feature_3_name" },
            { type: "text", key: "desc_3", formKey: "text.circular_feature_3_desc", label: "Point 3 text", placeholder: "", productMetafield: "kluck_ai.circular_feature_3_desc" },
            { type: "text", key: "name_4", formKey: "text.circular_feature_4_name", label: "Point 4", placeholder: "", productMetafield: "kluck_ai.circular_feature_4_name" },
            { type: "text", key: "desc_4", formKey: "text.circular_feature_4_desc", label: "Point 4 text", placeholder: "", productMetafield: "kluck_ai.circular_feature_4_desc" },
            { type: "text", key: "name_5", formKey: "text.circular_feature_5_name", label: "Point 5", placeholder: "", productMetafield: "kluck_ai.circular_feature_5_name" },
            { type: "text", key: "desc_5", formKey: "text.circular_feature_5_desc", label: "Point 5 text", placeholder: "", productMetafield: "kluck_ai.circular_feature_5_desc" },
            { type: "text", key: "ship_heading", formKey: "text.ship_heading", label: "Shipping heading", placeholder: "", productMetafield: "kluck_ai.ship_heading" },
            { type: "text", key: "ship_body_1", formKey: "text.ship_body_1", label: "Shipping line 1", placeholder: "", productMetafield: "kluck_ai.ship_body_1" },
            { type: "text", key: "ship_body_2", formKey: "text.ship_body_2", label: "Shipping line 2", placeholder: "", productMetafield: "kluck_ai.ship_body_2" },
            { type: "text", key: "ship_body_3", formKey: "text.ship_body_3", label: "Shipping line 3", placeholder: "", productMetafield: "kluck_ai.ship_body_3" },
            { type: "text", key: "returns_heading", formKey: "text.returns_heading", label: "Returns heading", placeholder: "", productMetafield: "kluck_ai.returns_heading" },
            { type: "text", key: "returns_body", formKey: "text.returns_body", label: "Returns text", placeholder: "", productMetafield: "kluck_ai.returns_body" }
        ]
    },
    "glow-stats": {
        displayName: "Results",
        useForm: true,
        fields: [
            { type: "text", key: "stat_1", formKey: "text.bento_stat_1", label: "Stat 1", placeholder: "", productMetafield: "kluck_ai.bento_stat_1" },
            { type: "text", key: "stat_1_text", formKey: "text.bento_stat_description_1", label: "Stat 1 text", placeholder: "", productMetafield: "kluck_ai.bento_stat_description_1" },
            { type: "text", key: "stat_2", formKey: "text.bento_stat_2", label: "Stat 2", placeholder: "", productMetafield: "kluck_ai.bento_stat_2" },
            { type: "text", key: "stat_2_text", formKey: "text.bento_stat_description_2", label: "Stat 2 text", placeholder: "", productMetafield: "kluck_ai.bento_stat_description_2" },
            { type: "text", key: "stat_3", formKey: "text.stats_section_point_1_heading", label: "Stat 3", placeholder: "", productMetafield: "kluck_ai.stats_section_point_1_heading" },
            { type: "text", key: "stat_3_text", formKey: "text.stats_section_point_1_desc", label: "Stat 3 text", placeholder: "", productMetafield: "kluck_ai.stats_section_point_1_desc" }
        ]
    },
    "glow-ingredients": {
        displayName: "Ingredients",
        useForm: true,
        fields: [
            { type: "text", key: "kicker", formKey: "text.four_blocks_heading", label: "Label", placeholder: "", productMetafield: "kluck_ai.four_blocks_heading" },
            { type: "text", key: "heading", formKey: "text.four_blocks_subheading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.four_blocks_subheading" },
            { type: "text", key: "intro", formKey: "text.ingredients_intro", label: "Intro", placeholder: "", productMetafield: "kluck_ai.ingredients_intro" },
            { type: "text", key: "name_1", formKey: "text.four_blocks_block_1_name", label: "Ingredient 1", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_1_name" },
            { type: "text", key: "desc_1", formKey: "text.four_blocks_block_1_desc", label: "Ingredient 1 text", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_1_desc" },
            { type: "text", key: "name_2", formKey: "text.four_blocks_block_2_name", label: "Ingredient 2", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_2_name" },
            { type: "text", key: "desc_2", formKey: "text.four_blocks_block_2_desc", label: "Ingredient 2 text", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_2_desc" },
            { type: "text", key: "name_3", formKey: "text.four_blocks_block_3_name", label: "Ingredient 3", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_3_name" },
            { type: "text", key: "desc_3", formKey: "text.four_blocks_block_3_desc", label: "Ingredient 3 text", placeholder: "", productMetafield: "kluck_ai.four_blocks_block_3_desc" },
            { type: "image", key: "feature_image", formKey: "images.body_images.feature_image", label: "Image", productMetafield: "kluck_ai.feature_image" }
        ]
    },
    "glow-steps": {
        displayName: "How to use",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.creative_sassy_product_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_heading" },
            { type: "text", key: "subheading", formKey: "text.creative_sassy_product_subheading_4", label: "Subheading", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_4" },
            { type: "text", key: "body", formKey: "text.how_to_body", label: "Intro", placeholder: "", productMetafield: "kluck_ai.how_to_body" },
            { type: "text", key: "step_1", formKey: "text.creative_sassy_product_subheading_1", label: "Step 1", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_1" },
            { type: "text", key: "step_1_text", formKey: "text.creative_sassy_product_subheading_1_description", label: "Step 1 text", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_1_description" },
            { type: "text", key: "step_2", formKey: "text.creative_sassy_product_subheading_2", label: "Step 2", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_2" },
            { type: "text", key: "step_2_text", formKey: "text.creative_sassy_product_subheading_2_description", label: "Step 2 text", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_2_description" },
            { type: "text", key: "step_3", formKey: "text.creative_sassy_product_subheading_3", label: "Step 3", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_3" },
            { type: "text", key: "step_3_text", formKey: "text.creative_sassy_product_subheading_3_description", label: "Step 3 text", placeholder: "", productMetafield: "kluck_ai.creative_sassy_product_subheading_3_description" },
            { type: "image", key: "how_to_image_1", formKey: "images.body_images.how_to_image_1", label: "Step photo 1", productMetafield: "kluck_ai.how_to_image_1" },
            { type: "image", key: "how_to_image_2", formKey: "images.body_images.how_to_image_2", label: "Step photo 2", productMetafield: "kluck_ai.how_to_image_2" },
            { type: "image", key: "how_to_image_3", formKey: "images.body_images.how_to_image_3", label: "Step photo 3", productMetafield: "kluck_ai.how_to_image_3" }
        ]
    },
    "glow-faq": {
        displayName: "FAQs",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.faq_section_title", label: "Heading", placeholder: "", productMetafield: "kluck_ai.faq_section_title" },
            { type: "text", key: "question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "", productMetafield: "kluck_ai.faq_question_1" },
            { type: "text", key: "answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "", productMetafield: "kluck_ai.faq_answer_1" },
            { type: "text", key: "question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "", productMetafield: "kluck_ai.faq_question_2" },
            { type: "text", key: "answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "", productMetafield: "kluck_ai.faq_answer_2" },
            { type: "text", key: "question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "", productMetafield: "kluck_ai.faq_question_3" },
            { type: "text", key: "answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "", productMetafield: "kluck_ai.faq_answer_3" },
            { type: "text", key: "question_4", formKey: "text.faq_question_4", label: "Question 4", placeholder: "", productMetafield: "kluck_ai.faq_question_4" },
            { type: "text", key: "answer_4", formKey: "text.faq_answer_4", label: "Answer 4", placeholder: "", productMetafield: "kluck_ai.faq_answer_4" }
        ]
    },
    "lumen-hero": {
        displayName: "Hero",
        useForm: true,
        fields: [
            { type: "text", key: "title", formKey: "text.product_title", label: "Title", placeholder: "", productMetafield: "kluck_ai.product_title" },
            { type: "text", key: "eyebrow", formKey: "text.lumen_eyebrow", label: "Product type", placeholder: "", productMetafield: "kluck_ai.lumen_eyebrow" },
            { type: "text", key: "subtitle", formKey: "text.product_subtitle", label: "Subtitle", placeholder: "", productMetafield: "kluck_ai.product_subtitle" },
            { type: "text", key: "price_note", formKey: "text.lumen_price_note", label: "Price note", placeholder: "", productMetafield: "kluck_ai.lumen_price_note" },
            { type: "text", key: "delivery_heading", formKey: "text.lumen_delivery_heading", label: "Delivery heading", placeholder: "", productMetafield: "kluck_ai.lumen_delivery_heading" },
            { type: "text", key: "delivery", formKey: "text.delivery_line", label: "Delivery line", placeholder: "", productMetafield: "kluck_ai.delivery_line" },
            { type: "text", key: "badge_1", formKey: "text.badge_text_1", label: "Trust 1", placeholder: "", productMetafield: "kluck_ai.badge_text_1" },
            { type: "text", key: "badge_2", formKey: "text.badge_text_2", label: "Trust 2", placeholder: "", productMetafield: "kluck_ai.badge_text_2" },
            { type: "text", key: "badge_3", formKey: "text.badge_text_3", label: "Trust 3", placeholder: "", productMetafield: "kluck_ai.badge_text_3" },
            { type: "text", key: "badge_4", formKey: "text.badge_text_4", label: "Trust 4", placeholder: "", productMetafield: "kluck_ai.badge_text_4" },
            { type: "text", key: "acc_1_title", formKey: "text.lumen_acc_1_title", label: "Tab 1 label", placeholder: "", productMetafield: "kluck_ai.lumen_acc_1_title" },
            { type: "text", key: "acc_1_body", formKey: "text.lumen_acc_1_body", label: "Tab 1 text", placeholder: "", productMetafield: "kluck_ai.lumen_acc_1_body" },
            { type: "text", key: "acc_2_title", formKey: "text.lumen_acc_2_title", label: "Tab 2 label", placeholder: "", productMetafield: "kluck_ai.lumen_acc_2_title" },
            { type: "text", key: "acc_2_body", formKey: "text.lumen_acc_2_body", label: "Tab 2 text", placeholder: "", productMetafield: "kluck_ai.lumen_acc_2_body" },
            { type: "text", key: "acc_3_title", formKey: "text.lumen_acc_3_title", label: "Tab 3 label", placeholder: "", productMetafield: "kluck_ai.lumen_acc_3_title" },
            { type: "text", key: "acc_3_body", formKey: "text.lumen_acc_3_body", label: "Tab 3 text", placeholder: "", productMetafield: "kluck_ai.lumen_acc_3_body" },
            { type: "text", key: "acc_4_title", formKey: "text.lumen_acc_4_title", label: "Tab 4 label", placeholder: "", productMetafield: "kluck_ai.lumen_acc_4_title" },
            { type: "text", key: "acc_4_body", formKey: "text.lumen_acc_4_body", label: "Tab 4 text", placeholder: "", productMetafield: "kluck_ai.lumen_acc_4_body" },
            { type: "image", key: "product_image_1", formKey: "images.product_images.product_image_1", label: "Product image 1", productMetafield: "kluck_ai.product_image_1" },
            { type: "image", key: "product_image_2", formKey: "images.product_images.product_image_2", label: "Product image 2", productMetafield: "kluck_ai.product_image_2" },
            { type: "image", key: "product_image_3", formKey: "images.product_images.product_image_3", label: "Product image 3", productMetafield: "kluck_ai.product_image_3" },
            { type: "image", key: "product_image_4", formKey: "images.product_images.product_image_4", label: "Product image 4", productMetafield: "kluck_ai.product_image_4" },
            { type: "image", key: "product_image_5", formKey: "images.product_images.product_image_5", label: "Product image 5", productMetafield: "kluck_ai.product_image_5" }
        ]
    },
    "lumen-detail": {
        displayName: "In detail",
        useForm: true,
        fields: [
            { type: "text", key: "eyebrow", formKey: "text.lumen_detail_eyebrow", label: "Label", placeholder: "", productMetafield: "kluck_ai.lumen_detail_eyebrow" },
            { type: "text", key: "heading", formKey: "text.lumen_detail_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.lumen_detail_heading" },
            { type: "text", key: "text", formKey: "text.lumen_detail_text", label: "Text", placeholder: "", productMetafield: "kluck_ai.lumen_detail_text" }
        ]
    },
    "lumen-feature": {
        displayName: "Feature",
        useForm: true,
        fields: [
            { type: "text", key: "eyebrow", formKey: "text.lumen_feature_eyebrow", label: "Label", placeholder: "", productMetafield: "kluck_ai.lumen_feature_eyebrow" },
            { type: "text", key: "heading", formKey: "text.lumen_feature_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.lumen_feature_heading" },
            { type: "image", key: "feature_image", formKey: "images.body_images.feature_image", label: "Image", productMetafield: "kluck_ai.feature_image" },
            { type: "text", key: "point_1", formKey: "text.lumen_point_1_title", label: "Point 1", placeholder: "", productMetafield: "kluck_ai.lumen_point_1_title" },
            { type: "text", key: "point_1_text", formKey: "text.lumen_point_1_text", label: "Point 1 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_1_text" },
            { type: "text", key: "point_2", formKey: "text.lumen_point_2_title", label: "Point 2", placeholder: "", productMetafield: "kluck_ai.lumen_point_2_title" },
            { type: "text", key: "point_2_text", formKey: "text.lumen_point_2_text", label: "Point 2 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_2_text" },
            { type: "text", key: "point_3", formKey: "text.lumen_point_3_title", label: "Point 3", placeholder: "", productMetafield: "kluck_ai.lumen_point_3_title" },
            { type: "text", key: "point_3_text", formKey: "text.lumen_point_3_text", label: "Point 3 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_3_text" },
            { type: "text", key: "point_4", formKey: "text.lumen_point_4_title", label: "Point 4", placeholder: "", productMetafield: "kluck_ai.lumen_point_4_title" },
            { type: "text", key: "point_4_text", formKey: "text.lumen_point_4_text", label: "Point 4 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_4_text" },
            { type: "text", key: "point_5", formKey: "text.lumen_point_5_title", label: "Point 5", placeholder: "", productMetafield: "kluck_ai.lumen_point_5_title" },
            { type: "text", key: "point_5_text", formKey: "text.lumen_point_5_text", label: "Point 5 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_5_text" },
            { type: "text", key: "point_6", formKey: "text.lumen_point_6_title", label: "Point 6", placeholder: "", productMetafield: "kluck_ai.lumen_point_6_title" },
            { type: "text", key: "point_6_text", formKey: "text.lumen_point_6_text", label: "Point 6 text", placeholder: "", productMetafield: "kluck_ai.lumen_point_6_text" }
        ]
    },
    "lumen-details": {
        displayName: "The details",
        useForm: true,
        fields: [
            { type: "text", key: "heading", formKey: "text.lumen_details_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.lumen_details_heading" },
            { type: "image", key: "image_1", formKey: "images.body_images.product_highlight_1", label: "Row 1 image", productMetafield: "kluck_ai.product_highlight_1" },
            { type: "text", key: "title_1", formKey: "text.lumen_detail_1_title", label: "Row 1 title", placeholder: "", productMetafield: "kluck_ai.lumen_detail_1_title" },
            { type: "text", key: "text_1", formKey: "text.lumen_detail_1_text", label: "Row 1 text", placeholder: "", productMetafield: "kluck_ai.lumen_detail_1_text" },
            { type: "image", key: "image_2", formKey: "images.body_images.product_highlight_2", label: "Row 2 image", productMetafield: "kluck_ai.product_highlight_2" },
            { type: "text", key: "title_2", formKey: "text.lumen_detail_2_title", label: "Row 2 title", placeholder: "", productMetafield: "kluck_ai.lumen_detail_2_title" },
            { type: "text", key: "text_2", formKey: "text.lumen_detail_2_text", label: "Row 2 text", placeholder: "", productMetafield: "kluck_ai.lumen_detail_2_text" },
            { type: "image", key: "image_3", formKey: "images.body_images.product_highlight_3", label: "Row 3 image", productMetafield: "kluck_ai.product_highlight_3" },
            { type: "text", key: "title_3", formKey: "text.lumen_detail_3_title", label: "Row 3 title", placeholder: "", productMetafield: "kluck_ai.lumen_detail_3_title" },
            { type: "text", key: "text_3", formKey: "text.lumen_detail_3_text", label: "Row 3 text", placeholder: "", productMetafield: "kluck_ai.lumen_detail_3_text" }
        ]
    },
    "lumen-circle": {
        displayName: "Chosen with care",
        useForm: true,
        fields: [
            { type: "text", key: "eyebrow", formKey: "text.lumen_circle_eyebrow", label: "Label", placeholder: "", productMetafield: "kluck_ai.lumen_circle_eyebrow" },
            { type: "text", key: "heading", formKey: "text.lumen_circle_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.lumen_circle_heading" },
            { type: "text", key: "title_1", formKey: "text.lumen_circle_1_title", label: "Line 1", placeholder: "", productMetafield: "kluck_ai.lumen_circle_1_title" },
            { type: "text", key: "text_1", formKey: "text.lumen_circle_1_text", label: "Line 1 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_1_text" },
            { type: "text", key: "title_2", formKey: "text.lumen_circle_2_title", label: "Line 2", placeholder: "", productMetafield: "kluck_ai.lumen_circle_2_title" },
            { type: "text", key: "text_2", formKey: "text.lumen_circle_2_text", label: "Line 2 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_2_text" },
            { type: "text", key: "title_3", formKey: "text.lumen_circle_3_title", label: "Line 3", placeholder: "", productMetafield: "kluck_ai.lumen_circle_3_title" },
            { type: "text", key: "text_3", formKey: "text.lumen_circle_3_text", label: "Line 3 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_3_text" },
            { type: "text", key: "title_4", formKey: "text.lumen_circle_4_title", label: "Line 4", placeholder: "", productMetafield: "kluck_ai.lumen_circle_4_title" },
            { type: "text", key: "text_4", formKey: "text.lumen_circle_4_text", label: "Line 4 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_4_text" },
            { type: "text", key: "title_5", formKey: "text.lumen_circle_5_title", label: "Line 5", placeholder: "", productMetafield: "kluck_ai.lumen_circle_5_title" },
            { type: "text", key: "text_5", formKey: "text.lumen_circle_5_text", label: "Line 5 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_5_text" },
            { type: "text", key: "title_6", formKey: "text.lumen_circle_6_title", label: "Line 6", placeholder: "", productMetafield: "kluck_ai.lumen_circle_6_title" },
            { type: "text", key: "text_6", formKey: "text.lumen_circle_6_text", label: "Line 6 text", placeholder: "", productMetafield: "kluck_ai.lumen_circle_6_text" }
        ]
    },
    "lumen-mood": {
        displayName: "Mood",
        useForm: true,
        fields: [
            { type: "text", key: "eyebrow", formKey: "text.lumen_mood_eyebrow", label: "Label", placeholder: "", productMetafield: "kluck_ai.lumen_mood_eyebrow" },
            { type: "text", key: "heading", formKey: "text.lumen_mood_heading", label: "Heading", placeholder: "", productMetafield: "kluck_ai.lumen_mood_heading" },
            { type: "text", key: "text", formKey: "text.lumen_mood_text", label: "Text", placeholder: "", productMetafield: "kluck_ai.lumen_mood_text" },
            { type: "text", key: "cta", formKey: "text.lumen_mood_cta", label: "Link text", placeholder: "", productMetafield: "kluck_ai.lumen_mood_cta" },
            { type: "image", key: "image", formKey: "images.body_images.product_impact_image", label: "Image", productMetafield: "kluck_ai.product_impact_image" }
        ]
    },
    "kluck-ai-faq-section": {
        displayName: "FAQ",
        useForm: true,
        fields: [
            { type: "text", key: "title", formKey: "text.faq_section_title", label: "Section heading", placeholder: "Frequently Asked Questions", productMetafield: "kluck_ai.faq_section_title" },
            { type: "text", key: "subtitle", formKey: "text.faq_section_subtitle", label: "Section subtitle", placeholder: "", productMetafield: "kluck_ai.faq_section_subtitle" },
            { type: "text", key: "question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "", productMetafield: "kluck_ai.faq_question_1" },
            { type: "text", key: "answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "", productMetafield: "kluck_ai.faq_answer_1" },
            { type: "text", key: "question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "", productMetafield: "kluck_ai.faq_question_2" },
            { type: "text", key: "answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "", productMetafield: "kluck_ai.faq_answer_2" },
            { type: "text", key: "question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "", productMetafield: "kluck_ai.faq_question_3" },
            { type: "text", key: "answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "", productMetafield: "kluck_ai.faq_answer_3" }
        ]
    }
};

/** PDP product-page templates only; home schemas live in `_app.generate_store/store/utils/editor-schema`. */
export const TEMPLATE_SCHEMAS = {
    ...PDP_TEMPLATE_SCHEMAS
};
