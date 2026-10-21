import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getStoreThemeName } from "../../../lib/themeNames.js";
import { useAppBridge, Modal as AppBridgeModal } from "@shopify/app-bridge-react";
import { usePostHog } from "posthog-js/react";
import {
  ActionList,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Modal,
  Popover,
  RadioButton,
  Page,
  Select,
  Spinner,
  Text,
} from "@shopify/polaris";
import {
  DesktopIcon,
  MobileIcon,
  PlusIcon,
  HomeIcon,
  ProductIcon,
  CollectionIcon,
  AlertDiamondIcon,
  BlogIcon,
  ProfileIcon,
  PhoneIcon,
  QuestionCircleIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
} from "@shopify/polaris-icons";
import { useDashboardLoaderData } from "../../../lib/DashboardDataContext";
import { usePages } from "../../../lib/PagesContext.jsx";
import GenerateContainer from "../../_app.generate_pdp/utils/GenerateContainer.jsx";
import ProductSelectionModal from "../../../components/ProductSelectionModal.jsx";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget.jsx";
import { CreditConfirmationModal } from "../../../components/CreditConfirmationModal";
import LiquidPagePreview from "../../../components/theme-preview-editor/LiquidPagePreview.jsx";
import ThemePreviewCard from "../../../components/theme-preview-editor/ThemePreviewCard.jsx";
import {
  DemoPreviewBadge,
  DemoPreviewDisclaimer,
} from "../../../components/theme-preview-editor/DemoPreviewChromeLabels.jsx";
import { getCategoryTemplate1Defaults } from "../../../lib/categoryHomeDefaults.js";
import { getAmourAccentForCategory } from "./utils/liquid-schema-settings/packs/amour/categoryTheme.js";
import { LIQUID_PREVIEW_FONT_OPTIONS } from "../../../lib/liquidPreviewFontOptions.js";
import { getHomeDataForPreview } from "./utils/default-magic-responses/home-data.js";
import { buildLinenHomeProductPageData } from "./utils/buildLinenHomeProductPage.js";
import { buildPulseProductHomeData } from "./utils/buildPulseProductHomeData.js";
import { buildEclipseProductHomeData } from "./utils/buildEclipseProductHomeData.js";
import { buildVelvetHomeProductPageData } from "./utils/buildVelvetHomeProductPage.js";
import { buildLuminousHomeData, buildLuminousDemoProduct, buildLuminousDemoGridProducts } from "./utils/buildLuminousDemo.js";
import { buildPremiumMultiHomeData, buildPremiumMultiGridProducts } from "./utils/buildPremiumMultiHome.js";
import { resolveStoreProductPageData } from "./utils/buildStorePremiumPdpPreview.js";
import { STORE_COUNTRY_OPTIONS } from "./utils/storeCountryOptions.js";
import {
  getSupportedLanguage,
  mapShopLocaleToSupported,
} from "../../../lib/supportedLanguages.js";
import { useViewportBelowMd } from "../../../hooks/useViewportBelowMd.js";
import { buildEmbeddedHref } from "../../../lib/embeddedNavigation.js";
import { clearLiquidPreviewCache } from "../../../lib/liquidPreviewCache.js";
import {
  getDemoPreviewEyeThumbUrl,
  getDemoPreviewThumbUrl,
  getDemoPreviewUrl,
  resolveStoreDemoPairUrls,
  STORE_DEMO_VARIANTS,
} from "../../../lib/demoPreviewUrls.js";
import { useCredits } from "../../../lib/CreditsContext";
import {
  getStoreCreationCost,
  hasEnoughCredits,
  parseInsufficientCredits,
  shopSkipsCreditGates,
} from "../../../lib/credits";
import { shopifyAuthenticatedFetch } from "../../../lib/shopifyAuthenticatedFetch.js";
import {
  normalizeMarketType,
  syncPosthogMarketType,
} from "../../../lib/posthogMarketType.js";

const StoreGenerationStep = lazy(() => import("./StoreGenerationStep.jsx"));
const StorePublishStep = lazy(() => import("./StorePublishStep.jsx"));
const StorePreviewEditor = lazy(() => import("./StorePreviewEditor.jsx"));

const CATEGORY_OPTIONS = [
  { label: "Car Accessories", value: "car_accessories" },
  { label: "Fashion", value: "fashion" },
  { label: "Health & Beauty", value: "health_beauty" },
  { label: "Kids Toys", value: "kids_toys" },
  { label: "Home & Kitchen", value: "home_kitchen" },
  { label: "General", value: "general" },
];
const IMAGE_REGENERATE_FALLBACK_URL =
  "https://cdn.shopify.com/s/files/1/0670/3438/2430/files/ChatGPT_Image_Aug_7_2026_05_45_30_PM.png?v=1786106870";

function resolveStoreTypeFromMode(mode, fallbackStoreType) {
  if (mode === "multi_product") return "multi";
  if (mode === "single_product") return "single";
  return fallbackStoreType === "multi" ? "multi" : "single";
}

function withStoreImageFallbacks(generationData, effectiveStoreType, category) {
  if (!generationData || typeof generationData !== "object") return generationData;
  const defaultHome = getHomeDataForPreview(
    effectiveStoreType,
    category,
    generationData?.storeTemplatePack || generationData?.store_template_pack || "classic",
  );
  const defaultImages =
    defaultHome?.images && typeof defaultHome.images === "object" ? defaultHome.images : {};
  const incomingHomePage =
    generationData.home_page && typeof generationData.home_page === "object"
      ? generationData.home_page
      : {};
  const incomingImages =
    incomingHomePage.images && typeof incomingHomePage.images === "object"
      ? incomingHomePage.images
      : {};

  const nextImages = { ...incomingImages };
  for (const key of Object.keys(defaultImages)) {
    const current = nextImages[key];
    if (typeof current !== "string" || current.trim().length === 0) {
      nextImages[key] = IMAGE_REGENERATE_FALLBACK_URL;
    }
  }

  return {
    ...generationData,
    home_page: {
      ...incomingHomePage,
      images: nextImages,
    },
  };
}

const MULTI_PRIMARY_VIEWS = ["Home", "Product", "Collections"];
const SINGLE_PRIMARY_VIEWS = ["Home", "Product"];
const MORE_VIEW_OPTIONS = ["404", "FAQs", "Contact", "About Us"];
/** Product page liquid templates (same as Generate Product Page). */
const PRODUCT_TEMPLATE_LABELS = { 1: "Sleek", 2: "Vibe" };

/** Single store: Swift only (homepage checkout, no premium PDP). */
const PREPAID_CLASSIC_THEME_COMBO = {
  id: "prepaid-classic",
  pack: "classic",
  template: null,
  includePremium: false,
  title: "Swift",
  blurb: "Single-product store with on-page checkout — ready to launch",
  defaultView: "Home",
  cardPageType: "home-page",
};

/** Multi store: Swift only (store home, no premium PDPs). */
const MULTI_THEME_COMBOS = [
  {
    id: "luminous",
    includePremium: false,
    template: null,
    title: "Swift",
    blurb: "Multi-product storefront — homepage, collections, trust, FAQs, and reviews",
    defaultView: "Home",
    cardPageType: "home-page",
  },
];

const VIEW_ICONS = {
  Home: HomeIcon,
  Product: ProductIcon,
  Collections: CollectionIcon,
  "404": AlertDiamondIcon,
  FAQs: QuestionCircleIcon,
  Contact: PhoneIcon,
  "About Us": ProfileIcon,
};

const getViewIcon = (view) => VIEW_ICONS[view] ?? null;

/** Collect image URLs from Admin API product shape (featuredImage + images.edges), deduped. */
function collectProductImageUrls(product, max = 20) {
  if (!product) return [];
  const urls = [];
  const add = (u) => {
    if (typeof u !== "string" || !u.trim()) return;
    if (!urls.includes(u)) urls.push(u);
  };
  add(product.featuredImage?.url);
  const edges = product.images?.edges;
  if (Array.isArray(edges)) {
    for (const e of edges) {
      add(e?.node?.url);
      if (urls.length >= max) break;
    }
  }
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === "string") add(img);
      else add(img?.url);
      if (urls.length >= max) break;
    }
  }
  return urls.slice(0, max);
}

/** Swift homepage checkout demo — category photos and a fixed preview price. */
function buildSwiftDemoCheckoutProduct(homeData) {
  const images = homeData?.images || {};
  const text = homeData?.text || {};
  const title =
    (typeof text.banner_heading === "string" && text.banner_heading.trim()) ||
    "Featured Product";
  const urls = [
    images.product_image_1,
    images.product_image_2,
    images.product_image_3,
    images.feature_image,
    images.product_base_image,
  ].filter((url) => typeof url === "string" && url.trim().startsWith("http"));
  return {
    id: "demo-prepaid-home-product",
    title,
    description:
      (typeof text.checkout_product_details === "string" &&
        text.checkout_product_details.trim()) ||
      "",
    featuredImage: urls[0] ? { url: urls[0], altText: title } : null,
    images: {
      edges: urls.map((url) => ({ node: { url, altText: title } })),
    },
    variants: {
      edges: [
        {
          node: {
            id: "demo-variant",
            price: "29.99",
            compareAtPrice: "39.99",
          },
        },
      ],
    },
  };
}

function encodeFontValueForBackend(fontName) {
  return String(fontName || "").trim().replace(/\s+/g, "+");
}

/** `burhan-dev.myshopify.com` → `burhan-dev` for admin.shopify.com/store/{slug}/… */
function myshopifyDomainToAdminStoreSlug(shop) {
  const raw = (shop || "").toString().trim();
  if (!raw) return "";
  const normalized = raw.replace(/^https?:\/\//i, "").replace(/^\/+/, "").toLowerCase();
  const storePathMatch = normalized.match(/(?:^|\/)store\/([^/?#]+)/);
  if (storePathMatch?.[1]) return storePathMatch[1];
  const host = normalized.split("/")[0].trim();
  if (!host) return "";
  if (host.includes(".myshopify.com")) {
    return host.split(".")[0] || "";
  }
  return host;
}

function getAdminStoreSlugFromLocation() {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/store\/([^/]+)/i);
  return match?.[1] ? String(match[1]).trim().toLowerCase() : "";
}

function extractShopifyResourceNumericId(rawId) {
  const value = String(rawId || "").trim();
  if (!value) return "";
  const match = value.match(/(\d+)(?!.*\d)/);
  return match ? match[1] : "";
}

function toIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || "").trim()).filter(Boolean);
}

function parseStorePageProductIds(page, generationData) {
  const singleIdCandidates = [
    page?.product_id,
    page?.productId,
    generationData?.product_id,
    generationData?.productId,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const multiIdCandidates = [
    ...toIdList(page?.product_ids),
    ...toIdList(page?.productIds),
    ...toIdList(page?.selected_product_ids),
    ...toIdList(page?.selectedProductIds),
    ...toIdList(generationData?.product_ids),
    ...toIdList(generationData?.productIds),
    ...toIdList(generationData?.selected_product_ids),
    ...toIdList(generationData?.selectedProductIds),
  ];

  return {
    singleId: singleIdCandidates[0] || null,
    multiIds: Array.from(new Set(multiIdCandidates)),
  };
}

function productMatchesSavedId(product, rawId) {
  if (!product || !rawId) return false;
  const productId = String(product?.id || "").trim();
  if (!productId) return false;
  if (productId === rawId) return true;
  return extractShopifyResourceNumericId(productId) === extractShopifyResourceNumericId(rawId);
}

function getProductValidationMessage(product) {
  if (!product) return "No product selected yet.";
  if (!String(product?.title || "").trim()) return "Selected product must have a title.";
  const rawDescription = product?.descriptionHtml || product?.description || "";
  if (!String(rawDescription).trim()) return "Selected product must have a description.";
  if (collectProductImageUrls(product, 1).length < 1) {
    return "Selected product must have at least 1 image.";
  }
  return null;
}

function themeRoleLabel(role) {
  const map = {
    MAIN: "Live",
    UNPUBLISHED: "Unpublished",
    DEVELOPMENT: "Development",
    DEMO: "Demo",
    LOCKED: "Locked",
  };
  return map[role] || String(role || "").replace(/_/g, " ");
}

const STORE_GENERATION_STEPS = [
  "Preparing your products",
  "Generating home page content",
  "Generating product page content",
];

// Category → color palette (single dynamic color options). Only this color changes in schemes.
const CATEGORY_COLOR_PALETTES = {
  car_accessories: ["#0F2C6B", "#2563EB", "#059669", "#0F172A"],
  fashion: ["#626E4E", "#3B0764", "#EC4899", "#7C3AED"],
  health_beauty: ["#E2B4B3", "#10B981", "#14B8A6", "#059669"],
  kids_toys: ["#BCA38F", "#EA580C", "#84CC16", "#026326"],
  home_kitchen: ["#6c4e2d", "#A855F7", "#6366F1", "#4F46E5"],
  general: ["#64748B", "#2563EB", "#EA580C", "#1F2937"],
};

const FONT_OPTIONS = LIQUID_PREVIEW_FONT_OPTIONS;
const TYPOGRAPHY_STYLE_PRESETS = [
  {
    id: "bold-minimal",
    title: "Bold & Minimal",
    description: "Clean lines, maximum impact on every product page.",
    headingFont: "Montserrat",
    bodyFont: "Inter",
    badgeLabel: "Clean",
  },
  {
    id: "timeless-craft",
    title: "Timeless Craft",
    description: "Elegant serif tones for premium brands and collections.",
    headingFont: "Playfair Display",
    bodyFont: "Lora",
    badgeLabel: "Premium",
  },
  {
    id: "less-is-more",
    title: "Less is more",
    description: "Let your products speak. Typography stays out of the way.",
    headingFont: "Poppins",
    bodyFont: "Roboto",
    badgeLabel: "Neutral",
  },
  {
    id: "story-first",
    title: "Story First",
    description: "Magazine-style pairing for brands with a strong voice.",
    headingFont: "Merriweather",
    bodyFont: "Open Sans",
    badgeLabel: "Bold",
  },
  {
    id: "sharp-smart",
    title: "Sharp & Smart",
    description: "Built for gadgets, electronics, and modern product lines.",
    headingFont: "Archivo",
    bodyFont: "Manrope",
    badgeLabel: "Precise",
  },
  {
    id: "rooted-real",
    title: "Rooted & Real",
    description: "Artisan, handmade, heritage - for stores with character.",
    headingFont: "Cormorant Garamond",
    bodyFont: "Nunito Sans",
    badgeLabel: "Character",
  },
];

/** Brand-ads style configure shell. Sticky header keeps Begin Magic visible while scrolling. */
function StoreConfigureStepShell({
  embedded,
  backLabel,
  onBack,
  primaryAction,
  title = "Configure entire store",
  subtitle = "Step 1 of 3",
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
      <div
        className="generate-flow-sticky-page-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "#f2f2f2",
          padding: "12px 0 16px",
          marginBottom: 8,
          borderBottom: "1px solid #e1e3e5",
        }}
      >
        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <button
              type="button"
              aria-label={backLabel || "Back"}
              onClick={onBack}
              style={{
                border: "none",
                background: "transparent",
                padding: 4,
                margin: 0,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                color: "#202223",
                flexShrink: 0,
              }}
            >
              <Icon source={ArrowLeftIcon} tone="base" />
            </button>
            <BlockStack gap="100">
              <Text as="h1" variant="headingLg" fontWeight="semibold">
                {title}
              </Text>
              {subtitle ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  {subtitle}
                </Text>
              ) : null}
            </BlockStack>
          </InlineStack>
          {primaryAction ? (
            <div style={{ flexShrink: 0 }}>{primaryAction}</div>
          ) : null}
        </InlineStack>
      </div>
        <BlockStack gap="400">{children}</BlockStack>
    </Box>
  );
}

export default function StoreFlowStructure({
  hideConfigurationHeading = false,
  embedded = false,
  /** When embedded (onboarding), reports {@link WhatsComingCard} timeline steps 4–6. */
  onFlowStepChange,
  isOnboarding = false,
  onOnboardingComplete,
  /** When set, publish complete navigates here (e.g. `/entire-store`) instead of `?flow=dashboard`. */
  hubPath = null,
  /** Hub route: call with `null` to close the flow when URL has no `pageId` (matches {@link ProductFlowStructure} `setFlowType`). */
  setFlowType: setFlowTypeProp = undefined,
  /** Prefill COD/prepaid, country, language (from onboarding / Preferences / parent). */
  initialMarketPreferences = null,
}) {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIdFromUrl = searchParams.get("pageId");
  const entireStoreFromUrl = searchParams.get("entireStore");
  const shopFromUrl = searchParams.get("shop") ?? "";
  const {
    pages: pagesFromContext = [],
    refreshPages,
    fetchPages,
    storeDetails,
  } = usePages();
  const hydratedStorePageFromUrlRef = useRef(false);
  const {
    products = [],
    locales: shopLocales = [],
    marketPreferences: shopMarketPreferences = null,
    updateMarketPreferences,
  } = useDashboardLoaderData() || {};
  const {
    refresh: refreshCreditsWallet,
    hasActivePurchase,
    storeCreationCosts,
    balance: creditBalance,
  } = useCredits();

  const resolvedInitialPrefs = initialMarketPreferences || shopMarketPreferences;

  const [step, setStep] = useState(1);
  /** @type {"cod" | "prepaid" | null} */
  const [marketType, setMarketType] = useState(() => {
    const mt =
      resolvedInitialPrefs?.market_type || resolvedInitialPrefs?.marketType || null;
    return mt === "cod" || mt === "prepaid" ? mt : null;
  });
  const [countryCode, setCountryCode] = useState(() => {
    const cc =
      resolvedInitialPrefs?.country_code || resolvedInitialPrefs?.countryCode || null;
    return cc ? String(cc).toUpperCase() : null;
  });
  const [storeCategory, setStoreCategory] = useState("general");
  const [storeType, setStoreType] = useState(null);
  const [activePreviewTabIndex, setActivePreviewTabIndex] = useState(0);
  const [detectingStoreCategory, setDetectingStoreCategory] = useState(false);
  const [categoryMatchPercentage, setCategoryMatchPercentage] = useState(null);
  const handleManualStoreCategoryChange = useCallback((nextCategory) => {
    setStoreCategory(nextCategory);
    setCategoryMatchPercentage(null);
    setSelectedMoreView("");
    setActivePreviewTabIndex(0); // Home — category affects entire-store demo
    setDemoPinnedCategory(null); // cards/eye follow the newly selected category demo store
  }, []);
  const [selectedDynamicColor, setSelectedDynamicColor] = useState(
    CATEGORY_COLOR_PALETTES.general[0]
  );
  const [headingFont, setHeadingFont] = useState(() =>
    getCategoryTemplate1Defaults("general").headingFont
  );
  const [bodyFont, setBodyFont] = useState(() =>
    getCategoryTemplate1Defaults("general").bodyFont
  );
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  /** After first eye open, keep Home/Product iframes mounted so reopen has no spinner. */
  const [demoPreviewWarmed, setDemoPreviewWarmed] = useState(false);
  /** Freeze demo CDN category while eye modal is open (auto-detect must not thrash URLs). */
  const [demoPinnedCategory, setDemoPinnedCategory] = useState(null);
  /** Modal device frame: desktop (default) | mobile — owned by the eye-modal only. */
  const [modalPreviewMode, setModalPreviewMode] = useState("desktop");
  /** Home | Product inside the eye-modal (independent of page tab index). */
  const [modalPageView, setModalPageView] = useState("Home");
  /**
   * Optional overrides while the eye-icon demo modal is open so a theme can be
   * previewed before / without changing the selected radio.
   * `productOnly: true` = Sleek/Vibe product templates (no Home tab).
   * @type {{ pack?: string, template?: number, includePremium?: boolean|null, view?: string, productOnly?: boolean } | null}
   */
  const [themeDemoOverride, setThemeDemoOverride] = useState(null);
  const isMobileLayout = useViewportBelowMd();
  const [isSingleProductModalOpen, setIsSingleProductModalOpen] = useState(false);
  const [isMultiProductModalOpen, setIsMultiProductModalOpen] = useState(false);
  const [selectedSingleProduct, setSelectedSingleProduct] = useState(null);
  const [selectedMultiProducts, setSelectedMultiProducts] = useState([]);
  /** Premium PDP: 1 = Sleek, 2 = Vibe. Set via store theme combo (not a separate step). */
  const [selectedProductTemplate, setSelectedProductTemplate] = useState(null);
  /**
   * Theme chosen by the card's Begin Magic click. Written synchronously so
   * generation does not wait for the selection state to re-render.
   * @type {React.MutableRefObject<{ pack: string, includePremium: boolean, template: number|null } | null>}
   */
  const themeSelectionRef = useRef(null);
  /** Homepage pack: classic (default) | cinematic (single-product themes). */
  const [storeTemplatePack, setStoreTemplatePack] = useState("classic");
  /**
   * Multi only: null = not chosen yet; true = store + 3 premium PDPs (900);
   * false = store only, no premium PDPs (300).
   */
  const [multiIncludePremiumPdps, setMultiIncludePremiumPdps] = useState(null);
  const [selectedMoreView, setSelectedMoreView] = useState("");
  const [isMoreViewsPopoverOpen, setIsMoreViewsPopoverOpen] = useState(false);
  const [isModalMoreViewsPopoverOpen, setIsModalMoreViewsPopoverOpen] = useState(false);
  const [headingFontPopoverOpen, setHeadingFontPopoverOpen] = useState(false);
  const [bodyFontPopoverOpen, setBodyFontPopoverOpen] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState(null);
  const [isGeneratingStore, setIsGeneratingStore] = useState(false);
  const [storeGenCreditConfirmOpen, setStoreGenCreditConfirmOpen] = useState(false);
  const [currentStoreGenerationStep, setCurrentStoreGenerationStep] = useState(0);
  const [storeGenerationSucceeded, setStoreGenerationSucceeded] = useState(false);
  const [storeGenerationPageId, setStoreGenerationPageId] = useState(null);
  const [storeGenerationPercentage, setStoreGenerationPercentage] = useState(0);
  const [storeGenerationStatus, setStoreGenerationStatus] = useState("idle");
  const [storeGenerationData, setStoreGenerationData] = useState(null);
  const [storeGenerationError, setStoreGenerationError] = useState(null);
  const [isPublishingStore, setIsPublishingStore] = useState(false);
  const [publishStoreError, setPublishStoreError] = useState(null);
  const [publishStoreSucceeded, setPublishStoreSucceeded] = useState(false);
  /** Backend blocks multi-store generation and all publish until a credit pack is purchased. */
  const [purchaseRequiredSurface, setPurchaseRequiredSurface] = useState(null);
  /** When true, step 2 shows {@link StorePublishStep} instead of the template preview editor. */
  const [entireStorePublishViewOpen, setEntireStorePublishViewOpen] = useState(false);
  /** Snapshot captured when merchant clicks Publish on the editor (home + styles for publish). */
  const [pendingPublishSnapshot, setPendingPublishSnapshot] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return (
      resolvedInitialPrefs?.language ||
      resolvedInitialPrefs?.store_language ||
      null
    );
  });
  const [isManualFontsEnabled, setIsManualFontsEnabled] = useState(false);
  const topFiveProducts = useMemo(() => (products || []).slice(0, 5), [products]);

  const selectedMultiProductsSafe = useMemo(
    () => (Array.isArray(selectedMultiProducts) ? selectedMultiProducts : []),
    [selectedMultiProducts]
  );
  const multiProductsForStore = useMemo(
    () => selectedMultiProductsSafe.slice(0, 3),
    [selectedMultiProductsSafe]
  );
  const multiProductsSelectionKey = useMemo(
    () => multiProductsForStore.map((p) => String(p?.id || "")).filter(Boolean).join("|"),
    [multiProductsForStore],
  );
  /** Multi featured products list (premium PDPs only when Collective theme is selected). */
  const codPremiumProductsForStore = useMemo(() => {
    if (storeType !== "multi") return [];
    return multiProductsForStore;
  }, [storeType, multiProductsSelectionKey]);
  /** Product switcher: only the 3 selected products (premium PDPs). */
  const codMultiProductSwitcherList = useMemo(() => multiProductsForStore, [multiProductsSelectionKey]);
  const configureProductForPreview = useMemo(() => {
    if (storeType === "multi") {
      return selectedProductForPreview ?? multiProductsForStore[0] ?? topFiveProducts[0] ?? null;
    }
    return selectedSingleProduct;
  }, [
    storeType,
    selectedProductForPreview?.id,
    multiProductsSelectionKey,
    selectedSingleProduct?.id,
    topFiveProducts,
  ]);
  const configureUsePremiumProductPage = useMemo(() => {
    // The Collective: always premium Sleek/Vibe (demo works before products are picked).
    // Luminous: simple product.json only.
    if (storeType === "multi") {
      return multiIncludePremiumPdps === true;
    }
    // Single premium themes (Linen/Pulse/Eclipse/Velvet). Classic prepaid = false.
    if (storeType === "single") {
      return selectedProductTemplate === 1 || selectedProductTemplate === 2;
    }
    return false;
  }, [
    storeType,
    multiIncludePremiumPdps,
    selectedProductTemplate,
  ]);
  const configureProductPageData = useMemo(() => {
    if (!configureUsePremiumProductPage) return null;
    return resolveStoreProductPageData(
      {
        product_pages: storeGenerationData?.product_pages,
        product_page: storeGenerationData?.product_page,
      },
      configureProductForPreview,
      storeType === "multi" ? multiProductsForStore : null,
    );
  }, [
    configureUsePremiumProductPage,
    storeGenerationData?.product_pages,
    storeGenerationData?.product_page,
    configureProductForPreview?.id,
    multiProductsSelectionKey,
    storeType,
  ]);
  /** Style + templates only after the merchant has finished product selection. */
  const hasStoreProductsSelected =
    storeType === "multi"
      ? multiProductsForStore.length === 3
      : storeType === "single"
        ? Boolean(selectedSingleProduct)
        : false;
  const singleProductValidationMessage = useMemo(
    () => (selectedSingleProduct ? getProductValidationMessage(selectedSingleProduct) : null),
    [selectedSingleProduct],
  );
  const invalidMultiProducts = useMemo(
    () =>
      multiProductsForStore.filter((product) => getProductValidationMessage(product) !== null),
    [multiProductsForStore],
  );
  const invalidMultiProductDetails = useMemo(
    () =>
      invalidMultiProducts.map((product) => ({
        product,
        message: getProductValidationMessage(product),
      })),
    [invalidMultiProducts],
  );
  const hasMultiProductValidationErrors = invalidMultiProductDetails.length > 0;
  const currentStoreValidationMessage =
    storeType === "single"
      ? singleProductValidationMessage
      : storeType === "multi"
        ? hasMultiProductValidationErrors
          ? "One or more selected products are invalid."
          : null
        : null;
  const validationProductForEdit =
    storeType === "single"
      ? selectedSingleProduct
      : storeType === "multi"
        ? invalidMultiProducts[0] ?? null
        : null;
  const editStoreProductAdminUrl = useMemo(() => {
    const productNumericId = extractShopifyResourceNumericId(validationProductForEdit?.id);
    const storeSlug =
      myshopifyDomainToAdminStoreSlug(shopFromUrl) || getAdminStoreSlugFromLocation();
    if (!productNumericId || !storeSlug) return "";
    return `https://admin.shopify.com/store/${storeSlug}/products/${productNumericId}`;
  }, [validationProductForEdit, shopFromUrl]);
  const canShowEditProductButton = Boolean(validationProductForEdit?.id);
  const renderStoreProductValidationAlert = (message, product) => (message ? (
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
          {message}
        </Text>
      </InlineStack>
      {canShowEditProductButton && product?.id ? (
        <Button
          variant="plain"
          onClick={() => {
            const productNumericId = extractShopifyResourceNumericId(product?.id);
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
  ) : null);
  const singleStoreProductValidationAlert = renderStoreProductValidationAlert(
    singleProductValidationMessage,
    selectedSingleProduct,
  );
  const primaryViews = useMemo(() => {
    const base = storeType === "multi" ? MULTI_PRIMARY_VIEWS : SINGLE_PRIMARY_VIEWS;
    return [...base, ...MORE_VIEW_OPTIONS];
  }, [storeType]);

  const selectEntireStoreDemoPreview = useCallback(() => {
    setSelectedMoreView("");
    setActivePreviewTabIndex(0); // Home
  }, []);

  /** One click sets homepage pack + Sleek/Vibe, or Classic prepaid (no premium PDP). */
  const selectSingleThemeCombo = useCallback((combo) => {
    const includePremium = combo.includePremium !== false;
    themeSelectionRef.current = {
      pack: combo.pack || "classic",
      includePremium,
      template: includePremium ? (combo.template === 2 ? 2 : 1) : null,
    };
    setStoreTemplatePack(combo.pack || "classic");
      setSelectedMoreView("");
    if (combo.includePremium === false) {
      setSelectedProductTemplate(null);
      setActivePreviewTabIndex(0);
      return;
    }
    setSelectedProductTemplate(combo.template === 2 ? 2 : 1);
    if (combo.defaultView === "Product") {
      const productIdx = SINGLE_PRIMARY_VIEWS.indexOf("Product");
      setActivePreviewTabIndex(productIdx >= 0 ? productIdx : 1);
    } else {
      setActivePreviewTabIndex(0);
    }
  }, []);

  /** One click sets Swift multi (store-only). */
  const selectMultiThemeCombo = useCallback((combo) => {
    const includePremium = combo.includePremium === true;
    themeSelectionRef.current = {
      pack: "classic",
      includePremium,
      template: includePremium ? (combo.template === 2 ? 2 : 1) : null,
    };
    setMultiIncludePremiumPdps(combo.includePremium);
    setSelectedMoreView("");
    if (!combo.includePremium) {
      setSelectedProductTemplate(null);
      setActivePreviewTabIndex(0);
      return;
    }
    setSelectedProductTemplate(combo.template === 2 ? 2 : 1);
    const productIdx = MULTI_PRIMARY_VIEWS.indexOf("Product");
    setActivePreviewTabIndex(productIdx >= 0 ? productIdx : 1);
    if (!selectedProductForPreview && multiProductsForStore.length > 0) {
      setSelectedProductForPreview(multiProductsForStore[0]);
    }
  }, [selectedProductForPreview, multiProductsForStore]);

  // v2: only Swift — auto-select once products are chosen.
  useEffect(() => {
    if (!hasStoreProductsSelected) return;
    if (storeType === "single") {
      selectSingleThemeCombo(PREPAID_CLASSIC_THEME_COMBO);
    } else if (storeType === "multi") {
      selectMultiThemeCombo(MULTI_THEME_COMBOS[0]);
    }
  }, [
    hasStoreProductsSelected,
    storeType,
    selectSingleThemeCombo,
    selectMultiThemeCombo,
  ]);

  const openThemeDemoModal = useCallback(
    ({
      pack,
      template,
      includePremium,
      view = "Home",
      productOnly = false,
      category = null,
    } = {}) => {
      const override = { view, productOnly: Boolean(productOnly) };
      if (pack !== undefined) override.pack = pack;
      if (template !== undefined) override.template = Number(template) === 2 ? 2 : 1;
      if (includePremium !== undefined) override.includePremium = includePremium;
      setThemeDemoOverride(override);
      setSelectedMoreView("");
      const isHomeOnlyDemo = includePremium === false && !productOnly;
      const nextView =
        productOnly || (!isHomeOnlyDemo && view === "Product") ? "Product" : "Home";
      setModalPageView(nextView);
      const views = storeType === "multi" ? MULTI_PRIMARY_VIEWS : SINGLE_PRIMARY_VIEWS;
      const idx = views.indexOf(nextView);
      setActivePreviewTabIndex(idx >= 0 ? idx : 0);
      setModalPreviewMode("desktop");
      // Demo HTML/thumbs follow the merchant-selected store category.
      const cat = String(category || storeCategory || "general").trim() || "general";
      setDemoPinnedCategory(cat);
      setDemoPreviewWarmed(true);
      setIsPreviewModalOpen(true);
    },
    [storeType, storeCategory],
  );

  const closeThemeDemoModal = useCallback(() => {
    // Keep themeDemoOverride so warmed Home/Product iframes don't remount
    // with a different CDN URL (that flash is the reopen spinner).
    setIsPreviewModalOpen(false);
    setModalPreviewMode("desktop");
    setModalPageView("Home");
  }, []);

  // Every eye open: pin preview to the top (never land mid-page on checkout).
  useEffect(() => {
    if (!isPreviewModalOpen) return undefined;
    const pin = () => {
      try {
        const root = document.getElementById("my-modal");
        const iframes = root?.querySelectorAll?.("iframe") || [];
        iframes.forEach((iframe) => {
          try {
            iframe.contentWindow?.scrollTo?.(0, 0);
            const doc = iframe.contentDocument;
            if (doc?.documentElement) doc.documentElement.scrollTop = 0;
            if (doc?.body) doc.body.scrollTop = 0;
          } catch {
            // ignore
          }
        });
        const scroller = root?.querySelector?.('[style*="overflow"]');
        if (scroller && "scrollTop" in scroller) scroller.scrollTop = 0;
      } catch {
        // ignore
      }
    };
    pin();
    const t1 = setTimeout(pin, 50);
    const t2 = setTimeout(pin, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isPreviewModalOpen, modalPageView]);

  const demoStoreTemplatePack =
    themeDemoOverride && "pack" in themeDemoOverride && themeDemoOverride.pack != null
      ? themeDemoOverride.pack
      : storeTemplatePack;
  const demoSelectedProductTemplate =
    themeDemoOverride && "template" in themeDemoOverride && themeDemoOverride.template != null
      ? Number(themeDemoOverride.template) === 2
        ? 2
        : 1
      : selectedProductTemplate;
  const demoMultiIncludePremiumPdps =
    themeDemoOverride && "includePremium" in themeDemoOverride
      ? themeDemoOverride.includePremium
      : multiIncludePremiumPdps;
  const demoProductOnly = Boolean(themeDemoOverride?.productOnly);
  /** Classic prepaid single: homepage-only demo (no Product tab). */
  const singleIncludePremiumPdps =
    selectedProductTemplate === 1 || selectedProductTemplate === 2;
  const demoSingleIncludePremium =
    themeDemoOverride && "includePremium" in themeDemoOverride
      ? themeDemoOverride.includePremium !== false
      : singleIncludePremiumPdps;
  const demoHomeOnly =
    !demoProductOnly &&
    storeType === "single" &&
    demoSingleIncludePremium === false;
  /** Homepage checkout only on Classic prepaid. Linen/Pulse/Eclipse/Velvet match COD. */
  const demoHomeOmitsCheckout =
    storeType === "single" && demoSingleIncludePremium === true;
  const currentStorePage = useMemo(() => {
    if (!storeGenerationPageId || !Array.isArray(pagesFromContext)) return null;
    return pagesFromContext.find((pg) => String(pg.PK) === String(storeGenerationPageId)) ?? null;
  }, [pagesFromContext, storeGenerationPageId]);

  const storeProductRehydratedRef = useRef(false);

  // On edit/resume after refresh, restore selected product(s) from saved page ids.
  // Falls back to /api/product-details when the product isn't in the dashboard list.
  useEffect(() => {
    if (!currentStorePage) return;
    if (storeProductRehydratedRef.current) return;

    const persistedGenerationData =
      currentStorePage?.generation_data || storeGenerationData || null;
    const { singleId, multiIds } = parseStorePageProductIds(
      currentStorePage,
      persistedGenerationData,
    );

    const allIds =
      storeType === "single"
        ? [singleId || multiIds[0]].filter(Boolean)
        : storeType === "multi"
          ? multiIds.slice(0, 3)
          : [];

    if (allIds.length === 0) return;

    const alreadySelected =
      storeType === "single"
        ? Boolean(selectedSingleProduct)
        : storeType === "multi"
          ? selectedMultiProducts.length > 0
          : true;
    if (alreadySelected) return;

    storeProductRehydratedRef.current = true;

    const resolveProduct = async (gid) => {
      const localMatch = (products || []).find((p) => productMatchesSavedId(p, gid));
      if (localMatch) return localMatch;
      try {
        const res = await fetch(
          `/api/product-details?productId=${encodeURIComponent(gid)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.product) return data.product;
        }
      } catch { /* fall through */ }
      return null;
    };

    (async () => {
      if (storeType === "single") {
        const product = await resolveProduct(allIds[0]);
        if (product) setSelectedSingleProduct(product);
      } else if (storeType === "multi") {
        const resolved = (await Promise.all(allIds.map(resolveProduct))).filter(Boolean);
        if (resolved.length > 0) setSelectedMultiProducts(resolved);
      }
    })();
  }, [
    currentStorePage,
    products,
    storeType,
    selectedSingleProduct,
    selectedMultiProducts.length,
    storeGenerationData,
  ]);

  /** After publish-store, page is live; Save should hit /api/update-publish-store instead of update-generated-content. */
  const storePagePublished = useMemo(() => {
    return Boolean(currentStorePage?.published) || publishStoreSucceeded;
  }, [currentStorePage, publishStoreSucceeded]);

  /** Theme editor in Shopify Admin (live theme from generated page record). Shop slug: page.user_id matches shop id (same as ?shop= slug). */
  const shopifyThemeEditorUrl = useMemo(() => {
    if (!storePagePublished) return "";
    const themeId =
      currentStorePage?.theme_id ??
      currentStorePage?.themeId ??
      storeGenerationData?.theme_id ??
      storeGenerationData?.themeId ??
      null;
    const shopIdRaw =
      currentStorePage?.user_id ??
      currentStorePage?.userId ??
      shopFromUrl ??
      "";
    const slug = myshopifyDomainToAdminStoreSlug(
      shopIdRaw != null && shopIdRaw !== "" ? String(shopIdRaw) : "",
    );
    if (!slug || themeId == null || String(themeId).trim() === "") return "";
    return `https://admin.shopify.com/store/${slug}/themes/${themeId}/editor`;
  }, [storePagePublished, currentStorePage, storeGenerationData, shopFromUrl]);

  const currentPreviewView = selectedMoreView || primaryViews[activePreviewTabIndex] || "Home";

  // Cinematic pack only changes the homepage. Product / FAQ / Contact / About / 404
  // match classic (premium PDP + entire-store liquids + classic demo images).
  const configureDemoHomeLiquidPreviewType = useMemo(() => {
    if (
      storeType === "single" &&
      String(demoStoreTemplatePack || "").toLowerCase() === "cinematic"
    ) {
      return "cinematic-home";
    }
    return "entire-store";
  }, [storeType, demoStoreTemplatePack]);

  const configureDemoHomeData = useMemo(() => {
    let packForView =
      storeType === "single" ? demoStoreTemplatePack || "classic" : "classic";
    // Classic prepaid theme (no premium PDP) → dedicated demo assets.
    if (
      storeType === "single" &&
      (marketType || "prepaid") === "prepaid" &&
      demoSingleIncludePremium === false &&
      String(packForView).toLowerCase() === "classic"
    ) {
      packForView = "classic-prepaid";
    }
    const cat =
      (isPreviewModalOpen || demoPreviewWarmed) && demoPinnedCategory
        ? demoPinnedCategory
        : storeCategory;
    const isPrepaidSinglePulse =
      storeType === "single" &&
      demoSingleIncludePremium === true &&
      String(demoStoreTemplatePack || "classic").toLowerCase() === "classic" &&
      Number(demoSelectedProductTemplate) === 2;
    if (isPrepaidSinglePulse) return buildPulseProductHomeData(cat);
    const isPrepaidSingleEclipse =
      storeType === "single" &&
      demoSingleIncludePremium === true &&
      String(demoStoreTemplatePack || "").toLowerCase() === "cinematic" &&
      Number(demoSelectedProductTemplate) === 1;
    if (isPrepaidSingleEclipse) return buildEclipseProductHomeData(cat);
    const isPrepaidLuminous =
      storeType === "multi" &&
      demoMultiIncludePremiumPdps === false;
    if (isPrepaidLuminous) {
      const luminousHome = buildLuminousHomeData(cat);
      if (luminousHome) return luminousHome;
    }
    const isPremiumMulti =
      storeType === "multi" && demoMultiIncludePremiumPdps === true;
    if (isPremiumMulti) {
      const premiumHome = buildPremiumMultiHomeData(cat, demoSelectedProductTemplate);
      if (premiumHome) return premiumHome;
    }
    return getHomeDataForPreview(storeType, cat, packForView);
  }, [
    storeType,
    marketType,
    storeCategory,
    demoStoreTemplatePack,
    demoSelectedProductTemplate,
    demoSingleIncludePremium,
    demoMultiIncludePremiumPdps,
    isPreviewModalOpen,
    demoPreviewWarmed,
    demoPinnedCategory,
  ]);

  const configureDemoCategory = useMemo(() => {
    if ((isPreviewModalOpen || demoPreviewWarmed) && demoPinnedCategory) {
      return demoPinnedCategory;
    }
    return storeCategory;
  }, [
    isPreviewModalOpen,
    demoPreviewWarmed,
    demoPinnedCategory,
    storeCategory,
  ]);

  const configureDemoHomeStoreTemplatePack = useMemo(() => {
    if (storeType === "single") {
      return demoStoreTemplatePack || "classic";
    }
    return "classic";
  }, [storeType, demoStoreTemplatePack]);

  const linenHomeProductPageData = useMemo(() => {
    const isPrepaidSingleLinen =
      storeType === "single" &&
      demoSingleIncludePremium === true &&
      String(demoStoreTemplatePack || "classic").toLowerCase() === "classic" &&
      Number(demoSelectedProductTemplate) !== 2;
    if (!isPrepaidSingleLinen) return null;
    return buildLinenHomeProductPageData(configureDemoCategory);
  }, [
    storeType,
    marketType,
    demoSingleIncludePremium,
    demoStoreTemplatePack,
    demoSelectedProductTemplate,
    configureDemoCategory,
  ]);

  const velvetHomeProductPageData = useMemo(() => {
    const isPrepaidSingleVelvet =
      storeType === "single" &&
      demoSingleIncludePremium === true &&
      String(demoStoreTemplatePack || "").toLowerCase() === "cinematic" &&
      Number(demoSelectedProductTemplate) === 2;
    if (!isPrepaidSingleVelvet) return null;
    return buildVelvetHomeProductPageData(configureDemoCategory);
  }, [
    storeType,
    marketType,
    demoSingleIncludePremium,
    demoStoreTemplatePack,
    demoSelectedProductTemplate,
    configureDemoCategory,
  ]);

  const luminousDemoProduct = useMemo(() => {
    const isPrepaidLuminous =
      storeType === "multi" &&
      demoMultiIncludePremiumPdps === false;
    if (!isPrepaidLuminous) return null;
    return buildLuminousDemoProduct(configureDemoCategory);
  }, [
    storeType,
    demoMultiIncludePremiumPdps,
    configureDemoCategory,
  ]);

  const luminousDemoGridProducts = useMemo(() => {
    const isPrepaidLuminous =
      storeType === "multi" &&
      demoMultiIncludePremiumPdps === false;
    if (!isPrepaidLuminous) return null;
    return buildLuminousDemoGridProducts(configureDemoCategory);
  }, [
    storeType,
    demoMultiIncludePremiumPdps,
    configureDemoCategory,
  ]);

  const premiumMultiGridProducts = useMemo(() => {
    if (storeType !== "multi" || demoMultiIncludePremiumPdps !== true) return null;
    return buildPremiumMultiGridProducts(
      configureDemoCategory,
      demoSelectedProductTemplate,
    );
  }, [
    storeType,
    demoMultiIncludePremiumPdps,
    configureDemoCategory,
    demoSelectedProductTemplate,
  ]);

  const configureDemoUsePremiumProductPage = useMemo(() => {
    // Collective eye/demo: premium PDP even before merchant picks products.
    if (storeType === "multi") {
      return demoMultiIncludePremiumPdps === true;
    }
    if (storeType === "single") return demoSingleIncludePremium === true;
    return false;
  }, [
    storeType,
    demoMultiIncludePremiumPdps,
    demoSingleIncludePremium,
  ]);

  /** Prebuilt S3 HTML for eye-modal — Home + Product kept mounted (Forge-style). */
  const configureDemoPrebuiltPair = useMemo(
    () =>
      resolveStoreDemoPairUrls({
        storeType,
        marketType: marketType || "prepaid",
        storeCategory:
          (isPreviewModalOpen || demoPreviewWarmed) && demoPinnedCategory
            ? demoPinnedCategory
            : storeCategory,
        pack: demoStoreTemplatePack,
        productTemplate: demoSelectedProductTemplate,
        includePremium:
          storeType === "multi"
            ? demoMultiIncludePremiumPdps
            : demoSingleIncludePremium,
      }),
    [
      storeType,
      marketType,
      storeCategory,
      demoPinnedCategory,
      isPreviewModalOpen,
      demoPreviewWarmed,
      demoStoreTemplatePack,
      demoSelectedProductTemplate,
      demoMultiIncludePremiumPdps,
      demoSingleIncludePremium,
    ],
  );

  const configureDemoPrebuiltHtmlUrlHome = configureDemoPrebuiltPair.home;
  const configureDemoPrebuiltHtmlUrlProduct = configureDemoPrebuiltPair.product;

  // Cards are on screen: build the live eye now, so Preview only reveals it.
  useEffect(() => {
    if (step !== 1) return;
    setDemoPreviewWarmed(true);
  }, [step]);

  // Swift: homepage-only (selectedProductTemplate null). Legacy premium = 1/2.
  const hasSingleThemeSelected =
    storeType !== "single" ||
    selectedProductTemplate === 1 ||
    selectedProductTemplate === 2 ||
    selectedProductTemplate == null;
  const needsProductTemplateChoice =
    (storeType === "single" && singleIncludePremiumPdps) ||
    (storeType === "multi" && multiIncludePremiumPdps === true);
  const isStartDisabled =
    !marketType ||
    !countryCode ||
    !storeType ||
    (storeType === "single" ? !selectedSingleProduct : multiProductsForStore.length !== 3) ||
    (storeType === "multi" && multiIncludePremiumPdps == null) ||
    !hasSingleThemeSelected ||
    (needsProductTemplateChoice && selectedProductTemplate !== 1 && selectedProductTemplate !== 2) ||
    Boolean(currentStoreValidationMessage);

  const storeCreationCost = useMemo(
    () =>
      getStoreCreationCost(
        storeType,
        marketType,
        storeCreationCosts,
        storeType === "single" ? storeTemplatePack : "classic",
        storeType === "multi"
          ? multiIncludePremiumPdps === true
          : storeType === "single"
            ? singleIncludePremiumPdps
            : true,
        storeType === "single" ? selectedProductTemplate : null,
      ),
    [
      storeType,
      marketType,
      storeCreationCosts,
      storeTemplatePack,
      multiIncludePremiumPdps,
      singleIncludePremiumPdps,
      selectedProductTemplate,
    ],
  );

  const colorPalette = useMemo(
    () => CATEGORY_COLOR_PALETTES[storeCategory] ?? CATEGORY_COLOR_PALETTES.general,
    [storeCategory]
  );

  useEffect(() => {
    if (!pageIdFromUrl) return;
    fetchPages?.(1000, 0).catch(() => { });
  }, [pageIdFromUrl, fetchPages]);
  const selectedCategoryLabel = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === storeCategory)?.label || "General",
    [storeCategory],
  );

  useEffect(() => {
    // Amour uses category-tuned accents (kids/fashion bright; beauty dark wine).
    if (storeTemplatePack === "amour") {
      setSelectedDynamicColor(getAmourAccentForCategory(storeCategory));
      return;
    }
    if (colorPalette.length > 0) {
      setSelectedDynamicColor(colorPalette[0]);
    }
  }, [storeCategory, colorPalette, storeTemplatePack]);

  useEffect(() => {
    const defaults = getCategoryTemplate1Defaults(storeCategory);
    setHeadingFont(defaults.headingFont);
    setBodyFont(defaults.bodyFont);
  }, [storeCategory]);

  // When Product tab is selected, set product for preview
  useEffect(() => {
    if (currentPreviewView !== "Product") return;
    if (storeType === "single") {
      setSelectedProductForPreview(selectedSingleProduct);
    } else {
      setSelectedProductForPreview(multiProductsForStore[0] ?? null);
    }
  }, [currentPreviewView, storeType, selectedSingleProduct, multiProductsForStore]);

  useEffect(() => {
    const allFontsToLoad = Array.from(
      new Set([
        ...FONT_OPTIONS,
        ...TYPOGRAPHY_STYLE_PRESETS.flatMap((preset) => [preset.headingFont, preset.bodyFont]),
      ]),
    );
    const query = allFontsToLoad
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
      .join("&");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const stylePreferences = useMemo(
    () => ({
      dynamicColor: selectedDynamicColor,
      headingFont,
      bodyFont,
    }),
    [selectedDynamicColor, headingFont, bodyFont]
  );

  /** Shared LiquidPagePreview props for theme cards (fixed page/pack per option). */
  const buildThemeCardPreviewProps = useCallback(
    ({
      pageType = "home-page",
      pack = "classic",
      template = 1,
      includePremium = null,
      category = null,
    } = {}) => {
      const isProduct = pageType === "product-page";
      const usePremium =
        includePremium === true ||
        (includePremium == null &&
          isProduct &&
          ((storeType === "single" && singleIncludePremiumPdps) ||
            (storeType === "multi" && multiIncludePremiumPdps === true)));
      const liquidPreviewType =
        isProduct && usePremium
          ? "landing-page"
          : pageType === "home-page" &&
              storeType === "single" &&
              includePremium !== false &&
              String(pack).toLowerCase() === "cinematic"
            ? "cinematic-home"
            : "entire-store";
      const previewCategory = category || storeCategory;
      return {
        productType: storeType === "multi" ? "multi-product" : "single-product",
        marketType: marketType || "prepaid",
        pageType,
        selectedTemplate: Number(template) === 2 ? 2 : 1,
        usePremiumProductPage: isProduct ? usePremium : false,
        // Theme picker cards: category demo layout only — never merchant product photos.
        productPageData: null,
        productData: null,
        collectionProducts:
          pageType === "home-page" && storeType === "multi"
            ? includePremium === false
              ? buildLuminousDemoGridProducts(previewCategory)
              : buildPremiumMultiGridProducts(previewCategory, template) ||
                (multiProductsForStore.length > 0
                  ? multiProductsForStore
                  : products || []
                ).slice(0, 3)
            : null,
        detectedCategory: previewCategory,
        stylePreferences,
        liquidPreviewType,
        storeTemplatePack: pack || "classic",
        omitCheckoutBlocks: includePremium === true,
        homeData: (() => {
          if (pageType === "home-page" && storeType === "multi" && includePremium === false) {
            const luminousHome = buildLuminousHomeData(previewCategory);
            if (luminousHome) return luminousHome;
          }
          if (pageType === "home-page" && storeType === "multi" && includePremium === true) {
            const premiumHome = buildPremiumMultiHomeData(previewCategory, template);
            if (premiumHome) return premiumHome;
          }
          if (pageType === "home-page" && storeType === "single" && includePremium !== false) {
            if (String(pack).toLowerCase() === "classic" && Number(template) === 2) {
              const pulseHome = buildPulseProductHomeData(previewCategory);
              if (pulseHome) return pulseHome;
            }
            if (String(pack).toLowerCase() === "cinematic" && Number(template) === 1) {
              const eclipseHome = buildEclipseProductHomeData(previewCategory);
              if (eclipseHome) return eclipseHome;
            }
          }
          return getHomeDataForPreview(
            storeType,
            previewCategory,
            pageType === "home-page" && storeType === "single"
              ? includePremium === false
                ? String(pack).toLowerCase() === "amour"
                  ? "amour"
                  : "classic-prepaid"
                : pack
              : "classic",
          );
        })(),
      };
    },
    [
      storeType,
      marketType,
      singleIncludePremiumPdps,
      multiIncludePremiumPdps,
      multiProductsForStore,
      products,
      storeCategory,
      stylePreferences,
    ],
  );

  const selectedTypographyPresetId = useMemo(() => {
    const match = TYPOGRAPHY_STYLE_PRESETS.find(
      (preset) => preset.headingFont === headingFont && preset.bodyFont === bodyFont,
    );
    return match?.id ?? null;
  }, [headingFont, bodyFont]);

  const handleStoreStylePreferencesChange = useCallback((next) => {
    if (next?.dynamicColor != null) setSelectedDynamicColor(next.dynamicColor);
    if (next?.headingFont != null) setHeadingFont(next.headingFont);
    if (next?.bodyFont != null) setBodyFont(next.bodyFont);
  }, []);

  const handleHomePageDataChange = useCallback((nextHome) => {
    setStoreGenerationData((prev) => ({
      ...(prev || {}),
      home_page: nextHome,
    }));
  }, []);

  const storePreviewProductImages = useMemo(() => {
    const urls = [];
    const addUnique = (url) => {
      if (typeof url !== "string" || !url.trim()) return;
      if (!urls.includes(url)) urls.push(url);
    };
    const appendMany = (list, max = Infinity) => {
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (typeof item === "string") addUnique(item);
        else addUnique(item?.url ?? item?.src ?? item?.preview_image);
        if (urls.length >= max) break;
      }
    };

    if (storeType === "single" && selectedSingleProduct) {
      appendMany(collectProductImageUrls(selectedSingleProduct), 24);
    }
    if (storeType === "multi" && multiProductsForStore.length > 0) {
      for (const p of multiProductsForStore) {
        appendMany(collectProductImageUrls(p, 20), 24);
        if (urls.length >= 24) break;
      }
    }

    // Match product-flow behavior on edit/resume: include persisted original images
    // so regenerate modal still shows the original references even without selection state.
    appendMany(currentStorePage?.original_content?.images, 24);
    appendMany(storeGenerationData?.original_content?.images, 24);
    appendMany(currentStorePage?.generation_data?.original_content?.images, 24);

    return urls.slice(0, 24);
  }, [
    storeType,
    selectedSingleProduct,
    multiProductsForStore,
    currentStorePage,
    storeGenerationData,
  ]);

  // Language helpers (shared with Settings / onboarding)
  const primaryLocaleCode = shopLocales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = useMemo(
    () => mapShopLocaleToSupported(primaryLocaleCode),
    [primaryLocaleCode],
  );

  const effectiveLanguageValue = selectedLanguage || primarySupportedValue;
  const effectiveLanguageLabel = getSupportedLanguage(effectiveLanguageValue).name;

  const applyMarketPreferences = useCallback(
    (prefs) => {
      if (!prefs) return;
      const mt = prefs.market_type || prefs.marketType;
      const cc = prefs.country_code || prefs.countryCode;
      const lang = prefs.language || prefs.store_language;
      if (mt === "cod" || mt === "prepaid") setMarketType(mt);
      if (cc) setCountryCode(String(cc).toUpperCase());
      if (lang) setSelectedLanguage(lang);
    },
    [],
  );

  // Always load latest prefs from API when opening store configure (app-data can be stale).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop-market-preferences");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const prefs = data?.preferences || data;
        if (!prefs) return;
        applyMarketPreferences(prefs);
        updateMarketPreferences?.(prefs);
      } catch {
        // Fall back to context / prop prefill below.
        if (!cancelled) {
          applyMarketPreferences(shopMarketPreferences || initialMarketPreferences);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only refresh; context updates are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally refresh on mount
  }, []);

  // Keep in sync when Preferences saves and updates dashboard context.
  useEffect(() => {
    if (!shopMarketPreferences) return;
    applyMarketPreferences(shopMarketPreferences);
  }, [shopMarketPreferences, applyMarketPreferences]);

  useEffect(() => {
    syncPosthogMarketType(posthog, marketType);
  }, [posthog, marketType]);

  const normalizeStoreCategory = (categoryValue) => {
    if (!categoryValue) return null;
    const normalized = String(categoryValue).trim().toLowerCase().replaceAll(" ", "_");
    const isValid = CATEGORY_OPTIONS.some((option) => option.value === normalized);
    return isValid ? normalized : null;
  };

  /** Poll `/api/generation-status/:pageId` until completed, failed, or timeout (shared by Start + URL resume). */
  const pollStoreGenerationStatus = useCallback(async (pageId) => {
    if (!pageId) return;
    const pollIntervalMs = 5000;
    // Home + up to 3 premium PDPs + collections is sequential image gen; 5m was too short.
    const maxWaitMs = 20 * 60 * 1000;
    const startedAt = Date.now();

    while (true) {
      // Fresh session token each poll — Shopify JWTs expire in ~60s.
      // A rejected token must not stop the run; generation continues on the server.
      let statusRes = null;
      let statusData = null;
      try {
        statusRes = await shopifyAuthenticatedFetch(
        shopify,
        `/api/generation-status/${pageId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
        statusData = await statusRes.json().catch(() => null);
      } catch {
        statusRes = null;
      }

      if (!statusRes?.ok) {
        if (Date.now() - startedAt > maxWaitMs) {
          setStoreGenerationSucceeded(false);
          setStoreGenerationStatus("failed");
          setStoreGenerationError(
            statusRes?.status === 401
              ? "Session expired while generating. Reload the app and try again."
              : statusData?.error || "Generation timed out. Please try again.",
          );
          break;
        }
        if (statusRes && statusRes.status !== 401 && statusRes.status !== 0) {
        throw new Error(statusData?.error || `Status check failed: ${statusRes.statusText}`);
        }
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        continue;
      }

      const status = (statusData?.generation_status || "").toLowerCase();
      const percentageRaw =
        statusData?.generation_percentage ?? statusData?.percentage;
      const percentageNum =
        typeof percentageRaw === "string"
          ? parseFloat(percentageRaw)
          : percentageRaw;

      if (typeof percentageNum === "number" && !Number.isNaN(percentageNum)) {
        const clamped = Math.min(Math.max(0, percentageNum), 100);
        // Keep progress non-decreasing so early stale 0% polls don't jump backward.
        setStoreGenerationPercentage((prev) => Math.max(prev, clamped));
        const idx = Math.round(
          (clamped / 100) * (STORE_GENERATION_STEPS.length - 1),
        );
        setCurrentStoreGenerationStep(idx);
      }

      if (status === "completed") {
        const genData = statusData?.generation_data || {};
        setStoreGenerationData(
          withStoreImageFallbacks(
            genData,
            resolveStoreTypeFromMode(genData?.mode, "single"),
            statusData?.category || "general"
          )
        );
        setStoreGenerationSucceeded(true);
        setStoreGenerationStatus("completed");
        setStoreGenerationPercentage(100);
        if (genData?.style_preferences) {
          setBodyFont(genData.style_preferences.body_font);
          setHeadingFont(genData.style_preferences.heading_font);
          setSelectedDynamicColor(genData.style_preferences.selected_color);
        }
        setCurrentStoreGenerationStep(STORE_GENERATION_STEPS.length - 1);
        if (posthog && posthog.__loaded) {
          const generatedStoreType = resolveStoreTypeFromMode(
            genData?.mode,
            "single",
          );
          const generatedPremiumIds =
            genData?.premium_product_ids || genData?.premiumProductIds || [];
          const generatedPack = String(
            genData?.storeTemplatePack || genData?.store_template_pack || "classic",
          ).toLowerCase();
          const generatedTemplate = Number(
            genData?.selectedTemplate ?? genData?.selected_template ?? 1,
          );
          posthog.capture("store_generated", {
            theme_name: getStoreThemeName({
              storeType: generatedStoreType,
              pack: generatedPack,
              template: generatedTemplate,
              includePremium: Array.isArray(generatedPremiumIds) && generatedPremiumIds.length > 0,
            }),
            store_template_pack: generatedPack,
            template: generatedTemplate,
            category: statusData?.category || null,
            store_type: generatedStoreType,
            mode:
              generatedStoreType === "multi"
                ? "multi_product"
                : "single_product",
            page_id: pageId,
            is_onboarding: Boolean(isOnboarding),
            market_type: normalizeMarketType(
              genData?.market_type || genData?.marketType,
            ),
          });
          if (isOnboarding) {
            posthog.capture('onboarding_step_completed', {
              step_number: 5,
              step_name: 'content_generated',
              flow: 'store',
              store_type: generatedStoreType,
              market_type: normalizeMarketType(
                genData?.market_type || genData?.marketType,
              ),
            });
          }
        }
        sessionStorage.setItem(
          "storeGenerateForStoreResult",
          JSON.stringify({
            ...statusData,
            page_id: statusData?.page_id ?? statusData?.pageId ?? pageId,
          }),
        );
        break;
      }

      if (status === "failed") {
        setStoreGenerationSucceeded(false);
        setStoreGenerationStatus("failed");
        setStoreGenerationError("Generation failed. Please try again.");
        break;
      }

      if (Date.now() - startedAt > maxWaitMs) {
        setStoreGenerationSucceeded(false);
        setStoreGenerationStatus("failed");
        setStoreGenerationError("Generation timed out. Please try again.");
        break;
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }, [shopify, posthog, isOnboarding]);

  const pollStorePublishStatus = useCallback(async (pageId) => {
    if (!pageId) {
      return {
        success: false,
        error:
          "Missing page or generation data. Save your template preview or run generation again.",
      };
    }
    const pollIntervalMs = 5000;
    const maxWaitMs = 15 * 60 * 1000;
    const startedAt = Date.now();

    while (true) {
      let statusRes = null;
      let statusData = null;
      try {
        statusRes = await shopifyAuthenticatedFetch(
          shopify,
          `/api/generation-status/${pageId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        statusData = await statusRes.json().catch(() => null);
      } catch {
        statusRes = null;
      }

      const publishStatus = String(statusData?.publish_status || "").toLowerCase();
      const published =
        statusData?.published === true ||
        statusData?.published === "true" ||
        statusData?.published === 1;

      if (statusRes?.ok) {
        if (publishStatus === "in_progress") {
          // Keep waiting even if a previous publish left published=true.
        } else if (publishStatus === "completed" || published) {
          return { success: true, data: statusData };
        } else if (publishStatus === "failed") {
          return {
            success: false,
            error: statusData?.publish_error || "Failed to publish store",
          };
        }
      }

      if (Date.now() - startedAt > maxWaitMs) {
        return {
          success: false,
          error: "Still publishing — refresh in a minute.",
        };
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }, [shopify]);

  /** Resume / edit from hub: `/entire-store?pageId=…&entireStore=1` (embedded query params preserved). */
  useEffect(() => {
    if (hydratedStorePageFromUrlRef.current || !pageIdFromUrl || !Array.isArray(pagesFromContext) || pagesFromContext.length === 0) {
      return;
    }
    const page = pagesFromContext.find((p) => String(p.PK) === String(pageIdFromUrl));
    if (!page) return;

    const isStorePage =
      page.generation_type === "store" ||
      entireStoreFromUrl === "1" ||
      String(entireStoreFromUrl || "").toLowerCase() === "true";
    if (!isStorePage) return;

    hydratedStorePageFromUrlRef.current = true;

    const normalizedCat = normalizeStoreCategory(page.category);
    if (normalizedCat) setStoreCategory(normalizedCat);

    const mode = page?.mode;
    if (mode === "multi_product" || page.store_type === "multi") {
      setStoreType("multi");
    } else if (mode === "single_product" || page.store_type === "single") {
      setStoreType("single");
    }

    const genData = page.generation_data || null;
    const hydratedMarket =
      page.market_type || page.marketType || genData?.market_type || genData?.marketType || null;
    if (hydratedMarket === "cod" || hydratedMarket === "prepaid") {
      setMarketType(hydratedMarket);
    }
    const hydratedCountry =
      page.country_code || page.countryCode || genData?.country_code || genData?.countryCode || null;
    if (hydratedCountry) {
      setCountryCode(String(hydratedCountry).toUpperCase());
    }
    const hydratedTemplate = Number(
      page.selectedTemplate ??
        page.selected_template ??
        genData?.selectedTemplate ??
        genData?.selected_template ??
        0,
    );
    if (hydratedTemplate === 1 || hydratedTemplate === 2) {
      setSelectedProductTemplate(hydratedTemplate);
    }
    const hydratedPack = String(
      page.storeTemplatePack ||
        page.store_template_pack ||
        genData?.storeTemplatePack ||
        genData?.store_template_pack ||
        "",
    )
      .trim()
      .toLowerCase();
    if (hydratedPack === "classic" || hydratedPack === "cinematic" || hydratedPack === "amour") {
      setStoreTemplatePack(hydratedPack);
    }
    // Amour is homepage-only: keep the card selected and premium PDP off on reload.
    if (hydratedPack === "amour") {
      setSelectedProductTemplate(null);
      themeSelectionRef.current = { pack: "amour", includePremium: false, template: null };
    }
    const premiumIds =
      genData?.premiumProductIds ||
      genData?.premium_product_ids ||
      page.premiumProductIds ||
      page.premium_product_ids ||
      null;
    if (Array.isArray(premiumIds)) {
      setMultiIncludePremiumPdps(premiumIds.length > 0);
    }
    if (genData) {
      setStoreGenerationData(
        withStoreImageFallbacks(
          { ...genData, mode: page.mode },
          resolveStoreTypeFromMode(page.mode, storeType),
          page.category || storeCategory
        )
      );
      if (genData?.style_preferences) {
        setBodyFont(genData.style_preferences.body_font);
        setHeadingFont(genData.style_preferences.heading_font);
        setSelectedDynamicColor(genData.style_preferences.selected_color);
      }
    }
    setStoreGenerationPageId(page.PK);

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

    if (failed) {
      setStep(2);
      setStoreGenerationSucceeded(false);
      setStoreGenerationStatus("failed");
      setStoreGenerationError("Generation failed.");
      setIsGeneratingStore(false);
      return;
    }

    if (completed || (genData && !inFlight)) {
      // Edit generation opens the Roarr preview so merchants can edit colors/text and Save.
      // Use Configuration → Save & regenerate only when changing store type/theme/products.
      setStep(2);
      setStoreGenerationSucceeded(true);
      setStoreGenerationStatus("completed");
      setStoreGenerationPercentage(100);
      setCurrentStoreGenerationStep(STORE_GENERATION_STEPS.length - 1);
      setIsGeneratingStore(false);
      return;
    }

    if (inFlight) {
      setStep(2);
      setStoreGenerationSucceeded(false);
      setStoreGenerationError(null);
      setStoreGenerationStatus("in_progress");
      setIsGeneratingStore(true);

      const pctRaw = page.generation_percentage ?? page.generationPercentage;
      if (typeof pctRaw === "number" && !Number.isNaN(pctRaw)) {
        const clamped = Math.min(100, Math.max(0, pctRaw));
        setStoreGenerationPercentage(clamped);
        setCurrentStoreGenerationStep(
          Math.round((clamped / 100) * (STORE_GENERATION_STEPS.length - 1)),
        );
      } else {
        setStoreGenerationPercentage(0);
        setCurrentStoreGenerationStep(0);
      }

      try {
        sessionStorage.setItem(
          "storeGenerateForStoreResult",
          JSON.stringify({ page_id: page.PK, success: true }),
        );
      } catch {
        /* ignore */
      }

      void (async () => {
        try {
          await pollStoreGenerationStatus(page.PK);
        } catch (error) {
          console.error("Store generation poll (URL resume):", error);
          setStoreGenerationSucceeded(false);
          setStoreGenerationStatus("failed");
          setStoreGenerationError(error?.message || "Store generation failed");
          setStoreGenerationPercentage(0);
          setCurrentStoreGenerationStep(0);
        } finally {
          setIsGeneratingStore(false);
        }
      })();
    }
  }, [pageIdFromUrl, entireStoreFromUrl, pagesFromContext, pollStoreGenerationStatus]);

  const handleAutoDetectStoreCategory = async () => {
    if (topFiveProducts.length === 0) return;

    setDetectingStoreCategory(true);
    try {
      const response = await fetch("/api/detect-store-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: topFiveProducts.map((product) => ({
            title: product?.title || "",
            description: product?.description || "",
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to detect store category");
      }

      const data = await response.json();
      if (data?.success) {
        const normalizedCategory = normalizeStoreCategory(data.category);
        if (normalizedCategory) {
          setStoreCategory(normalizedCategory);
        }
        if (typeof data.confidence_percentage === "number") {
          setCategoryMatchPercentage(Number(data.confidence_percentage));
        }
      }
    } catch (error) {
      console.error("Error detecting store category:", error);
    } finally {
      setDetectingStoreCategory(false);
    }
  };

  const handleAutoDetectStoreCategoryFromSingle = useCallback(async () => {
    if (!selectedSingleProduct) return;

    setDetectingStoreCategory(true);
    try {
      const response = await fetch("/api/detect-store-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: [
            {
              title: selectedSingleProduct?.title || "",
              description:
                selectedSingleProduct?.description ||
                selectedSingleProduct?.descriptionHtml ||
                "",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to detect store category");
      }

      const data = await response.json();
      if (data?.success) {
        const normalizedCategory = normalizeStoreCategory(data.category);
        if (normalizedCategory) {
          setStoreCategory(normalizedCategory);
        }
        if (typeof data.confidence_percentage === "number") {
          setCategoryMatchPercentage(Number(data.confidence_percentage));
        }
      }
    } catch (error) {
      console.error("Error detecting store category:", error);
    } finally {
      setDetectingStoreCategory(false);
    }
  }, [selectedSingleProduct]);

  const handleAutoDetectStoreCategoryFromMulti = useCallback(async () => {
    if (!Array.isArray(multiProductsForStore) || multiProductsForStore.length === 0) {
      return;
    }

    setDetectingStoreCategory(true);
    try {
      const response = await fetch("/api/detect-store-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: multiProductsForStore
            .map((p) => ({
              title: p?.title || "",
              description: p?.description || p?.descriptionHtml || "",
            }))
            .filter((p) => String(p.title || "").trim().length > 0),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to detect store category");
      }

      const data = await response.json();
      if (data?.success) {
        const normalizedCategory = normalizeStoreCategory(data.category);
        if (normalizedCategory) {
          setStoreCategory(normalizedCategory);
        }
        if (typeof data.confidence_percentage === "number") {
          setCategoryMatchPercentage(Number(data.confidence_percentage));
        }
      }
    } catch (error) {
      console.error("Error detecting store category:", error);
    } finally {
      setDetectingStoreCategory(false);
    }
  }, [multiProductsForStore]);

  useEffect(() => {
    if (storeType !== "single" || !selectedSingleProduct) return;
    handleAutoDetectStoreCategoryFromSingle();
  }, [storeType, selectedSingleProduct, handleAutoDetectStoreCategoryFromSingle]);

  useEffect(() => {
    if (storeType !== "multi" || !multiProductsSelectionKey) return;
    handleAutoDetectStoreCategoryFromMulti();
  }, [storeType, multiProductsSelectionKey, handleAutoDetectStoreCategoryFromMulti]);

  const handleSaveStore = (updatedGenerationData) => {
    if (!storeGenerationPageId) return;
    const sp = updatedGenerationData.stylePreferences;
    setStoreGenerationData((prev) => ({
      ...(prev || {}),
      home_page: updatedGenerationData.homeData,
      ...(updatedGenerationData.productPageData
        ? { product_page: updatedGenerationData.productPageData }
        : {}),
      ...(Array.isArray(updatedGenerationData.productPages)
        ? { product_pages: updatedGenerationData.productPages }
        : {}),
      style_preferences: {
        selected_color: sp.dynamicColor,
        heading_font: sp.headingFont,
        body_font: sp.bodyFont,
      },
    }));

    const magicResponsePayload = {
      ...(storeGenerationData || {}),
      home_page: updatedGenerationData.homeData,
      ...(updatedGenerationData.productPageData
        ? { product_page: updatedGenerationData.productPageData }
        : {}),
      ...(Array.isArray(updatedGenerationData.productPages)
        ? { product_pages: updatedGenerationData.productPages }
        : {}),
      stylePreferences: {
        dynamicColor: sp.dynamicColor,
        headingFont: sp.headingFont,
        bodyFont: sp.bodyFont,
      },
      style_preferences: {
        selected_color: sp.dynamicColor,
        heading_font: sp.headingFont,
        body_font: sp.bodyFont,
      },
      dynamicColor: sp.dynamicColor,
      headingFont: sp.headingFont,
      bodyFont: sp.bodyFont,
    };

    const savePublished = () =>
      fetch("/api/update-publish-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: storeGenerationPageId,
          pageId: storeGenerationPageId,
          bodyFont: sp.bodyFont,
          headingFont: sp.headingFont,
          dynamicColor: sp.dynamicColor,
          stylePreferences: {
            dynamicColor: sp.dynamicColor,
            headingFont: sp.headingFont,
            bodyFont: sp.bodyFont,
          },
          magic_response: magicResponsePayload,
        }),
      });

    const saveDraft = () =>
      fetch("/api/update-generated-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: storeGenerationPageId,
          magicContent: {
            ...(storeGenerationData || {}),
            home_page: updatedGenerationData.homeData,
            ...(updatedGenerationData.productPageData
              ? { product_page: updatedGenerationData.productPageData }
              : {}),
            ...(Array.isArray(updatedGenerationData.productPages)
              ? { product_pages: updatedGenerationData.productPages }
              : {}),
            style_preferences: {
              selected_color: sp.dynamicColor,
              heading_font: sp.headingFont,
              body_font: sp.bodyFont,
            },
          },
        }),
      });

    (storePagePublished ? savePublished() : saveDraft())
      .then(async (response) => {
        let data = {};
        try {
          data = await response.json();
        } catch {
          /* ignore */
        }
        if (response.ok && data.success !== false) {
          shopify?.toast?.show("Saved updates successfully", { duration: 3000 });
          if (storePagePublished) {
            void refreshPages?.();
          }
        } else {
          const msg =
            (typeof data?.error === "string" && data.error) || "Failed to save updates";
          shopify?.toast?.show(msg, { duration: 5000, isError: true });
        }
      })
      .catch((error) => {
        console.error("Error saving content:", error);
        shopify?.toast?.show("Failed to save updates", {
          duration: 3000,
          isError: true,
        });
      });
  };

  const goToStep = async (nextStep) => {
    const container =
      typeof document !== "undefined"
        ? document.querySelector('[data-generate-container="true"]')
        : null;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
    setStep(nextStep);
  };

  const readThemeSelection = () => {
    if (themeSelectionRef.current) return themeSelectionRef.current;
    const includePremium =
      storeType === "multi"
        ? multiIncludePremiumPdps === true
        : selectedProductTemplate === 1 || selectedProductTemplate === 2;
    return {
      pack: storeType === "single" ? storeTemplatePack || "classic" : "classic",
      includePremium,
      template:
        selectedProductTemplate === 2
          ? 2
          : selectedProductTemplate === 1
            ? 1
            : null,
    };
  };

  const requestStoreGenerationCredit = async () => {
    const selectedPrimaryProduct =
      storeType === "single" ? selectedSingleProduct : topFiveProducts[0];
    const existingPageId = storeGenerationPageId || pageIdFromUrl || null;
    if (!selectedPrimaryProduct && !existingPageId) return;
    const selection = readThemeSelection();

    const wallet = await refreshCreditsWallet();
    const skipsCreditGates = shopSkipsCreditGates(storeDetails);
    const cost = getStoreCreationCost(
      storeType,
      marketType,
      wallet.storeCreationCosts ?? storeCreationCosts,
      storeType === "single" ? selection.pack || "classic" : "classic",
      storeType === "multi"
        ? selection.includePremium === true
        : storeType === "single"
          ? selection.includePremium === true
          : true,
      storeType === "single" ? selection.template : null,
    );

    if (
      storeType === "multi" &&
      selection.includePremium === true &&
      !skipsCreditGates &&
      !(wallet.hasActivePurchase ?? hasActivePurchase)
    ) {
      setPurchaseRequiredSurface("multi_generate");
      if (posthog && posthog.__loaded) {
        posthog.capture("purchase_required_modal_shown", {
          surface: "store_multi_generate",
          is_onboarding: Boolean(isOnboarding),
          market_type: normalizeMarketType(marketType),
        });
      }
      return;
    }

    // Editing an existing store reuses pageId — backend does not re-charge credits.
    if (
      existingPageId ||
      skipsCreditGates ||
      (wallet.ok && hasEnoughCredits(wallet.balance, cost))
    ) {
      void runStoreGeneration();
      return;
    }
    setStoreGenCreditConfirmOpen(true);
  };

  const runStoreGeneration = async () => {
    const selectedPrimaryProduct =
      storeType === "single" ? selectedSingleProduct : topFiveProducts[0];
    const existingPageId = storeGenerationPageId || pageIdFromUrl || null;
    if (!selectedPrimaryProduct && !existingPageId) return;

    clearLiquidPreviewCache();

    await goToStep(2);

    setStoreGenerationSucceeded(false);
    // Keep page id when regenerating so settings apply to the same store record.
    if (!existingPageId) {
    setStoreGenerationPageId(null);
    }
    setStoreGenerationPercentage(0);
    setStoreGenerationStatus("in_progress");
    setStoreGenerationData(null);
    setStoreGenerationError(null);
    setPublishStoreSucceeded(false);
    setPublishStoreError(null);
    setIsGeneratingStore(true);
    setCurrentStoreGenerationStep(0);

    try {
      const headingFontForBackend = encodeFontValueForBackend(headingFont);
      const bodyFontForBackend = encodeFontValueForBackend(bodyFont);
      const selection = readThemeSelection();
      const payload = {
        mode: storeType === "single" ? "single_product" : "multi_product",
        storeCategory,
        language: effectiveLanguageLabel,
        market_type: marketType || "prepaid",
        country_code: countryCode || null,
        selectedTemplate:
          storeType === "single" && !selection.includePremium
            ? 1
            : selection.template === 2
              ? 2
              : 1,
        storeTemplatePack:
          storeType === "single" ? selection.pack || "classic" : "classic",
        stylePreferences: {
          dynamicColor: selectedDynamicColor,
          headingFont: headingFontForBackend,
          bodyFont: bodyFontForBackend,
        },
        pageId: existingPageId,
        productIds:
          storeType === "single"
            ? [selectedPrimaryProduct?.id]
            : (multiProductsForStore || []).map((product) => product?.id),
        ...(storeType === "multi"
          ? {
              // With PDPs: all 3 selected products. Without: empty → store home only.
              premiumProductIds:
                selection.includePremium === true
                  ? (multiProductsForStore || []).map((product) => product?.id)
                  : [],
            }
          : storeType === "single"
            ? {
                // Classic prepaid: []. Linen/Pulse/Eclipse/Velvet: selected product.
                premiumProductIds: selection.includePremium
                  ? [selectedPrimaryProduct?.id].filter(Boolean)
                  : [],
            }
          : {}),
      };

      if (posthog && posthog.__loaded) {
        if (isOnboarding) {
          posthog.capture('onboarding_step_completed', {
            step_number: 4,
            step_name: 'store_configured',
            store_type: storeType === "multi" ? "multi" : "single",
            market_type: normalizeMarketType(marketType),
          });
        }
      }
      const response = await fetch("/api/generate-for-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const startData = await response.json().catch(() => null);

      if (!response.ok) {
        if (startData?.code === "purchase_required") {
          setPurchaseRequiredSurface("multi_generate");
          if (posthog && posthog.__loaded) {
            posthog.capture("purchase_required_modal_shown", {
              surface: "store_multi_generate",
              is_onboarding: Boolean(isOnboarding),
              market_type: normalizeMarketType(marketType),
            });
          }
          throw new Error(
            startData?.error ||
              "Purchase a credit pack to generate a multi-product store.",
          );
        }
        const insufficient = parseInsufficientCredits(response, startData);
        if (insufficient) {
          throw new Error(insufficient.message);
        }
        throw new Error(startData?.error || "Store generation failed to start");
      }

      const pageId = startData?.page_id ?? startData?.pageId ?? null;

      // Backward compatibility: if backend returns full generation_data immediately.
      if (!pageId && startData?.generation_data) {
        setStoreGenerationData(
          withStoreImageFallbacks(
            startData.generation_data,
            resolveStoreTypeFromMode(startData?.generation_data?.mode, "single"),
            startData?.category || "general"
          )
        );
        setStoreGenerationStatus("completed");
        setStoreGenerationSucceeded(true);
        setCurrentStoreGenerationStep(STORE_GENERATION_STEPS.length - 1);
        setStoreGenerationPercentage(100);
        sessionStorage.setItem(
          "storeGenerateForStoreResult",
          JSON.stringify(startData),
        );
        return;
      }

      if (!pageId) {
        throw new Error(startData?.error || "Backend did not return page_id for async generation");
      }

      setStoreGenerationPageId(pageId);
      setStoreGenerationStatus("in_progress");
      sessionStorage.setItem("storeGenerateForStoreResult", JSON.stringify({ page_id: pageId, success: true }));

      await pollStoreGenerationStatus(pageId);
    } catch (error) {
      console.error("Error calling /api/generate-for-store:", error);
      setStoreGenerationSucceeded(false);
      setStoreGenerationStatus("failed");
      setStoreGenerationError(error?.message || "Store generation failed");
      setStoreGenerationPercentage(0);
      setCurrentStoreGenerationStep(0);
    } finally {
      setIsGeneratingStore(false);
    }
  };

  const handleRetryStoreGeneration = async () => {
    const timedOut = /timed out/i.test(storeGenerationError || "");
    console.log('timedOut', timedOut);
    if (timedOut) {
      setStoreGenerationError(null);
      setStoreGenerationSucceeded(false);
      setStoreGenerationStatus("in_progress");
      setIsGeneratingStore(true);
      try {
        await pollStoreGenerationStatus(storeGenerationPageId);
      } catch (error) {
        console.error("Store generation poll (retry):", error);
        setStoreGenerationSucceeded(false);
        setStoreGenerationStatus("failed");
        setStoreGenerationError(error?.message || "Store generation failed");
        setStoreGenerationPercentage(0);
        setCurrentStoreGenerationStep(0);
      } finally {
        setIsGeneratingStore(false);
      }
      return;
    }
    void requestStoreGenerationCredit();
  };

  /**
   * POST /api/publish-store forwards to Python `${PYTHON_API_URL}/api/publish-store` with:
   * `{ ...body, shop }` and headers `Authorization: Bearer <Shopify session token>`, `X-Shop-Domain`.
   * Body fields: mode, theme_id (optional), page_id, generation_data, stylePreferences, dynamicColor, headingFont, bodyFont.
   * @param {null | { homeData?: object; stylePreferences?: { dynamicColor?: string; headingFont?: string; bodyFont?: string } }} editorSnapshot
   *        Optional latest template preview values so publish includes edits not yet saved via Save.
   */
  const handlePublishStore = useCallback(
    async (editorSnapshot = null) => {
      if (
        editorSnapshot?.homeData != null &&
        editorSnapshot?.stylePreferences != null
      ) {
        handleSaveStore(editorSnapshot);
      }
      let generationDataForPublish = storeGenerationData;
      let pageIdForPublish = storeGenerationPageId;

      if (editorSnapshot?.homeData) {
        generationDataForPublish = {
          ...(generationDataForPublish || {}),
          home_page: editorSnapshot.homeData,
        };
        setStoreGenerationData((prev) => ({
          ...(prev || {}),
          home_page: editorSnapshot.homeData,
        }));
      }
      if (editorSnapshot?.productPageData) {
        generationDataForPublish = {
          ...(generationDataForPublish || {}),
          product_page: editorSnapshot.productPageData,
        };
        setStoreGenerationData((prev) => ({
          ...(prev || {}),
          product_page: editorSnapshot.productPageData,
        }));
      }
      if (Array.isArray(editorSnapshot?.productPages)) {
        generationDataForPublish = {
          ...(generationDataForPublish || {}),
          product_pages: editorSnapshot.productPages,
        };
        setStoreGenerationData((prev) => ({
          ...(prev || {}),
          product_pages: editorSnapshot.productPages,
        }));
      }
      if (editorSnapshot?.stylePreferences) {
        handleStoreStylePreferencesChange(editorSnapshot.stylePreferences);
      }

      if (
        (!generationDataForPublish || !pageIdForPublish) &&
        typeof sessionStorage !== "undefined"
      ) {
        try {
          const raw = sessionStorage.getItem("storeGenerateForStoreResult");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!generationDataForPublish) {
              generationDataForPublish = parsed?.generation_data ?? null;
            }
            if (!pageIdForPublish) {
              pageIdForPublish = parsed?.page_id ?? parsed?.pageId ?? null;
            }
          }
        } catch {
          /* ignore */
        }
      }

      const dynamicColor =
        editorSnapshot?.stylePreferences?.dynamicColor ?? selectedDynamicColor;
      const headingFontVal =
        editorSnapshot?.stylePreferences?.headingFont ?? headingFont;
      const bodyFontVal = editorSnapshot?.stylePreferences?.bodyFont ?? bodyFont;
      // For publish, send the font key/name as-is (e.g. "Barlow Condensed"),
      // not the "+"-encoded form.
      const headingFontForBackend = headingFontVal;
      const bodyFontForBackend = bodyFontVal;

      // If `generation_data` already contains style info from the previous generation,
      // overwrite it so Python gets the raw font names (with spaces) consistently.
      if (generationDataForPublish && typeof generationDataForPublish === "object") {
        generationDataForPublish = {
          ...generationDataForPublish,
          stylePreferences: {
            ...(generationDataForPublish?.stylePreferences || {}),
            dynamicColor,
            headingFont: headingFontVal,
            bodyFont: bodyFontVal,
          },
          dynamicColor,
          headingFont: headingFontVal,
          bodyFont: bodyFontVal,
        };
      }

      if (!pageIdForPublish || !generationDataForPublish) {
        const msg =
          "Missing page or generation data. Save your template preview or run generation again.";
        setPublishStoreError(msg);
        shopify?.toast?.show(msg, { isError: true, duration: 5000 });
        return { success: false, error: msg };
      }

      setPublishStoreError(null);
      setPublishStoreSucceeded(false);
      setIsPublishingStore(true);
      try {
        try {
          const response = await shopifyAuthenticatedFetch(shopify, "/api/publish-store", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: storeType === "single" ? "single_product" : "multi_product",
              page_id: pageIdForPublish,
              generation_data: generationDataForPublish,
              stylePreferences: {
                dynamicColor,
                headingFont: headingFontForBackend,
                bodyFont: bodyFontForBackend,
              },
              dynamicColor,
              headingFont: headingFontForBackend,
              bodyFont: bodyFontForBackend,
            }),
          });
          const data = await response.json().catch(() => ({}));
          const code = data?.code;
          if (code === "purchase_required" || response.status === 402) {
            const message = data?.error || "Failed to publish store";
            setPurchaseRequiredSurface("publish");
            if (posthog && posthog.__loaded) {
              posthog.capture("purchase_required_modal_shown", {
                surface: "store_publish",
                is_onboarding: Boolean(isOnboarding),
                market_type: normalizeMarketType(marketType),
              });
            }
            return { success: false, error: message, code: "purchase_required" };
          }
          if (
            !response.ok &&
            response.status !== 202 &&
            !data?.started &&
            response.status >= 400 &&
            response.status < 500
          ) {
            const message = data?.error || "Failed to publish store";
            setPublishStoreError(message);
            shopify?.toast?.show(message, { isError: true, duration: 5000 });
            return { success: false, error: message, code };
          }
        } catch {
          // Proxy/App Bridge timeout: Python may still be publishing — poll status.
        }

        const outcome = await pollStorePublishStatus(pageIdForPublish);
        if (!outcome?.success) {
          const message = outcome?.error || "Failed to publish store";
          setPublishStoreError(message);
          shopify?.toast?.show(message, { isError: true, duration: 5000 });
          return { success: false, error: message };
        }
        setPublishStoreSucceeded(true);
        shopify?.toast?.show("Store published successfully", { duration: 4000 });
        void refreshPages?.();
        return { success: true, data: outcome.data };
      } finally {
        setIsPublishingStore(false);
      }
    },
    [
      storeGenerationData,
      storeGenerationPageId,
      storeType,
      selectedDynamicColor,
      headingFont,
      bodyFont,
      shopify,
      posthog,
      isOnboarding,
      refreshPages,
      handleStoreStylePreferencesChange,
      pollStorePublishStatus,
    ],
  );

  const runEntireStorePublish = useCallback(async () => {
    return handlePublishStore(pendingPublishSnapshot);
  }, [handlePublishStore, pendingPublishSnapshot]);

  useEffect(() => {
    if (!onFlowStepChange) return;
    if (step === 1) {
      onFlowStepChange({ current: 4, completed: 3 });
      return;
    }
    if (entireStorePublishViewOpen) {
      onFlowStepChange({ current: 6, completed: 5 });
      return;
    }
    const hasPreview =
      storeGenerationStatus === "completed" && Boolean(storeGenerationData?.home_page);
    if (hasPreview) {
      onFlowStepChange({ current: 6, completed: 5 });
      return;
    }
    onFlowStepChange({ current: 5, completed: 4 });
  }, [
    onFlowStepChange,
    step,
    entireStorePublishViewOpen,
    storeGenerationStatus,
    storeGenerationData,
  ]);

  const handleBackToParentScreen = useCallback(() => {
    setStep(1);
    setFlowTypeProp?.(null);
    if (hubPath) {
      navigate(buildEmbeddedHref(hubPath, searchParams, shopFromUrl));
    } else if (!isOnboarding) {
      setSearchParams({ flow: "dashboard" });
    }
  }, [
    hubPath,
    isOnboarding,
    navigate,
    searchParams,
    setFlowTypeProp,
    setSearchParams,
    shopFromUrl,
  ]);

  const handleConfigureBack = useCallback(() => {
    handleBackToParentScreen();
  }, [handleBackToParentScreen]);

  const storeFlowPageBackLabel = hubPath === "/entire-store" ? "Entire store" : "Back";
  const configureBackLabel = storeFlowPageBackLabel;

  const handleConfigurePrimaryClick = useCallback(() => {
    requestStoreGenerationCredit();
  }, [requestStoreGenerationCredit]);

  const isEditingExistingStore = Boolean(
    storeGenerationPageId || pageIdFromUrl,
  );
  const configureStepTitle = isEditingExistingStore
    ? "Edit generation settings"
    : "Configure entire store";
  const configureStepSubtitle = isEditingExistingStore
    ? "Update settings, then save to regenerate"
    : "Step 1 of 3";
  const configureStepNumber = 1;
  const configurePrimaryLabel = "Begin Magic";
  const openCreditsPage = useCallback(() => {
    navigate(buildEmbeddedHref("/credits", searchParams, shopFromUrl));
  }, [navigate, searchParams, shopFromUrl]);
  const storeSkipsCreditGates = shopSkipsCreditGates(storeDetails);

  const storeCardBeginDisabled =
    !marketType ||
    !countryCode ||
    !storeType ||
    (storeType === "single" ? !selectedSingleProduct : multiProductsForStore.length !== 3) ||
    Boolean(currentStoreValidationMessage) ||
    isGeneratingStore;

  const prefsCountryLabel =
    STORE_COUNTRY_OPTIONS.find((c) => c.value === countryCode)?.label ||
    countryCode ||
    "—";
  const prefsLanguage = getSupportedLanguage(effectiveLanguageValue);
  const prefsMarketLabel =
    marketType === "cod" ? "COD" : marketType === "prepaid" ? "Prepaid" : "—";

  const purchaseRequiredOpen = purchaseRequiredSurface != null;
  const purchaseStorePurchaseRequiredModal = (
    <Modal
      open={purchaseRequiredOpen}
      onClose={() => setPurchaseRequiredSurface(null)}
      title={
        purchaseRequiredSurface === "multi_generate"
          ? "Purchase required for multi-product store"
          : "Purchase required to publish"
      }
     primaryAction={{
  content: "View credit packs",
  onAction: () => {
    setPurchaseRequiredSurface(null);
    // So onboarding can resume publish after buying a pack.
    try {
      if (isOnboarding && storeGenerationPageId) {
        sessionStorage.setItem(
          "roarr:onboardingStorePageId",
          String(storeGenerationPageId),
        );
        sessionStorage.setItem("roarr:resumeOnboardingStore", "1");
      }
    } catch {
      /* ignore */
    }
    navigate(buildEmbeddedHref("/credits", searchParams, shopFromUrl));
  },
}}
      secondaryActions={[
        {
          content: "Not now",
          onAction: () => setPurchaseRequiredSurface(null),
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="300">
{purchaseRequiredSurface === "multi_generate" ? (
  <BlockStack gap="200">
    <Text as="p" variant="bodyMd">
      Multi-product store requires a credit pack purchase before you can generate.
    </Text>
    <Text as="p" variant="bodyMd" fontWeight="bold">
      However, you can still generate and preview single product store without credits
    </Text>
  </BlockStack>
) : (
  <>
    <Box
      background="bg-surface-warning"
      padding="300"
      borderRadius="200"
      borderWidth="025"
      borderColor="border-warning"
    >
      <Text as="p" variant="bodyMd" fontWeight="bold">
        You've used your free credits. Purchase a pack to keep creating.
      </Text>
    </Box>
    <Text as="p" variant="bodyMd">
      To publish your entire store to Shopify, buy any credit pack once. After your purchase
      is confirmed, you can push your store from this step.
    </Text>
    <Text as="p" variant="bodySm" tone="subdued">
      Your generation credits were already used for this store; the pack unlocks publishing
      and adds credits to your wallet.
    </Text>
  </>
)}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );

  if (step === 2) {
    if (entireStorePublishViewOpen) {
      return (
        <>
          <Suspense fallback={<Spinner accessibilityLabel="Loading publish step" size="large" />}>
            <StorePublishStep
              onComplete={async () => {
                if (isOnboarding && onOnboardingComplete) {
                  await onOnboardingComplete();
                }
                if (hubPath && !isOnboarding) {
                  navigate(buildEmbeddedHref(hubPath, searchParams, shopFromUrl));
                } else {
                  setSearchParams({ flow: "dashboard" });
                }
              }}
              autoStart
              onBack={() => {
                setEntireStorePublishViewOpen(false);
              }}
              runPublish={runEntireStorePublish}
            />
          </Suspense>
          {purchaseStorePurchaseRequiredModal}
        </>
      );
    }

    const hasStorePreview =
      storeGenerationStatus === "completed" && storeGenerationData?.home_page;

    if (hasStorePreview) {
      const previewEditor = (
        <Suspense fallback={<Spinner accessibilityLabel="Loading preview editor" size="large" />}>
          <StorePreviewEditor
            homePageData={storeGenerationData.home_page}
            productPageData={storeGenerationData.product_page}
            productPages={storeGenerationData.product_pages}
            marketType={
              storeGenerationData?.market_type ||
              storeGenerationData?.marketType ||
              marketType ||
              "prepaid"
            }
            storeTemplatePack={
              storeGenerationData?.storeTemplatePack ||
              storeGenerationData?.store_template_pack ||
              storeTemplatePack ||
              "classic"
            }
            storeCategory={storeCategory}
            storeType={storeType}
            generationMode={storeGenerationData?.mode}
            stylePreferences={
              pageIdFromUrl
                ? {
                    dynamicColor: storeGenerationData.style_preferences.selected_color,
                    headingFont: storeGenerationData.style_preferences.heading_font,
                    bodyFont: storeGenerationData.style_preferences.body_font,
                  }
                : stylePreferences
            }
            onStylePreferencesChange={handleStoreStylePreferencesChange}
            onHomePageDataChange={handleHomePageDataChange}
            productImages={storePreviewProductImages}
            title="Template Preview"
            saveLabel="Save"
            onSave={handleSaveStore}
            previewViews={primaryViews}
            collectionProductsFallback={products}
            multiProductsForStore={multiProductsForStore}
            selectedSingleProduct={selectedSingleProduct}
            selectedProductForPreview={selectedProductForPreview}
            onSelectedProductForPreviewChange={setSelectedProductForPreview}
            /** COD + prepaid multi: featured products use premium PDPs. */
            codPremiumProductsForStore={multiProductsForStore}
            selectedProductTemplate={
              (() => {
                const raw =
                storeGenerationData?.selectedTemplate ??
                  storeGenerationData?.selected_template ??
                  selectedProductTemplate;
                const premiumIds =
                  storeGenerationData?.premium_product_ids ||
                  storeGenerationData?.premiumProductIds;
                const hasPremium =
                  Array.isArray(premiumIds)
                    ? premiumIds.length > 0
                    : selectedProductTemplate === 1 || selectedProductTemplate === 2;
                if (!hasPremium && (marketType || "prepaid") === "prepaid") return null;
                return Number(raw) === 2 ? 2 : 1;
              })()
            }
            onPublishNavigate={(snapshot) => {
              setPendingPublishSnapshot(snapshot);
              setEntireStorePublishViewOpen(true);
            }}
            storePagePublished={storePagePublished}
            shopifyThemeEditorUrl={shopifyThemeEditorUrl}
            pageChrome={
              embedded
                ? undefined
                : {
                    title: "Review & customize",
                    subtitle: "Step 3 of 3",
                    backAction: { content: "Configuration", onAction: () => setStep(1) },
                  }
            }
          />
        </Suspense>
      );

      if (embedded) {
        return previewEditor;
      }

      return (
        <s-page heading="Entire Store Experience" inlineSize="large">
          <CreditWalletWidget floating={false} slot="secondary-actions" />
          <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
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
        </s-page>
      );
    }

    const generationBody = (
      <BlockStack gap="400">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#202223" }}>
          <span
            style={{
              background: "#fff3a0",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Store creation is free. Publishing your store requires a paid plan.
          </span>
        </p>
        <Suspense fallback={<Spinner accessibilityLabel="Loading generation step" size="large" />}>
          <StoreGenerationStep
            isGenerating={isGeneratingStore}
            generationPercentage={storeGenerationPercentage}
            generationStatus={storeGenerationStatus}
            generationError={storeGenerationError}
            onRetry={handleRetryStoreGeneration}
            storeType={storeType}
            multiIncludePremiumPdps={multiIncludePremiumPdps === true}
          />
        </Suspense>
        {!isGeneratingStore && storeGenerationStatus === "failed" ? (
          <Card roundedAbove="sm" padding="0">
            <Box background="bg-surface" padding="400">
              <InlineStack align="center">
                <Button onClick={() => setStep(1)}>Back to Configuration</Button>
              </InlineStack>
            </Box>
          </Card>
        ) : null}
      </BlockStack>
    );

    return (
      <s-page heading="Entire Store Experience" inlineSize="large">
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
                title="Generating your store"
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

  return (
    <>
      <AppBridgeModal
        id="my-modal"
        variant="max"
        open={isPreviewModalOpen}
        onHide={closeThemeDemoModal}
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
                {demoProductOnly || demoHomeOnly ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                      pointerEvents: "none",
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
                        {demoHomeOnly ? "Home" : "Product"}
                      </button>
                    </div>
                  </div>
                ) : (
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
                {["Home", "Product"].map((view) => {
                  const isActive = modalPageView === view;
                  return (
                    <button
                      key={view}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setModalPageView(view);
                        setSelectedMoreView("");
                        const idx = (
                          storeType === "multi" ? MULTI_PRIMARY_VIEWS : SINGLE_PRIMARY_VIEWS
                        ).indexOf(view);
                        setActivePreviewTabIndex(idx >= 0 ? idx : view === "Product" ? 1 : 0);
                        if (
                          view === "Product" &&
                          !selectedProductForPreview &&
                          (configureProductForPreview || multiProductsForStore[0])
                        ) {
                          setSelectedProductForPreview(
                            configureProductForPreview || multiProductsForStore[0],
                          );
                        }
                      }}
                      style={{
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 999,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#111827" : "#6b7280",
                        background: isActive ? "#ffffff" : "transparent",
                        boxShadow: isActive
                          ? "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
                          : "none",
                      }}
                    >
                      {view}
                </button>
                  );
                })}
              </div>
            </div>
                )}
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
                      background: isActive ? "#111827" : "transparent",
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
          <DemoPreviewDisclaimer subject="store" />
          <div
            style={{
              flex: 1,
              minHeight: 0,
              position: "relative",
              zIndex: 0,
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
                height: modalPreviewMode === "mobile" ? "auto" : "100%",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: modalPreviewMode === "mobile" ? 16 : 0,
                boxShadow:
                  modalPreviewMode === "mobile"
                    ? "0 8px 24px rgba(0,0,0,0.12)"
                    : "none",
                background: "#ffffff",
                position: "relative",
              }}
            >
              {isPreviewModalOpen || demoPreviewWarmed ? (
                <>
                  {/* Store demos: Home+Product (COD/multi). Prepaid single: Home only. Product-template eye: Product only. */}
                  {!demoProductOnly ? (
                  <div
                    style={{
                      display:
                        demoHomeOnly || modalPageView === "Home"
                          ? "block"
                          : "none",
                      height: "100%",
                    }}
                    aria-hidden={!(demoHomeOnly || modalPageView === "Home")}
                  >
            <LiquidPagePreview
                      key={configureDemoPrebuiltHtmlUrlHome}
                      attachBelowChrome={modalPreviewMode === "desktop"}
              productType={storeType === "multi" ? "multi-product" : "single-product"}
              marketType={marketType || "prepaid"}
                      selectedTemplate={demoSelectedProductTemplate === 2 ? 2 : 1}
                      usePremiumProductPage={false}
                      productPageData={null}
                      pageType="home-page"
              productData={
                        storeType !== "single"
                          ? null
                          : demoHomeOnly
                            ? buildSwiftDemoCheckoutProduct(configureDemoHomeData)
                            : configureProductForPreview
              }
              collectionProducts={
                        storeType === "multi"
                          ? luminousDemoGridProducts ||
                            premiumMultiGridProducts ||
                            (multiProductsForStore.length > 0
                              ? multiProductsForStore
                              : products || []
                            ).slice(0, 3)
                    : null
              }
                      detectedCategory={configureDemoCategory}
                      previewMode={modalPreviewMode}
              selectorMode={false}
              stylePreferences={stylePreferences}
                      liquidPreviewType={configureDemoHomeLiquidPreviewType}
                      storeTemplatePack={configureDemoHomeStoreTemplatePack}
              minHeight="1200px"
              homeData={configureDemoHomeData}
                      omitCheckoutBlocks={demoHomeOmitsCheckout}
                      prebuiltHtmlUrl={null}
                    />
                  </div>
                  ) : null}
                  {!demoHomeOnly ? (
                  <div
                    style={{
                      display:
                        demoProductOnly || modalPageView === "Product"
                          ? "block"
                          : "none",
                      height: "100%",
                    }}
                    aria-hidden={
                      !(demoProductOnly || modalPageView === "Product")
                    }
                  >
                    <LiquidPagePreview
                      key={configureDemoPrebuiltHtmlUrlProduct}
                      attachBelowChrome={modalPreviewMode === "desktop"}
                      productType={storeType === "multi" ? "multi-product" : "single-product"}
                      marketType={marketType || "prepaid"}
                      selectedTemplate={demoSelectedProductTemplate === 2 ? 2 : 1}
                      usePremiumProductPage={configureDemoUsePremiumProductPage}
                      productPageData={linenHomeProductPageData || velvetHomeProductPageData}
                      pageType="product-page"
                      productData={luminousDemoProduct}
                      collectionProducts={null}
                      detectedCategory={configureDemoCategory}
                      previewMode={modalPreviewMode}
                      selectorMode={false}
                      stylePreferences={stylePreferences}
                      liquidPreviewType={
                        configureDemoUsePremiumProductPage
                          ? "landing-page"
                          : "entire-store"
                      }
                      storeTemplatePack="classic"
                      minHeight="1200px"
                      homeData={null}
                      prebuiltHtmlUrl={null}
                    />
                  </div>
                  ) : null}
                </>
              ) : null}
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
          <StoreConfigureStepShell
            embedded={embedded}
            backLabel={configureBackLabel}
            onBack={handleConfigureBack}
            title={configureStepTitle}
            subtitle={configureStepSubtitle}
          >
          {embedded ? (
            !hideConfigurationHeading ? (
              <>
                <div
                  className="generate-flow-sticky-page-header"
                  style={{
                    padding: "12px 0 16px",
                    marginBottom: 8,
                    borderBottom: "1px solid #e1e3e5",
                  }}
                >
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "999px",
                          border: "1px solid #d1d5db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          flexShrink: 0,
                        }}
                      >
                        {configureStepNumber}
                      </div>
                      <Text as="h2" variant="headingLg" fontWeight="semibold">
                        {configureStepTitle}
                      </Text>
                    </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                      {isEditingExistingStore
                        ? "Update store type, products, or template, then save to regenerate"
                        : "Configure your store type, fine tune your style, and begin magic"}
                        </Text>
                  </BlockStack>
                  </div>
              </>
            ) : null
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
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface" padding="300">
                    <InlineStack align="space-between" blockAlign="center" gap="200" wrap>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Your preferences
                        </Text>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {prefsMarketLabel}
                          {" · "}
                          {prefsCountryLabel}
                          {" · "}
                          {prefsLanguage?.name || effectiveLanguageLabel}
                        </Text>
                        {!marketType || !countryCode ? (
                          <Text as="p" variant="bodySm" tone="critical">
                            Missing preferences — set them in Preferences to continue.
                          </Text>
                        ) : null}
                      </BlockStack>
                      <Button
                        variant="plain"
                        url="/preferences"
                      >
                        Edit
                      </Button>
                    </InlineStack>
                  </Box>
                </Card>
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface" padding="400">
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        Select Store Type
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        What&apos;s included: 1 Entire Store{" "}
                        <strong>
                          (Homepage, Collections, FAQs, Customer reviews section)
                        </strong>
                        . Each theme is one complete look, including the product page.
                      </Text>
                    </BlockStack>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setStoreType("single");
                          setSelectedMoreView("");
                          setActivePreviewTabIndex(0);
                          setCategoryMatchPercentage(null);
                          setStoreTemplatePack("classic");
                          setSelectedProductTemplate(null);
                          setMultiIncludePremiumPdps(null);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "14px",
                          borderRadius: "10px",
                          border: `1px solid ${storeType === "single" ? "#2f6f63" : "#d1d5db"}`,
                          boxShadow: "none",
                          background: storeType === "single" ? "#edf5f3" : "#ffffff",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <BlockStack gap="100">
                          <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
                            <RadioButton
                              label="Single-Product Store"
                              labelHidden
                              name="storeType"
                              checked={storeType === "single"}
                              onChange={() => { }}
                            />
                          </div>
                          <Text as="h4" variant="bodyMd" fontWeight="semibold">
                            Create Single-Product Store
                          </Text>
                        </BlockStack>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStoreType("multi");
                          setSelectedMoreView("");
                          setActivePreviewTabIndex(0);
                          setCategoryMatchPercentage(null);
                          setStoreTemplatePack("classic");
                          setMultiIncludePremiumPdps(null);
                          setSelectedProductTemplate(null);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "14px",
                          borderRadius: "10px",
                          border: `1px solid ${storeType === "multi" ? "#2f6f63" : "#d1d5db"}`,
                          boxShadow: "none",
                          background: storeType === "multi" ? "#edf5f3" : "#ffffff",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <BlockStack gap="100">
                          <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
                            <RadioButton
                              label="Multi-Product Store"
                              labelHidden
                              name="storeType"
                              checked={storeType === "multi"}
                              onChange={() => { }}
                            />
                          </div>
                          <Text as="h4" variant="bodyMd" fontWeight="semibold">
                            Create Multi-Product Store
                          </Text>
                        </BlockStack>
                      </button>
                    </div>
                  </BlockStack>
                  </Box>
                </Card>

                {storeType === "multi" ? (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        Select your products
                      </Text>
                      <InlineStack align="space-between" blockAlign="center" wrap={isMobileLayout}>
                        {multiProductsForStore.length > 0 ? (
                          <InlineStack gap="150" blockAlign="center" wrap={false}>
                            {multiProductsForStore.map((product) => (
                              <div
                                key={product.id}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid #e1e3e5",
                                  background: "#f3f4f6",
                                }}
                              >
                                <img
                                  src={
                                    product?.featuredImage?.url ||
                                    product?.images?.edges?.[0]?.node?.url ||
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3C/svg%3E"
                                  }
                                  alt={product?.title || "Selected product"}
                                  width={44}
                                  height={44}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            ))}
                            <Text as="p" variant="bodySm" tone="subdued">
                              {multiProductsForStore.length}/3 selected
                            </Text>
                          </InlineStack>
                        ) : (
                          <Text as="p" variant="bodySm" tone="subdued">
                            No products selected yet.
                          </Text>
                        )}
                        <div
                          style={{
                            marginTop: isMobileLayout && multiProductsForStore.length > 0 ? "8px" : 0,
                            width: isMobileLayout ? "100%" : "auto",
                          }}
                        >
                          <Button onClick={() => setIsMultiProductModalOpen(true)} fullWidth={isMobileLayout}>
                            {multiProductsForStore.length > 0 ? "Change products" : "Select products"}
                          </Button>
                        </div>
                      </InlineStack>
                      {storeType === "multi" && hasMultiProductValidationErrors ? (
                        <BlockStack gap="150">
                          {invalidMultiProductDetails.map(({ product, message }) => (
                            <div key={String(product?.id || message)}>
                              {renderStoreProductValidationAlert(
                                `${String(product?.title || "Selected Product").slice(0, 30)}... ${message?.replace("Selected product ", "").replace(/\.$/, "")}.`,
                                product,
                              )}
                            </div>
                          ))}
                        </BlockStack>
                      ) : null}
                      {multiProductsForStore.length > 0 ? (
                        <InlineStack align="space-between" blockAlign="center" gap="200" wrap={isMobileLayout}>
                          <div style={{ minWidth: isMobileLayout ? "100%" : 220, width: isMobileLayout ? "100%" : "auto" }}>
                            <Select
                              label="Category"
                              labelHidden
                              options={CATEGORY_OPTIONS}
                              value={storeCategory}
                              onChange={handleManualStoreCategoryChange}
                            />
                          </div>
                          {detectingStoreCategory ? (
                            <InlineStack gap="150" blockAlign="center">
                              <Spinner accessibilityLabel="Detecting category" size="small" />
                              <Text as="p" variant="bodyMd" tone="subdued">
                                AI is analyzing your selected product(s)...
                              </Text>
                            </InlineStack>
                          ) : (
                            <Text
                              as="p"
                              variant="bodyMd"
                            >
                              <span
                                style={{
                                  color: categoryMatchPercentage !== null ? "#026326" : "#6b7280",
                                  fontWeight: 400,
                                }}
                              >
                                {categoryMatchPercentage !== null
                                  ? `AI detected these products are of ${selectedCategoryLabel} category with ${categoryMatchPercentage}% confidence`
                                  : null}
                              </span>
                            </Text>
                          )}
                          {categoryMatchPercentage === null && !detectingStoreCategory && (
                            <Button
                              variant="plain"
                              onClick={handleAutoDetectStoreCategoryFromMulti}
                              fullWidth={isMobileLayout}
                            >
                              Detect using AI
                            </Button>
                          )}
                        </InlineStack>
                      ) : null}
                    </BlockStack>
                    </Box>
                  </Card>
                ) : null}

                {storeType === "single" ? (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        Select your product
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Choose one product from your Shopify store for this single-product experience.
                      </Text>

                      <InlineStack align="space-between" blockAlign="center" wrap={isMobileLayout}>
                        {selectedSingleProduct ? (
                          <InlineStack gap="200" blockAlign="center" wrap={false}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid #e1e3e5",
                                background: "#f3f4f6",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={
                                  selectedSingleProduct?.featuredImage?.url ||
                                  selectedSingleProduct?.images?.edges?.[0]?.node?.url ||
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3C/svg%3E"
                                }
                                alt={selectedSingleProduct?.title || "Selected product"}
                                width={44}
                                height={44}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <div
                              style={{
                                minWidth: 0,
                                maxWidth: isMobileLayout ? "calc(100vw - 160px)" : "280px",
                                flex: "1 1 auto",
                                overflow: "hidden",
                              }}
                            >
                              <Text
                                as="p"
                                variant="bodySm"
                                truncate
                              >
                                {selectedSingleProduct?.title || "Product selected"}
                              </Text>
                            </div>
                          </InlineStack>
                        ) : (
                          <Text as="p" variant="bodySm" tone="subdued">
                            No product selected yet.
                          </Text>
                        )}
                        <div
                          style={{
                            marginTop: !selectedSingleProduct || (selectedSingleProduct && isMobileLayout) ? "8px" : 0,
                            width: isMobileLayout ? "100%" : "auto",
                          }}
                        >
                          <Button onClick={() => setIsSingleProductModalOpen(true)} fullWidth={isMobileLayout}>
                            {selectedSingleProduct ? "Change product" : "Select product"}
                          </Button>
                        </div>
                      </InlineStack>
                      {storeType === "single" && singleProductValidationMessage
                        ? singleStoreProductValidationAlert
                        : null}
                      {selectedSingleProduct ? (
                        <InlineStack align="space-between" blockAlign="center" gap="200" wrap={isMobileLayout}>
                          <div style={{ minWidth: isMobileLayout ? "100%" : 220, width: isMobileLayout ? "100%" : "auto" }}>
                            <Select
                              label="Category"
                              labelHidden
                              options={CATEGORY_OPTIONS}
                              value={storeCategory}
                              onChange={handleManualStoreCategoryChange}
                            />
                          </div>
                          {detectingStoreCategory ? (
                            <InlineStack gap="150" blockAlign="center">
                              <Spinner accessibilityLabel="Detecting category" size="small" />
                              <Text as="p" variant="bodyMd" tone="subdued">
                                AI is analyzing your selected product(s)...
                              </Text>
                            </InlineStack>
                          ) : (
                            <Text
                              as="p"
                              variant="bodyMd"
                            >
                              <span
                                style={{
                                  color: categoryMatchPercentage !== null ? "#026326" : "#6b7280",
                                  fontWeight: 400,
                                }}
                              >
                                {categoryMatchPercentage !== null
                                  ? `AI detected this product of ${selectedCategoryLabel} with ${categoryMatchPercentage}% confidence`
                                  : null}
                              </span>
                            </Text>
                          )}
                          {categoryMatchPercentage === null && !detectingStoreCategory && (
                            <Button
                              variant="plain"
                              onClick={handleAutoDetectStoreCategoryFromSingle}
                              fullWidth={isMobileLayout}
                            >
                              Detect using AI
                            </Button>
                          )}
                        </InlineStack>
                      ) : null}
                    </BlockStack>
                    </Box>
                  </Card>
                ) : null}

                {hasStoreProductsSelected && storeType === "single" ? (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          Store template
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Swift — single-product storefront with on-page checkout.
                        </Text>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobileLayout
                              ? "minmax(0, 1fr)"
                              : "minmax(0, 360px)",
                            gap: "12px",
                            alignItems: "stretch",
                          }}
                        >
                          {[PREPAID_CLASSIC_THEME_COMBO].map((combo) => {
                            const includePremium = combo.includePremium !== false;
                            const isSelected = includePremium
                              ? storeTemplatePack === combo.pack &&
                                selectedProductTemplate === combo.template
                              : selectedProductTemplate == null &&
                                storeTemplatePack === (combo.pack || "classic");
                            const homeVariant =
                              combo.pack === "amour"
                                ? STORE_DEMO_VARIANTS.AMOUR_HOME
                                : !includePremium
                                ? STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID
                                : combo.pack === "cinematic"
                                  ? STORE_DEMO_VARIANTS.CINEMATIC_HOME
                                  : STORE_DEMO_VARIANTS.CLASSIC_HOME;
                            const productVariant =
                              Number(combo.template) === 2
                                ? STORE_DEMO_VARIANTS.PRODUCT_VIBE
                                : STORE_DEMO_VARIANTS.PRODUCT_SLEEK;
                            const cardVariant =
                              combo.cardPageType === "product-page" && includePremium
                                ? productVariant
                                : homeVariant;
                            const comboCost = getStoreCreationCost(
                              "single",
                              marketType,
                              storeCreationCosts,
                              combo.pack,
                              includePremium,
                              combo.template,
                            );
                            const cardDemoCategory = storeCategory || "general";
                            return (
                              <ThemePreviewCard
                                key={combo.id}
                                title={combo.title}
                                blurb={combo.blurb}
                                badge={combo.badge || null}
                                creditCost={comboCost}
                                creditBalance={creditBalance}
                                onGetCredits={openCreditsPage}
                                skipCreditGate={storeSkipsCreditGates}
                                selected={isSelected}
                                onSelect={() => selectSingleThemeCombo(combo)}
                                onBeginMagic={() => {
                                  selectSingleThemeCombo(combo);
                                  handleConfigurePrimaryClick();
                                }}
                                beginMagicDisabled={storeCardBeginDisabled}
                                beginMagicLoading={isGeneratingStore}
                                beginMagicLabel={configurePrimaryLabel}
                                onPreview={() => {
                                  selectSingleThemeCombo(combo);
                                  openThemeDemoModal({
                                    pack: combo.pack,
                                    template: includePremium ? combo.template : 1,
                                    includePremium,
                                    view: combo.defaultView,
                                    category: cardDemoCategory,
                                  });
                                }}
                                previewProps={buildThemeCardPreviewProps({
                                  pageType: combo.cardPageType,
                                  pack: combo.pack,
                                  template: Number(combo.template) === 2 ? 2 : 1,
                                  includePremium,
                                  category: cardDemoCategory,
                                })}
                                thumbUrl={
                                  combo.id === "amour"
                                    ? getDemoPreviewThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.AMOUR_HOME,
                                        category: cardDemoCategory,
                                      })
                                    : combo.id === "classic-sleek"
                                    ? getDemoPreviewThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.LINEN_HOME,
                                        category: cardDemoCategory,
                                      })
                                    : combo.id === "prepaid-classic"
                                      ? getDemoPreviewThumbUrl({
                                          family: "store",
                                          variant: STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID,
                                          category: cardDemoCategory,
                                        })
                                      : null
                                }
                                hoverImageUrl={
                                  combo.id === "amour"
                                    ? `${getDemoPreviewEyeThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.AMOUR_HOME,
                                        category: cardDemoCategory,
                                      })}&shot=20261021-amour-imgs2`
                                    : combo.id === "classic-sleek"
                                    ? `${getDemoPreviewEyeThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.LINEN_HOME,
                                        category: cardDemoCategory,
                                      })}&shot=${String(cardDemoCategory || "").toLowerCase().includes("health") ? "20261008-hb3" : "20261008-full"}`
                                    : combo.id === "prepaid-classic"
                                      ? `${getDemoPreviewEyeThumbUrl({
                                          family: "store",
                                          variant: STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID,
                                          category: cardDemoCategory,
                                        })}&shot=${
                                          String(cardDemoCategory || "").toLowerCase().includes("health") ||
                                          String(cardDemoCategory || "").toLowerCase().includes("car")
                                            ? "20261008-qc2"
                                            : "20261008-qc"
                                        }`
                                      : combo.id === "classic-vibe"
                                        ? `${getDemoPreviewEyeThumbUrl({
                                            family: "store",
                                            variant: STORE_DEMO_VARIANTS.PRODUCT_VIBE,
                                            category: cardDemoCategory,
                                          })}&shot=20261008-pulse`
                                        : combo.id === "cinematic-sleek"
                                          ? `${getDemoPreviewEyeThumbUrl({
                                              family: "store",
                                              variant: STORE_DEMO_VARIANTS.PRODUCT_SLEEK,
                                              category: cardDemoCategory,
                                            })}&shot=${
                                              String(cardDemoCategory || "").toLowerCase().includes("health")
                                                ? "20261008-eclipse-hb"
                                                : "20261008-eclipse"
                                            }`
                                          : combo.id === "cinematic-vibe"
                                            ? `${getDemoPreviewEyeThumbUrl({
                                                family: "store",
                                                variant: STORE_DEMO_VARIANTS.CINEMATIC_HOME,
                                                category: cardDemoCategory,
                                              })}&shot=${
                                                String(cardDemoCategory || "").toLowerCase().includes("health")
                                                  ? "20261008-velvet-hb"
                                                  : "20261008-velvet"
                                              }`
                                            : null
                                }
                                prebuiltHtmlUrl={getDemoPreviewUrl({
                                  family: "store",
                                  variant: cardVariant,
                                  category: cardDemoCategory,
                                })}
                                demoFamily="store"
                                demoVariant={cardVariant}
                                demoCategory={cardDemoCategory}
                              />
                            );
                          })}
                        </div>
                      </BlockStack>
                    </Box>
                  </Card>
                ) : null}

                {hasStoreProductsSelected && storeType === "multi" ? (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                    <BlockStack gap="300">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                          Store template
                          </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                          Swift — multi-product storefront with homepage, collections, and trust pages.
                            </Text>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobileLayout
                                  ? "minmax(0, 1fr)"
                                  : "minmax(0, 360px)",
                                gap: "12px",
                            alignItems: "stretch",
                          }}
                        >
                          {MULTI_THEME_COMBOS.map((combo) => {
                            const isSelected =
                              multiIncludePremiumPdps === combo.includePremium &&
                              (combo.includePremium
                                ? selectedProductTemplate === combo.template
                                : selectedProductTemplate == null);
                            const productTemplate =
                              Number(combo.template) === 2 ? 2 : 1;
                            const cardVariant = combo.includePremium
                              ? productTemplate === 2
                                ? STORE_DEMO_VARIANTS.PRODUCT_VIBE
                                : STORE_DEMO_VARIANTS.PRODUCT_SLEEK
                              : STORE_DEMO_VARIANTS.MULTI_HOME;
                            const comboCost = getStoreCreationCost(
                              "multi",
                              marketType,
                              storeCreationCosts,
                              "classic",
                              combo.includePremium === true,
                            );
                            // Cards/eye use the merchant-selected category's existing demo store.
                            const cardDemoCategory = storeCategory || "general";
                                return (
                              <ThemePreviewCard
                                key={combo.id}
                                title={combo.title}
                                blurb={combo.blurb}
                                badge={combo.badge || null}
                                creditCost={comboCost}
                                creditBalance={creditBalance}
                                onGetCredits={openCreditsPage}
                                skipCreditGate={storeSkipsCreditGates}
                                selected={isSelected}
                                onSelect={() => selectMultiThemeCombo(combo)}
                                onBeginMagic={() => {
                                  selectMultiThemeCombo(combo);
                                  handleConfigurePrimaryClick();
                                }}
                                beginMagicDisabled={storeCardBeginDisabled}
                                beginMagicLoading={isGeneratingStore}
                                beginMagicLabel={configurePrimaryLabel}
                                onPreview={() => {
                                  selectMultiThemeCombo(combo);
                                  openThemeDemoModal({
                                    includePremium: combo.includePremium,
                                    view: combo.defaultView,
                                    template: combo.includePremium
                                      ? productTemplate
                                      : 1,
                                    category: cardDemoCategory,
                                  });
                                }}
                                previewProps={buildThemeCardPreviewProps({
                                  pageType: combo.cardPageType,
                                  pack: "classic",
                                  template: productTemplate,
                                  includePremium: combo.includePremium,
                                  category: cardDemoCategory,
                                })}
                                thumbUrl={
                                  combo.includePremium === false
                                    ? getDemoPreviewThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.LUMINOUS_HOME,
                                        category: cardDemoCategory,
                                      })
                                    : null
                                }
                                hoverImageUrl={
                                  combo.id === "luminous"
                                    ? `${getDemoPreviewEyeThumbUrl({
                                        family: "store",
                                        variant: STORE_DEMO_VARIANTS.LUMINOUS_HOME,
                                        category: cardDemoCategory,
                                      })}&shot=${
                                        String(cardDemoCategory || "").toLowerCase().includes("health")
                                          ? "20261008-luminous-hb"
                                          : "20261008-luminous"
                                      }`
                                    : combo.id === "collective-sleek"
                                      ? `${getDemoPreviewEyeThumbUrl({
                                          family: "store",
                                          variant: STORE_DEMO_VARIANTS.PRODUCT_SLEEK,
                                          category: cardDemoCategory,
                                        })}&shot=${
                                          String(cardDemoCategory || "").toLowerCase().includes("health")
                                            ? "20261008-eclipse-hb"
                                            : "20261008-eclipse"
                                        }`
                                      : combo.id === "collective-vibe"
                                        ? `${getDemoPreviewEyeThumbUrl({
                                            family: "store",
                                            variant: STORE_DEMO_VARIANTS.PRODUCT_VIBE,
                                            category: cardDemoCategory,
                                          })}&shot=20261008-pulse`
                                        : null
                                }
                                prebuiltHtmlUrl={
                                  combo.includePremium === false
                                    ? null
                                    : getDemoPreviewUrl({
                                        family: "store",
                                        variant: cardVariant,
                                        category: cardDemoCategory,
                                      })
                                }
                                demoFamily="store"
                                demoVariant={cardVariant}
                                demoCategory={cardDemoCategory}
                              />
                            );
                          })}
                                    </div>
                    </BlockStack>
                    </Box>
                  </Card>
                ) : null}

                {hasStoreProductsSelected ? (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="400">
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            Fine Tune your style
                          </Text>
                        </InlineStack>
                        <Button
                          variant="plain"
                          disclosure={isFineTuneOpen ? "up" : "down"}
                          onClick={() => setIsFineTuneOpen((prev) => {
                            const next = !prev;
                            if (next) selectEntireStoreDemoPreview();
                            return next;
                          })}
                        >
                        </Button>
                      </InlineStack>

                      {isFineTuneOpen ? (
                        <>
                          {/* Accent color */}
                          <BlockStack gap="200">
                            <Text as="p" variant="bodySm" tone="subdued">
                              Accent color (based on {selectedCategoryLabel})
                            </Text>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                alignItems: "center",
                              }}
                            >
                              {colorPalette.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    selectEntireStoreDemoPreview();
                                    setSelectedDynamicColor(color);
                                  }}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "999px",
                                    background: color,
                                    border:
                                      selectedDynamicColor === color
                                        ? "2px solid #111827"
                                        : "1px solid rgba(0,0,0,0.12)",
                                    boxShadow:
                                      selectedDynamicColor === color
                                        ? "0 0 0 2px #fff"
                                        : "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                  aria-label={`Select color ${color}`}
                                />
                              ))}
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "999px",
                                    border:
                                      !colorPalette.includes(selectedDynamicColor)
                                        ? "2px solid #111827"
                                        : "1px solid rgba(0,0,0,0.12)",
                                    boxShadow:
                                      !colorPalette.includes(selectedDynamicColor)
                                        ? "0 0 0 2px #fff"
                                        : "none",
                                    background: selectedDynamicColor,
                                    position: "relative",
                                    overflow: "hidden",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <input
                                    type="color"
                                    value={selectedDynamicColor}
                                    onChange={(e) => {
                                      selectEntireStoreDemoPreview();
                                      setSelectedDynamicColor(e.target.value);
                                    }}
                                    aria-label="Pick custom accent color"
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      width: "100%",
                                      height: "100%",
                                      opacity: 0,
                                      cursor: "pointer",
                                      border: "none",
                                      padding: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: "#111827",
                                      fontSize: "16px",
                                      lineHeight: 1,
                                      pointerEvents: "none",
                                    }}
                                  >
                                    +
                                  </span>
                                </span>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Custom
                                </Text>
                              </label>
                            </div>
                          </BlockStack>

                          <BlockStack gap="200">
                            <Text as="p" variant="bodySm" tone="subdued">
                              Typography style
                            </Text>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobileLayout
                                  ? "minmax(0, 1fr)"
                                  : "repeat(3, minmax(0, 1fr))",
                                gap: "12px",
                              }}
                            >
                              {TYPOGRAPHY_STYLE_PRESETS.map((preset) => {
                                const isActive = selectedTypographyPresetId === preset.id;
                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    disabled={isManualFontsEnabled}
                                    onClick={() => {
                                      selectEntireStoreDemoPreview();
                                      setHeadingFont(preset.headingFont);
                                      setBodyFont(preset.bodyFont);
                                    }}
                                    style={{
                                      textAlign: "left",
                                      borderRadius: "12px",
                                      border: `1px solid ${isActive ? "#2f6f63" : "#d1d5db"}`,
                                      padding: "6px 12px",
                                      background: isActive ? "#edf5f3" : "#ffffff",
                                      cursor: isManualFontsEnabled ? "not-allowed" : "pointer",
                                      position: "relative",
                                      opacity: isManualFontsEnabled ? 0.55 : 1,
                                    }}
                                  >
                                    <div style={{ position: "absolute", top: 8, right: 8, pointerEvents: "none" }}>
                                      <RadioButton
                                        label={`${preset.title} typography`}
                                        labelHidden
                                        name="typographyStylePreset"
                                        checked={isActive}
                                        onChange={() => { }}
                                      />
                                    </div>
                                    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "3px" }}>
                                      <div style={{ fontFamily: `"${preset.headingFont}", serif`, paddingTop: "6px" }}>
                                        <Text
                                          as="p"
                                          variant="headingMd"
                                          fontWeight="semibold"
                                        >
                                          {preset.title}
                                        </Text>
                                      </div>
                                      <div style={{ fontFamily: `"${preset.bodyFont}", sans-serif` }}>
                                        <Text as="p" variant="bodySm">
                                          The quick brown fox jumps over the lazy dog.
                                        </Text>
                                      </div>
                                      <div style={{ marginTop: "6px", display: "flex", justifyContent: "flex-start" }}>
                                        <span
                                          style={{
                                            fontSize: "12px",
                                            lineHeight: "18px",
                                            padding: "2px 10px",
                                            borderRadius: "999px",
                                            color: "#6b7280",
                                            background: "#eef0f2",
                                          }}
                                        >
                                          {preset.badgeLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </BlockStack>

                          <BlockStack gap="200">
                            <button
                              type="button"
                              onClick={() => {
                                const next = !isManualFontsEnabled;
                                setIsManualFontsEnabled(next);
                                if (!next) {
                                  setHeadingFontPopoverOpen(false);
                                  setBodyFontPopoverOpen(false);
                                }
                              }}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                width: "fit-content",
                                cursor: "pointer",
                              }}
                              aria-pressed={isManualFontsEnabled}
                            >
                              <InlineStack gap="200" blockAlign="center">
                                <div
                                  style={{
                                    width: 42,
                                    height: 24,
                                    borderRadius: 999,
                                    background: isManualFontsEnabled ? "#2f6f63" : "#d1d5db",
                                    position: "relative",
                                    transition: "background 140ms ease",
                                  }}
                                >
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: 2,
                                      left: isManualFontsEnabled ? 20 : 2,
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      background: "#ffffff",
                                      transition: "left 140ms ease",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                                    }}
                                  />
                                </div>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  I want to try Custom fonts - let me pick manually
                                </Text>
                              </InlineStack>
                            </button>
                            {isManualFontsEnabled ? (
                              <InlineStack gap="200" wrap>
                                <div style={{ minWidth: 180, flex: 1 }}>
                                  <Popover
                                    active={headingFontPopoverOpen}
                                    autofocusTarget="first-node"
                                    onClose={() => setHeadingFontPopoverOpen(false)}
                                    activator={
                                      <Button
                                        onClick={() => setHeadingFontPopoverOpen(true)}
                                        disclosure="down"
                                        fullWidth
                                      >
                                        <span style={{ fontFamily: `"${headingFont}", sans-serif` }}>
                                          Heading: {headingFont}
                                        </span>
                                      </Button>
                                    }
                                  >
                                    <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px", width: "220px" }}>
                                      {FONT_OPTIONS.map((font) => (
                                        <button
                                          key={font}
                                          type="button"
                                          onClick={() => {
                                            setHeadingFont(font);
                                            setHeadingFontPopoverOpen(false);
                                          }}
                                          style={{
                                            fontFamily: `"${font}", sans-serif`,
                                            fontSize: "14px",
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: headingFont === font ? "#f3f4f6" : "transparent",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {font}
                                        </button>
                                      ))}
                                    </div>
                                  </Popover>
                                </div>

                                <div style={{ minWidth: 180, flex: 1 }}>
                                  <Popover
                                    active={bodyFontPopoverOpen}
                                    autofocusTarget="first-node"
                                    onClose={() => setBodyFontPopoverOpen(false)}
                                    activator={
                                      <Button
                                        onClick={() => setBodyFontPopoverOpen(true)}
                                        disclosure="down"
                                        fullWidth
                                      >
                                        <span style={{ fontFamily: `"${bodyFont}", sans-serif` }}>
                                          Body: {bodyFont}
                                        </span>
                                      </Button>
                                    }
                                  >
                                    <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px", width: "220px" }}>
                                      {FONT_OPTIONS.map((font) => (
                                        <button
                                          key={font}
                                          type="button"
                                          onClick={() => {
                                            setBodyFont(font);
                                            setBodyFontPopoverOpen(false);
                                          }}
                                          style={{
                                            fontFamily: `"${font}", sans-serif`,
                                            fontSize: "14px",
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: bodyFont === font ? "#f3f4f6" : "transparent",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {font}
                                        </button>
                                      ))}
                                    </div>
                                  </Popover>
                                </div>
                              </InlineStack>
                            ) : null}
                          </BlockStack>

                        </>
                      ) : null}
                    </BlockStack>
                    </Box>
                  </Card>
              ) : null}

              </BlockStack>
            </div>

          </div>
          </StoreConfigureStepShell>
        </GenerateContainer>


        <ProductSelectionModal
          open={isSingleProductModalOpen}
          onClose={() => setIsSingleProductModalOpen(false)}
          onConfirm={(product) => {
            setSelectedSingleProduct(product);
            setIsSingleProductModalOpen(false);
          }}
        />
        <ProductSelectionModal
          open={isMultiProductModalOpen}
          onClose={() => setIsMultiProductModalOpen(false)}
          maxSelectable={3}
          subtitle="You can select three products on initial setup. Don't worry — you can easily add more product pages later after your store is created."
          onConfirm={(products) => {
            setSelectedMultiProducts(Array.isArray(products) ? products.slice(0, 3) : []);
            setSelectedProductForPreview(Array.isArray(products) && products.length > 0 ? products[0] : null);
            setIsMultiProductModalOpen(false);
          }}
        />

        <CreditConfirmationModal
          open={storeGenCreditConfirmOpen}
          onClose={() => setStoreGenCreditConfirmOpen(false)}
          onConfirm={() => {
            setStoreGenCreditConfirmOpen(false);
            void runStoreGeneration();
          }}
          featureKey="store_creation"
          costOverride={storeCreationCost}
          featureLabelOverride={
            storeType === "multi"
              ? multiIncludePremiumPdps === true
                ? selectedProductTemplate === 2
                  ? "Generate Meridian (store + 3 premium PDPs)"
                  : "Generate The Collective (store + 3 premium PDPs)"
                : "Generate Swift (multi-store)"
              : singleIncludePremiumPdps
                ? marketType === "cod"
                ? "Generate single-product COD store"
                : "Generate single-product prepaid store"
                : "Generate Swift prepaid store"
          }
        />

        {purchaseStorePurchaseRequiredModal}
      </Box>
    </>
  );
}

