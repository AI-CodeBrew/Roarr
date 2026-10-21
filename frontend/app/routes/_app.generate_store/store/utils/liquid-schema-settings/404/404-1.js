/**
 * 404 page preview defaults — pf-new-404
 * Matches theme section settings; `image` defaults for preview (schema default is unset).
 */

export const PREVIEW_ROUTES = {
    root_url: "/",
    all_products_collection_url: "/collections/all"
};

export const DEFAULT_NOT_FOUND_PAGE_SETTINGS = {
    "pf-new-404": {
        container_width: 1400,
        image_position: "right",
        color_scheme: "scheme-1",
        watermark_text: "404",
        watermark_gradient:
            "linear-gradient(180deg, rgba(251, 239, 234, 1), rgba(251, 239, 234, 0) 100%)",
        watermark_size_desktop: 24,
        watermark_size_mobile: 48,
        watermark_opacity: 80,
        subtitle: "Error 404",
        heading: "Looks like you strayed off the path.",
        heading_size_desktop: 56,
        heading_size_mobile: 40,
        text: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back to beauty.",
        text_size_desktop: 18,
        text_size_mobile: 16,
        btn_1_label: "Back to Home",
        btn_1_link: "",
        btn_1_bg: "#000000",
        btn_1_text: "#ffffff",
        btn_2_label: "Shop Best Sellers",
        btn_2_link: "",
        btn_2_bg: "rgba(0,0,0,0)",
        btn_2_text: "#000000",
        btn_2_border: "#000000",
        image:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80",
        image_radius: 24,
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40
    }
};
