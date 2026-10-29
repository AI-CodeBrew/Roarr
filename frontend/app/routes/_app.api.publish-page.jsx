import { authenticate } from "../shopify.server";
import { seedDefaultBundleIfNeeded } from "./_app.bundles/seedDefaultBundle.server";

// Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Publish generated page via Python backend
 * POST /app/api/publish-page
 *
 * Sends: productId, category, magicResponse, selectedColor
 */
export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { productId, category, magicResponse, selectedColor, pageId, selectedTemplate } =
      body || {};

    // Sent by the client once a background publish has completed.
    if (body?.intent === "seed_bundle") {
      const authHeader = request.headers.get("authorization");
      await seedDefaultBundleIfNeeded(admin, {
        scope: "products",
        productIds: [productId],
        shopifyJwtToken: authHeader?.replace("Bearer ", "") || null,
      }).catch((e) => console.error("[SeedDefaultBundle] failed:", e?.message));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!magicResponse) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "productId and magicResponse are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Shopify JWT token from Authorization header (same pattern as generate-magic/regenerate-image)
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;

    if (!shopifyJwtToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify JWT token not available in authorization header",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Forward to Python backend.
    // We include shop domain and Shopify access token so the backend can write to Shopify if needed.
    const pythonRes = await fetch(`${PYTHON_API_URL}/api/publish-page`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shop-Domain": session.shop,
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        productId,
        product_id: productId,
        detected_category: category || "general",
        magicResponse,
        magic_response: magicResponse,
        selectedColor: selectedColor || null,
        selected_color: selectedColor || null,
        pageId: pageId || null,
        page_id: pageId || null,
        selectedTemplate:
          [1, 2, 3, 4, 5, 6].includes(Number(selectedTemplate)) ? Number(selectedTemplate) : null,
        selected_template:
          [1, 2, 3, 4, 5, 6].includes(Number(selectedTemplate)) ? Number(selectedTemplate) : null,
        shop: session.shop,
      }),
    });

    const data = await pythonRes.json().catch(async () => {
      const text = await pythonRes.text().catch(() => "");
      return { raw: text };
    });

    if (!pythonRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.error || `Python API error: ${pythonRes.statusText}`,
          details: process.env.NODE_ENV === "development" ? data : undefined,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 202: Python publishes in the background; the client seeds the bundle when it finishes.
    if (pythonRes.status !== 202) {
      // Only this product gets the premium template, so scope the default to it —
      // otherwise the cart discount would fire on pages with no bundle UI.
      void seedDefaultBundleIfNeeded(admin, {
        scope: "products",
        productIds: [productId],
        shopifyJwtToken,
      }).catch((e) => console.error("[SeedDefaultBundle] failed:", e?.message));
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...data,
      }),
      { status: pythonRes.status, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `[PUBLISH_PAGE] Error for shop ${session.shop}:`,
      err?.message
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? err?.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
