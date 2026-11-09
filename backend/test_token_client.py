"""Offline tests for the Shopify token helper (no network, no real Shopify store).

Run from backend/:  ./venv/Scripts/python.exe -m unittest test_token_client -v
"""
import os
import time
import unittest
from datetime import datetime, timedelta, timezone
from unittest import mock

os.environ.setdefault("FRONTEND_URL", "http://frontend.test")
os.environ.setdefault("SHOPIFY_APP_SECRET", "test-secret")

from app.modules.shopify import token_client as tc  # noqa: E402
from app.modules.shopify.shopify_utils import ShopifyUtils  # noqa: E402

SHOP = "demo.myshopify.com"


def _response(status, payload=None):
    r = mock.Mock()
    r.status_code = status
    r.json.return_value = payload or {}
    r.raise_for_status.side_effect = None
    return r


def _iso(seconds_from_now):
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds_from_now)).isoformat()


class TokenClientTests(unittest.TestCase):
    def setUp(self):
        tc._cache.clear()
        tc._failures.clear()
        tc._flagged_reauth.clear()
        self.reauth_flag = mock.patch.object(tc, "_set_reauth_flag").start()
        self.addCleanup(mock.patch.stopall)

    def test_returns_current_token_and_caches_it(self):
        with mock.patch.object(tc.requests, "post", return_value=_response(200, {"accessToken": "A1", "expiresAt": _iso(3600)})) as post:
            self.assertEqual(tc.get_valid_shopify_token(SHOP), "A1")
            self.assertEqual(tc.get_valid_shopify_token("https://demo.myshopify.com/"), "A1")
        self.assertEqual(post.call_count, 1)

    def test_force_refresh_skips_the_cache(self):
        replies = [_response(200, {"accessToken": "A1", "expiresAt": _iso(3600)}), _response(200, {"accessToken": "A2", "expiresAt": _iso(3600)})]
        with mock.patch.object(tc.requests, "post", side_effect=replies):
            self.assertEqual(tc.get_valid_shopify_token(SHOP), "A1")
            self.assertEqual(tc.get_valid_shopify_token(SHOP, force_refresh=True), "A2")
            self.assertEqual(tc.get_valid_shopify_token(SHOP), "A2")

    def test_token_near_expiry_is_not_reused(self):
        # Expires in 2 minutes: inside the 5 minute refresh window, so it must not be cached.
        until = tc._cache_until(_iso(120), time.time())
        self.assertLessEqual(until, time.time())
        # Expires in 10 minutes: cached for at most CACHE_SECONDS.
        until = tc._cache_until(_iso(600), time.time())
        self.assertLessEqual(until, time.time() + tc.CACHE_SECONDS + 1)

    def test_reauth_required_marks_the_shop_and_is_remembered_briefly(self):
        with mock.patch.object(tc.requests, "post", return_value=_response(409)) as post:
            with self.assertRaises(tc.ShopifyReauthRequired) as ctx:
                tc.get_valid_shopify_token(SHOP)
            self.assertIn("Open Roarr", str(ctx.exception))
            with self.assertRaises(tc.ShopifyReauthRequired):
                tc.get_valid_shopify_token(SHOP)  # served from the failure memory
        self.assertEqual(post.call_count, 1)
        self.reauth_flag.assert_called_with(SHOP, True, mock.ANY)

    def test_flag_is_cleared_once_a_token_is_available_again(self):
        with mock.patch.object(tc.requests, "post", return_value=_response(404)):
            with self.assertRaises(tc.ShopifyReauthRequired):
                tc.get_valid_shopify_token(SHOP)
        tc._failures.clear()
        with mock.patch.object(tc.requests, "post", return_value=_response(200, {"accessToken": "A9", "expiresAt": _iso(3600)})):
            self.assertEqual(tc.get_valid_shopify_token(SHOP), "A9")
        self.reauth_flag.assert_called_with(SHOP, False)

    def test_never_falls_back_to_the_stored_token(self):
        with mock.patch.object(tc.requests, "post", side_effect=tc.requests.ConnectionError("down")):
            with self.assertRaises(tc.ShopifyTokenUnavailable):
                tc.resolve_access_token(SHOP, "old-stored-token")

    def test_no_stored_token_means_not_connected(self):
        with mock.patch.object(tc.requests, "post") as post:
            self.assertIsNone(tc.resolve_access_token(SHOP, None))
        post.assert_not_called()

    def test_missing_configuration_is_reported(self):
        with mock.patch.dict(os.environ, {"FRONTEND_URL": ""}):
            with self.assertRaises(tc.ShopifyTokenUnavailable):
                tc.get_valid_shopify_token(SHOP)


class UnauthorizedRetryTests(unittest.TestCase):
    def setUp(self):
        tc._cache.clear()
        tc._failures.clear()

    def test_graphql_retries_once_with_a_fresh_token_after_401(self):
        utils = ShopifyUtils()
        creds = {"shop_url": SHOP, "access_token": "retired-token"}
        unauthorized = _response(401)
        ok = _response(200, {"data": {"shop": {"id": "gid://shopify/Shop/1"}}})
        seen_tokens = []

        def fake_post(url, headers=None, json=None, **kwargs):
            seen_tokens.append(headers["X-Shopify-Access-Token"])
            return unauthorized if len(seen_tokens) == 1 else ok

        with mock.patch.object(utils, "_get_user_credentials", return_value=creds), \
                mock.patch("app.modules.shopify.shopify_utils.requests.post", side_effect=fake_post), \
                mock.patch.object(tc, "_fetch_token", return_value=("fresh-token", _iso(3600))):
            result = utils._make_graphql_request("query { shop { id } }", None, "user-1")

        self.assertEqual(seen_tokens, ["retired-token", "fresh-token"])
        self.assertEqual(result["data"]["shop"]["id"], "gid://shopify/Shop/1")

    def test_graphql_gives_up_after_one_retry(self):
        utils = ShopifyUtils()
        creds = {"shop_url": SHOP, "access_token": "retired-token"}
        calls = []

        def always_401(url, headers=None, json=None, **kwargs):
            calls.append(headers["X-Shopify-Access-Token"])
            r = _response(401)
            r.raise_for_status.side_effect = tc.requests.HTTPError("401")
            return r

        with mock.patch.object(utils, "_get_user_credentials", return_value=creds), \
                mock.patch("app.modules.shopify.shopify_utils.requests.post", side_effect=always_401), \
                mock.patch.object(tc, "_fetch_token", return_value=("fresh-token", _iso(3600))):
            with self.assertRaises(Exception):
                utils._make_graphql_request("query { shop { id } }", None, "user-1")

        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main()
