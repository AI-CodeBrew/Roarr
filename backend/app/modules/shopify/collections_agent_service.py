import logging
import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

from ...clients.openai_client import client as openai_client
from .shopify_utils import shopify_utils


def _strip_html(text: Any) -> str:
    if text is None:
        return ""
    s = str(text)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def generate_reused_collection_description(
    *,
    collection_title: str,
    product_bullets: str,
    language: Optional[str] = None,
) -> str:
    """
    Plain-text collection description for Shopify, from title + product lines.
    """
    lang = (language or "").strip()
    lang_line = (
        f"Write entirely in {lang}."
        if lang
        else (
            "Use the same language as the collection title and product lines when it is clear; "
            "otherwise use English."
        )
    )
    user_content = (
        f"Collection title: {collection_title}\n\n"
        f"Products in this collection (reference only):\n{product_bullets}\n\n"
        f"{lang_line}\n\n"
        "Write ONE short paragraph (at most 4 sentences), plain text only, for a Shopify collection description. "
        "No HTML, no markdown, no bullet characters, no leading label like 'Description:'. "
        "Merchant-facing copy that explains what ties these products together; use only information implied by the "
        "titles and notes above. Do not invent products, discounts, or claims.\n"
    )
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write concise e-commerce collection descriptions. "
                        "Output plain text only, nothing else."
                    ),
                },
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
            max_tokens=350,
        )
        text = (response.choices[0].message.content or "").strip()
        text = text.strip('"').strip("'").strip()
        return text[:8000]
    except Exception as e:
        logger.warning(f"generate_reused_collection_description failed: {e}")
        return ""


def sync_reused_collection_descriptions_to_shopify(
    *,
    user_id: str,
    selected_collections: List[Dict[str, Any]],
    product_by_id: Dict[str, Dict[str, Any]],
    language: Optional[str] = None,
) -> None:
    """
    For collections with source=reused_existing: generate description from title +
    current catalog products, then PUT to Shopify (custom_collection, else smart_collection).
    Mutates each col dict to set ``description`` to the plain text when the update succeeds.
    """
    if not user_id:
        return
    for col in selected_collections or []:
        if col.get("source") != "reused_existing":
            continue
        cid = col.get("collection_id")
        if not cid:
            continue
        title = _strip_html(col.get("name")) or "Collection"
        pids = col.get("product_ids") or []
        lines: List[str] = []
        for pid in pids[:50]:
            p = product_by_id.get(str(pid))
            if not p:
                continue
            pt = _strip_html(p.get("title"))
            if not pt:
                continue
            snippet = _strip_html(p.get("body_html") or p.get("description") or "")
            if len(snippet) > 280:
                snippet = snippet[:280].rsplit(" ", 1)[0] + "…"
            lines.append(f"- {pt}" + (f": {snippet}" if snippet else ""))
        if not lines:
            logger.info(
                "Skipping reused collection description (no resolvable product lines) "
                f"for '{title}' id={cid}"
            )
            continue
        bullets = "\n".join(lines)
        desc = generate_reused_collection_description(
            collection_title=title,
            product_bullets=bullets,
            language=language,
        )
        if not desc.strip():
            continue
        upd = shopify_utils.update_collection_description_plain(
            collection_id=str(cid),
            plain_text=desc.strip(),
            user_id=user_id,
        )
        if upd.get("success"):
            col["description"] = desc.strip()
            logger.info(
                f"Updated Shopify description for reused collection '{title}' ({cid})"
            )
        else:
            logger.warning(
                f"Failed Shopify description update for reused collection '{title}' ({cid}): "
                f"{upd.get('error')}"
            )


def _parse_iso(value: Any) -> Optional[datetime]:
    s = str(value or "").strip()
    if not s:
        return None
    try:
        s = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _product_image_src(p: Dict[str, Any]) -> Optional[str]:
    """
    Shopify REST sometimes returns `image` as {src: "..."} and sometimes as a string.
    """
    img = p.get("image")
    if isinstance(img, dict):
        return img.get("src")
    if isinstance(img, str):
        return img.strip() or None
    return None


def _safe_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        if isinstance(value, str):
            v = value.strip()
            if not v:
                return None
            return int(v)
        return int(value)
    except Exception:
        return None


def run_collections_agent(
    products_raw: List[Dict[str, Any]],
    collections_raw: List[Dict[str, Any]],
    user_id: Optional[str] = None,
    target_cards: int = 3,
) -> Dict[str, Any]:
    """
    If user already has >= 3 collections:
      - pick top 3 by product_count then recency among collections with at least 2 products.
    If user has < 3 collections:
      - reuse only existing collections that have at least 2 products; create new ones for the rest.
    Collections with 0 or 1 product are never reused — a new collection is created instead (requires user_id).
    """

    collections = collections_raw or []
    existing_count = len(collections)

    now = datetime.now(timezone.utc)

    scored: List[Dict[str, Any]] = []
    for c in collections:
        title = _strip_html(c.get("title")) or "Collection"
        desc = _strip_html(c.get("description") or c.get("body_html") or "")
        image = c.get("image")
        if isinstance(image, dict):
            image = image.get("src") or None
        elif isinstance(image, str):
            image = image.strip() or None
        else:
            image = None

        products = c.get("products") or []
        product_count = len(products)

        coll_dt = _parse_iso(c.get("updated_at"))
        if coll_dt is None:
            # fall back to most recently updated product in the collection
            product_dts = [_parse_iso(p.get("updated_at")) for p in products if p.get("updated_at")]
            product_dts = [d for d in product_dts if d]
            coll_dt = max(product_dts) if product_dts else None

        days_old = 99999
        if coll_dt is not None:
            days_old = max((now - coll_dt).days, 0)

        # Recency score in [0, 1]
        if days_old <= 14:
            recency_score = 1.0
        elif days_old <= 45:
            recency_score = 0.85
        elif days_old <= 90:
            recency_score = 0.7
        elif days_old <= 180:
            recency_score = 0.5
        else:
            recency_score = 0.3

        # Confidence biased toward size + freshness
        product_norm = min(product_count, 20) / 20.0
        confidence = round(max(0.2, min(0.98, 0.4 + product_norm * 0.45 + recency_score * 0.15)), 2)

        # Product samples for frontend tiles
        samples = []
        for p in products[:3]:
            samples.append(
                {
                    "id": p.get("id"),
                    "title": _strip_html(p.get("title")),
                    "image": _product_image_src(p) or (p.get("images")[0].get("src") if isinstance(p.get("images"), list) and p.get("images") else None),
                    "product_type": _strip_html(p.get("product_type")),
                    "vendor": _strip_html(p.get("vendor")),
                }
            )

        scored.append(
            {
                "collection": c,
                "title": title,
                "description": desc,
                "image": image,
                "products": products,
                "product_count": product_count,
                "recency_score": recency_score,
                "confidence": confidence,
                "reasoning": (
                    "Selected because it’s one of the user’s top collections by product count, "
                    "with higher recency among the remaining options."
                ),
                "samples": samples,
            }
        )

    scored.sort(
        key=lambda x: (x["product_count"], x["recency_score"]),
        reverse=True,
    )

    usable_scored = [x for x in scored if x["product_count"] >= 2]
    thin_scored = [x for x in scored if x["product_count"] < 2]

    intentionally_skipped: List[Dict[str, Any]] = []
    for x in thin_scored:
        raw = x.get("collection") or {}
        intentionally_skipped.append(
            {
                "collection_id": str(raw.get("id") or "") or None,
                "handle": (str(raw.get("handle")).strip() if raw.get("handle") else None),
                "name": x["title"],
                "reason": "skipped_under_2_products",
                "product_count": x["product_count"],
            }
        )

    if existing_count >= 3:
        reuse_list = usable_scored[:target_cards]
    else:
        reuse_list = usable_scored[: min(len(usable_scored), target_cards)]

    missing_to_create = max(0, target_cards - len(reuse_list))

    if missing_to_create > 0 and not user_id:
        return {
            "selected_collections": [],
            "intentionally_skipped": intentionally_skipped,
            "meta": {
                "existing_collection_count": existing_count,
                "usable_collection_count": len(usable_scored),
                "thin_collections_skipped": len(thin_scored),
                "target_cards": target_cards,
                "error_code": "MISSING_USER_ID_FOR_COLLECTION_CREATION",
                "error_message": (
                    "Need user_id to create new collections when existing store collections "
                    "have fewer than 2 products or there are not enough usable collections."
                ),
            },
        }

    if missing_to_create == 0:
        selected_collections: List[Dict[str, Any]] = []
        for item in reuse_list:
            raw = item.get("collection") or {}
            ch = raw.get("handle")
            handle_str = str(ch).strip() if ch else None
            selected_collections.append(
                {
                    "source": "reused_existing",
                    "collection_id": str(item["collection"].get("id") or "") or None,
                    "handle": handle_str or None,
                    "name": item["title"],
                    "description": item["description"],
                    "product_count": item["product_count"],
                    "product_ids": [p.get("id") for p in item["products"] if p.get("id")],
                    "product_samples": item["samples"],
                    "confidence": item["confidence"],
                    "reasoning": item["reasoning"],
                    "curation_needed": False,
                    "backfilled_from_ids": [],
                    "skipped_candidates": [],
                }
            )
        return {
            "selected_collections": selected_collections,
            "intentionally_skipped": intentionally_skipped,
            "meta": {
                "existing_collection_count": existing_count,
                "usable_collection_count": len(usable_scored),
                "thin_collections_skipped": len(thin_scored),
                "target_cards": target_cards,
                "picked_by": "product_count_then_recency",
            },
        }

    # Reuse usable collections (if any) and create the rest.
    existing_selected = reuse_list
    # Map for product_samples lookup (created collections provide product_ids only)
    product_by_id: Dict[str, Dict[str, Any]] = {}
    for p in products_raw or []:
        pid = p.get("id")
        if pid is not None:
            product_by_id[str(pid)] = p

    def _build_samples_from_product_ids(product_ids: List[Any], limit: int = 3) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for pid in product_ids[:limit]:
            key = str(pid)
            prod = product_by_id.get(key)
            if not prod:
                continue
            out.append(
                {
                    "id": prod.get("id"),
                    "title": _strip_html(prod.get("title")),
                    "image": _product_image_src(prod) or (prod.get("images")[0].get("src") if isinstance(prod.get("images"), list) and prod.get("images") else None),
                    "product_type": _strip_html(prod.get("product_type")),
                    "vendor": _strip_html(prod.get("vendor")),
                }
            )
        return out

    created_resp = create_collections_from_products(
        user_id=str(user_id),
        products_raw=products_raw,
        how_many=missing_to_create,
    )
    if not created_resp.get("success"):
        return {
            "selected_collections": [],
            "intentionally_skipped": intentionally_skipped,
            "meta": {
                "existing_collection_count": existing_count,
                "usable_collection_count": len(usable_scored),
                "thin_collections_skipped": len(thin_scored),
                "target_cards": target_cards,
                "error_code": created_resp.get("error_code") or "COLLECTION_CREATE_FAILED",
                "error_message": created_resp.get("error_message") or "Collection creation failed.",
            },
        }

    created_collections = created_resp.get("created_collections") or []
    if len(created_collections) < missing_to_create:
        return {
            "selected_collections": [],
            "intentionally_skipped": intentionally_skipped,
            "meta": {
                "existing_collection_count": existing_count,
                "usable_collection_count": len(usable_scored),
                "thin_collections_skipped": len(thin_scored),
                "target_cards": target_cards,
                "error_code": "NOT_ENOUGH_COLLECTIONS_CREATED",
                "error_message": "LLM creation did not return enough collections.",
            },
        }

    selected_collections: List[Dict[str, Any]] = []
    # 1) existing ones
    for item in existing_selected:
        raw = item.get("collection") or {}
        ch = raw.get("handle")
        handle_str = str(ch).strip() if ch else None
        selected_collections.append(
            {
                "source": "reused_existing",
                "collection_id": str(item["collection"].get("id") or "") or None,
                "handle": handle_str or None,
                "name": item["title"],
                "description": item["description"],
                "product_count": item["product_count"],
                "product_ids": [p.get("id") for p in item["products"] if p.get("id")],
                "product_samples": item["samples"],
                "confidence": item["confidence"],
                "reasoning": item["reasoning"],
                "curation_needed": False,
                "backfilled_from_ids": [],
                "skipped_candidates": [],
            }
        )

    # 2) created ones
    for cc in created_collections[:missing_to_create]:
        product_ids = cc.get("product_ids") or []
        h = cc.get("handle")
        handle_str = str(h).strip() if h else None
        selected_collections.append(
            {
                "source": "newly_formed",
                "collection_id": cc.get("collection_id"),
                "handle": handle_str or None,
                "name": cc.get("title") or "Collection",
                "description": cc.get("description") or "",
                "product_count": len(product_ids),
                "product_ids": [str(pid) for pid in product_ids if pid is not None],
                "product_samples": _build_samples_from_product_ids(product_ids, limit=3),
                "confidence": 0.6,
                "reasoning": "Created using LLM grouping from product titles + descriptions.",
                "curation_needed": False,
                "backfilled_from_ids": [],
                "skipped_candidates": [],
            }
        )

    # Final guard: always return exactly 3.
    selected_collections = selected_collections[:3]
    while len(selected_collections) < 3:
        selected_collections.append(
            {
                "source": "placeholder",
                "collection_id": None,
                "handle": None,
                "name": "Curation Needed",
                "description": "Not enough collections could be finalized automatically.",
                "product_count": 0,
                "product_ids": [],
                "product_samples": [],
                "confidence": 0.2,
                "reasoning": "Added to satisfy 3 managed slots.",
                "curation_needed": True,
                "backfilled_from_ids": [],
                "skipped_candidates": [],
            }
        )

    return {
        "selected_collections": selected_collections,
        "intentionally_skipped": intentionally_skipped,
        "meta": {
            "existing_collection_count": existing_count,
            "usable_collection_count": len(usable_scored),
            "thin_collections_skipped": len(thin_scored),
            "created_collection_count": missing_to_create,
            "target_cards": target_cards,
            "picked_by": "existing_then_llm_creation",
        },
    }


def create_collections_from_products(
    *,
    user_id: str,
    products_raw: List[Dict[str, Any]],
    how_many: int,
) -> Dict[str, Any]:
    """
    Create up to 3 Shopify custom collections using LLM output.

    - Uses titles + descriptions from the first 50 products.
    - LLM must return: title, description, and product_indices (0..49).
    - Then we create each custom collection with `collects` pointing to product IDs.
    """
    if not user_id:
        return {
            "success": False,
            "error_code": "MISSING_USER_ID",
            "error_message": "user_id is required.",
        }

    requested = max(1, int(how_many or 1))
    count_to_make = min(requested, 3)

    products = (products_raw or [])[:50]
    if len(products) < 2:
        return {
            "success": False,
            "error_code": "INSUFFICIENT_PRODUCTS",
            "error_message": "Need at least 2 products to create collections.",
        }

    indexed_products = []
    for idx, p in enumerate(products):
        indexed_products.append(
            {
                "index": idx,
                "title": _strip_html(p.get("title")),
                "description": _strip_html(p.get("description") or p.get("body_html")),
            }
        )

    prompt_products_json = json.dumps(indexed_products)

    system_prompt = (
        "You are a Shopify merchandising assistant. Create custom collection recommendations "
        "for an online store. Use ONLY the provided product titles and descriptions to infer "
        "collection themes and product groupings. Do not invent products or attributes. "
        "Treat each listed product as fixed—do not change its identity, attributes, or "
        "implied appearance; only assign it to collections.\n\n"
        f"Create exactly {count_to_make} collections."
    )

    user_prompt = (
        "Products (index refers to this list):\n"
        f"{prompt_products_json}\n\n"
        "Return JSON with this schema:\n"
        "{\n"
        "  \"collections\": [\n"
        "    {\n"
        "      \"title\": string, \n"
        "      \"description\": string, \n"
        "      \"product_indices\": [int]\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        f"Rules:\n"
        f"- Each collection must include at least 2 product_indices if possible.\n"
        f"- product_indices must only use integers from 0..{len(products)-1}.\n"
        f"- Keep description to 1 sentence.\n"
        f"- Avoid generic titles like \"New Collection\". Prefer merchant-friendly specific names.\n"
    )

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "collections_create",
                "schema": {
                    "type": "object",
                    "properties": {
                        "collections": {
                            "type": "array",
                            "minItems": count_to_make,
                            "maxItems": count_to_make,
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "product_indices": {
                                        "type": "array",
                                        "items": {"type": "integer"},
                                    },
                                },
                                "required": ["title", "description", "product_indices"],
                                "additionalProperties": False,
                            },
                        }
                    },
                    "required": ["collections"],
                    "additionalProperties": False,
                },
            },
        },
    )

    choice = response.choices[0].message
    parsed = (
        choice.parsed
        if hasattr(choice, "parsed") and choice.parsed
        else json.loads(choice.content)
    )
    llm_collections = parsed.get("collections") or []
    if not llm_collections:
        return {
            "success": False,
            "error_code": "LLM_EMPTY_RESPONSE",
            "error_message": "LLM returned no collections.",
        }

    created = []
    for cidx, c in enumerate(llm_collections[:count_to_make]):
        title = _strip_html(c.get("title")) or f"Collection {cidx+1}"
        desc = _strip_html(c.get("description")) or ""
        indices = c.get("product_indices") or []
        valid_indices = []
        for i in indices:
            try:
                ii = int(i)
            except Exception:
                continue
            if 0 <= ii < len(products):
                valid_indices.append(ii)
        # Deduplicate while preserving order
        seen = set()
        valid_indices = [i for i in valid_indices if not (i in seen or seen.add(i))]

        if len(valid_indices) < 2:
            return {
                "success": False,
                "error_code": "LLM_INVALID_GROUPING",
                "error_message": f"Collection '{title}' did not produce enough products (need >=2).",
            }

        product_ids: List[int] = []
        for ii in valid_indices:
            pid = _safe_int(products[ii].get("id"))
            if pid is not None:
                product_ids.append(pid)
        if len(product_ids) < 2:
            return {
                "success": False,
                "error_code": "INVALID_PRODUCT_IDS",
                "error_message": "Could not map enough product indices to numeric Shopify product IDs.",
            }

        payload = {
            "custom_collection": {
                "title": title[:255],
                "body_html": f"<p>{desc}</p>" if desc else None,
                "collects": [{"product_id": int(pid)} for pid in product_ids[:50]],
            }
        }

        # Create custom collection with collects
        create_resp = shopify_utils._make_request(
            "custom_collections.json",
            "POST",
            data=payload,
            user_id=user_id,
        )
        cc = (create_resp or {}).get("custom_collection") or {}
        created.append(
            {
                "title": cc.get("title") or title,
                "collection_id": str(cc.get("id")) if cc.get("id") is not None else None,
                "handle": cc.get("handle"),
                "description": desc,
                "product_ids": product_ids,
            }
        )

    return {
        "success": True,
        "created_collections": created,
        "requested_collections": count_to_make,
        "inputs": {"products_used": len(products)},
    }
