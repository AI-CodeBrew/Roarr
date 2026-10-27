"""
Health & Beauty Context Builder

This module builds product context using LLM to enhance text generation.
The context is generated from product title and description, and provides
additional insights that will be used in the final content generation.
"""

import os
from pydantic import BaseModel, Field
from typing import List
from .....clients.openai_client import client


class HealthBeautyProductContext(BaseModel):
    """Structured product context for health and beauty products"""
    
    product_type: str = Field(
        description="Specific product type/category. Be detailed and specific. E.g., 'Face Serum', 'Anti-Aging Night Cream', 'Deep Moisturizing Body Lotion'"
    )
    
    use_cases: List[str] = Field(
        description="List of 3-5 specific use cases or benefits. Be descriptive and detailed for each. E.g., ['Brightens and evens out skin tone', 'Provides deep hydration throughout the day', 'Reduces appearance of fine lines and wrinkles']",
        min_items=3,
        max_items=5
    )
    
    target_audience: str = Field(
        description="Detailed target audience with demographics, skin types, concerns, and lifestyle. E.g., 'Usually women aged 16 to 40 with combination to dry skin, seeking natural and effective beauty solutions for daily skincare routines, particularly those concerned about early signs of aging'"
    )
    
    usp: str = Field(
        description="Unique Selling Proposition - comprehensive description of what makes this product stand out from competitors. E.g., 'Non-greasy, fast-absorbing formula with clinically-proven ingredients that deliver visible results within weeks, suitable for all skin types, cruelty-free and environmentally sustainable'"
    )
    
    pain_points_solved: List[str] = Field(
        description="List of 2-4 specific customer pain points this product solves. Be detailed about each problem. E.g., ['Improves dull and tired-looking skin', 'Reduces dark spots and hyperpigmentation', 'Prevents premature aging and environmental damage']",
        min_items=2,
        max_items=4
    )
    
    emotion: str = Field(
        description="Primary emotion or feeling this product evokes/delivers. Be descriptive about the emotional impact. E.g., 'Boosts confidence and self-esteem by making you feel beautiful, radiant, and empowered in your own skin'"
    )
    
    how_to_use: str = Field(
        description="Detailed step-by-step instructions on how to use the product. E.g., 'Cleanse face thoroughly, pat dry, apply 2-3 drops to fingertips, gently massage onto face and neck in upward circular motions, use morning and evening, follow with moisturizer, avoid direct eye contact'"
    )
    
    usage_environment: str = Field(
        description="Where and when this product is used. Include setting, frequency, time of day. E.g., 'Apply morning and evening in bathroom or bedroom, ideal for daily skincare routine, can be used at home or while traveling, store in cool dry place away from direct sunlight'"
    )
    
    before_use: str = Field(
        description="Detailed description of the condition/state before using the product. Describe the problems, concerns, or appearance. E.g., 'Dull, tired-looking skin with visible redness, uneven tone, dry patches, and early signs of aging'"
    )
    
    after_use: str = Field(
        description="Detailed description of the condition/state after using the product. Describe the improvements, results, and transformation. E.g., 'Fresh, radiant glow with deeply hydrated, smooth skin, even tone, reduced redness, and a youthful, healthy appearance'"
    )


def build_product_context(
    product_title: str,
    product_description: str
) -> HealthBeautyProductContext:
    """
    Generate structured product context using LLM.
    
    This function takes basic product information and uses an LLM to infer
    and create detailed context about the product's nature, target audience,
    geographical use, and key features.
    
    Args:
        product_title: The title/name of the product
        product_description: Detailed description of the product
    
    Returns:
        HealthBeautyProductContext: Structured context object
    """
    
    prompt = f"""
You are a product marketing expert specializing in health and beauty products.

Given the following product information:
- Title: {product_title}
- Description: {product_description}

Analyze this product and provide DETAILED and COMPREHENSIVE context that will help create compelling marketing content. Be creative, reasonable, and use your expertise to infer details that aren't explicitly mentioned. Provide as much relevant detail as possible - there are NO LENGTH RESTRICTIONS.

Generate the following with as much detail as needed:

1. **Product Type**: The specific category/type of product. Be precise and detailed (e.g., "Luxurious Anti-Aging Face Serum", "Nourishing Deep Conditioning Hair Mask")

2. **Use Cases**: 3-5 specific and detailed ways the product is used or benefits it provides (e.g., "Brightens and evens out skin tone for a radiant complexion", "Provides intense deep hydration that lasts all day", "Reduces the appearance of fine lines, wrinkles, and age spots")

3. **Target Audience**: Comprehensive demographics including age, gender, skin types, specific concerns, and lifestyle. Be thorough (e.g., "Primarily women aged 16 to 40 with combination to dry skin, seeking natural and effective beauty solutions for their daily skincare routines, particularly those concerned about early signs of aging and environmental damage")

4. **USP (Unique Selling Proposition)**: Comprehensive description of what makes this product unique and different from competitors. Include all distinguishing features (e.g., "Non-greasy, fast-absorbing formula with clinically-proven natural ingredients that deliver visible results within 2-4 weeks, suitable for all skin types including sensitive skin, cruelty-free, vegan-friendly, and packaged in environmentally sustainable materials")

5. **Pain Points Solved**: 2-4 specific and detailed customer problems this product addresses (e.g., "Improves dull, tired-looking skin by restoring natural radiance", "Reduces stubborn dark spots and hyperpigmentation from sun damage", "Prevents premature aging caused by environmental stressors and free radicals")

6. **Emotion**: Detailed description of the primary emotional benefit or feeling the product delivers (e.g., "Boosts confidence and self-esteem by making you feel beautiful, radiant, and empowered in your own skin, helping you face each day with renewed confidence")

7. **How to Use**: Detailed step-by-step instructions on how to use the product properly (e.g., "Cleanse face thoroughly with warm water, pat dry, apply 2-3 drops of serum to fingertips, gently massage onto face and neck in upward circular motions, use morning and evening for best results, follow with moisturizer, avoid direct eye contact")

8. **Usage Environment**: Where and when this product is used in daily routine (e.g., "Apply morning and evening in bathroom or bedroom after cleansing, ideal for daily skincare routine, can be used at home or while traveling, store in cool dry place away from direct sunlight")

9. **Before Use**: Detailed description of the condition/state BEFORE using the product. Describe the problems, concerns, or appearance that the user experiences (e.g., "Dull, tired-looking skin with visible redness, uneven tone, dry patches, fine lines, and early signs of aging")

10. **After Use**: Detailed description of the condition/state AFTER using the product. Describe the improvements, results, and positive transformation (e.g., "Fresh, radiant glow with deeply hydrated, smooth skin, even tone, reduced redness, minimized fine lines, and a youthful, healthy, vibrant appearance")

Be DETAILED, specific, persuasive, and use industry-standard health & beauty terminology. Make reasonable inferences based on the product information provided. Provide comprehensive information that will enrich the final marketing content.
"""

    messages = [
        {
            "role": "system",
            "content": "You are an expert in health and beauty products with deep knowledge of ingredients, product formulations, skin types, and market positioning. Provide DETAILED, COMPREHENSIVE, accurate, and compelling product context. Be thorough and expansive in your descriptions - there are no length restrictions. Your detailed context will be used to create rich, compelling marketing content."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    # Use structured output with the Pydantic schema
    response = client.beta.chat.completions.parse(
        model=os.getenv("OPENAI_TEXT_MODEL", "gpt-4o-mini"),  # gpt-4.1-nano was shut down by OpenAI
        messages=messages,
        response_format=HealthBeautyProductContext,
        temperature=1,  # Higher temperature for more creativity
    )

    context = response.choices[0].message.parsed
    return context


def format_context_for_prompt(context: HealthBeautyProductContext, product_title: str = "", product_description: str = "") -> str:
    """
    Format the context object into a readable string for appending to prompts.
    
    Args:
        context: HealthBeautyProductContext object
        product_title: Product title to include in context
        product_description: Product description to include in context
    
    Returns:
        Formatted string representation of the context
    """
    use_cases_str = "\n".join([f"  - {use_case}" for use_case in context.use_cases])
    pain_points_str = "\n".join([f"  - {pain_point}" for pain_point in context.pain_points_solved])
    
    formatted = f"""
PRODUCT CONTEXT:
-----------------
Product Title: {product_title}

Product Description: {product_description}

Product Type: {context.product_type}

Use Cases:
{use_cases_str}

Target Audience: {context.target_audience}

USP (Unique Selling Proposition): {context.usp}

Pain Points Solved:
{pain_points_str}

Emotion/Feeling: {context.emotion}

How to Use: {context.how_to_use}

Usage Environment: {context.usage_environment}

Before Use: {context.before_use}

After Use: {context.after_use}
-----------------
"""
    return formatted

