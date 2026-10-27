import { useState } from "react";
import { Box } from "@shopify/polaris";
import { Copy } from "lucide-react";
import ProductFlowStructure from "../../routes/_app.generate_pdp/product-page/ProductFlowStructure";
import { CreditWalletWidget } from "../CreditWalletWidget.jsx";
import { GradientText, StepFrame, StepHeader } from "./OnboardingUI";

export default function OnboardingProductFlow({ onBack, onComplete }) {
  /** Matches {@link WhatsComingCard} steps 4–6 (pick style → build → go live). */
  const [whatsComing, setWhatsComing] = useState({ current: 4, completed: 3 });

  return (
    <s-page heading="Product Page Experience" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" usage={false} />
      <div className="roarr-theme">
      <Box width="100%">
        <div className="onboarding-step-enter mx-auto max-w-[1150px] px-3 pt-3 md:px-4 md:pt-5">
          <StepFrame compact>
            <StepHeader
              icon={Copy}
              title={
                <>
                  Configure your <GradientText>product page</GradientText>
                </>
              }
              subtitle="Pick your source, select a product, choose a template, and hit start."
              step={whatsComing.current}
              completed={whatsComing.completed}
              onBack={whatsComing.current <= 4 ? onBack : null}
            />
          </StepFrame>
        </div>
      <div style={{ width: "100%", margin: "0px", padding: "0 16px" }}>
        <ProductFlowStructure
          setFlowType={onBack}
          embedded
          onFlowStepChange={setWhatsComing}
          isOnboarding={true}
          onOnboardingComplete={onComplete}
        />
        </div>
      </Box>
      </div>
    </s-page>
  );
}
