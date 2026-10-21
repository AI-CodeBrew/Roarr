/**
 * Amour single-product home preview: sections in render order.
 * Maps homeData.text / homeData.images onto section settings.
 */

function pickText(text, key) {
    const value = text?.[key];
    if (value == null) return undefined;
    const s = String(value).trim();
    return s.length > 0 ? s : undefined;
}

function pickImage(images, key) {
    const value = images?.[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    return undefined;
}

function mapKeys(homeData, sectionSettingsOnly, textKeys = [], imageKeys = []) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const mapped = { ...sectionSettingsOnly };
    for (const key of textKeys) {
        const v = pickText(text, key);
        if (v) mapped[key] = v;
    }
    for (const key of imageKeys) {
        const v = pickImage(images, key);
        if (v) mapped[key] = v;
    }
    return { sectionSettingsOnly: mapped, blocksData: [] };
}

/** Selected product (Admin API shape) → card title + USD price, same as the preview `money` filter. */
function previewProductFields(product) {
    if (!product || typeof product !== "object") return {};
    const out = {};
    if (typeof product.title === "string" && product.title.trim()) out.fallback_title = product.title.trim();
    const raw =
        product.variants?.edges?.[0]?.node?.price ??
        product.priceRangeV2?.minVariantPrice?.amount ??
        product.priceRange?.minVariantPrice?.amount ??
        product.price;
    const amount = Number(typeof raw === "object" && raw ? raw.amount : raw);
    if (Number.isFinite(amount) && amount > 0) {
        out.fallback_price = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    }
    return out;
}

/** @param {string[]} textKeys @param {string[]} imageKeys */
const mapper = (textKeys, imageKeys) => (homeData, sectionSettingsOnly) => {
    const mapped = mapKeys(homeData, sectionSettingsOnly, textKeys, imageKeys);
    if ("fallback_title" in sectionSettingsOnly) {
        Object.assign(mapped.sectionSettingsOnly, previewProductFields(homeData?._previewFirstProduct));
        // Theme demos carry their own product name (the demo product's title is the banner heading).
        const demoTitle = pickText(homeData?.text, "demo_product_title");
        if (demoTitle) mapped.sectionSettingsOnly.fallback_title = demoTitle;
    }
    return mapped;
};

export const AMOUR_SINGLE_PRODUCT_HOME_SECTIONS = [
    {
        key: "pf-amour-hero",
        name: "Kluck AI - Amour Hero",
        applyHomeData: mapper(["hero_eyebrow", "hero_heading", "hero_cta", "hero_marquee_1", "hero_marquee_2", "hero_marquee_3"], ["banner_image"]),
    },
    {
        key: "pf-amour-showcase",
        name: "Kluck AI - Amour Showcase",
        applyHomeData: mapper(["showcase_heading", "showcase_link", "showcase_caption_1", "showcase_caption_2", "showcase_caption_3"], ["product_image_1", "product_image_2", "product_image_3"]),
    },
    {
        key: "pf-amour-countdown",
        name: "Kluck AI - Amour Offer",
        applyHomeData: mapper(["countdown_heading", "countdown_subheading", "countdown_cta"], []),
    },
    {
        key: "pf-amour-lookbook",
        name: "Kluck AI - Amour Lookbook",
        applyHomeData: mapper(["look_1_eyebrow", "look_1_title", "look_1_caption", "look_2_eyebrow", "look_2_title", "look_2_caption", "look_3_eyebrow", "look_3_title", "look_3_caption"], ["look_image_1", "look_image_2", "look_image_3"]),
    },
    {
        key: "pf-amour-ribbons",
        name: "Kluck AI - Amour Ribbons",
        applyHomeData: mapper(["ribbon_1", "ribbon_2", "ribbon_3", "ribbon_4"], []),
    },
    {
        key: "pf-amour-split",
        name: "Kluck AI - Amour Split",
        applyHomeData: mapper(["split_heading", "split_card_1_label", "split_card_2_label"], ["split_image", "product_image_2", "product_image_3"]),
    },
    {
        key: "pf-amour-editorial",
        name: "Kluck AI - Amour Edit",
        applyHomeData: mapper(["editorial_1_heading", "editorial_1_body", "editorial_1_cta", "editorial_2_heading", "editorial_2_body", "editorial_2_cta"], ["editorial_image_1", "editorial_image_2"]),
    },
    {
        key: "pf-amour-banner",
        name: "Kluck AI - Amour Banner",
        applyHomeData: mapper(["banner_heading", "banner_cta", "banner_marquee_1", "banner_marquee_2"], ["banner_image_2"]),
    },
    {
        key: "pf-amour-story",
        name: "Kluck AI - Amour Story",
        applyHomeData: mapper(["story_accent", "story_heading", "story_body", "story_cta", "story_caption_title", "story_caption_line"], ["story_image", "product_image_1"]),
    },
    {
        key: "pf-amour-reviews",
        name: "Kluck AI - Amour Reviews",
        applyHomeData: mapper(["reviews_eyebrow", "reviews_heading", "customer_name_1", "customer_review_1", "customer_name_2", "customer_review_2", "customer_name_3", "customer_review_3", "customer_name_4", "customer_review_4"], ["product_image_2", "split_image", "editorial_image_1", "look_image_2"]),
    },
    {
        key: "pf-amour-tabs",
        name: "Kluck AI - Amour Tabs",
        applyHomeData: mapper(["tabs_heading", "tab_1_title", "tab_1_text", "tab_2_title", "tab_2_text", "tab_3_title", "tab_3_text"], ["look_image_3", "product_image_1", "look_image_1"]),
    },
    {
        key: "pf-amour-promise",
        name: "Kluck AI - Amour Promise",
        applyHomeData: mapper(["promise_heading", "promise_1_label", "promise_1_text", "promise_2_label", "promise_2_text", "promise_3_label", "promise_3_text", "promise_4_label", "promise_4_text", "promise_5_label", "promise_5_text"], []),
    },
    {
        key: "pf-amour-gallery",
        name: "Kluck AI - Amour Gallery",
        applyHomeData: mapper(["gallery_heading", "gallery_1_label", "gallery_2_label", "gallery_3_label", "gallery_4_label", "gallery_5_label", "gallery_6_label"], ["product_image_1", "look_image_1", "product_image_2", "look_image_2", "product_image_3", "look_image_3"]),
    },
];
