import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Create a new bundle using your Python backend API
 * POST /app/api/create-bundle
 */
export async function action({ request }) {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const { admin, session } = await authenticate.admin(request);

    const body = await request.json();
    const bundleData = body;

    if (!bundleData || !bundleData.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Bundle data with ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Shopify JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;
    // const shop = session.shop;

    if (!shopifyJwtToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify JWT token not available in authorization header",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Create Bundle API] Calling Python API for bundle:", bundleData.id);

    // Map bundle data for Python API (convert "upselling" to "upsell")
    const pythonBundleData = {
      ...bundleData,
      type: bundleData.type === "upselling" ? "upsell" : bundleData.type,
    };

    // Call your Python backend API
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/bundler/bundle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        // "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify(pythonBundleData),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();

    console.log(
      `[Create Bundle API] Successfully created bundle '${bundleData.id}'`
    );

    return new Response(
      JSON.stringify({
        success: true,
        bundle: data.bundle || pythonBundleData,
        message: data.message || "Bundle created successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `[Create Bundle API] Error creating bundle:`,
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
