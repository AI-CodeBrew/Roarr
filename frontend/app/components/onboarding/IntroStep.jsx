import { ArrowRight, Gift, ShieldCheck, Timer } from "lucide-react";
import WhatsComingCard from "./WhatsComingCard";
import { GradientText, PrimaryButton, StepFrame } from "./OnboardingUI";
import { HeroShowcase } from "../../routes/root.dashboard/ShowcaseArt.jsx";
import RoarrLionMark from "../RoarrLionMark.jsx";

const PERKS = [
  { icon: ShieldCheck, label: "Your live theme & store stay untouched" },
  { icon: Gift, label: "First page is free" },
  { icon: Timer, label: "Ready in about 4 minutes" },
];

export default function IntroStep({ onStart }) {
  return (
    <StepFrame>
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-3 text-xs font-semibold text-[#1e40af] ring-1 ring-inset ring-blue-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-blue-100">
              <RoarrLionMark size={22} strokeWidth={6} />
            </span>
            Welcome to Roarr
            <span aria-hidden>👋</span>
          </span>

          <h1
            className="mt-4 font-bold leading-[1.12] tracking-tight text-slate-900"
            style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)" }}
          >
            You are minutes away from a store that <GradientText>actually converts.</GradientText>
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-slate-600">
            In about 4 minutes, you'll have a store that works harder for you. Install and try
            freely — nothing changes on your live store until you say so.
          </p>

          <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            {PERKS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70"
              >
                <Icon size={14} className="text-[#1e40af]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PrimaryButton onClick={onStart} className="w-full sm:w-auto">
              Let's get started
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </PrimaryButton>
            <p className="m-0 text-xs text-slate-500">
              No charges on your Shopify bill for the first page —{" "}
              <span className="font-semibold text-slate-800">it's on us!</span>
            </p>
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <div className="onboarding-float w-[330px]">
            <HeroShowcase />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-blue-100 pt-5">
        <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          What's coming
        </p>
        <WhatsComingCard currentStep={1} completedStep={0} />
      </div>
    </StepFrame>
  );
}
