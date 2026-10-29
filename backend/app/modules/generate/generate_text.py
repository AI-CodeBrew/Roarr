"""
Text Generation Module

This module handles text content generation using pydantic schemas for different templates.
Uses LangChain for structured output generation.
"""

import logging
from typing import Dict, Any, Optional, Union
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from ...clients.langchain_client import llm_4_1_nano
from .templates.health_beauty.signature import (
    HealthBeautyGlow,
    HealthBeautyTemplate1,
    HealthBeautyTemplate2,
)
from .templates.general.signature import GeneralTemplate1, GeneralTemplate2
from .templates.fashion.signature import FashionTemplate1, FashionTemplate2
from .templates.home_kitchen.signature import HomeKitchenTemplate1, HomeKitchenTemplate2
from .templates.kids_toys.signature import KidsToysTemplate1, KidsToysTemplate2
from .templates.car_accessories.signature import (
    CarAccessoriesTemplate1,
    CarAccessoriesTemplate2,
)
from .templates.lumenook_signature import LumenookTemplate
from .templates.noir_signature import NoirTemplate
from .templates.frost_signature import FrostTemplate

logger = logging.getLogger(__name__)

# Note: Context building is now done in routes.py via context_utils.py
# We no longer import context builders here to avoid confusion

def generate_text(
    category: str = "health_beauty",
    template: Union[str, int, None] = None,
    product_context_str: Optional[str] = None,
    page_id=None,
    document_store=None,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate text content based on product information using pydantic schema

    Args:
        category: Product category (default: health_beauty)
        product_context_str: Optional pre-built product context (if None, will build it)
        language: Optional language for generated content (e.g. "Spanish", "French")

    Returns:
        Dict containing all generated content
    """
    
    def _template_number(t: Union[str, int, None]) -> int:
        if t is None:
            return 1
        if isinstance(t, int):
            if t == 3 or t == 2:
                return 2
            return 1
        s = str(t).strip().lower()
        if s in {"2", "template_2", "template2", "t2", "3", "template_3", "template3", "t3"}:
            return 2
        return 1

    category_key = (category or "").strip().lower()
    tnum = _template_number(template)

    # Template-aware signature selection (two templates per category)
    signature_map = {
        "health_beauty": (HealthBeautyTemplate1, HealthBeautyTemplate2),
        "fashion": (FashionTemplate1, FashionTemplate2),
        "home_kitchen": (HomeKitchenTemplate1, HomeKitchenTemplate2),
        "kids_toys": (KidsToysTemplate1, KidsToysTemplate2),
        "car_accessories": (CarAccessoriesTemplate1, CarAccessoriesTemplate2),
        "general": (GeneralTemplate1, GeneralTemplate2),
    }

    sig_pair = signature_map.get(category_key) or signature_map["general"]
    play_template = str(template or "").strip().lower() in {
        "3",
        "template_3",
        "template3",
        "t3",
    } or template == 3
    lumenook_template = str(template or "").strip().lower() in {
        "4",
        "template_4",
        "template4",
        "t4",
    } or template == 4
    noir_template = str(template or "").strip().lower() in {
        "5",
        "template_5",
        "template5",
        "t5",
    } or template == 5
    frost_template = str(template or "").strip().lower() in {
        "6",
        "template_6",
        "template6",
        "t6",
    } or template == 6
    # Template 3 = Aura, 4 = Lumenook, 5 = Noir and 6 = Frost, for every category (legacy Play path retired in v2).
    if frost_template:
        signature_class = FrostTemplate
    elif noir_template:
        signature_class = NoirTemplate
    elif lumenook_template:
        signature_class = LumenookTemplate
    elif play_template:
        signature_class = HealthBeautyGlow
    else:
        signature_class = sig_pair[0] if tnum == 1 else sig_pair[1]
    
    # Use pre-initialized LangChain ChatOpenAI with structured output support
    llm = llm_4_1_nano
    
    # Configure structured output using Pydantic model
    structured_llm = llm.with_structured_output(signature_class)

    # Create prompt templates
    system_prompt = SystemMessagePromptTemplate.from_template(
        "You are a helpful assistant specializing in creating compelling product landing pages. "
        "Fill the {schema_name} schema using the product information and context provided. "
        "Respect the max lengths and defaults. Create persuasive, SEO-optimized content that "
        "resonates with the target audience."
    )
    
    user_prompt = HumanMessagePromptTemplate.from_template(
        """You are tasked with generating a full landing page content for a product.

Category: {category}

{product_context_str}

Using the detailed product context provided above, generate a full landing page content strictly following the schema.
Content should be SEO optimized and in the tone of the product.
The product context already includes the title, description, and comprehensive insights about the product's nature, target audience, and key features - use all of this to create compelling and targeted content.
{language_instruction}"""
    )
    
    # Create chat prompt
    chat_prompt = ChatPromptTemplate.from_messages([
        system_prompt,
        user_prompt
    ])
    if page_id and document_store:
        document_store.update_generation_percentage(page_id, 9)

    language_instruction = ""
    lang = str(language).strip() if language is not None else ""
    if lang:
        language_instruction = f"IMPORTANT: Make sure to generate all content in {lang} language."

    # Format prompt with variables
    formatted_prompt = chat_prompt.format_messages(
        schema_name=signature_class.__name__,
        category=category,
        product_context_str=product_context_str or "",
        language_instruction=language_instruction,
    )
    
    # Invoke the structured LLM to get parsed output
    parsed_model = structured_llm.invoke(formatted_prompt)
    
    # Convert Pydantic model to dict
    parsed_dict = parsed_model.model_dump()
    # Image-with-text feature lines: models ignore the schema and write full
    # sentences. Keep each description to a short phrase.
    for _key, _value in list(parsed_dict.items()):
        if (
            isinstance(_key, str)
            and _key.startswith("creative_sassy_product_subheading_")
            and _key.endswith("_description")
            and isinstance(_value, str)
        ):
            words = _value.split()
            if len(words) > 6:
                parsed_dict[_key] = " ".join(words[:6]).rstrip(".,;:—-")
    logger.info(
        "PDP generate_text ok category=%s template=%s fields=%s",
        category_key,
        tnum,
        len(parsed_dict) if isinstance(parsed_dict, dict) else 0,
    )
    return parsed_dict


def generate_product_page_copy(
    *,
    category: str,
    template: Union[str, int, None] = None,
    product_context_str: Optional[str] = None,
    language: Optional[str] = None,
    attempts: int = 2,
) -> Dict[str, Any]:
    """
    Store premium PDPs: same generate_text path as Generate Product Page.
    Tries the selected template, then template 1, so a schema miss does not
    leave empty copy (preview/publish would show placeholder strings).
    """
    requested = 1
    if isinstance(template, int):
        requested = 2 if template == 2 else 1
    elif template is not None:
        s = str(template).strip().lower()
        requested = 2 if s in {"2", "template_2", "template2", "t2"} else 1
    template_order = [requested]
    if requested == 2:
        template_order.append(1)

    last_error = None
    for tnum in template_order:
        for attempt in range(1, max(1, attempts) + 1):
            try:
                result = generate_text(
                    category=category,
                    template=tnum,
                    product_context_str=product_context_str,
                    page_id=None,
                    document_store=None,
                    language=language,
                )
                if isinstance(result, dict) and any(
                    v is not None and str(v).strip() for v in result.values()
                ):
                    return result
                last_error = RuntimeError("empty PDP text payload")
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "PDP text generation attempt category=%s template=%s %s/%s failed: %s",
                    category,
                    tnum,
                    attempt,
                    attempts,
                    exc,
                )
    logger.error(
        "PDP text generation failed after trying templates %s: %s",
        template_order,
        last_error,
    )
    return {}


