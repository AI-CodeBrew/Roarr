/**
 * Frost (template 6) demo product, used for the template card and preview in every category.
 * A fashion product in the Frost voice: bright, clear, friendly. Photos are the store's own
 * "Are We Even Alive" hoodie images, served from public/frost-assets/.
 */

const img = (name) => `/frost-assets/${name}.jpg`;

export const FROST_DEFAULT_MAGIC_RESPONSES = {
  text: {
    product_title: "Are We Even Alive Hoodie",
    product_subtitle:
      "A heavyweight black hoodie with a full skull collage on the back and skeletal artwork running down both sleeves.",
    frost_tag: "Back and sleeve prints",
    frost_price_note: "Taxes included. Free shipping over $50.",
    delivery_line: "Order today and it ships within 1 to 2 working days.",
    frost_chip_1: "Heavyweight fleece",
    frost_chip_2: "Relaxed unisex fit",
    frost_chip_3: "Soft brushed inside",
    badge_text_1: "Quality guaranteed",
    badge_text_2: "30-day returns",
    badge_text_3: "Secure checkout",
    frost_acc_1_title: "Overview",
    frost_acc_1_body:
      "A black pullover hoodie built around one statement: \"Any Means Necessary\" across the shoulders, a detailed skull collage down the back and \"Are We Even Alive?\" at the hem. Skeletal artwork runs the length of both sleeves.",
    frost_acc_2_title: "Fit & Fabric",
    frost_acc_2_body:
      "Heavyweight cotton-blend fleece with a soft brushed inside. Relaxed unisex fit with dropped shoulders, a lined hood with drawcords, ribbed cuffs and hem. Take your usual size, or size up for a looser look.",
    frost_acc_3_title: "Shipping & Returns",
    frost_acc_3_body:
      "Ships within 1 to 2 working days. Free shipping on orders over $50. Wrong size? Exchange or return it unworn within 30 days.",

    frost_bento_eyebrow: "Highlights",
    frost_bento_heading: "Wear the question",
    frost_bento_big_title: "Made to be lived in",
    frost_bento_big_text: "Heavy enough to feel substantial, soft enough to wear from morning to midnight.",
    frost_stat_value: "3",
    frost_stat_label: "Print zones: the back and both sleeves",
    frost_tile_1_title: "Prints that last",
    frost_tile_1_text: "Crisp, high-contrast artwork made to stay bold wash after wash.",
    frost_tile_2_title: "Built for layering",
    frost_tile_2_text: "Dropped shoulders and a roomy body sit easily over a tee or under a jacket.",

    frost_steps_eyebrow: "How to wear it",
    frost_steps_heading: "Three ways it works",
    frost_step_1_title: "Pull it on",
    frost_step_1_text: "The brushed inside feels soft from the very first wear, no breaking in.",
    frost_step_2_title: "Hood up",
    frost_step_2_text: "A lined, structured hood with drawcords keeps its shape and frames your face.",
    frost_step_3_title: "Head out",
    frost_step_3_text: "Throw it over anything. It looks as right on the street as it does on the sofa.",

    frost_specs_eyebrow: "Details",
    frost_specs_heading: "Everything you want to know",
    frost_spec_1_label: "Fabric",
    frost_spec_1_value: "Heavyweight cotton-blend fleece",
    frost_spec_2_label: "Fit",
    frost_spec_2_value: "Relaxed unisex, dropped shoulders",
    frost_spec_3_label: "Print",
    frost_spec_3_value: "Back and both sleeves",
    frost_spec_4_label: "Hood",
    frost_spec_4_value: "Lined, with drawcords",
    frost_spec_5_label: "Colour",
    frost_spec_5_value: "Black",
    frost_spec_6_label: "Care",
    frost_spec_6_value: "Cold wash inside out",

    frost_promise_heading: "Wear it. Love it. Or send it back.",
    frost_promise_1_title: "Fast delivery",
    frost_promise_1_text: "Ships within 1 to 2 working days.",
    frost_promise_2_title: "Easy exchanges",
    frost_promise_2_text: "Wrong size? Swap it within 30 days.",
    frost_promise_3_title: "Real support",
    frost_promise_3_text: "Questions about sizing? We reply within a day.",

    frost_faq_heading: "Quick answers",
    frost_faq_text: "Still wondering about fit or care? Our team replies within one working day.",
    frost_faq_q_1: "How does the hoodie fit?",
    frost_faq_a_1: "It has a relaxed unisex fit with dropped shoulders. Take your usual size for a classic look, or size up if you like it oversized.",
    frost_faq_q_2: "Is the print on the front too?",
    frost_faq_a_2: "The main artwork is on the back, with skeletal designs down both sleeves. The front is kept clean so the back does the talking.",
    frost_faq_q_3: "How do I keep the print looking new?",
    frost_faq_a_3: "Wash it cold and inside out, skip the bleach and let it air dry. Never iron directly over the print.",
    frost_faq_q_4: "What if it does not fit?",
    frost_faq_a_4: "Exchange or return it unworn within 30 days. We will help you pick the right size.",

    frost_closing_heading: "Ask the question out loud",
    frost_closing_text: "Order today and your hoodie is on its way within 1 to 2 working days, with easy size exchanges.",
  },
  images: {
    product_images: {
      product_image_1: img("product_image_1"),
      product_image_2: img("product_image_2"),
      product_image_3: img("product_image_3"),
      product_image_4: img("product_image_4"),
      product_image_5: img("product_image_5"),
    },
    body_images: {
      product_highlight_1: img("product_highlight_1"),
      product_highlight_2: img("product_highlight_2"),
      product_highlight_3: img("product_highlight_3"),
      feature_image: img("feature_image"),
      product_impact_image: img("product_impact_image"),
    },
  },
  color: "#2F5BFF",
};
