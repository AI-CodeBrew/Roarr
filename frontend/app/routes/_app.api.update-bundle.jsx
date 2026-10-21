import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Update an existing bundle using your Python backend API
 * PUT /app/api/update-bundle
 */
export async function action({ request }) {
  try {
    if (request.method !== "PUT") {
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

    if (!shopifyJwtToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify JWT token not available in authorization header",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Update Bundle API] Calling Python API for bundle:", bundleData.id);
    // console.log("[Update Bundle API] Shop:", shop);
    console.log("[Update Bundle API] Python API URL:", PYTHON_API_URL);

    // Map bundle data for Python API (convert "upselling" to "upsell")
    const pythonBundleData = {
      ...bundleData,
      type: bundleData.type === "upselling" ? "upsell" : bundleData.type,
    };

    // Call your Python backend API
    let pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/bundler/bundle`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        // "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify(pythonBundleData),
    });

    // Auto-seeded store bundles exist in Shopify metafields but may never have
    // been written to DynamoDB — create on 404 so the merchant can save edits.
    if (pythonApiResponse.status === 404) {
      console.log(
        "[Update Bundle API] Bundle missing in backend; creating:",
        bundleData.id,
      );
      pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/bundler/bundle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
        },
        body: JSON.stringify(pythonBundleData),
      });
    }

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();

    console.log(
      `[Update Bundle API] Successfully updated bundle '${bundleData.id}'`
    );

    return new Response(
      JSON.stringify({
        success: true,
        bundle: data.bundle || pythonBundleData,
        message: data.message || "Bundle updated successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) { 
    console.error(
      `[Update Bundle API] Error updating bundle:`,
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
