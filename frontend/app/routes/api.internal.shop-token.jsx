import crypto from "crypto";
import { SessionNotFoundError } from "@shopify/shopify-app-react-router/server";
import shopify, { unauthenticated } from "../shopify.server";
import prisma from "../db.server";

// Gives the Python backend a store's current offline token. This app owns the
// token and its refresh, because Shopify retires the old token on every refresh
// and two refreshers would invalidate each other. Callers sign with the app secret.
//
// Status codes the backend relies on:
//   200 token + expiry      404 no usable session for the shop   409 merchant must reopen the app
//   401/400 bad request     502 temporary failure, retry later
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

// Serialises token work per shop across serverless instances: only one request at a time may
// refresh a store's token, because every refresh rotates the refresh token.
function withShopLock(shop, work) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${shop}))`;
      return work();
    },
    { maxWait: 5000, timeout: 20000 },
  );
}

async function currentToken(shop) {
  const stored = await shopify.sessionStorage.loadSession(`offline_${shop}`);
  // Legacy non-expiring sessions are hidden by the session storage, so "no session" also
  // covers them: the merchant reopening the app creates an expiring one.
  if (!stored) return { status: 404, body: { error: "No session for shop" } };

  const refreshExpired =
    stored.refreshTokenExpires && stored.refreshTokenExpires.getTime() <= Date.now();
  if (stored.isExpired() && (!stored.refreshToken || refreshExpired)) {
    console.error(
      `[shop-token] REAUTH_REQUIRED ${shop}: access token expired and the refresh token is ${
        stored.refreshToken ? "expired" : "missing"
      }`,
    );
    return { status: 409, body: { error: "Store must reopen the app" } };
  }

  try {
    // Refreshes the token first when it is close to expiry and saves the rotated tokens
    // (access token, refresh token and both expiries) to the same Session row.
    const { session } = await unauthenticated.admin(shop);
    if (!session.accessToken || session.isExpired()) {
      return { status: 409, body: { error: "Store must reopen the app" } };
    }
    return {
      status: 200,
      body: {
        accessToken: session.accessToken,
        expiresAt: session.expires ? session.expires.toISOString() : null,
      },
    };
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return { status: 404, body: { error: "No session for shop" } };
    }
    console.error(
      `[shop-token] Could not refresh the token for ${shop}:`,
      error?.status ?? error?.message,
    );
    // The refresh failed. If the saved token has not expired yet it still works, so hand it
    // out; the backend asks again before it runs out. If it already expired, the refresh token
    // was rejected and the merchant has to reopen the app.
    if (!stored.isExpired()) {
      return {
        status: 200,
        body: {
          accessToken: stored.accessToken,
          expiresAt: stored.expires ? stored.expires.toISOString() : null,
        },
      };
    }
    console.error(`[shop-token] REAUTH_REQUIRED ${shop}: refresh failed and the token expired`);
    return { status: 409, body: { error: "Store must reopen the app" } };
  }
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
    const result = await withShopLock(shop, () => currentToken(shop));
    return jsonResponse(result.body, result.status);
  } catch (error) {
    console.error(`[shop-token] Could not get token for ${shop}:`, error?.status ?? error?.message);
    return jsonResponse({ error: "Could not get token" }, 502);
  }
}
