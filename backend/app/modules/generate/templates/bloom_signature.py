"""
Bloom product page (template 8) for every category.

Soft, warm, benefit-led wellness copy: friendly serif headlines with one accented phrase,
plain reassuring body lines, no exclamation marks. Every field is sized for the section that shows it.

Trust rules, because this layout looks like a supplement page:
  - never invent certifications, lab results, "clinically tested" claims, awards, countries of origin,
    ratings, review counts, customer or expert names, discounts or percentages;
  - only state what the product context supports; when it does not, return an empty string for
    optional fields (the section simply hides that part).
Video stories, customer reviews and people photos are added by the merchant, not generated.

Headings that accent a phrase wrap it in square brackets, for example "Clean energy for focus without the [jitters.]".
"""

from pydantic import BaseModel, Field


class BloomTemplate(BaseModel):
    """Bloom product page. Every line is sized for its section."""

    # Hero / buy box
    product_title: str = Field(description="Product title. 2 to 6 words. Friendly and clear, fits one or two lines.")
    product_subtitle: str = Field(
        description="One sentence about what the product is and who it is for. 12 to 20 words."
    )
    bloom_perk_1: str = Field(description="Pill 1 next to a truck icon. 2 to 3 words about shipping. Example Free shipping.")
    bloom_perk_2: str = Field(description="Pill 2 next to a fast-delivery icon. 2 to 3 words about delivery speed. Example Fast delivery.")
    bloom_perk_3: str = Field(description="Pill 3 next to a card icon. 2 to 4 words about returns or refunds. Example 30-day returns.")
    bloom_badge_1: str = Field(
        description="Label under the first round badge beside the product photo. 1 to 3 words, a real attribute of the product such as Easy to use or Gentle formula. Never a certification or country unless the context states it, otherwise an empty string."
    )
    bloom_badge_2: str = Field(description="Label under the second round badge. 1 to 3 words, a different real attribute. Empty string if nothing true to say.")
    bloom_badge_3: str = Field(description="Label under the third round badge. 1 to 3 words, a different real attribute. Empty string if nothing true to say.")
    bloom_badge_4: str = Field(description="Label under the fourth round badge. 1 to 3 words, a different real attribute. Empty string if nothing true to say.")
    bloom_seal_text: str = Field(
        description="Words for the round stamp on the product photo, 2 words such as Clinically tested or Vegan formula. Return an empty string unless the product context explicitly supports it."
    )
    bloom_chip_1: str = Field(description="Benefit chip 1 under the thumbnails. 2 words naming an outcome. Example Clear thinking.")
    bloom_chip_2: str = Field(description="Benefit chip 2. 2 words, a different outcome.")
    bloom_chip_3: str = Field(description="Benefit chip 3. 2 words, a different outcome.")
    bloom_chip_4: str = Field(description="Benefit chip 4. 2 words, a different outcome.")
    bloom_tab_desc: str = Field(description="Text of the Description tab. 25 to 40 words about the product, plain and reassuring.")
    bloom_tab_benefits: str = Field(description="Text of the Benefits tab. 25 to 40 words about what the shopper gets from it.")
    bloom_tab_ingredients: str = Field(
        description="Text of the Ingredients or Materials tab. 20 to 40 words listing only ingredients or materials stated in the product context. If none are stated, return an empty string."
    )
    bloom_guarantee_bold: str = Field(description="Bold first sentence of the guarantee line. 4 to 8 words. Example Try it risk-free for 30 days.")
    bloom_guarantee_text: str = Field(
        description="Rest of the guarantee line. 12 to 22 words. A calm promise about easy returns, matching the perks above."
    )
    bloom_proof_line: str = Field(
        description="One short brand promise shown under the stars, 10 to 18 words, written as the store speaking. It is not a customer quote and names no person."
    )

    # Product showcase: three cards, each a product photo with a short caption (no people, no expert claims)
    bloom_experts_heading: str = Field(
        description="Heading above the three product cards. 4 to 8 words, wrap the 1 to 3 accent words in square brackets. About why people choose this product, for example Why [People Love] Petal. Never mention experts, doctors or endorsements."
    )
    bloom_experts_cta: str = Field(description="Button under the product cards. 2 to 5 words. Example Try it today.")
    bloom_showcase_1_title: str = Field(description="Card 1 title under a product photo. 2 to 4 words, a real, visible quality of the product.")
    bloom_showcase_1_text: str = Field(description="Card 1 text. 6 to 12 words, one plain sentence about that quality. No claims the context does not support.")
    bloom_showcase_2_title: str = Field(description="Card 2 title under a product photo. 2 to 4 words, a real, visible quality of the product.")
    bloom_showcase_2_text: str = Field(description="Card 2 text. 6 to 12 words, one plain sentence about that quality. No claims the context does not support.")
    bloom_showcase_3_title: str = Field(description="Card 3 title under a product photo. 2 to 4 words, a real, visible quality of the product.")
    bloom_showcase_3_text: str = Field(description="Card 3 text. 6 to 12 words, one plain sentence about that quality. No claims the context does not support.")

    # Comparison
    bloom_compare_us: str = Field(description="Name shown above this product's column. 1 to 3 words, the brand or product name.")
    bloom_compare_them: str = Field(description="Name above the other column. 1 to 3 words. Example Other brands.")
    bloom_compare_row_1: str = Field(description="Row 1, what this product offers. 4 to 9 words.")
    bloom_compare_them_row_1: str = Field(description="Row 1, the common weakness of other products. 4 to 9 words, the opposite of row 1.")
    bloom_compare_row_2: str = Field(description="Row 2, a different strength. 4 to 9 words.")
    bloom_compare_them_row_2: str = Field(description="Row 2, the opposite weakness. 4 to 9 words.")
    bloom_compare_row_3: str = Field(description="Row 3, a different strength. 4 to 9 words.")
    bloom_compare_them_row_3: str = Field(description="Row 3, the opposite weakness. 4 to 9 words.")
    bloom_compare_row_4: str = Field(description="Row 4, a different strength. 4 to 9 words.")
    bloom_compare_them_row_4: str = Field(description="Row 4, the opposite weakness. 4 to 9 words.")
    bloom_compare_row_5: str = Field(description="Row 5, about quality or support. 4 to 9 words.")
    bloom_compare_them_row_5: str = Field(description="Row 5, the opposite weakness. 4 to 9 words.")

    # Customer videos (videos are added by the merchant)
    bloom_stories_heading: str = Field(
        description="Heading above the customer videos. 3 to 5 words, wrap the first 2 words in square brackets. Example [Customer Story] in Video."
    )

    # FAQ and community
    bloom_faq_heading: str = Field(
        description="FAQ heading. 3 to 5 words, wrap the last word in square brackets. Example Your Questions, [Answered]."
    )
    bloom_faq_q_1: str = Field(description="Question 1. 4 to 9 words. How soon or how it works.")
    bloom_faq_a_1: str = Field(description="Answer 1. 20 to 40 words. Honest, no guaranteed results.")
    bloom_faq_q_2: str = Field(description="Question 2. 4 to 9 words. About safety or quality.")
    bloom_faq_a_2: str = Field(description="Answer 2. 20 to 40 words.")
    bloom_faq_q_3: str = Field(description="Question 3. 4 to 9 words. About using it with other products.")
    bloom_faq_a_3: str = Field(description="Answer 3. 20 to 40 words.")
    bloom_faq_q_4: str = Field(description="Question 4. 4 to 9 words. About suitability or diet.")
    bloom_faq_a_4: str = Field(description="Answer 4. 20 to 40 words.")
    bloom_faq_q_5: str = Field(description="Question 5. 4 to 9 words. About orders, subscriptions or returns.")
    bloom_faq_a_5: str = Field(description="Answer 5. 20 to 40 words.")
    bloom_community_heading: str = Field(
        description="Headline on the community card. 5 to 9 words about being supported on the journey. No member counts or numbers."
    )

    # How to use
    bloom_steps_heading: str = Field(
        description="How-to heading. 3 to 5 words, wrap the first 3 words in square brackets and end with the product name. Example [How To Use] Glow."
    )
    bloom_step_1_title: str = Field(description="Step 1 title. 3 to 5 words, starting with a verb.")
    bloom_step_1_text: str = Field(description="Step 1 text. 12 to 22 words, a clear instruction.")
    bloom_step_2_title: str = Field(description="Step 2 title. 3 to 5 words, starting with a verb.")
    bloom_step_2_text: str = Field(description="Step 2 text. 12 to 22 words, a clear instruction.")
    bloom_step_3_title: str = Field(description="Step 3 title. 3 to 5 words, about everyday use.")
    bloom_step_3_text: str = Field(description="Step 3 text. 12 to 22 words.")

    # Nutrition or supplement facts. Only when the product context states real values, else all empty strings.
    bloom_facts_title: str = Field(description="Title of the facts panel, for example Nutrition Facts or Supplement Facts. Empty string if the context has no facts.")
    bloom_facts_servings: str = Field(description="Servings line, for example 2 Servings per container. Empty string if not stated.")
    bloom_facts_size: str = Field(description="Serving size value, for example 1 cup (140g). Empty string if not stated.")
    bloom_facts_calories: str = Field(description="Calories number as written in the context. Empty string if not stated.")
    bloom_facts_rows: str = Field(
        description="Facts rows, one per line, formatted Name Amount | percent daily value. Put -- before an indented row. Example: Total Fat 8g | 10%. Use only values stated in the product context. Empty string if none are stated. Never invent values."
    )
    bloom_facts_note: str = Field(description="Small print under the facts, only if stated in the context. Otherwise an empty string.")

    # Ingredient spotlight (dark band). Only ingredients or materials named in the product context.
    bloom_ing_heading: str = Field(description="Heading of the ingredient spotlight. 3 to 6 words, wrap one accent word in square brackets. Example Skin-loving [ingredients], explained. Empty string if the context names no ingredients or materials.")
    bloom_ing_text: str = Field(description="One line under that heading. 10 to 18 words. Empty string if the context names no ingredients or materials.")
    bloom_ing_1_name: str = Field(description="Ingredient or material 1, exactly as named in the product context. 1 to 3 words. Empty string if fewer than 1 are named.")
    bloom_ing_1_text: str = Field(description="What ingredient 1 is there to do. 8 to 14 words, modest, no medical or guaranteed-result claims. Empty string if the name is empty.")
    bloom_ing_2_name: str = Field(description="Ingredient or material 2, exactly as named in the product context. 1 to 3 words. Empty string if fewer than 2 are named.")
    bloom_ing_2_text: str = Field(description="What ingredient 2 is there to do. 8 to 14 words, modest, no medical or guaranteed-result claims. Empty string if the name is empty.")
    bloom_ing_3_name: str = Field(description="Ingredient or material 3, exactly as named in the product context. 1 to 3 words. Empty string if fewer than 3 are named.")
    bloom_ing_3_text: str = Field(description="What ingredient 3 is there to do. 8 to 14 words, modest, no medical or guaranteed-result claims. Empty string if the name is empty.")
    bloom_ing_4_name: str = Field(description="Ingredient or material 4, exactly as named in the product context. 1 to 3 words. Empty string if fewer than 4 are named.")
    bloom_ing_4_text: str = Field(description="What ingredient 4 is there to do. 8 to 14 words, modest, no medical or guaranteed-result claims. Empty string if the name is empty.")

    # Benefits
    bloom_benefits_heading: str = Field(
        description="Benefits heading. 6 to 10 words, wrap the last word in square brackets. Example Clean energy for laser focus without the [jitters.]"
    )
    bloom_benefit_1_title: str = Field(description="Benefit 1 title. 2 to 3 words.")
    bloom_benefit_1_text: str = Field(description="Benefit 1 text. 10 to 16 words.")
    bloom_benefit_2_title: str = Field(description="Benefit 2 title. 2 to 3 words.")
    bloom_benefit_2_text: str = Field(description="Benefit 2 text. 10 to 16 words.")
    bloom_benefit_3_title: str = Field(description="Benefit 3 title. 2 to 3 words.")
    bloom_benefit_3_text: str = Field(description="Benefit 3 text. 10 to 16 words.")
    bloom_benefit_4_title: str = Field(description="Benefit 4 title. 2 to 3 words.")
    bloom_benefit_4_text: str = Field(description="Benefit 4 text. 10 to 16 words.")
    bloom_benefit_5_title: str = Field(description="Benefit 5 title. 2 to 3 words.")
    bloom_benefit_5_text: str = Field(description="Benefit 5 text. 10 to 16 words.")
    bloom_benefit_6_title: str = Field(description="Benefit 6 title. 2 to 3 words.")
    bloom_benefit_6_text: str = Field(description="Benefit 6 text. 10 to 16 words.")

    # Reviews heading (the reviews themselves are added by the merchant)
    bloom_reviews_heading: str = Field(description="Heading above the customer reviews. 3 to 6 words. Example What customers are saying. No countries, counts or ratings.")

    # Bundle builder and recently viewed
    bloom_bundle_heading: str = Field(
        description="Bundle heading. 3 to 5 words, wrap the last 1 to 2 words in square brackets. Example Build Your [Bundle]. No discount percentages."
    )
    bloom_recent_heading: str = Field(description="Heading above recently viewed products. 2 words, wrap the last in square brackets. Example Recently [Viewed].")

    # Closing banner
    bloom_closing_heading: str = Field(description="Banner headline. 4 to 8 words. No discount percentages or numbers unless in the context.")
    bloom_closing_text: str = Field(description="One sentence under the headline. 10 to 18 words, warm and inviting. No member counts.")
    bloom_closing_btn: str = Field(description="Banner button. 2 to 5 words. Example Build my bundle.")
