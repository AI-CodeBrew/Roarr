import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";
import FlowChoiceCards from "./FlowChoiceCards.jsx";

/**
 * Download the code behind both build flows once the dashboard is idle, so clicking a card opens the
 * page straight away instead of waiting on the route and its flow chunk.
 */
function warmBuildFlowChunks() {
  void import("../_app.generate_pdp/ProductPageHubRoute.jsx");
  void import("../_app.generate_pdp/product-page/ProductFlow.jsx");
  void import("../_app.generate_store/EntireStoreHubRoute.jsx");
  void import("../_app.generate_store/store/StoreFlow.jsx");
}

export default function DashboardBuildFlows() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warmBuildFlowChunks, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warmBuildFlowChunks, 1500);
    return () => window.clearTimeout(id);
  }, []);

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
    <section>
      <FlowChoiceCards onChooseType={handleChooseType} compact />
    </section>
  );
}
