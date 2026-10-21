/**
 * Proxy: GET /api/credits/balance -> Python backend GET /api/credits/balance.
 * Returns { success, balance, lifetime_granted, lifetime_spent, packs, feature_costs }.
 */
import { authenticate } from "../shopify.server";
import { pricingHeadersForPython } from "../lib/pricing-region.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const authHeader = request.headers.get("authorization");
  const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;

  if (!shopifyJwtToken) {
    return Response.json(
      { success: false, error: "Missing Shopify session token" },
      { status: 401 }
    );
  }

  const pricingHeaders = pricingHeadersForPython(request);

  try {
    const res = await fetch(`${PYTHON_API_URL}/api/credits/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
        ...Object.fromEntries(pricingHeaders.entries()),
      },
    });
    const body = await res.json().catch(() => ({}));
    return Response.json(body, { status: res.status });
  } catch (err) {
    const cause = err?.cause;
    console.error("[credits.balance] proxy error:", cause || err);
    let message = err?.message || "Proxy error";
    if (cause?.code === "ECONNREFUSED") {
      message =
        "Could not connect to the Kluck API (connection refused). Start the Python backend or fix PYTHON_API_URL in your env.";
    }
    return Response.json({ success: false, error: message }, { status: 502 });
  }
};
