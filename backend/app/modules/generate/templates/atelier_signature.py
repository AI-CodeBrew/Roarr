"""
Atelier product page (template 7) for every category.

Cinematic, editorial copy in the Atelier voice: quiet confidence, short serif headlines, sensory but
precise detail, no hype. Every field is sized for the section that shows it. The page never shows
invented customer reviews: the social proof section uses the brand's own statement plus real review
data and testimonials the merchant adds in the theme editor.
"""

from pydantic import BaseModel, Field


class AtelierTemplate(BaseModel):
    """Atelier product page. Every line is sized for its section."""

    # Cinematic hero
    product_title: str = Field(
        description="Product title. 2 to 6 words. Elegant and specific; shown very large in a serif face."
    )
    product_subtitle: str = Field(
        description="One or two sentences under the title. 16 to 28 words. What the product is and why it is worth owning, in a calm, refined voice."
    )
    atelier_eyebrow: str = Field(
        description="Small uppercase label above the title. 2 to 5 words. The product type plus one fact, joined with a middle dot. Example Eau de parfum · 50 ml."
    )
    atelier_cta_primary: str = Field(description="Main hero button. 2 to 3 words. Example Shop now.")
    atelier_cta_secondary: str = Field(description="Secondary hero link. 2 to 4 words. Example Discover the story.")
    atelier_price_note: str = Field(
        description="Small note under the price. 4 to 10 words. Example Taxes included. Complimentary gift wrapping."
    )

    # Brand storytelling
    atelier_story_eyebrow: str = Field(description="Small label. 1 to 3 words. Example The story.")
    atelier_story_heading: str = Field(description="Story headline. 3 to 6 words. Evocative, editorial. Example Light, held in amber.")
    atelier_story_text: str = Field(
        description="Story paragraph. 35 to 55 words. The idea behind the product and how it feels to use, grounded in the product context."
    )
    atelier_story_point_1: str = Field(description="Story detail 1. 4 to 8 words. A concrete craft or material fact.")
    atelier_story_point_2: str = Field(description="Story detail 2. 4 to 8 words. A different concrete fact.")
    atelier_story_point_3: str = Field(description="Story detail 3. 4 to 8 words. A different concrete fact.")
    atelier_story_signature: str = Field(description="Closing line in italics. 3 to 6 words. A short, memorable sign-off.")

    # Interactive feature tabs: four tabs, each with an image
    atelier_features_eyebrow: str = Field(description="Small label. 1 to 3 words. Example In detail.")
    atelier_features_heading: str = Field(description="Features headline. 3 to 6 words. Example Every part, considered.")
    atelier_feature_1_title: str = Field(description="Tab 1 title. 1 to 3 words. A part or quality of the product. Example The cap.")
    atelier_feature_1_text: str = Field(description="Tab 1 text. 20 to 35 words. What it is and why it matters.")
    atelier_feature_1_spec: str = Field(
        description="Tab 1 detail line. 2 to 6 words, two facts joined with a middle dot. Facts from the product context only. Example Solid brass · Brushed finish."
    )
    atelier_feature_2_title: str = Field(description="Tab 2 title. 1 to 3 words. A different part or quality.")
    atelier_feature_2_text: str = Field(description="Tab 2 text. 20 to 35 words.")
    atelier_feature_2_spec: str = Field(description="Tab 2 detail line. 2 to 6 words, facts from the product context only.")
    atelier_feature_3_title: str = Field(description="Tab 3 title. 1 to 3 words. A different part or quality.")
    atelier_feature_3_text: str = Field(description="Tab 3 text. 20 to 35 words.")
    atelier_feature_3_spec: str = Field(description="Tab 3 detail line. 2 to 6 words, facts from the product context only.")
    atelier_feature_4_title: str = Field(description="Tab 4 title. 1 to 3 words. How the product is used or enjoyed.")
    atelier_feature_4_text: str = Field(description="Tab 4 text. 20 to 35 words.")
    atelier_feature_4_spec: str = Field(description="Tab 4 detail line. 2 to 6 words, facts from the product context only.")

    # Purchase section
    delivery_line: str = Field(
        description="Delivery line next to a truck icon. 8 to 16 words. Example Order today and it ships within 1 to 2 working days."
    )
    badge_text_1: str = Field(description="Trust item next to a shield icon. 1 to 3 words. Example Authentic.")
    badge_text_2: str = Field(description="Trust item next to a return arrow icon. 1 to 3 words. Example Easy returns.")
    badge_text_3: str = Field(description="Trust item next to a lock icon. 1 to 3 words. Example Secure checkout.")
    atelier_acc_1_title: str = Field(description="First accordion label. 1 word. Example Details.")
    atelier_acc_1_body: str = Field(
        description="First accordion text, used when the product has no description. 30 to 50 words about the product."
    )
    atelier_acc_2_title: str = Field(description="Second accordion label. 1 word. Example Shipping.")
    atelier_acc_2_body: str = Field(
        description="Shipping accordion text. 20 to 35 words. Dispatch, packaging and tracking. Avoid specific prices or carriers unless given in the context."
    )
    atelier_acc_3_title: str = Field(description="Third accordion label. 2 to 3 words. Example Returns & refunds.")
    atelier_acc_3_body: str = Field(
        description="Returns accordion text. 15 to 30 words. A simple, reassuring return process. Use a return window only if the context gives one."
    )
    atelier_acc_4_title: str = Field(description="Fourth accordion label. 1 word. Example Payment.")
    atelier_acc_4_body: str = Field(description="Payment accordion text. 10 to 20 words. Secure payment with the methods shown at checkout.")
    atelier_in_stock: str = Field(description="Stock message when available. 1 to 3 words. Example In stock.")
    atelier_low_stock: str = Field(
        description="Low stock message. 2 to 5 words and must contain the placeholder [n] (square brackets) for the number left. Example Only [n] left."
    )
    atelier_added: str = Field(description="Message after adding to the bag. 3 to 5 words. Example Added to your bag.")
    atelier_view_bag: str = Field(description="Link to the cart. 1 to 2 words. Example View bag.")
    atelier_checkout: str = Field(description="Link to checkout. 1 word. Example Checkout.")
    atelier_reviews_label: str = Field(description="Word after the review count. 1 word, lower case. Example reviews.")

    # Benefits and specifications
    atelier_specs_eyebrow: str = Field(description="Small label. 1 to 3 words. Example Why it matters.")
    atelier_specs_heading: str = Field(description="Benefits headline. 4 to 8 words. Example Quiet on the shelf, unforgettable on skin.")
    atelier_specs_text: str = Field(description="Benefits intro. 22 to 36 words.")
    atelier_specs_title: str = Field(description="Specifications table heading. 1 to 2 words. Example Specifications.")
    atelier_benefit_1_title: str = Field(description="Benefit 1 title. 2 to 4 words.")
    atelier_benefit_1_text: str = Field(description="Benefit 1 text. 10 to 18 words.")
    atelier_benefit_2_title: str = Field(description="Benefit 2 title. 2 to 4 words. A different benefit.")
    atelier_benefit_2_text: str = Field(description="Benefit 2 text. 10 to 18 words.")
    atelier_benefit_3_title: str = Field(description="Benefit 3 title. 2 to 4 words. A different benefit.")
    atelier_benefit_3_text: str = Field(description="Benefit 3 text. 10 to 18 words.")
    atelier_spec_1_label: str = Field(description="Spec row 1 label. 1 to 2 words. Example Material, Size, Volume.")
    atelier_spec_1_value: str = Field(
        description="Spec row 1 value. 1 to 5 words. Facts from the product context only; if unknown, describe a quality rather than inventing a number."
    )
    atelier_spec_2_label: str = Field(description="Spec row 2 label. 1 to 2 words.")
    atelier_spec_2_value: str = Field(description="Spec row 2 value. 1 to 5 words. Facts from the product context only.")
    atelier_spec_3_label: str = Field(description="Spec row 3 label. 1 to 2 words.")
    atelier_spec_3_value: str = Field(description="Spec row 3 value. 1 to 5 words. Facts from the product context only.")
    atelier_spec_4_label: str = Field(description="Spec row 4 label. 1 to 2 words.")
    atelier_spec_4_value: str = Field(description="Spec row 4 value. 1 to 5 words. Facts from the product context only.")
    atelier_spec_5_label: str = Field(description="Spec row 5 label. 1 to 2 words.")
    atelier_spec_5_value: str = Field(description="Spec row 5 value. 1 to 5 words. Facts from the product context only.")
    atelier_spec_6_label: str = Field(description="Spec row 6 label. 1 to 2 words. Example Care.")
    atelier_spec_6_value: str = Field(description="Spec row 6 value. 1 to 5 words.")

    # Lifestyle and trust
    atelier_proof_eyebrow: str = Field(description="Small label. 2 to 5 words. Example Made to be lived with.")
    atelier_proof_quote: str = Field(
        description="A statement from the brand, shown large as a pull quote. 16 to 28 words, first person plural (we). It is the brand speaking, never a customer: do not invent reviews, ratings, awards or customer names."
    )
    atelier_proof_by: str = Field(description="Byline under the statement. 2 to 4 words. Example From the atelier.")
    atelier_trust_1_title: str = Field(description="Promise 1 title next to a truck icon. 2 to 4 words. About delivery.")
    atelier_trust_1_text: str = Field(description="Promise 1 text. 6 to 12 words.")
    atelier_trust_2_title: str = Field(description="Promise 2 title next to a return arrow icon. 2 to 4 words. About returns.")
    atelier_trust_2_text: str = Field(description="Promise 2 text. 6 to 12 words. Use a return window only if the context gives one.")
    atelier_trust_3_title: str = Field(description="Promise 3 title next to a shield icon. 2 to 4 words. About secure payment.")
    atelier_trust_3_text: str = Field(description="Promise 3 text. 6 to 12 words.")
    atelier_trust_4_title: str = Field(description="Promise 4 title next to a chat icon. 2 to 4 words. About customer support.")
    atelier_trust_4_text: str = Field(description="Promise 4 text. 6 to 12 words.")

    # Related products and closing
    atelier_related_eyebrow: str = Field(description="Small label above related products. 1 to 3 words. Example Continue exploring.")
    atelier_related_heading: str = Field(description="Related products heading. 3 to 5 words. Example You may also like.")
    atelier_closing_eyebrow: str = Field(description="Small label in the closing section. 1 to 3 words. Usually the product name.")
    atelier_closing_heading: str = Field(description="Closing headline. 3 to 6 words. Example Make it your signature.")
    atelier_closing_text: str = Field(description="One sentence. 14 to 24 words. A warm, clear reason to order today.")
