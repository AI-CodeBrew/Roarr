"""
Lustre multi-product store homepage copy schema (prepaid + COD, store-only).

Voice for every field: warm, polished and clear, like a fine fashion boutique. Short sentences,
no emojis. Offers must be honest for the store; do not invent discounts, guarantees, delivery
times or awards that the product context does not support.
"""
from pydantic import BaseModel, Field


class HomePageLustreStore(BaseModel):
    """Home page fields for the Lustre pack (multi product)."""

    marquee_text_1: str = Field(description="Scrolling strip phrase 1, a store benefit. 3 to 6 words. Example: Free shipping and returns.")
    marquee_text_2: str = Field(description="Scrolling strip phrase 2, a different benefit. 3 to 6 words.")
    marquee_text_3: str = Field(description="Scrolling strip phrase 3, a different benefit. 3 to 6 words.")
    marquee_text_4: str = Field(description="Scrolling strip phrase 4, a different benefit. 3 to 6 words.")

    hero_kicker_1: str = Field(description="Small uppercase line above hero heading 1. 3 to 5 words. Example: Find your signature look.")
    banner_heading_1: str = Field(description="Hero slide 1 heading about Product 1. 5 to 8 words. Example: Fine Layered Necklaces For Every Occasion.")
    banner_text_1: str = Field(description="Hero slide 1 supporting line. 6 to 10 words.")
    hero_kicker_2: str = Field(description="Small uppercase line above hero heading 2. 3 to 5 words.")
    banner_heading_2: str = Field(description="Hero slide 2 heading about Product 2 (or Product 1 if there is only one). 5 to 8 words.")
    banner_text_2: str = Field(description="Hero slide 2 supporting line. 6 to 10 words.")
    hero_kicker_3: str = Field(description="Small uppercase line above hero heading 3. 3 to 5 words.")
    banner_heading_3: str = Field(description="Hero slide 3 heading about Product 3 (or the store's range if there are fewer). 5 to 8 words.")
    banner_text_3: str = Field(description="Hero slide 3 supporting line. 6 to 10 words.")

    about_kicker: str = Field(description="Small uppercase label above the about heading. 2 to 3 words. Example: Who we are.")
    about_heading: str = Field(description="About section heading in title case. 6 to 9 words.")
    about_text: str = Field(description="About section paragraph on what the store stands for. 28 to 36 words.")

    categories_heading: str = Field(description="Heading above the round category images. 2 to 4 words. Example: Shop By Categories.")
    categories_text: str = Field(description="One line under the categories heading. 8 to 12 words.")

    card_title_1: str = Field(description="Label on tall image card 1, naming a style from the range. 2 to 4 words.")
    card_title_2: str = Field(description="Label on tall image card 2, a different style. 2 to 4 words.")
    card_title_3: str = Field(description="Label on tall image card 3, a different style. 2 to 4 words.")

    trending_heading: str = Field(description="Heading above the first product row. 2 to 3 words. Example: Trending Products.")
    trending_text: str = Field(description="One line under the trending heading. 8 to 12 words.")

    split_heading: str = Field(description="Heading beside the large portrait image. 4 to 6 words.")
    split_text: str = Field(description="Short paragraph beside the large portrait image. 22 to 30 words.")

    service_1_title: str = Field(description="Service column 1 title, about shipping. 2 to 3 words.")
    service_1_text: str = Field(description="Service column 1 line. 3 to 6 words.")
    service_2_title: str = Field(description="Service column 2 title, about refunds or quality. 2 to 3 words.")
    service_2_text: str = Field(description="Service column 2 line. 3 to 6 words.")
    service_3_title: str = Field(description="Service column 3 title, about offers. 2 to 3 words.")
    service_3_text: str = Field(description="Service column 3 line. 3 to 6 words.")
    service_4_title: str = Field(description="Service column 4 title, about customer support. 2 to 3 words.")
    service_4_text: str = Field(description="Service column 4 line. 3 to 6 words.")

    promo_kicker_1: str = Field(description="Small uppercase line on promo banner 1, an inviting label with no made-up percentage. 2 to 3 words. Example: New season.")
    promo_heading_1: str = Field(description="Promo banner 1 heading. 3 to 5 words.")
    promo_kicker_2: str = Field(description="Small uppercase line on promo banner 2, with no made-up percentage. 2 to 3 words.")
    promo_heading_2: str = Field(description="Promo banner 2 heading. 3 to 5 words.")

    featured_heading: str = Field(description="Heading above the second product row. 2 to 3 words. Example: Featured Products.")
    featured_text: str = Field(description="One line under the featured heading. 8 to 12 words.")

    testimonials_heading: str = Field(description="Heading above customer reviews. 3 to 5 words. Example: What Our Clients Say.")
    testimonials_text: str = Field(description="One line under the reviews heading. 8 to 12 words.")

    blog_heading: str = Field(description="Heading above blog posts. 2 to 4 words. Example: Our Latest Blog.")
    blog_text: str = Field(description="One line under the blog heading. 8 to 12 words.")

    footer_newsletter_text: str = Field(description="Line inviting shoppers to join the newsletter. 12 to 16 words.")

    label_read_more: str = Field(description="Button label meaning 'Read more'. 1 to 2 words.")
    label_options: str = Field(description="Button label meaning 'Options', for products with variants. 1 word.")
    label_items: str = Field(description="The word 'Items', shown after a count. 1 word.")
    label_subscribe: str = Field(description="Button label meaning 'Subscribe'. 1 word.")
    footer_store_heading: str = Field(description="Footer heading meaning 'Store Information'. 1 to 2 words.")
    footer_services_heading: str = Field(description="Footer heading meaning 'Services'. 1 word.")
    footer_links_heading: str = Field(description="Footer heading meaning 'Quick Links'. 1 to 2 words.")
    footer_newsletter_heading: str = Field(description="Footer heading meaning 'Our Newsletter'. 1 to 2 words.")
