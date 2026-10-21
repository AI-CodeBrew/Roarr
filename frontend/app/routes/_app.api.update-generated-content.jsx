import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Update generated content using your Python backend API
 * POST /app/api/update-generated-content
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { admin, session } = requestData;

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { pageId, magicContent } = body;

    if (!pageId || !magicContent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "pageId and magicContent are required" 
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
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/update-generated-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify({
        pageId,
        magicContent,
        shop, // Include shop domain for additional context
      }),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();

    console.log(
      `Generated content updated for page '${pageId}' by shop ${shop}`
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
      `Error updating generated content for shop ${session.shop}:`,
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

