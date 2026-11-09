"""
Tempo single-store homepage copy schema (prepaid + COD, no premium PDP).
Bright gadget layout: hero slider, new arrival, feature ring, split, icon showcase, gallery, stories, subscribe.

Voice for every field: friendly, clear and confident, like a good independent shop. Short sentences, no emojis,
no exclamation marks. Never invent discounts, deadlines, stock levels, warranties, battery times, ranges,
certifications, awards or delivery times that the product context does not support.
"""
from pydantic import BaseModel, Field


class HomePageTempoStore(BaseModel):
    """Home page fields for the Tempo pack (single product)."""

    hero_kicker_1: str = Field(description="Small line above hero slide 1 heading, starting with '#'. 3 to 5 words. Example: #Made for every day.")
    hero_heading_1: str = Field(description="Hero slide 1 heading about the product, title case, set very large. 2 to 3 short words, no trailing punctuation. Each slide takes a different angle. Example: Minimal Watch.")
    hero_text_1: str = Field(description="Hero slide 1 supporting text. 14 to 22 words. Only claims the product context supports.")
    hero_kicker_2: str = Field(description="Small line above hero slide 2 heading, starting with '#'. 3 to 5 words. Example: #Made for every day.")
    hero_heading_2: str = Field(description="Hero slide 2 heading about the product, title case, set very large. 2 to 3 short words, no trailing punctuation. Each slide takes a different angle. Example: Minimal Watch.")
    hero_text_2: str = Field(description="Hero slide 2 supporting text. 14 to 22 words. Only claims the product context supports.")
    hero_kicker_3: str = Field(description="Small line above hero slide 3 heading, starting with '#'. 3 to 5 words. Example: #Made for every day.")
    hero_heading_3: str = Field(description="Hero slide 3 heading about the product, title case, set very large. 2 to 3 short words, no trailing punctuation. Each slide takes a different angle. Example: Minimal Watch.")
    hero_text_3: str = Field(description="Hero slide 3 supporting text. 14 to 22 words. Only claims the product context supports.")
    hero_cta: str = Field(description="Hero button label shared by every slide. 2 to 3 words. Example: Explore More.")
    hero_video_label: str = Field(description="Label next to the video play button. 2 words. Example: View Video.")

    arrivals_heading: str = Field(description="Section heading. 2 words. Example: New Arrivals.")
    arrivals_text: str = Field(description="One sentence under the section heading, 12 to 18 words, introducing the product. No invented claims.")
    featured_label: str = Field(description="Small uppercase label above the featured heading. 2 to 3 words. Example: Featured product.")
    featured_heading: str = Field(description="Featured product heading in title case about the product. 4 to 7 words, no trailing punctuation.")
    featured_text: str = Field(description="Two sentences, 28 to 42 words, about what the product is and who it suits. Only claims the product context supports.")
    featured_cta: str = Field(description="Buy button label. 2 words. Example: Buy Now.")

    features_label: str = Field(description="Small uppercase label above the features heading. 3 words. Example: Explore the awesome.")
    features_heading: str = Field(description="Features heading. 2 to 3 words. Example: Product Feature.")
    feature_1_title: str = Field(description="Feature 1 title. 2 to 3 words, a true benefit different from the other features.")
    feature_1_text: str = Field(description="Feature 1 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_2_title: str = Field(description="Feature 2 title. 2 to 3 words, a true benefit different from the other features.")
    feature_2_text: str = Field(description="Feature 2 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_3_title: str = Field(description="Feature 3 title. 2 to 3 words, a true benefit different from the other features.")
    feature_3_text: str = Field(description="Feature 3 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_4_title: str = Field(description="Feature 4 title. 2 to 3 words, a true benefit different from the other features.")
    feature_4_text: str = Field(description="Feature 4 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_5_title: str = Field(description="Feature 5 title. 2 to 3 words, a true benefit different from the other features.")
    feature_5_text: str = Field(description="Feature 5 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_6_title: str = Field(description="Feature 6 title. 2 to 3 words, a true benefit different from the other features.")
    feature_6_text: str = Field(description="Feature 6 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_7_title: str = Field(description="Feature 7 title. 2 to 3 words, a true benefit different from the other features.")
    feature_7_text: str = Field(description="Feature 7 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")
    feature_8_title: str = Field(description="Feature 8 title. 2 to 3 words, a true benefit different from the other features.")
    feature_8_text: str = Field(description="Feature 8 text. 8 to 14 words. No invented specifications, numbers or battery or range claims.")

    split_heading: str = Field(description="Heading for the split section, title case. 4 to 8 words, no trailing punctuation.")
    split_text: str = Field(description="Two short sentences, 18 to 28 words, introducing how the product fits daily life.")
    split_1_title: str = Field(description="Point 1 title. 2 to 3 words, different from the other points.")
    split_1_text: str = Field(description="Point 1 text. 10 to 16 words. No invented specifications.")
    split_2_title: str = Field(description="Point 2 title. 2 to 3 words, different from the other points.")
    split_2_text: str = Field(description="Point 2 text. 10 to 16 words. No invented specifications.")
    split_3_title: str = Field(description="Point 3 title. 2 to 3 words, different from the other points.")
    split_3_text: str = Field(description="Point 3 text. 10 to 16 words. No invented specifications.")

    showcase_1_label: str = Field(description="Icon bubble 1 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_2_label: str = Field(description="Icon bubble 2 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_3_label: str = Field(description="Icon bubble 3 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_4_label: str = Field(description="Icon bubble 4 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_5_label: str = Field(description="Icon bubble 5 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_6_label: str = Field(description="Icon bubble 6 label. 1 word, a real quality of the product, different from the other bubbles.")
    showcase_heading: str = Field(description="Screen-reader heading for the icon showcase. 2 to 4 words. Example: What You Get.")

    gallery_label: str = Field(description="Small uppercase label above the gallery heading. 2 words. Example: Awesome product.")
    gallery_heading: str = Field(description="Gallery heading, title case. 3 to 4 words. Example: Take A Closer Look.")
    gallery_1_title: str = Field(description="Gallery card 1 title. 2 to 3 words naming a view or detail. Example: Side view.")
    gallery_1_text: str = Field(description="Gallery card 1 short line shown in accent colour. 2 to 5 words. No price, no invented discount.")
    gallery_2_title: str = Field(description="Gallery card 2 title. 2 to 3 words naming a view or detail. Example: Side view.")
    gallery_2_text: str = Field(description="Gallery card 2 short line shown in accent colour. 2 to 5 words. No price, no invented discount.")
    gallery_3_title: str = Field(description="Gallery card 3 title. 2 to 3 words naming a view or detail. Example: Side view.")
    gallery_3_text: str = Field(description="Gallery card 3 short line shown in accent colour. 2 to 5 words. No price, no invented discount.")
    gallery_4_title: str = Field(description="Gallery card 4 title. 2 to 3 words naming a view or detail. Example: Side view.")
    gallery_4_text: str = Field(description="Gallery card 4 short line shown in accent colour. 2 to 5 words. No price, no invented discount.")

    stories_label: str = Field(description="Small uppercase label above the stories heading. 2 words. Example: Featured stories.")
    stories_heading: str = Field(description="Stories heading, title case. 2 to 4 words. Example: Life With It.")
    story_1_title: str = Field(description="Story 1 title. 2 to 3 words naming a moment of use. Example: At work.")
    story_1_text: str = Field(description="Story 1 text. 12 to 18 words describing the product in that moment. No invented claims.")
    story_2_title: str = Field(description="Story 2 title. 2 to 3 words naming a moment of use. Example: At work.")
    story_2_text: str = Field(description="Story 2 text. 12 to 18 words describing the product in that moment. No invented claims.")
    story_3_title: str = Field(description="Story 3 title. 2 to 3 words naming a moment of use. Example: At work.")
    story_3_text: str = Field(description="Story 3 text. 12 to 18 words describing the product in that moment. No invented claims.")

    subscribe_label: str = Field(description="Small uppercase label above the subscribe heading. 2 words. Example: Subscribe area.")
    subscribe_heading: str = Field(description="Subscribe heading, title case. 3 to 5 words. Example: For Latest News.")
    subscribe_placeholder: str = Field(description="Placeholder text for the email field. Example: email@example.com.")
    subscribe_cta: str = Field(description="Subscribe button label. 1 word. Example: Subscribe.")
