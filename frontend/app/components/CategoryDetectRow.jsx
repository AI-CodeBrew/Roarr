import { Select, Spinner } from "@shopify/polaris";
import { Sparkles } from "lucide-react";

/** Category picker + AI auto-detect status for the selected product(s) in the generate flows. */
export default function CategoryDetectRow({
  options,
  value,
  onChange,
  detecting,
  detectedMessage,
  onDetect,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200/70">
      <div className="w-full sm:w-[220px]">
        <Select label="Category" labelHidden options={options} value={value} onChange={onChange} />
      </div>
      {detecting ? (
        <span className="inline-flex items-center gap-2 text-[13px] text-slate-600">
          <Spinner accessibilityLabel="Detecting category" size="small" />
          AI is analyzing your selected product(s)...
        </span>
      ) : detectedMessage ? (
        <span className="inline-flex items-start gap-1.5 text-[13px] font-medium text-[#4338ca]">
          <Sparkles size={14} className="mt-0.5 flex-none" aria-hidden />
          {detectedMessage}
        </span>
      ) : (
        <button
          type="button"
          onClick={onDetect}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1e3a8a] shadow-sm ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
        >
          <Sparkles size={14} aria-hidden />
          Detect using AI
        </button>
      )}
    </div>
  );
}
