"""
Velour multi-product store homepage copy schema (prepaid + COD, store-only).

Voice for every field: warm, confident and clear, like a good clothing boutique. Short sentences,
no emojis. Offers must be honest for the store; do not invent discounts, deadlines, stock levels,
guarantees, delivery times or awards that the product context does not support.
"""
from pydantic import BaseModel, Field


class HomePageVelourStore(BaseModel):
    """Home page fields for the Velour pack (multi product)."""

    ticker_text_1: str = Field(description="Moving ticker line 1 at the top of every page, a true store benefit or welcome. 3 to 6 words, no made-up discount, threshold, deadline or delivery time. Example: Secure checkout on every order.")
    ticker_text_2: str = Field(description="Moving ticker line 2, different from line 1. 3 to 6 words, with the same rules. Example: New arrivals every season.")
    ticker_text_3: str = Field(description="Moving ticker line 3, different from lines 1 and 2. 3 to 6 words, with the same rules. Example: Packed with care.")

    hero_kicker_1: str = Field(description="Small uppercase line above hero heading 1. 3 to 5 words. Example: The new season edit.")
    banner_heading_1: str = Field(description="Hero slide 1 heading about Product 1. 5 to 8 words. Example: Transform Your Wardrobe With Tailored Layers.")
    banner_text_1: str = Field(description="Hero slide 1 supporting line. 10 to 16 words.")
    hero_kicker_2: str = Field(description="Small uppercase line above hero heading 2. 3 to 5 words.")
    banner_heading_2: str = Field(description="Hero slide 2 heading about Product 2 (or Product 1 if there is only one). 5 to 8 words.")
    banner_text_2: str = Field(description="Hero slide 2 supporting line. 10 to 16 words.")
    hero_kicker_3: str = Field(description="Small uppercase line above hero heading 3. 3 to 5 words.")
    banner_heading_3: str = Field(description="Hero slide 3 heading about Product 3 (or the store's range if there are fewer). 5 to 8 words.")
    banner_text_3: str = Field(description="Hero slide 3 supporting line. 10 to 16 words.")

    policy_1_title: str = Field(description="Service column 1 title, about delivery, with no promise the store has not made. 2 to 3 words. Example: Careful Delivery.")
    policy_1_text: str = Field(description="Service column 1 line. 8 to 12 words, with no made-up thresholds or times.")
    policy_2_title: str = Field(description="Service column 2 title, about flexible or easy payment. 2 to 4 words.")
    policy_2_text: str = Field(description="Service column 2 line. 8 to 12 words.")
    policy_3_title: str = Field(description="Service column 3 title, about help with size or fit. 2 to 3 words. Example: Fit Support.")
    policy_3_text: str = Field(description="Service column 3 line. 8 to 12 words, with no made-up return periods.")
    policy_4_title: str = Field(description="Service column 4 title, about secure checkout. 2 to 3 words.")
    policy_4_text: str = Field(description="Service column 4 line. 8 to 12 words.")

    gallery_title_1: str = Field(description="Label on tall image tile 1, a clothing category from the range. 1 to 2 words. Example: Dresses.")
    gallery_title_2: str = Field(description="Label on tall image tile 2, a different category. 1 to 2 words.")
    gallery_title_3: str = Field(description="Label on tall image tile 3, a different category. 1 to 2 words.")
    gallery_title_4: str = Field(description="Label on tall image tile 4, a different category. 1 to 2 words.")

    deal_kicker: str = Field(description="Small uppercase label above the feature strip, with no made-up percentage. 2 words. Example: Worth a look.")
    deal_heading: str = Field(description="Feature strip heading inviting shoppers to browse. 5 to 8 words, with no invented discount or deadline.")
    deal_text: str = Field(description="One line under that heading. 7 to 11 words, with no invented scarcity.")

    showcase_kicker: str = Field(description="Small uppercase label above the gallery heading. 1 word. Example: Collection.")
    showcase_heading: str = Field(description="Gallery heading in title case. 4 to 6 words. Example: Discover The Looks In Our Gallery.")
    showcase_title_1: str = Field(description="Accordion row 1 title, a clothing category. 1 to 2 words.")
    showcase_text_1: str = Field(description="Accordion row 1 text. 16 to 24 words.")
    showcase_title_2: str = Field(description="Accordion row 2 title, a different category. 1 to 2 words.")
    showcase_text_2: str = Field(description="Accordion row 2 text. 16 to 24 words.")
    showcase_title_3: str = Field(description="Accordion row 3 title, a different category. 1 to 2 words.")
    showcase_text_3: str = Field(description="Accordion row 3 text. 16 to 24 words.")
    showcase_title_4: str = Field(description="Accordion row 4 title, a different category. 1 to 2 words.")
    showcase_text_4: str = Field(description="Accordion row 4 text. 16 to 24 words.")

    arrivals_kicker: str = Field(description="Small uppercase label above the product row. 2 words. Example: Our products.")
    arrivals_heading: str = Field(description="Heading above the product row. 2 to 3 words. Example: New Arrivals.")

    statement_kicker: str = Field(description="Small uppercase line on the wide banner. 3 to 5 words.")
    statement_heading: str = Field(description="Wide banner heading in title case. 5 to 8 words.")
    statement_text: str = Field(description="Wide banner supporting line. 12 to 18 words.")

    lookbook_kicker: str = Field(description="Small uppercase label above the shop-the-look heading. 2 words. Example: Trending now.")
    lookbook_heading: str = Field(description="Shop-the-look heading. 2 to 4 words. Example: Styles You'll Love.")

    testimonials_kicker: str = Field(description="Small uppercase label above customer reviews. 1 word. Example: Testimonials.")
    testimonials_heading: str = Field(description="Heading above customer reviews. 2 to 4 words. Example: Our Customers Reviews.")

    story_kicker: str = Field(description="Small uppercase label on the image and text slider. 3 to 5 words.")
    story_heading_1: str = Field(description="Slide 1 heading in title case. 4 to 7 words.")
    story_text_1: str = Field(description="Slide 1 text. 28 to 38 words.")
    story_heading_2: str = Field(description="Slide 2 heading in title case. 4 to 7 words.")
    story_text_2: str = Field(description="Slide 2 text. 28 to 38 words.")
    story_heading_3: str = Field(description="Slide 3 heading in title case. 4 to 7 words.")
    story_text_3: str = Field(description="Slide 3 text. 28 to 38 words.")

    blog_kicker: str = Field(description="Small uppercase label above blog posts. 2 words. Example: Our blog.")
    blog_heading: str = Field(description="Heading above blog posts. 2 to 4 words. Example: From Our Journal.")

    faq_heading: str = Field(description="Heading above the questions. 2 to 4 words. Example: Frequently Asked Questions.")
    faq_q_1: str = Field(description="Question 1, about choosing a size. 5 to 10 words.")
    faq_a_1: str = Field(description="Answer 1. 18 to 30 words, general and true for any store, with no made-up policy.")
    faq_q_2: str = Field(description="Question 2, about caring for the clothes. 5 to 10 words.")
    faq_a_2: str = Field(description="Answer 2. 18 to 30 words, general and true for any store.")
    faq_q_3: str = Field(description="Question 3, about reaching customer service. 5 to 10 words.")
    faq_a_3: str = Field(description="Answer 3. 18 to 30 words, pointing to the contact page, with no made-up hours.")
    faq_q_4: str = Field(description="Question 4, about hearing of new arrivals. 5 to 10 words.")
    faq_a_4: str = Field(description="Answer 4. 18 to 30 words, pointing to the newsletter.")

    footer_newsletter_heading: str = Field(description="Footer heading meaning 'Subscribe To Our Newsletter'. 2 to 4 words.")
    footer_newsletter_text: str = Field(description="Line inviting shoppers to join the newsletter. 12 to 18 words, with no made-up offer.")
    footer_thanks_heading: str = Field(description="Short thank-you heading in the footer. 3 to 5 words. Example: Thank You For Choosing Us!")
    footer_thanks_text: str = Field(description="Thank-you line in the footer. 15 to 24 words.")

    popup_heading: str = Field(description="Heading on the newsletter popup. 1 to 2 words. Example: Newsletter.")
    popup_text: str = Field(description="Newsletter popup text. 14 to 22 words about new arrivals and news, with no made-up discount.")

    label_read_more: str = Field(description="Button label meaning 'Read more'. 1 to 2 words.")
    label_products: str = Field(description="The word 'Products', as in '12 Products' under a collection name. 1 word.")
    label_product: str = Field(description="The word 'Product', as in '1 Product' under a collection name. 1 word.")
    label_quick_add: str = Field(description="Button label meaning 'Quick add', for products with variants. 1 to 2 words.")
    label_subscribe: str = Field(description="Button label meaning 'Subscribe'. 1 word.")
    label_submit: str = Field(description="Button label meaning 'Submit'. 1 word.")
    label_search: str = Field(description="The word 'Search'. 1 word.")
    label_account: str = Field(description="The word 'Account'. 1 word.")
    label_wishlist: str = Field(description="The word 'Wishlist'. 1 word.")
    label_cart: str = Field(description="The word 'Cart'. 1 word.")
    footer_account_heading: str = Field(description="Footer heading meaning 'My Account'. 1 to 2 words.")
    footer_policies_heading: str = Field(description="Footer heading meaning 'Our Policies'. 1 to 2 words.")
    footer_care_heading: str = Field(description="Footer heading meaning 'Customer Care'. 1 to 2 words.")
