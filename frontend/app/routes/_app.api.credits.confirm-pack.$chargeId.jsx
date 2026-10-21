/**
 * Proxy: POST /api/credits/confirm-pack/<charge_id> -> Python backend.
 * Used by the return-URL callback page to grant credits after Shopify
 * approval.
 */
import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export const action = async ({ request, params }) => {
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

  const chargeId = params.chargeId;
  if (!chargeId) {
    return Response.json(
      { success: false, error: "charge_id missing" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${PYTHON_API_URL}/api/credits/confirm-pack/${encodeURIComponent(chargeId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
      }
    );
    const body = await res.json().catch(() => ({}));
    return Response.json(body, { status: res.status });
  } catch (err) {
    console.error("[credits.confirm-pack] proxy error:", err);
    return Response.json(
      { success: false, error: err?.message || "Proxy error" },
      { status: 502 }
    );
  }
};
