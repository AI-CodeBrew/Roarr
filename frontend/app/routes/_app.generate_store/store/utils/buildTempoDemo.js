/**
 * Tempo single-store demo: one pair of wireless headphones shown in the Tempo voice, with 3D renders
 * made locally (scripts/build-tempo-art.mjs → public/tempo-assets/). Used only for the in-app theme
 * card and preview before a merchant generates their own store; real generation writes fresh copy
 * and AI images from the merchant's product.
 */

const ART = {
  hero1: "/tempo-assets/hero-1.jpg",
  hero2: "/tempo-assets/hero-2.jpg",
  hero3: "/tempo-assets/hero-3.jpg",
  product: "/tempo-assets/product.jpg",
  detail: "/tempo-assets/detail.jpg",
  showcase: "/tempo-assets/showcase.jpg",
  story1: "/tempo-assets/story-1.jpg",
  story2: "/tempo-assets/story-2.jpg",
  story3: "/tempo-assets/story-3.jpg",
};

const TEMPO_STORE_TEXT = {
  demo_product_title: "Aero Wireless Headphones",
  demo_product_price: "$89.00",

  hero_kicker_1: "#Sound that moves with you",
  hero_heading_1: "Feel The Rhythm",
  hero_text_1: "Wireless headphones tuned for rich, full sound, whether you are on a train, at your desk or out for a run.",
  hero_kicker_2: "#Comfort for hours",
  hero_heading_2: "Soft On The Ears",
  hero_text_2: "Memory-foam cushions and a light frame keep them comfortable from the first track to the very last.",
  hero_kicker_3: "#Made for every day",
  hero_heading_3: "Ready To Go",
  hero_text_3: "Fold them flat, slip them in a bag and pick up exactly where you left off, wherever the day takes you.",
  hero_cta: "Explore More",
  hero_video_label: "View Video",

  arrivals_heading: "New Arrivals",
  arrivals_text: "Fresh from the workshop and ready to ship, meet the newest addition to the range.",
  featured_label: "Featured product",
  featured_heading: "Wireless Headphones For Music Lovers",
  featured_text:
    "Custom-tuned drivers give deep, controlled bass and clear highs. Pair them in seconds, charge them when you need to, and enjoy them every day.",
  featured_cta: "Buy Now",

  features_label: "Explore the awesome",
  features_heading: "Product Feature",
  feature_1_title: "Easy Pairing",
  feature_1_text: "Connect to your phone in seconds and reconnect on their own.",
  feature_2_title: "Long Listening",
  feature_2_text: "Plenty of playtime for the commute, the gym and beyond.",
  feature_3_title: "Clear Calls",
  feature_3_text: "A built-in microphone keeps every conversation easy to follow.",
  feature_4_title: "Comfort Fit",
  feature_4_text: "Soft cushions and a light frame you barely notice.",
  feature_5_title: "Rich Sound",
  feature_5_text: "Balanced drivers with deep bass and crisp, clear highs.",
  feature_6_title: "Fold Flat",
  feature_6_text: "Folds down to slip into any bag or jacket pocket.",
  feature_7_title: "Quick Charge",
  feature_7_text: "A short top-up when you are running low on time.",
  feature_8_title: "Simple Controls",
  feature_8_text: "Buttons on the ear cup you can find without looking.",

  split_heading: "Headphones Made For The Way You Live",
  split_text: "Every choice, from the cushions to the hinge, comes back to making daily listening a little easier.",
  split_1_title: "Everyday Use",
  split_1_text: "Made to slot into your routine so you can simply pick them up and go.",
  split_2_title: "Quality Finish",
  split_2_text: "Looks and feels as good in the hand as it sounds in the ears.",
  split_3_title: "Thoughtful Extras",
  split_3_text: "Small touches, like the carry pouch, that make daily use more enjoyable.",

  showcase_heading: "What you get",
  showcase_1_label: "Power",
  showcase_2_label: "Comfort",
  showcase_3_label: "Sound",
  showcase_4_label: "Pairing",
  showcase_5_label: "Playtime",
  showcase_6_label: "Care",

  gallery_label: "Awesome product",
  gallery_heading: "Take A Closer Look",
  gallery_1_title: "Front view",
  gallery_1_text: "See it up close",
  gallery_2_title: "Side view",
  gallery_2_text: "Every angle covered",
  gallery_3_title: "Detail view",
  gallery_3_text: "Finish you can feel",
  gallery_4_title: "Studio view",
  gallery_4_text: "Just as pictured",

  stories_label: "Featured stories",
  stories_heading: "Life With Aero",
  story_1_title: "At the desk",
  story_1_text: "Keeps pace with a busy day, from the first task to the last.",
  story_2_title: "On the move",
  story_2_text: "Light and ready, so they come along wherever you are headed.",
  story_3_title: "At home",
  story_3_text: "Just as good for quiet evenings as it is for busy mornings.",

  subscribe_label: "Subscribe area",
  subscribe_heading: "For Latest News",
  subscribe_placeholder: "email@example.com",
  subscribe_cta: "Subscribe",
};

const TEMPO_STORE_IMAGES = {
  tempo_hero_1: ART.hero1,
  tempo_hero_2: ART.hero2,
  tempo_hero_3: ART.hero3,
  tempo_product_image: ART.product,
  tempo_detail_image: ART.detail,
  tempo_showcase_image: ART.showcase,
  tempo_story_1: ART.story1,
  tempo_story_2: ART.story2,
  tempo_story_3: ART.story3,
};

/** Store-level home data for the Tempo demo/preview. Category is ignored: Tempo keeps one house look
 * for every category. */
export function buildTempoHomeData() {
  return {
    text: { ...TEMPO_STORE_TEXT },
    images: { ...TEMPO_STORE_IMAGES },
  };
}
