"""
Lumenook product page (template 4) for every category.

Calm, premium, editorial copy in the Lumenook voice: short serif headlines, warm and
understated body lines, no hype. Every field is sized for the section that shows it.
"""

from pydantic import BaseModel, Field


class LumenookTemplate(BaseModel):
    """Lumenook product page. Every line is sized for its section."""

    # Hero / buy box
    product_title: str = Field(
        description="Product title. 2 to 6 words. Calm and descriptive, fits one or two lines at a large serif size."
    )
    product_subtitle: str = Field(
        description="One sentence under the title. 12 to 20 words. What the product is and the feeling it brings."
    )
    lumen_eyebrow: str = Field(
        description="Product type shown small above the title and in the breadcrumb. 1 to 3 words. Example Table lamp, Desk organiser, Face serum."
    )
    lumen_price_note: str = Field(
        description="Small note under the price. 4 to 10 words. Example Taxes included. Shipping calculated at checkout."
    )
    lumen_delivery_heading: str = Field(
        description="Small uppercase heading of the delivery panel. 2 to 5 words. Example Free delivery over $75."
    )
    delivery_line: str = Field(
        description="Delivery panel sentence. 8 to 16 words. Example Order today and it ships within 1 to 2 working days."
    )
    badge_text_1: str = Field(description="Trust row item next to a shield icon. 2 to 3 words. Example 2-year warranty.")
    badge_text_2: str = Field(description="Trust row item next to a payment icon. 2 to 3 words. Example Cash on delivery.")
    badge_text_3: str = Field(description="Trust row item next to a lock icon. 2 to 3 words. Example Secure checkout.")
    badge_text_4: str = Field(description="Trust row item next to a return arrow icon. 2 to 3 words. Example 14-day returns.")
    lumen_acc_1_title: str = Field(description="First accordion label. 1 word. Example Description.")
    lumen_acc_1_body: str = Field(
        description="First accordion text, used when the product has no description. 30 to 50 words about the product."
    )
    lumen_acc_2_title: str = Field(description="Second accordion label. 1 to 2 words. Example Details or Specifications.")
    lumen_acc_2_body: str = Field(
        description="Second accordion text. 25 to 45 words. Materials, size, finish and what is included, written as one paragraph."
    )
    lumen_acc_3_title: str = Field(description="Third accordion label. 1 to 2 words. Example Care.")
    lumen_acc_3_body: str = Field(description="Third accordion text. 20 to 35 words. How to care for and look after the product.")
    lumen_acc_4_title: str = Field(description="Fourth accordion label. 2 to 3 words. Example Shipping & Returns.")
    lumen_acc_4_body: str = Field(
        description="Fourth accordion text. 30 to 50 words. Delivery times, careful packing and an easy return window."
    )

    # In detail (image row)
    lumen_detail_eyebrow: str = Field(description="Small uppercase label. 1 to 3 words. Example In detail.")
    lumen_detail_heading: str = Field(description="Heading next to the image row. 2 to 5 words. Example A closer look.")
    lumen_detail_text: str = Field(
        description="One or two calm sentences. 20 to 32 words. The shape, the finish and the small details worth noticing."
    )

    # Feature: framed image and six numbered points
    lumen_feature_eyebrow: str = Field(description="Small uppercase label. 2 to 4 words. Example Why you will love it.")
    lumen_feature_heading: str = Field(description="Feature heading. 2 to 5 words. Example Made to be seen.")
    lumen_point_1_title: str = Field(description="Point 1 title. 1 to 3 words.")
    lumen_point_1_text: str = Field(description="Point 1 line. 7 to 12 words.")
    lumen_point_2_title: str = Field(description="Point 2 title. 1 to 3 words. Different from point 1.")
    lumen_point_2_text: str = Field(description="Point 2 line. 7 to 12 words.")
    lumen_point_3_title: str = Field(description="Point 3 title. 1 to 3 words. Different from the others.")
    lumen_point_3_text: str = Field(description="Point 3 line. 7 to 12 words.")
    lumen_point_4_title: str = Field(description="Point 4 title. 1 to 3 words. Different from the others.")
    lumen_point_4_text: str = Field(description="Point 4 line. 7 to 12 words.")
    lumen_point_5_title: str = Field(description="Point 5 title. 1 to 3 words. Different from the others.")
    lumen_point_5_text: str = Field(description="Point 5 line. 7 to 12 words.")
    lumen_point_6_title: str = Field(description="Point 6 title. 1 to 3 words. Different from the others.")
    lumen_point_6_text: str = Field(description="Point 6 line. 7 to 12 words.")

    # The details: three alternating image and text rows
    lumen_details_heading: str = Field(description="Section heading. 2 to 3 words. Example The details.")
    lumen_detail_1_title: str = Field(description="Row 1 title. 2 to 4 words. A specific feature of the product.")
    lumen_detail_1_text: str = Field(description="Row 1 text. 18 to 30 words explaining that feature and why it matters.")
    lumen_detail_2_title: str = Field(description="Row 2 title. 2 to 4 words. A different feature.")
    lumen_detail_2_text: str = Field(description="Row 2 text. 18 to 30 words.")
    lumen_detail_3_title: str = Field(description="Row 3 title. 2 to 4 words. A different feature.")
    lumen_detail_3_text: str = Field(description="Row 3 text. 18 to 30 words.")

    # Circle: round image with three lines each side
    lumen_circle_eyebrow: str = Field(description="Small uppercase label. 2 to 4 words. Example The way we choose.")
    lumen_circle_heading: str = Field(description="Heading. 2 to 4 words. Example Chosen with care.")
    lumen_circle_1_title: str = Field(description="Left line 1 title. 2 to 3 words. About the product design.")
    lumen_circle_1_text: str = Field(description="Left line 1 text. 6 to 10 words.")
    lumen_circle_2_title: str = Field(description="Left line 2 title. 2 to 3 words. About how it feels to use.")
    lumen_circle_2_text: str = Field(description="Left line 2 text. 6 to 10 words.")
    lumen_circle_3_title: str = Field(description="Left line 3 title. 2 to 3 words. About living with it.")
    lumen_circle_3_text: str = Field(description="Left line 3 text. 6 to 10 words.")
    lumen_circle_4_title: str = Field(description="Right line 1 title. 2 to 3 words. About delivery.")
    lumen_circle_4_text: str = Field(description="Right line 1 text. 6 to 10 words.")
    lumen_circle_5_title: str = Field(description="Right line 2 title. 2 to 3 words. About gifting.")
    lumen_circle_5_text: str = Field(description="Right line 2 text. 6 to 10 words.")
    lumen_circle_6_title: str = Field(description="Right line 3 title. 2 to 3 words. About customer care.")
    lumen_circle_6_text: str = Field(description="Right line 3 text. 6 to 10 words.")

    # Mood: full-width split with a dark panel
    lumen_mood_eyebrow: str = Field(description="Small uppercase label. 1 to 3 words. Example Everyday ritual.")
    lumen_mood_heading: str = Field(description="Mood heading. 3 to 6 words. Example Made to be lived with.")
    lumen_mood_text: str = Field(
        description="Two calm sentences. 20 to 32 words. How the product fits into everyday life."
    )
    lumen_mood_cta: str = Field(description="Link text. 2 to 4 words. Example Explore the collection.")
