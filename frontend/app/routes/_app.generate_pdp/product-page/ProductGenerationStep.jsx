import { Box } from "@shopify/polaris";
import GenerateContainer from "../utils/GenerateContainer.jsx";
import GenerationProgressView from "../../../components/GenerationProgressView.jsx";

export default function ProductGenerationStep({
  isGenerating,
  generationPercentage = 0,
  generationStatus,
  generationError,
  isMagicLoading: isMagicLoadingProp = true,
  isMagicComplete = false,
  currentLoadingStep = 0,
  showAbraCadabraTick = false,
  magicResponse = null,
  hasError = false,
  onRetry = null,
}) {
  const hasErrorEffective =
    hasError || generationStatus === "failed" || Boolean(generationError);
  const isMagicLoadingBase =
    typeof isGenerating === "boolean" ? isGenerating : isMagicLoadingProp;
  const isMagicLoading = !hasErrorEffective && isMagicLoadingBase;
  const isMagicCompleteEffective =
    isMagicComplete || generationStatus === "completed";
  const magicResponseEffective =
    magicResponse || (generationError ? { error: generationError } : null);

  // Generation steps with their percentage thresholds
  const generationSteps = [
    { label: "Initiating", threshold: 0 },
    { label: "Building Product Context", threshold: 9 },
    { label: "Generating SEO optimized text content", threshold: 18 },
    { label: "Image Generation started", threshold: 28 },
    { label: "Generating Base Images", threshold: 36 },
    { label: "Maintaining Fidelity", threshold: 45 },
    { label: "Generating Product Images", threshold: 58 },
    { label: "Generating Supporting Images", threshold: 72 },
    { label: "Picking best Color Scheme", threshold: 85 },
    { label: "Adjusting overall layout", threshold: 94 },
    { label: "Completed", threshold: 100 },
  ];

  // Map percentage to generation step name
  const getGenerationStepName = (percentage) => {
    // Find the highest threshold that the percentage has reached
    for (let i = generationSteps.length - 1; i >= 0; i--) {
      if (percentage >= generationSteps[i].threshold) {
        return generationSteps[i].label;
      }
    }
    return "Start";
  };

  // Use generationPercentage from backend if available, otherwise calculate from step
  const progressPercentage = generationPercentage !== undefined && generationPercentage !== null
    ? Math.min(Math.max(0, generationPercentage), 100)
    : (isMagicCompleteEffective ? 100 : 0);

  // Get current generation step name based on percentage
  const currentGenerationStep = getGenerationStepName(progressPercentage);

  // Determine status for each step based on percentage
  const statusForIndex = (index) => {
    const step = generationSteps[index];
    if (!step) return "todo";

    const stepThreshold = step.threshold;
    const nextStep = generationSteps[index + 1];
    const nextThreshold = nextStep ? nextStep.threshold : 101; // Use 101 so 100% still shows as active for last step

    // If generation is complete, all steps are done
    if (isMagicCompleteEffective || progressPercentage >= 100) {
      return "done";
    }

    if (hasErrorEffective) {
      return "todo";
    }

    // Step is completed if we've reached the next step's threshold
    const isCompleted = progressPercentage >= nextThreshold;

    // Step is active if current percentage is at or above this step's threshold
    // but hasn't reached the next step's threshold yet
    const isActive = progressPercentage >= stepThreshold && progressPercentage < nextThreshold;

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
        />
      </GenerateContainer>
    </Box>
  );
}
