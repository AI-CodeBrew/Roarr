/**
 * Theme CSS/JS content for Liquid preview (raw text imports for inlining)
 * This file imports CSS/JS as raw text to be inlined directly into HTML,
 * eliminating separate HTTP requests and improving LCP.
 */

// CSS assets - imported as raw text (two typography sources; see getCssContentForPreviewType)
import typographyCssApp from "../assets/typography.css?raw";
import typographyCssEntireStore from "../routes/_app.generate_store/store/utils/liquid-css-settings/typography.css?raw";
import accordionCss from "../assets/accordion.css?raw";
import beforeAfterCss from "../assets/before-after.css?raw";
import buyNowButtonCss from "../assets/buy-now-button.css?raw";
import circularFeatureRingCss from "../assets/circular-feature-ring.css?raw";
import comparisonTableCss from "../assets/comparison-table.css?raw";
import deliveryEstimatorCss from "../assets/delivery-estimator.css?raw";
import editableImageOverlayCss from "../assets/editable-image-overlay.css?raw";
import faqCss from "../assets/faq.css?raw";
import newFaqCss from "../assets/new-faq.css?raw";
import frequentlyBoughtCss from "../assets/frequently-bought.css?raw";
import bentoGridCss from "../assets/bento-grid.css?raw";
import pillowBannerCss from "../assets/pillow-banner.css?raw";
import trustBadgesCss from "../assets/trust-badges.css?raw";
import fourBlocksCss from "../assets/four-blocks.css?raw";
import headingSubheadingCss from "../assets/heading-subheading.css?raw";
import imageGalleryCss from "../assets/image-gallery.css?raw";
import imageWithTextCss from "../assets/image-with-text.css?raw";
import impactStatCss from "../assets/impact-stat.css?raw";
import productDetailsCss from "../assets/product-details.css?raw";
import productSectionCss from "../assets/product-section.css?raw";
import heroSectionCss from "../assets/hero-section.css?raw";
import textMarqueeCss from "../assets/text-marquee.css?raw";
import pfColorSchemesCss from "../assets/pf-color-schemes.css?raw";
import pfKHeroPeekSliderCss from "../assets/pf-k-hero-peek-slider.css?raw";
import marqueeScrollingBannerCss from "../assets/marquee-scrolling-banner.css?raw";
import pfCustomNewImageWithTextCss from "../assets/pf-custom-new-image-with-text.css?raw";
import pfNewFeaturesCenterImageCss from "../assets/pf-new-features-center-image.css?raw";
import pfInlineHeadlineCss from "../assets/pf-inline-headline.css?raw";
import pfNewIngredsFeaturesCss from "../assets/pf-new-ingreds-features.css?raw";
import pfTrustBadgesCss from "../assets/pf-trust-badges.css?raw";
import pfTestimonials01Css from "../assets/pf-testimonials01.css?raw";
import pfSplitFeatureCss from "../assets/pf-split-feature.css?raw";
import pfFaqSplitimageCss from "../assets/pf-faq-splitimage.css?raw";
import pfCollectionShowcaseCss from "../assets/pf-collection-showcase.css?raw";
import pfFeatureProductSectionCss from "../assets/pf-feature-product-section.css?raw";
import pfFeatureBannerCss from "../assets/pf-feature-banner.css?raw";
import infiniteMarqueeCss from "../assets/infinite-marquee.css?raw";
import pfProductLookbookCss from "../assets/pf-product-lookbook.css?raw";
import pfProductGrid1x1Css from "../assets/pf-product-grid1x1.css?raw";
import pfSelectedProd3in1Css from "../assets/pf-selected-prod-3in1.css?raw";
import collectionListCss from "../assets/collection-list.css?raw";
import pfNewDefaultProductHeroCss from "../assets/pf-new-default-product-hero.css?raw";
import pfNewDefaultprodFaqCss from "../assets/pf-new-defaultprod-FAQ.css?raw";
import bundleCss from "../assets/bundle.css?raw";
import pfPremCollectionsCss from "../assets/pf-prem-collections.css?raw";
import pfNewContactCss from "../assets/pf-new-contact.css?raw";
import pfAboutusPageH1Css from "../assets/pf-aboutus-page-H1.css?raw";
import pfAboutusPageH2Css from "../assets/pf-aboutus-page-H2.css?raw";
import pfNewFaqPageCss from "../assets/pf-new-FAQ-page.css?raw";
import pfNew404Css from "../assets/pf-new-404.css?raw";

// JS assets - imported as raw text
import beforeAfterJs from "../assets/before-after.js?raw";
import deliveryEstimatorJs from "../assets/delivery-estimator.js?raw";
import fourBlocksJs from "../assets/four-blocks.js?raw";
import imageGalleryJs from "../assets/image-gallery.js?raw";
import impactStatJs from "../assets/impact-stat.js?raw";
import productDetailsJs from "../assets/product-details.js?raw";
import productSectionJs from "../assets/product-section.js?raw";
import heroSectionJs from "../assets/hero-section.js?raw";
import newFaqJs from "../assets/new-faq.js?raw";
import frequentlyBoughtJs from "../assets/frequently-bought.js?raw";
import pfKHeroPeekSliderJs from "../assets/pf-k-hero-peek-slider.js?raw";
import pfNewFeaturesCenterImageJs from "../assets/pf-new-features-center-image.js?raw";
import pfInlineHeadlineJs from "../assets/pf-inline-headline.js?raw";
import pfNewIngredsFeaturesJs from "../assets/pf-new-ingreds-features.js?raw";
import pfTestimonials01Js from "../assets/pf-testimonials01.js?raw";
import pfFaqSplitimageJs from "../assets/pf-faq-splitimage.js?raw";
import pfCollectionShowcaseJs from "../assets/pf-collection-showcase.js?raw";
import pfFeatureProductSectionJs from "../assets/pf-feature-product-section.js?raw";
import pfFeatureBannerJs from "../assets/pf-feature-banner.js?raw";
import pfProductLookbookJs from "../assets/pf-product-lookbook.js?raw";
import pfProductGrid1x1Js from "../assets/pf-product-grid1x1.js?raw";
import pfNewDefaultProductHeroJs from "../assets/pf-new-default-product-hero.js?raw";
import pfNewDefaultprodFaqJs from "../assets/pf-new-defaultprod-FAQ.js?raw";
import pfPremCollectionsJs from "../assets/pf-prem-collections.js?raw";
import pfNewContactJs from "../assets/pf-new-contact.js?raw";
import pfAboutusPageH1Js from "../assets/pf-aboutus-page-H1.js?raw";
import pfAboutusPageH2Js from "../assets/pf-aboutus-page-H2.js?raw";
import pfNew404Js from "../assets/pf-new-404.js?raw";

/** CSS chunks after typography (order must match previous CSS_CONTENT). */
const CSS_CHUNKS_AFTER_TYPOGRAPHY = [
    accordionCss,
    beforeAfterCss,
    buyNowButtonCss,
    circularFeatureRingCss,
    comparisonTableCss,
    deliveryEstimatorCss,
    editableImageOverlayCss,
    faqCss,
    newFaqCss,
    frequentlyBoughtCss,
    bentoGridCss,
    pillowBannerCss,
    trustBadgesCss,
    fourBlocksCss,
    headingSubheadingCss,
    imageGalleryCss,
    imageWithTextCss,
    impactStatCss,
    productDetailsCss,
    productSectionCss,
    heroSectionCss,
    textMarqueeCss,
    pfColorSchemesCss,
    pfKHeroPeekSliderCss,
    marqueeScrollingBannerCss,
    pfCustomNewImageWithTextCss,
    pfNewFeaturesCenterImageCss,
    pfInlineHeadlineCss,
    pfNewIngredsFeaturesCss,
    pfTrustBadgesCss,
    pfTestimonials01Css,
    pfSplitFeatureCss,
    pfFaqSplitimageCss,
    pfCollectionShowcaseCss,
    pfFeatureProductSectionCss,
    pfFeatureBannerCss,
    infiniteMarqueeCss,
    pfProductLookbookCss,
    pfProductGrid1x1Css,
    pfSelectedProd3in1Css,
    collectionListCss,
    pfNewDefaultProductHeroCss,
    pfNewDefaultprodFaqCss,
    bundleCss,
    pfPremCollectionsCss,
    pfNewContactCss,
    pfAboutusPageH1Css,
    pfAboutusPageH2Css,
    pfNewFaqPageCss,
    pfNew404Css
];

/**
 * Base static CSS for Liquid preview with the correct typography bundle.
 * @param {string} [type] - `"entire-store"` uses theme settings typography;
 *   `"cinematic-home"` is a slim pack (self-styled sections — no classic section CSS);
 *   anything else uses app/assets typography + full classic chunks.
 */
export function getCssContentForPreviewType(type) {
    if (type === "cinematic-home") {
        // Cinematic liquids ship their own <style> blocks; only keep scheme vars + tiny typography.
        return [typographyCssApp, pfColorSchemesCss].join("\n");
    }
    const typography =
        type === "entire-store" ? typographyCssEntireStore : typographyCssApp;
    return [typography, ...CSS_CHUNKS_AFTER_TYPOGRAPHY].join("\n");
}

/** Default base CSS (landing-page / non–entire-store): app/assets typography + sections */
export const CSS_CONTENT = getCssContentForPreviewType("landing-page");

/** All JS content for Liquid preview (scripts as raw text) */
export const JS_CONTENT = [
    beforeAfterJs,
    deliveryEstimatorJs,
    fourBlocksJs,
    imageGalleryJs,
    impactStatJs,
    productDetailsJs,
    productSectionJs,
    heroSectionJs,
    newFaqJs,
    frequentlyBoughtJs,
    pfKHeroPeekSliderJs,
    pfNewFeaturesCenterImageJs,
    pfInlineHeadlineJs,
    pfNewIngredsFeaturesJs,
    pfTestimonials01Js,
    pfFaqSplitimageJs,
    pfCollectionShowcaseJs,
    pfFeatureProductSectionJs,
    pfFeatureBannerJs,
    pfProductLookbookJs,
    pfProductGrid1x1Js,
    pfNewDefaultProductHeroJs,
    pfNewDefaultprodFaqJs,
    pfPremCollectionsJs,
    pfNewContactJs,
    pfAboutusPageH1Js,
    pfAboutusPageH2Js,
    pfNew404Js
].join("\n");

/**
 * JS bundle for preview type. Cinematic home has no classic section scripts.
 * @param {string} [type]
 */
export function getJsContentForPreviewType(type) {
    if (type === "cinematic-home") return "";
    return JS_CONTENT;
}

/**
 * Reinit hooks for preview type.
 * @param {string} [type]
 */
export function getReinitHooksForPreviewType(type) {
    if (type === "cinematic-home") return [];
    return REINIT_HOOKS;
}

export const REINIT_HOOKS = [
    "initBeforeAfter",
    "initImageGallery",
    "initFourBlocksCarousel",
    "initImpactStatDials",
    "initProductDetails",
    "initProductSection",
    "initHeroSection",
    "initNewFaq",
    "initFrequentlyBought",
    "initCollectionShowcase",
    "initFeatureProductSection",
    "initFeatureBanner",
    "initProductLookbook",
    "initProductGrid1x1",
    "initTestimonialsSlider",
    "initModernProductHero"
];
