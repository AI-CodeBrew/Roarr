import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Delete a bundle using your Python backend API
 * DELETE /app/api/delete-bundle
 */
export async function action({ request }) {
  try {
    if (request.method !== "DELETE") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authenticate (no subscription check for delete)
    await authenticate.admin(request);

    const body = await request.json();
    const { id: bundleId } = body;

    if (!bundleId) {
      return new Response(
        JSON.stringify({ success: false, error: "Bundle ID is required" }),
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

    console.log("[Delete Bundle API] Calling Python API for bundle:", bundleId);
    // console.log("[Delete Bundle API] Shop:", shop);
    console.log("[Delete Bundle API] Python API URL:", PYTHON_API_URL);

    // Call your Python backend API
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/bundler/bundle`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        // "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify({ id: bundleId }),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();

    console.log(
      `[Delete Bundle API] Successfully deleted bundle '${bundleId}'`
    );

    return new Response(
      JSON.stringify({
        success: true,
        bundle: data.bundle || null,
        message: data.message || "Bundle deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `[Delete Bundle API] Error deleting bundle:`,
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
