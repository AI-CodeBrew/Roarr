from pydantic import BaseModel, Field, validator


# ---------------------------------------------------------------------------
# Template 1 schema – Single Store landing page
# ---------------------------------------------------------------------------


class HomePageSingleStore(BaseModel):
    """Home Page Single Product Store schema."""

    # ---------------------------------------------------------------------------
    # Hero / banner — the first thing the shopper sees
    # ---------------------------------------------------------------------------
    banner_eyebrow: str = Field(
        description=(
            "Benefit teaser that sits above the hero heading. "
            "Surfaces the product's single most desirable outcome before the shopper reads the heading. "
            "Conversational, not clinical — feel like a friend's recommendation. Max 3 to 4 words."
        )
    )
    banner_heading: str = Field(
        description=(
            "Hero/banner heading — the first thing the shopper sees. "
            "Lead with the product's core promise or transformation, not its features. "
            "Sassy, catchy, and impossible to scroll past. Max 5 to 7 words."
        )
    )

    # ---------------------------------------------------------------------------
    # Marquee — scrolling ticker strip
    # Short phrases that scroll continuously across a horizontal band.
    # Express brand values, store perks, or product attributes in uppercase shorthand.
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
    # Image with text section — primary product storytelling block
    # Sits alongside the main product image. Heading + subheading open the story;
    # the description is the full sales narrative.
    # ---------------------------------------------------------------------------
    image_with_text_heading: str = Field(
        description=(
            "Benefit-led emotional hook that opens the product story — "
            "placed next to the main product image. "
            "Should make the shopper feel something, not just describe the product. Max 5 to 7 words."
        )
    )
    image_with_text_description_1: str = Field(
        description=(
            "This will tell about the problem statement. Write a full, flowing sales narrative for the main product image section. "
            "Describe what the product solves, how it changes the user's experience, who it's ideal for, and why it's the better choice over alternatives. "
            "Prioritize storytelling and emotional resonance—don't simply list features or specs. "
            "Each sentence should drive the story and increase desire. Use 2 to 4 sentences."
       
        )
    )
    image_with_text_description_2: str = Field(
        description=(
            "This will tell about the solution statement. Write a full, flowing sales narrative for the main product image section. "
            "Describe what the product solves, how it changes the user's experience, who it's ideal for, and why it's the better choice over alternatives. "
            "Prioritize storytelling and emotional resonance—don't simply list features or specs. "
            "Each sentence should drive the story and increase desire. Use 2 to 4 sentences."
        )
    )
    image_with_text_description_feature_1_stat: str = Field(
        description=(
            "A punchy, eye-catching metric, number, or absolute word that serves as a visual anchor for the first key product benefit. "
            "Examples: '100%', '3-in-1', 'Zero', '24hr', 'No'. "
            "Must be extremely short. Max 1 to 2 words or a short alpha-numeric string."
        )
    )
    image_with_text_description_feature_1: str = Field(
        description=(
            "A concise, scannable label explaining the first 'stat'. "
            "This usually highlights an ethical standard, formula purity, or core benefit. "
            "Examples: 'Vegan & Cruelty-Free', 'Clean Ingredients'. "
            "Max 2 to 4 words."
        )
    )
    image_with_text_description_feature_2_stat: str = Field(
        description=(
            "A punchy, eye-catching metric, number, or absolute word for the second product benefit. "
            "Often highlights a multi-action property or performance metric. Examples: '3-in-1', '5x', 'Instant'. "
            "Max 1 to 2 words or a short alpha-numeric string."
        )
    )
    image_with_text_description_feature_2: str = Field(
        description=(
            "A concise, scannable label explaining the second 'stat'. "
            "This usually lists specific actions the product takes. "
            "Examples: 'Hydrates, Calms, Exfoliates', 'Brighter Skin'. "
            "Max 2 to 4 words."
        )
    )
    image_with_text_description_feature_3_stat: str = Field(
        description=(
            "A punchy, eye-catching metric, number, or absolute word for the third product benefit. "
            "Often used to highlight what is left OUT of the product. Examples: 'Zero', '0%', 'Free of'. "
            "Max 1 to 2 words or a short alpha-numeric string."
        )
    )
    image_with_text_description_feature_3: str = Field(
        description=(
            "A concise, scannable label explaining the third 'stat'. "
            "This usually highlights 'free-from' claims or toxins avoided. "
            "Examples: 'Synthetic Fragrances', 'Parabens & Sulfates'. "
            "Max 2 to 4 words."
        )
    )


    # ---------------------------------------------------------------------------
    # Feature section — product capability showcase
    # Six feature tiles, each with a short label and a one-to-two sentence explanation.
    # ---------------------------------------------------------------------------
    feature_section_heading: str = Field(
        description=(
            "Catchy heading that introduces the product's key capabilities. "
            "Should feel exciting, not clinical — like the title of a highlight reel. Max 4 words."
        )
    )
    feature_name_1: str = Field(
        description=(
            "Feature 1 label — a short noun phrase naming the attribute. "
            "E.g. 'Long Battery Life', 'Leak-Proof', 'UV Protection'. Max 3 words."
        )
    )
    feature_name_2: str = Field(
        description=(
            "Feature 2 label — different attribute from feature 1. "
            "Short noun phrase. Max 3 words."
        )
    )
    feature_name_3: str = Field(
        description=(
            "Feature 3 label — different attribute from features 1 and 2. "
            "Short noun phrase. Max 3 words."
        )
    )
    feature_name_4: str = Field(
        description=(
            "Feature 4 label — different attribute from features 1, 2, and 3. "
            "Short noun phrase. Max 3 words."
        )
    )
    feature_name_5: str = Field(
        description=(
            "Feature 5 label — different attribute from features 1 through 4. "
            "Short noun phrase. Max 3 words."
        )
    )
    feature_name_6: str = Field(
        description=(
            "Feature 6 label — different attribute from all prior features. "
            "Short noun phrase. Max 3 words."
        )
    )
    feature_desc_1: str = Field(
        description=(
            "1–2 sentence description for feature_name_1. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    feature_desc_2: str = Field(
        description=(
            "1–2 sentence description for feature_name_2. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    feature_desc_3: str = Field(
        description=(
            "1–2 sentence description for feature_name_3. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    feature_desc_4: str = Field(
        description=(
            "1–2 sentence description for feature_name_4. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    feature_desc_5: str = Field(
        description=(
            "1–2 sentence description for feature_name_5. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )
    feature_desc_6: str = Field(
        description=(
            "1–2 sentence description for feature_name_6. "
            "Factual and benefit-driven — explain why this feature matters to the shopper."
        )
    )

    # ---------------------------------------------------------------------------
    # Punchy poetic headline — standalone graphic element
    # Rendered as a large typographic block, not inline body copy.
    # Write as if it is a tagline on a billboard — poetic, punchy, standalone.
    # ---------------------------------------------------------------------------
    punchy_poetic_headline: str = Field(
        description=(
            "A punchy, poetic one-liner that captures the spirit of the entire store brand — "
            "NOT about one individual product. Should evoke the brand's promise or lifestyle. "
            "STRICT RULE: Output EXACTLY 14 words — no more, no fewer. "
        )
    )

    # ---------------------------------------------------------------------------
    # Why choose us — trust and credibility section
    # Four reasons why this brand is the right choice. Each reason has a short
    # heading and a concrete supporting description.
    # ---------------------------------------------------------------------------
    why_choose_us_heading: str = Field(
        description=(
            "Heading that introduces the trust and credibility section. "
            "Aspirational, store-pride tone — conveys confidence in why this brand is the right choice. "
            "Max 5 words."
        )
    )
    why_choose_us_reason_1_heading: str = Field(
        description=(
            "Reason 1 heading — a short, confident label naming the brand's advantage. "
            "E.g. 'Fast Delivery', '30-Day Returns', 'Ethically Made'. Max 3 to 4 words."
        )
    )
    why_choose_us_reason_1_description: str = Field(
        description=(
            "1–2 sentences supporting why_choose_us_reason_1_heading. "
            "Factual and reassuring — give the shopper a concrete reason to believe this claim."
        )
    )
    why_choose_us_reason_2_heading: str = Field(
        description=(
            "Reason 2 heading — different advantage from reason 1. "
            "Short, confident label. Max 3 to 4 words."
        )
    )
    why_choose_us_reason_2_description: str = Field(
        description=(
            "1–2 sentences supporting why_choose_us_reason_2_heading. "
            "Factual and reassuring — give the shopper a concrete reason to believe this claim."
        )
    )
    why_choose_us_reason_3_heading: str = Field(
        description=(
            "Reason 3 heading — different advantage from reasons 1 and 2. "
            "Short, confident label. Max 3 to 4 words."
        )
    )
    why_choose_us_reason_3_description: str = Field(
        description=(
            "1–2 sentences supporting why_choose_us_reason_3_heading. "
            "Factual and reassuring — give the shopper a concrete reason to believe this claim."
        )
    )
    why_choose_us_reason_4_heading: str = Field(
        description=(
            "Reason 4 heading — different advantage from reasons 1, 2, and 3. "
            "Short, confident label. Max 3 to 4 words."
        )
    )
    why_choose_us_reason_4_description: str = Field(
        description=(
            "1–2 sentences supporting why_choose_us_reason_4_heading. "
            "Factual and reassuring — give the shopper a concrete reason to believe this claim."
        )
    )

    # ---------------------------------------------------------------------------
    # Highlight banner — mid-page full-width CTA band
    # A single-focus promotional strip: one punchy brand promise + brief description.
    # ---------------------------------------------------------------------------
    highlight_banner_section_heading: str = Field(
        description=(
            "Bold heading for the mid-page full-width CTA band. "
            "One punchy brand promise or product-wide offer. Conversion-focused and imperative. Max 4 words."
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
            "what the shopper gets, why they should act now. Warm, confident, and conversion-focused. Max 25 words."
        )
    )

    # ---------------------------------------------------------------------------
    # FAQ — product and store questions
    # Cover a mix: at least one product-specific question (usage, care, fit,
    # ingredients, compatibility) and at least one store-level question
    # (shipping, returns, guarantees). Written as a real shopper would ask.
    # ---------------------------------------------------------------------------
    faq_question_1: str = Field(
        description=(
            "FAQ question 1 — a product-specific question a real shopper would ask "
            "(e.g. usage, care, ingredients, compatibility, sizing)."
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
            "FAQ question 2 — a store-level question a real shopper would ask "
            "(e.g. shipping times, return policy, guarantees, sustainability)."
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
            "FAQ question 3 — a different topic from questions 1 and 2. "
            "Can be product-specific or store-level — whichever common shopper concern remains unaddressed."
        )
    )
    faq_answer_3: str = Field(
        description=(
            "Answer to faq_question_3. 1–2 sentences, reassuring and confident. "
            "Resolve the concern and build trust."
        )
    )



class ProductPageSingleStore(BaseModel):
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