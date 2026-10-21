import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * List brand-ads campaigns or fetch one.
 * GET /app/api/brand-dna-campaigns
 * GET /app/api/brand-dna-campaigns?campaignId=<uuid>
 */
export async function loader({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("campaignId");
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

    const pythonUrl = campaignId
      ? `${PYTHON_API_URL}/api/brand-dna/campaigns/${encodeURIComponent(campaignId)}`
      : `${PYTHON_API_URL}/api/brand-dna/campaigns`;

    const pythonApiResponse = await fetch(pythonUrl, {
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
      `Error fetching brand ads campaigns for shop ${requestData?.session?.shop}:`,
      err.message,
    );
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
