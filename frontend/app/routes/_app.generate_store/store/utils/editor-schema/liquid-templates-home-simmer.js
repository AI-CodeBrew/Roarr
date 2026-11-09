/**
 * Simmer multi-product home: editor fields per section.
 * Keys match section ids after stripping `packs/simmer/home/`.
 */

const text = (key, label) => ({ type: "text", key, formKey: `text.${key}`, label, placeholder: "" });
const image = (key, label) => ({ type: "image", key, formKey: `images.${key}`, label });
const section = (name, fields) => ({ displayName: `Roarr - Simmer ${name}`, useForm: true, fields });

export const HOME_SIMMER_TEMPLATE_SCHEMAS = {
    "pf-simmer-header": section("Header", [1, 2, 3].map((n) => text(`ticker_text_${n}`, `Ticker line ${n}`))),
    "pf-simmer-slideshow": section("Slideshow", [
        ...[1, 2, 3].flatMap((n) => [
            text(`hero_kicker_${n}`, `Slide ${n} label`),
            text(`banner_heading_${n}`, `Slide ${n} heading`),
            text(`banner_text_${n}`, `Slide ${n} text`),
            image(`banner_image_${n}`, `Slide ${n} image`),
        ]),
        text("hero_side_heading", "Side picture title"),
        image("hero_side_image", "Side picture"),
    ]),
    "pf-simmer-countdown": section("Countdown", [
        text("deal_kicker", "Label"),
        text("deal_heading", "Heading"),
        text("deal_text", "Text"),
    ]),
    "pf-simmer-picks": section("Category Picks", [
        text("picks_kicker", "Label"),
        text("picks_heading", "Heading"),
        ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
            text(`picks_title_${n}`, `Row ${n} title`),
            text(`picks_text_${n}`, `Row ${n} text`),
            ...(n <= 3 ? [image(`picks_left_${n}`, `Row ${n} left picture`), image(`picks_right_${n}`, `Row ${n} right picture`)] : []),
        ]),
    ]),
    "pf-simmer-arrivals": section("New Arrivals", [text("arrivals_kicker", "Label"), text("arrivals_heading", "Heading")]),
    "pf-simmer-brands": section("Brands", [text("brands_kicker", "Label"), text("brands_quote", "Statement")]),
    "pf-simmer-gallery": section("Gallery", [
        text("gallery_kicker", "Label"),
        text("gallery_heading", "Heading"),
        text("gallery_text", "Text"),
        ...[1, 2, 3, 4, 5, 6].map((n) => image(`gallery_image_${n}`, `Picture ${n}`)),
    ]),
    "pf-simmer-testimonials": section("Testimonials", [
        text("testimonials_kicker", "Label"),
        text("testimonials_heading", "Heading"),
        ...[1, 2, 3, 4].flatMap((n) => [
            text(`customer_name_${n}`, `Review ${n} name`),
            text(`customer_role_${n}`, `Review ${n} place`),
            text(`customer_review_${n}`, `Review ${n} text`),
            image(`customer_avatar_${n}`, `Review ${n} photo`),
        ]),
    ]),
    "pf-simmer-lookbook": section("Lookbook", [
        text("lookbook_kicker", "Label"),
        text("lookbook_heading", "Heading"),
        text("lookbook_text", "Text"),
        image("lookbook_image_1", "Wide picture"),
        image("lookbook_image_2", "Narrow picture, top"),
        image("lookbook_image_3", "Narrow picture, bottom"),
        text("video_heading", "Video heading"),
        image("lookbook_image_4", "Video cover picture"),
    ]),
    "pf-simmer-faq": section("FAQ", [
        text("faq_kicker", "Label"),
        text("faq_heading", "Heading"),
        image("faq_image", "Picture"),
        ...[1, 2, 3, 4, 5, 6].flatMap((n) => [text(`faq_q_${n}`, `Question ${n}`), text(`faq_a_${n}`, `Answer ${n}`)]),
    ]),
    "pf-simmer-policy": section("Policies", [1, 2, 3, 4].flatMap((n) => [
        text(`policy_${n}_title`, `Policy ${n} title`),
        text(`policy_${n}_text`, `Policy ${n} text`),
        text(`policy_${n}_link`, `Policy ${n} link label`),
    ])),
    "pf-simmer-footer": section("Footer", [
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
