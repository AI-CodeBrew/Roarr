import { useState, useEffect, useRef, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,
  TextField,
  Select,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Banner,
  Thumbnail,
  Tooltip,
  RadioButton,
  Frame,
  Toast,
} from "@shopify/polaris";
import ProductSelectionModal from "../../components/ProductSelectionModal";
import QuantityDiscountTiersSection from "./QuantityDiscountTiersSection";
import ColorAndStyleSection from "./ColorAndStyleSection";
import TrashIcon from "../../components/icons/TrashIcon";
import { Money } from "../../components/Money";
import { X, Info, Percent, Tag, Tags, Star } from "lucide-react";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd";

function normalizeProductPrice(price) {
  if (price == null || price === "") return null;
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function readProductPriceFromSelection(product) {
  if (!product) return null;
  const variantNode =
    product.variants?.edges?.[0]?.node ?? product.variants?.[0] ?? null;
  return normalizeProductPrice(variantNode?.price ?? product.price);
}

export default function BundleForm({
  editingBundle,
  variants,
  products = [],
  onSubmit,
  onCancel,
  onDirtyChange,
  isLoading,
}) {
  const shopify = useAppBridge();
  const isMobileLayout = useViewportBelowMd();
  const formRef = useRef(null);
  const initialFormSnapshotRef = useRef(null);
  const isHydratingFormRef = useRef(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    mainProductIds: [], // Array of product IDs
    bundleType: "discounted",
    productSelectionType: "include", // "global", "include", "exclude"
    mainProducts: [], // Array of selected products
    upsellItems: [],
    quantityDiscountTiers: [],
    sectionHeader: "",
    generalDiscountType: "percentage", // General discount type for all tiers
    isActive: false,
    allowVariantSelection: false, // Allow customers to choose different variants for each item
    styleSettings: {
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
    },
  });

  // Refs for scrolling to validation errors
  const bundleNameRef = useRef(null);
  const productSelectionRef = useRef(null);
  const quantityTiersRef = useRef(null);
  const upsellSectionRef = useRef(null);

  const scrollToRef = (ref) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const [productPickerMode, setProductPickerMode] = useState(null); // null | 'upsell'
  const [showMainProductModal, setShowMainProductModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [isSelectingMainProduct, setIsSelectingMainProduct] = useState(false);
  const [showGlobalBanner, setShowGlobalBanner] = useState(true);
  const [showFlatDiscountBanner, setShowFlatDiscountBanner] = useState(true);
  const [toastError, setToastError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [selectedProductPrice, setSelectedProductPrice] = useState(null);
  const [selectedPreviewTierIndex, setSelectedPreviewTierIndex] = useState(0);

  const resolveLoaderProductPrice = useCallback(
    (productId) => {
      const product = products.find((p) => p.id === productId);
      if (product?.variants?.length > 0) {
        return normalizeProductPrice(product.variants[0]?.price);
      }
      return null;
    },
    [products],
  );

  useEffect(() => {
    if (formData.mainProductIds.length !== 1) {
      setSelectedProductPrice(null);
      return;
    }

    const productId = formData.mainProductIds[0];
    const loaderPrice = resolveLoaderProductPrice(productId);
    if (loaderPrice != null) {
      setSelectedProductPrice(loaderPrice);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/bundle-product-details?ids=${encodeURIComponent(JSON.stringify([productId]))}`,
        );
        const data = await response.json();
        if (cancelled) return;
        const fetched = data.products?.[0];
        const price = normalizeProductPrice(
          fetched?.price ?? fetched?.variants?.[0]?.price,
        );
        setSelectedProductPrice(price);
      } catch {
        if (!cancelled) setSelectedProductPrice(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.mainProductIds, resolveLoaderProductPrice]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const resetDirtyBaseline = () => {
    initialFormSnapshotRef.current = null;
    setIsDirty(false);
  };
  const truncateText = (text, maxChars = 40) => {
    const value = typeof text === "string" ? text.trim() : "";
    if (!value) return "";
    return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;
  };

  // Helper function to ensure Tier 1 is always present
  const ensureTier1 = (tiers) => {
    const defaultTier1 = {
      quantity: 1,
      discountType: "percentage",
      discountPercentage: 0,
      discountValue: 0,
      title: "Buy 1",
      discountBadge: "Standard Price",
      subtitle: "",
      showSubtitle: false,
      isMostPopular: false,
      showMostPopular: false,
      mostPopularText: "Most Popular",
      showDiscountBadge: true,
      showSavings: true,
      limitedOfferEnabled: false,
      limitedOfferEndsAt: null,
      limitedOfferLabel: "Limited offer",
    };

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return [defaultTier1];
    }

    // Tier 1 is the first tier. Keep its quantity so a saved edit is not reset to 1.
    const existingTier1 = tiers[0];
    const quantity = existingTier1.quantity || 1;
    const mergedTier1 = {
      ...defaultTier1,
      ...existingTier1,
      quantity,
      discountPercentage:
        existingTier1.discountPercentage !== undefined
          ? existingTier1.discountPercentage
          : 0,
      discountValue:
        existingTier1.discountValue !== undefined
          ? existingTier1.discountValue
          : existingTier1.discountPercentage !== undefined
            ? existingTier1.discountPercentage
            : 0,
      title: existingTier1.title || `Buy ${quantity}`,
      discountBadge: existingTier1.discountBadge || "Standard Price",
    };

    return [mergedTier1, ...tiers.slice(1)];
  };

  // Flat discount rules are enforced in the UI (discount type first, then product selection).

  // Reset form when editing bundle
  useEffect(() => {
    // Reset banner states when editing bundle changes
    setShowGlobalBanner(true);
    setShowFlatDiscountBanner(true);
    resetDirtyBaseline();
    isHydratingFormRef.current = true;

    if (editingBundle) {
      // Fetch product details for missing product IDs
      const fetchProductDetails = async (productIds) => {
        const missingProductIds = productIds.filter(
          (id) => !products.find((p) => p.id === id),
        );
        if (missingProductIds.length === 0) return [];

        try {
          const response = await fetch(
            `/api/bundle-product-details?ids=${encodeURIComponent(JSON.stringify(missingProductIds))}`,
          );
          const data = await response.json();
          return data.products || [];
        } catch (error) {
          console.error("Error fetching product details:", error);
          return [];
        }
      };

      // Extract main products from productIds
      let mainProducts = [];
      let mainProductIds = [];

      // Use productIds (product-level bundles)
      if (
        editingBundle.productIds &&
        Array.isArray(editingBundle.productIds) &&
        editingBundle.productIds.length > 0
      ) {
        mainProductIds = editingBundle.productIds;

        // First, map products that are already in the products list
        const foundProducts = editingBundle.productIds
          .map((productId) => {
            const product = products.find((p) => p.id === productId);
            if (product) {
              return {
                productId: product.id,
                productTitle: product.title || "",
                image: product.image || null,
              };
            }
            return null;
          })
          .filter(Boolean);

        // Fetch missing products
        const missingProductIds = editingBundle.productIds.filter(
          (id) => !products.find((p) => p.id === id),
        );

        if (missingProductIds.length > 0) {
          fetchProductDetails(missingProductIds).then((fetchedProducts) => {
            const allProducts = [
              ...foundProducts,
              ...fetchedProducts.map((product) => ({
                productId: product.id,
                productTitle: product.title || "",
                image: product.image || null,
              })),
            ];
            setFormData((prev) => {
              const nextFormData = {
                ...prev,
                mainProducts: allProducts,
                mainProductIds: mainProductIds,
              };
              initialFormSnapshotRef.current = JSON.stringify(nextFormData);
              return nextFormData;
            });
            setIsDirty(false);
          });
          // Set found products immediately while fetching missing ones
          mainProducts = foundProducts;
        } else {
          mainProducts = foundProducts;
        }
      }

      // Extract upsell items
      const upsellItems =
        editingBundle.upsellItems ||
        editingBundle.freeItems?.map((item) => ({
          upsellVariantId: item.upsellVariantId || item.freeVariantId,
          upsellQuantity: item.upsellQuantity || item.freeQuantity || 1,
          discountPercentage:
            item.discountPercentage !== undefined
              ? item.discountPercentage
              : 100,
          // Add product info for display
          productId: null,
          productTitle: "",
          variantTitle: "",
          image: null,
          modifiedName: "",
        })) ||
        [];

      // Fetch product info for upsell items
      upsellItems.forEach((item) => {
        const variant = variants.find((v) => v.id === item.upsellVariantId);
        if (variant) {
          item.productId = variant.product.id;
          item.productTitle = variant.product.title;
          item.variantTitle = variant.title;
          item.image = variant.image || variant.product.image || null;
        }
      });

      // Handle backward compatibility: convert old scope to new productSelectionType
      let productSelectionType = editingBundle.productSelectionType;
      if (!productSelectionType) {
        // Migrate from old scope field
        if (editingBundle.scope === "global") {
          productSelectionType = "global";
        } else {
          // For old product-specific bundles, default to "include"
          productSelectionType = "include";
        }
      }

      const generalDiscountType =
        editingBundle.quantityDiscountTiers?.[0]?.discountType || "percentage";

      if (generalDiscountType === "flat") {
        productSelectionType = "include";
        mainProductIds = mainProductIds.slice(0, 1);
        mainProducts = mainProducts.slice(0, 1);
      }

      const nextFormData = {
        name: editingBundle.name || "",
        description: editingBundle.description || "",
        mainProductIds: mainProductIds,
        bundleType: editingBundle.type || "discounted",
        productSelectionType: productSelectionType,
        mainProducts: mainProducts,
        upsellItems: upsellItems,
        quantityDiscountTiers: (() => {
          const discountType =
            editingBundle.quantityDiscountTiers?.[0]?.discountType ||
            "percentage";
          const mappedTiers =
            editingBundle.quantityDiscountTiers?.map((tier, index) => ({
              quantity: tier.quantity || (index === 0 ? 1 : 2),
              discountType: discountType || tier.discountType || "percentage",
              discountPercentage:
                index === 0
                  ? tier.discountPercentage !== undefined
                    ? tier.discountPercentage
                    : 0
                  : tier.discountPercentage || tier.discountValue || 20,
              discountValue:
                index === 0
                  ? tier.discountValue !== undefined
                    ? tier.discountValue
                    : 0
                  : tier.discountValue !== undefined
                    ? tier.discountValue
                    : tier.discountPercentage || 20,
              flatAmount: tier.flatAmount,
              specificPrice: tier.specificPrice,
              buyX: tier.buyX,
              getYFree: tier.getYFree,
              title:
                tier.title ||
                `Buy ${tier.quantity || (index === 0 ? 1 : 2)}`,
              discountBadge:
                index === 0
                  ? tier.discountBadge || "Standard Price"
                  : tier.discountBadge,
              subtitle: tier.subtitle || "",
              showSubtitle: tier.showSubtitle !== false,
              isMostPopular: tier.isMostPopular || false,
              showMostPopular: tier.showMostPopular !== false,
              mostPopularText: tier.mostPopularText || "Most Popular",
              showDiscountBadge: tier.showDiscountBadge !== false,
              showSavings: tier.showSavings !== false,
              limitedOfferEnabled: tier.limitedOfferEnabled === true,
              limitedOfferEndsAt: tier.limitedOfferEndsAt || null,
              limitedOfferLabel: tier.limitedOfferLabel || "Limited offer",
            })) || [];

          // Only ensure Tier 1 for non-BOGO discount types
          // BOGO bundles don't need a Tier 1 with quantity 1
          if (discountType === "bogo") {
            return mappedTiers;
          }

          return ensureTier1(mappedTiers);
        })(),
        sectionHeader: editingBundle.sectionHeader,
        generalDiscountType,
        isActive:
          editingBundle.isActive !== undefined ? editingBundle.isActive : false,
        allowVariantSelection:
          editingBundle.allowVariantSelection !== undefined
            ? editingBundle.allowVariantSelection
            : false,
        styleSettings: {
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
          ...(editingBundle.styleSettings || {}),
        },
      };
      initialFormSnapshotRef.current = JSON.stringify(nextFormData);
      setFormData(nextFormData);
      setIsDirty(false);
      queueMicrotask(() => {
        isHydratingFormRef.current = false;
      });
    } else {
      // Reset form for new bundle - always include Tier 1
      const defaultTier1 = {
        quantity: 1,
        discountType: "percentage",
        discountPercentage: 0,
        discountValue: 0,
        title: "Buy 1",
        discountBadge: "Standard Price",
        subtitle: "",
        showSubtitle: false,
        isMostPopular: false,
        showMostPopular: false,
        mostPopularText: "Most Popular",
        showDiscountBadge: true,
        showSavings: true,
        limitedOfferEnabled: false,
        limitedOfferEndsAt: null,
        limitedOfferLabel: "Limited offer",
      };

      // Create default 3 tiers
      const defaultTier2 = {
        quantity: 2,
        discountType: "percentage",
        discountPercentage: 20,
        discountValue: 20,
        title: "Buy 2",
        discountBadge: "20% OFF",
        subtitle: "",
        showSubtitle: false,
        isMostPopular: true,
        showMostPopular: true,
        mostPopularText: "Most Popular",
        showDiscountBadge: true,
        showSavings: true,
        limitedOfferEnabled: false,
        limitedOfferEndsAt: null,
        limitedOfferLabel: "Limited offer",
      };

      const defaultTier3 = {
        quantity: 3,
        discountType: "percentage",
        discountPercentage: 30,
        discountValue: 30,
        title: "Buy 3",
        discountBadge: "30% OFF",
        subtitle: "",
        showSubtitle: false,
        isMostPopular: false,
        showMostPopular: false,
        mostPopularText: "Most Popular",
        showDiscountBadge: true,
        showSavings: true,
        limitedOfferEnabled: false,
        limitedOfferEndsAt: null,
        limitedOfferLabel: "Limited offer",
      };

      const nextFormData = {
        name: "",
        description: "",
        mainProductIds: [],
        bundleType: "discounted",
        productSelectionType: "include",
        mainProducts: [],
        upsellItems: [],
        quantityDiscountTiers: [defaultTier1, defaultTier2, defaultTier3],
        sectionHeader: "",
        generalDiscountType: "percentage",
        isActive: false,
        allowVariantSelection: false,
        styleSettings: {
          templateLayout: "vertical",
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
        },
      };
      initialFormSnapshotRef.current = JSON.stringify(nextFormData);
      setFormData(nextFormData);
      setIsDirty(false);
      queueMicrotask(() => {
        isHydratingFormRef.current = false;
      });
    }
  }, [editingBundle, variants, products]);

  useEffect(() => {
    if (isHydratingFormRef.current) return;
    const nextSnapshot = JSON.stringify(formData);
    if (!initialFormSnapshotRef.current) {
      initialFormSnapshotRef.current = nextSnapshot;
      setIsDirty(false);
      return;
    }
    setIsDirty(initialFormSnapshotRef.current !== nextSnapshot);
  }, [formData]);

  useEffect(() => {
    if (!shopify?.saveBar) return;
    const saveBarId = "bundle-contextual-save-bar";
    if (isDirty && !isLoading) {
      void shopify.saveBar.show(saveBarId).catch(() => {});
    } else {
      void shopify.saveBar.hide(saveBarId).catch(() => {});
    }
  }, [isDirty, isLoading, shopify]);

  useEffect(() => {
    return () => {
      void shopify?.saveBar?.hide("bundle-contextual-save-bar")?.catch?.(() => {});
    };
  }, [shopify]);

  const handleMainProductSelect = (selectedProducts) => {
    if (selectedProducts.length === 0) return;

    const isFlatDiscount = formData.generalDiscountType === "flat";

    if (isFlatDiscount) {
      const single = selectedProducts[0];
      setFormData({
        ...formData,
        mainProducts: [single],
        mainProductIds: [single.productId],
        productSelectionType: "include",
      });
    } else if (selectedProducts.length > 0) {
      // When editing, merge with existing products (avoid duplicates)
      const existingProductIds = new Set(
        formData.mainProducts.map((p) => p.productId),
      );
      const newProducts = selectedProducts.filter(
        (p) => !existingProductIds.has(p.productId),
      );
      const mergedProducts = [...formData.mainProducts, ...newProducts];
      const mainProductIds = mergedProducts.map((p) => p.productId);

      setFormData({
        ...formData,
        mainProducts: mergedProducts,
        mainProductIds: mainProductIds,
      });
    }
    setShowMainProductModal(false);
    setIsSelectingMainProduct(false);
  };

  // Fetch missing product details for products without proper titles
  useEffect(() => {
    const productsNeedingDetails = formData.mainProducts.filter(
      (product) =>
        !product.productTitle ||
        product.productTitle === `Product ${product.productId}` ||
        product.productTitle.startsWith("Product gid://") ||
        product.productTitle === "Loading...",
    );

    if (productsNeedingDetails.length === 0) return;

    const fetchMissingDetails = async () => {
      const productIds = productsNeedingDetails.map((p) => p.productId);
      try {
        const response = await fetch(
          `/api/bundle-product-details?ids=${encodeURIComponent(JSON.stringify(productIds))}`,
        );
        const data = await response.json();
        const fetchedProducts = data.products || [];

        if (fetchedProducts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            mainProducts: prev.mainProducts.map((product) => {
              const fetchedProduct = fetchedProducts.find(
                (fp) => fp.id === product.productId,
              );
              if (fetchedProduct) {
                return {
                  ...product,
                  productTitle: fetchedProduct.title || product.productTitle,
                  image: fetchedProduct.image || product.image,
                };
              }
              return product;
            }),
          }));
        }
      } catch (error) {
        console.error("Error fetching missing product details:", error);
      }
    };

    fetchMissingDetails();
  }, [formData.mainProducts]);

  const handleUpsellProductSelect = (selectedProducts) => {
    if (selectedProducts.length === 0) return;

    if (editingProductIndex !== null) {
      // Replace product at index (single selection when editing)
      const updated = [...formData.upsellItems];
      updated[editingProductIndex] = {
        ...selectedProducts[0],
        upsellVariantId: selectedProducts[0].variantId,
        upsellQuantity: selectedProducts[0].quantity || 1,
        discountPercentage: 100,
      };
      setFormData({ ...formData, upsellItems: updated });
      setEditingProductIndex(null);
    } else {
      // Add all selected products (multiple selection)
      const newItems = selectedProducts.map((product) => ({
        ...product,
        upsellVariantId: product.variantId,
        upsellQuantity: product.quantity || 1,
        discountPercentage: 100,
      }));
      setFormData({
        ...formData,
        upsellItems: [...formData.upsellItems, ...newItems],
      });
    }
    setProductPickerMode(null);
    setEditingProductIndex(null);
  };

  const handleRemoveUpsellItem = (index) => {
    setFormData({
      ...formData,
      upsellItems: formData.upsellItems.filter((_, i) => i !== index),
    });
  };

  const handleUpdateUpsellItem = (index, field, value) => {
    const updated = [...formData.upsellItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, upsellItems: updated });
  };

  const handleEditUpsellItem = (index) => {
    setEditingProductIndex(index);
    setProductPickerMode("upsell");
  };

  const closeProductPicker = () => {
    setProductPickerMode(null);
    setEditingProductIndex(null);
  };

  // Adapter for new ProductSelectionModal (multi-select confirm)
  const handleMainProductConfirm = (selectedProducts) => {
    const products = Array.isArray(selectedProducts)
      ? selectedProducts
      : selectedProducts
        ? [selectedProducts]
        : [];

    if (products.length === 0) return;

    const mapped = products.map((product) => {
      const firstImage = product.featuredImage?.url
        ? { url: product.featuredImage.url }
        : product.images?.edges?.[0]?.node
          ? { url: product.images.edges[0].node.url }
          : null;

      return {
        productId: product.id,
        productTitle: product.title || "",
        image: firstImage?.url || null,
      };
    });

    const selectedPrice = readProductPriceFromSelection(products[0]);
    if (selectedPrice != null) {
      setSelectedProductPrice(selectedPrice);
    }

    handleMainProductSelect(mapped);
  };

  const handleUpsellProductConfirm = (selectedProducts) => {
    const products = Array.isArray(selectedProducts)
      ? selectedProducts
      : selectedProducts
        ? [selectedProducts]
        : [];
    if (products.length === 0) return;

    const mapped = products.map((product) => {
      const firstVariant = product.variants?.edges?.[0]?.node;
      const firstImage = product.featuredImage?.url
        ? { url: product.featuredImage.url }
        : product.images?.edges?.[0]?.node
          ? { url: product.images.edges[0].node.url }
          : null;
      const price = readProductPriceFromSelection(product);

      return {
        productId: product.id,
        productTitle: product.title || "",
        variantId: firstVariant?.id || null,
        variantTitle: firstVariant?.title || "Default",
        sku: firstVariant?.sku || null,
        image: firstImage?.url || null,
        price,
        quantity: 1,
        modifiedName: "",
      };
    });

    handleUpsellProductSelect(mapped);
  };

  const addQuantityDiscountTier = () => {
    const generalDiscountType = formData.generalDiscountType || "percentage";
    const existingQuantities = formData.quantityDiscountTiers
      .map((t) => t.quantity)
      .filter((q) => q > 0);
    const nextQuantity =
      (existingQuantities.length > 0 ? Math.max(...existingQuantities) : 1) + 1;

    // Create new tier based on general discount type
    let newTier = {
      quantity: nextQuantity,
      discountType: generalDiscountType,
      subtitle: "",
      showSubtitle: false,
      isMostPopular: formData.quantityDiscountTiers.length === 1, // Mark second tier as most popular
      showMostPopular: formData.quantityDiscountTiers.length === 1,
      mostPopularText: "Most Popular",
      showDiscountBadge: true,
      showSavings: true,
      limitedOfferEnabled: false,
      limitedOfferEndsAt: null,
      limitedOfferLabel: "Limited offer",
    };

    // Set defaults based on discount type
    if (generalDiscountType === "percentage") {
      newTier.discountPercentage = 20;
      newTier.discountValue = 20;
      newTier.title = `Buy ${nextQuantity}`;
      newTier.discountBadge = "20% OFF";
    } else if (generalDiscountType === "flat") {
      newTier.flatAmount = 0;
      newTier.discountValue = 0;
      newTier.title = `Buy ${nextQuantity}`;
      newTier.discountBadge = "";
    } else if (generalDiscountType === "bogo") {
      // Calculate tier number based on existing tiers
      // Tier 1 = Buy 1 Get 1, Tier 2 = Buy 2 Get 2, Tier 3 = Buy 3 Get 3, etc.
      const tierNumber = hasTier1
        ? formData.quantityDiscountTiers.length
        : formData.quantityDiscountTiers.length + 1;
      newTier.buyX = tierNumber;
      newTier.getYFree = tierNumber;
      newTier.quantity = tierNumber * 2; // buyX + getYFree
      const percentage = calculateBogoPercentage(tierNumber, tierNumber);
      newTier.title = `Buy ${tierNumber} Get ${tierNumber} Free!`;
      newTier.discountBadge = `${percentage}% OFF`;
    }
    setFormData({
      ...formData,
      quantityDiscountTiers: [...formData.quantityDiscountTiers, newTier],
    });
  };

  const removeQuantityDiscountTier = (index) => {
    // Prevent deletion of Tier 1 (position 0)
    if (index === 0) {
      return; // Cannot delete Tier 1
    }

    setFormData({
      ...formData,
      quantityDiscountTiers: formData.quantityDiscountTiers.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const handleGeneralDiscountTypeChange = (discountType) => {
    const productPrice = selectedProductPrice;

    // Update all tiers with the new discount type and auto-update quantities
    const updatedTiers = formData.quantityDiscountTiers.map((tier, index) => {
      const isTier1 = index === 0;
      const updates = { discountType };

      if (discountType === "percentage") {
        const discountValue =
          tier.discountPercentage ||
          tier.discountValue ||
          (isTier1 ? 0 : index === 1 ? 20 : 30);
        updates.discountValue = discountValue;
        updates.discountPercentage = discountValue;
        updates.discountBadge =
          isTier1 && discountValue === 0
            ? "Standard Price"
            : `${discountValue}% OFF`;
        updates.quantity = index + 1; // 1, 2, 3
        updates.title = isTier1 ? "Buy 1" : `Buy ${index + 1}`;
      } else if (discountType === "flat") {
        // Auto-update quantities: 1, 2, 3
        const quantity = index + 1;
        let flatAmount = 0;
        if (!isTier1 && productPrice !== null) {
          // Set reasonable flat amounts: 10% for tier 2, 15% for tier 3
          flatAmount =
            index === 1
              ? Math.round(productPrice * 0.1 * 100) / 100
              : Math.round(productPrice * 0.15 * 100) / 100;
        } else if (!isTier1) {
          // Keep at 0 until a product price is available
          flatAmount = 0;
        }
        updates.discountValue = flatAmount;
        updates.flatAmount = flatAmount;
        updates.quantity = quantity;
        updates.discountBadge =
          isTier1 && flatAmount === 0
            ? "Standard Price"
            : `Flat $${flatAmount.toFixed(2)} off`;
        updates.title = isTier1 ? "Buy 1" : `Buy ${quantity}`;
      } else if (discountType === "bogo") {
        // Auto-update BOGO: Tier 1 = Buy 1 Get 1, Tier 2 = Buy 2 Get 2, Tier 3 = Buy 3 Get 3
        let buyX, getYFree;
        if (isTier1) {
          buyX = 1;
          getYFree = 1; // Buy 1 Get 1 for Tier 1
        } else if (index === 1) {
          buyX = 2;
          getYFree = 2; // Buy 2 Get 2 for Tier 2
        } else {
          buyX = 3;
          getYFree = 3; // Buy 3 Get 3 for Tier 3
        }
        const totalQuantity = buyX + getYFree;
        const percentage = calculateBogoPercentage(buyX, getYFree);
        updates.buyX = buyX;
        updates.getYFree = getYFree;
        updates.quantity = totalQuantity;
        updates.discountBadge = `${percentage}% OFF`;
        updates.title = `Buy ${buyX} Get ${getYFree} Free!`;
      }

      return { ...tier, ...updates };
    });

    setFormData({
      ...formData,
      generalDiscountType: discountType,
      quantityDiscountTiers: updatedTiers,
      ...(discountType === "flat"
        ? {
            productSelectionType: "include",
            mainProducts: formData.mainProducts.slice(0, 1),
            mainProductIds: formData.mainProductIds.slice(0, 1),
          }
        : {}),
    });
  };

  const updateQuantityDiscountTier = (index, updates) => {
    const updatedTiers = [...formData.quantityDiscountTiers];
    const currentTier = updatedTiers[index];

    // Validate quantity: each tier must have quantity greater than previous tier
    // Note: We allow the update to happen so the error can be displayed in the UI
    // The error will be shown by QuantityDiscountTiersSection component
    if (updates.quantity !== undefined && index > 0) {
      const previousTier = updatedTiers[index - 1];
      const previousQuantity = previousTier.quantity || 1;
      const newQuantity = parseInt(updates.quantity) || 1;

      // Allow update even if invalid - error will be displayed in UI
      // The validation error will be shown by the QuantityDiscountTiersSection component
    }

    // Flat amount vs product price is validated inline in QuantityDiscountTiersSection.
    // Allow updates so the field remains editable and errors are visible.

    // Validate BOGO: Get Y Free cannot exceed Buy X by more than 5x, and max is 10
    if (updates.getYFree !== undefined) {
      const buyX =
        updates.buyX !== undefined
          ? updates.buyX
          : currentTier.buyX !== undefined
            ? currentTier.buyX
            : 1;
      const getYFree = updates.getYFree;
      if (getYFree > buyX * 5 || getYFree > 10) {
        // Allow update even if invalid - error will be displayed in UI
        // The validation error will be shown by the QuantityDiscountTiersSection component
      }
    }

    updatedTiers[index] = { ...updatedTiers[index], ...updates };
    setFormData({ ...formData, quantityDiscountTiers: updatedTiers });
  };

  const reorderQuantityDiscountTiers = (fromIndex, toIndex) => {
    // Prevent moving Tier 1 (position 0) from position 0
    if (fromIndex === 0) {
      return; // Cannot move Tier 1 from position 0
    }

    // Prevent moving any tier to position 0 (Tier 1 must stay at position 0)
    if (toIndex === 0) {
      return; // Cannot move other tiers to position 0 when Tier 1 is there
    }

    const newTiers = [...formData.quantityDiscountTiers];
    const [removed] = newTiers.splice(fromIndex, 1);
    newTiers.splice(toIndex, 0, removed);
    setFormData({ ...formData, quantityDiscountTiers: newTiers });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSave(true);

    // Validate bundle name
    if (!formData.name || formData.name.trim() === "") {
      setNameError("Bundle name is required");
      scrollToRef(bundleNameRef);
      return;
    } else {
      setNameError("");
    }

    // Validate product selection for include/exclude types
    if (
      (formData.productSelectionType === "include" ||
        formData.productSelectionType === "exclude") &&
      (!formData.mainProductIds || formData.mainProductIds.length === 0)
    ) {
      const typeLabel =
        formData.productSelectionType === "include"
          ? "selected products only"
          : "excluded products";
      setToastError(
        `Please select at least one product for "${typeLabel}" bundles`,
      );
      scrollToRef(productSelectionRef);
      return;
    }

    if (
      formData.bundleType === "discounted" &&
      formData.generalDiscountType === "flat" &&
      formData.mainProductIds.length !== 1
    ) {
      setToastError(
        "Flat discount requires exactly 1 selected product",
      );
      scrollToRef(productSelectionRef);
      return;
    }

    if (formData.bundleType === "discounted") {
      if (formData.quantityDiscountTiers.length === 0) {
        setToastError("Please add at least one quantity discount tier");
        scrollToRef(quantityTiersRef);
        return;
      }

      // Validate that each tier has quantity greater than previous tier
      for (let i = 1; i < formData.quantityDiscountTiers.length; i++) {
        const currentTier = formData.quantityDiscountTiers[i];
        const previousTier = formData.quantityDiscountTiers[i - 1];
        const currentQuantity = currentTier.quantity || 1;
        const previousQuantity = previousTier.quantity || 1;

        if (currentQuantity <= previousQuantity) {
          setToastError(
            `Tier ${i + 1} quantity (${currentQuantity}) must be greater than Tier ${i}'s quantity (${previousQuantity})`,
          );
          scrollToRef(quantityTiersRef);
          return;
        }
      }
    } else {
      if (formData.upsellItems.length === 0) {
        setToastError("Please add at least one upsell item");
        scrollToRef(upsellSectionRef);
        return;
      }
    }

    // Convert to backend format
    const bundleData = {
      name: formData.name,
      description: formData.description || null,
      productIds:
        formData.productSelectionType === "global"
          ? []
          : formData.mainProductIds, // Array of product IDs
      bundleType: formData.bundleType,
      productSelectionType: formData.productSelectionType,
      upsellItems:
        formData.bundleType === "discounted"
          ? []
          : formData.upsellItems.map((item) => ({
              upsellVariantId: item.upsellVariantId,
              upsellQuantity: item.upsellQuantity || 1,
              discountPercentage:
                item.discountPercentage !== undefined
                  ? item.discountPercentage
                  : 100,
            })),
      quantityDiscountTiers: formData.quantityDiscountTiers,
      sectionHeader: formData.sectionHeader,
      isActive: formData.isActive,
      allowVariantSelection:
        formData.allowVariantSelection !== undefined
          ? formData.allowVariantSelection
          : false,
      styleSettings: formData.styleSettings || {
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
      },
    };
    // return;
    onSubmit(bundleData);
    initialFormSnapshotRef.current = JSON.stringify(formData);
    setIsDirty(false);
    setHasAttemptedSave(false);
  };

  const handleContextualSave = () => {
    if (isLoading) return;
    formRef.current?.requestSubmit();
  };

  const handleContextualDiscard = () => {
    if (isLoading) return;
    void shopify?.saveBar?.hide("bundle-contextual-save-bar")?.catch?.(() => {});
    setIsDirty(false);
    setHasAttemptedSave(false);
    onCancel();
  };

  const [nameError, setNameError] = useState("");
  const hasMainProductError =
    hasAttemptedSave &&
    (formData.productSelectionType === "include" ||
      formData.productSelectionType === "exclude") &&
    (!formData.mainProductIds || formData.mainProductIds.length === 0);
  const hasUpsellError =
    formData.bundleType === "upselling" && formData.upsellItems.length === 0;
  const hasQuantityDiscountError =
    formData.bundleType === "discounted" &&
    formData.quantityDiscountTiers.length === 0;

  const bundleTypeOptions = [
    // { label: "Upselling (Buy X Get Y Free/Discounted)", value: "upselling" },
    {
      label: "Discounted (Quantity Based + Buy X Get Y Free)",
      value: "discounted",
    },
  ];

  // Preview rendering helper functions
  const DISCOUNT_TYPES = {
    PERCENTAGE: "percentage",
    FLAT: "flat",
    BOGO: "bogo",
  };

  const calculateBogoPercentage = (buyX, getYFree) => {
    if (getYFree === 0) return 0;
    const totalItems = buyX + getYFree;
    const percentage = (getYFree / totalItems) * 100;
    // Round to nearest integer, or 1 decimal if needed
    return Math.round(percentage * 10) / 10;
  };

  const getDiscountDisplayText = (tier) => {
    const discountType = tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
    const discountValue =
      tier.discountValue !== undefined
        ? tier.discountValue
        : tier.discountPercentage || 0;

    switch (discountType) {
      case DISCOUNT_TYPES.PERCENTAGE:
        return `${discountValue}% OFF`;
      case DISCOUNT_TYPES.FLAT:
        return `Flat $${Number(discountValue).toFixed(2)} off`;
      case DISCOUNT_TYPES.BOGO:
        const buyX = tier.buyX !== undefined ? tier.buyX : 1;
        const getYFree = tier.getYFree !== undefined ? tier.getYFree : 1;
        if (getYFree === 0) {
          return "Standard Price";
        }
        const percentage = calculateBogoPercentage(buyX, getYFree);
        return `${percentage}% OFF`;
      default:
        return `${discountValue}% OFF`;
    }
  };

  const calculatePreviewPrice = (tier, basePrice = 20) => {
    const discountType = tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
    const quantity = tier.quantity || 2;
    const discountValue =
      tier.discountValue !== undefined
        ? tier.discountValue
        : tier.discountPercentage || 0;
    const originalTotal = basePrice * quantity;

    switch (discountType) {
      case DISCOUNT_TYPES.PERCENTAGE:
        const discountAmount = originalTotal * (discountValue / 100);
        return originalTotal - discountAmount;
      case DISCOUNT_TYPES.FLAT:
        return Math.max(0, originalTotal - discountValue);
      case DISCOUNT_TYPES.BOGO:
        const buyX = tier.buyX !== undefined ? tier.buyX : 1;
        const getYFree = tier.getYFree !== undefined ? tier.getYFree : 1;
        // Customer pays for buyX items, gets getYFree items free
        return basePrice * buyX;
      default:
        return originalTotal;
    }
  };

  const renderPreview = () => {
    if (
      formData.bundleType !== "discounted" ||
      formData.quantityDiscountTiers.length === 0
    ) {
      return null;
    }

    // Use actual product price if only one product is selected, otherwise use default
    let basePrice = 20;
    if (formData.mainProductIds.length === 1 && products.length > 0) {
      const selectedProductId = formData.mainProductIds[0];
      const selectedProduct = products.find((p) => p.id === selectedProductId);
      if (
        selectedProduct &&
        selectedProduct.variants &&
        selectedProduct.variants.length > 0
      ) {
        const variantPrice = selectedProduct.variants[0]?.price;
        if (variantPrice !== null && variantPrice !== undefined) {
          basePrice = variantPrice;
        }
      }
    }
    // Ensure we always have valid style settings with defaults
    const safeStyleSettings = formData.styleSettings || {};
    const primaryColor = safeStyleSettings.primaryColor || "#2563EB";
    const primaryColorRgb =
      safeStyleSettings.primaryColorRgb ||
      (() => {
        const hex = primaryColor.replace(/^#/, "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      })();
    const cornerRoundness = safeStyleSettings.cornerRoundness ?? 9;
    const breathingSpace = safeStyleSettings.breathingSpace ?? 14;
    const mostPopularBadgeColor =
      safeStyleSettings.mostPopularBadgeColor || "#F59E0B";
    const limitedOfferBadgeColor =
      safeStyleSettings.limitedOfferBadgeColor || "#111827";
    const tierNameColor = safeStyleSettings.tierNameColor || "#333333";
    const tierCardFillColor =
      safeStyleSettings.tierCardFillColor || "#FFFFFF";
    const sectionHeader = formData.sectionHeader;

    return (
      <Box
          background="bg-surface"
          padding="400"
          className="bundle-preview-container"
          style={{
            "--bundle-primary-color": primaryColor,
            "--bundle-primary-color-rgb": primaryColorRgb,
            "--bundle-corner-roundness": `${cornerRoundness}px`,
            "--bundle-breathing-space": `${breathingSpace}px`,
            "--bundle-most-popular-badge-color": mostPopularBadgeColor,
            "--bundle-limited-offer-badge-color": limitedOfferBadgeColor,
            "--bundle-tier-name-color": tierNameColor,
            "--bundle-tier-card-fill-color": tierCardFillColor,
          }}
        >
        <style>{`
          .bundle-preview-container .bundle-preview-option:hover {
            border-color: var(--bundle-primary-color) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
            background: var(--bundle-tier-card-fill-color, #ffffff) !important;
          }
        `}</style>
        {/* Section Header with Lines */}
        <Box
          className="py-4 flex items-center justify-center gap-4 w-full"
        >
          <Box className="flex-1 h-px bg-gray-300" />
          <Text
            variant="headingMd"
            as="h2"
            fontWeight="bold"
            className="text-gray-900 whitespace-nowrap flex-shrink-0 text-xl"
          >
            {sectionHeader}
          </Text>
          <Box className="flex-1 h-px bg-gray-300" />
        </Box>

        <Box
          className="flex flex-col gap-[var(--bundle-breathing-space)]"
        >
          {/* Bundle Tiers */}
          {formData.quantityDiscountTiers.map((tier, index) => {
            const isTier1 = index === 0; // Tier 1 is identified by position, not quantity
            const discountType = tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
            const tierTitle =
              tier.title || `Buy ${tier.quantity || (isTier1 ? 1 : 2)}`;
            const discountBadge =
              tier.discountBadge ||
              (isTier1 ? "Standard Price" : getDiscountDisplayText(tier));
            const showMostPopular = tier.showMostPopular !== false;
            const safeSelectedIndex = Math.min(
              selectedPreviewTierIndex,
              Math.max(0, formData.quantityDiscountTiers.length - 1),
            );
            const isSelected = index === safeSelectedIndex;

            // Calculate original price based on discount type
            let originalPrice;
            if (discountType === DISCOUNT_TYPES.BOGO) {
              const buyX = tier.buyX !== undefined ? tier.buyX : 1;
              const getYFree = tier.getYFree !== undefined ? tier.getYFree : 1;
              originalPrice = basePrice * (buyX + getYFree); // Total items customer receives
            } else {
              originalPrice = basePrice * (tier.quantity || (isTier1 ? 1 : 2));
            }

            const discountedPrice = calculatePreviewPrice(tier, basePrice);
            const savingsAmount = originalPrice - discountedPrice;
            const showSavings =
              tier.showSavings !== false && savingsAmount >= 0.005;
            const limitedOfferActive =
              tier.limitedOfferEnabled &&
              tier.limitedOfferEndsAt &&
              new Date(tier.limitedOfferEndsAt).getTime() > Date.now();

            return (
              <Box
                key={index}
                padding="400"
                onClick={() => setSelectedPreviewTierIndex(index)}
                className={`bundle-preview-option relative cursor-pointer transition-all duration-200 ease-in-out min-h-[72px] p-5 rounded-[var(--bundle-corner-roundness)] ${isSelected ? "border-2 border-[color:var(--bundle-primary-color)] shadow-[0_0_0_1px_var(--bundle-primary-color)]" : "border border-gray-400"}`}
                style={{
                  backgroundColor: "var(--bundle-tier-card-fill-color, #ffffff)",
                }}
              >
                {showMostPopular && (
                  <Box
                    className="absolute -top-3 right-3 px-4 py-0.5 rounded text-base font-black text-white rotate-[2deg] z-10 flex items-center gap-1.5 bg-[var(--bundle-most-popular-badge-color)]"
                  >
                    <Star className="w-5 h-5 shrink-0" fill="currentColor" strokeWidth={0} />
                    {tier.mostPopularText || "Most Popular"}
                  </Box>
                )}
                {limitedOfferActive && (
                  <Box
                    className="absolute -top-2 left-3 px-2 py-0.5 rounded text-xs font-semibold text-white z-10"
                    style={{
                      backgroundColor:
                        "var(--bundle-limited-offer-badge-color, #111827)",
                    }}
                  >
                    {tier.limitedOfferLabel || "Limited offer"}
                  </Box>
                )}
                <InlineStack
                  gap="200"
                  align="space-between"
                  blockAlign="center"
                >
                  {/* Left: Radio Button */}
                  <Box className="shrink-0">
                    <Box
                      className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center ${isSelected ? "border-[color:var(--bundle-primary-color)] bg-[var(--bundle-primary-color)]" : "border-gray-300 bg-white"}`}
                    >
                      {isSelected && (
                        <Box className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </Box>
                  </Box>

                  {/* Center: Option Details */}
                  <Box className="flex-1 min-w-0">
                        <Text
                          variant="bodyMd"
                          fontWeight="semibold"
                          className="mb-1 text-lg"
                        >
                          <span style={{ color: "var(--bundle-tier-name-color, #333333)" }}>
                            {tierTitle}
                          </span>
                        </Text>
                        {tier.showDiscountBadge !== false && discountBadge && (
                          <Text variant="bodySm" className="font-medium text-sm">
                            <span className="[color:var(--bundle-primary-color)]">
                              {discountBadge}
                            </span>
                          </Text>
                        )}
                  </Box>

                  {/* Right: Pricing - only show crossed original when different from discounted (match storefront behavior) */}
                  <Box className="text-right shrink-0 ml-2">
                    <Text
                      variant="bodyLg"
                      fontWeight="semibold"
                      className="text-lg"
                    >
                      <span className="[color:var(--bundle-primary-color)]">
                        <Money amount={discountedPrice} />
                      </span>
                    </Text>
                    {Math.abs(originalPrice - discountedPrice) >= 0.005 && (
                      <Text variant="bodyMd" className="text-gray-500 text-sm">
                        <span className="line-through">
                          <Money amount={originalPrice} />
                        </span>
                      </Text>
                    )}
                    {showSavings && (
                      <Text variant="bodySm" as="p">
                        <span className="[color:var(--bundle-primary-color)]">
                          You save <Money amount={savingsAmount} />
                        </span>
                      </Text>
                    )}
                  </Box>
                </InlineStack>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const toastMarkup = toastError ? (
    <Toast content={toastError} error onDismiss={() => setToastError(null)} />
  ) : null;

  const isFlatDiscount =
    formData.bundleType === "discounted" &&
    formData.generalDiscountType === "flat";

  return (
    <Frame>
      {toastMarkup}
      <ui-save-bar id="bundle-contextual-save-bar">
        <button variant="primary" onClick={handleContextualSave}>
          Save
        </button>
        <button onClick={handleContextualDiscard}>Discard</button>
      </ui-save-bar>
      <form ref={formRef} className="mb-10 mt-4" onSubmit={handleSubmit}>
        <div
          className={`relative flex items-start gap-8 ${isMobileLayout ? "flex-col" : ""}`}
        >
          {/* Left Column - Form */}
          <Box
            minWidth="0"
            className={`${isMobileLayout ? "w-full order-1" : "flex-[0_0_55%] order-1"}`}
          >
            <BlockStack gap="500">
              {isMobileLayout && formData.bundleType === "discounted" ? (
                <Box className="mx-1">{renderPreview()}</Box>
              ) : null}
              <Card roundedAbove="sm" padding="0">
                <Box background="bg-surface" padding="400">
                {/* General Section */}
                <div ref={bundleNameRef} className="mb-4">
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">
                      Bundle Configuration
                    </Text>

                    <TextField
                      label={
                        <span>
                          Bundle Name{" "}
                          <span className="text-[#d72c0d]">*</span>
                        </span>
                      }
                      value={formData.name}
                      onChange={(value) => {
                        setFormData({ ...formData, name: value });
                        if (nameError) setNameError("");
                      }}
                      error={nameError}
                      required
                      autoComplete="off"
                    />

                    {/* <Select
                label="Bundle Type"
                options={bundleTypeOptions}
                value={formData.bundleType}
                onChange={(value) => setFormData({ ...formData, bundleType: value })}
                disabled={!!editingBundle}
              /> */}
                  </BlockStack>
                </div>

              {/* General Discount Type Section - Only for Discounted Bundle Type */}
              {formData.bundleType === "discounted" && (
                <Box paddingBlockStart="300">
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                      <BlockStack gap="400">
                    <Box>
                      <Text variant="headingMd" as="h2">
                        Select Discount Type
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        This discount type will apply to all tiers
                      </Text>
                    </Box>
                    <Box>
                      <style>{`
                        .discount-type-button {
                          display: inline-flex;
                          align-items: center;
                          gap: 6px;
                          padding: 8px 14px;
                          border-radius: 8px;
                          border: 1px solid #D1D5DB;
                          font-size: 13px;
                          font-weight: 500;
                          cursor: pointer;
                          transition: all 0.2s ease;
                          background: #FFFFFF;
                          color: #374151;
                          line-height: 1.2;
                        }
                        .discount-type-button.selected {
                          background: #FFFFFF;
                          color: #374151;
                          border-color: #374151;
                          border-width: 1.5px;
                        }
                        .discount-type-button:not(.selected):hover {
                          background: #F9FAFB;
                          border-color: #9CA3AF;
                        }
                        .discount-type-button svg {
                          width: 16px;
                          height: 16px;
                          flex-shrink: 0;
                          color: inherit;
                        }
                        .discount-type-button span {
                          color: inherit;
                        }
                      `}</style>
                      <BlockStack gap="200">
                        <InlineStack gap="200" wrap>
                          <Box
                            as="button"
                            type="button"
                            className={`discount-type-button ${formData.generalDiscountType === "percentage" ? "selected" : ""}`}
                            onClick={() =>
                              handleGeneralDiscountTypeChange("percentage")
                            }
                          >
                            <Percent size={16} />
                            <span>Off</span>
                          </Box>
                          <Box
                            as="button"
                            type="button"
                            className={`discount-type-button ${formData.generalDiscountType === "flat" ? "selected" : ""}`}
                            onClick={() =>
                              handleGeneralDiscountTypeChange("flat")
                            }
                          >
                            <Tag size={16} />
                            <span>Flat</span>
                          </Box>
                          <Box
                            as="button"
                            type="button"
                            className={`discount-type-button ${formData.generalDiscountType === "bogo" ? "selected" : ""}`}
                            onClick={() =>
                              handleGeneralDiscountTypeChange("bogo")
                            }
                          >
                            <Tags size={16} />
                            <span>BOGO</span>
                          </Box>
                        </InlineStack>
                        {isFlatDiscount ? (
                          <Text variant="bodySm" tone="subdued" as="p">
                            Flat discount is only available when exactly 1 product
                            is selected
                          </Text>
                        ) : null}
                      </BlockStack>
                      <style>{`
                        .discount-type-banner {
                          padding: 12px 16px;
                          border-radius: 6px;
                          margin-top: 12px;
                          display: flex;
                          align-items: flex-start;
                          gap: 12px;
                        }
                        .discount-type-banner.percentage {
                          background-color: #EFF6FF;
          border: 1px solid #BFDBFE;
        }
                        .discount-type-banner.flat {
                          background-color: #F0FDF4;
          border: 1px solid #BBF7D0;
        }
                        .discount-type-banner.bogo {
                          background-color: #FEF3C7;
          border: 1px solid #FDE68A;
        }
                        .discount-type-banner-icon {
                          flex-shrink: 0;
                          margin-top: 2px;
        }
                        .discount-type-banner-content {
                          flex: 1;
        }
                        .discount-type-banner-title {
                          font-weight: 600;
                          font-size: 13px;
                          margin-bottom: 4px;
        }
                        .discount-type-banner-description {
                          font-size: 13px;
                          line-height: 1.4;
        }
                        .discount-type-banner.percentage .discount-type-banner-title {
                          color: #1E40AF;
        }
                        .discount-type-banner.percentage .discount-type-banner-description {
                          color: #1E3A8A;
        }
                        .discount-type-banner.flat .discount-type-banner-title {
                          color: #166534;
        }
                        .discount-type-banner.flat .discount-type-banner-description {
                          color: #14532D;
        }
                        .discount-type-banner.bogo .discount-type-banner-title {
                          color: #92400E;
        }
                        .discount-type-banner.bogo .discount-type-banner-description {
                          color: #78350F;
        }
                      `}</style>
                      {formData.generalDiscountType === "percentage" && (
                        <Box className="discount-type-banner percentage">
                          <Box className="discount-type-banner-icon">
                            <Percent size={18} className="text-blue-800" />
                          </Box>
                          <Box className="discount-type-banner-content">
                            <Text
                              fontWeight="medium"
                              className="discount-type-banner-title"
                              as="p"
                            >
                              Percentage Off Discount
                            </Text>
                            <Text
                              className="discount-type-banner-description"
                              as="p"
                            >
                              Customers receive a percentage discount based on
                              the quantity they purchase. For example, buy 2
                              items and get 20% off, buy 3 items and get 30%
                              off.
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {formData.generalDiscountType === "flat" && (
                        <Box className="discount-type-banner flat">
                          <Box className="discount-type-banner-icon">
                            <Tag size={18} className="text-green-800" />
                          </Box>
                          <Box className="discount-type-banner-content">
                            <Text
                              fontWeight="medium"
                              className="discount-type-banner-title"
                              as="p"
                            >
                              Flat Amount Discount
                            </Text>
                            <Text
                              className="discount-type-banner-description"
                              as="p"
                            >
                              Customers receive a fixed dollar amount discount
                              based on quantity. For example, buy 2 items and
                              save $5, buy 3 items and save $10.
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {formData.generalDiscountType === "bogo" && (
                        <Box className="discount-type-banner bogo">
                          <Box className="discount-type-banner-icon">
                            <Tags size={18} className="text-amber-800" />
                          </Box>
                          <Box className="discount-type-banner-content">
                            <Text
                              fontWeight="medium"
                              className="discount-type-banner-title"
                              as="p"
                            >
                              Buy One Get One (BOGO)
                            </Text>
                            <Text
                              className="discount-type-banner-description"
                              as="p"
                            >
                              Customers get free items when they purchase a
                              certain quantity. For example, buy 2 get 2 free
                              means customers pay for 2 items and receive 2
                              additional items for free.
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </Box>
                      </BlockStack>
                    </Box>
                  </Card>
                </Box>
              )}

                {/* Product Selection Section */}
                <Box
                  ref={productSelectionRef}
                  paddingBlockStart={formData.bundleType === "discounted" ? "300" : undefined}
                >
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">
                      Product Selection
                    </Text>

                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <RadioButton
                          label="All products"
                          checked={formData.productSelectionType === "global"}
                          id="global"
                          name="productSelectionType"
                          disabled={isFlatDiscount}
                          onChange={() => {
                            setFormData({
                              ...formData,
                              productSelectionType: "global",
                              mainProductIds: [],
                              mainProducts: [],
                            });
                          }}
                        />
                        <Tooltip content="This bundle will automatically apply to all products and variants in your store. No product selection needed.">
                          <Box
                            as="span"
                            className="cursor-help inline-flex items-center"
                          >
                            <Info
                              className="mt-1 text-gray-500"
                              size={16}
                            />
                          </Box>
                        </Tooltip>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <RadioButton
                          label="Selected products only"
                          checked={formData.productSelectionType === "include"}
                          id="include"
                          name="productSelectionType"
                          onChange={() =>
                            setFormData({
                              ...formData,
                              productSelectionType: "include",
                            })
                          }
                        />
                        <Tooltip content="This bundle will only apply to the specific products you select. You'll need to choose which products should have this bundle offer.">
                          <Box
                            as="span"
                            className="cursor-help inline-flex items-center"
                          >
                            <Info
                              className="mt-1 text-gray-500"
                              size={16}
                            />
                          </Box>
                        </Tooltip>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <RadioButton
                          label="All except a few products"
                          checked={formData.productSelectionType === "exclude"}
                          id="exclude"
                          name="productSelectionType"
                          disabled={isFlatDiscount}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              productSelectionType: "exclude",
                            })
                          }
                        />
                        <Tooltip content="This bundle will apply to all products in your store except the ones you select to exclude. Useful when you want to apply a bundle to most products but exclude specific ones.">
                          <Box
                            as="span"
                            className="cursor-help inline-flex items-center"
                          >
                            <Info
                              className="mt-1 text-gray-500"
                              size={16}
                            />
                          </Box>
                        </Tooltip>
                      </InlineStack>
                    </BlockStack>

                    {formData.productSelectionType === "global" &&
                      showGlobalBanner && (
                        <Banner
                          status="info"
                          onDismiss={() => setShowGlobalBanner(false)}
                        >
                          This bundle will automatically apply to all products and
                          variants in your store.
                        </Banner>
                      )}
                    {/* {(formData.productSelectionType === "include" || formData.productSelectionType === "exclude") && (
                <Banner status="info" onDismiss={() => { }}>
                  {formData.productSelectionType === "include"
                    ? "This bundle will only apply to the selected products."
                    : "This bundle will apply to all products except the ones you select."}
                </Banner>
              )} */}

                    {(formData.productSelectionType === "include" ||
                      formData.productSelectionType === "exclude") && (
                        <BlockStack gap="300">
                          {hasMainProductError ? (
                            <Banner tone="critical">
                              {formData.productSelectionType === "include"
                                ? 'Please select at least one product for "selected products only" bundles.'
                                : "Please select at least one product to exclude."}
                            </Banner>
                          ) : null}

                          {formData.mainProducts.length > 0 ? (
                            <Text variant="bodyMd" fontWeight="medium" as="h3">
                              {formData.productSelectionType === "include"
                                ? "Selected Products"
                                : "Excluded Products"}
                              {` (${formData.mainProducts.length} selected)`}
                            </Text>
                          ) : null}

                          {formData.mainProducts.length > 0 ? (
                            <BlockStack gap="200">
                              {formData.mainProducts.map((product, index) => (
                                <Card key={index}>
                                  <InlineStack
                                    gap="400"
                                    align="space-between"
                                    blockAlign="center"
                                  >
                                    <InlineStack gap="300" blockAlign="center">
                                      <Thumbnail
                                        source={product.image || ""}
                                        alt={product.productTitle}
                                        size="small"
                                      />
                                      <BlockStack gap="050">
                                        {product.productTitle &&
                                        product.productTitle !==
                                          `Product ${product.productId}` &&
                                        !product.productTitle.startsWith(
                                          "Product gid://",
                                        ) ? (
                                          <Tooltip content={product.productTitle}>
                                            <Text variant="bodyMd" fontWeight="medium" as="span">
                                              {truncateText(product.productTitle, 40)}
                                            </Text>
                                          </Tooltip>
                                        ) : (
                                          <Text variant="bodyMd" fontWeight="medium">
                                            {product.productId || "Loading..."}
                                          </Text>
                                        )}
                                        <Text variant="bodySm" tone="subdued">
                                          Applies to all variants
                                        </Text>
                                      </BlockStack>
                                    </InlineStack>
                                    <Button
                                      variant="plain"
                                      tone="critical"
                                      onClick={() => {
                                        const newProducts =
                                          formData.mainProducts.filter(
                                            (_, i) => i !== index,
                                          );
                                        setFormData({
                                          ...formData,
                                          mainProducts: newProducts,
                                          mainProductIds: newProducts.map(
                                            (p) => p.productId,
                                          ),
                                        });
                                      }}
                                      accessibilityLabel="Remove product"
                                    >
                                      <X size={16} />
                                    </Button>
                                  </InlineStack>
                                </Card>
                              ))}
                              {!isFlatDiscount ? (
                                <Button
                                  onClick={() => {
                                    setIsSelectingMainProduct(true);
                                    setShowMainProductModal(true);
                                  }}
                                  variant="secondary"
                                >
                                  + Add More Products
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setIsSelectingMainProduct(true);
                                    setShowMainProductModal(true);
                                  }}
                                  variant="secondary"
                                >
                                  Change Product
                                </Button>
                              )}
                            </BlockStack>
                          ) : (
                            <Button
                              onClick={() => {
                                setIsSelectingMainProduct(true);
                                setShowMainProductModal(true);
                              }}
                              fullWidth={isMobileLayout}
                            >
                              {isFlatDiscount ? "Select Product" : "Select Products"}
                            </Button>
                          )}
                        </BlockStack>
                      )}
                  </BlockStack>
                </Box>

              {/* Upsell Items Section - Only for Upselling Bundle Type (discounted shows after tiers) */}
              {formData.bundleType === "upselling" && (
                <Box ref={upsellSectionRef} paddingBlockStart="300">
                  <BlockStack gap="400">
                      <Text variant="headingMd" as="h2">
                        Upsell Items
                      </Text>

                      <BlockStack gap="300">
                        <Button
                          onClick={() => {
                            setEditingProductIndex(null);
                            setProductPickerMode("upsell");
                          }}
                        >
                          Select Products
                        </Button>
                      </BlockStack>

                      {hasUpsellError && (
                        <Banner tone="critical" onDismiss={() => { }}>
                          Select at least one upsell item
                        </Banner>
                      )}

                      {formData.upsellItems.length > 0 && (
                        <BlockStack gap="300">
                          {formData.upsellItems.map((item, index) => (
                            <Card key={index}>
                              <InlineStack
                                gap="400"
                                align="space-between"
                                blockAlign="center"
                                wrap
                              >
                                <InlineStack gap="300" blockAlign="center">
                                  <Thumbnail
                                    source={item.image || ""}
                                    alt={item.productTitle}
                                    size="small"
                                  />
                                  <BlockStack gap="050">
                                    <Text variant="bodyMd" fontWeight="medium">
                                      {item.productTitle}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued">
                                      {item.variantTitle}
                                    </Text>
                                  </BlockStack>
                                </InlineStack>

                                <InlineStack gap="300" blockAlign="center" wrap>
                                  <Box minWidth="80px">
                                    <TextField
                                      label="Qty"
                                      type="number"
                                      value={
                                        item.upsellQuantity?.toString() || "1"
                                      }
                                      onChange={(value) =>
                                        handleUpdateUpsellItem(
                                          index,
                                          "upsellQuantity",
                                          parseInt(value) || 1,
                                        )
                                      }
                                      min="1"
                                      autoComplete="off"
                                    />
                                  </Box>
                                  <Box minWidth="100px">
                                    <TextField
                                      label="Discount %"
                                      type="number"
                                      value={
                                        item.discountPercentage?.toString() ||
                                        "100"
                                      }
                                      onChange={(value) => {
                                        const numValue = parseFloat(value) || 100;
                                        const clampedValue = Math.min(
                                          100,
                                          Math.max(0, numValue),
                                        );
                                        handleUpdateUpsellItem(
                                          index,
                                          "discountPercentage",
                                          clampedValue,
                                        );
                                      }}
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      suffix="%"
                                      autoComplete="off"
                                    />
                                  </Box>

                                  <Button
                                    variant="plain"
                                    tone="critical"
                                    onClick={() => handleRemoveUpsellItem(index)}
                                    accessibilityLabel="Delete product"
                                  >
                                    <TrashIcon size={16} />
                                  </Button>
                                </InlineStack>
                              </InlineStack>
                            </Card>
                          ))}
                        </BlockStack>
                      )}
                  </BlockStack>
                </Box>
              )}

                </Box>
              </Card>

              {/* Quantity Discount Tiers Section - Only for Discounted Bundle Type */}
              {formData.bundleType === "discounted" && (
                    <Box ref={quantityTiersRef}>
                      <QuantityDiscountTiersSection
                        quantityDiscountTiers={formData.quantityDiscountTiers}
                        sectionHeader={formData.sectionHeader}
                        generalDiscountType={formData.generalDiscountType || "percentage"}
                        allowFlatDiscount={
                          isFlatDiscount || formData.mainProductIds.length === 1
                        }
                        productPrice={selectedProductPrice}
                        onAdd={addQuantityDiscountTier}
                        onRemove={removeQuantityDiscountTier}
                        onUpdate={updateQuantityDiscountTier}
                        onReorder={reorderQuantityDiscountTiers}
                        onSectionHeaderChange={(value) =>
                          setFormData({ ...formData, sectionHeader: value })
                        }
                        onDuplicate={(index) => {
                          const tier = {
                            ...formData.quantityDiscountTiers[index],
                          };
                          const newTier = {
                            ...tier,
                            quantity: (tier.quantity || 2) + 1,
                            title: `${tier.title || `Buy ${tier.quantity || 2}`} (Copy)`,
                            isMostPopular: false,
                            showMostPopular: false,
                          };
                          const newTiers = [...formData.quantityDiscountTiers];
                          newTiers.splice(index + 1, 0, newTier);
                          setFormData({
                            ...formData,
                            quantityDiscountTiers: newTiers,
                          });
                        }}
                      />
                    </Box>
              )}

            </BlockStack>
          </Box>

          {/* Right Column - Sticky Preview */}
          {formData.bundleType === "discounted" && (
            <Box
              minWidth="0"
              className={isMobileLayout ? "w-full order-2" : "flex-[0_0_40%] order-2 sticky top-0 overflow-y-auto"}
            >
              <BlockStack gap="500">
                {!isMobileLayout ? <Box className="mx-1">{renderPreview()}</Box> : null}

                {/* Appearance Settings */}
                <ColorAndStyleSection
                  styleSettings={formData.styleSettings}
                  onStyleChange={(settings) =>
                    setFormData({ ...formData, styleSettings: settings })
                  }
                />
              </BlockStack>
            </Box>
          )}
        </div>
      </form>

      {/* Main Products Selection Modal */}
      <ProductSelectionModal
        open={showMainProductModal}
        onClose={() => {
          setShowMainProductModal(false);
          setIsSelectingMainProduct(false);
        }}
        minSelectable={1}
        maxSelectable={isFlatDiscount ? 1 : 100}
        initialSelectedIds={formData.mainProductIds}
        onConfirm={handleMainProductConfirm}
      />

      {/* Product picker: upsell / free gift / FBT */}
      <ProductSelectionModal
        open={productPickerMode != null}
        onClose={closeProductPicker}
        minSelectable={1}
        maxSelectable={100}
        initialSelectedIds={[]}
        onConfirm={handleUpsellProductConfirm}
      />
    </Frame>
  );
}
