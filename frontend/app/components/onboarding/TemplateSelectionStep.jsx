import { useMemo, useState, useEffect, useRef } from "react";
import { Box, BlockStack, Text, Button, InlineStack, Card, Modal } from "@shopify/polaris";
import GenerateProgressCard from "../../routes/_app.generate_pdp/utils/GenerateProgressCard.jsx";
import GenerateContainer from "../../routes/_app.generate_pdp/utils/GenerateContainer.jsx";
import LiquidPreviewRender from "../theme-preview-editor/LiquidPreviewRender.jsx";
import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "../../routes/_app.generate_pdp/product-page/utils/productAiResponeMapping.js";
import { generateTemplateConfig } from "../../routes/_app.generate_pdp/product-page/utils/productTemplatesConfig.js";
import { getDefaultMagicResponses, getDefaultColor } from "../../routes/_app.generate_pdp/product-page/utils/default-magic-responses/index.js";

const CATEGORY_DISPLAY = {
  health_beauty: "Health & Beauty",
  fashion: "Fashion",
  home_kitchen: "Home & Kitchen",
  kids_toys: "Kids & Toys",
  car_accessories: "Car Accessories",
  general: "General",
};

export default function TemplateSelectionStep({
  category = "general",
  selectedTemplate,
  onTemplateChange,
  onBeginMagic,
  onBack,
  isAuthenticating = false,
  productImages = [],
  productTitle = "",
  productDescription = "",
  storeName = "Store",
  showPlanBadges = false,
  showprogressCard = true,
  selectedProductId = null,

}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastTouchYRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const categoryLabel = CATEGORY_DISPLAY[category] || category;
  const canBegin = selectedTemplate === 1 || selectedTemplate === 2;

  // Ensure selectedTemplate defaults to 1 if not set
  const activeTemplate = selectedTemplate || 1;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is a common mobile breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch scroll (mobile + touch laptops): one delegated listener, passive: false so preventDefault works
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleTouchMove = (e) => {
      const overlay = e.target.closest("[data-scroll-overlay]");
      if (!overlay || lastTouchYRef.current == null) return;
      const touchY = e.touches[0]?.clientY;
      if (touchY == null) return;
      const scale = Number(overlay.dataset.scale) || 1;
      const deltaY = (lastTouchYRef.current - touchY) * scale;
      lastTouchYRef.current = touchY;

      const iframe = overlay.parentElement?.querySelector("iframe");
      if (iframe?.contentWindow) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const scrollableElement = iframeDoc?.documentElement || iframeDoc?.body;
          if (scrollableElement) scrollableElement.scrollTop += deltaY;
        } catch {
          iframe.contentWindow.postMessage({ type: "SCROLL", deltaY }, "*");
        }
      }
      e.preventDefault();
    };
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, []);

  const handleBeginMagic = async () => {
    setIsLoading(true);
    try {
      await onBeginMagic();
    } catch (error) {
      console.error("Error beginning magic:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create dummy magic response data based purely on category defaults
  // (do NOT use live product title/description/images in template selection preview)
  // Single hex from config: categoryDefaults.color
  const dummyMagicResponse = useMemo(() => {
    const categoryDefaults = getDefaultMagicResponses(category);
    const hex = getDefaultColor(category);

    const defaultImages = categoryDefaults.images || {};
    const placeholderImages = {
      body_images: defaultImages.body_images || {},
      product_images: defaultImages.product_images || {},
    };

    return {
      ...DEFAULT_MAGIC_RESPONSE,
      images: placeholderImages,
      text: categoryDefaults.text || {},
      selected_color: hex || undefined,
      color_schemes: hex ? [hex] : [],
    };
  }, [category]);

  // Generate product data from magic response
  const productData = useMemo(() => aiResponseMapping(dummyMagicResponse), [dummyMagicResponse]);

  // Generate templates for both Template 1 and Template 2
  const template1Config = useMemo(
    () => generateTemplateConfig(category, productData, 1, dummyMagicResponse),
    [category, productData, dummyMagicResponse]
  );

  const template2Config = useMemo(
    () => generateTemplateConfig(category, productData, 2, dummyMagicResponse),
    [category, productData, dummyMagicResponse]
  );

  return (
    <>
      <Box className="overflow-x-hidden">
        <GenerateContainer style={{ maxWidth: "1150px" }}
          bottomActions={
            <InlineStack gap="300" blockAlign="center" align="end">
              <Button onClick={onBack} disabled={isAuthenticating}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleBeginMagic}
                disabled={!canBegin || isAuthenticating || isLoading}
                loading={isLoading}
              >
                Begin Magic
              </Button>
            </InlineStack>
          }
        >
          <BlockStack >
            {showprogressCard ? <GenerateProgressCard currentStep={2} /> :
              <Text as="h2" variant="headingLg" fontWeight="semibold">
                Select a Template
              </Text>}

            <Box paddingBlockEnd="500">
              <Text as="p" variant="bodyMd" tone="subdued">
                Your selected product falls under the <strong>{categoryLabel}</strong> category.
                For it, we suggest these two templates:
              </Text>
            </Box>

            <div ref={scrollContainerRef}>
              {isMobile ? (
                // Mobile: Show tabs with single template view
                <BlockStack gap="400">
                  {/* Custom styled tabs in the middle */}
                  <Box className="flex justify-center w-full">
                    <div className="inline-flex bg-[#f7f7f7] rounded-xl p-1 border border-[#e5e5e5] gap-2">
                      {activeTemplate === 1 ? (
                        <div
                          onClick={() => onTemplateChange(1)}
                          className={`px-2 py-1 rounded-lg gap-x-1 font-medium cursor-pointer text-sm flex items-center border border-purple-200 ${showPlanBadges ? "bg-purple-100 text-purple-600" : "py-2 bg-black text-white"}`}
                        >
                          {showPlanBadges ? <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" /> : null}
                          {showPlanBadges ? "Premium" : "Template 1"}
                        </div>
                      ) : (
                        <div
                          onClick={() => onTemplateChange(1)}
                          className="px-2 py-1 rounded-lg bg-transparent text-[#2c2c2c] font-normal cursor-pointer text-sm flex items-center"
                        >
                          {showPlanBadges ? "Premium" : "Template 1"}
                        </div>
                      )}
                      {activeTemplate === 2 ? (
                        <div
                          onClick={() => onTemplateChange(2)}
                          className={`px-2 py-1 rounded-lg gap-x-1 font-medium cursor-pointer text-sm flex items-center border border-green-200 ${showPlanBadges ? "bg-green-100 text-green-600" : "py-2 bg-black text-white"}`}
                        >
                          {showPlanBadges ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" /> : null}
                          {showPlanBadges ? "Free" : "Template 2"}
                        </div>
                      ) : (
                        <div
                          onClick={() => onTemplateChange(2)}
                          className="px-2 py-1 rounded-lg bg-transparent text-[#2c2c2c] font-normal cursor-pointer text-sm flex items-center"
                        >
                          {showPlanBadges ? "Free" : "Template 2"}
                        </div>
                      )}
                    </div>
                  </Box>
                  <Box paddingBlockStart="400" className="flex justify-center w-full">
                    <div className="w-full max-w-full rounded-lg overflow-hidden relative">

                      <div className="flex-1 p-2 flex flex-col overflow-hidden max-h-[520px] min-h-[380px] items-center">
                        <div className="relative w-full max-w-[420px] flex-1 flex min-h-0">

                          <LiquidPreviewRender
                            templateRows={activeTemplate === 1 ? template1Config : template2Config}
                            previewMode="mobile"
                            selectedSection={null}
                            storeName={storeName}
                          />
                          {/* Overlay that captures clicks but allows scrolling */}
                          <div
                            data-scroll-overlay
                            data-scale="1"
                            onWheel={(e) => {
                              // Mark that we're scrolling so clicks don't trigger selection
                              e.currentTarget.dataset.isScrolling = "true";
                              // Forward wheel events to iframe for scrolling
                              const iframe =
                                e.currentTarget.parentElement?.querySelector("iframe");
                              if (iframe && iframe.contentWindow) {
                                try {
                                  const iframeDoc =
                                    iframe.contentDocument || iframe.contentWindow.document;
                                  const scrollableElement =
                                    iframeDoc.documentElement || iframeDoc.body;
                                  if (scrollableElement) {
                                    scrollableElement.scrollTop += e.deltaY;
                                    // e.preventDefault();
                                  }
                                } catch (err) {
                                  // CORS or other error, try postMessage
                                  iframe.contentWindow.postMessage(
                                    {
                                      type: "SCROLL",
                                      deltaY: e.deltaY,
                                    },
                                    "*"
                                  );
                                }
                              }
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.dataset.isScrolling = "true";
                              lastTouchYRef.current = e.touches[0]?.clientY ?? null;
                            }}
                            onTouchEnd={(e) => {
                              lastTouchYRef.current = null;
                              setTimeout(() => {
                                delete e.currentTarget?.dataset?.isScrolling;
                              }, 100);
                            }}
                            onTouchCancel={(e) => {
                              lastTouchYRef.current = null;
                              setTimeout(() => {
                                delete e.currentTarget?.dataset?.isScrolling;
                              }, 100);
                            }}
                            style={{ touchAction: "none" }}
                            className="absolute inset-0 z-[1] pointer-events-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </Box>
                </BlockStack>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)",
                    gap: "16px",
                    alignItems: "start",
                  }}
                >
                  <BlockStack gap="300">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          Template Configuration
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Select a template on the left and preview it live on the right.
                        </Text>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "12px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onTemplateChange(1)}
                            style={{
                              textAlign: "left",
                              padding: "12px",
                              borderRadius: "10px",
                              border: `1px solid ${selectedTemplate === 1 ? "#2f6f63" : "#d1d5db"}`,
                              background: selectedTemplate === 1 ? "#edf5f3" : "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            <BlockStack gap="100">
                              <InlineStack gap="100" blockAlign="center">
                                <Text as="span" variant="bodyMd" fontWeight="semibold">
                                  Template 1
                                </Text>
                                {showPlanBadges ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[11px]">
                                    Premium
                                  </span>
                                ) : null}
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Bold storytelling layout with premium sections.
                              </Text>
                            </BlockStack>
                          </button>

                          <button
                            type="button"
                            onClick={() => onTemplateChange(2)}
                            style={{
                              textAlign: "left",
                              padding: "12px",
                              borderRadius: "10px",
                              border: `1px solid ${selectedTemplate === 2 ? "#2f6f63" : "#d1d5db"}`,
                              background: selectedTemplate === 2 ? "#edf5f3" : "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            <BlockStack gap="100">
                              <InlineStack gap="100" blockAlign="center">
                                <Text as="span" variant="bodyMd" fontWeight="semibold">
                                  Template 2
                                </Text>
                                {showPlanBadges ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[11px]">
                                    Free
                                  </span>
                                ) : null}
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Clean conversion-focused structure for most products.
                              </Text>
                            </BlockStack>
                          </button>
                        </div>
                      </BlockStack>
                    </Card>
                  </BlockStack>

                  <div style={{ position: "sticky", top: "16px", alignSelf: "start" }}>
                    <BlockStack gap="0">
                      <div
                        style={{
                          border: "1px solid #e1e3e5",
                          borderBottom: "none",
                          borderRadius: "12px 12px 0 0",
                          background: "#ffffff",
                          height: "44px",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 12px",
                          gap: "7px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: "#c73732",
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
                      </div>
                      <div className="border border-[#e1e3e5] border-t-0 rounded-b-[12px] bg-white overflow-hidden">
                        {(() => {
                          const PREVIEW_SCALE = 0.58;
                          const CONTAINER_WIDTH = 380;
                          const CONTAINER_HEIGHT = 620;
                          const scaledWidth = CONTAINER_WIDTH / PREVIEW_SCALE;
                          const scaledHeight = CONTAINER_HEIGHT / PREVIEW_SCALE;
                          const selectedConfig = activeTemplate === 1 ? template1Config : template2Config;

                          return (
                            <div
                              className="relative overflow-hidden"
                              style={{
                                width: `${CONTAINER_WIDTH}px`,
                                height: `${CONTAINER_HEIGHT}px`,
                              }}
                            >
                              <div
                                className="absolute top-0 left-0 origin-top-left"
                                style={{
                                  width: `${scaledWidth}px`,
                                  height: `${scaledHeight}px`,
                                  transform: `scale(${PREVIEW_SCALE})`,
                                }}
                              >
                                <div className="w-full h-full [&>div]:h-full [&_iframe]:h-full [&_iframe]:w-full">
                                  <LiquidPreviewRender
                                    templateRows={selectedConfig}
                                    previewMode="desktop"
                                    selectedSection={null}
                                    storeName={storeName}
                                  />
                                </div>
                              </div>
                              <div
                                data-scroll-overlay
                                data-scale="1.724"
                                onWheel={(e) => {
                                  const iframe = e.currentTarget.parentElement?.querySelector("iframe");
                                  if (iframe && iframe.contentWindow) {
                                    try {
                                      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                      const scrollableElement = iframeDoc.documentElement || iframeDoc.body;
                                      if (scrollableElement) {
                                        scrollableElement.scrollTop += (e.deltaY * (1 / PREVIEW_SCALE));
                                      }
                                    } catch (err) {
                                      iframe.contentWindow.postMessage(
                                        { type: "SCROLL", deltaY: e.deltaY * (1 / PREVIEW_SCALE) },
                                        "*",
                                      );
                                    }
                                  }
                                }}
                                onTouchStart={(e) => {
                                  lastTouchYRef.current = e.touches[0]?.clientY ?? null;
                                }}
                                onTouchEnd={() => {
                                  lastTouchYRef.current = null;
                                }}
                                onTouchCancel={() => {
                                  lastTouchYRef.current = null;
                                }}
                                style={{ touchAction: "none" }}
                                className="absolute inset-0 z-[1] pointer-events-auto"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </BlockStack>
                  </div>
                </div>
              )}
            </div>
          </BlockStack>
        </GenerateContainer>
      </Box>

    </>
  );
}
