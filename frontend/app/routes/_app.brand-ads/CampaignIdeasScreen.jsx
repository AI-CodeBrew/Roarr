import { useMemo, useRef, useState } from "react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Page,
  RadioButton,
  Spinner,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import ProductSelectionModal from "../../components/ProductSelectionModal";
import { CreditConfirmationModal } from "../../components/CreditConfirmationModal";
import { useCredits } from "../../lib/CreditsContext";
import { hasEnoughCredits, resolveFeatureCost, shopSkipsCreditGates } from "../../lib/credits";
import { buildProductsPayload } from "./dnaHelpers.js";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";
import { usePages } from "../../lib/PagesContext.jsx";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3C/svg%3E";

export default function CampaignIdeasScreen({ onBack, onNext, brandDna }) {
  const { refresh: refreshCreditsWallet } = useCredits();
  const { storeDetails } = usePages() || {};
  const [campaignProduct, setCampaignProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditConfirmOpen, setCreditConfirmOpen] = useState(false);
  const pendingNextRef = useRef(null);

  const productSummary = useMemo(() => {
    if (!campaignProduct) return { title: "", imageUrl: PLACEHOLDER_IMG };
    const title = campaignProduct.title || "Untitled product";
    const imageUrl =
      campaignProduct?.featuredImage?.url ||
      campaignProduct?.images?.edges?.[0]?.node?.url ||
      PLACEHOLDER_IMG;
    return { title, imageUrl };
  }, [campaignProduct]);

  const handleGenerateIdeas = async () => {
    if (!brandDna || typeof brandDna !== "object") {
      setError("Brand DNA is missing. Go back and generate Brand DNA first.");
      return;
    }
    if (!campaignProduct) {
      setError("Choose a product to anchor these campaign ideas.");
      return;
    }
    setError("");
    setLoading(true);
    setIdeas([]);
    setSelectedIndex(null);
    try {
      const [productPayload] = buildProductsPayload([campaignProduct]);
      const response = await fetch("/api/brand-dna-campaign-ideas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dna: brandDna, product: productPayload }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || "Failed to generate campaign ideas");
      }
      const list = json?.data?.ideas ?? [];
      setIdeas(Array.isArray(list) ? list.slice(0, 3) : []);
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePress = async () => {
    if (selectedIndex === null || !ideas[selectedIndex] || !campaignProduct) return;
    pendingNextRef.current = {
      idea: ideas[selectedIndex],
      product: campaignProduct,
    };
    const wallet = await refreshCreditsWallet();
    const cost = resolveFeatureCost(
      "brand_ads_campaign",
      wallet.featureCosts ?? undefined,
    );
    if (
      shopSkipsCreditGates(storeDetails) ||
      (wallet.ok && hasEnoughCredits(wallet.balance, cost))
    ) {
      const payload = pendingNextRef.current;
      pendingNextRef.current = null;
      if (payload) onNext?.(payload);
      return;
    }
    setCreditConfirmOpen(true);
  };

  const handleCreditConfirmClose = () => {
    pendingNextRef.current = null;
    setCreditConfirmOpen(false);
  };

  const handleCreditConfirmProceed = () => {
    const payload = pendingNextRef.current;
    pendingNextRef.current = null;
    setCreditConfirmOpen(false);
    if (payload) onNext?.(payload);
  };

  const missingSession = !brandDna || typeof brandDna !== "object";

  const initialModalIds = campaignProduct?.id ? [campaignProduct.id] : [];

  return (
    <s-page heading="Brand ads" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
            paddingInline: "clamp(12px, 4vw, 16px)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Page
            fullWidth
            backAction={{ content: "Brand DNA", onAction: onBack }}
            title="Campaign ideas"
            subtitle="Step 2 of 3"
          >
            <BlockStack gap="400">
              {missingSession ? (
                <Banner tone="warning" title="Brand DNA required">
                  Continue from Brand DNA after generating your profile so we can create aligned
                  campaign ideas.
                </Banner>
              ) : null}

              {error ? (
                <Banner tone="critical" title="Could not generate ideas">
                  {error}
                </Banner>
              ) : null}

              <Card roundedAbove="sm" padding="0">
                <Box background="bg-surface" padding="400">
                  <BlockStack gap="400">
                  <Text as="p" variant="bodyMd">
                    Choose one store product to anchor the campaign. We&apos;ll propose three
                    distinct directions grounded in your Brand DNA and that product.
                  </Text>

                  {campaignProduct ? (
                    <Box
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                      borderWidth="025"
                      borderColor="border"
                    >
                      <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
                        <InlineStack gap="300" blockAlign="center" wrap>
                          <Thumbnail
                            source={productSummary.imageUrl}
                            alt={productSummary.title}
                            size="medium"
                          />
                          <BlockStack gap="050">
                            <Text variant="bodyMd" fontWeight="semibold">
                              {productSummary.title}
                            </Text>
                            <Text variant="bodyXs" tone="subdued">
                              Campaign anchor product
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <Button onClick={() => setShowProductModal(true)}>Change product</Button>
                      </InlineStack>
                    </Box>
                  ) : (
                    <Box>
                      <Button variant="primary" onClick={() => setShowProductModal(true)}>
                        Choose product
                      </Button>
                    </Box>
                  )}

                  <InlineStack align="end" blockAlign="center">
                    <Button
                      variant="primary"
                      onClick={handleGenerateIdeas}
                      loading={loading}
                      disabled={missingSession || !campaignProduct || loading}
                    >
                      Generate campaign ideas
                    </Button>
                  </InlineStack>

                  {loading ? (
                    <InlineStack gap="200" blockAlign="center">
                      <Spinner size="small" accessibilityLabel="Generating ideas" />
                      <Text as="p" variant="bodySm" tone="subdued">
                        Writing three tailored concepts…
                      </Text>
                    </InlineStack>
                  ) : null}
                  </BlockStack>
                </Box>
              </Card>

              {ideas.length > 0 ? (
                <Card roundedAbove="sm" padding="0">
                  <Box background="bg-surface" padding="400">
                    <BlockStack gap="300">
                    <Text
                      as="h3"
                      variant="headingSm"
                      fontWeight="semibold"
                      id="campaign-ideas-heading"
                    >
                      Campaign idea
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Tap a card to select an idea — only one can continue to creatives.
                    </Text>
                    <div
                      role="radiogroup"
                      aria-labelledby="campaign-ideas-heading"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {ideas.map((idea, i) => {
                        const selected = selectedIndex === i;
                        const title = idea.title || `Campaign idea ${i + 1}`;
                        const radioLabel = `Option ${i + 1}: ${title}`;
                        return (
                          <button
                            type="button"
                            key={`idea-${i}-${title}`}
                            onClick={() => setSelectedIndex(i)}
                            style={{
                              border: `1px solid ${selected ? "#2f6f63" : "#d1d5db"}`,
                              background: selected ? "#edf5f3" : "#fff",
                              borderRadius: 10,
                              padding: "12px",
                              cursor: "pointer",
                              textAlign: "left",
                              position: "relative",
                              margin: 0,
                              font: "inherit",
                              color: "inherit",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                pointerEvents: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <RadioButton
                                label={radioLabel}
                                labelHidden
                                name="campaignIdea"
                                checked={selected}
                                onChange={() => {}}
                              />
                            </div>
                            <Box paddingInlineEnd="1000">
                              <BlockStack gap="150">
                                <Text as="p" variant="bodyMd" fontWeight="semibold" breakWord>
                                  {title}
                                </Text>
                                <Text as="p" variant="bodySm" breakWord>
                                  {idea.description || ""}
                                </Text>
                                <Text as="p" variant="bodyXs" tone="subdued" breakWord>
                                  Strategy: {idea.strategy || "—"}
                                </Text>
                              </BlockStack>
                            </Box>
                          </button>
                        );
                      })}
                    </div>
                    </BlockStack>
                  </Box>
                </Card>
              ) : null}

              {ideas.length > 0 ? (
                <InlineStack align="end" blockAlign="center" wrap>
                  <Button
                    variant="primary"
                    disabled={selectedIndex === null || !campaignProduct}
                    onClick={handleContinuePress}
                  >
                    Generate creatives
                  </Button>
                </InlineStack>
              ) : null}
            </BlockStack>
          </Page>
        </div>
      </Box>

      <CreditConfirmationModal
        open={creditConfirmOpen}
        onClose={handleCreditConfirmClose}
        onConfirm={handleCreditConfirmProceed}
        featureKey="brand_ads_campaign"
      />

      <ProductSelectionModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        onConfirm={(product) => {
          setCampaignProduct(product ?? null);
        }}
        maxSelectable={1}
        initialSelectedIds={initialModalIds}
      />
    </s-page>
  );
}
