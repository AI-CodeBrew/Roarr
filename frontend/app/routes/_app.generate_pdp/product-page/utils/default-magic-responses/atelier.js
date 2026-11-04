/**
 * Atelier (template 7) demo product, used for the template card and preview in every category.
 * A fragrance in the Atelier voice: quiet, editorial, confident. Photos are crops of the Maison
 * three.js bottle renders, served from public/atelier-assets/.
 */

const img = (name) => `/atelier-assets/${name}.jpg`;

export const ATELIER_DEFAULT_MAGIC_RESPONSES = {
  text: {
    product_title: "Ambre Lumière Eau de Parfum",
    product_subtitle:
      "A warm amber fragrance in a weighted glass flacon with a brushed brass cap. Made to be worn close and kept for years.",
    atelier_eyebrow: "Eau de parfum · 50 ml",
    atelier_cta_primary: "Shop now",
    atelier_cta_secondary: "Discover the story",
    atelier_price_note: "Taxes included. Complimentary gift wrapping.",

    atelier_story_eyebrow: "The story",
    atelier_story_heading: "Light, held in amber",
    atelier_story_text:
      "Ambre Lumière began with a single idea: the last hour of sun on a warm wall. Resinous amber and soft vanilla sit at its heart, lifted by a bright opening and settling into a slow, skin-close trail.",
    atelier_story_point_1: "Blended and aged in small batches",
    atelier_story_point_2: "Weighted glass with a brushed brass cap",
    atelier_story_point_3: "Refillable flacon, made to be kept",
    atelier_story_signature: "Worn close, remembered long.",

    atelier_features_eyebrow: "In detail",
    atelier_features_heading: "Every part, considered",
    atelier_feature_1_title: "The cap",
    atelier_feature_1_text:
      "Solid brushed brass, cut square and weighted to close with a quiet, certain click. It is the first thing you touch and the last thing you notice.",
    atelier_feature_1_spec: "Solid brass · Brushed finish",
    atelier_feature_2_title: "The flacon",
    atelier_feature_2_text:
      "Thick, softly rounded glass that catches the light and holds the colour of the fragrance like a lantern.",
    atelier_feature_2_spec: "Weighted glass · 50 ml",
    atelier_feature_3_title: "The gift",
    atelier_feature_3_text:
      "Every bottle arrives in a lined ivory box with a gold band, ready to give or to keep on a shelf.",
    atelier_feature_3_spec: "Lined box · Gold band",
    atelier_feature_4_title: "The ritual",
    atelier_feature_4_text:
      "Two sprays at the wrist and neck in the evening. The opening is bright, the heart is warm, and the base lingers until morning.",
    atelier_feature_4_spec: "Evening wear · Long trail",

    delivery_line: "Order today and it ships within 1 to 2 working days, gift wrapped.",
    badge_text_1: "Authentic",
    badge_text_2: "Easy returns",
    badge_text_3: "Secure checkout",
    atelier_acc_1_title: "Details",
    atelier_acc_1_body:
      "Ambre Lumière is a warm amber eau de parfum. Bright citrus in the opening, a heart of amber resin and vanilla, and a soft, woody base that stays close to the skin.",
    atelier_acc_2_title: "Shipping",
    atelier_acc_2_body:
      "Orders ship within 1 to 2 working days in protective packaging. Tracking is sent by email as soon as your parcel leaves us.",
    atelier_acc_3_title: "Returns & refunds",
    atelier_acc_3_body:
      "Unopened bottles can be returned within 30 days for a full refund. Contact us and we will arrange everything.",
    atelier_acc_4_title: "Payment",
    atelier_acc_4_body: "Pay securely by card or with the express options shown at checkout.",
    atelier_in_stock: "In stock",
    atelier_low_stock: "Only [n] left",
    atelier_added: "Added to your bag",
    atelier_view_bag: "View bag",
    atelier_checkout: "Checkout",
    atelier_reviews_label: "reviews",

    atelier_specs_eyebrow: "Why it matters",
    atelier_specs_heading: "Quiet on the shelf, unforgettable on skin",
    atelier_specs_text:
      "A fragrance should feel like yours from the first wear. Ambre Lumière is built to stay close, last through the evening and age beautifully in its bottle.",
    atelier_specs_title: "Specifications",
    atelier_benefit_1_title: "Skin-close trail",
    atelier_benefit_1_text: "Warm and intimate rather than loud, noticed by those who come near.",
    atelier_benefit_2_title: "Evening to morning",
    atelier_benefit_2_text: "An eau de parfum concentration that carries from dinner into the next day.",
    atelier_benefit_3_title: "Made to be kept",
    atelier_benefit_3_text: "A refillable flacon and solid brass cap that look better with every year.",
    atelier_spec_1_label: "Family",
    atelier_spec_1_value: "Warm amber",
    atelier_spec_2_label: "Concentration",
    atelier_spec_2_value: "Eau de parfum",
    atelier_spec_3_label: "Volume",
    atelier_spec_3_value: "50 ml",
    atelier_spec_4_label: "Top",
    atelier_spec_4_value: "Bergamot, mandarin",
    atelier_spec_5_label: "Heart",
    atelier_spec_5_value: "Amber resin, vanilla",
    atelier_spec_6_label: "Base",
    atelier_spec_6_value: "Cedar, soft musk",

    atelier_proof_eyebrow: "Made to be lived with",
    atelier_proof_quote:
      "We wanted a fragrance you reach for without thinking, the one that becomes part of how you are remembered.",
    atelier_proof_by: "From the atelier",
    atelier_trust_1_title: "Shipped with care",
    atelier_trust_1_text: "Protective packaging and tracking on every order.",
    atelier_trust_2_title: "Easy returns",
    atelier_trust_2_text: "Unopened bottles can be returned within 30 days.",
    atelier_trust_3_title: "Secure checkout",
    atelier_trust_3_text: "Encrypted payment with the methods you already use.",
    atelier_trust_4_title: "Real people",
    atelier_trust_4_text: "Questions about a scent? We reply within a day.",

    atelier_related_eyebrow: "Continue exploring",
    atelier_related_heading: "You may also like",

    atelier_closing_eyebrow: "Ambre Lumière",
    atelier_closing_heading: "Make it your signature",
    atelier_closing_text: "Order today and it arrives gift wrapped, ready to wear tonight or to give to someone who deserves it.",
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
  color: "#B38B52",
};
