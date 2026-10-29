"""
Manual smoke tests for POST /api/generate-for-store.

Store image generation behavior (backend):
- single_product: `productImages` | `product_images` | `images` | `image` must be non-empty
  or home-page images are skipped.
- multi_product: every product must have at least one image URL (`productImages`, `images`,
  etc.) or the multi-product image pipeline is skipped entirely.
"""

import json
import sys

import requests


BASE_URL = "http://localhost:5001"
GENERATE_FOR_STORE_PATH = "/api/generate-for-store"

# Reused sample asset so multi-product hits the image-generation path (each product needs URLs).
SAMPLE_PRODUCT_IMAGE_URL = (
    ""
)


def _headers():
    headers = {"Content-Type": "application/json"}

    return headers


def test_single_product_store():
    """Happy-path test for single_product mode (includes store home image generation)."""
    payload = {
        "mode": "single_product",  # API normalizes to lowercase
        "storeCategory": "car_accessories",
        "productTitle": "Car Drying Towel Car Accessories",
        "productDescription": "A car drying towel is a small, lightweight cloth used to dry the windows and mirrors of a car after washing. It is made of a soft, absorbent material that is designed to remove water quickly and efficiently, leaving the windows and mirrors streak-free and clear.",
        "productImages": [SAMPLE_PRODUCT_IMAGE_URL],
        # Optional Shopify-style handle for Liquid / metafields:
        # "handle": "car-drying-towel",
        "language": "English",
    }

    url = f"{BASE_URL}{GENERATE_FOR_STORE_PATH}"
    print(f"POST {url} (single_product)")
    response = requests.post(url, headers=_headers(), data=json.dumps(payload))

    print("Status:", response.status_code)
    try:
        print("JSON response:")
        print(json.dumps(response.json(), indent=2))
    except Exception:
        print("Raw response text:")
        print(response.text)


def test_multi_product_store():
    """Happy-path test for multi_product mode.

    Each product must include `productImages` (or `images` / `image`, etc.) with at least
    one URL, otherwise `generate_multi_product_store_images` is not run.
    """
    payload = {
        "mode": "multi_product",
        "storeCategory": "car_accessories",
        "products": [
            {
                "title": "All-Weather Floor Mats",
                "description": "Heavy-duty, easy-to-clean mats that protect car floors from mud, snow and spills.",
                "productImages": [SAMPLE_PRODUCT_IMAGE_URL],
                # "handle": "all-weather-floor-mats",
            },
            {
                "title": "Magnetic Phone Holder",
                "description": "Compact magnetic mount that keeps your phone secure and visible while driving.",
                "productImages": [SAMPLE_PRODUCT_IMAGE_URL],
            },
            {
                "title": "Trunk Organizer",
                "description": "Foldable organizer with multiple compartments for tools, groceries and travel gear.",
                "productImages": [SAMPLE_PRODUCT_IMAGE_URL],
            },
        ],
        "language": "English",
    }

    url = f"{BASE_URL}{GENERATE_FOR_STORE_PATH}"
    print(f"POST {url} (multi_product)")
    response = requests.post(url, headers=_headers(), data=json.dumps(payload))

    print("Status:", response.status_code)
    try:
        print("JSON response:")
        print(json.dumps(response.json(), indent=2))
    except Exception:
        print("Raw response text:")
        print(response.text)


if __name__ == "__main__":
    which = (sys.argv[1] if len(sys.argv) > 1 else "single").strip().lower()
    if which in ("single", "single_product", "1"):
        print("=== Testing single_product store generation ===")
        test_single_product_store()
    elif which in ("multi", "multi_product", "2"):
        print("=== Testing multi_product store generation ===")
        test_multi_product_store()
    elif which in ("both", "all"):
        print("=== Testing single_product store generation ===")
        test_single_product_store()
        print("\n\n=== Testing multi_product store generation ===")
        test_multi_product_store()
    else:
        print(
            "Usage: python test_generate_for_store.py [single|multi|both]\n"
            "Default: single",
            file=sys.stderr,
        )
        sys.exit(2)

