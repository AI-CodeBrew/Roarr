import {
  Check,
  LayoutGrid,
  Palette,
  Rocket,
  ScanSearch,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const TIMELINE_STEPS = [
  { step: 1, title: "Welcome", sub: "You're here!", icon: Sparkles },
  { step: 2, title: "Scan & market", sub: "30 sec", icon: ScanSearch },
  { step: 3, title: "What to build", sub: "30 sec", icon: LayoutGrid },
  { step: 4, title: "Pick your style", sub: "1 min", icon: Palette },
  { step: 5, title: "Watch it build", sub: "The fun part", icon: WandSparkles, highlight: true },
  { step: 6, title: "Go live", sub: "Free to start", icon: Rocket },
];

const STATE_LABEL = { complete: "completed", active: "current", upcoming: "upcoming" };

/**
 * Onboarding progress. `full` = welcome-screen journey strip with icons; `minimal` = compact
 * stepper for step headers that only spells out the current step.
 */
export default function WhatsComingCard({ currentStep = 1, completedStep, variant = "full" }) {
  const totalSteps = TIMELINE_STEPS.length;
  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const clampedCompletedStep = Math.min(
    Math.max(completedStep ?? Math.max(clampedStep - 1, 0), 0),
    totalSteps,
  );

  const stateOf = (stepNumber) => {
    if (stepNumber <= clampedCompletedStep) return "complete";
    if (stepNumber === clampedStep) return "active";
    return "upcoming";
  };

  if (variant === "minimal") {
    return (
      <ol
        aria-label="Onboarding progress"
        className="m-0 flex w-full list-none items-center gap-1 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-slate-200/70 sm:gap-1.5"
      >
        {TIMELINE_STEPS.map((item, index) => {
          const state = stateOf(item.step);
          return (
            <li
              key={item.step}
              aria-current={state === "active" ? "step" : undefined}
              className={`flex items-center gap-1 sm:gap-1.5 ${index > 0 ? "flex-1" : ""}`}
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={`h-px min-w-2 flex-1 ${state === "upcoming" ? "bg-slate-200" : "bg-[#1e3a8a]/40"}`}
                />
              ) : null}
              {state === "active" ? (
                <span className="timeline-step-active inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a] p-0.5 text-xs font-semibold text-white sm:pr-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                    {item.step}
                  </span>
                  <span className="hidden whitespace-nowrap sm:inline">{item.title}</span>
                </span>
              ) : (
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    state === "complete"
                      ? "bg-blue-100 text-[#1e3a8a]"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {state === "complete" ? (
                    <Check size={12} strokeWidth={3} aria-hidden />
                  ) : (
                    item.step
                  )}
                </span>
              )}
              <span className="sr-only">
                Step {item.step}: {item.title}, {STATE_LABEL[state]}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-[8%] right-[8%] top-[18px] hidden border-t-2 border-dashed border-blue-200 md:block"
      />
      <ol className="relative m-0 grid list-none grid-cols-3 gap-x-2 gap-y-4 p-0 md:grid-cols-6">
        {TIMELINE_STEPS.map((item) => {
          const state = stateOf(item.step);
          const Icon = item.icon;
          const isWarning = item.highlight && state === "upcoming";
          let tile = "bg-white text-slate-400 ring-slate-200";
          if (state === "active")
            tile = "timeline-step-active bg-[#1e3a8a] text-white ring-[#1e3a8a]";
          else if (state === "complete") tile = "bg-blue-100 text-[#1e3a8a] ring-blue-200";
          else if (isWarning) tile = "bg-amber-50 text-amber-600 ring-amber-200";

          return (
            <li
              key={item.step}
              aria-current={state === "active" ? "step" : undefined}
              className="relative flex flex-col items-center text-center"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ${tile}`}
              >
                {state === "complete" ? (
                  <Check size={16} strokeWidth={3} aria-hidden />
                ) : (
                  <Icon size={17} aria-hidden />
                )}
              </span>
              <span
                className={`mt-2 text-xs font-semibold ${
                  state === "upcoming" && !isWarning ? "text-slate-600" : "text-slate-900"
                }`}
              >
                {item.title}
              </span>
              <span
                className={`text-[11px] ${
                  isWarning
                    ? "font-medium text-amber-700"
                    : state === "active"
                      ? "font-medium text-[#1e40af]"
                      : "text-slate-500"
                }`}
              >
                {item.sub}
              </span>
              <span className="sr-only">
                Step {item.step}, {STATE_LABEL[state]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
