import { BlockStack, Box, Button, Card, InlineStack, Text } from "@shopify/polaris";
import { StepIcon } from "./SvgIcons.jsx";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd.js";

const PRODUCT_STEPS = [
  {
    title: "Choose your product",
    description: "Pick a catalog item and the page style that fits your brand.",
    iconKey: "select",
  },
  {
    title: "Generate copy & layout",
    description: "AI drafts headings, sections, and visuals tuned for conversion.",
    iconKey: "magic",
  },
  {
    title: "Preview & publish",
    description: "Review in the editor, then push a polished page live.",
    iconKey: "publish",
  },
];

const STORE_STEPS = [
  {
    title: "Plan your pages",
    description: "Choose which store pages to build and set the look and feel.",
    iconKey: "select",
  },
  {
    title: "AI builds the experience",
    description: "Cohesive layouts and copy across home, product, and more.",
    iconKey: "magic",
  },
  {
    title: "Review & go live",
    description: "Fine-tune previews, then publish your full store experience.",
    iconKey: "publish",
  },
];

/**
 * Brand-ads-style hero for product page / entire store hubs (above {@link PagesTable}).
 * @param {{ variant: "product" | "store"; onStart: () => void }} props
 */
export default function PagesHubWelcome({ variant, onStart }) {
  const isMobileLayout = useViewportBelowMd();
  const steps = variant === "store" ? STORE_STEPS : PRODUCT_STEPS;
  const primaryLabel =
    variant === "store" ? "Revamp Entire Store" : "Create Product Page";
  const accentGreen = "#2f6f63";
  const subline =
    variant === "store"
      ? "A few steps to a cohesive, AI-built store across the pages that matter."
      : "A few steps to a high-converting product page with AI copy, layout, and images.";

  const titleHeading =
    variant === "product" ? (
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
        Build Product Pages{" "}
        <span
          style={{
            color: accentGreen,
            fontStyle: "italic",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          That Sell
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
    ) : (
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
        Give Your Store a{" "}
        <span
          style={{
            color: accentGreen,
            fontStyle: "italic",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          Complete Makeover
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
    );

  return (
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
          {isMobileLayout ? (
            <BlockStack gap="300">
              <Box minWidth="0">{titleHeading}</Box>
              <Text as="p" variant="bodyLg" tone="subdued">
                {subline}
              </Text>
              <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                <Button variant="primary" fullWidth onClick={onStart}>
                  {primaryLabel}
                </Button>
              </div>
            </BlockStack>
          ) : (
            <BlockStack gap="200">
              <InlineStack
                align="space-between"
                blockAlign="center"
                gap="400"
                wrap
              >
                <Box minWidth="0" style={{ flex: "1 1 200px" }}>
                  {titleHeading}
                </Box>
                <Button variant="primary" onClick={onStart}>
                  {primaryLabel}
                </Button>
              </InlineStack>
              <Text as="p" variant="bodyLg" tone="subdued">
                {subline}
              </Text>
            </BlockStack>
          )}
        </Box>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {steps.map((step, index) => (
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
  );
}
