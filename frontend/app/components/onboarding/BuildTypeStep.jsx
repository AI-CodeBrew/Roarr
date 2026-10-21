import { Box, BlockStack, Button, InlineStack, Text } from "@shopify/polaris";
import WhatsComingCard from "./WhatsComingCard";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import FlowChoiceCards from "../../routes/root.dashboard/FlowChoiceCards.jsx";

export default function BuildTypeStep({ onChooseType, onBack }) {
  const isMobileLayout = useViewportBelowMd();

  return (
    <Box>
      <BlockStack gap="500">
        <InlineStack
          align={isMobileLayout ? "start" : "space-between"}
          blockAlign="start"
          gap={isMobileLayout ? "300" : "400"}
          wrap
        >
          <div style={{ flex: "1 1 260px", minWidth: 0, width: isMobileLayout ? "100%" : undefined }}>
            <BlockStack gap="100">
              <h4
                style={{
                  fontFamily:
                    'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                  fontSize: isMobileLayout ? "1.45rem" : "1.75rem",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: 0,
                  color: "#1a1a1a",
                }}
              >
                What do you want to{" "}
                <span
                  style={{
                    color: "#2f6f63",
                    fontStyle: "italic",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <span>build today</span>
                  <span
                    aria-hidden="true"
                    style={{
                      height: 3,
                      background:
                        "linear-gradient(to right, rgba(47, 111, 99, 0.95) 0%, rgba(47, 111, 99, 0.5) 45%, rgba(47, 111, 99, 0.1) 100%)",
                      borderRadius: 999,
                      width: "100%",
                    }}
                  />
                </span>
              </h4>
              <Text as="p" variant="bodyMd" tone="subdued">
                Pick one to get started. You can always do the other one right after.
              </Text>
            </BlockStack>
          </div>
          <Box width={isMobileLayout ? "100%" : undefined}>
            <InlineStack
              gap="200"
              blockAlign="center"
              wrap={false}
              align={isMobileLayout ? "space-between" : "start"}
            >
              <Button variant="tertiary" onClick={onBack} accessibilityLabel="Go back">
                <span aria-hidden="true">← </span>Back
              </Button>
              <Box style={{ flexShrink: 0 }}>
                <WhatsComingCard currentStep={3} completedStep={2} variant="minimal" />
              </Box>
            </InlineStack>
          </Box>
        </InlineStack>

        <FlowChoiceCards onChooseType={onChooseType} />
      </BlockStack>
    </Box>
  );
}
