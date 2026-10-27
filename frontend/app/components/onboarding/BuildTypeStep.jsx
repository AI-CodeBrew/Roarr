import FlowChoiceCards from "../../routes/root.dashboard/FlowChoiceCards.jsx";
import { GradientText, StepFrame, StepHeader } from "./OnboardingUI";

export default function BuildTypeStep({ onChooseType, onBack }) {
  return (
    <StepFrame>
      <StepHeader
        title={
          <>
            What do you want to <GradientText>build today?</GradientText>
          </>
        }
        subtitle="Pick one to get started. You can always do the other one right after."
        step={3}
        completed={2}
        onBack={onBack}
      />
      <div className="mt-6">
        <FlowChoiceCards onChooseType={onChooseType} />
      </div>
    </StepFrame>
  );
}
