/**
 * Maison single-store demo: one fragrance shown in the Maison voice, with 3D renders made locally
 * (scripts/build-maison-art.mjs → public/maison-assets/). Used only for the in-app theme card
 * and preview before a merchant generates their own store; real generation writes fresh copy
 * and AI images from the merchant's product.
 */

const ART = {
  hero: "/maison-assets/hero.jpg",
  inline: "/maison-assets/inline.jpg",
  piece: "/maison-assets/piece.jpg",
  gallery1: "/maison-assets/gallery-1.jpg",
  gallery2: "/maison-assets/gallery-2.jpg",
  gallery3: "/maison-assets/gallery-3.jpg",
  craft: "/maison-assets/craft.jpg",
  banner: "/maison-assets/banner.jpg",
};

const MAISON_STORE_TEXT = {
  demo_product_title: "Ambre Lumière Eau de Parfum",
  demo_product_price: "$185.00",

  announce_1: "Complimentary delivery",
  announce_2: "Hand-poured in small batches",
  announce_3: "Gift-ready packaging",

  hero_eyebrow: "Eau de parfum · 50 ml",
  hero_heading: "Warmth you can wear",
  hero_subheading:
    "Amber, soft vanilla and a breath of cedar, composed to sit close to the skin and linger long after you leave the room.",
  hero_cta: "Discover the scent",

  intro_eyebrow: "Our belief",
  intro_heading: "A fragrance should feel like a memory you choose to keep, not a statement made to be noticed.",
  intro_body:
    "So we compose slowly, with fewer notes and finer ones. What remains is quiet, warm and entirely your own.",

  piece_eyebrow: "The scent",
  piece_heading: "Composed in three movements",
  piece_body:
    "It opens bright with bergamot, settles into a heart of amber and iris, then dries down to cedar and soft vanilla that stays with you through the evening.",
  piece_point_1_title: "Top",
  piece_point_1_text: "Calabrian bergamot and a whisper of pink pepper.",
  piece_point_2_title: "Heart",
  piece_point_2_text: "Golden amber folded into powdery iris.",
  piece_point_3_title: "Base",
  piece_point_3_text: "Atlas cedar and Madagascan vanilla, warm and lasting.",
  piece_cta: "View the scent",

  gallery_eyebrow: "In situ",
  gallery_heading: "Seen in a quiet light",
  gallery_title_1: "The ritual",
  gallery_text_1: "Two sprays at the pulse, and the day softens.",
  gallery_title_2: "Still life",
  gallery_text_2: "Weighted glass and a brushed brass cap.",
  gallery_title_3: "At home",
  gallery_text_3: "As beautiful on the dresser as on the skin.",

  craft_eyebrow: "The craft",
  craft_heading: "Poured by hand, aged with patience",
  craft_body:
    "Each batch rests for six weeks before bottling so the notes can marry. Every bottle is filled, capped and inspected by hand.",
  craft_stat_1_value: "6 wks",
  craft_stat_1_label: "Maceration",
  craft_stat_2_value: "50 ml",
  craft_stat_2_label: "Weighted glass",
  craft_stat_3_value: "100%",
  craft_stat_3_label: "Hand inspected",

  quote_text: "Luxury is not what you add. It is what you have the confidence to leave out.",
  quote_attribution: "The Maison promise",

  promise_heading: "Our promises",
  promise_1_label: "Craftsmanship",
  promise_1_text: "Every bottle is filled and checked by hand before it leaves us.",
  promise_2_label: "Secure delivery",
  promise_2_text: "Carefully packed and sent with tracking, straight to your door.",
  promise_3_label: "Easy returns",
  promise_3_text: "Unopened and not quite right? Send it back within 30 days.",
  promise_4_label: "Personal care",
  promise_4_text: "A real person reads and answers every message you send.",

  faq_heading: "Good to know",
  faq_question_1: "How long does the scent last?",
  faq_answer_1:
    "As an eau de parfum it wears for around eight hours on skin. It lasts longer still on clothing and hair.",
  faq_question_2: "Is it suitable as a gift?",
  faq_answer_2:
    "Yes. Every bottle arrives in our ivory gift box, and we can add a handwritten note at checkout.",
  faq_question_3: "What if it is not for me?",
  faq_answer_3:
    "Return it unopened within 30 days for a full refund. Our team is always happy to help you choose.",

  closing_eyebrow: "An invitation",
  closing_heading: "Bring home a scent worth keeping",
  closing_text: "Order today and we will wrap it with the same care it was made with.",
  closing_cta: "Make it yours",
};

const MAISON_STORE_IMAGES = {
  maison_hero_image: ART.hero,
  maison_inline_image: ART.inline,
  maison_piece_image: ART.piece,
  maison_gallery_1: ART.gallery1,
  maison_gallery_2: ART.gallery2,
  maison_gallery_3: ART.gallery3,
  maison_craft_image: ART.craft,
  maison_banner_image: ART.banner,
};

/** Store-level home data for the Maison demo/preview. Category is ignored: Maison keeps one
 * house look for every category. */
export function buildMaisonHomeData() {
  return {
    text: { ...MAISON_STORE_TEXT },
    images: { ...MAISON_STORE_IMAGES },
  };
}
