import { authenticate } from "../shopify.server";

const PRODUCTS_PER_PAGE = 15;

export async function loader({ request }) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || null;
  const searchQuery = url.searchParams.get("search") || null;

  try {
    const { admin } = await authenticate.admin(request);
    
    // Main products query with variants and images
    const query = `#graphql
      query FetchProductsWithVariants($cursor: String${searchQuery ? ', $query: String' : ''}) {
        products(first: ${PRODUCTS_PER_PAGE}${searchQuery ? ', query: $query' : ''}, sortKey: CREATED_AT, reverse: true, after: $cursor) {
          edges {
            node {
              id
              title
              handle
              status
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
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const variables = {};
    if (cursor) variables.cursor = cursor;
    if (searchQuery) {
      // Search by title and SKU
      // Escape special characters and construct query: title:searchterm OR sku:searchterm
      const escapedQuery = searchQuery.replace(/"/g, '\\"');
      variables.query = `title:${escapedQuery} OR sku:${escapedQuery}`;
    }
    
    const response = await admin.graphql(query, {
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    });
    
    const data = await response.json();
    const products = data?.data?.products?.edges?.map((e) => ({
      ...e.node,
      variants: e.node.variants.edges.map((v) => v.node),
      image: e.node.featuredImage?.url || e.node.images.edges[0]?.node?.url || null,
    })) || [];
    const pageInfo = data?.data?.products?.pageInfo || {};
    
    return Response.json({ 
      products,
      pageInfo,
      cursor: pageInfo.endCursor || null,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json({ 
      products: [], 
      pageInfo: {},
      cursor: null,
      error: error.message 
    }, { status: 500 });
  }
}
