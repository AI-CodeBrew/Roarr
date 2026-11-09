/**
 * Hearth multi-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself, so the default mapping is enough.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

const section = (key, name) => ({ key, name: `Roarr - Hearth ${name}`, applyHomeData: defaultApplyHomeData });

export const HEARTH_MULTI_PRODUCT_HOME_SECTIONS = [
    section("pf-hearth-header", "Header"),
    section("pf-hearth-slideshow", "Slideshow"),
    section("pf-hearth-policy", "Policies"),
    section("pf-hearth-gallery", "Gallery"),
    section("pf-hearth-countdown", "Countdown"),
    section("pf-hearth-showcase", "Showcase"),
    section("pf-hearth-arrivals", "New Arrivals"),
    section("pf-hearth-statement", "Statement"),
    section("pf-hearth-lookbook", "Lookbook"),
    section("pf-hearth-testimonials", "Testimonials"),
    section("pf-hearth-story", "Story"),
    section("pf-hearth-journal", "Journal"),
    section("pf-hearth-faq", "FAQ"),
    section("pf-hearth-ticker", "Ticker"),
    section("pf-hearth-footer", "Footer"),
];
