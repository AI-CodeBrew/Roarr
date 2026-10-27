import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BlockStack, Box, Spinner, Text } from "@shopify/polaris";
import PagesTable from "../../components/PagesTable.jsx";
import PagesHubWelcome from "../../components/PagesHubWelcome.jsx";
import { usePages } from "../../lib/PagesContext";
import { useFlowTemplate } from "../../lib/useFlowTemplate";
import { usePageTracking } from "../../hooks/usePageTracking";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";

const StoreFlow = lazy(() => import("./store/StoreFlow.jsx"));

export function shouldRevalidate({ currentUrl, nextUrl }) {
  return currentUrl.search !== nextUrl.search;
}

export default function EntireStoreRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get("pageId");
  const [showFlow, setShowFlow] = useState(Boolean(pageId));
  const { pages, loading: pagesLoading } = usePages();
  const heroTemplate = useFlowTemplate("store");

  usePageTracking();

  useEffect(() => {
    setShowFlow(Boolean(pageId));
  }, [pageId]);

  useEffect(() => {
    const raw = sessionStorage.getItem("billingRedirectData");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.flow !== "store") return;
      const shop = searchParams.get("shop");
      if (data.pageId != null) {
        navigate(
          buildEmbeddedHref("/entire-store", searchParams, shop, {
            pageId: String(data.pageId),
            entireStore: 1,
          })
        );
      }
      sessionStorage.removeItem("billingRedirectData");
    } catch (e) {
      console.error("billingRedirectData", e);
    }
  }, [navigate, searchParams]);

  const hasStoreHubPages =
    pages?.some((p) => p?.generation_type === "store") ?? false;
  const verticalCenterHub = !pagesLoading && !hasStoreHubPages;

  if (showFlow || pageId) {
    return (
      <Suspense
        fallback={
          <s-page heading="Entire store" inlineSize="large">
            <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "16px" }}>
              <BlockStack gap="200" align="center">
                <Spinner size="large" />
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading store flow...
                </Text>
              </BlockStack>
            </div>
          </s-page>
        }
      >
        <StoreFlow
          hubPath="/entire-store"
          setFlowType={(v) => {
            if (v == null) {
              setShowFlow(false);
              const shop = searchParams.get("shop");
              navigate(buildEmbeddedHref("/entire-store", searchParams, shop));
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <s-page heading="Entire store" inlineSize="large">
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
            <PagesHubWelcome
              variant="store"
              template={heroTemplate}
              onStart={() => setShowFlow(true)}
            />
            <PagesTable
              listFilter="store"
              hubBasePath="/entire-store"
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
