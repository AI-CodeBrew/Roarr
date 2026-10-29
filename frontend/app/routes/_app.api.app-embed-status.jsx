import { authenticate } from "../shopify.server";

const THEME_EXTENSION_UID = "01a1603e-9aab-7970-8b2b-ce92b2515051";
const APP_EMBED_BLOCK_KEY = "roarr-theme-app-embed";
const APP_EMBED_BLOCK_TYPE = `shopify://apps/roarr/blocks/app-embed/${THEME_EXTENSION_UID}`;
const API_VERSION = "2026-01";

// Cache embed status for 60 s — it changes only when the merchant edits their theme.
const EMBED_CACHE_TTL_MS = 60 * 1000;
const _embedCache = new Map(); // shop -> { ts, enabled }

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

async function fetchSettingsDataJsonValue(shop, accessToken, themeId) {
  const assetKey = encodeURIComponent("config/settings_data.json");
  try {
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
  } catch {
    return null;
  }
}

function isAppEmbedEnabled(settingsValue) {
  try {
    const settingsData = JSON.parse(settingsValue);
    const blocks = settingsData?.current?.blocks;
    if (!blocks || typeof blocks !== "object") return false;

    const blockByKey = blocks[APP_EMBED_BLOCK_KEY];
    if (blockByKey && blockByKey.type === APP_EMBED_BLOCK_TYPE) {
      return blockByKey.disabled !== true;
    }

    return Object.values(blocks).some(
      (block) =>
        block &&
        typeof block === "object" &&
        block.type === APP_EMBED_BLOCK_TYPE &&
        block.disabled !== true,
    );
  } catch {
    return false;
  }
}

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const accessToken = session.accessToken;

    if (!accessToken) {
      return json({ success: false, error: "No access token" }, 401);
    }

    const reqUrl = new URL(request.url);
    const forceRefresh = reqUrl.searchParams.get("refresh") === "1";

    // Serve from in-process cache to avoid hitting Shopify on every dashboard render
    const cached = !forceRefresh ? _embedCache.get(shop) : null;
    if (cached && Date.now() - cached.ts < EMBED_CACHE_TTL_MS) {
      return json(
        { success: true, enabled: cached.enabled },
        200,
        { "Cache-Control": "private, max-age=60" }
      );
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
      _embedCache.set(shop, { ts: Date.now(), enabled: false });
      return json({ success: true, enabled: false }, 200, { "Cache-Control": "private, max-age=60" });
    }

    const currentSettings = await fetchSettingsDataJsonValue(
      shop,
      accessToken,
      mainThemeId,
    );
    if (!currentSettings) {
      _embedCache.set(shop, { ts: Date.now(), enabled: false });
      return json({ success: true, enabled: false }, 200, { "Cache-Control": "private, max-age=60" });
    }

    const enabled = isAppEmbedEnabled(currentSettings);
    _embedCache.set(shop, { ts: Date.now(), enabled });
    return json({ success: true, enabled }, 200, { "Cache-Control": "private, max-age=60" });
  } catch (error) {
    return json(
      { success: false, error: error?.message || "Internal server error" },
      500,
    );
  }
}
