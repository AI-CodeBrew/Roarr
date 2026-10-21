import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BlockStack, Box, Button, InlineStack, Text } from "@shopify/polaris";
import { EmbeddedNavLink } from "../../components/EmbeddedNavLink";
import { useCredits } from "../../lib/CreditsContext";
import { formatCredits } from "../../lib/credits";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";

function countPagesByGenerationType(pages) {
  const list = Array.isArray(pages) ? pages : [];
  let product = 0;
  let store = 0;
  for (const p of list) {
    if (p?.generation_type === "store") store += 1;
    else product += 1;
  }
  return { product, store };
}

/** Dashboard summary: credit balance + saved page breakdown (no plan slots). */
export default function DashboardPageUsage({ shop, pages = [], isInternalStore = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance, loading: creditsLoading } = useCredits();
  const { product: productPageCount, store: storePageCount } = useMemo(
    () => countPagesByGenerationType(pages),
    [pages],
  );
  const balanceLabel =
    creditsLoading && balance == null
      ? "…"
      : balance != null
        ? formatCredits(balance)
        : "—";

  return (
    <Box
      background="bg-surface"
      borderWidth="025"
      borderColor="border"
      borderRadius="300"
      padding="400"
    >
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start" gap="300" wrap>
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">
              Credits &amp; pages
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {isInternalStore
                ? "Internal store — credit balance may be hidden."
                : `Wallet balance: ${balanceLabel}. Spend credits when you run AI generation.`}
            </Text>
          </BlockStack>
          {!isInternalStore ? (
            <EmbeddedNavLink to="/credits" shop={shop}>
              <Text
                as="span"
                variant="bodySm"
                style={{ color: "var(--p-color-text-link, #005bd3)" }}
              >
                Buy credits
              </Text>
            </EmbeddedNavLink>
          ) : null}
        </InlineStack>

        <BlockStack gap="200">
          <InlineStack gap="200" blockAlign="center" wrap>
            <Text as="p" variant="bodySm">
              {`See your generated product pages from here (${productPageCount}).`}
            </Text>
            <Button
              variant="secondary"
              onClick={() => navigate(buildEmbeddedHref("/product-page", searchParams, shop))}
            >
              Product page
            </Button>
          </InlineStack>
          <InlineStack gap="200" blockAlign="center" wrap>
            <Text as="p" variant="bodySm">
              {`See your generated stores from here (${storePageCount}).`}
            </Text>
            <Button
              variant="secondary"
              onClick={() => navigate(buildEmbeddedHref("/entire-store", searchParams, shop))}
            >
              Entire store
            </Button>
          </InlineStack>
        </BlockStack>
      </BlockStack>
    </Box>
  );
}
