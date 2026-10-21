"""
Bunny Storage + CDN client (replaces AWS S3 in v2).

Upload bytes to Bunny Storage Zone; return public CDN URL for Supabase to store.
"""
from __future__ import annotations

import logging
import mimetypes
import os
from typing import Any, Dict, Optional
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)


class BunnyClient:
    def __init__(self) -> None:
        self.storage_zone = os.getenv("BUNNY_STORAGE_ZONE", "").strip()
        self.access_key = os.getenv("BUNNY_ACCESS_KEY", "").strip()
        # e.g. storage.bunnycdn.com or storage.ny.storage.bunnycdn.com
        self.storage_host = os.getenv(
            "BUNNY_STORAGE_HOST", "storage.bunnycdn.com"
        ).strip()
        # Pull zone hostname without scheme, e.g. myzone.b-cdn.net
        self.cdn_hostname = os.getenv("BUNNY_CDN_HOSTNAME", "").strip().rstrip("/")
        if self.cdn_hostname.startswith("https://"):
            self.cdn_hostname = self.cdn_hostname[len("https://") :]
        if self.cdn_hostname.startswith("http://"):
            self.cdn_hostname = self.cdn_hostname[len("http://") :]

    def _configured(self) -> bool:
        return bool(self.storage_zone and self.access_key and self.cdn_hostname)

    def cdn_url(self, object_key: str) -> str:
        key = object_key.lstrip("/")
        return f"https://{self.cdn_hostname}/{key}"

    def upload_file(
        self,
        local_path: str,
        object_key: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> Optional[str]:
        """Upload a local file; return CDN URL or None on failure."""
        if not self._configured():
            logger.error(
                "Bunny not configured (need BUNNY_STORAGE_ZONE, BUNNY_ACCESS_KEY, BUNNY_CDN_HOSTNAME)"
            )
            return None
        if object_key is None:
            object_key = os.path.basename(local_path)
        object_key = object_key.lstrip("/")
        if not content_type:
            content_type, _ = mimetypes.guess_type(local_path)
            content_type = content_type or "application/octet-stream"

        url = f"https://{self.storage_host}/{self.storage_zone}/{quote(object_key)}"
        try:
            with open(local_path, "rb") as f:
                data = f.read()
            resp = requests.put(
                url,
                data=data,
                headers={
                    "AccessKey": self.access_key,
                    "Content-Type": content_type,
                },
                timeout=120,
            )
            if resp.status_code not in (200, 201):
                logger.error(
                    "Bunny upload failed %s: %s %s",
                    object_key,
                    resp.status_code,
                    resp.text[:300],
                )
                return None
            return self.cdn_url(object_key)
        except Exception as e:
            logger.error("Bunny upload error for %s: %s", object_key, e)
            return None

    def upload_bytes(
        self,
        data: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> Optional[str]:
        if not self._configured():
            logger.error("Bunny not configured")
            return None
        object_key = object_key.lstrip("/")
        url = f"https://{self.storage_host}/{self.storage_zone}/{quote(object_key)}"
        try:
            resp = requests.put(
                url,
                data=data,
                headers={
                    "AccessKey": self.access_key,
                    "Content-Type": content_type,
                },
                timeout=120,
            )
            if resp.status_code not in (200, 201):
                logger.error(
                    "Bunny bytes upload failed %s: %s", object_key, resp.status_code
                )
                return None
            return self.cdn_url(object_key)
        except Exception as e:
            logger.error("Bunny bytes upload error: %s", e)
            return None

    def upload_to_folder(
        self, file_path: str, folder: str, file_name: Optional[str] = None
    ) -> Dict[str, Any]:
        name = file_name or os.path.basename(file_path)
        key = f"{folder.strip('/')}/{name}"
        url = self.upload_file(file_path, key)
        if not url:
            return {"success": False, "error": "Bunny upload failed"}
        return {
            "success": True,
            "file_url": url,
            "s3_key": key,  # keep key name for callers expecting s3_key
            "cdn_url": url,
            "file_name": name,
        }


bunny_client = BunnyClient()
