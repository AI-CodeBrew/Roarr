import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Get generation status for a specific page_id
 * GET /app/api/generation-status/:pageId
 */
export async function loader({ request, params }) {
  const { session } = await authenticate.admin(request);

  try {
    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const { pageId } = params;

    if (!pageId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "page_id is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Shopify JWT token from Authorization header
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

    // Call your Python backend API
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/generation-status/${pageId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        "X-Shop-Domain": shop, // Additional shop context
      },
    });

    const data = await pythonApiResponse.json().catch(() => ({}));

    if (!pythonApiResponse.ok) {
      // Preserve 401 so the client can refresh the session token and retry.
      return new Response(
        JSON.stringify({
          success: false,
          error:
            data.error ||
            `Python API error: ${pythonApiResponse.statusText}`,
          ...data,
        }),
        {
          status: pythonApiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Generation status retrieved for page_id ${pageId} by shop ${shop}: ${data.generation_status}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        ...data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `Error getting generation status: ${err.message}`
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

