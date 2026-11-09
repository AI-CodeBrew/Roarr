/**
 * Lustre multi-product home: editor fields per section.
 * Keys match section ids after stripping `packs/lustre/home/`.
 */

const text = (key, label) => ({ type: "text", key, formKey: `text.${key}`, label, placeholder: "" });
const image = (key, label) => ({ type: "image", key, formKey: `images.${key}`, label });
const section = (name, fields) => ({ displayName: `Roarr - Lustre ${name}`, useForm: true, fields });

export const HOME_LUSTRE_TEMPLATE_SCHEMAS = {
    "pf-lustre-hero": section("Hero", [1, 2, 3].flatMap((n) => [
        text(`hero_kicker_${n}`, `Slide ${n} label`),
        text(`banner_heading_${n}`, `Slide ${n} heading`),
        text(`banner_text_${n}`, `Slide ${n} text`),
        image(`banner_image_${n}`, `Slide ${n} image`),
    ])),
    "pf-lustre-marquee": section("Marquee", [1, 2, 3, 4].map((n) => text(`marquee_text_${n}`, `Message ${n}`))),
    "pf-lustre-about": section("About", [
        text("about_kicker", "Label"),
        text("about_heading", "Heading"),
        text("about_text", "Text"),
        image("about_image_1", "Large image"),
        image("about_image_2", "Small image"),
    ]),
    "pf-lustre-categories": section("Categories", [
        text("categories_heading", "Heading"),
        text("categories_text", "Text"),
        ...[1, 2, 3].flatMap((n) => [
            text(`top_product_punchline_${n}`, `Collection ${n} name`),
            image(`product_impact_image_${n}`, `Collection ${n} image`),
        ]),
    ]),
    "pf-lustre-banners": section("Banners", [1, 2, 3].flatMap((n) => [
        text(`card_title_${n}`, `Card ${n} title`),
        image(`feature_image_${n}`, `Card ${n} image`),
    ])),
    "pf-lustre-trending": section("Trending", [text("trending_heading", "Heading"), text("trending_text", "Text")]),
    "pf-lustre-split": section("Split", [
        text("split_heading", "Heading"),
        text("split_text", "Text"),
        image("split_image", "Image"),
    ]),
    "pf-lustre-services": section("Services", [1, 2, 3, 4].flatMap((n) => [
        text(`service_${n}_title`, `Service ${n} title`),
        text(`service_${n}_text`, `Service ${n} text`),
    ])),
    "pf-lustre-promos": section("Promos", [1, 2].flatMap((n) => [
        text(`promo_kicker_${n}`, `Promo ${n} label`),
        text(`promo_heading_${n}`, `Promo ${n} heading`),
        image(`promo_image_${n}`, `Promo ${n} image`),
    ])),
    "pf-lustre-featured": section("Featured", [text("featured_heading", "Heading"), text("featured_text", "Text")]),
    "pf-lustre-testimonials": section("Testimonials", [
        text("testimonials_heading", "Heading"),
        text("testimonials_text", "Text"),
        ...[1, 2].flatMap((n) => [
            text(`customer_name_${n}`, `Review ${n} name`),
            text(`customer_role_${n}`, `Review ${n} role`),
            text(`customer_review_${n}`, `Review ${n} text`),
            image(`customer_avatar_${n}`, `Review ${n} photo`),
        ]),
    ]),
    "pf-lustre-blog": section("Blog", [text("blog_heading", "Heading"), text("blog_text", "Text")]),
    "pf-lustre-footer": section("Footer", [
        text("store_address", "Store address"),
        text("store_email", "Store email"),
        text("store_phone", "Store phone"),
        text("footer_newsletter_text", "Newsletter text"),
        text("social_facebook", "Facebook link"),
        text("social_instagram", "Instagram link"),
        text("social_youtube", "YouTube link"),
        text("social_x", "X link"),
        text("social_pinterest", "Pinterest link"),
    ]),
};
