import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Regenerate image using your Python backend API
 * POST /app/api/regenerate-image
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
    const { image_url, prompt, image_key, pageId, reference_image_urls } = body;

    if (!image_url || !prompt || !image_key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "image_url, prompt, and image_key are required" 
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
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/regenerate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify({
        image_url,
        prompt,
        image_key,
        shop, // Include shop domain for additional context
        pageId: pageId || null, // Include pageId if provided
        reference_image_urls: Array.isArray(reference_image_urls) ? reference_image_urls : undefined,
      }),
    });

    if (!pythonApiResponse.ok) {
      // Forward the original status (especially 402 InsufficientCredits) so
      // the client can display the correct UX (e.g. "buy credits" modal)
      // instead of a generic 500.
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      return new Response(JSON.stringify(errorData || { success: false }), {
        status: pythonApiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await pythonApiResponse.json();

    console.log(
      `Image regeneration completed for image '${image_key}' by shop ${shop}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        image_key: data.image_key,
        image_url: data.image_url,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `Error regenerating image for shop ${session.shop}:`,
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

