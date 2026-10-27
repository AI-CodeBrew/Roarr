import { ArrowLeft, Check, LoaderCircle } from "lucide-react";

/**
 * Shared Roarr design primitives (Tailwind). Reused across hub pages, onboarding and the
 * generate flows so the redesigned screens share one look: navy actions, soft blue panels,
 * pills for statuses, chips for counts.
 */

/** Soft blue gradient panel with blurred glow blobs; `compact` trims the padding for headers. */
export function StepFrame({ children, compact = false, className = "" }) {
  return (
    <section
      className={`relative rounded-3xl bg-gradient-to-br from-[#f6f8ff] via-[#eef3ff] to-[#e1e9ff] ring-1 ring-blue-100 ${className}`}
    >
      {/* Blobs live in their own clipped layer so dropdowns inside the panel are never cut off. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
      </div>
      <div className={`relative ${compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}`}>{children}</div>
    </section>
  );
}

/** Blue → violet highlight for the key words of a headline. */
export function GradientText({ children }) {
  return (
    <span className="bg-gradient-to-r from-[#1e40af] via-[#4f46e5] to-[#7c3aed] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function BackButton({ onClick, disabled = false, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label === "Back" ? "Go back" : label}
      className="inline-flex flex-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-[#1e3a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

/** Padding per button size; kept separate because Tailwind runs with `important: true`. */
const BUTTON_SIZE = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
};

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  size = "md",
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(30,58,138,0.7)] transition hover:bg-[#172554] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 ${
        loading ? "cursor-wait opacity-90" : "disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      } ${BUTTON_SIZE[size] || BUTTON_SIZE.md} ${className}`}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  size = "md",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-white font-semibold text-[#1e3a8a] shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-50 ${size === "sm" ? "px-3 py-2 text-[13px]" : "px-4 py-2 text-sm"} ${className}`}
    >
      {children}
    </button>
  );
}

/** Sticky flow page header: back link, gradient title and subtitle in a compact blue frame. */
export function FlowPageHeader({ title, subtitle, backLabel = "Back", onBack, primaryAction }) {
  return (
    <div
      className="generate-flow-sticky-page-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "#f2f2f2",
        padding: "12px 0 14px",
        marginBottom: 4,
      }}
    >
      <StepFrame compact>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BackButton onClick={onBack} label={backLabel} />
            <span aria-hidden className="hidden h-8 w-px bg-blue-200 sm:block" />
            <div className="min-w-0">
              <h1 className="m-0 text-xl font-bold leading-tight tracking-tight text-slate-900">
                <GradientText>{title}</GradientText>
              </h1>
              {subtitle ? <p className="m-0 mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          {primaryAction ? <div className="flex-none">{primaryAction}</div> : null}
        </div>
      </StepFrame>
    </div>
  );
}

/** Numbered step title used inside the flows (configure, publish). `badge` replaces the number. */
export function StepHeading({ number, badge, title, subtitle, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white shadow-sm">
        {badge ?? number}
      </span>
      <div className="min-w-0">
        <h2 className="m-0 text-lg font-bold leading-tight tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="m-0 mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/** White content card with an optional icon + title row and right-aligned actions. */
export function Panel({ icon: IconComponent, title, description, actions, children, className = "" }) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5 ${className}`}>
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {IconComponent ? (
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-100">
                <IconComponent size={18} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="m-0 text-[15px] font-semibold tracking-tight text-slate-900">{title}</h3>
              ) : null}
              {description ? (
                <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-none items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children ? <div className={hasHeader ? "mt-4" : undefined}>{children}</div> : null}
    </section>
  );
}

/** Selectable tile with a check badge (toggle button semantics). */
export function ChoiceCard({
  selected,
  onClick,
  icon: IconComponent,
  title,
  description,
  disabled = false,
  className = "",
  children,
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex min-w-0 flex-col items-start gap-1.5 rounded-xl p-3.5 pr-10 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-55 ${
        selected
          ? "bg-blue-50/70 ring-2 ring-[#1e40af]"
          : "bg-white ring-1 ring-slate-200 hover:ring-blue-300"
      } ${className}`}
    >
      {IconComponent ? (
        <span
          className={`mb-1 flex h-9 w-9 items-center justify-center rounded-xl ${
            selected ? "bg-[#1e3a8a] text-white" : "bg-blue-50 text-[#1e40af]"
          }`}
        >
          <IconComponent size={18} aria-hidden />
        </span>
      ) : null}
      {title ? <span className="block text-sm font-semibold text-slate-900">{title}</span> : null}
      {description ? (
        <span className="block text-xs leading-snug text-slate-500">{description}</span>
      ) : null}
      {children}
      <span
        aria-hidden
        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${
          selected ? "bg-[#1e40af] text-white" : "bg-white ring-1 ring-inset ring-slate-300"
        }`}
      >
        {selected ? <Check size={12} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

const TONES = {
  success: {
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  critical: {
    pill: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  attention: {
    pill: "bg-amber-50 text-amber-800 ring-amber-600/25",
    dot: "bg-amber-500",
  },
  info: {
    pill: "bg-sky-50 text-sky-800 ring-sky-600/20",
    dot: "bg-sky-500",
  },
  neutral: {
    pill: "bg-slate-100 text-slate-700 ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

/** Rounded status label with a leading dot; `pulse` animates the dot for in-progress states. */
export function StatusPill({ tone = "neutral", pulse = false, children }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${t.pill}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {pulse ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${t.dot}`} />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${t.dot}`} />
      </span>
      {children}
    </span>
  );
}

/** Small uppercase tag, e.g. "Free". */
export function TagPill({ children }) {
  return (
    <span className="inline-flex flex-none items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {children}
    </span>
  );
}

/** Count chip for section headers ("Pushed 3"). */
export function StatChip({ label, value, tone = "neutral" }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm ring-1 ring-black/5">
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {label}
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </span>
  );
}

/** Strip HTML from rich-text fields (e.g. Shopify product descriptions) for one-line previews. */
export function toPlainText(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
