import { useState } from "react";
import { Box } from "@shopify/polaris";
import { Store } from "lucide-react";
import StoreFlowStructure from "../../routes/_app.generate_store/store/StoreFlowStructure";
import { CreditWalletWidget } from "../CreditWalletWidget.jsx";
import { GradientText, StepFrame, StepHeader } from "./OnboardingUI";

export default function OnboardingStoreFlow({
  onBack,
  onComplete,
  initialMarketPreferences = null,
}) {
  /** Matches {@link WhatsComingCard} steps 4–6 (pick style → build → go live). */
  const [whatsComing, setWhatsComing] = useState({ current: 4, completed: 3 });

  return (
    <s-page heading="Entire Store Experience" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" usage={false} />
      <div className="roarr-theme">
      <Box width="100%">
        <div className="onboarding-step-enter mx-auto max-w-[1150px] px-3 pt-3 md:px-4 md:pt-5">
          <StepFrame compact>
            <StepHeader
              icon={Store}
              title={
                <>
                  Redesign your <GradientText>entire store</GradientText>
                </>
              }
              subtitle="Your entire store designed and branded by AI. Every single page."
              step={whatsComing.current}
              completed={whatsComing.completed}
              onBack={whatsComing.current <= 4 ? onBack : null}
            />
          </StepFrame>
        </div>
      <div style={{ width: "100%", margin: "0px", padding: "0 16px" }}>

        <StoreFlowStructure
          // hideConfigurationHeading
          embedded
          setFlowType={onBack}
          onFlowStepChange={setWhatsComing}
          isOnboarding={true}
          onOnboardingComplete={onComplete}
          initialMarketPreferences={initialMarketPreferences}
        />
      </div>
      </Box>
      </div>
    </s-page>
  );
}
