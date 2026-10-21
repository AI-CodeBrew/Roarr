import { boundary } from "@shopify/shopify-app-react-router/server";
import { useRouteError, useSearchParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTracking } from "../../hooks/usePageTracking";
import BrandAdsEntryScreen from "./BrandAdsEntryScreen.jsx";
import BuildDnaScreen from "./BuildDnaScreen.jsx";
import CampaignIdeasScreen from "./CampaignIdeasScreen.jsx";
import GenerateCreativesScreen from "./GenerateCreativesScreen.jsx";
import {
  buildBrandDnaSessionPayloadFromApiResponse,
  campaignIdeaSnapshotToSelectedIdea,
  campaignProductSnapshotToAnchorProduct,
} from "./dnaHelpers.js";

const BRAND_AD_SCREENS = {
  ENTRY: "entry",
  BUILD_DNA: "build-dna",
  CAMPAIGN_IDEAS: "campaign-ideas",
  GENERATE_CREATIVES: "generate-creatives",
};

export default function BrandAdsRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeScreen, setActiveScreen] = useState(BRAND_AD_SCREENS.ENTRY);
  /** Persists Brand DNA + products (+ optional campaign idea) across wizard steps. */
  const [flowSession, setFlowSession] = useState(null);
  const hydratedCampaignFromUrlRef = useRef(null);
  usePageTracking();

  const campaignIdFromUrl = searchParams.get("campaignId");

  const clearCampaignIdFromUrl = useCallback(() => {
    hydratedCampaignFromUrlRef.current = null;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("campaignId");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const goToScreen = (screen) => {
    setActiveScreen(screen);
  };

  const resumeCampaign = useCallback(async (campaignId) => {
    if (!campaignId) return;
    try {
      const [campRes, dnaRes] = await Promise.all([
        fetch(`/api/brand-dna-campaigns?campaignId=${encodeURIComponent(campaignId)}`, {
          credentials: "include",
        }),
        fetch("/api/brand-dna-fetch", { credentials: "include" }),
      ]);
      const campJson = await campRes.json().catch(() => ({}));
      const dnaJson = await dnaRes.json().catch(() => ({}));
      if (!campRes.ok || campJson?.success === false) {
        console.error(campJson?.error || "Failed to load campaign");
        return;
      }
      const campaign = campJson.data;
      if (!campaign || typeof campaign !== "object") return;

      const brandDna =
        dnaRes.ok && dnaJson?.success === true && dnaJson?.data
          ? buildBrandDnaSessionPayloadFromApiResponse(dnaJson)
          : null;

      const product = campaignProductSnapshotToAnchorProduct(campaign.product);
      const idea = campaignIdeaSnapshotToSelectedIdea(campaign.idea);
      const initialCreatives = Array.isArray(campaign.creatives) ? campaign.creatives : [];

      if (!product && initialCreatives.length === 0) {
        console.error("Campaign has no product or creatives");
        return;
      }

      setFlowSession({
        brandDna: brandDna || {},
        campaignAnchorProduct: product || {
          id: null,
          title: "",
          description: "",
          images: [],
        },
        selectedCampaignIdea: idea,
        initialCreatives,
        savedCampaignId: campaign.campaign_id || campaignId,
      });
      hydratedCampaignFromUrlRef.current = String(campaign.campaign_id || campaignId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("campaignId", campaign.campaign_id || campaignId);
        return next;
      }, { replace: true });
      setActiveScreen(BRAND_AD_SCREENS.GENERATE_CREATIVES);
    } catch (e) {
      console.error(e);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (!campaignIdFromUrl) return;
    if (hydratedCampaignFromUrlRef.current === campaignIdFromUrl) return;
    hydratedCampaignFromUrlRef.current = campaignIdFromUrl;
    void resumeCampaign(campaignIdFromUrl);
  }, [campaignIdFromUrl, resumeCampaign]);

  return (
    <>
      {activeScreen === BRAND_AD_SCREENS.ENTRY ? (
        <BrandAdsEntryScreen
          onStart={() => {
            clearCampaignIdFromUrl();
            setFlowSession(null);
            goToScreen(BRAND_AD_SCREENS.BUILD_DNA);
          }}
          onEditCampaign={resumeCampaign}
        />
      ) : null}

      {activeScreen === BRAND_AD_SCREENS.BUILD_DNA ? (
        <BuildDnaScreen
          onBack={() => goToScreen(BRAND_AD_SCREENS.ENTRY)}
          onContinue={({ brandDna }) => {
            setFlowSession((prev) => ({
              ...(prev || {}),
              brandDna,
            }));
            goToScreen(BRAND_AD_SCREENS.CAMPAIGN_IDEAS);
          }}
        />
      ) : null}

      {activeScreen === BRAND_AD_SCREENS.CAMPAIGN_IDEAS ? (
        <CampaignIdeasScreen
          onBack={() => goToScreen(BRAND_AD_SCREENS.BUILD_DNA)}
          brandDna={flowSession?.brandDna}
          onNext={({ idea, product }) => {
            clearCampaignIdFromUrl();
            setFlowSession((prev) => {
              const next = {
                ...(prev || {}),
                selectedCampaignIdea: idea,
                campaignAnchorProduct: product,
              };
              delete next.initialCreatives;
              delete next.savedCampaignId;
              return next;
            });
            goToScreen(BRAND_AD_SCREENS.GENERATE_CREATIVES);
          }}
        />
      ) : null}

      {activeScreen === BRAND_AD_SCREENS.GENERATE_CREATIVES ? (
        <GenerateCreativesScreen
          session={flowSession}
          onBack={() => goToScreen(BRAND_AD_SCREENS.CAMPAIGN_IDEAS)}
          onRestart={() => {
            clearCampaignIdFromUrl();
            setFlowSession(null);
            goToScreen(BRAND_AD_SCREENS.ENTRY);
          }}
        />
      ) : null}
    </>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
