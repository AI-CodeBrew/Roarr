import { Outlet, useLoaderData, useRouteError, useLocation, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { PagesProvider } from "../lib/PagesContext";
import { PosthogIdentityProvider } from "../lib/PosthogIdentityContext";
import { usePostHog } from "posthog-js/react";
import { DashboardDataProvider } from "../lib/DashboardDataContext";
import { CreditsProvider } from "../lib/CreditsContext";

import Onboarding from "../components/onboarding/Onboarding";
import { EmbeddedNavLink } from "../components/EmbeddedNavLink";
import { InsufficientCreditsModal } from "../components/InsufficientCreditsModal";
import { useAppBridge } from "@shopify/app-bridge-react";
import { stripShopifyEphemeralFromSearch } from "../lib/embeddedNavigation";
import { syncPosthogMarketType } from "../lib/posthogMarketType";

// --- 1. Add these 3 imports for Polaris ---
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import polarisAppOverrides from "../polaris-app-overrides.css?url";
import translations from "@shopify/polaris/locales/en.json";
// ------------------------------------------
// --- 2. Add Polaris CSS to links (low priority so LCP isn't blocked) ---
export const links = () => [
  { rel: "stylesheet", href: polarisStyles, fetchpriority: "low" },
  { rel: "stylesheet", href: polarisAppOverrides, fetchpriority: "low" },
];
// -----------------------------------

// Defer auth + shop details so the shell + LCP splash stream immediately (no await before return).
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // PERFORMANCE: Only authenticate, don't fetch any data
  // This makes the loader return immediately after OAuth redirect
  // await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    crispWebsiteId: process.env.CRISP_WEBSITE_ID || "",
    shop,
  };
};

// Prevent re-running this expensive auth loader on every client-side navigation.
export function shouldRevalidate() {
  return false;
}


// Remember the onboarding verdict across reloads so returning users don't
// wait on /api/app-data before we can show the app shell. `sessionStorage`
// is scoped per tab/iframe which is fine for embedded apps.
const ONBOARDED_CACHE_KEY = "klucky:isOnboarded";
/** SSR-safe: `useLayoutEffect` warns on the server; `useEffect` is a no-op there but avoids the warning. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readOnboardedCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ONBOARDED_CACHE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch {
    return null;
  }
}

function writeOnboardedCache(value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ONBOARDED_CACHE_KEY, String(Boolean(value)));
  } catch {
    /* storage disabled — fine, we'll just re-fetch every load */
  }
}

function AppContent({ apiKey, crispWebsiteId, shop: shopFromLoader }) {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [posthogIdentified, setPosthogIdentified] = useState(false);
  const [appData, setAppData] = useState(null);
  // Always `null` on the first render (server + hydration) so markup matches SSR.
  // Session cache is applied in useLayoutEffect before paint so returning users
  // still get the shell immediately without reading storage in useState (which
  // would differ from the server and break hydration).
  const [isOnboarded, setIsOnboarded] = useState(null);
  useIsomorphicLayoutEffect(() => {
    const cached = readOnboardedCache();
    if (cached !== null) {
      setIsOnboarded(cached);
    }
  }, []);
  const location = useLocation();
  const reviewShownThisSession = useRef(false);
  // Prefer loader `shop`, then app-data session shop (URL often omits ?shop= in Dev Console).
  const shop =
    shopFromLoader ||
    appData?.shop ||
    appData?.shopDetails?.myshopifyDomain ||
    appData?.shopDetails?.domain ||
    null;
  const shopify = useAppBridge();

  useEffect(() => {
    const { search, changed } = stripShopifyEphemeralFromSearch(location.search);
    if (!changed) return;
    navigate({ pathname: location.pathname, search: search || "" }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const isDebugContrastEnabled =
      import.meta.env.DEV && String(import.meta.env.VITE_A11Y_CONTRAST_DEBUG).toLowerCase() === "true";
    if (!isDebugContrastEnabled) return;

    let cancelled = false;
    let dispose;

    import("../lib/a11yContrastScanner").then((mod) => {
      if (cancelled) return;
      dispose = mod.initA11yContrastScanner();
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  const shopDetails = useMemo(() => appData?.shopDetails, [appData]);
  const locales = useMemo(() => appData?.locales || [], [appData]);
  const productsCount = useMemo(() => appData?.productsCount, [appData]);

  // Session-authenticated; do not require ?shop= in the URL (Dev Console / App Bridge
  // often omit it). Blocking on shop left isOnboarded=null forever → white screen.
  useEffect(() => {
    let cancelled = false;

    async function fetchAppData() {
      try {
        const qs = shopFromLoader
          ? `?shop=${encodeURIComponent(shopFromLoader)}`
          : "";
        const response = await fetch(`/api/app-data${qs}`);
        if (cancelled) return;

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || `app-data failed (${response.status})`);
        }
        setAppData(data);
        const onboarded = data.isOnboarded ?? false;
        setIsOnboarded(onboarded);
        writeOnboardedCache(onboarded);
      } catch (error) {
        console.error("Error fetching app data:", error);
        setAppData({
          shopDetails: null,
          locales: [],
          productsCount: null,
        });
        // Avoid permanent white screen (isOnboarded === null renders nothing).
        setIsOnboarded((prev) => {
          if (prev !== null) return prev;
          const cached = readOnboardedCache();
          return cached !== null ? cached : false;
        });
      }
    }

    fetchAppData();

    return () => {
      cancelled = true;
    };
  }, [shopFromLoader]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hold the LCP splash until we know whether to render the Onboarding flow
    // or the main app shell — otherwise first-time installs briefly see the
    // dashboard before being swapped into Onboarding.
    if (isOnboarded === null) return;
    window.dispatchEvent(new CustomEvent("app-ready"));
  }, [isOnboarded]);

  useEffect(() => {
    if (!posthog || !posthog.__loaded || !shop || posthogIdentified || !shopDetails) return;

    const currentUserId = posthog.get_distinct_id();
    posthog.identify(`${shop}`, {
      email: shopDetails?.email,
      billing_model: "credits",
      shop_domain: shopDetails?.domain,
      shop: shop,
      country: shopDetails?.address?.country,

      // Deprecated fields
      shopifyEmail: shopDetails?.email,
      shopifyDomain: shopDetails?.domain,
      shopifyPlan: shopDetails?.plan,
      shopifyCreatedAt: shopDetails?.createdAt,
      shopifyUpdatedAt: shopDetails?.updatedAt,
      shopifyCurrencyCode: shopDetails?.currencyCode,
      shopifyTimezone: shopDetails?.timezone,
      shopifyId: shopDetails?.id
    }, {
      first_seen_at: new Date().toISOString(),
      number_of_products_on_store: productsCount ?? 0,
    });

    const updatedUserId = posthog.get_distinct_id();
    if (updatedUserId !== currentUserId) {
      posthog.alias(updatedUserId, currentUserId);
    }

    const prefs = appData?.marketPreferences;
    syncPosthogMarketType(
      posthog,
      prefs?.market_type || prefs?.marketType,
    );

    setPosthogIdentified(true);
  }, [shop, posthogIdentified, posthog?.__loaded, shopDetails, productsCount, appData?.marketPreferences]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!shop || !crispWebsiteId) {
      return;
    }

    let cancelled = false;
    async function initCrisp() {
      try {
        const mod = await import("crisp-sdk-web");
        if (cancelled) {
          return;
        }
        const { Crisp } = mod;
        Crisp.configure(crispWebsiteId, { autoload: true });
        Crisp.session.setData({
          shop,
          app: "KluckAI",
          environment: "Production",
        });
        Crisp.user.setNickname(shop.replace(".myshopify.com", ""));
        Crisp.user.setEmail(shopDetails?.email);
        if (shopDetails?.phone) {
          Crisp.user.setPhone(shopDetails?.phone);
        }
        const sessionData = {};
        if (shopDetails?.myshopifyDomain) sessionData.domain = shopDetails.myshopifyDomain;
        if (shopDetails?.name) sessionData.storeName = shopDetails.name;
        if (shopDetails?.plan) sessionData.shopifyPlan = shopDetails.plan;
        if (shopDetails?.currencyCode) sessionData.CurrencyCode = shopDetails.currencyCode;
        if (Object.keys(sessionData).length > 0) {
          Crisp.session.setData(sessionData);
        }
        console.log("[Crisp] Init complete", { shop, nickname: shop.replace(".myshopify.com", ""), email: shopDetails?.email });
      } catch (err) {
        console.error("[Crisp] Init failed:", err);
      }
    }
    initCrisp();
    return () => { cancelled = true; };
  }, [shop, crispWebsiteId, shopDetails]);

  const handleOnboardingComplete = async (plan) => {
    try {
      setIsOnboarded(true);
      await fetch("/api/shopify/set-store-onboarded", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan || null }),
      });
    } catch (error) {
      console.error('Error setting store onboarded', error);
    }
  };

  useEffect(() => {
    if (isOnboarded)
      handleRequestReview()

  }, [isOnboarded])

  async function handleRequestReview() {
    try {
      if (!isOnboarded) return;
      if (reviewShownThisSession.current) return
      const result = await shopify.reviews.request();
      if (result.success) {
        reviewShownThisSession.current = true
      } else {
        console.log(
          `Review modal not displayed. Reason: ${result.code}: ${result.message}`,
        );
      }
    } catch (error) {
      console.error('Error requesting review:', error);
    }
  }


  const onCreditsRoute =
    location.pathname === "/credits" ||
    location.pathname.startsWith("/credits/");
  // Onboarding normally replaces <Outlet>. Credits CTAs still navigate to
  // /credits — allow the outlet there so the iframe actually changes pages.
  const showOnboardingShell = isOnboarded === false && !onCreditsRoute;
  const outletCtx = {
    isAuthenticating: false,
    locales,
    shop,
    midOnboarding: isOnboarded === false && onCreditsRoute,
  };

  return (
    <PosthogIdentityProvider identified={posthogIdentified}>
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={translations}>
        <PagesProvider shop={shop} apiKey={apiKey}>
          <DashboardDataProvider initialData={appData}>
            {/*
              Render the nav + outlet as soon as we mount. `isOnboarded` is
              optimistically `true` (cached from previous visit) so the app
              shell is visible immediately. Only when /api/app-data
              explicitly returns isOnboarded === false do we swap to the
              Onboarding flow.

              CreditsProvider wraps onboarding too: embedded product/store flows
              use CreditConfirmationModal / useCredits(); without the provider,
              balance stays null ("—") even after signup credits are granted.

              During onboarding we still mount <Outlet> for /credits (and
              callback): "View credit packs" / insufficient-credits CTAs call
              navigate("/credits"). Without Outlet, only the URL bar changes
              and the iframe stays on the onboarding push screen.
            */}
            {isOnboarded === null ? null : (
              <CreditsProvider enabled={Boolean(shop)}>
                {showOnboardingShell ? (
                  <Onboarding
                    onComplete={handleOnboardingComplete}
                    shop={shop}
                    locales={locales}
                  />
                ) : (
                  <>
                    {isOnboarded === true && (
                      <s-app-nav>
                        {/*
                          First link in <s-app-nav> is treated as the "home" target by
                          Shopify admin — the app name in the admin top bar navigates
                          here. Keeping it as a React Router NavLink keeps clicks
                          client-side (no iframe reload, no ?appLoadId=… refresh).
                        */}
                        <EmbeddedNavLink to="/" shop={shop} rel="home" end visuallyHidden>
                          Home
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/product-page" shop={shop}>
                          Product pages
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/entire-store" shop={shop}>
                          Entire store
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/bundles" shop={shop}>
                          Bundles
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/brand-ads" shop={shop}>
                          Brand ads
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/credits" shop={shop}>
                          Credits
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/faq" shop={shop}>
                          FAQs
                        </EmbeddedNavLink>
                        <EmbeddedNavLink to="/preferences" shop={shop}>
                          Preferences
                        </EmbeddedNavLink>
                      </s-app-nav>
                    )}
                    <Outlet context={outletCtx} />
                    <InsufficientCreditsModal />
                  </>
                )}
              </CreditsProvider>
            )}

          </DashboardDataProvider>
        </PagesProvider>
      </PolarisAppProvider>
    </AppProvider>
    </PosthogIdentityProvider>
  );
}

export default function App() {
  const { apiKey, crispWebsiteId, shop } = useLoaderData();

  return (
    <AppContent
      apiKey={apiKey}
      crispWebsiteId={crispWebsiteId}
      shop={shop}
    />
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};