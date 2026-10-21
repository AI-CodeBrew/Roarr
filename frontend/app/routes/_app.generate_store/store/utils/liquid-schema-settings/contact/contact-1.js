/**
 * Contact page preview defaults — pf-new-contact
 */

export const DEFAULT_CONTACT_PAGE_SETTINGS = {
    "pf-new-contact": {
        color_scheme: "scheme-1",
        container_width: 1400,
        section_radius: 24,
        image_position: "left",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        overlay_color: "#000000",
        overlay_opacity: 70,
        img_heading: "New York",
        img_heading_size: 48,
        img_text_color: "#ffffff",
        address: "4b/39 James St, Fortitude Valley QLD 4006",
        phone: "+391 (0)35 2568",
        hours: "Mon-Sat: 10am-8pm",
        btn_1_label: "Get Directions",
        btn_1_link: "",
        btn_1_bg: "#ffffff",
        btn_1_text: "#000000",
        form_color_scheme: "scheme-2",
        form_heading: "Get in Touch",
        form_heading_size: 42,
        input_bg: "#ffffff",
        input_border: "rgba(0,0,0,0)",
        input_focus: "#000000",
        input_radius: 30,
        btn_2_label: "Submit Now",
        btn_2_bg: "#000000",
        btn_2_text: "#ffffff",
        padding_top_desktop: 60,
        padding_bottom_desktop: 60,
        padding_top_mobile: 40,
        padding_bottom_mobile: 40
    }
};

/** Mock contact form state for Liquid preview */
export const CONTACT_PREVIEW_FORM = {
    posted_successfully: false,
    errors: null,
    name: "",
    email: "",
    phone: "",
    body: ""
};
