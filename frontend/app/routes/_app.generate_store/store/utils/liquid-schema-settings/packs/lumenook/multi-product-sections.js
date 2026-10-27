/**
 * Lumenook multi-product home preview: sections in render order.
 * Each section reads homeData.text / homeData.images itself, so the default mapping is enough.
 */

import { defaultApplyHomeData } from "../../home/single-product-sections.js";

export const LUMENOOK_MULTI_PRODUCT_HOME_SECTIONS = [
    { key: "pf-lumen-marquee", name: "Roarr - Lumenook Announcement", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-hero", name: "Roarr - Lumenook Hero", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-collections", name: "Roarr - Lumenook Collections", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-products", name: "Roarr - Lumenook Product Grid", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-split", name: "Roarr - Lumenook Feature Split", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-promise", name: "Roarr - Lumenook Promise", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-quote", name: "Roarr - Lumenook Quote", applyHomeData: defaultApplyHomeData },
    { key: "pf-lumen-faq", name: "Roarr - Lumenook FAQ", applyHomeData: defaultApplyHomeData },
];
