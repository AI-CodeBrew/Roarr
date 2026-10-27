import { authenticate } from "../shopify.server";

// Your Python backend API URL - set this in your environment variables
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Generate magic template using your Python backend API
 * POST /app/api/generate-magic
 */
export async function action({ request }) {
    const requestData = await authenticate.admin(request);
    const { admin, session } = requestData;

    try {
        if (request.method !== "POST") {
            return new Response(
                JSON.stringify({ success: false, error: "Method not allowed" }),
                { status: 405, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { productTitle, productDescription, productImages, storeName, category, productId, pageId, language, selectedTemplate } = body;

        if (!productTitle || !productDescription || !productImages) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "productTitle, productDescription, and productImages are required"
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

        // Call your Python backend API
        const pythonApiResponse = await fetch(`${PYTHON_API_URL}/api/generation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${shopifyJwtToken}`, // Shopify JWT session token
                "X-Shop-Domain": shop, // Additional shop context
            },
            body: JSON.stringify({
                productTitle,
                productDescription,
                productImages: Array.isArray(productImages) ? productImages : [],
                storeName: storeName || shop,
                category: category || 'general',
                productId: productId || null,
                product_id: productId || null,
                shop, // Include shop domain for additional context
                pageId: pageId || null,
                page_id: pageId || null,
                language: language || null,
                selectedTemplate:
                    [1, 2, 3, 4].includes(Number(selectedTemplate)) ? Number(selectedTemplate) : null,
            }),
        });

        if (!pythonApiResponse.ok) {
            // Forward original status (e.g. 402 InsufficientCredits) so the
            // client can render the right UX, not a generic 500.
            const errorData = await pythonApiResponse.json().catch(() => ({}));
            return new Response(
                JSON.stringify(errorData || { success: false }),
                {
                    status: pythonApiResponse.status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const data = await pythonApiResponse.json();

        console.log(
            `Magic generation completed for product '${productTitle}' by shop ${shop}`
        );

        return new Response(
            JSON.stringify({
                success: true,
                ...data,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error(
            `Error generating magic for shop ${session.shop}:`,
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

