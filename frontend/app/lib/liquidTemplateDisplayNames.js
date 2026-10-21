/**
 * Canonical human-readable labels for Liquid preview template paths (section list, store flow config).
 * Single source of truth for `LiquidPreviewSettingsPanel` and `storeTemplatesConfiq` (`displayName` on each row).
 * Aligns with `displayName` in `editor-schema/liquid-templates-home.js`.
 */

/**
 * Block ids like `home_pf_collection_showcase_1` become `home-pf-collection-showcase` before lookup;
 * preview rows use `home/pf-collection-showcase`.
 */
export function homeTemplateLookupKey(template) {
    if (!template || typeof template !== "string") return template;
    if (template.startsWith("home-") && !template.includes("/")) {
        return `home/${template.slice(5)}`;
    }
    return template;
}

/**
 * Map preview DOM / sidebar ids to a template path for label lookup.
 * - Iframe sections use id `section-${template}` (e.g. `section-home/pf-k-hero-peek-slider`) when no block id.
 * - Store home builder rows still use `section_${sectionKey}` (underscore slug) as the list key.
 */
export function liquidPreviewSectionIdToTemplatePath(sectionId) {
    if (!sectionId || typeof sectionId !== "string") return null;
    let s = sectionId.trim();
    if (!s) return null;

    if (s.startsWith("section-")) {
        return s.slice("section-".length);
    }

    if (s.startsWith("section_")) {
        let rest = s.slice("section_".length);
        rest = rest.replace(/_(\d+)$/, "");
        const slug = rest.replace(/_/g, "-");
        if (slug === "pf-new-default-product-hero") {
            return "product/pf-new-default-product-hero";
        }
        if (slug.startsWith("pf-cinematic-")) {
            return `packs/cinematic/home/${slug}`;
        }
        if (slug.startsWith("pf-amour-")) {
            return `packs/amour/home/${slug}`;
        }
        if (slug.includes("/")) {
            return slug;
        }
        return `home/${slug}`;
    }

    return null;
}

/** Full path or normalized key → sidebar label */
const LIQUID_TEMPLATE_DISPLAY_NAMES = {
    "before-after": "Before & After",
    "product-section": "Kluck AI Hero Section",
    "hero-section": "Kluck AI Hero Section",
    "bundle": "Kluck Bundler",
    "product/pf-new-default-product-hero": "Kluck AI Hero Section",
    "home/pf-new-defaultprod-FAQ": "FAQ",

    "home/pf-k-hero-peek-slider": "Kluck AI - Hero Banner",
    "home/marquee-scrolling-banner": "Kluck AI - Marquee Banner",
    "home/pf-custom-new-image-with-text": "Kluck AI - Image with Text - 1",
    "home/pf-new-features-center-image": "Kluck AI - Features Center",
    "home/pf-inline-headline": "Kluck AI - Headline",
    "home/pf-new-ingreds-features": "Kluck AI - Image with Text - 2",
    "home/pf-trust-badges": "Kluck AI - Trust Badges",
    "home/pf-testimonials01": "Kluck AI - Testimonials",
    "home/pf-split-feature": "Kluck AI - Image with Text - 3",
    "home/pf-faq-splitimage": "Kluck AI - FAQ",

    "home/pf-collection-showcase": "Kluck AI - Collections",
    "home/pf-feature-product-section": "Kluck AI - Featured Products",
    "home/pf-feature-banner": "Kluck AI - Feature Banner",
    "home/pf-product-lookbook": "Kluck AI - Product Lookbook",
    "home/pf-product-grid1x1": "Kluck AI - Products Grid",
    "home/infinite-marquee": "Kluck AI - Infinite Marquee",
    "home/pf-selected-prod-3in1": "Kluck AI - Product Column",
    "home/collection-list": "Kluck AI - Collection List",

    "packs/cinematic/home/pf-cinematic-announcement": "Kluck AI - Cinematic Announcement",
    "packs/cinematic/home/pf-cinematic-hero": "Kluck AI - Cinematic Hero",
    "packs/cinematic/home/pf-cinematic-trust": "Kluck AI - Cinematic Trust",
    "packs/cinematic/home/pf-cinematic-product-story": "Kluck AI - Cinematic Product Story",
    "packs/cinematic/home/pf-cinematic-inspiration": "Kluck AI - Cinematic Inspiration",
    "packs/cinematic/home/pf-cinematic-feature-ticker": "Kluck AI - Cinematic Feature Ticker",
    "packs/cinematic/home/pf-cinematic-why-shop": "Kluck AI - Cinematic Why Shop",
    "packs/cinematic/home/pf-cinematic-feature-orbit": "Kluck AI - Cinematic Feature Orbit",
    "packs/cinematic/home/pf-cinematic-reviews": "Kluck AI - Cinematic Reviews",
    "packs/cinematic/home/pf-cinematic-faq": "Kluck AI - Cinematic FAQ",
    "packs/cinematic/home/pf-cinematic-sticky-bar": "Kluck AI - Cinematic Sticky Bar",
    "packs/amour/home/pf-amour-hero": "Kluck AI - Amour Hero",
    "packs/amour/home/pf-amour-showcase": "Kluck AI - Amour Showcase",
    "packs/amour/home/pf-amour-countdown": "Kluck AI - Amour Offer",
    "packs/amour/home/pf-amour-lookbook": "Kluck AI - Amour Lookbook",
    "packs/amour/home/pf-amour-ribbons": "Kluck AI - Amour Ribbons",
    "packs/amour/home/pf-amour-split": "Kluck AI - Amour Split",
    "packs/amour/home/pf-amour-editorial": "Kluck AI - Amour Edit",
    "packs/amour/home/pf-amour-banner": "Kluck AI - Amour Banner",
    "packs/amour/home/pf-amour-story": "Kluck AI - Amour Story",
    "packs/amour/home/pf-amour-reviews": "Kluck AI - Amour Reviews",
    "packs/amour/home/pf-amour-tabs": "Kluck AI - Amour Tabs",
    "packs/amour/home/pf-amour-promise": "Kluck AI - Amour Promise",
    "packs/amour/home/pf-amour-gallery": "Kluck AI - Amour Gallery",

    "collection/pf-prem-collections": "Collections",
    "collection/collection-2": "Collection grid",
    "contact/pf-new-contact": "Contact",
    "faq/pf-new-FAQ-page": "FAQs",
    "404/pf-new-404": "404",
    "about-us/pf-aboutus-page-H1": "About Us",
    "about-us/pf-aboutus-page-H2": "About Us (continued)",

    "kluck-ai-product-hero-section-3": "Custom Product Hero",
    "kluck-ai-marquee-section-1": "Kluck AI - Marquee",
    "kluck-ai-product-feature-details-section": "Custom Details Grid",

    "kluck-ai-product-hero-section-2": "Modern Product Hero",
    "kluck-ai-trust-badge-2-section": "Trust Badges / Features",
    "kluck-ai-image-with-text-3-section-product": "Split Feature Banner",
    "kluck-ai-faq-section": "FAQ",

    "play-hero": "Hero",
    "play-marquee": "Ticker",
    "play-features": "Features",
    "play-promo": "Promo",
    "play-story": "Story",
    "play-designed": "Thoughtfully Designed",
    "play-badges": "Badges",
    "play-circles": "Round photos",
    "play-reviews": "Reviews",
    "play-instagram": "Instagram",
    "glow-hero": "Hero",
    "glow-special": "Why it's special",
    "glow-stats": "Results",
    "glow-ingredients": "Ingredients",
    "glow-steps": "How to use",
    "glow-faq": "FAQs",
};

/**
 * @param {string} template - e.g. `home/pf-k-hero-peek-slider`, `product/pf-new-default-product-hero`
 * @returns {string}
 */
export function getLiquidTemplateDisplayName(template) {
    if (!template || typeof template !== "string") return "";
    const lookupKey = homeTemplateLookupKey(template);
    if (LIQUID_TEMPLATE_DISPLAY_NAMES[lookupKey]) {
        return LIQUID_TEMPLATE_DISPLAY_NAMES[lookupKey];
    }
    if (LIQUID_TEMPLATE_DISPLAY_NAMES[template]) {
        return LIQUID_TEMPLATE_DISPLAY_NAMES[template];
    }
    return template
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
