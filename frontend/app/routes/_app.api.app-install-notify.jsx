import { authenticate, ensureShopBlockControlEnabled } from "../shopify.server";
import { fetchShopDetails } from "../lib/shop-details";
import crypto from "crypto";

// Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Secure install notification (triggered from embedded app client)
 * POST /api/app-install-notify
 *
 * Auth: accepts either cookie-based session OR Authorization: Bearer <Shopify session token>.
 * Forwards Authorization when present, and also includes an internal signature header for robustness.
 */
export async function action({ request }) {
  try {
    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    let admin, session;
    try {
      const requestData = await authenticate.admin(request);
      admin = requestData.admin;
      session = requestData.session;
    } catch (err) {
      // Keep response stable for client fetch; don't throw redirects into fetch.
      return json(
        {
          success: false,
          error: "Unauthorized",
        },
        401
      );
    }

    // Authorization header is optional (cookie auth can be enough).
    // If present, forward it to Python so it can validate session tokens.
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    const body = await request.clone().json().catch(() => ({}));

    const blockResult = await ensureShopBlockControlEnabled(admin, session);
    if (!blockResult.success) {
      console.warn(
        `[APP_INSTALL_NOTIFY] block_control not set for ${session.shop}`,
        blockResult.errors,
      );
    }

    // Fetch shop details using admin client (more reliable than direct token fetch)
    const shopDetails = await fetchShopDetails(admin, session);

    const payload = {
      shop: session.shop,
      event: "install",
      timestamp: new Date().toISOString(),
      sessionId: session.id,
      accessToken: session.accessToken,
      shopDetails: {
        shop: shopDetails?.shop,
      },
      ...body,
    };

    const signature = signPayload(payload);

    const pythonRes = await fetch(`${PYTHON_API_URL}/api/app/install`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shop-Domain": session.shop,
        // Supports Python verifying our server-to-server signature even if Authorization is missing.
        "X-Internal-Signature": signature,
        ...(shopifyJwtToken ? { Authorization: `Bearer ${shopifyJwtToken}` } : {}),
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
    console.error(`[APP_INSTALL_NOTIFY] Error:`, err?.message);
    return json(
      {
        success: false,
        error: err?.message || "Internal server error",
      },
      500
    );
  }
}


