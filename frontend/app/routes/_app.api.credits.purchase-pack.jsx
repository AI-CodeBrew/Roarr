/**
 * Proxy: POST /api/credits/purchase-pack -> Python backend.
 *
 * Computes a return_url that lands the merchant back inside the embedded app
 * (so they don't get stranded on FRONTEND_URL after Shopify redirects).
 *
 * Body: { pack_name }
 * Returns: { success, charge_id, confirmation_url, pack_name, credits, price }
 */
import { authenticate } from "../shopify.server";
import { pricingHeadersForPython } from "../lib/pricing-region.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
const APP_CHARGES_HANDLE = process.env.SHOPIFY_APP_CHARGES_HANDLE || "kluckyv5";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const storeSlug = shop.replace(".myshopify.com", "");
  const authHeader = request.headers.get("authorization");
  const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;

  if (!shopifyJwtToken) {
    return Response.json(
      { success: false, error: "Missing Shopify session token" },
      { status: 401 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const packName = (body?.pack_name || "").toLowerCase();
  if (!packName) {
    return Response.json(
      { success: false, error: "pack_name is required" },
      { status: 400 }
    );
  }

  // Land the merchant back inside the embedded app after they approve the
  // charge. Shopify will append `&charge_id=<id>` automatically.
  const returnUrl =
    `https://admin.shopify.com/store/${storeSlug}/apps/${APP_CHARGES_HANDLE}` +
    `/credits/callback?pack=${encodeURIComponent(packName)}`;

  const pricingHeaders = pricingHeadersForPython(request);

  try {
    const res = await fetch(`${PYTHON_API_URL}/api/credits/purchase-pack`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
        "Content-Type": "application/json",
        ...Object.fromEntries(pricingHeaders.entries()),
      },
      body: JSON.stringify({
        pack_name: packName,
        return_url: returnUrl,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  } catch (err) {
    console.error("[credits.purchase-pack] proxy error:", err);
    return Response.json(
      { success: false, error: err?.message || "Proxy error" },
      { status: 502 }
    );
  }
};
