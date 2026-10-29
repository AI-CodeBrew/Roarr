import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppBridge, Modal as AppBridgeModal } from "@shopify/app-bridge-react";
import { BlockStack, Box, Button, Icon, InlineStack, Page, Spinner, Text } from "@shopify/polaris";
import { DesktopIcon, MobileIcon } from "@shopify/polaris-icons";
import { LayoutTemplate, Package } from "lucide-react";
import {
  FlowPageHeader,
  Panel,
  SecondaryButton,
  StepHeading,
} from "../../../components/RoarrUI.jsx";
import CategoryDetectRow from "../../../components/CategoryDetectRow.jsx";
import { useDashboardLoaderData } from "../../../lib/DashboardDataContext";
import { usePages } from "../../../lib/PagesContext";
import { buildEmbeddedHref } from "../../../lib/embeddedNavigation.js";
import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "./utils/productAiResponeMapping.js";
import { generateTemplateConfig } from "./utils/productTemplatesConfig.js";
import { getDefaultColor, getDefaultMagicResponses } from "./utils/default-magic-responses/index.js";
import LiquidPreviewRender from "../../../components/theme-preview-editor/LiquidPreviewRender.jsx";
import ThemePreviewCard from "../../../components/theme-preview-editor/ThemePreviewCard.jsx";
import TemplateCardRail from "../../../components/TemplateCardRail.jsx";
import { getProductPageThemeName } from "../../../lib/themeNames.js";
import {
  DemoPreviewBadge,
  DemoPreviewDisclaimer,
} from "../../../components/theme-preview-editor/DemoPreviewChromeLabels.jsx";
import {
  getProductTemplateCardMedia,
  PRODUCT_TEMPLATE_OPTIONS,
} from "./productTemplateOptions.js";
import ProductSelectionModal from "../../../components/ProductSelectionModal.jsx";
import GenerateContainer from "../utils/GenerateContainer.jsx";
import { useViewportBelowMd } from "../../../hooks/useViewportBelowMd.js";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget.jsx";
import { CreditConfirmationModal } from "../../../components/CreditConfirmationModal";
import { useCredits } from "../../../lib/CreditsContext";
import { hasEnoughCredits, pageGenerationFeatureKey, resolveFeatureCost, shopSkipsCreditGates } from "../../../lib/credits";
import { shopifyAuthenticatedFetch } from "../../../lib/shopifyAuthenticatedFetch.js";
import { normalizeMarketType } from "../../../lib/posthogMarketType.js";
import {
  SUPPORTED_LANGUAGES,
  getSupportedLanguage,
  mapShopLocaleToSupported,
} from "../../../lib/supportedLanguages.js";

const ProductPreviewEditor = lazy(() =>
  import("./ProductPreviewEditor").then((mod) => ({ default: mod.ProductPreviewEditor })),
);
const ProductGenerationStep = lazy(() => import("./ProductGenerationStep.jsx"));
const ProductPublishStep = lazy(() => import("./ProductPublishStep.jsx"));

const TEMPLATE_LABELS = { 1: "Sleek", 2: "Vibe", 3: "Aura", 4: "Lumenook", 5: "Noir", 6: "Frost" };

function asProductTemplate(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}
const IMAGE_REGENERATE_FALLBACK_URL =
  "";

const CATEGORY_OPTIONS = [
  { label: "Car Accessories", value: "car_accessories" },
  { label: "Fashion", value: "fashion" },
  { label: "Health & Beauty", value: "health_beauty" },
  { label: "Kids Toys", value: "kids_toys" },
  { label: "Home & Kitchen", value: "home_kitchen" },
  { label: "General", value: "general" },
];

function normalizeProductCategory(categoryValue) {
  if (!categoryValue) return null;
  const normalized = String(categoryValue).trim().toLowerCase().replaceAll(" ", "_");
  return CATEGORY_OPTIONS.some((option) => option.value === normalized) ? normalized : null;
}

function withProductImageFallbacks(generationData, category) {
  if (!generationData || typeof generationData !== "object") return generationData;
  const defaultImages = getDefaultMagicResponses(category)?.images || {};
  const defaultBodyImages =
    defaultImages.body_images && typeof defaultImages.body_images === "object"
      ? defaultImages.body_images
      : {};
  const defaultProductImages =
    defaultImages.product_images && typeof defaultImages.product_images === "object"
      ? defaultImages.product_images
      : {};

  const incomingImages =
    generationData.images && typeof generationData.images === "object"
      ? generationData.images
      : {};
  const incomingBodyImages =
    incomingImages.body_images && typeof incomingImages.body_images === "object"
      ? incomingImages.body_images
      : {};
  const incomingProductImages =
    incomingImages.product_images && typeof incomingImages.product_images === "object"
      ? incomingImages.product_images
      : {};

  const nextBodyImages = { ...incomingBodyImages };
  for (const key of Object.keys(defaultBodyImages)) {
    const current = nextBodyImages[key];
    if (typeof current !== "string" || current.trim().length === 0) {
      nextBodyImages[key] = IMAGE_REGENERATE_FALLBACK_URL;
    }
  }

  const nextProductImages = { ...incomingProductImages };
  for (const key of Object.keys(defaultProductImages)) {
    const current = nextProductImages[key];
    if (typeof current !== "string" || current.trim().length === 0) {
      nextProductImages[key] = IMAGE_REGENERATE_FALLBACK_URL;
    }
  }

  return {
    ...generationData,
    images: {
      ...incomingImages,
      body_images: nextBodyImages,
      product_images: nextProductImages,
    },
  };
}

/** Prefs store language as a code (`ar`); older rows may store the display name (`Arabic`). */
function resolvePrefLanguageValue(raw, fallback) {
  if (raw == null) return fallback;
  const s = String(raw).trim();
  if (!s) return fallback;
  const lower = s.toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.value === lower ||
      l.name.toLowerCase() === lower ||
      (l.nativeName && l.nativeName.toLowerCase() === lower) ||
      l.codes.some((c) => String(c).toLowerCase() === lower),
  );
  return match ? match.value : fallback;
}

function hasAtLeastOneProductImage(product) {
  if (!product) return false;
  const featuredImageUrl = product?.featuredImage?.url;
  const imageEdges = Array.isArray(product?.images?.edges) ? product.images.edges : [];
  const edgeImageUrls = imageEdges.map((edge) => edge?.node?.url).filter(Boolean);
  const imageUrls = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
  return Boolean(featuredImageUrl) || edgeImageUrls.length > 0 || imageUrls.length > 0;
}

function hasProductTitle(product) {
  return Boolean(String(product?.title || product?.name || "").trim());
}

function hasProductDescription(product) {
  const raw = Array.isArray(product?.description)
    ? product.description.join(" ")
    : product?.descriptionHtml || product?.description || "";
  return Boolean(String(raw).trim());
}

function myshopifyDomainToAdminStoreSlug(shop) {
  const raw = (shop || "").toString().trim();
  if (!raw) return "";
  const normalized = raw.replace(/^https?:\/\//i, "").replace(/^\/+/, "").toLowerCase();

  // Handles "store/<slug>" and "admin.shopify.com/store/<slug>/..."
  const storePathMatch = normalized.match(/(?:^|\/)store\/([^/?#]+)/);
  if (storePathMatch?.[1]) return storePathMatch[1];

  // Handles "<shop>.myshopify.com"
  const host = normalized.split("/")[0].trim();
  if (!host) return "";
  if (host.includes(".myshopify.com")) {
    return host.split(".")[0] || "";
  }

  // Fallback: treat value as already being a slug.
  return host;
}

function extractShopifyResourceNumericId(rawId) {
  const value = String(rawId || "").trim();
  if (!value) return "";
  const match = value.match(/(\d+)(?!.*\d)/);
  return match ? match[1] : "";
}

function getAdminStoreSlugFromLocation() {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/store\/([^/]+)/i);
  return match?.[1] ? String(match[1]).trim().toLowerCase() : "";
}

/** Resolve product PDP row from `usePages()` when `?pageId=` is present (same idea as ProductPageFlow). */
function generationLooksLikePlay(page) {
  const gen = page?.generation_data;
  const text = gen?.text && typeof gen.text === "object" ? gen.text : gen;
  if (!text || typeof text !== "object") return false;
  return Boolean(text.feature_label_1 || text.pill_1 || text.promo_code);
}

function mapPageRecordToProductFlowState(page) {
  const genDataForTemplate = page.generation_data || null;
  const storedTemplate =
    page.selectedTemplate ??
    page.selected_template ??
    page.template ??
    genDataForTemplate?.selectedTemplate ??
    genDataForTemplate?.selected_template;
  const template =
    storedTemplate === 6 || storedTemplate === "6" || storedTemplate === "template_6"
      ? 6
      : storedTemplate === 5 || storedTemplate === "5" || storedTemplate === "template_5"
      ? 5
      : storedTemplate === 4 || storedTemplate === "4" || storedTemplate === "template_4"
      ? 4
      : storedTemplate === 3 || storedTemplate === "3" || storedTemplate === "template_3"
      ? 3
      : generationLooksLikePlay(page)
        ? 3
      : storedTemplate === 1 || storedTemplate === "1" || storedTemplate === "template_1"
        ? 1
        : 2;
  const genData = page.generation_data || null;
  const productIds = Array.isArray(page?.product_ids)
    ? page.product_ids
    : Array.isArray(page?.productIds)
      ? page.productIds
      : [];
  const generationProductIds = Array.isArray(genData?.product_ids)
    ? genData.product_ids
    : Array.isArray(genData?.productIds)
      ? genData.productIds
      : [];
  const productId =
    page.product_id ??
    page.productId ??
    productIds.find((id) => typeof id === "string" && id.trim()) ??
    generationProductIds.find((id) => typeof id === "string" && id.trim()) ??
    null;
  const status = String(page.generation_status || "").toLowerCase();
  const completed =
    status === "completed" || status === "done" || status === "success";
  const failed = status === "failed" || status === "error";
  const inFlight =
    status === "in_progress" ||
    status === "processing" ||
    status === "generating" ||
    status === "pending" ||
    status === "queued";
  const treatAsComplete =
    completed || (genData && !inFlight && !failed);
  return { template, productId, genData, failed, inFlight, treatAsComplete };
}

/** Brand-ads style configure shell. Sticky header keeps Begin Magic visible while scrolling. */
function ProductConfigureStepShell({
  embedded,
  backLabel,
  onBack,
  primaryAction,
  children,
}) {
  if (embedded) {
    return <BlockStack gap="400">{children}</BlockStack>;
  }
  return (
    <Box
      width="100%"
      style={{
        maxWidth: "1150px",
        marginInline: "auto",
        boxSizing: "border-box",
      }}
    >
      <FlowPageHeader
        title="Configure product page"
        subtitle="Step 1 of 3"
        backLabel={backLabel || "Back"}
        onBack={onBack}
        primaryAction={primaryAction}
      />
      <BlockStack gap="400">{children}</BlockStack>
    </Box>
  );
}

export default function ProductFlowStructure({
  setFlowType,
  hideConfigurationHeading = false,
  embedded = false,
  /** When embedded (e.g. onboarding), passes WhatsComing timeline `{ current, completed }` (steps 4–6). */
  onFlowStepChange,
  isOnboarding = false,
  onOnboardingComplete,
  /** When set, “back to list” navigates here (e.g. `/product-page`) instead of `?flow=dashboard`. */
  hubPath = null,
}) {
  const isMobileLayout = useViewportBelowMd();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIdFromUrl = searchParams.get("pageId");
  const shopFromUrl = searchParams.get("shop");
  const {
    pages = [],
    refreshPages,
    fetchPages,
    storeDetails,
  } = usePages();
  const { refresh: refreshCreditsWallet, featureCosts, balance: creditBalance } =
    useCredits();
  const posthog = usePostHog();
  const {
    locales: shopLocales = [],
    marketPreferences = null,
    updateMarketPreferences,
  } = useDashboardLoaderData() || {};
  const pdpMarketType = normalizeMarketType(
    marketPreferences?.market_type || marketPreferences?.marketType,
  );
  const [isPublished, setIsPublished] = useState(false);
  const [step, setStep] = useState(1);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  /** Template chosen by the card's Begin Magic click, before state re-renders. */
  const templateSelectionRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [pageGenCreditConfirmOpen, setPageGenCreditConfirmOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [generationPercentage, setGenerationPercentage] = useState(0);
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [publishPayload, setPublishPayload] = useState(null);

  useEffect(() => {
    if (!onFlowStepChange) return;
    if (publishPayload) {
      onFlowStepChange({ current: 6, completed: 5 });
      return;
    }
    if (step === 1) {
      onFlowStepChange({ current: 4, completed: 3 });
      return;
    }
    if (isGenerating || generationStatus === "failed") {
      onFlowStepChange({ current: 5, completed: 4 });
      return;
    }
    if (generationStatus === "completed" && generatedContent) {
      onFlowStepChange({ current: 6, completed: 5 });
      return;
    }
    onFlowStepChange({ current: 5, completed: 4 });
  }, [
    onFlowStepChange,
    publishPayload,
    step,
    isGenerating,
    generationStatus,
    generatedContent,
  ]);

  const [modalPreviewMode, setModalPreviewMode] = useState("desktop");
  const [isProductDemoModalOpen, setIsProductDemoModalOpen] = useState(false);
  /** After first eye open, keep PDP iframe mounted so reopen has no spinner. */
  const [productDemoWarmed, setProductDemoWarmed] = useState(false);
  /** Template shown in the eye-icon modal (may differ briefly from selected). */
  const [demoTemplateOverride, setDemoTemplateOverride] = useState(null);

  const [productCategory, setProductCategory] = useState("general");
  const [detectingProductCategory, setDetectingProductCategory] = useState(false);
  const [categoryMatchPercentage, setCategoryMatchPercentage] = useState(null);
  const categoryLockedByUserRef = useRef(false);
  const handleManualProductCategoryChange = useCallback((nextCategory) => {
    categoryLockedByUserRef.current = true;
    setProductCategory(nextCategory);
    setCategoryMatchPercentage(null);
  }, []);

  /** While resolving `?pageId=` against `/api/generated-pages` (parity with ProductPageFlow). */
  const [isProcessingUrlPage, setIsProcessingUrlPage] = useState(() => Boolean(pageIdFromUrl));
  const [urlPagesReady, setUrlPagesReady] = useState(false);
  const hydratedProductPageFromUrlRef = useRef(false);

  const dummyMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses(productCategory);
    const hex = getDefaultColor(productCategory);
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
  }, [productCategory]);
  const vibeMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses(productCategory, {
      template: 2,
    });
    const hex = getDefaultColor(productCategory, { template: 2 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
  }, [productCategory]);
  const productData = useMemo(() => aiResponseMapping(dummyMagicResponse), [dummyMagicResponse]);
  const vibeProductData = useMemo(
    () => aiResponseMapping(vibeMagicResponse),
    [vibeMagicResponse],
  );
  const playMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses("kids_toys", { template: 3 });
    const hex = getDefaultColor("kids_toys", { template: 3 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
  }, []);
  const playProductData = useMemo(
    () => aiResponseMapping(playMagicResponse),
    [playMagicResponse],
  );
  const demoSelectedTemplate = asProductTemplate(demoTemplateOverride) ?? selectedTemplate;
  const sleekTemplateRows = useMemo(
    () => generateTemplateConfig(productCategory, productData, 1, dummyMagicResponse),
    [productCategory, productData, dummyMagicResponse],
  );
  const vibeTemplateRows = useMemo(
    () => generateTemplateConfig(productCategory, vibeProductData, 2, vibeMagicResponse),
    [productCategory, vibeProductData, vibeMagicResponse],
  );
  const sleekPreviewCacheKey = useMemo(
    () => ["product-page-card", productCategory, "1", selectedProduct?.id || ""].join("::"),
    [productCategory, selectedProduct?.id],
  );
  const vibePreviewCacheKey = useMemo(
    () => ["product-page-card", productCategory, "2", selectedProduct?.id || ""].join("::"),
    [productCategory, selectedProduct?.id],
  );
  const playTemplateRows = useMemo(
    () => generateTemplateConfig("kids_toys", playProductData, 3, playMagicResponse),
    [playProductData, playMagicResponse],
  );
  const playPreviewCacheKey = useMemo(
    () => ["product-page-card", "kids_toys", "3-play-qty", selectedProduct?.id || ""].join("::"),
    [selectedProduct?.id],
  );
  const glowMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses("health_beauty", { template: 3 });
    const hex = getDefaultColor("health_beauty", { template: 3 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
  }, []);
  const glowProductData = useMemo(
    () => aiResponseMapping(glowMagicResponse),
    [glowMagicResponse],
  );
  const glowTemplateRows = useMemo(
    () => generateTemplateConfig("health_beauty", glowProductData, 3, glowMagicResponse),
    [glowProductData, glowMagicResponse],
  );
  const glowPreviewCacheKey = useMemo(
    () => ["product-page-card", "health_beauty", "3-glow-faq", selectedProduct?.id || ""].join("::"),
    [selectedProduct?.id],
  );
  const lumenMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses("general", { template: 4 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: categoryDefaults.color || undefined,
      color_schemes: categoryDefaults.color ? [categoryDefaults.color] : [],
    };
  }, []);
  const lumenProductData = useMemo(
    () => aiResponseMapping(lumenMagicResponse),
    [lumenMagicResponse],
  );
  const lumenTemplateRows = useMemo(
    () => generateTemplateConfig("general", lumenProductData, 4, lumenMagicResponse),
    [lumenProductData, lumenMagicResponse],
  );
  const lumenPreviewCacheKey = useMemo(
    () => ["product-page-card", "general", "4-lumenook", selectedProduct?.id || ""].join("::"),
    [selectedProduct?.id],
  );
  const noirMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses("general", { template: 5 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: categoryDefaults.color || undefined,
      color_schemes: categoryDefaults.color ? [categoryDefaults.color] : [],
    };
  }, []);
  const noirProductData = useMemo(
    () => aiResponseMapping(noirMagicResponse),
    [noirMagicResponse],
  );
  const noirTemplateRows = useMemo(
    () => generateTemplateConfig("general", noirProductData, 5, noirMagicResponse),
    [noirProductData, noirMagicResponse],
  );
  const noirPreviewCacheKey = useMemo(
    () => ["product-page-card", "general", "5-noir", selectedProduct?.id || ""].join("::"),
    [selectedProduct?.id],
  );
  const frostMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses("general", { template: 6 });
    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: categoryDefaults.images || {},
      text: categoryDefaults.text || {},
      selected_color: categoryDefaults.color || undefined,
      color_schemes: categoryDefaults.color ? [categoryDefaults.color] : [],
    };
  }, []);
  const frostProductData = useMemo(
    () => aiResponseMapping(frostMagicResponse),
    [frostMagicResponse],
  );
  const frostTemplateRows = useMemo(
    () => generateTemplateConfig("general", frostProductData, 6, frostMagicResponse),
    [frostProductData, frostMagicResponse],
  );
  const frostPreviewCacheKey = useMemo(
    () => ["product-page-card", "general", "6-frost", selectedProduct?.id || ""].join("::"),
    [selectedProduct?.id],
  );
  // Live preview rows + cache key for each premium template card.
  const premiumCardPreviews = {
    3: [glowTemplateRows, glowPreviewCacheKey],
    4: [lumenTemplateRows, lumenPreviewCacheKey],
    5: [noirTemplateRows, noirPreviewCacheKey],
    6: [frostTemplateRows, frostPreviewCacheKey],
  };

  const openProductDemoModal = useCallback(
    (template) => {
      const next = asProductTemplate(template) ?? 1;
      setSelectedTemplate(next);
      setDemoTemplateOverride(next);
      setModalPreviewMode("desktop");
      setProductDemoWarmed(true);
      setIsProductDemoModalOpen(true);
    },
    [],
  );

  const closeProductDemoModal = useCallback(() => {
    // Keep demoTemplateOverride so warmed iframe URL stays stable.
    setModalPreviewMode("desktop");
    setIsProductDemoModalOpen(false);
  }, []);

  const selectedCategoryLabel = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === productCategory)?.label || "General",
    [productCategory],
  );

  const activeProduct = selectedProduct;
  const canShowEditProductButton = Boolean(selectedProduct?.id);
  const editProductAdminUrl = useMemo(() => {
    if (!selectedProduct) return "";
    const productNumericId = extractShopifyResourceNumericId(selectedProduct?.id);
    const storeSlug =
      myshopifyDomainToAdminStoreSlug(shopFromUrl) || getAdminStoreSlugFromLocation();
    if (!productNumericId || !storeSlug) return "";
    return `https://admin.shopify.com/store/${storeSlug}/products/${productNumericId}`;
  }, [selectedProduct, shopFromUrl]);
  const productValidationMessage = useMemo(() => {
    if (!activeProduct) return null;
    if (!hasProductTitle(activeProduct)) return "Selected product must have a title.";
    if (!hasProductDescription(activeProduct)) {
      return "Selected product must have a description.";
    }
    if (!hasAtLeastOneProductImage(activeProduct)) {
      return "Selected product must have at least 1 image.";
    }
    return null;
  }, [activeProduct]);

  // Template cards are on screen: build both eye iframes now, hidden.
  useEffect(() => {
    if (step !== 1 || !activeProduct || productValidationMessage) return;
    setProductDemoWarmed(true);
  }, [step, activeProduct, productValidationMessage]);

  const productValidationAlert = productValidationMessage ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        border: "1px solid #fecaca",
        background: "#fef2f2",
        borderRadius: "8px",
        padding: "8px 10px",
      }}
    >
      <InlineStack gap="200" blockAlign="center">
        <span
          aria-hidden="true"
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            background: "#dc2626",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          !
        </span>
        <Text as="p" variant="bodySm" tone="critical">
          {productValidationMessage}
        </Text>
      </InlineStack>
      {canShowEditProductButton ? (
        <Button
          variant="plain"
          onClick={() => {
            const productNumericId = extractShopifyResourceNumericId(selectedProduct?.id);
            if (!productNumericId) return;
            const storeSlug =
              myshopifyDomainToAdminStoreSlug(shopFromUrl) || getAdminStoreSlugFromLocation();
            const targetUrl = storeSlug
              ? `https://admin.shopify.com/store/${storeSlug}/products/${productNumericId}`
              : `https://admin.shopify.com/products/${productNumericId}`;
            window.open(targetUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Edit Product
        </Button>
      ) : null}
    </div>
  ) : null;
  const primaryLocaleCode = useMemo(() => {
    const primary = Array.isArray(shopLocales) && shopLocales.find((l) => l.primary);
    return primary?.locale || "en";
  }, [shopLocales]);
  const primarySupportedValue = useMemo(
    () => mapShopLocaleToSupported(primaryLocaleCode),
    [primaryLocaleCode]
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => marketPreferences?.language || marketPreferences?.store_language || null,
  );

  const applyLanguagePreference = useCallback((prefs) => {
    if (!prefs) return;
    const lang = prefs.language || prefs.store_language;
    if (lang) setSelectedLanguage(lang);
  }, []);

  // Latest Preferences language (dashboard context can be stale).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop-market-preferences");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const prefs = data?.preferences || data;
        if (!prefs) return;
        applyLanguagePreference(prefs);
        updateMarketPreferences?.(prefs);
      } catch {
        if (!cancelled) applyLanguagePreference(marketPreferences);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only refresh; context updates are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally refresh on mount
  }, []);

  useEffect(() => {
    applyLanguagePreference(marketPreferences);
  }, [marketPreferences, applyLanguagePreference]);

  const effectiveLanguageValue = resolvePrefLanguageValue(
    selectedLanguage,
    primarySupportedValue,
  );
  const storeLanguage = getSupportedLanguage(effectiveLanguageValue);

  const pollGenerationStatus = useCallback(async (targetPageId) => {
    setGenerationPercentage((prev) => Math.max(prev, 20));
    setCurrentGenerationStep(2);
    const startedAt = Date.now();
    const maxWaitMs = 5 * 60 * 1000;
    let lastUnauthorized = false;
    while (Date.now() - startedAt < maxWaitMs) {
      // Fresh session token each poll — Shopify JWTs expire in ~60s.
      // A rejected token must not stop the run; generation continues on the server.
      let statusRes = null;
      let statusJson = {};
      try {
        statusRes = await shopifyAuthenticatedFetch(
          shopify,
          `/api/generation-status/${targetPageId}`,
        );
        statusJson = await statusRes.json().catch(() => ({}));
      } catch {
        statusRes = null;
      }
      if (!statusRes?.ok) {
        lastUnauthorized = !statusRes || statusRes.status === 401;
        if (!lastUnauthorized) {
          throw new Error(statusJson?.error || "Status check failed.");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      lastUnauthorized = false;
      const status = String(statusJson?.generation_status || "").toLowerCase();
      const pct = Number(statusJson?.generation_percentage ?? statusJson?.percentage ?? 0);
      if (!Number.isNaN(pct)) {
        const clampedPct = Math.min(Math.max(pct, 0), 100);
        // Keep progress non-decreasing so early stale 0% polls don't visually jump backward.
        setGenerationPercentage((prev) => Math.max(prev, clampedPct));
      }

      if (status === "completed") {
        setGeneratedContent(
          withProductImageFallbacks(statusJson?.generation_data || {}, statusJson?.category || "general")
        );
        setGenerationStatus("completed");
        setGenerationPercentage(100);
        setCurrentGenerationStep(2);
        setIsGenerating(false);
        if (posthog) {
          const generatedTemplate =
            asProductTemplate(templateSelectionRef.current) ??
            asProductTemplate(statusJson?.selectedTemplate) ??
            1;
          // Status polls usually omit category; use the one this page was generated with.
          const generatedCategory = statusJson?.category || productCategory || "general";
          posthog.capture("pdp_generated", {
            is_onboarding: Boolean(isOnboarding),
            market_type: pdpMarketType,
            theme_name: getProductPageThemeName(generatedTemplate, generatedCategory),
            template: generatedTemplate,
            category: generatedCategory,
            page_id: targetPageId,
          });
          if (isOnboarding) {
            posthog.capture('onboarding_step_completed', {
              step_number: 5,
              step_name: 'content_generated',
              flow: 'pdp',
              market_type: pdpMarketType,
            });
          }
        }
        return;
      }
      if (status === "failed" || status === "error") {
        throw new Error("Generation failed. Please try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error(
      lastUnauthorized
        ? "Session expired while generating. Reload the app and try again."
        : "Generation timed out. Please try again.",
    );
  }, [shopify, posthog, isOnboarding, pdpMarketType]);

  const handleAutoDetectProductCategoryFromShopify = useCallback(async () => {
    if (!selectedProduct) return;
    setDetectingProductCategory(true);
    try {
      const response = await fetch("/api/detect-store-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: [
            {
              title: selectedProduct?.title || "",
              description:
                selectedProduct?.description ||
                selectedProduct?.descriptionHtml ||
                "",
            },
          ],
        }),
      });
      if (!response.ok) throw new Error("Failed to detect category");
      const data = await response.json();
      if (data?.success) {
        if (categoryLockedByUserRef.current) return;
        const normalized = normalizeProductCategory(data.category);
        if (normalized) setProductCategory(normalized);
        if (typeof data.confidence_percentage === "number") {
          setCategoryMatchPercentage(Number(data.confidence_percentage));
        }
      }
    } catch (e) {
      console.error("Error detecting product category:", e);
    } finally {
      setDetectingProductCategory(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    handleAutoDetectProductCategoryFromShopify();
  }, [selectedProduct, handleAutoDetectProductCategoryFromShopify]);

  useEffect(() => {
    const loadPages = pageIdFromUrl
      ? fetchPages?.(1000, 0)
      : refreshPages?.();
    Promise.resolve(loadPages)
      .catch(() => { })
      .finally(() => setUrlPagesReady(true));
  }, [fetchPages, refreshPages, pageIdFromUrl]);

  useEffect(() => {
    hydratedProductPageFromUrlRef.current = false;
    if (!pageIdFromUrl) {
      setIsProcessingUrlPage(false);
    } else {
      setIsProcessingUrlPage(true);
    }
  }, [pageIdFromUrl]);

  useEffect(() => {
    if (!pageIdFromUrl || !urlPagesReady) return;
    if (hydratedProductPageFromUrlRef.current) return;

    const page = pages.find((p) => String(p.PK) === String(pageIdFromUrl));
    if (!page) {
      setIsProcessingUrlPage(false);
      return;
    }
    if (page.generation_type === "store") {
      setIsProcessingUrlPage(false);
      return;
    }

    hydratedProductPageFromUrlRef.current = true;

    const { template, productId, genData, failed, inFlight, treatAsComplete } =
      mapPageRecordToProductFlowState(page);

    const rawCategory = normalizeProductCategory(
      page.category ||
        page.detected_category ||
        genData?.category ||
        genData?.detected_category ||
        genData?.store_category,
    );
    const savedCategory = rawCategory;
    if (savedCategory) {
      categoryLockedByUserRef.current = true;
      setProductCategory(savedCategory);
    }
    templateSelectionRef.current = template;
    setSelectedTemplate(template);
    setPageId(page.PK);
    setIsPublished(page.published);

    const loadProductFromPage = () => {
      if (!productId) return;
      void (async () => {
        try {
          const response = await fetch(
            `/api/product-details?productId=${encodeURIComponent(productId)}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.product) {
              setSelectedProduct(data.product);
              return;
            }
          }
        } catch {
          /* fall through */
        }
        setSelectedProduct({
          id: productId,
          title: page.product_title || "",
        });
      })();
    };

    if (treatAsComplete && genData) {
      setGeneratedContent(withProductImageFallbacks(genData, page.category || "general"));
      setGenerationStatus("completed");
      setGenerationPercentage(100);
      setCurrentGenerationStep(2);
      setIsGenerating(false);
      setGenerationError(null);
      setStep(1);
      setIsProcessingUrlPage(false);
      loadProductFromPage();
      return;
    }

    if (failed) {
      setStep(2);
      setGenerationStatus("failed");
      setGenerationError("Generation failed. Please try again.");
      setIsGenerating(false);
      setIsProcessingUrlPage(false);
      loadProductFromPage();
      return;
    }

    if (inFlight) {
      setStep(2);
      setIsGenerating(true);
      setGenerationStatus("in_progress");
      setGenerationError(null);
      setGenerationPercentage((p) => Math.max(p, 10));
      setCurrentGenerationStep(2);
      setIsProcessingUrlPage(false);
      loadProductFromPage();

      let cancelled = false;
      void (async () => {
        try {
          await pollGenerationStatus(page.PK);
        } catch (e) {
          if (!cancelled) {
            setGenerationStatus("failed");
            setGenerationError(e?.message || "Generation failed.");
            setIsGenerating(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setStep(1);
    setIsProcessingUrlPage(false);
    loadProductFromPage();
  }, [pageIdFromUrl, urlPagesReady, pages, pollGenerationStatus]);

  const getSourceProductPayload = async () => {
    const detailsRes = await fetch(`/api/product-details?productId=${encodeURIComponent(selectedProduct.id)}`);
    const detailsJson = await detailsRes.json().catch(() => ({}));
    const details = detailsJson?.product || selectedProduct;
    const images = Array.isArray(details?.images?.edges)
      ? details.images.edges.map((edge) => edge?.node?.url).filter(Boolean)
      : [];
    return {
      title: details?.title || selectedProduct?.title || "",
      description: details?.descriptionHtml || details?.description || "",
      productImages: images.length ? images : [details?.featuredImage?.url].filter(Boolean),
      productId: details?.id || selectedProduct?.id || null,
      storeName: details?.vendor || selectedProduct?.vendor || "Store",
      productHandle: details?.handle || selectedProduct?.handle || null,
    };
  };

  const readSelectedTemplate = () =>
    asProductTemplate(templateSelectionRef.current) ?? asProductTemplate(selectedTemplate);

  // Aura is the default product template — auto-select it when a product is ready,
  // unless the merchant already picked Lumenook, Noir or Frost.
  useEffect(() => {
    if (pageIdFromUrl) return;
    if (!activeProduct || productValidationMessage) return;
    if (selectedTemplate >= 3 && selectedTemplate <= 6) return;
    templateSelectionRef.current = 3;
    setSelectedTemplate(3);
  }, [activeProduct, productValidationMessage, selectedTemplate, pageIdFromUrl]);

  const requestPageGenerationCredit = async () => {
    const template = readSelectedTemplate();
    const ready =
      Boolean(activeProduct) &&
      !productValidationMessage &&
      template >= 3 &&
      template <= 6;
    if (!ready) return;
    const wallet = await refreshCreditsWallet();
    const cost = resolveFeatureCost(
      pageGenerationFeatureKey(productCategory, template),
      wallet.featureCosts ?? undefined,
    );
    if (
      shopSkipsCreditGates(storeDetails) ||
      (wallet.ok && hasEnoughCredits(wallet.balance, cost))
    ) {
      void runPageGeneration();
      return;
    }
    setPageGenCreditConfirmOpen(true);
  };

  const pageGenerationCost = useCallback(
    (template) =>
      resolveFeatureCost(pageGenerationFeatureKey(productCategory, template), featureCosts),
    [productCategory, featureCosts],
  );
  const openCreditsPage = useCallback(() => {
    navigate(buildEmbeddedHref("/credits", searchParams, shopFromUrl));
  }, [navigate, searchParams, shopFromUrl]);
  const pageSkipsCreditGates = shopSkipsCreditGates(storeDetails);

  const runPageGeneration = async () => {
    const template = readSelectedTemplate();
    const ready =
      Boolean(activeProduct) &&
      !productValidationMessage &&
      template >= 3 &&
      template <= 6;
    if (!ready) return;
    setStep(2);
    setIsGenerating(true);
    setGenerationStatus("in_progress");
    setGenerationError(null);
    setGeneratedContent(null);
    setCurrentGenerationStep(0);

    try {
      if (posthog && posthog.__loaded) {
        if (isOnboarding) {
          posthog.capture('onboarding_step_completed', {
            step_number: 4,
            step_name: 'product_configured',
            market_type: pdpMarketType,
          });
        }
      }
      const payload = await getSourceProductPayload();
      setCurrentGenerationStep(1);
      const response = await fetch("/api/generate-magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: payload.title,
          productDescription: payload.description,
          productImages: payload.productImages,
          storeName: payload.storeName,
          category: productCategory,
          productId: payload.productId,
          pageId,
          selectedTemplate: template,
          language: storeLanguage.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `API error: ${response.statusText}`);
      }
      const json = await response.json();
      const createdPageId = json?.page_id;
      if (!createdPageId) throw new Error("No page_id returned from generation API");
      setPageId(createdPageId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("pageId", createdPageId);
        return next;
      });
      setGenerationPercentage(20);
      setCurrentGenerationStep(2);

      await pollGenerationStatus(createdPageId);
    } catch (error) {
      setGenerationStatus("failed");
      setGenerationError(error?.message || "Generation failed.");
      setIsGenerating(false);
    }
  };

  const handleRetryGeneration = async () => {
    const timedOut = /timed out/i.test(generationError || "");
    if (timedOut && pageId) {
      setGenerationError(null);
      setGenerationStatus("in_progress");
      setIsGenerating(true);
      try {
        await pollGenerationStatus(pageId);
      } catch (error) {
        setGenerationStatus("failed");
        setGenerationError(error?.message || "Generation failed.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    void requestPageGenerationCredit();
  };

  const handleBackToParentScreen = useCallback(() => {
    setStep(1);
    setFlowType?.(null);
    if (hubPath) {
      navigate(buildEmbeddedHref(hubPath, searchParams, shopFromUrl));
    } else if (!isOnboarding) {
      setSearchParams({ flow: "dashboard" });
    }
  }, [hubPath, isOnboarding, navigate, searchParams, setFlowType, setSearchParams, shopFromUrl]);

  const productFlowPageBackLabel = hubPath === "/product-page" ? "Product pages" : "Back";

  if (isProcessingUrlPage) {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: embedded ? "320px" : "100vh",
          backgroundColor: "#f2f2f2",
        }}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 text-center shadow-sm ring-1 ring-slate-200/70">
          <Spinner accessibilityLabel="Loading" size="large" />
          <div>
            <p className="m-0 text-sm font-semibold text-slate-900">Loading...</p>
            <p className="m-0 mt-0.5 text-[13px] text-slate-500">Preparing your page</p>
          </div>
        </div>
      </Box>
    );
  }

  if (step === 2 && (isGenerating || generationStatus === "failed")) {
    const generationBody = (
      <BlockStack gap="400">
        <Suspense fallback={<Spinner accessibilityLabel="Loading generation step" size="large" />}>
          <ProductGenerationStep
            currentStepIndex={currentGenerationStep}
            isGenerating={isGenerating}
            generationPercentage={generationPercentage}
            generationStatus={generationStatus}
            generationError={generationError}
            onRetry={handleRetryGeneration}
          />
        </Suspense>
        {!isGenerating ? (
          <Panel>
            <div className="flex justify-center">
              <SecondaryButton onClick={() => setStep(1)}>Back to Configuration</SecondaryButton>
            </div>
          </Panel>
        ) : null}
      </BlockStack>
    );
    return (
      <s-page heading="Product pages" inlineSize="large">
        <CreditWalletWidget floating={false} slot="secondary-actions" />
        <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
          {embedded ? (
            <Box
              width="100%"
              style={{
                maxWidth: "1150px",
                marginInline: "auto",
                boxSizing: "border-box",
              }}
            >
              {generationBody}
            </Box>
          ) : (
            <Box
              width="100%"
              style={{
                maxWidth: "1150px",
                marginInline: "auto",
                boxSizing: "border-box",
              }}
            >
              <Page
                fullWidth
                backAction={{
                  content: "Configuration",
                  onAction: () => setStep(1),
                }}
                title="Generating your page"
                subtitle="Step 2 of 3"
              >
                {generationBody}
              </Page>
            </Box>
          )}
        </Box>
      </s-page>
    );
  }

  if (publishPayload) {
    return (
      <Suspense fallback={<Spinner accessibilityLabel="Loading publish step" size="large" />}>
        <ProductPublishStep
          payload={publishPayload}
          onBack={() => setPublishPayload(null)}
          onComplete={async () => {
            if (isOnboarding && onOnboardingComplete) {
              await onOnboardingComplete();
            }
            setFlowType?.(null);
            const destination = hubPath && !isOnboarding ? hubPath : "/";
            navigate(
              buildEmbeddedHref(destination, searchParams, searchParams.get("shop")),
              { replace: true }
            );
          }}
        />
      </Suspense>
    );
  }

  if (generationStatus === "completed" && generatedContent) {
    const resolvedProductImages = (() => {
      const page = pages.find((p) => String(p.PK) === String(pageId));
      const persistedOriginalImages = page?.original_content?.images;
      if (Array.isArray(persistedOriginalImages) && persistedOriginalImages.length) {
        return persistedOriginalImages;
      }
      if (selectedProduct) {
        const edges = selectedProduct?.images?.edges;
        if (Array.isArray(edges) && edges.length) {
          return edges.map((e) => e?.node?.url).filter(Boolean);
        }
        const featured = selectedProduct?.featuredImage?.url;
        if (featured) return [featured];
      }
      return Array.isArray(generatedContent?.original_content?.images)
        ? generatedContent.original_content.images
        : [];
    })();

    const previewEditor = (
      <Suspense fallback={<Spinner accessibilityLabel="Loading preview editor" size="large" />}>
        <ProductPreviewEditor
          selectedTemplate={
            asProductTemplate(templateSelectionRef.current) ??
            asProductTemplate(selectedTemplate) ??
            1
          }
          magicResponse={generatedContent}
          detectedCategory={productCategory}
          storeName={selectedProduct?.vendor || "Store"}
          pageId={pageId}
          productImages={resolvedProductImages}
          sourceProduct={selectedProduct}
          onBack={() => setStep(1)}
          pageChrome={
            embedded
              ? undefined
              : {
                  title: "Review & customize",
                  subtitle: "Step 3 of 3",
                  backAction: { content: "Configuration", onAction: () => setStep(1) },
                }
          }
          onPublishToShopify={(updatedContent) => {

            setPublishPayload({
              productId: selectedProduct?.id || null,
              category: productCategory,
              magicResponse: { ...generatedContent, ...updatedContent },
              selectedColor: updatedContent?.selected_color || generatedContent?.selected_color || null,
              productTitle: selectedProduct?.title || "Product",
              productDescription: selectedProduct?.description || "",
              productHandle: selectedProduct?.handle || null,
              pageId,
              selectedTemplate: readSelectedTemplate() ?? selectedTemplate,
            });
            if (posthog && posthog.__loaded) {
              if (isOnboarding) {
                posthog.capture('onboarding_step_completed', {
                  step_number: 6,
                  step_name: 'push_screen',
                });
              }
            }
          }}
          isPublished={isPublished}
        />
      </Suspense>
    );

    if (embedded) {
      return previewEditor;
    }

    return (
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto" width="100%">
        <Box
          width="100%"
          style={{
            maxWidth: "1150px",
            marginInline: "auto",
            boxSizing: "border-box",
          }}
        >
          {previewEditor}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <AppBridgeModal
        id="product-liquid-preview-modal"
        variant="max"
        open={isProductDemoModalOpen}
        onHide={closeProductDemoModal}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
          }}
        >
          <div
            style={{
              border: "1px solid #e1e3e5",
              borderBottom: "none",
              background: "#ffffff",
              height: "52px",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: "7px",
              position: "relative",
              zIndex: 20,
              flexShrink: 0,
            }}
          >
            <InlineStack gap="150" blockAlign="center">
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#ff5f57",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#febc2e",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#28c840",
                  display: "inline-block",
                }}
              />
              <DemoPreviewBadge />
            </InlineStack>
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "auto",
                zIndex: 30,
              }}
            >
              <div
                role="tablist"
                aria-label="Preview page"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  padding: 3,
                  borderRadius: 999,
                  background: "#f1f2f3",
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected
                  style={{
                    border: "none",
                    cursor: "default",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                    background: "#ffffff",
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                  }}
                >
                  Product
                </button>
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                zIndex: 31,
              }}
              role="group"
              aria-label="Preview device"
            >
              {[
                { mode: "desktop", icon: DesktopIcon, label: "Web" },
                { mode: "mobile", icon: MobileIcon, label: "Mobile" },
              ].map(({ mode, icon: IconSource, label }) => {
                const isActive = modalPreviewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-label={`${label} preview`}
                    aria-pressed={isActive}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalPreviewMode(mode);
                    }}
                    style={{
                      border: "none",
                      background: isActive ? "#1e3a8a" : "transparent",
                      color: isActive ? "#ffffff" : "#6b7280",
                      borderRadius: 999,
                      width: 32,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <Icon source={IconSource} tone={isActive ? "inherit" : "subdued"} />
                  </button>
                );
              })}
            </div>
          </div>
          <DemoPreviewDisclaimer subject="product page" />
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              background: modalPreviewMode === "mobile" ? "#f3f4f6" : "#ffffff",
              padding: modalPreviewMode === "mobile" ? "16px 12px" : 0,
            }}
          >
            <div
              style={{
                width: modalPreviewMode === "mobile" ? 390 : "100%",
                minWidth: modalPreviewMode === "mobile" ? 390 : 0,
                maxWidth: modalPreviewMode === "mobile" ? 390 : "100%",
                minHeight: modalPreviewMode === "mobile" ? "100%" : undefined,
                height: "auto",
                flexShrink: 0,
                overflow: "visible",
                borderRadius: modalPreviewMode === "mobile" ? 16 : 0,
                boxShadow:
                  modalPreviewMode === "mobile"
                    ? "0 8px 24px rgba(0,0,0,0.12)"
                    : "none",
                background: "#ffffff",
              }}
            >
              {(isProductDemoModalOpen || productDemoWarmed) &&
              (demoSelectedTemplate === 1 ||
                demoSelectedTemplate === 2 ||
                demoSelectedTemplate === 3 ||
                demoSelectedTemplate === 4 ||
                demoSelectedTemplate === 5 ||
                demoSelectedTemplate === 6) ? (
                <>
                    <div
                    style={{
                      display: demoSelectedTemplate === 1 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 1}
                  >
                    <LiquidPreviewRender
                      templateRows={sleekTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={sleekPreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                  <div
                    style={{
                      display: demoSelectedTemplate === 2 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 2}
                  >
                    <LiquidPreviewRender
                      templateRows={vibeTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={vibePreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                  <div
                    style={{
                      display: demoSelectedTemplate === 3 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 3}
                  >
                    <LiquidPreviewRender
                      templateRows={glowTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={glowPreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                  <div
                    style={{
                      display: demoSelectedTemplate === 4 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 4}
                  >
                    <LiquidPreviewRender
                      templateRows={lumenTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={lumenPreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                  <div
                    style={{
                      display: demoSelectedTemplate === 5 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 5}
                  >
                    <LiquidPreviewRender
                      templateRows={noirTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={noirPreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                  <div
                    style={{
                      display: demoSelectedTemplate === 6 ? "block" : "none",
                      height: "auto",
                    }}
                    aria-hidden={demoSelectedTemplate !== 6}
                  >
                    <LiquidPreviewRender
                      templateRows={frostTemplateRows}
                      previewMode={modalPreviewMode}
                      selectedSection={null}
                      storeName={null}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      minHeight="1200px"
                      previewCacheKey={frostPreviewCacheKey}
                      prebuiltHtmlUrl={null}
                      expandToContent
                    />
                  </div>
                </>
              ) : (
                <div
                  style={{
                    minHeight: "520px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {activeProduct && !productValidationMessage
                    ? "Select a template to enable preview"
                    : "Select Product to enable template preview"}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppBridgeModal>

      <Box
        className={
          embedded
            ? "bg-[#f2f2f2] overflow-x-hidden"
            : "bg-[#f2f2f2] overflow-y-auto overflow-x-hidden"
        }
      >
        <GenerateContainer
          style={{
            maxWidth: "1150px",
            paddingTop: 0,
            ...(embedded
              ? { height: "auto", minHeight: 0, overflowY: "visible" }
              : {}),
          }}
        >
          <style>{`
            .generate-flow-sticky-cta,
            .generate-flow-sticky-page-header {
              position: -webkit-sticky;
              position: sticky;
              top: 0;
              z-index: 200;
              background: #f2f2f2;
            }
          `}</style>
          <ProductConfigureStepShell
            embedded={embedded}
            backLabel={productFlowPageBackLabel}
            onBack={handleBackToParentScreen}
          >
          {embedded && !hideConfigurationHeading ? (
            <div
              className="generate-flow-sticky-page-header"
              style={{ padding: "14px 0 10px" }}
            >
              <StepHeading
                number={1}
                title="Configure product page"
                subtitle="Select a product, choose a template, and begin magic"
              />
            </div>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "24px",
              alignItems: "start",
              ...(isMobileLayout ? {} : { marginBlockStart: "12px" }),
            }}
          >
            <div
              className="min-w-0"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <BlockStack gap="300">
              <Panel
                icon={Package}
                title="Select your product"
                description="Choose one product from your Shopify store for this single-product experience."
              >
                <BlockStack gap="300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {selectedProduct ? (
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-11 w-11 flex-none overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                          <img
                            src={
                              selectedProduct?.featuredImage?.url ||
                              selectedProduct?.images?.edges?.[0]?.node?.url ||
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3C/svg%3E"
                            }
                            alt={selectedProduct?.title || "Selected product"}
                            width={44}
                            height={44}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="m-0 min-w-0 max-w-[280px] truncate text-sm font-medium text-slate-800">
                          {selectedProduct?.title || "Product selected"}
                        </p>
                      </div>
                    ) : (
                      <p className="m-0 text-[13px] text-slate-500">No product selected yet.</p>
                    )}
                    <SecondaryButton
                      onClick={() => setShowProductModal(true)}
                      className="w-full sm:w-auto"
                    >
                      {selectedProduct ? "Change product" : "Select product"}
                    </SecondaryButton>
                  </div>
                  {selectedProduct && productValidationMessage ? (
                    productValidationAlert
                  ) : null}

                  {selectedProduct ? (
                    <CategoryDetectRow
                      options={CATEGORY_OPTIONS}
                      value={productCategory}
                      onChange={handleManualProductCategoryChange}
                      detecting={detectingProductCategory}
                      detectedMessage={
                        categoryMatchPercentage !== null
                          ? `AI detected this product of ${selectedCategoryLabel} with ${categoryMatchPercentage}% confidence`
                          : null
                      }
                      onDetect={handleAutoDetectProductCategoryFromShopify}
                    />
                  ) : null}
                </BlockStack>
              </Panel>

              {activeProduct && !productValidationMessage ? (
                <Panel
                  icon={LayoutTemplate}
                  title="Template"
                  description="Pick a look for your product page. Preview it before you begin."
                >
                      <TemplateCardRail
                        visible={isMobileLayout ? 1.15 : 3}
                        activeIndex={PRODUCT_TEMPLATE_OPTIONS.findIndex((opt) => opt.id === selectedTemplate)}
                        label="Product page templates"
                      >
                        {PRODUCT_TEMPLATE_OPTIONS.map((opt) => {
                          const cardMedia = getProductTemplateCardMedia(opt);
                          return (
                            <ThemePreviewCard
                              key={opt.id}
                              title={opt.title}
                              badge={opt.badge || null}
                              blurb={opt.blurb}
                              creditCost={pageGenerationCost(opt.id)}
                              creditBalance={creditBalance}
                              onGetCredits={openCreditsPage}
                              skipCreditGate={pageSkipsCreditGates}
                              selected={selectedTemplate === opt.id}
                              onSelect={() => {
                                templateSelectionRef.current = opt.id;
                                setSelectedTemplate(opt.id);
                              }}
                              onBeginMagic={() => {
                                templateSelectionRef.current = opt.id;
                                setSelectedTemplate(opt.id);
                                void requestPageGenerationCredit();
                              }}
                              beginMagicDisabled={
                                !activeProduct || Boolean(productValidationMessage) || isGenerating
                              }
                              beginMagicLoading={isGenerating}
                              onPreview={() => openProductDemoModal(opt.id)}
                              templateRows={(premiumCardPreviews[opt.id] || premiumCardPreviews[3])[0]}
                              previewCacheKey={(premiumCardPreviews[opt.id] || premiumCardPreviews[3])[1]}
                              framePreviewUrl={null}
                              thumbUrl={cardMedia.thumbUrl}
                              prebuiltHtmlUrl={null}
                              hoverImageUrl={cardMedia.hoverImageUrl}
                              demoFamily="pdp"
                              demoVariant={cardMedia.demoVariant}
                              demoCategory={productCategory}
                            />
                          );
                        })}
                      </TemplateCardRail>
                </Panel>
              ) : null}

              </BlockStack>
            </div>

          </div>
          </ProductConfigureStepShell>
        </GenerateContainer>
      </Box>

      <ProductSelectionModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        onConfirm={(product) => {
          setSelectedProduct(product);
          setShowProductModal(false);
        }}
      />

      <CreditConfirmationModal
        open={pageGenCreditConfirmOpen}
        onClose={() => setPageGenCreditConfirmOpen(false)}
        onConfirm={() => {
          setPageGenCreditConfirmOpen(false);
          void runPageGeneration();
        }}
        featureKey={pageGenerationFeatureKey(productCategory, selectedTemplate)}
      />

    </>
  );
}

