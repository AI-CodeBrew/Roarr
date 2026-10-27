import { Check, ExternalLink } from "lucide-react";

const PILL =
  "inline-flex h-9 items-center gap-2 rounded-full bg-white pl-1.5 pr-3.5 text-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-slate-200/80";

function SetupStatus({ setup }) {
  const complete = setup.state === "complete";
  const checking = setup.state === "checking";
  return (
    <span
      className={PILL}
      title={complete ? "Roarr is ready to use" : `${setup.completed} of ${setup.total} steps done`}
    >
      {complete ? (
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : (
        <span
          className={`flex h-6 min-w-6 flex-none items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#1e3a8a] ring-2 ring-inset ring-blue-200 ${checking ? "animate-pulse" : ""}`}
        >
          {checking ? "" : `${setup.completed}/${setup.total}`}
        </span>
      )}
      <span className="font-semibold text-slate-900">
        {complete ? "Setup complete" : checking ? "Checking setup…" : "Finish setup"}
      </span>
    </span>
  );
}

const EMBED_STYLE = {
  on: { circle: "bg-emerald-600 text-white", text: "text-emerald-700" },
  attention: { circle: "bg-amber-500 text-white", text: "text-amber-700" },
  pending: { circle: "bg-slate-200 text-slate-400 animate-pulse", text: "text-slate-500" },
};

function ThemeExtensionStatus({ embed }) {
  const style = EMBED_STYLE[embed.variant] || EMBED_STYLE.pending;
  return (
    <button
      type="button"
      onClick={embed.onClick}
      aria-label="App embed status and instructions"
      className={`${PILL} transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]`}
    >
      <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${style.circle}`}>
        {embed.variant === "attention" ? (
          <span className="text-xs font-bold leading-none">!</span>
        ) : (
          <Check size={13} strokeWidth={3} />
        )}
      </span>
      <span className="font-semibold text-slate-900">Theme extension</span>
      <span className={`font-medium ${style.text}`}>{embed.label}</span>
    </button>
  );
}

/**
 * Dashboard hero: headline, setup + theme extension status.
 * @param {{
 *   storeName: string | null,
 *   setup: { state: "checking" | "complete" | "incomplete", completed: number, total: number },
 *   embed: { variant: string, label: string, onClick: () => void },
 *   onManageTheme: () => void,
 * }} props
 */
export default function DashboardHero({ storeName, setup, embed, onManageTheme }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f6f8ff] via-[#eef3ff] to-[#e1e9ff] ring-1 ring-blue-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl"
      />

      <div className="relative p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold font-['Plus_Jakarta_Sans',sans-serif] text-[#1e40af] ring-1 ring-inset ring-blue-200">
            Welcome back{storeName ? `, ${storeName}` : ""}
          </span>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <SetupStatus setup={setup} />
            <ThemeExtensionStatus embed={embed} />
            <button
              type="button"
              onClick={onManageTheme}
              aria-label="Manage Theme Extension"
              title="Manage Theme Extension"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1e3a8a] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#172554] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
            >
              Manage
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        <h1
          className="mt-2 font-extrabold leading-[1.15] tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]"
          style={{ fontSize: "clamp(1.4rem, 2.3vw, 1.65rem)" }}
        >
          Your store, ready in <span className="text-[#1e40af]">a few clicks</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600 font-['Plus_Jakarta_Sans',sans-serif]">
          Pick a template, let AI do the work, and go live in minutes.
        </p>
      </div>
    </section>
  );
}
