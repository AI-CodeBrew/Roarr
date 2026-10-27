/**
 * Lumenook multi-product home: editor fields per section.
 * Keys match section ids after stripping `packs/lumenook/home/`. Same content keys as the classic multi home.
 */

export const HOME_LUMENOOK_TEMPLATE_SCHEMAS = {
    "pf-lumen-marquee": {
        displayName: "Roarr - Lumenook Announcement",
        useForm: true,
        fields: [
            { type: "text", key: "marquee_text_1", formKey: "text.marquee_text_1", label: "Message 1", placeholder: "" },
            { type: "text", key: "marquee_text_2", formKey: "text.marquee_text_2", label: "Message 2", placeholder: "" },
            { type: "text", key: "marquee_text_3", formKey: "text.marquee_text_3", label: "Message 3", placeholder: "" },
        ],
    },
    "pf-lumen-hero": {
        displayName: "Roarr - Lumenook Hero",
        useForm: true,
        fields: [
            { type: "text", key: "banner_heading_1", formKey: "text.banner_heading_1", label: "Heading", placeholder: "" },
            { type: "text", key: "banner_eyebrow_1", formKey: "text.banner_eyebrow_1", label: "Text", placeholder: "" },
            { type: "image", key: "banner_image_1", formKey: "images.banner_image_1", label: "Background image" },
        ],
    },
    "pf-lumen-collections": {
        displayName: "Roarr - Lumenook Collections",
        useForm: true,
        fields: [
            { type: "text", key: "top_product_punchline_1", formKey: "text.top_product_punchline_1", label: "Collection 1 title", placeholder: "" },
            { type: "text", key: "top_product_punchline_1_description", formKey: "text.top_product_punchline_1_description", label: "Collection 1 text", placeholder: "" },
            { type: "image", key: "product_impact_image_1", formKey: "images.product_impact_image_1", label: "Collection 1 image" },
            { type: "text", key: "top_product_punchline_2", formKey: "text.top_product_punchline_2", label: "Collection 2 title", placeholder: "" },
            { type: "text", key: "top_product_punchline_2_description", formKey: "text.top_product_punchline_2_description", label: "Collection 2 text", placeholder: "" },
            { type: "image", key: "product_impact_image_2", formKey: "images.product_impact_image_2", label: "Collection 2 image" },
            { type: "text", key: "top_product_punchline_3", formKey: "text.top_product_punchline_3", label: "Collection 3 title", placeholder: "" },
            { type: "text", key: "top_product_punchline_3_description", formKey: "text.top_product_punchline_3_description", label: "Collection 3 text", placeholder: "" },
            { type: "image", key: "product_impact_image_3", formKey: "images.product_impact_image_3", label: "Collection 3 image" },
        ],
    },
    "pf-lumen-products": {
        displayName: "Roarr - Lumenook Product Grid",
        useForm: true,
        fields: [
            { type: "text", key: "featured_product_subheadline_1", formKey: "text.featured_product_subheadline_1", label: "Product 1 tagline", placeholder: "" },
            { type: "text", key: "featured_product_subheadline_2", formKey: "text.featured_product_subheadline_2", label: "Product 2 tagline", placeholder: "" },
            { type: "text", key: "featured_product_subheadline_3", formKey: "text.featured_product_subheadline_3", label: "Product 3 tagline", placeholder: "" },
        ],
    },
    "pf-lumen-split": {
        displayName: "Roarr - Lumenook Feature Split",
        useForm: true,
        fields: [
            { type: "text", key: "highlight_banner_section_subheading", formKey: "text.highlight_banner_section_subheading", label: "Label", placeholder: "" },
            { type: "text", key: "highlight_banner_section_heading", formKey: "text.highlight_banner_section_heading", label: "Heading", placeholder: "" },
            { type: "text", key: "highlight_banner_section_description", formKey: "text.highlight_banner_section_description", label: "Text", placeholder: "" },
            { type: "image", key: "highlight_image", formKey: "images.highlight_image", label: "Image" },
        ],
    },
    "pf-lumen-promise": {
        displayName: "Roarr - Lumenook Promise",
        useForm: true,
        fields: [
            { type: "text", key: "star_product_feature_1", formKey: "text.star_product_feature_1", label: "Promise 1", placeholder: "" },
            { type: "text", key: "star_product_feature_1_desc", formKey: "text.star_product_feature_1_desc", label: "Promise 1 text", placeholder: "" },
            { type: "text", key: "star_product_feature_2", formKey: "text.star_product_feature_2", label: "Promise 2", placeholder: "" },
            { type: "text", key: "star_product_feature_2_desc", formKey: "text.star_product_feature_2_desc", label: "Promise 2 text", placeholder: "" },
            { type: "text", key: "star_product_feature_3", formKey: "text.star_product_feature_3", label: "Promise 3", placeholder: "" },
            { type: "text", key: "star_product_feature_3_desc", formKey: "text.star_product_feature_3_desc", label: "Promise 3 text", placeholder: "" },
            { type: "text", key: "star_product_feature_4", formKey: "text.star_product_feature_4", label: "Promise 4", placeholder: "" },
            { type: "text", key: "star_product_feature_4_desc", formKey: "text.star_product_feature_4_desc", label: "Promise 4 text", placeholder: "" },
        ],
    },
    "pf-lumen-quote": {
        displayName: "Roarr - Lumenook Quote",
        useForm: true,
        fields: [
            { type: "text", key: "punchy_poetic_headline", formKey: "text.punchy_poetic_headline", label: "Quote", placeholder: "" },
        ],
    },
    "pf-lumen-faq": {
        displayName: "Roarr - Lumenook FAQ",
        useForm: true,
        fields: [
            { type: "text", key: "faq_question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "" },
            { type: "text", key: "faq_answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "" },
            { type: "text", key: "faq_question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "" },
            { type: "text", key: "faq_answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "" },
            { type: "text", key: "faq_question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "" },
            { type: "text", key: "faq_answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "" },
        ],
    },
};
