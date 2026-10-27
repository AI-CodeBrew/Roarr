import { boundary } from "@shopify/shopify-app-react-router/server";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import DashboardBuildFlows from "./root.dashboard/DashboardBuildFlows.jsx";
import DashboardAnnouncement from "./root.dashboard/DashboardAnnouncement.jsx";
import DashboardHero from "./root.dashboard/DashboardHero.jsx";
import { usePages } from "../lib/PagesContext";
import { useDashboardLoaderData } from "../lib/DashboardDataContext";
import { AppBlocksDialog, AppEmbedDialog } from "./root.dashboard/DashboardDialogs.jsx";

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

/** Last known "has generated pages" answer, so the setup pill is right on the first paint. */
const SETUP_PAGES_CACHE_KEY = "roarr:hasGeneratedPages";

export default function Index() {
  const { shop: sessionShop, shopifyClientId } = useLoaderData();
  const { storeDetails, pages, loading: pagesLoading } = usePages();
  const [appBlocksStatus, setAppBlocksStatus] = useState(null);
  const [appBlocksModalOpen, setAppBlocksModalOpen] = useState(false);
  const [appEmbedModalOpen, setAppEmbedModalOpen] = useState(false);
  const [enableEmbedError, setEnableEmbedError] = useState(null);
  const storeName =
    storeDetails?.name ||
    storeDetails?.shop_name ||
    storeDetails?.shopName ||
    storeDetails?.domain ||
    null;
  const pageCount = Array.isArray(pages) ? pages.length : 0;

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
    fetchAppBlocksStatus();
  }, [fetchAppBlocksStatus]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      fetchAppBlocksStatus();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [fetchAppBlocksStatus]);

  const recheckAppBlocks = useCallback(() => {
    setAppBlocksStatus(null);
    void fetchAppBlocksStatus({ force: true });
  }, [fetchAppBlocksStatus]);

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

  const enabledAppBlockCount = appBlocksStatus?.enabledCount ?? 0;
  const appBlocksButtonLabel =
    appBlocksStatus === null
      ? "Checking app blocks…"
      : `${enabledAppBlockCount} app block${enabledAppBlockCount === 1 ? "" : "s"} enabled`;

  // The Roarr theme extension (app embed) is always on, so it counts as a finished setup step
  // and the dashboard no longer polls /api/app-embed-status.
  // The second step (a generated page) is only known once the pages list arrives. Until then the pill
  // shows the last known answer (or "checking") instead of flashing "Finish setup" and flipping.
  const SETUP_TOTAL_STEPS = 2;
  const hasPages = pageCount > 0;
  const [cachedHasPages, setCachedHasPages] = useState(null);
  const [pagesSettled, setPagesSettled] = useState(false);
  const pagesSawLoading = useRef(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SETUP_PAGES_CACHE_KEY);
      if (raw === "true" || raw === "false") setCachedHasPages(raw === "true");
    } catch {
      /* storage blocked: the pill just starts in the checking state */
    }
  }, []);

  useEffect(() => {
    if (pagesLoading) pagesSawLoading.current = true;
    else if (pagesSawLoading.current) setPagesSettled(true);
  }, [pagesLoading]);

  // Safety net so a pages fetch that never reports back can't leave the pill checking forever.
  useEffect(() => {
    const id = window.setTimeout(() => setPagesSettled(true), 5000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!pagesSettled) return;
    try {
      window.sessionStorage.setItem(SETUP_PAGES_CACHE_KEY, String(hasPages));
    } catch {
      /* ignore */
    }
  }, [pagesSettled, hasPages]);

  const setupKnown = pagesSettled || hasPages || cachedHasPages !== null;
  const setupHasPages = pagesSettled ? hasPages : hasPages || cachedHasPages === true;
  const setupCompleted = 1 + Number(setupHasPages);
  const setupState = !setupKnown
    ? "checking"
    : setupCompleted === SETUP_TOTAL_STEPS
      ? "complete"
      : "incomplete";

  return (
    <s-page heading="Dashboard" inlineSize="large">
      <s-button
        slot="secondary-actions"
        variant="secondary"
        onClick={() => setAppBlocksModalOpen(true)}
        aria-label="View Roarr app blocks status"
      >
        {appBlocksButtonLabel}
      </s-button>
      <s-button
        slot="secondary-actions"
        variant="secondary"
        onClick={recheckAppBlocks}
        aria-label="Recheck app blocks status"
      >
        Recheck
      </s-button>
      <div style={{ maxWidth: "1150px", margin: "-12px auto 0", padding: "0 16px 16px" }}>
        <div className="flex flex-col gap-3 overflow-x-hidden">
          <DashboardHero
            storeName={storeName}
            setup={{ state: setupState, completed: setupCompleted, total: SETUP_TOTAL_STEPS }}
            embed={{
              variant: "on",
              label: "Enabled",
              onClick: () => {
                setEnableEmbedError(null);
                setAppEmbedModalOpen(true);
              },
            }}
            onManageTheme={handleOpenThemeAppEmbeds}
          />

          <DashboardBuildFlows />

          {/* <DashboardAnnouncement shop={sessionShop} /> */}
        </div>
      </div>
      <AppEmbedDialog
        open={appEmbedModalOpen}
        onClose={() => setAppEmbedModalOpen(false)}
        error={enableEmbedError}
        onOpenThemeEditor={() => {
          handleOpenThemeAppEmbeds();
          setAppEmbedModalOpen(false);
        }}
      />

      <AppBlocksDialog
        open={appBlocksModalOpen}
        onClose={() => setAppBlocksModalOpen(false)}
        status={appBlocksStatus}
        onOpenThemeEditor={handleOpenThemeEditor}
      />
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
