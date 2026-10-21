"""
Subscription plan constants and mappings for Shopify subscriptions
"""

# Default plan for new users
DEFAULT_PLAN = "free"

# Plan mappings for Shopify subscription creation
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free Plan",
        "price": {"monthly": "0.00", "yearly": "0.00"},
        "description": "Perfect for getting started",
        "max_pages": 1,
        "max_generations": 1,  # Free users get 2 generations, blocked on 3rd
        "features": [
            "1 product page",
            "Basic AI content generation",
            "Free theme templates",
            "Email support",
        ],
    },
    "starter": {
        "name": "Starter Plan",
        "price": {"monthly": "15.00", "yearly": "12.00"},
        "description": "Perfect for small stores and entrepreneurs",
        "max_pages": 3,
        "max_generations": 3,  # Starter plan gets 1 generation total
        "features": [
            "3 product pages",
            "AI content & image generation",
            "Premium theme templates",
            "Amazon integration",
            "Email support",
            "Analytics dashboard",
        ],
    },
    "basic": {
        "name": "Basic Plan",
        "price": {"monthly": "22.00", "yearly": "17.00"},
        "description": "Perfect for small stores and entrepreneurs",
        "max_pages": 5,
        "max_generations": 5,  # Basic plan ($34/$35) gets 10 generations total
        "features": [
            "5 product pages",
            "AI content & image generation",
            "Premium theme templates",
            "Amazon integration",
            "Email support",
            "Analytics dashboard",
        ],
    },
    "pro": {
        "name": "Pro Plan",
        "price": {"monthly": "39.00", "yearly": "31.00"},
        "description": "For growing businesses and agencies",
        "max_pages": 10,
        "max_generations": 10,  # Premium/Pro plan gets 20 generations total
        "features": [
            "20 product pages",
            "Advanced AI customization",
            "All integrations included",
            "Priority email support",
            "Custom branding options",
            "Advanced analytics",
            "Team collaboration",
        ],
    },
    "enterprise": {
        "name": "Enterprise Plan",
        "price": {"monthly": "custom", "yearly": "custom"},
        "description": "For large businesses and enterprises",
        "max_pages": 100,
        "max_generations": -1,  # -1 means unlimited for enterprise
        "features": [
            "100 product pages",
            "Dedicated account manager",
            "Custom AI model training",
            "White-label solutions",
            "24/7 priority support",
            "Custom integrations",
            "SLA guarantee",
            "Advanced API access",
        ],
    },
}

# Add-on definitions
ADD_ONS = {
    "single_page": {
        "name": "Single Page",
        "price": "5.00",
        "description": "Add 1 extra product page to your current plan",
        "type": "one_time",  # one_time or recurring
        "pages_added": 1,
        "icon": "plus",
    },
    "extra_pages_5": {
        "name": "5 Extra Pages",
        "price": "20.00",
        "description": "Add 5 extra product pages to your current plan",
        "type": "one_time",
        "pages_added": 5,
        "icon": "plus",
    },
    "extra_pages_10": {
        "name": "10 Extra Pages",
        "price": "35.00",
        "description": "Add 10 extra product pages to your current plan",
        "type": "one_time",
        "pages_added": 10,
        "icon": "plus",
    },
}


def get_plan_price(plan_name: str, billing_cycle: str) -> str:
    """
    Get the price for a specific plan and billing cycle

    Args:
        plan_name: Plan name (basic, pro, enterprise)
        billing_cycle: Billing cycle (monthly, yearly)

    Returns:
        Price as string (e.g., "35.00")
    """
    plan = SUBSCRIPTION_PLANS.get(plan_name.lower())
    if not plan:
        raise ValueError(f"Invalid plan name: {plan_name}")

    if plan_name.lower() == "enterprise":
        return "custom"

    return plan["price"].get(billing_cycle.lower(), plan["price"]["monthly"])


def get_plan_details(plan_name: str) -> dict:
    """
    Get full plan details

    Args:
        plan_name: Plan name (basic, pro, enterprise)

    Returns:
        Plan details dictionary
    """
    plan = SUBSCRIPTION_PLANS.get(plan_name.lower())
    if not plan:
        raise ValueError(f"Invalid plan name: {plan_name}")

    return plan


def is_valid_plan(plan_name: str) -> bool:
    """
    Check if plan name is valid

    Args:
        plan_name: Plan name to validate

    Returns:
        True if valid, False otherwise
    """
    return plan_name.lower() in SUBSCRIPTION_PLANS


def is_valid_billing_cycle(billing_cycle: str) -> bool:
    """
    Check if billing cycle is valid

    Args:
        billing_cycle: Billing cycle to validate

    Returns:
        True if valid, False otherwise
    """
    return billing_cycle.lower() in ["monthly", "yearly"]


def get_addon_details(addon_name: str) -> dict:
    """
    Get add-on details

    Args:
        addon_name: Add-on name to get details for

    Returns:
        Add-on details dictionary
    """
    addon = ADD_ONS.get(addon_name.lower())
    if not addon:
        raise ValueError(f"Invalid add-on name: {addon_name}")

    return addon


def is_valid_addon(addon_name: str) -> bool:
    """
    Check if add-on name is valid

    Args:
        addon_name: Add-on name to validate

    Returns:
        True if valid, False otherwise
    """
    return addon_name.lower() in ADD_ONS


def is_addon_purchase(addon_name: str) -> bool:
    """
    Check if the given name is an add-on purchase (not a plan upgrade)

    Args:
        addon_name: Name to check

    Returns:
        True if it's an add-on, False if it's a plan
    """
    return addon_name.lower() in ADD_ONS


def get_max_generations_for_plan(plan_name: str) -> int:
    """
    Get the maximum number of generations allowed for a given plan

    Args:
        plan_name: Plan identifier (free, basic, pro, enterprise)

    Returns:
        Maximum number of generations allowed (-1 for unlimited)
    """
    plan = SUBSCRIPTION_PLANS.get(plan_name.lower())
    if not plan:
        # Default to free plan limits if plan not found
        return SUBSCRIPTION_PLANS[DEFAULT_PLAN].get("max_generations", 1)

    return plan.get("max_generations", 1)  # Default to 2 if not specified
