/**
 * Proxy: POST /api/credits/reconcile -> Python backend.
 *
 * Sweeps the user's pending credit-pack purchases against Shopify and
 * grants credits for any that are now active. Safe to call on billing-page
 * mount; it's idempotent.
 */
import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

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

  try {
    const res = await fetch(`${PYTHON_API_URL}/api/credits/reconcile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
      },
    });
    const body = await res.json().catch(() => ({}));
    return Response.json(body, { status: res.status });
  } catch (err) {
    console.error("[credits.reconcile] proxy error:", err);
    return Response.json(
      { success: false, error: err?.message || "Proxy error" },
      { status: 502 }
    );
  }
};
