import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate, registerWebhooks } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  console.log('session', session);
  
  // Register webhooks after authentication
  await registerWebhooks({ session });
  console.log(`[AUTH] Webhooks registered for ${session.shop}`);

  // afterAuth runs Shopify's post-OAuth hook (`notifyInstallIfNeeded`):
  // enables `app.block_control` and notifies Python.

  return null;
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
