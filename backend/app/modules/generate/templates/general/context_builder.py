"""
General Context Builder

This module builds product context using LLM to enhance text generation.
This is a flexible context builder that works for any product category.
"""

from pydantic import BaseModel, Field
from typing import List
from .....clients import openai_client as client


class GeneralProductContext(BaseModel):
    """Structured product context for general products - works for any category"""
    
    product_type: str = Field(
        description="Specific product type/category. Be detailed and specific about what this product is."
    )
    
    primary_function: str = Field(
        description="The main purpose and primary function of the product. What does it do? What is its core functionality? E.g., 'Keeps beverages cold for 24 hours or hot for 12 hours with vacuum insulation', 'Organizes and stores items efficiently with modular compartments'"
    )
    
    
    use_cases: List[str] = Field(
        description="List of 3-5 specific use cases, applications, or scenarios where this product excels. Be descriptive and detailed for each.",
        min_items=3,
        max_items=5
    )
    
    target_audience: str = Field(
        description="Detailed target audience with demographics, lifestyle, needs, and characteristics of ideal customers."
    )
    
    usp: str = Field(
        description="Unique Selling Proposition - comprehensive description of what makes this product unique and different from competitors. Include all distinguishing features and benefits."
    )
    
    how_to_use: str = Field(
        description="Detailed step-by-step instructions on how to use the product. E.g., 'Remove lid, fill with desired beverage up to max line, secure lid tightly, ready to use, hand wash or place in dishwasher for cleaning', 'Press power button to turn on, adjust settings as needed, use according to instructions, store in cool dry place when not in use'"
    )
    
    usage_environment: str = Field(
        description="Where and in what conditions this product is meant to be used. E.g., 'Indoor and outdoor use, suitable for office, gym, travel, and outdoor activities, water-resistant for light rain', 'Home use, garage or workshop setting, operates in temperatures 32-100°F'"
    )
    
    lifestyle_fit: str = Field(
        description="How this product fits into modern lifestyles and daily routines. E.g., 'Perfect for busy professionals on-the-go, fits in car cup holders and backpack side pockets, easy to carry between meetings', 'Ideal for active families, compact storage when not in use, quick setup and breakdown'"
    )
    
    pain_points_solved: List[str] = Field(
        description="List of 2-4 specific customer pain points this product solves. Be detailed about each problem it addresses.",
        min_items=2,
        max_items=4
    )
    
    emotion: str = Field(
        description="Primary emotion or feeling this product evokes/delivers. Be descriptive about the emotional impact and value it brings to customers."
    )


def build_product_context(
    product_title: str,
    product_description: str
) -> GeneralProductContext:
    """
    Generate structured product context using LLM.
    
    This function takes basic product information and uses an LLM to infer
    and create detailed context about the product's nature, target audience,
    and key features. Works for any product category.
    
    Args:
        product_title: The title/name of the product
        product_description: Detailed description of the product
    
    Returns:
        GeneralProductContext: Structured context object
    """
    
    prompt = f"""
You are a versatile product marketing expert with expertise across all product categories.

Given the following product information:
- Title: {product_title}
- Description: {product_description}

Analyze this product and provide DETAILED and COMPREHENSIVE context that will help create compelling marketing content. Be creative, reasonable, and use your expertise to infer details that aren't explicitly mentioned. Provide as much relevant detail as possible - there are NO LENGTH RESTRICTIONS.

Generate the following with as much detail as needed:

1. **Product Type**: The specific category and type of product. Be precise and detailed about what this product is and its classification.

2. **Primary Function**: The main purpose and what the product does. Explain its core functionality and how it serves the user.

3. **Use Cases**: 3-5 specific and detailed scenarios, applications, or ways people would use this product. Focus on real-world benefits and practical applications.

4. **Target Audience**: Comprehensive demographics including age range, lifestyle, profession, needs, values, and characteristics of the ideal customer for this product.

5. **USP (Unique Selling Proposition)**: Comprehensive description of what makes this product unique and different from competitors. Include all distinguishing features, benefits, and reasons to choose this over alternatives.

6. **How to Use**: Detailed step-by-step instructions on how to use the product properly (e.g., "Remove lid, fill with desired beverage up to max line, secure lid tightly, ready to use, hand wash or place in dishwasher for cleaning")

7. **Usage Environment**: Where and in what conditions this product is meant to be used. Indoor/outdoor, specific settings, environmental conditions it can handle.

8. **Lifestyle Fit**: How this product fits into modern lifestyles and daily routines. Consider portability, storage, time-saving, convenience factors.

9. **Pain Points Solved**: 2-4 specific and detailed customer problems, frustrations, or challenges this product addresses and resolves.

10. **Emotion**: Detailed description of the primary emotional benefit or feeling the product delivers to customers. How does it make them feel? What emotional value does it provide?

Be DETAILED, specific, persuasive, and use appropriate industry terminology for the product type. Make reasonable inferences based on the product information provided. Provide comprehensive information that will enrich the final marketing content.
"""

    messages = [
        {
            "role": "system",
            "content": "You are a versatile product marketing expert with deep knowledge across all product categories, consumer behavior, market positioning, and compelling copywriting. Provide DETAILED, COMPREHENSIVE, accurate, and compelling product context. Be thorough and expansive in your descriptions - there are no length restrictions. Your detailed context will be used to create rich, compelling marketing content."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    # Use structured output with the Pydantic schema
    response = client.beta.chat.completions.parse(
        model="gpt-4.1-nano",
        messages=messages,
        response_format=GeneralProductContext,
        temperature=1,  # Higher temperature for more creativity
    )

    context = response.choices[0].message.parsed
    return context


def format_context_for_prompt(context: GeneralProductContext, product_title: str = "", product_description: str = "") -> str:
    """
    Format the context object into a readable string for appending to prompts.
    
    Args:
        context: GeneralProductContext object
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

Primary Function: {context.primary_function}

Use Cases & Applications:
{use_cases_str}

Target Audience: {context.target_audience}

USP (Unique Selling Proposition): {context.usp}

How to Use: {context.how_to_use}

Usage Environment: {context.usage_environment}

Lifestyle Fit: {context.lifestyle_fit}

Pain Points Solved:
{pain_points_str}

Emotion/Feeling: {context.emotion}
-----------------
"""
    return formatted

