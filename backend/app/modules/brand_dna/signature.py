from pydantic import BaseModel, Field


class HeroProduct(BaseModel):
    title: str = Field(description="Product or offer name.")
    role: str = Field(
        description="Why this product is included. Use one of: bestseller, featured, inferred, collection."
    )
    note: str = Field(description="One-line reason this product matters to the brand story.")


class BrandDNAProfile(BaseModel):
    brand_name: str = Field(description="Short, clean brand name.")
    tagline: str = Field(description="Brand tagline or catch phrase.")
    business_overview: str = Field(
        description="2-4 sentences: what the business sells, for whom, and what makes it distinct."
    )
    industry: str = Field(description="Single-word industry label.")
    product_categories: list[str] = Field(
        description="Primary category or collection themes."
    )
    tone_of_voice: str = Field(description="1-2 word primary tone descriptor.")
    tone_chips: list[str] = Field(description="3-5 tone adjectives.")
    tone_description: str = Field(
        description="2-3 sentences describing the brand communication style."
    )
    visual_style: str = Field(description="1-2 word primary visual descriptor.")
    brand_aesthetic: list[str] = Field(
        description="Five specific aesthetic descriptors."
    )
    visual_description: str = Field(
        description="2-3 sentences on photography, layout, and design language."
    )
    target_audience: str = Field(description="Specific description of the target audience.")
    brand_values: list[str] = Field(description="3-4 value pillars.")
    primary_colors: list[str] = Field(description="Primary brand colors in HEX format.")
    accent_colors: list[str] = Field(description="Accent brand colors in HEX format.")
    key_messages: list[str] = Field(description="Three core brand messages.")
    selling_outlook: str = Field(
        description="2-4 sentences on commercial outlook and shopper-facing positioning."
    )
    hero_products: list[HeroProduct] = Field(
        description="3-8 products important to brand narrative."
    )


class CampaignIdea(BaseModel):
    title: str = Field(description="Short, punchy campaign title (3-6 words).")
    description: str = Field(
        description="Two concise sentences describing narrative and audience fit."
    )
    strategy: str = Field(
        description="Single strategic angle such as emotional, product-led, or trend-led."
    )


class CampaignIdeasResponse(BaseModel):
    ideas: list[CampaignIdea] = Field(
        min_length=3,
        max_length=3,
        description="Exactly three distinct campaign ideas."
    )


class CreativeUnit(BaseModel):
    platform: str = Field(description="Target platform. Keep as 'meta'.")
    ad_template: str = Field(description="Template identifier for creative layout style.")
    creative_brief: str = Field(description="Scene and art-direction brief.")
    typography_placement: str = Field(description="Where and how text should appear.")
    composition_mode: str = Field(description="Short composition descriptor.")
    text_image_relationship: str = Field(description="Overlay/split/inset/etc.")
    headline: str = Field(description="Primary ad headline.")
    body: str = Field(description="Ad body copy.")
    cta: str = Field(description="Call-to-action.")
    layout: str = Field(description="Legacy layout slug if applicable.")


class GenerateCreativesResponse(BaseModel):
    creatives: list[CreativeUnit] = Field(
        min_length=1,
        max_length=4,
        description="Creative concepts generated for selected campaign idea."
    )
