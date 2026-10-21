import json
import os
from typing import Dict, Any, Literal


StoreMode = Literal["single_product", "multi_product"]


_BASE_ASSETS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "assets",
    "shopify_files",
)


def _store_templates_path(mode: StoreMode) -> str:
    folder = "single_product" if mode == "single_product" else "multi_product"
    return os.path.join(_BASE_ASSETS_PATH, "store_templates", folder)


def _liquid_files_path() -> str:
    return os.path.join(_BASE_ASSETS_PATH, "liquid_files")


def load_store_template_json(mode: StoreMode) -> Dict[str, Any]:
    """
    Load the Shopify JSON templates for a store:
    - index.json (home page template)
    - product.json (product page template)
    - collection.json (collection page template)
    - list-collections.json (collections list page template)

    These are expected under:
      data/assets/shopify_files/store_templates/<single_product|multi_product>/

    Returns:
        {
          "index": <dict from index.json>,
          "product": <dict from product.json>,
          "collection": <dict from collection.json> if present,
          "list_collections": <dict from list-collections.json> if present,
        }
    """
    base = _store_templates_path(mode)
    index_path = os.path.join(base, "index.json")
    product_path = os.path.join(base, "product.json")
    collection_path = os.path.join(base, "collection.json")
    list_collections_path = os.path.join(base, "list-collections.json")

    result: Dict[str, Any] = {}

    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            result["index"] = json.load(f)

    if os.path.exists(product_path):
        with open(product_path, "r", encoding="utf-8") as f:
            result["product"] = json.load(f)

    if os.path.exists(collection_path):
        with open(collection_path, "r", encoding="utf-8") as f:
            result["collection"] = json.load(f)

    if os.path.exists(list_collections_path):
        with open(list_collections_path, "r", encoding="utf-8") as f:
            result["list_collections"] = json.load(f)

    return result


def load_store_liquid_files() -> Dict[str, str]:
    """
    Load all supporting Liquid section/template files that must be pushed to
    the user's theme to support the store templates.

    Reads every file under:
      data/assets/shopify_files/liquid_files/

    Returns:
        {
          "<filename>.liquid": "<file contents>",
          ...
        }
    """
    base = _liquid_files_path()
    if not os.path.exists(base):
        return {}

    files: Dict[str, str] = {}
    for entry in os.listdir(base):
        full_path = os.path.join(base, entry)
        if not os.path.isfile(full_path):
            continue
        # Only care about liquid files
        if not entry.endswith(".liquid"):
            continue
        with open(full_path, "r", encoding="utf-8") as f:
            files[entry] = f.read()

    return files

