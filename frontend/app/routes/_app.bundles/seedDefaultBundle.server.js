/**
 * Seeds a published "Bundle and Save" bundle when a merchant publishes a
 * premium product page or a store and no active bundle exists yet.
 *
 * Runs on every publish: whenever the shop has no live bundle, the default is
 * (re)created so published pages never render an empty bundle section.
 *
 * The default is scoped to the products whose page actually renders the bundle
 * block, so the cart discount can never fire on a page with no bundle UI:
 *   - store publish writes `templates/product.json`, the default template for
 *     every product, so the bundle is global.
 *   - a premium PDP publish binds a template suffix to one product, so the
 *     bundle only includes that product; later publishes extend the list.
 */
import {
  uuidv4,
  formatQuantityDiscountTier,
  DEFAULT_STYLE_SETTINGS,
  ROARR_DEFAULT_BUNDLE_FLAG,
} from "./bundleParsing.server";
import { ensureBundlerDiscount } from "./ensureBundlerDiscount.server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Persist a bundle in DynamoDB via the Python API.
 * Auto-seed historically only wrote Shopify metafields, so edits 404'd on update.
 * Upserts: POST first, PUT on conflict; PUT first for widens, POST on 404.
 */
async function upsertBundleInBackend(bundle, shopifyJwtToken, { preferCreate }) {
  if (!shopifyJwtToken || !bundle?.id) {
    console.warn(
      "[SeedDefaultBundle] Skipping backend sync (missing JWT or bundle id)",
    );
    return;
  }

  const payload = {
    ...bundle,
    type: bundle.type === "upselling" ? "upsell" : bundle.type,
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${shopifyJwtToken}`,
  };
  const url = `${PYTHON_API_URL}/api/bundler/bundle`;

  const post = () =>
    fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const put = () =>
    fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });

  try {
    if (preferCreate) {
      const createRes = await post();
      if (createRes.ok || createRes.status === 201) return;
      if (createRes.status === 409) {
        const updateRes = await put();
        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => ({}));
          console.error(
            "[SeedDefaultBundle] Backend update after conflict failed:",
            err.error || updateRes.statusText,
          );
        }
        return;
      }
      const err = await createRes.json().catch(() => ({}));
      console.error(
        "[SeedDefaultBundle] Backend create failed:",
        err.error || createRes.statusText,
      );
      return;
    }

    const updateRes = await put();
    if (updateRes.ok) return;
    if (updateRes.status === 404) {
      const createRes = await post();
      if (!createRes.ok && createRes.status !== 201) {
        const err = await createRes.json().catch(() => ({}));
        console.error(
          "[SeedDefaultBundle] Backend create after 404 failed:",
          err.error || createRes.statusText,
        );
      }
      return;
    }
    const err = await updateRes.json().catch(() => ({}));
    console.error(
      "[SeedDefaultBundle] Backend update failed:",
      err.error || updateRes.statusText,
    );
  } catch (error) {
    console.error(
      "[SeedDefaultBundle] Backend sync error:",
      error?.message || error,
    );
  }
}

const SHOP_BUNDLE_STATE_QUERY = `#graphql
  query getShopBundleState {
    shop {
      id
      bundles: metafield(namespace: "kluck_bundle", key: "bundles") {
        value
      }
    }
  }
`;

const METAFIELDS_MUTATION = `#graphql
  mutation setBundleMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

/** Accepts a numeric id or a GID and returns `gid://shopify/Product/<id>`. */
function toProductGid(productId) {
  const raw = String(productId ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("gid://")) return raw;
  const numeric = raw.split("/").pop();
  return /^\d+$/.test(numeric) ? `gid://shopify/Product/${numeric}` : null;
}

function normalizeProductGids(productIds) {
  const gids = (productIds || []).map(toProductGid).filter(Boolean);
  return [...new Set(gids)];
}

function isActiveBundle(bundle) {
  // The storefront treats a missing `isActive` as active, so match that here.
  return bundle?.isActive !== false;
}

function buildDefaultBundle({ productSelectionType, productIds }) {
  const now = new Date().toISOString();

  const tiers = [
    {
      quantity: 1,
      discountType: "percentage",
      discountPercentage: 0,
      discountValue: 0,
      title: "Buy 1",
      discountBadge: "Standard Price",
      showDiscountBadge: true,
      isMostPopular: false,
      showMostPopular: false,
    },
    {
      quantity: 2,
      discountType: "percentage",
      discountPercentage: 10,
      discountValue: 10,
      title: "Buy 2",
      discountBadge: "10% OFF",
      showDiscountBadge: true,
      isMostPopular: true,
      showMostPopular: true,
      mostPopularText: "Most Popular",
    },
    {
      quantity: 3,
      discountType: "percentage",
      discountPercentage: 15,
      discountValue: 15,
      title: "Buy 3",
      discountBadge: "15% OFF",
      showDiscountBadge: true,
      isMostPopular: false,
      showMostPopular: false,
    },
  ];

  return {
    id: uuidv4(),
    name: "Bundle",
    description: null,
    type: "discounted",
    productSelectionType,
    productIds: productSelectionType === "global" ? [] : productIds,
    sectionHeader: "Bundle and Save",
    isActive: true,
    allowVariantSelection: false,
    quantityDiscountTiers: tiers.map(formatQuantityDiscountTier),
    styleSettings: { ...DEFAULT_STYLE_SETTINGS },
    [ROARR_DEFAULT_BUNDLE_FLAG]: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Widens the existing default so it also covers the products published now.
 * Returns the updated bundle, or null when nothing needs to change.
 */
function widenDefaultBundle(bundle, { productSelectionType, productIds }) {
  const current = bundle.productSelectionType || "include";

  if (current === "global") {
    return null;
  }

  if (productSelectionType === "global") {
    return {
      ...bundle,
      productSelectionType: "global",
      productIds: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const merged = normalizeProductGids([
    ...(bundle.productIds || []),
    ...productIds,
  ]);

  if (merged.length === (bundle.productIds || []).length) {
    return null;
  }

  return {
    ...bundle,
    productSelectionType: "include",
    productIds: merged,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates and publishes the default bundle when the shop has no active bundle,
 * or widens the existing default to cover newly published products.
 * Never throws — publish flows call this fire-and-forget.
 *
 * @param {object} admin Shopify admin API client.
 * @param {object} options
 * @param {"global"|"products"} options.scope `global` when every product gets
 *   the Roarr product template (store publish), `products` when only the given
 *   products do (premium PDP publish).
 * @param {Array<string|number>} [options.productIds] Required for `products`.
 * @param {string} [options.shopifyJwtToken] Session token so the seed is also
 *   written to DynamoDB (required for later edits via update-bundle).
 */
export async function seedDefaultBundleIfNeeded(admin, options = {}) {
  try {
    const wantsGlobal = options.scope === "global";
    const shopifyJwtToken = options.shopifyJwtToken || null;
    const productIds = wantsGlobal
      ? []
      : normalizeProductGids(options.productIds);

    if (!wantsGlobal && productIds.length === 0) {
      console.error(
        "[SeedDefaultBundle] No usable product IDs for a product-scoped bundle",
      );
      return;
    }

    const target = {
      productSelectionType: wantsGlobal ? "global" : "include",
      productIds,
    };

    const stateResponse = await admin.graphql(SHOP_BUNDLE_STATE_QUERY);
    const stateJson = await stateResponse.json();
    const shop = stateJson.data?.shop;
    const ownerId = shop?.id;

    if (!ownerId) {
      console.error("[SeedDefaultBundle] Could not resolve shop ID");
      return;
    }

    let existingBundles = [];
    if (shop?.bundles?.value) {
      try {
        existingBundles = JSON.parse(shop.bundles.value).bundles || [];
      } catch (error) {
        console.error(
          "[SeedDefaultBundle] Error parsing existing bundles:",
          error?.message,
        );
      }
    }

    const defaultIndex = existingBundles.findIndex(
      (bundle) =>
        bundle?.[ROARR_DEFAULT_BUNDLE_FLAG] === true && isActiveBundle(bundle),
    );

    let bundles;
    let didSeed = false;
    let syncedBundle = null;

    if (defaultIndex !== -1) {
      // Our default is live: extend it to the products published now instead of
      // adding a second bundle.
      const widened = widenDefaultBundle(existingBundles[defaultIndex], target);
      if (!widened) {
        // Metafield already covers these products, but DynamoDB may still be
        // missing the auto-seeded row — heal that so edits don't 404.
        await upsertBundleInBackend(existingBundles[defaultIndex], shopifyJwtToken, {
          preferCreate: true,
        });
        return;
      }
      bundles = [...existingBundles];
      bundles[defaultIndex] = widened;
      syncedBundle = widened;
    } else {
      // Never override a merchant who already has a live bundle of their own.
      if (existingBundles.some(isActiveBundle)) {
        return;
      }
      const seeded = buildDefaultBundle(target);
      bundles = [...existingBundles, seeded];
      didSeed = true;
      syncedBundle = seeded;
    }

    const mutationResponse = await admin.graphql(METAFIELDS_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: "kluck_bundle",
            key: "bundles",
            value: JSON.stringify({ bundles }),
            type: "json",
          },
        ],
      },
    });
    const mutationJson = await mutationResponse.json();
    const userErrors = mutationJson.data?.metafieldsSet?.userErrors || [];

    if (userErrors.length > 0) {
      console.error(
        "[SeedDefaultBundle] Error writing bundle metafields:",
        JSON.stringify(userErrors),
      );
      return;
    }

    console.log(
      didSeed
        ? `[SeedDefaultBundle] Seeded default bundle (${target.productSelectionType})`
        : `[SeedDefaultBundle] Widened default bundle to ${target.productSelectionType}`,
    );

    if (syncedBundle) {
      await upsertBundleInBackend(syncedBundle, shopifyJwtToken, {
        preferCreate: didSeed,
      });
    }

    await ensureBundlerDiscount(admin);
  } catch (error) {
    console.error("[SeedDefaultBundle] Unexpected error:", error?.message);
  }
}
