import {
  Box,
  InlineStack,
  BlockStack,
  Text,
  Button,
  Modal,
} from "@shopify/polaris";

export default function PricingModal({ open, onClose, onConfirm }) {
  const pricingPlans = [
    {
      id: "free",
      name: "Free",
      features: [
        "1 Free Product Slot",
        "AI Images Generation",
        "AI Text Generation",
        "AI Color Scheme Curation",
        "SEO optimization",
        "Email Support",
      ],
      pages: "1 page",
      monthlyPriceNumber: "$0",
      monthlyPriceSuffix: "/month",
      yearlyPriceNumber: "$0",
      yearlyPriceSuffix: "/month",
      monthlyButtonText: "FREE",
      yearlyButtonText: "FREE",
      isFree: true,
      monthlyButtonVariant: "secondary",
      monthlyButtonTone: "subdued",
      monthlyButtonStyle: { backgroundColor: "#e5e7eb", color: "#6b7280" },
      yearlyButtonVariant: "secondary",
      yearlyButtonTone: "subdued",
      yearlyButtonStyle: { backgroundColor: "#e5e7eb", color: "#6b7280" },
    },
    {
      id: "starter",
      name: "Starter",
      features: [
        "Everything in Free Plan",
        "Full Store Experience",
        "Branded Home Page",
        "Multiple Product Pages",
        "Increased AOV with bundle offers",
        "Priority Support",
      ],
      pages: "3 pages",
      monthlyPriceNumber: "$25",
      monthlyPriceSuffix: "/month",
      yearlyPriceNumber: "$20",
      yearlyPriceSuffix: "/month",
      monthlyButtonText: "Select",
      yearlyButtonText: "Select",
      isFree: false,
      monthlyButtonVariant: "secondary",
      yearlyButtonVariant: "primary",
      yearlyButtonStyle: { backgroundColor: "#000000", color: "#ffffff" },
    },
    {
      id: "value",
      name: "Value",
      features: [
        "Everything in Starter",
        "More page slots",
      ],
      pages: "5 pages",
      monthlyPriceNumber: "$35",
      monthlyPriceSuffix: "/month",
      yearlyPriceNumber: "$28",
      yearlyPriceSuffix: "/month",
      monthlyButtonText: "Select",
      yearlyButtonText: "Select",
      isFree: false,
      monthlyButtonVariant: "secondary",
      yearlyButtonVariant: "primary",
      yearlyButtonStyle: { backgroundColor: "#000000", color: "#ffffff" },
    },
    {
      id: "scale",
      name: "Scale",
      features: [
        "Everything in Starter",
        "Maximum page slots",
      ],
      pages: "10 pages",
      monthlyPriceNumber: "$49",
      monthlyPriceSuffix: "/month",
      yearlyPriceNumber: "$39",
      yearlyPriceSuffix: "/month",
      monthlyButtonText: "Select",
      yearlyButtonText: "Select",
      isFree: false,
      monthlyButtonVariant: "secondary",
      yearlyButtonVariant: "primary",
      yearlyButtonStyle: { backgroundColor: "#000000", color: "#ffffff" },
    },
  ];

  return (
    <>
      <style>{`
        /* Table row hover effect */
        .pricing-table-row {
          transition: background-color 0.2s ease;
        }
        .pricing-table-row:hover {
          background-color: #f5f5f5 !important;
        }
        /* Remove extra padding from modal section */
        div[class*="Modal-Section"] {
          padding-bottom: 0 !important;
        }
        /* Make pricing modal wider but centered */
        div[class*="Modal-Dialog"] {
          max-width: 80vw !important;
          width: 80vw !important;
          margin: 0 auto !important;
        }
        @media (min-width: 1200px) {
          div[class*="Modal-Dialog"] {
            width: 1200px !important;
          }
        }
      `}</style>
      <Modal
        open={open}
        onClose={onClose}
        title=""
        large
      >
        <Modal.Section>
          <Box style={{ position: "relative", width: "100%" }}>

            {/* Header */}
            <BlockStack gap="400">
              <Text as="h1" variant="headingLg" fontWeight="bold">
                You are on the free plan!
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Looking for a high conversion Product Page that can boost you sales to x2? Try Roarr now!
              </Text>
            </BlockStack>

            {/* Pricing Table */}
            <Box style={{ marginTop: "12px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "14px", borderRadius: "8px", overflow: "hidden" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e1e3e5" }}>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", borderTop: "1px solid #e1e3e5", borderLeft: "1px solid #e1e3e5", borderBottom: "2px solid #e1e3e5", borderTopLeftRadius: "8px" }}>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Plan</Text>
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", borderTop: "1px solid #e1e3e5", borderBottom: "2px solid #e1e3e5" }}>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Features</Text>
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", borderTop: "1px solid #e1e3e5", borderBottom: "2px solid #e1e3e5" }}>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Number of Pages</Text>
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", borderTop: "1px solid #e1e3e5", borderBottom: "2px solid #e1e3e5" }}>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Monthly Fee (USD)</Text>
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", position: "relative", borderTop: "1px solid #e1e3e5", borderRight: "1px solid #e1e3e5", borderBottom: "2px solid #e1e3e5", borderTopRightRadius: "8px" }}>
                      <Box
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: "#10b981",
                          color: "#ffffff",
                          border: "1px solid #ffffff",
                          borderRadius: "4px",
                          padding: "1px 8px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        20% off!
                      </Box>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Every Year (USD)</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pricingPlans.map((plan, index) => {
                    const isLast = index === pricingPlans.length - 1;
                    const isFirst = index === 0;
                    
                    return (
                      <tr key={plan.id} className="pricing-table-row">
                        <td style={{ 
                          padding: "16px", 
                          borderLeft: "1px solid #e1e3e5", 
                          borderBottom: "1px solid #e1e3e5", 
                          textAlign: "center",
                          ...(isLast && { borderBottomLeftRadius: "8px" })
                        }}>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">{plan.name}</Text>
                        </td>
                        <td style={{ padding: "16px", borderBottom: "1px solid #e1e3e5", textAlign: "center" }}>
                          <BlockStack gap="050" align="center">
                            {plan.features.map((feature, featureIndex) => (
                              <Text key={featureIndex} as="span" variant="bodySm">{feature}</Text>
                            ))}
                          </BlockStack>
                        </td>
                        <td style={{ padding: "16px", borderBottom: "1px solid #e1e3e5", textAlign: "center" }}>
                          <Text as="span" variant="bodyMd">{plan.pages}</Text>
                        </td>
                        {plan.isFree ? (
                          <>
                            <td 
                              colSpan={2}
                              style={{ 
                                padding: "16px", 
                                borderRight: "1px solid #e1e3e5", 
                                borderBottom: "1px solid #e1e3e5", 
                                textAlign: "center",
                                ...(isLast && { borderBottomRightRadius: "8px" })
                              }}
                            >
                              <BlockStack gap="100" align="center">
                                <InlineStack gap="050" align="center" blockAlign="baseline">
                                  <span style={{ fontSize: "25px", fontWeight: "bold", lineHeight: "1.2", display: "inline-block", verticalAlign: "baseline", color: "#0066cc" }}>{plan.monthlyPriceNumber}</span>
                                  <Text as="span" variant="bodyMd" style={{ verticalAlign: "baseline" }}>{plan.monthlyPriceSuffix}</Text>
                                </InlineStack>
                                <Box
                                  style={{
                                    backgroundColor: "#e5e7eb",
                                    color: "#9ca3af",
                                    width: "100%",
                                    fontSize: "12px",
                                    padding: "3px 16px",
                                    borderRadius: "6px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    cursor: "default",
                                  }}
                                >
                                  {plan.monthlyButtonText}
                                </Box>
                              </BlockStack>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: "16px", borderBottom: "1px solid #e1e3e5", textAlign: "center" }}>
                              <BlockStack gap="100" align="center">
                                <InlineStack gap="050" align="center" blockAlign="baseline">
                                  <span style={{ fontSize: "25px", fontWeight: "bold", lineHeight: "1.2", display: "inline-block", verticalAlign: "baseline", color: "#0066cc" }}>{plan.monthlyPriceNumber}</span>
                                  <Text as="span" variant="bodyMd" style={{ verticalAlign: "baseline" }}>{plan.monthlyPriceSuffix}</Text>
                                </InlineStack>
                                <Button 
                                  size="micro" 
                                  variant={plan.monthlyButtonVariant || "secondary"}
                                  tone={plan.monthlyButtonTone}
                                  style={{ 
                                    ...(plan.monthlyButtonStyle || {}),
                                    width: "100%", 
                                    fontSize: "11px", 
                                    padding: "4px 8px" 
                                  }}
                                >
                                  {plan.monthlyButtonText}
                                </Button>
                              </BlockStack>
                            </td>
                            <td style={{ 
                              padding: "16px", 
                              borderRight: "1px solid #e1e3e5", 
                              borderBottom: "1px solid #e1e3e5", 
                              textAlign: "center",
                              ...(isLast && { borderBottomRightRadius: "8px" })
                            }}>
                              <BlockStack gap="100" align="center">
                              <InlineStack gap="050" align="center" blockAlign="baseline">
                                <span style={{ fontSize: "25px", fontWeight: "bold", lineHeight: "1.2", display: "inline-block", verticalAlign: "baseline", color: "#0066cc" }}>{plan.yearlyPriceNumber}</span>
                                <Text as="span" variant="bodyMd" style={{ verticalAlign: "baseline" }}>{plan.yearlyPriceSuffix}</Text>
                              </InlineStack>
                                <Button 
                                  size="micro" 
                                  variant={plan.yearlyButtonVariant || "secondary"}
                                  tone={plan.yearlyButtonTone}
                                  style={{ 
                                    ...(plan.yearlyButtonStyle || {}),
                                    width: "100%", 
                                    fontSize: "11px", 
                                    padding: "4px 8px" 
                                  }}
                                >
                                  {plan.yearlyButtonText}
                                </Button>
                              </BlockStack>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Box>
        </Modal.Section>
      </Modal>
    </>
  );
}
