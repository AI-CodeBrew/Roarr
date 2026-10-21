/**
 * Action logic for the bundles page.
 * Handles create, update, delete, and toggle-status intents.
 */
import { authenticate } from "../../shopify.server";
import {
  uuidv4,
  formatQuantityDiscountTier,
  DEFAULT_STYLE_SETTINGS,
  ROARR_DEFAULT_BUNDLE_FLAG,
} from "./bundleParsing.server";

const SHOP_QUERY = `#graphql
  query getShop {
    shop {
      id
      metafield(namespace: "kluck_bundle", key: "bundles") {
        id
        value
      }
    }
  }
`;

const UPSELL_PRODUCTS_QUERY = `#graphql
  query getUpsellProducts($variantIds: [ID!]!) {
    nodes(ids: $variantIds) {
      ... on ProductVariant {
        id
        title
        product {
          id
          title
          handle
        }
      }
    }
  }
`;

const METAFIELDS_MUTATION = `#graphql
  mutation setBundleMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function fetchShopAndBundles(admin) {
  const shopResponse = await admin.graphql(SHOP_QUERY);
  const shopJson = await shopResponse.json();
  const ownerId = shopJson.data?.shop?.id;

  let existingBundles = [];
  const bundlesMetafield = shopJson.data?.shop?.metafield;
  if (bundlesMetafield?.value) {
    try {
      const bundlesData = JSON.parse(bundlesMetafield.value);
      existingBundles = bundlesData.bundles || [];
    } catch (e) {
      console.error("[Bundle Action] Error parsing existing bundles:", e);
    }
  }

  return { ownerId, existingBundles };
}

async function saveBundlesToMetafield(admin, ownerId, bundles) {
  const variables = {
    metafields: [
      {
        ownerId,
        namespace: "kluck_bundle",
        key: "bundles",
        value: JSON.stringify({ bundles }),
        type: "json",
      },
    ],
  };

  const response = await admin.graphql(METAFIELDS_MUTATION, { variables });
  const json = await response.json();

  if (json.data?.metafieldsSet?.userErrors?.length > 0) {
    return {
      success: false,
      error: json.data.metafieldsSet.userErrors[0].message,
    };
  }

  return { success: true };
}

async function handleCreateOrUpdate(admin, formData, intent) {
  const mainProductIdsJson = formData.get("mainProductIds");
  const bundleType = formData.get("bundleType") || "upselling";
  const productSelectionType =
    formData.get("productSelectionType") || "include";
  const bundleId = formData.get("bundleId");

  let productIds = [];
  try {
    if (mainProductIdsJson) {
      productIds = JSON.parse(mainProductIdsJson);
    }
  } catch (e) {
    console.error("[Bundle Action] Error parsing product IDs:", e);
  }

  if (
    (productSelectionType === "include" ||
      productSelectionType === "exclude") &&
    productIds.length === 0
  ) {
    const typeLabel =
      productSelectionType === "include"
        ? "Selected products only"
        : "All except a few products";
    return {
      success: false,
      error: `${typeLabel} bundles require at least one product selection`,
    };
  }

  const { ownerId, existingBundles } = await fetchShopAndBundles(admin);
  if (!ownerId) {
    return { success: false, error: "Could not find shop ID" };
  }

  const now = new Date().toISOString();
  const isActive = formData.get("isActive") === "true";
  let existingBundleIndex = -1;

  if (intent === "update" && bundleId) {
    existingBundleIndex = existingBundles.findIndex((b) => b.id === bundleId);
  }

  const newBundleId = bundleId || uuidv4();

  let styleSettings = null;
  const styleSettingsJson = formData.get("styleSettings");
  if (styleSettingsJson) {
    try {
      styleSettings = JSON.parse(styleSettingsJson);
    } catch (e) {
      console.error("[Bundle Action] Error parsing styleSettings:", e);
    }
  }

  let bundleData = {
    id: newBundleId,
    name: formData.get("name"),
    description: formData.get("description") || null,
    type: bundleType,
    productSelectionType,
    productIds: productSelectionType === "global" ? [] : productIds,
    sectionHeader: formData.get("sectionHeader"),
    isActive,
    allowVariantSelection: formData.get("allowVariantSelection") === "true",
    styleSettings:
      styleSettings ||
      (bundleType === "discounted"
        ? { ...DEFAULT_STYLE_SETTINGS }
        : null),
    createdAt:
      intent === "update" && existingBundleIndex >= 0
        ? existingBundles[existingBundleIndex].createdAt || now
        : now,
    updatedAt: now,
  };

  // The form does not round-trip this flag, so carry it over on edit. Losing it
  // would make the next publish skip the bundle instead of extending it.
  if (
    intent === "update" &&
    existingBundleIndex >= 0 &&
    existingBundles[existingBundleIndex][ROARR_DEFAULT_BUNDLE_FLAG] === true
  ) {
    bundleData[ROARR_DEFAULT_BUNDLE_FLAG] = true;
  }

  if (bundleType === "discounted") {
    const tiersJson = formData.get("quantityDiscountTiers");
    let tiers = [];
    try {
      tiers = JSON.parse(tiersJson || "[]");
    } catch (e) {
      return {
        success: false,
        error: "Invalid quantity discount tiers data",
      };
    }

    if (tiers.length === 0) {
      return {
        success: false,
        error: "At least one quantity discount tier is required",
      };
    }

    bundleData.quantityDiscountTiers = tiers.map(formatQuantityDiscountTier);
    bundleData.upsellItems = [];
    bundleData.frequentlyBoughtWith = [];
    bundleData.showFrequentlyBoughtWith = false;
  } else {
    const upsellItemsJson = formData.get("upsellItems");
    let upsellItems = [];
    try {
      upsellItems = JSON.parse(upsellItemsJson || "[]");
    } catch (e) {
      return {
        success: false,
        error: "Invalid upsell items data",
      };
    }

    if (upsellItems.length === 0) {
      return {
        success: false,
        error: "At least one upsell item is required",
      };
    }

    const upsellVariantIds = upsellItems.map((item) => item.upsellVariantId);
    const upsellProductResponse = await admin.graphql(UPSELL_PRODUCTS_QUERY, {
      variables: { variantIds: upsellVariantIds },
    });
    const upsellProductJson = await upsellProductResponse.json();
    const upsellVariants = upsellProductJson.data?.nodes || [];

    bundleData.upsellItems = upsellItems.map((item, index) => {
      const variant = upsellVariants[index];
      return {
        upsellVariantId: item.upsellVariantId,
        upsellVariantTitle: variant?.title || "",
        upsellProductId: variant?.product?.id || "",
        upsellProductTitle: variant?.product?.title || "",
        upsellProductHandle: variant?.product?.handle || "",
        upsellQuantity: parseInt(item.upsellQuantity) || 1,
        discountPercentage: parseFloat(item.discountPercentage) || 100,
      };
    });
  }

  if (intent === "update" && existingBundleIndex >= 0) {
    existingBundles[existingBundleIndex] = bundleData;
  } else {
    existingBundles.push(bundleData);
  }

  const saveResult = await saveBundlesToMetafield(admin, ownerId, existingBundles);
  if (!saveResult.success) {
    return saveResult;
  }

  return {
    success: true,
    bundle: {
      ...bundleData,
      productIds: productSelectionType === "global" ? [] : productIds,
    },
  };
}

async function handleDelete(admin, formData) {
  const bundleId = formData.get("bundleId");

  const { ownerId, existingBundles } = await fetchShopAndBundles(admin);
  if (!ownerId) {
    return { success: false, error: "Could not find shop ID" };
  }

  const bundleIndex = bundleId
    ? existingBundles.findIndex((b) => b.id === bundleId)
    : -1;

  if (bundleIndex === -1) {
    return { success: false, error: "Bundle not found" };
  }

  existingBundles.splice(bundleIndex, 1);
  return saveBundlesToMetafield(admin, ownerId, existingBundles);
}

async function handleToggleStatus(admin, formData) {
  const bundleId = formData.get("bundleId");
  const isActive = formData.get("isActive") === "true";

  const { ownerId, existingBundles } = await fetchShopAndBundles(admin);
  if (!ownerId) {
    return { success: false, error: "Could not find shop ID" };
  }

  const bundleIndex = bundleId
    ? existingBundles.findIndex((b) => b.id === bundleId)
    : -1;

  if (bundleIndex === -1) {
    return { success: false, error: "Bundle not found" };
  }

  existingBundles[bundleIndex].isActive = isActive;
  existingBundles[bundleIndex].updatedAt = new Date().toISOString();
  if (!existingBundles[bundleIndex].createdAt) {
    existingBundles[bundleIndex].createdAt = new Date().toISOString();
  }

  const saveResult = await saveBundlesToMetafield(admin, ownerId, existingBundles);
  if (!saveResult.success) {
    return saveResult;
  }

  return {
    success: true,
    bundle: existingBundles[bundleIndex],
  };
}

export async function bundlesAction({ request }) {
  console.log("[Bundle Action] Action called");
  const { admin, session } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log("[Bundle Action] Intent:", intent);

  if (intent === "create" || intent === "update") {
    return handleCreateOrUpdate(admin, formData, intent);
  }

  if (intent === "delete") {
    return handleDelete(admin, formData);
  }

  if (intent === "toggle-status") {
    return handleToggleStatus(admin, formData);
  }

  return { success: false };
}
