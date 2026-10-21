import {
  Box,
  InlineStack,
  BlockStack,
  Text,
  Button
} from '@shopify/polaris';

export default function StepIndicator({ currentStep, onStepClick, canNavigateToStep, heading }) {
  const steps = [
    { number: 1, label: "Choose Product" },
    { number: 2, label: "Product Details" },
    { number: 3, label: "Template Preview" },
    { number: 4, label: "Magic" },
    { number: 5, label: "Generated" },
    { number: 6, label: "Publish" },
  ];

  const getStepTone = (stepNumber) => {
    if (stepNumber < currentStep) {
      return "success"; // Completed steps
    } else if (stepNumber === currentStep) {
      return "info"; // Active step
    } else {
      return "subdued"; // Inactive steps
    }
  };

  const handleStepClick = (stepNumber) => {
    if (canNavigateToStep && canNavigateToStep(stepNumber)) {
      onStepClick(stepNumber);
    }
  };

  const getDotStyles = (stepNumber) => {
    const isDone = stepNumber < currentStep;
    const isActive = stepNumber === currentStep;
    const isFuture = stepNumber > currentStep;
    const isClickable = canNavigateToStep && canNavigateToStep(stepNumber);

    const base =
      "h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold transition select-none";

    const state = isDone
      ? "bg-emerald-600 border-emerald-600 text-white"
      : isActive
        ? "bg-gray-900 border-gray-900 text-white"
        : "bg-white/80 border-gray-300 text-gray-600";

    const interactivity = isClickable
      ? "cursor-pointer hover:border-gray-400"
      : isFuture
        ? "cursor-not-allowed opacity-60"
        : "cursor-default";

    return `${base} ${state} ${interactivity}`;
  };

  return (
    <Box
      background="subdued"
      className="sticky bg-[#f2f2f2] top-0 z-[100] border-b border-gray-200"
    >
      <div style={{ padding: "16px", maxWidth: "1150px", margin: "0 auto" }}>
        <InlineStack align="space-between" blockAlign="center" gap="300">
          {/* Heading Section - Left Side */}
          {heading && (
            <InlineStack gap="300" align="center" blockAlign="center" className="flex-1 min-w-0">
              <Box
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: heading.color || "#111827",
                }}
              >
                <Text variant="bodySm" as="span" fontWeight="semibold" tone="text-inverse">
                  {heading.stepNumber}
                </Text>
              </Box>
              <BlockStack gap="0" className="flex-1 min-w-0">
                <Text variant="headingSm" as="h3">
                  {heading.title}
                </Text>
                {heading.description && (
                  <div className="hidden md:block">
                    <Text variant="bodySm" as="p" tone="subdued">
                      {heading.description}
                    </Text>
                  </div>
                )}
              </BlockStack>
            </InlineStack>
          )}

          {/* Step Indicators - Right Side */}
          <div className="flex items-center gap-1.5 overflow-x-auto pl-1">
            {steps.map((step, index) => {
              const isClickable = canNavigateToStep && canNavigateToStep(step.number);
              const isDone = step.number < currentStep;

              return (
                <div key={step.number} className="flex items-center gap-1.5">
                  {isClickable ? (
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.number)}
                      className={getDotStyles(step.number)}
                      title={step.label}
                      aria-label={step.label}
                    >
                      {step.number}
                    </button>
                  ) : (
                    <div
                      className={getDotStyles(step.number)}
                      title={step.label}
                      aria-label={step.label}
                    >
                      {step.number}
                    </div>
                  )}

                  {index < steps.length - 1 && (
                    <div
                      className={isDone ? "h-px w-5 bg-emerald-300" : "h-px w-5 bg-gray-300"}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </InlineStack>
      </div>
    </Box>
  );
}

