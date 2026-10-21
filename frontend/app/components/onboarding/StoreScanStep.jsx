import { useEffect, useMemo, useState } from "react";
import { Box, BlockStack, Button, InlineStack, Text } from "@shopify/polaris";
import WhatsComingCard from "./WhatsComingCard";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";

export default function StoreScanStep({ onBack, onNext }) {
  const isMobileLayout = useViewportBelowMd();
  const SCAN_DURATION_MS = 5000;
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);

  const rotatingInsights = useMemo(
    () => [
      "Analyzing your visual merchandising patterns...",
      "Scanning copy style and conversion language...",
      "Mapping structure opportunities across your catalog...",
      "Building a personalization blueprint for your store...",
    ],
    []
  );

  useEffect(() => {
    setProgress(0);
    setIsComplete(false);
    setInsightIndex(0);

    const start = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / SCAN_DURATION_MS) * 100));
      setProgress(pct);
      if (pct >= 100) {
        setIsComplete(true);
        clearInterval(progressTimer);
      }
    }, 80);

    const insightTimer = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % rotatingInsights.length);
    }, 1200);

    return () => {
      clearInterval(progressTimer);
      clearInterval(insightTimer);
    };
  }, [rotatingInsights]);

  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => {
      onNext();
    }, 450);
    return () => clearTimeout(timer);
  }, [isComplete, onNext]);

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
                  fontFamily: 'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                  fontSize: isMobileLayout ? "1.45rem" : "1.75rem",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: 0,
                  color: "#1a1a1a",
                }}
              >
                Let me do a full{" "}
                <span
                  style={{
                    color: "#2f6f63",
                    fontStyle: "italic",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <span>Store scan</span>
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
                Running a deep scan to personalize your AI output for your brand and catalog.
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
                <WhatsComingCard currentStep={2} completedStep={1} variant="minimal" />
              </Box>
            </InlineStack>
          </Box>
        </InlineStack>

        <Box
          style={{
            border: "1px solid #dfe3e8",
            borderRadius: 14,
            background: "#ffffff",
            padding: "18px 18px 16px",
          }}
        >
          <BlockStack gap="250">
            <InlineStack gap="200" blockAlign="center">
              <div className="store-scan-orb" aria-hidden="true" />
              <Text as="p" variant="bodyMd" fontWeight="medium">
                <span role="status" aria-live="polite" aria-atomic="true">
                  {isComplete ? "Scan complete. AI personalization is ready." : "Scanning your store..."}
                </span>
              </Text>
            </InlineStack>

            <Box>
              <div
                className="store-scan-progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Store scan progress"
              >
                <div className="store-scan-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </Box>

            <Text as="p" variant="bodySm" tone="subdued">
              <span aria-live="polite" aria-atomic="true">
                {isComplete ? "AI will now generate a more personalized experience based on scan insights." : rotatingInsights[insightIndex]}
              </span>
            </Text>
          </BlockStack>
        </Box>

      </BlockStack>
    </Box>
  );
}
