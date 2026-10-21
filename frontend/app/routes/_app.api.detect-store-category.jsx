import { authenticate } from "../shopify.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

const DETECT_CATEGORY_TYPES = [
  "health_beauty",
  "fashion",
  "home_kitchen",
  "kids_toys",
  "car_accessories",
  "general",
];

/**
 * Detect store category from top products using Python backend API.
 * POST /app/api/detect-store-category
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
    const products = Array.isArray(body?.products) ? body.products : [];
    const sanitizedProducts = products
      .map((product) => ({
        title: String(product?.title || "").trim(),
        description: String(product?.description || "").trim(),
      }))
      .filter((product) => product.title);

    if (sanitizedProducts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "At least one product title is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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
      `${PYTHON_API_URL}/api/detect-store-category`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shopifyJwtToken}`,
          "X-Shop-Domain": shop,
        },
        body: JSON.stringify({
          products: sanitizedProducts,
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
    const rawCategory = data?.category;
    const category = DETECT_CATEGORY_TYPES.includes(rawCategory)
      ? rawCategory
      : "general";
    const confidencePercentage = Number(data?.confidence_percentage);

    return new Response(
      JSON.stringify({
        success: true,
        category,
        confidence_percentage: Number.isFinite(confidencePercentage)
          ? Math.round(confidencePercentage * 100) / 100
          : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      `Error detecting store category for shop ${session.shop}:`,
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
