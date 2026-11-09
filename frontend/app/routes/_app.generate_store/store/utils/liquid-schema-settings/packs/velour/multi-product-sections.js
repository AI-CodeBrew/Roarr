/**
 * Velour multi-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself, so the default mapping is enough.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

const section = (key, name) => ({ key, name: `Roarr - Velour ${name}`, applyHomeData: defaultApplyHomeData });

export const VELOUR_MULTI_PRODUCT_HOME_SECTIONS = [
    section("pf-velour-header", "Header"),
    section("pf-velour-slideshow", "Slideshow"),
    section("pf-velour-policy", "Policies"),
    section("pf-velour-gallery", "Gallery"),
    section("pf-velour-countdown", "Countdown"),
    section("pf-velour-showcase", "Showcase"),
    section("pf-velour-arrivals", "New Arrivals"),
    section("pf-velour-statement", "Statement"),
    section("pf-velour-lookbook", "Lookbook"),
    section("pf-velour-testimonials", "Testimonials"),
    section("pf-velour-story", "Story"),
    section("pf-velour-journal", "Journal"),
    section("pf-velour-faq", "FAQ"),
    section("pf-velour-footer", "Footer"),
];
