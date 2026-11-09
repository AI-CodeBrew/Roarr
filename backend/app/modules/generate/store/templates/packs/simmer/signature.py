"""
Simmer multi-product kitchen electronics store homepage copy schema (prepaid + COD, store-only).

Voice for every field: modern, clear and confident, like a good independent appliance shop. Short
sentences, no emojis. Offers must be honest for the store; do not invent discounts, deadlines, stock
levels, warranties, wattages, guarantees, delivery times or awards that the product context does not
support.
"""
from pydantic import BaseModel, Field


class HomePageSimmerStore(BaseModel):
    """Home page fields for the Simmer pack (multi product)."""

    ticker_text_1: str = Field(description="Moving ticker line 1 at the top of every page, a true store benefit or welcome. 3 to 6 words, no made-up discount, threshold, deadline or delivery time. Example: Secure checkout on every order.")
    ticker_text_2: str = Field(description="Moving ticker line 2, different from line 1. 3 to 6 words, with the same rules. Example: New arrivals every season.")
    ticker_text_3: str = Field(description="Moving ticker line 3, different from lines 1 and 2. 3 to 6 words, with the same rules. Example: Packed with care.")

    hero_kicker_1: str = Field(description="Small uppercase line above hero heading 1. 2 to 4 words. Example: Blend it your way.")
    banner_heading_1: str = Field(description="Hero slide 1 heading about Product 1, in title case. 5 to 8 words. Example: Smoother Mornings Start With A Better Blender.")
    banner_text_1: str = Field(description="Hero slide 1 supporting line. 10 to 16 words.")
    hero_kicker_2: str = Field(description="Small uppercase line above hero heading 2. 2 to 4 words.")
    banner_heading_2: str = Field(description="Hero slide 2 heading about Product 2 (or Product 1 if there is only one), in title case. 5 to 8 words.")
    banner_text_2: str = Field(description="Hero slide 2 supporting line. 10 to 16 words.")
    hero_kicker_3: str = Field(description="Small uppercase line above hero heading 3. 2 to 4 words.")
    banner_heading_3: str = Field(description="Hero slide 3 heading about Product 3 (or the store's range if there are fewer), in title case. 5 to 8 words.")
    banner_text_3: str = Field(description="Hero slide 3 supporting line. 10 to 16 words.")
    hero_side_heading: str = Field(description="Short title on the narrow picture beside the hero, at most 13 characters. 2 words. Example: Kitchen Gifts.")

    deal_kicker: str = Field(description="Small uppercase label above the offer strip, with no made-up percentage. 2 words. Example: Special deals.")
    deal_heading: str = Field(description="Offer strip heading inviting shoppers to browse, in title case. 5 to 8 words, with no invented discount or deadline.")
    deal_text: str = Field(description="One line under that heading. 7 to 11 words, with no invented scarcity.")

    picks_kicker: str = Field(description="Small uppercase label above the category list. 1 word. Example: Categories.")
    picks_heading: str = Field(description="Heading above the category list, in title case. 3 to 5 words. Example: Our Picks For You.")
    picks_title_1: str = Field(description="Category row 1: the kind of product Product 1 is, plural. 1 to 2 words. Example: Blenders.")
    picks_text_1: str = Field(description="Category row 1 text about that kind of product. 16 to 24 words.")
    picks_title_2: str = Field(description="Category row 2: the kind of product Product 2 is, plural. 1 to 2 words. Example: Air Fryers.")
    picks_text_2: str = Field(description="Category row 2 text. 16 to 24 words.")
    picks_title_3: str = Field(description="Category row 3: the kind of product Product 3 is, plural. 1 to 2 words. Example: Coffee Machines.")
    picks_text_3: str = Field(description="Category row 3 text. 16 to 24 words.")
    picks_title_4: str = Field(description="Category row 4: something people make with Product 1. 1 to 2 words. Example: Smoothies.")
    picks_text_4: str = Field(description="Category row 4 text. 16 to 24 words.")
    picks_title_5: str = Field(description="Category row 5: something people make with Product 2. 1 to 2 words. Example: Crispy Snacks.")
    picks_text_5: str = Field(description="Category row 5 text. 16 to 24 words.")
    picks_title_6: str = Field(description="Category row 6: something people make with Product 3. 1 to 2 words. Example: Morning Coffee.")
    picks_text_6: str = Field(description="Category row 6 text. 16 to 24 words.")

    arrivals_kicker: str = Field(description="Small uppercase label above the product row. 2 words. Example: Our products.")
    arrivals_heading: str = Field(description="Heading above the product row. 2 to 3 words. Example: New Arrivals.")

    brands_kicker: str = Field(description="Small uppercase label above the brand statement. 1 word. Example: Brands.")
    brands_quote: str = Field(description="One-sentence brand statement about how the store's appliances make everyday cooking easier, without quotation marks. 22 to 30 words.")

    gallery_kicker: str = Field(description="Small uppercase label above the photo gallery. 2 words. Example: Follow us.")
    gallery_heading: str = Field(description="Gallery heading: '@' followed by the store name with no spaces, or a 2 to 4 word invitation to follow the store. Example: @SimmerKitchen.")
    gallery_text: str = Field(description="Line inviting shoppers to follow the store for recipes and kitchen ideas. 18 to 26 words.")

    testimonials_kicker: str = Field(description="Small uppercase label above customer reviews. 1 word. Example: Testimonials.")
    testimonials_heading: str = Field(description="Heading above customer reviews. 2 to 4 words. Example: Our Customers Reviews.")

    lookbook_kicker: str = Field(description="Small uppercase label on the wide picture. 1 to 2 words. Example: Lookbook.")
    lookbook_heading: str = Field(description="Heading on the wide picture, in title case. 4 to 6 words. Example: Modern Tools For Everyday Cooking.")
    lookbook_text: str = Field(description="Line under that heading. 16 to 24 words.")
    video_heading: str = Field(description="Heading on the video tile, in title case. 6 to 10 words. Example: Discover The Appliances That Make Every Meal Easier.")

    faq_kicker: str = Field(description="Small uppercase label above the questions. 1 word. Example: FAQ.")
    faq_heading: str = Field(description="Heading above the questions, in title case. 3 to 5 words. Example: Everything You Need To Know.")
    faq_q_1: str = Field(description="Question 1, about choosing the right appliance. 5 to 10 words.")
    faq_a_1: str = Field(description="Answer 1. 18 to 30 words, general and true for any store, with no made-up policy.")
    faq_q_2: str = Field(description="Question 2, about cleaning and caring for the appliances. 5 to 10 words.")
    faq_a_2: str = Field(description="Answer 2. 18 to 30 words, general and true for any store.")
    faq_q_3: str = Field(description="Question 3, about using the appliances safely. 5 to 10 words.")
    faq_a_3: str = Field(description="Answer 3. 18 to 30 words, pointing to the manual that comes with each product, with no made-up specifications.")
    faq_q_4: str = Field(description="Question 4, about reaching customer service. 5 to 10 words.")
    faq_a_4: str = Field(description="Answer 4. 18 to 30 words, pointing to the contact page, with no made-up hours.")
    faq_q_5: str = Field(description="Question 5, about hearing of new arrivals. 5 to 10 words.")
    faq_a_5: str = Field(description="Answer 5. 18 to 30 words, pointing to the newsletter.")
    faq_q_6: str = Field(description="Question 6, about where to find delivery and return details. 5 to 10 words.")
    faq_a_6: str = Field(description="Answer 6. 18 to 30 words, pointing to the store's shipping and refund policy pages, with no made-up periods or prices.")

    policy_1_title: str = Field(description="Service column 1 title, about delivery, with no promise the store has not made. 2 to 3 words. Example: Careful Delivery.")
    policy_1_text: str = Field(description="Service column 1 line. 8 to 12 words, with no made-up thresholds or times.")
    policy_1_link: str = Field(description="Link label under column 1, leading to the shipping policy. 2 to 3 words. Example: Shipping Options.")
    policy_2_title: str = Field(description="Service column 2 title, about flexible or easy payment. 2 to 4 words.")
    policy_2_text: str = Field(description="Service column 2 line. 8 to 12 words.")
    policy_2_link: str = Field(description="Link label under column 2, leading to the refund policy. 2 to 5 words. Example: How To Return An Item.")
    policy_3_title: str = Field(description="Service column 3 title, about help choosing or using the appliances. 2 to 3 words. Example: Expert Help.")
    policy_3_text: str = Field(description="Service column 3 line. 8 to 12 words, with no made-up return periods or warranties.")
    policy_3_link: str = Field(description="Link label under column 3, leading to the terms of service. 2 to 4 words. Example: Read Our Terms.")
    policy_4_title: str = Field(description="Service column 4 title, about secure checkout. 2 to 3 words.")
    policy_4_text: str = Field(description="Service column 4 line. 8 to 12 words.")
    policy_4_link: str = Field(description="Link label under column 4, leading to the contact page. 2 words. Example: Support Now.")

    footer_newsletter_heading: str = Field(description="Footer heading meaning 'Subscribe Our Newsletter'. 2 to 4 words.")
    footer_newsletter_text: str = Field(description="Line inviting shoppers to join the newsletter. 12 to 18 words, with no made-up offer.")
    footer_thanks_heading: str = Field(description="Short thank-you heading in the footer. 3 to 5 words. Example: Thank You For Choosing Us!")
    footer_thanks_text: str = Field(description="Thank-you line in the footer. 15 to 24 words.")

    popup_heading: str = Field(description="Heading on the newsletter popup. 1 to 2 words. Example: Newsletter.")
    popup_text: str = Field(description="Newsletter popup text. 14 to 22 words about new arrivals and news, with no made-up discount.")

    label_learn_more: str = Field(description="Link label meaning 'Learn more'. 1 to 2 words.")
    label_view_collection: str = Field(description="Link label meaning 'View All Collection'. 2 to 3 words.")
    label_follow_now: str = Field(description="Button label meaning 'Follow Now'. 1 to 2 words.")
    label_quick_add: str = Field(description="Button label meaning 'Quick add', for products with variants. 1 to 2 words.")
    label_subscribe: str = Field(description="Button label meaning 'Subscribe'. 1 word.")
    label_submit: str = Field(description="Button label meaning 'Submit'. 1 word.")
    label_search: str = Field(description="The word 'Search'. 1 word.")
    label_search_placeholder: str = Field(description="Search field placeholder meaning 'Enter Your Keywords'. 2 to 3 words.")
    label_account: str = Field(description="The word 'Account'. 1 word.")
    label_wishlist: str = Field(description="The word 'Wishlist'. 1 word.")
    label_cart: str = Field(description="The word 'Cart'. 1 word.")
    label_items: str = Field(description="The word 'items', as in '2 items' in the cart. 1 word.")
    label_trending: str = Field(description="Label meaning 'Search Trending' above suggested searches. 2 words.")
    label_featured: str = Field(description="Label meaning 'Featured Product' in the menu. 2 words.")
    label_categories: str = Field(description="The word 'Categories'. 1 word.")
    label_filter_by: str = Field(description="Label meaning 'Filter By' above collection filters. 2 words.")
    label_reset: str = Field(description="The word 'Reset' on a collection filter. 1 word.")
    footer_contact_heading: str = Field(description="Footer heading meaning 'Contact Us'. 1 to 2 words.")
    footer_account_heading: str = Field(description="Footer heading meaning 'My Account'. 1 to 2 words.")
    footer_policies_heading: str = Field(description="Footer heading meaning 'Our Policies'. 1 to 2 words.")
    footer_collection_heading: str = Field(description="Footer heading meaning 'Collection'. 1 word.")
    footer_care_heading: str = Field(description="Footer heading meaning 'Customer Care'. 1 to 2 words.")
