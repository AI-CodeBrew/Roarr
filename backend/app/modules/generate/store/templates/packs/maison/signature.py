"""
Maison single-store homepage copy schema (prepaid + COD, no premium PDP).
Quiet-luxury layout: announcement bar, hero, manifesto, the piece, triptych, craft,
quote banner, promises, FAQ, closing invitation.

Voice for every field: restrained, confident, sensory. Short sentences. No exclamation
marks, no discount language, no hype words (amazing, best, incredible), no emojis.
"""
from pydantic import BaseModel, Field


class HomePageMaisonStore(BaseModel):
    """Home page fields for the Maison pack (single product)."""

    announce_1: str = Field(
        description="Announcement bar phrase 1. A service or craft signal. 2 to 4 words. Example: Complimentary delivery."
    )
    announce_2: str = Field(
        description="Announcement bar phrase 2. Different signal. 2 to 4 words. Example: Made with intention."
    )
    announce_3: str = Field(
        description="Announcement bar phrase 3. Different signal. 2 to 4 words. Example: Gift-ready packaging."
    )

    hero_eyebrow: str = Field(
        description="Small uppercase label above the hero heading. 2 to 3 words. Example: The signature edition."
    )
    hero_heading: str = Field(
        description=(
            "Hero heading in a refined serif. 3 to 6 words, no trailing punctuation. "
            "The LAST word is set in italic, so end on the most evocative word. "
            "Example: Made to be kept forever."
        )
    )
    hero_subheading: str = Field(
        description="One calm sentence under the heading, 12 to 20 words. Sensory, not salesy."
    )
    hero_cta: str = Field(description="Hero button label. 2 to 3 words. Example: Discover the piece.")

    intro_eyebrow: str = Field(description="Small uppercase label above the manifesto. 1 to 3 words. Example: Our belief.")
    intro_heading: str = Field(
        description="Manifesto statement, one elegant sentence of 12 to 22 words about why this product deserves attention."
    )
    intro_body: str = Field(
        description="Two sentences, 25 to 40 words total, expanding the manifesto with craft and feeling. No feature lists."
    )

    piece_eyebrow: str = Field(description="Small uppercase label above the product heading. 1 to 3 words. Example: The piece.")
    piece_heading: str = Field(description="Heading for the featured product section. 3 to 6 words.")
    piece_body: str = Field(
        description="Two to three sentences, 30 to 45 words, describing what it is like to own and use the product."
    )
    piece_point_1_title: str = Field(description="Detail 1 title. 1 to 3 words. Example: Hand finished.")
    piece_point_1_text: str = Field(description="Detail 1 text. One sentence, 8 to 14 words.")
    piece_point_2_title: str = Field(description="Detail 2 title. 1 to 3 words. Different from detail 1.")
    piece_point_2_text: str = Field(description="Detail 2 text. One sentence, 8 to 14 words.")
    piece_point_3_title: str = Field(description="Detail 3 title. 1 to 3 words. Different from details 1 and 2.")
    piece_point_3_text: str = Field(description="Detail 3 text. One sentence, 8 to 14 words.")
    piece_cta: str = Field(description="Link label under the details. 2 to 3 words. Example: View the piece.")

    gallery_eyebrow: str = Field(description="Small uppercase label above the triptych heading. 1 to 3 words. Example: In situ.")
    gallery_heading: str = Field(description="Triptych heading. 3 to 6 words.")
    gallery_title_1: str = Field(description="Image 1 title. 1 to 3 words. Not the product name.")
    gallery_text_1: str = Field(description="Image 1 caption. One short sentence, 6 to 12 words.")
    gallery_title_2: str = Field(description="Image 2 title. 1 to 3 words. Different from image 1.")
    gallery_text_2: str = Field(description="Image 2 caption. One short sentence, 6 to 12 words.")
    gallery_title_3: str = Field(description="Image 3 title. 1 to 3 words. Different from images 1 and 2.")
    gallery_text_3: str = Field(description="Image 3 caption. One short sentence, 6 to 12 words.")

    craft_eyebrow: str = Field(description="Small uppercase label above the craft heading. 1 to 3 words. Example: The craft.")
    craft_heading: str = Field(description="Craft heading. 3 to 6 words.")
    craft_body: str = Field(
        description="Two sentences, 25 to 40 words, about materials, making and attention to detail. Only claims the product context supports."
    )
    craft_stat_1_value: str = Field(description="Craft figure 1. A short value such as 24h, 100%, 1 of 1. Max 6 characters. Never invent certifications.")
    craft_stat_1_label: str = Field(description="Label for craft figure 1. 1 to 3 words.")
    craft_stat_2_value: str = Field(description="Craft figure 2. Short value. Max 6 characters.")
    craft_stat_2_label: str = Field(description="Label for craft figure 2. 1 to 3 words.")
    craft_stat_3_value: str = Field(description="Craft figure 3. Short value. Max 6 characters.")
    craft_stat_3_label: str = Field(description="Label for craft figure 3. 1 to 3 words.")

    quote_text: str = Field(
        description="A single pull-quote style brand statement, 10 to 18 words, set over a wide photograph. Not a customer review."
    )
    quote_attribution: str = Field(description="Small uppercase line under the quote. 2 to 4 words. Example: The Maison promise.")

    promise_heading: str = Field(description="Promises heading. 2 to 4 words. Example: Our promises.")
    promise_1_label: str = Field(description="Promise 1 label. 1 to 2 words.")
    promise_1_text: str = Field(description="Promise 1 statement. One sentence, 8 to 14 words.")
    promise_2_label: str = Field(description="Promise 2 label. 1 to 2 words. Different.")
    promise_2_text: str = Field(description="Promise 2 statement. One sentence, 8 to 14 words.")
    promise_3_label: str = Field(description="Promise 3 label. 1 to 2 words. Different.")
    promise_3_text: str = Field(description="Promise 3 statement. One sentence, 8 to 14 words.")
    promise_4_label: str = Field(description="Promise 4 label. 1 to 2 words. Different.")
    promise_4_text: str = Field(description="Promise 4 statement. One sentence, 8 to 14 words.")

    faq_heading: str = Field(description="FAQ heading. 2 to 4 words. Example: Good to know.")
    faq_question_1: str = Field(description="FAQ question 1 about the product or ordering. Under 10 words.")
    faq_answer_1: str = Field(description="FAQ answer 1. Two sentences. Do not invent policies, times or prices.")
    faq_question_2: str = Field(description="FAQ question 2. Different topic. Under 10 words.")
    faq_answer_2: str = Field(description="FAQ answer 2. Two sentences. Do not invent policies, times or prices.")
    faq_question_3: str = Field(description="FAQ question 3. Different topic. Under 10 words.")
    faq_answer_3: str = Field(description="FAQ answer 3. Two sentences. Do not invent policies, times or prices.")

    closing_eyebrow: str = Field(description="Small uppercase label above the closing heading. 1 to 3 words. Example: An invitation.")
    closing_heading: str = Field(description="Closing heading. 4 to 8 words. A quiet call to own the product.")
    closing_text: str = Field(description="One sentence, 10 to 18 words, inviting the shopper to order.")
    closing_cta: str = Field(description="Closing button label. 2 to 3 words. Example: Make it yours.")
