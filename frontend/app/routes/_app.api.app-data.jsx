import { authenticate } from "../shopify.server";
import { fetchShopDetails } from "../lib/shop-details";
import crypto from "crypto";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// In-memory cache per shop (TTL: 60 s). Avoids re-fetching stable data on every
// client-side navigation that triggers a hard reload.
const CACHE_TTL_MS = 60 * 1000;
const _cache = new Map(); // shop -> { ts, data }

function getCached(shop) {
  const entry = _cache.get(shop);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _cache.delete(shop);
    return null;
  }
  return entry.data;
}

function setCached(shop, data) {
  _cache.set(shop, { ts: Date.now(), data });
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function fetchIsOnboarded(shop) {
  try {
    const payload = { shop, timestamp: new Date().toISOString() };
    const signature = signPayload(payload);
    const res = await fetch(`${PYTHON_API_URL}/api/shopify/is-store-onboarded`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shop-Domain": shop,
        "X-Internal-Signature": signature,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return !!(data?.success && data?.is_onboarded);
  } catch {
    return false;
  }
}

async function fetchMarketPreferences(shop) {
  try {
    const payload = { shop, timestamp: new Date().toISOString() };
    const signature = signPayload(payload);
    const res = await fetch(
      `${PYTHON_API_URL}/api/shopify/shop-market-preferences-internal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shop-Domain": shop,
          "X-Internal-Signature": signature,
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!data?.success) return null;
    return data.preferences || null;
  } catch {
    return null;
  }
}

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // Serve from cache when available (stable data: shop details, locales, billing)
    const cached = getCached(shop);
    if (cached) {
      return Response.json(cached, {
        headers: { "Cache-Control": "private, max-age=30" },
      });
    }

    // Fire all independent fetches in parallel
    const [shopDetailsRes, combinedGraphQLRes, isOnboarded, marketPreferences] =
      await Promise.all([
      fetchShopDetails(admin, session),
      admin
        .graphql(
          `#graphql
          query GetLocalesAndCount {
            shopLocales(published: true) {
              locale
              primary
              published
            }
            productsCount {
              count
            }
          }
        `
        )
        .catch((e) => {
          console.error("[app-data] GraphQL error:", e);
          return null;
        }),
      fetchIsOnboarded(shop),
      fetchMarketPreferences(shop),
    ]);

    let locales = [];
    let productsCount = null;

    if (combinedGraphQLRes) {
      try {
        const json = await combinedGraphQLRes.json();
        locales = json?.data?.shopLocales || [];
        productsCount = json?.data?.productsCount?.count ?? null;
      } catch (e) {
        console.error("[app-data] Error parsing GraphQL response:", e);
      }
    }

    const responseData = {
      shopDetails: shopDetailsRes?.shop,
      shop,
      locales,
      productsCount,
      isOnboarded,
      marketPreferences: marketPreferences || null,
    };

    setCached(shop, responseData);

    return Response.json(responseData, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("[app-data] Error:", error);
    return Response.json(
      {
        error: "Failed to fetch app data",
        shopDetails: null,
        locales: [],
        productsCount: null,
        isOnboarded: false,
        marketPreferences: null,
      },
      { status: 500 }
    );
  }
};
