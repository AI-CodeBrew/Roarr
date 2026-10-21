import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Get store details using your Python backend API
 * GET /app/api/store-details
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

    // Get Shopify JWT token from Authorization header (optional for internal calls)
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;
    const shop = session.shop;

    // Prepare headers for Python backend API call
    const pythonApiHeaders = {
      "Content-Type": "application/json",
      "X-Shop-Domain": shop, // Additional shop context
    };

    // Only add Authorization header if Bearer token is available
    if (shopifyJwtToken) {
      pythonApiHeaders["Authorization"] = `Bearer ${shopifyJwtToken}`;
    }

    // Call your Python backend API
    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/shopify/store-details`,
      {
        method: "GET",
        headers: pythonApiHeaders,
      }
    );

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.error || `Python API error: ${pythonApiResponse.statusText}`,
          details: process.env.NODE_ENV === "development" ? errorData : undefined,
        }),
        { status: pythonApiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await pythonApiResponse.json();


    return new Response(
      JSON.stringify({
        success: true,
        ...data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `Error fetching store details for shop ${session.shop}:`,
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

