import { memo, useMemo } from "react";
import { Box } from "@shopify/polaris";
import LiquidRenderer from "./LiquidRenderer";

/** Stable signature of the row structure (template names + count) — changes between distinct theme/template choices but not on per-block setting edits. */
function buildStructuralKey(templateRows, liquidPreviewType) {
    if (!Array.isArray(templateRows) || templateRows.length === 0) {
        return `${liquidPreviewType}:empty`;
    }
    const parts = [];
    for (const row of templateRows) {
        const items = Array.isArray(row) ? row : [row];
        for (const item of items) {
            if (Array.isArray(item)) {
                for (const i of item) parts.push(i?.template || "?");
            } else {
                parts.push(item?.template || "?");
            }
        }
    }
    return `${liquidPreviewType}:${parts.join(",")}`;
}

const MOBILE_PREVIEW_WIDTH = 390;

const PREVIEW_WIDTHS = {
    /** Capped like mobile so zoom changes horizontal fit; centered in the preview shell. */
    desktop: "min(1280px, 100%)",
    /** Fixed phone width so device toggle is always visually distinct from desktop. */
    mobile: `${MOBILE_PREVIEW_WIDTH}px`,
};

/**
 * Renders the Liquid preview – fetches and displays HTML from templates.
 * Uses an iframe to isolate the viewport so Liquid content uses preview dimensions
 * (width/height of container) instead of the main window.
 * CSS/JS are now inlined server-side for better LCP performance.
 */
function LiquidPreviewRender({
    templateRows,
    previewMode = "desktop",
    selectedSection = null,
    storeName = null,
    storeHeaderContent = null,
    selectorMode = false,
    stylePreferences = null,
    style = {},
    className = "",
    minHeight = "500px",
    liquidPreviewType = "landing-page",
    /** When set, reuses cached Liquid HTML across tab switches (see liquidPreviewCache). */
    previewCacheKey = null,
    /** When true, no top border / flat top so the card meets a toolbar row above (e.g. mac-style chrome). */
    attachBelowChrome = false,
    /** CDN URL for prebuilt demo HTML (optional). */
    prebuiltHtmlUrl = null,
    /** Theme card thumbnail (compact iframe — fix cinematic svh hero sizing). */
    thumbnailMode = false,
    /** Let the page grow so the surrounding panel can scroll every section. */
    expandToContent = false,
}) {
    const usesDeviceStyleFrame =
        previewMode === "desktop" ||
        previewMode === "mobile" ||
        ["laptop", "tablet"].includes(previewMode);
    const frameWidth = PREVIEW_WIDTHS[previewMode] ?? PREVIEW_WIDTHS.desktop;
    const containerStyle = usesDeviceStyleFrame
        ? { position: "relative", alignItems: "center", justifyContent: "center" }
        : { position: "relative" };

    /** Inline radius so rounding always applies (Polaris Box + Tailwind can fail to clip iframe). */
    const frameRadius = "var(--p-border-radius-300, 12px)";

    /** Force-remount the renderer when the row structure changes so the previous template can never flash on switch. */
    const structuralKey = useMemo(
        () => buildStructuralKey(templateRows, liquidPreviewType),
        [templateRows, liquidPreviewType]
    );

    return (
        <Box
            className={`min-w-0 w-full max-w-full flex flex-col ${expandToContent ? "h-auto overflow-visible" : "flex-1 min-h-0 overflow-hidden"} ${className}`}
            style={{
                ...containerStyle,
                ...style,
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                minHeight: expandToContent ? undefined : "100%",
                height: expandToContent ? "auto" : style?.height,
            }}
        >
            <div
                className="liquid-preview-frame"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0,
                    width: usesDeviceStyleFrame ? frameWidth : "100%",
                    maxWidth: usesDeviceStyleFrame ? frameWidth : "100%",
                    ...(previewMode === "mobile"
                        ? {
                              width: MOBILE_PREVIEW_WIDTH,
                              minWidth: MOBILE_PREVIEW_WIDTH,
                              maxWidth: MOBILE_PREVIEW_WIDTH,
                          }
                        : {}),
                    flex: expandToContent ? "none" : 1,
                    height: expandToContent ? "auto" : undefined,
                    overflow: expandToContent ? "visible" : "hidden",
                    backgroundColor: "var(--p-color-bg-surface, #fff)",
                    boxShadow: "var(--p-shadow-100, 0 1px 2px rgba(0, 0, 0, 0.06))",
                    borderStyle: "solid",
                    borderWidth: attachBelowChrome ? "0 1px 1px 1px" : "1px",
                    borderColor: "#e1e3e5",
                    borderTopLeftRadius: attachBelowChrome ? 0 : frameRadius,
                    borderTopRightRadius: attachBelowChrome ? 0 : frameRadius,
                    borderBottomLeftRadius: frameRadius,
                    borderBottomRightRadius: frameRadius,
                }}
            >
                {/* Store name header - integrated into preview container */}
                {storeName && (
                    <div className="flex items-center justify-center gap-3 py-2 px-4 border-b relative">
                        {/* Mac-style traffic light dots on the left */}
                        <div className="absolute left-3 flex items-center gap-1.5" aria-hidden="true">
                            <span className="w-3 h-3 rounded-full bg-[#e8231c]" />
                            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="rounded-full px-6 py-2">
                            {storeHeaderContent ?? (
                                <span className="text-black font-medium text-sm">
                                    {storeName}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className={`min-w-0 w-full max-w-full ${expandToContent ? "h-auto overflow-visible" : "flex-1 min-h-0 overflow-hidden"}`}>
                    <LiquidRenderer
                        structuralKey={structuralKey}
                        templateRows={templateRows}
                        selectedSection={selectedSection}
                        selectorMode={selectorMode}
                        stylePreferences={stylePreferences}
                        className={expandToContent ? "w-full h-auto" : "w-full h-full"}
                        style={{
                            width: "100%",
                            height: expandToContent ? "auto" : "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                        minHeight={minHeight}
                        liquidPreviewType={liquidPreviewType}
                        previewCacheKey={previewCacheKey}
                        prebuiltHtmlUrl={prebuiltHtmlUrl}
                        previewMode={previewMode}
                        thumbnailMode={thumbnailMode}
                        expandToContent={expandToContent}
                    />
                </div>
            </div>
        </Box>
    );
}

// Memoize to prevent re-renders when props haven't changed
// Returns true if props are equal (skip re-render), false if different (re-render)
export default memo(LiquidPreviewRender, (prevProps, nextProps) => {
    // IMPORTANT: Avoid deep equality checks here (e.g. JSON.stringify on templateRows),
    // because templateRows can be very large and stringify becomes a major CPU bottleneck.
    // Prefer referential equality and let parent components stabilize objects with useMemo.
    const templateRowsEqual = prevProps.templateRows === nextProps.templateRows;
    const stylePrefsEqual = prevProps.stylePreferences === nextProps.stylePreferences;
    const styleEqual = prevProps.style === nextProps.style;
    return (
        templateRowsEqual &&
        prevProps.minHeight === nextProps.minHeight &&
        prevProps.liquidPreviewType === nextProps.liquidPreviewType &&
        prevProps.previewCacheKey === nextProps.previewCacheKey &&
        prevProps.previewMode === nextProps.previewMode &&
        prevProps.selectedSection === nextProps.selectedSection &&
        prevProps.storeName === nextProps.storeName &&
        prevProps.storeHeaderContent === nextProps.storeHeaderContent &&
        prevProps.selectorMode === nextProps.selectorMode &&
        stylePrefsEqual &&
        styleEqual &&
        prevProps.className === nextProps.className &&
        prevProps.attachBelowChrome === nextProps.attachBelowChrome &&
        prevProps.prebuiltHtmlUrl === nextProps.prebuiltHtmlUrl &&
        prevProps.thumbnailMode === nextProps.thumbnailMode &&
        prevProps.expandToContent === nextProps.expandToContent
    );
});
