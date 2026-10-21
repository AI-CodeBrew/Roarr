import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Fetch the persisted Brand DNA for the current shop, if any.
 * GET /app/api/brand-dna-fetch
 */
export async function loader({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
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

    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/brand-dna`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${shopifyJwtToken}`,
        "X-Shop-Domain": shop,
      },
    });

    const data = await pythonApiResponse.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: pythonApiResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error fetching brand DNA for shop ${requestData?.session?.shop}:`,
      err.message,
    );
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
