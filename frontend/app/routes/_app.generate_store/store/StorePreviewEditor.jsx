import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router";
import { ActionList, BlockStack, Button, Icon, InlineStack, Page, Popover, Text } from "@shopify/polaris";
import {
  DesktopIcon,
  DragDropIcon,
  MobileIcon,
  HomeIcon,
  ProductIcon,
  CollectionIcon,
  AlertDiamondIcon,
  BlogIcon,
  ProfileIcon,
  PhoneIcon,
  QuestionCircleIcon,
  ChevronDownIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import LiquidPagePreview from "../../../components/theme-preview-editor/LiquidPagePreview.jsx";
import LiquidPreviewRender from "../../../components/theme-preview-editor/LiquidPreviewRender.jsx";
import LiquidPreviewSettingsPanel from "../../../components/theme-preview-editor/LiquidPreviewSettingsPanel.jsx";
import { buildLiquidPageTemplatesConfig } from "./utils/storeTemplatesConfiq.js";
import { resolveStoreProductPageData, buildStorePremiumPdpPreview, productPageEntryMatchesShopifyProduct } from "./utils/buildStorePremiumPdpPreview.js";
import { getCategoryTemplate1Defaults } from "../../../lib/categoryHomeDefaults.js";
import {
  HOME_SINGLE_TEMPLATE_SCHEMAS,
  HOME_MULTI_TEMPLATE_SCHEMAS,
  HOME_CINEMATIC_TEMPLATE_SCHEMAS,
  HOME_AMOUR_TEMPLATE_SCHEMAS,
} from "./utils/editor-schema/index.js";
import { useViewportBelowMd } from "../../../hooks/useViewportBelowMd.js";
import MobilePreviewReadonlyBanner from "../../../components/theme-preview-editor/MobilePreviewReadonlyBanner.jsx";
import PreviewZoomControls, {
  DEFAULT_PREVIEW_ZOOM,
} from "../../../components/theme-preview-editor/PreviewZoomControls.jsx";
import { fingerprintPageContent, LIQUID_PREVIEW_LAYOUT_REV } from "../../../lib/liquidPreviewCache.js";
import {
  getSectionColorsMap,
  normalizeHexColor,
  normalizeSectionColorEntry,
  resolveHomeSectionKey,
  getDefaultSchemeFieldValues,
  getSectionColorSchemeSlots,
  getSchemeFieldsForSection,
} from "./utils/sectionColorUtils.js";

/** Mirrors StoreFlow category palettes for theme color swatches in the left panel. */
const CATEGORY_COLOR_PALETTES = {
  car_accessories: ["#B5C6D4", "#2563EB", "#64748B", "#0F172A"],
  fashion: ["#BCA38F", "#3B0764", "#EC4899", "#7C3AED"],
  health_beauty: ["#E2B4B3", "#10B981", "#14B8A6", "#059669"],
  kids_toys: ["#E5AD3A", "#EA580C", "#84CC16", "#026326"],
  home_kitchen: ["#C5D5CB", "#A855F7", "#6366F1", "#4F46E5"],
  general: ["#D1CBE0", "#2563EB", "#64748B", "#1F2937"],
};

/** Same mapping as StoreFlow preview bar (Popover + ActionList). */
const TEMPLATE_VIEW_ICONS = {
  Home: HomeIcon,
  "Home Page": HomeIcon,
  Product: ProductIcon,
  Collections: CollectionIcon,
  "404": AlertDiamondIcon,
  FAQs: QuestionCircleIcon,
  Contact: PhoneIcon,
  "About Us": ProfileIcon,
};

function getTemplateViewIcon(view) {
  return TEMPLATE_VIEW_ICONS[view] ?? null;
}

function viewToLiquidPageType(view) {
  switch (view) {
    case "Home":
    case "Home Page":
      return "home-page";
    case "Collections":
      return "collection";
    case "Product":
      return "product-page";
    case "Contact":
      return "contact-page";
    case "FAQs":
      return "faq-page";
    case "404":
      return "not-found-page";
    case "About Us":
      return "about-page";
    default:
      return "home-page";
  }
}

function normalizeProductPagePayload(raw) {
  if (!raw || typeof raw !== "object") {
    return { text: {}, images: {} };
  }
  const text =
    raw.text && typeof raw.text === "object" && !Array.isArray(raw.text)
      ? { ...raw.text }
      : {};
  const images =
    raw.images && typeof raw.images === "object" && !Array.isArray(raw.images)
      ? { ...raw.images }
      : {};
  return { ...raw, text, images };
}

function setNestedValue(obj, path, value) {
  const parts = String(path).split(".");
  const next = JSON.parse(JSON.stringify(obj || {}));
  let target = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in target) || typeof target[p] !== "object" || target[p] === null) {
      target[p] = {};
    }
    target = target[p];
  }
  target[parts[parts.length - 1]] = value;
  return next;
}

function normalizeHomePageData(raw) {
  if (!raw || typeof raw !== "object") {
    return { text: {}, images: {}, section_colors: {} };
  }
  const text =
    raw.text && typeof raw.text === "object" && !Array.isArray(raw.text)
      ? { ...raw.text }
      : {};
  const images =
    raw.images && typeof raw.images === "object" && !Array.isArray(raw.images)
      ? { ...raw.images }
      : {};
  const section_colors =
    raw.section_colors &&
    typeof raw.section_colors === "object" &&
    !Array.isArray(raw.section_colors)
      ? { ...raw.section_colors }
      : {};
  return { text, images, section_colors };
}

function normalizeStylePreferences(sp) {
  return {
    dynamicColor: sp?.dynamicColor ?? "#2563EB",
    headingFont: sp?.headingFont ?? "Poppins",
    bodyFont: sp?.bodyFont ?? "Inter",
    sectionColors:
      sp?.sectionColors && typeof sp.sectionColors === "object"
        ? { ...sp.sectionColors }
        : {},
  };
}

/** Lightweight fingerprint so home preview cache invalidates on edits without stringify of huge rows. */
function fingerprintHomeData(homeData) {
  return fingerprintPageContent(homeData);
}

function buildStylePreferencesKey(stylePreferences) {
  if (!stylePreferences) return "";
  const sectionPart =
    stylePreferences.sectionColors &&
    typeof stylePreferences.sectionColors === "object"
      ? JSON.stringify(stylePreferences.sectionColors)
      : "";
  return [
    stylePreferences.dynamicColor || "",
    stylePreferences.headingFont || "",
    stylePreferences.bodyFont || "",
    sectionPart,
  ].join("|");
}

const STORE_PREVIEW_SAVE_BAR_ID = "store-preview-contextual-save-bar";

/**
 * Full-width liquid home preview with the same shell as {@link ProductPreviewEditor}:
 * toolbar (device + select mode), left settings panel, scaled iframe preview, optional right editor.
 * Used after entire-store generation completes so merchants can review the home page visually.
 */
export default function StorePreviewEditor({
  homePageData = null,
  productPageData = null,
  /** COD multi: per-product premium PDP payloads (`generation_data.product_pages`). */
  productPages = null,
  /** @type {"cod"|"prepaid"|null} */
  marketType = null,
  /** @type {"classic"|"cinematic"|string|null} */
  storeTemplatePack = "classic",
  storeCategory = "general",
  storeType = "single",
  /** From `generation_data.mode` (`single_product` | `multi_product`). Overrides `storeType` for template/schemas when set. */
  generationMode = null,
  stylePreferences: stylePreferencesProp = null,
  onStylePreferencesChange,
  onHomePageDataChange,
  productImages = [],
  title = "Home page preview",
  liquidPreviewType = "entire-store",
  /** Pixel string (e.g. `"800px"`). If omitted, uses current `window.innerHeight` (updates on resize). */
  minHeight: minHeightProp,
  showSave = true,
  onSave,
  saveLabel = "Save changes",
  /** When set, shows a Publish button next to Save; calls `/api/publish-store` via parent (entire-store flow). */
  onPublish = null,
  publishLoading = false,
  /** If set, Publish opens the parent publish flow (e.g. {@link StorePublishStep}) instead of calling `onPublish` directly. */
  onPublishNavigate = null,
  /** When true (store already live), secondary action is Preview in Shopify admin theme editor instead of Publish. */
  storePagePublished = false,
  /** Full URL: `https://admin.shopify.com/store/{slug}/themes/{theme_id}/editor` from parent (pages context + shop). */
  shopifyThemeEditorUrl = "",
  /** Same list as StoreFlow `primaryViews` (Home + optional Product/Collections + more). */
  previewViews = ["Home"],
  /** Dashboard products for collection preview fallback when multi list is empty. */
  collectionProductsFallback = [],
  multiProductsForStore = [],
  /** COD multi: products that should use premium PDPs (subset; empty = all simple). */
  codPremiumProductsForStore = null,
  selectedSingleProduct = null,
  selectedProductForPreview = null,
  onSelectedProductForPreviewChange,
  /** Product page liquid template (1 | 2). Fashion uses `product.kluck-fashion-1` (1) or `product.kluck-fashion-2` (2) section JSON in the Liquid preview. */
  selectedProductTemplate = 1,
  /** When set, {@link Page} wraps the workspace and toolbar controls render in `secondaryActions`. */
  pageChrome,
}) {
  const shopify = useAppBridge();
  const isReadonlyMobileLayout = useViewportBelowMd();
  const [templatePreviewView, setTemplatePreviewView] = useState(() => {
    if (!Array.isArray(previewViews) || previewViews.length === 0) return "Home";
    if (previewViews.includes("Home")) return "Home";
    if (previewViews.includes("Home Page")) return "Home Page";
    return previewViews[0];
  });
  const [isTemplateViewPopoverOpen, setIsTemplateViewPopoverOpen] = useState(false);
  const [templateViewPillHovered, setTemplateViewPillHovered] = useState(false);

  useEffect(() => {
    if (!Array.isArray(previewViews) || previewViews.length === 0) return;
    if (!previewViews.includes(templatePreviewView)) {
      setTemplatePreviewView(previewViews[0]);
    }
  }, [previewViews, templatePreviewView]);

  const isHomeView =
    templatePreviewView === "Home" || templatePreviewView === "Home Page";

  useEffect(() => {
    if (templatePreviewView !== "Product" || !onSelectedProductForPreviewChange) return;
    if (storeType === "single") {
      onSelectedProductForPreviewChange(selectedSingleProduct);
      return;
    }
    // Multi: only seed the first product when nothing is selected yet
    // (so Product-tab switches between the 3 COD premium PDPs stick).
    if (!selectedProductForPreview) {
      onSelectedProductForPreviewChange(multiProductsForStore[0] ?? null);
    }
  }, [
    templatePreviewView,
    storeType,
    selectedSingleProduct,
    multiProductsForStore,
    selectedProductForPreview,
    onSelectedProductForPreviewChange,
  ]);

  const [selectedSection, setSelectedSection] = useState(null);
  const [productTemplateSchemas, setProductTemplateSchemas] = useState({});
  const [sectionOverrides, setSectionOverrides] = useState({});
  const [previewMode, setPreviewMode] = useState("desktop");
  const [previewZoomScale, setPreviewZoomScale] = useState(DEFAULT_PREVIEW_ZOOM);
  const [isPreviewModeSwitching, setIsPreviewModeSwitching] = useState(false);
  const [isContextualSaving, setIsContextualSaving] = useState(false);
  const [selectorMode, setSelectorMode] = useState(true);
  const [leftExpandedOpen, setLeftExpandedOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const contextualSaveButtonRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 0, height: 0 });
  const [viewportHeightPx, setViewportHeightPx] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 700,
  );

  useEffect(() => {
    const update = () => setViewportHeightPx(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const minHeight =
    minHeightProp != null && minHeightProp !== ""
      ? minHeightProp
      : `${Math.max(viewportHeightPx - 80, 400)}px`;

  const [localHomeData, setLocalHomeData] = useState(() => normalizeHomePageData(homePageData));
  const [localStyle, setLocalStyle] = useState(() => normalizeStylePreferences(stylePreferencesProp));
  const [localProductPage, setLocalProductPage] = useState(() =>
    normalizeProductPagePayload(productPageData),
  );
  const [localProductPages, setLocalProductPages] = useState(() =>
    Array.isArray(productPages) ? productPages : [],
  );

  /** Style prefs for liquid preview — include per-section accents from home_page. */
  const previewStylePreferences = useMemo(
    () => ({
      ...localStyle,
      sectionColors: getSectionColorsMap(localHomeData),
    }),
    [localStyle, localHomeData],
  );

  /** Last saved / last synced-from-props snapshot — Save stays disabled while this matches local home + style. */
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    home: JSON.stringify(normalizeHomePageData(homePageData)),
    style: JSON.stringify(normalizeStylePreferences(stylePreferencesProp)),
    productPage: JSON.stringify(normalizeProductPagePayload(productPageData)),
    productPages: JSON.stringify(Array.isArray(productPages) ? productPages : []),
  }));

  // Sync only when *content* changes — `homePageData` prop ref often churns from parent re-renders.
  const homePageDataSerialized = JSON.stringify(homePageData ?? null);
  useEffect(() => {
    const normalized = normalizeHomePageData(homePageData);
    setLocalHomeData(normalized);
    setSavedSnapshot((prev) => ({ ...prev, home: JSON.stringify(normalized) }));
  }, [homePageDataSerialized]);

  const productPageDataSerialized = JSON.stringify(productPageData ?? null);
  const productPagesSerialized = JSON.stringify(productPages ?? null);
  useEffect(() => {
    const normalized = normalizeProductPagePayload(productPageData);
    setLocalProductPage(normalized);
    setSavedSnapshot((prev) => ({ ...prev, productPage: JSON.stringify(normalized) }));
  }, [productPageDataSerialized]);
  useEffect(() => {
    const next = Array.isArray(productPages) ? productPages : [];
    setLocalProductPages(next);
    setSavedSnapshot((prev) => ({ ...prev, productPages: JSON.stringify(next) }));
  }, [productPagesSerialized]);

  useEffect(() => {
    const s = normalizeStylePreferences(stylePreferencesProp);
    setLocalStyle(s);
    setSavedSnapshot((prev) => ({ ...prev, style: JSON.stringify(s) }));
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type !== "SELECT_SECTION") return;
      const sectionId = event.data.sectionId;
      if (sectionId) {
        setSelectedSection(sectionId);
        setLeftExpandedOpen(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("../../_app.generate_pdp/product-page/utils/editor-schema/index.js")
      .then((mod) => {
        if (cancelled) return;
        setProductTemplateSchemas(mod.TEMPLATE_SCHEMAS || {});
      })
      .catch(() => {
        if (cancelled) return;
        setProductTemplateSchemas({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.round(width);
      const h = Math.round(height);
      setPreviewContainerSize((prev) => {
        if (prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setIsPreviewModeSwitching(true);
    const timer = setTimeout(() => setIsPreviewModeSwitching(false), 180);
    return () => clearTimeout(timer);
  }, [previewMode]);

  const categoryDefaults = useMemo(() => {
    try {
      return getCategoryTemplate1Defaults(storeCategory);
    } catch {
      return null;
    }
  }, [storeCategory]);

  const colorPalette = useMemo(
    () => CATEGORY_COLOR_PALETTES[storeCategory] ?? CATEGORY_COLOR_PALETTES.general,
    [storeCategory],
  );

  const isMultiProductHome = useMemo(() => {
    if (generationMode === "multi_product") return true;
    if (generationMode === "single_product") return false;
    return storeType === "multi";
  }, [generationMode, storeType]);

  /** First 3 Shopify dashboard products for `pf-product-grid1x1` home preview. */
  const homeGridProductsForPreview = useMemo(() => {
    if (!isMultiProductHome) return null;
    if (multiProductsForStore.length > 0) return multiProductsForStore.slice(0, 3);
    if (Array.isArray(collectionProductsFallback) && collectionProductsFallback.length > 0) {
      return collectionProductsFallback.slice(0, 3);
    }
    return null;
  }, [isMultiProductHome, multiProductsForStore, collectionProductsFallback]);

  const templateSchemas = useMemo(
    () => ({
      ...(isMultiProductHome
        ? HOME_MULTI_TEMPLATE_SCHEMAS
        : String(storeTemplatePack || "").toLowerCase() === "cinematic"
          ? HOME_CINEMATIC_TEMPLATE_SCHEMAS
          : String(storeTemplatePack || "").toLowerCase() === "amour"
            ? HOME_AMOUR_TEMPLATE_SCHEMAS
            : HOME_SINGLE_TEMPLATE_SCHEMAS),
      ...productTemplateSchemas,
    }),
    [productTemplateSchemas, isMultiProductHome, storeTemplatePack],
  );

  const templatesConfig = useMemo(
    () =>
      buildLiquidPageTemplatesConfig({
        productType: isMultiProductHome ? "multi-product" : "single-product",
        pageType: "home-page",
        // Always use the merchant-selected product after generation. Demo checkout
        // product is only for theme-picker demos (StoreFlowStructure demoHomeOnly).
        productData: isMultiProductHome
          ? null
          : selectedSingleProduct || selectedProductForPreview || null,
        collectionProducts: homeGridProductsForPreview,
        detectedCategory: storeCategory,
        selectedTemplate: 1,
        form: {},
        stylePreferences: previewStylePreferences,
        categoryDefaults: isMultiProductHome ? categoryDefaults : null,
        homeData: localHomeData,
        marketType,
        storeTemplatePack,
        omitCheckoutBlocks:
          !isMultiProductHome &&
          (marketType === "cod" ||
            selectedProductTemplate === 1 ||
            selectedProductTemplate === 2),
      }),
    [
      isMultiProductHome,
      selectedSingleProduct,
      selectedProductForPreview,
      storeCategory,
      localStyle,
      localHomeData,
      categoryDefaults,
      homeGridProductsForPreview,
      marketType,
      storeTemplatePack,
      previewStylePreferences,
      selectedProductTemplate,
    ],
  );

  /** Cinematic home is self-styled — skip ~455KB classic entire-store CSS/JS. */
  const homeLiquidPreviewType = useMemo(() => {
    if (
      String(storeTemplatePack || "").toLowerCase() === "cinematic" &&
      !isMultiProductHome
    ) {
      return "cinematic-home";
    }
    return liquidPreviewType;
  }, [storeTemplatePack, isMultiProductHome, liquidPreviewType]);

  const homePreviewCacheKey = useMemo(
    () =>
      [
        LIQUID_PREVIEW_LAYOUT_REV,
        "store-home",
        homeLiquidPreviewType,
        storeCategory || "general",
        marketType || "",
        String(storeTemplatePack || "classic"),
        buildStylePreferencesKey(previewStylePreferences),
        fingerprintHomeData(localHomeData),
      ].join("::"),
    [homeLiquidPreviewType, storeCategory, marketType, storeTemplatePack, previewStylePreferences, localHomeData],
  );

  /** Merged form for theme colors + home `text` / `images` (same shape as magic response). */
  const form = useMemo(
    () => ({
      ...localHomeData,
      color_schemes: colorPalette,
      selected_color: localStyle.dynamicColor,
      headingFont: localStyle.headingFont,
      bodyFont: localStyle.bodyFont,
    }),
    [localHomeData, colorPalette, localStyle.dynamicColor, localStyle.headingFont, localStyle.bodyFont],
  );

  const isDirty = useMemo(() => {
    const home = JSON.stringify(localHomeData);
    const style = JSON.stringify(localStyle);
    const productPage = JSON.stringify(localProductPage);
    const pages = JSON.stringify(localProductPages);
    return (
      home !== savedSnapshot.home ||
      style !== savedSnapshot.style ||
      productPage !== savedSnapshot.productPage ||
      pages !== savedSnapshot.productPages
    );
  }, [localHomeData, localStyle, localProductPage, localProductPages, savedSnapshot]);
  const shouldBlockNavigation = (isDirty || isContextualSaving) && showSave;
  const navigationBlocker = useBlocker(shouldBlockNavigation);
  const promptContextualSaveBar = useCallback(() => {
    const saveBar = shopify?.saveBar;
    if (saveBar?.leaveConfirmation) {
      void saveBar.leaveConfirmation().catch(() => { });
      return;
    }
    void saveBar?.show?.(STORE_PREVIEW_SAVE_BAR_ID)?.catch?.(() => { });
  }, [shopify]);

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") return;
    promptContextualSaveBar();
    navigationBlocker.reset();
  }, [navigationBlocker, promptContextualSaveBar]);

  useEffect(() => {
    if (!shouldBlockNavigation) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlockNavigation]);

  useEffect(() => {
    const buttonEl = contextualSaveButtonRef.current;
    if (!buttonEl) return;
    if (isContextualSaving) {
      buttonEl.setAttribute("loading", "");
      buttonEl.setAttribute("aria-busy", "true");
      return;
    }
    buttonEl.removeAttribute("loading");
    buttonEl.removeAttribute("aria-busy");
  }, [isContextualSaving]);

  useEffect(() => {
    if (!shopify?.saveBar || !showSave) return;
    if (isDirty || isContextualSaving) {
      shopify.saveBar.show(STORE_PREVIEW_SAVE_BAR_ID);
    } else {
      shopify.saveBar.hide(STORE_PREVIEW_SAVE_BAR_ID);
    }
  }, [isDirty, isContextualSaving, showSave, shopify]);

  useEffect(() => {
    return () => {
      shopify?.saveBar?.hide(STORE_PREVIEW_SAVE_BAR_ID);
    };
  }, [shopify]);

  const updateField = useCallback(
    (key, value) => {
      if (key === "selected_color") {
        setLocalStyle((prev) => {
          const next = { ...prev, dynamicColor: value };
          onStylePreferencesChange?.(next);
          return next;
        });
        return;
      }
      if (key === "headingFont" || key === "bodyFont") {
        setLocalStyle((prev) => {
          const next = { ...prev, [key]: value };
          onStylePreferencesChange?.(next);
          return next;
        });
        return;
      }
      if (!key.includes(".")) {
        if (!isHomeView) {
          setLocalProductPage((prev) => ({ ...prev, [key]: value }));
        }
        return;
      }
      const parts = key.split(".");
      const root = parts[0];
      if (root !== "text" && root !== "images") {
        return;
      }
      if (!isHomeView) {
        const matchProduct = selectedProductForPreview || selectedSingleProduct;
        setLocalProductPage((prev) => setNestedValue(normalizeProductPagePayload(prev), key, value));
        setLocalProductPages((pages) => {
          if (!Array.isArray(pages) || pages.length === 0) return pages;
          return pages.map((p) => {
            if (!productPageEntryMatchesShopifyProduct(p, matchProduct)) return p;
            const next = setNestedValue(normalizeProductPagePayload(p), key, value);
            return { ...p, text: next.text, images: next.images };
          });
        });
        return;
      }
      setLocalHomeData((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        let target = next;
        for (let i = 0; i < parts.length - 1; i++) {
          const p = parts[i];
          if (!(p in target) || typeof target[p] !== "object" || target[p] === null) {
            target[p] = {};
          }
          target = target[p];
        }
        target[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [onStylePreferencesChange, isHomeView, selectedProductForPreview, selectedSingleProduct],
  );

  const handleSectionOverrideChange = useCallback((template, overrides) => {
    setSectionOverrides((prev) => ({ ...prev, [template]: overrides }));
  }, []);

  const handleSectionColorChange = useCallback((sectionId, color, meta = {}) => {
    const sectionKey = resolveHomeSectionKey(sectionId);
    const hex = normalizeHexColor(color);
    if (!sectionKey || !hex) return;

    // Support legacy string role ("background"|"button"|"text") and Shopify { slot, field }
    let slotKey = "color_scheme";
    let fieldKey = "primary_button_background";
    if (typeof meta === "string") {
      if (meta === "background") fieldKey = "background";
      else if (meta === "text") fieldKey = "foreground";
      else fieldKey = "primary_button_background";
    } else if (meta && typeof meta === "object") {
      if (typeof meta.slot === "string" && meta.slot) slotKey = meta.slot;
      if (typeof meta.field === "string" && meta.field) fieldKey = meta.field;
    }

    const validFields = new Set([
      "background",
      "foreground_heading",
      "foreground",
      "primary_button_background",
      "primary_button_text",
      "secondary_button_background",
      "secondary_button_text",
    ]);
    if (!validFields.has(fieldKey)) fieldKey = "primary_button_background";

    const slots = getSectionColorSchemeSlots(sectionKey);
    if (!slots.some((s) => s.key === slotKey)) {
      slotKey = slots[0]?.key || "color_scheme";
    }
    const slotMeta = slots.find((s) => s.key === slotKey);
    const globalAccent =
      normalizeHexColor(localStyle?.dynamicColor) || "#BCA38F";
    const defaults = getDefaultSchemeFieldValues(
      slotMeta?.defaultScheme || "scheme-1",
      globalAccent,
    );
    const allowedFields = getSchemeFieldsForSection(sectionKey, slotKey).map(
      (f) => f.key,
    );
    const allowedSet = new Set(allowedFields);
    if (!allowedSet.has(fieldKey) && allowedFields[0]) {
      fieldKey = allowedFields[0];
    }

    setLocalHomeData((prev) => {
      const prevMap =
        prev?.section_colors && typeof prev.section_colors === "object"
          ? prev.section_colors
          : {};
      const existing = normalizeSectionColorEntry(prevMap[sectionKey]);
      const prevSlot = existing[slotKey] || {};
      // Seed only fields this section actually uses
      const seeded = {};
      for (const key of allowedFields) {
        seeded[key] = prevSlot[key] || defaults[key];
      }
      seeded[fieldKey] = hex;
      return {
        ...prev,
        section_colors: {
          ...prevMap,
          [sectionKey]: {
            ...existing,
            [slotKey]: seeded,
          },
        },
      };
    });
  }, [localStyle?.dynamicColor]);

  const persistHome = useCallback(async () => {
    const home = localHomeData;
    const style = localStyle;
    const productPage = localProductPage;
    const pages = localProductPages;
    onHomePageDataChange?.(home);
    onStylePreferencesChange?.(style);
    const maybePromise = onSave?.({
      homeData: home,
      stylePreferences: style,
      productPageData: productPage,
      productPages: pages,
    });
    if (maybePromise && typeof maybePromise.then === "function") {
      await maybePromise;
    }
    setSavedSnapshot({
      home: JSON.stringify(home),
      style: JSON.stringify(style),
      productPage: JSON.stringify(productPage),
      productPages: JSON.stringify(pages),
    });
  }, [
    localHomeData,
    localStyle,
    localProductPage,
    localProductPages,
    onHomePageDataChange,
    onStylePreferencesChange,
    onSave,
  ]);

  const handleContextualSave = useCallback(async () => {
    if (!isDirty) return;
    setIsContextualSaving(true);
    const buttonEl = contextualSaveButtonRef.current;
    if (buttonEl) {
      buttonEl.setAttribute("loading", "");
      buttonEl.setAttribute("aria-busy", "true");
    }
    try {
      await persistHome();
    } finally {
      setIsContextualSaving(false);
    }
  }, [isDirty, persistHome]);

  const handleContextualDiscard = useCallback(() => {
    shopify?.saveBar?.hide(STORE_PREVIEW_SAVE_BAR_ID);
    let home;
    let style;
    let productPage;
    let pages;
    try {
      home = JSON.parse(savedSnapshot.home);
      style = JSON.parse(savedSnapshot.style);
      productPage = JSON.parse(savedSnapshot.productPage || "{}");
      pages = JSON.parse(savedSnapshot.productPages || "[]");
    } catch {
      home = normalizeHomePageData(null);
      style = normalizeStylePreferences(null);
      productPage = normalizeProductPagePayload(null);
      pages = [];
    }
    setLocalHomeData(home);
    setLocalStyle(style);
    setLocalProductPage(productPage);
    setLocalProductPages(Array.isArray(pages) ? pages : []);
    onHomePageDataChange?.(home);
    onStylePreferencesChange?.(style);
  }, [shopify, savedSnapshot, onHomePageDataChange, onStylePreferencesChange]);

  const handlePublishClick = useCallback(() => {
    const snapshot = {
      homeData: localHomeData,
      stylePreferences: localStyle,
      productPageData: localProductPage,
      productPages: localProductPages,
    };
    if (onPublishNavigate) {
      onPublishNavigate(snapshot);
      return;
    }
    if (onPublish) {
      void onPublish(snapshot);
    }
  }, [onPublish, onPublishNavigate, localHomeData, localStyle, localProductPage, localProductPages]);

  const handleOpenShopifyThemeEditor = useCallback(() => {
    const url = typeof shopifyThemeEditorUrl === "string" ? shopifyThemeEditorUrl.trim() : "";
    if (!url) {
      shopify?.toast?.show("Theme preview is not available (missing shop or theme).", {
        isError: true,
        duration: 4000,
      });
      return;
    }
    window.open(url);
  }, [shopify, shopifyThemeEditorUrl]);

  const showPublishSecondary =
    !storePagePublished && Boolean(onPublish || onPublishNavigate);
  const showThemeEditorPreview = storePagePublished;

  // Primitive keys so `useMemo` does not invalidate when parent passes a new `products` array reference every render (context).
  const multiProductIdsKey = multiProductsForStore.map((p) => p?.id ?? "").join("|");
  const collectionFallbackIdsKey =
    Array.isArray(collectionProductsFallback) && collectionProductsFallback.length > 0
      ? collectionProductsFallback
        .slice(0, 12)
        .map((p) => p?.id ?? "")
        .join("|")
      : "";

  /** Multi product switcher: only the 3 selected featured products (COD = premium PDPs). */
  const productSwitcherList = useMemo(
    () => multiProductsForStore,
    [multiProductIdsKey],
  );

  const productSwitcherIdsKey = productSwitcherList.map((p) => p?.id ?? "").join("|");

  const previewChromeHeaderContent = useMemo(() => {
    if (previewViews.length <= 1) {
      return <span className="text-black font-medium text-sm">{title}</span>;
    }
    return (
      <Popover
        active={isTemplateViewPopoverOpen}
        onClose={() => setIsTemplateViewPopoverOpen(false)}
        activator={
          <button
            type="button"
            onClick={() => setIsTemplateViewPopoverOpen((o) => !o)}
            onMouseEnter={() => setTemplateViewPillHovered(true)}
            onMouseLeave={() => setTemplateViewPillHovered(false)}
            className="inline-flex items-center justify-center gap-1 rounded-lg py-1 px-2.5 border-0 bg-white hover:bg-[#f5f5f5] cursor-pointer"
          >
            {getTemplateViewIcon(templatePreviewView) ? (
              <Icon source={getTemplateViewIcon(templatePreviewView)} tone="base" />
            ) : null}
            <span className="text-[13px] text-gray-900">{templatePreviewView}</span>
            <span
              className="inline-flex shrink-0 items-center"
              style={{ visibility: templateViewPillHovered ? "visible" : "hidden" }}
            >
              <Icon source={ChevronDownIcon} tone="subdued" />
            </span>
          </button>
        }
      >
        <ActionList
          sections={[
            {
              items: previewViews.map((view) => ({
                content: view,
                icon: getTemplateViewIcon(view),
                active: templatePreviewView === view,
                onAction: () => {
                  setTemplatePreviewView(view);
                  setIsTemplateViewPopoverOpen(false);
                },
              })),
            },
            ...(storeType === "multi" &&
            productSwitcherList.length > 1 &&
            templatePreviewView === "Product" &&
            onSelectedProductForPreviewChange
              ? [
                  {
                    title: "Product preview",
                    items: productSwitcherList.map((p) => {
                      const imgUrl =
                        p?.featuredImage?.url ||
                        p?.images?.edges?.[0]?.node?.url;
                      const labelBase =
                        (p?.title || "Product").slice(0, 35) +
                        ((p?.title || "").length > 35 ? "…" : "");
                      return {
                        content: labelBase,
                        active:
                          (selectedProductForPreview?.id ??
                            multiProductsForStore[0]?.id) === p?.id,
                        prefix: imgUrl ? (
                          <img
                            src={imgUrl}
                            alt=""
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              objectFit: "cover",
                            }}
                          />
                        ) : undefined,
                        onAction: () => {
                          onSelectedProductForPreviewChange(p);
                          setIsTemplateViewPopoverOpen(false);
                        },
                      };
                    }),
                  },
                ]
              : []),
          ]}
        />
      </Popover>
    );
  }, [
    isTemplateViewPopoverOpen,
    previewViews,
    templatePreviewView,
    templateViewPillHovered,
    title,
    storeType,
    marketType,
    productPages,
    productSwitcherIdsKey,
    multiProductsForStore,
    selectedProductForPreview,
    onSelectedProductForPreviewChange,
  ]);

  const productTypeForPreview = useMemo(() => {
    if (generationMode === "multi_product") return "multi-product";
    if (generationMode === "single_product") return "single-product";
    return storeType === "multi" ? "multi-product" : "single-product";
  }, [generationMode, storeType]);

  const pageTypeForTemplate = useMemo(
    () => viewToLiquidPageType(templatePreviewView),
    [templatePreviewView],
  );

  // Deps use id keys so dashboard `products` ref churn does not retrigger preview API.
  const collectionProductsForTemplate = useMemo(() => {
    if (pageTypeForTemplate !== "collection") return null;
    if (productTypeForPreview === "multi-product") {
      // COD multi: show catalog products (simple PDP); selected 3 still included.
      if (marketType === "cod" && Array.isArray(collectionProductsFallback) && collectionProductsFallback.length > 0) {
        return collectionProductsFallback.slice(0, 12);
      }
      if (multiProductsForStore.length > 0) return multiProductsForStore;
      if (!Array.isArray(collectionProductsFallback) || collectionProductsFallback.length === 0) return [];
      return collectionProductsFallback.slice(0, 12);
    }
    return selectedSingleProduct ? [selectedSingleProduct] : [];
  }, [
    pageTypeForTemplate,
    productTypeForPreview,
    marketType,
    multiProductIdsKey,
    collectionFallbackIdsKey,
    selectedSingleProduct?.id,
  ]);

  const productDataForTemplate = useMemo(() => {
    if (pageTypeForTemplate !== "product-page") return null;
    if (productTypeForPreview === "multi-product") {
      return selectedProductForPreview ?? multiProductsForStore[0] ?? null;
    }
    return selectedSingleProduct ?? selectedProductForPreview ?? null;
  }, [
    pageTypeForTemplate,
    productTypeForPreview,
    selectedProductForPreview?.id,
    multiProductIdsKey,
    selectedSingleProduct?.id,
  ]);

  const isMultiProductStore = productTypeForPreview === "multi-product";

  const activeProductPageData = useMemo(() => {
    // Single + multi: resolve per-product premium PDP payloads when present.
    return resolveStoreProductPageData(
      {
        product_pages: localProductPages,
        product_page: localProductPage,
      },
      productDataForTemplate,
      multiProductsForStore,
    );
  }, [
    isMultiProductStore,
    localProductPages,
    localProductPage,
    productDataForTemplate,
    multiProductIdsKey,
  ]);

  const usePremiumProductPage = useMemo(() => {
    // Multi featured products (COD + prepaid) use generated premium PDPs when present.
    if (isMultiProductStore) return Boolean(productDataForTemplate);
    // Classic prepaid: selectedProductTemplate null → simple product.json.
    if (selectedProductTemplate == null) return false;
    return selectedProductTemplate === 1 || selectedProductTemplate === 2;
  }, [isMultiProductStore, productDataForTemplate, selectedProductTemplate]);

  const isProductView = templatePreviewView === "Product";
  const canEditPremiumPdp = isProductView && usePremiumProductPage;
  const canEditSections = isHomeView || canEditPremiumPdp;

  const premiumPdpPreview = useMemo(() => {
    if (!canEditPremiumPdp) return null;
    return buildStorePremiumPdpPreview({
      storeCategory,
      productPageData: activeProductPageData,
      shopifyProduct: productDataForTemplate,
      stylePreferences: localStyle,
      selectedTemplate: selectedProductTemplate,
    });
  }, [
    canEditPremiumPdp,
    storeCategory,
    activeProductPageData,
    productDataForTemplate,
    localStyle,
    selectedProductTemplate,
  ]);

  const settingsTemplatesConfig = isHomeView
    ? templatesConfig
    : premiumPdpPreview?.templateRows || [];
  const settingsForm = isHomeView ? form : premiumPdpPreview?.form || form;

  useEffect(() => {
    setSelectedSection(null);
    if (templatePreviewView === "Product" || templatePreviewView === "Home" || templatePreviewView === "Home Page") {
      setLeftExpandedOpen(true);
    }
  }, [templatePreviewView]);

  if (isReadonlyMobileLayout) {
    return (
      <div className="w-full flex min-h-0 flex-1 flex-col overflow-hidden gap-2">
        <MobilePreviewReadonlyBanner variant="store" />
        {(showPublishSecondary || showThemeEditorPreview) ? (
          <div className="shrink-0 flex justify-end">
            {showThemeEditorPreview ? (
              <s-button
                variant="primary"
                disabled={!shopifyThemeEditorUrl?.trim() ? true : undefined}
                onClick={handleOpenShopifyThemeEditor}
              >
                Preview
              </s-button>
            ) : showPublishSecondary ? (
              <s-button
                variant="primary"
                loading={publishLoading ? true : undefined}
                onClick={handlePublishClick}
              >
                Publish
              </s-button>
            ) : null}
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden [&_iframe]:rounded-lg" style={{ minHeight: 0 }}>
          {isHomeView ? (
            <LiquidPreviewRender
              templateRows={templatesConfig}
              previewMode="mobile"
              selectedSection={null}
              storeName={title}
              storeHeaderContent={previewChromeHeaderContent}
              selectorMode={false}
              stylePreferences={previewStylePreferences}
              minHeight={minHeight}
              liquidPreviewType={homeLiquidPreviewType}
              previewCacheKey={homePreviewCacheKey}
            />
          ) : (
            <LiquidPagePreview
              productType={productTypeForPreview}
              pageType={pageTypeForTemplate}
              productData={productDataForTemplate}
              collectionProducts={collectionProductsForTemplate}
              detectedCategory={storeCategory}
              selectedTemplate={selectedProductTemplate}
              storeName={title}
              storeHeaderContent={previewChromeHeaderContent}
              previewMode="mobile"
              selectorMode={false}
              stylePreferences={previewStylePreferences}
              liquidPreviewType={liquidPreviewType}
              homeData={localHomeData}
              marketType={marketType}
              productPageData={activeProductPageData}
              usePremiumProductPage={usePremiumProductPage}
              minHeight={minHeight}
            />
          )}
        </div>
      </div>
    );
  }

  const previewToolbarSecondaryActions = (
    <InlineStack align="end" blockAlign="center" gap="200" wrap>
      <div className="flex min-w-0 flex-wrap shrink-0 items-center justify-end gap-2">
        {canEditSections ? (
          <button
            type="button"
            onClick={() => setSelectorMode((on) => !on)}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${selectorMode
              ? "bg-blue-100 text-blue-600"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            title={
              selectorMode
                ? "Select mode on: click a section to open its settings"
                : "Select mode off: enable to hover and click sections"
            }
            aria-label={selectorMode ? "Select mode on" : "Select mode off"}
            aria-pressed={selectorMode}
          >
            <Icon source={DragDropIcon} />
          </button>
        ) : null}
        <div
          className="flex items-center rounded-full border border-black/15 bg-white p-0.5 gap-0.5"
          role="group"
          aria-label="Preview device"
        >
          {[
            { mode: "desktop", icon: DesktopIcon, label: "Desktop" },
            { mode: "mobile", icon: MobileIcon, label: "Mobile" },
          ].map(({ mode, icon: IconSource, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setPreviewMode(mode);
                if (mode === "desktop") setLeftExpandedOpen(true);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${previewMode === mode
                ? "bg-black text-white shadow-sm"
                : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              aria-label={`${label} preview`}
              aria-pressed={previewMode === mode}
            >
              <Icon source={IconSource} />
            </button>
          ))}
        </div>
        <PreviewZoomControls scale={previewZoomScale} onScaleChange={setPreviewZoomScale} />
        {showSave || showPublishSecondary || showThemeEditorPreview ? (
          <div className="flex shrink-0 items-center gap-2">
            {showThemeEditorPreview ? (
              <Button
                variant="primary"
                disabled={!shopifyThemeEditorUrl?.trim()}
                onClick={handleOpenShopifyThemeEditor}
              >
                Preview
              </Button>
            ) : null}
            {showPublishSecondary ? (
              <Button variant="primary" loading={publishLoading} onClick={handlePublishClick}>
                Publish
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </InlineStack>
  );

  const editorWorkspace = (
      <div className="flex-1 min-h-0 flex overflow-hidden relative" style={{ minHeight }}>
        {leftExpandedOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setLeftExpandedOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="shrink-0 self-stretch min-h-0 flex overflow-hidden rounded-lg border border-gray-200 bg-white">
          <LiquidPreviewSettingsPanel
            templatesConfig={settingsTemplatesConfig}
            form={settingsForm}
            onFieldChange={updateField}
            selectedSection={selectedSection}
            onSectionSelect={(template) => {
              setSelectedSection(template);
              if (template) setLeftExpandedOpen(true);
            }}
            expandedOpen={leftExpandedOpen}
            onExpandedChange={setLeftExpandedOpen}
            sectionOverrides={sectionOverrides}
            onSectionOverrideChange={handleSectionOverrideChange}
            sectionColors={getSectionColorsMap(localHomeData)}
            onSectionColorChange={handleSectionColorChange}
            colorPalette={colorPalette}
            globalAccentColor={localStyle.dynamicColor}
            refImages={productImages}
            templateSchemas={templateSchemas}
            showTypographySettings
            showSectionMenu={canEditSections}
          />
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col px-1 overflow-hidden">
          <div
            ref={previewContainerRef}
            className="flex-1 min-h-0 w-full flex relative overflow-hidden rounded-lg"
            style={{ minHeight: 0 }}
            onWheel={
              previewContainerSize.width > 0 && previewContainerSize.height > 0
                ? (e) => {
                  const iframe = previewContainerRef.current?.querySelector("iframe");
                  if (iframe && iframe.contentWindow) {
                    try {
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                      const scrollableElement = iframeDoc.documentElement || iframeDoc.body;
                      if (scrollableElement) {
                        scrollableElement.scrollTop += e.deltaY * (1 / previewZoomScale);
                      }
                    } catch {
                      iframe.contentWindow.postMessage(
                        {
                          type: "SCROLL",
                          deltaY: e.deltaY * (1 / previewZoomScale),
                        },
                        "*",
                      );
                    }
                  }
                }
                : undefined
            }
          >
            {previewContainerSize.width > 0 && previewContainerSize.height > 0 ? (
              (() => {
                const PREVIEW_SCALE = previewZoomScale;
                const cw = previewContainerSize.width;
                const ch = previewContainerSize.height;
                const scaledWidth = cw / PREVIEW_SCALE;
                const scaledHeight = ch / PREVIEW_SCALE;
                return (
                  <div
                    className="absolute top-0 left-0 origin-top-left flex flex-col rounded-lg"
                    style={{
                      width: `${scaledWidth}px`,
                      height: `${scaledHeight}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                    }}
                  >
                    <div
                      className="flex-1 w-full h-full flex flex-col rounded-lg overflow-hidden [&>div]:flex-1 [&_iframe]:flex-1 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:rounded-lg"
                      style={{
                        opacity: isPreviewModeSwitching ? 0.78 : 1,
                        transition: "opacity 180ms ease-out",
                      }}
                    >
                      {isHomeView ? (
                        <LiquidPreviewRender
                          templateRows={templatesConfig}
                          previewMode={previewMode}
                          selectedSection={selectedSection}
                          storeName={title}
                          storeHeaderContent={previewChromeHeaderContent}
                          selectorMode={selectorMode}
                          stylePreferences={previewStylePreferences}
                          minHeight={minHeight}
                          liquidPreviewType={homeLiquidPreviewType}
                          previewCacheKey={homePreviewCacheKey}
                        />
                      ) : (
                        <LiquidPagePreview
                          productType={productTypeForPreview}
                          pageType={pageTypeForTemplate}
                          productData={productDataForTemplate}
                          collectionProducts={collectionProductsForTemplate}
                          detectedCategory={storeCategory}
                          selectedTemplate={selectedProductTemplate}
                          storeName={title}
                          storeHeaderContent={previewChromeHeaderContent}
                          previewMode={previewMode}
                          selectorMode={canEditSections && selectorMode}
                          selectedSection={selectedSection}
                          stylePreferences={previewStylePreferences}
                          liquidPreviewType={liquidPreviewType}
                          homeData={localHomeData}
                          marketType={marketType}
                          productPageData={activeProductPageData}
                          usePremiumProductPage={usePremiumProductPage}
                          minHeight={minHeight}
                        />
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div
                className="flex-1 min-h-0 w-full flex [&_iframe]:rounded-lg"
                style={{
                  opacity: isPreviewModeSwitching ? 0.78 : 1,
                  transition: "opacity 180ms ease-out",
                }}
              >
                {isHomeView ? (
                  <LiquidPreviewRender
                    templateRows={templatesConfig}
                    previewMode={previewMode}
                    selectedSection={selectedSection}
                    storeName={title}
                    storeHeaderContent={previewChromeHeaderContent}
                    selectorMode={selectorMode}
                    stylePreferences={previewStylePreferences}
                    minHeight={minHeight}
                    liquidPreviewType={homeLiquidPreviewType}
                    previewCacheKey={homePreviewCacheKey}
                  />
                ) : (
                  <LiquidPagePreview
                    productType={productTypeForPreview}
                    pageType={pageTypeForTemplate}
                    productData={productDataForTemplate}
                    collectionProducts={collectionProductsForTemplate}
                    detectedCategory={storeCategory}
                    selectedTemplate={selectedProductTemplate}
                    storeName={title}
                    storeHeaderContent={previewChromeHeaderContent}
                    previewMode={previewMode}
                    selectorMode={canEditSections && selectorMode}
                    selectedSection={selectedSection}
                    stylePreferences={previewStylePreferences}
                    liquidPreviewType={liquidPreviewType}
                    homeData={localHomeData}
                    marketType={marketType}
                    productPageData={activeProductPageData}
                    usePremiumProductPage={usePremiumProductPage}
                    minHeight={minHeight}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );

  return (
    <>
      <ui-save-bar id={STORE_PREVIEW_SAVE_BAR_ID}>
        <button
          ref={contextualSaveButtonRef}
          type="button"
          variant="primary"
          onClick={handleContextualSave}
          disabled={isContextualSaving}
        >
          {isContextualSaving ? "Saving..." : saveLabel}
        </button>
        <button type="button" onClick={handleContextualDiscard} disabled={isContextualSaving}>
          Discard
        </button>
      </ui-save-bar>
      {pageChrome ? (
                    <Page
                    fullWidth
                    title={pageChrome.title}
                    subtitle={pageChrome.subtitle}
                    backAction={pageChrome.backAction}
                    secondaryActions={previewToolbarSecondaryActions}
                >
                    <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 7rem)', maxHeight: '1200px' }}>
                        {editorWorkspace}
                    </div>
                </Page>
      ) : (
        <div className="flex h-full min-h-screen w-full flex-col">
          <div className="px-2 pb-2 pt-2 sm:px-3">
            <BlockStack gap="100">{previewToolbarSecondaryActions}</BlockStack>
          </div>
          {editorWorkspace}
        </div>
      )}
    </>
  );
}
