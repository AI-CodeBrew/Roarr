import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CreditWalletWidget } from "../components/CreditWalletWidget";

const APP_EMBED_BLOCK_NAME = "app-embed";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let mainThemeId = null;

  try {
    const themeResponse = await admin.graphql(`
      query GetMainTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
          }
        }
      }
    `);

    const themeData = await themeResponse.json();
    const mainTheme = themeData?.data?.themes?.nodes?.[0] ?? null;

    if (mainTheme?.id) {
      mainThemeId = mainTheme.id.split("/").pop();
    }
  } catch (error) {
    console.error("Error fetching themes:", error);
    return { 
      themeId: null, 
      shop: session.shop, 
      appEmbedBlockName: APP_EMBED_BLOCK_NAME,
      error: "FETCH_ERROR" 
    };
  }

  if (!mainThemeId) {
    return { 
      themeId: null, 
      shop: session.shop, 
      appEmbedBlockName: APP_EMBED_BLOCK_NAME,
      error: "NO_THEME" 
    };
  }

  return { 
    themeId: mainThemeId, 
    shop: session.shop, 
    shopifyClientId: process.env.SHOPIFY_API_KEY || "",
    appEmbedBlockName: APP_EMBED_BLOCK_NAME,
    error: null 
  };
};

// Main-theme lookup only needs to run once; skip loader revalidation on in-app nav.
export function shouldRevalidate() {
  return false;
}

export default function AddToThemePage() {
  const { themeId, shop, shopifyClientId, appEmbedBlockName, error } = useLoaderData();

  // Deep link: myshopify host + themes/current (per Shopify app embed docs); optional activateAppId.
  let deepLink = null;

  if (!error && themeId && shop) {
    const params = new URLSearchParams({ context: "apps", template: "product" });
    if (shopifyClientId) {
      params.set("activateAppId", `${shopifyClientId}/${appEmbedBlockName}`);
    }
    deepLink = `https://${shop}/admin/themes/current/editor?${params.toString()}`;
  }

  return (
    <s-page heading="Add Roarr Blocks to Your Theme" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <s-section>
        <s-box padding="base" border="base" borderRadius="base" background="base">
          <s-stack direction="block" gap="base">
            <s-text variant="bodyMd" as="p">
              Add the Roarr Product Details and Delivery Estimator blocks to your product pages.
            </s-text>

            {error && (
              <s-banner tone="critical">
                <s-text>
                  {error === "NO_THEME"
                    ? "No published theme found. Please publish a theme first."
                    : "Error fetching theme data. Check server logs."}
                </s-text>
              </s-banner>
            )}

            {deepLink && (
              <s-box paddingBlockStart="base">
                <s-button
                  variant="primary"
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Theme Editor
                </s-button>
              </s-box>
            )}

            {deepLink && (
              <>
                <s-banner tone="info">
                  <s-stack direction="block" gap="small">
                    <s-text variant="bodyMd" fontWeight="semibold">
                      Instructions
                    </s-text>
                    <s-unordered-list>
                      <s-list-item>
                        <s-text variant="bodySm">Click the button above to open the theme editor. The product page will open with the app embeds section visible in the left sidebar</s-text>
                      </s-list-item>
                      <s-list-item>
                        <s-text variant="bodySm">
                          The Roarr app embed should already be on; if not, enable it in App embeds, then save
                        </s-text>
                      </s-list-item>
                      <s-list-item>
                        <s-text variant="bodySm">For Product Details: Disable or hide your store's current product description blocks, then add the "Product details" block from app blocks</s-text>
                      </s-list-item>
                      <s-list-item>
                        <s-text variant="bodySm">For Delivery Estimator: This block generally comes after the product description section</s-text>
                      </s-list-item>
                    </s-unordered-list>
                  </s-stack>
                </s-banner>
                
                <s-box paddingBlockStart="base">
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%", // 16:9 aspect ratio
                      height: 0,
                      overflow: "hidden",
                      maxWidth: "100%",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <iframe
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: 0,
                      }}
                      src="https://www.youtube.com/embed/qQY0_T7kLJQ"
                      title="Roarr Theme Setup Tutorial"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </s-box>
              </>
            )}
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);

