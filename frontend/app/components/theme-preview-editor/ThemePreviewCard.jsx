import { useEffect, useMemo, useRef, useState } from "react";
import { BlockStack, Button, Text } from "@shopify/polaris";
import LiquidPagePreview from "./LiquidPagePreview.jsx";
import LiquidPreviewRender from "./LiquidPreviewRender.jsx";
import EyeIcon from "../icons/EyeIcon.jsx";
import {
  demoHtmlUrlToThumbUrl,
  getDemoCardPosterUrl,
} from "../../lib/demoPreviewUrls.js";
import { formatCredits, hasEnoughCredits } from "../../lib/credits.js";

/** Max visible thumbnail window height (px). Shorter images shrink the frame (no empty band). */
const PREVIEW_HEIGHT = 220;
/**
 * Layout width rendered inside the card (desktop CSS, not mobile).
 * Narrower than a full 1280 storefront so scaled text stays readable.
 */
const CARD_LAYOUT_WIDTH = 960;

function isPageLayoutDemo(demoFamily, demoVariant) {
  const v = String(demoVariant || "").toLowerCase();
  if (demoFamily === "pdp") return true;
  if (v.startsWith("product-")) return true;
  if (v === "sleek" || v === "vibe") return true;
  return false;
}

/**
 * Theme option card. The picture is the saved JPEG, shown as soon as the card mounts.
 * A live page is drawn only when that JPEG is missing. The eye button renders separately.
 */
export default function ThemePreviewCard({
  title,
  blurb,
  selected = false,
  onSelect,
  onPreview,
  onBeginMagic,
  beginMagicDisabled = false,
  beginMagicLoading = false,
  beginMagicLabel = "Begin Magic",
  previewProps = null,
  templateRows = null,
  previewCacheKey = null,
  liquidPreviewType = "landing-page",
  prebuiltHtmlUrl = null,
  /** Optional explicit screenshot URL; defaults to .jpg beside prebuilt HTML. */
  thumbUrl = null,
  /** Full-page screenshot. On hover the card scrolls through it. Preview stays live. */
  hoverImageUrl = null,
  /** Standalone page URL. When set, the card shows this layout instead of liquid sections. */
  framePreviewUrl = null,
  /** family/variant/category for poster fallback from existing CDN demo images. */
  demoFamily = "store",
  demoVariant = null,
  demoCategory = "general",
  /** Credit cost for this card. Renders "{cost} credits required · You have {balance}". */
  creditCost = null,
  /** Current wallet balance. Null while the wallet is still loading. */
  creditBalance = null,
  /** Open the credits page when this card costs more than the wallet holds. */
  onGetCredits = null,
  /** Internal shops always keep Begin Magic. */
  skipCreditGate = false,
  /** Optional corner pill on the preview, e.g. { label: "New", tone: "new" } or { label: "Top rated", tone: "top" }. */
  badge = null,
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);
  const [imageNatural, setImageNatural] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);
  const frameRef = useRef(null);
  const hoverImgRef = useRef(null);
  const hoverNaturalRef = useRef(null);
  const hoverYRef = useRef(0);
  const hoverDirRef = useRef(1);

  const pageLayoutDemo = isPageLayoutDemo(demoFamily, demoVariant);
  const demoVariantLc = String(demoVariant || "").toLowerCase();
  // classic-home has no dedicated screenshot here, so its HTML url is not used as the card picture.
  const classicHomeWithoutCheckout = demoVariantLc === "classic-home";
  const effectivePrebuiltHtmlUrl = classicHomeWithoutCheckout
    ? null
    : prebuiltHtmlUrl;

  const resolvedThumbUrl = useMemo(
    () => thumbUrl || demoHtmlUrlToThumbUrl(effectivePrebuiltHtmlUrl),
    [thumbUrl, effectivePrebuiltHtmlUrl],
  );

  /**
   * Home cards can use a banner poster (instant).
   * Product/page templates must NOT use a lone product photo — that looks wrong;
   * prefer screenshot thumb or a properly scaled page iframe.
   */
  const posterUrl = useMemo(() => {
    if (!demoVariant || pageLayoutDemo) return null;
    return getDemoCardPosterUrl({
      family: demoFamily,
      variant: demoVariant,
      category: demoCategory,
    });
  }, [demoFamily, demoVariant, demoCategory, pageLayoutDemo]);

  useEffect(() => {
    setThumbFailed(false);
    setImageNatural(null);
  }, [resolvedThumbUrl]);

  useEffect(() => {
    setPosterFailed(false);
  }, [posterUrl]);

  useEffect(() => {
    hoverNaturalRef.current = null;
    setHoverReady(false);
    setHovering(false);
    if (!hoverImageUrl) return undefined;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        hoverNaturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      }
      setHoverReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setHoverReady(false);
    };
    img.src = hoverImageUrl;
    return () => {
      cancelled = true;
    };
  }, [hoverImageUrl]);

  // Fit scale to the actual card width so nothing is clipped on the sides.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const apply = (width) => {
      if (width > 0) setFrameWidth(width);
    };
    apply(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (typeof w === "number") apply(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Classic home without its own screenshot still renders live so the saved
  // checkout block is not shown. Every other card paints its JPEG immediately.
  const useLiveHtmlThumb =
    !thumbUrl &&
    !resolvedThumbUrl &&
    !pageLayoutDemo &&
    (demoVariantLc.includes("classic-home-prepaid") ||
      classicHomeWithoutCheckout ||
      (demoVariantLc === "multi-home" && !effectivePrebuiltHtmlUrl));

  const showCardJpeg = Boolean(resolvedThumbUrl) && !thumbFailed && !useLiveHtmlThumb;
  const showPoster =
    !showCardJpeg &&
    !useLiveHtmlThumb &&
    !pageLayoutDemo &&
    !posterFailed &&
    Boolean(posterUrl);
  const activeImageUrl = showCardJpeg ? resolvedThumbUrl : showPoster ? posterUrl : null;
  const showHoverScroll = Boolean(hoverImageUrl) && hovering && hoverReady;

  useEffect(() => {
    if (!showHoverScroll) {
      hoverYRef.current = 0;
      hoverDirRef.current = 1;
      return undefined;
    }
    const img = hoverImgRef.current;
    const frame = frameRef.current;
    const natural = hoverNaturalRef.current;
    if (!img || !frame || !natural?.w || !natural?.h) return undefined;

    let raf = 0;
    let y = hoverYRef.current;
    let direction = hoverDirRef.current;
    let last = 0;
    const tick = (now) => {
      if (!last) last = now;
      const frameHeight = frame.clientHeight;
      const shownHeight = frame.clientWidth * (natural.h / natural.w);
      const maxScroll = Math.max(0, shownHeight - frameHeight);
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (maxScroll > 0 && dt > 0) {
        const pixelsPerSecond = maxScroll / 8;
        y += direction * pixelsPerSecond * dt;
        if (y >= maxScroll) {
          y = maxScroll;
          direction = -1;
        } else if (y <= 0) {
          y = 0;
          direction = 1;
        }
      }
      hoverYRef.current = y;
      hoverDirRef.current = direction;
      img.style.transform = `translateY(-${y}px)`;
      raf = requestAnimationFrame(tick);
    };
    img.style.transform = `translateY(-${y}px)`;
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [showHoverScroll, frameWidth]);

  const useStaticImage = Boolean(activeImageUrl);
  const useIframeFallback =
    !useStaticImage &&
    (Boolean(previewProps) ||
      (Array.isArray(templateRows) && templateRows.length > 0));

  // Width-fit static thumbs: frame height matches image (capped) — no gray empty band.
  const previewFrameHeight = useMemo(() => {
    if (
      useStaticImage &&
      frameWidth > 0 &&
      imageNatural?.w > 0 &&
      imageNatural?.h > 0
    ) {
      const fitted = Math.round(frameWidth * (imageNatural.h / imageNatural.w));
      return Math.max(120, Math.min(PREVIEW_HEIGHT, fitted));
    }
    return PREVIEW_HEIGHT;
  }, [useStaticImage, frameWidth, imageNatural]);

  const fitScale =
    frameWidth > 0 ? frameWidth / CARD_LAYOUT_WIDTH : 0.32;
  const layoutHeight = Math.ceil(previewFrameHeight / Math.max(fitScale, 0.08));

  const numericCost = Number(creditCost);
  const showCreditMeter = Number.isFinite(numericCost) && numericCost > 0;
  const balanceKnown = typeof creditBalance === "number" && !Number.isNaN(creditBalance);
  const needsCredits =
    showCreditMeter &&
    !skipCreditGate &&
    balanceKnown &&
    !hasEnoughCredits(creditBalance, numericCost);
  const meterPct = showCreditMeter
    ? Math.max(
        0,
        Math.min(100, ((balanceKnown ? creditBalance : 0) / numericCost) * 100),
      )
    : 0;

  return (
    <div
      style={{
        border: `2px solid ${selected ? "#2C6ECB" : "#d1d5db"}`,
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: selected ? "0 0 0 1px #2C6ECB" : "none",
      }}
    >
      <div
        ref={frameRef}
        role={typeof onSelect === "function" ? "button" : undefined}
        tabIndex={typeof onSelect === "function" ? 0 : undefined}
        onClick={
          typeof onSelect === "function"
            ? (e) => {
                e.preventDefault();
                onSelect();
              }
            : undefined
        }
        onKeyDown={
          typeof onSelect === "function"
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect();
                }
              }
            : undefined
        }
        onMouseEnter={hoverImageUrl ? () => setHovering(true) : undefined}
        onMouseLeave={hoverImageUrl ? () => setHovering(false) : undefined}
        style={{
          position: "relative",
          height: previewFrameHeight,
          overflow: "hidden",
          overflowAnchor: "none",
          background: "#f6f6f7",
          borderBottom: "1px solid #e1e3e5",
          cursor: typeof onSelect === "function" ? "pointer" : "default",
        }}
      >
        {badge?.label ? (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 5,
              pointerEvents: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "16px",
              letterSpacing: "0.02em",
              color: badge.tone === "top" ? "#4a3500" : "#ffffff",
              background: badge.tone === "top" ? "#ffd666" : "#6b0808",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.18)",
            }}
          >
            {badge.tone === "top" ? "\u2605 " : ""}
            {badge.label}
          </span>
        ) : null}
        {framePreviewUrl ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: CARD_LAYOUT_WIDTH,
              height: Math.ceil(previewFrameHeight / Math.max(fitScale, 0.08)),
              transform: `scale(${fitScale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          >
            <iframe
              title=""
              src={framePreviewUrl}
              scrolling="no"
              style={{
                width: CARD_LAYOUT_WIDTH,
                height: 4800,
                border: 0,
                pointerEvents: "none",
                background: "#FFFCF5",
              }}
            />
          </div>
        ) : useStaticImage ? (
          <>
            <img
              src={activeImageUrl}
              alt=""
              decoding="async"
              loading="eager"
              fetchPriority="high"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
                }
              }}
              onError={() => {
                if (showCardJpeg) setThumbFailed(true);
                else setPosterFailed(true);
              }}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                pointerEvents: "none",
                visibility: showHoverScroll ? "hidden" : "visible",
              }}
            />
            {showHoverScroll ? (
              <img
                ref={hoverImgRef}
                src={hoverImageUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  display: "block",
                  width: "100%",
                  height: "auto",
                  pointerEvents: "none",
                  overflowAnchor: "none",
                  transform: "translateY(0px)",
                }}
              />
            ) : null}
          </>
        ) : useIframeFallback ? (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: CARD_LAYOUT_WIDTH,
                height: layoutHeight,
                transform: `scale(${fitScale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            >
              {previewProps ? (
                <LiquidPagePreview
                  key={
                    effectivePrebuiltHtmlUrl ||
                    `tpl-${previewProps.selectedTemplate}-${previewProps.pageType}`
                  }
                  {...previewProps}
                  previewMode="desktop"
                  selectorMode={false}
                  attachBelowChrome={false}
                  thumbnailMode
                  minHeight={`${layoutHeight}px`}
                  style={{ height: "100%", width: CARD_LAYOUT_WIDTH }}
                  prebuiltHtmlUrl={null}
                />
              ) : (
                <LiquidPreviewRender
                  key={effectivePrebuiltHtmlUrl || previewCacheKey || "rows"}
                  templateRows={templateRows}
                  previewMode="desktop"
                  selectedSection={null}
                  storeName={null}
                  attachBelowChrome={false}
                  thumbnailMode
                  minHeight={`${layoutHeight}px`}
                  liquidPreviewType={liquidPreviewType}
                  previewCacheKey={previewCacheKey}
                  prebuiltHtmlUrl={null}
                  style={{ width: CARD_LAYOUT_WIDTH, height: "100%" }}
                />
              )}
            </div>
            <div
              data-preview-block
              onWheel={(e) => {
                // Keep card thumbnails frozen — never scroll the iframe on hover/wheel.
                e.preventDefault();
              }}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                cursor: typeof onSelect === "function" ? "pointer" : "default",
              }}
              aria-hidden
            />
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8c9196",
              fontSize: 13,
            }}
          >
            Preview
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: "12px 14px 14px",
          boxSizing: "border-box",
        }}
      >
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm" fontWeight="semibold">
            {title}
          </Text>
          {blurb ? (
            <Text as="p" variant="bodySm" tone="subdued">
              {blurb}
            </Text>
          ) : null}
          {showCreditMeter ? (
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.3,
                  color: "#202223",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {formatCredits(numericCost, "credits")} required
                </span>
                {balanceKnown ? (
                  <span style={{ fontWeight: 450 }}>
                    {" "}
                    · You have {Number(creditBalance).toLocaleString()}
                  </span>
                ) : null}
              </p>
              <div
                style={{
                  marginTop: 8,
                  height: 4,
                  borderRadius: 999,
                  background: "#ececec",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${meterPct}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: balanceKnown && hasEnoughCredits(creditBalance, numericCost)
                      ? "#1f8a4c"
                      : "#e0a317",
                  }}
                />
              </div>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
          >
            {typeof onPreview === "function" ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Button
                  fullWidth
                  size="slim"
                  onClick={() => onPreview()}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <EyeIcon width={14} height={14} />
                    Preview
                  </span>
                </Button>
              </div>
            ) : null}
            {needsCredits ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Button
                  fullWidth
                  size="slim"
                  onClick={() => onGetCredits?.()}
                >
                  Get credits
                </Button>
              </div>
            ) : typeof onBeginMagic === "function" ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Button
                  fullWidth
                  size="slim"
                  variant="primary"
                  disabled={beginMagicDisabled}
                  loading={beginMagicLoading}
                  onClick={() => onBeginMagic()}
                >
                  {beginMagicLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </BlockStack>
      </div>
    </div>
  );
}
