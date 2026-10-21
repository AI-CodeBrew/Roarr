import { authenticate } from "../shopify.server";
import crypto from "crypto";

// Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Get generated pages from Python backend
 * GET /app/api/generated-pages
 * 
 * Query Parameters:
 *   published: Filter by published status (true/false). If not provided, returns both.
 *   limit: Number of items per page (default: 20, max: 100)
 *   offset: Number of items to skip (default: 0)
 */
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);

    if (request.method !== "GET") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    // Get query parameters from the request
    const url = new URL(request.url);
    const published = url.searchParams.get("published");
    const limit = url.searchParams.get("limit") || "20";
    const offset = url.searchParams.get("offset") || "0";

    // Build query string for Python backend
    const queryParams = new URLSearchParams();
    if (published !== null) {
      queryParams.append("published", published);
    }
    queryParams.append("limit", limit);
    queryParams.append("offset", offset);

    // Build payload and signature for Python backend
    const payload = {
      shop: session.shop,
      params: {
        published: published ?? undefined,
        limit,
        offset,
      },
    };

    const signature = signPayload(payload);

    // Optional: Get Shopify JWT token from Authorization header (if present)
    const authHeader = request.headers.get("authorization");
    const shopifyJwtToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    // Call Python backend API
    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/api/generated-pages?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shop-Domain": session.shop,
          "X-Internal-Signature": signature,
          ...(shopifyJwtToken
            ? { Authorization: `Bearer ${shopifyJwtToken}` }
            : {}),
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
      `Fetched ${data.data?.length || 0} pages for shop ${session.shop}`
    );

    return json(
      {
        success: true,
        data: data.data || [],
        pagination: data.pagination || {},
      },
      200
    );
  } catch (err) {
    console.error(
      `Error fetching generated pages for shop`,
      err.message
    );
    return json(
      {
        success: false,
        error: err.message,
        details:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      500
    );
  }
}

