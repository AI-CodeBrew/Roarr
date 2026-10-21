import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Generate preview link for a generated page
 * GET /app/api/generate-preview-link?page_id={pageId}
 */
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  try {
    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get query parameters from the request
    const url = new URL(request.url);
    const pageId = url.searchParams.get("page_id");

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
    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/generate-preview-link?page_id=${pageId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
          "X-Shop-Domain": shop, // Additional shop context
        },
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
      `Preview link generated for page_id ${pageId} by shop ${shop}`
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
      `Error generating preview link: ${err.message}`
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

