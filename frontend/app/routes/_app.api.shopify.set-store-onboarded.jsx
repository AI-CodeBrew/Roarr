import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Mark store as onboarded via Python backend.
 * POST /app/api/shopify/set-store-onboarded
 *
 * Auth: Shopify JWT session token in Authorization: Bearer <token>. Optional body: { plan }.
 */
export async function action({ request }) {
  try {
    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    let session;
    try {
      const { session: s } = await authenticate.admin(request);
      session = s;
    } catch (err) {
      return json(
        { success: false, error: "Unauthorized" },
        401
      );
    }

    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "")?.trim() || null;

    if (!shopifyJwtToken) {
      return json(
        {
          success: false,
          error: "Shopify JWT token not available in authorization header",
        },
        401
      );
    }

    const body = await request.clone().json().catch(() => ({}));
    const payload = {
      shop: session.shop,
      timestamp: new Date().toISOString(),
      ...body,
    };

    const pythonRes = await fetch(`${PYTHON_API_URL}/api/shopify/set-store-onboarded`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": session.shop,
      },
      body: JSON.stringify(payload),
    });

    if (!pythonRes.ok) {
      const errJson = await pythonRes.json().catch(() => ({}));
      return json(
        {
          success: false,
          error: errJson?.error || `Python API error: ${pythonRes.statusText}`,
        },
        502
      );
    }

    const data = await pythonRes.json().catch(() => ({}));
    return json({ success: true, ...data }, 200);
  } catch (err) {
    console.error("[SET_STORE_ONBOARDED] Error:", err?.message);
    return json(
      {
        success: false,
        error: err?.message || "Internal server error",
      },
      500
    );
  }
}
