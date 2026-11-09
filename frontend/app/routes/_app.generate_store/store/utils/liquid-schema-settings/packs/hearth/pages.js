/** Preview rows for Hearth's inner pages: the page section between the header and footer. */

const NAMES = {
    "pf-hearth-header": "Roarr - Hearth Header",
    "pf-hearth-collection": "Roarr - Hearth Collection",
    "pf-hearth-list-collections": "Roarr - Hearth Collection List",
    "pf-hearth-product": "Roarr - Hearth Product",
    "pf-hearth-policy": "Roarr - Hearth Policies",
    "pf-hearth-related": "Roarr - Hearth Related Products",
    "pf-hearth-footer": "Roarr - Hearth Footer",
};

function row(key, homeData, context, settings = {}) {
    return [
        {
            template: `packs/hearth/home/${key}`,
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

export function buildHearthPageRows({ sectionKey, homeData = {}, collection, collections, shop }) {
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
    const rows = [row("pf-hearth-header", homeData, context), row(sectionKey, homeData, context)];
    if (sectionKey === "pf-hearth-collection") rows.push(row("pf-hearth-policy", homeData, context, { row: true }));
    rows.push(row("pf-hearth-footer", homeData, context));
    return rows;
}

/** The Hearth product page: its own section and the policy row, as published. */
export function buildHearthProductRows({ product, homeData = {}, shop }) {
    const context = { shop, product };
    return [
        row("pf-hearth-header", homeData, context),
        row("pf-hearth-product", homeData, context, homeData.demo_product_notes || {}),
        row("pf-hearth-policy", homeData, context, { row: true }),
        row("pf-hearth-related", homeData, context),
        row("pf-hearth-footer", homeData, context),
    ];
}

/** A shared page (contact, about, FAQ, 404) between the Hearth header and footer, as published. */
export function wrapWithHearthChrome(rows, { homeData = {}, shop }) {
    return [
        row("pf-hearth-header", homeData, { shop }),
        ...rows,
        row("pf-hearth-footer", homeData, { shop }),
    ];
}
