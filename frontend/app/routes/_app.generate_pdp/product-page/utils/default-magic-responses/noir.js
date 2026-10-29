/**
 * Noir (template 5) demo product, used for the template card and preview in every category.
 * Copy in the Noir voice: dark, confident, precise. Photos are drawn by scripts/build-demo-art.mjs.
 */

const img = (name) => `/noir-assets/${name}.jpg`;

export const NOIR_DEFAULT_MAGIC_RESPONSES = {
  text: {
    product_title: "Obsidian Automatic Watch",
    product_subtitle:
      "A matte black automatic with a sapphire crystal and brushed gold hands, made to be worn every day for decades.",
    noir_collection: "The Signature Edition",
    noir_price_note: "Taxes included. Complimentary express shipping.",
    delivery_line: "Order today and it ships within 1 to 2 working days, fully insured.",
    badge_text_1: "2-year warranty",
    badge_text_2: "Gift-ready box",
    badge_text_3: "30-day returns",
    noir_acc_1_title: "Description",
    noir_acc_1_body:
      "A self-winding automatic movement powered by the motion of your wrist. Matte black case, sapphire crystal and brushed gold hands that catch the light without shouting about it.",
    noir_acc_2_title: "Specifications",
    noir_acc_2_body:
      "42 mm stainless steel case with black PVD coating. Sapphire crystal. Water resistant to 100 m. Italian leather strap with quick-release pins. Arrives in a lacquered presentation box.",
    noir_acc_3_title: "Shipping & Returns",
    noir_acc_3_body:
      "Ships within 1 to 2 working days, fully insured and signed for. Not quite right? Return it unworn within 30 days for an exchange or a full refund.",

    noir_ticker_1: "Self-winding movement",
    noir_ticker_2: "Sapphire crystal",
    noir_ticker_3: "Italian leather",
    noir_ticker_4: "Insured delivery",

    noir_statement_eyebrow: "The standard",
    noir_statement_heading: "Built for those who notice",
    noir_fact_1_value: "42mm",
    noir_fact_1_label: "Case diameter",
    noir_fact_2_value: "100m",
    noir_fact_2_label: "Water resistance",
    noir_fact_3_value: "2 yr",
    noir_fact_3_label: "Warranty included",

    noir_craft_eyebrow: "The craft",
    noir_craft_heading: "Every detail, considered",
    noir_craft_text:
      "From the brushed hands to the hand-stitched strap, every part is chosen to look better the longer you wear it.",
    noir_craft_1_title: "Sapphire crystal",
    noir_craft_1_text: "Scratch resistant and perfectly clear, so the dial stays sharp for years.",
    noir_craft_2_title: "Brushed gold hands",
    noir_craft_2_text: "A soft champagne finish that reads clearly in any light.",
    noir_craft_3_title: "Italian leather",
    noir_craft_3_text: "Full-grain leather that softens and shapes itself to your wrist.",

    noir_compare_eyebrow: "The difference",
    noir_compare_heading: "Not all watches are equal",
    noir_compare_us: "Obsidian",
    noir_compare_them: "Others",
    noir_compare_row_1: "Automatic, no battery needed",
    noir_compare_row_2: "Scratch-resistant sapphire crystal",
    noir_compare_row_3: "Water resistant to 100 m",
    noir_compare_row_4: "Quick-release leather strap",
    noir_compare_row_5: "2-year warranty and easy returns",

    noir_faq_heading: "Questions, answered",
    noir_faq_text: "Something else on your mind? Our team replies within one working day.",
    noir_faq_q_1: "Does an automatic watch need a battery?",
    noir_faq_a_1:
      "No. The movement winds itself as you wear it. If you take it off for a few days, a few turns of the crown will set it running again.",
    noir_faq_q_2: "Will it fit my wrist?",
    noir_faq_a_2:
      "The 42 mm case sits well on most wrists, and the strap fits wrists from 15 to 21 cm. Extra holes can be added by any jeweller.",
    noir_faq_q_3: "Can I swim with it?",
    noir_faq_a_3:
      "It is water resistant to 100 m, so swimming is fine. Avoid hot showers and saunas, and keep the leather strap dry where you can.",
    noir_faq_q_4: "What if it is not right for me?",
    noir_faq_a_4:
      "Return it unworn within 30 days for an exchange or a full refund. We send a prepaid label and guide you through every step.",

    noir_closing_eyebrow: "Yours to keep",
    noir_closing_heading: "Made for the long run",
    noir_closing_text:
      "Wear it every day, pass it on one day. A watch built to outlast trends and keep perfect time.",
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
  color: "#C9A96E",
};
