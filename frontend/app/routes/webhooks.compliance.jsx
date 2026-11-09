import crypto from "crypto";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * Mandatory compliance webhooks (https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
 *
 * `authenticate.webhook` verifies Shopify's HMAC first: an invalid signature is answered with 401
 * before any of the code below runs. A valid one gets 200 once the request is handled. If deleting
 * data fails, an error response makes Shopify retry the webhook.
 *
 * What Roarr stores:
 * - Shop data: Session rows (this app's Prisma database) and the shop's records in the backend
 *   (store and shop details, generated pages, credits, bundles, brand assets). shop/redact deletes
 *   all of it.
 * - Customer data: none. Roarr has no customer or order access scopes and never stores a store's
 *   customers, so customers/redact and customers/data_request have nothing to delete or export.
 *
 * Never log the payload: it contains customer personal data (email, ids, order ids).
 */
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

const COMPLIANCE_TOPICS = {
  CUSTOMERS_DATA_REQUEST: "customers/data_request",
  CUSTOMERS_REDACT: "customers/redact",
  SHOP_REDACT: "shop/redact",
};

async function deleteShopDataInBackend(shop) {
  const body = JSON.stringify({ shop, timestamp: Math.floor(Date.now() / 1000) });
  const signature = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(body)
    .digest("hex");
  const res = await fetch(`${PYTHON_API_URL}/api/internal/shop-redact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Signature": signature },
    body,
  });
  if (!res.ok) {
    throw new Error(`Backend shop data deletion failed (HTTP ${res.status})`);
  }
  return res.json();
}

export const action = async ({ request }) => {
  // Throws a 401 Response when the HMAC is invalid.
  const { payload, shop, topic: rawTopic } = await authenticate.webhook(request);
  // The library reports topics in enum form ("SHOP_REDACT"); Shopify sends "shop/redact".
  const topic = COMPLIANCE_TOPICS[String(rawTopic || "").toUpperCase()] ?? rawTopic;

  switch (topic) {
    case "customers/data_request": {
      console.log(
        `[compliance] customers/data_request ${payload?.data_request?.id ?? ""} for ${shop}: Roarr stores no customer data, nothing to export.`,
      );
      break;
    }

    case "customers/redact": {
      console.log(
        `[compliance] customers/redact for ${shop}: Roarr stores no customer data, nothing to delete.`,
      );
      break;
    }

    case "shop/redact": {
      // Sent 48 hours after uninstall: delete everything stored for this shop.
      const sessions = await prisma.session.deleteMany({ where: { shop } });
      const backend = await deleteShopDataInBackend(shop);
      const backendCount = Object.values(backend?.deleted || {}).reduce((a, b) => a + b, 0);
      console.log(
        `[compliance] shop/redact for ${shop}: deleted ${sessions.count} sessions and ${backendCount} backend records.`,
      );
      break;
    }

    default:
      console.warn(`[compliance] Unknown compliance topic ${topic} for ${shop}`);
  }

  return new Response(null, { status: 200 });
};
