import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

// export const loader = async ({ request }) => {
//   const url = new URL(request.url);
//   const apiKey = process.env.SHOPIFY_API_KEY || "";

//   // Detect if app is embedded (check for 'host' query parameter)
//   const host = url.searchParams.get("host");
//   const isEmbedded = !!host;

//   // const { redirect } = await authenticate.admin(request);
//   // Try to get shop from URL path pattern: /store/{shop}/apps/...
//   // Example: https://admin.shopify.com/store/burhan-dev/apps/roarr/auth/login
//   const pathMatch = url.pathname.match(/\/store\/([^/]+)\/apps/);
//   let shopFromPath = pathMatch ? pathMatch[1] : null;

//   // If shop is extracted from path, ensure it has .myshopify.com suffix
//   if (shopFromPath && !shopFromPath.includes('.')) {
//     shopFromPath = `${shopFromPath}.myshopify.com`;
//   }

//   // Fallback to query params (common in Shopify OAuth flows)
//   const shopFromQuery = url.searchParams.get("shop");
//   const shopFromUrl = shopFromPath || shopFromQuery;

//   // If shop is in URL, try to auto-login
//   if (shopFromUrl) {
//     console.log('shopFromUrl', shopFromUrl);
//     // const errors = loginErrorMessage(await login(request));
//     return { errors: {}, shop: shopFromUrl, isEmbedded, apiKey: process.env.SHOPIFY_API_KEY || "" };
//   }

//   return { errors: {}, shop: null, isEmbedded, apiKey: process.env.SHOPIFY_API_KEY || "" };
// };


export async function loader({ request }) {
  return { errors: loginErrorMessage(await login(request)) };
}
export const action = async ({ request }) => {
  return { errors: loginErrorMessage(await login(request)) };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [searchParams] = useSearchParams();
  const errors = (actionData || loaderData)?.errors || {};

  // Get shop from loader data (which extracts from path or query params)
  const shop = loaderData?.shop || searchParams.get("shop") || "";

  const apiKey = loaderData?.apiKey || "";

  console.log('shop', shop);
  return (
    <AppProvider embedded={true} apiKey={apiKey}>
      <s-page>
        <Form method="post">
          <s-section heading="Re-authenticate">
            <s-text-field
              name="shop"
              label="Shop domain"
              details="example.myshopify.com"
              value={shop}
              autocomplete="on"
            ></s-text-field>

            <s-button type="submit" variant="primary">
              Re-authenticate
            </s-button>
            {errors.shop && (
              <s-banner tone="critical">
                {errors.shop}
              </s-banner>
            )}
          </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
