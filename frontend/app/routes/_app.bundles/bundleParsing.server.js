/**
 * Shared parsing logic for bundles - used by both loader and action.
 */
import { v4 as uuidv4 } from "uuid";

/**
 * Marks the bundle auto-created by the publish flows. Publish flows use it to
 * extend that bundle instead of adding a second one, so it must survive
 * merchant edits even though the form never renders it.
 */
const ROARR_DEFAULT_BUNDLE_FLAG = "isRoarrDefault";

const DEFAULT_STYLE_SETTINGS = {
  cornerRoundness: 9,
  breathingSpace: 14,
  primaryColor: "#2563EB",
  primaryColorRgb: "37, 99, 235",
  mostPopularBadgeColor: "#F59E0B",
  mostPopularBadgeColorRgb: "245, 158, 11",
  limitedOfferBadgeColor: "#111827",
  limitedOfferBadgeColorRgb: "17, 24, 39",
  tierNameColor: "#333333",
  tierNameColorRgb: "51, 51, 51",
  tierCardFillColor: "#FFFFFF",
  tierCardFillColorRgb: "255, 255, 255",
};

/**
 * Format a quantity discount tier for consistent structure.
 * Used by both loader (parsing from metafield) and action (parsing from form).
 */
export function formatQuantityDiscountTier(tier) {
  return {
    quantity: parseInt(tier.quantity) || 1,
    discountType: tier.discountType || "percentage",
    discountPercentage:
      tier.discountType === "percentage"
        ? parseFloat(tier.discountPercentage) ||
          parseFloat(tier.discountValue) ||
          0
        : parseFloat(tier.discountPercentage) || 0,
    discountValue:
      tier.discountValue !== undefined
        ? parseFloat(tier.discountValue)
        : tier.discountType === "percentage"
          ? parseFloat(tier.discountPercentage) || 0
          : parseFloat(tier.discountValue) || 0,
    flatAmount:
      tier.discountType === "flat"
        ? parseFloat(tier.flatAmount || tier.discountValue || 0)
        : undefined,
    specificPrice:
      tier.discountType === "specificPrice"
        ? parseFloat(tier.specificPrice || tier.discountValue || 0)
        : undefined,
    title: tier.title || `Buy ${tier.quantity || 1}`,
    buyX: tier.buyX !== undefined ? parseInt(tier.buyX) || 1 : 1,
    getYFree: tier.getYFree !== undefined ? parseInt(tier.getYFree) || 1 : 1,
    discountBadge: tier.discountBadge || "",
    subtitle: tier.subtitle || "",
    showSubtitle: tier.showSubtitle !== false,
    isMostPopular: tier.isMostPopular || false,
    showMostPopular: tier.showMostPopular !== false,
    mostPopularText: tier.mostPopularText || "Most Popular",
    priceRounding: tier.priceRounding || false,
    priceRoundingValue: tier.priceRoundingValue || ".99",
    showDiscountBadge: tier.showDiscountBadge !== false,
    showSavings: tier.showSavings !== false,
    limitedOfferEnabled: tier.limitedOfferEnabled === true,
    limitedOfferEndsAt: tier.limitedOfferEndsAt || null,
    limitedOfferLabel: tier.limitedOfferLabel || "Limited offer",
  };
}

function formatFrequentlyBoughtItem(item) {
  if (!item) return null;
  return {
    productId: item.productId || item.upsellProductId || null,
    productTitle: item.productTitle || item.upsellProductTitle || "",
    variantId: item.variantId || item.upsellVariantId || null,
    variantTitle: item.variantTitle || item.upsellVariantTitle || "",
    image: item.image || item.upsellImage || null,
    price: item.price != null ? String(item.price) : null,
  };
}

function formatUpsellItem(item) {
  if (!item) return null;
  return {
    upsellVariantId: item.upsellVariantId || item.variantId || null,
    upsellVariantTitle: item.upsellVariantTitle || item.variantTitle || "",
    upsellProductId: item.upsellProductId || item.productId || "",
    upsellProductTitle: item.upsellProductTitle || item.productTitle || "",
    upsellProductHandle: item.upsellProductHandle || item.handle || "",
    upsellQuantity: parseInt(item.upsellQuantity || item.quantity || 1) || 1,
    discountPercentage:
      item.discountPercentage !== undefined
        ? parseFloat(item.discountPercentage)
        : 100,
    image: item.image || null,
  };
}

/**
 * Parse bundles from metafield JSON value.
 * Returns array of normalized bundle objects.
 */
export function parseBundlesFromMetafield(metafieldValue) {
  const bundles = [];

  if (!metafieldValue) {
    return bundles;
  }

  try {
    const bundlesData = JSON.parse(metafieldValue);
    const bundlesArray = bundlesData.bundles || [];

    bundlesArray.forEach((bundleData, index) => {
      let bundleType;
      if (
        bundleData.type === "upselling" ||
        bundleData.type === "discounted"
      ) {
        bundleType = bundleData.type;
      } else if (bundleData.type === "quantityDiscount") {
        bundleType = "discounted";
      } else if (bundleData.quantityDiscountTiers) {
        bundleType = "discounted";
      } else {
        bundleType = "upselling";
      }

      const productIds = bundleData.productIds || [];
      let productSelectionType = bundleData.productSelectionType;
      if (!productSelectionType) {
        productSelectionType =
          bundleData.scope === "global" ? "global" : "include";
      }

      if (bundleType === "discounted") {
        const quantityDiscountTiers = bundleData.quantityDiscountTiers || [];
        if (quantityDiscountTiers.length > 0) {
          const upsellItems = (bundleData.upsellItems || [])
            .map(formatUpsellItem)
            .filter(Boolean);
          const frequentlyBoughtWith = (
            bundleData.frequentlyBoughtWith || []
          )
            .map(formatFrequentlyBoughtItem)
            .filter(Boolean);
          bundles.push({
            id: bundleData.id || uuidv4(),
            name: bundleData.name || "Bundle",
            description: bundleData.description || null,
            productIds: productSelectionType === "global" ? [] : productIds,
            type: "discounted",
            productSelectionType,
            sectionHeader: bundleData.sectionHeader,
            quantityDiscountTiers: quantityDiscountTiers.map(formatQuantityDiscountTier),
            upsellItems,
            frequentlyBoughtWith,
            frequentlyBoughtWithHeading:
              bundleData.frequentlyBoughtWithHeading ||
              "Frequently bought with",
            showFrequentlyBoughtWith:
              bundleData.showFrequentlyBoughtWith !== false,
            styleSettings: bundleData.styleSettings || { ...DEFAULT_STYLE_SETTINGS },
            isActive: bundleData.isActive !== undefined ? bundleData.isActive : false,
            allowVariantSelection:
              bundleData.allowVariantSelection !== undefined
                ? bundleData.allowVariantSelection
                : false,
            createdAt: bundleData.createdAt || null,
            updatedAt: bundleData.updatedAt || null,
          });
        }
      } else {
        let upsellItems = [];
        if (bundleData.upsellItems && Array.isArray(bundleData.upsellItems)) {
          upsellItems = bundleData.upsellItems.map((item) => ({
            upsellVariantId: item.upsellVariantId || item.freeVariantId,
            upsellQuantity: item.upsellQuantity || item.freeQuantity || 1,
            discountPercentage:
              item.discountPercentage !== undefined ? item.discountPercentage : 100,
          }));
        } else if (
          bundleData.freeItems &&
          Array.isArray(bundleData.freeItems)
        ) {
          upsellItems = bundleData.freeItems.map((item) => ({
            upsellVariantId: item.freeVariantId,
            upsellQuantity: item.freeQuantity || 1,
            discountPercentage:
              item.discountPercentage !== undefined ? item.discountPercentage : 100,
          }));
        } else if (bundleData.freeVariantId || bundleData.upsellVariantId) {
          upsellItems = [
            {
              upsellVariantId:
                bundleData.upsellVariantId || bundleData.freeVariantId,
              upsellQuantity:
                bundleData.upsellQuantity || bundleData.freeQuantity || 1,
              discountPercentage:
                bundleData.discountPercentage !== undefined
                  ? bundleData.discountPercentage
                  : 100,
            },
          ];
        }

        if (upsellItems.length > 0) {
          bundles.push({
            id: bundleData.id || uuidv4(),
            name: bundleData.name || "Bundle",
            description: bundleData.description || null,
            productIds: productSelectionType === "global" ? [] : productIds,
            type: "upselling",
            productSelectionType,
            upsellItems,
            isActive: bundleData.isActive !== undefined ? bundleData.isActive : false,
            allowVariantSelection:
              bundleData.allowVariantSelection !== undefined
                ? bundleData.allowVariantSelection
                : false,
            createdAt: bundleData.createdAt || null,
            updatedAt: bundleData.updatedAt || null,
          });
        }
      }
    });
  } catch (e) {
    console.error("[Bundle Parsing] Error parsing bundles metafield:", e);
  }

  return bundles;
}

export {
  uuidv4,
  DEFAULT_STYLE_SETTINGS,
  ROARR_DEFAULT_BUNDLE_FLAG,
  formatFrequentlyBoughtItem,
  formatUpsellItem,
};
