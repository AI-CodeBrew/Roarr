import { authenticate } from "../shopify.server";

const PRODUCTS_PER_PAGE = 15;

export const loader = async ({ request }) => {
    try {
        const { admin } = await authenticate.admin(request);
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor") || null;
        const host = url.searchParams.get("host") || null;

        const [productsRes, countRes] = await Promise.all([
            admin
                    .graphql(
                        `#graphql
              query FetchProductsForGenerate($cursor: String) {
                products(first: ${PRODUCTS_PER_PAGE}, sortKey: CREATED_AT, reverse: true, after: $cursor) {
                  edges {
                    node {
                      id
                      title
                      description
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
                      images(first: 25) {
                        edges {
                          node {
                            url
                            altText
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
            `,
                        { variables: cursor ? { cursor } : {} }
                    )
                    .then((r) => r.json())
                    .catch((err) => {
                        console.error("Error fetching products:", err);
                        return null;
                    }                    ),
            admin
                    .graphql(`#graphql
            query GetTotalProductCount {
              productsCount {
                count
              }
            }
          `)
                    .then((r) => r.json())
                    .then((d) => d?.data?.productsCount?.count ?? null)
                    .catch(() => null),
        ]);

        const products =
            productsRes?.data?.products?.edges?.map((e) => e.node) || [];
        const pageInfo = productsRes?.data?.products?.pageInfo || {};
        return Response.json({
            products,
            pageInfo,
            currentCursor: cursor,
            totalCount: countRes,
            productsPerPage: PRODUCTS_PER_PAGE,
            host,
            locales: [],
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return Response.json(
            {
                error: "Failed to fetch dashboard data",
                products: [],
                pageInfo: {},
                currentCursor: null,
                totalCount: 0,
                productsPerPage: PRODUCTS_PER_PAGE,
                host: null,
                locales: [],
            },
            { status: 500 }
        );
    }
};
