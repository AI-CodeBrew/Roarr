import { boundary } from "@shopify/shopify-app-react-router/server";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import DashboardBuildFlows from "./root.dashboard/DashboardBuildFlows.jsx";
import DashboardSetupGuide from "./root.dashboard/DashboardSetupGuide.jsx";
import DashboardAnnouncement from "./root.dashboard/DashboardAnnouncement.jsx";
import DashboardPageUsage from "./root.dashboard/DashboardPageUsage.jsx";
import { usePages } from "../lib/PagesContext";
import { CreditWalletWidget } from "../components/CreditWalletWidget";
import { useDashboardLoaderData } from "../lib/DashboardDataContext";
import {
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Modal,
  Divider,
} from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import { buildEmbeddedHref } from "../lib/embeddedNavigation";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd.js";

// Loader is intentionally trivial: no authenticate.admin(), no GraphQL.
// shopifyClientId: public OAuth client_id; used in theme editor deep link
// `activateAppId={api_key}/{handle}` (shopify.dev theme app extension docs).
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  return {
    shop: url.searchParams.get("shop"),
    shopifyClientId: process.env.SHOPIFY_API_KEY || "",
  };
};

export function shouldRevalidate() {
  return false;
}

/** Block handle from `extensions/pdpbuilder/blocks/app-embed.liquid` */
const APP_EMBED_LIQUID_HANDLE = "app-embed";

function StatusDot({ variant }) {
  const outer = variant === "on" ? "bg-[#d4ebe4]" : "bg-gray-200";
  const inner =
    variant === "on" ? "bg-[#2f6f63]" : variant === "off" ? "bg-gray-400" : "bg-gray-300";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center size-2.5 rounded-full ${outer}`}
      aria-hidden
    >
      <span className={`size-1.5 shrink-0 rounded-full ${inner}`} />
    </span>
  );
}

export default function Index() {
  const { shop: sessionShop, shopifyClientId } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const { storeDetails, pages } = usePages();
  const [isEmbedEnabled, setIsEmbedEnabled] = useState(null);
  const [appBlocksStatus, setAppBlocksStatus] = useState(null);
  const [appBlocksModalOpen, setAppBlocksModalOpen] = useState(false);
  const [appEmbedModalOpen, setAppEmbedModalOpen] = useState(false);
  const [enableEmbedError, setEnableEmbedError] = useState(null);
  const isMobileLayout = useViewportBelowMd();
  const userName =
    storeDetails?.name ||
    storeDetails?.shop_name ||
    storeDetails?.shopName ||
    storeDetails?.domain ||
    "there";
  const isInternalStore = Boolean(storeDetails?.is_internal);
  const pageCount = Array.isArray(pages) ? pages.length : 0;

  const fetchEmbedStatus = useCallback(async ({ force = false } = {}) => {
    try {
      const q = force ? "?refresh=1" : "";
      const response = await fetch(`/api/app-embed-status${q}`, { cache: "no-store" });
      const data = await response.json();
      setIsEmbedEnabled(Boolean(data?.enabled));
    } catch {
      setIsEmbedEnabled(false);
    }
  }, []);

  const fetchAppBlocksStatus = useCallback(async ({ force = false } = {}) => {
    try {
      const q = force ? "?refresh=1" : "";
      const response = await fetch(`/api/app-blocks-status${q}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        setAppBlocksStatus({
          enabledCount: data?.enabledCount || 0,
          blocks: data?.blocks || [],
        });
        return;
      }
      setAppBlocksStatus(data);
    } catch {
      setAppBlocksStatus({ enabledCount: 0, blocks: [] });
    }
  }, []);

  useEffect(() => {
    fetchEmbedStatus();
    fetchAppBlocksStatus();
  }, [fetchEmbedStatus, fetchAppBlocksStatus]);

  useEffect(() => {
    if (isEmbedEnabled !== false) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    const id = setInterval(() => {
      fetchEmbedStatus();
    }, 4000);
    return () => clearInterval(id);
  }, [isEmbedEnabled, fetchEmbedStatus]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (isEmbedEnabled === false) {
        fetchEmbedStatus();
      }
      fetchAppBlocksStatus();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isEmbedEnabled, fetchEmbedStatus, fetchAppBlocksStatus]);

  const recheckEmbedAndAppBlocks = useCallback(() => {
    setIsEmbedEnabled(null);
    setAppBlocksStatus(null);
    void fetchEmbedStatus({ force: true });
    void fetchAppBlocksStatus({ force: true });
  }, [fetchEmbedStatus, fetchAppBlocksStatus]);

  function handleOpenThemeAppEmbeds() {
    setEnableEmbedError(null);
    if (!sessionShop) {
      setEnableEmbedError(
        "Could not open the theme editor. Check that you have a live theme, then try again."
      );
      return;
    }
    // Docs use myshopify host + /admin/themes/current/editor — not
    // admin.shopify.com/store/.../themes/{id}, which can 404 with activateAppId.
    const params = new URLSearchParams({ context: "apps", template: "product" });
    if (shopifyClientId) {
      params.set("activateAppId", `${shopifyClientId}/${APP_EMBED_LIQUID_HANDLE}`);
    }
    const url = `https://${sessionShop}/admin/themes/current/editor?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleOpenThemeEditor() {
    if (!sessionShop) return;
    window.open(
      `https://${sessionShop}/admin/themes/current/editor?template=product`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleCreateProductPage() {
    navigate(buildEmbeddedHref("/product-page", searchParams, shop));
  }

  function handleRevampEntireStore() {
    navigate(buildEmbeddedHref("/entire-store", searchParams, shop));
  }

  const enabledAppBlockCount = appBlocksStatus?.enabledCount ?? 0;
  const appBlocksDotVariant =
    appBlocksStatus === null ? "pending" : enabledAppBlockCount > 0 ? "on" : "off";
  const appBlocksButtonLabel =
    appBlocksStatus === null
      ? "Checking App blocks..."
      : `${enabledAppBlockCount} App blocks Enabled`;

  const appEmbedDotVariant =
    isEmbedEnabled === null ? "pending" : isEmbedEnabled ? "on" : "off";
  const appEmbedButtonLabel =
    isEmbedEnabled === null
      ? "Checking App Embed..."
      : isEmbedEnabled
        ? "App Embed Enabled"
        : "App Embed Disabled";

  return (
    <s-page heading="Dashboard" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "16px" }}>
        <div className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
          <BlockStack gap="400">
            <h4
              style={{
                fontFamily:
                  'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                fontSize: "1.75rem",
                fontWeight: 400,
                margin: 0,
                color: "#1a1a1a",
              }}
            >
              Welcome{" "}
              <span
                style={{
                  color: "#2f6f63",
                  fontStyle: "italic",
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <span>{userName}</span>
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

            <InlineStack align="end" blockAlign="center" gap="200" wrap>
              <button
                type="button"
                title="Recheck app embed and app blocks"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-gray-200 p-0 text-[#5c5f62] transition-colors hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#458fff]"
                onClick={recheckEmbedAndAppBlocks}
                aria-label="Recheck app embed and app blocks status"
              >
                <span className="pointer-events-none flex size-[18px] items-center justify-center [&_svg]:block [&_svg]:max-h-[18px] [&_svg]:max-w-[18px] [&_svg]:shrink-0">
                  <RefreshIcon />
                </span>
              </button>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobileLayout ? "column" : "row",
                  gap: isMobileLayout ? 8 : 12,
                  width: isMobileLayout ? "100%" : "auto",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnableEmbedError(null);
                    setAppEmbedModalOpen(true);
                  }}
                  aria-label="App embed status and instructions"
                  fullWidth={isMobileLayout}
                >
                  <span className="inline-flex items-center gap-2">
                    <StatusDot variant={appEmbedDotVariant} />
                    {appEmbedButtonLabel}
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAppBlocksModalOpen(true)}
                  aria-label="View Kluck app blocks status"
                  fullWidth={isMobileLayout}
                >
                  <span className="inline-flex items-center gap-2">
                    <StatusDot variant={appBlocksDotVariant} />
                    {appBlocksButtonLabel}
                  </span>
                </Button>
              </div>
            </InlineStack>

            <DashboardSetupGuide
              isEmbedEnabled={isEmbedEnabled}
              pageCount={pageCount}
              onOpenThemeAppEmbeds={handleOpenThemeAppEmbeds}
              onCreateProductPage={handleCreateProductPage}
              onRevampEntireStore={handleRevampEntireStore}
            />

            <DashboardBuildFlows />

            <DashboardPageUsage shop={sessionShop} pages={pages} isInternalStore={isInternalStore} />

            {/* <DashboardAnnouncement shop={sessionShop} /> */}
          </BlockStack>
        </div>
      </div>
      <Modal
        open={appEmbedModalOpen}
        onClose={() => setAppEmbedModalOpen(false)}
        title="App embed"
        primaryAction={{
          content: "Open theme editor",
          onAction: () => {
            handleOpenThemeAppEmbeds();
            setAppEmbedModalOpen(false);
          },
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: () => setAppEmbedModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {isEmbedEnabled === false ? (
              <>
                <Text as="p" variant="bodyMd">
                  Kluck needs the <strong>Kluck AI Theme Extension</strong> app embed turned on in
                  your live theme. Until it&apos;s enabled, storefront pages built in Kluck may not
                  display correctly.
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Use <strong>Open theme editor</strong> below—we&apos;ll open the theme editor with
                  App embeds focused. Turn on <strong>Kluck AI Theme Extension</strong>, then click{" "}
                  <strong>Save</strong>.
                </Text>
                <BlockStack gap="150">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    Or enable manually
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Shopify Admin → Online Store → Themes → Customize → Theme settings → App embeds
                    → enable Kluck AI Theme Extension → Save.
                  </Text>
                </BlockStack>
              </>
            ) : isEmbedEnabled === true ? (
              <Text as="p" variant="bodyMd" tone="subdued">
                App embed is enabled. You can still open the theme editor if you need to adjust embed settings.
              </Text>
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                Checking whether the app embed is enabled in your theme…
              </Text>
            )}
            {enableEmbedError ? (
              <Text as="p" variant="bodySm" tone="critical">
                {enableEmbedError}
              </Text>
            ) : null}
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={appBlocksModalOpen}
        onClose={() => setAppBlocksModalOpen(false)}
        title="App Blocks"
        primaryAction={{
          content: "Open Theme Editor",
          onAction: handleOpenThemeEditor,
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: () => setAppBlocksModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd" tone="subdued">
            All relevant app blocks are added automatically when you generate a PDP or Full Store through Kluck. This view shows all available blocks in case you want to add any manually via the theme editor.
            </Text>
            <BlockStack gap="0">
              {(appBlocksStatus?.blocks || []).map((block, index, blocks) => (
                <div key={block.handle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "14px 0",
                    }}
                  >
                    <BlockStack gap="050">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {block.name}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {block.enabled
                          ? `Added to live theme${block.count > 1 ? ` ${block.count} times` : ""}`
                          : "Not added to current theme"}
                      </Text>
                    </BlockStack>
                    <Badge tone={block.enabled ? "success" : undefined}>
                      {block.enabled ? "Added" : "Available"}
                    </Badge>
                  </div>
                  {index < blocks.length - 1 ? <Divider /> : null}
                </div>
              ))}
              {appBlocksStatus === null ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Checking app blocks...
                </Text>
              ) : null}
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
