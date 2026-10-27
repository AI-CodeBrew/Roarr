import { useEffect, useState } from "react";
import { Check, LoaderCircle, ScanSearch } from "lucide-react";
import { GradientText, StepFrame, StepHeader } from "./OnboardingUI";
import { Armchair, FloorLamp, Line, Plant } from "../../routes/root.dashboard/ShowcaseArt.jsx";

const SCAN_DURATION_MS = 5000;

/** Each check completes after its share of the scan (4 checks → every 25%). */
const SCAN_CHECKS = [
  "Visual merchandising patterns",
  "Copy style & conversion language",
  "Structure opportunities across your catalog",
  "Personalization blueprint for your store",
];

/** Storefront wireframe with a scan beam sweeping over it. Decorative only. */
function ScanVisual({ isComplete }) {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[270px] select-none">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center gap-1 bg-slate-700 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <Line className="w-12" />
          <div className="flex gap-1.5">
            <Line className="w-6" />
            <Line className="w-6" />
            <Line className="w-6" />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_96px] items-center bg-[#f4f2ef]">
          <div className="space-y-1.5 px-3.5 py-4">
            <p className="m-0 text-[12px] font-semibold leading-tight text-slate-800">
              Your store,
              <br />
              reimagined
            </p>
            <span className="block h-3 w-12 rounded-full bg-[#1e3a8a]" />
          </div>
          <div className="h-[78px] bg-gradient-to-br from-[#ebe7e1] to-[#dcd6ce] p-2">
            <Armchair className="h-full w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3.5">
          <div className="h-12 rounded-md bg-[#f4f2ef] p-1">
            <Armchair fabric="#e5d9c6" shade="#d9cab3" seat="#efe6d8" className="h-full w-full" />
          </div>
          <div className="h-12 rounded-md bg-[#f4f2ef] p-1">
            <FloorLamp className="h-full w-full" />
          </div>
          <div className="h-12 rounded-md bg-[#f4f2ef] p-1">
            <Plant className="h-full w-full" />
          </div>
        </div>
        {isComplete ? (
          <div className="absolute inset-0 bg-[#1e3a8a]/5" />
        ) : (
          <div className="onboarding-scan-beam" />
        )}
      </div>
      <span className="absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1e40af] shadow-md ring-1 ring-black/5">
        {isComplete ? <Check size={13} strokeWidth={3} /> : <ScanSearch size={13} />}
        {isComplete ? "Scan complete" : "Analyzing your store"}
      </span>
    </div>
  );
}

export default function StoreScanStep({ onBack, onNext }) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setProgress(0);
    setIsComplete(false);

    const start = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / SCAN_DURATION_MS) * 100));
      setProgress(pct);
      if (pct >= 100) {
        setIsComplete(true);
        clearInterval(progressTimer);
      }
    }, 80);

    return () => clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => {
      onNext();
    }, 450);
    return () => clearTimeout(timer);
  }, [isComplete, onNext]);

  const checkSize = 100 / SCAN_CHECKS.length;

  return (
    <StepFrame>
      <StepHeader
        title={
          <>
            Let me do a full <GradientText>store scan</GradientText>
          </>
        }
        subtitle="Running a deep scan to personalize your AI output for your brand and catalog."
        step={2}
        completed={1}
        onBack={onBack}
      />

      <div className="mt-6 grid items-center gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6">
        <ScanVisual isComplete={isComplete} />

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="store-scan-orb" aria-hidden />
              <span role="status" aria-live="polite" aria-atomic="true">
                {isComplete
                  ? "Scan complete. AI personalization is ready."
                  : "Scanning your store..."}
              </span>
            </p>
            <span className="text-sm font-bold tabular-nums text-[#1e40af]">{progress}%</span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Store scan progress"
          >
            <div
              className="store-scan-progress-fill h-full rounded-full bg-gradient-to-r from-[#1e40af] via-[#4f46e5] to-[#7c3aed]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ul className="m-0 mt-4 list-none space-y-2.5 p-0">
            {SCAN_CHECKS.map((label, index) => {
              const isDone = progress >= checkSize * (index + 1);
              const isActive = !isDone && progress >= checkSize * index;
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-full transition ${
                      isDone
                        ? "bg-[#1e3a8a] text-white"
                        : isActive
                          ? "bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-200"
                          : "bg-slate-100 text-slate-300"
                    }`}
                  >
                    {isDone ? (
                      <Check size={13} strokeWidth={3} />
                    ) : isActive ? (
                      <LoaderCircle size={13} className="animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={
                      isDone
                        ? "text-slate-700"
                        : isActive
                          ? "font-medium text-slate-900"
                          : "text-slate-400"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </StepFrame>
  );
}
