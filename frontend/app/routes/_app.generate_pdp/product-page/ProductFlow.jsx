import ProductFlowStructure from "./ProductFlowStructure";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget";

export default function ProductFlow({
  setFlowType,
  hubPath = "/product-page",
}) {
  return (
    <s-page heading="Product pages" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <div className="roarr-theme" style={{ width: "100%", margin: "0px", padding: "0 16px" }}>
        <ProductFlowStructure
          setFlowType={setFlowType}
          hubPath={hubPath}
        />
      </div>
    </s-page>
  );
}
