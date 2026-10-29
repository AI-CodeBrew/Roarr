"""
Frost product page (template 6) for every category.

Bright, modern, clear copy in the Frost voice: short plain-spoken headlines, concrete benefits,
friendly and confident, no hype. Every field is sized for the section that shows it.
"""

from pydantic import BaseModel, Field


class FrostTemplate(BaseModel):
    """Frost product page. Every line is sized for its section."""

    # Hero / buy card
    product_title: str = Field(
        description="Product title. 2 to 6 words. Clear and modern, fits one or two lines at a large bold size."
    )
    product_subtitle: str = Field(
        description="One sentence under the title. 12 to 20 words. What the product does and the main benefit."
    )
    frost_tag: str = Field(
        description="Small pill above the title. 2 to 5 words. The headline benefit. Example Keeps drinks cold for 24h."
    )
    frost_price_note: str = Field(
        description="Small note under the price. 4 to 10 words. Example Taxes included. Free shipping over $50."
    )
    delivery_line: str = Field(
        description="Delivery line in the buy card. 8 to 16 words. Example Order today and it ships within 1 to 2 working days."
    )
    frost_chip_1: str = Field(description="Highlight chip 1 with a check icon. 2 to 4 words. A key feature.")
    frost_chip_2: str = Field(description="Highlight chip 2. 2 to 4 words. A different key feature.")
    frost_chip_3: str = Field(description="Highlight chip 3. 2 to 4 words. A different key feature.")
    badge_text_1: str = Field(description="Trust item next to a shield icon. 2 to 3 words. Example 2-year warranty.")
    badge_text_2: str = Field(description="Trust item next to a return arrow icon. 2 to 3 words. Example 30-day returns.")
    badge_text_3: str = Field(description="Trust item next to a lock icon. 2 to 3 words. Example Secure checkout.")
    frost_acc_1_title: str = Field(description="First accordion label. 1 word. Example Overview.")
    frost_acc_1_body: str = Field(
        description="First accordion text, used when the product has no description. 30 to 50 words about the product."
    )
    frost_acc_2_title: str = Field(description="Second accordion label. 1 to 2 words. Example What's included.")
    frost_acc_2_body: str = Field(
        description="Second accordion text. 20 to 40 words. What comes in the box, as one paragraph."
    )
    frost_acc_3_title: str = Field(description="Third accordion label. 2 to 3 words. Example Shipping & Returns.")
    frost_acc_3_body: str = Field(
        description="Third accordion text. 30 to 50 words. Delivery times, packaging and an easy return window."
    )

    # Bento highlights: big image tile, a stat tile and two small tiles
    frost_bento_eyebrow: str = Field(description="Small accent label. 1 to 3 words. Example Highlights.")
    frost_bento_heading: str = Field(description="Section heading. 3 to 6 words. Example Small details, big difference.")
    frost_bento_big_title: str = Field(description="Title over the big image tile. 2 to 5 words. The main benefit.")
    frost_bento_big_text: str = Field(description="Line over the big image tile. 10 to 18 words.")
    frost_stat_value: str = Field(
        description="Big number in the stat tile, very short. 1 to 6 characters. A real figure from the product context such as hours, capacity, weight or warranty. Example 24h, 750ml. Never invent percentages, ratings or survey results."
    )
    frost_stat_label: str = Field(description="Stat label. 3 to 7 words explaining the number. Example Cold drinks, all day long.")
    frost_tile_1_title: str = Field(description="Small tile 1 title. 2 to 4 words. A specific feature.")
    frost_tile_1_text: str = Field(description="Small tile 1 text. 8 to 14 words.")
    frost_tile_2_title: str = Field(description="Small tile 2 title. 2 to 4 words. A different feature.")
    frost_tile_2_text: str = Field(description="Small tile 2 text. 8 to 14 words.")

    # How it works: three numbered steps with images
    frost_steps_eyebrow: str = Field(description="Small accent label. 1 to 3 words. Example How it works.")
    frost_steps_heading: str = Field(description="Steps heading. 3 to 6 words. Example Simple from day one.")
    frost_step_1_title: str = Field(description="Step 1 title. 1 to 3 words. The first thing the shopper does.")
    frost_step_1_text: str = Field(description="Step 1 text. 10 to 18 words.")
    frost_step_2_title: str = Field(description="Step 2 title. 1 to 3 words.")
    frost_step_2_text: str = Field(description="Step 2 text. 10 to 18 words.")
    frost_step_3_title: str = Field(description="Step 3 title. 1 to 3 words. The everyday result.")
    frost_step_3_text: str = Field(description="Step 3 text. 10 to 18 words.")

    # Specifications: six label / value rows
    frost_specs_eyebrow: str = Field(description="Small accent label. 1 to 2 words. Example Specs.")
    frost_specs_heading: str = Field(description="Specs heading. 2 to 5 words. Example The numbers that matter.")
    frost_spec_1_label: str = Field(description="Spec row 1 label. 1 to 3 words. Example Capacity, Material, Size.")
    frost_spec_1_value: str = Field(
        description="Spec row 1 value. 1 to 6 words. Use only facts from the product context; if unknown, describe a quality rather than inventing a number."
    )
    frost_spec_2_label: str = Field(description="Spec row 2 label. 1 to 3 words.")
    frost_spec_2_value: str = Field(description="Spec row 2 value. 1 to 6 words. Facts from the product context only.")
    frost_spec_3_label: str = Field(description="Spec row 3 label. 1 to 3 words.")
    frost_spec_3_value: str = Field(description="Spec row 3 value. 1 to 6 words. Facts from the product context only.")
    frost_spec_4_label: str = Field(description="Spec row 4 label. 1 to 3 words.")
    frost_spec_4_value: str = Field(description="Spec row 4 value. 1 to 6 words. Facts from the product context only.")
    frost_spec_5_label: str = Field(description="Spec row 5 label. 1 to 3 words. Example Care.")
    frost_spec_5_value: str = Field(description="Spec row 5 value. 1 to 6 words.")
    frost_spec_6_label: str = Field(description="Spec row 6 label. 1 to 3 words. Example Warranty.")
    frost_spec_6_value: str = Field(description="Spec row 6 value. 1 to 6 words.")

    # Promise band: accent-colour band with three guarantees
    frost_promise_heading: str = Field(description="Promise band heading. 3 to 7 words. Example Try it. Love it. Or send it back.")
    frost_promise_1_title: str = Field(description="Guarantee 1 title. 2 to 4 words. About delivery.")
    frost_promise_1_text: str = Field(description="Guarantee 1 text. 6 to 12 words.")
    frost_promise_2_title: str = Field(description="Guarantee 2 title. 2 to 4 words. About returns.")
    frost_promise_2_text: str = Field(description="Guarantee 2 text. 6 to 12 words.")
    frost_promise_3_title: str = Field(description="Guarantee 3 title. 2 to 4 words. About warranty or support.")
    frost_promise_3_text: str = Field(description="Guarantee 3 text. 6 to 12 words.")

    # Quick answers: four FAQ cards
    frost_faq_heading: str = Field(description="FAQ heading. 2 to 4 words. Example Quick answers.")
    frost_faq_text: str = Field(description="One line under the FAQ heading. 10 to 18 words inviting the shopper to get in touch.")
    frost_faq_q_1: str = Field(description="Question 1. 4 to 9 words. About how the product works or is used.")
    frost_faq_a_1: str = Field(description="Answer 1. 15 to 30 words.")
    frost_faq_q_2: str = Field(description="Question 2. 4 to 9 words. About size, fit or compatibility.")
    frost_faq_a_2: str = Field(description="Answer 2. 15 to 30 words.")
    frost_faq_q_3: str = Field(description="Question 3. 4 to 9 words. About care or durability.")
    frost_faq_a_3: str = Field(description="Answer 3. 15 to 30 words.")
    frost_faq_q_4: str = Field(description="Question 4. 4 to 9 words. About shipping or returns.")
    frost_faq_a_4: str = Field(description="Answer 4. 15 to 30 words.")

    # Closing: centred call to action over a wide image
    frost_closing_heading: str = Field(description="Closing headline. 3 to 7 words. Example Ready when you are.")
    frost_closing_text: str = Field(description="One sentence. 12 to 22 words. A friendly, clear reason to order today.")
