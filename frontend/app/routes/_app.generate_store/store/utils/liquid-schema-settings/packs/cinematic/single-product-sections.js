/**
 * Cinematic COD single-product home preview: sections in render order.
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
    // Do not embed full homeData on every section — it bloated the liquid-preview POST
    // (~11× duplicate text/image payloads). Settings already receive the mapped keys.
    const mapped = { ...sectionSettingsOnly };
    for (const key of textKeys) {
        const v = pickText(text, key);
        if (v) mapped[key] = v;
    }
    for (const key of imageKeys) {
        const v = pickImage(images, key);
        if (v) mapped[key] = v;
    }
    return {
        sectionSettingsOnly: mapped,
        blocksData: [],
    };
}

function announcementApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "announcement_1",
        "announcement_2",
        "announcement_3",
        "announcement_4",
        "announcement_5",
    ]);
}

function heroApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [], ["banner_image", "banner_image_mobile"]);
}

function trustApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "trust_1_title",
        "trust_1_line",
        "trust_2_title",
        "trust_2_line",
        "trust_3_title",
        "trust_3_line",
        "trust_4_title",
        "trust_4_line",
    ]);
}

function productStoryApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(
        homeData,
        sectionSettingsOnly,
        [
            "product_story_eyebrow",
            "product_story_heading",
            "product_story_body",
            "product_story_cta",
        ],
        ["product_story_image"]
    );
}

function inspirationApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "inspiration_line_1",
        "inspiration_line_1_accent",
        "inspiration_line_2",
    ]);
}

function featureTickerApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "feature_ticker_1",
        "feature_ticker_2",
        "feature_ticker_3",
        "feature_ticker_4",
        "feature_ticker_5",
        "feature_ticker_6",
    ]);
}

function whyShopApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(
        homeData,
        sectionSettingsOnly,
        [
            "why_shop_heading",
            "why_1_title",
            "why_1_text",
            "why_2_title",
            "why_2_text",
            "why_3_title",
            "why_3_text",
            "why_4_title",
            "why_4_text",
            "why_5_title",
            "why_5_text",
        ],
        ["why_shop_image"]
    );
}

function featureOrbitApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(
        homeData,
        sectionSettingsOnly,
        [
            "orbit_eyebrow",
            "orbit_heading",
            "orbit_1_title",
            "orbit_1_text",
            "orbit_2_title",
            "orbit_2_text",
            "orbit_3_title",
            "orbit_3_text",
            "orbit_4_title",
            "orbit_4_text",
            "orbit_5_title",
            "orbit_5_text",
            "orbit_6_title",
            "orbit_6_text",
        ],
        ["circle_feature_image"]
    );
}

function reviewsApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "customer_name_1",
        "customer_review_1",
        "customer_name_2",
        "customer_review_2",
        "customer_name_3",
        "customer_review_3",
        "review_heading",
        "review_eyebrow",
    ]);
}

function faqApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, [
        "faq_1_q",
        "faq_1_a",
        "faq_2_q",
        "faq_2_a",
        "faq_3_q",
        "faq_3_a",
        "faq_4_q",
        "faq_4_a",
        "faq_5_q",
        "faq_5_a",
        "faq_6_q",
        "faq_6_a",
    ]);
}

function stickyBarApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return mapKeys(homeData, sectionSettingsOnly, ["sticky_cta"]);
}

export const CINEMATIC_SINGLE_PRODUCT_HOME_SECTIONS = [
    {
        key: "pf-cinematic-announcement",
        name: "Kluck AI - Cinematic Announcement",
        applyHomeData: announcementApplyHomeData,
    },
    {
        key: "pf-cinematic-hero",
        name: "Kluck AI - Cinematic Hero",
        applyHomeData: heroApplyHomeData,
    },
    {
        key: "pf-cinematic-trust",
        name: "Kluck AI - Cinematic Trust",
        applyHomeData: trustApplyHomeData,
    },
    {
        key: "pf-cinematic-product-story",
        name: "Kluck AI - Cinematic Product Story",
        applyHomeData: productStoryApplyHomeData,
    },
    {
        key: "pf-cinematic-inspiration",
        name: "Kluck AI - Cinematic Inspiration",
        applyHomeData: inspirationApplyHomeData,
    },
    {
        key: "pf-cinematic-feature-ticker",
        name: "Kluck AI - Cinematic Feature Ticker",
        applyHomeData: featureTickerApplyHomeData,
    },
    {
        key: "pf-cinematic-why-shop",
        name: "Kluck AI - Cinematic Why Shop",
        applyHomeData: whyShopApplyHomeData,
    },
    {
        key: "pf-cinematic-feature-orbit",
        name: "Kluck AI - Cinematic Feature Orbit",
        applyHomeData: featureOrbitApplyHomeData,
    },
    {
        key: "pf-cinematic-reviews",
        name: "Kluck AI - Cinematic Reviews",
        applyHomeData: reviewsApplyHomeData,
    },
    {
        key: "pf-cinematic-faq",
        name: "Kluck AI - Cinematic FAQ",
        applyHomeData: faqApplyHomeData,
    },
    {
        key: "pf-cinematic-sticky-bar",
        name: "Kluck AI - Cinematic Sticky Bar",
        applyHomeData: stickyBarApplyHomeData,
    },
];
