import { authenticate } from "../shopify.server";

const DASHBOARD_META_CACHE_TTL_MS = 60 * 1000;
const dashboardMetaCache = new Map();

function getCached(shop) {
  const entry = dashboardMetaCache.get(shop);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DASHBOARD_META_CACHE_TTL_MS) {
    dashboardMetaCache.delete(shop);
    return null;
  }
  return entry.data;
}

function setCached(shop, data) {
  dashboardMetaCache.set(shop, { timestamp: Date.now(), data });
}

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cached = getCached(shop);
  if (cached) {
    return new Response(JSON.stringify({ success: true, ...cached }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = { billingModel: "credits" };
  setCached(shop, data);

  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
