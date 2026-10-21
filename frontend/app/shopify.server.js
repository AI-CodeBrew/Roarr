import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { setRenderBlocksForShop } from "./lib/metafield-control";
import { fetchShopDetails } from "./lib/shop-details";
import crypto from "crypto";

// Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Sets shop `app.block_control` to true so Roarr storefront blocks render.
 * Call on every install path (OAuth afterAuth, install notify, etc.).
 */
export async function ensureShopBlockControlEnabled(admin, session) {
  if (!session) {
    return { success: false, errors: ["No session"] };
  }
  try {
    if (admin) {
      const adminResult = await setRenderBlocksForShop(admin, true);
      if (adminResult.success) return adminResult;
    }
    const sessionResult = await setRenderBlocksForShop(null, true, session);
    return sessionResult;
  } catch (error) {
    console.error("[ensureShopBlockControlEnabled]", error?.message ?? error);
    return {
      success: false,
      errors: [error?.message || "Unknown error"],
    };
  }
}

export async function notifyInstallIfNeeded(admin, session) {
  console.log("notifyInstallIfNeeded");
  try {
    const blockResult = await ensureShopBlockControlEnabled(admin, session);
    if (!blockResult.success) {
      console.warn(
        `[notifyInstallIfNeeded] block_control not set for ${session?.shop}`,
        blockResult.errors,
      );
    }

    // Fetch shop details using admin client (more reliable than direct token fetch)
    const shopDetails = await fetchShopDetails(admin, session);

    // Prepare payload
    const payload = {
      shop: session.shop,
      event: "install",
      timestamp: new Date().toISOString(),
      sessionId: session.id,
      accessToken: session.accessToken,
      shopDetails: {
        shop: shopDetails?.shop,
      },
    };

    // Sign the payload
    const signature = signPayload(payload);

    // Prepare headers - include shop domain and signature for authentication
    const headers = {
      "Content-Type": "application/json",
      "X-Shop-Domain": session.shop,
      "X-Internal-Signature": signature,
    };

    const pythonRes = await fetch(`${PYTHON_API_URL}/api/app/install`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await pythonRes.json().catch(() => ({}));

    if (!pythonRes.ok) {
      console.error(`[notifyInstallIfNeeded] Error notifying install:`, data || `Python API error: ${pythonRes.statusText}`);
      return {
        success: false,
        message: data?.message || `Python API error: ${pythonRes.statusText}`,
        shop_id: null,
      };
    }

    console.log(`[notifyInstallIfNeeded] Successfully notified install for shop ${session.shop}`);
    return {
      success: data.success ?? true,
      message: data.message ?? "Shop details stored successfully",
      shop_id: data.shop_id ?? null,
    };
  }
  catch (error) {
    console.error(`[notifyInstallIfNeeded] Error notifying install:`, error.message);
    return {
      success: false,
      message: error.message,
      shop_id: null,
    };
  }
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  sessionStorage: new PrismaSessionStorage(prisma),
  hooks: {
    afterAuth: async ({ session, admin }) => {
      try {
        console.log("[AFTER_AUTH] Post-OAuth install pipeline for shop", session.shop);
        try {
          await notifyInstallIfNeeded(admin, session);
        } catch (error) {
          console.error(`[AFTER_AUTH] Error notifying install:`, error.message);
        }
      } catch (error) {
        console.error(`[AFTER_AUTH] Error in afterAuth hook:`, error.message);
      }
    },
  },
  distribution: AppDistribution.AppStore,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),

});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;

// Per-request memoization: React Router can run multiple loaders/actions for a single navigation.
const __adminAuthMemo = new WeakMap();

// Cross-request cache: the embedded app fires many parallel API routes; each used to call
// authenticate.admin → Prisma session load + token work independently. Short TTL dedupes
// bursts (same tab, same session token) without weakening security for long.
const __adminAuthCrossCacheMs = Number(
  process.env.SHOPIFY_ADMIN_AUTH_CACHE_MS ?? "8000"
);
const __adminAuthCrossMax = 400;
/** @type {Map<string, { expires: number, value: Awaited<ReturnType<typeof shopify.authenticate.admin>> }>} */
const __adminAuthCrossResolved = new Map();

function __adminAuthCacheKey(request) {
  try {
    const auth =
      request.headers?.get?.("Authorization") ||
      request.headers?.get?.("authorization") ||
      "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (bearer.length > 20) {
      return `b:${crypto.createHash("sha256").update(bearer).digest("hex")}`;
    }
    // Cookie session (no Bearer on some same-origin /api/* calls): hash full Cookie header.
    const cookie = request.headers?.get?.("Cookie") || "";
    if (cookie.length > 20) {
      return `c:${crypto.createHash("sha256").update(cookie).digest("hex")}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function __adminAuthCrossPrune() {
  const now = Date.now();
  for (const [k, v] of __adminAuthCrossResolved) {
    if (v.expires <= now) __adminAuthCrossResolved.delete(k);
  }
  if (__adminAuthCrossResolved.size <= __adminAuthCrossMax) return;
  const entries = [...__adminAuthCrossResolved.entries()].sort(
    (a, b) => a[1].expires - b[1].expires
  );
  const drop = entries.length - __adminAuthCrossMax;
  for (let i = 0; i < drop; i++) {
    __adminAuthCrossResolved.delete(entries[i][0]);
  }
}

async function adminAuthenticateMemo(request) {
  if (!request || (typeof request !== "object" && typeof request !== "function")) {
    return shopify.authenticate.admin(request);
  }

  const sameReq = __adminAuthMemo.get(request);
  if (sameReq) return sameReq;

  const crossKey =
    __adminAuthCrossCacheMs > 0 ? __adminAuthCacheKey(request) : null;

  if (crossKey) {
    const hit = __adminAuthCrossResolved.get(crossKey);
    if (hit && hit.expires > Date.now()) {
      const p = Promise.resolve(hit.value);
      __adminAuthMemo.set(request, p);
      return p;
    }
  }

  const promise = shopify.authenticate.admin(request).then((value) => {
    if (crossKey && __adminAuthCrossCacheMs > 0) {
      __adminAuthCrossResolved.set(crossKey, {
        expires: Date.now() + __adminAuthCrossCacheMs,
        value,
      });
      __adminAuthCrossPrune();
    }
    return value;
  });

  __adminAuthMemo.set(request, promise);
  return promise;
}

export const authenticate = {
  ...shopify.authenticate,
  admin: adminAuthenticateMemo,
};
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
