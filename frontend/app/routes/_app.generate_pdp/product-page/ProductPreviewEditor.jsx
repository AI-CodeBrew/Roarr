import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useBlocker } from "react-router";

import { Icon, InlineStack, Page, Text } from "@shopify/polaris";
import { DesktopIcon, DragDropIcon, MobileIcon } from "@shopify/polaris-icons";
import { ExternalLink, PanelRight, Rocket, Wand2 } from "lucide-react";
import { PrimaryButton } from "../../../components/RoarrUI.jsx";
import { aiResponseMapping } from "./utils/productAiResponeMapping.js";


import LiquidPreviewEditorPanel from "../../../components/theme-preview-editor/LiquidPreviewEditorPanel.jsx";
import LiquidPreviewRender from "../../../components/theme-preview-editor/LiquidPreviewRender.jsx";
import LiquidPreviewSettingsPanel from "../../../components/theme-preview-editor/LiquidPreviewSettingsPanel.jsx";
import { generateTemplateConfig } from "./utils/productTemplatesConfig.js";
import { usePostHog } from "posthog-js/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { usePages } from "../../../lib/PagesContext.jsx";
import { useViewportBelowMd } from "../../../hooks/useViewportBelowMd.js";
import MobilePreviewReadonlyBanner from "../../../components/theme-preview-editor/MobilePreviewReadonlyBanner.jsx";
import PreviewZoomControls, {
    DEFAULT_PREVIEW_ZOOM,
} from "../../../components/theme-preview-editor/PreviewZoomControls.jsx";

const PRODUCT_PREVIEW_SAVE_BAR_ID = "product-preview-contextual-save-bar";

export const ProductPreviewEditor = ({
    selectedTemplate,
    magicResponse,
    detectedCategory,
    storeName,
    onPublishToShopify,
    onBack,
    pageId,
    productImages,
    /** Selected Shopify product. When it has a price, the preview uses that instead of the $99 sample. */
    sourceProduct = null,
    isPublished = false,
    /** When set, Polaris {@link Page} wraps the editor and toolbar controls render in `secondaryActions` (Review & customize bar). */
    pageChrome,
}) => {
    const [templateSchemas, setTemplateSchemas] = useState({});
    const [selectedSection, setSelectedSection] = useState(null);
    const [sectionOverrides, setSectionOverrides] = useState({});
    const [previewMode, setPreviewMode] = useState("desktop");
    const [previewZoomScale, setPreviewZoomScale] = useState(DEFAULT_PREVIEW_ZOOM);
    const [isPreviewModeSwitching, setIsPreviewModeSwitching] = useState(false);
    const [selectorMode, setSelectorMode] = useState(true);
    const [leftExpandedOpen, setLeftExpandedOpen] = useState(
        () => typeof window !== "undefined" && window.innerWidth >= 768,
    );
    const [mobileRightOpen, setMobileRightOpen] = useState(false);
    const [desktopRightOpen, setDesktopRightOpen] = useState(false); // Desktop panel open by default
    const closeFullscreenButtonRef = useRef(null);
    const previewContainerRef = useRef(null);
    const [previewContainerSize, setPreviewContainerSize] = useState({ width: 0, height: 0 });
    const posthog = usePostHog();
    const shopify = useAppBridge();
    const { refreshPages } = usePages();
    const isReadonlyMobileLayout = useViewportBelowMd();

    useEffect(() => {
        if (!posthog || !posthog.__loaded) return;
        posthog.capture('page_viewed', {
            page_name: 'template_preview',
            page_path: '/app',
        })
    }, [posthog, posthog?.__loaded]);

    useEffect(() => {
        let cancelled = false;
        import("./utils/editor-schema/index.js")
            .then((mod) => {
                if (cancelled) return;
                setTemplateSchemas(mod.TEMPLATE_SCHEMAS || {});
            })
            .catch(() => {
                if (cancelled) return;
                setTemplateSchemas({});
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Listen for section click messages from iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'SELECT_SECTION') {
                const sectionId = event.data.sectionId;
                if (sectionId) {
                    setSelectedSection(sectionId);
                    setLeftExpandedOpen(true);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Measure preview container for scaling (same pattern as Template Selection)
    useEffect(() => {
        const el = previewContainerRef.current;
        if (!el) return;
        const updateSize = () => {
            const { width, height } = el.getBoundingClientRect();
            setPreviewContainerSize({ width: Math.round(width), height: Math.round(height) });
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

    const [form, setForm] = useState(() => (magicResponse));
    const [lastSavedForm, setLastSavedForm] = useState(() => magicResponse);
    const [isSaving, setIsSaving] = useState(false);
    const [isContextualSaving, setIsContextualSaving] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const contextualSaveButtonRef = useRef(null);

    const hasChanges = useMemo(
        () => JSON.stringify(form) !== JSON.stringify(lastSavedForm),
        [form, lastSavedForm]
    );
    const shouldBlockNavigation = hasChanges || isSaving;
    const navigationBlocker = useBlocker(shouldBlockNavigation);
    const promptContextualSaveBar = useCallback(() => {
        const saveBar = shopify?.saveBar;
        if (saveBar?.leaveConfirmation) {
            void saveBar.leaveConfirmation().catch(() => { });
            return;
        }
        void saveBar?.show?.(PRODUCT_PREVIEW_SAVE_BAR_ID)?.catch?.(() => { });
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
        if (!shopify?.saveBar) return;
        if (hasChanges || isSaving) {
            shopify.saveBar.show(PRODUCT_PREVIEW_SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(PRODUCT_PREVIEW_SAVE_BAR_ID);
        }
    }, [hasChanges, isSaving, shopify]);

    useEffect(() => {
        return () => {
            shopify?.saveBar?.hide(PRODUCT_PREVIEW_SAVE_BAR_ID);
        };
    }, [shopify]);

    const handleSave = useCallback(() => {
        const updatedContent = { ...form };
        setIsSaving(true);

        const done = () => {
            setIsSaving(false);
            setIsContextualSaving(false);
        };

        const onSuccess = () => {
            setLastSavedForm(JSON.parse(JSON.stringify(form)));
            shopify?.toast?.show('Saved successfully', { duration: 3000 });
            refreshPages().catch((err) => console.error('Error refreshing pages:', err)).finally(done);
        };

        if (isPublished) {
            const selectedColor =
                form.selected_color ??
                (Array.isArray(form.color_schemes) ? form.color_schemes[0] : null);
            posthog?.capture('pdp_edited', {
                pdp_id: pageId,
            })

            fetch('/api/update-publish-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    magic_response: updatedContent,
                    page_id: pageId,
                    selected_color: selectedColor,
                }),
            })
                .then((response) => {
                    if (response.ok) onSuccess();
                    else return response.json().then((d) => { throw new Error(d?.error || 'Failed to update'); });
                })
                .catch((error) => {
                    console.error('Error updating published page:', error);
                    done();
                });
        } else {
            fetch('/api/update-generated-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: pageId,
                    magicContent: updatedContent,
                }),
            })
                .then((response) => {
                    if (response.ok) onSuccess();
                    else done();
                })
                .catch((error) => {
                    console.error('Error saving content:', error);
                    done();
                });
        }
    }, [form, pageId, isPublished, refreshPages, shopify, posthog]);

    const handleContextualSave = useCallback(() => {
        if (!hasChanges || isSaving) return;
        setIsContextualSaving(true);
        const buttonEl = contextualSaveButtonRef.current;
        if (buttonEl) {
            buttonEl.setAttribute("loading", "");
            buttonEl.setAttribute("aria-busy", "true");
        }
        handleSave();
    }, [hasChanges, isSaving, handleSave]);

    const handleContextualDiscard = useCallback(() => {
        shopify?.saveBar?.hide(PRODUCT_PREVIEW_SAVE_BAR_ID);
        setForm(JSON.parse(JSON.stringify(lastSavedForm)));
    }, [shopify, lastSavedForm]);

    const handleOpenPreview = useCallback(async () => {
        if (!pageId) return;
        setIsPreviewLoading(true);
        try {
            const response = await fetch(
                `/api/generate-preview-link?page_id=${pageId}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate preview link');
            }
            const data = await response.json();
            if (data.success && data.preview_link) {
                window.open(data.preview_link);
            } else {
                throw new Error(data.error || 'Failed to generate preview link');
            }
        } catch (err) {
            console.error('Error generating preview link:', err);
            alert(`Failed to open preview link: ${err.message}`);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [pageId]);

    const handlePublish = () => {
        const updatedContent = { ...form };
        fetch('/api/update-generated-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pageId: pageId,
                magicContent: updatedContent,
            }),
        }).catch((error) => {
            console.error('Error updating generated content:', error);
        });
        if (onPublishToShopify) {
            posthog?.capture('pdp_push_initiated', {
                pdp_id: pageId,
                is_first_push: true,
            })
            onPublishToShopify(updatedContent);
        }
    };

    const handleSectionOverrideChange = useCallback((template, overrides) => {
        setSectionOverrides((prev) => ({ ...prev, [template]: overrides }));
    }, []);

    const updateField = useCallback((key, value) => {
        setForm((prev) => {
            if (!key.includes(".")) {
                return { ...prev, [key]: value };
            }
            const parts = key.split(".");
            const next = JSON.parse(JSON.stringify(prev));
            let target = next;
            for (let i = 0; i < parts.length - 1; i++) {
                const p = parts[i];
                if (!(p in target) || typeof target[p] !== "object") {
                    target[p] = {};
                }
                target = target[p];
            }
            target[parts[parts.length - 1]] = value;
            return next;
        });
    }, []);


    const productData = useMemo(
        () => aiResponseMapping(form, sourceProduct),
        [form, sourceProduct],
    );
    // Array of arrays: each inner array is a row (matches Template1Inline section flow).
    // 2+ elements → horizontal layout; 1 element → column layout (stacked).
    const templatesConfig = useMemo(
        () => generateTemplateConfig(detectedCategory, productData, selectedTemplate || 1, form),
        [selectedTemplate, detectedCategory, productData, form]
    );
    if (isReadonlyMobileLayout) {
        return (
            <div className="flex h-full min-h-screen w-full flex-col gap-2">
                <MobilePreviewReadonlyBanner variant="product" />
                <div className="shrink-0 flex justify-end">
                    {isPublished ? (
                        <PrimaryButton
                            size="sm"
                            onClick={handleOpenPreview}
                            loading={isPreviewLoading}
                        >
                            {isPreviewLoading ? null : <ExternalLink size={15} aria-hidden />}
                            Preview
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton size="sm" onClick={handlePublish}>
                            <Rocket size={15} aria-hidden />
                            Publish
                        </PrimaryButton>
                    )}
                </div>
                <div className="min-h-0 flex-1 overflow-auto [&_iframe]:rounded-lg">
                    <LiquidPreviewRender
                        templateRows={templatesConfig}
                        previewMode="mobile"
                        selectedSection={null}
                        storeName={storeName}
                        selectorMode={false}
                    />
                </div>
            </div>
        );
    }

    const previewToolbarSecondaryActions = (
        <InlineStack align="end" blockAlign="center" gap="200" wrap>
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                {/* Mobile-only: toggle right editor panel */}
                <div className="flex items-center gap-1 md:hidden" role="group" aria-label="Editor panel">
                    <button
                        type="button"
                        onClick={() => setMobileRightOpen((o) => !o)}
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${mobileRightOpen ? "bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-200" : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-[#1e40af]"}`}
                        aria-label="Open editor panel"
                        aria-pressed={mobileRightOpen}
                    >
                        <PanelRight size={18} strokeWidth={2} />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setSelectorMode((on) => !on)}
                    className={`flex items-center justify-center p-2 rounded-xl transition-colors ${selectorMode
                        ? "bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-200"
                        : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-[#1e40af]"
                        }`}
                    title={selectorMode ? "Select mode on: click a section to open its settings" : "Select mode off: enable to hover and click sections to open settings"}
                    aria-label={selectorMode ? "Select mode on" : "Select mode off"}
                    aria-pressed={selectorMode}
                >
                    <Icon source={DragDropIcon} />
                </button>
                <div
                    className="flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200"
                    role="group"
                    aria-label="Preview device"
                >
                    {[
                        { mode: "desktop", icon: DesktopIcon, label: "Desktop" },
                        { mode: "mobile", icon: MobileIcon, label: "Mobile" }
                    ].map(({ mode, icon: IconSource, label }) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => {
                                setPreviewMode(mode);
                                if (mode === "desktop") setLeftExpandedOpen(true);
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${previewMode === mode
                                ? "bg-[#1e3a8a] text-white shadow-sm"
                                : "text-slate-500 hover:bg-blue-50 hover:text-[#1e3a8a]"
                                }`}
                            aria-label={`${label} preview`}
                            aria-pressed={previewMode === mode}
                        >
                            <Icon source={IconSource} />
                        </button>
                    ))}
                </div>
                <PreviewZoomControls scale={previewZoomScale} onScaleChange={setPreviewZoomScale} />
                {isPublished ? (
                    <PrimaryButton
                        size="sm"
                        onClick={handleOpenPreview}
                        loading={isPreviewLoading}
                    >
                        {isPreviewLoading ? null : <ExternalLink size={15} aria-hidden />}
                        Preview
                    </PrimaryButton>
                ) : (
                    <PrimaryButton size="sm" onClick={handlePublish}>
                        <Rocket size={15} aria-hidden />
                        Publish
                    </PrimaryButton>
                )}
            </div>
        </InlineStack>
    );

    const editorWorkspace = (
                    <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    {/* Mobile backdrop when left expanded or right editor open */}
                    {(leftExpandedOpen || mobileRightOpen) && (
                        <div
                            className="fixed inset-0 bg-black/40 z-40 md:hidden"
                            onClick={() => {
                                setLeftExpandedOpen(false);
                                setMobileRightOpen(false);
                            }}
                            aria-hidden="true"
                        />
                    )}

                    {/* Left panel: slim icon bar + sections/colors panel */}
                    <div className="shrink-0 self-stretch min-h-0 flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                        <LiquidPreviewSettingsPanel
                            templatesConfig={templatesConfig}
                            form={form}
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
                            refImages={productImages}
                            templateSchemas={templateSchemas}
                        />
                    </div>

                    {/* Main content area - Preview (scaled like Template Selection) */}
                    <div className="flex-1 min-w-0 min-h-0 flex flex-col px-1 overflow-hidden">
                        <div
                            ref={previewContainerRef}
                            className="flex-1 min-h-0 w-full flex relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200/80"
                            style={{ minHeight: 0 }}
                            onWheel={previewContainerSize.width > 0 && previewContainerSize.height > 0 ? (e) => {
                                const iframe = previewContainerRef.current?.querySelector('iframe');
                                if (iframe && iframe.contentWindow) {
                                    try {
                                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                        const scrollableElement = iframeDoc.documentElement || iframeDoc.body;
                                        if (scrollableElement) {
                                            scrollableElement.scrollTop += (e.deltaY * (1 / previewZoomScale));
                                            // e.preventDefault();
                                        }
                                    } catch (err) {
                                        iframe.contentWindow.postMessage({
                                            type: 'SCROLL',
                                            deltaY: e.deltaY * (1 / previewZoomScale)
                                        }, '*');
                                    }
                                }
                            } : undefined}
                        >
                            {previewContainerSize.width > 0 && previewContainerSize.height > 0 ? (() => {
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
                                            transform: `scale(${PREVIEW_SCALE})`
                                        }}
                                    >
                                        <div
                                            className="relative flex-1 w-full h-full min-h-0 flex flex-col rounded-lg overflow-hidden [&>div]:flex-1 [&_iframe]:flex-1 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:rounded-lg"
                                            style={{
                                                opacity: isPreviewModeSwitching ? 0.78 : 1,
                                                transition: "opacity 180ms ease-out",
                                            }}
                                        >
                                            <LiquidPreviewRender
                                                templateRows={templatesConfig}
                                                previewMode={previewMode}
                                                selectedSection={selectedSection}
                                                storeName={storeName}
                                                selectorMode={selectorMode}
                                            />
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div
                                    className="relative flex-1 min-h-0 w-full flex [&_iframe]:rounded-lg"
                                    style={{
                                        opacity: isPreviewModeSwitching ? 0.78 : 1,
                                        transition: "opacity 180ms ease-out",
                                    }}
                                >
                                    <LiquidPreviewRender
                                        templateRows={templatesConfig}
                                        previewMode={previewMode}
                                        selectedSection={selectedSection}
                                        storeName={storeName}
                                        selectorMode={selectorMode}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel: editor */}
                    {(desktopRightOpen || mobileRightOpen) && (
                        <div
                            className={`shrink-0 flex md:relative
                                max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:h-screen max-md:w-[min(320px,85vw)] max-md:shadow-xl
                                max-md:transition-transform max-md:duration-200 max-md:ease-out
                                ${mobileRightOpen ? "max-md:translate-x-0" : "max-md:translate-x-full max-md:pointer-events-none"}
                                ${desktopRightOpen ? "" : "md:hidden"}
                            `}
                        >
                            <LiquidPreviewEditorPanel
                                selectedSection={selectedSection}
                                form={form}
                                onFieldChange={updateField}
                                sectionOverrides={sectionOverrides}
                                onSectionOverrideChange={handleSectionOverrideChange}
                                refImages={productImages}
                                templateSchemas={templateSchemas}
                                pdpId={pageId ?? ""}
                                onClose={() => {
                                    setMobileRightOpen(false);
                                    setDesktopRightOpen(false);
                                    setSelectedSection(null);
                                }}
                            />
                        </div>
                    )}
                </div>
    );

    return (
        <>
            <ui-save-bar id={PRODUCT_PREVIEW_SAVE_BAR_ID}>
                <button
                    ref={contextualSaveButtonRef}
                    type="button"
                    variant="primary"
                    onClick={handleContextualSave}
                    disabled={isSaving}
                >
                    {isContextualSaving ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={handleContextualDiscard} disabled={isSaving}>
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
                <div className="w-full h-full min-h-screen flex flex-col">
                    <div className="px-2 sm:px-3 pt-2 pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#f6f8ff] to-[#e8eeff] px-3.5 py-2.5 ring-1 ring-blue-100">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-white text-[#4f46e5] shadow-sm ring-1 ring-blue-100">
                                    <Wand2 size={16} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <p className="m-0 text-sm font-semibold text-slate-900">Review &amp; customize</p>
                                    <p className="m-0 hidden text-xs text-slate-500 sm:block">
                                        Click a section to edit it, then publish when it looks right.
                                    </p>
                                </div>
                            </div>
                            {previewToolbarSecondaryActions}
                        </div>
                    </div>
                    {editorWorkspace}
                </div>
            )}

        </>

    );
}
