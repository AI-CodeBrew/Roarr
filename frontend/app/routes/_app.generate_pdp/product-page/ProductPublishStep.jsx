import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Text,
  InlineStack,
  BlockStack,
  Card,
} from "@shopify/polaris";
import { Check } from "lucide-react";
import GenerateContainer from "../utils/GenerateContainer.jsx";
import GenerateProgressCard from "../utils/GenerateProgressCard.jsx";
import { usePages } from "../../../lib/PagesContext";
import { usePosthogAfterIdentify } from "../../../lib/PosthogIdentityContext";
import { useDashboardLoaderData } from "../../../lib/DashboardDataContext";
import { normalizeMarketType } from "../../../lib/posthogMarketType.js";
import { useAppBridge } from "@shopify/app-bridge-react";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget.jsx";
import { getProductPageThemeName } from "../../../lib/themeNames.js";

/**
 * Step 6: Publish page
 * Shows a final action button that calls the server-side publish endpoint.
 */

const categoryMap = {
  health_beauty: "Health & Beauty",
  fashion: "Fashion",
  home_kitchen: "Home & Kitchen",
  kids_toys: "Kids & Toys",
  car_accessories: "Car Accessories",
  general: "General",
};

// Shopify App Store handle - update this if your app handle is different
// You can find your app handle in the Shopify Partner Dashboard or in your app's URL
const APP_STORE_HANDLE = "roarr";

function PublishStep({
  productId,
  category,
  magicResponse,
  selectedColor,
  onBack,
  productTitle,
  productDescription,
  productHandle,
  pageId,
  selectedTemplate = null,
  hideStepIndicator = false,
  autoStart = false,
  onAutoStartConsumed,
  onComplete,
  completeButtonText = "Create New Page",
  pageHeading = null,
  // If true, treat this publish as part of the onboarding flow
  // and trigger the review modal after the first page instead of the second.
  isOnboarding = false,
}) {
  const shopify = useAppBridge()
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishResult, setPublishResult] = useState(null);
  const [currentPublishStep, setCurrentPublishStep] = useState(0);
  const [isPublishComplete, setIsPublishComplete] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { pages, refreshPages, publishedPages, storeDetails } = usePages();
  const hasInitiatedPublishRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);


  const posthog = usePosthogAfterIdentify();
  const { marketPreferences = null } = useDashboardLoaderData() || {};
  const pdpMarketType = normalizeMarketType(
    marketPreferences?.market_type || marketPreferences?.marketType,
  );

  useEffect(() => {
    if (!posthog || !posthog.__loaded) return;
    posthog.capture('page_viewed', {
      page_name: 'template_preview',
      page_path: '/app',
    })
  }, [posthog, posthog?.__loaded]);
  // Refetch pages on mount
  useEffect(() => {
    refreshPages().catch((err) => {
      console.error("Error refetching pages:", err);
    });
  }, [refreshPages]);

  async function handleRequestReview() {
    try {
      const result = await shopify.reviews.request();
      if (!result.success) {
        console.log(
          `Review modal not displayed. Reason: ${result.code}: ${result.message}`,
        );
      }
      else {
        console.log('Review modal displayed successfully');
      }
      // If result.success is true, the Shopify admin review modal is shown
    } catch (error) {
      console.error('Error requesting review:', error);
    }
  }


  const REVIEW_DISMISSED_KEY = "kluck_review_dismissed_v1";

  const publishSteps = [
    "Preparing Page Data",
    "Configuring Theme File",
    "Uploading Sections",
    "Uploading Templates",
    "Generating Editor URL",
    "Finalizing",
  ];

  const getPreviewUrlFromResult = (result) => {
    if (!result || typeof result !== "object") return "";

    // Support a few common shapes/keys coming back from the Python backend.
    const candidates = [
      result.previewLink,
      result.preview_link,
      result.previewUrl,
      result.preview_url,
      result.themeEditorUrl,
      result.theme_editor_url,
      result.theme_editor_link,
      result.editorUrl,
      result.editor_url,
      result.url,
      result.link,
    ].filter(Boolean);

    const first = candidates[0];
    return typeof first === "string" ? first : "";
  };

  const previewUrl = getPreviewUrlFromResult(publishResult);

  const handlePublish = async () => {
    // Prevent double calls
    if (hasInitiatedPublishRef.current || isPublishing) {
      return;
    }

    hasInitiatedPublishRef.current = true;
    setPublishError("");
    setPublishResult(null);
    setIsPublishing(true);
    setCurrentPublishStep(0);
    setIsPublishComplete(false);

    // Consume autoStart flag when manually clicking the button
    if (autoStart && onAutoStartConsumed) {
      onAutoStartConsumed();
    }

    // Start progress animation
    const totalSteps = publishSteps.length;
    let step = 0;
    const stepInterval = setInterval(() => {
      step += 1;
      setCurrentPublishStep(step);

      // When reaching the final step, wait for API call to complete
      if (step >= totalSteps - 1) {
        clearInterval(stepInterval);
      }
    }, 1500);

    const isFirstPush = publishedPages.length === 0;

    if (posthog) {
      // If first push, update onboarding completion
      if (isFirstPush) {
        const installDateRaw = storeDetails?.created_at ?? storeDetails?.createdAt;
        const installDate = installDateRaw ? new Date(installDateRaw) : null;
        const hoursCalculated = installDate
          ? (Date.now() - installDate.getTime()) / (1000 * 60 * 60)
          : null;

        posthog.capture('pdp_published', {
          pdp_id: pageId,
          theme_name: getProductPageThemeName(selectedTemplate, category),
          template: Number(selectedTemplate) || 1,
          category: category || "general",
          is_first_publish: isFirstPush,
          time_from_install_to_publish_hours: hoursCalculated,
          market_type: pdpMarketType,
        })

        posthog.setPersonProperties({
          onboarding_completed: true,
        },
          {
            first_push_at: new Date().toISOString()
          }
        )
      }
      else {
        posthog.capture('pdp_published', {
          pdp_id: pageId,
          theme_name: getProductPageThemeName(selectedTemplate, category),
          template: Number(selectedTemplate) || 1,
          category: category || "general",
          is_first_publish: isFirstPush,
          market_type: pdpMarketType,
        })
      }
    }

    try {
      const normalizedSelectedTemplate =
        selectedTemplate === 1 || selectedTemplate === 2 || selectedTemplate === 3
          ? selectedTemplate
          : selectedTemplate == 1
            ? 1
            : selectedTemplate == 2
              ? 2
              : selectedTemplate == 3
                ? 3
                : undefined;

      const res = await fetch("/api/publish-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          category,
          magicResponse,
          selectedColor,
          pageId,
          selectedTemplate: normalizedSelectedTemplate,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Publish failed");
      }

      // Complete all steps
      setCurrentPublishStep(totalSteps);
      setIsPublishComplete(true);
      setPublishResult(data);

      // Show review modal after a short delay (only if not previously dismissed).
      // - On onboarding flow: after the first published page.
      // - Everywhere else: after the second published page (current behavior).
    } catch (err) {
      clearInterval(stepInterval);
      setPublishError(err?.message || "Publish failed");
      setCurrentPublishStep(0);
      setIsPublishComplete(false);
      hasInitiatedPublishRef.current = false; // Reset on error so user can retry
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (!isPublishComplete) return;
    const pageCount = pages?.length || 0;
    const targetPageCount = 1;

    // show own review modal when the merchant reaches the target 1 page count.
    if (pageCount === targetPageCount) {
      if (showReviewModal) return;
      setTimeout(() => {
        setShowReviewModal(true)
      }, 2000)
    }
    else {
      setTimeout(() => {
        handleRequestReview()
      }, 2000)
    }

  }, [pages, isOnboarding, isPublishComplete])

  // If user came from Configuration "Push", auto-trigger publishing once.
  useEffect(() => {
    if (!autoStart) return;
    if (isPublishing) return;
    if (publishResult) return;
    if (hasInitiatedPublishRef.current) return; // Prevent double calls
    if (!productId || !magicResponse) return;
    onAutoStartConsumed?.();
    // Fire-and-forget; UI is driven by isPublishing/publishResult state.
    handlePublish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, productId, magicResponse]);

  const statusForIndex = (index) => {
    const isCompleted =
      index < currentPublishStep ||
      (index === publishSteps.length - 1 && isPublishComplete);
    const isActive =
      index === currentPublishStep &&
      !(index === publishSteps.length - 1 && isPublishComplete);
    if (isCompleted) return "done";
    if (isActive) return "active";
    return "todo";
  };

  const handleReviewNow = () => {
    // Open Shopify App Store review page
    const reviewUrl = `https://apps.shopify.com/${APP_STORE_HANDLE}#modal-show=WriteReviewModal`;
    window.open(reviewUrl, "_blank", "noopener,noreferrer");
    handleDismissReview();
  };

  const handleDismissReview = () => {
    setShowReviewModal(false);
    try {
      window.localStorage?.setItem(REVIEW_DISMISSED_KEY, "1");
    } catch {
      // Ignore localStorage errors
    }
  };

  const heading =
    pageHeading ||
    (publishResult ? "Pushed to Shopify Successfully!" : "Publish to Shopify");

  return (
    <s-page heading={heading} inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-y-auto overflow-x-hidden">
        <GenerateContainer style={{ maxWidth: "1150px" }}
          className="pb-[88px] md:pb-4"
          bottomActions={
            !publishResult ? (
              <InlineStack
                gap="200"
                align="end"
                blockAlign="center"
                className="flex-col sm:flex-row"
              >
                {onBack && (
                  <Button
                    variant="secondary"
                    onClick={onBack}
                    disabled={isPublishing}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={handlePublish}
                  loading={isPublishing}
                  disabled={!magicResponse || isPublishing}
                  className="w-full sm:w-auto"
                >
                  {isPublishing ? "Pushing..." : "Push"}
                </Button>
              </InlineStack>
            ) : (
              <InlineStack
                gap="200"
                align="end"
                blockAlign="center"
                className="flex-col sm:flex-row"
              >
                <Button
                  variant="primary"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await refreshPages();
                      await onComplete?.();
                    } catch (error) {
                      console.error("Error completing publish flow:", error);
                      setIsLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Redirecting..." : completeButtonText || 'Open Dashboard'}
                </Button>
              </InlineStack>
            )
          }
        >
          <BlockStack gap="400">
            {/* Same heading pattern as Product Configurations (step 1) */}
            <BlockStack gap="100">
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
                  }}
                >
                  4
                </div>
                <Text as="h2" variant="headingLg" fontWeight="semibold">
                  {publishResult ? "Pushed to Shopify" : "Publish to Shopify"}
                </Text>
              </InlineStack>
              <Box paddingBlockStart="100">
                <Text as="p" variant="bodySm" tone="subdued">
                  {publishResult
                    ? "Your page has been pushed to Shopify. You can review it in your Online Store."
                    : isPublishing
                      ? "We’re pushing your generated page to Shopify. This may take a moment."
                      : "Click the Push button below to publish your generated page to Shopify."}
                </Text>
              </Box>
            </BlockStack>

            {!hideStepIndicator && (
              <GenerateProgressCard
                currentStep={publishResult ? 5 : 4}
                isLoading={isPublishing && !publishResult}
              />
            )}

            {/* Publishing Progress - always visible but disabled until Push is clicked */}
            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h3" variant="bodySm" fontWeight="semibold">
                  Pushing to Shopify Progress
                </Text>
                <Box className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 items-stretch">
                  {/* Left: Progress Steps */}
                  <BlockStack gap="200">
                    {publishSteps.map((label, index) => {
                      const status = statusForIndex(index);
                      const isDisabled = !isPublishing && !publishResult;
                      return (
                        <InlineStack
                          key={label}
                          gap="200"
                          align="start"
                          blockAlign="center"
                        >
                          <Box
                            className={[
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                              isDisabled
                                ? "bg-gray-100 border border-gray-200 text-gray-400"
                                : status === "done"
                                  ? "bg-gray-900 text-white"
                                  : status === "active"
                                    ? "bg-gray-200 text-gray-900"
                                    : "bg-white border border-gray-200 text-gray-500",
                            ].join(" ")}
                          >
                            {isDisabled ? (
                              <Text
                                as="span"
                                variant="bodyXs"
                                fontWeight="semibold"
                              >
                                {index + 1}
                              </Text>
                            ) : status === "done" ? (
                              <Check size={16} />
                            ) : status === "active" ? (
                              <Box className="w-4 h-4">
                                <svg
                                  className="animate-spin text-gray-900"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </Box>
                            ) : (
                              <Text
                                as="span"
                                variant="bodyXs"
                                fontWeight="semibold"
                              >
                                {index + 1}
                              </Text>
                            )}
                          </Box>

                          <Text
                            as="span"
                            variant="bodySm"
                            tone={
                              isDisabled || status === "todo"
                                ? "subdued"
                                : undefined
                            }
                            fontWeight={
                              status === "active" ? "semibold" : "regular"
                            }
                          >
                            {label}
                          </Text>
                        </InlineStack>
                      );
                    })}
                  </BlockStack>

                  {/* Right: Image */}
                  <Box className="hidden lg:block h-full">
                    <Box
                      className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden ${publishResult
                        ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
                        : isPublishing
                          ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                          : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
                        }`}
                      style={{
                        backgroundImage: publishResult
                          ? "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)"
                          : isPublishing
                            ? "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
                            : "radial-gradient(circle at 50% 50%, rgba(107, 114, 128, 0.1) 0%, transparent 70%)",
                      }}
                    >
                      <Box className="text-center p-6">
                        {publishResult ? (
                          <Box className="flex flex-col items-center gap-3">
                            <Box className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                              <Check
                                size={48}
                                className="text-white"
                                strokeWidth={3}
                              />
                            </Box>
                            <Text
                              as="p"
                              variant="bodyMd"
                              fontWeight="semibold"
                              alignment="center"
                            >
                              Published!
                            </Text>
                          </Box>
                        ) : isPublishing ? (
                          <Box className="flex flex-col items-center gap-3">
                            <Box className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg animate-pulse">
                              <svg
                                className="w-12 h-12 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                            </Box>
                            <Text
                              as="p"
                              variant="bodyMd"
                              fontWeight="semibold"
                              alignment="center"
                            >
                              Pushing...
                            </Text>
                          </Box>
                        ) : (
                          <Box className="flex flex-col items-center gap-3">
                            <Box className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-12 h-12 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                            </Box>
                            <Text
                              as="p"
                              variant="bodyMd"
                              fontWeight="semibold"
                              alignment="center"
                            >
                              Ready to Push
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                </BlockStack>
              </Box>
            </Card>

            {/* Success message and button - shown when publishing is complete */}
            {publishResult && (
              <BlockStack gap="300">
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface-success" padding="300">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Pushed to Shopify Successfully!
                      </Text>
                      <Text as="p" variant="bodyXs" tone="subdued">
                        Your page has been pushed to Shopify and is now live.
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
                {previewUrl && (
                  <Button variant="primary" url={previewUrl} external fullWidth>
                    Preview Page
                  </Button>
                )}
              </BlockStack>
            )}

            {/* What happens and other content - moved down */}
            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h2" variant="headingSm" fontWeight="semibold">
                  What is happening after 'Push'
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Selected product will be updated with the generated title, description, and images
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Sections and templates will be added to the theme
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Dynamic data is stored using metafields of product for
                    easy management
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Images are first uploaded to the content section, then
                    their reference IDs are set in metafields to make them
                    dynamic
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Assigning uploaded template to the product
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • You can always edit and customize your page in the theme
                    editor
                  </Text>
                </BlockStack>
                </BlockStack>
              </Box>
            </Card>

            {publishError && (
              <Card roundedAbove="sm" padding="0">
                <Box background="bg-surface-critical" padding="300">
                  <BlockStack gap="100">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Push to Shopify Failed
                      </Text>
                      <Button variant="plain" onClick={() => setPublishError("")}>
                        Dismiss
                      </Button>
                    </InlineStack>
                    <Text as="p" variant="bodyXs">
                      {publishError}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </GenerateContainer>
      </Box>

      {/* Review Modal */}
      {/* <Modal
        open={showReviewModal}
        onClose={handleDismissReview}
        title="Enjoying Roarr?"
        primaryAction={{
          content: "Leave a Review",
          onAction: handleReviewNow,
        }}
        secondaryActions={[
          {
            content: "Maybe Later",
            onAction: handleDismissReview,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              We're thrilled that you've successfully published your page! Your
              feedback helps us improve and helps other merchants discover Roarr
              AI.
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Would you mind taking a moment to leave us a review on the Shopify
              App Store?
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal> */}
    </s-page>
  );
}

export default function ProductPublishStep({ payload, onBack, onComplete }) {
  if (!payload) return null;

  return (
    <PublishStep
      productId={payload.productId}
      category={payload.category}
      magicResponse={payload.magicResponse}
      selectedColor={payload.selectedColor}
      productTitle={payload.productTitle}
      productDescription={payload.productDescription}
      productHandle={payload.productHandle}
      pageId={payload.pageId}
      selectedTemplate={payload.selectedTemplate}
      autoStart
      hideStepIndicator
      onBack={onBack}
      onComplete={onComplete}
      completeButtonText="Open Dashboard"
    />
  );
}

export { PublishStep };
