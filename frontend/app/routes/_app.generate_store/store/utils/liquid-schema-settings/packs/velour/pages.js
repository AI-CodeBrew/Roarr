/** Preview rows for Velour's inner pages: the page section between the header and footer. */

const NAMES = {
    "pf-velour-header": "Roarr - Velour Header",
    "pf-velour-collection": "Roarr - Velour Collection",
    "pf-velour-list-collections": "Roarr - Velour Collection List",
    "pf-velour-product": "Roarr - Velour Product",
    "pf-velour-policy": "Roarr - Velour Policies",
    "pf-velour-footer": "Roarr - Velour Footer",
};

function row(key, homeData, context, settings = {}) {
    return [
        {
            template: `packs/velour/home/${key}`,
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

export function buildVelourPageRows({ sectionKey, homeData = {}, collection, collections, shop }) {
    const context = {
        shop,
        collection,
        collections,
        paginate:
            collection?.products_count > collection?.products?.length
                ? { pages: 2, parts: [], current_page: 1, next: { url: "#" } }
                : { pages: 1, parts: [], current_page: 1 },
        page_title: "Collections",
    };
    const rows = [row("pf-velour-header", homeData, context), row(sectionKey, homeData, context)];
    if (sectionKey === "pf-velour-collection") rows.push(row("pf-velour-policy", homeData, context, { row: true }));
    rows.push(row("pf-velour-footer", homeData, context));
    return rows;
}

/** The Velour product page: its own section and the policy row, as published. */
export function buildVelourProductRows({ product, homeData = {}, shop }) {
    const context = { shop, product };
    return [
        row("pf-velour-header", homeData, context),
        row("pf-velour-product", homeData, context),
        row("pf-velour-policy", homeData, context, { row: true }),
        row("pf-velour-footer", homeData, context),
    ];
}

/** A shared page (contact, about, FAQ, 404) between the Velour header and footer, as published. */
export function wrapWithVelourChrome(rows, { homeData = {}, shop }) {
    return [
        row("pf-velour-header", homeData, { shop }),
        ...rows,
        row("pf-velour-footer", homeData, { shop }),
    ];
}
