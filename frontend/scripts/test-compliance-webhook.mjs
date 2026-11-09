#!/usr/bin/env node
/**
 * Proves the compliance webhook handler checks the HMAC (401 for an invalid signature, 200 for a
 * valid one, on all three mandatory topics) and that shop/redact deletes the shop's data. Runs the real route with a throwaway secret and a
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

// The route calls the Python backend to delete a shop's data; record those calls.
process.env.PYTHON_API_URL = "http://backend.test";
const backendCalls = [];
let backendStatus = 200;
globalThis.fetch = async (url, init) => {
  backendCalls.push({ url: String(url), headers: init?.headers, body: init?.body });
  return new Response(JSON.stringify({ success: true, deleted: { roarr_users_stores: 2 } }), {
    status: backendStatus,
    headers: { "content-type": "application/json" },
  });
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

// shop/redact must delete the shop's data in the backend (signed with the app secret); the other
// two topics store nothing, so they must not call it.
const redactCalls = backendCalls.filter((c) => c.url.endsWith("/api/internal/shop-redact"));
const call = redactCalls[0];
const signature = (body) => crypto.createHmac("sha256", SECRET).update(body).digest("hex");
const checks = [
  // Only the one valid shop/redact request may reach the backend: not the invalid-HMAC one, and
  // not customers/data_request or customers/redact.
  ["shop/redact calls the backend deletion exactly once", redactCalls.length === 1],
  ["...signed with the app secret", !!call && call.headers["X-Internal-Signature"] === signature(call.body)],
  ["...for the right shop", !!call && JSON.parse(call.body).shop === SHOP],
];

// If the backend fails, Shopify must see an error so it retries.
backendStatus = 500;
const failure = await statusOf(signed("shop/redact", BODIES["shop/redact"], SECRET));
checks.push(["backend failure -> error response (Shopify retries)", typeof failure === "string" || failure >= 500]);

for (const [name, ok] of checks) {
  if (!ok) failed = true;
  rows.push(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
console.log = log;
console.log(rows.join("\n"));
process.exit(failed ? 1 : 0);
