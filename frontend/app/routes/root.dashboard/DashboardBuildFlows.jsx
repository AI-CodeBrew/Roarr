import { BlockStack } from "@shopify/polaris";
import { useNavigate, useSearchParams } from "react-router";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";
import FlowChoiceCards from "./FlowChoiceCards.jsx";

/**
 * Same “what do you want to build” two-card layout as onboarding build-type step (no back / progress).
 */
export default function DashboardBuildFlows() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  function handleChooseType(id) {
    if (id === "product") {
      navigate(buildEmbeddedHref("/product-page", searchParams, shop));
      return;
    }
    if (id === "store") {
      navigate(buildEmbeddedHref("/entire-store", searchParams, shop));
    }
  }

  return (
    <BlockStack gap="500">
      <FlowChoiceCards onChooseType={handleChooseType} />
    </BlockStack>
  );
}
