import { useCallback, useState } from "react";
import { BlockStack, Box, Button, Card, InlineStack, Text } from "@shopify/polaris";
import { StepIcon } from "../../components/SvgIcons.jsx";
import BrandAdsCampaignsTable from "./BrandAdsCampaignsTable.jsx";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";

const BRAND_ADS_HEADING_ACCENT = "#2f6f63";

const BRAND_AD_STEPS = [
  {
    title: "Generate Brand DNA",
    description: "Build your brand profile from selected products.",
    iconKey: "dna",
  },
  {
    title: "Get campaign ideas",
    description: "Receive campaign concepts aligned to your brand tone.",
    iconKey: "megaphone",
  },
  {
    title: "Generate creatives",
    description: "Create ad-ready visuals for your selected campaign.",
    iconKey: "star",
  },
];

export default function BrandAdsEntryScreen({ onStart, onEditCampaign }) {
  const [verticalCenterContent, setVerticalCenterContent] = useState(false);

  const handleCampaignsListResolved = useCallback(({ count, error }) => {
    setVerticalCenterContent(!error && count === 0);
  }, []);

  return (
    <s-page heading="Brand ads" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
        <div
          style={{
            minHeight: "max(320px, calc(100dvh - 7rem))",
            display: "flex",
            flexDirection: "column",
            justifyContent: verticalCenterContent ? "center" : "flex-start",
            maxWidth: "1150px",
            margin: "0 auto",
            width: "100%",
            paddingInline: "clamp(12px, 4vw, 16px)",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <BlockStack gap="600">
            <div
              style={{
                width: "100%",
                maxWidth: "900px",
                margin: "0 auto",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              <BlockStack gap="600">
                <Box paddingBlockStart="600">
                  <BlockStack gap="200">
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      wrap
                      gap="400"
                    >
                      <Box minWidth="0" style={{ flex: "1 1 200px" }}>
                        <h4
                          style={{
                            fontFamily:
                              'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                            fontSize: "clamp(1.35rem, 4vw, 1.75rem)",
                            fontWeight: 400,
                            margin: 0,
                            color: "#1a1a1a",
                          }}
                        >
                          Run Ads That{" "}
                          <span
                            style={{
                              color: BRAND_ADS_HEADING_ACCENT,
                              fontStyle: "italic",
                              display: "inline-flex",
                              flexDirection: "column",
                              alignItems: "stretch",
                            }}
                          >
                            Actually Convert
                            <span
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
                      </Box>
                      <Button variant="primary" onClick={onStart}>
                        Create Brand Ads
                      </Button>
                    </InlineStack>
                    <Text as="p" variant="bodyLg" tone="subdued">
                      Couple of clicks to generate on-brand social media campaigns.
                    </Text>
                  </BlockStack>
                </Box>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {BRAND_AD_STEPS.map((step, index) => (
                    <Card key={step.title} roundedAbove="sm" padding="0">
                      <Box background="bg-surface" padding="400">
                        <BlockStack gap="200">
                        <InlineStack gap="200" blockAlign="center" wrap>
                          <Box
                            borderRadius="full"
                            padding="0"
                            style={{
                              width: "30px",
                              height: "30px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              background: "#ffffff",
                              border: "1px solid #d1d5db",
                              borderRadius: "50%",
                            }}
                          >
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {index + 1}
                            </Text>
                          </Box>
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            {step.title}
                          </Text>
                        </InlineStack>
                        <Box paddingBlockStart="400" paddingBlockEnd="400">
                          <InlineStack align="center" blockAlign="center">
                            <StepIcon iconKey={step.iconKey} size={72} />
                          </InlineStack>
                        </Box>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {step.description}
                        </Text>
                        </BlockStack>
                      </Box>
                    </Card>
                  ))}
                </div>
              </BlockStack>
            </div>

            <BrandAdsCampaignsTable
              onEdit={onEditCampaign}
              onListResolved={handleCampaignsListResolved}
            />
          </BlockStack>
        </div>
      </Box>
    </s-page>
  );
}
