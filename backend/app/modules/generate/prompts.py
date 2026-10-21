
PRODUCT_CATEGORY_PROMPT_SYSTEM = """You are a product category expert.
You will be provided with a product title and optionally a product description.
Classify it into the most appropriate category from the allowed list below.

Allowed categories (return the category key exactly):
- health_beauty
- fashion
- home_kitchen
- kids_toys
- car_accessories
- general

Make sure not to force any product to any specific category.
If product doesnot seem good fit, classify it as "general".

Fallback rule:
- If the product does not clearly fit into a specific category, classify it as "general".
"""

STORE_CATEGORY_PROMPT_SYSTEM = """You are a store category detection expert.
You will be provided with 1 to 5 products, each with a title and description.
Based on the overall product mix, classify the store into ONE category from the allowed list.

Allowed categories (return the category key exactly):
- health_beauty
- fashion
- home_kitchen
- kids_toys
- car_accessories
- general

Output requirements:
- Return only valid JSON that matches the provided schema.
- Include:
  1) category (string enum from allowed categories)
  2) confidence_percentage (number from 0 to 100)

Classification guidance:
- Choose the strongest dominant category across the provided products.
- If products are mixed or unclear, choose "general".
- Confidence should reflect certainty:
  - High confidence when most products strongly align with one category.
  - Medium confidence when there is partial overlap.
  - Lower confidence when products are mixed/ambiguous.
"""
# Specialized base image prompts

BASE_IMAGE_PROMPT_FRONT = """
The main product is the unchanged central hero, with perfectly preserved geometry, materials, proportions, dimmensions, ratios and branding, exactly as shown in the provided reference image.
Create a high-resolution studio product photo on a pure white seamless background (#FFFFFF).
Remove everything that is not the product (hands, props, packaging clutter, background, scenery, reflections). Keep ONLY the product.
Make the camera straight in front at eye level with a neutral, undistorted catalog look (orthographic/flat perspective). Center the product perfectly and keep it fully visible with margin (no cropping).
Lighting should be neutral and realistic, matching the product naturally. Add only a soft, natural ground shadow directly under the product. No reflections, no extra highlights, no overlays, no text, no watermark.
"""

BASE_IMAGE_PROMPT_ANGLE = """
Generate a high-resolution studio product photo on a pure white seamless background (#FFFFFF). Use the provided reference image(s) and keep the product EXACTLY identical to the reference: same geometry, proportions, dimensions, materials, surface finish, textures, colors, branding, logos, labels, and all on-product text (sharp and readable). Do not modify, stylize, enhance, exaggerate, or reinterpret any detail. Do not shift colors.
Remove everything that is not the product (hands, props, packaging clutter, background, scenery, reflections). Keep ONLY the product.
Show the product in a front-left OR front-right three-quarter view (about 30–45° from the front) with a slight elevation (subtle top-down angle). Keep perspective natural and undistorted (no wide-angle). Center it and keep the full product visible with margin (no cropping).
Use neutral studio lighting that preserves the real look. Add only a soft, realistic ground shadow beneath the product. No reflections, no overlays, no text, no watermark.
"""

def get_image_prompt_refinement_prompt(product_title, product_description, category, prompt_type, image_key, original_prompt):
    """
    Generate a prompt for refining a single image generation prompt using LLM.
    Each image prompt is refined separately.
    
    Args:
        product_title: Product title
        product_description: Product description
        category: Product category
        prompt_type: Type of prompts ("product" or "body")
        image_key: The key/name of the specific image being refined
        original_prompt: The original prompt text for this specific image
    
    Returns:
        String prompt for LLM refinement
    """
    return f"""You are an expert in e-commerce product photography and marketing imagery. 
Your task is to refine an image generation prompt to be more specific, compelling, and tailored to the product.
This refined prompt will be provided to Gemini to generate a marketing image.

Product Information:
- Product Title: {product_title}
- Product Description: {product_description}
- Category: {category}
- Prompt Type: {prompt_type}
- Image: {image_key}

Original Prompt to Refine:
{original_prompt}

Please refine this prompt to:
- Be more specific to this exact product
- Include relevant product features and benefits
- Maintain professional photography and marketing standards
- Be more compelling and conversion-focused
- Make it detailed and product-specific

Return only the refined prompt text, optimized for generating a high-quality marketing image that showcases this product effectively."""




def get_image_prompt_refinement_prompt(product_title, product_description, category, prompt_type, image_key, original_prompt):

    return f"""ROLE:
You are an advanced Prompt Engineering AI for E-commerce. You specialize in prompting for Image to Image. Your task is to take a general category prompt and refine it to perfectly fit a specific Product and a specific Image Archetype.

INPUT DATA:
Product Title: {product_title}
Product Description: {product_description}
Category: {category}
Image Archetype: {prompt_type} ({image_key}
Original Prompt: {original_prompt}

THE GOAL:
Rewrite the Original Prompt so that it places specific Product Title in a logical, physics-compliant environment that matches the Image Archetype.

STRICT CONSTRAINTS:
    NO VISUAL DESCRIPTION: Do NOT describe the product's shape, color, or material. The model uses a reference image. Only refer to it as "the product," "the item," or "the object."
    SURFACE INTERACTION: You must define where the product sits (e.g., "on a marble counter," "plugged into a dashboard," "hanging on a wall").
    NO GUESSING: You must be absolute with you instructions. Dont guess or give options in the prompt.
    BEST REPRESENTATION: Based on the Image Archetype, give the best representation of the product in the prompt.

ARCHETYPE LOGIC GUIDELINES:
    Hero Image: Focus on "Studio lighting," "Clean background," "4k," "Sharp focus," "Professional Photography."
    Happy Customer: Place product in a real-life ultra realistic setting. Use "Candid vibe", "real life interaction", "super realistic"
    Product Impact: Show the product in action. (e.g., for a cleaner: "on a sparkling clean surface"; for a charger: "glowing indicators, electric atmosphere").
    Feature Image: Use "Macro photography," "Extreme close-up," "Depth of field," "High texture detail," "Soft box lighting."
    Problem Solving: Place the product in a context where order has been restored. Use "Organized setting," "Clean lines," "Satisfying arrangement," "Clutter-free environment."
    Product Highlight: Use "Dramatic lighting," "Rim lighting," "Dark background with spotlight," "Cinematic contrast."

OUTPUT:
Provide ONLY the final refined prompt string. No explanations.



"""



PRODUCT_FIDELITY_PROMPT = """
MAKE SURE to Preserve the product exactly as it is—true shape, proportions, materials, and all components—without inventing or removing details. Keep all brand elements, logos, labels, and on-product text perfectly sharp, unchanged, and undistorted. Maintain the original dimensions, aspect ratio, framing, and accurate colours with no stylization or shifts. Avoid adding text, stickers, watermarks, or anything not explicitly requested to keep images marketplace-safe. If any instruction conflicts with product accuracy or brand integrity, always prioritize fidelity.
"""