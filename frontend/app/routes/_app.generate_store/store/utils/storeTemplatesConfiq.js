import { MULTI_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/home/multi-product.js";
import { SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/home/single-product.js";
import {
    SINGLE_PRODUCT_HOME_SECTIONS,
    defaultApplyHomeData
} from "./liquid-schema-settings/home/single-product-sections.js";
import { MULTI_PRODUCT_HOME_SECTIONS } from "./liquid-schema-settings/home/multi-product-sections.js";
import { CINEMATIC_SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/packs/cinematic/single-product.js";
import { CINEMATIC_SINGLE_PRODUCT_HOME_SECTIONS } from "./liquid-schema-settings/packs/cinematic/single-product-sections.js";
import { AMOUR_SINGLE_PRODUCT_HOME_SETTINGS } from "./liquid-schema-settings/packs/amour/single-product.js";
import { AMOUR_SINGLE_PRODUCT_HOME_SECTIONS } from "./liquid-schema-settings/packs/amour/single-product-sections.js";
import { withAmourCategoryColors } from "./liquid-schema-settings/packs/amour/categoryTheme.js";
import { applySectionColorSchemesToSettings } from "./sectionColorUtils.js";
import { DEFAULT_PRODUCT_PAGE_SETTINGS } from "./liquid-schema-settings/default-product/product.js";
import { COLLECTION_1_PREVIEW_CONTEXT } from "./liquid-schema-settings/collection/collection-1.js";
import {
    COLLECTION_2_DEFAULT_BLOCKS,
    COLLECTION_2_SETTINGS
} from "./liquid-schema-settings/collection/collection-2.js";
import { collectionGridCollectionPageApplyHomeData } from "./liquid-schema-settings/collection/collection-2-sections.js";
import {
    CONTACT_PREVIEW_FORM,
    DEFAULT_CONTACT_PAGE_SETTINGS
} from "./liquid-schema-settings/contact/contact-1.js";
import { DEFAULT_ABOUT_PAGE_H1_SETTINGS } from "./liquid-schema-settings/about-us/about-1.js";
import {
    DEFAULT_ABOUT_PAGE_H2_BLOCKS,
    DEFAULT_ABOUT_PAGE_H2_SETTINGS
} from "./liquid-schema-settings/about-us/about-2.js";
import {
    DEFAULT_FAQ_PAGE_BLOCKS,
    DEFAULT_FAQ_PAGE_SETTINGS
} from "./liquid-schema-settings/faq/faq-1.js";
import {
    DEFAULT_NOT_FOUND_PAGE_SETTINGS,
    PREVIEW_ROUTES
} from "./liquid-schema-settings/404/404-1.js";
import { DEFAULT_SHOP } from "../../../_app.generate_pdp/product-page/utils/liquid-schema-settings/index.js";
import { getBodyImages, getProductImages } from "../../../_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import { getLiquidTemplateDisplayName } from "../../../../lib/liquidTemplateDisplayNames.js";
import themeSettings from "../utils/liquid-css-settings/theme-settings.json";
import fashionTemplate2Theme from "./liquid-schema-settings/default-product/fashion-roarr-fashion-2.json";
import fashionTemplate1Theme from "./liquid-schema-settings/default-product/fashion-roarr-fashion-1.json";

const PREVIEW_PRODUCT_ROUTES = { all_products_collection_url: "/collections/all" };
/**
 * Transform dashboard product to Shopify-like product shape for Liquid
 */
function toLiquidProduct(dashboardProduct) {
    if (!dashboardProduct) return null;
    const imgUrl = dashboardProduct?.featuredImage?.url ||
        dashboardProduct?.images?.edges?.[0]?.node?.url ||
        "";
    const media = [];
    if (imgUrl) {
        media.push({
            preview_image: imgUrl,
            alt: dashboardProduct?.featuredImage?.altText || dashboardProduct?.title || ""
        });
    }
    const edges = dashboardProduct?.images?.edges || [];
    for (const edge of edges) {
        const node = edge?.node;
        if (node?.url && !media.some((m) => m.preview_image === node.url)) {
            media.push({
                preview_image: node.url,
                alt: node?.altText || dashboardProduct?.title || ""
            });
        }
    }
    const cents = priceToCents(dashboardProduct);
    const compareAt = compareAtPriceToCents(dashboardProduct);
    const variant = {
        id: dashboardProduct?.variants?.edges?.[0]?.node?.id || "preview-variant-1",
        price: cents,
        compare_at_price: compareAt != null && compareAt > cents ? compareAt : Math.round(cents * 1.5),
        available: true,
        options: ["Default"],
        inventory_quantity: 10,
        inventory_policy: "deny",
        inventory_management: null,
        quantity_rule: { min: 1, max: null, increment: 1 },
        store_availabilities: []
    };
    const product = {
        id: dashboardProduct?.id || "preview-product",
        title: dashboardProduct?.title || "Product",
        description: dashboardProduct?.description || dashboardProduct?.descriptionHtml || "",
        media,
        variants: [variant],
        selected_or_first_available_variant: variant,
        has_only_default_variant: true,
        compare_at_price: variant.compare_at_price,
        price: cents,
        options_with_values: [],
        featured_media: media[0] || null,
        url: "/products/preview"
    };
    return product;
}

/**
 * Parse storefront product price to cents for collection grid
 */
function priceToCents(dashboardProduct) {
    const v0 = dashboardProduct?.variants?.edges?.[0]?.node;
    if (v0?.price) {
        const n = parseFloat(String(v0.price).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(n)) return Math.round(n * 100);
    }
    const min = dashboardProduct?.priceRangeV2?.minVariantPrice?.amount;
    if (min != null) {
        const n = parseFloat(String(min));
        if (!Number.isNaN(n)) return Math.round(n * 100);
    }
    return 2999;
}

/** Compare-at price in cents for sale badges (variant or product). */
function compareAtPriceToCents(dashboardProduct) {
    const v0 = dashboardProduct?.variants?.edges?.[0]?.node;
    if (v0?.compareAtPrice) {
        const n = parseFloat(String(v0.compareAtPrice).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(n)) return Math.round(n * 100);
    }
    return null;
}

/**
 * Supplies `collections` for `home/pf-product-grid1x1` preview (tabs: whats-hot, best-sellers, on-sale).
 * Uses up to 3 dashboard (Shopify) products for every tab so the grid shows real store data.
 */
function buildProductGridCollectionsFromDashboardProducts(dashboardProducts) {
    if (!Array.isArray(dashboardProducts) || dashboardProducts.length === 0) return null;
    const slice = dashboardProducts.slice(0, 3);
    const products = slice
        .map((p, i) => {
            const row = dashboardProductsToCollectionProducts([p])?.[0];
            if (!row) return null;
            const price = row.price;
            const compareAt = compareAtPriceToCents(p);
            const v0 = p?.variants?.edges?.[0]?.node;
            const variantId = v0?.id ?? row.variants?.[0]?.id ?? `preview-variant-${i}`;
            const tags = Array.isArray(p?.tags) ? p.tags : [];
            return {
                ...row,
                ...(compareAt != null && compareAt > price ? { compare_at_price: compareAt } : {}),
                selected_or_first_available_variant: { id: variantId },
                tags
            };
        })
        .filter(Boolean);
    if (products.length === 0) return null;
    const coll = { products, products_count: products.length };
    return {
        "whats-hot": coll,
        "best-sellers": coll,
        "on-sale": coll,
        all: coll
    };
}

/**
 * Map dashboard products to collection template `collection.products` shape
 */
function dashboardProductsToCollectionProducts(dashboardProducts) {
    if (!Array.isArray(dashboardProducts) || dashboardProducts.length === 0) return null;
    return dashboardProducts.map((p, i) => {
        const imgUrl =
            p?.featuredImage?.url ||
            p?.images?.edges?.[0]?.node?.url ||
            null;
        const variantEdges = p?.variants?.edges || [];
        const variants =
            variantEdges.length > 0
                ? variantEdges.map((e, j) => ({
                    id: e.node?.id ?? `variant-${i}-${j}`
                }))
                : [{ id: `preview-variant-${i}` }];
        const handle =
            p?.handle ||
            String(p?.title || "product")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") ||
            "preview";
        return {
            id: p?.id || `p-${i}`,
            title: p?.title || "Product",
            url: `/products/${handle}`,
            price: priceToCents(p),
            available: p?.availableForSale !== false,
            type: p?.productType || "",
            vendor: p?.vendor || "",
            featured_image: imgUrl,
            variants
        };
    });
}

/** Shopify theme JSON font handles → display names (subset; unknown handles use underscore→space). */
const THEME_FONT_HANDLE_MAP = {
    oswald_n4: "Oswald",
    roboto_n4: "Roboto",
    josefin_sans_n4: "Josefin Sans",
    almarai_n4: "Almarai",
    inter_n4: "Inter",
    poppins_n4: "Poppins",
    abel_n4: "Abel",
};

/**
 * Merge StoreFlow `stylePreferences` into theme settings and normalize font fields to
 * `{ family, fallback_families }` so Liquid can render `settings.type_heading_font.family`
 * (strings like `oswald_n4` or `"Poppins"` would otherwise produce empty `.family` in Liquid).
 */
function normalizePreviewThemeSettings(baseSettings, stylePreferences) {
    const settings = { ...baseSettings };
    if (stylePreferences?.headingFont) {
        settings.type_heading_font = stylePreferences.headingFont;
        settings.type_subheading_font = stylePreferences.headingFont;
    }
    if (stylePreferences?.bodyFont) {
        settings.type_body_font = stylePreferences.bodyFont;
        settings.type_accent_font = stylePreferences.bodyFont;
    }
    const fontFields = [
        "type_heading_font",
        "type_body_font",
        "type_subheading_font",
        "type_accent_font",
    ];
    fontFields.forEach((f) => {
        const v = settings[f];
        if (v == null) return;
        if (typeof v === "object" && v.family != null) return;
        if (typeof v === "string") {
            const name = THEME_FONT_HANDLE_MAP[v] || v.replace(/_/g, " ");
            settings[f] = { family: name, fallback_families: "sans-serif" };
        }
    });
    return settings;
}

function isFashionCategory(detectedCategory) {
    if (detectedCategory == null || String(detectedCategory).trim() === "") return false;
    const normalized = String(detectedCategory).trim().toLowerCase().replace(/\s+/g, "_");
    if (normalized === "fashion") return true;
    const lower = normalized;
    return lower.includes("fashion") || lower.includes("apparel");
}

function normalizeFashion2FontSetting(val) {
    if (val == null) return val;
    if (typeof val === "object" && val.family != null) return val;
    if (typeof val === "string") {
        const name = THEME_FONT_HANDLE_MAP[val] || val.replace(/_/g, " ");
        return { family: name, fallback_families: "sans-serif" };
    }
    return val;
}

/** Merge theme JSON section settings and normalize FAQ font fields for liquid preview. */
function normalizeFashion2SectionSettings(sectionSettings) {
    const out = { ...sectionSettings };
    ["heading_font_family", "body_font_family"].forEach((k) => {
        if (out[k] != null) out[k] = normalizeFashion2FontSetting(out[k]);
    });
    return out;
}

function toLiquidProductFromMappedInner(mappedInner) {
    if (!mappedInner) return null;
    const edges = (mappedInner.media || []).map((m) => ({
        node: { url: m.preview_image, altText: mappedInner.title || "" }
    }));
    return toLiquidProduct({
        id: "preview-product",
        title: mappedInner.title || "Product",
        description: "",
        featuredImage: mappedInner.media?.[0] ? { url: mappedInner.media[0].preview_image } : null,
        images: { edges }
    });
}

/**
 * Product + product metafield mock for fashion `product.roarr-fashion-2` liquid sections.
 */
function buildFashion2PreviewProduct(productData, homeData, stylePreferences, categoryDefaults) {
    const baseHome = homeData && typeof homeData === "object" ? homeData : {};
    const mappedInner = productData && typeof productData === "object" && productData.product
        ? productData.product
        : null;
    const liquidBase =
        (mappedInner ? toLiquidProductFromMappedInner(mappedInner) : null) ||
        toLiquidProduct(productData) ||
        toLiquidProduct({
            id: "placeholder",
            title: "Product",
            description: "Select a product to preview.",
            featuredImage: null,
            images: { edges: [] }
        });
    const text = baseHome.text || {};
    const images = baseHome.images || {};
    const bodyImages = images.body_images || {};
    const accent =
        stylePreferences?.dynamicColor ||
        baseHome.selected_color ||
        categoryDefaults?.primaryColor ||
        mappedInner?.metafields?.kluck_ai?.color_schema?.value ||
        "#A34E4E";
    const defaultFaqQ = "When will my order ship?";
    const defaultFaqA =
        "<p>We process orders quickly to ensure timely shipping. Once your order is dispatched, you'll receive a confirmation email with tracking details.</p>";
    const impactUrl =
        (typeof bodyImages.product_impact_image === "string" && bodyImages.product_impact_image) ||
        liquidBase.featured_media?.preview_image ||
        liquidBase.media?.[0]?.preview_image ||
        "";
    const existingMeta = mappedInner?.metafields?.kluck_ai || liquidBase.metafields?.kluck_ai || {};
    const asValue = (v, fallback = "") => {
        if (v == null || v === "") return { value: fallback };
        if (typeof v === "object" && v.value != null) return v;
        return { value: String(v) };
    };
    const kluckAi = {
        ...existingMeta,
        color_schema: asValue(existingMeta.color_schema, accent),
        highlight_banner_section_heading: asValue(
            existingMeta.highlight_banner_section_heading,
            text.highlight_banner_section_heading || text.highlight_heading || liquidBase.title || ""
        ),
        highlight_banner_section_description: asValue(
            existingMeta.highlight_banner_section_description,
            text.highlight_banner_section_description || text.highlight_description || ""
        ),
        product_impact_image: asValue(existingMeta.product_impact_image, impactUrl)
    };
    for (let i = 1; i <= 3; i++) {
        const qk = `faq_question_${i}`;
        const ak = `faq_answer_${i}`;
        if (kluckAi[qk] == null || kluckAi[qk] === "") kluckAi[qk] = text[qk] || defaultFaqQ;
        if (kluckAi[ak] == null || kluckAi[ak] === "") kluckAi[ak] = text[ak] || defaultFaqA;
    }
    return {
        ...liquidBase,
        metafields: { kluck_ai: kluckAi }
    };
}

/**
 * Extends fashion-2 preview product with metafields used by `product.roarr-fashion-1` sections (marquee text, feature grid).
 */
function extractHttpImageUrl(v) {
    if (v == null || v === "") return "";
    if (typeof v === "string") {
        const t = v.trim();
        if (/^https?:\/\//i.test(t) || t.startsWith("//")) return t;
        return "";
    }
    if (typeof v === "object") {
        if (v.value != null) return extractHttpImageUrl(v.value);
        if (typeof v.src === "string") return extractHttpImageUrl(v.src);
    }
    return "";
}

function buildFashion1PreviewProduct(productData, homeData, stylePreferences, categoryDefaults) {
    const base = buildFashion2PreviewProduct(productData, homeData, stylePreferences, categoryDefaults);
    const baseHome = homeData && typeof homeData === "object" ? homeData : {};
    const text = baseHome.text || {};
    const bodyImages =
        (baseHome.images && typeof baseHome.images === "object" && baseHome.images.body_images) ||
        baseHome.body_images ||
        {};
    const existing = base.metafields?.kluck_ai || {};
    const asValue = (v, fallback = "") => {
        if (v == null || v === "") return { value: fallback };
        if (typeof v === "object" && v.value != null) return v;
        return { value: String(v) };
    };
    const mediaUrls = (base.media || []).map((m) => m.preview_image).filter(Boolean);
    const fashionBodyDefaults = getBodyImages("fashion") || {};
    const defaultDetail =
        "Premium materials and careful construction define this piece—made to look sharp today and hold up over time.";
    const km = { ...existing };
    for (let i = 1; i <= 3; i++) {
        const mt = `marquee_text_${i}`;
        if (km[mt] == null || km[mt] === "") km[mt] = text[mt] || "Roarr Quality";

        const dk = `impactfull_poetic_product_detail_${i}`;
        const poetic = text[dk];
        if (poetic != null && String(poetic).trim() !== "") {
            km[dk] = typeof poetic === "object" && poetic.value != null ? poetic : String(poetic);
        } else if (km[dk] == null || km[dk] === "") {
            km[dk] = defaultDetail;
        }

        const ik = `happy_customer_image_${i}`;
        const happy = bodyImages[ik];
        const fromBody = extractHttpImageUrl(happy);
        const fromExisting = extractHttpImageUrl(km[ik]);
        const fromMedia = (mediaUrls[i - 1] || mediaUrls[0] || "").trim();
        const fromMediaHttp = /^https?:\/\//i.test(fromMedia) || fromMedia.startsWith("//") ? fromMedia : "";
        const fromFashionDefault = extractHttpImageUrl(fashionBodyDefaults[ik]);
        const finalUrl = fromBody || fromExisting || fromMediaHttp || fromFashionDefault;
        km[ik] = asValue(null, finalUrl);
    }
    const fm = base.featured_media;
    return {
        ...base,
        featured_image: fm || base.featured_image,
        metafields: { kluck_ai: km }
    };
}

/**
 * Apply `homeData.text` / form edits to Fashion 1/2 theme-JSON sections in liquid preview
 * (blocks that do not read product metafields on the storefront).
 */
function applyFashion2EditorPreviewOverrides(sectionType, blocks, processedSettings, homeData) {
    if (!homeData || typeof homeData !== "object") return;
    const text = homeData.text || {};

    if (sectionType === "kluck-ai-trust-badge-2-section" && Array.isArray(blocks)) {
        let badgeIdx = 0;
        for (const block of blocks) {
            if (block.type === "badge") {
                badgeIdx += 1;
                const v = text[`badge_text_${badgeIdx}`];
                if (v != null && String(v).trim() !== "") {
                    block.settings = { ...block.settings, text: String(v) };
                }
            }
        }
    }

    if (sectionType === "kluck-ai-product-hero-section-2" && Array.isArray(blocks)) {
        let accIdx = 0;
        for (const block of blocks) {
            if (block.type === "accordion") {
                accIdx += 1;
                if (accIdx > 3) break;
                const q = text[`product_question_${accIdx}`];
                const a = text[`product_question_${accIdx}_answer`];
                const nextSettings = { ...block.settings };
                if (q != null && String(q).trim() !== "") nextSettings.title = String(q);
                if (a != null && String(a).trim() !== "") nextSettings.content = String(a);
                block.settings = nextSettings;
            }
        }
    }

    if (sectionType === "kluck-ai-faq-section") {
        if (text.faq_section_title != null && String(text.faq_section_title).trim() !== "") {
            processedSettings.title = String(text.faq_section_title);
        }
        if (text.faq_section_subtitle != null && String(text.faq_section_subtitle).trim() !== "") {
            processedSettings.subtitle = String(text.faq_section_subtitle);
        }
    }
}

function fashionJsonSectionToPreviewRow(sectionInstanceId, spec, liquidProduct, baseSettings, homeData = null) {
    const sectionType = spec.type;
    const settingsOnly = normalizeFashion2SectionSettings({ ...(spec.settings || {}) });
    const blockOrder = spec.block_order || [];
    const blockMap = spec.blocks || {};
    const blocks = blockOrder.map((bid) => {
        const b = blockMap[bid];
        const blockSettings = { ...(b?.settings || {}) };
        return {
            id: bid,
            type: b.type,
            settings: blockSettings,
            shopify_attributes: `data-block-id="${bid}"`
        };
    });
    const processedSettings = { ...settingsOnly };
    if (sectionType === "kluck-ai-product-hero-section-2" || sectionType === "kluck-ai-product-hero-section-3") {
        processedSettings.product = liquidProduct;
    }
    applyFashion2EditorPreviewOverrides(sectionType, blocks, processedSettings, homeData);
    const section = {
        id: sectionInstanceId,
        settings: { ...processedSettings, blocks },
        blocks
    };
    const context = {
        section,
        blocks,
        shop: DEFAULT_SHOP,
        settings: baseSettings,
        routes: PREVIEW_PRODUCT_ROUTES,
        m: {
            color_schema:
                liquidProduct?.metafields?.kluck_ai?.color_schema?.value ||
                liquidProduct?.metafields?.kluck_ai?.color_schema ||
                "#A34E4E"
        },
        product: liquidProduct
    };
    return [
        {
            template: sectionType,
            displayName:
                typeof spec.name === "string" && spec.name.trim().length > 0
                    ? spec.name.trim()
                    : getLiquidTemplateDisplayName(sectionType),
            context
        }
    ];
}

/**
 * Template rows for fashion product.roarr-fashion-2 (store + product preview editors).
 */
export function buildFashionTemplate2Rows({
    productData = null,
    homeData = {},
    stylePreferences = null,
    categoryDefaults = null
}) {
    const liquidProduct = buildFashion2PreviewProduct(
        productData,
        homeData,
        stylePreferences,
        categoryDefaults
    );
    const baseSettings = themeSettings?.current ?? {};
    const settings = normalizePreviewThemeSettings({ ...baseSettings, homeData }, stylePreferences);
    const order = fashionTemplate2Theme.order || [];
    const sections = fashionTemplate2Theme.sections || {};
    const rows = [];
    for (const instanceId of order) {
        const spec = sections[instanceId];
        if (!spec) continue;
        rows.push(fashionJsonSectionToPreviewRow(instanceId, spec, liquidProduct, settings, homeData));
    }
    return rows;
}

/**
 * Template rows for fashion product.roarr-fashion-1 (store + product preview editors).
 */
export function buildFashionTemplate1Rows({
    productData = null,
    homeData = {},
    stylePreferences = null,
    categoryDefaults = null
}) {
    const liquidProduct = buildFashion1PreviewProduct(
        productData,
        homeData,
        stylePreferences,
        categoryDefaults
    );
    const baseSettings = themeSettings?.current ?? {};
    const settings = normalizePreviewThemeSettings({ ...baseSettings, homeData }, stylePreferences);
    const order = fashionTemplate1Theme.order || [];
    const sections = fashionTemplate1Theme.sections || {};
    const rows = [];
    for (const instanceId of order) {
        const spec = sections[instanceId];
        if (!spec) continue;
        rows.push(fashionJsonSectionToPreviewRow(instanceId, spec, liquidProduct, settings, homeData));
    }
    return rows;
}

/**
 * Template rows for home preview: section list + applyHomeData (single- or multi-product).
 */
function buildHomeTemplateConfigFromSections(
    homeSettings,
    homeSections,
    homeData,
    stylePreferences,
    categoryDefaults = null,
    collectionProducts = null,
    selectedProductData = null,
    options = {}
) {
    if (!homeSections || homeSections.length === 0) return [];
    const omitCheckoutBlocks = Boolean(options.omitCheckoutBlocks);

    const collectionsContext =
        buildProductGridCollectionsFromDashboardProducts(collectionProducts) || {};

    const previewProductRaw = selectedProductData ||
        (Array.isArray(collectionProducts) && collectionProducts.length > 0
            ? collectionProducts[0]
            : null);
    let liquidPreviewProduct = toLiquidProduct(previewProductRaw) || toLiquidProduct({
        id: "placeholder",
        title: "Product",
        description: "Select a product to preview.",
        featuredImage: null,
        images: { edges: [] }
    });
    // Prepaid home checkout hero: fill gallery from home/category demo images when empty.
    if (
        !omitCheckoutBlocks &&
        liquidPreviewProduct &&
        (!Array.isArray(liquidPreviewProduct.media) || liquidPreviewProduct.media.length === 0)
    ) {
        const homeImages = (homeData && typeof homeData === "object" && homeData.images) || {};
        const fromHome = [
            homeImages.product_image_1,
            homeImages.product_image_2,
            homeImages.product_image_3,
            homeImages.product_base_image,
            homeImages.product_impact_image,
        ].filter((u) => typeof u === "string" && u.trim().startsWith("http"));
        const fromCategory = Object.values(
            getProductImages(
                options.detectedCategory ||
                    categoryDefaults?.id ||
                    "general",
            ) || {},
        ).filter((u) => typeof u === "string" && u.trim().startsWith("http"));
        const urls = fromHome.length > 0 ? fromHome : fromCategory;
        if (urls.length > 0) {
            const homeText =
                homeData && typeof homeData === "object" && homeData.text
                    ? homeData.text
                    : {};
            const demoTitle =
                (typeof homeText.banner_heading === "string" && homeText.banner_heading.trim()) ||
                "Featured Product";
            const demoDetails =
                (typeof homeText.checkout_product_details === "string" &&
                    homeText.checkout_product_details.trim()) ||
                "";
            const keepTitle =
                liquidPreviewProduct.title &&
                liquidPreviewProduct.title !== "Product" &&
                liquidPreviewProduct.title !== "Featured Product";
            const keepDetails =
                liquidPreviewProduct.description &&
                liquidPreviewProduct.description !== "Select a product to preview.";
            const media = urls.map((url) => ({
                preview_image: url,
                alt: keepTitle ? liquidPreviewProduct.title : demoTitle,
            }));
            liquidPreviewProduct = {
                ...liquidPreviewProduct,
                media,
                featured_media: media[0],
                title: keepTitle ? liquidPreviewProduct.title : demoTitle,
                description: keepDetails
                    ? liquidPreviewProduct.description
                    : demoDetails || liquidPreviewProduct.description,
            };
        }
    }
    const baseHomeData = homeData && typeof homeData === "object" ? homeData : {};
    const homeDataForApply =
        previewProductRaw != null
            ? { ...baseHomeData, _previewFirstProduct: previewProductRaw }
            : baseHomeData;

    const config = [];

    for (const sectionSpec of homeSections) {
        const sectionKey = sectionSpec.key;
        const sectionSettings = homeSettings[sectionKey];
        if (!sectionSettings) continue;

        const { blocks: blocksData, ...sectionSettingsOnly } = sectionSettings;
        const apply = sectionSpec.applyHomeData ?? defaultApplyHomeData;
        const { sectionSettingsOnly: mergedFromHome, blocksData: mergedBlocksData } = apply(
            homeDataForApply,
            sectionSettingsOnly,
            blocksData
        );

        const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;
        let processedSettings = { ...mergedFromHome };
        // Amour chrome uses section.settings.accent_color (--a-wine), not only color_scheme.
        const amourAccent =
            stylePreferences?.dynamicColor ||
            categoryDefaults?.primaryColor ||
            homeDataForApply?.selected_color ||
            null;
        if (
            typeof processedSettings.accent_color === "string" &&
            typeof amourAccent === "string" &&
            /^#?[0-9a-fA-F]{3,8}$/.test(amourAccent.trim())
        ) {
            const hex = amourAccent.trim().startsWith("#")
                ? amourAccent.trim()
                : `#${amourAccent.trim()}`;
            processedSettings.accent_color = hex;
        }
        const sectionColorsMap =
            homeDataForApply?.section_colors &&
            typeof homeDataForApply.section_colors === "object"
                ? homeDataForApply.section_colors
                : null;
        const sectionEntry =
            sectionColorsMap && sectionColorsMap[sectionKey] != null
                ? sectionColorsMap[sectionKey]
                : null;
        if (sectionEntry != null) {
            processedSettings = applySectionColorSchemesToSettings(
                processedSettings,
                sectionKey,
                sectionEntry,
            );
        }
        const isProductHero = sectionKey === "pf-new-default-product-hero";
        // COD single home: omit the whole Product Hero (checkout lives on premium PDP).
        if (omitCheckoutBlocks && isProductHero) {
            continue;
        }
        if (isProductHero && liquidPreviewProduct) {
            processedSettings.product = liquidPreviewProduct;
        }
        if (
            processedSettings.homeData &&
            typeof processedSettings.homeData === "object" &&
            "_previewFirstProduct" in processedSettings.homeData
        ) {
            const { _previewFirstProduct: _previewFirstProductOmit, ...homeDataRest } =
                processedSettings.homeData;
            processedSettings.homeData = homeDataRest;
        }

        const fontFields = [
            "font_heading",
            "font_body",
            "font_main",
            "font_btn",
            "font_accent",
            "heading_font",
            "text_font",
            "font_custom"
        ];
        fontFields.forEach((fieldName) => {
            if (processedSettings[fieldName] && typeof processedSettings[fieldName] === "string") {
                processedSettings[fieldName] = {
                    family: processedSettings[fieldName],
                    fallback_families: "sans-serif"
                };
            }
        });

        const section = { id: sectionId, settings: processedSettings };
        let blocks = (mergedBlocksData || []).map((blockData, index) => {
            const blockSettings = { ...(blockData.settings || {}) };
            if (blockSettings.font_custom && typeof blockSettings.font_custom === "string") {
                blockSettings.font_custom = {
                    family: blockSettings.font_custom,
                    fallback_families: "sans-serif"
                };
            }
            return {
                id: `${sectionId}_block_${index}`,
                type: blockData.type,
                settings: blockSettings,
                shopify_attributes: `data-block-id="${sectionId}_block_${index}"`
            };
        });

        const templateName = isProductHero
            ? "product/pf-new-default-product-hero"
            : sectionKey.startsWith("home/") || sectionKey.startsWith("packs/")
                ? sectionKey
                : sectionKey.startsWith("pf-cinematic-")
                    ? `packs/cinematic/home/${sectionKey}`
                    : sectionKey.startsWith("pf-amour-")
                        ? `packs/amour/home/${sectionKey}`
                        : `home/${sectionKey}`;

        const baseSettings = themeSettings?.current ?? {};
        const settings = { ...baseSettings };
        const headingFont = stylePreferences?.headingFont ?? categoryDefaults?.headingFont;
        const bodyFont = stylePreferences?.bodyFont ?? categoryDefaults?.bodyFont;
        if (headingFont) {
            settings.type_heading_font = headingFont;
            settings.type_subheading_font = headingFont;
        }
        if (bodyFont) {
            settings.type_body_font = bodyFont;
            settings.type_accent_font = bodyFont;
        }

        const context = {
            section: { ...section, blocks },
            blocks,
            shop: DEFAULT_SHOP,
            all_products: {},
            collections: collectionsContext,
            settings
        };
        if (isProductHero && liquidPreviewProduct) {
            context.product = liquidPreviewProduct;
        }

        config.push([
            {
                template: templateName,
                displayName:
                    typeof sectionSpec.name === "string" && sectionSpec.name.trim().length > 0
                        ? sectionSpec.name.trim()
                        : getLiquidTemplateDisplayName(templateName),
                context
            }
        ]);
    }

    return config;
}

/**
 * Builds liquid preview template rows for {@link LiquidPagePreview}.
 */
export function buildLiquidPageTemplatesConfig({
    productType = "single-product",
    pageType = "home-page",
    productData = null,
    collectionProducts = null,
    detectedCategory = null,
    selectedTemplate = 1,
    form = {},
    stylePreferences = null,
    categoryDefaults = null,
    homeData = {},
    marketType = null,
    storeTemplatePack = "classic",
    /** When true, strip product-hero checkout blocks from single home (premium PDP themes). */
    omitCheckoutBlocks = null,
}) {
    // Product page: must take precedence when Product tab is selected.
    // Do not use roarr-fashion-1/2 JSON here — those stacks overlap in the iframe
    // and steal homepage copy. Premium PDPs use generateTemplateConfig instead.
    if (pageType === "product-page") {
        let liquidProduct = toLiquidProduct(productData) || toLiquidProduct({
            id: "placeholder",
            title: "Product",
            description: "Select a product to preview.",
            featuredImage: null,
            images: { edges: [] }
        });
        if (!liquidProduct) return [];

        // Demo/preview fallback: never leave the gallery empty (shows gray circle placeholder).
        if (!Array.isArray(liquidProduct.media) || liquidProduct.media.length === 0) {
            const urls = Object.values(getProductImages(detectedCategory || "general") || {})
                .filter((u) => typeof u === "string" && u.trim().startsWith("http"));
            if (urls.length > 0) {
                const media = urls.map((url) => ({
                    preview_image: url,
                    alt: liquidProduct.title || "Product",
                }));
                liquidProduct = {
                    ...liquidProduct,
                    media,
                    featured_media: media[0],
                    title: liquidProduct.title && liquidProduct.title !== "Product"
                        ? liquidProduct.title
                        : "Featured Product",
                };
            }
        }

        const baseSettings = themeSettings?.current ?? {};
        const settings = normalizePreviewThemeSettings(
            { ...baseSettings, homeData },
            stylePreferences,
        );

        const sectionKeys = Object.keys(DEFAULT_PRODUCT_PAGE_SETTINGS);
        const config = [];

        for (const sectionKey of sectionKeys) {
            const sectionSettings = DEFAULT_PRODUCT_PAGE_SETTINGS[sectionKey];
            const { blocks: blocksData, ...sectionSettingsOnly } = sectionSettings;
            const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;

            const blocks = (blocksData || []).map((blockData, index) => ({
                id: `${sectionId}_block_${index}`,
                type: blockData.type,
                settings: blockData.settings || {},
                shopify_attributes: `data-block-id="${sectionId}_block_${index}"`
            }));

            const isProductHero = sectionKey === "pf-new-default-product-hero";
            const processedSettings = isProductHero
                ? { ...sectionSettingsOnly, product: liquidProduct }
                : { ...sectionSettingsOnly };

            const section = {
                id: sectionId,
                settings: { ...processedSettings, blocks },
                blocks
            };

            const templatePath = isProductHero
                ? "product/pf-new-default-product-hero"
                : `home/${sectionKey}`;

            const context = {
                section,
                shop: DEFAULT_SHOP,
                settings
            };
            if (isProductHero) {
                context.product = liquidProduct;
            }

            config.push([
                {
                    template: templatePath,
                    displayName: getLiquidTemplateDisplayName(templatePath),
                    context
                }
            ]);
        }

        return config;
    }

    // Collection page — collection/collection-2 (collection grid blocks) + collection context for compatibility
    if (pageType === "collection") {
        const sectionKey = "collection-2";
        const sectionSettings = COLLECTION_2_SETTINGS[sectionKey];
        const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;

        const baseSettings = themeSettings?.current ?? {};
        const baseHomeData = homeData && typeof homeData === "object" ? homeData : {};
        const settings = normalizePreviewThemeSettings(
            { ...baseSettings, homeData: baseHomeData },
            stylePreferences
        );

        const mappedProducts = dashboardProductsToCollectionProducts(collectionProducts);
        const collection = {
            ...COLLECTION_1_PREVIEW_CONTEXT.collection,
            ...(mappedProducts && {
                products: mappedProducts,
                products_count: mappedProducts.length
            })
        };

        const { sectionSettingsOnly: mergedSectionSettings, blocksData: mergedBlocksData } =
            collectionGridCollectionPageApplyHomeData(
                baseHomeData,
                { ...sectionSettings },
                COLLECTION_2_DEFAULT_BLOCKS
            );

        const blocks = mergedBlocksData.map((b) => ({
            id: b.id,
            type: b.type,
            settings: { ...b.settings },
            shopify_attributes: `data-block-id="${b.id}"`
        }));

        const section = {
            id: sectionId,
            settings: mergedSectionSettings,
            blocks
        };

        return [
            [
                {
                    template: "collection/collection-2",
                    displayName: getLiquidTemplateDisplayName("collection/collection-2"),
                    context: {
                        section,
                        shop: DEFAULT_SHOP,
                        settings,
                        paginate: COLLECTION_1_PREVIEW_CONTEXT.paginate,
                        cart: COLLECTION_1_PREVIEW_CONTEXT.cart,
                        collection
                    }
                }
            ]
        ];
    }

    // Contact page — pf-new-contact
    if (pageType === "contact-page") {
        const sectionKey = "pf-new-contact";
        const sectionSettings = DEFAULT_CONTACT_PAGE_SETTINGS[sectionKey];
        const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;

        const baseSettings = themeSettings?.current ?? {};
        const settings = normalizePreviewThemeSettings(baseSettings, stylePreferences);

        const section = {
            id: sectionId,
            settings: { ...sectionSettings, blocks: [] },
            blocks: []
        };

        return [
            [
                {
                    template: "contact/pf-new-contact",
                    displayName: getLiquidTemplateDisplayName("contact/pf-new-contact"),
                    context: {
                        section,
                        shop: DEFAULT_SHOP,
                        settings,
                        form: CONTACT_PREVIEW_FORM,
                        customer: null
                    }
                }
            ]
        ];
    }

    // FAQ page — pf-new-FAQ-page
    if (pageType === "faq-page") {
        const sectionKey = "pf-new-FAQ-page";
        const sectionSettings = DEFAULT_FAQ_PAGE_SETTINGS[sectionKey];
        const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;

        const baseSettings = themeSettings?.current ?? {};
        const settings = normalizePreviewThemeSettings(baseSettings, stylePreferences);

        const blocks = DEFAULT_FAQ_PAGE_BLOCKS.map((b) => ({
            id: b.id,
            type: b.type,
            settings: { ...b.settings },
            shopify_attributes: `data-block-id="${b.id}"`
        }));

        const section = {
            id: sectionId,
            settings: { ...sectionSettings },
            blocks
        };

        return [
            [
                {
                    template: "faq/pf-new-FAQ-page",
                    displayName: getLiquidTemplateDisplayName("faq/pf-new-FAQ-page"),
                    context: {
                        section,
                        shop: DEFAULT_SHOP,
                        settings
                    }
                }
            ]
        ];
    }

    // 404 — pf-new-404
    if (pageType === "not-found-page") {
        const sectionKey = "pf-new-404";
        const sectionSettings = DEFAULT_NOT_FOUND_PAGE_SETTINGS[sectionKey];
        const sectionId = `section_${sectionKey.replace(/-/g, "_")}`;

        const baseSettings = themeSettings?.current ?? {};
        const settings = normalizePreviewThemeSettings(baseSettings, stylePreferences);

        const section = {
            id: sectionId,
            settings: { ...sectionSettings, blocks: [] },
            blocks: []
        };
        return [
            [
                {
                    template: "404/pf-new-404",
                    displayName: getLiquidTemplateDisplayName("404/pf-new-404"),
                    context: {
                        section,
                        shop: DEFAULT_SHOP,
                        settings,
                        routes: PREVIEW_ROUTES
                    }
                }
            ]
        ];
    }

    // About Us — pf-aboutus-page-H1 + pf-aboutus-page-H2
    if (pageType === "about-page") {
        const baseSettings = themeSettings?.current ?? {};
        const settings = normalizePreviewThemeSettings(baseSettings, stylePreferences);

        const sectionH1Key = "pf-aboutus-page-H1";
        const sectionH1Settings = DEFAULT_ABOUT_PAGE_H1_SETTINGS[sectionH1Key];
        const sectionH1Id = `section_${sectionH1Key.replace(/-/g, "_")}`;
        const sectionH1 = {
            id: sectionH1Id,
            settings: { ...sectionH1Settings, blocks: [] },
            blocks: []
        };

        const sectionH2Key = "pf-aboutus-page-H2";
        const sectionH2Settings = DEFAULT_ABOUT_PAGE_H2_SETTINGS[sectionH2Key];
        const sectionH2Id = `section_${sectionH2Key.replace(/-/g, "_")}`;
        const blocksH2 = DEFAULT_ABOUT_PAGE_H2_BLOCKS.map((b) => ({
            id: b.id,
            type: b.type,
            settings: { ...b.settings },
            shopify_attributes: `data-block-id="${b.id}"`
        }));
        const sectionH2 = {
            id: sectionH2Id,
            settings: { ...sectionH2Settings },
            blocks: blocksH2
        };

        return [
            [
                {
                    template: "about-us/pf-aboutus-page-H1",
                    displayName: getLiquidTemplateDisplayName("about-us/pf-aboutus-page-H1"),
                    context: {
                        section: sectionH1,
                        shop: DEFAULT_SHOP,
                        settings
                    }
                }
            ],
            [
                {
                    template: "about-us/pf-aboutus-page-H2",
                    displayName: getLiquidTemplateDisplayName("about-us/pf-aboutus-page-H2"),
                    context: {
                        section: sectionH2,
                        shop: DEFAULT_SHOP,
                        settings
                    }
                }
            ]
        ];
    }

    if (productType === "multi-product" && pageType === "home-page") {
        return buildHomeTemplateConfigFromSections(
            MULTI_PRODUCT_HOME_SETTINGS,
            MULTI_PRODUCT_HOME_SECTIONS,
            homeData,
            stylePreferences,
            categoryDefaults,
            collectionProducts,
            null
        );
    }

    if (productType === "single-product" && pageType === "home-page") {
        const packRaw = String(storeTemplatePack || "").toLowerCase();
        const pack = packRaw === "cinematic" || packRaw === "amour" ? packRaw : "classic";
        const homeSettings =
            pack === "cinematic"
                ? CINEMATIC_SINGLE_PRODUCT_HOME_SETTINGS
                : pack === "amour"
                    ? withAmourCategoryColors(
                          AMOUR_SINGLE_PRODUCT_HOME_SETTINGS,
                          detectedCategory || categoryDefaults?.id || "general",
                          stylePreferences?.dynamicColor,
                      )
                    : SINGLE_PRODUCT_HOME_SETTINGS;
        const homeSections =
            pack === "cinematic"
                ? CINEMATIC_SINGLE_PRODUCT_HOME_SECTIONS
                : pack === "amour"
                    ? AMOUR_SINGLE_PRODUCT_HOME_SECTIONS
                    : SINGLE_PRODUCT_HOME_SECTIONS;
        return buildHomeTemplateConfigFromSections(
            homeSettings,
            homeSections,
            homeData,
            stylePreferences,
            categoryDefaults,
            null,
            productData,
            {
                // Default: COD omits checkout (on PDP). Classic prepaid keeps home checkout.
                // Callers pass omitCheckoutBlocks for prepaid premium themes (Linen/etc).
                omitCheckoutBlocks:
                    omitCheckoutBlocks == null
                        ? marketType === "cod"
                        : Boolean(omitCheckoutBlocks),
                detectedCategory: detectedCategory || "general",
            },
        );
    }

    return [];
}