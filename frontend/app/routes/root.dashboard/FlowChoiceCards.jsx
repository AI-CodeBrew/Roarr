import { Box, Button, Card, Text } from "@shopify/polaris";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import { FLOW_CHOICE_OPTIONS } from "./flowChoiceOptions.js";

/**
 * Two-column grid of product vs store flow cards (same UI as onboarding build-type step).
 */
export default function FlowChoiceCards({ onChooseType }) {
  const isMobileLayout = useViewportBelowMd();
  const ctaByType = {
    product: "Create Product Page",
    store: "Revamp Entire Store",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobileLayout ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
        gap: 16,
      }}
    >
      {FLOW_CHOICE_OPTIONS.map((option) => {
        return (
          <Card key={option.id} roundedAbove="sm" padding="0">
            <Box background="bg-surface" padding="400">
              <div
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                minHeight: isMobileLayout ? undefined : 220,
                gap: 12,
                height: "100%",
                alignItems: "flex-start",
              }}
            >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                flex: 1,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  columnGap: 12,
                  rowGap: 8,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <h5
                    style={{
                      fontFamily:
                        'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      lineHeight: 1.25,
                      margin: 0,
                      color: "#111827",
                    }}
                  >
                    {option.title}
                  </h5>
                  {option.titleBadge ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "#fef9c3",
                        color: "#854d0e",
                        border: "1px solid #fde047",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        lineHeight: 1,
                        letterSpacing: "0.02em",
                        flexShrink: 0,
                      }}
                    >
                      {option.titleBadge}
                    </span>
                  ) : null}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifySelf: "end",
                    background: "#eef8f5",
                    color: "#2f6f63",
                    border: "1px solid #cfe8df",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {option.pillLabel}
                </span>
              </div>
              <Text as="p" variant="bodyMd" tone="subdued">
                {option.description}
              </Text>
              <img
                src={option.image}
                alt={option.title}
                style={{
                  width: "60%",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {option.featurePills.map((pill) => (
                  <span
                    key={pill}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f7f7f5",
                      color: "#4b5563",
                      border: "1px solid #e5e7eb",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "12px",
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ color: "#2f6f63", fontSize: "14px", lineHeight: 0.8 }}>•</span>
                    {pill}
                  </span>
                ))}
              </div>
              <div
                style={{
                  marginTop: "auto",
                  width: "100%",
                  display: "flex",
                  flexDirection: isMobileLayout ? "column" : "row",
                  alignItems: isMobileLayout ? "stretch" : "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <Button
                  variant="primary"
                  fullWidth={isMobileLayout}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChooseType(option.id);
                  }}
                >
                  {ctaByType[option.id] || option.cta}
                </Button>
              </div>
            </div>
              </div>
            </Box>
          </Card>
        );
      })}
    </div>
  );
}
