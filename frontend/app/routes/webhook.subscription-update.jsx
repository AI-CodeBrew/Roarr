import { authenticate } from "../shopify.server";
import crypto from "crypto";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Shopify `app_subscriptions/update` — forward to Python for legacy bookkeeping only.
 * Storefront `app.block_control` is set on OAuth `afterAuth`, not from subscription state.
 */
export const action = async ({ request }) => {
  const { payload, shop } = await authenticate.webhook(request);

  const pythonUrl = `${PYTHON_API_URL}/api/webhook/shopify/subscription-update`;
  try {
    const webhookPayload = {
      shop,
      app_subscription: payload?.app_subscription ?? null,
      timestamp: Date.now(),
    };
    const signature = signPayload(webhookPayload);
    const pythonApiResponse = await fetch(pythonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shop-Domain": shop,
        "X-Internal-Signature": signature,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!pythonApiResponse.ok) {
      const errorData = await pythonApiResponse.json().catch(() => ({}));
      console.error("[SUBSCRIPTION_WEBHOOK] Python backend error", {
        shop,
        status: pythonApiResponse.status,
        error: errorData.error || pythonApiResponse.statusText,
      });
    }
  } catch (error) {
    console.error("[SUBSCRIPTION_WEBHOOK] Python request failed", {
      shop,
      error: error?.message ?? error,
    });
  }

  return new Response("OK", { status: 200 });
};
