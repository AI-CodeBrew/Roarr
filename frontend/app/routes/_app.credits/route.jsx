import { useNavigate, useOutletContext, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { usePosthogAfterIdentify } from "../../lib/PosthogIdentityContext";
import { useEffect } from "react";
import { Banner, Box, Button } from "@shopify/polaris";

import { loader } from "./billing.server";
import { usePageTracking } from "../../hooks/usePageTracking";
import { CreditPacks } from "./CreditPacks";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";

export { loader };

export function shouldRevalidate() {
  return false;
}

export default function CreditsPage() {
  const posthog = usePosthogAfterIdentify();
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const midOnboarding = Boolean(outletContext.midOnboarding);

  usePageTracking();

  useEffect(() => {
    if (!posthog) return;
    posthog.capture("credits_page_viewed", { surface: "credits_route" });
  }, [posthog]);

  return (
    <div>
      <div style={{ padding: "16px", maxWidth: "1150px", margin: "0 auto" }}>
        <s-page heading="Credits" inlineSize="large">
          <CreditWalletWidget floating={false} slot="secondary-actions" />
          {midOnboarding ? (
            <Box paddingBlockEnd="400">
              <Banner tone="info" title="Finish setup after purchase">
                <p>
                  Buy any credit pack once to unlock publishing. When you&apos;re done, return to
                  onboarding to push your store to Shopify.
                </p>
                <Box paddingBlockStart="200">
                  <Button
                    variant="primary"
                    onClick={() => {
                      let pageId = null;
                      try {
                        pageId = sessionStorage.getItem("klucky:onboardingStorePageId");
                        sessionStorage.setItem("klucky:resumeOnboardingStore", "1");
                      } catch {
                        /* ignore */
                      }
                      navigate(
                        pageId
                          ? `/?pageId=${encodeURIComponent(pageId)}&entireStore=1`
                          : "/",
                      );
                    }}
                  >
                    Back to store setup
                  </Button>
                </Box>
              </Banner>
            </Box>
          ) : null}
          <CreditPacks />
        </s-page>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
