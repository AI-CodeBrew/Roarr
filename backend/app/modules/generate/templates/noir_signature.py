"""
Noir product page (template 5) for every category.

Dark, confident, luxury copy in the Noir voice: short high-contrast serif headlines,
precise body lines, no exclamation marks. Every field is sized for the section that shows it.
"""

from pydantic import BaseModel, Field


class NoirTemplate(BaseModel):
    """Noir product page. Every line is sized for its section."""

    # Hero / buy box
    product_title: str = Field(
        description="Product title. 2 to 6 words. Confident and precise, fits one or two lines at a large serif size."
    )
    product_subtitle: str = Field(
        description="One sentence under the title. 12 to 20 words. What the product is and why it feels premium."
    )
    noir_collection: str = Field(
        description="Small gold uppercase label above the title. 1 to 3 words. The product type or line. Example The Signature Edition."
    )
    noir_price_note: str = Field(
        description="Small note under the price. 4 to 10 words. Example Taxes included. Complimentary shipping."
    )
    delivery_line: str = Field(
        description="Delivery strip sentence. 8 to 16 words. Example Order today and it ships within 1 to 2 working days."
    )
    badge_text_1: str = Field(description="Perk next to a shield icon. 2 to 3 words. Example 2-year warranty.")
    badge_text_2: str = Field(description="Perk next to a gift icon. 2 to 3 words. Example Gift-ready packaging.")
    badge_text_3: str = Field(description="Perk next to a return arrow icon. 2 to 3 words. Example 30-day returns.")
    noir_acc_1_title: str = Field(description="First accordion label. 1 word. Example Description.")
    noir_acc_1_body: str = Field(
        description="First accordion text, used when the product has no description. 30 to 50 words about the product."
    )
    noir_acc_2_title: str = Field(description="Second accordion label. 1 to 2 words. Example Specifications.")
    noir_acc_2_body: str = Field(
        description="Second accordion text. 25 to 45 words. Materials, size, finish and what is in the box, as one paragraph."
    )
    noir_acc_3_title: str = Field(description="Third accordion label. 2 to 3 words. Example Shipping & Returns.")
    noir_acc_3_body: str = Field(
        description="Third accordion text. 30 to 50 words. Delivery times, protective packaging and an easy return window."
    )

    # Ticker: thin gold band of short phrases
    noir_ticker_1: str = Field(description="Ticker phrase 1. 2 to 4 words. A product strength. Example Crafted to last.")
    noir_ticker_2: str = Field(description="Ticker phrase 2. 2 to 4 words. Different from the others.")
    noir_ticker_3: str = Field(description="Ticker phrase 3. 2 to 4 words. Different from the others.")
    noir_ticker_4: str = Field(description="Ticker phrase 4. 2 to 4 words. Different from the others.")

    # Statement: full-width image with a headline and three facts
    noir_statement_eyebrow: str = Field(description="Small gold uppercase label. 1 to 3 words. Example The standard.")
    noir_statement_heading: str = Field(
        description="Statement headline over a dark image. 4 to 8 words. Example Built for those who notice."
    )
    noir_fact_1_value: str = Field(
        description="Fact 1 value, very short. 1 to 6 characters. A real figure from the product context such as a size, weight, capacity, warranty or dispatch time. Example 350ml, 2 yr, 48h. Never invent percentages, ratings or survey results."
    )
    noir_fact_1_label: str = Field(description="Fact 1 label. 2 to 4 words explaining the value. Example Generous capacity.")
    noir_fact_2_value: str = Field(
        description="Fact 2 value, very short. 1 to 6 characters. A different real figure from the product context. Never invent percentages, ratings or survey results."
    )
    noir_fact_2_label: str = Field(description="Fact 2 label. 2 to 4 words explaining the value.")
    noir_fact_3_value: str = Field(
        description="Fact 3 value, very short. 1 to 6 characters. A different real figure, or a delivery or warranty promise. Never invent percentages, ratings or survey results."
    )
    noir_fact_3_label: str = Field(description="Fact 3 label. 2 to 4 words explaining the value.")

    # Craft: three portrait images with numbered captions
    noir_craft_eyebrow: str = Field(description="Small gold uppercase label. 1 to 3 words. Example The craft.")
    noir_craft_heading: str = Field(description="Section heading. 2 to 5 words. Example Every detail, considered.")
    noir_craft_text: str = Field(
        description="One sentence under the heading. 14 to 24 words. What makes the product well made."
    )
    noir_craft_1_title: str = Field(description="Card 1 title. 2 to 4 words. A specific detail of the product.")
    noir_craft_1_text: str = Field(description="Card 1 text. 12 to 20 words explaining that detail.")
    noir_craft_2_title: str = Field(description="Card 2 title. 2 to 4 words. A different detail.")
    noir_craft_2_text: str = Field(description="Card 2 text. 12 to 20 words.")
    noir_craft_3_title: str = Field(description="Card 3 title. 2 to 4 words. A different detail.")
    noir_craft_3_text: str = Field(description="Card 3 text. 12 to 20 words.")

    # Compare: this product against an ordinary alternative
    noir_compare_eyebrow: str = Field(description="Small gold uppercase label. 1 to 3 words. Example The difference.")
    noir_compare_heading: str = Field(description="Comparison heading. 3 to 6 words. Example Not all are made equal.")
    noir_compare_us: str = Field(description="Column label for this product. 1 to 2 words. Example Ours or a short product name.")
    noir_compare_them: str = Field(description="Column label for the alternative. 1 to 2 words. Example Ordinary or Others.")
    noir_compare_row_1: str = Field(description="Comparison row 1. 3 to 6 words. A benefit this product has. Example Premium materials throughout.")
    noir_compare_row_2: str = Field(description="Comparison row 2. 3 to 6 words. A different benefit.")
    noir_compare_row_3: str = Field(description="Comparison row 3. 3 to 6 words. A different benefit.")
    noir_compare_row_4: str = Field(description="Comparison row 4. 3 to 6 words. A different benefit.")
    noir_compare_row_5: str = Field(description="Comparison row 5. 3 to 6 words. About warranty, returns or support.")

    # FAQ
    noir_faq_heading: str = Field(description="FAQ heading. 2 to 4 words. Example Questions, answered.")
    noir_faq_text: str = Field(description="One line under the FAQ heading. 8 to 16 words inviting the shopper to get in touch.")
    noir_faq_q_1: str = Field(description="Question 1. 5 to 10 words. About how the product works or is used.")
    noir_faq_a_1: str = Field(description="Answer 1. 20 to 40 words.")
    noir_faq_q_2: str = Field(description="Question 2. 5 to 10 words. About size, fit or compatibility.")
    noir_faq_a_2: str = Field(description="Answer 2. 20 to 40 words.")
    noir_faq_q_3: str = Field(description="Question 3. 5 to 10 words. About care or durability.")
    noir_faq_a_3: str = Field(description="Answer 3. 20 to 40 words.")
    noir_faq_q_4: str = Field(description="Question 4. 5 to 10 words. About shipping or returns.")
    noir_faq_a_4: str = Field(description="Answer 4. 20 to 40 words.")

    # Closing: image with a final call to action
    noir_closing_eyebrow: str = Field(description="Small gold uppercase label. 1 to 3 words. Example Yours to keep.")
    noir_closing_heading: str = Field(description="Closing headline. 3 to 7 words. Example Made for the long run.")
    noir_closing_text: str = Field(
        description="Two short sentences. 18 to 30 words. A calm, confident reason to buy now."
    )
