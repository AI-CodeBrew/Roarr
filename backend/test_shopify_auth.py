"""Offline tests for the backend's Shopify authentication (no network, no database).

Run from backend/:  ./venv/Scripts/python.exe -m unittest test_shopify_auth -v
"""
import base64
import hashlib
import hmac
import json
import os
import time
import unittest

SECRET = "test-client-secret"
CLIENT_ID = "test-client-id"
os.environ["SHOPIFY_APP_SECRET"] = SECRET
os.environ["SHOPIFY_APP_CLIENT_ID"] = CLIENT_ID

from jose import jwt  # noqa: E402

from app import create_app  # noqa: E402
from app.modules.auth import utils as auth_utils  # noqa: E402
from app.modules.shopify.shopify_auth import utils as shopify_utils_mod  # noqa: E402

SHOP = "demo-store.myshopify.com"


def session_token(secret=SECRET, aud=CLIENT_ID, dest=f"https://{SHOP}", iss=None, exp_in=60, **extra):
    now = int(time.time())
    claims = {
        "iss": iss if iss is not None else f"{dest}/admin",
        "dest": dest,
        "aud": aud,
        "sub": "1",
        "exp": now + exp_in,
        "nbf": now - 5,
        "iat": now,
        "jti": "abc",
        **extra,
    }
    return jwt.encode(claims, secret, algorithm="HS256")


class SessionTokenTests(unittest.TestCase):
    def test_valid_token_is_accepted(self):
        decoded = auth_utils.verify_shopify_token(f"Bearer {session_token()}")
        self.assertEqual(decoded["dest"], f"https://{SHOP}")

    def test_token_signed_with_another_secret_is_rejected(self):
        self.assertIsNone(auth_utils.verify_shopify_token(session_token(secret="old-app-secret")))

    def test_token_for_another_app_is_rejected(self):
        self.assertIsNone(auth_utils.verify_shopify_token(session_token(aud="some-other-client-id")))

    def test_expired_token_is_rejected(self):
        self.assertIsNone(auth_utils.verify_shopify_token(session_token(exp_in=-120)))

    def test_dest_must_be_a_myshopify_shop(self):
        self.assertIsNone(auth_utils.verify_shopify_token(session_token(dest="https://evil.example.com")))

    def test_iss_must_match_dest(self):
        self.assertIsNone(auth_utils.verify_shopify_token(session_token(iss="https://other.myshopify.com/admin")))

    def test_decorator_sets_user_id_to_the_shop(self):
        app = create_app()

        @app.route("/_probe")
        @auth_utils.require_shopify_auth
        def probe():
            from flask import request

            return {"user_id": request.user_id}

        client = app.test_client()
        self.assertEqual(client.get("/_probe").status_code, 401)
        self.assertEqual(client.get("/_probe", headers={"Authorization": "Bearer nonsense"}).status_code, 401)
        ok = client.get("/_probe", headers={"Authorization": f"Bearer {session_token()}"})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.get_json()["user_id"], SHOP)

    def test_cookies_are_not_an_authentication_method(self):
        app = create_app()

        @app.route("/_probe2")
        @auth_utils.require_shopify_auth
        def probe():
            return {"ok": True}

        client = app.test_client()
        client.set_cookie("session", session_token())
        self.assertEqual(client.get("/_probe2").status_code, 401)


class WebhookHmacTests(unittest.TestCase):
    BODY = json.dumps({"myshopify_domain": SHOP}).encode()

    def sign(self, body, secret=SECRET):
        return base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()

    def test_helper(self):
        verify = shopify_utils_mod.verify_shopify_webhook_hmac
        self.assertTrue(verify(self.BODY, self.sign(self.BODY)))
        self.assertFalse(verify(self.BODY, self.sign(self.BODY, "wrong-secret")))
        self.assertFalse(verify(self.BODY, None))
        self.assertFalse(verify(b"", self.sign(b"")))

    def test_endpoints_return_401_without_a_valid_hmac(self):
        client = create_app().test_client()
        for path in (
            "/webhook/shopify/unInstall",
            "/webhook/shopify/app-subscriptions-update",
            "/api/webhook/shopify/app-subscriptions-update",
            "/webhook/shopify/app-charges-update",
        ):
            no_header = client.post(path, data=self.BODY, content_type="application/json")
            bad = client.post(
                path,
                data=self.BODY,
                content_type="application/json",
                headers={"X-Shopify-Hmac-Sha256": self.sign(self.BODY, "wrong-secret")},
            )
            self.assertEqual(no_header.status_code, 401, path)
            self.assertEqual(bad.status_code, 401, path)

    def test_shop_redact_endpoint_checks_the_internal_signature(self):
        client = create_app().test_client()
        body = json.dumps({"shop": SHOP, "timestamp": int(time.time())}).encode()
        bad = client.post(
            "/api/internal/shop-redact",
            data=body,
            content_type="application/json",
            headers={"X-Internal-Signature": "0" * 64},
        )
        self.assertEqual(bad.status_code, 401)

    def test_shop_redact_rejects_a_stale_request(self):
        client = create_app().test_client()
        body = json.dumps({"shop": SHOP, "timestamp": int(time.time()) - 3600}).encode()
        sig = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
        res = client.post(
            "/api/internal/shop-redact",
            data=body,
            content_type="application/json",
            headers={"X-Internal-Signature": sig},
        )
        self.assertEqual(res.status_code, 401)


class ShopRedactDataTests(unittest.TestCase):
    """delete_shop_data against a fake Postgres connection (nothing real is touched)."""

    def _store(self):
        from app.modules.database import document_store

        return document_store

    def _fake_conn(self, rows):
        from contextlib import contextmanager
        from unittest import mock

        executed = []

        class Result:
            def fetchall(self_inner):
                return rows

        class Conn:
            def execute(self_inner, sql, params=None):
                executed.append((sql, params))
                return Result()

            def commit(self_inner):
                pass

        @contextmanager
        def fake_pg_conn():
            yield Conn()

        return mock.patch("app.modules.database.pg_pool.pg_conn", fake_pg_conn), executed

    def test_deletes_only_exact_matches_for_the_shop(self):
        patch, executed = self._fake_conn(
            [{"table_name": "roarr_users_stores"}, {"table_name": "roarr-generated-pages"}, {"table_name": "roarr-generated-pages"}]
        )
        with patch:
            counts = self._store().delete_shop_data("HTTPS://Demo-Store.myshopify.com/")
        self.assertEqual(counts, {"roarr_users_stores": 1, "roarr-generated-pages": 2})
        sql, params = executed[0]
        self.assertIn("DELETE FROM dynamo_items", sql)
        self.assertNotIn("LIKE", sql.upper())  # exact equality only, never a substring match
        self.assertIn(SHOP, params["ids"])

    def test_refuses_an_invalid_shop_domain(self):
        patch, executed = self._fake_conn([])
        with patch:
            for bad in ("", "demo", "evil.example.com", "a.myshopify.com.evil.com", "%.myshopify.com"):
                with self.assertRaises(ValueError):
                    self._store().delete_shop_data(bad)
        self.assertEqual(executed, [])


if __name__ == "__main__":
    unittest.main()
