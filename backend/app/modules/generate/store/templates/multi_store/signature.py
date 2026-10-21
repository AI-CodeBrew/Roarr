from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Template 1 schema – Multi Store landing page
# ---------------------------------------------------------------------------


class HomePageMultiStore(BaseModel):
    """Home Page Multi Product Store schema."""

    # ---------------------------------------------------------------------------
    # Hero / banner — rotating carousel, one slide per product
    # Each numbered block (1, 2, 3) corresponds to a different product in the
    # store. Write as if the product itself is speaking directly to the shopper.
    # ---------------------------------------------------------------------------
    banner_heading_1: str = Field(
        description=(
            "Hero carousel slide 1 — bold headline for Product 1. "
            "Product-specific, action-forward, instantly compelling. "
            "Think magazine cover line, not product spec. Max 3 to 4 words."
        )
    )
    banner_eyebrow_1: str = Field(
        description=(
            "Benefit teaser that sits above banner_heading_1 on slide 1. "
            "Surfaces the single most desirable outcome or quality of Product 1 "
            "before the shopper reads the heading. Conversational, not clinical. "
            "Max 5 to 7 words."
        )
    )
    banner_heading_2: str = Field(
        description=(
            "Hero carousel slide 2 — bold headline for Product 2. "
            "Product-specific, action-forward, instantly compelling. "
            "Must be tonally distinct from banner_heading_1. Max 3 to 4 words."
        )
    )
    banner_eyebrow_2: str = Field(
        description=(
            "Benefit teaser that sits above banner_heading_2 on slide 2. "
            "Surfaces the single most desirable outcome or quality of Product 2. "
            "Max 5 to 7 words."
        )
    )
    banner_heading_3: str = Field(
        description=(
            "Hero carousel slide 3 — bold headline for Product 3. "
            "Product-specific, action-forward, instantly compelling. "
            "Must be tonally distinct from headings 1 and 2. Max 3 to 4 words."
        )
    )
    banner_eyebrow_3: str = Field(
        description=(
            "Benefit teaser that sits above banner_heading_3 on slide 3. "
            "Surfaces the single most desirable outcome or quality of Product 3. "
            "Max 5 to 7 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Punchy poetic headline — brand-level one-liner
    # ---------------------------------------------------------------------------
    punchy_poetic_headline: str = Field(
        description=(
            "A punchy, poetic one-liner that captures the spirit of the entire store brand — "
            "NOT about one individual product. Should evoke the brand's promise or lifestyle. "
            "STRICT RULE: Output EXACTLY 14 words — no more, no fewer. "
        )
    )

    # ---------------------------------------------------------------------------
    # Top products section — compact product card taglines
    # Three cards displayed in a row, each spotlighting a different product.
    # ---------------------------------------------------------------------------
    top_product_punchline_1: str = Field(
        description=(
            "Product card tagline for Product 1. "
            "A punchy 2–4 word benefit hook that makes the shopper want to know more. "
            "Benefit-driven, not just descriptive. Max 4 words."
        )
    )
    top_product_punchline_2: str = Field(
        description=(
            "Product card tagline for Product 2. "
            "A punchy 2–4 word benefit hook, tonally distinct from punchline 1. "
            "Benefit-driven, not just descriptive. Max 4 words."
        )
    )
    top_product_punchline_3: str = Field(
        description=(
            "Product card tagline for Product 3. "
            "A punchy 2–4 word benefit hook, tonally distinct from punchlines 1 and 2. "
            "Benefit-driven, not just descriptive. Max 4 words."
        )
    )
    top_product_punchline_1_description: str = Field(
        description=(
            "One sentence expanding on top_product_punchline_1. "
            "Highlight what makes Product 1 stand out — the differentiator, not generic praise. "
            "Conversion-focused. Max 20 words."
        )
    )
    top_product_punchline_2_description: str = Field(
        description=(
            "One sentence expanding on top_product_punchline_2. "
            "Highlight what makes Product 2 stand out — the differentiator, not generic praise. "
            "Conversion-focused. Max 20 words."
        )
    )
    top_product_punchline_3_description: str = Field(
        description=(
            "One sentence expanding on top_product_punchline_3. "
            "Highlight what makes Product 3 stand out — the differentiator, not generic praise. "
            "Conversion-focused. Max 20 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Featured products — editorial spotlight cards (larger, image-led)
    # These are full-bleed image cards with an overlaid headline + subheadline.
    # More editorial and aspirational than the compact top-products row.
    # ---------------------------------------------------------------------------
    featured_product_headline_1: str = Field(
        description=(
            "Editorial spotlight headline for Featured Product 1. "
            "A memorable, category-defining label — evocative rather than literal. "
            "Sassy or aspirational tone. Max 3 words."
        )
    )
    featured_product_headline_2: str = Field(
        description=(
            "Editorial spotlight headline for Featured Product 2. "
            "Tonally distinct from featured_product_headline_1. "
            "Sassy or aspirational tone. Max 3 words."
        )
    )
    featured_product_headline_3: str = Field(
        description=(
            "Editorial spotlight headline for Featured Product 3. "
            "Tonally distinct from headlines 1 and 2. "
            "Sassy or aspirational tone. Max 3 words."
        )
    )
    featured_product_subheadline_1: str = Field(
        description=(
            "Emotional benefit or brand differentiator for Featured Product 1, "
            "placed beneath the headline. One sharp, aspirational clause. Max 8 words."
        )
    )
    featured_product_subheadline_2: str = Field(
        description=(
            "Emotional benefit or brand differentiator for Featured Product 2, "
            "placed beneath the headline. One sharp, aspirational clause. Max 8 words."
        )
    )
    featured_product_subheadline_3: str = Field(
        description=(
            "Emotional benefit or brand differentiator for Featured Product 3, "
            "placed beneath the headline. One sharp, aspirational clause. Max 8 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Marquee — scrolling ticker strip
    # Short phrases that scroll continuously across a horizontal band.
    # Express brand values, store perks, or category attributes in uppercase shorthand.
    # ---------------------------------------------------------------------------
    marquee_text_1: str = Field(
        description=(
            "Scrolling marquee phrase 1. A brand value, shipping perk, or product attribute "
            "expressed as a punchy uppercase label. "
            "Examples: 'Free Returns', 'Handcrafted', 'Ships Today', 'Award Winning'. Max 2 words."
        )
    )
    marquee_text_2: str = Field(
        description=(
            "Scrolling marquee phrase 2. Must be different from marquee_text_1 — "
            "cover a different store benefit or quality signal. Uppercase shorthand. Max 2 words."
        )
    )
    marquee_text_3: str = Field(
        description=(
            "Scrolling marquee phrase 3. Must be different from phrases 1 and 2 — "
            "cover a third distinct store benefit or quality signal. Uppercase shorthand. Max 2 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Highlight banner — mid-page full-width CTA band
    # A single-focus promotional strip: one punchy brand promise + brief description.
    # ---------------------------------------------------------------------------
    highlight_banner_section_heading: str = Field(
        description=(
            "Bold heading for the mid-page full-width CTA band. "
            "One punchy brand promise or store-wide offer. Conversion-focused and imperative. Max 5 words."
        )
    )
    highlight_banner_section_subheading: str = Field(
        description=(
            "Short supporting label beneath the CTA band heading — "
            "a category descriptor or urgency tag. Max 3 words."
        )
    )
    highlight_banner_section_description: str = Field(
        description=(
            "Brief body copy for the CTA band. Expands on the heading with reassuring detail — "
            "what the shopper gets, why they should act now. Warm, confident tone. Max 30 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Star product features — flagship/anchor product deep-dive
    # Four key selling points for the store's most prominent product.
    # Feature names are short labels; descriptions are factual and benefit-driven.
    # ---------------------------------------------------------------------------
    star_product_feature_1: str = Field(
        description=(
            "Feature label for the store's flagship product — feature 1. "
            "Short noun phrase that names the attribute. E.g. 'Leak-Proof Lid', 'UV Protection'. Max 3 words."
        )
    )
    star_product_feature_2: str = Field(
        description=(
            "Feature label for the flagship product — feature 2. "
            "Different attribute from feature 1. Max 3 words."
        )
    )
    star_product_feature_3: str = Field(
        description=(
            "Feature label for the flagship product — feature 3. "
            "Different attribute from features 1 and 2. Max 3 words."
        )
    )
    star_product_feature_4: str = Field(
        description=(
            "Feature label for the flagship product — feature 4. "
            "Different attribute from features 1, 2, and 3. Max 3 words."
        )
    )
    star_product_feature_1_desc: str = Field(
        description=(
            "1–2 sentence description for star_product_feature_1. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    star_product_feature_2_desc: str = Field(
        description=(
            "1–2 sentence description for star_product_feature_2. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    star_product_feature_3_desc: str = Field(
        description=(
            "1–2 sentence description for star_product_feature_3. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    star_product_feature_4_desc: str = Field(
        description=(
            "1–2 sentence description for star_product_feature_4. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )

    # ---------------------------------------------------------------------------
    # FAQ — store-level questions only
    # Address shipping, returns, product range, brand story, or sustainability.
    # Do NOT write product-spec questions — those belong on the product page.
    # ---------------------------------------------------------------------------
    faq_question_1: str = Field(
        description=(
            "FAQ question 1 — store-level topic such as shipping, returns, or product range. "
            "Written as a real shopper would phrase it."
        )
    )
    faq_answer_1: str = Field(
        description=(
            "Answer to faq_question_1. 1–2 sentences, reassuring and confident. "
            "Resolve the concern and build trust."
        )
    )
    faq_question_2: str = Field(
        description=(
            "FAQ question 2 — different store-level topic from question 1. "
            "E.g. brand story, product variety, sustainability, or guarantees."
        )
    )
    faq_answer_2: str = Field(
        description=(
            "Answer to faq_question_2. 1–2 sentences, reassuring and confident. "
            "Resolve the concern and build trust."
        )
    )
    faq_question_3: str = Field(
        description=(
            "FAQ question 3 — different store-level topic from questions 1 and 2. "
            "Covers a remaining common shopper concern about the store, not a single product."
        )
    )
    faq_answer_3: str = Field(
        description=(
            "Answer to faq_question_3. 1–2 sentences, reassuring and confident. "
            "Resolve the concern and build trust."
        )
    )



class ProductPageMultiStore(BaseModel):
    """Product Page Single Product Store schema."""

    # Core product info
    product_title: str = Field(
        description="Main product title as it should appear on the product page."
    )
    product_description: str = Field(
        description="Expanded product description for the product page."
    )

    # Creative sassy block
    creative_sassy_product_heading: str = Field(
        description="Creative, sassy heading about the product."
    )
    creative_sassy_product_subheading: str = Field(
        description="Short creative, sassy subheading line about the product."
    )
    creative_sassy_product_description: str = Field(
        description="Descriptive, creative paragraph expanding on the sassy heading/subheading."
    )

    # FAQ
    faq_question_1: str = Field(
        description="FAQ question 1 for this specific product."
    )
    faq_answer_1: str = Field(
        description="FAQ answer 1. Concise but reassuring."
    )
    faq_question_2: str = Field(
        description="FAQ question 2 for this specific product."
    )
    faq_answer_2: str = Field(
        description="FAQ answer 2. Concise but reassuring."
    )
    faq_question_3: str = Field(
        description="FAQ question 3 for this specific product."
    )
    faq_answer_3: str = Field(
        description="FAQ answer 3. Concise but reassuring."
    )
