import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import IntroStep from "./IntroStep";
import BuildTypeStep from "./BuildTypeStep";
import StoreScanStep from "./StoreScanStep";
import MarketPreferencesStep from "./MarketPreferencesStep";
import OnboardingProductFlow from "./OnboardingProductFlow";
import OnboardingStoreFlow from "./OnboardingStoreFlow";

import "./Onboarding.css";

import { usePostHog } from "posthog-js/react";
import { CreditWalletWidget } from "../CreditWalletWidget.jsx";
import { syncPosthogMarketType } from "../../lib/posthogMarketType";

export default function Onboarding({ onComplete, shop, locales: localesProp = [] }) {
  const [searchParams] = useSearchParams();
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showBuildTypeSelection, setShowBuildTypeSelection] = useState(false);
  const [showStoreScanStep, setShowStoreScanStep] = useState(false);
  const [showMarketPreferencesStep, setShowMarketPreferencesStep] = useState(false);
  const [marketPreferences, setMarketPreferences] = useState(null);
  const stepHeadingRef = useRef(null);

  const [activeOnboardingFlow, setActiveOnboardingFlow] = useState(null);

  const posthog = usePostHog();

  // Resume entire-store onboarding after "View credit packs" → buy → back.
  useEffect(() => {
    try {
      const resume = sessionStorage.getItem("roarr:resumeOnboardingStore") === "1";
      const pageId =
        searchParams.get("pageId") ||
        sessionStorage.getItem("roarr:onboardingStorePageId");
      if (resume || (pageId && searchParams.get("entireStore") === "1")) {
        sessionStorage.removeItem("roarr:resumeOnboardingStore");
        setActiveOnboardingFlow("store");
      }
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    if (!posthog || !posthog.__loaded) return;
    posthog.capture('page_viewed', {
      page_name: 'onboarding',
      page_path: '/',
    })
  }, [posthog, posthog.__loaded]);

  const enableAppEmbed = () => {
    // Enable app embed silently in the background (fire and forget)
    fetch("/api/enable-app-embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).catch((error) => {
      console.error("Error enabling app embed:", error);
    });
  };

  const handleStartBuildTypeSelection = () => {

    if (posthog && posthog.__loaded) {
      posthog.capture('onboarding_step_completed', {
        step_number: 1,
        step_name: 'permissions_granted',
      });
    }

    enableAppEmbed()
    setActiveOnboardingFlow(null);
    setShowStoreScanStep(true);
  };

  const handleChooseBuildType = (buildType) => {
    console.log('handleChooseBuildType', buildType);
    if (posthog && posthog.__loaded) {
      posthog.capture('onboarding_step_completed', {
        step_number: 3,
        step_name: `${buildType}_flow_selected`,
      });
    }

    setActiveOnboardingFlow(buildType);
    setShowBuildTypeSelection(false);
    setShowStoreScanStep(false);
    setShowProductSelection(false);
  };

  const activeStep =
    activeOnboardingFlow ??
    (showBuildTypeSelection
      ? "buildType"
      : showMarketPreferencesStep
        ? "marketPreferences"
        : showStoreScanStep
          ? "storeScan"
          : "intro");
  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [activeStep]);

  const handleBackFromFlow = () => {
    if (posthog && posthog.__loaded) {
      posthog.capture('onboarding_step_back', {
        step_number: 4,
        step_name: `${activeOnboardingFlow}_configuration`,
      });
    }
    setActiveOnboardingFlow(null);
    setShowBuildTypeSelection(true);
  };

  if (activeOnboardingFlow === "store") {
    return (
      <OnboardingStoreFlow
        onBack={handleBackFromFlow}
        onComplete={onComplete}
        initialMarketPreferences={marketPreferences}
      />
    );
  }

  if (activeOnboardingFlow === "product") {
    return (
      <OnboardingProductFlow
        onBack={handleBackFromFlow}
        onComplete={onComplete}
      />
    );
  }

  return (
    <s-page heading="Roarr - Onboarding" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" usage={false} />
      <div className="roarr-theme flex justify-center px-3 pb-8 md:px-4 md:pb-6">
        <div className="w-full max-w-[1100px]">
          <div
            key={activeStep}
            ref={stepHeadingRef}
            tabIndex={-1}
            className="onboarding-step-enter outline-none"
          >
          {/* Initial onboarding content */}
          {!showBuildTypeSelection &&
            !showStoreScanStep &&
            !showMarketPreferencesStep &&
            !showProductSelection && (
            <IntroStep onStart={handleStartBuildTypeSelection} />
          )}

          {showBuildTypeSelection &&
            !showStoreScanStep &&
            !showMarketPreferencesStep &&
            !showProductSelection && (
            <BuildTypeStep
              onChooseType={handleChooseBuildType}
              onBack={() => {
                if (posthog && posthog.__loaded) {
                  posthog.capture('onboarding_step_back', {
                    step_number: 3,
                    step_name: 'build_type_back',
                  });
                }
                setShowBuildTypeSelection(false);
                setShowMarketPreferencesStep(true);
              }}
            />
          )}

          {showMarketPreferencesStep &&
            !showBuildTypeSelection &&
            !showStoreScanStep &&
            !showProductSelection && (
            <MarketPreferencesStep
              shopLocales={localesProp}
              initialPreferences={marketPreferences}
              onBack={() => {
                if (posthog && posthog.__loaded) {
                  posthog.capture('onboarding_step_back', {
                    step_number: 2,
                    step_name: 'market_preferences_back',
                  });
                }
                setShowMarketPreferencesStep(false);
                setShowStoreScanStep(true);
              }}
              onNext={(prefs) => {
                const marketType =
                  prefs?.market_type || prefs?.marketType || null;
                syncPosthogMarketType(posthog, marketType);
                if (posthog && posthog.__loaded) {
                  posthog.capture('onboarding_step_completed', {
                    step_number: 3,
                    step_name: 'market_preferences_saved',
                    market_type: marketType,
                  });
                }
                setMarketPreferences(prefs);
                setShowMarketPreferencesStep(false);
                setShowBuildTypeSelection(true);
              }}
            />
          )}

          {showStoreScanStep && !showProductSelection && !showMarketPreferencesStep && (
            <StoreScanStep
              onBack={() => {
                if (posthog && posthog.__loaded) {
                  posthog.capture('onboarding_step_back', {
                    step_number: 2,
                    step_name: 'store_scan_back',
                  });
                }
                setShowStoreScanStep(false);
              }}
              onNext={() => {
                if (posthog && posthog.__loaded) {
                  posthog.capture('onboarding_step_completed', {
                    step_number: 2,
                    step_name: 'store_scan_completed',
                  });
                }
                setShowStoreScanStep(false);
                setShowMarketPreferencesStep(true);
              }}
            />
          )}

          </div>
        </div>
      </div>
    </s-page>
  );
}

