/** Preview rows for Lustre's inner pages: the page section between the header and footer. */

const NAMES = {
    "pf-lustre-header": "Roarr - Lustre Header",
    "pf-lustre-collection": "Roarr - Lustre Collection",
    "pf-lustre-list-collections": "Roarr - Lustre Collection List",
    "pf-lustre-footer": "Roarr - Lustre Footer",
};

function row(key, homeData, context) {
    return [
        {
            template: `packs/lustre/home/${key}`,
            displayName: NAMES[key],
            context: {
                cart: { item_count: 0, currency: { symbol: "$" } },
                ...context,
                section: {
                    id: `section_${key.replace(/-/g, "_")}`,
                    settings: { homeData, per_page: 12 },
                    blocks: [],
                },
            },
        },
    ];
}

export function buildLustrePageRows({ sectionKey, homeData = {}, collection, collections, shop }) {
    const context = {
        shop,
        collection,
        collections,
        paginate: { pages: 1, parts: [], current_page: 1 },
        page_title: "Collections",
    };
    return ["pf-lustre-header", sectionKey, "pf-lustre-footer"].map((key) => row(key, homeData, context));
}

/** A shared page (product, contact, about, FAQ, 404) between the Lustre header and footer, as published. */
export function wrapWithLustreChrome(rows, { homeData = {}, shop }) {
    return [
        row("pf-lustre-header", homeData, { shop }),
        ...rows,
        row("pf-lustre-footer", homeData, { shop }),
    ];
}
