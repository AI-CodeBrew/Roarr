"""
Kids & Toys Context Builder

For now this reuses the General context builder to avoid breaking the existing
generation flow, while still giving us a category-specific module hook to
customize later.
"""

from ..general.context_builder import (  # type: ignore
    GeneralProductContext,
    build_product_context as _build_general_context,
    format_context_for_prompt as _format_general_context,
)


def build_product_context(product_title: str, product_description: str) -> GeneralProductContext:
    return _build_general_context(product_title, product_description)


def format_context_for_prompt(
    context: GeneralProductContext, product_title: str = "", product_description: str = ""
) -> str:
    return _format_general_context(context, product_title, product_description)

