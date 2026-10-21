from typing import Optional

# Import category-specific context builders
from .templates.health_beauty.context_builder import (
    build_product_context as build_health_beauty_context,
    format_context_for_prompt as format_health_beauty_context
)
from .templates.general.context_builder import (
    build_product_context as build_general_context,
    format_context_for_prompt as format_general_context
)
from .templates.fashion.context_builder import (
    build_product_context as build_fashion_context,
    format_context_for_prompt as format_fashion_context,
)
from .templates.home_kitchen.context_builder import (
    build_product_context as build_home_kitchen_context,
    format_context_for_prompt as format_home_kitchen_context,
)
from .templates.kids_toys.context_builder import (
    build_product_context as build_kids_toys_context,
    format_context_for_prompt as format_kids_toys_context,
)
from .templates.car_accessories.context_builder import (
    build_product_context as build_car_accessories_context,
    format_context_for_prompt as format_car_accessories_context,
)


def build_product_context(
    product_title: str, 
    product_description: str, 
    category: str
) -> Optional[str]:
    try:
        print(f"🔨 Building product context for category: {category}")

        category_key = (category or "").strip().lower()

        builders = {
            "health_beauty": (build_health_beauty_context, format_health_beauty_context),
            "fashion": (build_fashion_context, format_fashion_context),
            "home_kitchen": (build_home_kitchen_context, format_home_kitchen_context),
            "kids_toys": (build_kids_toys_context, format_kids_toys_context),
            "car_accessories": (build_car_accessories_context, format_car_accessories_context),
            # Keep backward compatibility / default
            "general": (build_general_context, format_general_context),
        }

        build_fn, format_fn = builders.get(
            category_key, (build_general_context, format_general_context)
        )

        product_context = build_fn(product_title, product_description)
        context_str = format_fn(product_context, product_title, product_description)
        
        print("✓ Product context built successfully - can be reused for text and images")
        return context_str
            
    except Exception as e:
        print(f"Error building product context: {e}")
        return None

