import { authenticate } from "../shopify.server";

/**
 * Attach generated Brand Ads creative URLs to a Shopify product's media gallery.
 * POST /app/api/brand-dna-add-creatives-to-product
 */
export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const productId = body?.productId;
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((url) => typeof url === "string" && /^https?:\/\//.test(url))
      : [];

    if (!productId) {
      return Response.json({ success: false, error: "productId is required" }, { status: 400 });
    }
    if (imageUrls.length === 0) {
      return Response.json(
        { success: false, error: "At least one public image URL is required" },
        { status: 400 },
      );
    }

    const mutation = `#graphql
      mutation BrandAdsProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(mutation, {
      variables: {
        productId,
        media: imageUrls.map((url, index) => ({
          mediaContentType: "IMAGE",
          originalSource: url,
          alt: `Generated ad creative ${index + 1}`,
        })),
      },
    });

    const data = await response.json();
    const payload = data?.data?.productCreateMedia;
    const errors = payload?.mediaUserErrors || data?.errors || [];

    if (errors.length > 0) {
      return Response.json(
        {
          success: false,
          error: errors.map((e) => e.message || String(e)).join(", "),
          errors,
        },
        { status: 400 },
      );
    }

    return Response.json({
      success: true,
      media: payload?.media || [],
    });
  } catch (err) {
    console.error("Error adding Brand Ads creatives to product:", err);
    return Response.json(
      {
        success: false,
        error: err?.message || "Failed to add creatives to product",
      },
      { status: 500 },
    );
  }
}
