/**
 * Loader logic for the bundles page.
 * Fetches shop data, products, themes, and parses bundles from metafield.
 */
import { authenticate } from "../../shopify.server";
import { ensureBundlerDiscount } from "./ensureBundlerDiscount.server";
import { parseBundlesFromMetafield } from "./bundleParsing.server";

const SHOP_QUERY = `#graphql
  query getShopBundlesAndCurrency {
    shop {
      id
      metafield(namespace: "kluck_bundle", key: "bundles") {
        id
        value
      }
      currencyCode
      currencyFormats {
        moneyFormat
        moneyInEmailsFormat
        moneyWithCurrencyFormat
        moneyWithCurrencyInEmailsFormat
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  query getProductsWithVariants {
    products(first: 50) {
      edges {
        node {
          id
          title
          featuredImage {
            url
          }
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                image {
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;

const THEMES_QUERY = `#graphql
  query getPublishedTheme {
    themes(first: 10) {
      edges {
        node {
          id
          name
          role
        }
      }
    }
  }
`;

function buildProductsAndVariants(productsJson) {
  const variants = [];
  const products = [];

  productsJson.data?.products?.edges?.forEach((edge) => {
    const productImage =
      edge.node.featuredImage?.url ||
      edge.node.images?.edges?.[0]?.node?.url ||
      null;

    const product = {
      id: edge.node.id,
      title: edge.node.title,
      image: productImage,
      variants: edge.node.variants.edges.map((vEdge) => ({
        id: vEdge.node.id,
        title: vEdge.node.title,
        price: vEdge.node.price ? parseFloat(vEdge.node.price) : null,
        image: vEdge.node.image?.url || productImage,
      })),
    };
    products.push(product);

    edge.node.variants.edges.forEach((vEdge) => {
      variants.push({
        id: vEdge.node.id,
        title: vEdge.node.title,
        image: vEdge.node.image?.url || productImage,
        product: {
          id: edge.node.id,
          title: edge.node.title,
          image: productImage,
        },
      });
    });
  });

  return { products, variants };
}

export async function bundlesLoader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  ensureBundlerDiscount(admin).catch((error) => {
    console.error(
      "[BundlerDiscount] Unhandled error in background task:",
      error,
    );
  });

  const [shopResponse, productsResponse, themesResponse] = await Promise.all([
    admin.graphql(SHOP_QUERY),
    admin.graphql(PRODUCTS_QUERY),
    admin.graphql(THEMES_QUERY),
  ]);

  const [shopJson, productsJson, themesJson] = await Promise.all([
    shopResponse.json(),
    productsResponse.json(),
    themesResponse.json(),
  ]);

  const bundlesMetafield = shopJson.data?.shop?.metafield;
  const shopCurrencyDetails = shopJson.data?.shop;

  const { products, variants } = buildProductsAndVariants(productsJson);

  const bundles = parseBundlesFromMetafield(bundlesMetafield?.value);

  const publishedTheme =
    themesJson.data?.themes?.edges?.find(
      (edge) => edge.node.role === "PUBLISHED",
    )?.node || themesJson.data?.themes?.edges?.[0]?.node;

  const bundleBlockId = process.env.SHOPIFY_API_KEY;
  const shop = session.shop;

  let themeEditorUrl = null;
  if (publishedTheme && shop) {
    themeEditorUrl = `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${bundleBlockId}/bundle&target=mainSection`;
  }

  return {
    bundles,
    variants,
    products,
    themeEditorUrl,
    shop: session.shop,
    shopCurrencyDetails,
  };
}
