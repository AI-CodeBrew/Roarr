import { authenticate } from "../shopify.server";

const THEME_EXTENSION_UID = "019b183d-746c-7391-a5b6-6ac9f26fa6b4";
const APP_HANDLE = "kluck-ai-store-builder";
const API_VERSION = "2026-01";

const APP_BLOCKS = [
  { handle: "buy-now-button", name: "Buy Now Button" },
  { handle: "product-details", name: "Product Details" },
  { handle: "frequently-bought", name: "Frequently Bought Together" },
  { handle: "bundle", name: "Roarr Bundler" },
  { handle: "comparison-table", name: "Comparison Table" },
  { handle: "bento-grid", name: "Bento Grid (5 Panels)" },
  { handle: "accordion", name: "Accordion" },
  { handle: "image-with-text", name: "Image with Text" },
  { handle: "four-blocks", name: "Four Blocks" },
  { handle: "circular-feature-ring", name: "Circular Feature Ring" },
  { handle: "before-after", name: "Before/After" },
  { handle: "delivery-estimator", name: "Delivery Estimator" },
  { handle: "heading-subheading", name: "Heading Subheading" },
  { handle: "impact-stat", name: "Impact Stats" },
  { handle: "faq", name: "FAQ" },
  { handle: "loved-by-everyone", name: "Loved by Everyone" },
];

const APP_BLOCK_HANDLES = new Set(APP_BLOCKS.map((block) => block.handle));
const APP_BLOCKS_CACHE_TTL_MS = 60 * 1000;
const _appBlocksCache = new Map(); // shop -> { ts, payload }

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function assetKeyMatchesThemeJson(key) {
  return (
    typeof key === "string" &&
    (key.startsWith("templates/") || key.startsWith("sections/")) &&
    key.endsWith(".json")
  );
}

function appBlockHandleFromType(type) {
  if (typeof type !== "string") return null;
  const match = type.match(/^shopify:\/\/apps\/[^/]+\/blocks\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  const [, handle, appId] = match;
  if (!APP_BLOCK_HANDLES.has(handle)) return null;
  if (appId !== THEME_EXTENSION_UID && !type.includes(`shopify://apps/${APP_HANDLE}/blocks/`)) {
    return null;
  }
  return handle;
}

function collectAppBlockInstances(value, sourceKey, output, inheritedDisabled = false) {
  if (!value || typeof value !== "object") return;
  const isDisabled = inheritedDisabled || value.disabled === true;

  if (typeof value.type === "string") {
    const handle = appBlockHandleFromType(value.type);
    if (handle) {
      output.push({
        handle,
        sourceKey,
        disabled: isDisabled,
      });
    }
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectAppBlockInstances(item, sourceKey, output, isDisabled));
    return;
  }

  Object.values(value).forEach((item) =>
    collectAppBlockInstances(item, sourceKey, output, isDisabled),
  );
}

async function fetchThemeAssetList(shop, accessToken, themeId) {
  const url = `https://${shop}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return Array.isArray(data?.assets) ? data.assets : [];
}

async function fetchThemeAssetValue(shop, accessToken, themeId, key) {
  const assetKey = encodeURIComponent(key);
  const url = `https://${shop}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${assetKey}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.asset?.value ?? data?.value ?? null;
}

function buildPayload(instances) {
  const enabledInstances = instances.filter((instance) => !instance.disabled);
  const countsByHandle = enabledInstances.reduce((acc, instance) => {
    acc[instance.handle] = (acc[instance.handle] || 0) + 1;
    return acc;
  }, {});

  const blocks = APP_BLOCKS.map((block) => ({
    ...block,
    count: countsByHandle[block.handle] || 0,
    enabled: Boolean(countsByHandle[block.handle]),
  }));

  return {
    success: true,
    enabledCount: enabledInstances.length,
    enabledBlockTypes: blocks.filter((block) => block.enabled).length,
    blocks,
  };
}

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const accessToken = session.accessToken;

    if (!accessToken) {
      return json({ ...buildPayload([]), success: false, error: "No access token" }, 401);
    }

    const reqUrl = new URL(request.url);
    const forceRefresh = reqUrl.searchParams.get("refresh") === "1";

    const cached = !forceRefresh ? _appBlocksCache.get(shop) : null;
    if (cached && Date.now() - cached.ts < APP_BLOCKS_CACHE_TTL_MS) {
      return json(cached.payload, 200, { "Cache-Control": "private, max-age=60" });
    }

    const themeResponse = await admin.graphql(`#graphql
      query GetMainTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);

    const themeData = await themeResponse.json();
    const mainTheme = themeData?.data?.themes?.nodes?.[0] ?? null;
    const mainThemeId = mainTheme?.id ? mainTheme.id.split("/").pop() : null;

    if (!mainThemeId) {
      const payload = buildPayload([]);
      _appBlocksCache.set(shop, { ts: Date.now(), payload });
      return json(payload, 200, { "Cache-Control": "private, max-age=60" });
    }

    const assets = await fetchThemeAssetList(shop, accessToken, mainThemeId);
    const themeJsonKeys = assets.map((asset) => asset?.key).filter(assetKeyMatchesThemeJson);
    const instances = [];

    await Promise.all(
      themeJsonKeys.map(async (key) => {
        const value = await fetchThemeAssetValue(shop, accessToken, mainThemeId, key);
        if (!value) return;
        try {
          collectAppBlockInstances(JSON.parse(value), key, instances);
        } catch {
          // Ignore malformed theme JSON assets.
        }
      }),
    );

    const payload = buildPayload(instances);
    _appBlocksCache.set(shop, { ts: Date.now(), payload });
    return json(payload, 200, { "Cache-Control": "private, max-age=60" });
  } catch (error) {
    return json(
      {
        ...buildPayload([]),
        success: false,
        error: error?.message || "Internal server error",
      },
      500,
    );
  }
}
