import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Check coupon access using your Python backend API
 * GET /app/api/check-coupon-access?coupon_code=CODE&plan_name=Starter&billing_interval=monthly
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

    // Get coupon_code from query parameters
    const url = new URL(request.url);
    const couponCode = url.searchParams.get("coupon_code");
    const planName = url.searchParams.get("plan_name");
    const billingInterval = url.searchParams.get("billing_interval");

    if (!couponCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "coupon_code query parameter is required",
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


    const pythonUrl = new URL(`${PYTHON_API_URL}/api/shopify/check-coupon-access`);
    pythonUrl.searchParams.set("coupon_code", couponCode);
    if (planName) pythonUrl.searchParams.set("plan_name", planName);
    if (billingInterval) pythonUrl.searchParams.set("billing_interval", billingInterval);

    // Call your Python backend API
    const pythonApiResponse = await fetch(
      pythonUrl.toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
          "X-Shop-Domain": shop, // Additional shop context
        },
      }
    );

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.error || `Python API error: ${pythonApiResponse.statusText}`,
          details: process.env.NODE_ENV === "development" ? errorData : undefined,
        }),
        { status: pythonApiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await pythonApiResponse.json();


    return new Response(
      JSON.stringify({
        success: true,
        ...data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `Error checking coupon access for shop ${session.shop}:`,
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

