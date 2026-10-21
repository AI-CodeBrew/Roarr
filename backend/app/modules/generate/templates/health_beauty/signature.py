from pydantic import BaseModel, Field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Template 1 schema (subset focused on key landing-page fields)
# ---------------------------------------------------------------------------


class HealthBeautyTemplate1(BaseModel):
    """Health and Beauty Template 1 schema."""

    # Product Details
    product_title: str = Field(
        description="Brief, Impactful and Persuasive Product Title. Max 4 to 6 words."
    )
    product_subtitle: str = Field(
        description="Description of the product in 20 to 25 words max"
    )

    # Badges (short labels for health & beauty)
    badge_text_1: str = Field(
        description="Badge 1 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_2: str = Field(
        description="Badge 2 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_3: str = Field(
        description="Badge 3 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_4: str = Field(
        description="Badge 4 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )

    marquee_text_1: str = Field(
        description="Marquee text 1. Max 1 to 3 words. E.g, 100% Organic"
    )
    marquee_text_2: str = Field(
        description="Marquee text 2. Max 1 to 3 words. E.g, Clinically Tested"
    )
    marquee_text_3: str = Field(
        description="Marquee text 3. Max 1 to 3 words. E.g, Cruelty Free"
    )

    # Bento stats (number + short description)
    bento_stat_1: str = Field(
        description="Bento stat 1: a number like 94% or 10+ that highlights a key metric."
    )
    bento_stat_description_1: str = Field(
        description="Bento stat 1 description. Exactly 10 words that explain and back the stat number."
    )
    bento_stat_2: str = Field(
        description="Bento stat 2: a number like 94% or 10+ that highlights a key metric."
    )
    bento_stat_description_2: str = Field(
        description="Bento stat 2 description. Exactly 10 words that explain and back the stat number."
    )

    # Product Questions and Answers (1–3)
    product_question_1: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, How to use the product?"
    )
    product_question_1_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words."
    )

    product_question_2: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, How does it work?"
    )
    product_question_2_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words."
    )

    product_question_3: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, When will I see results?"
    )
    product_question_3_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words."
    )

    # Before / After Section
    before_after_heading: str = Field(
        description="Heading of the before/after section which is a bit catchy. Max 2 to 3 words. E.g, The Velvet Touch"
    )
    before_after_subheading: str = Field(
        description="Subheading of the before/after section. Max 2 to 3 words."
    )
    before_after_feature_1: str = Field(
        description="Before/after feature 1. Short label or phrase for this section. Max 2 to 5 words. E.g. Dull Skin, Hydrated Glow."
    )
    before_after_feature_2: str = Field(
        description="Before/after feature 2. Short label or phrase for this section. Max 2 to 5 words. E.g. Dry Patches, Smooth Texture."
    )
    before_after_feature_3: str = Field(
        description="Before/after feature 3. Short label or phrase for this section. Max 2 to 5 words. E.g. Fine Lines, Visible Reduction."
    )
    before_after_feature_4: str = Field(
        description="Before/after feature 4. Short label or phrase for this section. Max 2 to 5 words. E.g. Uneven Tone, Radiant Even Skin."
    )

    # Four Blocks Section
    four_blocks_heading: str = Field(
        description="Benefit-driven heading for the four-blocks section. Max 3 to 4 words."
    )
    four_blocks_subheading: str = Field(
        description="Subheading for the four-blocks section. Max 8 to 12 words."
    )
    four_blocks_block_1_name: str = Field(
        description="Name for four-blocks feature 1. Max 2 to 3 words."
    )
    four_blocks_block_1_desc: str = Field(
        description="Description for four-blocks feature 1. Max 8 to 12 words."
    )
    four_blocks_block_2_name: str = Field(
        description="Name for four-blocks feature 2. Max 2 to 3 words."
    )
    four_blocks_block_2_desc: str = Field(
        description="Description for four-blocks feature 2. Max 8 to 12 words."
    )
    four_blocks_block_3_name: str = Field(
        description="Name for four-blocks feature 3. Max 2 to 3 words."
    )
    four_blocks_block_3_desc: str = Field(
        description="Description for four-blocks feature 3. Max 8 to 12 words."
    )
    four_blocks_block_4_name: str = Field(
        description="Name for four-blocks feature 4. Max 2 to 3 words."
    )
    four_blocks_block_4_desc: str = Field(
        description="Description for four-blocks feature 4. Max 8 to 12 words."
    )

    # Circular Features Section — feature set (names and short descriptions for product features)
    circular_features_heading: str = Field(
        description="Heading for the circular feature set section. Max 2 to 3 words."
    )
    circular_features_subheading: str = Field(
        description="Subheading for the circular feature set section."
    )
    circular_feature_1_name: str = Field(
        description="Feature set item 1: short name for a product feature (e.g. environment/situation). Max 1 word."
    )
    circular_feature_1_desc: str = Field(
        description="Feature set item 1: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_2_name: str = Field(
        description="Feature set item 2: short name for a product feature (e.g. environment/situation). Max 1 word."
    )
    circular_feature_2_desc: str = Field(
        description="Feature set item 2: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_3_name: str = Field(
        description="Feature set item 3: short name for a product feature (e.g. environment/situation). Max 1 word."
    )
    circular_feature_3_desc: str = Field(
        description="Feature set item 3: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_4_name: str = Field(
        description="Feature set item 4: short name for a product feature (e.g. environment/situation). Max 1 word."
    )
    circular_feature_4_desc: str = Field(
        description="Feature set item 4: short description of the feature. Max 8 to 10 words."
    )

    # Stats section — contains stat points about the product
    stats_section_heading: str = Field(
        description="Stats section heading. This section contains stat points about the product. Max 3 to 5 words."
    )
    stats_section_point_1_heading: str = Field(
        description="Stat point 1 heading. Max 5 to 7 words."
    )
    stats_section_point_1_desc: str = Field(
        description="Stat point 1 description. Max 8 to 12 words."
    )
    stats_section_point_2_heading: str = Field(
        description="Stat point 2 heading. Max 5 to 7 words."
    )
    stats_section_point_2_desc: str = Field(
        description="Stat point 2 description. Max 8 to 12 words."
    )
    stats_section_point_3_heading: str = Field(
        description="Stat point 3 heading. Max 5 to 7 words."
    )
    stats_section_point_3_desc: str = Field(
        description="Stat point 3 description. Max 8 to 12 words."
    )

    # Creative sassy section — catchy, sassy or poetic statements about the product
    creative_sassy_product_heading: str = Field(
        description="A catchy, sassy or poetic statement about the product. Max 4 to 5 words."
    )
    creative_sassy_product_subheading_1: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words."
    )
    creative_sassy_product_subheading_2: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words."
    )
    creative_sassy_product_subheading_3: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words."
    )
    creative_sassy_product_subheading_4: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words."
    )
    creative_sassy_product_subheading_1_description: str = Field(
        description="One short phrase under feature title 1. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_2_description: str = Field(
        description="One short phrase under feature title 2. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_3_description: str = Field(
        description="One short phrase under feature title 3. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_4_description: str = Field(
        description="One short phrase under feature title 4. Max 6 words. Not a full sentence."
    )

    # Pillow banner — another catchy, sassy or poetic statement
    pillow_banner_heading: str = Field(
        description="A catchy, sassy or poetic line for the pillow banner (same tone as the creative heading). Max 3 to 5 words."
    )
    pillow_banner_subheading: str = Field(
        description="A catchy, sassy or poetic subheading for the pillow banner. Max 8 to 15 words."
    )

    # What Sets Us Apart
    what_set_us_apart_subheading: str = Field(
        description="What sets us apart subheading. Max 25 to 30 words."
    )
    what_sets_us_apart_feature_1: str = Field(
        description="What sets us apart feature 1. Max 3 words."
    )
    what_sets_us_apart_feature_2: str = Field(
        description="What sets us apart feature 2. Max 3 words."
    )
    what_sets_us_apart_feature_3: str = Field(
        description="What sets us apart feature 3. Max 3 words."
    )

    # FAQ (1–3)
    faq_question_1: str = Field(
        description="FAQ question 1. E.g, How long does one bottle last?"
    )
    faq_answer_1: str = Field(
        description="FAQ answer 1. Max 30 to 40 words."
    )
    faq_question_2: str = Field(
        description="FAQ question 2. E.g, Can I use this with other products?"
    )
    faq_answer_2: str = Field(
        description="FAQ answer 2. Max 30 to 40 words."
    )
    faq_question_3: str = Field(
        description="FAQ question 3. E.g, Is there a money-back guarantee?"
    )
    faq_answer_3: str = Field(
        description="FAQ answer 3. Max 30 to 40 words."
    )

class HealthBeautyTemplate2(BaseModel):
    """Health and Beauty Template 2 schema (full schema)."""
    
    # Product Details
    product_title: str = Field(
        description="Brief, Impactful and Persuasive Product Title. Max 4 to 6 words."
    )
    product_subtitle: str = Field(
        description="Describes the product that what it does and what it is for. Max 15 to 18 words."
    )

    marquee_text_1: str = Field(
        description="Marquee text 1. Max 1 to 3 words. E.g, 100% Organic"
    )
    marquee_text_2: str = Field(
        description="Marquee text 2. Max 1 to 3 words. E.g, Clinically Tested"
    )
    marquee_text_3: str = Field(
        description="Marquee text 3. Max 1 to 3 words. E.g, Cruelty Free"
    )
    
    # Badges (short labels for health & beauty)
    badge_text_1: str = Field(
        description="Badge 1 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_2: str = Field(
        description="Badge 2 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_3: str = Field(
        description="Badge 3 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )
    badge_text_4: str = Field(
        description="Badge 4 text. Short label for beauty/skincare. E.g. 100% Organic, Cruelty Free, Dermatologist Tested, Paraben Free. Max 2 to 3 words."
    )

    # Product Questions and Answers
    product_question_1: str = Field(    
        description="Short question about the product, potentially asked by the customer. E.g, How to use the product?"
    )
    product_question_1_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words. E.g, Apply a small amount to clean, dry skin."
    )
    
    product_question_2: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, How does it work?"
    )
    product_question_2_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words. E.g, Active ingredients penetrate deep into skin layers."
    )
    
    product_question_3: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, When will I see results?"
    )
    product_question_3_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words. E.g, Most customers notice improvements within 2-4 weeks."
    )
    
    product_question_4: str = Field(
        description="Short question about the product, potentially asked by the customer. E.g, Is it safe for sensitive skin?"
    )
    product_question_4_answer: str = Field(
        description="Answer to the question about the product, potentially asked by the customer. Short 8 to 12 words. E.g, Yes, our formula is gentle and hypoallergenic."
    )
    
    # Mid Section 1
    high_impacting_product_heading: str = Field(
        description="High impacting statement as a heading. Max 3 to 4 words. E.g, Built for Long Lasting Results"
    )
    high_impacting_product_subheading: str = Field(
        description="High impacting statement as a subheading. Max 25 to 30 words. E.g, Our advanced formula combines cutting-edge science with nature's finest ingredients to deliver transformative results."
    )
    
    # Before/After Section

    before_after_heading: str = Field(
        description="Heading of the before/after section which is a bit catchy. Max 2 to 3 words. E.g, The Velvet Touch"
    )
    before_after_subheading: str = Field(
        description="Subheading of the before/after section which is a bit catchy. Max 2 to 3 words. E.g, The Velvet Touch"
    )
    before_use_issue_1: str = Field(
        description="Issue or problem the user is facing before the product is used. Max 1 to 2 words. E.g, Flaky Skin."
    )
    before_use_issue_2: str = Field(
        description="Issue or problem the user is facing before the product is used. Max 2 to 3 words. E.g, Dry Lips."
    )
    before_use_issue_3: str = Field(
        description="Issue or problem the user is facing before the product is used. Max 2 to 3 words. E.g, Fine Lines."
    )

    after_use_benefit_1: str = Field(
        description="Benefit of the product after use. Max 1 to 2 words. E.g, Soft Skin."
    )
    after_use_benefit_2: str = Field(
        description="Benefit of the product after use. Max 1 to 2 words. E.g, Hydrated Lips."
    )
    after_use_benefit_3: str = Field(
        description="Benefit of the product after use. Max 1 to 2 words. E.g, Smooth Skin."
    )


    # Creative sassy section — catchy, sassy or poetic statements about the product
    creative_sassy_product_heading: str = Field(
        description="A catchy, sassy or poetic statement about the product. Max 4 to 5 words. E.g. Your Glossy Gang Gets it."
    )
    creative_sassy_product_subheading_1: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words. E.g. Irresistible Shine."
    )
    creative_sassy_product_subheading_1_description: str = Field(
        description="One short phrase under feature title 1. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_2: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words. E.g. Skip out on the stickiness."
    )
    creative_sassy_product_subheading_2_description: str = Field(
        description="One short phrase under feature title 2. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_3: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words. E.g. Double it, layer it, do it all."
    )
    creative_sassy_product_subheading_3_description: str = Field(
        description="One short phrase under feature title 3. Max 6 words. Not a full sentence."
    )
    creative_sassy_product_subheading_4: str = Field(
        description="A catchy, sassy or poetic short line about the product (same tone as the main heading). Max 2 to 4 words. E.g. Plump, bouncy pout."
    )
    creative_sassy_product_subheading_4_description: str = Field(
        description="One short phrase under feature title 4. Max 6 words. Not a full sentence."
    )

    # Circular features — feature set (names and short descriptions for product features)
    circular_features_heading: str = Field(
        description="Heading for the circular feature set section. Max 2 to 3 words. E.g. Your Daily Routine."
    )
    circular_feature_1_name: str = Field(
        description="Feature set item 1: short name for a product feature (e.g. environment/situation). Max 1 word. E.g. Office."
    )
    circular_feature_1_desc: str = Field(
        description="Feature set item 1: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_2_name: str = Field(
        description="Feature set item 2: short name for a product feature (e.g. environment/situation). Max 1 to 2 words. E.g. Travel Friendly, On the Go."
    )
    circular_feature_2_desc: str = Field(
        description="Feature set item 2: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_3_name: str = Field(
        description="Feature set item 3: short name for a product feature (e.g. environment/situation). Max 1 word. E.g. Smudge Resistant."
    )
    circular_feature_3_desc: str = Field(
        description="Feature set item 3: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_4_name: str = Field(
        description="Feature set item 4: short name for a product feature (e.g. environment/situation). Max 1 word. E.g. Deep Sleep."
    )
    circular_feature_4_desc: str = Field(
        description="Feature set item 4: short description of the feature. Max 8 to 10 words."
    )

    
    # Four Blocks Section
    four_blocks_heading: str = Field(
        description="Benefit-driven heading for the four-blocks section (beauty/skincare). Max 3 to 4 words. E.g. Features that elevate your glow"
    )
    four_blocks_subheading: str = Field(
        description="Subheading for the four-blocks section. Max 8 to 12 words. E.g. Our formula combines proven ingredients with gentle care for visible results you can trust."
    )

    four_blocks_block_1_name: str = Field(
        description="Benefit or feature name for beauty/skincare product. Max 2 to 3 words. E.g. Deep Hydration"
    )
    four_blocks_block_1_desc: str = Field(
        description="Description of the benefit or feature. Max 8 to 12 words. E.g. Hyaluronic acid and natural oils lock in moisture for 24-hour hydration."
    )

    four_blocks_block_2_name: str = Field(
        description="Benefit or feature name for beauty/skincare product. Max 2 to 3 words. E.g. Gentle Formula"
    )
    four_blocks_block_2_desc: str = Field(
        description="Description of the benefit or feature. Max 8 to 12 words. E.g. Free from parabens, sulfates, and fragrances; suitable for sensitive skin."
    )

    four_blocks_block_3_name: str = Field(
        description="Benefit or feature name for beauty/skincare product. Max 2 to 3 words. E.g. Fast Absorption"
    )
    four_blocks_block_3_desc: str = Field(
        description="Description of the benefit or feature. Max 8 to 12 words. E.g. Lightweight texture absorbs quickly with no sticky or greasy residue."
    )

    four_blocks_block_4_name: str = Field(
        description="Benefit or feature name for beauty/skincare product. Max 2 to 3 words. E.g. Visible Results"
    )
    four_blocks_block_4_desc: str = Field(
        description="Description of the benefit or feature. Max 8 to 12 words. E.g. Clinically shown to improve skin clarity and radiance within weeks."
    )
    
    # Stats section — contains stat points about the product
    stats_section_heading: str = Field(
        description="Stats section heading. This section contains stat points about the product. Max 3 to 5 words. E.g. Proven results you can trust."
    )
    stats_section_point_1_heading: str = Field(
        description="Stat point 1 heading. Max 5 to 7 words. E.g. Visible Improvement."
    )
    stats_section_point_1_desc: str = Field(
        description="Stat point 1 description. Max 8 to 12 words."
    )
    stats_section_point_2_heading: str = Field(
        description="Stat point 2 heading. Max 5 to 7 words. E.g. Smoother, More Radiant Skin."
    )
    stats_section_point_2_desc: str = Field(
        description="Stat point 2 description. Max 8 to 12 words."
    )
    stats_section_point_3_heading: str = Field(
        description="Stat point 3 heading. Max 5 to 7 words. E.g. Reduction in Fine Lines."
    )
    stats_section_point_3_desc: str = Field(
        description="Stat point 3 description. Max 8 to 12 words."
    )

    # Pillow banner — another catchy, sassy or poetic statement
    pillow_banner_heading: str = Field(
        description="A catchy, sassy or poetic line for the pillow banner (same tone as the creative heading). Max 3 to 5 words."
    )
    pillow_banner_subheading: str = Field(
        description="A catchy, sassy or poetic subheading for the pillow banner. Max 8 to 15 words."
    )
    
    # What Sets Us Apart Section
    what_set_us_apart_subheading: str = Field(
        description="What sets us apart subheading. Max 25 to 30 words. E.g, Our unique approach combines nature and science for unmatched results that you can see and feel."
    )
    what_sets_us_apart_feature_1: str = Field(
        description="What sets us apart feature 1. Max 3 words. E.g, Natural Ingredients"
    )
    what_sets_us_apart_feature_2: str = Field(
        description="What sets us apart feature 2. Max 3 words. E.g, Clinically Tested"
    )
    what_sets_us_apart_feature_3: str = Field(
        description="What sets us apart feature 3. Max 3 words. E.g, Fast Results"
    )
    
    
    # FAQ Section
    faq_question_1: str = Field(
        description="FAQ question 1. E.g, How long does one bottle last?"
    )
    faq_answer_1: str = Field(
        description="FAQ answer 1. Max 30 to 40 words. E.g, One bottle typically lasts 2-3 months with daily use, depending on application amount."
    )
    faq_question_2: str = Field(
        description="FAQ question 2. E.g, Can I use this with other products?"
    )
    faq_answer_2: str = Field(
        description="FAQ answer 2. Max 30 to 40 words. E.g, Yes, our product works well with your existing skincare routine. Apply after cleansing and before moisturizer."
    )
    faq_question_3: str = Field(
        description="FAQ question 3. E.g, Is there a money-back guarantee?"
    )
    faq_answer_3: str = Field(
        description="FAQ answer 3. Max 30 to 40 words. E.g, Yes, we offer a 30-day satisfaction guarantee. If you're not completely satisfied, contact us for a full refund."
    )
    faq_question_4: str = Field(
        description="FAQ question 4. E.g, What if I have sensitive skin?"
    )
    faq_answer_4: str = Field(
        description="FAQ answer 4. Max 30 to 40 words. E.g, Our formula is gentle and suitable for sensitive skin. We recommend doing a patch test before full application."
    )
    faq_question_5: str = Field(
        description="FAQ question 5. E.g, How should I store the product?"
    )
    faq_answer_5: str = Field(
        description="FAQ answer 5. Max 30 to 40 words. E.g, Store in a cool, dry place away from direct sunlight. Keep the cap tightly closed when not in use."
    )


# ---------------------------------------------------------------------------
# Template 2 (full schema)
# ---------------------------------------------------------------------------
# (HealthBeautyTemplate2 class defined above)


class HealthBeautyGlow(BaseModel):
    """Health & Beauty Aura page. Every line is sized for its section."""

    product_title: str = Field(
        description="Hero title. 2 to 6 words. Fits one or two lines at a large serif size."
    )
    product_subtitle: str = Field(
        description="One sentence under the price. 12 to 20 words."
    )
    badge_text_1: str = Field(description="Trust line under the buy button. 1 to 3 words.")
    badge_text_2: str = Field(description="Trust line. 1 to 3 words. Different from the first.")
    badge_text_3: str = Field(description="Trust line. 1 to 3 words. Different from the first two.")
    delivery_line: str = Field(description="One delivery line under the buy button. 6 to 12 words. Example Estimated delivery in 5 to 8 days.")
    shipping_line: str = Field(description="One shipping line under the buy button. 6 to 12 words. Example Free shipping and returns on orders over $75.")
    product_question_1: str = Field(description="Tab label. 1 to 3 words. Example Product detail.")
    product_question_1_answer: str = Field(description="Accordion answer. 12 to 22 words.")
    product_question_2: str = Field(description="Tab label. 2 to 4 words. Example Shipping and return.")
    product_question_2_answer: str = Field(description="Returns paragraph. 30 to 50 words. Mention eligible refunds, that original shipping is not refunded, and a return window.")
    ship_heading: str = Field(description="Left column heading. One word. Example Shipping.")
    ship_body_1: str = Field(description="How the order is packed and shipped. 14 to 24 words. No product name.")
    ship_body_2: str = Field(description="Delivery window sentence. 12 to 22 words.")
    ship_body_3: str = Field(description="Faster shipping option sentence. 12 to 22 words.")
    returns_heading: str = Field(description="Right column heading. 2 words. Example Free returns.")
    returns_body: str = Field(description="Returns paragraph. 30 to 50 words. Mention eligible refunds, that original shipping is not refunded, and a return window.")
    circular_features_heading: str = Field(
        description="Section heading above three photos. 3 to 6 words. Example why is it special?"
    )
    circular_feature_1_name: str = Field(description="One-word benefit under the first photo.")
    circular_feature_1_desc: str = Field(description="Caption under the first benefit. 8 to 14 words.")
    circular_feature_2_name: str = Field(description="One-word benefit under the second photo. Different from the first.")
    circular_feature_2_desc: str = Field(description="Caption under the second benefit. 8 to 14 words.")
    circular_feature_3_name: str = Field(description="One-word benefit under the third photo. Different from the first two.")
    circular_feature_3_desc: str = Field(description="Caption under the third benefit. 8 to 14 words.")
    circular_feature_4_name: str = Field(description="One-word benefit for the fourth row. Different from the first three.")
    circular_feature_4_desc: str = Field(description="Caption for the fourth benefit. 8 to 14 words.")
    circular_feature_5_name: str = Field(description="One-word benefit for the fifth row. Different from the first four.")
    circular_feature_5_desc: str = Field(description="Caption for the fifth benefit. 8 to 14 words.")
    bento_stat_1: str = Field(description="Short result figure. 2 to 5 characters. Example 100% or 24h.")
    bento_stat_description_1: str = Field(description="Line under the first figure. 4 to 8 words.")
    bento_stat_2: str = Field(description="Short result figure. 2 to 5 characters. Different from the first.")
    bento_stat_description_2: str = Field(description="Line under the second figure. 4 to 8 words.")
    stats_section_point_1_heading: str = Field(description="Short result figure. 2 to 8 characters. Example 0 flake.")
    stats_section_point_1_desc: str = Field(description="Line under the third figure. 4 to 8 words.")
    four_blocks_heading: str = Field(description="Small label above the ingredients heading. 1 word. Example Ingredients.")
    four_blocks_subheading: str = Field(description="Ingredients heading. 4 to 8 words.")
    ingredients_intro: str = Field(description="One sentence under the ingredients heading. 12 to 20 words.")
    four_blocks_block_1_name: str = Field(description="Ingredient name. 1 to 2 words.")
    four_blocks_block_1_desc: str = Field(description="What that ingredient does. 8 to 16 words.")
    four_blocks_block_2_name: str = Field(description="Ingredient name. 1 to 2 words. Different from the first.")
    four_blocks_block_2_desc: str = Field(description="What that ingredient does. 8 to 16 words.")
    four_blocks_block_3_name: str = Field(description="Ingredient name. 1 to 2 words. Different from the first two.")
    four_blocks_block_3_desc: str = Field(description="What that ingredient does. 8 to 16 words.")
    creative_sassy_product_heading: str = Field(description="How-to heading. 2 to 4 words. Example How to Use.")
    creative_sassy_product_subheading_4: str = Field(description="Italic line under the how-to heading. 6 to 12 words.")
    how_to_body: str = Field(description="One sentence under the italic how-to line. 12 to 22 words.")
    creative_sassy_product_subheading_1: str = Field(description="Step 1 name. 1 to 3 words.")
    creative_sassy_product_subheading_1_description: str = Field(description="Step 1 instruction. 8 to 14 words.")
    creative_sassy_product_subheading_2: str = Field(description="Step 2 name. 1 to 3 words.")
    creative_sassy_product_subheading_2_description: str = Field(description="Step 2 instruction. 8 to 14 words.")
    creative_sassy_product_subheading_3: str = Field(description="Step 3 name. 1 to 3 words.")
    creative_sassy_product_subheading_3_description: str = Field(description="Step 3 instruction. 8 to 14 words.")
    faq_section_title: str = Field(description="FAQ heading. 2 to 5 words. Example Good to know.")
    faq_question_1: str = Field(description="FAQ question 1. A short question a shopper would ask. 6 to 14 words.")
    faq_answer_1: str = Field(description="FAQ answer 1. 18 to 32 words. No invented customer quotes.")
    faq_question_2: str = Field(description="FAQ question 2. Different from the first. 6 to 14 words.")
    faq_answer_2: str = Field(description="FAQ answer 2. 18 to 32 words.")
    faq_question_3: str = Field(description="FAQ question 3. Different from the first two. 6 to 14 words.")
    faq_answer_3: str = Field(description="FAQ answer 3. 18 to 32 words.")
    faq_question_4: str = Field(description="FAQ question 4. Different from the first three. 6 to 14 words.")
    faq_answer_4: str = Field(description="FAQ answer 4. 18 to 32 words.")
