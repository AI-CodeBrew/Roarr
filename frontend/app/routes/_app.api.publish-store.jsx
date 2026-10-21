import { authenticate } from "../shopify.server";
import { seedDefaultBundleIfNeeded } from "./_app.bundles/seedDefaultBundle.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Publish store via Python backend.
 * POST /app/api/publish-store
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { admin, session } = requestData;

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json();

    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;
    const shop = session.shop;

    if (!shopifyJwtToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify JWT token not available in authorization header",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/publish-store`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
        body: JSON.stringify({
          ...body,
          shop,
        }),
      },
    );

    const data = await pythonApiResponse.json().catch(() => ({}));

    if (!pythonApiResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || `Python API error: ${pythonApiResponse.statusText}`,
          ...(data.code != null ? { code: data.code } : {}),
        }),
        { status: pythonApiResponse.status, headers: { "Content-Type": "application/json" } },
      );
    }

    // The store publish writes `templates/product.json`, so every product renders
    // the bundle block and a global default is safe.
    void seedDefaultBundleIfNeeded(admin, {
      scope: "global",
      shopifyJwtToken,
    }).catch((e) => console.error("[SeedDefaultBundle] failed:", e?.message));

    return new Response(JSON.stringify(data), {
      status: pythonApiResponse.status || 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error publishing store for shop ${requestData?.session?.shop}:`,
      err.message,
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
