/**
 * Proxy: GET /api/credits/purchases?status=&limit= -> Python backend.
 */
import { authenticate } from "../shopify.server";

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

  const url = new URL(request.url);
  const qs = new URLSearchParams();
  const status = url.searchParams.get("status");
  const limit = url.searchParams.get("limit");
  if (status) qs.set("status", status);
  if (limit) qs.set("limit", limit);

  const target =
    `${PYTHON_API_URL}/api/credits/purchases` +
    (qs.toString() ? `?${qs.toString()}` : "");

  try {
    const res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
      },
    });
    const body = await res.json().catch(() => ({}));
    return Response.json(body, { status: res.status });
  } catch (err) {
    console.error("[credits.purchases] proxy error:", err);
    return Response.json(
      { success: false, error: err?.message || "Proxy error" },
      { status: 502 }
    );
  }
};
