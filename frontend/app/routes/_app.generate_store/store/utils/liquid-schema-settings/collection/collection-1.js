/**
 * Collection page preview defaults — pf-prem-collections
 * Wire LiquidPagePreview (or collection tab) with collection + cart + paginate context.
 */

export const COLLECTION_1_SETTINGS = {
    "pf-prem-collections": {
        max_width: 1400,
        padding_top: 36,
        padding_bottom: 36,
        products_per_page: 12,
        columns_desktop: 3,
        columns_mobile: "2",
        grid_gap: 30,
        card_bg_color: "#f5f5f5",
        card_border_radius: 24,
        image_ratio: "1 / 1",
        show_atc_desktop: false,
        text_color: "#000000",
        type_color: "#757575",
        show_vendor: true,
        title_size: 18,
        price_size: 16,
        type_size: 14,
        enable_filtering: true,
        enable_sorting: true
    }
};

/** Mock collection + cart + paginate for preview rendering */
export const COLLECTION_1_PREVIEW_CONTEXT = {
    paginate: { pages: 1, current_page: 1 },
    cart: {
        currency: { symbol: "$" }
    },
    collection: {
        products_count: 6,
        sort_by: "manual",
        sort_options: [
            { value: "manual", name: "Featured" },
            { value: "best-selling", name: "Best selling" },
            { value: "title-ascending", name: "Alphabetically, A–Z" },
            { value: "price-ascending", name: "Price, low to high" },
            { value: "price-descending", name: "Price, high to low" }
        ],
        filters: [
            {
                type: "list",
                label: "Availability",
                param_name: "filter.v.availability",
                values: [
                    { param_name: "filter.v.availability", value: "1", label: "In stock", count: 4, active: false },
                    { param_name: "filter.v.availability", value: "0", label: "Out of stock", count: 2, active: false }
                ]
            },
            {
                type: "price_range",
                label: "Price",
                range_max: 10000,
                min_value: { param_name: "filter.v.price.gte", value: null },
                max_value: { param_name: "filter.v.price.lte", value: null }
            }
        ],
        products: [
            {
                id: "p1",
                title: "Sample product one",
                url: "/products/sample-one",
                price: 2999,
                available: true,
                type: "Skincare",
                vendor: "Brand",
                featured_image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
                variants: [{ id: "v1" }]
            },
            {
                id: "p2",
                title: "Sample product two",
                url: "/products/sample-two",
                price: 4599,
                available: true,
                type: "Skincare",
                vendor: "Brand",
                featured_image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
                variants: [{ id: "v2" }, { id: "v3" }]
            },
            {
                id: "p3",
                title: "Sample product three",
                url: "/products/sample-three",
                price: 1999,
                available: true,
                type: "Body",
                vendor: "Brand",
                featured_image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
                variants: [{ id: "v4" }]
            },
            {
                id: "p4",
                title: "Sample product four",
                url: "/products/sample-four",
                price: 3299,
                available: false,
                type: "Hair",
                vendor: "Brand",
                featured_image: null,
                variants: [{ id: "v5" }]
            },
            {
                id: "p5",
                title: "Sample product five",
                url: "/products/sample-five",
                price: 5499,
                available: true,
                type: "Skincare",
                vendor: "Brand",
                featured_image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
                variants: [{ id: "v6" }]
            },
            {
                id: "p6",
                title: "Sample product six",
                url: "/products/sample-six",
                price: 2499,
                available: true,
                type: "Body",
                vendor: "Brand",
                featured_image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png",
                variants: [{ id: "v7" }]
            }
        ]
    }
};
