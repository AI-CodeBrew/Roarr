import { Check, ShieldCheck, Star, Truck, Leaf } from "lucide-react";

/** Progress (%) at which each section of the mock page starts building; the next one's start finishes it. */
const SECTIONS = [
  { key: "header", label: "Header and navigation", start: 0 },
  { key: "hero", label: "Hero and product details", start: 25 },
  { key: "benefits", label: "Benefits", start: 55 },
  { key: "reviews", label: "Customer reviews", start: 80 },
];

function sectionState(index, progress, isComplete) {
  if (isComplete) return "done";
  const next = SECTIONS[index + 1];
  if (next && progress >= next.start) return "done";
  return progress >= SECTIONS[index].start ? "active" : "todo";
}

const Bar = ({ className = "" }) => <span className={`block rounded-full bg-slate-200 ${className}`} />;

/** One section of the mock page: wireframe until built, highlighted while the AI is on it. */
function Block({ state, className = "", children, skeleton }) {
  return (
    <div
      className={`relative rounded-lg p-2.5 transition-all duration-500 ${
        state === "active" ? "bg-[#f6f8ff] ring-2 ring-[#4f46e5]" : "ring-1 ring-slate-100"
      } ${className}`}
    >
      {state === "done" ? children : <div className={state === "active" ? "animate-pulse" : ""}>{skeleton}</div>}
    </div>
  );
}

/**
 * Stylised product page that assembles itself as generation progresses. Purely decorative:
 * the real status lives in the progress card and pipeline.
 */
export default function ProductPagePreview({ progress, isComplete }) {
  const states = SECTIONS.map((_, index) => sectionState(index, progress, isComplete));
  const activeIndex = states.indexOf("active");
  const caption = isComplete
    ? "Your product page is ready"
    : activeIndex >= 0
      ? `Building: ${SECTIONS[activeIndex].label}`
      : "Getting started";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <p className="m-0 px-4 pb-2.5 pt-3.5 text-[15px] font-bold tracking-tight text-slate-900">Your product page</p>

      <div className="mx-4 flex-1 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
          <span className="flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </span>
          <span className="flex-1 truncate rounded-md bg-white px-2 py-0.5 text-center text-[10px] text-slate-400 ring-1 ring-slate-100">
            yourstore.com/products/your-product
          </span>
        </div>

        <div className="space-y-2 p-2.5">
          <Block
            state={states[0]}
            skeleton={
              <div className="flex items-center justify-between">
                <Bar className="h-2.5 w-14" />
                <div className="flex gap-2">
                  <Bar className="h-1.5 w-7" />
                  <Bar className="h-1.5 w-7" />
                  <Bar className="h-1.5 w-7" />
                </div>
              </div>
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-tight text-[#1e3a8a]">YOURSTORE</span>
              <div className="flex gap-2.5 text-[9px] font-medium text-slate-500">
                <span>Shop</span>
                <span>About</span>
                <span>Contact</span>
              </div>
            </div>
          </Block>

          <Block
            state={states[1]}
            skeleton={
              <div className="grid grid-cols-[1fr_1fr] gap-2.5">
                <div className="h-24 rounded-md bg-slate-100" />
                <div className="space-y-1.5 pt-1">
                  <Bar className="h-2 w-4/5" />
                  <Bar className="h-1.5 w-2/5" />
                  <Bar className="h-2.5 w-1/3" />
                  <Bar className="mt-2 h-5 w-full rounded-md" />
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-[1fr_1fr] gap-2.5">
              <div className="flex h-24 items-end justify-center rounded-md bg-gradient-to-br from-[#eef3ff] to-[#dbe4ff] pb-2">
                <span className="relative block h-16 w-7 rounded-t-md rounded-b-lg bg-gradient-to-b from-[#1e40af] to-[#4f46e5] shadow-md">
                  <span className="absolute -top-2 left-1/2 h-2.5 w-3 -translate-x-1/2 rounded-t bg-[#1e3a8a]" />
                  <span className="absolute inset-x-1 top-5 h-4 rounded-sm bg-white/80" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-bold leading-tight text-slate-900">Your product name</p>
                <div className="mt-1 flex items-center gap-0.5 text-amber-400" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={9} fill="currentColor" strokeWidth={0} />
                  ))}
                  <span className="ml-1 text-[9px] text-slate-400">4.9</span>
                </div>
                <p className="m-0 mt-1 text-[12px] font-bold text-slate-900">$49.00</p>
                <span className="mt-1.5 flex h-5 items-center justify-center rounded-md bg-[#1e3a8a] text-[9px] font-semibold text-white">
                  Add to cart
                </span>
              </div>
            </div>
          </Block>

          <Block
            state={states[2]}
            skeleton={
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <span className="block h-5 w-5 rounded-full bg-slate-100" />
                    <Bar className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Leaf, label: "Natural" },
                { icon: ShieldCheck, label: "Guaranteed" },
                { icon: Truck, label: "Fast shipping" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef3ff] text-[#1e40af]">
                    <Icon size={12} aria-hidden />
                  </span>
                  <span className="text-[9px] font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block
            state={states[3]}
            skeleton={
              <div className="space-y-1.5">
                <Bar className="h-1.5 w-full" />
                <Bar className="h-1.5 w-5/6" />
                <Bar className="h-1.5 w-1/3" />
              </div>
            }
          >
            <div className="flex items-center gap-0.5 text-amber-400" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={9} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="m-0 mt-1 text-[10px] leading-snug text-slate-600">
              “Exactly what I was looking for. Quality is outstanding and it arrived fast.”
            </p>
            <p className="m-0 mt-1 text-[9px] font-semibold text-slate-400">Verified buyer</p>
          </Block>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-slate-700" aria-live="polite">
        {isComplete ? (
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-white">
            <Check size={12} strokeWidth={3} />
          </span>
        ) : (
          <span className="h-2 w-2 flex-none animate-pulse rounded-full bg-[#4f46e5]" aria-hidden />
        )}
        <span className="truncate">{caption}</span>
      </div>
    </div>
  );
}
