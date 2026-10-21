/**
 * Multi-product home preview: sections in render order, with optional homeData mapping.
 * Base defaults live in {@link MULTI_PRODUCT_HOME_SETTINGS} in `./multi-product.js`.
 * Mirrors the single-product pattern in `./single-product-sections.js`.
 */

import { defaultApplyHomeData, testimonialsApplyHomeData, productGridApplyHomeData } from "./single-product-sections.js";

const marqueeScrollingBannerApplyHomeData = (homeData, sectionSettingsOnly, blocksData) => {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const fallback = images.product_impact_image;
    const i1 = images.product_image_1 || fallback;
    const i2 = images.product_image_2 || fallback;
    const i3 = images.product_image_3 || fallback;
    const marquee_images = [i1, i2, i3].filter((x) => typeof x === "string" && x.length > 0);
    const replacements = [text.marquee_text_1, text.marquee_text_2, text.marquee_text_3].filter(
        (x) => typeof x === "string" && x.length > 0
    );
    let textBlockIndex = 0;
    let imageBlockIndex = 0;
    const blocks = (blocksData || []).map((block) => {
        if (block.type === "text") {
            const replacement = replacements[textBlockIndex];
            textBlockIndex++;
            if (!replacement) return block;
            return {
                ...block,
                settings: { ...block.settings, text: replacement }
            };
        }
        if (block.type === "image") {
            if (marquee_images.length === 0) return block;
            const url = marquee_images[imageBlockIndex % marquee_images.length];
            imageBlockIndex++;
            if (!url) return block;
            return {
                ...block,
                settings: { ...block.settings, image: url }
            };
        }
        return block;
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}
const MULTI_INLINE_HEADLINE_IMAGE_KEYS = [
    "product_image_1",
    "product_image_2",
    "product_image_3",
    "highlight_image"
];

function buildMultiInlineHeadlineBlocksFromHome(homeData, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const headline = text.punchy_poetic_headline;
    if (!headline || typeof headline !== "string") {
        return blocksData || [];
    }

    const imageUrls = MULTI_INLINE_HEADLINE_IMAGE_KEYS.map((k) => images[k]).filter(
        (u) => typeof u === "string" && u.length > 0
    );
    const words = headline.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
        return blocksData || [];
    }

    if (imageUrls.length === 0) {
        return blocksData || [];
    }

    const blocks = [];
    let imageIndex = 0;

    const pushTextSegment = (raw) => {
        if (raw.trim().length > 0) {
            blocks.push({
                type: "text_segment",
                settings: {
                    text: raw,
                    italic: false,
                    font_family: "heading",
                    text_scale: 100
                }
            });
        }
    };

    const pushImagePill = () => {
        const imgUrl = imageUrls[imageIndex % imageUrls.length];
        imageIndex++;
        if (imgUrl) {
            blocks.push({
                type: "image_pill",
                settings: { image: imgUrl, link: "" }
            });
        }
    };

    // Image after first 5 words, then after next 2 words (7 total), then at the end.
    pushTextSegment(words.slice(0, 5).join(" "));
    pushImagePill();
    pushTextSegment(words.slice(5, 7).join(" "));
    pushImagePill();
    pushTextSegment(words.slice(7).join(" "));
    pushImagePill();

    return blocks.length > 0 ? blocks : blocksData || [];
}

function multiInlineHeadlineApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: buildMultiInlineHeadlineBlocksFromHome(homeData, blocksData)
    };
}

function heroApplyHomeDataMulti(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "slide") return block;
        const n = i + 1;
        const selectedHandle = text[`selected_product_${n}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(images[`banner_image_${n}`] && { image: images[`banner_image_${n}`] }),
                ...(text[`banner_heading_${n}`] && { heading: text[`banner_heading_${n}`] }),
                ...(text[`banner_eyebrow_${n}`] && { eyebrow: text[`banner_eyebrow_${n}`] }),
                ...(typeof selectedHandle === "string" &&
                    selectedHandle.length > 0 && { product: selectedHandle })
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

function collectionShowcaseApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "collection_card") return block;
        const n = i + 1;
        const title = text[`top_product_punchline_${n}`];
        const body = text[`top_product_punchline_${n}_description`];
        const image = images[`product_impact_image_${n}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(title && { title }),
                ...(body && { text: body }),
                ...(image && { image })
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

/** pf-feature-product-section — blocks use product_card; copy/images from featured_product_* + feature_image_n */
function featureProductSectionApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "product_card") return block;
        const n = i + 1;

        return {
            ...block,
            settings: {
                ...block.settings,
                ...(images[`feature_image_${n}`] && { image: images[`feature_image_${n}`] }),
                ...(text[`featured_product_headline_${n}`] && {
                    heading: text[`featured_product_headline_${n}`]
                }),
                ...(text[`featured_product_subheadline_${n}`] && {
                    text: text[`featured_product_subheadline_${n}`]
                }),
                product: {
                    title: text[`featured_product_headline_${n}`],
                    featured_image: images[`feature_image_${n}`]
                }
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

function featureBannerApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "card") return block;
        const n = i + 1;
        const title = text[`top_product_punchline_${n}`];
        const desc = text[`top_product_punchline_${n}_description`];
        const image = images[`feature_image_${n}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(title && { title }),
                ...(desc && { text: desc }),
                ...(image && { image })
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

function infiniteMarqueeApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const t1 = text.marquee_text_1;
    const t2 = text.marquee_text_2;
    const t3 = text.marquee_text_3;

    const images = homeData?.images ?? {};
    const i1 = images.product_image_1;
    const i2 = images.product_image_2;
    const i3 = images.product_image_3;
    const marquee_images = [i1, i2, i3].filter((x) => typeof x === "string" && x.length > 0);
    const texts = [t1, t2, t3].filter((x) => typeof x === "string" && x.length > 0);
    if (texts.length === 0) {
        return {
            sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
            blocksData: blocksData || []
        };
    }

    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "item") return block;
        const replacement = texts[i % texts.length];
        const image = marquee_images[i % marquee_images.length];
        return {
            ...block,
            settings: { ...block.settings, text: replacement, image: image }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

function splitFeatureApplyHomeDataMulti(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    return {
        sectionSettingsOnly: {
            ...sectionSettingsOnly,
            homeData,
            ...(images.highlight_image && { image: images.highlight_image }),
            ...(text.highlight_banner_section_heading && {
                heading: text.highlight_banner_section_heading
            }),
            ...(text.highlight_banner_section_subheading && {
                eyebrow: text.highlight_banner_section_subheading
            }),
            ...(text.highlight_banner_section_description && {
                text: text.highlight_banner_section_description
            })
        },
        blocksData: blocksData || []
    };
}

/** Min variant / price range → cents (same rules as `storeTemplatesConfiq` grid preview). */
function dashboardProductPriceToCents(p) {
    if (!p || typeof p !== "object") return 2999;
    const v0 = p.variants?.edges?.[0]?.node;
    if (v0?.price) {
        const n = parseFloat(String(v0.price).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(n)) return Math.round(n * 100);
    }
    const min = p.priceRangeV2?.minVariantPrice?.amount;
    if (min != null) {
        const n = parseFloat(String(min));
        if (!Number.isNaN(n)) return Math.round(n * 100);
    }
    return 2999;
}

/** First Shopify dashboard product for `pf-selected-prod-3in1` preview (same list as product grid). */
function previewProductRefFromDashboard(homeData) {
    const p = homeData?._previewFirstProduct;
    if (!p || typeof p !== "object") return null;
    const imgUrl =
        p.featuredImage?.url ||
        p.images?.edges?.[0]?.node?.url ||
        "";
    const title = typeof p.title === "string" ? p.title.trim() : "";
    if (!title && !imgUrl) return null;
    const handle =
        p.handle ||
        String(title || "product")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") ||
        "preview";
    const vendorRaw = p.vendor;
    const vendor =
        typeof vendorRaw === "string" ? vendorRaw.trim() : vendorRaw != null ? String(vendorRaw).trim() : "";
    return {
        title: title || "Product",
        featured_image: imgUrl,
        vendor,
        price: dashboardProductPriceToCents(p),
        url: `/products/${handle}`
    };
}

function trustBadgesApplyHomeDataMulti(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const labels = [
        text.star_product_feature_1,
        text.star_product_feature_2,
        text.star_product_feature_3,
        text.star_product_feature_4
    ];
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "badge") return block;
        const label = labels[i];
        if (!label) return block;
        return {
            ...block,
            settings: { ...block.settings, text: label }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

function selectedProd3in1ApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const previewProductRef = previewProductRefFromDashboard(homeData);
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "feature") return block;
        const n = i + 1;
        const heading = text[`star_product_feature_${n}`];
        const desc = text[`star_product_feature_${n}_desc`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(heading && { heading }),
                ...(desc && { text: desc })
            }
        };
    });
    return {
        sectionSettingsOnly: {
            ...sectionSettingsOnly,
            ...(previewProductRef && { product_ref: previewProductRef }),
            homeData,
            ...(images.star_image && { image_media: images.star_image }),
            ...(text.top_product_punchline_1 && { subtitle: text.top_product_punchline_1 }),
            ...(text.top_product_punchline_1_description && { title: text.top_product_punchline_1_description })
        },
        blocksData: blocks
    };
}

function faqSplitApplyHomeDataMulti(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "faq_item") return block;
        const q = text[`faq_question_${i + 1}`];
        const a = text[`faq_answer_${i + 1}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(q && { title: q }),
                ...(a && { content: a })
            }
        };
    });
    const desc = text.highlight_banner_section_description;
    return {
        sectionSettingsOnly: {
            ...sectionSettingsOnly,
            homeData,
            ...(images.product_base_image_2 && { image: images.product_base_image_2 }),
            ...(text.highlight_banner_section_heading && { heading: text.highlight_banner_section_heading }),
            ...(desc && {
                text: String(desc).includes("<") ? desc : `<p>${desc}</p>`
            })
        },
        blocksData: blocks
    };
}

/** Order matches {@link MULTI_PRODUCT_HOME_SETTINGS} in `./multi-product.js`. */
export const MULTI_PRODUCT_HOME_SECTIONS = [
    { key: "pf-k-hero-peek-slider", name: "Kluck AI - Hero Banner", applyHomeData: heroApplyHomeDataMulti },
    { key: "pf-inline-headline", name: "Kluck AI - Headline", applyHomeData: multiInlineHeadlineApplyHomeData },
    { key: "pf-collection-showcase", name: "Kluck AI - Collections", applyHomeData: collectionShowcaseApplyHomeData },
    { key: "pf-feature-product-section", name: "Kluck AI - Featured Products", applyHomeData: featureProductSectionApplyHomeData },
    { key: "pf-testimonials01", name: "Kluck AI - Testimonials", applyHomeData: testimonialsApplyHomeData },
    { key: "infinite-marquee", name: "Kluck AI - Infinite Marquee", applyHomeData: infiniteMarqueeApplyHomeData },
    { key: "pf-product-lookbook", name: "Kluck AI - Product Lookbook", applyHomeData: defaultApplyHomeData },
    { key: "pf-product-grid1x1", name: "Kluck AI - Products Grid", applyHomeData: productGridApplyHomeData },
    { key: "marquee-scrolling-banner", name: "Kluck AI - Marquee Banner", applyHomeData: marqueeScrollingBannerApplyHomeData },
    { key: "pf-split-feature", name: "Kluck AI - Image with Text - 3", applyHomeData: splitFeatureApplyHomeDataMulti },
    { key: "pf-trust-badges", name: "Kluck AI - Trust Badges", applyHomeData: trustBadgesApplyHomeDataMulti },
    { key: "pf-selected-prod-3in1", name: "Kluck AI - Product Column", applyHomeData: selectedProd3in1ApplyHomeData },
    { key: "collection-list", name: "Kluck AI - Collection List", applyHomeData: defaultApplyHomeData },
    { key: "pf-faq-splitimage", name: "Kluck AI - FAQ", applyHomeData: faqSplitApplyHomeDataMulti }
];
