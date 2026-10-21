/**
 * Credits route (/credits): credit packs only (client). Loader exposes shop URLs for managed pricing if needed.
 */

import { authenticate } from "../../shopify.server";

const APP_CHARGES_HANDLE = process.env.SHOPIFY_APP_CHARGES_HANDLE || "roarr";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const storeSlug = shop.replace(".myshopify.com", "");
  const pricingUrl = `https://admin.shopify.com/store/${storeSlug}/charges/${APP_CHARGES_HANDLE}/pricing_plans`;
  const redirectUrl = `https://admin.shopify.com/store/${storeSlug}/app/billing`;

  return {
    shop,
    storeSlug,
    pricingUrl,
    appChargesHandle: APP_CHARGES_HANDLE,
    redirectUrl,
  };
};

export const action = async () =>
  Response.json(
    {
      error:
        "Recurring subscriptions are no longer sold here. Purchase credit packs on this page instead.",
    },
    { status: 400 }
  );
