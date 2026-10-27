import os
import tempfile
import requests
import mimetypes
import uuid
import shutil
import asyncio
import concurrent.futures
import time
from typing import List, Tuple, Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from google.genai import types
from ...clients.gemini_client import client
from ...clients.openai_client import client as openai_client
from ...clients.langchain_client import llm_4_1_nano, llm_5_mini_medium
from .prompts import (
    BASE_IMAGE_PROMPT_FRONT,
    BASE_IMAGE_PROMPT_ANGLE,
    get_image_prompt_refinement_prompt,
)
from .prompts import PRODUCT_FIDELITY_PROMPT
from .detect_subcategory import (
    IMAGE_SUBCATEGORIES,
    CATEGORY_DETECTION_SYSTEM_PROMPT,
    HEALTH_BEAUTY_SUBCATEGORIES,
    detect_image_subcategory,
)
from .home_prompt_builder import build_home_image_prompt
from app.modules.storage.utils import StorageUtils
import json

# Note: Context building is now done in routes.py and passed to this function
# We no longer import context builders here to avoid duplicate LLM calls

OUTPUT_FILE_NAME = "generated_output"

# Configuration for concurrent processing
DEFAULT_MAX_WORKERS = int(
    os.getenv("IMAGE_GENERATION_MAX_WORKERS", "10")
)  # Default to 3 concurrent workers
IMAGE_DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("IMAGE_DOWNLOAD_TIMEOUT_SECONDS", "0"))
IMAGE_GENERATION_RETRY_ATTEMPTS = int(os.getenv("IMAGE_GENERATION_RETRY_ATTEMPTS", "3"))
IMAGE_RETRY_BACKOFF_SECONDS = float(os.getenv("IMAGE_RETRY_BACKOFF_SECONDS", "1.0"))
# Images are made by OpenAI's cheapest image model first (low quality 1024x1024 is about $0.005 per
# image); Gemini stays as the fallback when OpenAI fails or has no key. IMAGE_PROVIDER=gemini
# switches back to Gemini only.
IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "openai").strip().lower()
OPENAI_IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
OPENAI_IMAGE_QUALITY = os.getenv("OPENAI_IMAGE_QUALITY", "low")  # low | medium | high
OPENAI_IMAGE_TIMEOUT_SECONDS = float(os.getenv("OPENAI_IMAGE_TIMEOUT_SECONDS", "180"))
# Reference photos are billed as input tokens, so only a few are sent, each shrunk first.
OPENAI_MAX_REFERENCE_IMAGES = int(os.getenv("OPENAI_MAX_REFERENCE_IMAGES", "3"))
OPENAI_REFERENCE_MAX_SIDE = 1024
GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
GEMINI_IMAGE_FALLBACK_MODEL = "gemini-2.5-flash-image"
# Homepage creative/highlight used to stay on the fallback model. That model
# returned no file for those slots while the banner on Gemini 3 succeeded.
GEMINI_3_IMAGE_TYPES = frozenset({
    "base_image",
    "product_images",
    "happy_customer_images",
    "creative_image",
    "highlight_image",
})


def refine_prompts(
    prompts: Dict[str, Any],
    product_title: str,
    product_description: str,
    category: str = "general",
    prompt_type: str = "product",
) -> Dict[str, Any]:

    if not prompts:
        return prompts

    refined_prompts = {}
    # Use LangChain client
    llm = llm_5_mini_medium

    print(f"Refining {prompt_type} prompts using LLM (concurrent)...")

    # Helper function to refine a single prompt
    def refine_single_prompt(image_key: str, original_prompt: str) -> str:
        """
        Refine a single string prompt using LLM.
        """
        refinement_prompt_text = get_image_prompt_refinement_prompt(
            product_title=product_title,
            product_description=product_description,
            category=category,
            prompt_type=prompt_type,
            image_key=image_key,
            original_prompt=original_prompt,
        )

        # Create prompt template
        user_prompt = HumanMessagePromptTemplate.from_template("{refinement_prompt}")
        chat_prompt = ChatPromptTemplate.from_messages([user_prompt])

        # Format and invoke
        formatted_prompt = chat_prompt.format_messages(
            refinement_prompt=refinement_prompt_text
        )

        # Get refined prompt text
        response = llm.invoke(formatted_prompt)
        refined_text = response.content.strip()

        print(f"  ✓ Refined: {image_key}")
        return refined_text

    # Flatten prompts into a list for concurrent processing
    def flatten_prompts(
        prompts_dict: Dict[str, Any], parent_key: str = ""
    ) -> List[Tuple[str, str]]:
        """
        Flatten nested prompt structure into a list of (key, prompt_text) tuples.
        """
        items = []
        for key, value in prompts_dict.items():
            full_key = f"{parent_key}.{key}" if parent_key else key
            if isinstance(value, str):
                items.append((full_key, value))
            elif isinstance(value, dict):
                items.extend(flatten_prompts(value, full_key))
        return items

    # Reconstruct nested structure from flat results
    def reconstruct_prompts(flat_results: Dict[str, str]) -> Dict[str, Any]:
        """
        Reconstruct nested prompt structure from flat key-value pairs.
        """
        result = {}
        for key, value in flat_results.items():
            keys = key.split(".")
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = value
        return result

    # Flatten all prompts for concurrent processing
    flat_prompts = flatten_prompts(prompts)

    if not flat_prompts:
        return prompts

    # Use ThreadPoolExecutor for concurrent refinement
    max_workers = min(DEFAULT_MAX_WORKERS, len(flat_prompts))

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all refinement tasks
        future_to_key = {
            executor.submit(refine_single_prompt, key, prompt_text): key
            for key, prompt_text in flat_prompts
        }

        # Collect results as they complete
        flat_results = {}
        for future in concurrent.futures.as_completed(future_to_key):
            key = future_to_key[future]
            try:
                refined_text = future.result()
                flat_results[key] = refined_text
            except Exception as e:
                print(f"  ⚠ Error refining {key}: {e}")
                # Fall back to original prompt if refinement fails
                original_prompt = next(p for k, p in flat_prompts if k == key)
                flat_results[key] = original_prompt

    # Reconstruct nested structure
    refined_prompts = reconstruct_prompts(flat_results)

    print(f"✓ Successfully refined {prompt_type} prompts ({len(flat_prompts)} prompts)")

    return refined_prompts


def load_template_image_keys(
    category: str, template: str
) -> Optional[Dict[str, List[str]]]:
    """
    Load the list of image keys to generate for a (category, template) from
    templates/<category>/image_keys.json. Only these keys will be used when
    loading prompts from templates_image/<subcategory>/.

    Args:
        category: e.g. 'health_beauty'
        template: e.g. 'template_1' or 'template_2'

    Returns:
        {"product_images": ["product_image_1", ...], "body_images": ["before_use_image", ...]}
        or None if file/template not found.
    """
    if not category or template is None or template == "":
        return None
    try:
        # template_1 -> "1", template_2 -> "2"; also accept int 1 / 2
        template_str = str(template).strip()
        template_num = template_str.split("_")[-1] if "_" in template_str else template_str
        base_path = os.path.join(os.path.dirname(__file__), "templates", category)
        file_path = os.path.join(base_path, "image_keys.json")
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        config = data.get(template_num)
        # Aura (template 3) and Lumenook (template 4) image keys are shared — fall back to health_beauty when missing.
        if not config and template_num in ("3", "4") and category != "health_beauty":
            hb_path = os.path.join(
                os.path.dirname(__file__), "templates", "health_beauty", "image_keys.json"
            )
            if os.path.exists(hb_path):
                with open(hb_path, "r", encoding="utf-8") as hb_f:
                    hb_data = json.load(hb_f)
                config = hb_data.get(template_num)
        if not config:
            return None
        return config
    except Exception as e:
        print(f"Error loading template image keys for {category}/{template}: {e}")
        return None


def filter_prompts_by_keys(
    prompts_dict: Dict[str, Any], allowed_keys: List[str], prompt_group: str
) -> Dict[str, Any]:
    """
    Filter a prompts dict to only include keys that are in allowed_keys.
    - For product: prompts_dict has "product_images": { "product_image_1": "...", ... }
    - For body: prompts_dict has nested sections; we keep only leaf keys in allowed_keys.
    """
    if not allowed_keys:
        return prompts_dict
    allowed_set = set(allowed_keys)

    if prompt_group == "product":
        product_block = prompts_dict.get("product_images", {})
        if not isinstance(product_block, dict):
            return prompts_dict
        filtered = {k: v for k, v in product_block.items() if k in allowed_set}
        return {"product_images": filtered} if filtered else {}

    # body: nested structure (sections with dict or string values)
    result = {}
    for section_key, section_value in prompts_dict.items():
        if isinstance(section_value, dict):
            filtered = {k: v for k, v in section_value.items() if k in allowed_set}
            if filtered:
                result[section_key] = filtered
        elif isinstance(section_value, str) and section_key in allowed_set:
            result[section_key] = section_value
    return result


def load_image_prompts(subcategory: str, prompt_type: str = "product"):
    """
    Load image prompts for a specific subcategory from templates_image folder.

    Args:
        subcategory: Subcategory name (e.g., 'electronics_tech', 'skincare')
        prompt_type: Type of prompts to load - "product" or "body"

    Returns:
        Dictionary containing image prompts or None if not found
    """
    try:
        # Construct file path to JSON in templates_image folder
        base_path = os.path.join(os.path.dirname(__file__), "templates_image")

        # Choose the appropriate file based on prompt_type
        if prompt_type == "product":
            image_prompts_file = "product_image_prompts.json"
        else:
            image_prompts_file = "body_image_prompts.json"

        file_path = os.path.join(base_path, subcategory, image_prompts_file)

        if not os.path.exists(file_path):
            print(f"Warning: Image prompts file not found: {file_path}")
            return None

        # Load JSON file
        with open(file_path, "r", encoding="utf-8") as f:
            image_prompts = json.load(f)

        print(
            f"Successfully loaded {prompt_type} image prompts for subcategory: {subcategory}"
        )
        return image_prompts

    except Exception as e:
        print(
            f"Error loading {prompt_type} image prompts for subcategory {subcategory}: {e}"
        )
        return None


def convert_urls_to_paths(image_urls, temp_dir):
    """
    Converts image URLs to local file paths by downloading them to temp folder.
    """
    temp_paths = []
    request_timeout = (
        IMAGE_DOWNLOAD_TIMEOUT_SECONDS if IMAGE_DOWNLOAD_TIMEOUT_SECONDS > 0 else None
    )

    for i, url in enumerate(image_urls):
        try:
            response = requests.get(url, timeout=request_timeout)
            response.raise_for_status()
            filename = f"image_{i}.jpg"
            temp_path = os.path.join(temp_dir, filename)

            with open(temp_path, "wb") as f:
                f.write(response.content)

            temp_paths.append(temp_path)

        except Exception as e:
            print(f"Error downloading image URL at index {i}: {e}")

    return temp_paths


def save_binary_file(file_path, data):
    """Saves raw binary data to a file."""
    with open(file_path, "wb") as f:
        f.write(data)


def get_img_data_type(path):
    img_type, _ = mimetypes.guess_type(path)
    with open(path, "rb") as f:
        img_data = f.read()
    return img_data, img_type


def cleanup_temp_directory(temp_dir):
    """Clean up temporary directory and all its contents."""
    try:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"Cleaned up temporary directory: {temp_dir}")
    except Exception as e:
        print(f"Error cleaning up temp directory {temp_dir}: {e}")


def upload_images_to_cdn(image_paths):
    """Upload generated images to Bunny CDN and return their URLs."""
    image_urls = []

    for image_path in image_paths:
        try:
            file_extension = os.path.splitext(image_path)[1]
            unique_id = str(uuid.uuid4().hex[:8])
            filename = f"{unique_id}_kluck_ai_generated_image{file_extension}"
            url = StorageUtils.upload_public(image_path, filename)
            if url:
                image_urls.append(url)
            else:
                print(f"Failed to upload: {image_path}")
        except Exception as e:
            print(f"Error uploading {image_path}: {e}")

    return image_urls


def load_store_image_keys(
    mode: str,
    store_template_pack: str = "classic",
) -> Optional[Dict[str, Any]]:
    """
    Load store-level image keys (home_page, product_page) for single or multi product
    stores from store/templates/<mode>/image_keys.json.

    Args:
        mode: "single_product" or "multi_product"
        store_template_pack: "classic" | "cinematic"
    """
    try:
        from .store.pack_utils import normalize_store_template_pack

        pack = normalize_store_template_pack(store_template_pack)
        if mode == "single_product":
            folder = (
                os.path.join("packs", pack)
                if pack in ("cinematic", "amour")
                else "single_store"
            )
        else:
            folder = "multi_store"

        base_path = os.path.join(
            os.path.dirname(__file__), "store", "templates", folder
        )
        file_path = os.path.join(base_path, "image_keys.json")
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        home_page_raw = data.get("home_page", [])
        product_page_raw = data.get("product_page", [])

        home_page_ratios: Dict[str, str] = {}
        product_page_ratios: Dict[str, str] = {}

        home_image_keys: List[str] = []
        product_image_keys: List[str] = []

        if isinstance(home_page_raw, dict):
            home_page_ratios = {
                str(k): str(v) for k, v in home_page_raw.items() if v is not None
            }
            home_image_keys = list(home_page_raw.keys())
        elif isinstance(home_page_raw, list):
            home_image_keys = [str(x) for x in home_page_raw]

        if isinstance(product_page_raw, dict):
            product_page_ratios = {
                str(k): str(v)
                for k, v in product_page_raw.items()
                if v is not None
            }
            product_image_keys = list(product_page_raw.keys())
        elif isinstance(product_page_raw, list):
            product_image_keys = [str(x) for x in product_page_raw]

        return {
            "home_page": home_image_keys,
            "product_page": product_image_keys,
            "home_page_ratios": home_page_ratios,
            "product_page_ratios": product_page_ratios,
        }
    except Exception as e:
        print(f"Error loading store image keys for mode={mode}: {e}")
        return None


def generate_single_product_store_images(
    product_title: str,
    product_description: str,
    product_images: list,
    category: str,
    language: Optional[str] = None,
    page_id: Optional[str] = None,
    document_store=None,
    store_template_pack: str = "classic",
    brand_colors: Optional[list] = None,
) -> Dict[str, Any]:

    if not isinstance(product_images, list) or not product_images:
        return {}

    if page_id and document_store:
        document_store.update_generation_percentage(page_id, 32)

    from .store.pack_utils import normalize_store_template_pack
    from .store.templates.packs.cinematic.hero_prompt import (
        CINEMATIC_HERO_BANNER_PROMPT,
        CINEMATIC_HERO_MOBILE_PROMPT,
        CINEMATIC_PRODUCT_STORY_PROMPT,
        CINEMATIC_WHY_SHOP_PROMPT,
        CIRCLE_FEATURE_PROMPT_SUFFIX,
    )

    pack = normalize_store_template_pack(store_template_pack)

    # Amour: templated prompts (same 12 keys/ratios), category-agnostic variables.
    if pack == "amour":
        return generate_amour_store_images(
            product_title=product_title,
            product_description=product_description,
            product_images=product_images,
            category=category,
            brand_colors=brand_colors,
            page_id=page_id,
            document_store=document_store,
        )

    # Load store image keys from JSON config
    keys_config = load_store_image_keys("single_product", store_template_pack=pack) or {}
    home_image_keys = keys_config.get("home_page", [])
    product_image_keys = keys_config.get("product_page", [])
    home_page_ratios = keys_config.get("home_page_ratios", {})
    product_page_ratios = keys_config.get("product_page_ratios", {})

    _HOME_PROMPT_KEYS = {
        "banner_image",
        "banner_image_2",
        "banner_image_mobile",
        "creative_image",
        "highlight_image",
    }
    _PRODUCT_IMG_KEYS = {"product_image_1", "product_image_2", "product_image_3"}
    _BODY_IMG_KEYS = {
        "product_impact_image",
        "feature_image",
        "product_story_image",
        "why_shop_image",
        "circle_feature_image",
    }
    # product_story reuses product_impact prompt once.
    # why_shop / circle_feature each get their OWN generation (same base prompt,
    # different composition suffixes) — never share one feature_image URL.
    _BODY_KEY_ALIASES = {
        "product_story_image": "product_impact_image",
    }
    _CINEMATIC_FEATURE_KEYS = ("why_shop_image", "circle_feature_image")

    result: Dict[str, Any] = {"home_page": {}, "product_page": {}}
    temp_dir = tempfile.mkdtemp()

    try:
        # Download original product images (used directly for banner/creative/highlight)
        image_paths = convert_urls_to_paths(product_images, temp_dir)
        if not image_paths:
            return result

        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 36)

        # Detect subcategory — shared by both pipeline paths below
        image_subcategory = detect_image_subcategory(product_title, product_description)

        product_slot = [{"title": product_title, "description": product_description}]

        new_keys = [k for k in home_image_keys if k in _HOME_PROMPT_KEYS]
        product_img_keys = [k for k in home_image_keys if k in _PRODUCT_IMG_KEYS]
        body_img_keys = [k for k in home_image_keys if k in _BODY_IMG_KEYS]

        def _run_new_path():
            """banner / creative / highlight: new prompt builder + original images."""
            if not new_keys:
                return {}
            new_prompts = []
            for k in new_keys:
                if pack == "cinematic" and k == "banner_image":
                    new_prompts.append(CINEMATIC_HERO_BANNER_PROMPT)
                elif pack == "cinematic" and k == "banner_image_mobile":
                    new_prompts.append(CINEMATIC_HERO_MOBILE_PROMPT)
                else:
                    new_prompts.append(
                        build_home_image_prompt(k, image_subcategory, product_slot)
                    )
            generated_urls = generate_images_concurrent(
                image_paths,
                new_prompts,
                temp_dir,
                image_types=new_keys,
                aspect_ratios=[home_page_ratios.get(k) for k in new_keys],
                max_workers=len(new_prompts),
            )
            return {
                key: generated_urls[i]
                for i, key in enumerate(new_keys)
                if i < len(generated_urls) and generated_urls[i]
            }

        def _run_legacy_path():
            """product_image_1/2/3 + product_impact/feature: base-image + JSON prompt pipeline.
            Both sub-paths share one base image generation call, then run concurrently."""
            if not product_img_keys and not body_img_keys:
                return {}

            base_images = generate_base_images(image_paths, temp_dir)
            front_path = base_images.get("front")
            if not front_path:
                return {}

            legacy_result = {}
            uploaded_base_url = _upload_single_image_path(front_path)
            if uploaded_base_url:
                legacy_result["product_base_image"] = uploaded_base_url

            def _run_product_images():
                if not product_img_keys:
                    return {}
                prod_prompts = load_image_prompts(image_subcategory, prompt_type="product")
                if not prod_prompts:
                    return {}
                prod_prompts = filter_prompts_by_keys(prod_prompts, product_img_keys, "product")
                if not prod_prompts:
                    return {}
                return generate_product_images(
                    [front_path], prod_prompts, temp_dir,
                    product_title, product_description, category,
                    None, None, language,
                    aspect_ratio_overrides=home_page_ratios,
                )

            def _run_body_images():
                if not body_img_keys:
                    return {}
                body_prompts = load_image_prompts(image_subcategory, prompt_type="body")
                if not body_prompts:
                    return {}

                def _feature_prompt_text(prompts: Dict[str, Any]) -> str:
                    """Pull the classic feature_image prompt string from body JSON."""
                    if not isinstance(prompts, dict):
                        return ""
                    direct = prompts.get("feature_image")
                    if isinstance(direct, str) and direct.strip():
                        return direct.strip()
                    for section_value in prompts.values():
                        if isinstance(section_value, dict):
                            feat = section_value.get("feature_image")
                            if isinstance(feat, str) and feat.strip():
                                return feat.strip()
                    return ""

                # Classic body slots (impact / feature). Cinematic story/why-shop
                # get dedicated prompts below — do not alias story onto impact.
                classic_keys = []
                reverse_alias = {}
                for key in body_img_keys:
                    if key in _CINEMATIC_FEATURE_KEYS:
                        continue
                    if pack in ("cinematic", "amour") and key == "product_story_image":
                        continue
                    source = _BODY_KEY_ALIASES.get(key, key)
                    if source not in classic_keys:
                        classic_keys.append(source)
                    reverse_alias.setdefault(source, []).append(key)

                filtered_prompts = (
                    filter_prompts_by_keys(body_prompts, classic_keys, "body")
                    if classic_keys
                    else {}
                )
                if not isinstance(filtered_prompts, dict):
                    filtered_prompts = {}

                cinematic_slots = {}
                if pack in ("cinematic", "amour") and "product_story_image" in body_img_keys:
                    cinematic_slots["product_story_image"] = (
                        CINEMATIC_PRODUCT_STORY_PROMPT
                    )
                feature_text = _feature_prompt_text(body_prompts)
                if "why_shop_image" in body_img_keys:
                    cinematic_slots["why_shop_image"] = CINEMATIC_WHY_SHOP_PROMPT
                if "circle_feature_image" in body_img_keys and feature_text:
                    cinematic_slots["circle_feature_image"] = (
                        f"{feature_text}\n\n{CIRCLE_FEATURE_PROMPT_SUFFIX}"
                    )
                if cinematic_slots:
                    filtered_prompts = dict(filtered_prompts)
                    filtered_prompts["cinematic_feature_images"] = cinematic_slots

                if not filtered_prompts:
                    return {}

                # Aspect overrides must use generation leaf keys (why_shop / circle / impact).
                aspect_overrides = dict(home_page_ratios or {})
                if "product_story_image" in body_img_keys and "product_impact_image" not in aspect_overrides:
                    aspect_overrides["product_impact_image"] = aspect_overrides.get(
                        "product_story_image", "1:1"
                    )

                if image_subcategory in HEALTH_BEAUTY_SUBCATEGORIES:
                    generated = generate_health_beauty_body_images(
                        [front_path], filtered_prompts, temp_dir,
                        product_title, product_description, category,
                        None, None, language,
                        aspect_ratio_overrides=aspect_overrides,
                    )
                else:
                    generated = generate_general_body_images(
                        [front_path], filtered_prompts, temp_dir,
                        product_title, product_description, category,
                        None, None, language,
                        aspect_ratio_overrides=aspect_overrides,
                    )

                remapped = {}
                for source_key, urls_or_val in (generated or {}).items():
                    targets = reverse_alias.get(source_key, [source_key])
                    for target in targets:
                        remapped[target] = urls_or_val
                for source_key, urls_or_val in (generated or {}).items():
                    if source_key in body_img_keys:
                        remapped[source_key] = urls_or_val
                return remapped

            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as inner_pool:
                f_prod = inner_pool.submit(_run_product_images)
                f_body = inner_pool.submit(_run_body_images)
                legacy_result.update(f_prod.result())
                legacy_result.update(f_body.result())

            return legacy_result

        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 40)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            future_new = pool.submit(_run_new_path)
            future_legacy = pool.submit(_run_legacy_path)
            result["home_page"].update(future_new.result())
            result["home_page"].update(future_legacy.result())

        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 52)

        result["image_subcategory"] = image_subcategory

        # Product page generation intentionally disabled for store flows.
        # Re-enable by uncommenting the block below.
        #
        # product_prompts = load_image_prompts(image_subcategory, prompt_type="product")
        # if product_prompts:
        #     product_prompts = filter_prompts_by_keys(
        #         product_prompts, product_image_keys, "product"
        #     )
        #     if product_prompts.get("product_images"):
        #         product_page_images = generate_product_images(...)
        #         result["product_page"] = product_page_images

        return result
    finally:
        try:
            cleanup_temp_directory(temp_dir)
        except Exception as e:
            print(f"Error cleaning up temp directory {temp_dir}: {e}")


def generate_amour_store_images(
    product_title: str,
    product_description: str,
    product_images: list,
    category: Optional[str] = None,
    brand_colors: Optional[list] = None,
    page_id: Optional[str] = None,
    document_store=None,
) -> Dict[str, Any]:
    """Amour homepage images: base product shot, then 12 templated slots at their ratios."""
    from .store.templates.packs.amour.image_prompts import (
        build_all_prompts,
        build_image_variables,
    )

    result: Dict[str, Any] = {"home_page": {}, "product_page": {}}
    temp_dir = tempfile.mkdtemp()
    try:
        image_paths = convert_urls_to_paths(product_images, temp_dir)
        if not image_paths:
            return result
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 36)

        result["image_subcategory"] = detect_image_subcategory(
            product_title, product_description
        )
        front_path = generate_base_images(image_paths, temp_dir).get("front")
        if not front_path:
            return result
        base_url = _upload_single_image_path(front_path)
        if base_url:
            result["home_page"]["product_base_image"] = base_url
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 42)

        variables = build_image_variables(
            product_title=product_title,
            product_description=product_description or "",
            category=category,
            brand_colors=brand_colors,
        )
        slot_specs = build_all_prompts(variables)
        # Reference product identity once; templates already carry scene + STYLE.
        product_context = (
            f"Reference product: {product_title}\n"
            f"Keep the product visually faithful to the reference images.\n\n"
            f"{PRODUCT_FIDELITY_PROMPT}"
        )
        prompts = [f"{product_context}\n\n{spec['prompt']}" for spec in slot_specs]
        urls = generate_images_concurrent(
            [front_path],
            prompts,
            temp_dir,
            image_types=[spec["image_type"] for spec in slot_specs],
            aspect_ratios=[spec["ratio"] for spec in slot_specs],
            max_workers=4,
        )
        for i, spec in enumerate(slot_specs):
            if i < len(urls) and urls[i]:
                result["home_page"][spec["key"]] = urls[i]
            else:
                print(
                    f"Amour image slot '{spec['key']}' missing after retries; continuing."
                )
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 52)
        return result
    finally:
        try:
            cleanup_temp_directory(temp_dir)
        except Exception as e:
            print(f"Error cleaning up temp directory {temp_dir}: {e}")


def _pick_first_body_string(body_prompts: Dict[str, Any], *keys: str) -> str:
    if not body_prompts:
        return ""
    for key in keys:
        val = body_prompts.get(key)
        if isinstance(val, str) and val.strip():
            return val
    return ""


def _upload_single_image_path(image_path: Optional[str]) -> Optional[str]:
    if not image_path:
        return None
    urls = upload_images_to_cdn([image_path])
    return urls[0] if urls else None


def generate_multi_product_store_images(
    products: list,
    category: str,
    language: Optional[str] = None,
    page_id: Optional[str] = None,
    document_store=None,
) -> Dict[str, Any]:
    """
    Generate store images for 1–3 products: per product — banner, dedicated product_image_{n}
    (JSON product prompts, same pipeline as single-store), product_impact + feature from body prompts;
    plus one multi-product highlight and one star_image (first product only).

    Each product dict must include title, description, and productImages (non-empty URL list).

    Returns:
        {"home_page": { str_key: url, ... }, "product_page": {}}
    """
    result: Dict[str, Any] = {"home_page": {}, "product_page": {}}
    if not isinstance(products, list) or not (1 <= len(products) <= 3):
        return result

    normalized_products: List[Dict[str, Any]] = []
    for p in products:
        if not isinstance(p, dict):
            return {"home_page": {}, "product_page": {}}

        title = str(p.get("title", "")).strip()
        desc = str(p.get("description", "")).strip()

        urls = (
            p.get("productImages")
            or p.get("product_images")
            or p.get("images")
            or p.get("image")
            or []
        )
        if isinstance(urls, str):
            urls = [urls]
        urls = [str(u).strip() for u in urls if u and str(u).strip()]

        if not title or not desc or not urls:
            return {"home_page": {}, "product_page": {}}

        normalized_products.append(
            {
                "title": title,
                "description": desc,
                "productImages": urls,
            }
        )

    language_instruction_overlay = (
        f"\n\nMake sure that All overlay text added must be in {language.strip()}. The scene should be appropriate for a {language.strip()}-speaking audience."
        if (language and str(language).strip())
        else ""
    )
    language_instruction_body = (
        f"\n\nAll text visible in the image (signs, labels, captions, overlays) must be in {language.strip()}. The scene should be appropriate for a {language.strip()}-speaking audience."
        if (language and str(language).strip())
        else ""
    )

    temp_dir = tempfile.mkdtemp()
    try:
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 34)

        category_key = (category or "").strip().lower() or "general"
        store_keys_config = load_store_image_keys("multi_product") or {}
        home_page_ratios = store_keys_config.get("home_page_ratios", {}) or {}

        all_front_paths: List[str] = []
        all_original_paths: List[str] = []
        first_body_prompts: Optional[Dict[str, Any]] = None
        first_front_path: Optional[str] = None
        first_title = ""
        first_desc = ""
        first_image_subcategory = "general"
        subcats_by_idx: Dict[int, str] = {}

        def _generate_for_one_product(idx: int, prod: Dict[str, Any]) -> Dict[str, Any]:
            """
            Downloads original images, generates banner via new prompt builder,
            and generates product_impact/feature via legacy base-image + JSON path.
            """
            sub_dir = os.path.join(temp_dir, f"p{idx}")
            os.makedirs(sub_dir, exist_ok=True)

            local_paths = convert_urls_to_paths(prod["productImages"], sub_dir)
            if not local_paths:
                return {
                    "idx": idx,
                    "front_path": None,
                    "body_prompts": None,
                    "images": {},
                    "original_paths": [],
                    "image_subcategory": "general",
                }

            image_subcategory = detect_image_subcategory(
                prod["title"], prod["description"]
            )
            body_prompts = load_image_prompts(image_subcategory, "body") or {}
            images_map: Dict[str, str] = {}

            # --- banner_image_{idx}: new prompt builder + original product images ---
            product_slot = [{"title": prod["title"], "description": prod["description"]}]
            banner_prompt = build_home_image_prompt("banner_image", image_subcategory, product_slot)
            banner_urls = generate_images_concurrent(
                local_paths,
                [banner_prompt],
                sub_dir,
                image_types=["banner_image"],
                aspect_ratios=[home_page_ratios.get(f"banner_image_{idx}")],
                max_workers=1,
            )
            if banner_urls and banner_urls[0]:
                images_map[f"banner_image_{idx}"] = banner_urls[0]

            # --- product_impact_{idx} / feature_{idx}: legacy base-image + JSON ---
            base_images = generate_base_images(local_paths, sub_dir)
            front = base_images.get("front")

            if front:
                base_image_url = _upload_single_image_path(front)
                if base_image_url:
                    images_map[f"product_base_image_{idx}"] = base_image_url
                product_context = (
                    f"Product: {prod['title']}\nDescription: {prod['description']}"
                )
                slot_key = f"product_image_{idx}"
                product_prompts_json = load_image_prompts(image_subcategory, "product") or {}
                filtered_slot = filter_prompts_by_keys(
                    product_prompts_json, [slot_key], "product"
                )

                def _run_product_slot_shot() -> Dict[str, str]:
                    """`product_image_*` JSON pipeline (same as single-store), one slot per product index."""
                    if not filtered_slot.get("product_images"):
                        return {}
                    try:
                        return generate_product_images(
                            [front],
                            filtered_slot,
                            sub_dir,
                            prod["title"],
                            prod["description"],
                            category_key,
                            None,
                            None,
                            language,
                            aspect_ratio_overrides=home_page_ratios,
                        )
                    except Exception as e:
                        print(
                            f"Multi-store {slot_key} generation failed for product {idx}: {e}"
                        )
                        return {}

                def _run_impact_and_feature() -> Dict[str, str]:
                    legacy_prompts: List[str] = []
                    legacy_keys_list: List[str] = []
                    legacy_types: List[Optional[str]] = []
                    legacy_ratios: List[Optional[str]] = []

                    product_impact_prompt = body_prompts.get("product_impact_image")
                    if not isinstance(product_impact_prompt, str) or not product_impact_prompt.strip():
                        for k in ("banner_image", "product_impact_image"):
                            v = body_prompts.get(k)
                            if isinstance(v, str) and v.strip():
                                product_impact_prompt = v
                                break

                    if product_impact_prompt and isinstance(product_impact_prompt, str) and product_impact_prompt.strip():
                        legacy_prompts.append(
                            f"{product_context}\n\n{product_impact_prompt}{language_instruction_body}\n\n{PRODUCT_FIDELITY_PROMPT}"
                        )
                        legacy_keys_list.append(f"product_impact_image_{idx}")
                        legacy_types.append("product_impact_image")
                        legacy_ratios.append(home_page_ratios.get(f"product_impact_image_{idx}"))

                    feature_prompt = body_prompts.get("feature_image")
                    if isinstance(feature_prompt, str) and feature_prompt.strip():
                        legacy_prompts.append(
                            f"{product_context}\n\n{feature_prompt}{language_instruction_body}\n\n{PRODUCT_FIDELITY_PROMPT}"
                        )
                        legacy_keys_list.append(f"feature_image_{idx}")
                        legacy_types.append("feature_image")
                        legacy_ratios.append(home_page_ratios.get(f"feature_image_{idx}"))

                    out: Dict[str, str] = {}
                    if legacy_prompts:
                        legacy_urls = generate_images_concurrent(
                            [front],
                            legacy_prompts,
                            sub_dir,
                            image_types=legacy_types,
                            aspect_ratios=legacy_ratios,
                            max_workers=len(legacy_prompts),
                        )
                        for i, key in enumerate(legacy_keys_list):
                            if i < len(legacy_urls) and legacy_urls[i]:
                                out[key] = legacy_urls[i]
                    return out

                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as inner_pool:
                    fut_slot = inner_pool.submit(_run_product_slot_shot)
                    fut_legacy = inner_pool.submit(_run_impact_and_feature)
                    images_map.update(fut_slot.result())
                    images_map.update(fut_legacy.result())

            return {
                "idx": idx,
                "front_path": front,
                "body_prompts": body_prompts,
                "images": images_map,
                "original_paths": local_paths,
                "image_subcategory": image_subcategory,
            }

        # Parallelize per-product pipeline (download/base + banner/product/feature)
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=len(normalized_products)
        ) as executor:
            future_to_idx = {
                executor.submit(_generate_for_one_product, idx, prod): idx
                for idx, prod in enumerate(normalized_products, start=1)
            }

            for future in concurrent.futures.as_completed(future_to_idx):
                prod_idx = future_to_idx[future]
                try:
                    prod_result = future.result()
                except Exception:
                    prod_result = None

                if not prod_result:
                    continue

                subcats_by_idx[prod_idx] = prod_result.get("image_subcategory", "general")

                # Merge per-product generated urls
                result["home_page"].update(prod_result.get("images") or {})

                front_path = prod_result.get("front_path")
                if front_path:
                    all_front_paths.append(front_path)

                orig_paths = prod_result.get("original_paths") or []
                all_original_paths.extend(orig_paths)

                if prod_idx == 1:
                    first_body_prompts = prod_result.get("body_prompts")
                    first_front_path = front_path
                    first_title = normalized_products[0].get("title", "")
                    first_desc = normalized_products[0].get("description", "")
                    first_image_subcategory = prod_result.get("image_subcategory", "general")

        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 52)

        # Parallelize highlight + happy-customer once all per-product jobs are done
        if all_original_paths and first_front_path:
            # highlight_image: new prompt builder + all original product images
            all_products_for_highlight = [
                {"title": p["title"], "description": p["description"]}
                for p in normalized_products
            ]
            highlight_prompt = build_home_image_prompt(
                "highlight_image", first_image_subcategory, all_products_for_highlight
            )

            # star_image: legacy path — first product's happy-customer JSON prompt + base image
            hc_block = (first_body_prompts or {}).get("happy_customer_images")
            hc_prompt = (
                hc_block.get("happy_customer_image_1")
                if isinstance(hc_block, dict)
                else None
            )
            combined_hc = None
            if hc_prompt:
                hc_ctx = f"Product: {first_title}\nDescription: {first_desc}"
                combined_hc = f"{hc_ctx}\n\n{hc_prompt}{language_instruction_body}"

            def _gen_highlight():
                return generate_and_upload_image_with_retry(
                    all_original_paths,
                    highlight_prompt,
                    temp_dir,
                    filename_base="multi_highlight",
                    image_type="highlight_image",
                    aspect_ratio_override=home_page_ratios.get("highlight_image", "1:1"),
                    slot_label="multi highlight_image",
                )

            def _gen_happy():
                if not combined_hc:
                    return None
                return generate_and_upload_image_with_retry(
                    [first_front_path],
                    combined_hc,
                    temp_dir,
                    filename_base="multi_happy_customer",
                    image_type="happy_customer_images",
                    aspect_ratio_override=home_page_ratios.get("star_image", "1:1"),
                    slot_label="multi star_image",
                )

            if page_id and document_store:
                document_store.update_generation_percentage(page_id, 56)

            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor2:
                fut_hl = executor2.submit(_gen_highlight)
                fut_hc = executor2.submit(_gen_happy)

                hl_url = fut_hl.result()
                hc_url = fut_hc.result()

            if hl_url:
                result["home_page"]["highlight_image"] = hl_url
            if hc_url:
                result["home_page"]["star_image"] = hc_url

        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 64)

        result["product_image_subcategories"] = [
            subcats_by_idx.get(i, "general")
            for i in range(1, len(normalized_products) + 1)
        ]

        return result
    finally:
        try:
            cleanup_temp_directory(temp_dir)
        except Exception as e:
            print(f"Error cleaning up temp directory {temp_dir}: {e}")



def _is_play_template(template) -> bool:
    raw = str(template or "").strip().lower()
    if raw.startswith("template_"):
        raw = raw.split("_")[-1]
    return raw == "3" or template == 3


_PLAY_FRAME = {
    "product_image_1": " Frame this as a square 1:1 product photo. Center the product so it fills the frame. No text, logo, or border.",
    "product_image_2": " Frame this as a square 1:1 product photo from another angle. Center the product. No text, logo, or border.",
    "product_image_3": " Frame this as a square 1:1 detail photo. The product fills the frame. No text, logo, or border.",
    "product_image_4": " Frame this as a square 1:1 lifestyle photo of the product in use. Subject centered. No text or border.",
    "product_image_5": " Frame this as a square 1:1 photo. Product centered and large. No text, logo, or border.",
    "product_highlight_1": " Square 1:1 close-up that still looks right cropped into a circle. Product centered. No text.",
    "product_highlight_2": " Square 1:1 close-up, different detail, safe to crop into a circle. No text.",
    "product_highlight_3": " Square 1:1 close-up, different detail, safe to crop into a circle. No text.",
    "product_highlight_4": " Square 1:1 close-up, different detail, safe to crop into a circle. No text.",
    "happy_customer_image_1": " Square 1:1 photo of a child using the product. Face and product centered for a circle crop. No text.",
    "happy_customer_image_2": " Square 1:1 photo, different moment, safe for a circle crop. No text.",
    "happy_customer_image_3": " Square 1:1 photo, different moment, safe for a circle crop. No text.",
    "feature_image": " Wide 4:3 photo. Product in use on the right side of the frame, with space around it. No text.",
    "problem_solving_image": " Portrait 4:5 photo. Product centered on a soft background, full product visible. No text.",
}


_GLOW_FRAME = {
    "product_image_1": " Frame this as a square product photo on a soft cream background. The product fills the frame. No text, logo, or border.",
    "product_image_2": " Frame this as a square product photo from another angle, soft cream background. No text, logo, or border.",
    "product_image_3": " Frame this as a square detail photo. The product fills the frame. No text, logo, or border.",
    "product_image_4": " Frame this as a square lifestyle photo of the product in use. Subject centered. No text or border.",
    "product_image_5": " Frame this as a square product photo. Product centered and large. No text, logo, or border.",
    "product_highlight_1": " Square 1:1 photo of the product in use. Subject centered. No text.",
    "product_highlight_2": " Square 1:1 photo, 998 by 998. Clean white studio background that fills the frame edge to edge. Product in use, centered. No text, no colored panel.",
    "product_highlight_3": " Square 1:1 photo, a different detail of the product in use. No text.",
    "feature_image": " Portrait photo, 1210 by 1540. A pale sage green background is part of the photograph and fills the frame edge to edge. Full product large and centered. No text, no border, no separate backdrop behind the photo.",
    "how_to_image_1": " Square 1:1 close-up of a real adult face, natural skin, soft light. No text. Center the face so it still looks right inside a circle.",
    "how_to_image_2": " Square 1:1 photo of a real adult hand holding this exact product. Clean background. No text. Center it for a circle crop.",
    "how_to_image_3": " Square 1:1 photo of a real adult applying this product to their face. Natural light. No text. Center the face for a circle crop.",
}


_LUMEN_FRAME = {
    "product_image_1": " Frame this as a square product photo on a warm ivory background in soft natural light. The product fills the frame. No text, logo, or border.",
    "product_image_2": " Frame this as a square product photo from another angle, warm ivory background, soft shadow. No text, logo, or border.",
    "product_image_3": " Frame this as a square close-up of the finish and materials, warm soft light. No text, logo, or border.",
    "product_image_4": " Frame this as a square lifestyle photo of the product in a calm, minimal, warm-toned room. No text or border.",
    "product_image_5": " Frame this as a square product photo, centered and large, on a warm sand background. No text, logo, or border.",
    "product_highlight_1": " Portrait 4:5 editorial photo of the product in a calm, warm-toned interior with soft window light. No text.",
    "product_highlight_2": " Portrait 4:5 editorial close-up of a different detail of the product, warm soft light, muted ivory and sand tones. No text.",
    "product_highlight_3": " Portrait 4:5 editorial photo of the product in everyday use in a minimal, warm-toned space. No text.",
    "feature_image": " Tall vertical 9:16 photo, like a phone screen. The product in a calm, warm-toned room with soft natural light, full product visible and centered. No text, no border.",
    "product_impact_image": " Portrait 4:5 moody editorial photo of the product in a warm, softly lit evening interior with gentle shadows. No text.",
}


def _apply_lumen_frame(prompts):
    if not isinstance(prompts, dict):
        return prompts
    framed = {}
    for key, value in prompts.items():
        if isinstance(value, dict):
            framed[key] = _apply_lumen_frame(value)
        elif isinstance(value, str) and key in _LUMEN_FRAME:
            framed[key] = value.rstrip() + _LUMEN_FRAME[key]
        else:
            framed[key] = value
    return framed


def _is_lumenook_template(template) -> bool:
    """Lumenook is template 4 for all categories."""
    raw = str(template or "").strip().lower()
    if raw.startswith("template_"):
        raw = raw.split("_")[-1]
    return raw == "4" or template == 4


def _apply_glow_frame(prompts):
    if not isinstance(prompts, dict):
        return prompts
    framed = {}
    for key, value in prompts.items():
        if isinstance(value, dict):
            framed[key] = _apply_glow_frame(value)
        elif isinstance(value, str) and key in _GLOW_FRAME:
            framed[key] = value.rstrip() + _GLOW_FRAME[key]
        else:
            framed[key] = value
    return framed


def _is_glow_template(template, category=None) -> bool:
    """Aura is template 3 for all categories in v2."""
    return _is_play_template(template)


def _apply_play_frame(prompts):
    if not isinstance(prompts, dict):
        return prompts
    framed = {}
    for key, value in prompts.items():
        if isinstance(value, dict):
            framed[key] = _apply_play_frame(value)
        elif isinstance(value, str) and key in _PLAY_FRAME:
            framed[key] = value.rstrip() + _PLAY_FRAME[key]
        else:
            framed[key] = value
    return framed


def generate_images(
    product_title,
    product_description,
    product_images,
    category=None,
    template=None,
    page_id=None,
    document_store=None,
    language=None,
):
    # Create temporary directory for all operations
    temp_dir = tempfile.mkdtemp()
    result = {"product_images": {}, "body_images": {}}

    try:
        # Convert URLs to local paths
        image_paths = convert_urls_to_paths(product_images, temp_dir)
        # Update percentage to 28% after starting image processing
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 28)

        # Generate base front image using Gemini
        base_images = generate_base_images(image_paths, temp_dir)
        front_path = base_images.get("front")
        base_image_paths = [front_path] if front_path else []

        if not base_image_paths:
            result["base_image_failed"] = True
            return result

        # Update percentage to 36% after base images are generated
        if page_id and document_store:
            document_store.update_generation_percentage(page_id, 36)

        # Step 1: Detect image subcategory using LLM (from all 20 subcategories)
        print("\n" + "=" * 80)
        print("STEP: Detecting image subcategory")
        print("=" * 80)
        image_subcategory = detect_image_subcategory(product_title, product_description)
        # Load template image keys so we only generate selected keys for this (category, template)
        template_image_keys = (
            load_template_image_keys(category or "", template or "")
            if (category and template)
            else None
        )

        # Step 2: Load product image prompts from detected subcategory
        product_prompts = load_image_prompts(image_subcategory, prompt_type="product")
        if product_prompts:
            if template_image_keys and template_image_keys.get("product_images"):
                product_prompts = filter_prompts_by_keys(
                    product_prompts, template_image_keys["product_images"], "product"
                )
            if _is_glow_template(template, category):
                product_prompts = _apply_glow_frame(product_prompts)
            elif _is_lumenook_template(template):
                product_prompts = _apply_lumen_frame(product_prompts)
            if product_prompts.get("product_images"):
                print("Generating product images...")
                product_images_result = generate_product_images(
                    base_image_paths,
                    product_prompts,
                    temp_dir,
                    product_title,
                    product_description,
                    category,
                    page_id,
                    document_store,
                    language=language,
                )
                result["product_images"] = product_images_result
            # Update percentage to 50% after product images are generated
            if page_id and document_store:
                document_store.update_generation_percentage(page_id, 58)
        else:
            print(
                f"Warning: No product image prompts found for subcategory: {image_subcategory}"
            )

        # Step 3: Load body image prompts from detected subcategory
        body_prompts = load_image_prompts(image_subcategory, prompt_type="body")
        if body_prompts:
            if template_image_keys and template_image_keys.get("body_images"):
                body_prompts = filter_prompts_by_keys(
                    body_prompts, template_image_keys["body_images"], "body"
                )
            if _is_glow_template(template, category):
                allowed = (template_image_keys or {}).get("body_images") or []
                how_to = {
                    "how_to_image_1": "Square close-up of a real adult face, natural skin, soft light. No text.",
                    "how_to_image_2": "Square photo of a real adult hand holding this exact product. Clean background. No text.",
                    "how_to_image_3": "Square photo of a real adult applying this product to their face. Natural light. No text.",
                }
                block = body_prompts.get("how_to_images") if isinstance(body_prompts, dict) else None
                if not isinstance(block, dict):
                    block = {}
                for key, prompt in how_to.items():
                    if key in allowed:
                        block.setdefault(key, prompt)
                if block:
                    body_prompts = dict(body_prompts)
                    body_prompts["how_to_images"] = block
                body_prompts = _apply_glow_frame(body_prompts)
            elif _is_lumenook_template(template):
                body_prompts = _apply_lumen_frame(body_prompts)
            if body_prompts:
                print("Generating body images...")
                # Determine body image generation function based on subcategory
                if image_subcategory in HEALTH_BEAUTY_SUBCATEGORIES:
                    body_images_result = generate_health_beauty_body_images(
                        base_image_paths,
                        body_prompts,
                        temp_dir,
                        product_title,
                        product_description,
                        category,
                        page_id,
                        document_store,
                        language=language,
                    )
                else:
                    body_images_result = generate_general_body_images(
                        base_image_paths,
                        body_prompts,
                        temp_dir,
                        product_title,
                        product_description,
                        category,
                        page_id,
                        document_store,
                        language=language,
                    )
                result["body_images"] = body_images_result
        else:
            print(
                f"Warning: No body image prompts found for subcategory: {image_subcategory}"
            )

        result["image_subcategory"] = image_subcategory
        return result

    finally:
        # Clean up temporary directory (downloaded + generated images)
        try:
            print(
                f"Cleaning up temp directory after generation for user page {page_id}: {temp_dir}"
            )
            cleanup_temp_directory(temp_dir)
            print(
                f"Temp directory cleaned up after generation for user page {page_id}: {temp_dir}"
            )
        except Exception as e:
            print(f"Error cleaning up temp directory: {str(e)}")


def _image_generate_config(aspect_ratio: str, image_size: Optional[str] = None, thinking: bool = False):
    image_kwargs = {"aspect_ratio": aspect_ratio}
    if image_size:
        image_kwargs["image_size"] = image_size
    config_kwargs = {
        "response_modalities": ["IMAGE"],
        "image_config": types.ImageConfig(**image_kwargs),
    }
    if thinking:
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_level="MINIMAL")
    return types.GenerateContentConfig(**config_kwargs)


def _try_image_model(model, contents, config, temp_dir, filename_base, label):
    print(f"  Using {model} for {label}")
    try:
        path = _generate_image_with_model(
            model, contents, config, temp_dir, filename_base
        )
    except Exception as e:
        print(f"  {model} failed for {label}: {e}")
        return None
    if not path:
        print(f"  {model} returned no file for {label}")
    return path


def _rescue_product_photo_contents(contents, aspect_ratio: str):
    """Plain product photo used only after the real prompt fails on every model."""
    rescue = (
        "Create one clean ecommerce product photograph of the product in the reference images. "
        f"Aspect ratio {aspect_ratio}. Keep the product's shape, colors, materials, and branding "
        "exactly as shown. No added text, letters, watermark, or collage."
    )
    kept = list(contents[:-1]) if contents else []
    kept.append(
        types.Content(role="user", parts=[types.Part.from_text(text=rescue)])
    )
    return kept


def _openai_size_for_ratio(aspect_ratio: str):
    """Nearest of the three sizes gpt-image models offer, plus the exact ratio to crop to."""
    try:
        w, h = (float(x) for x in str(aspect_ratio).split(":"))
        ratio = w / h
    except (ValueError, ZeroDivisionError):
        ratio = 1.0
    if ratio > 1.2:
        return "1536x1024", ratio
    if ratio < 0.83:
        return "1024x1536", ratio
    return "1024x1024", ratio


def _crop_to_ratio(path: str, ratio: float) -> None:
    """Center-crop an image file to the exact ratio asked for (OpenAI sizes are only 1:1, 3:2, 2:3)."""
    from PIL import Image

    with Image.open(path) as img:
        width, height = img.size
        if abs(width / height - ratio) / ratio < 0.01:
            return
        if width / height > ratio:
            new_w, new_h = round(height * ratio), height
        else:
            new_w, new_h = width, round(width / ratio)
        left, top = (width - new_w) // 2, (height - new_h) // 2
        cropped = img.crop((left, top, left + new_w, top + new_h))
        cropped.save(path, quality=92)


def _reference_for_openai(path: str):
    """Reference photo shrunk to <=1024px JPEG bytes, as a (name, bytes, mime) upload tuple."""
    import io
    from PIL import Image

    with Image.open(path) as img:
        img = img.convert("RGB")
        img.thumbnail((OPENAI_REFERENCE_MAX_SIDE, OPENAI_REFERENCE_MAX_SIDE))
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=85)
    return (f"{os.path.splitext(os.path.basename(path))[0]}.jpg", buf.getvalue(), "image/jpeg")


def _log_openai_image_cost(response, label: str) -> None:
    """Log the tokens one image call used and what they cost at gpt-image-1-mini's token prices
    ($2.50/M image-in, $2.00/M text-in, $8.00/M image-out). OpenAI bills a flat per-image price
    for the output (about $0.005 at low quality, 1024x1024), so treat this as a lower bound."""
    usage = getattr(response, "usage", None)
    if usage is None:
        return
    try:
        details = getattr(usage, "input_tokens_details", None)
        image_in = getattr(details, "image_tokens", 0) or 0
        text_in = getattr(details, "text_tokens", 0) or 0
        out = getattr(usage, "output_tokens", 0) or 0
        cost = image_in * 2.5e-6 + text_in * 2.0e-6 + out * 8.0e-6
        print(
            f"  OpenAI image usage for {label}: image-in={image_in} text-in={text_in} "
            f"out={out} tokens ~${cost:.4f} (token price)"
        )
    except Exception:
        pass


def _generate_image_openai(
    base_image_paths, prompt, temp_dir, filename_base, aspect_ratio, label
):
    """
    One image from OpenAI (gpt-image-1-mini by default). With reference photos it uses the edit
    endpoint so the product stays recognisable; without any it uses plain generation.
    Returns the saved file path, or None on any failure so the caller can fall back to Gemini.
    """
    if openai_client is None:
        return None
    import base64

    size, ratio = _openai_size_for_ratio(aspect_ratio)
    print(f"  Using {OPENAI_IMAGE_MODEL} ({OPENAI_IMAGE_QUALITY}, {size}) for {label}")
    try:
        common = dict(
            model=OPENAI_IMAGE_MODEL,
            prompt=prompt,
            size=size,
            quality=OPENAI_IMAGE_QUALITY,
            n=1,
            output_format="jpeg",
            output_compression=90,
            timeout=OPENAI_IMAGE_TIMEOUT_SECONDS,
        )
        refs = [p for p in base_image_paths if p][:OPENAI_MAX_REFERENCE_IMAGES]
        if refs:
            response = openai_client.images.edit(
                image=[_reference_for_openai(p) for p in refs],
                **{**common, "prompt": f"The attached images are reference photos of the product. {prompt}"},
            )
        else:
            response = openai_client.images.generate(**common)
        _log_openai_image_cost(response, label)
        b64 = response.data[0].b64_json if response.data else None
        if not b64:
            print(f"  {OPENAI_IMAGE_MODEL} returned no image for {label}")
            return None
        name = filename_base or f"{uuid.uuid4().hex[:8]}_zambeel_ai_generated_image"
        file_path = os.path.join(temp_dir, f"{name}.jpg")
        save_binary_file(file_path, base64.b64decode(b64))
        _crop_to_ratio(file_path, ratio)
        return file_path
    except Exception as e:
        print(f"  {OPENAI_IMAGE_MODEL} failed for {label}: {e}")
        return None


def generate_image(
    base_image_paths,
    prompt,
    temp_dir,
    filename_base=None,
    image_type=None,
    is_before_after=False,
    aspect_ratio_override: Optional[str] = None,
    rescue_on_failure: bool = False,
):
    """
    Generate a single image using one or more base images and a specific prompt.

    OpenAI's gpt-image-1-mini is tried first (cheapest); Gemini is the fallback. Within Gemini the
    preferred model goes first, and an empty response or an error switches to the other one
    before this call gives up. On the last outer retry,
    a plain product photograph is tried so the slot is not left empty.

    Returns:
        Path to the generated image file or None if generation failed
    """
    contents = []

    # Normalize to list
    paths = (
        base_image_paths if isinstance(base_image_paths, list) else [base_image_paths]
    )

    # Add base images
    for p in paths:
        if not p:
            continue
        base_img_data, base_img_type = get_img_data_type(p)
        contents.append(
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(
                        mime_type=base_img_type,
                        data=base_img_data,
                    )
                ],
            )
        )

    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text="These are the base product images for reference"
                )
            ],
        ),
    )

    # Add specific prompt
    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)]),
    )

    # Gemini 3 for banners, base, product shots, happy customers, and the
    # homepage creative/highlight slots that were failing on Gemini 2.5.
    is_banner_image = bool(
        (isinstance(image_type, str) and "banner_image" in image_type)
        or (isinstance(filename_base, str) and "banner" in filename_base.lower())
    )
    use_gemini_3 = (
        is_before_after
        or image_type in GEMINI_3_IMAGE_TYPES
        or is_banner_image
        or (filename_base and "base" in str(filename_base).lower())
    )

    label = (
        "before/after"
        if is_before_after
        else (image_type or filename_base or "image")
    )

    # Prefer an explicit override (cinematic mobile hero is 9:16).
    # Otherwise banners default to 16:9 and everything else to 1:1.
    _ratio_override = (
        str(aspect_ratio_override).strip() if aspect_ratio_override else ""
    )
    if _ratio_override:
        aspect_ratio_value = _ratio_override
    elif is_banner_image:
        aspect_ratio_value = "16:9"
    else:
        aspect_ratio_value = "1:1"

    if IMAGE_PROVIDER == "openai":
        path = _generate_image_openai(
            paths, prompt, temp_dir, filename_base, aspect_ratio_value, label
        )
        if path:
            return path
        print(f"  {label}: OpenAI gave no image; falling back to Gemini")

    target_image_size = "4K" if is_banner_image else "1K"
    gemini_3_sized = _image_generate_config(
        aspect_ratio_value, image_size=target_image_size, thinking=True
    )
    gemini_3_plain = _image_generate_config(aspect_ratio_value, thinking=True)
    gemini_25 = _image_generate_config(aspect_ratio_value, thinking=False)

    if use_gemini_3:
        attempts = (
            (GEMINI_IMAGE_MODEL, gemini_3_sized),
            (GEMINI_IMAGE_MODEL, gemini_3_plain),
            (GEMINI_IMAGE_FALLBACK_MODEL, gemini_25),
        )
    else:
        attempts = (
            (GEMINI_IMAGE_FALLBACK_MODEL, gemini_25),
            (GEMINI_IMAGE_MODEL, gemini_3_sized),
            (GEMINI_IMAGE_MODEL, gemini_3_plain),
        )

    for model, config in attempts:
        path = _try_image_model(
            model, contents, config, temp_dir, filename_base, label
        )
        if path:
            return path

    if rescue_on_failure:
        print(f"  {label}: both models returned no image; using a plain product photo")
        return _try_image_model(
            GEMINI_IMAGE_MODEL,
            _rescue_product_photo_contents(contents, aspect_ratio_value),
            gemini_3_plain,
            temp_dir,
            filename_base,
            f"{label} rescue",
        )
    return None


def _generate_image_with_model(
    model, contents, generate_content_config, temp_dir, filename_base=None
):
    """
    Internal helper function to generate an image with a specific model.

    Args:
        model: Model name to use
        contents: Content for image generation
        generate_content_config: Configuration for image generation
        temp_dir: Temporary directory to save the generated image
        filename_base: Optional base name for the file

    Returns:
        Path to the generated image file or None if generation failed

    Raises:
        Exception: If image generation fails
    """
    finish_reasons = []
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        candidates = chunk.candidates or []
        if not candidates:
            continue

        for candidate in candidates:
            finish = getattr(candidate, "finish_reason", None)
            if finish:
                finish_reasons.append(str(finish))
            candidate_content = getattr(candidate, "content", None)
            parts = getattr(candidate_content, "parts", None) or []
            for part in parts:
                inline_data = getattr(part, "inline_data", None)
                if inline_data and inline_data.data:
                    data_buffer = inline_data.data
                    file_extension = (
                        mimetypes.guess_extension(inline_data.mime_type) or ".bin"
                    )

                    # Use provided filename_base or generate unique one
                    if filename_base:
                        file_path = os.path.join(
                            temp_dir, f"{filename_base}{file_extension}"
                        )
                    else:
                        file_name_base = (
                            f"{uuid.uuid4().hex[:8]}_zambeel_ai_generated_image"
                        )
                        file_path = os.path.join(
                            temp_dir, f"{file_name_base}{file_extension}"
                        )

                    save_binary_file(file_path, data_buffer)
                    return file_path

        if chunk.text:
            print(chunk.text, end="", flush=True)

    reason = ", ".join(finish_reasons) if finish_reasons else "no candidates"
    print(f"No image generated for this prompt ({reason}).")
    return None


def generate_image_with_retry(
    base_image_paths,
    prompt,
    temp_dir,
    filename_base=None,
    image_type=None,
    is_before_after=False,
    aspect_ratio_override: Optional[str] = None,
    slot_label: Optional[str] = None,
) -> Optional[str]:
    """
    Outer retry wrapper for a single generate_image call.
    Matches IMAGE_GENERATION_RETRY_ATTEMPTS used by generate_images_concurrent / base retry.
    """
    label = slot_label or filename_base or image_type or "image"
    max_attempts = max(1, IMAGE_GENERATION_RETRY_ATTEMPTS)
    for attempt in range(1, max_attempts + 1):
        try:
            out_path = generate_image(
                base_image_paths,
                prompt,
                temp_dir,
                filename_base=filename_base,
                image_type=image_type,
                is_before_after=is_before_after,
                aspect_ratio_override=aspect_ratio_override,
                rescue_on_failure=attempt == max_attempts,
            )
            if out_path:
                return out_path
            print(f"{label} returned no file, attempt {attempt}/{max_attempts}")
        except Exception as e:
            print(f"{label} generation error, attempt {attempt}/{max_attempts}: {e}")
        if attempt < max_attempts:
            time.sleep(IMAGE_RETRY_BACKOFF_SECONDS * attempt)
    print(f"{label} failed after {max_attempts} attempts; slot will be missing.")
    return None


def generate_and_upload_image_with_retry(
    base_image_paths,
    prompt,
    temp_dir,
    filename_base=None,
    image_type=None,
    is_before_after=False,
    aspect_ratio_override: Optional[str] = None,
    slot_label: Optional[str] = None,
) -> Optional[str]:
    """
    Generate + S3 upload with the same outer retry loop as generate_images_concurrent.
    Returns the uploaded URL, or None if all attempts fail.
    """
    label = slot_label or filename_base or image_type or "image"
    max_attempts = max(1, IMAGE_GENERATION_RETRY_ATTEMPTS)
    for attempt in range(1, max_attempts + 1):
        try:
            generated_image_path = generate_image(
                base_image_paths,
                prompt,
                temp_dir,
                filename_base=filename_base,
                image_type=image_type,
                is_before_after=is_before_after,
                aspect_ratio_override=aspect_ratio_override,
                rescue_on_failure=attempt == max_attempts,
            )
            if generated_image_path:
                urls = upload_images_to_cdn([generated_image_path])
                if urls and urls[0]:
                    return urls[0]
                print(
                    f"Upload returned empty URL for {label}, attempt {attempt}/{max_attempts}"
                )
            else:
                print(f"{label} returned no file, attempt {attempt}/{max_attempts}")
        except Exception as e:
            print(
                f"Error generating/uploading {label}, attempt {attempt}/{max_attempts}: {e}"
            )
        if attempt < max_attempts:
            time.sleep(IMAGE_RETRY_BACKOFF_SECONDS * attempt)
    print(f"{label} failed after {max_attempts} attempts; slot will be missing.")
    return None


def generate_base_images(image_paths, temp_dir):
    """
    Generate a single base front image.
    Returns local file paths dict with a 'front' key.
    Uses gemini-3.1-flash-image-preview with 1K image size for base images.
    """
    labels_and_prompts = [
        ("front", BASE_IMAGE_PROMPT_FRONT, "base_front"),
    ]

    results = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        def _generate_base_with_retry(prompt_text, filename_base):
            max_attempts = max(1, IMAGE_GENERATION_RETRY_ATTEMPTS)
            for attempt in range(1, max_attempts + 1):
                try:
                    out_path = generate_image(
                        image_paths,
                        prompt_text,
                        temp_dir,
                        filename_base,
                        image_type="base_image",
                        rescue_on_failure=attempt == max_attempts,
                    )
                    if out_path:
                        return out_path
                    print(
                        f"Base image returned no file, attempt {attempt}/{max_attempts}"
                    )
                except Exception as e:
                    print(
                        f"Base image generation error, attempt {attempt}/{max_attempts}: {e}"
                    )
                if attempt < max_attempts:
                    time.sleep(IMAGE_RETRY_BACKOFF_SECONDS * attempt)
            return None

        future_to_label = {
            executor.submit(
                _generate_base_with_retry,
                prompt_text,
                filename_base,
            ): label
            for (label, prompt_text, filename_base) in labels_and_prompts
        }

        for future in concurrent.futures.as_completed(future_to_label):
            label = future_to_label[future]
            try:
                path = future.result()
                if path:
                    results[label] = path
            except Exception as e:
                print(f"Base image generation failed for {label}: {e}")

    return results


def generate_images_concurrent(
    base_image_paths,
    image_prompts,
    temp_dir,
    max_workers=None,
    image_types=None,
    aspect_ratios: Optional[List[Optional[str]]] = None,
):
    """Generate multiple images concurrently using ThreadPoolExecutor."""
    if not image_prompts:
        return []

    if max_workers is None:
        max_workers = DEFAULT_MAX_WORKERS

    # Limit max_workers to the number of prompts to avoid unnecessary threads
    max_workers = min(max_workers, len(image_prompts))

    print(
        f"Generating {len(image_prompts)} images concurrently with {max_workers} workers..."
    )

    start_time = time.time()

    # Use ThreadPoolExecutor for concurrent image generation
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Worker to generate a single image and upload to S3
        def _generate_and_upload(prompt, index):
            # Get image type for this specific image if provided
            image_type = (
                image_types[index] if image_types and index < len(image_types) else None
            )
            aspect_ratio_override = None
            if aspect_ratios and index < len(aspect_ratios):
                aspect_ratio_override = aspect_ratios[index]

            max_attempts = max(1, IMAGE_GENERATION_RETRY_ATTEMPTS)
            for attempt in range(1, max_attempts + 1):
                try:
                    generated_image_path = generate_image(
                        base_image_paths,
                        prompt,
                        temp_dir,
                        image_type=image_type,
                        aspect_ratio_override=aspect_ratio_override,
                        rescue_on_failure=attempt == max_attempts,
                    )
                    if generated_image_path:
                        urls = upload_images_to_cdn([generated_image_path])
                        if urls and urls[0]:
                            return urls[0]
                        print(
                            f"Upload returned empty URL for image {index+1}, attempt {attempt}/{max_attempts}"
                        )
                    else:
                        print(
                            f"Image generation returned no file for image {index+1}, attempt {attempt}/{max_attempts}"
                        )
                except Exception as e:
                    print(
                        f"Error generating/uploading image {index+1}, attempt {attempt}/{max_attempts}: {e}"
                    )

                if attempt < max_attempts:
                    # Small backoff reduces synchronized retries during provider hiccups.
                    time.sleep(IMAGE_RETRY_BACKOFF_SECONDS * attempt)

            print(
                f"Image {index+1} failed after {max_attempts} attempts; slot will be missing."
            )
            return None

        # Submit all image generation tasks
        future_to_index = {
            executor.submit(_generate_and_upload, prompt, i): i
            for i, prompt in enumerate(image_prompts)
        }

        # Collect results as they complete
        generated_urls = [None] * len(image_prompts)
        completed_count = 0

        for future in concurrent.futures.as_completed(future_to_index):
            index = future_to_index[future]
            try:
                url = future.result()
                generated_urls[index] = url
                completed_count += 1
            except Exception as e:
                print(f"Image {index+1} failed: {e}")
                generated_urls[index] = None
                completed_count += 1

    end_time = time.time()
    duration = end_time - start_time
    failed_count = sum(1 for url in generated_urls if not url)
    if failed_count:
        print(
            f"Completed image batch with {failed_count}/{len(generated_urls)} non-base image failures after retries; continuing."
        )

    return generated_urls


def generate_product_images(
    base_image_paths,
    custom_prompts,
    temp_dir,
    product_title,
    product_description,
    category="",
    page_id=None,
    document_store=None,
    language=None,
    aspect_ratio_overrides: Optional[Dict[str, str]] = None,
):
    """
    Generate product images only.
    Returns a flat dictionary mapping product image keys to URLs.
    """
    print("Generating product images...")

    # Extract product_images from prompts
    product_images_prompts = custom_prompts.get("product_images", {})
    if not product_images_prompts:
        print("No product images prompts found")
        return {}

    # Build product context
    product_context = f"Product: {product_title}\nDescription: {product_description}"
    language_instruction = (
        f"\n\nMake sure that All overlay text added must be in {language.strip()}. The scene should be appropriate for a {language.strip()}-speaking audience."
        if (language and language.strip())
        else ""
    )

    # Prepare prompts and paths
    image_prompts = []
    image_paths = []
    image_types = []
    image_aspect_ratios: List[Optional[str]] = []

    for key, prompt in product_images_prompts.items():
        combined_prompt = f"{product_context}\n\n{prompt}{language_instruction}\n\n{PRODUCT_FIDELITY_PROMPT}"
        image_prompts.append(combined_prompt)
        image_paths.append(["product_images", key])
        image_types.append("product_images")  # Pass image_type to use Gemini 3
        image_aspect_ratios.append(
            aspect_ratio_overrides.get(key) if aspect_ratio_overrides else None
        )

    # Generate images concurrently
    generated_urls = generate_images_concurrent(
        base_image_paths,
        image_prompts,
        temp_dir,
        image_types=image_types,
        aspect_ratios=image_aspect_ratios,
    )
    if page_id and document_store:
        document_store.update_generation_percentage(page_id, 45)

    # Create dictionary mapping keys to URLs
    result = create_image_url_dict(generated_urls, image_paths)

    print(
        f"Product image generation completed. Generated {len(generated_urls)} images."
    )
    return result


def generate_health_beauty_body_images(
    base_image_paths,
    custom_prompts,
    temp_dir,
    product_title,
    product_description,
    category="health_beauty",
    page_id=None,
    document_store=None,
    language=None,
    aspect_ratio_overrides: Optional[Dict[str, str]] = None,
):
    """
    Generate body images for health & beauty category.
    Generates before image first, then uses it as reference to generate after image.
    Returns a flat dictionary mapping image keys to URLs.
    """
    print("Generating health & beauty body images...")
    result = {}

    # Build simple product context
    product_context = f"Product: {product_title}\nDescription: {product_description}"
    language_instruction = (
        f"\n\nAll text visible in the image (signs, labels, captions, overlays) must be in {language.strip()}. The scene should be appropriate for a {language.strip()}-speaking audience."
        if (language and language.strip())
        else ""
    )

    generated_urls = []
    image_paths_list = []

    # Step 1: Generate before image directly from base images
    before_after_images = custom_prompts.get("before_after_images", {})
    before_prompt = before_after_images.get("before_use_image", "")

    if before_prompt:
        combined_before_prompt = f"{product_context}\n\n{before_prompt}"

        print("Step 1: Generating before image...")
        before_path = generate_image_with_retry(
            base_image_paths,
            combined_before_prompt,
            temp_dir,
            filename_base="before_use",
            is_before_after=True,
            slot_label="before_use_image",
        )

        if before_path:
            urls = upload_images_to_cdn([before_path])
            before_url = urls[0] if urls else None
        else:
            before_url = None

        if before_url:
            generated_urls.append(before_url)
            image_paths_list.append(["before_after_images", "before_use_image"])
            print(f"Before image generated: {before_url}")

            # Step 2: Generate after image using before image as reference
            after_prompt = before_after_images.get("after_use_image", "")
            if after_prompt:
                combined_after_prompt = f"{product_context}\n\n{after_prompt}"

                print(
                    "Step 2: Generating after image using before image as reference..."
                )
                after_path = generate_image_with_retry(
                    before_path,
                    combined_after_prompt,
                    temp_dir,
                    filename_base="after_use",
                    is_before_after=True,
                    slot_label="after_use_image",
                )
                if after_path:
                    urls = upload_images_to_cdn([after_path])
                    after_url = urls[0] if urls else None
                else:
                    after_url = None

                if after_url:
                    generated_urls.append(after_url)
                    image_paths_list.append(["before_after_images", "after_use_image"])
                    print(f"After image generated: {after_url}")

    # Step 3: Generate all other body images (non before/after) using regular approach
    product_context = f"Product: {product_title}\nDescription: {product_description}"

    other_image_prompts = []
    other_image_paths = []
    other_image_types = []
    other_image_aspect_ratios: List[Optional[str]] = []

    # Iterate through all sections except before_after_images
    for section_key, section_value in custom_prompts.items():
        if section_key in ["before_after_images", "logo_slider_images"]:
            continue

        # Check if this is a proven_results section
        is_proven_results = section_key == "proven_results_images"

        if isinstance(section_value, dict):
            # Nested structure like happy_customer_images: { "happy_customer_image_1": "...", ... }
            for image_key, prompt in section_value.items():
                if isinstance(prompt, str) and prompt.strip():
                    combined_prompt = (
                        f"{product_context}\n\n{prompt}{language_instruction}"
                    )
                    other_image_prompts.append(combined_prompt)
                    other_image_paths.append([section_key, image_key])
                    other_image_aspect_ratios.append(
                        aspect_ratio_overrides.get(image_key)
                        if aspect_ratio_overrides
                        else None
                    )
                    # Pass section_key as image_type to identify happy_customer_images, product_images, etc.
                    other_image_types.append(
                        "proven_results" if is_proven_results else section_key
                    )
        elif isinstance(section_value, str) and section_value.strip():
            # Flat structure like solve_problem_image: "..."
            combined_prompt = (
                f"{product_context}\n\n{section_value}{language_instruction}"
            )
            other_image_prompts.append(combined_prompt)
            other_image_paths.append([section_key])
            other_image_aspect_ratios.append(
                aspect_ratio_overrides.get(section_key)
                if aspect_ratio_overrides
                else None
            )
            # Pass section_key as image_type to identify image types
            other_image_types.append(
                "proven_results" if is_proven_results else section_key
            )

    if page_id and document_store:
        document_store.update_generation_percentage(page_id, 72)
    if other_image_prompts:
        print("Step 3: Generating other body images...")
        other_generated_urls = generate_images_concurrent(
            base_image_paths,
            other_image_prompts,
            temp_dir,
            image_types=other_image_types,
            aspect_ratios=other_image_aspect_ratios,
        )

        generated_urls.extend(other_generated_urls)
        image_paths_list.extend(other_image_paths)

    # Create flat dictionary from URLs and paths
    result = create_image_url_dict(generated_urls, image_paths_list)

    print(
        f"Health & beauty body image generation completed. Generated {len(generated_urls)} images."
    )
    return result


def generate_general_body_images(
    base_image_paths,
    custom_prompts,
    temp_dir,
    product_title,
    product_description,
    category="",
    page_id=None,
    document_store=None,
    language=None,
    aspect_ratio_overrides: Optional[Dict[str, str]] = None,
):
    """
    Generate body images for general category.
    Returns a flat dictionary mapping image keys to URLs.
    """
    print("Generating general body images...")

    product_context = f"Product: {product_title}\nDescription: {product_description}"
    language_instruction = (
        f"\n\nAll text visible in the image (signs, labels, captions, overlays) must be in {language.strip()}. The scene should be appropriate for a {language.strip()}-speaking audience."
        if (language and language.strip())
        else ""
    )

    image_prompts = []
    image_paths_list = []
    image_types = []
    image_aspect_ratios: List[Optional[str]] = []

    # Iterate through all sections
    for section_key, section_value in custom_prompts.items():
        # Check if this is a proven_results section
        is_proven_results = section_key == "proven_results_images"

        if isinstance(section_value, dict):
            # Nested structure like happy_customer_images: { "happy_customer_image_1": "...", ... }
            for image_key, prompt in section_value.items():
                if isinstance(prompt, str) and prompt.strip():
                    combined_prompt = (
                        f"{product_context}\n\n{prompt}{language_instruction}"
                    )
                    image_prompts.append(combined_prompt)
                    image_paths_list.append([section_key, image_key])
                    image_aspect_ratios.append(
                        aspect_ratio_overrides.get(image_key)
                        if aspect_ratio_overrides
                        else None
                    )
                    # Pass section_key as image_type to identify happy_customer_images, product_images, etc.
                    image_types.append(
                        "proven_results" if is_proven_results else section_key
                    )
        elif isinstance(section_value, str) and section_value.strip():
            # Flat structure like solve_problem_image_1: "..."
            combined_prompt = (
                f"{product_context}\n\n{section_value}{language_instruction}"
            )
            image_prompts.append(combined_prompt)
            image_paths_list.append([section_key])
            image_aspect_ratios.append(
                aspect_ratio_overrides.get(section_key)
                if aspect_ratio_overrides
                else None
            )
            # Pass section_key as image_type to identify image types
            image_types.append("proven_results" if is_proven_results else section_key)

    if page_id and document_store:
        document_store.update_generation_percentage(page_id, 72)
    generated_urls = generate_images_concurrent(
        base_image_paths,
        image_prompts,
        temp_dir,
        image_types=image_types,
        aspect_ratios=image_aspect_ratios,
    )
    result = create_image_url_dict(generated_urls, image_paths_list)
    return result


def create_image_url_dict(urls, image_paths):
    """
    Create a flat dictionary mapping image keys to URLs.

    Args:
        urls: List of image URLs
        image_paths: List of paths (e.g., ["product_images", "product_image_1"])

    Returns:
        Dictionary with keys like "product_image_1" -> URL
    """
    result = {}

    if not urls or not image_paths:
        return result

    for i, url in enumerate(urls):
        if i < len(image_paths) and url is not None:
            path = image_paths[i]
            # Convert path to a simple key (use the last element, or join with underscore)
            if len(path) > 0:
                # Use the last element as the key (e.g., "product_image_1")
                key = path[-1]
                result[key] = url

    return result
