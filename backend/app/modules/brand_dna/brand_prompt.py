import json
from typing import Optional


def build_brand_dna_prompt(
    storefront_signals: Optional[dict],
    selected_products: Optional[list[dict]],
) -> str:
    signals = storefront_signals or {}
    products = selected_products or []

    signal_blob = json.dumps(
        {
            "page_texts": signals.get("page_texts", {}),
            "colors": signals.get("colors", []),
            "fonts": signals.get("fonts", []),
            "meta": signals.get("meta", {}),
            "logo_url": signals.get("logo_url", ""),
        },
        ensure_ascii=False,
        indent=2,
    )[:12000]

    products_blob = json.dumps(
        [
            {
                "id": p.get("id"),
                "title": p.get("title"),
                "description": p.get("description"),
                "images_count": len(p.get("images") or []),
                "first_image": (p.get("images") or [None])[0],
            }
            for p in products
        ],
        ensure_ascii=False,
        indent=2,
    )[:8000]

    return f"""You are an expert ecommerce brand strategist.
Build one accurate Brand DNA profile from:
1) Storefront signals (copy, colors, fonts, metadata)
2) Selected products (title, description, images)

Storefront signals:
{signal_blob}

Selected products:
{products_blob}

Instructions:
- Ground your answer in the provided data only.
- If data is missing, infer conservatively from available storefront and product context.
- Prefer storefront colors/fonts for visual identity when present.
- Use selected product titles/descriptions to define categories, audience, and messaging.
- Keep output commercially useful for ad generation and creative direction.
- Return JSON only.
"""


def build_campaign_ideas_prompt(
    dna: Optional[dict],
    product: Optional[dict],
    prompt_text: Optional[str] = None,
) -> str:
    dna_data = dna or {}
    product_data = product or {}
    direction = (prompt_text or "").strip()

    dna_blob = json.dumps(
        {
            "brand_name": dna_data.get("brand_name"),
            "industry": dna_data.get("industry"),
            "tone_of_voice": dna_data.get("tone_of_voice"),
            "tone_description": dna_data.get("tone_description"),
            "target_audience": dna_data.get("target_audience"),
            "brand_values": dna_data.get("brand_values", []),
            "key_messages": dna_data.get("key_messages", []),
            "brand_aesthetic": dna_data.get("brand_aesthetic", []),
            "primary_colors": dna_data.get("primary_colors", []),
        },
        ensure_ascii=False,
        indent=2,
    )

    product_blob = json.dumps(
        {
            "id": product_data.get("id"),
            "title": product_data.get("title"),
            "description": product_data.get("description"),
            "images_count": len(product_data.get("images") or []),
            "first_image": (product_data.get("images") or [None])[0],
        },
        ensure_ascii=False,
        indent=2,
    )

    return f"""You are a senior direct-response campaign strategist for ecommerce brands.
Generate 3 distinct campaign ideas grounded in the provided Brand DNA and selected product.

Brand DNA:
{dna_blob}

Selected product:
{product_blob}

Additional user direction:
{direction or "None"}

Requirements:
- Return exactly 3 ideas.
- Each idea must be distinct in angle and execution style.
- Keep titles short and memorable.
- Keep description practical for ad creative planning.
- Return JSON only.
"""


def build_generate_creatives_prompt(
    dna: Optional[dict],
    product: Optional[dict],
    idea: Optional[dict],
    count: int = 3,
) -> str:
    dna_data = dna or {}
    product_data = product or {}
    idea_data = idea or {}
    total = max(1, min(int(count or 3), 4))

    dna_blob = json.dumps(
        {
            "brand_name": dna_data.get("brand_name"),
            "industry": dna_data.get("industry"),
            "tone_of_voice": dna_data.get("tone_of_voice"),
            "tone_description": dna_data.get("tone_description"),
            "target_audience": dna_data.get("target_audience"),
            "brand_values": dna_data.get("brand_values", []),
            "brand_aesthetic": dna_data.get("brand_aesthetic", []),
            "primary_colors": dna_data.get("primary_colors", []),
            "accent_colors": dna_data.get("accent_colors", []),
            "key_messages": dna_data.get("key_messages", []),
        },
        ensure_ascii=False,
        indent=2,
    )

    product_blob = json.dumps(
        {
            "id": product_data.get("id"),
            "title": product_data.get("title"),
            "description": product_data.get("description"),
            "images_count": len(product_data.get("images") or []),
            "first_image": (product_data.get("images") or [None])[0],
        },
        ensure_ascii=False,
        indent=2,
    )

    idea_blob = json.dumps(
        {
            "title": idea_data.get("title"),
            "description": idea_data.get("description"),
            "strategy": idea_data.get("strategy"),
        },
        ensure_ascii=False,
        indent=2,
    )

    return f"""You are a world-class performance creative director for ecommerce ads.
Generate {total} distinct ad creative concepts for platform "meta" only.

Brand DNA:
{dna_blob}

Selected product:
{product_blob}

Selected campaign idea:
{idea_blob}

Rules:
- Return exactly {total} creatives.
- platform MUST be "meta" for every creative.
- Keep each creative distinct in composition and messaging angle.
- Ensure product is visually central in every creative brief.
- Keep copy concise and conversion-oriented.
- Return JSON only.
"""
