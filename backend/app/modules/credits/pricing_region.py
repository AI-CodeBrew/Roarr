"""
ISO 3166-1 alpha-2 country code from the Remix app (``X-Kluck-Pricing-Country``).

We do not infer country from the Shopify shop address. Actual prices come from
DynamoDB when a row exists for that code; otherwise the default catalog applies.
"""

from typing import Optional


def normalize_iso3166_alpha2(value: Optional[str]) -> Optional[str]:
    """
    Validate and normalize a header value to ISO 3166-1 alpha-2, or ``None``.

    Accepts only two ASCII letters (e.g. ``IN``, ``PK``, ``DE``).
    """
    if not value:
        return None
    code = str(value).strip().upper()
    if len(code) != 2 or not code.isalpha():
        return None
    return code
