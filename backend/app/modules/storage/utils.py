"""Bunny CDN upload helpers."""
from __future__ import annotations

import logging
import mimetypes
import os
from typing import Any, Dict, Optional

from app.clients.bunny_client import bunny_client

logger = logging.getLogger(__name__)


class StorageUtils:
    def __init__(self) -> None:
        self.zone = os.getenv("BUNNY_STORAGE_ZONE", "kluck-v2")

    def upload_file_to_bucket_folder(
        self, file_path: str, user_id: str, file_name: str = None
    ) -> Dict[str, Any]:
        return bunny_client.upload_to_folder(file_path, user_id, file_name)

    def create_presigned_url(self, key: str, expiration: int = 3600) -> Dict[str, Any]:
        url = bunny_client.cdn_url(key)
        return {
            "success": True,
            "presigned_url": url,
            "object_key": key,
            "expiration_seconds": expiration,
        }

    @staticmethod
    def upload_public(
        local_file: str,
        object_name: Optional[str] = None,
        **_ignored,
    ) -> Optional[str]:
        if object_name is None:
            object_name = os.path.basename(local_file)
        return bunny_client.upload_file(local_file, object_name)


storage_utils = StorageUtils()
