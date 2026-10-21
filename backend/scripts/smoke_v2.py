#!/usr/bin/env python3
"""v2 smoke checks — Supabase Postgres + Bunny (no AWS)."""
from __future__ import annotations

import importlib
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except ImportError:
    pass


def check(name: str, ok: bool, detail: str = "") -> bool:
    print(f"[{'OK' if ok else 'SKIP/FAIL'}] {name}" + (f" — {detail}" if detail else ""))
    return ok


def main() -> int:
    print("=== Kluck v2 smoke ===\n")
    failures = 0
    try:
        importlib.import_module("app.modules.auth.utils")
        bunny_client = importlib.import_module("app.clients.bunny_client").bunny_client
        crisp_client = importlib.import_module("app.clients.crisp_client").crisp_client
        importlib.import_module("app.clients.posthog_client")
        StorageUtils = importlib.import_module("app.modules.storage.utils").StorageUtils
        importlib.import_module("app.modules.database.utils")
        check("imports", True)
    except Exception as e:
        check("imports", False, str(e))
        return 1

    check(
        "supabase auth env",
        bool(os.getenv("SUPABASE_JWT_SECRET") or os.getenv("SUPABASE_URL")),
        "set SUPABASE_JWT_SECRET and/or SUPABASE_URL",
    )

    db = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not db:
        check("DATABASE_URL", False, "not set — skip pg write")
    else:
        try:
            Pg = importlib.import_module(
                "app.modules.database.pg_document_store"
            ).PgDynamoResource
            table = Pg().Table("smoke_test")
            table.put_item(Item={"PK": "smoke-1", "hello": "v2"})
            got = table.get_item(Key={"PK": "smoke-1"}).get("Item") or {}
            ok = got.get("hello") == "v2"
            check("postgres put/get", ok, str(got))
            if not ok:
                failures += 1
        except Exception as e:
            check("postgres put/get", False, str(e))
            failures += 1

    if not bunny_client._configured():
        check("bunny config", False, "set BUNNY_* env vars")
    else:
        try:
            with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
                f.write(b"kluck-v2-smoke")
                path = f.name
            url = bunny_client.upload_file(path, "smoke/kluck-v2-smoke.txt")
            os.unlink(path)
            ok = bool(url and url.startswith("http"))
            check("bunny upload", ok, url or "")
            if not ok:
                failures += 1
            with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
                f.write(b"storage-utils")
                path = f.name
            url2 = StorageUtils.upload_public(path, "smoke/storage-utils.txt")
            os.unlink(path)
            check("StorageUtils upload", bool(url2), url2 or "")
        except Exception as e:
            check("bunny upload", False, str(e))
            failures += 1

    check("crisp no-op", True, f"enabled={crisp_client.enabled}")
    check("posthog no-op", True)
    print("\n=== done ===")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
