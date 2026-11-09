import crypto from "crypto";
import { SessionNotFoundError } from "@shopify/shopify-app-react-router/server";
import { unauthenticated } from "../shopify.server";

// Gives the Python backend a store's current offline token. This app owns the
// token and its refresh, because Shopify retires the old token on every refresh
// and two refreshers would invalidate each other. Callers sign with the app secret.
const MAX_REQUEST_AGE_MS = 60 * 1000;
const SHOP_DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hasValidSignature(rawBody, signature) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const rawBody = await request.text();
  if (!hasValidSignature(rawBody, request.headers.get("X-Internal-Signature"))) {
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const requestAgeMs = Math.abs(Date.now() - Number(payload?.timestamp) * 1000);
  if (!(requestAgeMs <= MAX_REQUEST_AGE_MS)) {
    return jsonResponse({ error: "Request expired" }, 401);
  }

  const shop = payload?.shop;
  if (typeof shop !== "string" || !SHOP_DOMAIN.test(shop)) {
    return jsonResponse({ error: "Invalid shop" }, 400);
  }

  try {
    // Refreshes the token first when it is close to expiry.
    const { session } = await unauthenticated.admin(shop);
    if (!session.accessToken || session.isExpired()) {
      return jsonResponse({ error: "Store must reopen the app" }, 409);
    }
    return jsonResponse({
      accessToken: session.accessToken,
      expiresAt: session.expires ? session.expires.toISOString() : null,
    });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return jsonResponse({ error: "No session for shop" }, 404);
    }
    console.error(
      `[shop-token] Could not get token for ${shop}:`,
      error?.status ?? error?.message,
    );
    return jsonResponse({ error: "Could not get token" }, 502);
  }
}
