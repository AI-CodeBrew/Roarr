/**
 * Frost (template 6) demo product, used for the template card and preview in every category.
 * Copy in the Frost voice: bright, clear, friendly. Photos are drawn by scripts/build-demo-art.mjs.
 */

const img = (name) => `/frost-assets/${name}.jpg`;

export const FROST_DEFAULT_MAGIC_RESPONSES = {
  text: {
    product_title: "Glacier Insulated Bottle",
    product_subtitle:
      "A double-walled steel bottle that keeps water ice cold all day and coffee hot all morning.",
    frost_tag: "Cold for 24 hours",
    frost_price_note: "Taxes included. Free shipping over $50.",
    delivery_line: "Order today and it ships within 1 to 2 working days.",
    frost_chip_1: "Double-wall vacuum insulation",
    frost_chip_2: "Leak-proof twist cap",
    frost_chip_3: "Fits most cup holders",
    badge_text_1: "2-year warranty",
    badge_text_2: "30-day returns",
    badge_text_3: "Secure checkout",
    frost_acc_1_title: "Overview",
    frost_acc_1_body:
      "Glacier is a 750 ml stainless steel bottle with double-wall vacuum insulation. Drinks stay cold for 24 hours or hot for 12, and the outside never sweats in your bag.",
    frost_acc_2_title: "What's included",
    frost_acc_2_body:
      "One 750 ml Glacier bottle with a leak-proof twist cap and carry loop, plus a spare silicone seal. Packed in a recyclable cardboard tube.",
    frost_acc_3_title: "Shipping & Returns",
    frost_acc_3_body:
      "Ships within 1 to 2 working days. Free shipping on orders over $50. Changed your mind? Return it within 30 days for a full refund.",

    frost_bento_eyebrow: "Highlights",
    frost_bento_heading: "Small details, big difference",
    frost_bento_big_title: "Ice that lasts all day",
    frost_bento_big_text: "Fill it in the morning and it is still clinking with ice at dinner.",
    frost_stat_value: "24h",
    frost_stat_label: "Cold drinks, all day long",
    frost_tile_1_title: "Leak-proof cap",
    frost_tile_1_text: "A silicone seal and a firm twist keep your bag dry.",
    frost_tile_2_title: "Steel, not plastic",
    frost_tile_2_text: "18/8 stainless steel that keeps drinks tasting clean.",

    frost_steps_eyebrow: "How it works",
    frost_steps_heading: "Simple from the first sip",
    frost_step_1_title: "Fill",
    frost_step_1_text: "Add ice and water, or your morning coffee straight from the pot.",
    frost_step_2_title: "Seal",
    frost_step_2_text: "Twist the cap until it stops. It is now fully leak-proof.",
    frost_step_3_title: "Go",
    frost_step_3_text: "Drop it in your bag and enjoy the right temperature all day.",

    frost_specs_eyebrow: "Specs",
    frost_specs_heading: "The numbers that matter",
    frost_spec_1_label: "Capacity",
    frost_spec_1_value: "750 ml",
    frost_spec_2_label: "Keeps cold",
    frost_spec_2_value: "Up to 24 hours",
    frost_spec_3_label: "Keeps hot",
    frost_spec_3_value: "Up to 12 hours",
    frost_spec_4_label: "Material",
    frost_spec_4_value: "18/8 stainless steel",
    frost_spec_5_label: "Care",
    frost_spec_5_value: "Hand wash recommended",
    frost_spec_6_label: "Warranty",
    frost_spec_6_value: "2 years",

    frost_promise_heading: "Try it. Love it. Or send it back.",
    frost_promise_1_title: "Fast delivery",
    frost_promise_1_text: "Ships within 1 to 2 working days.",
    frost_promise_2_title: "30-day returns",
    frost_promise_2_text: "Not right for you? Send it back for a full refund.",
    frost_promise_3_title: "2-year warranty",
    frost_promise_3_text: "If the insulation fails, we replace it.",

    frost_faq_heading: "Quick answers",
    frost_faq_text: "Still wondering about something? Our team replies within one working day.",
    frost_faq_q_1: "Can I put hot drinks in it?",
    frost_faq_a_1: "Yes. Coffee and tea stay hot for up to 12 hours. Leave a little space at the top and close the cap gently.",
    frost_faq_q_2: "Will it fit my car cup holder?",
    frost_faq_a_2: "The base is 7.4 cm wide, which fits most car and bike cup holders.",
    frost_faq_q_3: "Is it dishwasher safe?",
    frost_faq_a_3: "We recommend hand washing to protect the powder coat and the vacuum seal. Warm soapy water is all it needs.",
    frost_faq_q_4: "What if it is not right for me?",
    frost_faq_a_4: "Return it within 30 days for a full refund. We will send you a prepaid label.",

    frost_closing_heading: "Ready when you are",
    frost_closing_text: "Order today and your Glacier is on its way within 1 to 2 working days, with free returns.",
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
