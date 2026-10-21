import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Create Brand Ads DNA via Python backend.
 * POST /app/api/create-brand-ads-dna
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
      `${PYTHON_API_URL}/api/brand-dna/create`,
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

    const data = await pythonApiResponse.json().catch(() => ({}));
    const responseData =
      data?.success && data?.data
        ? {
            ...data,
            data: {
              ...data.data,
              shop,
              store_url: `https://${shop}`,
            },
          }
        : data;

    return new Response(JSON.stringify(responseData), {
      status: pythonApiResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      `Error creating brand ads DNA for shop ${requestData?.session?.shop}:`,
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
