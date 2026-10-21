import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Update the persisted Brand DNA for the current shop.
 * POST /app/api/brand-dna-update
 *
 * Body can include any of:
 *   - { brand_dna: {...full profile...} }
 *   - { dna_patch: {...partial fields...} }
 *   - top-level fields like { brand_name, tagline, primary_colors, ... }
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
    if (request.method !== "POST" && request.method !== "PUT") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
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
      `${PYTHON_API_URL}/api/brand-dna/update`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
        body: JSON.stringify({ ...body, shop }),
      },
    );

    const data = await pythonApiResponse.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: pythonApiResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error updating brand DNA for shop ${requestData?.session?.shop}:`,
      err.message,
    );
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
