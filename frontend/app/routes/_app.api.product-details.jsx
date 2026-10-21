import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  
  if (!productId) {
    return Response.json({ product: null }, { status: 400 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const query = `#graphql
      query ProductDetailsForGenerate($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          descriptionHtml
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                availableForSale
              }
            }
          }
          images(first: 20) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, { variables: { id: productId } });
    const data = await response.json();
    const product = data?.data?.product || null;
    
    return Response.json({ product });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return Response.json({ product: null, error: error.message }, { status: 500 });
  }
}

