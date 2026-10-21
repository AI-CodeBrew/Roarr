import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Text,
  InlineStack,
  BlockStack,
  Card,
} from "@shopify/polaris";
import { Check } from "lucide-react";
import GenerateContainer from "../../_app.generate_pdp/utils/GenerateContainer.jsx";
import GenerateProgressCard from "../../_app.generate_pdp/utils/GenerateProgressCard.jsx";
import { usePages } from "../../../lib/PagesContext";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget.jsx";

/**
 * Full-page publish flow for entire-store (mirrors product {@link PublishStep} layout).
 * Parent runs the actual `/api/publish-store` via `runPublish` and passes the result back.
 *
 * @param {object} props
 * @param {() => void} props.onBack — Return to template preview
 * @param {() => Promise<{ success: boolean; data?: object; error?: string }>} props.runPublish
 * @param {boolean} [props.pushDisabled] — Disable Push (e.g. no theme selected)
 * @param {string} [props.pushDisabledHint] — Shown when push is disabled
 * @param {boolean} [props.autoStart] — Start publish automatically on mount (e.g. after editor Publish)
 */

const ENTIRE_STORE_PUBLISH_STEPS = [
  "Preparing Data",
  "Configuring Theme File",
  "Uploading Sections",
  "Uploading Templates",
  "Generating Editor URL",
  "Finalizing",
];

function getPreviewUrlFromResult(result) {
  if (!result || typeof result !== "object") return "";
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
}

export default function StorePublishStep({
  onBack,
  runPublish,
  pushDisabled = false,
  pushDisabledHint = "",
  autoStart = false,
  onComplete,
}) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishResult, setPublishResult] = useState(null);
  const [currentPublishStep, setCurrentPublishStep] = useState(0);
  const [isPublishComplete, setIsPublishComplete] = useState(false);
  const hasInitiatedPublishRef = useRef(false);
  const autoStartTriggeredRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshPages } = usePages();

  const previewUrl = getPreviewUrlFromResult(publishResult);

  const handlePublish = useCallback(async () => {
    if (hasInitiatedPublishRef.current || pushDisabled) {
      return;
    }

    hasInitiatedPublishRef.current = true;
    setPublishError("");
    setPublishResult(null);
    setIsPublishing(true);
    setCurrentPublishStep(0);
    setIsPublishComplete(false);

    const totalSteps = ENTIRE_STORE_PUBLISH_STEPS.length;
    let step = 0;
    const stepInterval = setInterval(() => {
      step += 1;
      setCurrentPublishStep(step);
      if (step >= totalSteps - 1) {
        clearInterval(stepInterval);
      }
    }, 1500);

    try {
      const outcome = await runPublish();
      clearInterval(stepInterval);
      if (!outcome?.success) {
        if (outcome?.code === "purchase_required") {
          setCurrentPublishStep(0);
          setIsPublishComplete(false);
          hasInitiatedPublishRef.current = false;
          setIsPublishing(false);
          return;
        }
        throw new Error(outcome?.error || "Publish failed");
      }
      setCurrentPublishStep(totalSteps);
      setIsPublishComplete(true);
      setPublishResult(outcome.data ?? {});
    } catch (err) {
      clearInterval(stepInterval);
      setPublishError(err?.message || "Publish failed");
      setCurrentPublishStep(0);
      setIsPublishComplete(false);
      hasInitiatedPublishRef.current = false;
    } finally {
      setIsPublishing(false);
    }
  }, [runPublish, pushDisabled]);

  useEffect(() => {
    if (!autoStart || pushDisabled) return;
    if (autoStartTriggeredRef.current) return;
    autoStartTriggeredRef.current = true;
    void handlePublish();
  }, [autoStart, pushDisabled, handlePublish]);

  const statusForIndex = (index) => {
    const isCompleted =
      index < currentPublishStep ||
      (index === ENTIRE_STORE_PUBLISH_STEPS.length - 1 && isPublishComplete);
    const isActive =
      index === currentPublishStep &&
      !(index === ENTIRE_STORE_PUBLISH_STEPS.length - 1 && isPublishComplete);
    if (isCompleted) return "done";
    if (isActive) return "active";
    return "todo";
  };

  const heading =
    publishResult
      ? "Pushed to Shopify Successfully!"
      : isPublishing || (autoStart && !publishError && !publishResult)
        ? "Publishing to Shopify…"
        : "Publish to Shopify";

  return (
    <s-page heading={heading} inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-y-auto overflow-x-hidden">
        <GenerateContainer
          style={{ maxWidth: "1150px" }}
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
                  disabled={pushDisabled || isPublishing}
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
                      console.error("Error completing store publish flow:", error);
                      setIsLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Loading..." : "Open Dashboard"}
                </Button>
              </InlineStack>
            )
          }
        >
          <BlockStack gap="400">
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
                    ? "Your store experience has been pushed to Shopify. You can review it in your Online Store theme."
                    : isPublishing
                      ? "We’re pushing your generated store to Shopify. This may take a moment."
                      : "Click Push to publish your home page, sections, and theme settings to the selected theme."}
                </Text>
              </Box>
              {pushDisabled && pushDisabledHint ? (
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface-warning" padding="300">
                    <Text as="p" variant="bodySm">
                      {pushDisabledHint}
                    </Text>
                  </Box>
                </Card>
              ) : null}
            </BlockStack>

            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h3" variant="bodySm" fontWeight="semibold">
                  Pushing to Shopify Progress
                </Text>
                <Box className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 items-stretch">
                  <BlockStack gap="200">
                    {ENTIRE_STORE_PUBLISH_STEPS.map((label, index) => {
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

                  <Box className="hidden lg:block h-full">
                    <Box
                      className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden ${
                        publishResult
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

            {publishResult && (
              <BlockStack gap="300">
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface-success" padding="300">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Pushed to Shopify Successfully!
                      </Text>
                      <Text as="p" variant="bodyXs" tone="subdued">
                        Your store templates and home content are now on the selected theme.
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
                {previewUrl ? (
                  <Button variant="primary" url={previewUrl} external fullWidth>
                    Open theme editor
                  </Button>
                ) : null}
              </BlockStack>
            )}

            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h2" variant="headingSm" fontWeight="semibold">
                  What happens after Push
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Home page sections and generated content are written to your theme
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • Styles (colors and fonts) are applied via theme settings where supported
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • You can refine the result anytime in the Shopify theme editor
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
                        Push to Shopify failed
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
    </s-page>
  );
}
