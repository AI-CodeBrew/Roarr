import { Box, InlineStack, BlockStack, Text, Button } from "@shopify/polaris";
import WhatsComingCard from "./WhatsComingCard";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";

export default function IntroStep({ onStart }) {
  const isMobileLayout = useViewportBelowMd();

  return (
    <Box>
      <BlockStack gap="600">
        <InlineStack gap="200" blockAlign="center">
          <img
            src="https://cdn.shopify.com/s/files/1/0704/0119/6122/files/New_Project.png?v=1769678513"
            alt="Kluck AI"
            style={{ width: 30, height: 30, borderRadius: 4, objectFit: "cover" }}
          />
          <Text as="p" variant="headingMd" fontWeight="medium">
            Welcome to Kluck AI
          </Text>
        </InlineStack>

        <BlockStack gap="300">
          <h1
            className="onboarding-hero-title"
            style={{
              fontFamily: 'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
              fontWeight: 400,
              lineHeight: 1.3,
              margin: 0,
              color: "#1a1a1a",
            }}
          >
            You are minutes away from a store
            <br className="onboarding-hero-linebreak" />
            that{" "}
            <span
              style={{
                color: "#2f6f63",
                fontStyle: "italic",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              <span>actually converts.</span>
              <span
                aria-hidden="true"
                style={{
                  height: 3,
                  background: "linear-gradient(to right, rgba(47, 111, 99, 0.95) 0%, rgba(47, 111, 99, 0.5) 45%, rgba(47, 111, 99, 0.1) 100%)",
                  borderRadius: 999,
                  width: "100%",
                }}
              />
            </span>
          </h1>
          <Text as="p" variant="bodyMd" tone="subdued">
            In about 4 minutes, you'll have a store that works harder for you.
          </Text>
        </BlockStack>

        <Text as="p" variant="bodyMd">
          <span style={{ fontWeight: 700, fontStyle: "italic", background: "#fff3a0", padding: "2px 6px", borderRadius: 4 }}>
            Install and try without any hesitant, this will not affect your existing theme and store.
          </span>
        </Text>

        <BlockStack gap="100">
          <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
            WHAT'S COMING
          </Text>
          <WhatsComingCard currentStep={1} completedStep={1} />
        </BlockStack>

        <BlockStack gap="200" inlineAlign={isMobileLayout ? "stretch" : "start"}>
          <Button variant="primary" fullWidth={isMobileLayout} onClick={onStart}>
            Let's get started →
          </Button>
          <Text as="p" variant="bodyMd" tone="subdued">
            No charges on your Shopify bill for first page - <span style={{ color: "#111827", fontWeight: 600 }}>its on us!.</span>
          </Text>
        </BlockStack>
      </BlockStack>
    </Box>
  );
}
