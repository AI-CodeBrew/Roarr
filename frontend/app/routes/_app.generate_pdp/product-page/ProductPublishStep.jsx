import { useState, useEffect, useRef } from "react";
import { Box } from "@shopify/polaris";
import { Rocket } from "lucide-react";
import GenerateContainer from "../utils/GenerateContainer.jsx";
import GenerateProgressCard from "../utils/GenerateProgressCard.jsx";
import PublishProgressView from "../../../components/PublishProgressView.jsx";
import { PrimaryButton, SecondaryButton } from "../../../components/RoarrUI.jsx";
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


  const REVIEW_DISMISSED_KEY = "roarr_review_dismissed_v1";

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

  // The backend publishes in the background (it takes minutes, longer than proxies
  // keep a request open). Poll the page until the publish started at `startedAt` ends.
  const waitForPublish = async (startedAt) => {
    const deadline = Date.now() + 15 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/generation-status/${pageId}`).catch(() => null);
      const status = res?.ok ? await res.json().catch(() => null) : null;
      // Skip transient errors and a finished state left over from an earlier publish.
      if (!status || Number(status.publish_started_at) !== Number(startedAt)) continue;
      if (status.publish_status === "completed") return status;
      if (status.publish_status === "failed") {
        throw new Error(status.publish_error || "Publish failed");
      }
    }
    throw new Error("Publishing is taking longer than expected. Refresh in a minute to check.");
  };

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
        [1, 2, 3, 4, 5, 6].includes(Number(selectedTemplate)) ? Number(selectedTemplate) : undefined;

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
        throw new Error(data?.error || `Publish failed (HTTP ${res.status})`);
      }

      let result = data;
      if (data?.started) {
        result = await waitForPublish(data.publish_started_at);
        void fetch("/api/publish-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "seed_bundle", productId }),
        }).catch(() => {});
      }

      // Complete all steps
      setCurrentPublishStep(totalSteps);
      setIsPublishComplete(true);
      setPublishResult(result);

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
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {onBack && (
                  <SecondaryButton
                    onClick={onBack}
                    disabled={isPublishing}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </SecondaryButton>
                )}

                <PrimaryButton
                  onClick={handlePublish}
                  loading={isPublishing}
                  disabled={!magicResponse || isPublishing}
                  className="w-full sm:w-auto"
                >
                  {isPublishing ? null : <Rocket size={16} aria-hidden />}
                  {isPublishing ? "Pushing..." : "Push"}
                </PrimaryButton>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <PrimaryButton
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
                </PrimaryButton>
              </div>
            )
          }
        >
          <PublishProgressView
            title={publishResult ? "Pushed to Shopify" : "Publish to Shopify"}
            description={
              publishResult
                ? "Your page has been pushed to Shopify. You can review it in your Online Store."
                : isPublishing
                  ? "We’re pushing your generated page to Shopify. This may take a moment."
                  : "Click the Push button below to publish your generated page to Shopify."
            }
            beforeProgress={
              !hideStepIndicator ? (
                <GenerateProgressCard
                  currentStep={publishResult ? 5 : 4}
                  isLoading={isPublishing && !publishResult}
                />
              ) : null
            }
            steps={publishSteps}
            statusForIndex={statusForIndex}
            isPublishing={isPublishing}
            isDone={Boolean(publishResult)}
            successMessage="Your page has been pushed to Shopify and is now live."
            successLink={previewUrl ? { url: previewUrl, label: "Preview Page" } : null}
            infoTitle="What is happening after 'Push'"
            infoItems={[
              "Selected product will be updated with the generated title, description, and images",
              "Sections and templates will be added to the theme",
              "Dynamic data is stored using metafields of product for easy management",
              "Images are first uploaded to the content section, then their reference IDs are set in metafields to make them dynamic",
              "Assigning uploaded template to the product",
              "You can always edit and customize your page in the theme editor",
            ]}
            error={publishError}
            errorTitle="Push to Shopify Failed"
            onDismissError={() => setPublishError("")}
          />
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
