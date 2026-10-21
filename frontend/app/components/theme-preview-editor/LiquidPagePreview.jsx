import { useMemo } from "react";
import LiquidPreviewRender from "./LiquidPreviewRender";
import { getCategoryTemplate1Defaults } from "../../lib/categoryHomeDefaults.js";
import {
  fingerprintPageContent,
  LIQUID_PREVIEW_LAYOUT_REV,
} from "../../lib/liquidPreviewCache.js";
import { buildLiquidPageTemplatesConfig } from "../../routes/_app.generate_store/store/utils/storeTemplatesConfiq.js";
import { buildStorePremiumPdpPreview } from "../../routes/_app.generate_store/store/utils/buildStorePremiumPdpPreview.js";

/** Default props must be stable references — inline `{}` in defaults creates a new object every render and busts useMemo / triggers repeated liquid-preview API calls. */
const EMPTY_OBJECT = Object.freeze({});

function buildStylePreferencesKey(stylePreferences) {
    if (!stylePreferences) return "";
    const sectionPart =
        stylePreferences.sectionColors &&
        typeof stylePreferences.sectionColors === "object"
            ? JSON.stringify(stylePreferences.sectionColors)
            : "";
    return [
        stylePreferences.dynamicColor || "",
        stylePreferences.headingFont || "",
        stylePreferences.bodyFont || "",
        sectionPart,
    ].join("|");
}

function buildProductIdsKey(products) {
    if (!Array.isArray(products) || products.length === 0) return "";
    return products
        .map((p) => String(p?.id || p?.handle || "").trim())
        .filter(Boolean)
        .join(",");
}

function hasGeneratedProductPagePayload(productPageData) {
    if (!productPageData || typeof productPageData !== "object") return false;
    const text = productPageData.text;
    if (text && typeof text === "object" && Object.keys(text).length > 0) return true;
    const images = productPageData.images;
    return Boolean(images && typeof images === "object" && Object.keys(images).length > 0);
}

/**
 * Component that renders liquid preview for either single-product or multi-product pages
 * 
 * @param {Object} props
 * @param {"single-product" | "multi-product"} props.productType - Type of product page
 * @param {"home-page" | "collection" | "product-page" | "contact-page" | "faq-page" | "not-found-page" | "about-page"} props.pageType - Type of page
 * @param {Object} props.productData - Product data (for single-product)
 * @param {string} props.detectedCategory - Category (for single-product)
 * @param {number} props.selectedTemplate - Template number (for single-product)
 * @param {Object} props.form - Form data (for single-product)
 * @param {string} props.storeName - Store name for preview header
 * @param {string} props.previewMode - Preview mode: "desktop" | "mobile"
 * @param {boolean} props.selectorMode - Whether selector mode is enabled
 * @param {string|null} props.selectedSection - Selected section ID
 * @param {"landing-page"|"entire-store"|"cinematic-home"} props.liquidPreviewType - Which static typography bundle to inline (API `/api/liquid-preview` `type`)
 * @param {Array|null} props.collectionProducts - Dashboard products for collection page preview (optional)
 * @param {"cod"|"prepaid"|null} props.marketType - Entire-store commerce model
 * @param {"classic"|"cinematic"|string|null} props.storeTemplatePack - Homepage pack (COD single cinematic)
 * @param {Object|null} props.productPageData - Generated product_page payload (COD premium PDP)
 * @param {boolean} props.usePremiumProductPage - Force premium category PDP (COD selected products)
 */
export default function LiquidPagePreview({
    productType = "single-product",
    pageType = "home-page",
    productData = null,
    collectionProducts = null,
    detectedCategory = null,
    selectedTemplate = 1,
    form = EMPTY_OBJECT,
    storeName = null,
    storeHeaderContent = null,
    previewMode = "desktop",
    selectorMode = false,
    selectedSection = null,
    stylePreferences = null,
    style = EMPTY_OBJECT,
    className = "",
    minHeight = "500px",
    liquidPreviewType = "landing-page",
    homeData = EMPTY_OBJECT,
    attachBelowChrome = false,
    marketType = null,
    storeTemplatePack = "classic",
    productPageData = null,
    usePremiumProductPage = null,
    omitCheckoutBlocks = null,
    prebuiltHtmlUrl = null,
    thumbnailMode = false,
}) {
    const categoryDefaults = useMemo(
        () => (detectedCategory ? getCategoryTemplate1Defaults(detectedCategory) : null),
        [detectedCategory]
    );

    // COD single always premium; COD multi only when caller marks this product as selected premium.
    // Fallback: any COD product tab uses premium (legacy) when flag omitted.
    const usePremiumPdp =
        pageType === "product-page" &&
        (usePremiumProductPage === true ||
            (usePremiumProductPage == null && marketType === "cod"));

    const premiumRows = useMemo(() => {
        if (!usePremiumPdp) return null;
        return buildStorePremiumPdpPreview({
            storeCategory: detectedCategory || "general",
            productPageData,
            shopifyProduct: productData,
            stylePreferences,
            selectedTemplate,
        }).templateRows;
    }, [
        usePremiumPdp,
        detectedCategory,
        productPageData,
        productData,
        stylePreferences,
        selectedTemplate,
    ]);

    const templatesConfig = useMemo(
        () => {
            if (usePremiumPdp && premiumRows) return premiumRows;
            return buildLiquidPageTemplatesConfig({
                productType,
                pageType,
                productData,
                collectionProducts,
                detectedCategory,
                selectedTemplate,
                form,
                stylePreferences,
                categoryDefaults,
                homeData,
                // Simple default product page for non-premium products (never strip home hero here).
                marketType: pageType === "product-page" ? "prepaid" : marketType,
                storeTemplatePack,
                omitCheckoutBlocks:
                    omitCheckoutBlocks == null
                        ? usePremiumProductPage === true || marketType === "cod"
                        : omitCheckoutBlocks,
            });
        },
        [
            usePremiumPdp,
            premiumRows,
            productType,
            pageType,
            productData,
            collectionProducts,
            detectedCategory,
            selectedTemplate,
            form,
            stylePreferences,
            categoryDefaults,
            homeData,
            marketType,
            storeTemplatePack,
            omitCheckoutBlocks,
            usePremiumProductPage,
        ]
    );

    const previewCacheKey = useMemo(() => {
        const productId = productData?.id ? String(productData.id) : "";
        return [
            LIQUID_PREVIEW_LAYOUT_REV,
            liquidPreviewType,
            productType,
            pageType,
            detectedCategory || "general",
            String(selectedTemplate),
            marketType || "",
            String(storeTemplatePack || "classic"),
            usePremiumPdp ? "premium" : "standard",
            hasGeneratedProductPagePayload(productPageData) ? "generated" : "demo",
            productId,
            buildProductIdsKey(collectionProducts),
            buildStylePreferencesKey(stylePreferences),
            // Bust cache when regenerate/edit changes image URLs or copy (CDN prefixes collide).
            fingerprintPageContent(homeData),
            fingerprintPageContent(productPageData),
        ].join("::");
    }, [
        liquidPreviewType,
        productType,
        pageType,
        detectedCategory,
        selectedTemplate,
        marketType,
        storeTemplatePack,
        usePremiumPdp,
        productPageData,
        productData?.id,
        collectionProducts,
        stylePreferences,
        homeData,
    ]);

    return (
        <LiquidPreviewRender
            templateRows={templatesConfig}
            previewMode={previewMode}
            selectedSection={selectedSection}
            storeName={storeName}
            storeHeaderContent={storeHeaderContent}
            selectorMode={selectorMode}
            stylePreferences={stylePreferences}
            style={style}
            className={className}
            minHeight={minHeight}
            liquidPreviewType={liquidPreviewType}
            attachBelowChrome={attachBelowChrome}
            previewCacheKey={previewCacheKey}
            prebuiltHtmlUrl={prebuiltHtmlUrl}
            thumbnailMode={thumbnailMode}
        />
    );
}
