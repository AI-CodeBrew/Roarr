/**
 * Maison single-product home: editor fields per section.
 * Keys match section ids after stripping `packs/maison/home/`.
 */

export const HOME_MAISON_TEMPLATE_SCHEMAS = {
    "pf-maison-announce": {
        displayName: "Roarr - Maison Announcement",
        useForm: true,
        fields: [
            { type: "text", key: "announce_1", formKey: "text.announce_1", label: "Message 1 (left)", placeholder: "" },
            { type: "text", key: "announce_2", formKey: "text.announce_2", label: "Message 2 (centre)", placeholder: "" },
            { type: "text", key: "announce_3", formKey: "text.announce_3", label: "Message 3 (right)", placeholder: "" },
        ],
    },
    "pf-maison-hero": {
        displayName: "Roarr - Maison Hero",
        useForm: true,
        fields: [
            { type: "text", key: "hero_eyebrow", formKey: "text.hero_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "hero_heading", formKey: "text.hero_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "hero_subheading", formKey: "text.hero_subheading", label: "Text", placeholder: "" },
            { type: "text", key: "hero_cta", formKey: "text.hero_cta", label: "Button label", placeholder: "" },
            { type: "image", key: "maison_hero_image", formKey: "images.maison_hero_image", label: "Campaign image (16:9)" },
        ],
    },
    "pf-maison-intro": {
        displayName: "Roarr - Maison Statement",
        useForm: true,
        fields: [
            { type: "text", key: "intro_eyebrow", formKey: "text.intro_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "intro_heading", formKey: "text.intro_heading", label: "Statement (an image sits mid-sentence)", placeholder: "" },
            { type: "text", key: "intro_body", formKey: "text.intro_body", label: "Text", placeholder: "" },
            { type: "image", key: "maison_inline_image", formKey: "images.maison_inline_image", label: "Inline image (1:1)" },
        ],
    },
    "pf-maison-piece": {
        displayName: "Roarr - Maison The Piece",
        useForm: true,
        fields: [
            { type: "text", key: "piece_eyebrow", formKey: "text.piece_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "piece_heading", formKey: "text.piece_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "piece_body", formKey: "text.piece_body", label: "Text", placeholder: "" },
            { type: "text", key: "piece_point_1_title", formKey: "text.piece_point_1_title", label: "Detail 1 title", placeholder: "" },
            { type: "text", key: "piece_point_1_text", formKey: "text.piece_point_1_text", label: "Detail 1 text", placeholder: "" },
            { type: "text", key: "piece_point_2_title", formKey: "text.piece_point_2_title", label: "Detail 2 title", placeholder: "" },
            { type: "text", key: "piece_point_2_text", formKey: "text.piece_point_2_text", label: "Detail 2 text", placeholder: "" },
            { type: "text", key: "piece_point_3_title", formKey: "text.piece_point_3_title", label: "Detail 3 title", placeholder: "" },
            { type: "text", key: "piece_point_3_text", formKey: "text.piece_point_3_text", label: "Detail 3 text", placeholder: "" },
            { type: "text", key: "piece_cta", formKey: "text.piece_cta", label: "Link label", placeholder: "" },
            { type: "image", key: "maison_piece_image", formKey: "images.maison_piece_image", label: "Product image (4:5)" },
        ],
    },
    "pf-maison-gallery": {
        displayName: "Roarr - Maison Gallery",
        useForm: true,
        fields: [
            { type: "text", key: "gallery_eyebrow", formKey: "text.gallery_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "gallery_heading", formKey: "text.gallery_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "gallery_title_1", formKey: "text.gallery_title_1", label: "Image 1 title", placeholder: "" },
            { type: "text", key: "gallery_text_1", formKey: "text.gallery_text_1", label: "Image 1 caption", placeholder: "" },
            { type: "text", key: "gallery_title_2", formKey: "text.gallery_title_2", label: "Image 2 title", placeholder: "" },
            { type: "text", key: "gallery_text_2", formKey: "text.gallery_text_2", label: "Image 2 caption", placeholder: "" },
            { type: "text", key: "gallery_title_3", formKey: "text.gallery_title_3", label: "Image 3 title", placeholder: "" },
            { type: "text", key: "gallery_text_3", formKey: "text.gallery_text_3", label: "Image 3 caption", placeholder: "" },
            { type: "image", key: "maison_gallery_1", formKey: "images.maison_gallery_1", label: "Image 1 (4:5)" },
            { type: "image", key: "maison_gallery_2", formKey: "images.maison_gallery_2", label: "Image 2 (4:5)" },
            { type: "image", key: "maison_gallery_3", formKey: "images.maison_gallery_3", label: "Image 3 (4:5)" },
        ],
    },
    "pf-maison-craft": {
        displayName: "Roarr - Maison Craft",
        useForm: true,
        fields: [
            { type: "text", key: "craft_eyebrow", formKey: "text.craft_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "craft_heading", formKey: "text.craft_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "craft_body", formKey: "text.craft_body", label: "Text", placeholder: "" },
            { type: "text", key: "craft_stat_1_value", formKey: "text.craft_stat_1_value", label: "Figure 1", placeholder: "" },
            { type: "text", key: "craft_stat_1_label", formKey: "text.craft_stat_1_label", label: "Figure 1 label", placeholder: "" },
            { type: "text", key: "craft_stat_2_value", formKey: "text.craft_stat_2_value", label: "Figure 2", placeholder: "" },
            { type: "text", key: "craft_stat_2_label", formKey: "text.craft_stat_2_label", label: "Figure 2 label", placeholder: "" },
            { type: "text", key: "craft_stat_3_value", formKey: "text.craft_stat_3_value", label: "Figure 3", placeholder: "" },
            { type: "text", key: "craft_stat_3_label", formKey: "text.craft_stat_3_label", label: "Figure 3 label", placeholder: "" },
            { type: "image", key: "maison_craft_image", formKey: "images.maison_craft_image", label: "Detail image (1:1)" },
        ],
    },
    "pf-maison-promise": {
        displayName: "Roarr - Maison Promises",
        useForm: true,
        fields: [
            { type: "text", key: "promise_heading", formKey: "text.promise_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "promise_1_label", formKey: "text.promise_1_label", label: "Promise 1 label", placeholder: "" },
            { type: "text", key: "promise_1_text", formKey: "text.promise_1_text", label: "Promise 1 text", placeholder: "" },
            { type: "text", key: "promise_2_label", formKey: "text.promise_2_label", label: "Promise 2 label", placeholder: "" },
            { type: "text", key: "promise_2_text", formKey: "text.promise_2_text", label: "Promise 2 text", placeholder: "" },
            { type: "text", key: "promise_3_label", formKey: "text.promise_3_label", label: "Promise 3 label", placeholder: "" },
            { type: "text", key: "promise_3_text", formKey: "text.promise_3_text", label: "Promise 3 text", placeholder: "" },
            { type: "text", key: "promise_4_label", formKey: "text.promise_4_label", label: "Promise 4 label", placeholder: "" },
            { type: "text", key: "promise_4_text", formKey: "text.promise_4_text", label: "Promise 4 text", placeholder: "" },
        ],
    },
    "pf-maison-faq": {
        displayName: "Roarr - Maison FAQ",
        useForm: true,
        fields: [
            { type: "text", key: "faq_heading", formKey: "text.faq_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "faq_question_1", formKey: "text.faq_question_1", label: "Question 1", placeholder: "" },
            { type: "text", key: "faq_answer_1", formKey: "text.faq_answer_1", label: "Answer 1", placeholder: "" },
            { type: "text", key: "faq_question_2", formKey: "text.faq_question_2", label: "Question 2", placeholder: "" },
            { type: "text", key: "faq_answer_2", formKey: "text.faq_answer_2", label: "Answer 2", placeholder: "" },
            { type: "text", key: "faq_question_3", formKey: "text.faq_question_3", label: "Question 3", placeholder: "" },
            { type: "text", key: "faq_answer_3", formKey: "text.faq_answer_3", label: "Answer 3", placeholder: "" },
        ],
    },
    "pf-maison-closing": {
        displayName: "Roarr - Maison Closing",
        useForm: true,
        fields: [
            { type: "text", key: "quote_text", formKey: "text.quote_text", label: "Quote", placeholder: "" },
            { type: "text", key: "quote_attribution", formKey: "text.quote_attribution", label: "Quote attribution", placeholder: "" },
            { type: "text", key: "closing_eyebrow", formKey: "text.closing_eyebrow", label: "Label", placeholder: "" },
            { type: "text", key: "closing_heading", formKey: "text.closing_heading", label: "Heading (last word is italic)", placeholder: "" },
            { type: "text", key: "closing_text", formKey: "text.closing_text", label: "Text", placeholder: "" },
            { type: "text", key: "closing_cta", formKey: "text.closing_cta", label: "Button label", placeholder: "" },
            { type: "image", key: "maison_banner_image", formKey: "images.maison_banner_image", label: "Background image (16:9)" },
        ],
    },
};
