"""
Amour single-store homepage copy schema (prepaid + COD, no premium PDP).
Editorial layout: hero, product showcase, countdown, lookbook, ribbons, split,
editorial cards, banner, story, reviews, tabs, promise, gallery.
"""
from pydantic import BaseModel, Field


class HomePageAmourStore(BaseModel):
    """Home page fields for the Amour pack (single product)."""

    hero_eyebrow: str = Field(
        description="Elegant italic line above the hero heading. 2 to 4 words. Example: Made to be loved."
    )
    hero_heading: str = Field(
        description="Hero heading, shown in bold uppercase. 2 to 5 words. Example: Shine every day."
    )
    hero_cta: str = Field(description="Hero button label. 2 to 3 words. Example: Shop now.")
    hero_marquee_1: str = Field(description="Scrolling hero phrase 1. 2 to 4 words.")
    hero_marquee_2: str = Field(description="Scrolling hero phrase 2. Different. 2 to 4 words.")
    hero_marquee_3: str = Field(description="Scrolling hero phrase 3. Different. 2 to 4 words.")

    showcase_heading: str = Field(
        description="Heading above the product cards. 2 to 4 words. Example: The signature edit."
    )
    showcase_link: str = Field(description="Small link label next to the heading. 2 to 3 words. Example: Shop all.")
    showcase_caption_1: str = Field(
        description="Italic caption under showcase image 1 (the product styled as a still life). 2 to 3 words. Not the product name. Example: The signature."
    )
    showcase_caption_2: str = Field(
        description="Italic caption under showcase image 2 (a person holding or using the product). 2 to 4 words. Not the product name. Example: In your hands."
    )
    showcase_caption_3: str = Field(
        description="Italic caption under showcase image 3 (close-up of texture or key detail). 2 to 3 words. Not the product name. Example: Up close."
    )

    countdown_heading: str = Field(
        description="Offer banner heading. 2 to 4 words. Example: Limited time only."
    )
    countdown_subheading: str = Field(
        description="Offer banner line under the heading. 4 to 9 words. No invented discount percentages."
    )
    countdown_cta: str = Field(description="Offer banner link label. 2 to 3 words. Example: Claim the offer.")

    look_1_eyebrow: str = Field(description="Lookbook card 1 small label. 1 to 3 words.")
    look_1_title: str = Field(description="Lookbook card 1 italic title. 1 to 3 words.")
    look_1_caption: str = Field(description="Lookbook card 1 caption. 4 to 8 words.")
    look_2_eyebrow: str = Field(description="Lookbook card 2 small label. 1 to 3 words.")
    look_2_title: str = Field(description="Lookbook card 2 italic title. 1 to 3 words.")
    look_2_caption: str = Field(description="Lookbook card 2 caption. 4 to 8 words.")
    look_3_eyebrow: str = Field(description="Lookbook card 3 small label. 1 to 3 words.")
    look_3_title: str = Field(description="Lookbook card 3 italic title. 1 to 3 words.")
    look_3_caption: str = Field(description="Lookbook card 3 caption. 4 to 8 words.")

    ribbon_1: str = Field(description="Ribbon phrase 1. Short benefit. 2 to 4 words.")
    ribbon_2: str = Field(description="Ribbon phrase 2. Different benefit. 2 to 4 words.")
    ribbon_3: str = Field(description="Ribbon phrase 3. Different benefit. 2 to 4 words.")
    ribbon_4: str = Field(description="Ribbon phrase 4. Different benefit. 2 to 4 words.")

    split_heading: str = Field(
        description="Heading beside the large lifestyle photo. 3 to 6 words."
    )
    split_card_1_label: str = Field(description="Link under carousel slide 1. 2 to 3 words. Example: View all products.")
    split_card_2_label: str = Field(description="Link under carousel slide 2. 2 to 3 words. Different from slide 1.")

    editorial_1_heading: str = Field(description="Editorial card 1 heading. 2 to 4 words.")
    editorial_1_body: str = Field(description="Editorial card 1 text. One sentence, 10 to 18 words.")
    editorial_1_cta: str = Field(description="Editorial card 1 link label. 2 to 3 words.")
    editorial_2_heading: str = Field(description="Editorial card 2 heading. 2 to 4 words.")
    editorial_2_body: str = Field(description="Editorial card 2 text. One sentence, 10 to 18 words.")
    editorial_2_cta: str = Field(description="Editorial card 2 link label. 2 to 3 words.")

    banner_heading: str = Field(
        description="Full-width banner heading, bold uppercase. 3 to 6 words."
    )
    banner_cta: str = Field(description="Banner button label. 2 to 3 words.")
    banner_marquee_1: str = Field(description="Scrolling banner phrase 1. 2 to 4 words.")
    banner_marquee_2: str = Field(description="Scrolling banner phrase 2. Different. 2 to 4 words.")

    story_accent: str = Field(description="Italic accent line above the story heading. 1 to 3 words.")
    story_heading: str = Field(description="Story heading, bold uppercase. 3 to 7 words.")
    story_body: str = Field(description="Story paragraph. 2 sentences about why the product matters.")
    story_cta: str = Field(description="Button on the product card. 2 to 3 words. Example: Shop now.")
    story_caption_title: str = Field(description="Italic caption under the story photo. 1 to 3 words.")
    story_caption_line: str = Field(description="Small uppercase line under the caption. 3 to 6 words.")

    reviews_eyebrow: str = Field(description="Italic line above the reviews heading. 1 to 3 words.")
    reviews_heading: str = Field(description="Reviews heading. 2 to 5 words. Example: Loved by customers.")

    tabs_heading: str = Field(description="Heading of the numbered list. 2 to 5 words.")
    tab_1_title: str = Field(description="Numbered row 1 title. 1 to 3 words.")
    tab_1_text: str = Field(description="Numbered row 1 text. One sentence, 10 to 18 words.")
    tab_2_title: str = Field(description="Numbered row 2 title. 1 to 3 words. Different.")
    tab_2_text: str = Field(description="Numbered row 2 text. One sentence, 10 to 18 words.")
    tab_3_title: str = Field(description="Numbered row 3 title. 1 to 3 words. Different.")
    tab_3_text: str = Field(description="Numbered row 3 text. One sentence, 10 to 18 words.")

    promise_heading: str = Field(description="Promise strip heading. 2 to 4 words. Example: Our promise.")
    promise_1_label: str = Field(description="Promise 1 short label. 1 to 2 words. Example: Quality.")
    promise_1_text: str = Field(description="Promise 1 statement. One sentence, 8 to 16 words.")
    promise_2_label: str = Field(description="Promise 2 short label. 1 to 2 words.")
    promise_2_text: str = Field(description="Promise 2 statement. One sentence, 8 to 16 words.")
    promise_3_label: str = Field(description="Promise 3 short label. 1 to 2 words.")
    promise_3_text: str = Field(description="Promise 3 statement. One sentence, 8 to 16 words.")
    promise_4_label: str = Field(description="Promise 4 short label. 1 to 2 words.")
    promise_4_text: str = Field(description="Promise 4 statement. One sentence, 8 to 16 words.")
    promise_5_label: str = Field(description="Promise 5 short label. 1 to 2 words.")
    promise_5_text: str = Field(description="Promise 5 statement. One sentence, 8 to 16 words.")

    gallery_heading: str = Field(description="Photo carousel heading. 2 to 5 words. Example: Seen on you.")
    gallery_1_label: str = Field(description="Label under gallery photo 1. 2 to 3 words.")
    gallery_2_label: str = Field(description="Label under gallery photo 2. 2 to 3 words.")
    gallery_3_label: str = Field(description="Label under gallery photo 3. 2 to 3 words.")
    gallery_4_label: str = Field(description="Label under gallery photo 4. 2 to 3 words.")
    gallery_5_label: str = Field(description="Label under gallery photo 5. 2 to 3 words.")
    gallery_6_label: str = Field(description="Label under gallery photo 6. 2 to 3 words.")
