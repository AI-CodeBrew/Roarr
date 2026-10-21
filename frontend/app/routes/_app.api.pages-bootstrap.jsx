import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Combined store-details + generated pages (single Python round-trip).
 * Proxies GET /api/shopify/pages-bootstrap on the Python backend.
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

    const url = new URL(request.url);
    const published = url.searchParams.get("published");
    const limit = url.searchParams.get("limit") || "100";
    const offset = url.searchParams.get("offset") || "0";

    const qs = new URLSearchParams();
    if (published !== null) qs.set("published", published);
    qs.set("limit", limit);
    qs.set("offset", offset);

    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;
    const shop = session.shop;

    const pythonApiHeaders = {
      "Content-Type": "application/json",
      "X-Shop-Domain": shop,
    };
    if (shopifyJwtToken) {
      pythonApiHeaders.Authorization = `Bearer ${shopifyJwtToken}`;
    }

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/shopify/pages-bootstrap?${qs.toString()}`,
      { method: "GET", headers: pythonApiHeaders }
    );

    const data = await pythonApiResponse.json().catch(() => ({}));

    if (!pythonApiResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || `Python API error: ${pythonApiResponse.statusText}`,
          details: process.env.NODE_ENV === "development" ? data : undefined,
        }),
        {
          status: pythonApiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=15",
      },
    });
  } catch (err) {
    console.error("pages-bootstrap error:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
