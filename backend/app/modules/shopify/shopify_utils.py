import requests
import json
import os
import urllib3
import logging
from pathlib import Path
from urllib.parse import urlparse
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
import base64
import html
import mimetypes
from ..database import document_store

logger = logging.getLogger(__name__)

# Suppress SSL warnings for development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def _extension_from_content_type(content_type: str) -> Optional[str]:
    if not content_type:
        return None
    ct = content_type.split(";")[0].strip().lower()
    mapping = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/pjpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    return mapping.get(ct)


def _extension_from_image_magic(header: bytes) -> Optional[str]:
    if not header or len(header) < 3:
        return None
    if header[:3] == b"\xff\xd8\xff":
        return "jpg"
    if len(header) >= 8 and header[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp"
    return None


def _detect_image_extension_from_url(image_url: str, timeout: int = 20) -> Optional[str]:
    """
    Shopify fileCreate requires filename extension to match the bytes at originalSource.
    URLs often end in .jpg while the object is PNG/WebP; probe headers/body to pick the real extension.
    """
    try:
        head_resp = requests.head(
            image_url, timeout=timeout, allow_redirects=True, stream=True
        )
        ext = _extension_from_content_type(head_resp.headers.get("Content-Type", ""))
        if ext:
            return ext
    except Exception as head_err:
        logger.debug("HEAD probe failed for image URL: %s", head_err)
    try:
        get_resp = requests.get(
            image_url, timeout=timeout, allow_redirects=True, stream=True
        )
        get_resp.raise_for_status()
        ext = _extension_from_content_type(get_resp.headers.get("Content-Type", ""))
        if ext:
            get_resp.close()
            return ext
        chunk = get_resp.raw.read(32) if get_resp.raw else b""
        get_resp.close()
        return _extension_from_image_magic(chunk)
    except Exception as get_err:
        logger.debug("GET probe failed for image URL: %s", get_err)
        return None


class ShopifyUtils:
    def __init__(self):
        # Remove hardcoded credentials - will use user-specific credentials
        self.api_version = "2025-10"

    def _to_gid(self, resource: str, resource_id: str) -> str:
        if not resource_id:
            return None
        if isinstance(resource_id, int):
            resource_id = str(resource_id)
        if str(resource_id).startswith("gid://"):
            return resource_id
        return f"gid://shopify/{resource}/{resource_id}"

    def _from_gid(self, gid: Optional[str]) -> Optional[str]:
        if not gid:
            return None
        try:
            return gid.split("/")[-1]
        except Exception:
            return gid

    def _map_status_to_graphql(self, status: Optional[str]) -> Optional[str]:
        if not status:
            return None
        s = str(status).strip().upper()
        mapping = {"ACTIVE": "ACTIVE", "DRAFT": "DRAFT", "ARCHIVED": "ARCHIVED"}
        if s in mapping:
            return mapping[s]
        rest_map = {"PUBLISHED": "ACTIVE"}
        return rest_map.get(s, "DRAFT")

    def _get_user_credentials(self, user_id: str) -> Dict[str, str]:
        """Get user-specific Shopify credentials from DynamoDB"""
        try:
            credentials = document_store.get_shopify_credentials(user_id)
            if not credentials:
                raise Exception(f"No Shopify credentials found for user {user_id}")
            return credentials
        except Exception as e:
            logger.error(f"Error getting Shopify credentials for user {user_id}: {e}")
            raise Exception(f"Failed to get Shopify credentials: {str(e)}")

    def _make_request(
        self, endpoint: str, method: str = "GET", data: Dict = None, user_id: str = None
    ) -> Dict:
        """
        Make authenticated request to Shopify API using user-specific credentials
        """
        if not user_id:
            raise Exception("user_id is required for authenticated requests")

        credentials = self._get_user_credentials(user_id)
        shop_domain = credentials.get("shop_url")
        if not shop_domain.startswith("https://"):
            shop_domain = f"https://{shop_domain}"
        access_token = credentials.get("access_token")

        if not shop_domain or not access_token:
            raise Exception("Invalid Shopify credentials")

        base_url = f"{shop_domain}/admin/api/{self.api_version}"
        url = f"{base_url}/{endpoint}"

        headers = {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": access_token,
        }

        max_retries = 10
        base_backoff_s = 0.55
        request_timeout = 90

        try:
            response = None
            for attempt in range(max_retries):
                if method == "GET":
                    response = requests.get(
                        url, headers=headers, timeout=request_timeout
                    )
                elif method == "POST":
                    response = requests.post(
                        url, headers=headers, json=data, timeout=request_timeout
                    )
                elif method == "PUT":
                    response = requests.put(
                        url, headers=headers, json=data, timeout=request_timeout
                    )
                elif method == "DELETE":
                    response = requests.delete(
                        url, headers=headers, json=data, timeout=request_timeout
                    )
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                if response.status_code == 429 and attempt < max_retries - 1:
                    retry_after = response.headers.get("Retry-After")
                    try:
                        wait_s = float(retry_after) if retry_after is not None else None
                    except (TypeError, ValueError):
                        wait_s = None
                    if wait_s is None:
                        wait_s = base_backoff_s * (1.5**attempt)
                    wait_s = max(0.5, min(wait_s, 60.0))
                    logger.warning(
                        "Shopify REST 429 (rate limit) at %s; sleeping %.1fs then retry %s/%s",
                        url,
                        wait_s,
                        attempt + 1,
                        max_retries,
                    )
                    time.sleep(wait_s)
                    continue

                if not response.ok:
                    body = None
                    try:
                        body = response.text
                    except Exception:
                        body = None
                    msg = (
                        f"HTTP {response.status_code} {response.reason} - {body}"
                        if body
                        else f"HTTP {response.status_code} {response.reason}"
                    )
                    logger.error(f"Shopify REST error at {url}: {msg}")
                    response.raise_for_status()

                return response.json()

        except requests.exceptions.RequestException as e:
            extra = ""
            try:
                resp = getattr(e, "response", None)
                if resp is not None and hasattr(resp, "text") and resp.text:
                    extra = f" | Response: {resp.text}"
            except Exception:
                pass
            raise Exception(f"Shopify API error: {str(e)}{extra}")

    def get_shop_info(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        try:
            if not shop_url or not access_token:
                return {
                    "success": False,
                    "error": "shop_url and access_token are required",
                }

            # Normalize domain
            shop_domain = (
                str(shop_url)
                .replace("https://", "")
                .replace("http://", "")
                .strip()
                .strip("/")
            )
            if (
                shop_domain
                and not shop_domain.endswith(".myshopify.com")
                and "." not in shop_domain
            ):
                shop_domain = f"{shop_domain}.myshopify.com"

            graphql_url = (
                f"https://{shop_domain}/admin/api/{self.api_version}/graphql.json"
            )
            headers = {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            }

            query = """
            query GetShopInfo {
              shop {
                id
                name
                email
                myshopifyDomain
                currencyCode
                ianaTimezone
                createdAt
                plan { displayName }
              }
            }
            """

            logger.info(f"Getting shop info via GraphQL for: {shop_domain}")
            resp = requests.post(
                graphql_url, headers=headers, json={"query": query}, timeout=30
            )
            if not resp.ok:
                return {
                    "success": False,
                    "error": f"HTTP {resp.status_code}: {resp.text}",
                }

            body = resp.json() or {}
            if body.get("errors"):
                return {"success": False, "error": str(body.get("errors"))}

            shop = ((body.get("data") or {}).get("shop")) or {}
            raw_id = shop.get("id")
            shop_id = None
            if raw_id:
                try:
                    shop_id = str(raw_id).split("/")[-1]
                except Exception:
                    shop_id = str(raw_id)

            return {
                "success": True,
                "shop_id": shop_id,
                "domain": shop.get("myshopifyDomain"),
                "name": shop.get("name"),
                "email": shop.get("email"),
                "currency": shop.get("currencyCode"),
                "timezone": shop.get("ianaTimezone"),
                "full_shop_data": shop,
            }

        except Exception as e:
            logger.error(f"Error getting shop info for {shop_url}: {e}")
            return {"success": False, "error": str(e)}

    def _make_graphql_request(
        self, query: str, variables: Dict = None, user_id: str = None
    ) -> Dict:
        """
        Make GraphQL request to Shopify API using user-specific credentials
        """
        if not user_id:
            raise Exception("user_id is required for authenticated requests")

        credentials = self._get_user_credentials(user_id)
        shop_domain = credentials.get("shop_url")
        access_token = credentials.get("access_token")

        if not shop_domain or not access_token:
            raise Exception("Invalid Shopify credentials")

        # Clean shop domain
        shop_domain = shop_domain.replace("https://", "").replace("http://", "")

        url = f"https://{shop_domain}/admin/api/{self.api_version}/graphql.json"
        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            try:
                resp_json = response.json()
            except ValueError as e:
                body_preview = None
                try:
                    body_preview = response.text[:500]
                except Exception:
                    body_preview = None
                logger.error(
                    f"GraphQL JSON decode failed: {e}; body preview: {body_preview}"
                )
                raise Exception("GraphQL returned invalid JSON")

            if not isinstance(resp_json, dict):
                body_preview = None
                try:
                    body_preview = response.text[:500]
                except Exception:
                    body_preview = None
                logger.error(
                    f"GraphQL unexpected JSON type: {type(resp_json).__name__}; body preview: {body_preview}"
                )
                raise Exception("GraphQL returned unexpected response")

            # Handle top-level GraphQL errors (no data key when present)
            if resp_json.get("errors"):
                errors_list = resp_json.get("errors") or []
                messages = [
                    e.get("message")
                    for e in errors_list
                    if isinstance(e, dict) and e.get("message")
                ]
                logger.error(f"GraphQL top-level errors: {messages}")
                raise Exception("; ".join(messages) or "GraphQL request failed")
            return resp_json
        except requests.exceptions.RequestException as e:
            logger.error(f"GraphQL request failed: {e}")
            raise Exception(f"GraphQL request failed: {str(e)}")

    def get_shop_metadata(self, user_id: str) -> Dict[str, Any]:
        """
        Fetch shop metadata using GraphQL and map to a consistent structure.
        Returns keys: shop_id, shop_name, email, shop_owner, myshopify_domain, country_code, currency, timezone, shop_created_at
        """
        try:
            # Prepare GraphQL query
            query = """
            query getShopMeta {
              shop {
                id
                name
                email
                currencyCode
                ianaTimezone
                createdAt
              }
            }
            """
            result = self._make_graphql_request(query, None, user_id)
            shop_node = (((result or {}).get("data") or {}).get("shop")) or {}
            # Derive myshopify domain from stored credentials as it's reliable
            creds = self._get_user_credentials(user_id)
            raw_shop = (
                (creds.get("shop_url") or "")
                .replace("https://", "")
                .replace("http://", "")
            )
            if (
                raw_shop
                and not raw_shop.endswith(".myshopify.com")
                and "." not in raw_shop
            ):
                raw_shop = f"{raw_shop}.myshopify.com"
            metadata = {
                "shop_id": (
                    self._from_gid(shop_node.get("id")) if shop_node.get("id") else None
                ),
                "shop_name": shop_node.get("name"),
                "email": shop_node.get("email"),
                "shop_owner": shop_node.get("shopOwner"),
                "myshopify_domain": raw_shop or None,
                "country_code": (
                    shop_node.get("countryCode")
                    if isinstance(shop_node.get("countryCode"), str)
                    else None
                ),
                "currency": shop_node.get("currencyCode"),
                "timezone": shop_node.get("ianaTimezone"),
                "shop_created_at": shop_node.get("createdAt"),
            }
            return metadata
        except Exception as e:
            logger.error(f"Error fetching shop metadata: {e}")
            return {}

    def upload_image_to_shopify(
        self,
        image_url: str,
        filename: str = None,
        alt_text: str = "",
        user_id: str = None,
    ) -> Dict:
        """
        Upload an image to Shopify using GraphQL fileCreate mutation

        Args:
            image_url: URL of the image to upload
            filename: Desired filename for the image (if None, will extract from URL or generate UUID)
            alt_text: Alt text for the image
            user_id: User ID for authentication

        Returns:
            Dict containing the upload result
        """
        try:
            # Generate filename if not provided
            if not filename:
                import uuid

                # Try to extract filename from URL
                parsed_url = urlparse(image_url)
                url_filename = os.path.basename(parsed_url.path)

                if url_filename and "." in url_filename:
                    # Use the filename from URL if it exists and has extension
                    filename = url_filename
                else:
                    # Generate UUID-based filename
                    unique_id = str(uuid.uuid4().hex[:8])
                    file_extension = os.path.splitext(url_filename)[1]
                    filename = f"{unique_id}_kluck_ai_generated_image{file_extension}"

            detected_ext = _detect_image_extension_from_url(image_url)
            if detected_ext:
                base, old_ext = os.path.splitext(filename)
                if base:
                    prev = old_ext.lstrip(".").lower()
                    if prev != detected_ext.lower():
                        logger.info(
                            "Shopify upload: filename extension .%s -> .%s to match source bytes",
                            prev or "?",
                            detected_ext,
                        )
                    filename = f"{base}.{detected_ext}"

            logger.info(f"Uploading image to Shopify with filename: {filename}")

            query = """
            mutation fileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  id
                  fileStatus
                  alt
                  ... on MediaImage {
                    image {
                      url
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """

            variables = {
                "files": [
                    {
                        "originalSource": image_url,
                        "contentType": "IMAGE",
                        "filename": filename,
                        "alt": alt_text,
                    }
                ]
            }

            logger.info(f"Uploading image to Shopify: {filename}")
            result = self._make_graphql_request(query, variables, user_id)

            if result.get("data", {}).get("fileCreate", {}).get("userErrors"):
                errors = result["data"]["fileCreate"]["userErrors"]
                logger.error(f"Image upload errors: {errors}")
                return {
                    "success": False,
                    "error": f"Image upload failed: {errors}",
                    "result": result,
                }

            files = result.get("data", {}).get("fileCreate", {}).get("files", [])
            if files:
                file_data = files[0]
                file_status = file_data.get("fileStatus")

                # Check if upload was successful based on fileStatus
                if file_status == "UPLOADED":
                    logger.info(
                        f"Successfully uploaded image: {filename} (Status: {file_status})"
                    )
                    return {
                        "success": True,
                        "file_id": file_data.get("id"),
                        "file_status": file_status,
                        "alt": file_data.get("alt"),
                        "image_url": (
                            file_data.get("image", {}).get("url")
                            if file_data.get("image")
                            else None
                        ),
                        "filename": filename,
                        "result": result,
                    }
                else:
                    logger.warning(
                        f"Image upload completed but status is {file_status}: {filename}"
                    )
                    return {
                        "success": False,
                        "error": f"Upload completed but status is {file_status}",
                        "file_id": file_data.get("id"),
                        "file_status": file_status,
                        "filename": filename,
                        "result": result,
                    }
            else:
                logger.error(f"No files returned from upload: {result}")
                return {
                    "success": False,
                    "error": "No files returned from upload",
                    "filename": filename,
                    "result": result,
                }

        except Exception as e:
            logger.error(f"Error uploading image to Shopify: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename if "filename" in locals() else None,
            }

    def get_products(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Get products from user's Shopify store with pagination support
        """
        try:
            all_products: List[Dict[str, Any]] = []
            cursor = None
            max_pages = 100  # Prevent infinite loops
            page_count = 0

            while page_count < max_pages:
                # Use cursor if available, otherwise use offset for first page
                query = """
                query ($first: Int!, $after: String) {
                  products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    edges {
                      node {
                        id
                        title
                        status
                        descriptionHtml
                        vendor
                        productType
                        tags
                        createdAt
                        updatedAt
                        images(first: 10) {
                          edges { node { url } }
                        }
                        variants(first: 1) {
                          edges { node { price inventoryQuantity } }
                        }
                      }
                    }
                  }
                }
                """
                variables = (
                    {"first": int(limit), "after": cursor}
                    if cursor
                    else {"first": int(limit)}
                )
                result = self._make_graphql_request(query, variables, user_id)

                products_data = ((result or {}).get("data") or {}).get("products") or {}
                edges = products_data.get("edges", [])
                page_info = products_data.get("pageInfo", {})

                for edge in edges:
                    node = (edge or {}).get("node") or {}
                    images_edges = ((node.get("images") or {}).get("edges")) or []
                    image_urls = [
                        ((ie or {}).get("node") or {}).get("url")
                        for ie in images_edges
                        if ((ie or {}).get("node") or {}).get("url")
                    ]
                    variants_edges = ((node.get("variants") or {}).get("edges")) or []
                    first_variant = (
                        (variants_edges[0] or {}).get("node") if variants_edges else {}
                    ) or {}
                    price = first_variant.get("price") or "0.00"
                    inventory_qty = first_variant.get("inventoryQuantity") or 0
                    all_products.append(
                        {
                            "id": self._from_gid(node.get("id")),
                            "name": node.get("title"),
                            "title": node.get("title"),
                            "price": price,
                            "image": image_urls[0] if image_urls else None,
                            "images": [{"src": url} for url in image_urls],
                            "description": node.get("descriptionHtml") or "",
                            "body_html": node.get("descriptionHtml") or "",
                            "vendor": node.get("vendor") or "",
                            "product_type": node.get("productType") or "",
                            "category": node.get("productType") or "",
                            "tags": node.get("tags") or [],
                            "inventory_quantity": inventory_qty,
                            "status": (node.get("status") or "").lower() or "active",
                            "created_at": node.get("createdAt"),
                            "updated_at": node.get("updatedAt"),
                        }
                    )

                # Check if there are more pages
                if not page_info.get("hasNextPage"):
                    break

                cursor = page_info.get("endCursor")
                page_count += 1

                # Small delay to avoid rate limiting
                time.sleep(0.1)

            logger.info(
                f"Retrieved {len(all_products)} products across {page_count + 1} pages"
            )
            return all_products

        except Exception as e:
            logger.error(f"Error getting products for user {user_id}: {e}")
            return []

    def get_collections_with_products(
        self,
        user_id: str,
        per_collection_product_limit: int = 250,
    ) -> List[Dict[str, Any]]:
        """
        Fetch both custom and smart collections and attach collection products.
        """
        try:
            custom_resp = self._make_request(
                "custom_collections.json?limit=250&fields=id,title,body_html,handle,image,updated_at,published_at",
                "GET",
                user_id=user_id,
            )
            smart_resp = self._make_request(
                "smart_collections.json?limit=250&fields=id,title,body_html,handle,image,updated_at,published_at",
                "GET",
                user_id=user_id,
            )
            custom_collections = custom_resp.get("custom_collections", []) or []
            smart_collections = smart_resp.get("smart_collections", []) or []
            all_collections = custom_collections + smart_collections
            results: List[Dict[str, Any]] = []

            for col in all_collections:
                cid = col.get("id")
                if not cid:
                    continue
                image_obj = col.get("image") or {}
                image_src = image_obj.get("src") if isinstance(image_obj, dict) else None
                products = self._fetch_all_paginated(
                    endpoint=(
                        f"collections/{cid}/products.json?limit={int(per_collection_product_limit)}"
                        "&fields=id,title,body_html,vendor,product_type,tags,image,images,updated_at,created_at,status"
                    ),
                    user_id=user_id,
                    resource_key="products",
                )
                results.append(
                    {
                        "id": str(cid),
                        "title": col.get("title") or "",
                        "description": col.get("body_html") or "",
                        "handle": col.get("handle"),
                        "image": image_src,
                        "updated_at": col.get("updated_at"),
                        "published_at": col.get("published_at"),
                        "products": products,
                    }
                )

            logger.info(
                f"Fetched {len(results)} collections with products for user {user_id}"
            )
            return results
        except Exception as e:
            logger.error(f"Error fetching collections for user {user_id}: {e}")
            return []

    def update_collection_image(
        self,
        *,
        collection_id: str,
        image_src: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Set/replace the image for a collection in Shopify.

        Shopify has two collection types with different REST endpoints:
        - custom collections: PUT custom_collections/{id}.json
        - smart collections:  PUT smart_collections/{id}.json

        We don't always know the type, so we try custom first, then smart.
        """
        try:
            cid = str(collection_id).strip()
            src = str(image_src).strip()
            if not cid:
                return {"success": False, "error": "collection_id is required"}
            if not src:
                return {"success": False, "error": "image_src is required"}

            payload_custom = {
                "custom_collection": {"id": int(cid), "image": {"src": src}}
            }
            resp = self._make_request(
                f"custom_collections/{cid}.json",
                method="PUT",
                data=payload_custom,
                user_id=user_id,
            )
            if isinstance(resp, dict) and resp.get("custom_collection"):
                cc = resp.get("custom_collection") or {}
                image_obj = cc.get("image") or {}
                image_url = image_obj.get("src") if isinstance(image_obj, dict) else None
                return {
                    "success": True,
                    "collection_type": "custom",
                    "collection_id": str(cc.get("id") or cid),
                    "image_src": image_url or src,
                }

            # Fall back to smart collection update (best effort)
            payload_smart = {"smart_collection": {"id": int(cid), "image": {"src": src}}}
            resp2 = self._make_request(
                f"smart_collections/{cid}.json",
                method="PUT",
                data=payload_smart,
                user_id=user_id,
            )
            if isinstance(resp2, dict) and resp2.get("smart_collection"):
                sc = resp2.get("smart_collection") or {}
                image_obj = sc.get("image") or {}
                image_url = image_obj.get("src") if isinstance(image_obj, dict) else None
                return {
                    "success": True,
                    "collection_type": "smart",
                    "collection_id": str(sc.get("id") or cid),
                    "image_src": image_url or src,
                }

            return {
                "success": False,
                "error": f"Unexpected response updating collection image: {resp or resp2}",
            }
        except Exception as e:
            logger.error(f"Error updating collection image: {e}")
            return {"success": False, "error": str(e)}

    def update_collection_description_plain(
        self,
        *,
        collection_id: str,
        plain_text: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Set collection description from plain text. Stored as minimal HTML in Shopify
        (single <p>), since body_html expects HTML.
        """
        try:
            cid = str(collection_id).strip()
            raw = str(plain_text or "").strip()
            if not cid:
                return {"success": False, "error": "collection_id is required"}
            if not raw:
                return {"success": False, "error": "plain_text is required"}

            body_html = f"<p>{html.escape(raw)}</p>"
            payload_custom = {
                "custom_collection": {"id": int(cid), "body_html": body_html}
            }
            resp = self._make_request(
                f"custom_collections/{cid}.json",
                method="PUT",
                data=payload_custom,
                user_id=user_id,
            )
            if isinstance(resp, dict) and resp.get("custom_collection"):
                return {
                    "success": True,
                    "collection_type": "custom",
                    "collection_id": str((resp.get("custom_collection") or {}).get("id") or cid),
                }

            payload_smart = {
                "smart_collection": {"id": int(cid), "body_html": body_html}
            }
            resp2 = self._make_request(
                f"smart_collections/{cid}.json",
                method="PUT",
                data=payload_smart,
                user_id=user_id,
            )
            if isinstance(resp2, dict) and resp2.get("smart_collection"):
                return {
                    "success": True,
                    "collection_type": "smart",
                    "collection_id": str((resp2.get("smart_collection") or {}).get("id") or cid),
                }

            return {
                "success": False,
                "error": f"Unexpected response updating collection description: {resp or resp2}",
            }
        except Exception as e:
            logger.error(f"Error updating collection description: {e}")
            return {"success": False, "error": str(e)}

    def create_product(self, product_data: Dict, user_id: str) -> Dict:
        """
        Create a new product in user's Shopify store
        """
        try:
            title = str(product_data.get("title", "Untitled Product")).strip()
            if not title:
                raise Exception("Product title is required")
            description_html = str(
                product_data.get("body_html") or product_data.get("description", "")
            ).strip()
            vendor = str(product_data.get("vendor", "")).strip() or None
            product_type = str(product_data.get("product_type", "")).strip() or None
            tags_raw = product_data.get("tags", [])
            if isinstance(tags_raw, str):
                tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
            elif isinstance(tags_raw, list):
                tags_list = [str(t).strip() for t in tags_raw if str(t).strip()]
            else:
                tags_list = []
            status_graphql = self._map_status_to_graphql(
                product_data.get("status", "DRAFT")
            )
            mutation = """
            mutation ProductCreate($input: ProductInput!) {
              productCreate(input: $input) {
                product { id title }
                userErrors { field message }
              }
            }
            """
            product_input: Dict[str, Any] = {
                "title": title,
                "descriptionHtml": description_html,
                "vendor": vendor,
                "productType": product_type,
                "tags": tags_list,
                "status": status_graphql,
            }
            variables = {"input": product_input}
            result = self._make_graphql_request(mutation, variables, user_id)
            payload = ((result or {}).get("data") or {}).get("productCreate") or {}
            errors = payload.get("userErrors") or []
            if errors:
                raise Exception(
                    "; ".join([e.get("message") for e in errors if e.get("message")])
                    or "Unknown GraphQL error"
                )
            product_node = payload.get("product") or {}
            if not product_node.get("id"):
                raise Exception("GraphQL did not return a product ID")
            created_id = self._from_gid(product_node.get("id"))
            return {"id": created_id, "title": title}

        except Exception as e:
            raise Exception(f"Failed to create product: {str(e)}")

    def update_product(self, product_data: Dict, user_id: str) -> Dict:
        """
        Update an existing product in user's Shopify store
        """
        try:
            product_id = product_data.get("id")
            if not product_id:
                raise Exception("Product ID is required for update")
            gid = self._to_gid("Product", str(product_id))
            title = product_data.get("title")
            description_html = product_data.get("body_html") or product_data.get(
                "description"
            )
            status_graphql = self._map_status_to_graphql(product_data.get("status"))
            product_type = product_data.get("product_type")
            tags_raw = product_data.get("tags")
            tags_list = None
            if isinstance(tags_raw, str):
                tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
            elif isinstance(tags_raw, list):
                tags_list = [str(t).strip() for t in tags_raw if str(t).strip()]
            mutation = """
            mutation ProductUpdate($input: ProductInput!) {
              productUpdate(input: $input) {
                product { id title }
                userErrors { field message }
              }
            }
            """
            input_obj: Dict[str, Any] = {"id": gid}
            if title is not None:
                input_obj["title"] = title
            if description_html is not None:
                input_obj["descriptionHtml"] = description_html
            if status_graphql is not None:
                input_obj["status"] = status_graphql
            if product_type is not None:
                input_obj["productType"] = product_type
            if tags_list is not None:
                input_obj["tags"] = tags_list
            variables = {"input": input_obj}
            result = self._make_graphql_request(mutation, variables, user_id)
            payload = ((result or {}).get("data") or {}).get("productUpdate") or {}
            errors = payload.get("userErrors") or []
            if errors:
                raise Exception(
                    "; ".join([e.get("message") for e in errors if e.get("message")])
                    or "Unknown GraphQL error"
                )
            product_node = payload.get("product") or {}
            return {
                "id": self._from_gid(product_node.get("id")),
                "title": product_node.get("title"),
            }

        except Exception as e:
            raise Exception(f"Failed to update product: {str(e)}")

    def delete_product(self, product_id: str, user_id: str) -> bool:
        try:
            if not product_id:
                raise Exception("Product ID is required for deletion")
            gid = self._to_gid("Product", str(product_id))
            mutation = """
            mutation ProductDelete($input: ProductDeleteInput!) {
              productDelete(input: $input) {
                deletedProductId
                userErrors { field message }
              }
            }
            """
            variables = {"input": {"id": gid}}
            result = self._make_graphql_request(mutation, variables, user_id)
            payload = ((result or {}).get("data") or {}).get("productDelete") or {}
            errors = payload.get("userErrors") or []
            if errors:
                raise Exception(
                    "; ".join([e.get("message") for e in errors if e.get("message")])
                    or "Unknown GraphQL error"
                )
            return True
        except Exception as e:
            raise Exception(f"Failed to delete product: {str(e)}")

    def register_uninstall_webhook(
        self, shop_url: str, access_token: str, webhook_url: str
    ) -> bool:
        try:
            temp_headers = {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": access_token,
            }

            shop_domain = (
                shop_url.replace("https://", "")
                .replace("http://", "")
                .replace(".myshopify.com", "")
            )
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/{self.api_version}/webhooks.json"

            webhook_data = {
                "webhook": {
                    "topic": "app/uninstalled",
                    "address": webhook_url,
                    "format": "json",
                }
            }

            response = requests.post(api_url, headers=temp_headers, json=webhook_data)

            if response.status_code == 201:
                return True
            else:
                return False

        except Exception as e:
            return False

    def get_product(self, product_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get detailed product information including all images and variants

        Args:
            product_id: The Shopify product ID
            user_id: User ID for authentication

        Returns:
            Dict containing product details with images array
        """
        try:
            gid = self._to_gid("Product", str(product_id))
            query = """
            query GetProduct($id: ID!) {
              product(id: $id) {
                id
                title
                descriptionHtml
                templateSuffix
                handle
                vendor
                productType
                tags
                createdAt
                updatedAt
                status
                featuredImage { url }
                images(first: 50) { edges { node { url altText } } }
                variants(first: 250) { edges { node { id price inventoryQuantity } } }
              }
            }
            """
            variables = {"id": gid}
            result = self._make_graphql_request(query, variables, user_id)
            node = (((result or {}).get("data") or {}).get("product")) or {}
            if not node:
                raise Exception(f"Product with ID {product_id} not found")
            images_edges = ((node.get("images") or {}).get("edges")) or []
            image_urls = []
            images_meta = []
            for ie in images_edges:
                img_node = (ie or {}).get("node") or {}
                url = img_node.get("url")
                if not url:
                    continue
                image_urls.append(url)
                images_meta.append(
                    {
                        "url": url,
                        "alt_text": img_node.get("altText"),
                    }
                )
            variants_edges = ((node.get("variants") or {}).get("edges")) or []
            prices = []
            for ve in variants_edges:
                n = (ve or {}).get("node") or {}
                try:
                    if n.get("price") is not None:
                        prices.append(float(n.get("price")))
                except Exception:
                    continue
            min_price = f"${min(prices):.2f}" if prices else "$0.00"
            featured_image_url = ((node.get("featuredImage") or {}).get("url")) or None
            product_details = {
                "id": self._from_gid(node.get("id")),
                "title": node.get("title", ""),
                # Backward-compatible plain-ish description used by existing callers.
                "description": (node.get("descriptionHtml") or "")
                .replace("<p>", "")
                .replace("</p>", "")
                .strip(),
                # Raw HTML for reliable restore/revert.
                "description_html": node.get("descriptionHtml") or "",
                "template_suffix": node.get("templateSuffix"),
                "price": min_price,
                "featured_image_url": featured_image_url,
                "images": image_urls,
                "images_meta": images_meta,
                "handle": node.get("handle"),
                "vendor": node.get("vendor"),
                "product_type": node.get("productType"),
                "tags": node.get("tags") or [],
                "created_at": node.get("createdAt"),
                "updated_at": node.get("updatedAt"),
                "status": (node.get("status") or "").lower() or "active",
                "variants_count": len(variants_edges),
            }
            return product_details

        except Exception as e:
            logger.error(f"Error getting product {product_id} for user {user_id}: {e}")
            raise Exception(f"Failed to get product details: {str(e)}")

    def validate_shopify_connection(
        self, shop_url, access_token, api_version="2025-10"
    ):
        try:
            # Normalize shop domain
            shop_domain = shop_url.replace("https://", "").replace("http://", "")
            url = f"https://{shop_domain}/admin/api/{api_version}/graphql.json"
            headers = {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            }
            payload = {"query": "{ shop { name id } }"}
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            if not resp.ok:
                return False
            data = resp.json().get("data", {})
            shop = data.get("shop") or {}
            return bool(shop.get("name"))
        except Exception:
            return False

    def list_themes(self, user_id: str) -> Dict:
        """
        List themes via GraphQL. Returns { success: bool, themes: [ {id,name,role,created_at,updated_at} ] }
        """
        try:
            query = """
            query ListThemes($first: Int!) {
              themes(first: $first) {
                edges {
                  node {
                    id
                    name
                    role
                    createdAt
                    updatedAt
                  }
                }
              }
            }
            """
            variables = {"first": 50}
            result = self._make_graphql_request(query, variables, user_id)
            edges = (
                (((result or {}).get("data") or {}).get("themes") or {}).get("edges")
            ) or []
            themes = []
            for e in edges:
                n = (e or {}).get("node") or {}
                if not n:
                    continue
                themes.append(
                    {
                        "id": self._from_gid(n.get("id")) if n.get("id") else None,
                        "name": n.get("name"),
                        "role": n.get("role"),
                        "created_at": n.get("createdAt"),
                        "updated_at": n.get("updatedAt"),
                    }
                )
            return {"success": True, "themes": themes}
        except Exception as e:
            logger.error(f"Error listing themes: {e}")
            return {"success": False, "error": str(e)}

    def get_live_theme(self, user_id: str) -> Dict:
        """
        Get the main/live theme of the user's Shopify store

        Args:
            user_id: User ID for authentication

        Returns:
            Dict containing success status and theme details (id, name, role) if found
        """
        try:
            query = """
            {
              themes(first: 200) {
                edges {
                  node {
                    id
                    role
                    name
                  }
                }
              }
            }
            """
            # No variables needed - query is self-contained
            result = self._make_graphql_request(query, None, user_id)

            # Check for GraphQL errors
            if result.get("errors"):
                logger.error(f"GraphQL errors: {result['errors']}")
                return {
                    "success": False,
                    "error": f"GraphQL errors: {result['errors']}",
                }

            # Access data directly like the working example
            data = result.get("data", {})
            themes_data = data.get("themes", {})
            edges = themes_data.get("edges", [])

            # Find the theme with role "MAIN"
            for edge in edges:
                theme = edge.get("node", {})
                if not theme:
                    continue

                role = theme.get("role")
                if role == "MAIN":
                    theme_id = theme.get("id")

                    theme_result = {
                        "id": theme_id,
                        "name": theme.get("name"),
                        "role": role,
                    }
                    logger.info(
                        f"✅ Live theme found: {theme_result['name']} (ID: {theme_result['id']})"
                    )
                    return {"success": True, "theme": theme_result}

            logger.warning("⚠️ No main theme found.")
            return {"success": False, "error": "No main theme found"}

        except Exception as e:
            logger.error(f"Error getting live theme: {e}")
            return {"success": False, "error": str(e)}

    def check_if_theme_exists(self, theme_id: str, user_id: str) -> Dict:
        """
        Check if a theme exists using GraphQL.
        args:
            theme_id: The ID of the theme to check, e.g gid://shopify/OnlineStoreTheme/1234567890
            user_id: User ID for authentication
        returns:
            Dict containing success status and theme details (id, name, role) if found
        """
        try:
            theme_gid = self._to_gid("OnlineStoreTheme", theme_id)
            query = """
            query CheckIfThemeExists($id: ID!) {
              theme(id: $id) {
                id
                name
                role
              }
            }
            """
            variables = {"id": theme_gid}
            result = self._make_graphql_request(query, variables, user_id)
            theme = ((result or {}).get("data") or {}).get("theme") or {}
            theme_id = theme.get("id", None)
            if not theme_id:
                return False
            return True
        except Exception as e:
            logger.error(f"Error checking if theme exists: {e}")
            return False

    def duplicate_theme(
        self, theme_id: str, new_name: str = "Theme Copy", user_id: str = None
    ) -> Dict:
        """
        Duplicate a Shopify theme using GraphQL mutation.

        Args:
            theme_id: The ID of the theme to duplicate (can be numeric or GID format)
            new_name: Name for the duplicated theme (default: "Theme Copy")
            user_id: User ID for authentication

        Returns:
            Dict containing success status and new theme details (id, name, role, createdAt) if successful
        """
        try:
            # Convert theme_id to GID format if needed
            theme_gid = self._to_gid("OnlineStoreTheme", theme_id)

            mutation = """
            mutation themeDuplicate($id: ID!, $name: String) {
              themeDuplicate(id: $id, name: $name) {
                newTheme {
                  id
                  name
                  role
                  createdAt
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """
            variables = {"id": theme_gid, "name": new_name}
            result = self._make_graphql_request(mutation, variables, user_id)

            # Check for GraphQL errors
            if result.get("errors"):
                logger.error(f"GraphQL errors: {result['errors']}")
                return {
                    "success": False,
                    "error": f"GraphQL errors: {result['errors']}",
                }
            # Extract themeDuplicate result
            theme_duplicate_result = (
                ((result or {}).get("data") or {}).get("themeDuplicate")
            ) or {}

            # Check for user errors
            user_errors = theme_duplicate_result.get("userErrors", [])
            if user_errors:
                error_messages = [
                    err.get("message", "Unknown error") for err in user_errors
                ]
                logger.error(f"Theme duplication user errors: {error_messages}")
                return {"success": False, "error": "; ".join(error_messages)}

            # Extract new theme details
            new_theme_node = theme_duplicate_result.get("newTheme") or {}
            if not new_theme_node:
                logger.error("No newTheme in themeDuplicate response")
                return {
                    "success": False,
                    "error": "No new theme returned from duplication",
                }

            new_theme = {
                "id": (
                    self._from_gid(new_theme_node.get("id"))
                    if new_theme_node.get("id")
                    else None
                ),
                "name": new_theme_node.get("name"),
                "role": new_theme_node.get("role"),
                "createdAt": new_theme_node.get("createdAt"),
            }

            logger.info(
                f"✅ Theme duplicated successfully: {new_theme['name']} (ID: {new_theme['id']})"
            )
            return {"success": True, "theme": new_theme}

        except Exception as e:
            logger.error(f"Error duplicating theme: {e}")
            return {"success": False, "error": str(e)}

    def publish_theme_live(self, theme_id: str, user_id: str) -> Dict:
        """
        Set a theme as the live (MAIN) storefront theme using themePublish.

        Args:
            theme_id: Theme id (numeric or full OnlineStoreTheme GID).
            user_id: Authenticated shop user id.

        Returns:
            Dict with success, optional theme payload, and error on failure.
        """
        try:
            theme_gid = self._to_gid("OnlineStoreTheme", theme_id)
            mutation = """
            mutation themePublish($id: ID!) {
              themePublish(id: $id) {
                theme {
                  id
                  name
                  role
                }
                userErrors {
                  field
                  message
                  code
                }
              }
            }
            """
            variables = {"id": theme_gid}
            result = self._make_graphql_request(mutation, variables, user_id)

            if result.get("errors"):
                logger.error(f"themePublish GraphQL errors: {result['errors']}")
                return {
                    "success": False,
                    "error": f"GraphQL errors: {result['errors']}",
                }

            payload = (
                ((result or {}).get("data") or {}).get("themePublish")
            ) or {}
            user_errors = payload.get("userErrors") or []
            if user_errors:
                msgs = [e.get("message", "Unknown error") for e in user_errors]
                err_text = "; ".join(msgs)
                logger.error(f"themePublish userErrors: {user_errors}")
                return {"success": False, "error": err_text}

            theme_node = payload.get("theme") or {}
            if not theme_node.get("id"):
                return {
                    "success": False,
                    "error": "themePublish returned no theme",
                }

            logger.info(
                f"✅ Theme published live: {theme_node.get('name')} "
                f"(role={theme_node.get('role')})"
            )
            return {
                "success": True,
                "theme": {
                    "id": self._from_gid(theme_node.get("id")),
                    "name": theme_node.get("name"),
                    "role": theme_node.get("role"),
                },
            }
        except Exception as e:
            logger.error(f"Error publishing theme live: {e}")
            return {"success": False, "error": str(e)}

    def set_shop_metafield(
        self, namespace: str, key: str, mtype: str, value: str, user_id: str
    ) -> Dict:
        """
        Create or update a shop-level metafield.
        """
        try:
            data = {
                "metafield": {
                    "namespace": namespace,
                    "key": key,
                    "type": mtype,
                    "value": value,
                    "owner_resource": "shop",
                }
            }
            resp = self._make_request(
                "metafields.json", method="POST", data=data, user_id=user_id
            )
            if "metafield" in resp:
                return {"success": True, "metafield": resp["metafield"]}
            return {"success": False, "error": f"Unexpected response: {resp}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def set_product_metafields_bulk(
        self,
        product_id: str,
        fields: Dict[str, Any],
        user_id: str,
        namespace: str = "kluck_ai",
    ) -> Dict:
        """
        Create or update multiple metafields on a single product.
        Handles chunking for Shopify's limit of 25 metafields per bulk operation.

        Args:
            product_id: Shopify product ID (numeric or gid://shopify/Product/...)
            fields: Dict of { key: value } for metafields
            user_id: Authenticated user ID
            namespace: Metafield namespace to use (default: 'kluck_ai')
        """
        try:
            if not product_id or not fields:
                return {"success": False, "error": "product_id and fields are required"}
            owner_gid = self._to_gid("Product", str(product_id))
            # Heuristic type mapping: longer text -> multi_line_text_field
            metafields_input: List[Dict[str, Any]] = []
            for key, value in (fields or {}).items():
                # Skip core fields we don't want as metafields
                # Product title should come from the product itself, not from metafields
                key_str = str(key).strip().lower()
                if key_str == "product_title":
                    logger.debug(
                        f"Skipping {key} - product title comes from product itself"
                    )
                    continue
                if value is None:
                    continue
                if isinstance(value, (dict, list)):
                    # Skip non-primitive values for now
                    continue
                val_str = str(value).strip()
                if not val_str:
                    continue
                key_str = str(key).strip()
                # Shopify metafield key constraints: lower case, letters, digits, _ only
                safe_key = key_str.lower().replace(" ", "_").replace("-", "_")
                # Decide type based on key/length
                lowered = safe_key.lower()
                if (
                    any(
                        token in lowered
                        for token in [
                            "desc",
                            "body",
                            "subheading",
                            "answer",
                            "question",
                        ]
                    )
                    or len(val_str) > 120
                ):
                    mtype = "multi_line_text_field"
                else:
                    mtype = "single_line_text_field"
                metafields_input.append(
                    {
                        "ownerId": owner_gid,
                        "namespace": namespace,
                        "key": safe_key,
                        "type": mtype,
                        "value": val_str,
                    }
                )
            if not metafields_input:
                return {"success": False, "error": "No valid metafields to set"}

            # Shopify limit: max 25 metafields per bulk operation
            MAX_METAFIELDS_PER_BATCH = 25

            # Chunk metafields into batches of 25
            total_metafields = len(metafields_input)
            chunks = [
                metafields_input[i : i + MAX_METAFIELDS_PER_BATCH]
                for i in range(0, total_metafields, MAX_METAFIELDS_PER_BATCH)
            ]

            logger.info(
                f"Setting {total_metafields} metafields in {len(chunks)} batch(es) for product {product_id}"
            )

            mutation = """
            mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  namespace
                  key
                }
                userErrors {
                  field
                  message
                  code
                }
              }
            }
            """

            # Process each chunk
            all_metafields = []
            all_user_errors = []
            all_success = True

            for chunk_idx, chunk in enumerate(chunks, 1):
                try:
                    logger.info(
                        f"Processing batch {chunk_idx}/{len(chunks)} with {len(chunk)} metafields"
                    )
                    variables = {"metafields": chunk}
                    result = self._make_graphql_request(mutation, variables, user_id)
                    payload = (
                        ((result or {}).get("data") or {}).get("metafieldsSet")
                    ) or {}
                    user_errors = payload.get("userErrors") or []
                    metafields = payload.get("metafields") or []

                    if user_errors:
                        logger.warning(
                            f"Batch {chunk_idx} metafieldsSet userErrors: {user_errors}"
                        )
                        all_success = False

                    all_metafields.extend(metafields)
                    all_user_errors.extend(user_errors)

                    logger.info(
                        f"✅ Batch {chunk_idx} completed: {len(metafields)} metafields set"
                    )

                except Exception as chunk_error:
                    logger.error(
                        f"Error processing batch {chunk_idx}: {str(chunk_error)}"
                    )
                    all_success = False
                    all_user_errors.append(
                        {
                            "field": f"batch_{chunk_idx}",
                            "message": str(chunk_error),
                            "code": "BATCH_ERROR",
                        }
                    )

            return {
                "success": all_success and len(all_user_errors) == 0,
                "metafields_count": len(all_metafields),
                "total_batches": len(chunks),
                "user_errors": all_user_errors,
            }
        except Exception as e:
            logger.error(
                f"Error setting product metafields in bulk for product {product_id}: {e}"
            )
            return {"success": False, "error": str(e)}

    def set_product_file_metafields_bulk(
        self,
        product_id: str,
        file_references: Dict[str, str],
        user_id: str,
        namespace: str = "kluck_ai",
    ) -> Dict:
        """
        Create or update multiple file_reference metafields on a single product.
        Handles chunking for Shopify's limit of 25 metafields per bulk operation.

        Args:
            product_id: Shopify product ID (numeric or gid://shopify/Product/...)
            file_references: Dict of { key: file_id } where file_id is a GID (e.g., "gid://shopify/File/123")
            user_id: Authenticated user ID
            namespace: Metafield namespace to use (default: 'kluck_ai')
        """
        try:
            if not product_id or not file_references:
                return {
                    "success": False,
                    "error": "product_id and file_references are required",
                }
            owner_gid = self._to_gid("Product", str(product_id))

            metafields_input: List[Dict[str, Any]] = []
            for key, file_id in (file_references or {}).items():
                if not file_id or not isinstance(file_id, str):
                    continue

                # Ensure file_id is a valid GID
                if not file_id.startswith("gid://"):
                    # If it's just a number, convert to GID
                    try:
                        file_id = f"gid://shopify/File/{file_id}"
                    except:
                        logger.warning(f"Invalid file_id format for {key}: {file_id}")
                        continue

                key_str = str(key).strip()
                # Shopify metafield key constraints: lower case, letters, digits, _ only
                safe_key = key_str.lower().replace(" ", "_").replace("-", "_")

                metafields_input.append(
                    {
                        "ownerId": owner_gid,
                        "namespace": namespace,
                        "key": safe_key,
                        "type": "file_reference",
                        "value": file_id,  # File GID
                    }
                )

            if not metafields_input:
                return {
                    "success": False,
                    "error": "No valid file_reference metafields to set",
                }

            # Shopify limit: max 25 metafields per bulk operation
            MAX_METAFIELDS_PER_BATCH = 25

            # Chunk metafields into batches of 25
            total_metafields = len(metafields_input)
            chunks = [
                metafields_input[i : i + MAX_METAFIELDS_PER_BATCH]
                for i in range(0, total_metafields, MAX_METAFIELDS_PER_BATCH)
            ]

            logger.info(
                f"Setting {total_metafields} file_reference metafields in {len(chunks)} batch(es) for product {product_id}"
            )

            mutation = """
            mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  namespace
                  key
                }
                userErrors {
                  field
                  message
                  code
                }
              }
            }
            """

            # Process each chunk
            all_metafields = []
            all_user_errors = []
            all_success = True

            for chunk_idx, chunk in enumerate(chunks, 1):
                try:
                    logger.info(
                        f"Processing file_reference batch {chunk_idx}/{len(chunks)} with {len(chunk)} metafields"
                    )
                    variables = {"metafields": chunk}
                    result = self._make_graphql_request(mutation, variables, user_id)
                    payload = (
                        ((result or {}).get("data") or {}).get("metafieldsSet")
                    ) or {}
                    user_errors = payload.get("userErrors") or []
                    metafields = payload.get("metafields") or []

                    if user_errors:
                        logger.warning(
                            f"Batch {chunk_idx} file_reference metafieldsSet userErrors: {user_errors}"
                        )
                        all_success = False

                    all_metafields.extend(metafields)
                    all_user_errors.extend(user_errors)

                    logger.info(
                        f"✅ File_reference batch {chunk_idx} completed: {len(metafields)} metafields set"
                    )

                except Exception as chunk_error:
                    logger.error(
                        f"Error processing file_reference batch {chunk_idx}: {str(chunk_error)}"
                    )
                    all_success = False
                    all_user_errors.append(
                        {
                            "field": f"batch_{chunk_idx}",
                            "message": str(chunk_error),
                            "code": "BATCH_ERROR",
                        }
                    )

            return {
                "success": all_success and len(all_user_errors) == 0,
                "metafields_count": len(all_metafields),
                "total_batches": len(chunks),
                "user_errors": all_user_errors,
            }
        except Exception as e:
            logger.error(
                f"Error setting product file_reference metafields in bulk for product {product_id}: {e}"
            )
            return {"success": False, "error": str(e)}

    def check_if_preview_ready(self, theme_id: str, user_id: str) -> Dict:
        """
        Check if theme preview is ready
        """
        try:
            response = self._make_request(
                f"themes/{theme_id}.json", method="GET", user_id=user_id
            )

            # Check if response contains theme data
            if "theme" in response:
                return {"success": True, "theme": response["theme"]}
            else:
                return {
                    "success": False,
                    "error": f"No theme data in response: {response}",
                }

        except Exception as e:
            logger.error(f"Error checking theme preview: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_theme_asset(self, theme_id: str, asset_key: str, user_id: str) -> Dict:
        """
        Get a theme asset to check if it exists

        Args:
            theme_id: The Shopify theme ID
            asset_key: Path in theme (e.g., "sections/kluck-ai-section-1.liquid")
            user_id: User ID for authentication

        Returns:
            Dict containing success status and asset data if exists
        """
        try:
            credentials = self._get_user_credentials(user_id)
            shop_url = credentials.get("shop_url", "")
            access_token = credentials.get("access_token")

            if not shop_url or not access_token:
                raise Exception("Invalid Shopify credentials")

            # Clean shop URL
            shop_domain = shop_url.replace("https://", "").replace("http://", "")
            if not shop_domain.endswith(".myshopify.com"):
                shop_domain = f"{shop_domain}.myshopify.com"

            # Construct the full URL
            url = f"https://{shop_domain}/admin/api/{self.api_version}/themes/{theme_id}/assets.json?asset[key]={asset_key}"

            headers = {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": access_token,
            }

            response = requests.get(url, headers=headers, verify=False)

            if response.status_code == 200:
                asset_data = response.json()
                return {
                    "success": True,
                    "exists": True,
                    "asset": asset_data.get("asset"),
                }
            elif response.status_code == 404:
                return {"success": True, "exists": False}
            else:
                logger.warning(
                    f"Unexpected status code when checking asset {asset_key}: {response.status_code}"
                )
                return {
                    "success": False,
                    "exists": False,
                    "error": f"Status code: {response.status_code}",
                }

        except Exception as e:
            logger.error(f"Error checking theme asset: {str(e)}")
            return {"success": False, "exists": False, "error": str(e)}

    def get_access_scopes(self, user_id: str) -> Dict[str, Any]:
        """Return granted Admin API scopes for the installed app token."""
        try:
            credentials = self._get_user_credentials(user_id)
            shop_url = credentials.get("shop_url", "")
            access_token = credentials.get("access_token")
            if not shop_url or not access_token:
                return {"success": False, "scopes": [], "error": "Missing credentials"}

            shop_domain = shop_url.replace("https://", "").replace("http://", "")
            if not shop_domain.endswith(".myshopify.com"):
                shop_domain = f"{shop_domain}.myshopify.com"

            url = (
                f"https://{shop_domain}/admin/api/{self.api_version}/"
                "oauth/access_scopes.json"
            )
            headers = {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": access_token,
            }
            response = requests.get(url, headers=headers, verify=False, timeout=30)
            if response.status_code != 200:
                return {
                    "success": False,
                    "scopes": [],
                    "error": f"status {response.status_code}: {response.text[:200]}",
                }
            scopes = [
                s.get("handle")
                for s in (response.json().get("access_scopes") or [])
                if isinstance(s, dict) and s.get("handle")
            ]
            return {"success": True, "scopes": scopes}
        except Exception as e:
            logger.error(f"Error fetching access scopes: {e}")
            return {"success": False, "scopes": [], "error": str(e)}

    def upsert_theme_file_graphql(
        self,
        theme_id: str,
        asset_key: str,
        *,
        text_value: Optional[str] = None,
        base64_value: Optional[str] = None,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Create/update a theme file via GraphQL themeFilesUpsert.
        Preferred when REST Asset PUT returns Shopify's permission-style 404.
        """
        theme_gid = self._to_gid("OnlineStoreTheme", theme_id)
        if text_value is not None:
            body = {"type": "TEXT", "value": text_value}
        elif base64_value is not None:
            body = {"type": "BASE64", "value": base64_value}
        else:
            return {"success": False, "error": "No file body provided"}

        mutation = """
        mutation themeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
          themeFilesUpsert(themeId: $themeId, files: $files) {
            upsertedThemeFiles { filename }
            userErrors { field message code }
            job { id done }
          }
        }
        """
        try:
            result = self._make_graphql_request(
                mutation,
                {
                    "themeId": theme_gid,
                    "files": [{"filename": asset_key, "body": body}],
                },
                user_id,
            )
            payload = ((result or {}).get("data") or {}).get("themeFilesUpsert") or {}
            user_errors = payload.get("userErrors") or []
            if user_errors:
                messages = [
                    e.get("message") or e.get("code") or str(e)
                    for e in user_errors
                    if isinstance(e, dict)
                ]
                return {
                    "success": False,
                    "error": "; ".join(messages) or "themeFilesUpsert userErrors",
                    "user_errors": user_errors,
                }

            job = payload.get("job") or {}
            job_id = job.get("id")
            if job_id and not job.get("done"):
                # Small text upserts are usually sync; poll briefly if Shopify queued work.
                for _ in range(8):
                    time.sleep(0.4)
                    job_result = self._make_graphql_request(
                        """
                        query ThemeFileJob($id: ID!) {
                          job(id: $id) { id done }
                        }
                        """,
                        {"id": job_id},
                        user_id,
                    )
                    job_node = ((job_result or {}).get("data") or {}).get("job") or {}
                    if job_node.get("done"):
                        break

            upserted = payload.get("upsertedThemeFiles") or []
            logger.info(
                f"✅ GraphQL themeFilesUpsert ok for {asset_key} "
                f"(theme={theme_id}, files={len(upserted)})"
            )
            return {
                "success": True,
                "asset_key": asset_key,
                "theme_id": theme_id,
                "method": "graphql",
                "upserted": upserted,
            }
        except Exception as e:
            logger.error(f"GraphQL themeFilesUpsert failed for {asset_key}: {e}")
            return {"success": False, "error": str(e), "method": "graphql"}

    def probe_theme_asset_write(self, theme_id: str, user_id: str) -> Dict[str, Any]:
        """
        Verify the app token can write theme files before bulk publish.
        Shopify returns REST 404 (Not Found) when write_themes / Theme API
        exemption is missing — even though GET assets still works.
        """
        probe_key = "snippets/kluck-ai-write-probe.liquid"
        probe_value = "{% comment %}kluck write probe{% endcomment %}\n"
        scopes_info = self.get_access_scopes(user_id)
        scopes = scopes_info.get("scopes") or []
        has_write_themes = "write_themes" in scopes

        rest = self.update_theme_asset_content(
            theme_id=theme_id,
            asset_key=probe_key,
            text_value=probe_value,
            user_id=user_id,
            allow_graphql_fallback=True,
        )
        if rest.get("success"):
            return {
                "success": True,
                "method": rest.get("method") or "rest",
                "scopes": scopes,
                "has_write_themes": has_write_themes,
            }

        return {
            "success": False,
            "error": rest.get("error") or "Theme asset write probe failed",
            "scopes": scopes,
            "has_write_themes": has_write_themes,
            "response_text": rest.get("response_text"),
        }

    def update_theme_asset_content(
        self,
        theme_id: str,
        asset_key: str,
        user_id: str,
        *,
        text_value: Optional[str] = None,
        base64_value: Optional[str] = None,
        allow_graphql_fallback: bool = True,
    ) -> Dict[str, Any]:
        """Upload theme file content (text or base64) via REST, then GraphQL fallback."""
        try:
            credentials = self._get_user_credentials(user_id)
            shop_url = credentials.get("shop_url", "")
            access_token = credentials.get("access_token")
            if not shop_url or not access_token:
                raise Exception("Invalid Shopify credentials")

            shop_domain = shop_url.replace("https://", "").replace("http://", "")
            if not shop_domain.endswith(".myshopify.com"):
                shop_domain = f"{shop_domain}.myshopify.com"

            theme_id_cleaned = str(theme_id).split("/")[-1]
            url = (
                f"https://{shop_domain}/admin/api/{self.api_version}/"
                f"themes/{theme_id_cleaned}/assets.json"
            )
            logger.info(f"Uploading to URL: {url}")

            if text_value is not None:
                payload = {"asset": {"key": asset_key, "value": text_value}}
            elif base64_value is not None:
                payload = {"asset": {"key": asset_key, "attachment": base64_value}}
            else:
                return {"success": False, "error": "No file body provided"}

            headers = {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": access_token,
            }
            # 429 = rate limit. 409/423 = theme still copying. 5xx = transient.
            # 404 right after a theme duplicate also means the copy is not ready yet.
            retryable_statuses = {404, 409, 423, 429, 500, 502, 503, 504}
            max_attempts = 6
            response = None
            for attempt in range(max_attempts):
                try:
                    response = requests.put(
                        url,
                        headers=headers,
                        data=json.dumps(payload),
                        verify=False,
                        timeout=90,
                    )
                except requests.RequestException as req_err:
                    if attempt >= max_attempts - 1:
                        logger.error(
                            f"❌ Failed to upload {asset_key} after network errors: {req_err}"
                        )
                        return {"success": False, "error": str(req_err)}
                    wait_s = min(8.0, 0.8 * (1.6**attempt))
                    logger.warning(
                        "Asset PUT network error for %s (%s); sleeping %.1fs then retry %s/%s",
                        asset_key,
                        req_err,
                        wait_s,
                        attempt + 1,
                        max_attempts,
                    )
                    time.sleep(wait_s)
                    continue

                if response.status_code == 200:
                    logger.info(f"✅ Successfully uploaded {asset_key} to theme {theme_id}")
                    return {
                        "success": True,
                        "asset_key": asset_key,
                        "theme_id": theme_id,
                        "method": "rest",
                        "response": response.json(),
                    }

                if response.status_code in retryable_statuses and attempt < max_attempts - 1:
                    # Don't burn every 404 on GraphQL yet — a fresh theme copy returns 404
                    # until Shopify finishes. After a few waits, fall through to GraphQL.
                    if response.status_code == 404 and attempt >= 2:
                        break
                    retry_after = response.headers.get("Retry-After")
                    try:
                        wait_s = float(retry_after) if retry_after is not None else None
                    except (TypeError, ValueError):
                        wait_s = None
                    if wait_s is None:
                        wait_s = min(12.0, 0.8 * (1.6**attempt))
                    wait_s = max(0.5, min(wait_s, 30.0))
                    logger.warning(
                        "Asset PUT %s for %s; sleeping %.1fs then retry %s/%s",
                        response.status_code,
                        asset_key,
                        wait_s,
                        attempt + 1,
                        max_attempts,
                    )
                    time.sleep(wait_s)
                    continue
                break

            status_code = response.status_code if response is not None else 0
            response_text = response.text if response is not None else ""
            logger.error(f"❌ Failed to upload {asset_key}: {status_code}")
            logger.error(f"Response: {response_text}")

            # Shopify often returns 404 (not 403) when Asset PUT is blocked.
            if allow_graphql_fallback and status_code in (401, 403, 404):
                logger.warning(
                    f"REST Asset PUT {status_code} for {asset_key}; "
                    "retrying via GraphQL themeFilesUpsert"
                )
                gql = self.upsert_theme_file_graphql(
                    theme_id=theme_id_cleaned,
                    asset_key=asset_key,
                    text_value=text_value,
                    base64_value=base64_value,
                    user_id=user_id,
                )
                if gql.get("success"):
                    return gql
                return {
                    "success": False,
                    "error": (
                        f"Failed to upload: REST {status_code}; "
                        f"GraphQL: {gql.get('error')}"
                    ),
                    "response_text": response_text,
                    "graphql_error": gql.get("error"),
                }

            return {
                "success": False,
                "error": f"Failed to upload: {status_code}",
                "response_text": response_text,
            }
        except Exception as e:
            logger.error(f"Error updating theme asset content: {str(e)}")
            return {"success": False, "error": str(e)}

    def update_theme_asset(
        self, theme_id: str, file_path: str, asset_key: str, user_id: str
    ) -> Dict:
        """
        Upload/update a single file to an existing Shopify theme

        Args:
            theme_id: The Shopify theme ID to update
            file_path: Local path to the file to upload
            asset_key: Path in theme (e.g., "templates/product.health-beauty-1-123zam.json")
            user_id: User ID for authentication

        Returns:
            Dict containing success status and details
        """
        try:
            # Determine if file is text-based (JSON, Liquid, HTML, CSS, JS)
            # or binary (images, fonts, etc.)
            text_extensions = {
                ".json", ".liquid", ".html", ".css", ".js",
                ".svg", ".txt", ".scss",
            }
            file_ext = Path(file_path).suffix.lower()
            is_text_file = file_ext in text_extensions

            if is_text_file:
                with open(file_path, "r", encoding="utf-8") as f:
                    file_content = f.read()
                return self.update_theme_asset_content(
                    theme_id=theme_id,
                    asset_key=asset_key,
                    user_id=user_id,
                    text_value=file_content,
                    allow_graphql_fallback=True,
                )

            with open(file_path, "rb") as f:
                file_content = base64.b64encode(f.read()).decode("utf-8")
            return self.update_theme_asset_content(
                theme_id=theme_id,
                asset_key=asset_key,
                user_id=user_id,
                base64_value=file_content,
                allow_graphql_fallback=True,
            )

        except Exception as e:
            logger.error(f"Error updating theme asset: {str(e)}")
            return {"success": False, "error": str(e)}

    def set_product_template_suffix(
        self, product_id: str, template_suffix: Optional[str], user_id: str
    ) -> Dict[str, Any]:
        """
        Set (or clear) the templateSuffix on a product.

        Args:
            product_id: Shopify product ID (numeric or GID)
            template_suffix: The template suffix to set. Use None/"" to clear/reset to default.
            user_id: User ID for authentication
        """
        try:
            normalized = template_suffix
            if isinstance(normalized, str):
                cleaned = normalized.strip()
                if cleaned.lower() in {"", "null", "none", "not provided"}:
                    normalized = None
                else:
                    normalized = cleaned

            mutation = """
            mutation SetTemplateSuffix($input: ProductInput!) {
              productUpdate(input: $input) {
                product { id templateSuffix }
                userErrors { field message }
              }
            }
            """

            input_obj: Dict[str, Any] = {
                "id": self._to_gid("Product", str(product_id)),
                # Include even if None so we can clear it (reset to default template)
                "templateSuffix": normalized,
            }
            variables = {"input": input_obj}
            result = self._make_graphql_request(mutation, variables, user_id)
            payload = ((result or {}).get("data") or {}).get("productUpdate") or {}
            errors = payload.get("userErrors") or []
            if errors:
                return {
                    "success": False,
                    "error": "; ".join(
                        [
                            e.get("message")
                            for e in errors
                            if isinstance(e, dict) and e.get("message")
                        ]
                    )
                    or "Unknown GraphQL error",
                    "user_errors": errors,
                }

            prod = payload.get("product") or {}
            return {
                "success": True,
                "product": {
                    "id": self._from_gid(prod.get("id")),
                    "template_suffix": prod.get("templateSuffix"),
                },
            }
        except Exception as e:
            logger.error(
                f"Error setting template suffix for product {product_id}: {str(e)}"
            )
            return {"success": False, "error": str(e)}

    def update_product_template(
        self, product_id: str, template_file: str, user_id: str
    ) -> Dict:
        """
        Update a product to use a specific template by setting the template_suffix on the product
        """
        try:
            # Extract template name from template_file (e.g., "product.health_beauty_1.json" -> "health_beauty_1")
            template_name = template_file.replace("product.", "").replace(".json", "")

            mutation = """
            mutation SetTemplate($input: ProductInput!) {
              productUpdate(input: $input) {
                product { id templateSuffix }
                userErrors { field message }
              }
            }
            """
            input_obj = {
                "id": self._to_gid("Product", str(product_id)),
                "templateSuffix": template_name,
                "status": "ACTIVE",
            }
            variables = {"input": input_obj}
            result = self._make_graphql_request(mutation, variables, user_id)
            payload = ((result or {}).get("data") or {}).get("productUpdate") or {}
            errors = payload.get("userErrors") or []
            if errors:
                return {
                    "success": False,
                    "error": "; ".join(
                        [e.get("message") for e in errors if e.get("message")]
                    )
                    or "Unknown GraphQL error",
                }
            prod = payload.get("product") or {}
            logger.info(
                f"Successfully set template suffix '{template_name}' for product {product_id}"
            )
            return {
                "success": True,
                "product": {
                    "id": self._from_gid(prod.get("id")),
                    "template_suffix": prod.get("templateSuffix"),
                },
            }

        except Exception as e:
            logger.error(
                f"Error updating product template for product {product_id}: {str(e)}"
            )
            return {"success": False, "error": str(e)}

    def is_product_published_to_online_store(
        self, product_id: str, user_id: str
    ) -> bool:
        """
        Check if a product is already published to the Online Store.
        """
        try:
            credentials = self._get_user_credentials(user_id)
            shop_domain = credentials.get("shop_url")
            access_token = credentials.get("access_token")

            if not shop_domain or not access_token:
                return False

            # Clean shop domain
            shop_domain = shop_domain.replace("https://", "").replace("http://", "")

            # Get Online Store publication ID
            publications_query = """
            query { publications(first: 20) { nodes { id name } } }
            """
            graphql_url = (
                f"https://{shop_domain}/admin/api/{self.api_version}/graphql.json"
            )
            graphql_headers = {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            }
            publications_response = requests.post(
                graphql_url, headers=graphql_headers, json={"query": publications_query}
            )
            publications_response.raise_for_status()
            publications_result = publications_response.json()
            publications_nodes = (
                ((publications_result or {}).get("data") or {}).get("publications")
                or {}
            ).get("nodes", [])

            # Find Online Store publication
            publication_id = None
            publication_gid = None
            for pub in publications_nodes:
                if (pub or {}).get("name") == "Online Store":
                    publication_id = (
                        self._from_gid(pub.get("id")) if pub.get("id") else None
                    )
                    publication_gid = pub.get("id")
                    break

            if not publication_id or not publication_gid:
                return False

            # Check if product is published to Online Store
            product_gid = self._to_gid("Product", str(product_id))
            check_query = """
            query($id: ID!, $pub: ID!) {
              product(id: $id) {
                publishedOnPublication(publicationId: $pub)
              }
            }
            """

            variables = {"id": product_gid, "pub": publication_gid}

            check_response = requests.post(
                graphql_url,
                headers=graphql_headers,
                json={"query": check_query, "variables": variables},
            )
            check_response.raise_for_status()
            check_result = check_response.json()

            if "errors" in check_result:
                logger.warning(
                    f"Error checking publication status: {check_result.get('errors')}"
                )
                return False

            product_node = (
                ((check_result or {}).get("data") or {}).get("product")
            ) or {}
            is_published = product_node.get("publishedOnPublication", False)

            return bool(is_published)

        except Exception as e:
            logger.warning(
                f"Error checking if product {product_id} is published: {str(e)}"
            )
            return False

    def publish_product_to_online_store(self, product_id: str, user_id: str) -> Dict:
        """
        Publish a product to the Online Store using GraphQL API.
        Checks if product is already published before attempting to publish.
        """
        try:
            # Check if product is already published
            if self.is_product_published_to_online_store(product_id, user_id):
                logger.info(
                    f"Product {product_id} is already published to Online Store, skipping publish"
                )
                return {
                    "success": True,
                    "already_published": True,
                    "message": "Product is already published to Online Store",
                }

            credentials = self._get_user_credentials(user_id)
            shop_domain = credentials.get("shop_url")
            access_token = credentials.get("access_token")

            if not shop_domain or not access_token:
                raise Exception("Invalid Shopify credentials")

            # Clean shop domain
            shop_domain = shop_domain.replace("https://", "").replace("http://", "")

            # 1. Fetch publications via GraphQL to get Online Store publication ID
            publications_query = """
            query { publications(first: 20) { nodes { id name } } }
            """
            graphql_url = (
                f"https://{shop_domain}/admin/api/{self.api_version}/graphql.json"
            )
            graphql_headers = {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            }
            publications_response = requests.post(
                graphql_url, headers=graphql_headers, json={"query": publications_query}
            )
            publications_response.raise_for_status()
            publications_result = publications_response.json()
            publications_nodes = (
                ((publications_result or {}).get("data") or {}).get("publications")
                or {}
            ).get("nodes", [])

            # Find Online Store publication
            publication_id = None
            publication_gid = None
            for pub in publications_nodes:
                if (pub or {}).get("name") == "Online Store":
                    publication_id = (
                        self._from_gid(pub.get("id")) if pub.get("id") else None
                    )
                    publication_gid = pub.get("id")
                    break

            if not publication_id or not publication_gid:
                raise Exception("Online Store publication not found")

            # 2. Publish product using GraphQL

            query = """
            mutation($id: ID!, $pub: ID!) {
              publishablePublish(id: $id, input: { publicationId: $pub }) {
                publishable {
                  ... on Product {
                    id
                    publishedOnPublication(publicationId: $pub)
                  }
                }
                userErrors { field message }
              }
            }
            """

            # Convert product ID and publication ID to GraphQL format (use _to_gid to handle already-wrapped GIDs)
            product_gid = self._to_gid("Product", str(product_id))

            variables = {"id": product_gid, "pub": publication_gid}

            graphql_payload = {"query": query, "variables": variables}

            graphql_response = requests.post(
                graphql_url, headers=graphql_headers, json=graphql_payload
            )
            graphql_response.raise_for_status()

            result = graphql_response.json()

            # Check for GraphQL errors
            if "errors" in result:
                raise Exception(f"GraphQL errors: {result['errors']}")

            publishable_publish = result.get("data", {}).get("publishablePublish", {})
            user_errors = publishable_publish.get("userErrors", [])

            if user_errors:
                raise Exception(f"Publishing errors: {user_errors}")

            logger.info(f"Successfully published product {product_id} to Online Store")
            return {
                "success": True,
                "publication_id": publication_id,
                "result": publishable_publish,
            }

        except Exception as e:
            logger.error(
                f"Error publishing product {product_id} to Online Store: {str(e)}"
            )
            return {"success": False, "error": str(e)}

    def create_media_images_for_product(
        self, product_id: str, images: List[Dict[str, str]], user_id: str
    ) -> Dict:
        """
        Create media (images) on a product using productCreateMedia.
        Each item in images: { 'url': str, 'alt': Optional[str] }.
        """
        try:
            mutation = """
            mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
              productCreateMedia(media: $media, productId: $productId) {
                media {
                  alt
                  mediaContentType
                  status
                  ... on MediaImage { image { url } }
                }
                mediaUserErrors { field message }
                product { id title }
              }
            }
            """

            product_gid = (
                product_id
                if str(product_id).startswith("gid://")
                else f"gid://shopify/Product/{product_id}"
            )

            media_inputs: List[Dict[str, Any]] = []
            for img in images or []:
                url = (img or {}).get("url")
                if not url:
                    continue
                media_inputs.append(
                    {
                        "alt": (img or {}).get("alt") or "",
                        "mediaContentType": "IMAGE",
                        "originalSource": url,
                    }
                )

            if not media_inputs:
                return {"success": False, "error": "No valid image URLs provided"}

            variables = {"media": media_inputs, "productId": product_gid}
            print("variables", variables)
            logger.info(
                f"Creating {len(media_inputs)} media image(s) on product {product_id}"
            )
            result = self._make_graphql_request(mutation, variables, user_id)

            payload = (
                ((result or {}).get("data") or {}).get("productCreateMedia")
            ) or {}
            media_user_errors = payload.get("mediaUserErrors") or []
            if media_user_errors:
                logger.warning(
                    f"productCreateMedia mediaUserErrors: {media_user_errors}"
                )

            media_nodes = payload.get("media") or []
            product_node = payload.get("product") or {}

            return {
                "success": True,
                "product_id": (
                    self._from_gid(product_node.get("id"))
                    if product_node.get("id")
                    else self._from_gid(product_gid)
                ),
                "media_count": len(media_nodes),
                "media": media_nodes,
                "media_user_errors": media_user_errors,
                "result": result,
            }
        except Exception as e:
            logger.error(f"Error creating media images for product {product_id}: {e}")
            return {"success": False, "error": str(e)}

    def get_product_media_image_ids(
        self, product_id: str, user_id: str, first: int = 100
    ) -> List[str]:
        """
        Return MediaImage IDs for a product (for deletion/replacement).
        """
        try:
            gid = self._to_gid("Product", str(product_id))
            query = """
            query GetProductMedia($id: ID!, $first: Int!) {
              product(id: $id) {
                id
                media(first: $first) {
                  edges {
                    node {
                      id
                      mediaContentType
                      ... on MediaImage {
                        image { url }
                      }
                    }
                  }
                }
              }
            }
            """
            variables = {"id": gid, "first": int(first)}
            result = self._make_graphql_request(query, variables, user_id)
            product_node = (((result or {}).get("data") or {}).get("product")) or {}
            media_edges = ((product_node.get("media") or {}).get("edges")) or []
            media_ids: List[str] = []
            for edge in media_edges:
                node = (edge or {}).get("node") or {}
                if (node.get("mediaContentType") or "").upper() == "IMAGE":
                    if node.get("id"):
                        media_ids.append(node["id"])
            return media_ids
        except Exception as e:
            logger.error(f"Error fetching media IDs for product {product_id}: {e}")
            return []

    def delete_product_media(
        self, product_id: str, media_ids: List[str], user_id: str
    ) -> Dict[str, Any]:
        """
        Delete media from a product using productDeleteMedia.
        """
        try:
            if not media_ids:
                return {
                    "success": True,
                    "deleted_count": 0,
                    "deleted_media_ids": [],
                    "deleted_product_image_ids": [],
                }

            import re

            def _normalize_gid(mid: str) -> str:
                if not mid:
                    return None
                s = str(mid).strip()
                if not s:
                    return None
                if s.startswith("gid://"):
                    return s
                # If numeric, assume MediaImage (best-effort)
                if s.isdigit():
                    return self._to_gid("MediaImage", s)
                return s

            remaining = [m for m in (_normalize_gid(x) for x in (media_ids or [])) if m]
            if not remaining:
                return {
                    "success": True,
                    "deleted_count": 0,
                    "deleted_media_ids": [],
                    "deleted_product_image_ids": [],
                }

            product_gid = self._to_gid("Product", str(product_id))
            mutation = """
            mutation ProductDeleteMedia($mediaIds: [ID!]!, $productId: ID!) {
              productDeleteMedia(mediaIds: $mediaIds, productId: $productId) {
                deletedMediaIds
                deletedProductImageIds
                mediaUserErrors { field message }
              }
            }
            """

            deleted_media: List[str] = []
            deleted_product_images: List[str] = []
            all_errors: List[Dict[str, Any]] = []

            # Shopify can reject the whole request if one ID is invalid.
            # Delete in batches, and if a "does not exist" ID appears, drop it and continue.
            batch_size = 50
            i = 0
            while i < len(remaining):
                batch = remaining[i : i + batch_size]
                i += batch_size

                variables = {"productId": product_gid, "mediaIds": batch}
                result = self._make_graphql_request(mutation, variables, user_id)
                payload = (
                    ((result or {}).get("data") or {}).get("productDeleteMedia")
                ) or {}
                errors = payload.get("mediaUserErrors") or []
                if errors:
                    all_errors.extend(errors)

                    # Remove any IDs explicitly mentioned as non-existent
                    # Example: "Media id gid://shopify/MediaImage/123 does not exist"
                    bad_ids: List[str] = []
                    for e in errors:
                        msg = str((e or {}).get("message") or "")
                        m = re.search(r"(gid://shopify/[A-Za-z]+/\d+)", msg)
                        if m:
                            bad_ids.append(m.group(1))
                    if bad_ids:
                        # Filter them out and continue (best-effort deletion)
                        remaining = [
                            mid for mid in remaining if mid not in set(bad_ids)
                        ]
                    continue

                deleted_media.extend(payload.get("deletedMediaIds") or [])
                deleted_product_images.extend(
                    payload.get("deletedProductImageIds") or []
                )

            success = len(all_errors) == 0
            return {
                "success": success,
                "deleted_count": len(deleted_media),
                "deleted_media_ids": deleted_media,
                "deleted_product_image_ids": deleted_product_images,
                "errors": all_errors,
            }
        except Exception as e:
            logger.error(f"Error deleting media for product {product_id}: {e}")
            return {"success": False, "error": str(e)}

    def list_product_image_ids(self, product_id: str, user_id: str) -> List[str]:
        """
        List REST ProductImage IDs for a product.
        This is used as a reliable fallback for "replace images".
        """
        try:
            if not product_id:
                return []
            pid = self._from_gid(str(product_id))
            endpoint = f"products/{pid}/images.json?limit=250"
            images = self._fetch_all_paginated(endpoint, user_id, "images") or []
            ids: List[str] = []
            for img in images:
                img_id = (img or {}).get("id")
                if img_id is not None:
                    ids.append(str(img_id))
            return ids
        except Exception as e:
            logger.error(f"Error listing product images for product {product_id}: {e}")
            return []

    def delete_product_image(
        self, product_id: str, image_id: str, user_id: str
    ) -> bool:
        """
        Delete a single REST ProductImage from a product.
        """
        try:
            if not product_id or not image_id:
                return False
            pid = self._from_gid(str(product_id))
            iid = self._from_gid(str(image_id))
            endpoint = f"products/{pid}/images/{iid}.json"
            self._make_request(endpoint, method="DELETE", data=None, user_id=user_id)
            return True
        except Exception as e:
            logger.warning(
                f"Failed deleting product image {image_id} for product {product_id}: {e}"
            )
            return False

    def delete_all_product_images(
        self, product_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Delete all REST ProductImage images from a product.
        Returns counts and any failures.
        """
        image_ids = self.list_product_image_ids(product_id, user_id)
        if not image_ids:
            return {"success": True, "deleted_count": 0, "failed": []}

        failed: List[str] = []
        deleted = 0
        for iid in image_ids:
            ok = self.delete_product_image(product_id, iid, user_id)
            if ok:
                deleted += 1
            else:
                failed.append(str(iid))
        return {"success": len(failed) == 0, "deleted_count": deleted, "failed": failed}

    def _parse_next_link(self, link_header: str) -> str:
        """Parse Link header to get next page URL"""
        if not link_header:
            return None
        for part in link_header.split(","):
            if 'rel="next"' in part:
                start = part.find("<")
                end = part.find(">", start + 1)
                return part[start + 1 : end] if start != -1 and end != -1 else None
        return None

    def _get_shop_timezone(self, user_id: str) -> str:
        """Fetch shop timezone from API (matches dashboard analytics)"""
        try:
            query = """
            query GetShopTimezone {
              shop {
                ianaTimezone
              }
            }
            """
            result = self._make_graphql_request(query, None, user_id)
            shop_node = (((result or {}).get("data") or {}).get("shop")) or {}
            return shop_node.get("ianaTimezone") or "UTC"
        except Exception as e:
            logger.error(f"Error fetching shop timezone: {e}")
            return "UTC"

    def _shop_range_to_utc_iso(
        self, start_date_str: str, end_date_str: str, shop_tz: str
    ) -> tuple:
        """Return inclusive start and exclusive end (next day) in UTC ISO"""
        from datetime import datetime, timedelta
        from zoneinfo import ZoneInfo

        tz = ZoneInfo(shop_tz)
        start_local = datetime.strptime(start_date_str, "%Y-%m-%d").replace(tzinfo=tz)
        end_local = datetime.strptime(end_date_str, "%Y-%m-%d").replace(
            tzinfo=tz
        ) + timedelta(days=1)

        from datetime import timezone as dt_timezone

        return (
            start_local.astimezone(dt_timezone.utc).isoformat(),
            end_local.astimezone(dt_timezone.utc).isoformat(),
        )

    def _fetch_all_paginated(
        self, endpoint: str, user_id: str, resource_key: str
    ) -> List[Dict]:
        """
        Fetch all items using Shopify's Link header pagination (handles more than 250 items)
        """
        all_items = []
        url = endpoint

        try:
            while url:
                # Make request and get raw response with headers
                credentials = self._get_user_credentials(user_id)
                shop_url = credentials["shop_url"]
                access_token = credentials["access_token"]
                api_version = credentials.get("api_version", "2025-10")

                # Ensure shop_url has https:// prefix
                if not shop_url.startswith("http"):
                    shop_url = f"https://{shop_url}"

                # Construct full URL
                if not url.startswith("http"):
                    full_url = f"{shop_url}/admin/api/{api_version}/{url}"
                else:
                    full_url = url

                headers = {
                    "X-Shopify-Access-Token": access_token,
                    "Accept": "application/json",
                }

                response = requests.get(full_url, headers=headers, timeout=30)
                response.raise_for_status()

                data = response.json()
                items = data.get(resource_key, [])
                all_items.extend(items)

                # Get next page URL from Link header
                link_header = response.headers.get("Link", "")
                next_url = self._parse_next_link(link_header)

                if not next_url:
                    break

                url = next_url
                time.sleep(0.1)  # Rate limiting

        except Exception as e:
            logger.error(f"Error in pagination for {endpoint}: {e}")
            # Return what we have so far
            return all_items

        return all_items

    def get_store_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive store insights including products, orders, and sales data

        This function now uses:
        - Proper Link header pagination (instead of since_id)
        - Shop timezone for accurate date range calculation
        - Correct sales calculation matching Shopify dashboard
        - Payment gateway and daily breakdown tracking
        """
        try:
            insights = {"products": {}, "orders": {}, "sales": {}, "store_info": {}}

            # Get products data
            try:
                # --- GraphQL: product counts by status ---
                # Shopify GraphQL returns a Count object: productsCount { count }
                count_query = """
                query ProductsCount($query: String!) {
                  productsCount(query: $query) {
                    count
                  }
                }
                """

                def _count(q: str) -> int:
                    try:
                        r = self._make_graphql_request(
                            count_query, {"query": q}, user_id
                        )
                        pc = (((r or {}).get("data") or {}).get("productsCount")) or {}
                        return int(
                            (pc.get("count") if isinstance(pc, dict) else pc) or 0
                        )
                    except Exception as _e:
                        logger.warning(f"ProductsCount failed for query '{q}': {_e}")
                        return 0

                published_products = _count("status:active")
                draft_products = _count("status:draft")
                archived_products = _count("status:archived")
                total_products = published_products + draft_products + archived_products

                # --- GraphQL: recent products (titles) ---
                recent_products_query = """
                query RecentProducts($first: Int!) {
                  products(first: $first, sortKey: UPDATED_AT, reverse: true) {
                    edges { node { title } }
                  }
                }
                """
                rp = self._make_graphql_request(
                    recent_products_query, {"first": 10}, user_id
                )
                rp_edges = (
                    (((rp or {}).get("data") or {}).get("products") or {}).get("edges")
                ) or []
                product_names = [
                    (((e or {}).get("node")) or {}).get("title")
                    for e in rp_edges
                    if (((e or {}).get("node")) or {}).get("title")
                ]

                # --- GraphQL: inventory sample (sum variant inventoryQuantity) ---
                inventory_query = """
                query InventorySample($first: Int!) {
                  products(first: $first, sortKey: UPDATED_AT, reverse: true) {
                    edges {
                      node {
                        variants(first: 100) {
                          edges { node { inventoryQuantity } }
                        }
                      }
                    }
                  }
                }
                """
                inv = self._make_graphql_request(
                    inventory_query, {"first": 50}, user_id
                )
                inv_edges = (
                    (((inv or {}).get("data") or {}).get("products") or {}).get("edges")
                ) or []
                total_inventory = 0
                for pe in inv_edges:
                    pnode = (pe or {}).get("node") or {}
                    v_edges = ((pnode.get("variants") or {}).get("edges")) or []
                    for ve in v_edges:
                        v = (ve or {}).get("node") or {}
                        try:
                            qty = int(v.get("inventoryQuantity") or 0)
                        except Exception:
                            qty = 0
                        if qty:
                            total_inventory += qty

                insights["products"] = {
                    "total_count": total_products,
                    "published_count": published_products,
                    "draft_count": draft_products,
                    "archived_count": archived_products,
                    "total_inventory": total_inventory,
                    "product_names": product_names,
                }
            except Exception as e:
                logger.error(f"Error fetching products data: {e}")
                insights["products"] = {"error": str(e)}

            # Get orders data
            try:
                # Get shop timezone for accurate date range calculation
                from datetime import datetime, timedelta

                shop_tz = self._get_shop_timezone(user_id)

                # Calculate date for last 30 days in shop timezone
                today = datetime.now()
                thirty_days_ago = today - timedelta(days=30)

                start_date_str = thirty_days_ago.strftime("%Y-%m-%d")
                end_date_str = today.strftime("%Y-%m-%d")

                # Convert to UTC ISO format
                created_at_min, created_at_max = self._shop_range_to_utc_iso(
                    start_date_str, end_date_str, shop_tz
                )

                logger.info(f"Shop timezone: {shop_tz}")
                logger.info(
                    f"Fetching orders from last 30 days. Date range (UTC): {created_at_min} → {created_at_max}"
                )

                # Specify fields to fetch for efficiency and accuracy
                fields = [
                    "id",
                    "name",
                    "created_at",
                    "total_discounts",
                    "total_tax",
                    "total_price",
                    "current_total_price",
                    "total_shipping_price_set",
                    "line_items",
                    "refunds",
                    "payment_gateway_names",
                    "gateway",
                    "customer",
                    "financial_status",
                    "fulfillment_status",
                    "cancelled_at",
                    "test",
                    "currency",
                    "shipping_address",
                    "billing_address",
                    "email",
                    "contact_email",
                    "phone",
                    "note",
                    "note_attributes",
                ]
                fields_param = ",".join(fields)

                # Get ALL orders from last 30 days using pagination with proper Link header handling
                all_orders = self._fetch_all_paginated(
                    f"orders.json?status=any&created_at_min={created_at_min}&created_at_max={created_at_max}&limit=250&fields={fields_param}&order=created_at+asc",
                    user_id,
                    "orders",
                )

                logger.info(
                    f"Total orders fetched from last 30 days: {len(all_orders)}"
                )

                # Filter to match Shopify's sales calculation
                # Exclude: test orders, cancelled orders, and archived orders
                valid_orders = [
                    o
                    for o in all_orders
                    # if not o.get('test', False)  # Exclude test orders
                    if o.get("cancelled_at") is None  # Not cancelled
                    and o.get("financial_status") not in ["voided"]  # Not voided
                ]

                total_orders = len(valid_orders)
                fulfilled_orders = len(
                    [
                        o
                        for o in valid_orders
                        if o.get("fulfillment_status") == "fulfilled"
                    ]
                )
                pending_orders = len(
                    [
                        o
                        for o in valid_orders
                        if o.get("fulfillment_status") == "pending"
                        or o.get("fulfillment_status") is None
                    ]
                )

                # Calculate sales breakdown using EXACT methodology from working code
                orders_count = 0
                items_sold = 0
                gross_sales = 0.0
                total_discounts = 0.0
                total_shipping = 0.0
                total_taxes = 0.0
                returns_value = 0.0
                unique_customers = set()
                new_customers = 0
                gateways = {}

                from collections import defaultdict

                daily_sales = defaultdict(float)
                daily_orders = defaultdict(int)

                def money_to_float(amount):
                    try:
                        return float(amount)
                    except:
                        return 0.0

                for o in valid_orders:
                    orders_count += 1

                    # Customer tracking
                    cust = o.get("customer") or {}
                    cid = cust.get("id")
                    if cid:
                        unique_customers.add(cid)
                        if int(cust.get("orders_count", 0)) == 1:
                            new_customers += 1

                    # Items sold and gross sales
                    for li in o.get("line_items", []):
                        qty = int(li.get("quantity", 0) or 0)
                        price = money_to_float(li.get("price"))
                        items_sold += qty
                        gross_sales += price * qty

                    # Order-level monetary fields
                    total_discounts += money_to_float(o.get("total_discounts"))
                    total_shipping += money_to_float(
                        (o.get("total_shipping_price_set") or {})
                        .get("shop_money", {})
                        .get("amount")
                    )
                    total_taxes += money_to_float(o.get("total_tax"))

                    # Refunds (returns)
                    for r in o.get("refunds", []):
                        returns_value += money_to_float(
                            r.get("transactions", [{}])[0].get("amount", 0)
                        )

                    # Payment gateway tracking
                    gw = (
                        o.get("gateway")
                        or (o.get("payment_gateway_names") or [None])[0]
                    )
                    if gw not in gateways:
                        gateways[gw or "unknown"] = {"orders": 0, "net_value": 0.0}

                    net_val = money_to_float(
                        o.get("current_total_price")
                    ) or money_to_float(o.get("total_price"))
                    gateways[gw or "unknown"]["orders"] += 1
                    gateways[gw or "unknown"]["net_value"] += net_val

                    # Daily breakdown
                    day = o.get("created_at", "")[:10]
                    daily_sales[day] += net_val
                    daily_orders[day] += 1

                # Net sales = gross - discounts + shipping + taxes - returns
                net_sales = (
                    gross_sales
                    - total_discounts
                    + total_shipping
                    + total_taxes
                    - returns_value
                )
                total_sales = net_sales

                logger.info(
                    f"Sales Calculation - Gross: {gross_sales}, Discounts: {total_discounts}, Returns: {returns_value}, Shipping: {total_shipping}, Taxes: {total_taxes}, Net: {net_sales}, Total: {total_sales}"
                )

                # Get currency from first order if available
                currency = (
                    valid_orders[0].get("currency", "USD") if valid_orders else "USD"
                )

                # Calculate average order value: Total Sales / Number of Orders
                avg_order_value = total_sales / total_orders if total_orders > 0 else 0

                # Calculate product-based metrics from valid orders only
                product_metrics = {}
                for order in valid_orders:
                    line_items = order.get("line_items", [])
                    for item in line_items:
                        product_id = item.get("product_id")
                        product_title = item.get("title", "Unknown Product")
                        quantity = item.get("quantity", 0)
                        price = float(item.get("price", 0))
                        item_total = price * quantity

                        if product_id:
                            if product_id not in product_metrics:
                                product_metrics[product_id] = {
                                    "product_id": product_id,
                                    "product_name": product_title,
                                    "order_count": 0,
                                    "total_quantity": 0,
                                    "total_sales": 0,
                                }

                            product_metrics[product_id]["order_count"] += 1
                            product_metrics[product_id]["total_quantity"] += quantity
                            product_metrics[product_id]["total_sales"] += item_total

                # Convert to list and sort by total sales
                product_sales_list = list(product_metrics.values())
                product_sales_list.sort(key=lambda x: x["total_sales"], reverse=True)

                # Round sales values
                for product in product_sales_list:
                    product["total_sales"] = round(product["total_sales"], 2)

                # Payment gateways breakdown
                payment_gateways_breakdown = {
                    k: {
                        "orders": int(v["orders"]),
                        "net_value": round(v["net_value"], 2),
                    }
                    for k, v in gateways.items()
                }

                # Daily breakdown
                daily_breakdown = [
                    {"date": d, "orders": daily_orders[d], "net_sales": round(v, 2)}
                    for d, v in sorted(daily_sales.items())
                ]

                # Individual order details
                order_list = []
                logger.info(
                    f"Processing {len(valid_orders)} valid orders for order details"
                )

                for idx, o in enumerate(valid_orders):
                    # Log first 2 orders to debug
                    if idx == 0:
                        logger.info(
                            f"\n=== Sample Order {idx+1} - ID: {o.get('id')}, Name: {o.get('name')} ==="
                        )
                        logger.info(f"Order Keys: {list(o.keys())}")
                        logger.info(f"Note attributes: {o.get('note_attributes')}")

                    # Extract custom customer data from note_attributes
                    note_attrs = o.get("note_attributes", [])
                    custom_data = {}
                    if note_attrs and isinstance(note_attrs, list):
                        for attr in note_attrs:
                            if isinstance(attr, dict):
                                name = attr.get("name", "").lower()
                                value = attr.get("value", "")

                                # Map common field names
                                if name in ["full name", "fullname", "name"]:
                                    custom_data["name"] = value
                                elif name in ["email", "email address", "e-mail"]:
                                    custom_data["email"] = value
                                elif name in [
                                    "phone number",
                                    "phone",
                                    "phonenumber",
                                    "mobile",
                                ]:
                                    custom_data["phone"] = value
                                elif name in [
                                    "address",
                                    "street address",
                                    "full address",
                                ]:
                                    custom_data["address"] = value
                                elif name in ["emirate", "state", "province", "region"]:
                                    custom_data["emirate"] = value
                                elif name in ["area", "district", "locality"]:
                                    custom_data["area"] = value
                                elif name in ["city"]:
                                    custom_data["city"] = value

                    # Log extracted custom data for first order
                    if idx == 0:
                        logger.info(f"Extracted custom_data: {custom_data}")

                    customer = o.get("customer")

                    # Handle customer name - prioritize note_attributes
                    customer_name = None
                    customer_email = None
                    customer_phone = None

                    # First try custom data from note_attributes
                    if custom_data.get("name"):
                        customer_name = custom_data["name"]
                    # Then try standard customer object
                    elif customer:
                        first_name = customer.get("first_name", "").strip()
                        last_name = customer.get("last_name", "").strip()
                        customer_name = f"{first_name} {last_name}".strip()
                        customer_email = customer.get("email")
                        customer_phone = customer.get("phone")

                    # If no customer name from customer object, try contact info from order
                    if not customer_name:
                        contact_email = o.get("contact_email") or o.get("email")
                        if contact_email:
                            customer_name = contact_email.split("@")[0]
                            customer_email = contact_email
                        else:
                            customer_name = "Guest Customer"

                    # Get email from custom data if available (prioritize note_attributes)
                    if custom_data.get("email"):
                        customer_email = custom_data["email"]
                    # Get email if not already set
                    elif not customer_email:
                        customer_email = o.get("contact_email") or o.get("email")

                    # Get phone from custom data if available
                    if custom_data.get("phone"):
                        customer_phone = custom_data["phone"]

                    # Get order name (e.g., #1001)
                    order_name = o.get("name", f"#{o.get('id', 'N/A')}")

                    # Calculate total items in order
                    total_items = sum(
                        li.get("quantity", 0) for li in o.get("line_items", [])
                    )

                    # Format address - prioritize custom data from note_attributes
                    formatted_address = None

                    if (
                        custom_data.get("address")
                        or custom_data.get("area")
                        or custom_data.get("emirate")
                    ):
                        # Build address from custom data
                        address_parts = []

                        if custom_data.get("address"):
                            address_parts.append(custom_data["address"])
                        if custom_data.get("area"):
                            address_parts.append(custom_data["area"])
                        if custom_data.get("emirate"):
                            address_parts.append(custom_data["emirate"])
                        if custom_data.get("city"):
                            address_parts.append(custom_data["city"])

                        formatted_address = ", ".join(filter(None, address_parts))
                    else:
                        # Fall back to standard shipping/billing address
                        shipping_address = o.get("shipping_address")
                        billing_address = o.get("billing_address")

                        # Use shipping address first, then billing
                        address = (
                            shipping_address if shipping_address else billing_address
                        )

                        if address:
                            address_parts = []

                            # Get name from address if available
                            addr_name = address.get("name")
                            if addr_name and addr_name != customer_name:
                                address_parts.append(addr_name)

                            # Street address
                            if address.get("address1"):
                                address_parts.append(address.get("address1"))
                            if address.get("address2"):
                                address_parts.append(address.get("address2"))

                            # City, Province/State
                            city_state = []
                            if address.get("city"):
                                city_state.append(address.get("city"))
                            if address.get("province") or address.get("province_code"):
                                city_state.append(
                                    address.get("province")
                                    or address.get("province_code")
                                )
                            if city_state:
                                address_parts.append(", ".join(city_state))

                            # Postal code and country
                            if address.get("zip"):
                                address_parts.append(address.get("zip"))
                            if address.get("country"):
                                address_parts.append(address.get("country"))

                            formatted_address = (
                                ", ".join(filter(None, address_parts))
                                if address_parts
                                else None
                            )

                            # Get phone from address if not already set
                            if not customer_phone:
                                customer_phone = address.get("phone")

                    # If still no phone, try from customer default address or order phone
                    if not customer_phone:
                        if customer and customer.get("default_address"):
                            customer_phone = customer.get("default_address", {}).get(
                                "phone"
                            )
                        elif o.get("phone"):
                            customer_phone = o.get("phone")

                    # Log order details for first few orders
                    if idx < 3:
                        logger.info(f"Order {order_name} extracted data:")
                        logger.info(f"  - Name: {customer_name}")
                        logger.info(f"  - Email: {customer_email}")
                        logger.info(f"  - Phone: {customer_phone}")
                        logger.info(f"  - Address: {formatted_address}")

                    order_list.append(
                        {
                            "order_id": o.get("id"),
                            "order_name": order_name,
                            "customer_name": customer_name,
                            "customer_email": customer_email,
                            "customer_phone": customer_phone,
                            "customer_address": formatted_address,
                            "created_at": o.get("created_at"),
                            "total_price": money_to_float(o.get("current_total_price"))
                            or money_to_float(o.get("total_price")),
                            "financial_status": o.get("financial_status"),
                            "fulfillment_status": o.get("fulfillment_status")
                            or "unfulfilled",
                            "total_items": total_items,
                            "currency": o.get("currency", currency),
                        }
                    )

                # Sort orders by created_at descending (newest first)
                order_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)

                insights["orders"] = {
                    "total_count": total_orders,
                    "fulfilled_count": fulfilled_orders,
                    "pending_count": pending_orders,
                    "total_sales": round(total_sales, 2),
                    "average_order_value": round(avg_order_value, 2),
                    "currency": currency,
                    "items_sold": items_sold,
                    "unique_customers": len(unique_customers),
                    "new_customers": new_customers,
                    "product_sales": product_sales_list[:20],  # Top 20 products
                    # Sales breakdown
                    "sales_breakdown": {
                        "gross_sales": round(gross_sales, 2),
                        "discounts": round(total_discounts, 2),
                        "returns": round(returns_value, 2),
                        "net_sales": round(net_sales, 2),
                        "shipping": round(total_shipping, 2),
                        "taxes": round(total_taxes, 2),
                        "total_sales": round(total_sales, 2),
                    },
                    "payment_gateways_breakdown": payment_gateways_breakdown,
                    "daily_breakdown": daily_breakdown,
                    "order_list": order_list,  # Individual order details
                }
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error fetching orders data: {e}")

                # Check if it's a permissions error
                if "403" in error_msg or "Forbidden" in error_msg:
                    insights["orders"] = {
                        "error": "permission_denied",
                        "message": "Orders data unavailable. Your Shopify app needs read_orders permission.",
                        "total_count": 0,
                        "fulfilled_count": 0,
                        "pending_count": 0,
                        "total_sales": 0,
                        "average_order_value": 0,
                        "currency": "USD",
                        "product_sales": [],
                        "order_list": [],
                    }
                else:
                    insights["orders"] = {
                        "error": "unknown",
                        "message": error_msg,
                        "total_count": 0,
                        "fulfilled_count": 0,
                        "pending_count": 0,
                        "total_sales": 0,
                        "average_order_value": 0,
                        "currency": "USD",
                        "product_sales": [],
                        "order_list": [],
                    }

            # Get shop/store info
            try:
                shop_query = """
                query GetShopInfo {
                  shop {
                    name
                    email
                    myshopifyDomain
                    currencyCode
                    ianaTimezone
                    createdAt
                    plan { displayName }
                  }
                }
                """
                shop_result = self._make_graphql_request(shop_query, None, user_id)
                shop = (((shop_result or {}).get("data") or {}).get("shop")) or {}
                plan = shop.get("plan") or {}

                insights["store_info"] = {
                    "name": shop.get("name"),
                    "email": shop.get("email"),
                    "domain": shop.get("myshopifyDomain"),
                    "currency": shop.get("currencyCode"),
                    "timezone": shop.get("ianaTimezone"),
                    "created_at": shop.get("createdAt"),
                    "plan_name": plan.get("displayName"),
                }
            except Exception as e:
                logger.error(f"Error fetching shop data: {e}")
                insights["store_info"] = {"error": str(e)}

            # Calculate sales statistics
            insights["sales"] = {
                "total_revenue": insights["orders"].get("total_sales", 0),
                "currency": insights["orders"].get("currency", "USD"),
                "average_order_value": insights["orders"].get("average_order_value", 0),
            }

            return insights

        except Exception as e:
            logger.error(f"Error getting store insights for user {user_id}: {e}")
            raise Exception(f"Failed to get store insights: {str(e)}")

    def disconnect_store(self, user_id: str) -> bool:
        """
        Disconnect a Shopify store by archiving it and removing the access token

        Args:
            user_id: The user's Cognito ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get user's stores
            stores = document_store.get_user_stores(user_id)

            if not stores or len(stores) == 0:
                logger.warning(f"No stores found for user {user_id}")
                return False

            # Archive all stores for this user (typically should only be one)
            success_count = 0
            for store in stores:
                store_id = store.get("PK")
                if store_id:
                    if document_store.archive_store(store_id):
                        success_count += 1
                        logger.info(
                            f"Successfully archived store {store_id} for user {user_id}"
                        )

            return success_count > 0

        except Exception as e:
            logger.error(f"Error disconnecting store for user {user_id}: {e}")
            return False

    def get_product_preview_url(
        self, product_id: str, user_id: str, theme_id: str = None
    ) -> str:
        """
        Get the product preview URL using GraphQL API with theme preview support

        Args:
            product_id: The Shopify product ID
            user_id: The user ID for credentials
            theme_id: Optional theme ID for preview

        Returns:
            The preview URL or None if not available
        """
        try:
            # Get user credentials
            credentials = self._get_user_credentials(user_id)
            shop_domain = (
                credentials.get("shop_url", "")
                .replace("https://", "")
                .replace("http://", "")
            )
            access_token = credentials.get("access_token")

            if not access_token or not shop_domain:
                logger.error(
                    f"Cannot get preview URL: missing credentials for user {user_id}"
                )
                return None

            # Fetch product details
            product_gid = self._to_gid("Product", str(product_id))
            query = """
            query getProduct($id: ID!) {
              product(id: $id) {
                id
                title
                handle
                status
                templateSuffix
              }
            }
            """
            variables = {"id": product_gid}

            graphql_url = f"https://{shop_domain}/admin/api/2025-10/graphql.json"
            graphql_headers = {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            }

            graphql_response = requests.post(
                graphql_url,
                headers=graphql_headers,
                json={"query": query, "variables": variables},
            )

            if not graphql_response.ok:
                logger.error(
                    f"GraphQL request failed with status {graphql_response.status_code}"
                )
                return None

            result = graphql_response.json()
            if result.get("errors"):
                logger.error(f"GraphQL errors: {result.get('errors')}")
                return None

            product = result.get("data", {}).get("product")
            if not product:
                logger.warning(f"Product not found: {product_id}")
                return None

            handle = product.get("handle")
            status = product.get("status")
            template_suffix = product.get("templateSuffix")

            # Build preview URL based on status and theme availability
            if status == "ACTIVE" and handle:
                if theme_id and template_suffix:
                    preview_url = f"https://{shop_domain}/products/{handle}?preview_theme_id={theme_id}&view={template_suffix}"
                elif theme_id:
                    preview_url = f"https://{shop_domain}/products/{handle}?preview_theme_id={theme_id}"
                else:
                    preview_url = f"https://{shop_domain}/products/{handle}"
                logger.info(f"Generated active product preview URL: {preview_url}")
                return preview_url
            else:
                # Draft product requires theme_id and uses product_preview endpoint
                if theme_id:
                    preview_url = f"https://{shop_domain}/products_preview?preview_theme_id={theme_id.split('/')[-1]}&product_id={str(product_id)}"
                    logger.info(f"Generated draft product preview URL: {preview_url}")
                    return preview_url
                else:
                    logger.warning(
                        f"Cannot generate preview URL for draft product without theme_id"
                    )
                    return None

        except Exception as e:
            logger.error(f"Error getting product preview URL: {str(e)}")
            return None


# Create singleton instance
shopify_utils = ShopifyUtils()
