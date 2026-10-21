import { Box, BlockStack, InlineStack, Text } from "@shopify/polaris";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";

const TIMELINE_STEPS = [
  { step: "1", title: "Overview", sub: "You're here!" },
  { step: "2", title: "Store scan", sub: "~3 sec" },
  { step: "3", title: "What to build", sub: "30 sec" },
  { step: "4", title: "Pick your style", sub: "1 min" },
  { step: "5", title: "Watch it build", sub: "The fun part", highlight: true },
  { step: "6", title: "Go live", sub: "Free to start" },
];

function StepCircle({ item, isComplete, isActive, isWarning, size = 28, fontSize = "13px" }) {
  let stateLabel;
  if (isComplete) stateLabel = "completed";
  else if (isActive) stateLabel = "current";
  else stateLabel = "upcoming";

  return (
    <div
      className={isActive ? "timeline-step-active" : undefined}
      role="img"
      aria-label={`Step ${item.step}: ${item.title} — ${stateLabel}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${isComplete ? "#2f6f63" : isWarning ? "#e0be60" : isActive ? "#008060" : "#6b7280"}`,
        background: isComplete ? "#2f6f63" : isWarning ? "#f8efcc" : isActive ? "#e3f1df" : "#ffffff",
        color: isComplete ? "#ffffff" : isWarning ? "#3D2D00" : isActive ? "#005c45" : "#6b7280",
        fontSize,
        fontWeight: 600,
        boxShadow: isActive ? "0 0 0 3px rgba(0, 128, 96, 0.24)" : "none",
        flex: "0 0 auto",
      }}
    >
      <span aria-hidden="true">{isComplete ? "✓" : item.step}</span>
    </div>
  );
}

export default function WhatsComingCard({ currentStep = 1, completedStep, variant = "full" }) {
  const isMobileLayout = useViewportBelowMd();
  const totalSteps = TIMELINE_STEPS.length;
  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const clampedCompletedStep = Math.min(
    Math.max(completedStep ?? Math.max(clampedStep - 1, 0), 0),
    totalSteps
  );

  const stepProps = (index) => {
    const stepNumber = index + 1;
    const isComplete = stepNumber <= clampedCompletedStep;
    const isActive = stepNumber === clampedStep && !isComplete;
    const isWarning =
      TIMELINE_STEPS[index].highlight && !isComplete && !isActive && variant !== "minimal";
    return { stepNumber, isComplete, isActive, isWarning };
  };

  const borderBoxStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: variant === "minimal" ? "8px 10px" : "12px 16px",
    background: "#ffffff",
  };

  /** Minimal: one row of circles — on mobile horizontal scroll; desktop unchanged. */
  if (variant === "minimal") {
    const circleSize = isMobileLayout ? 26 : 28;
    const circleFont = isMobileLayout ? "12px" : "13px";

    return (
      <BlockStack gap="100">
        <Box style={borderBoxStyle}>
          <Box
            className={isMobileLayout ? "whats-coming-minimal-scroll" : undefined}
            style={
              isMobileLayout
                ? {
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    gap: 10,
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    paddingBlock: "2px",
                    marginInline: -2,
                    paddingInline: 2,
                  }
                : undefined
            }
          >
            {isMobileLayout ? (
              TIMELINE_STEPS.map((item, index) => {
                const { isComplete, isActive, isWarning } = stepProps(index);
                return (
                  <Box key={item.step} style={{ flex: "0 0 auto" }}>
                    <StepCircle
                      item={item}
                      isComplete={isComplete}
                      isActive={isActive}
                      isWarning={isWarning}
                      size={circleSize}
                      fontSize={circleFont}
                    />
                  </Box>
                );
              })
            ) : (
              <InlineStack align="start" blockAlign="center" wrap={false} gap="200">
                {TIMELINE_STEPS.map((item, index) => {
                  const { isComplete, isActive, isWarning } = stepProps(index);
                  return (
                    <InlineStack key={item.step} gap="200" blockAlign="center" wrap={false}>
                      <StepCircle
                        item={item}
                        isComplete={isComplete}
                        isActive={isActive}
                        isWarning={isWarning}
                        size={circleSize}
                        fontSize={circleFont}
                      />
                    </InlineStack>
                  );
                })}
              </InlineStack>
            )}
          </Box>
        </Box>
      </BlockStack>
    );
  }

  /** Full: mobile = 2 steps per row; desktop = horizontal strip. */
  if (variant === "full" && isMobileLayout) {
    return (
      <BlockStack gap="100">
        <Box style={borderBoxStyle}>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px 10px",
            }}
          >
            {TIMELINE_STEPS.map((item, index) => {
              const { isComplete, isActive, isWarning } = stepProps(index);
              return (
                <Box key={item.step} minWidth={0}>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <StepCircle
                      item={item}
                      isComplete={isComplete}
                      isActive={isActive}
                      isWarning={isWarning}
                      size={26}
                      fontSize="12px"
                    />
                    <BlockStack gap="025">
                      <Text
                        as="p"
                        variant="bodySm"
                        fontWeight={isComplete || isActive || isWarning ? "medium" : "regular"}
                        tone={isComplete || isActive ? "success" : isWarning ? "warning" : "subdued"}
                      >
                        {item.title}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        <span style={{ fontSize: "12px", lineHeight: "1.25" }}>{item.sub}</span>
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
              );
            })}
          </Box>
        </Box>
      </BlockStack>
    );
  }

  return (
    <BlockStack gap="100">
      <Box style={borderBoxStyle}>
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          {TIMELINE_STEPS.map((item, index) => {
            const { isComplete, isActive, isWarning } = stepProps(index);
            return (
              <InlineStack key={item.step} gap="200" blockAlign="center" wrap={false}>
                <StepCircle item={item} isComplete={isComplete} isActive={isActive} isWarning={isWarning} />
                <BlockStack gap="025">
                  <Text
                    as="p"
                    variant="bodySm"
                    fontWeight={isComplete || isActive || isWarning ? "medium" : "regular"}
                    tone={isComplete || isActive ? "success" : isWarning ? "warning" : "subdued"}
                  >
                    {item.title}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    <span style={{ fontSize: "12px", lineHeight: "1.2" }}>{item.sub}</span>
                  </Text>
                </BlockStack>
              </InlineStack>
            );
          })}
        </InlineStack>
      </Box>
    </BlockStack>
  );
}
