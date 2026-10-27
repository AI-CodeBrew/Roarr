import { Box } from "@shopify/polaris";
import GenerateContainer from "../../_app.generate_pdp/utils/GenerateContainer.jsx";
import GenerationProgressView from "../../../components/GenerationProgressView.jsx";

/** Store phases + Completed — thresholds align with backend percentage (same pattern as product page). */
const generationSteps = [
  { label: "Preparing your store", threshold: 0 },
  { label: "Validating products", threshold: 4 },
  { label: "Building product context", threshold: 8 },
  { label: "Generating home page content", threshold: 12 },
  { label: "Drafting headlines and sections", threshold: 20 },
  { label: "Preparing image assets", threshold: 28 },
  { label: "Generating hero and banners", threshold: 40 },
  { label: "Rendering features and highlights", threshold: 52 },
  { label: "Finalizing home page visuals", threshold: 62 },
  { label: "Syncing collections", threshold: 74 },
  { label: "Saving generated content", threshold: 95 },
  { label: "Completed", threshold: 100 },
];

export default function StoreGenerationStep({
  isGenerating,
  generationPercentage = 0,
  generationStatus = "in_progress",
  generationError = null,
  onRetry = null,
  storeType = null,
  multiIncludePremiumPdps = true,
}) {
  const hasErrorEffective =
    generationStatus === "failed" || Boolean(generationError);
  const isMagicLoadingBase =
    typeof isGenerating === "boolean" ? isGenerating : true;
  const isMagicLoading = !hasErrorEffective && isMagicLoadingBase;
  const isMagicCompleteEffective = generationStatus === "completed";
  const magicResponseEffective = generationError
    ? { error: generationError }
    : null;

  const shouldShow =
    generationStatus === "in_progress" || generationStatus === "failed";
  if (!shouldShow) return null;

  const progressPercentage =
    generationPercentage !== undefined && generationPercentage !== null
      ? Math.min(Math.max(0, generationPercentage), 100)
      : isMagicCompleteEffective
        ? 100
        : 0;

  const statusForIndex = (index) => {
    const step = generationSteps[index];
    if (!step) return "todo";

    const stepThreshold = step.threshold;
    const nextStep = generationSteps[index + 1];
    const nextThreshold = nextStep ? nextStep.threshold : 101;

    if (isMagicCompleteEffective || progressPercentage >= 100) {
      return "done";
    }

    if (hasErrorEffective) {
      return "todo";
    }

    const isCompleted = progressPercentage >= nextThreshold;
    const isActive =
      progressPercentage >= stepThreshold &&
      progressPercentage < nextThreshold;

    if (isCompleted) return "done";
    if (isActive) return "active";
    return "todo";
  };

  return (
    <Box className="bg-[#f2f2f2] overflow-y-auto overflow-x-hidden">
      <GenerateContainer style={{ maxWidth: "1150px" }}>
        <GenerationProgressView
          steps={generationSteps}
          statusForIndex={statusForIndex}
          progress={progressPercentage}
          isComplete={isMagicCompleteEffective}
          showError={Boolean(magicResponseEffective?.error || hasErrorEffective)}
          errorMessage={
            magicResponseEffective?.error ||
            generationError ||
            "Something went wrong. Please try again."
          }
          onRetry={onRetry}
          retryDisabled={isMagicLoading}
          notice={
            storeType === "multi" ? (
              multiIncludePremiumPdps ? (
                <>
                  As we are going to generate an entire store along with 3 product pages,{" "}
                  <strong>this whole process may take 6-8 minutes.</strong>
                </>
              ) : (
                <>
                  Generating your multi-product storefront (homepage, collections, FAQs) —{" "}
                  <strong>this usually takes a few minutes.</strong>
                </>
              )
            ) : null
          }
        />
      </GenerateContainer>
    </Box>
  );
}
