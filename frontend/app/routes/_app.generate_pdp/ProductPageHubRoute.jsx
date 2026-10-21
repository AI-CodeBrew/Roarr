import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BlockStack, Box, Spinner, Text } from "@shopify/polaris";
import { normalizeProductSource } from "../../lib/utils";
import PagesTable from "../../components/PagesTable.jsx";
import PagesHubWelcome from "../../components/PagesHubWelcome.jsx";
import { usePages } from "../../lib/PagesContext";
import { usePageTracking } from "../../hooks/usePageTracking";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";

const ProductFlow = lazy(() => import("./product-page/ProductFlow.jsx"));

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productSourceParam = url.searchParams.get("source") || null;
  const productSource = normalizeProductSource(productSourceParam);
  return { productSource };
};

export function shouldRevalidate({ currentUrl, nextUrl }) {
  return currentUrl.search !== nextUrl.search;
}

export default function ProductPageRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get("pageId");
  const [showFlow, setShowFlow] = useState(Boolean(pageId));
  const { pages, loading: pagesLoading } = usePages();

  usePageTracking();

  useEffect(() => {
    setShowFlow(Boolean(pageId));
  }, [pageId]);

  useEffect(() => {
    const raw = sessionStorage.getItem("billingRedirectData");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.flow === "store") return;
      const shop = searchParams.get("shop");
      if (data.pageId != null) {
        navigate(buildEmbeddedHref("/product-page", searchParams, shop, { pageId: String(data.pageId) }));
      }
      sessionStorage.removeItem("billingRedirectData");
    } catch (e) {
      console.error("billingRedirectData", e);
    }
  }, [navigate, searchParams]);

  const hasProductHubPages =
    pages?.some((p) => p?.generation_type !== "store") ?? false;
  const verticalCenterHub =
    !pagesLoading && !hasProductHubPages;

  if (showFlow || pageId) {
    return (
      <Suspense
        fallback={
          <s-page heading="Product pages" inlineSize="large">
            <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "16px" }}>
              <BlockStack gap="200" align="center">
                <Spinner size="large" />
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading product flow...
                </Text>
              </BlockStack>
            </div>
          </s-page>
        }
      >
        <ProductFlow
          hubPath="/product-page"
          setFlowType={(v) => {
            if (v == null) {
              setShowFlow(false);
              const shop = searchParams.get("shop");
              navigate(buildEmbeddedHref("/product-page", searchParams, shop));
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <s-page heading="Product pages" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
        <div
          style={{
            minHeight: "max(320px, calc(100dvh - 7rem))",
            display: "flex",
            flexDirection: "column",
            justifyContent: verticalCenterHub ? "center" : "flex-start",
            maxWidth: "1150px",
            margin: "0 auto",
            width: "100%",
            paddingInline: "clamp(12px, 4vw, 16px)",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <BlockStack gap="600">
            <PagesHubWelcome variant="product" onStart={() => setShowFlow(true)} />
            <PagesTable
              listFilter="product"
              hubBasePath="/product-page"
              hideWhenNoHubPages
              onEmptyCreateClick={() => setShowFlow(true)}
            />
          </BlockStack>
        </div>
      </Box>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
