import { authenticate } from "../shopify.server";

const PRODUCTS_PER_PAGE = 15;

export async function loader({ request }) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || null;
  const searchQuery = url.searchParams.get("search") || null;

  try {
    const { admin } = await authenticate.admin(request);
    
    // Main products query - use search if provided
    const query = searchQuery
      ? `#graphql
        query FetchProductsForGenerate($query: String!, $cursor: String) {
          products(first: ${PRODUCTS_PER_PAGE}, query: $query, sortKey: RELEVANCE, after: $cursor) {
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
                createdAt
                updatedAt
                featuredImage {
                  url
                  altText
                }
                images(first: 2) {
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
                      title
                      price
                      compareAtPrice
                      availableForSale
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
      `
      : `#graphql
        query FetchProductsForGenerate($cursor: String) {
          products(first: ${PRODUCTS_PER_PAGE}, sortKey: CREATED_AT, reverse: true, after: $cursor) {
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
                createdAt
                updatedAt
                featuredImage {
                  url
                  altText
                }
                images(first: 2) {
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
                      title
                      price
                      compareAtPrice
                      availableForSale
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

    // Build search query string for Shopify GraphQL
    // Shopify uses a simple query format - just the search term works for title/description search
    const searchQueryString = searchQuery ? searchQuery : null;

    const response = await admin.graphql(query, {
      variables: searchQuery
        ? { query: searchQueryString, cursor: cursor || null }
        : { cursor: cursor || null },
    });

    const data = await response.json();
    const products = data?.data?.products?.edges?.map((e) => e.node) || [];
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
