import { Box, BlockStack, Button, Card, InlineStack, Select, Text } from "@shopify/polaris";
import { CheckCircle2 } from "lucide-react";
import WhatsComingCard from "./WhatsComingCard";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";

export default function SelectProductStep({
  isFetchingProducts,
  loadingMessage,
  loadingProgress,
  localeSelectOptions,
  storeLanguage,
  languageSelectRef,
  primarySupportedValue,
  selectedLocale,
  setSelectedLocale,
  products,
  selectedProducts,
  newlyAddedProductId,
  handleProductToggle,
  handleBrowseMore,
  productSelectionError,
  selectedProductDescriptionMissingInList,
  isGenerating,
  onPrimaryAction,
  onBack,
}) {
  const isMobileLayout = useViewportBelowMd();
  const productCardWidth = isMobileLayout ? 240 : 280;

  return (
    <Box paddingBlockStart={isMobileLayout ? "300" : "500"} paddingInline={isMobileLayout ? "12px" : undefined}>
      <BlockStack gap="500">
        {isMobileLayout ? (
          <Box width="100%">
            <InlineStack align="space-between" gap="200" blockAlign="center" wrap={false}>
              <Button variant="tertiary" onClick={onBack}>
                ← Back
              </Button>
              <Box style={{ flexShrink: 0 }}>
                <WhatsComingCard currentStep={4} completedStep={3} variant="minimal" />
              </Box>
            </InlineStack>
          </Box>
        ) : (
          <InlineStack align="end" gap="200" blockAlign="center" wrap>
            <Button variant="tertiary" onClick={onBack}>
              ← Back
            </Button>
            <WhatsComingCard currentStep={4} completedStep={3} variant="minimal" />
          </InlineStack>
        )}

        <BlockStack gap="200">
          <Text as="h2" variant="headingLg" fontWeight="semibold">
            Select Products
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Choose from your 4 best performing products to create AI-powered page
          </Text>
        </BlockStack>

        {isFetchingProducts && (
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 40px",
              gap: "24px",
              maxWidth: "1150px",
              width: "100%",
              margin: "0 auto",
            }}
          >
            <Text
              as="p"
              variant="headingMd"
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "8px",
                letterSpacing: "-0.01em",
              }}
            >
              {loadingMessage}
            </Text>

            <Box style={{ width: "100%" }}>
              <Box className="progress-bar-container">
                <Box
                  className="progress-bar-fill"
                  style={{
                    width: `${loadingProgress}%`,
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {localeSelectOptions.length > 0 && !isFetchingProducts && (
          <div className="flex w-full justify-center">
            <Box style={{ display: "inline-flex", width: "fit-content" }}>
              <Card padding={{ xs: "300" }}>
                <Box>
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center" wrap>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Your store speaks {storeLanguage.flag} <strong>{storeLanguage.name}</strong>, so will the Roarr Page.{" "}
                        <button
                          type="button"
                          onClick={() => languageSelectRef.current?.querySelector?.("button")?.click?.()}
                          className="inline-flex items-center gap-0.5 text-current hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--p-color-border-interactive)] rounded"
                          aria-label="Open language menu"
                        >
                          Change here →
                        </button>
                      </Text>
                      <div ref={languageSelectRef} className={isMobileLayout ? "w-full min-w-0" : "min-w-[140px]"}>
                        <Select
                          label=""
                          options={localeSelectOptions}
                          value={selectedLocale || primarySupportedValue || localeSelectOptions[0]?.value}
                          onChange={(value) => {
                            if (value) setSelectedLocale(value);
                          }}
                          ariaLabel="Select language"
                        />
                      </div>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </Card>
            </Box>
          </div>
        )}

        {!isFetchingProducts && products.length > 0 && (
          <Box
            className="products-container"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <Box
              className="product-carousel"
              style={{
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 #f1f5f9",
              }}
            >
              <Box
                style={{
                  display: "flex",
                  gap: "24px",
                  width: "max-content",
                }}
              >
                {products.map((product, index) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const imageUrl = product.featuredImage?.url || (product.images?.edges?.[0]?.node?.url) || "https://via.placeholder.com/300x300?text=No+Image";

                  return (
                    <Box
                      key={product.id}
                      className={`product-card fade-in ${isSelected ? "selected" : ""} ${newlyAddedProductId === product.id ? "newly-added" : ""}`}
                      onClick={() => handleProductToggle(product.id)}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: `2px solid ${isSelected ? "#000000" : "#e1e3e5"}`,
                        padding: "20px",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "0 2px 4px rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        width: `${productCardWidth}px`,
                        minWidth: `${productCardWidth}px`,
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      {isSelected && (
                        <Box
                          className="selection-checkmark"
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                          }}
                        >
                          <CheckCircle2 size={24} strokeWidth={2.4} />
                        </Box>
                      )}

                      <Box
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={product.title || "Product"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      </Box>

                      <Text as="h3" variant="bodyMd" fontWeight="semibold" style={{ margin: 0 }}>
                        {product.title || "Untitled Product"}
                      </Text>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box
              style={{
                display: "flex",
                justifyContent: isMobileLayout ? "stretch" : "flex-end",
                width: "100%",
              }}
            >
              <Button variant="secondary" fullWidth={isMobileLayout} onClick={handleBrowseMore}>
                Browse More Products
              </Button>
            </Box>
          </Box>
        )}

        {!isFetchingProducts && products.length === 0 && (
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              gap: "16px",
            }}
          >
            <Text as="p" variant="bodyMd" tone="subdued">
              No products found. Please add products to your store.
            </Text>
          </Box>
        )}

        {!isFetchingProducts && (
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <BlockStack gap="200" inlineAlign="center">
              {productSelectionError && (
                <Text as="p" variant="bodyMd" tone="critical">
                  {productSelectionError}
                </Text>
              )}
              {selectedProductDescriptionMissingInList && !productSelectionError && (
                <Text as="p" variant="bodySm" tone="critical">
                  This product has no description. Please add a description in Shopify or choose another product.
                </Text>
              )}
              <Button
                variant="primary"
                fullWidth={isMobileLayout}
                onClick={onPrimaryAction}
                disabled={selectedProducts.length === 0 || isGenerating || selectedProductDescriptionMissingInList}
                loading={isGenerating}
              >
                Create Product Page
              </Button>

            </BlockStack>
          </Box>
        )}
      </BlockStack>
    </Box>
  );
}
