import { authenticate } from "../shopify.server";

/**
 * Mandatory compliance webhooks handler
 * 
 * Handles three compliance webhook topics:
 * - customers/data_request: Requests to view stored customer data
 * - customers/redact: Requests to delete customer data
 * - shop/redact: Requests to delete shop data (48h after uninstall)
 * 
 * Reference: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */
export const action = async ({ request }) => {
  try {
    const { payload, shop, topic } = await authenticate.webhook(request);

    console.log(`Received compliance webhook ${topic} for ${shop}`);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    switch (topic) {
      case "customers/data_request": {
        // Handle customer data request
        const customerId = payload.customer?.id;
        const customerEmail = payload.customer?.email;
        const ordersRequested = payload.orders_requested || [];
        const dataRequestId = payload.data_request?.id;

        console.log(`Data request ${dataRequestId} for customer ${customerId} (${customerEmail})`);
        console.log(`Orders requested: ${ordersRequested.join(", ")}`);

        // TODO: If your app stores customer data, retrieve and provide it here
        // 1. Query your database for customer data associated with this shop/customer
        // 2. Prepare the data export
        // 3. Send it to the store owner (they will forward to the customer)
        // 4. Complete within 30 days

        break;
      }

      case "customers/redact": {
        // Handle customer data deletion request
        const customerId = payload.customer?.id;
        const customerEmail = payload.customer?.email;
        const ordersToRedact = payload.orders_to_redact || [];

        console.log(`Redact request for customer ${customerId} (${customerEmail})`);
        console.log(`Orders to redact: ${ordersToRedact.join(", ")}`);

        // TODO: Delete customer data from your database
        // 1. Query your database for all data associated with this shop/customer/orders
        // 2. Delete or anonymize the data
        // 3. Complete within 30 days (or withhold if legally required to retain)
        // 
        // Example if you stored customer data:
        // await db.customerData.deleteMany({ 
        //   where: { shop, customerId: customerId.toString() } 
        // });

        // Since this app uses read-only scopes, we likely don't store customer data
        // But we still need to respond to the webhook

        break;
      }

      case "shop/redact": {
        // Handle shop data deletion request (48h after uninstall)
        const shopId = payload.shop_id;
        const shopDomain = payload.shop_domain;

        console.log(`Shop redact request for shop ${shopId} (${shopDomain})`);

        // TODO: Delete all shop data from your database
        // This is sent 48 hours after app uninstall, so the session is already deleted
        // You should delete any cached product data, generated content, etc. associated with this shop
        // 
        // Example if you stored shop-specific data:
        // await db.shopData.deleteMany({ where: { shop } });
        // await db.cachedContent.deleteMany({ where: { shop } });

        // Note: Session deletion is already handled by app/uninstalled webhook
        // This webhook is for any additional data your app stores

        break;
      }

      default:
        console.warn(`Unknown compliance webhook topic: ${topic}`);
    }

    // Return 200 to acknowledge receipt
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`Error processing compliance webhook:`, error);
    // authenticate.webhook() automatically returns 401 for invalid HMAC
    // Re-throw to let it handle the response
    throw error;
  }
};

