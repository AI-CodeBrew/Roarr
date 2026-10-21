import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Generate store-level content (home + product, etc.) via Python backend.
 * POST /app/api/generate-for-store
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

    const body = await request.json();

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

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/generate-for-store`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
        body: JSON.stringify({
          ...body,
          shop,
        }),
      },
    );

    if (!pythonApiResponse.ok) {
      // Forward original status (e.g. 402 InsufficientCredits) so the client
      // can show the right UX, not a generic 500.
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      return new Response(JSON.stringify(errorData || { success: false }), {
        status: pythonApiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await pythonApiResponse.json();

    return new Response(JSON.stringify(data), {
      // Forward Python status (e.g. 202 for async job start).
      status: pythonApiResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error generating store content for shop ${requestData?.session?.shop}:`,
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

