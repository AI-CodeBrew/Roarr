/**
 * Lumenook (template 4) demo product, used for the template card and preview in every category.
 * Same stoneware pour-over set photos as the home_kitchen Vibe demo; copy in the Lumenook voice.
 */

const IMG = {
  front: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/42147457_home-kitchen-vibe-1.png",
  brewing: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c04d538_home-kitchen-vibe-2.png",
  inHand: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a83c6cc6_home-kitchen-vibe-3.png",
  angle: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/83880b79_home-kitchen-vibe-4.png",
  detail: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/706a6361_home-kitchen-vibe-5.png",
};

export const LUMENOOK_DEFAULT_MAGIC_RESPONSES = {
  text: {
    product_title: "Stoneware Pour-Over Set",
    product_subtitle:
      "A hand-glazed dripper and mug that turn the first coffee of the day into a quiet, unhurried ritual.",
    lumen_eyebrow: "Coffee set",
    lumen_price_note: "Taxes included. Shipping calculated at checkout.",
    lumen_delivery_heading: "Free delivery over $75",
    delivery_line: "Order today and it ships within 1 to 2 working days, packed with care.",
    badge_text_1: "2-year warranty",
    badge_text_2: "Cash on delivery",
    badge_text_3: "Secure checkout",
    badge_text_4: "14-day returns",
    lumen_acc_1_title: "Description",
    lumen_acc_1_body:
      "A stoneware dripper that sits neatly on its matching mug. Add a filter and your favourite grounds, pour slowly, and let the coffee find its own pace. Warm, speckled glaze in a soft oat tone.",
    lumen_acc_2_title: "Details",
    lumen_acc_2_body:
      "Hand-glazed stoneware. Mug holds 350 ml. Dripper fits size 2 paper filters. Each piece is finished by hand, so small variations in the glaze make every set a little different.",
    lumen_acc_3_title: "Care",
    lumen_acc_3_body:
      "Dishwasher and microwave safe. For the longest life, wash by hand with warm water and avoid sudden changes in temperature.",
    lumen_acc_4_title: "Shipping & Returns",
    lumen_acc_4_body:
      "Ships within 1 to 2 working days in protective, plastic-free packaging. Not quite right? Return it unused within 14 days for an exchange or a full refund.",

    lumen_detail_eyebrow: "In detail",
    lumen_detail_heading: "A closer look",
    lumen_detail_text:
      "The speckled glaze, the soft curve of the handle, the way the dripper settles onto the rim. Small details that make it worth keeping.",

    lumen_feature_eyebrow: "Why you will love it",
    lumen_feature_heading: "A slower morning",
    lumen_point_1_title: "Brew and sip",
    lumen_point_1_text: "The dripper rests on the mug, so there is nothing else to wash.",
    lumen_point_2_title: "Even extraction",
    lumen_point_2_text: "A ribbed inner wall keeps the coffee flowing at a steady pace.",
    lumen_point_3_title: "Holds the heat",
    lumen_point_3_text: "Thick stoneware keeps your coffee warm a little longer.",
    lumen_point_4_title: "Easy to place",
    lumen_point_4_text: "Calm, neutral tones that sit well on any counter or desk.",
    lumen_point_5_title: "Made to last",
    lumen_point_5_text: "Durable glaze that keeps its look after years of daily use.",
    lumen_point_6_title: "Ready to gift",
    lumen_point_6_text: "Arrives beautifully boxed, with room for a handwritten note.",

    lumen_details_heading: "The details",
    lumen_detail_1_title: "Hand-glazed stoneware",
    lumen_detail_1_text:
      "Each piece is dipped and finished by hand, giving the glaze its soft, speckled depth. No two sets look exactly alike.",
    lumen_detail_2_title: "Made for slow pours",
    lumen_detail_2_text:
      "The ribbed cone guides water evenly through the grounds, so every cup tastes balanced, round and clear.",
    lumen_detail_3_title: "Comfortable in the hand",
    lumen_detail_3_text:
      "A generous handle and a weighty base make it the mug you reach for first, morning after morning.",

    lumen_circle_eyebrow: "The way we choose",
    lumen_circle_heading: "Chosen with care",
    lumen_circle_1_title: "Considered design",
    lumen_circle_1_text: "Chosen for its form as much as its function.",
    lumen_circle_2_title: "Calm rituals",
    lumen_circle_2_text: "Made for slow mornings and quiet corners.",
    lumen_circle_3_title: "Made to live with",
    lumen_circle_3_text: "Sits comfortably in any kitchen or on any desk.",
    lumen_circle_4_title: "Delivered with care",
    lumen_circle_4_text: "Packed carefully and sent straight to your door.",
    lumen_circle_5_title: "Ready to gift",
    lumen_circle_5_text: "Add a note and we will tuck it inside.",
    lumen_circle_6_title: "Here to help",
    lumen_circle_6_text: "Questions before or after you buy? Just ask.",

    lumen_mood_eyebrow: "Everyday ritual",
    lumen_mood_heading: "Made to be lived with",
    lumen_mood_text:
      "Chosen for how it feels every day, not just how it photographs. A small ritual that earns its place and stays there.",
    lumen_mood_cta: "Explore the collection",
  },
  images: {
    product_images: {
      product_image_1: IMG.brewing,
      product_image_2: IMG.front,
      product_image_3: IMG.inHand,
      product_image_4: IMG.angle,
      product_image_5: IMG.detail,
    },
    body_images: {
      product_highlight_1: IMG.brewing,
      product_highlight_2: IMG.inHand,
      product_highlight_3: IMG.angle,
      feature_image: IMG.brewing,
      product_impact_image: IMG.inHand,
    },
  },
  color: "#B08D57",
};
