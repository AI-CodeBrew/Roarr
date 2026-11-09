/** Preview rows for Simmer's inner pages: the page section between the header and footer. */

const NAMES = {
    "pf-simmer-header": "Roarr - Simmer Header",
    "pf-simmer-collection": "Roarr - Simmer Collection",
    "pf-simmer-list-collections": "Roarr - Simmer Collection List",
    "pf-simmer-product": "Roarr - Simmer Product",
    "pf-simmer-policy": "Roarr - Simmer Policies",
    "pf-simmer-related": "Roarr - Simmer Related Products",
    "pf-simmer-footer": "Roarr - Simmer Footer",
};

function row(key, homeData, context, settings = {}) {
    return [
        {
            template: `packs/simmer/home/${key}`,
            displayName: NAMES[key],
            context: {
                cart: { item_count: 0, currency: { symbol: "$" } },
                ...context,
                section: {
                    id: `section_${key.replace(/-/g, "_")}`,
                    settings: { homeData, per_page: 12, ...settings },
                    blocks: [],
                },
            },
        },
    ];
}

export function buildSimmerPageRows({ sectionKey, homeData = {}, collection, collections, shop }) {
    const context = {
        shop,
        collection,
        collections: collections || homeData.demo_collection_list,
        paginate:
            collection?.products_count > collection?.products?.length
                ? { pages: 2, parts: [], current_page: 1, next: { url: "#" } }
                : { pages: 1, parts: [], current_page: 1 },
        page_title: "Collections",
    };
    const rows = [row("pf-simmer-header", homeData, context), row(sectionKey, homeData, context)];
    if (sectionKey === "pf-simmer-collection") rows.push(row("pf-simmer-policy", homeData, context, { row: true }));
    rows.push(row("pf-simmer-footer", homeData, context));
    return rows;
}

/** The Simmer product page: its own section and the policy row, as published. */
export function buildSimmerProductRows({ product, homeData = {}, shop }) {
    const context = { shop, product };
    return [
        row("pf-simmer-header", homeData, context),
        row("pf-simmer-product", homeData, context, homeData.demo_product_notes || {}),
        row("pf-simmer-policy", homeData, context, { row: true }),
        row("pf-simmer-related", homeData, context),
        row("pf-simmer-footer", homeData, context),
    ];
}

/** A shared page (contact, about, FAQ, 404) between the Simmer header and footer, as published. */
export function wrapWithSimmerChrome(rows, { homeData = {}, shop }) {
    return [
        row("pf-simmer-header", homeData, { shop }),
        ...rows,
        row("pf-simmer-footer", homeData, { shop }),
    ];
}
