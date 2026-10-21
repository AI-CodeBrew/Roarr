import { authenticate } from "../shopify.server";

// Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Update only metafields and main images of an existing published product.
 * Proxies to Python backend /api/update-publish-page.
 * POST /app/api/update-publish-page
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const {
      magic_response,
      magicResponse,
      page_id,
      pageId,
      selected_color,
      selectedColor,
    } = body;

    const magicResp = magic_response ?? magicResponse;
    if (!magicResp || typeof magicResp !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "magic_response is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/update-publish-page`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
        body: JSON.stringify({
          magic_response: magicResp,
          page_id: page_id ?? pageId ?? null,
          selected_color: selected_color ?? selectedColor ?? null,
          shop,
        }),
      }
    );

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();

    console.log(
      `Updated publish page for page_id ${page_id ?? pageId} by shop ${shop}`
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error updating publish page for shop ${session.shop}:`,
      err.message
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        details:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
