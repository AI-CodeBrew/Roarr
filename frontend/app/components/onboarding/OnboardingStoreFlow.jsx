import { useState } from "react";
import { BlockStack, Box, Button, InlineStack, Text } from "@shopify/polaris";
import WhatsComingCard from "./WhatsComingCard";
import StoreFlowStructure from "../../routes/_app.generate_store/store/StoreFlowStructure";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import { CreditWalletWidget } from "../CreditWalletWidget.jsx";

export default function OnboardingStoreFlow({
  onBack,
  onComplete,
  initialMarketPreferences = null,
}) {
  /** Matches {@link WhatsComingCard} steps 4–6 (pick style → build → go live). */
  const [whatsComing, setWhatsComing] = useState({ current: 4, completed: 3 });
  const isMobileLayout = useViewportBelowMd();

  return (
    <s-page heading="Entire Store Experience" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box width="100%">
        <Box paddingBlockStart={isMobileLayout ? "300" : "500"}>
          <div style={{ maxWidth: "1150px", margin: "0 auto", paddingInline: isMobileLayout ? "12px" : undefined }}>
            <BlockStack gap="200">
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
                        fontFamily: 'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                        fontSize: isMobileLayout ? "1.45rem" : "1.75rem",
                        fontWeight: 400,
                        margin: 0,
                        color: "#1a1a1a",
                      }}
                    >
                      Revamp your{" "}
                      <span
                        style={{
                          color: "#2f6f63",
                          fontStyle: "italic",
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                        }}
                      >
                        <span>entire store</span>
                        <span
                          aria-hidden="true"
                          style={{
                            marginTop: 4,
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
                      Your entire store redesigned and branded by AI. Every single page.
                    </Text>
                  </BlockStack>
                </div>
                <Box width={isMobileLayout ? "100%" : undefined}>
                  <InlineStack
                    gap="200"
                    blockAlign="center"
                    wrap={false}
                    align={
                      isMobileLayout
                        ? whatsComing.current <= 4
                          ? "space-between"
                          : "end"
                        : undefined
                    }
                  >
                    {whatsComing.current <= 4 ? (
                      <Button variant="tertiary" onClick={onBack} accessibilityLabel="Go back">
                        <span aria-hidden="true">← </span>Back
                      </Button>
                    ) : null}
                    <Box style={{ flexShrink: 0 }}>
                      <WhatsComingCard
                        currentStep={whatsComing.current}
                        completedStep={whatsComing.completed}
                        variant="minimal"
                      />
                    </Box>
                  </InlineStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </div>
        </Box>
      <div style={{ width: "100%", margin: "0px", padding: "0 16px" }}>

        <StoreFlowStructure
          // hideConfigurationHeading
          embedded
          setFlowType={onBack}
          onFlowStepChange={setWhatsComing}
          isOnboarding={true}
          onOnboardingComplete={onComplete}
          initialMarketPreferences={initialMarketPreferences}
        />
      </div>
      </Box>
    </s-page>
  );
}
