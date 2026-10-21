import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Modal,
  Page,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { CheckIcon, EditIcon, PlusIcon, XSmallIcon } from "@shopify/polaris-icons";
import ProductSelectionModal from "../../components/ProductSelectionModal";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import {
  listProductImageUrls,
  buildProductsPayload,
  buildBrandDnaSessionPayload,
  getBrandNameFromDnaResponse,
  getStoreDomainFromDnaResponse,
  getPrimaryColorsFromDnaResponse,
  getAccentColorsFromDnaResponse,
  getStorefrontFontsFromDnaResponse,
  getTaglineFromDnaResponse,
  getBrandValuesFromDnaResponse,
  getBrandAestheticsFromDnaResponse,
  getToneChipsFromDnaResponse,
  getTargetAudienceFromDnaResponse,
  getBusinessOverviewFromDnaResponse,
  selectedProductsFromPersistedDnaApi,
  selectedProductsHaveImageUrls,
} from "./dnaHelpers.js";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";

const MAX_BRAND_DNA_PRODUCTS = 6;
const FETCH_DNA_SPINNER_MIN_MS = 3000;

const DNA_LOADING_STEPS = [
  "Looking at brand tone",
  "Looking at brand values",
  "Looking at Key Messages",
  "Looking at Colors and Visuals",
];

const DNA_LOADER_STEP_MS = 2500;
/** Height of the post-generation two-pane placeholder. */
const BRAND_DNA_RESULT_SPLIT_HEIGHT_PX = 500;
/** Minimum height for Colors / Fonts pair row (equal columns). */
const BRAND_DNA_ASSET_PANEL_MIN_HEIGHT_PX = 200;

const PRODUCT_INTRO_PHASE = {
  LOADING: "loading",
  READY: "ready",
};

/** Brand DNA routing: fresh build vs regenerate vs editing saved/profile from generation. */
const EXISTING_DNA_MODE = {
  NONE: "none",
  EDIT: "edit",
  REGENERATE: "regenerate",
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3C/svg%3E";

const DNA_EDIT_FIELD = {
  BRAND_NAME: "brand_name",
  COLORS: "colors",
  TAGLINE: "tagline",
  BRAND_VALUES: "brand_values",
  BRAND_AESTHETICS: "brand_aesthetics",
  TONE_CHIPS: "tone_chips",
  TARGET_AUDIENCE: "target_audience",
  BUSINESS_OVERVIEW: "business_overview",
};

function createClosedDnaEditModal() {
  return {
    open: false,
    field: null,
    brandName: "",
    primaryColors: [],
    accentColors: [],
    tagline: "",
    chips: [],
    targetAudience: "",
    businessOverview: "",
  };
}

function dnaEditModalTitle(field) {
  switch (field) {
    case DNA_EDIT_FIELD.BRAND_NAME:
      return "Edit brand name";
    case DNA_EDIT_FIELD.COLORS:
      return "Edit colors";
    case DNA_EDIT_FIELD.TAGLINE:
      return "Edit tagline";
    case DNA_EDIT_FIELD.BRAND_VALUES:
      return "Edit brand values";
    case DNA_EDIT_FIELD.BRAND_AESTHETICS:
      return "Edit brand aesthetics";
    case DNA_EDIT_FIELD.TONE_CHIPS:
      return "Edit tone of voice";
    case DNA_EDIT_FIELD.TARGET_AUDIENCE:
      return "Edit target audience";
    case DNA_EDIT_FIELD.BUSINESS_OVERVIEW:
      return "Edit business overview";
    default:
      return "Edit";
  }
}

const DEFAULT_PRIMARY_ADD_HEX = "#1a1a1a";
const DEFAULT_ACCENT_ADD_HEX = "#6366f1";

/** #rrggbb for `<input type="color" />` (falls back if invalid). */
function normalizeHexForColorInput(raw) {
  if (typeof raw !== "string") return "#000000";
  let s = raw.trim();
  if (!s) return "#000000";
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length === 3) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return "#000000";
  return `#${s.toLowerCase()}`;
}

const DNA_MODAL_SWATCH_PX = 44;
const DNA_MODAL_SWATCH_HOVER_PAD_PX = 8;

const DNA_MODAL_COLOR_PICKER_SLOT = {
  position: "relative",
  minHeight: "52px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "1px dashed rgba(0, 0, 0, 0.15)",
  background: "rgba(248, 248, 248, 1)",
  display: "flex",
  alignItems: "center",
  paddingInlineStart: "52px",
  paddingInlineEnd: "12px",
  boxSizing: "border-box",
};

const DNA_MODAL_COLOR_INPUT_ANCHOR = {
  position: "absolute",
  left: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "36px",
  height: "36px",
};

const DNA_MODAL_COLOR_INPUT_STACKED = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
  padding: 0,
  border: "none",
  margin: 0,
};

/** Primary / accent color editor: circular swatches, hover remove, add via dashed + circle. */
function DnaModalColorSwatchStrip({ heading, colors, onColorsChange, defaultNewHex }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const editInputRef = useRef(null);
  const addInputRef = useRef(null);
  const selectedIndexRef = useRef(null);
  selectedIndexRef.current = selectedIndex;

  const wrapSize = DNA_MODAL_SWATCH_PX + DNA_MODAL_SWATCH_HOVER_PAD_PX * 2;

  const removeAt = (index) => {
    onColorsChange(colors.filter((_, i) => i !== index));
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setHoveredIndex((h) => {
      if (h === null) return null;
      if (h === index) return null;
      if (h > index) return h - 1;
      return h;
    });
  };

  const openEditPicker = (index) => {
    const el = editInputRef.current;
    if (!el) return;
    el.value = normalizeHexForColorInput(colors[index]);
    requestAnimationFrame(() => el.click());
  };

  const handleSwatchClick = (i) => {
    selectedIndexRef.current = i;
    setSelectedIndex(i);
    requestAnimationFrame(() => openEditPicker(i));
  };

  const handleAddCircleClick = (e) => {
    e.preventDefault();
    selectedIndexRef.current = null;
    setSelectedIndex(null);
    const el = addInputRef.current;
    if (!el) return;
    el.value = normalizeHexForColorInput(defaultNewHex);
    requestAnimationFrame(() => el.click());
  };

  const handleAddInputChange = (e) => {
    onColorsChange([...colors, e.target.value]);
  };

  const handleAdjustChange = (e) => {
    const si = selectedIndexRef.current;
    if (si === null) return;
    const hex = e.target.value;
    onColorsChange(colors.map((c, j) => (j === si ? hex : c)));
  };

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        {heading}
      </Text>
      <Box style={{ position: "relative" }}>
        <Box
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {colors.map((hex, i) => (
            <Box
              key={`${heading}-swatch-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: "relative",
                width: wrapSize,
                height: wrapSize,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => handleSwatchClick(i)}
                aria-label={`${heading} color ${i + 1}`}
                aria-pressed={selectedIndex === i}
                style={{
                  width: DNA_MODAL_SWATCH_PX,
                  height: DNA_MODAL_SWATCH_PX,
                  borderRadius: "50%",
                  border:
                    selectedIndex === i
                      ? "3px solid #16a34a"
                      : "2px solid rgba(0, 0, 0, 0.12)",
                  background: normalizeHexForColorInput(hex),
                  padding: 0,
                  cursor: "pointer",
                  display: "block",
                  boxSizing: "border-box",
                }}
              />
              {hoveredIndex === i ? (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove color"
                  style={{
                    position: "absolute",
                    top: DNA_MODAL_SWATCH_HOVER_PAD_PX - 4,
                    insetInlineEnd: DNA_MODAL_SWATCH_HOVER_PAD_PX - 4,
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid rgba(0, 0, 0, 0.15)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <Icon source={XSmallIcon} tone="base" />
                </button>
              ) : null}
            </Box>
          ))}
          <button
            type="button"
            onClick={handleAddCircleClick}
            aria-label="Add color"
            style={{
              width: DNA_MODAL_SWATCH_PX,
              height: DNA_MODAL_SWATCH_PX,
              borderRadius: "50%",
              border: "2px dashed rgba(22, 163, 74, 0.65)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: 0,
              boxSizing: "border-box",
            }}
          >
            <Icon source={PlusIcon} tone="success" />
          </button>
        </Box>
          <Box style={{ ...DNA_MODAL_COLOR_INPUT_ANCHOR, zIndex: 1 }}>
            <input
              ref={editInputRef}
              type="color"
              aria-hidden
              tabIndex={-1}
              onChange={handleAdjustChange}
              style={{ ...DNA_MODAL_COLOR_INPUT_STACKED, zIndex: 1 }}
            />
            <input
              ref={addInputRef}
              type="color"
              aria-hidden
              tabIndex={-1}
              onChange={handleAddInputChange}
              style={{ ...DNA_MODAL_COLOR_INPUT_STACKED, zIndex: 2 }}
            />
          </Box>
      </Box>
    </BlockStack>
  );
}

/** White bordered card for each Brand DNA text block in the left result column. */
function DnaResultFieldBox({ children, style: styleProp, showEdit = true, onEditClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => showEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: "1px solid #d9d9d9",
        borderRadius: "12px",
        padding: "12px",
        width: "100%",
        boxSizing: "border-box",
        ...styleProp,
        position: "relative",
      }}
    >
      {showEdit ? (
      <Box
        style={{
          position: "absolute",
          top: "8px",
          insetInlineEnd: "8px",
          zIndex: 1,
          opacity: hovered ? 1 : 0,
          transition: "opacity 120ms ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <button
          type="button"
          aria-label="Edit"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditClick?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            margin: 0,
            padding: 0,
            border: "none",
            borderRadius: "8px",
            background: "rgba(0, 0, 0, 0.06)",
            cursor: "pointer",
          }}
        >
          <Icon source={EditIcon} tone="base" />
        </button>
      </Box>
      ) : null}
      {children}
    </Box>
  );
}

function dnaFontFamilyStack(familyName) {
  return familyName
    ? `"${familyName}", system-ui, -apple-system, sans-serif`
    : "system-ui, -apple-system, sans-serif";
}

/** Consistent label style for Brand DNA result fields (color, weight, size). */
function DnaFieldLabel({ children }) {
  return (
    <Text as="p" variant="bodySm" tone="subdued" fontWeight="light">
      {children}
    </Text>
  );
}

/** Wrapped chips (e.g. brand values, aesthetics, tone). */
function DnaChipRow({ items, tone = "info" }) {
  if (!items?.length) {
    return (
      <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
        —
      </Text>
    );
  }
  return (
    <Box
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
      }}
    >
      {items.map((label, i) => (
        <Badge key={`${label}-${i}`} tone={tone}>
          {label}
        </Badge>
      ))}
    </Box>
  );
}

export default function BuildDnaScreen({ onBack, onContinue }) {
  const isMobileLayout = useViewportBelowMd();
  const [productIntroPhase, setProductIntroPhase] = useState(PRODUCT_INTRO_PHASE.LOADING);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isGeneratingDna, setIsGeneratingDna] = useState(false);
  const [dnaLoadingStepIndex, setDnaLoadingStepIndex] = useState(0);
  const [brandDnaError, setBrandDnaError] = useState("");
  const [brandDnaComplete, setBrandDnaComplete] = useState(false);
  const [brandDnaBrandName, setBrandDnaBrandName] = useState("");
  const [brandDnaShopDomain, setBrandDnaShopDomain] = useState("");
  const [brandDnaPrimaryColors, setBrandDnaPrimaryColors] = useState([]);
  const [brandDnaAccentColors, setBrandDnaAccentColors] = useState([]);
  const [brandDnaStorefrontFonts, setBrandDnaStorefrontFonts] = useState([]);
  const [brandDnaTagline, setBrandDnaTagline] = useState("");
  const [brandDnaBrandValues, setBrandDnaBrandValues] = useState([]);
  const [brandDnaBrandAesthetics, setBrandDnaBrandAesthetics] = useState([]);
  const [brandDnaToneChips, setBrandDnaToneChips] = useState([]);
  const [brandDnaTargetAudience, setBrandDnaTargetAudience] = useState("");
  const [brandDnaBusinessOverview, setBrandDnaBusinessOverview] = useState("");
  const [dnaEditModal, setDnaEditModal] = useState(() => createClosedDnaEditModal());
  const [existingDnaMode, setExistingDnaMode] = useState(EXISTING_DNA_MODE.NONE);
  /** When user opens saved DNA via "Edit existing", hide product imagery until they regenerate. */
  const [hideCatalogImageryInDnaResult, setHideCatalogImageryInDnaResult] =
    useState(false);

  const selectedProductIds = useMemo(
    () => selectedProducts.map((p) => p.id).filter(Boolean),
    [selectedProducts]
  );

  const brandDnaResultGalleryItems = useMemo(() => {
    const items = [];
    selectedProducts.forEach((product, pi) => {
      const urls = listProductImageUrls(product);
      const list = urls.length > 0 ? urls : [PLACEHOLDER_IMG];
      const title = product?.title || "Product";
      list.forEach((url, i) => {
        items.push({
          key: `${product?.id ?? `p-${pi}`}-${i}-${url.slice(0, 48)}`,
          url,
          alt: `${title} — image ${i + 1}`,
        });
      });
    });
    return items;
  }, [selectedProducts]);

  const brandDnaHeadingFont = brandDnaStorefrontFonts[0] ?? "";
  const brandDnaBodyFont =
    brandDnaStorefrontFonts[1] ?? brandDnaStorefrontFonts[0] ?? "";

  /** Product strip / picker only when building or rebuilding DNA from the catalog (not when choosing or editing saved DNA). */
  const showProductPickerForDna =
    existingDnaMode === EXISTING_DNA_MODE.NONE ||
    existingDnaMode === EXISTING_DNA_MODE.REGENERATE;

  const openDnaEdit = (field) => {
    setDnaEditModal(() => {
      const base = { ...createClosedDnaEditModal(), open: true, field };
      switch (field) {
        case DNA_EDIT_FIELD.BRAND_NAME:
          base.brandName = brandDnaBrandName;
          break;
        case DNA_EDIT_FIELD.COLORS:
          base.primaryColors = [...brandDnaPrimaryColors];
          base.accentColors = [...brandDnaAccentColors];
          break;
        case DNA_EDIT_FIELD.TAGLINE:
          base.tagline = brandDnaTagline;
          break;
        case DNA_EDIT_FIELD.BRAND_VALUES:
          base.chips = [...brandDnaBrandValues];
          break;
        case DNA_EDIT_FIELD.BRAND_AESTHETICS:
          base.chips = [...brandDnaBrandAesthetics];
          break;
        case DNA_EDIT_FIELD.TONE_CHIPS:
          base.chips = [...brandDnaToneChips];
          break;
        case DNA_EDIT_FIELD.TARGET_AUDIENCE:
          base.targetAudience = brandDnaTargetAudience;
          break;
        case DNA_EDIT_FIELD.BUSINESS_OVERVIEW:
          base.businessOverview = brandDnaBusinessOverview;
          break;
        default:
          break;
      }
      return base;
    });
  };

  const closeDnaEdit = () => setDnaEditModal(createClosedDnaEditModal());

  const persistDnaPatch = (patch) => {
    if (!patch || typeof patch !== "object" || Object.keys(patch).length === 0) {
      return;
    }
    fetch("/api/brand-dna-update", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dna_patch: patch }),
    }).catch((err) => {
      console.error("Failed to persist Brand DNA edit:", err);
    });
  };

  const saveDnaEdit = () => {
    const m = dnaEditModal;
    if (!m.open || !m.field) return;
    let patch = null;
    switch (m.field) {
      case DNA_EDIT_FIELD.BRAND_NAME: {
        const next = m.brandName.trim();
        setBrandDnaBrandName(next);
        patch = { brand_name: next };
        break;
      }
      case DNA_EDIT_FIELD.COLORS: {
        const primary = m.primaryColors.map((c) => c.trim()).filter(Boolean);
        const accent = m.accentColors.map((c) => c.trim()).filter(Boolean);
        setBrandDnaPrimaryColors(primary);
        setBrandDnaAccentColors(accent);
        patch = { primary_colors: primary, accent_colors: accent };
        break;
      }
      case DNA_EDIT_FIELD.TAGLINE: {
        const next = m.tagline.trim();
        setBrandDnaTagline(next);
        patch = { tagline: next };
        break;
      }
      case DNA_EDIT_FIELD.BRAND_VALUES: {
        const next = m.chips.map((c) => c.trim()).filter(Boolean);
        setBrandDnaBrandValues(next);
        patch = { brand_values: next };
        break;
      }
      case DNA_EDIT_FIELD.BRAND_AESTHETICS: {
        const next = m.chips.map((c) => c.trim()).filter(Boolean);
        setBrandDnaBrandAesthetics(next);
        patch = { brand_aesthetic: next };
        break;
      }
      case DNA_EDIT_FIELD.TONE_CHIPS: {
        const next = m.chips.map((c) => c.trim()).filter(Boolean);
        setBrandDnaToneChips(next);
        patch = {
          tone_chips: next,
          tone_of_voice: next.length ? next.join(", ") : "professional",
        };
        break;
      }
      case DNA_EDIT_FIELD.TARGET_AUDIENCE: {
        const next = m.targetAudience.trim();
        setBrandDnaTargetAudience(next);
        patch = { target_audience: next };
        break;
      }
      case DNA_EDIT_FIELD.BUSINESS_OVERVIEW: {
        const next = m.businessOverview.trim();
        setBrandDnaBusinessOverview(next);
        patch = { business_overview: next };
        break;
      }
      default:
        break;
    }
    if (patch) persistDnaPatch(patch);
    setDnaEditModal(createClosedDnaEditModal());
  };

  const handleConfirmProducts = (products) => {
    const normalized = Array.isArray(products) ? products : [];
    setSelectedProducts(normalized);
  };

  const clearDnaDisplayState = () => {
    setBrandDnaBrandName("");
    setBrandDnaShopDomain("");
    setBrandDnaPrimaryColors([]);
    setBrandDnaAccentColors([]);
    setBrandDnaStorefrontFonts([]);
    setBrandDnaTagline("");
    setBrandDnaBrandValues([]);
    setBrandDnaBrandAesthetics([]);
    setBrandDnaToneChips([]);
    setBrandDnaTargetAudience("");
    setBrandDnaBusinessOverview("");
    setBrandDnaComplete(false);
  };

  const handleChooseRegenerateDna = () => {
    clearDnaDisplayState();
    setExistingDnaMode(EXISTING_DNA_MODE.REGENERATE);
    setBrandDnaError("");
    setHideCatalogImageryInDnaResult(false);
  };

  const handleGenerateDna = async () => {
    if (selectedProducts.length < 1) return;

    setBrandDnaError("");
    setBrandDnaComplete(false);
    setBrandDnaBrandName("");
    setBrandDnaShopDomain("");
    setBrandDnaPrimaryColors([]);
    setBrandDnaAccentColors([]);
    setBrandDnaStorefrontFonts([]);
    setBrandDnaTagline("");
    setBrandDnaBrandValues([]);
    setBrandDnaBrandAesthetics([]);
    setBrandDnaToneChips([]);
    setBrandDnaTargetAudience("");
    setBrandDnaBusinessOverview("");
    setDnaLoadingStepIndex(0);
    setIsGeneratingDna(true);

    try {
      const payload = buildProductsPayload(selectedProducts);
      const response = await fetch("/api/create-brand-ads-dna", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to generate Brand DNA");
      }
      setBrandDnaBrandName(getBrandNameFromDnaResponse(data));
      setBrandDnaShopDomain(getStoreDomainFromDnaResponse(data));
      setBrandDnaPrimaryColors(getPrimaryColorsFromDnaResponse(data));
      setBrandDnaAccentColors(getAccentColorsFromDnaResponse(data));
      setBrandDnaStorefrontFonts(getStorefrontFontsFromDnaResponse(data));
      setBrandDnaTagline(getTaglineFromDnaResponse(data));
      setBrandDnaBrandValues(getBrandValuesFromDnaResponse(data));
      setBrandDnaBrandAesthetics(getBrandAestheticsFromDnaResponse(data));
      setBrandDnaToneChips(getToneChipsFromDnaResponse(data));
      setBrandDnaTargetAudience(getTargetAudienceFromDnaResponse(data));
      setBrandDnaBusinessOverview(getBusinessOverviewFromDnaResponse(data));
      setDnaLoadingStepIndex(DNA_LOADING_STEPS.length);
      setBrandDnaComplete(true);
      setExistingDnaMode(EXISTING_DNA_MODE.EDIT);
      setHideCatalogImageryInDnaResult(false);
      setIsGeneratingDna(false);
    } catch (error) {
      console.error("Error generating Brand DNA:", error);
      setBrandDnaError(error?.message || "Failed to generate Brand DNA");
      setIsGeneratingDna(false);
    }
  };

  useEffect(() => {
    if (!isGeneratingDna) return undefined;
    const timer = setInterval(() => {
      setDnaLoadingStepIndex((prev) =>
        prev < DNA_LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, DNA_LOADER_STEP_MS);
    return () => clearInterval(timer);
  }, [isGeneratingDna]);

  useEffect(() => {
    let cancelled = false;

    async function loadIntro() {
      const startedAt = Date.now();
      try {
        const [prodRes, dnaRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/brand-dna-fetch", { credentials: "include" }),
        ]);
        const prodJson = await prodRes.json().catch(() => ({}));
        const dnaJson = await dnaRes.json().catch(() => ({}));
        if (cancelled) return;

        const storefrontProducts = Array.isArray(prodJson?.products) ? prodJson.products : [];

        const hasSavedDna =
          dnaRes.ok &&
          dnaJson?.success === true &&
          dnaJson?.data != null &&
          typeof dnaJson.data === "object";

        if (hasSavedDna) {
          setBrandDnaBrandName(getBrandNameFromDnaResponse(dnaJson));
          setBrandDnaShopDomain(getStoreDomainFromDnaResponse(dnaJson));
          setBrandDnaPrimaryColors(getPrimaryColorsFromDnaResponse(dnaJson));
          setBrandDnaAccentColors(getAccentColorsFromDnaResponse(dnaJson));
          setBrandDnaStorefrontFonts(getStorefrontFontsFromDnaResponse(dnaJson));
          setBrandDnaTagline(getTaglineFromDnaResponse(dnaJson));
          setBrandDnaBrandValues(getBrandValuesFromDnaResponse(dnaJson));
          setBrandDnaBrandAesthetics(getBrandAestheticsFromDnaResponse(dnaJson));
          setBrandDnaToneChips(getToneChipsFromDnaResponse(dnaJson));
          setBrandDnaTargetAudience(getTargetAudienceFromDnaResponse(dnaJson));
          setBrandDnaBusinessOverview(getBusinessOverviewFromDnaResponse(dnaJson));

          const storedCatalog = selectedProductsFromPersistedDnaApi(dnaJson);
          if (storedCatalog.length > 0) {
            const capped = storedCatalog.slice(0, MAX_BRAND_DNA_PRODUCTS);
            setSelectedProducts(capped);
            setHideCatalogImageryInDnaResult(!selectedProductsHaveImageUrls(capped));
          } else {
            setSelectedProducts(storefrontProducts.slice(0, MAX_BRAND_DNA_PRODUCTS));
            setHideCatalogImageryInDnaResult(true);
          }

          setBrandDnaComplete(true);
          setExistingDnaMode(EXISTING_DNA_MODE.EDIT);
        } else {
          setSelectedProducts(storefrontProducts.slice(0, MAX_BRAND_DNA_PRODUCTS));
          setExistingDnaMode(EXISTING_DNA_MODE.NONE);
        }
      } catch (error) {
        console.error("Failed to load Brand DNA step data:", error);
        if (!cancelled) {
          setSelectedProducts([]);
          setExistingDnaMode(EXISTING_DNA_MODE.NONE);
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, FETCH_DNA_SPINNER_MIN_MS - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        if (!cancelled) {
          setProductIntroPhase(PRODUCT_INTRO_PHASE.READY);
        }
      }
    }

    loadIntro();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <s-page heading="Brand ads" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
        <Box
          width="100%"
          style={{
            maxWidth: "1150px",
            marginInline: "auto",
            paddingInline: "clamp(12px, 4vw, 16px)",
            boxSizing: "border-box",
          }}
        >
          <Page
            fullWidth
            backAction={{ content: "Brand Ads", onAction: onBack }}
            title="Generate Brand DNA"
            subtitle="Step 1 of 3"
          >
            {productIntroPhase === PRODUCT_INTRO_PHASE.LOADING ? (
              <Box
                aria-live="polite"
                aria-busy
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  minHeight: "min(440px, 58vh)",
                  padding: "24px",
                }}
              >
                <Spinner size="large" accessibilityLabel="Loading Brand DNA and products" />
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading Brand DNA and products
                </Text>
              </Box>
            ) : null}

            {productIntroPhase === PRODUCT_INTRO_PHASE.READY ? (
              <Box style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}>
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  {showProductPickerForDna && (
                    <Card roundedAbove="sm" padding="0">
                      <Box background="bg-surface" padding="400">
                        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                          <Box maxWidth="600px">
                            <Text as="p" variant="bodyMd">
                              Here are the product we selected to create Brand DNA, which helps generate
                              campaign ads.
                            </Text>
                          </Box>
                          <InlineStack gap="200" wrap>
                            <Button
                              onClick={() => setShowProductModal(true)}
                              disabled={isGeneratingDna}
                              fullWidth={isMobileLayout}
                            >
                              Change products
                            </Button>
                            <Button
                              variant="primary"
                              onClick={handleGenerateDna}
                              disabled={selectedProducts.length === 0 || isGeneratingDna}
                              loading={isGeneratingDna}
                              fullWidth={isMobileLayout}
                            >
                              Generate DNA
                            </Button>
                          </InlineStack>
                        </InlineStack>
                      </Box>
                    </Card>
                  )}

                  {existingDnaMode === EXISTING_DNA_MODE.EDIT &&
                  brandDnaComplete &&
                  !isGeneratingDna ? (
                    <Card roundedAbove="sm" padding="0">
                      <Box background="bg-surface" padding="400">
                        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            Want a completely new profile from your products?
                          </Text>
                          <Button onClick={handleChooseRegenerateDna}>Regenerate DNA</Button>
                        </InlineStack>
                      </Box>
                    </Card>
                  ) : null}

                  {brandDnaComplete ? (
                    <Card roundedAbove="sm" padding="0">
                      <Box background="bg-surface" padding="400">
                        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                          <Box maxWidth="100%" style={{ flex: "1 1 280px", minWidth: 0 }}>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Below is the DNA that was created from the products you selected. In order to edit it hover and click the
                              edit icon.
                            </Text>
                          </Box>
                          <Box style={{ flexShrink: 0 }}>
                            <Button
                              variant="primary"
                              onClick={() =>
                                onContinue?.({
                                  brandDna: buildBrandDnaSessionPayload({
                                    brandName: brandDnaBrandName,
                                    shopDomain: brandDnaShopDomain,
                                    primaryColors: brandDnaPrimaryColors,
                                    accentColors: brandDnaAccentColors,
                                    storefrontFonts: brandDnaStorefrontFonts,
                                    tagline: brandDnaTagline,
                                    brandValues: brandDnaBrandValues,
                                    brandAesthetics: brandDnaBrandAesthetics,
                                    toneChips: brandDnaToneChips,
                                    targetAudience: brandDnaTargetAudience,
                                    businessOverview: brandDnaBusinessOverview,
                                  }),
                                })
                              }
                            >
                              Continue
                            </Button>
                          </Box>
                        </InlineStack>
                      </Box>
                    </Card>
                  ) : null}

                {!isGeneratingDna ? (
                  <>
                    {brandDnaComplete ? (
                      <Box
                        paddingInline="400"
                        paddingBlockStart="0"
                        paddingBlockEnd="400"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        borderWidth="025"
                        borderColor="border"
                        style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}
                      >
                        <Box
                          role="region"
                          aria-label="Brand DNA result"
                          style={{
                            display: "flex",
                            flexDirection: hideCatalogImageryInDnaResult
                              ? "column"
                              : isMobileLayout
                                ? "column-reverse"
                                : "row",
                            gap: "16px",
                            width: "100%",
                            height: `${BRAND_DNA_RESULT_SPLIT_HEIGHT_PX}px`,
                            minHeight: `${BRAND_DNA_RESULT_SPLIT_HEIGHT_PX}px`,
                            maxHeight: `${BRAND_DNA_RESULT_SPLIT_HEIGHT_PX}px`,
                            boxSizing: "border-box",
                          }}
                        >
                          <Box
                            style={{
                              flex: hideCatalogImageryInDnaResult ? "1 1 auto" : "1 1 0",
                              minWidth: 0,
                              height: "100%",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              border: "1px solid #d9d9d9",
                              borderRadius: "12px",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Box
                              role="region"
                              aria-label="Brand DNA details"
                              style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "12px",
                                WebkitOverflowScrolling: "touch",
                                boxSizing: "border-box",
                              }}
                            >
                              <BlockStack gap="300">
                                {brandDnaBrandName || brandDnaShopDomain ? (
                                  <DnaResultFieldBox
                                    onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.BRAND_NAME)}
                                  >
                                    <InlineStack
                                      align="space-between"
                                      blockAlign="start"
                                      gap="400"
                                      wrap={false}
                                    >
                                      <Box minWidth="0" maxWidth="55%">
                                        <BlockStack gap="100">
                                          <DnaFieldLabel>Brand name</DnaFieldLabel>
                                          <Text
                                            as="p"
                                            variant="headingLg"
                                            fontWeight="bold"
                                            breakWord
                                          >
                                            {brandDnaBrandName || "—"}
                                          </Text>
                                        </BlockStack>
                                      </Box>
                                    </InlineStack>
                                  </DnaResultFieldBox>
                                ) : null}
                                <Box
                                  style={{
                                    display: "flex",
                                    flexDirection: isMobileLayout ? "column" : "row",
                                    gap: "16px",
                                    width: "100%",
                                    alignItems: "stretch",
                                  }}
                                >
                                  <DnaResultFieldBox
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      minHeight: `${BRAND_DNA_ASSET_PANEL_MIN_HEIGHT_PX}px`,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                    onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.COLORS)}
                                  >
                                    <DnaFieldLabel>Colors</DnaFieldLabel>
                                    <Box
                                      style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                        paddingBlockStart: "12px",
                                        minHeight: 0,
                                        width: "100%",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <Box
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "8px",
                                          width: "100%",
                                        }}
                                      >
                                        <DnaFieldLabel>Primary colors</DnaFieldLabel>
                                        <Box
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                            alignContent: "flex-start",
                                            alignItems: "center",
                                            width: "100%",
                                          }}
                                        >
                                          {brandDnaPrimaryColors.length > 0 ? (
                                            brandDnaPrimaryColors.map((hex, i) => (
                                              <Box
                                                key={`primary-${hex}-${i}`}
                                                title={hex}
                                                style={{
                                                  width: "36px",
                                                  height: "36px",
                                                  borderRadius: "50%",
                                                  backgroundColor: hex.trim(),
                                                  border: "1px solid rgba(0, 0, 0, 0.12)",
                                                  flexShrink: 0,
                                                  boxSizing: "border-box",
                                                }}
                                              />
                                            ))
                                          ) : (
                                            <Text as="p" variant="bodySm" tone="subdued">
                                              None listed
                                            </Text>
                                          )}
                                        </Box>
                                      </Box>
                                      <Box
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "8px",
                                          width: "100%",
                                        }}
                                      >
                                        <DnaFieldLabel>Accent colors</DnaFieldLabel>
                                        <Box
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                            alignContent: "flex-start",
                                            alignItems: "center",
                                            width: "100%",
                                          }}
                                        >
                                          {brandDnaAccentColors.length > 0 ? (
                                            brandDnaAccentColors.map((hex, i) => (
                                              <Box
                                                key={`accent-${hex}-${i}`}
                                                title={hex}
                                                style={{
                                                  width: "36px",
                                                  height: "36px",
                                                  borderRadius: "50%",
                                                  backgroundColor: hex.trim(),
                                                  border: "1px solid rgba(0, 0, 0, 0.12)",
                                                  flexShrink: 0,
                                                  boxSizing: "border-box",
                                                }}
                                              />
                                            ))
                                          ) : (
                                            <Text as="p" variant="bodySm" tone="subdued">
                                              None listed
                                            </Text>
                                          )}
                                        </Box>
                                      </Box>
                                    </Box>
                                  </DnaResultFieldBox>
                                  <DnaResultFieldBox
                                    showEdit={false}
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      minHeight: `${BRAND_DNA_ASSET_PANEL_MIN_HEIGHT_PX}px`,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                  >
                                    <DnaFieldLabel>Fonts</DnaFieldLabel>
                                    <Box
                                      style={{
                                        flex: 1,
                                        minHeight: 0,
                                        paddingBlockStart: "12px",
                                        width: "100%",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <BlockStack gap="400">
                                        <BlockStack gap="100">
                                          <DnaFieldLabel>Heading font</DnaFieldLabel>
                                          <Text
                                            as="p"
                                            variant="bodyMd"
                                            fontWeight="normal"
                                            breakWord
                                            style={{
                                              fontFamily: dnaFontFamilyStack(brandDnaHeadingFont),
                                            }}
                                          >
                                            {brandDnaHeadingFont || "—"}
                                          </Text>
                                        </BlockStack>
                                        <BlockStack gap="100">
                                          <DnaFieldLabel>Body font</DnaFieldLabel>
                                          <Text
                                            as="p"
                                            variant="bodyMd"
                                            fontWeight="normal"
                                            breakWord
                                            style={{
                                              fontFamily: dnaFontFamilyStack(brandDnaBodyFont),
                                            }}
                                          >
                                            {brandDnaBodyFont || "—"}
                                          </Text>
                                        </BlockStack>
                                      </BlockStack>
                                    </Box>
                                  </DnaResultFieldBox>
                                </Box>
                                <DnaResultFieldBox
                                  style={{ width: "100%", maxWidth: "100%" }}
                                  onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.TAGLINE)}
                                >
                                  <BlockStack gap="100">
                                    <DnaFieldLabel>Tagline</DnaFieldLabel>
                                    <Text
                                      as="p"
                                      variant="bodyMd"
                                      fontWeight="normal"
                                      breakWord
                                    >
                                      {brandDnaTagline || "—"}
                                    </Text>
                                  </BlockStack>
                                </DnaResultFieldBox>
                                <Box
                                  style={{
                                    display: "flex",
                                    flexDirection: isMobileLayout ? "column" : "row",
                                    gap: "16px",
                                    width: "100%",
                                    alignItems: "stretch",
                                  }}
                                >
                                  <DnaResultFieldBox
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                    onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.BRAND_VALUES)}
                                  >
                                    <DnaFieldLabel>Brand values</DnaFieldLabel>
                                    <Box
                                      style={{
                                        paddingBlockStart: "8px",
                                        flex: 1,
                                        minHeight: 0,
                                      }}
                                    >
                                      <DnaChipRow items={brandDnaBrandValues} tone="success" />
                                    </Box>
                                  </DnaResultFieldBox>
                                  <DnaResultFieldBox
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                    onEditClick={() =>
                                      openDnaEdit(DNA_EDIT_FIELD.BRAND_AESTHETICS)
                                    }
                                  >
                                    <DnaFieldLabel>Brand aesthetics</DnaFieldLabel>
                                    <Box
                                      style={{
                                        paddingBlockStart: "8px",
                                        flex: 1,
                                        minHeight: 0,
                                      }}
                                    >
                                      <DnaChipRow items={brandDnaBrandAesthetics} tone="magic" />
                                    </Box>
                                  </DnaResultFieldBox>
                                  <DnaResultFieldBox
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                    onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.TONE_CHIPS)}
                                  >
                                    <DnaFieldLabel>Tone of voice</DnaFieldLabel>
                                    <Box
                                      style={{
                                        paddingBlockStart: "8px",
                                        flex: 1,
                                        minHeight: 0,
                                      }}
                                    >
                                      <DnaChipRow items={brandDnaToneChips} tone="info" />
                                    </Box>
                                  </DnaResultFieldBox>
                                </Box>
                                <DnaResultFieldBox
                                  style={{ width: "100%", maxWidth: "100%" }}
                                  onEditClick={() => openDnaEdit(DNA_EDIT_FIELD.TARGET_AUDIENCE)}
                                >
                                  <BlockStack gap="100">
                                    <DnaFieldLabel>Target audience</DnaFieldLabel>
                                    <Text
                                      as="p"
                                      variant="bodyMd"
                                      fontWeight="normal"
                                      breakWord
                                    >
                                      {brandDnaTargetAudience || "—"}
                                    </Text>
                                  </BlockStack>
                                </DnaResultFieldBox>
                                <DnaResultFieldBox
                                  style={{ width: "100%", maxWidth: "100%" }}
                                  onEditClick={() =>
                                    openDnaEdit(DNA_EDIT_FIELD.BUSINESS_OVERVIEW)
                                  }
                                >
                                  <BlockStack gap="100">
                                    <DnaFieldLabel>Business overview</DnaFieldLabel>
                                    <Text
                                      as="p"
                                      variant="bodyMd"
                                      fontWeight="normal"
                                      breakWord
                                    >
                                      {brandDnaBusinessOverview || "—"}
                                    </Text>
                                  </BlockStack>
                                </DnaResultFieldBox>
                                {/* More fields: wrap in <DnaResultFieldBox>…</DnaResultFieldBox> */}
                              </BlockStack>
                            </Box>
                          </Box>
                          {!hideCatalogImageryInDnaResult ? (
                          <Box
                            style={{
                              flex: "1 1 0",
                              minWidth: 0,
                              height: "100%",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              border: "1px solid #d9d9d9",
                              borderRadius: "12px",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Box
                              role="region"
                              aria-label="Images from selected products"
                              style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "12px",
                                WebkitOverflowScrolling: "touch",
                                boxSizing: "border-box",
                              }}
                            >
                              <Box
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                  alignContent: "flex-start",
                                }}
                              >
                                {brandDnaResultGalleryItems.map((item) => (
                                  <Box
                                    key={item.key}
                                    style={{
                                      flex: "1 1 calc(33.333% - 8px)",
                                      minWidth: "72px",
                                      maxWidth: "calc(50% - 4px)",
                                      aspectRatio: "1 / 1",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      border: "1px solid #e8e8e8",
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <img
                                      src={item.url}
                                      alt={item.alt}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          </Box>
                          ) : null}
                        </Box>
                      </Box>
                    ) : !showProductPickerForDna ? null : selectedProducts.length === 0 ? (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        No products found. Add products in Shopify admin, then open this step again.
                      </Text>
                    ) : (
                      <Box
                        paddingInline="400"
                        paddingBlockStart="0"
                        paddingBlockEnd="400"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        borderWidth="025"
                        borderColor="border"
                        style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}
                      >
                        <Box
                          role="region"
                          aria-label="Top products for Brand DNA"
                          style={{
                            display: "flex",
                            gap: "16px",
                            width: "100%",
                            overflowX: "auto",
                            overflowY: "hidden",
                            flexWrap: "nowrap",
                            padding: "0 4px 12px",
                            WebkitOverflowScrolling: "touch",
                            scrollSnapType: "x mandatory",
                            minWidth: 0,
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {selectedProducts.map((product, index) => {
                            const imageUrl =
                              product?.featuredImage?.url ||
                              product?.images?.edges?.[0]?.node?.url ||
                              PLACEHOLDER_IMG;
                            const title = product?.title || "Untitled product";
                            const itemKey = product?.id ?? `product-${index}`;

                            return (
                              <Box
                                key={itemKey}
                                style={{
                                  flex: "0 0 248px",
                                  minWidth: "248px",
                                  scrollSnapAlign: "start",
                                  boxSizing: "border-box",
                                  background: "#ffffff",
                                  border: "1px solid #d9d9d9",
                                  borderRadius: "12px",
                                  padding: "12px",
                                }}
                              >
                                <BlockStack gap="200">
                                  <Box
                                    style={{
                                      width: "100%",
                                      aspectRatio: "1 / 1",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      // background: "#f3f4f6",
                                    }}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={title}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                  </Box>
                                  <Text
                                    as="p"
                                    variant="bodySm"
                                    fontWeight="medium"
                                    breakWord
                                    style={{
                                      minHeight: "42px",
                                      lineHeight: "1.35",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {title}
                                  </Text>
                                </BlockStack>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <Card roundedAbove="sm" padding="0">
                    <Box background="bg-surface" padding="600">
                      <BlockStack gap="400">
                      <BlockStack gap="100">
                        <Text variant="headingMd" fontWeight="bold">
                          Generating your Brand DNA
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Hang tight — we&apos;re analyzing your storefront and products.
                        </Text>
                      </BlockStack>

                      <BlockStack gap="300">
                        {DNA_LOADING_STEPS.map((label, i) => {
                          const done = i < dnaLoadingStepIndex;
                          const active = i === dnaLoadingStepIndex;
                          const pending = i > dnaLoadingStepIndex;

                          return (
                            <Box
                              key={label}
                              style={{
                                display: "flex",
                                gap: "16px",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {done ? (
                                  <Icon source={CheckIcon} tone="success" />
                                ) : active ? (
                                  <Spinner size="small" accessibilityLabel={label} />
                                ) : (
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: "rgba(0, 0, 0, 0.15)",
                                    }}
                                  />
                                )}
                              </div>
                              <Text
                                variant="bodyMd"
                                fontWeight={active ? "semibold" : "regular"}
                                tone={pending ? "subdued" : "base"}
                              >
                                {label}
                              </Text>
                            </Box>
                          );
                        })}
                      </BlockStack>
                      </BlockStack>
                    </Box>
                  </Card>
                )}
                </Box>
              </Box>
            ) : null}
          </Page>
        </Box>
      </Box>

      <Modal
        open={dnaEditModal.open}
        onClose={closeDnaEdit}
        title={dnaEditModalTitle(dnaEditModal.field)}
        primaryAction={{ content: "Save", onAction: saveDnaEdit }}
        secondaryActions={[{ content: "Cancel", onAction: closeDnaEdit }]}
      >
        <Box padding="400">
          <BlockStack gap="400">
            {dnaEditModal.field === DNA_EDIT_FIELD.BRAND_NAME ? (
              <TextField
                label="Brand name"
                value={dnaEditModal.brandName}
                onChange={(brandName) => setDnaEditModal((m) => ({ ...m, brandName }))}
                autoComplete="off"
              />
            ) : null}
            {dnaEditModal.field === DNA_EDIT_FIELD.COLORS ? (
              <BlockStack gap="500">
                <DnaModalColorSwatchStrip
                  heading="Primary colors"
                  colors={dnaEditModal.primaryColors}
                  onColorsChange={(primaryColors) =>
                    setDnaEditModal((m) => ({ ...m, primaryColors }))
                  }
                  defaultNewHex={DEFAULT_PRIMARY_ADD_HEX}
                />
                <DnaModalColorSwatchStrip
                  heading="Accent colors"
                  colors={dnaEditModal.accentColors}
                  onColorsChange={(accentColors) =>
                    setDnaEditModal((m) => ({ ...m, accentColors }))
                  }
                  defaultNewHex={DEFAULT_ACCENT_ADD_HEX}
                />
              </BlockStack>
            ) : null}
            {dnaEditModal.field === DNA_EDIT_FIELD.TAGLINE ? (
              <TextField
                label="Tagline"
                value={dnaEditModal.tagline}
                onChange={(tagline) => setDnaEditModal((m) => ({ ...m, tagline }))}
                autoComplete="off"
                multiline={3}
              />
            ) : null}
            {dnaEditModal.field === DNA_EDIT_FIELD.BRAND_VALUES ||
            dnaEditModal.field === DNA_EDIT_FIELD.BRAND_AESTHETICS ||
            dnaEditModal.field === DNA_EDIT_FIELD.TONE_CHIPS ? (
              <BlockStack gap="300">
                {dnaEditModal.chips.map((chip, i) => (
                  <InlineStack key={`chip-${i}`} gap="200" blockAlign="end" wrap>
                    <Box minWidth="200px" style={{ flex: "1 1 200px" }}>
                      <TextField
                        label={`Item ${i + 1}`}
                        value={chip}
                        onChange={(v) =>
                          setDnaEditModal((m) => ({
                            ...m,
                            chips: m.chips.map((c, j) => (j === i ? v : c)),
                          }))
                        }
                        autoComplete="off"
                      />
                    </Box>
                    <Button
                      onClick={() =>
                        setDnaEditModal((m) => ({
                          ...m,
                          chips: m.chips.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </InlineStack>
                ))}
                <Button
                  onClick={() =>
                    setDnaEditModal((m) => ({ ...m, chips: [...m.chips, ""] }))
                  }
                >
                  Add item
                </Button>
              </BlockStack>
            ) : null}
            {dnaEditModal.field === DNA_EDIT_FIELD.TARGET_AUDIENCE ? (
              <TextField
                label="Target audience"
                value={dnaEditModal.targetAudience}
                onChange={(targetAudience) =>
                  setDnaEditModal((m) => ({ ...m, targetAudience }))
                }
                autoComplete="off"
                multiline={4}
              />
            ) : null}
            {dnaEditModal.field === DNA_EDIT_FIELD.BUSINESS_OVERVIEW ? (
              <TextField
                label="Business overview"
                value={dnaEditModal.businessOverview}
                onChange={(businessOverview) =>
                  setDnaEditModal((m) => ({ ...m, businessOverview }))
                }
                autoComplete="off"
                multiline={6}
              />
            ) : null}
          </BlockStack>
        </Box>
      </Modal>

      <ProductSelectionModal
        open={showProductPickerForDna && showProductModal}
        onClose={() => setShowProductModal(false)}
        onConfirm={handleConfirmProducts}
        minSelectable={1}
        maxSelectable={MAX_BRAND_DNA_PRODUCTS}
        initialSelectedIds={selectedProductIds}
      />
    </s-page>
  );
}
