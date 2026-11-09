import { Check, ChevronDown, Globe, Minus, Plus, Store } from "lucide-react";
import { BackButton, StepFrame } from "../../../components/RoarrUI.jsx";

/**
 * Layout pieces for the entire-store configure step, styled like the onboarding steps:
 * blue frame with back button + pill stepper on top, then simple white section cards.
 * Presentation only. All state and handlers stay in StoreFlowStructure.
 */

const PRODUCT_IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f1f5f9'/%3E%3C/svg%3E";

function productImageUrl(product) {
  return (
    product?.featuredImage?.url ||
    product?.images?.edges?.[0]?.node?.url ||
    PRODUCT_IMAGE_FALLBACK
  );
}

const STATE_LABEL = { complete: "completed", active: "current", upcoming: "upcoming" };

/** Pill stepper like the onboarding one. `steps`: [{ label, state: complete | active | upcoming }]. */
export function ConfigureStepper({ steps }) {
  return (
    <ol
      aria-label="Store setup progress"
      className="m-0 flex w-full list-none items-center gap-1.5 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-slate-200/70"
    >
      {steps.map((item, index) => (
        <li
          key={item.label}
          aria-current={item.state === "active" ? "step" : undefined}
          className={`flex items-center gap-1.5 ${index > 0 ? "flex-auto" : ""}`}
        >
          {index > 0 ? (
            <span
              aria-hidden
              className={`h-px min-w-2 flex-1 ${item.state === "upcoming" ? "bg-slate-200" : "bg-[#1e3a8a]/40"}`}
            />
          ) : null}
          {item.state === "active" ? (
            <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-[#1e3a8a] p-0.5 pr-2.5 text-xs font-semibold text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                {index + 1}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          ) : (
            <span className="inline-flex flex-none items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  item.state === "complete" ? "bg-blue-100 text-[#1e3a8a]" : "bg-slate-100 text-slate-400"
                }`}
              >
                {item.state === "complete" ? <Check size={12} strokeWidth={3} aria-hidden /> : index + 1}
              </span>
              <span
                className={`hidden whitespace-nowrap pr-1 text-xs font-medium md:inline ${
                  item.state === "complete" ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </span>
          )}
          <span className="sr-only">
            Step {index + 1}: {item.label}, {STATE_LABEL[item.state]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Page header: back + stepper on top, then icon tile, title and subtitle; `aside` sits on the right. */
export function ConfigureHero({ title, subtitle, backLabel = "Back", onBack, steps, aside }) {
  return (
    <div style={{ padding: "12px 0 16px" }}>
      <StepFrame compact>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <BackButton onClick={onBack} label={backLabel} />
            <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
              <ConfigureStepper steps={steps} />
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-[#1e40af] shadow-sm ring-1 ring-blue-100">
                <Store size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="m-0 text-[1.4rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.65rem]">
                  {title}
                </h1>
                {subtitle ? <p className="m-0 mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
              </div>
            </div>
            {aside}
          </div>
        </div>
      </StepFrame>
    </div>
  );
}

/** Preferences card: one row per setting with a green tick, plus Edit and a missing-preferences warning. */
export function PreferencesSummary({ items, missing = false, editAction }) {
  return (
    <section
      aria-label="Your preferences"
      className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
          <Globe size={16} aria-hidden className="text-[#1e40af]" />
          Your preferences
        </h3>
        {editAction}
      </div>
      <ul className="m-0 mt-3 flex flex-1 list-none flex-col p-0">
        {items.map(({ label, value }) => {
          const empty = !value || value === "—";
          return (
            <li key={label} className="flex flex-1 items-center gap-3 border-t border-slate-100 py-2">
              <span
                aria-hidden
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${
                  empty ? "bg-slate-100 text-slate-400" : "bg-emerald-500 text-white"
                }`}
              >
                {empty ? <Minus size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />}
              </span>
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <span className="text-[13px] text-slate-500">{label}</span>
                <span className={`truncate text-sm font-semibold ${empty ? "text-slate-400" : "text-slate-800"}`}>
                  {empty ? "Not set" : value}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {missing ? (
        <p className="m-0 mt-3 text-xs text-red-700">
          Missing preferences — set them in Preferences to continue.
        </p>
      ) : null}
    </section>
  );
}

/**
 * White section card. `marker` is the step number or an icon element; `done` swaps it for a check.
 * Passing `onToggle` makes the header a disclosure button.
 */
export function ConfigureSection({
  marker,
  done = false,
  title,
  tag,
  description,
  actions,
  headerExtra,
  expanded,
  onToggle,
  children,
}) {
  const heading = (
    <div className={`flex min-w-0 items-start gap-3 ${onToggle ? "flex-1" : "w-full sm:w-auto sm:flex-1"}`}>
      <span
        aria-hidden
        className={`mt-px flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-[#1e3a8a] text-white" : "bg-blue-50 text-[#1e3a8a] ring-1 ring-inset ring-blue-100"
        }`}
      >
        {done ? <Check size={14} strokeWidth={3} /> : marker}
      </span>
      <div className="min-w-0">
        <h3 className="m-0 flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
          {title}
          {tag ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{tag}</span>
          ) : null}
        </h3>
        {description ? (
          <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
      {onToggle ? (
        <button
          type="button"
          aria-expanded={Boolean(expanded)}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 rounded-xl border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
        >
          {heading}
          <span className="flex flex-none items-center gap-3">
            {headerExtra}
            <ChevronDown
              size={18}
              aria-hidden
              className={`text-slate-500 transition ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          {heading}
          {actions ? <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}
      {children ? <div className={onToggle ? "mt-5 border-t border-slate-100 pt-5" : "mt-4"}>{children}</div> : null}
    </section>
  );
}

/** Store-type option card (toggle button semantics). */
export function StoreTypeOption({ title, description, meta, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-w-0 items-center gap-4 rounded-xl border-0 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] ${
        selected ? "bg-blue-50/60 ring-2 ring-[#1e40af]" : "bg-white ring-1 ring-slate-200 hover:ring-blue-300"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${
          selected ? "bg-[#1e40af] text-white" : "bg-white ring-1 ring-inset ring-slate-300"
        }`}
      >
        {selected ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{description}</span>
      </span>
      {meta ? (
        <span className="flex-none whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {meta}
        </span>
      ) : null}
    </button>
  );
}

/** Product slots: filled slots show the product, empty ones are dashed. Any slot opens the picker. */
export function ProductSlots({ slots, products, onOpen }) {
  const list = Array.isArray(products) ? products : [];
  const items = Array.from({ length: slots }, (_, i) => list[i] || null);
  const multi = slots > 1;
  return (
    <div className={`grid gap-3 ${multi ? "sm:grid-cols-3" : "sm:max-w-md"}`}>
      {items.map((product, index) =>
        product ? (
          <button
            key={String(product?.id || index)}
            type="button"
            onClick={onOpen}
            aria-label={`Change products (${product?.title || "selected product"})`}
            className="flex min-w-0 items-center gap-3 rounded-xl border-0 bg-white p-2.5 text-left ring-1 ring-slate-200 transition hover:ring-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
          >
            <span className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70">
              <img
                src={productImageUrl(product)}
                alt={product?.title || "Selected product"}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-slate-400">{multi ? `Product ${index + 1}` : "Selected product"}</span>
              <span className="block truncate text-sm font-medium text-slate-800">
                {product?.title || "Product selected"}
              </span>
            </span>
          </button>
        ) : (
          <button
            key={`empty-${index}`}
            type="button"
            onClick={onOpen}
            className="flex min-h-[70px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-[13px] font-medium text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-[#1e3a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
          >
            <Plus size={16} aria-hidden />
            {multi ? `Add product ${index + 1}` : "Select a product"}
          </button>
        ),
      )}
    </div>
  );
}

/** Small bold label with an optional muted hint, used above fields inside a section. */
export function FieldLabel({ icon: IconComponent, title, hint }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-800">
        {IconComponent ? <IconComponent size={14} aria-hidden className="text-slate-500" /> : null}
        {title}
      </span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

/** Current accent + heading font, shown in the collapsed fine-tune header. */
export function StyleSummary({ color, headingFont }) {
  return (
    <span className="hidden items-center gap-2 text-xs text-slate-500 sm:inline-flex">
      <span className="h-4 w-4 flex-none rounded-full ring-1 ring-black/10" style={{ background: color }} />
      <span style={{ fontFamily: `"${headingFont}", serif` }}>{headingFont}</span>
    </span>
  );
}

/** Select-style activator for the manual font popovers. */
export function FontPickerButton({ label, font, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border-0 bg-white px-3.5 py-2.5 text-left shadow-sm ring-1 ring-inset ring-slate-200 transition hover:ring-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
    >
      <span className="min-w-0">
        <span className="block text-xs text-slate-400">{label}</span>
        <span className="block truncate text-sm text-slate-800" style={{ fontFamily: `"${font}", sans-serif` }}>
          {font}
        </span>
      </span>
      <ChevronDown size={16} aria-hidden className="flex-none text-slate-500" />
    </button>
  );
}

/** Font list shown inside the manual font popovers. */
export function FontOptionList({ fonts, value, onSelect }) {
  return (
    <div className="max-h-[280px] w-[240px] overflow-y-auto p-2">
      {fonts.map((font) => {
        const active = value === font;
        return (
          <button
            key={font}
            type="button"
            onClick={() => onSelect(font)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border-0 px-3 py-2.5 text-left text-sm transition ${
              active ? "bg-blue-50 text-[#1e3a8a]" : "bg-transparent text-slate-800 hover:bg-slate-50"
            }`}
            style={{ fontFamily: `"${font}", sans-serif` }}
          >
            <span className="truncate">{font}</span>
            {active ? <Check size={14} aria-hidden className="flex-none" /> : null}
          </button>
        );
      })}
    </div>
  );
}
