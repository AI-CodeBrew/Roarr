/**
 * Simmer multi-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself, so the default mapping is enough.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

const section = (key, name) => ({ key, name: `Roarr - Simmer ${name}`, applyHomeData: defaultApplyHomeData });

export const SIMMER_MULTI_PRODUCT_HOME_SECTIONS = [
    section("pf-simmer-header", "Header"),
    section("pf-simmer-slideshow", "Slideshow"),
    section("pf-simmer-countdown", "Countdown"),
    section("pf-simmer-line", "Divider"),
    section("pf-simmer-picks", "Category Picks"),
    section("pf-simmer-line-2", "Divider"),
    section("pf-simmer-arrivals", "New Arrivals"),
    section("pf-simmer-brands", "Brands"),
    section("pf-simmer-gallery", "Gallery"),
    section("pf-simmer-testimonials", "Testimonials"),
    section("pf-simmer-lookbook", "Lookbook"),
    section("pf-simmer-faq", "FAQ"),
    section("pf-simmer-policy", "Policies"),
    section("pf-simmer-footer", "Footer"),
];
