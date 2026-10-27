import { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@shopify/polaris";
import { Rocket } from "lucide-react";
import GenerateContainer from "../../_app.generate_pdp/utils/GenerateContainer.jsx";
import PublishProgressView from "../../../components/PublishProgressView.jsx";
import { PrimaryButton, SecondaryButton } from "../../../components/RoarrUI.jsx";
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
                  disabled={pushDisabled || isPublishing}
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
                      console.error("Error completing store publish flow:", error);
                      setIsLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Loading..." : "Open Dashboard"}
                </PrimaryButton>
              </div>
            )
          }
        >
          <PublishProgressView
            title={publishResult ? "Pushed to Shopify" : "Publish to Shopify"}
            description={
              publishResult
                ? "Your store experience has been pushed to Shopify. You can review it in your Online Store theme."
                : isPublishing
                  ? "We’re pushing your generated store to Shopify. This may take a moment."
                  : "Click Push to publish your home page, sections, and theme settings to the selected theme."
            }
            hint={pushDisabled && pushDisabledHint ? pushDisabledHint : null}
            steps={ENTIRE_STORE_PUBLISH_STEPS}
            statusForIndex={statusForIndex}
            isPublishing={isPublishing}
            isDone={Boolean(publishResult)}
            successMessage="Your store templates and home content are now on the selected theme."
            successLink={previewUrl ? { url: previewUrl, label: "Open theme editor" } : null}
            infoTitle="What happens after Push"
            infoItems={[
              "Home page sections and generated content are written to your theme",
              "Styles (colors and fonts) are applied via theme settings where supported",
              "You can refine the result anytime in the Shopify theme editor",
            ]}
            error={publishError}
            errorTitle="Push to Shopify failed"
            onDismissError={() => setPublishError("")}
          />
        </GenerateContainer>
      </Box>
    </s-page>
  );
}
