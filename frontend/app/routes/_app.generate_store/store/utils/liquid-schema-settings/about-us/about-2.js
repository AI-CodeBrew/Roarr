/**
 * About Us — pf-aboutus-page-H2 (tabbed split) preview defaults
 */

const TAB_BLOCK_HTML =
    "<p>Purifying yet non-stripping, this fruit enzyme-packed cleansing oil effortlessly melts away makeup while helping maintain skin's moisture barrier and pH balance. Designed for even the driest skin, the clean-rinsing formula is ultra-effective when used alone or as the first step in any double cleansing routine.</p>";

const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80";

export const DEFAULT_ABOUT_PAGE_H2_SETTINGS = {
    "pf-aboutus-page-H2": {
        container_width: 1400,
        container_radius: 20,
        image_position: "right",
        section_color_scheme: "scheme-1",
        panel_color_scheme: "scheme-2",
        tab_color: "#666666",
        tab_active_color: "#000000",
        tab_size: 18,
        subtitle_size: 14,
        heading_size_desktop: 40,
        heading_size_mobile: 28,
        text_size: 16,
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40
    }
};

/** Block order and settings for Liquid `section.blocks` */
export const DEFAULT_ABOUT_PAGE_H2_BLOCKS = [
    {
        id: "tab_Nn64ek",
        type: "tab",
        settings: {
            tab_title: "2022",
            subtitle: "Safety Ingredients",
            heading: "A fruit enzyme that helps exfoliate and soften skin",
            text: TAB_BLOCK_HTML,
            image: PLACEHOLDER_IMG
        }
    },
    {
        id: "tab_twpnjY",
        type: "tab",
        settings: {
            tab_title: "2024",
            subtitle: "Safety Ingredients",
            heading: "A fruit enzyme that helps exfoliate and soften skin",
            text: TAB_BLOCK_HTML,
            image: PLACEHOLDER_IMG
        }
    },
    {
        id: "tab_eBFgUK",
        type: "tab",
        settings: {
            tab_title: "2026",
            subtitle: "Safety Ingredients",
            heading: "A fruit enzyme that helps exfoliate and soften skin",
            text: TAB_BLOCK_HTML,
            image: PLACEHOLDER_IMG
        }
    }
];
