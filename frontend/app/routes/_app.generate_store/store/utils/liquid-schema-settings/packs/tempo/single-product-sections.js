/**
 * Tempo single-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself (same keys as the storefront
 * metafield); the mapper only adds the selected product's name and price for the preview.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

/** Selected product (Admin API shape) → name + USD price, same as the preview `money` filter. */
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
        out.fallback_price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    }
    return out;
}

function withPreviewProduct(homeData, sectionSettingsOnly, blocksData) {
    const mapped = defaultApplyHomeData(homeData, sectionSettingsOnly, blocksData);
    Object.assign(mapped.sectionSettingsOnly, previewProductFields(homeData?._previewFirstProduct));
    const demoTitle = homeData?.text?.demo_product_title;
    if (typeof demoTitle === "string" && demoTitle.trim()) mapped.sectionSettingsOnly.fallback_title = demoTitle.trim();
    const demoPrice = homeData?.text?.demo_product_price;
    if (typeof demoPrice === "string" && demoPrice.trim()) mapped.sectionSettingsOnly.fallback_price = demoPrice.trim();
    const demoCompare = homeData?.text?.demo_product_compare_price;
    if (typeof demoCompare === "string" && demoCompare.trim()) mapped.sectionSettingsOnly.fallback_compare = demoCompare.trim();
    return mapped;
}

export const TEMPO_SINGLE_PRODUCT_HOME_SECTIONS = [
    { key: "pf-tempo-hero", name: "Roarr - Tempo Hero", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-arrivals", name: "Roarr - Tempo New Arrivals", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-features", name: "Roarr - Tempo Features", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-split", name: "Roarr - Tempo Split", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-showcase", name: "Roarr - Tempo Showcase", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-gallery", name: "Roarr - Tempo Gallery", applyHomeData: withPreviewProduct },
    { key: "pf-tempo-stories", name: "Roarr - Tempo Stories", applyHomeData: defaultApplyHomeData },
    { key: "pf-tempo-subscribe", name: "Roarr - Tempo Subscribe", applyHomeData: defaultApplyHomeData },
];
