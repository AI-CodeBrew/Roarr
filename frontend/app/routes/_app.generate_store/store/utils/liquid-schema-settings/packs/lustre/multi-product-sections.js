/**
 * Lustre multi-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself, so the default mapping is enough.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

const section = (key, name) => ({ key, name: `Roarr - Lustre ${name}`, applyHomeData: defaultApplyHomeData });

export const LUSTRE_MULTI_PRODUCT_HOME_SECTIONS = [
    section("pf-lustre-header", "Header"),
    section("pf-lustre-hero", "Hero"),
    section("pf-lustre-marquee", "Marquee"),
    section("pf-lustre-about", "About"),
    section("pf-lustre-categories", "Categories"),
    section("pf-lustre-banners", "Banners"),
    section("pf-lustre-trending", "Trending"),
    section("pf-lustre-split", "Split"),
    section("pf-lustre-services", "Services"),
    section("pf-lustre-promos", "Promos"),
    section("pf-lustre-featured", "Featured"),
    section("pf-lustre-testimonials", "Testimonials"),
    section("pf-lustre-blog", "Blog"),
    section("pf-lustre-cross-ticker", "Cross Ticker"),
    section("pf-lustre-footer", "Footer"),
];
