"""
Plan configuration and limits for Roarr
"""

# Plan limits configuration
PLAN_LIMITS = {
    'free': {
        'max_pages': 1,
        'name': 'Free Plan'
    },
    'basic': {
        'max_pages': 5,
        'name': 'Basic Plan'
    },
    'pro': {
        'max_pages': 20,
        'name': 'Pro Plan'
    },
    'enterprise': {
        'max_pages': 100,
        'name': 'Enterprise Plan'
    }
}

# Default plan for new users
DEFAULT_PLAN = 'free'

# Plan types enum
PLAN_FREE = 'free'
PLAN_BASIC = 'basic'
PLAN_PRO = 'pro'
PLAN_ENTERPRISE = 'enterprise'

def get_max_pages_for_plan(plan: str) -> int:
    """
    Get the maximum number of pages allowed for a given plan
    
    Args:
        plan: Plan identifier (free, basic, pro, enterprise)
        
    Returns:
        Maximum number of pages allowed
    """
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[DEFAULT_PLAN]).get('max_pages', 5)

def get_plan_name(plan: str) -> str:
    """
    Get the display name for a given plan
    
    Args:
        plan: Plan identifier (free, basic, pro, enterprise)
        
    Returns:
        Plan display name
    """
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[DEFAULT_PLAN]).get('name', 'Basic Plan')

def is_valid_plan(plan: str) -> bool:
    """
    Check if a plan identifier is valid
    
    Args:
        plan: Plan identifier to validate
        
    Returns:
        True if valid, False otherwise
    """
    return plan in PLAN_LIMITS

