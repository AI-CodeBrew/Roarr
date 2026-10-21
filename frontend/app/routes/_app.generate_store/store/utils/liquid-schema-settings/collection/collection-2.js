/**
 * Collection list grid — collection/collection-2
 * Manual blocks: image, title, link. Section: columns, spacing, typography (preview defaults).
 */

const IMG =
    "https://images.unsplash.com/photo-1522057384400-681b43cec0f8?w=800&q=80";
const IMG_2 =
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80";
const IMG_3 =
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80";
const IMG_4 =
    "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&q=80";

export const COLLECTION_2_DEFAULT_BLOCKS = [
    {
        id: "c2_item_2",
        type: "collection_item",
        settings: {
            image: IMG_2,
            title: "Home page",
            link: "/collections/home-page"
        }
    },
    {
        id: "c2_item_3",
        type: "collection_item",
        settings: {
            image: IMG_3,
            title: "Hydrogen",
            link: "/collections/hydrogen"
        }
    },
    {
        id: "c2_item_4",
        type: "collection_item",
        settings: {
            image: IMG_4,
            title: "Winter Sports Gear",
            link: "/collections/winter-sports-gear"
        }
    }
];

export const COLLECTION_2_SETTINGS = {
    "collection-2": {
        heading: "Collections",
        color_scheme: "scheme-1",
        columns_desktop: 3,
        columns_mobile: 2,
        grid_gap: 24,
        max_width: 1400,
        padding_top: 48,
        padding_bottom: 48,
        label_size: 14,
        heading_color: "#000000",
        label_color: "#333333",
        image_ratio: "3 / 4",
        image_border_radius: 0,
        section_background: "#ffffff",
        show_heading_divider: true,
        heading_divider_color: "#e5e5e5",
        heading_divider_thickness: 1,
        heading_to_divider_gap: 70,
        divider_to_grid_gap: 24
    }
};
