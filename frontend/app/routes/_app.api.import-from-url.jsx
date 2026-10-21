import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Import product from URL using your Python backend API
 * POST /app/api/import-from-url
 */
export async function action({ request }) {
    const { admin, session } = await authenticate.admin(request);

    try {
        if (request.method !== "POST") {
            return new Response(
                JSON.stringify({ success: false, error: "Method not allowed" }),
                { status: 405, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { product_url, source } = body;

        if (!product_url || !product_url.trim()) {
            return new Response(
                JSON.stringify({ success: false, error: "URL is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!source) {
            return new Response(
                JSON.stringify({ success: false, error: "Source is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Prepare headers for Python backend API call
        const pythonApiHeaders = {
            "Content-Type": "application/json",
        };

        // Get Shopify JWT token if available
        const authHeader = request.headers.get("authorization");
        const shopifyJwtToken = authHeader?.replace("Bearer ", "") || null;
        if (shopifyJwtToken) {
            pythonApiHeaders["Authorization"] = `Bearer ${shopifyJwtToken}`;
        }

        // Call your Python backend API
        const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/import-from-url`, {
            method: "POST",
            headers: pythonApiHeaders,
            body: JSON.stringify({
                product_url: product_url.trim(),
                source: source.toLowerCase(),
            }),
        });

        if (!pythonApiResponse.ok) {
            const errorData = await pythonApiResponse.json().catch(() => ({}));
            return new Response(
                JSON.stringify({
                    success: false,
                    error: errorData.error || `Python API error: ${pythonApiResponse.statusText}`,
                }),
                { status: pythonApiResponse.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await pythonApiResponse.json();
        return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error importing product from URL:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Failed to import product from URL",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

