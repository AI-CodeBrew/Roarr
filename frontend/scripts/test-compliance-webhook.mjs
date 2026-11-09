#!/usr/bin/env node
/**
 * Proves the compliance webhook handler checks the HMAC: 401 for an invalid signature, 200 for a
 * valid one, on all three mandatory topics. Runs the real route with a throwaway secret and a
 * mocked session table, so it touches no database and no .env value.
 *
 * Usage (from frontend/):  npx vite-node scripts/test-compliance-webhook.mjs
 */
import crypto from "crypto";

const SECRET = "test-secret-not-a-real-secret";
process.env.SHOPIFY_API_KEY = "test-key";
process.env.SHOPIFY_API_SECRET = SECRET;
process.env.SHOPIFY_APP_URL = "https://example.test";
process.env.SCOPES = "read_products";

// The route's Prisma client is global in development; give it an empty session table.
globalThis.prismaGlobal = {
  session: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    deleteMany: async () => ({ count: 0 }),
    delete: async () => ({}),
    upsert: async () => ({}),
    count: async () => 0,
  },
  $queryRaw: async () => [],
};

const { action } = await import("../app/routes/webhooks.compliance.jsx");

const SHOP = "demo-store.myshopify.com";
const BODIES = {
  "customers/data_request": { shop_id: 1, shop_domain: SHOP, customer: { id: 11, email: "a@example.com" }, orders_requested: [1] },
  "customers/redact": { shop_id: 1, shop_domain: SHOP, customer: { id: 11, email: "a@example.com" }, orders_to_redact: [1] },
  "shop/redact": { shop_id: 1, shop_domain: SHOP },
};

function signed(topic, body, secret) {
  const raw = JSON.stringify(body);
  const hmac = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
  return new Request("https://example.test/webhooks/compliance", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-topic": topic,
      "x-shopify-shop-domain": SHOP,
      "x-shopify-hmac-sha256": hmac,
      "x-shopify-webhook-id": crypto.randomUUID(),
      "x-shopify-api-version": "2026-10",
    },
    body: raw,
  });
}

async function statusOf(request) {
  try {
    const res = await action({ request, params: {}, context: {} });
    return res.status;
  } catch (thrown) {
    // authenticate.webhook throws a Response for a rejected request
    return thrown instanceof Response ? thrown.status : `error: ${thrown?.message}`;
  }
}

const log = console.log;
console.log = () => {}; // the route logs a line per call; keep the report readable
let failed = false;
const rows = [];
for (const [topic, body] of Object.entries(BODIES)) {
  const valid = await statusOf(signed(topic, body, SECRET));
  const invalid = await statusOf(signed(topic, body, "a-different-secret"));
  const ok = valid === 200 && invalid === 401;
  if (!ok) failed = true;
  rows.push(`${ok ? "PASS" : "FAIL"}  ${topic.padEnd(24)} valid HMAC -> ${valid}   invalid HMAC -> ${invalid}`);
}
console.log = log;
console.log(rows.join("\n"));
process.exit(failed ? 1 : 0);
