import os
import time
import requests
from functools import wraps
from urllib.parse import urlparse
from flask import request, jsonify
from jose import jwt
from jose.exceptions import JWTError
from dotenv import load_dotenv

load_dotenv()

# Supabase Auth (replaces Cognito in v2)
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or os.getenv(
    "SUPABASE_JWT_SECRET_KEY"
)
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

SHOPIFY_APP_CLIENT_ID = os.getenv("SHOPIFY_APP_CLIENT_ID")
SHOPIFY_APP_SECRET = os.getenv("SHOPIFY_APP_SECRET")

if not SUPABASE_JWT_SECRET and not SUPABASE_URL:
    print(
        "WARNING: SUPABASE_JWT_SECRET (or SUPABASE_URL for JWKS) not set — "
        "Bearer auth will fail until configured."
    )

_jwks_cache = None
_jwks_cache_timestamp = 0
JWKS_CACHE_DURATION = 300


def get_jwks():
    """Fetch JWKS from Supabase Auth (asymmetric keys) with caching."""
    global _jwks_cache, _jwks_cache_timestamp
    if not SUPABASE_URL:
        return None
    current_time = time.time()
    if _jwks_cache and (current_time - _jwks_cache_timestamp) < JWKS_CACHE_DURATION:
        return _jwks_cache
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        headers = {}
        if SUPABASE_ANON_KEY:
            headers["apikey"] = SUPABASE_ANON_KEY
        response = requests.get(jwks_url, headers=headers, timeout=10)
        response.raise_for_status()
        jwks = response.json()
        _jwks_cache = jwks
        _jwks_cache_timestamp = current_time
        return jwks
    except Exception as e:
        print(f"Error fetching Supabase JWKS: {e}")
        return _jwks_cache


def verify_token(token):
    """Verify and decode JWT from Supabase Auth."""
    try:
        if token.startswith("Bearer "):
            token = token[7:]

        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        # Preferred: project JWT secret (HS256)
        if SUPABASE_JWT_SECRET and alg.startswith("HS"):
            decoded = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
            return decoded

        # Fallback: JWKS (ES256 / RS256)
        key_id = unverified_header.get("kid")
        jwks = get_jwks()
        if not jwks or not key_id:
            raise JWTError("Could not resolve Supabase signing key")
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == key_id:
                key = jwk
                break
        if not key:
            raise JWTError(f"Key {key_id} not found in Supabase JWKS")
        decoded = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            options={"verify_aud": True},
        )
        return decoded
    except JWTError as e:
        print(f"JWT Error during Supabase token verification: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error during token verification: {e}")
        return None


def require_auth(f):
    """Decorator to require Supabase Auth for routes."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200

        if request.endpoint in ["main.health_check", "system.health_check"]:
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No authorization header provided",
                        "response": None,
                    }
                ),
                401,
            )

        decoded_token = verify_token(auth_header)
        if not decoded_token:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid or expired token",
                        "response": None,
                    }
                ),
                401,
            )

        request.user = decoded_token
        request.user_id = decoded_token.get("sub", "unknown")
        return f(*args, **kwargs)

    return decorated_function


def verify_shopify_token(token):
    """Verify Shopify session token (unchanged)."""
    try:
        if token.startswith("Bearer "):
            token = token[7:]

        if not SHOPIFY_APP_SECRET:
            raise JWTError("SHOPIFY_APP_SECRET not configured")

        decoded = jwt.decode(
            token,
            key=SHOPIFY_APP_SECRET,
            algorithms=["HS256"],
            audience=SHOPIFY_APP_CLIENT_ID,
        )
        return decoded
    except JWTError as e:
        print(f"JWT Error during Shopify token verification: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error during Shopify token verification: {e}")
        return None


def require_shopify_auth(f):
    """Decorator for Shopify session-token auth."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200

        if request.endpoint in ["main.health_check", "system.health_check"]:
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No authorization header provided",
                        "response": None,
                    }
                ),
                401,
            )

        decoded_token = verify_shopify_token(auth_header)
        if not decoded_token:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid or expired token",
                        "response": None,
                    }
                ),
                401,
            )

        request.user = decoded_token
        dest_url = decoded_token.get("dest", "unknown")
        if dest_url != "unknown":
            parsed_url = urlparse(dest_url)
            destination_shopify_domain = parsed_url.netloc or dest_url
        else:
            destination_shopify_domain = "unknown"
        request.user_id = destination_shopify_domain
        return f(*args, **kwargs)

    return decorated_function


def extract_user_attributes(decoded_token):
    """Extract user attributes from Supabase (or legacy) JWT claims."""
    if not decoded_token or not isinstance(decoded_token, dict):
        return {}

    attributes = {}
    attribute_mappings = {
        "email": ["email", "user_email"],
        "given_name": ["given_name", "name", "first_name"],
        "family_name": ["family_name", "last_name"],
        "name": ["name", "full_name"],
        "preferred_username": ["preferred_username", "username"],
    }

    for attr_name, possible_keys in attribute_mappings.items():
        for key in possible_keys:
            if key in decoded_token:
                attributes[attr_name] = decoded_token[key]
                break

    # Supabase user_metadata
    meta = decoded_token.get("user_metadata") or {}
    if isinstance(meta, dict):
        for k, v in meta.items():
            attributes.setdefault(k, v)
        if meta.get("email") and "email" not in attributes:
            attributes["email"] = meta["email"]

    if "sub" in decoded_token:
        attributes["sub"] = decoded_token["sub"]

    for key, value in decoded_token.items():
        if key not in attributes and key not in [
            "aud",
            "iss",
            "iat",
            "exp",
            "auth_time",
            "token_use",
            "aal",
            "amr",
            "session_id",
        ]:
            attributes[key] = value

    return attributes
