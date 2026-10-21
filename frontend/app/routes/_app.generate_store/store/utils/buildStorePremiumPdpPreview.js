import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "../../../_app.generate_pdp/product-page/utils/productAiResponeMapping.js";
import { getDefaultColor, getDefaultMagicResponses } from "../../../_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import { generateTemplateConfig } from "../../../_app.generate_pdp/product-page/utils/productTemplatesConfig.js";

function _normalizeId(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.includes("/") ? s.split("/").pop() : s;
}

function _productIdAndHandle(shopifyProduct) {
  const rawId = shopifyProduct?.id != null ? String(shopifyProduct.id) : null;
  const productId =
    _normalizeId(shopifyProduct?.id) ||
    _normalizeId(shopifyProduct?.product_id) ||
    _normalizeId(shopifyProduct?.productId);
  const handle =
    shopifyProduct?.handle ||
    shopifyProduct?.productHandle ||
    shopifyProduct?.product_handle ||
    null;
  const title =
    shopifyProduct?.title != null ? String(shopifyProduct.title).trim().toLowerCase() : null;
  return { productId, handle, rawId, title };
}

function _entryIds(entry) {
  if (!entry || typeof entry !== "object") return [];
  return [entry.id, entry.product_id, entry.productId, entry.shopify_product_id]
    .map(_normalizeId)
    .filter(Boolean);
}

function _matchesProductEntry(entry, productId, handle, rawId = null, title = null) {
  if (!entry || typeof entry !== "object") return false;
  const ids = _entryIds(entry);
  if (productId && ids.includes(String(productId))) return true;
  if (rawId && ids.includes(_normalizeId(rawId))) return true;
  if (rawId && entry.id != null && String(entry.id) === String(rawId)) return true;
  if (handle && entry.handle && String(entry.handle) === String(handle)) return true;
  if (title) {
    const entryTitle = entry.title != null ? String(entry.title).trim().toLowerCase() : "";
    if (entryTitle && entryTitle === title) return true;
  }
  return false;
}

/**
 * Whether this Shopify product should use a COD premium PDP (vs simple default).
 * - COD single: always premium for the selected product
 * - COD multi: all featured selected products are premium PDPs
 */
export function productPageEntryMatchesShopifyProduct(entry, shopifyProduct) {
  const { productId, handle, rawId, title } = _productIdAndHandle(shopifyProduct);
  return _matchesProductEntry(entry, productId, handle, rawId, title);
}

/**
 * Whether this Shopify product should use a premium PDP (vs simple default).
 * - Single premium themes: always premium for the selected product
 * - Classic prepaid: not premium
 * - Multi: featured selected products are premium PDPs
 */
export function isCodPremiumProduct(
  storeGenerationData,
  shopifyProduct,
  marketType,
  storeType,
  selectedProducts = null,
) {
  if (storeType === "single" || storeType === "single_product") {
    const premiumIds =
      storeGenerationData?.premium_product_ids ||
      storeGenerationData?.premiumProductIds;
    if (Array.isArray(premiumIds)) return premiumIds.length > 0;
    // Legacy COD single without premium_product_ids list.
    return marketType === "cod";
  }
  if (!shopifyProduct) return false;

  const { productId, handle, rawId, title } = _productIdAndHandle(shopifyProduct);
  const pages = storeGenerationData?.product_pages;
  if (Array.isArray(pages) && pages.length > 0) {
    return pages.some((p) => _matchesProductEntry(p, productId, handle, rawId, title));
  }

  // Pre-generation / featured list: treat listed products as premium.
  if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
    return selectedProducts.some((p) => {
      const sel = _productIdAndHandle(p);
      if (productId && sel.productId && productId === sel.productId) return true;
      if (handle && sel.handle && handle === sel.handle) return true;
      return false;
    });
  }

  // COD multi with no explicit list: still premium for the product being previewed.
  return true;
}

function _payloadFromPage(page) {
  if (!page || typeof page !== "object") return null;
  return {
    text: page.text && typeof page.text === "object" ? page.text : {},
    images: page.images && typeof page.images === "object" ? page.images : {},
    selected_color: page.selected_color,
  };
}

/**
 * Pick the premium PDP payload for the product currently shown in preview.
 * Never returns another product's `product_page` when the current product does not match.
 */
export function resolveStoreProductPageData(
  storeGenerationData,
  shopifyProduct = null,
  featuredProducts = null,
) {
  if (!storeGenerationData || typeof storeGenerationData !== "object") return null;

  const pages = storeGenerationData.product_pages;
  if (Array.isArray(pages) && pages.length > 0) {
    const { productId, handle, rawId, title } = _productIdAndHandle(shopifyProduct);
    const match = pages.find((p) => _matchesProductEntry(p, productId, handle, rawId, title));
    if (match) return _payloadFromPage(match);

    // Generation order matches the featured product list when ids/handles were not stored.
    if (Array.isArray(featuredProducts) && featuredProducts.length > 0 && shopifyProduct) {
      const idx = featuredProducts.findIndex((p) =>
        productPageEntryMatchesShopifyProduct(
          { id: p?.id, handle: p?.handle, title: p?.title },
          shopifyProduct,
        ),
      );
      if (idx >= 0 && pages[idx]) return _payloadFromPage(pages[idx]);
    }

    if (productId || handle || title) return null;
    return _payloadFromPage(pages[0]);
  }

  const single = storeGenerationData.product_page;
  if (single && typeof single === "object") {
    if (!shopifyProduct) return _payloadFromPage(single);
    if (productPageEntryMatchesShopifyProduct(single, shopifyProduct)) {
      return _payloadFromPage(single);
    }
    // Single-product store: one premium PDP for the selected product.
    if (!Array.isArray(featuredProducts) || featuredProducts.length <= 1) {
      return _payloadFromPage(single);
    }
    return null;
  }
  return null;
}

function nestPageImages(pageImages) {
  if (!pageImages || typeof pageImages !== "object") {
    return { product_images: {}, body_images: {} };
  }
  const hasNested =
    (pageImages.product_images && typeof pageImages.product_images === "object") ||
    (pageImages.body_images && typeof pageImages.body_images === "object");
  if (hasNested) {
    return {
      product_images:
        pageImages.product_images && typeof pageImages.product_images === "object"
          ? { ...pageImages.product_images }
          : {},
      body_images:
        pageImages.body_images && typeof pageImages.body_images === "object"
          ? { ...pageImages.body_images }
          : {},
    };
  }
  const product_images = {};
  const body_images = {};
  for (const [key, value] of Object.entries(pageImages)) {
    if (value == null || value === "") continue;
    if (String(key).startsWith("product_image_")) product_images[key] = value;
    else if (key !== "selected_color") body_images[key] = value;
  }
  return { product_images, body_images };
}

function collectShopifyImageUrls(shopifyProduct) {
  if (!shopifyProduct) return [];
  const urls = [];
  const add = (u) => {
    if (typeof u !== "string" || !u.trim()) return;
    const url = u.trim();
    if (!urls.includes(url)) urls.push(url);
  };
  add(shopifyProduct.featuredImage?.url || shopifyProduct.featuredImage?.src);
  const edges = shopifyProduct.images?.edges;
  if (Array.isArray(edges)) {
    for (const edge of edges) add(edge?.node?.url || edge?.node?.src);
  }
  if (Array.isArray(shopifyProduct.images)) {
    for (const img of shopifyProduct.images) {
      add(typeof img === "string" ? img : img?.url || img?.src);
    }
  }
  if (Array.isArray(shopifyProduct.media)) {
    for (const m of shopifyProduct.media) add(m?.preview_image || m?.url);
  }
  return urls;
}

function isHttpUrl(value) {
  if (typeof value === "string") return /^https?:\/\//i.test(value.trim()) || value.trim().startsWith("//");
  if (value && typeof value === "object") {
    return isHttpUrl(value.src || value.url || value.value);
  }
  return false;
}

function hasGeneratedPdpPayload(productPageData) {
  if (!productPageData || typeof productPageData !== "object") return false;
  const text = productPageData.text;
  if (text && typeof text === "object" && Object.keys(text).length > 0) return true;
  const images = productPageData.images;
  if (images && typeof images === "object") {
    const nested = nestPageImages(images);
    return [...Object.values(nested.product_images), ...Object.values(nested.body_images)].some(
      isHttpUrl,
    );
  }
  return false;
}

/** Backend store generation always saves `{ text, images }` even when copy is sparse. */
function isStoreGenerationProductPagePayload(productPageData) {
  if (!productPageData || typeof productPageData !== "object" || Array.isArray(productPageData)) {
    return false;
  }
  return "text" in productPageData || "images" in productPageData;
}

function omitSectionsMissingMedia(templateRows, form) {
  const body = form?.images?.body_images || {};
  const hasBeforeAfter = isHttpUrl(body.before_use_image) && isHttpUrl(body.after_use_image);
  if (!Array.isArray(templateRows)) return templateRows;
  return templateRows
    .map((row) => {
      const items = Array.isArray(row) ? row : [row];
      const kept = items.filter((item) => {
        if (item?.template === "before-after" && !hasBeforeAfter) return false;
        return true;
      });
      return Array.isArray(row) ? kept : kept[0];
    })
    .filter((row) => (Array.isArray(row) ? row.length > 0 : Boolean(row)));
}

/**
 * Build PDP-shaped form + product mapping for COD premium product preview
 * (same category templates as Generate Product Page).
 */
export function buildStorePremiumPdpPreview({
  storeCategory = "general",
  productPageData = null,
  shopifyProduct = null,
  stylePreferences = null,
  selectedTemplate = 1,
}) {
  // Demo / template picker: category static PDP (lipstick, fashion, etc.), not the
  // merchant's Shopify photos. After store generation, always use premium layout +
  // selected product even when copy/images are partial.
  const useGeneratedLayout =
    hasGeneratedPdpPayload(productPageData) ||
    isStoreGenerationProductPagePayload(productPageData);

  if (!useGeneratedLayout) {
    const categoryDefaults =
      getDefaultMagicResponses(storeCategory, {
        template: selectedTemplate,
      }) || {};
    const hex =
      stylePreferences?.dynamicColor ||
      getDefaultColor(storeCategory, { template: selectedTemplate });
    const form = {
      ...DEFAULT_MAGIC_RESPONSE,
      ...categoryDefaults,
      text: { ...(categoryDefaults.text || {}) },
      images: {
        body_images: { ...(categoryDefaults.images?.body_images || {}) },
        product_images: { ...(categoryDefaults.images?.product_images || {}) },
      },
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
    const productData = aiResponseMapping(form);
    const templateRows = generateTemplateConfig(
      storeCategory,
      productData,
      selectedTemplate || 1,
      form,
    );
    return { form, productData, templateRows };
  }

  const pageText =
    productPageData?.text && typeof productPageData.text === "object"
      ? productPageData.text
      : productPageData && typeof productPageData === "object" && !productPageData.images
        ? productPageData
        : {};

  const hex =
    stylePreferences?.dynamicColor ||
    productPageData?.selected_color ||
    getDefaultColor(storeCategory);

  const pageImages =
    productPageData?.images && typeof productPageData.images === "object"
      ? productPageData.images
      : {};

  const nested = nestPageImages(pageImages);
  const shopifyUrls = collectShopifyImageUrls(shopifyProduct);

  const productImages = {};
  for (const [key, value] of Object.entries(nested.product_images)) {
    if (isHttpUrl(value)) productImages[key] = value;
  }
  shopifyUrls.forEach((url, i) => {
    const key = `product_image_${i + 1}`;
    if (!isHttpUrl(productImages[key])) productImages[key] = url;
  });

  const bodyImages = {};
  for (const [key, value] of Object.entries(nested.body_images)) {
    if (isHttpUrl(value)) bodyImages[key] = value;
  }

  const form = {
    ...DEFAULT_MAGIC_RESPONSE,
    text: {
      ...pageText,
      ...(shopifyProduct?.title
        ? { product_title: shopifyProduct.title }
        : {}),
    },
    images: {
      body_images: bodyImages,
      product_images: productImages,
    },
    selected_color: hex || undefined,
    color_schemes: hex ? [hex] : [],
  };

  const productData = aiResponseMapping(form);
  const templateRows = omitSectionsMissingMedia(
    generateTemplateConfig(
      storeCategory,
      productData,
      selectedTemplate || 1,
      form,
    ),
    form,
  );

  return { form, productData, templateRows };
}
