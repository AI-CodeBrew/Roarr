/**
 * Hearth multi-product home: editor fields per section.
 * Keys match section ids after stripping `packs/hearth/home/`.
 */

const text = (key, label) => ({ type: "text", key, formKey: `text.${key}`, label, placeholder: "" });
const image = (key, label) => ({ type: "image", key, formKey: `images.${key}`, label });
const section = (name, fields) => ({ displayName: `Roarr - Hearth ${name}`, useForm: true, fields });

export const HOME_HEARTH_TEMPLATE_SCHEMAS = {
    "pf-hearth-ticker": section("Ticker", [1, 2, 3].map((n) => text(`ticker_text_${n}`, `Line ${n}`))),
    "pf-hearth-slideshow": section("Slideshow", [1, 2, 3].flatMap((n) => [
        text(`hero_kicker_${n}`, `Slide ${n} label`),
        text(`banner_heading_${n}`, `Slide ${n} heading`),
        text(`banner_text_${n}`, `Slide ${n} text`),
        image(`banner_image_${n}`, `Slide ${n} image`),
    ])),
    "pf-hearth-policy": section("Policies", [1, 2, 3, 4].flatMap((n) => [
        text(`policy_${n}_title`, `Policy ${n} title`),
        text(`policy_${n}_text`, `Policy ${n} text`),
    ])),
    "pf-hearth-gallery": section("Gallery", [1, 2, 3, 4].flatMap((n) => [
        text(`gallery_title_${n}`, `Tile ${n} title`),
        image(`gallery_image_${n}`, `Tile ${n} image`),
    ])),
    "pf-hearth-countdown": section("Countdown", [
        text("deal_kicker", "Label"),
        text("deal_heading", "Heading"),
        text("deal_text", "Text"),
    ]),
    "pf-hearth-showcase": section("Showcase", [
        text("showcase_kicker", "Label"),
        text("showcase_heading", "Heading"),
        ...[1, 2, 3, 4].flatMap((n) => [
            text(`showcase_title_${n}`, `Row ${n} title`),
            text(`showcase_text_${n}`, `Row ${n} text`),
            image(`showcase_image_${n}`, `Row ${n} image`),
        ]),
    ]),
    "pf-hearth-arrivals": section("New Arrivals", [text("arrivals_kicker", "Label"), text("arrivals_heading", "Heading")]),
    "pf-hearth-statement": section("Statement", [
        text("statement_kicker", "Label"),
        text("statement_heading", "Heading"),
        text("statement_text", "Text"),
        image("statement_image", "Image"),
    ]),
    "pf-hearth-lookbook": section("Lookbook", [
        text("lookbook_kicker", "Label"),
        text("lookbook_heading", "Heading"),
        image("lookbook_image", "Image"),
    ]),
    "pf-hearth-testimonials": section("Testimonials", [
        text("testimonials_kicker", "Label"),
        text("testimonials_heading", "Heading"),
        ...[1, 2, 3].flatMap((n) => [
            text(`customer_name_${n}`, `Review ${n} name`),
            text(`customer_role_${n}`, `Review ${n} role`),
            text(`customer_review_${n}`, `Review ${n} text`),
            image(`customer_avatar_${n}`, `Review ${n} photo`),
        ]),
    ]),
    "pf-hearth-story": section("Story", [
        text("story_kicker", "Label"),
        ...[1, 2, 3].flatMap((n) => [
            text(`story_heading_${n}`, `Slide ${n} heading`),
            text(`story_text_${n}`, `Slide ${n} text`),
            image(`story_image_${n}`, `Slide ${n} image`),
        ]),
    ]),
    "pf-hearth-journal": section("Journal", [text("blog_kicker", "Label"), text("blog_heading", "Heading")]),
    "pf-hearth-faq": section("FAQ", [
        text("faq_heading", "Heading"),
        ...[1, 2, 3, 4].flatMap((n) => [text(`faq_q_${n}`, `Question ${n}`), text(`faq_a_${n}`, `Answer ${n}`)]),
    ]),
    "pf-hearth-footer": section("Footer", [
        text("store_address", "Store address"),
        text("store_phone", "Store phone"),
        text("store_email", "Store email"),
        text("store_hours", "Opening hours"),
        text("footer_newsletter_heading", "Newsletter heading"),
        text("footer_newsletter_text", "Newsletter text"),
        text("footer_thanks_heading", "Thank you heading"),
        text("footer_thanks_text", "Thank you text"),
        text("popup_heading", "Popup heading"),
        text("popup_text", "Popup text"),
        image("popup_image", "Popup image"),
        text("social_facebook", "Facebook link"),
        text("social_instagram", "Instagram link"),
        text("social_x", "X link"),
        text("social_youtube", "YouTube link"),
        text("social_tiktok", "TikTok link"),
    ]),
};
