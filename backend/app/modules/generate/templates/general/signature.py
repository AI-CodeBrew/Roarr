from pydantic import BaseModel, Field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Template 1 schema – General landing page
# ---------------------------------------------------------------------------


class GeneralTemplate1(BaseModel):
    """General Template 1 schema."""

    # Product details
    product_title: str = Field(
        description="Brief, impactful product title. Max 4 to 6 words. E.g. Premium Wireless Earbuds, Quick-Dry Travel Towel Set."
    )
    product_subtitle: str = Field(
        description="Short product subtitle that highlights key benefit or use. Max 15 to 18 words. E.g. Built for daily use with quality materials and a design that fits your routine."
    )

    # Badges (short labels; adapt to product type)
    badge_text_1: str = Field(
        description="Badge 1 text. Short label. E.g. Best Seller, Easy Use, Quality Made, Great Value. Max 2 to 3 words."
    )
    badge_text_2: str = Field(
        description="Badge 2 text. Short label. E.g. Best Seller, Easy Use, Quality Made, Great Value. Max 2 to 3 words."
    )
    badge_text_3: str = Field(
        description="Badge 3 text. Short label. E.g. Best Seller, Easy Use, Quality Made, Great Value. Max 2 to 3 words."
    )
    badge_text_4: str = Field(
        description="Badge 4 text. Short label. E.g. Best Seller, Easy Use, Quality Made, Great Value. Max 2 to 3 words."
    )

    # Product Q&A (3)
    product_question_1: str = Field(
        description="Short question a customer might ask. E.g. How do I use it? What's included?"
    )
    product_question_1_answer: str = Field(
        description="Answer to product question 1. Short 8 to 12 words."
    )
    product_question_2: str = Field(
        description="Short question about the product."
    )
    product_question_2_answer: str = Field(
        description="Answer to product question 2. Short 8 to 12 words."
    )
    product_question_3: str = Field(
        description="Short question about the product."
    )
    product_question_3_answer: str = Field(
        description="Answer to product question 3. Short 8 to 12 words."
    )

    # Marquee
    marquee_text_1: str = Field(
        description="Marquee text 1. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
    )
    marquee_text_2: str = Field(
        description="Marquee text 2. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
    )
    marquee_text_3: str = Field(
        description="Marquee text 3. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
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

    # Circular features section — feature set (names and short descriptions for product features)
    circular_features_heading: str = Field(
        description="Heading for the circular feature set section. Max 2 to 3 words."
    )
    circular_features_subheading: str = Field(
        description="Subheading for the circular feature set section. Max 8 to 12 words."
    )
    circular_feature_1_name: str = Field(
        description="Feature set item 1: short name for a product feature. Max 1 to 2 words."
    )
    circular_feature_1_desc: str = Field(
        description="Feature set item 1: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_2_name: str = Field(
        description="Feature set item 2: short name for a product feature. Max 1 to 2 words."
    )
    circular_feature_2_desc: str = Field(
        description="Feature set item 2: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_3_name: str = Field(
        description="Feature set item 3: short name for a product feature. Max 1 to 2 words."
    )
    circular_feature_3_desc: str = Field(
        description="Feature set item 3: short description of the feature. Max 8 to 10 words."
    )
    circular_feature_4_name: str = Field(
        description="Feature set item 4: short name for a product feature. Max 1 to 2 words."
    )
    circular_feature_4_desc: str = Field(
        description="Feature set item 4: short description of the feature. Max 8 to 10 words."
    )

    # Stats section — stat points about the product (heading + description per point)
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

    # Pillow banner — another catchy, sassy or poetic statement
    pillow_banner_heading: str = Field(
        description="A catchy, sassy or poetic line for the pillow banner (same tone as the creative heading). Max 3 to 5 words."
    )
    pillow_banner_subheading: str = Field(
        description="A catchy, sassy or poetic subheading for the pillow banner. Max 8 to 15 words."
    )

    # What sets us apart
    what_set_us_apart_subheading: str = Field(
        description="What sets us apart subheading. Max 25 to 30 words."
    )
    what_sets_us_apart_feature_1: str = Field(
        description="What sets us apart feature 1. Max 3 to 5 words."
    )
    what_sets_us_apart_feature_2: str = Field(
        description="What sets us apart feature 2. Max 3 to 5 words."
    )
    what_sets_us_apart_feature_3: str = Field(
        description="What sets us apart feature 3. Max 3 to 5 words."
    )

    # FAQ (3 Q&A)
    faq_question_1: str = Field(
        description="FAQ question 1. Short, customer-focused. E.g. How do I use this? What's the warranty?"
    )
    faq_answer_1: str = Field(
        description="FAQ answer 1. Concise answer, 8 to 15 words."
    )
    faq_question_2: str = Field(
        description="FAQ question 2. Short, customer-focused. E.g. What's included? Is it easy to clean?"
    )
    faq_answer_2: str = Field(
        description="FAQ answer 2. Concise answer, 8 to 15 words."
    )
    faq_question_3: str = Field(
        description="FAQ question 3. Short, customer-focused. E.g. Can I return it? Where do you ship?"
    )
    faq_answer_3: str = Field(
        description="FAQ answer 3. Concise answer, 8 to 15 words."
    )


# ---------------------------------------------------------------------------
# Template 2 (full schema)
# ---------------------------------------------------------------------------


class GeneralTemplate2(BaseModel):
    """General Template 2 schema."""

    # Product details
    product_title: str = Field(
        description="Brief, impactful product title. Max 4 to 6 words. E.g. Premium Wireless Earbuds, Quick-Dry Travel Towel Set."
    )
    product_subtitle: str = Field(
        description="Short product subtitle that highlights key benefit or use. Max 15 to 18 words. E.g. Built for daily use with quality materials and a design that fits your routine."
    )

    # Badges (short labels e.g. Handy, Easy Cleaning, Non Greasy)
    badge_text_1: str = Field(
        description="Badge 1 text. Short label e.g. Handy, Easy Cleaning, Non Greasy. Max 2 to 3 words."
    )
    badge_text_2: str = Field(
        description="Badge 2 text. Short label e.g. Handy, Easy Cleaning, Non Greasy. Max 2 to 3 words."
    )
    badge_text_3: str = Field(
        description="Badge 3 text. Short label e.g. Handy, Easy Cleaning, Non Greasy. Max 2 to 3 words."
    )
    badge_text_4: str = Field(
        description="Badge 4 text. Short label e.g. Handy, Easy Cleaning, Non Greasy. Max 2 to 3 words."
    )

    # Product Q&A (4)
    product_question_1: str = Field(
        description="Short question about the product."
    )
    product_question_1_answer: str = Field(
        description="Answer to product question 1. Short 8 to 12 words."
    )
    product_question_2: str = Field(
        description="Short question about the product."
    )
    product_question_2_answer: str = Field(
        description="Answer to product question 2. Short 8 to 12 words."
    )
    product_question_3: str = Field(
        description="Short question about the product."
    )
    product_question_3_answer: str = Field(
        description="Answer to product question 3. Short 8 to 12 words."
    )
    product_question_4: str = Field(
        description="Short question about the product."
    )
    product_question_4_answer: str = Field(
        description="Answer to product question 4. Short 8 to 12 words."
    )

    # Marquee
    marquee_text_1: str = Field(
        description="Marquee text 1. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
    )
    marquee_text_2: str = Field(
        description="Marquee text 2. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
    )
    marquee_text_3: str = Field(
        description="Marquee text 3. Scrolling tag. E.g. Best Seller, Quality Made, Easy Use. Max 1 to 3 words."
    )

    # Circular features section
    circular_features_heading: str = Field(
        description="Circular feature section heading. Max 2 to 3 words."
    )
    circular_features_subheading: str = Field(
        description="Circular feature section subheading. Max 8 to 12 words."
    )
    circular_feature_1_name: str = Field(
        description="Circular feature 1 name. Max 1 to 2 words."
    )
    circular_feature_1_desc: str = Field(
        description="Circular feature 1 description. Max 8 to 10 words."
    )
    circular_feature_2_name: str = Field(
        description="Circular feature 2 name. Max 1 to 2 words."
    )
    circular_feature_2_desc: str = Field(
        description="Circular feature 2 description. Max 8 to 10 words."
    )
    circular_feature_3_name: str = Field(
        description="Circular feature 3 name. Max 1 to 2 words."
    )
    circular_feature_3_desc: str = Field(
        description="Circular feature 3 description. Max 8 to 10 words."
    )
    circular_feature_4_name: str = Field(
        description="Circular feature 4 name. Max 1 to 2 words."
    )
    circular_feature_4_desc: str = Field(
        description="Circular feature 4 description. Max 8 to 10 words."
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

    # Four blocks section
    four_blocks_heading: str = Field(
        description="Four blocks section heading. Max 3 to 4 words."
    )
    four_blocks_subheading: str = Field(
        description="Four blocks section subheading. Max 8 to 12 words."
    )
    four_blocks_block_1_name: str = Field(
        description="Four blocks block 1 name. Max 2 to 3 words."
    )
    four_blocks_block_1_desc: str = Field(
        description="Four blocks block 1 description. Max 8 to 12 words."
    )
    four_blocks_block_2_name: str = Field(
        description="Four blocks block 2 name. Max 2 to 3 words."
    )
    four_blocks_block_2_desc: str = Field(
        description="Four blocks block 2 description. Max 8 to 12 words."
    )
    four_blocks_block_3_name: str = Field(
        description="Four blocks block 3 name. Max 2 to 3 words."
    )
    four_blocks_block_3_desc: str = Field(
        description="Four blocks block 3 description. Max 8 to 12 words."
    )
    four_blocks_block_4_name: str = Field(
        description="Four blocks block 4 name. Max 2 to 3 words."
    )
    four_blocks_block_4_desc: str = Field(
        description="Four blocks block 4 description. Max 8 to 12 words."
    )

    # Stats section — stat points about the product (heading + description per point)
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

    # What sets us apart (4 features)
    what_set_us_apart_subheading: str = Field(
        description="What sets us apart subheading. Max 25 to 30 words."
    )
    what_sets_us_apart_feature_1: str = Field(
        description="What sets us apart feature 1. Max 3 to 5 words."
    )
    what_sets_us_apart_feature_2: str = Field(
        description="What sets us apart feature 2. Max 3 to 5 words."
    )
    what_sets_us_apart_feature_3: str = Field(
        description="What sets us apart feature 3. Max 3 to 5 words."
    )
    what_sets_us_apart_feature_4: str = Field(
        description="What sets us apart feature 4. Max 3 to 5 words."
    )

    # FAQ (3 Q&A)
    faq_question_1: str = Field(
        description="FAQ question 1. Short, customer-focused. E.g. How do I use this? What's the warranty?"
    )
    faq_answer_1: str = Field(
        description="FAQ answer 1. Concise answer, 8 to 15 words."
    )
    faq_question_2: str = Field(
        description="FAQ question 2. Short, customer-focused. E.g. What's included? Is it easy to clean?"
    )
    faq_answer_2: str = Field(
        description="FAQ answer 2. Concise answer, 8 to 15 words."
    )
    faq_question_3: str = Field(
        description="FAQ question 3. Short, customer-focused. E.g. Can I return it? Where do you ship?"
    )
    faq_answer_3: str = Field(
        description="FAQ answer 3. Concise answer, 8 to 15 words."
    )
