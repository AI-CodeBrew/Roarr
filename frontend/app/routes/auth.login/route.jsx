import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useLoaderData } from "react-router";
import { login } from "../../shopify.server";

/**
 * Re-authentication entry. Shopify starts OAuth by opening the app with a `shop` parameter, which
 * `login()` turns into the redirect. Merchants are never asked to type their `.myshopify.com`
 * domain here (App Store requirement 2.3.1); with no shop in the URL they are sent back to
 * the Shopify admin to open the app from there.
 */
export async function loader({ request }) {
  // Redirects to OAuth when the request carries a valid shop; otherwise the page below shows.
  await login(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
}

export default function Auth() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded={true} apiKey={apiKey}>
      <s-page>
        <s-section heading="Open Roarr from your Shopify admin">
          <s-paragraph>
            To sign in, open Roarr from the Apps menu in your Shopify admin. You don&apos;t need to
            enter your store address.
          </s-paragraph>
          <s-button variant="primary" href="https://admin.shopify.com/" target="_top">
            Go to Shopify admin
          </s-button>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
