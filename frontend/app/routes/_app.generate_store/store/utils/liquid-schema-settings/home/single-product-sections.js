/**
 * Single-product home preview: sections in render order, with optional homeData mapping.
 * Add or reorder entries here; base defaults still live in {@link SINGLE_PRODUCT_HOME_SETTINGS}.
 *
 * `applyHomeData` receives raw section settings (no `blocks` key) and blocks array from config.
 * Return `{ sectionSettingsOnly, blocksData }` after merging `homeData` (or specific fields).
 */

/**
 * @param {Record<string, unknown>} homeData
 * @param {Record<string, unknown>} sectionSettingsOnly
 * @param {Array<{ type: string, settings: Record<string, unknown> }>} blocksData
 * @returns {{ sectionSettingsOnly: Record<string, unknown>, blocksData: typeof blocksData }}
 */
export function defaultApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocksData || []
    };
}

function pickText(text, key) {
    const value = text?.[key];
    if (value == null) return undefined;
    const s = String(value).trim();
    return s.length > 0 ? s : undefined;
}

/**
 * Prepaid single home product hero — map editable chrome text onto Liquid blocks.
 * Product title / price / media stay on the bound Shopify product.
 */
export function productHeroApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    let accordionIndex = 0;
    const blocks = (blocksData || []).map((block) => {
        if (!block || typeof block !== "object") return block;
        const settings = { ...(block.settings || {}) };

        if (block.type === "badges") {
            const newText = pickText(text, "hero_new_badge_text");
            const saleText = pickText(text, "hero_sale_badge_text");
            if (newText) settings.new_text = newText;
            if (saleText) settings.sale_text = saleText;
            return { ...block, settings };
        }
        if (block.type === "title") {
            const reviewText = pickText(text, "hero_review_text");
            if (reviewText) settings.review_text = reviewText;
            return { ...block, settings };
        }
        if (block.type === "stock") {
            const stockText = pickText(text, "hero_stock_text");
            if (stockText) settings.stock_text = stockText;
            return { ...block, settings };
        }
        if (block.type === "buy_buttons") {
            const addToCart = pickText(text, "hero_add_to_cart_text");
            if (addToCart) settings.add_to_cart_text = addToCart;
            return { ...block, settings };
        }
        if (block.type === "trust_badges") {
            const trust1 = pickText(text, "hero_trust_1");
            const trust2 = pickText(text, "hero_trust_2");
            if (trust1) settings.trust_1 = trust1;
            if (trust2) settings.trust_2 = trust2;
            return { ...block, settings };
        }
        if (block.type === "accordion") {
            accordionIndex += 1;
            const title = pickText(text, `hero_accordion_${accordionIndex}_title`);
            const content = pickText(text, `hero_accordion_${accordionIndex}_content`);
            if (title) settings.title = title;
            if (content) settings.content = content;
            return { ...block, settings };
        }
        return block;
    });

    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks,
    };
}

/** Maps home `text.product_grid_*` onto Kluck AI Products Grid section settings. */
export function productGridApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    return {
        sectionSettingsOnly: {
            ...sectionSettingsOnly,
            homeData,
            ...(text.product_grid_tab_1 && { tab_label_1: text.product_grid_tab_1 }),
            ...(text.product_grid_tab_2 && { tab_label_2: text.product_grid_tab_2 }),
            ...(text.product_grid_tab_3 && { tab_label_3: text.product_grid_tab_3 }),
            ...(text.product_grid_link_text && { link_text: text.product_grid_link_text }),
            ...(text.product_grid_link_text_mobile && {
                link_text_mobile: text.product_grid_link_text_mobile,
            }),
            ...(text.product_grid_link_url && { link_url: text.product_grid_link_url }),
        },
        blocksData: blocksData || [],
    };
}

/**
 * Maps `homeData.text.customer_name_N` / `customer_review_N` onto testimonial blocks.
 */
export function testimonialsApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "testimonial") return block;
        const n = i + 1;
        const author_name = text[`customer_name_${n}`];
        const review_text = text[`customer_review_${n}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(author_name && { author_name }),
                ...(review_text && { review_text })
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

/** Images used for inline headline pills (cycles across three insertions). */
const INLINE_HEADLINE_IMAGE_KEYS = [
    "product_image_1",
    "product_image_2",
    "product_image_3",
    "banner_image",
    "product_impact_image",
    "feature_image",
    "creative_image",
    "highlight_image"
];

function buildInlineHeadlineBlocksFromHome(homeData, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const headline = text.punchy_poetic_headline;
    if (!headline || typeof headline !== "string") {
        return blocksData || [];
    }

    const imageUrls = INLINE_HEADLINE_IMAGE_KEYS.map((k) => images[k]).filter(
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

function inlineHeadlineApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: buildInlineHeadlineBlocksFromHome(homeData, blocksData)
    };
}

function heroApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const eyebrow = text.banner_eyebrow ?? text.banner_subheading;
    const selectedHandle = text.selected_product;
    const blocks = (blocksData || []).map((block) => {
        if (block.type !== "slide") return block;
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(images.banner_image && { image: images.banner_image }),
                ...(text.banner_heading && { heading: text.banner_heading }),
                ...(eyebrow && { eyebrow }),
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

export const SINGLE_PRODUCT_HOME_SECTIONS = [
    {
        key: "pf-k-hero-peek-slider",
        name: "Kluck AI - Hero Banner",
        applyHomeData: heroApplyHomeData
    },
    {
        key: "marquee-scrolling-banner",
        name: "Kluck AI - Marquee Banner",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
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
    },
    {
        key: "pf-custom-new-image-with-text",
        name: "Kluck AI - Image with Text - 1",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
            const text = homeData?.text ?? {};
            const images = homeData?.images ?? {};
            const description1 = text.image_with_text_description_1;
            const description2 = text.image_with_text_description_2;
            return {
                sectionSettingsOnly: {
                    ...sectionSettingsOnly,
                    homeData,
                    ...(images.product_impact_image && { image_1: images.product_impact_image }),
                    ...(text.image_with_text_heading && { heading: text.image_with_text_heading }),
                    ...(description1 && {
                        text_1: String(description1).includes("<")
                            ? description1
                            : `<p>${description1}</p>`
                    }),
                    ...(description2 && {
                        text_2: String(description2).includes("<")
                            ? description2
                            : `<p>${description2}</p>`
                    }),
                    ...(text.image_with_text_description_feature_1_stat && {
                        feature_1_stat: text.image_with_text_description_feature_1_stat
                    }),
                    ...(text.image_with_text_description_feature_1 && {
                        feature_1_text: text.image_with_text_description_feature_1
                    }),
                    ...(text.image_with_text_description_feature_2_stat && {
                        feature_2_stat: text.image_with_text_description_feature_2_stat
                    }),
                    ...(text.image_with_text_description_feature_2 && {
                        feature_2_text: text.image_with_text_description_feature_2
                    }),
                    ...(text.image_with_text_description_feature_3_stat && {
                        feature_3_stat: text.image_with_text_description_feature_3_stat
                    }),
                    ...(text.image_with_text_description_feature_3 && {
                        feature_3_text: text.image_with_text_description_feature_3
                    })
                },
                blocksData: blocksData || []
            };
        }
    },
    {
        key: "pf-inline-headline",
        name: "Kluck AI - Headline",
        applyHomeData: inlineHeadlineApplyHomeData
    },
    {
        key: "pf-new-ingreds-features",
        name: "Kluck AI - Image with Text - 2",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
            const text = homeData?.text ?? {};
            const images = homeData?.images ?? {};
            const blocks = (blocksData || []).map((block, i) => {
                if (block.type !== "accordion_item") return block;
                const n = i + 1;
                const title = text[`why_choose_us_reason_${n}_heading`];
                const description = text[`why_choose_us_reason_${n}_description`];
                const image = images[`creative_image`];
                return {
                    ...block,
                    settings: {
                        ...block.settings,
                        ...(title && { title }),
                        ...(description && { description }),
                        ...(image && { image })
                    }
                };
            });
            return {
                sectionSettingsOnly: {
                    ...sectionSettingsOnly,
                    homeData,
                    ...(text.why_choose_us_heading && { main_heading: text.why_choose_us_heading })
                },
                blocksData: blocks
            };
        }
    },
    {
        key: "pf-new-features-center-image",
        name: "Kluck AI - Features Center",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
            const text = homeData?.text ?? {};
            const images = homeData?.images ?? {};
            const blocks = (blocksData || []).map((block, i) => {
                if (block.type !== "feature") return block;
                const name = text[`feature_name_${i + 1}`];
                const desc = text[`feature_desc_${i + 1}`];
                return {
                    ...block,
                    settings: {
                        ...block.settings,
                        ...(name && { title: name }),
                        ...(desc && { text: desc })
                    }
                };
            });
            return {
                sectionSettingsOnly: {
                    ...sectionSettingsOnly,
                    homeData,
                    ...(text.feature_section_heading && { heading: text.feature_section_heading }),
                    ...(images.product_base_image && { center_image: images.product_base_image })
                },
                blocksData: blocks
            };
        }
    },
    {
        key: "pf-trust-badges",
        name: "Kluck AI - Trust Badges",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
            const text = homeData?.text ?? {};
            const headings = [
                text.why_choose_us_reason_1_heading,
                text.why_choose_us_reason_2_heading,
                text.why_choose_us_reason_3_heading,
                text.why_choose_us_reason_4_heading
            ];
            const blocks = (blocksData || []).map((block, i) => {
                if (block.type !== "badge") return block;
                const label = headings[i];
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
    },
    {
        key: "pf-new-default-product-hero",
        name: "Kluck AI - Product Hero",
        applyHomeData: productHeroApplyHomeData
    },
    {
        key: "pf-testimonials01",
        name: "Kluck AI - Testimonials",
        applyHomeData: testimonialsApplyHomeData
    },
    {
        key: "pf-split-feature",
        name: "Kluck AI - Image with Text - 3",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
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
    },
    {
        key: "pf-faq-splitimage",
        name: "Kluck AI - FAQ",
        applyHomeData: (homeData, sectionSettingsOnly, blocksData) => {
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
            return {
                sectionSettingsOnly: {
                    ...sectionSettingsOnly,
                    homeData,
                    ...(images.product_base_image && { image: images.product_base_image }),
                    ...(text.why_choose_us_heading && { heading: text.why_choose_us_heading })
                },
                blocksData: blocks
            };
        }
    }
];
