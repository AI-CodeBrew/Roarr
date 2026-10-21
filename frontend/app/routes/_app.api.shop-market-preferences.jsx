import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET/POST /app/api/shop-market-preferences
 * Proxies shop-level COD/prepaid, country, and language preferences.
 */
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "")?.trim() || null;
    if (!shopifyJwtToken) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const pythonRes = await fetch(
      `${PYTHON_API_URL}/api/shopify/shop-market-preferences`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": session.shop,
        },
      },
    );
    const data = await pythonRes.json().catch(() => ({}));
    return json(data, pythonRes.status);
  } catch (err) {
    console.error("[shop-market-preferences] loader error:", err?.message);
    return json({ success: false, error: "Failed to load preferences" }, 500);
  }
}

export async function action({ request }) {
  try {
    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    const { session } = await authenticate.admin(request);
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "")?.trim() || null;
    if (!shopifyJwtToken) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await request.clone().json().catch(() => ({}));
    const pythonRes = await fetch(
      `${PYTHON_API_URL}/api/shopify/shop-market-preferences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": session.shop,
        },
        body: JSON.stringify({
          shop: session.shop,
          ...body,
        }),
      },
    );
    const data = await pythonRes.json().catch(() => ({}));
    return json(data, pythonRes.status);
  } catch (err) {
    console.error("[shop-market-preferences] action error:", err?.message);
    return json({ success: false, error: "Failed to save preferences" }, 500);
  }
}
