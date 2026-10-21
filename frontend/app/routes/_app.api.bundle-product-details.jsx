import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");
  
  if (!idsParam) {
    return Response.json({ products: [] }, { status: 400 });
  }

  try {
    const productIds = JSON.parse(idsParam);
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return Response.json({ products: [] }, { status: 400 });
    }

    const { admin } = await authenticate.admin(request);
    
    // Fetch products by IDs
    const query = `#graphql
      query FetchProductsByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
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
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, { variables: { ids: productIds } });
    const data = await response.json();
    const nodes = data?.data?.nodes || [];
    
    const products = nodes
      .filter(node => node !== null)
      .map(node => {
        const firstVariant = node.variants?.edges?.[0]?.node;
        const price = firstVariant?.price ? parseFloat(firstVariant.price) : null;
        return {
          id: node.id,
          title: node.title || "",
          image: node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || null,
          price:
            price != null && Number.isFinite(price) && price > 0 ? price : null,
          variants: firstVariant
            ? [
                {
                  id: firstVariant.id,
                  price:
                    price != null && Number.isFinite(price) && price > 0
                      ? price
                      : null,
                },
              ]
            : [],
        };
      });
    
    return Response.json({ products });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return Response.json({ products: [], error: error.message }, { status: 500 });
  }
}
