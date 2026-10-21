import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Regenerate a single Brand Ads creative image (proxies to Python regenerate-image).
 * POST /app/api/brand-dna-regenerate-creative
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { image_url, prompt, image_key, aspect_ratio } = body;

    if (!image_url || !prompt || !image_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "image_url, prompt, and image_key are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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

    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/regenerate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
      },
      body: JSON.stringify({
        image_url,
        prompt,
        image_key,
        shop,
        source: "brand_ads_creative",
        ...(typeof aspect_ratio === "string" && aspect_ratio.trim()
          ? { aspect_ratio: aspect_ratio.trim() }
          : {}),
      }),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      return new Response(JSON.stringify(errorData || { success: false }), {
        status: pythonApiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await pythonApiResponse.json().catch(() => ({}));

    return new Response(
      JSON.stringify({
        success: true,
        image_key: data.image_key,
        image_url: data.image_url,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      `Error regenerating Brand Ads creative for shop ${session.shop}:`,
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
