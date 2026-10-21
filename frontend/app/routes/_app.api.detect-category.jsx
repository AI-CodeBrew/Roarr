import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/** Categories that detect-category can return */
export const DETECT_CATEGORY_TYPES = [
  "health_beauty",
  "fashion",
  "home_kitchen",
  "kids_toys",
  "car_accessories",
  "general",
];

/**
 * Detect product category using your Python backend API
 * POST /app/api/detect-category
 */
export async function action({ request }) {
  const requestData = await authenticate.admin(request);
  const { session } = requestData;

  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: "Product title is required" }),
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

    // Call your Python backend API
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/detect-category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
        "X-Shop-Domain": shop, // Additional shop context
      },
      body: JSON.stringify({
        title,
        description: description || "",
        shop, // Include shop domain for additional context
      }),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Python API error: ${pythonApiResponse.statusText}`
      );
    }

    const data = await pythonApiResponse.json();
    const rawCategory = data.category;
    const category = DETECT_CATEGORY_TYPES.includes(rawCategory)
      ? rawCategory
      : "general";

    console.log(
      `Detected category '${category}' for product '${title}' by shop ${shop}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        category,
        title: title,
        description: description || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(
      `Error detecting category for shop ${session.shop}:`,
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

