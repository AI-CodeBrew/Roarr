import { authenticate } from "../shopify.server";

const THEME_EXTENSION_UID = "01a1603e-9aab-7970-8b2b-ce92b2515051";
const APP_EMBED_BLOCK_KEY = "roarr-theme-app-embed";
const APP_EMBED_BLOCK_TYPE = `shopify://apps/roarr/blocks/app-embed/${THEME_EXTENSION_UID}`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const API_VERSION = "2026-01";

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

async function updateSettingsDataJsonValue(shop, accessToken, themeId, settingsValue) {
  try {
    const url = `https://${shop}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: {
          key: "config/settings_data.json",
          value: settingsValue,
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function enableAppEmbedInSettings(settingsValue) {
  try {
    const settingsData = JSON.parse(settingsValue);

    if (
      typeof settingsData.current !== "object" ||
      settingsData.current === null ||
      Array.isArray(settingsData.current)
    ) {
      settingsData.current = {};
    }

    const ourBlock = {
      type: APP_EMBED_BLOCK_TYPE,
      disabled: false,
      settings: {},
    };

    const blocksExist = Object.prototype.hasOwnProperty.call(settingsData.current, "blocks");
    const existing = blocksExist && settingsData.current.blocks && typeof settingsData.current.blocks === "object"
      ? settingsData.current.blocks
      : {};
    const nextBlocks = blocksExist
      ? { ...existing, [APP_EMBED_BLOCK_KEY]: ourBlock }
      : { [APP_EMBED_BLOCK_KEY]: ourBlock };

    settingsData.current.blocks = nextBlocks;
    return JSON.stringify(settingsData, null, 2);
  } catch (error) {
    console.error("Error enabling app embed:", error);
    return null;
  }
}


export async function action({ request }) {
  try {
    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const accessToken = session.accessToken;

    if (!accessToken) {
      return json({ success: false, error: "No access token" }, 401);
    }

    // Get main theme
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
      return json({ success: false, error: "No main theme found" }, 404);
    }

    // Fetch current settings
    const currentSettings = await fetchSettingsDataJsonValue(shop, accessToken, mainThemeId);
    if (!currentSettings) {
      return json({ success: false, error: "Could not fetch theme settings" }, 500);
    }

    // Enable app embed in settings
    const updatedSettings = enableAppEmbedInSettings(currentSettings);
    if (!updatedSettings) {
      return json({ success: false, error: "Could not enable app embed" }, 500);
    }

    // Update settings
    const updateSuccess = await updateSettingsDataJsonValue(shop, accessToken, mainThemeId, updatedSettings);
    if (!updateSuccess) {
      return json({ success: false, error: "Could not update theme settings" }, 500);
    }

    return json({ success: true, message: "App embed enabled successfully" }, 200);
  } catch (error) {
    console.error("Error enabling app embed:", error);
    return json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      500
    );
  }
}
