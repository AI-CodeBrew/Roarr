import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Restore a generated Shopify product back to the original content snapshot
 * POST /app/api/restore-original-content
 *
 * Expected input (JSON):
 * - page_id (or pageId): generated page id
 * - is_enabled (optional): boolean flag
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
    const pageId = body?.page_id || body?.pageId || null;
    const isEnabled =
      typeof body?.is_enabled === "boolean"
        ? body.is_enabled
        : typeof body?.isEnabled === "boolean"
          ? body.isEnabled
          : undefined;

    if (!pageId) {
      return new Response(
        JSON.stringify({ success: false, error: "page_id (or pageId) is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Call your Python backend API
    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/restore-original-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
          "X-Shop-Domain": shop, // Additional shop context
        },
        body: JSON.stringify({
          page_id: pageId,
          ...(typeof isEnabled === "boolean" ? { is_enabled: isEnabled } : {}),
          shop,
        }),
      },
    );

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`,
      );
    }

    const data = await pythonApiResponse.json();

    console.log(`Restored original content for page_id ${pageId} by shop ${shop}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      `Error restoring original content for shop ${session.shop}:`,
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

