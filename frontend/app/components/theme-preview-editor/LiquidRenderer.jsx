import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@shopify/polaris";
import {
  getLiquidPreviewCache,
  setLiquidPreviewCache,
} from "../../lib/liquidPreviewCache.js";

const PREVIEW_API = "/api/liquid-preview";

function buildIframeDocument(html, { thumbnailMode = false, expandToContent = false } = {}) {
    if (!html) return "";
    // Absolute-fill patches for aspect-ratio media that leave gaps in preview iframes.
    const previewPatches = `<style data-roarr-preview-patches>
/* Cinematic key-features orbit: beat global img { height:auto } letterboxing */
[id^="cfo-"] .cfo-circle{position:relative!important;overflow:hidden!important;border-radius:50%!important}
[id^="cfo-"] .cfo-circle img,[id^="cfo-"] .cfo-circle svg{
  position:absolute!important;inset:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important;
  width:100%!important;height:100%!important;min-width:100%!important;min-height:100%!important;
  max-width:none!important;max-height:none!important;
  object-fit:cover!important;object-position:center center!important;display:block!important;
  margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
}
${
  expandToContent
    ? `html,body{height:auto!important;min-height:0!important;overflow:visible!important}`
    : ""
}
${
  thumbnailMode
    ? `/* Card thumbs: cinematic hero uses 100svh which is tiny inside scaled iframes */
[id^="ch-section_"],[id^="ch-section-"]{padding:0!important}
[id^="ch-section_"] .ch-banner,[id^="ch-section-"] .ch-banner{
  width:100%!important;max-width:100%!important;max-height:none!important;
  border-radius:0!important;margin-inline:0!important;
  aspect-ratio:16/9!important;height:auto!important;
}`
    : ""
}
/* Prepaid/default PDP gallery: fill square even when iframe % heights collapse */
.modern-product__main-image-wrapper{position:relative!important}
.modern-product__slider{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.modern-product__slide{position:relative!important;height:100%!important}
.modern-product__slide img{
  position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
  object-fit:cover!important;object-position:center!important;display:block!important;
}
</style>
<script data-roarr-preview-scroll-fix>
(function () {
  function pinTop() {
    try {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    } catch (e) {}
  }
  // Thumb active-state used scrollIntoView and jumped the page to checkout mid-home.
  var orig = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (arg) {
    try {
      var row = this.closest && this.closest(".modern-product__thumbs");
      if (row) {
        var left = this.offsetLeft - (row.clientWidth - this.clientWidth) / 2;
        row.scrollTo({
          left: Math.max(0, left),
          behavior: (arg && arg.behavior) || "auto",
        });
        return;
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
  pinTop();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pinTop);
  }
  window.addEventListener("load", function () {
    pinTop();
    setTimeout(pinTop, 50);
    setTimeout(pinTop, 250);
  });
})();
</script>`;
    if (/<\/head>/i.test(html)) {
        return html.replace(/<\/head>/i, `${previewPatches}</head>`);
    }
    return `${previewPatches}${html}`;
}

const MOBILE_PREVIEW_WIDTH = 390;

export default function LiquidRenderer({
    templateRows,
    structuralKey = null,
    debounceMs = 120,
    className = "",
    style = {},
    selectedSection = null,
    selectorMode = false,
    stylePreferences = null,
    minHeight = "500px",
    liquidPreviewType = "landing-page",
    /** Stable cache key for demo/configure previews (tab + category + template + style). */
    previewCacheKey = null,
    /**
     * Optional CDN URL for prebuilt demo HTML (S3). When set, loads via GET
     * instead of POST `/api/liquid-preview` — used for theme cards / eye modals.
     */
    prebuiltHtmlUrl = null,
    /** When "mobile", lock iframe to phone width so CSS media queries apply. */
    previewMode = "desktop",
    /** Theme card thumbnail: neutralize svh-capped cinematic hero sizing. */
    thumbnailMode = false,
    /** Grow the iframe to the full page so the parent can scroll every section. */
    expandToContent = false,
}) {
    const isMobilePreview = previewMode === "mobile";

    const initialCacheKey = prebuiltHtmlUrl
        ? `prebuilt:${prebuiltHtmlUrl}`
        : previewCacheKey || null;
    const initialCachedHtml = initialCacheKey
        ? getLiquidPreviewCache(initialCacheKey) || ""
        : "";

    const [html, setHtml] = useState(initialCachedHtml);
    // Spin until HTML is fetched (and until iframe paints for eye/full previews).
    const [isLoading, setIsLoading] = useState(() => !initialCachedHtml);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    const iframeRef = useRef(null);
    const abortRef = useRef(null);
    const requestSeqRef = useRef(0);
    /** Mirrors `html` so `fetchHtml` can compare without taking `html` as a dependency. */
    const htmlRef = useRef(initialCachedHtml);

    const effectiveCacheKey = prebuiltHtmlUrl
        ? `prebuilt:${prebuiltHtmlUrl}`
        : previewCacheKey || null;

    const fetchPayload = useMemo(() => {
        if (!templateRows?.length) return null;
        const payload = { templateRows, type: liquidPreviewType };
        if (stylePreferences && (stylePreferences.dynamicColor || stylePreferences.headingFont || stylePreferences.bodyFont || (stylePreferences.sectionColors && Object.keys(stylePreferences.sectionColors).length > 0))) {
            payload.stylePreferences = stylePreferences;
        }
        return payload;
    }, [templateRows, stylePreferences, liquidPreviewType]);
    const structureKey = useMemo(() => {
        if (prebuiltHtmlUrl) return `prebuilt:${prebuiltHtmlUrl}`;
        if (typeof structuralKey === "string" && structuralKey.length > 0) {
            return structuralKey;
        }
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
    }, [structuralKey, templateRows, liquidPreviewType, prebuiltHtmlUrl]);
    const applyCachedHtml = useCallback((cachedHtml) => {
        if (!cachedHtml || cachedHtml === htmlRef.current) return false;
        htmlRef.current = cachedHtml;
        setIframeLoaded(false);
        setHtml(cachedHtml);
        // HTML is ready. Images inside the iframe can finish after the spinner is gone.
        setIsLoading(false);
        return true;
    }, []);

    const fetchHtml = useCallback(async () => {
        if (effectiveCacheKey) {
            const cached = getLiquidPreviewCache(effectiveCacheKey);
            if (cached) {
                applyCachedHtml(cached);
                return;
            }
        }

        abortRef.current?.abort?.();
        const controller = new AbortController();
        abortRef.current = controller;
        const mySeq = ++requestSeqRef.current;
        setIsLoading(true);
        setIframeLoaded(false);

        try {
            if (prebuiltHtmlUrl) {
                const res = await fetch(prebuiltHtmlUrl, {
                    method: "GET",
                    signal: controller.signal,
                    mode: "cors",
                    credentials: "omit",
                    cache: "force-cache",
                });
                if (!res.ok) throw new Error(`prebuilt fetch ${res.status}`);
                const text = await res.text();
                if (mySeq === requestSeqRef.current && text) {
                    if (text !== htmlRef.current) {
                        htmlRef.current = text;
                        setIframeLoaded(false);
                        setHtml(text);
                        if (effectiveCacheKey) setLiquidPreviewCache(effectiveCacheKey, text);
                    }
                    setIsLoading(false);
                }
                return;
            }

            if (!fetchPayload) return;

            const res = await fetch(PREVIEW_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fetchPayload),
                signal: controller.signal,
            });
            const data = await res.json();
            if (mySeq === requestSeqRef.current && data.html) {
                if (data.html !== htmlRef.current) {
                    htmlRef.current = data.html;
                    setIframeLoaded(false);
                    setHtml(data.html);
                    if (effectiveCacheKey) {
                        setLiquidPreviewCache(effectiveCacheKey, data.html);
                    }
                }
                setIsLoading(false);
            }
        } catch (err) {
            if (err?.name === "AbortError") return;
            if (prebuiltHtmlUrl && fetchPayload) {
                console.warn("[LiquidRenderer] Prebuilt failed, trying live API:", err);
                try {
                    const res = await fetch(PREVIEW_API, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(fetchPayload),
                        signal: controller.signal,
                    });
                    const data = await res.json();
                    if (mySeq === requestSeqRef.current && data.html) {
                        htmlRef.current = data.html;
                        setIframeLoaded(false);
                        setHtml(data.html);
                        if (effectiveCacheKey) {
                            setLiquidPreviewCache(effectiveCacheKey, data.html);
                        }
                        setIsLoading(false);
                    }
                } catch (err2) {
                    if (err2?.name !== "AbortError") {
                        console.error("[LiquidRenderer] Render failed:", err2);
                        if (mySeq === requestSeqRef.current) setIsLoading(false);
                    }
                }
                return;
            }
            console.error("[LiquidRenderer] Render failed:", err);
            if (mySeq === requestSeqRef.current) setIsLoading(false);
        }
    }, [applyCachedHtml, fetchPayload, effectiveCacheKey, prebuiltHtmlUrl]);

    const prevStructureKeyRef = useRef(null);

    useEffect(() => {
        if (!prebuiltHtmlUrl && !fetchPayload) {
            prevStructureKeyRef.current = null;
            setIsLoading(false);
            return;
        }

        if (effectiveCacheKey) {
            const cached = getLiquidPreviewCache(effectiveCacheKey);
            if (cached && applyCachedHtml(cached)) {
                prevStructureKeyRef.current = structureKey;
                return undefined;
            }
        }

        const prev = prevStructureKeyRef.current;
        const structureChanged = prev !== structureKey;

        if (structureChanged && prev !== null) {
            abortRef.current?.abort?.();
            requestSeqRef.current++;
            const nextCached = effectiveCacheKey
                ? getLiquidPreviewCache(effectiveCacheKey)
                : null;
            if (nextCached) {
                htmlRef.current = nextCached;
                setHtml(nextCached);
                setIframeLoaded(false);
                setIsLoading(true);
            } else {
                htmlRef.current = "";
                setHtml("");
                setIframeLoaded(false);
                setIsLoading(true);
            }
        }
        prevStructureKeyRef.current = structureKey;

        // Already showing cached HTML for this key — skip a redundant fetch tick.
        if (
            effectiveCacheKey &&
            htmlRef.current &&
            htmlRef.current === getLiquidPreviewCache(effectiveCacheKey)
        ) {
            return undefined;
        }

        const delay = structureChanged ? 0 : debounceMs;
        const t = setTimeout(() => {
            fetchHtml();
        }, delay);
        return () => clearTimeout(t);
    }, [
        applyCachedHtml,
        fetchHtml,
        fetchPayload,
        effectiveCacheKey,
        prebuiltHtmlUrl,
        structureKey,
        debounceMs,
    ]);

    // Abort in-flight fetch on unmount.
    useEffect(() => {
        return () => abortRef.current?.abort?.();
    }, []);

    const handleIframeLoad = useCallback(() => {
        setIframeLoaded(true);
        setIsLoading(false);
        // Always start demos at the top (gallery JS used to jump to checkout).
        try {
            const win = iframeRef.current?.contentWindow;
            const doc =
                iframeRef.current?.contentDocument || win?.document;
            win?.scrollTo?.(0, 0);
            if (doc?.documentElement) doc.documentElement.scrollTop = 0;
            if (doc?.body) doc.body.scrollTop = 0;
        } catch {
            // ignore
        }
    }, []);

    // Lock iframe document to phone width so Liquid @media (max-width: 749px) styles apply.
    // Also reset when switching back to desktop (no remount on device toggle).
    useEffect(() => {
        if (!iframeLoaded || !iframeRef.current) return;
        try {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;
            let meta = doc.querySelector('meta[name="viewport"]');
            if (!meta) {
                meta = doc.createElement("meta");
                meta.setAttribute("name", "viewport");
                doc.head?.appendChild(meta);
            }
            if (isMobilePreview) {
                meta.setAttribute(
                    "content",
                    `width=${MOBILE_PREVIEW_WIDTH}, initial-scale=1, maximum-scale=1`,
                );
                doc.documentElement.style.width = "100%";
                doc.documentElement.style.maxWidth = `${MOBILE_PREVIEW_WIDTH}px`;
                doc.documentElement.style.overflowX = "hidden";
                if (doc.body) {
                    doc.body.style.width = "100%";
                    doc.body.style.maxWidth = `${MOBILE_PREVIEW_WIDTH}px`;
                    doc.body.style.overflowX = "hidden";
                }
            } else {
                meta.setAttribute("content", "width=device-width, initial-scale=1");
                doc.documentElement.style.width = "";
                doc.documentElement.style.maxWidth = "";
                doc.documentElement.style.overflowX = "";
                if (doc.body) {
                    doc.body.style.width = "";
                    doc.body.style.maxWidth = "";
                    doc.body.style.overflowX = "";
                }
            }
            iframe.contentWindow?.dispatchEvent?.(new Event("resize"));
        } catch {
            // ignore cross-origin / not ready
        }
    }, [iframeLoaded, isMobilePreview, html]);

    // Listen for scroll messages from iframe and scroll parent container
    useEffect(() => {
        const handleMessage = (event) => {
            // Verify message is from our iframe (basic check)
            if (event.data && event.data.type === 'SCROLL_TO_SECTION' && iframeRef.current) {
                const iframe = iframeRef.current;
                const scrollableParent = iframe.closest('.overflow-y-auto');

                if (scrollableParent && event.data.elementTop !== undefined) {
                    // Get iframe's position relative to the scrollable parent
                    const iframeRect = iframe.getBoundingClientRect();
                    const parentRect = scrollableParent.getBoundingClientRect();
                    const iframeOffsetTop = iframeRect.top - parentRect.top + scrollableParent.scrollTop;

                    // Calculate the target scroll position
                    // elementTop is relative to iframe document, we need to add iframe offset
                    const targetScrollTop = iframeOffsetTop + event.data.elementTop - 20; // 20px offset from top

                    scrollableParent.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth'
                    });
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Tell iframe to enable/disable selector mode (hover outline + click-to-select) and which section is selected (for blue dotted highlight)
    useEffect(() => {
        if (!iframeLoaded || !iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage(
                {
                    type: "SET_SELECTOR_MODE",
                    enabled: selectorMode,
                    selectedSectionId: selectorMode ? selectedSection : null
                },
                "*"
            );
        } catch (e) {
            // ignore cross-origin or not ready
        }
    }, [selectorMode, selectedSection, iframeLoaded]);

    // Scroll to selected section when it changes - use postMessage
    useEffect(() => {
        if (!selectedSection || !iframeLoaded || !iframeRef.current) return;

        // Use a small delay to ensure iframe content is fully rendered
        const scrollTimer = setTimeout(() => {
            const iframe = iframeRef.current;
            if (!iframe || !iframe.contentWindow) return;

            // Try direct function call first (faster)
            try {
                const iframeWindow = iframe.contentWindow;
                if (iframeWindow.scrollToSection && typeof iframeWindow.scrollToSection === 'function') {
                    iframeWindow.scrollToSection(selectedSection);
                    return;
                }
            } catch (e) {
                // Cross-origin or not ready, fall through to postMessage
            }

            // Fallback: Send postMessage to iframe to trigger scroll
            iframe.contentWindow.postMessage({
                type: 'SCROLL_TO_SECTION',
                sectionId: selectedSection
            }, '*');
        }, 150); // Small delay to ensure content is rendered

        return () => clearTimeout(scrollTimer);
    }, [selectedSection, iframeLoaded]);

    const iframeDoc = buildIframeDocument(html, { thumbnailMode, expandToContent });

    useEffect(() => {
        if (!expandToContent || !iframeLoaded || !iframeRef.current) return undefined;
        const iframe = iframeRef.current;
        let stopped = false;
        const apply = () => {
            if (stopped) return;
            const doc = iframe.contentDocument;
            if (!doc) return;
            let bottom = 0;
            const scrollTop = doc.documentElement?.scrollTop || doc.body?.scrollTop || 0;
            for (const child of doc.body.children) {
                const tag = child.tagName;
                if (tag === "SCRIPT" || tag === "STYLE") continue;
                const rect = child.getBoundingClientRect();
                bottom = Math.max(bottom, rect.bottom + scrollTop);
            }
            const height = Math.ceil(bottom);
            if (height > 200) iframe.style.height = `${height}px`;
        };
        apply();
        const doc = iframe.contentDocument;
        const observer = doc?.body ? new ResizeObserver(apply) : null;
        if (doc?.body) observer.observe(doc.body);
        doc?.querySelectorAll("img").forEach((img) => {
            if (!img.complete) img.addEventListener("load", apply, { once: true });
        });
        const timers = [120, 400, 1000, 2000].map((ms) => setTimeout(apply, ms));
        return () => {
            stopped = true;
            observer?.disconnect();
            timers.forEach(clearTimeout);
        };
    }, [expandToContent, iframeLoaded, html, previewMode]);
    // Hide the spinner once the page HTML is in hand. Images fill in after.
    const showLoader = isLoading && !html;

    // The preview can be far taller than the screen (minHeight 1200px+), so centring the
    // spinner in the whole box puts it below the fold. Keep it in the middle of the part
    // of the preview the user can actually see, and follow scrolling while loading.
    const wrapperRef = useRef(null);
    const [loaderTop, setLoaderTop] = useState(null);
    useEffect(() => {
        if (!showLoader || typeof window === "undefined") return undefined;
        const el = wrapperRef.current;
        // App Bridge "max" modals render this preview inside their own frame. Measure and
        // listen in the window that actually contains the preview, not the app's main window.
        const win = el?.ownerDocument?.defaultView || window;
        let frame = 0;
        const update = () => {
            win.cancelAnimationFrame(frame);
            frame = win.requestAnimationFrame(() => {
                const node = wrapperRef.current;
                if (!node) return;
                const rect = node.getBoundingClientRect();
                const viewportH =
                    win.innerHeight || node.ownerDocument.documentElement.clientHeight;
                // Visible band = viewport, narrowed to the nearest scrolling panel (modal body).
                let clipTop = 0;
                let clipBottom = viewportH;
                for (let p = node.parentElement; p; p = p.parentElement) {
                    const oy = win.getComputedStyle(p).overflowY;
                    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) {
                        const pr = p.getBoundingClientRect();
                        clipTop = Math.max(clipTop, pr.top);
                        clipBottom = Math.min(clipBottom, pr.bottom);
                        break;
                    }
                }
                const visibleTop = Math.max(0, clipTop - rect.top);
                const visibleBottom = Math.min(rect.height, clipBottom - rect.top);
                if (rect.height === 0 || visibleBottom <= visibleTop) {
                    setLoaderTop(null);
                    return;
                }
                setLoaderTop(Math.round((visibleTop + visibleBottom) / 2));
            });
        };
        update();
        // Capture scrolls from modal bodies and other scroll containers, not just the window.
        win.addEventListener("scroll", update, true);
        win.addEventListener("resize", update);
        const resizeObserver =
            typeof win.ResizeObserver === "function" ? new win.ResizeObserver(update) : null;
        if (resizeObserver && el) resizeObserver.observe(el);
        // The modal animates open, so its size settles a moment after mount.
        const timers = [60, 200, 450, 900].map((ms) => win.setTimeout(update, ms));
        return () => {
            win.cancelAnimationFrame(frame);
            win.removeEventListener("scroll", update, true);
            win.removeEventListener("resize", update);
            resizeObserver?.disconnect();
            timers.forEach((t) => win.clearTimeout(t));
        };
    }, [showLoader]);

    return (
        <div
            ref={wrapperRef}
            className={className}
            style={{
                position: "relative",
                ...style,
                width: isMobilePreview ? MOBILE_PREVIEW_WIDTH : "100%",
                maxWidth: isMobilePreview ? MOBILE_PREVIEW_WIDTH : "100%",
                minWidth: 0,
                minHeight,
            }}
        >
            {showLoader && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.92)",
                        zIndex: 10,
                    }}
                >
                    <div
                        style={
                            loaderTop == null
                                ? undefined
                                : {
                                      position: "absolute",
                                      left: "50%",
                                      top: loaderTop,
                                      transform: "translate(-50%, -50%)",
                                  }
                        }
                    >
                        <Spinner accessibilityLabel="Loading preview" size="large" />
                    </div>
                </div>
            )}
            {iframeDoc ? (
                <iframe
                    ref={iframeRef}
                    style={{
                        border: "none",
                        display: "block",
                        width: isMobilePreview ? MOBILE_PREVIEW_WIDTH : "100%",
                        maxWidth: isMobilePreview ? MOBILE_PREVIEW_WIDTH : "100%",
                        minWidth: 0,
                        height: expandToContent ? minHeight : "100%",
                        minHeight: minHeight,
                    }}
                    srcDoc={iframeDoc}
                    title="Liquid preview"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={handleIframeLoad}
                />
            ) : null}
        </div>
    );
}