import { BackButton } from "../RoarrUI.jsx";
import WhatsComingCard from "./WhatsComingCard";

export { BackButton, GradientText, PrimaryButton, StepFrame } from "../RoarrUI.jsx";

/**
 * Step header: back link and a full-width {@link WhatsComingCard} stepper on the top row, then the
 * optional icon tile, headline and subtitle.
 */
export function StepHeader({
  icon: IconComponent,
  title,
  subtitle,
  step,
  completed,
  onBack,
  backDisabled,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="-mt-2 flex items-center gap-3">
        {onBack ? <BackButton onClick={onBack} disabled={backDisabled} /> : null}
        <div className="min-w-0 flex-1">
          <WhatsComingCard currentStep={step} completedStep={completed} variant="minimal" />
        </div>
      </div>
      <div className="flex min-w-0 items-start gap-3">
        {IconComponent ? (
          <span className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-[#1e40af] shadow-sm ring-1 ring-blue-100">
            <IconComponent size={22} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[1.4rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.65rem]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
