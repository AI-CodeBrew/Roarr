import StoreFlowStructure from "./StoreFlowStructure";
import { CreditWalletWidget } from "../../../components/CreditWalletWidget";

export default function StoreFlow({ hubPath = "/entire-store", setFlowType }) {
  return (
    <s-page heading="Entire Store Experience" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          margin: 0,
          padding: "0 clamp(12px, 4vw, 16px)",
          boxSizing: "border-box",
        }}
      >
        <StoreFlowStructure hubPath={hubPath} setFlowType={setFlowType} />
      </div>
    </s-page>
  );
}
