"""
Cinematic COD single-store homepage copy schema.
Maps to Roarr example sections (Hero, Trust, ProductStory, Inspiration,
FeatureTicker, WhyShop, FeatureOrbit, Reviews, FAQ).
"""
from pydantic import BaseModel, Field


class HomePageCinematicStore(BaseModel):
    """Home page fields for the cinematic pack (COD single)."""

    announcement_1: str = Field(
        description="Announcement ticker phrase 1. Store perk or offer. Max 6 words."
    )
    announcement_2: str = Field(
        description="Announcement ticker phrase 2. Different perk. Max 6 words."
    )
    announcement_3: str = Field(
        description="Announcement ticker phrase 3. Different perk. Max 6 words."
    )
    announcement_4: str = Field(
        description="Announcement ticker phrase 4. Different perk. Max 6 words."
    )
    announcement_5: str = Field(
        description="Announcement ticker phrase 5. Different perk. Max 6 words."
    )

    trust_1_title: str = Field(description="Trust bar item 1 title. Max 3 words.")
    trust_1_line: str = Field(description="Trust bar item 1 subtitle. Max 2 words.")
    trust_2_title: str = Field(description="Trust bar item 2 title. Max 3 words.")
    trust_2_line: str = Field(description="Trust bar item 2 subtitle. Max 2 words.")
    trust_3_title: str = Field(description="Trust bar item 3 title. Max 3 words.")
    trust_3_line: str = Field(description="Trust bar item 3 subtitle. Max 2 words.")
    trust_4_title: str = Field(description="Trust bar item 4 title. Max 3 words.")
    trust_4_line: str = Field(description="Trust bar item 4 subtitle. Max 2 words.")

    product_story_eyebrow: str = Field(
        description="Small uppercase eyebrow above product story heading. Max 6 words."
    )
    product_story_heading: str = Field(
        description="Product story serif heading. Can use two short lines. Max 6 words."
    )
    product_story_body: str = Field(
        description="Product story body. Benefit-led, 2 to 3 sentences."
    )
    product_story_cta: str = Field(
        description="CTA label for product story. Max 3 words. Example: Shop Now."
    )

    inspiration_line_1: str = Field(
        description="Navy quote band first line. Short, poetic. Max 5 words."
    )
    inspiration_line_1_accent: str = Field(
        description="Gold accent phrase completing line 1. Max 4 words."
    )
    inspiration_line_2: str = Field(
        description="Supporting italic line under inspiration. Max 16 words."
    )

    feature_ticker_1: str = Field(description="Feature marquee phrase 1. Max 4 words.")
    feature_ticker_2: str = Field(description="Feature marquee phrase 2. Max 4 words.")
    feature_ticker_3: str = Field(description="Feature marquee phrase 3. Max 4 words.")
    feature_ticker_4: str = Field(description="Feature marquee phrase 4. Max 4 words.")
    feature_ticker_5: str = Field(description="Feature marquee phrase 5. Max 4 words.")
    feature_ticker_6: str = Field(description="Feature marquee phrase 6. Max 4 words.")

    why_shop_heading: str = Field(
        description="Why shop section heading. Max 5 words. Example: Why Shop With Us?"
    )
    why_1_title: str = Field(description="Why accordion item 1 title. Max 6 words.")
    why_1_text: str = Field(description="Why accordion item 1 body. 1 to 2 sentences.")
    why_2_title: str = Field(description="Why accordion item 2 title. Max 6 words.")
    why_2_text: str = Field(description="Why accordion item 2 body. 1 to 2 sentences.")
    why_3_title: str = Field(description="Why accordion item 3 title. Max 6 words.")
    why_3_text: str = Field(description="Why accordion item 3 body. 1 to 2 sentences.")
    why_4_title: str = Field(description="Why accordion item 4 title. Max 6 words.")
    why_4_text: str = Field(description="Why accordion item 4 body. 1 to 2 sentences.")
    why_5_title: str = Field(description="Why accordion item 5 title. Max 6 words.")
    why_5_text: str = Field(description="Why accordion item 5 body. 1 to 2 sentences.")

    orbit_eyebrow: str = Field(description="Feature orbit eyebrow. Max 3 words.")
    orbit_heading: str = Field(description="Feature orbit heading. Max 8 words.")
    orbit_1_title: str = Field(description="Orbit feature 1 title. Max 3 words.")
    orbit_1_text: str = Field(description="Orbit feature 1 text. Max 12 words.")
    orbit_2_title: str = Field(description="Orbit feature 2 title. Max 3 words.")
    orbit_2_text: str = Field(description="Orbit feature 2 text. Max 12 words.")
    orbit_3_title: str = Field(description="Orbit feature 3 title. Max 3 words.")
    orbit_3_text: str = Field(description="Orbit feature 3 text. Max 12 words.")
    orbit_4_title: str = Field(description="Orbit feature 4 title. Max 3 words.")
    orbit_4_text: str = Field(description="Orbit feature 4 text. Max 12 words.")
    orbit_5_title: str = Field(description="Orbit feature 5 title. Max 3 words.")
    orbit_5_text: str = Field(description="Orbit feature 5 text. Max 12 words.")
    orbit_6_title: str = Field(description="Orbit feature 6 title. Max 3 words.")
    orbit_6_text: str = Field(description="Orbit feature 6 text. Max 12 words.")

    faq_1_q: str = Field(description="FAQ 1 question.")
    faq_1_a: str = Field(description="FAQ 1 answer. 1 to 3 sentences.")
    faq_2_q: str = Field(description="FAQ 2 question.")
    faq_2_a: str = Field(description="FAQ 2 answer. 1 to 3 sentences.")
    faq_3_q: str = Field(description="FAQ 3 question.")
    faq_3_a: str = Field(description="FAQ 3 answer. 1 to 3 sentences.")
    faq_4_q: str = Field(description="FAQ 4 question.")
    faq_4_a: str = Field(description="FAQ 4 answer. 1 to 3 sentences.")
    faq_5_q: str = Field(description="FAQ 5 question.")
    faq_5_a: str = Field(description="FAQ 5 answer. 1 to 3 sentences.")
    faq_6_q: str = Field(description="FAQ 6 question.")
    faq_6_a: str = Field(description="FAQ 6 answer. 1 to 3 sentences.")

    sticky_cta: str = Field(
        description="Sticky shop bar CTA label. Max 3 words. Example: Shop now."
    )
