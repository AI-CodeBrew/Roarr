/**
 * Pure helpers for Brand DNA payload extraction and product payload shaping.
 *
 * Lives in its own module (no React component exports) so that
 * `BuildDnaScreen.jsx` can stay React-Fast-Refresh-friendly
 * (a file must export only components OR only non-components).
 */

/** All image URLs for a product, de-duplicated in stable order (matches payload shape). */
export function listProductImageUrls(product) {
  if (!product) return [];
  const imageUrlsFromEdges = Array.isArray(product?.images?.edges)
    ? product.images.edges.map((edge) => edge?.node?.url).filter(Boolean)
    : [];
  const imageUrlsFromArray = Array.isArray(product?.images)
    ? product.images
        .map((image) => (typeof image === "string" ? image : image?.src || image?.url))
        .filter(Boolean)
    : [];
  const featuredImageUrl = product?.featuredImage?.url;
  const merged = [
    ...(featuredImageUrl ? [featuredImageUrl] : []),
    ...imageUrlsFromEdges,
    ...imageUrlsFromArray,
  ].filter(Boolean);
  const seen = new Set();
  return merged.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export function buildProductsPayload(selectedProducts) {
  return selectedProducts.map((product) => {
    const images = listProductImageUrls(product);

    return {
      id: product?.id || null,
      title: product?.title || "",
      description:
        product?.description ||
        product?.descriptionHtml ||
        product?.body_html ||
        "",
      images,
    };
  });
}

/**
 * Rebuild `selectedProducts` state from persisted Brand DNA GET payload.
 * Mirrors the shape emitted by {@link buildProductsPayload} (`id`, `title`, `description`, string[] `images`).
 */
export function selectedProductsFromPersistedDnaApi(payload) {
  const raw = payload?.data?.products;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw.map((p) => {
    const imageStrings = [];
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === "string" && img.trim()) imageStrings.push(img.trim());
        else if (img && typeof img === "object") {
          const u = img.url || img.src;
          if (typeof u === "string" && u.trim()) imageStrings.push(u.trim());
        }
      }
    }
    const first = imageStrings[0];
    const title = typeof p.title === "string" ? p.title : "";
    return {
      id: p.id ?? null,
      title,
      description: typeof p.description === "string" ? p.description : "",
      featuredImage: first ? { url: first } : undefined,
      images: [...imageStrings],
    };
  });
}

/** Whether any hydrated product exposes at least one image URL (gallery / thumbnails). */
export function selectedProductsHaveImageUrls(products) {
  if (!Array.isArray(products) || products.length === 0) return false;
  return products.some((p) => listProductImageUrls(p).length > 0);
}

/**
 * Shape stored in the brand-ads flow session for campaign ideas / creatives APIs.
 * Maps UI state to the `dna` object expected by the Python brand_dna module.
 */
export function buildBrandDnaSessionPayload({
  brandName,
  shopDomain,
  primaryColors,
  accentColors,
  storefrontFonts,
  tagline,
  brandValues,
  brandAesthetics,
  toneChips,
  targetAudience,
  businessOverview,
}) {
  const toneList = Array.isArray(toneChips)
    ? toneChips.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
    : [];
  const overview =
    typeof businessOverview === "string" ? businessOverview.trim() : "";
  const fonts = Array.isArray(storefrontFonts)
    ? storefrontFonts.map((f) => (typeof f === "string" ? f.trim() : "")).filter(Boolean)
    : [];
  return {
    brand_name: typeof brandName === "string" ? brandName.trim() : "",
    shop_domain: typeof shopDomain === "string" ? shopDomain.trim() : "",
    primary_colors: Array.isArray(primaryColors) ? [...primaryColors] : [],
    accent_colors: Array.isArray(accentColors) ? [...accentColors] : [],
    storefront_fonts: fonts,
    fonts,
    tagline: typeof tagline === "string" ? tagline.trim() : "",
    brand_values: Array.isArray(brandValues) ? [...brandValues] : [],
    brand_aesthetic: Array.isArray(brandAesthetics) ? [...brandAesthetics] : [],
    tone_chips: toneList,
    tone_of_voice: toneList.length ? toneList.join(", ") : "professional",
    tone_description: "",
    target_audience: typeof targetAudience === "string" ? targetAudience.trim() : "",
    business_overview: overview,
    visual_description: overview.length ? overview.slice(0, 400) : "",
    key_messages: Array.isArray(brandValues) ? [...brandValues] : [],
    industry: "e-commerce",
  };
}

/**
 * Resolve the brand profile object from API JSON.
 * Create returns flat `data.brand_dna`; GET normalizes to `data.brand_dna.BrandDNAProfile`.
 */
function getBrandDnaProfileNode(payload) {
  const bd = payload?.data?.brand_dna;
  if (!bd || typeof bd !== "object") return null;
  if (
    Object.prototype.hasOwnProperty.call(bd, "BrandDNAProfile") &&
    bd.BrandDNAProfile != null &&
    typeof bd.BrandDNAProfile === "object"
  ) {
    return bd.BrandDNAProfile;
  }
  return bd;
}

/** `data.brand_dna` profile `brand_name` (flat or BrandDNAProfile-wrapped). */
export function getBrandNameFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.brand_name;
  return typeof raw === "string" ? raw.trim() : "";
}

/** `data.shop` (preferred) or hostname from `data.store_url`. */
export function getStoreDomainFromDnaResponse(payload) {
  const shop = payload?.data?.shop;
  if (typeof shop === "string" && shop.trim()) return shop.trim();
  const storeUrl = payload?.data?.store_url;
  if (typeof storeUrl === "string" && storeUrl.trim()) {
    try {
      const hostname = new URL(storeUrl).hostname;
      if (hostname) return hostname;
    } catch {
      /* fall through */
    }
    return storeUrl.replace(/^https?:\/\//i, "").split("/")[0].trim();
  }
  return "";
}

function dedupeColorStrings(colors) {
  const seen = new Set();
  return colors.filter((c) => {
    if (typeof c !== "string" || !c.trim()) return false;
    const key = c.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** `data.brand_dna` profile `primary_colors`. */
export function getPrimaryColorsFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.primary_colors;
  return Array.isArray(raw) ? dedupeColorStrings(raw) : [];
}

/** `data.brand_dna` profile `accent_colors`. */
export function getAccentColorsFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.accent_colors;
  return Array.isArray(raw) ? dedupeColorStrings(raw) : [];
}

/** Font family names from `storefront_signals.fonts`. */
export function getStorefrontFontsFromDnaResponse(payload) {
  const raw = payload?.data?.storefront_signals?.fonts;
  return Array.isArray(raw)
    ? raw.filter((f) => typeof f === "string" && f.trim()).map((f) => f.trim())
    : [];
}

/** `data.brand_dna` profile `tagline`. */
export function getTaglineFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.tagline;
  return typeof raw === "string" ? raw.trim() : "";
}

function stringListFromBrandProfile(payload, key) {
  const profile = getBrandDnaProfileNode(payload);
  const raw = profile?.[key];
  return Array.isArray(raw)
    ? raw.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
    : [];
}

/** `BrandDNAProfile.brand_values`. */
export function getBrandValuesFromDnaResponse(payload) {
  return stringListFromBrandProfile(payload, "brand_values");
}

/** `BrandDNAProfile.brand_aesthetic`. */
export function getBrandAestheticsFromDnaResponse(payload) {
  return stringListFromBrandProfile(payload, "brand_aesthetic");
}

/** `BrandDNAProfile.tone_chips`. */
export function getToneChipsFromDnaResponse(payload) {
  return stringListFromBrandProfile(payload, "tone_chips");
}

/** `BrandDNAProfile` or flat profile `target_audience`. */
export function getTargetAudienceFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.target_audience;
  return typeof raw === "string" ? raw.trim() : "";
}

/** `BrandDNAProfile` or flat profile `business_overview`. */
export function getBusinessOverviewFromDnaResponse(payload) {
  const raw = getBrandDnaProfileNode(payload)?.business_overview;
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Build the `dna` object for campaign / creative APIs from GET /api/brand-dna JSON.
 * @param {{ success?: boolean; data?: object } | null} apiJson — raw fetch JSON
 */
export function buildBrandDnaSessionPayloadFromApiResponse(apiJson) {
  if (!apiJson?.data || typeof apiJson.data !== "object") return null;
  const payload = { data: apiJson.data };
  return buildBrandDnaSessionPayload({
    brandName: getBrandNameFromDnaResponse(payload),
    shopDomain: getStoreDomainFromDnaResponse(payload),
    primaryColors: getPrimaryColorsFromDnaResponse(payload),
    accentColors: getAccentColorsFromDnaResponse(payload),
    storefrontFonts: getStorefrontFontsFromDnaResponse(payload),
    tagline: getTaglineFromDnaResponse(payload),
    brandValues: getBrandValuesFromDnaResponse(payload),
    brandAesthetics: getBrandAestheticsFromDnaResponse(payload),
    toneChips: getToneChipsFromDnaResponse(payload),
    targetAudience: getTargetAudienceFromDnaResponse(payload),
    businessOverview: getBusinessOverviewFromDnaResponse(payload),
  });
}

/**
 * Rebuild a catalog-shaped product for the brand-ads UI from a persisted campaign snapshot.
 */
export function campaignProductSnapshotToAnchorProduct(product) {
  if (!product || typeof product !== "object") return null;
  const rawImages = product.images;
  const imageStrings = [];
  if (Array.isArray(rawImages)) {
    for (const img of rawImages) {
      if (typeof img === "string" && img.trim()) imageStrings.push(img.trim());
      else if (img && typeof img === "object") {
        const u = img.url || img.src;
        if (typeof u === "string" && u.trim()) imageStrings.push(u.trim());
      }
    }
  }
  const first = imageStrings[0];
  const title = typeof product.title === "string" ? product.title : String(product.title || "");
  const description =
    typeof product.description === "string"
      ? product.description
      : String(product.description || "");
  return {
    id: product.id ?? null,
    title,
    description,
    featuredImage: first ? { url: first } : undefined,
    images: imageStrings.length ? imageStrings : [],
  };
}

/** Map persisted campaign ``idea`` to UI selected-idea shape. */
export function campaignIdeaSnapshotToSelectedIdea(idea) {
  if (!idea || typeof idea !== "object") {
    return { title: "", description: "", strategy: "" };
  }
  return {
    title: typeof idea.title === "string" ? idea.title : String(idea.title || ""),
    description:
      typeof idea.description === "string" ? idea.description : String(idea.description || ""),
    strategy:
      typeof idea.strategy === "string" ? idea.strategy : String(idea.strategy || ""),
  };
}
