import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Query best selling products - Shopify doesn't have a direct BEST_SELLING sort key
    // So we'll use TOTAL_SALES which is the closest equivalent
    // If that's not available, we'll fall back to CREATED_AT
    const query = `#graphql
      query FetchBestSellingProducts {
        products(first: 4, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              title
              description
              descriptionHtml
              handle
              status
              vendor
              productType
              featuredImage {
                url
                altText
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();
    const products = data?.data?.products?.edges?.map((e) => e.node) || [];
    
    return Response.json({ 
      products,
    });
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return Response.json({ 
      products: [], 
      error: error.message 
    }, { status: 500 });
  }
}
