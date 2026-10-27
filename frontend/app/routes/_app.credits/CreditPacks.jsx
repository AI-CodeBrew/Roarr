/**
 * Credit-pack picker section for the credits page.
 *
 * Renders three pack cards (Starter / Value / Growth), activity ledger,
 * and a callout explaining the credit model.
 * Clicking a pack:
 *   1. POSTs to /api/credits/purchase-pack
 *   2. Receives a Shopify confirmation_url
 *   3. Breaks out of the embedded iframe to that URL via App Bridge.
 *
 * After approval Shopify redirects to /credits/callback?charge_id=...
 * which calls /api/credits/confirm-pack to grant credits.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { DataTable, Spinner } from "@shopify/polaris";
import {
  Check,
  CircleAlert,
  CircleCheck,
  Coins,
  History,
  Info,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { Panel, PrimaryButton, StepFrame } from "../../components/RoarrUI.jsx";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCredits } from "../../lib/CreditsContext";
import { usePosthogAfterIdentify } from "../../lib/PosthogIdentityContext";
import {
  PACK_ORDER,
  FEATURE_LABELS,
  FEATURE_COSTS_DEFAULT,
  formatCredits,
  priceLabel,
  resolveFeatureCost,
} from "../../lib/credits";

const FEATURE_COST_CHIPS = [
  {
    key: "store_creation",
    label: "Store creation",
    icon: Store,
  },
  {
    key: "page_generation",
    label: "Product page",
    icon: Package,
  },
];

const PACK_SUBTITLES = {
  starter: "Best for a single product store",
  value: "Best for a multi product store",
};

const ALERT_TONES = {
  success: { box: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: CircleCheck, iconColor: "text-emerald-600" },
  critical: { box: "bg-red-50 text-red-900 ring-red-200", icon: CircleAlert, iconColor: "text-red-600" },
  warning: { box: "bg-amber-50 text-amber-900 ring-amber-200", icon: CircleAlert, iconColor: "text-amber-600" },
  info: { box: "bg-blue-50 text-[#1e3a8a] ring-blue-200", icon: Info, iconColor: "text-[#1e40af]" },
};

/** Inline message strip; `onDismiss` adds a close button. */
function Alert({ tone = "info", onDismiss, children }) {
  const t = ALERT_TONES[tone] || ALERT_TONES.info;
  const IconComponent = t.icon;
  return (
    <div role="alert" className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ring-1 ring-inset ${t.box}`}>
      <IconComponent size={16} className={`mt-0.5 flex-none ${t.iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-none rounded-md p-0.5 opacity-70 transition hover:bg-white/70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

/** Balance on the left, what each action costs on the right. */
function BalanceCard({ balance, lifetimeSpent, featureCosts }) {
  const known = typeof balance === "number";
  return (
    <StepFrame compact>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white text-[#1e40af] shadow-sm ring-1 ring-blue-100">
            <Coins size={24} aria-hidden />
          </span>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Your balance
            </p>
            <p className="m-0 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold leading-tight tracking-tight tabular-nums text-slate-900">
                {known ? Number(balance).toLocaleString() : "…"}
              </span>
              <span className="text-sm font-medium text-slate-500">credits</span>
            </p>
            {known && lifetimeSpent > 0 ? (
              <p className="m-0 text-xs text-slate-500">
                {formatCredits(lifetimeSpent)} used so far
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Credits used per action
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {FEATURE_COST_CHIPS.map(({ key, label, icon: IconComponent }) => {
              const cost = resolveFeatureCost(key, featureCosts);
              return (
                <li
                  key={key}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] text-slate-600 shadow-sm ring-1 ring-blue-100"
                >
                  <IconComponent size={16} className="text-[#1e40af]" aria-hidden />
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="font-bold tabular-nums text-[#1e3a8a]">
                    {Number(cost).toLocaleString()} cr
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

const LEDGER_TYPE_LABELS = {
  grant_signup: "Signup bonus",
  grant_pack: "Credit pack purchase",
  grant_promo: "Promotional grant",
  grant_migration: "Account migration",
  grant_support: "Support grant",
  grant_daily: "Daily Grant",
  spend: "Spent",
  refund: "Refund",
  adjust: "Adjustment",
};

const LEDGER_FETCH_LIMIT = 200;
const LEDGER_PAGE_SIZE = 15;

/** Ledger row `type` (e.g. grant_pack, spend) with a short label + raw value. */
function ledgerTypeCell(entry) {
  const raw = (entry?.type || "").trim();
  if (!raw) return "—";
  const label = LEDGER_TYPE_LABELS[raw] || raw;
  return label === raw ? raw : `${label}`;
}

/** Gated feature id when present (e.g. page_generation), else em dash. */
function ledgerFeatureCell(entry) {
  const f = entry?.feature;
  if (!f) return "—";
  return FEATURE_LABELS[f] || String(f);
}

function formatLedgerWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSignedCredits(delta) {
  const n = Number(delta) || 0;
  const signed = (n > 0 ? "+" : "") + `${n.toLocaleString()} cr`;
  return signed;
}

const PACK_PERKS = [
  "One-time payment — no recurring charges",
  "Credits never expire",
  "Accumulates with existing balance",
];

function PackCard({ packKey, pack, onBuy, busy, mostPopular, promoPending }) {
  const subtitle = PACK_SUBTITLES[packKey];
  const baseCredits = Number(pack.credits) || 0;
  const grantedCredits = promoPending ? baseCredits * 2 : baseCredits;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 ${
        mostPopular
          ? "bg-gradient-to-b from-[#f6f8ff] to-white shadow-[0_18px_40px_-24px_rgba(30,58,138,0.55)] ring-2 ring-[#4f46e5]"
          : "bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-[0_18px_40px_-26px_rgba(30,58,138,0.4)] hover:ring-blue-200"
      }`}
    >
      {mostPopular ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#1e40af] to-[#7c3aed] px-2.5 py-0.5 text-[11px] font-semibold text-white">
          <Sparkles size={11} aria-hidden />
          Best value
        </span>
      ) : null}

      <div className={mostPopular ? "pr-24" : ""}>
        <h3 className="m-0 text-base font-bold tracking-tight text-slate-900">{pack.name}</h3>
        {subtitle ? <p className="m-0 mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="mt-4">
        <p className="m-0 text-4xl font-bold leading-none tracking-tight text-slate-900">
          {priceLabel(pack)}
        </p>
        {promoPending ? (
          <div className="mt-2">
            <p className="m-0 text-sm font-semibold text-[#1e40af]">
              {formatCredits(grantedCredits, "credits")} with ROARR2X
            </p>
            <p className="m-0 text-xs text-slate-500">
              Normally {formatCredits(baseCredits, "credits")}
            </p>
          </div>
        ) : (
          <p className="m-0 mt-2 text-sm font-medium text-slate-600">
            {formatCredits(baseCredits, "credits")}
          </p>
        )}
      </div>

      <ul className="m-0 my-5 flex list-none flex-col gap-2 p-0">
        {PACK_PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-[13px] text-slate-600">
            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-blue-50 text-[#1e40af]">
              <Check size={11} strokeWidth={3} aria-hidden />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <PrimaryButton
          className="w-full"
          loading={busy}
          disabled={busy}
          onClick={() => onBuy(packKey)}
        >
          Buy {pack.name}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function CreditPacks() {
  const {
    balance,
    lifetimeSpent,
    packs,
    refresh,
    featureCosts,
    hasActivePurchase,
    promoPending,
  } = useCredits();
  const shopify = useAppBridge();
  const posthog = usePosthogAfterIdentify();
  const [busyPack, setBusyPack] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reconcileMessage, setReconcileMessage] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(1);

  const fetchLedger = useCallback(async () => {
    // Hide ledger/activity until the merchant has an active paid plan.
    if (!hasActivePurchase) {
      setLedgerEntries([]);
      setLedgerError(null);
      setLedgerLoading(false);
      return;
    }
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const res = await fetch(
        `/api/credits/ledger?limit=${LEDGER_FETCH_LIMIT}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setLedgerEntries(Array.isArray(json.entries) ? json.entries : []);
    } catch (err) {
      console.warn("[credits] ledger fetch failed:", err?.message || err);
      setLedgerError(err?.message || "Could not load activity");
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [hasActivePurchase]);

  // Reconcile any pending purchases on mount — covers the case where the
  // merchant closed the tab during the Shopify approval step.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/credits/reconcile", {
          method: "POST",
          credentials: "include",
        });
        if (cancelled) return;
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.granted) && json.granted.length > 0) {
          const total = json.granted.reduce(
            (acc, g) => acc + (Number(g.credits_granted) || 0),
            0
          );
          if (total > 0) {
            setReconcileMessage(
              `We just confirmed a previous purchase and added ${formatCredits(
                total
              )} to your wallet.`
            );
            refresh();
            fetchLedger();
          }
        }
      } catch (err) {
        console.warn("[credits] reconcile on mount failed:", err?.message || err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, fetchLedger]);

  useEffect(() => {
    if (!hasActivePurchase) {
      setLedgerEntries([]);
      setLedgerError(null);
      setLedgerLoading(false);
      return;
    }
    fetchLedger();
  }, [hasActivePurchase, fetchLedger]);

  useEffect(() => {
    setLedgerPage(1);
  }, [ledgerEntries]);

  const handleBuy = useCallback(
    async (packKey) => {
      setBusyPack(packKey);
      setActionError(null);
      try {
        const res = await fetch("/api/credits/purchase-pack", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pack_name: packKey }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json.confirmation_url) {
          throw new Error(json?.error || "Could not start checkout");
        }
        posthog?.capture("credits_pack_checkout_started", { pack_name: packKey });
        // Break out of the embedded iframe to Shopify's approval page.
        // After approval Shopify redirects back to our /credits/callback.
        if (shopify?.redirect?.dispatch) {
          // App Bridge v3 (older)
          shopify.redirect.dispatch("REMOTE", json.confirmation_url);
        } else if (typeof window !== "undefined") {
          // App Bridge React 4 / fallback — top-level navigation breaks
          // out of the iframe.
          window.top.location.href = json.confirmation_url;
        }
      } catch (err) {
        console.error("[credits] purchase-pack error:", err);
        setActionError(err?.message || "Could not start checkout");
        setBusyPack(null);
      }
    },
    [shopify, posthog]
  );

  const orderedPacks = PACK_ORDER.filter((k) => packs?.[k]).map((k) => ({
    key: k,
    pack: packs[k],
  }));

  const ledgerTotalPages = Math.max(
    1,
    Math.ceil(ledgerEntries.length / LEDGER_PAGE_SIZE)
  );

  const paginatedLedgerRows = useMemo(() => {
    const start = (ledgerPage - 1) * LEDGER_PAGE_SIZE;
    const slice = ledgerEntries.slice(start, start + LEDGER_PAGE_SIZE);
    return slice.map((entry) => {
      const delta = Number(entry?.delta) || 0;
      const balAfter = entry?.balance_after;
      return [
        formatLedgerWhen(entry.created_at),
        ledgerTypeCell(entry),
        ledgerFeatureCell(entry),
        formatSignedCredits(delta),
        balAfter == null || balAfter === ""
          ? "—"
          : formatCredits(balAfter),
      ];
    });
  }, [ledgerEntries, ledgerPage]);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <BalanceCard
        balance={balance}
        lifetimeSpent={lifetimeSpent}
        featureCosts={featureCosts || FEATURE_COSTS_DEFAULT}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 className="m-0 text-xl font-bold tracking-tight text-slate-900">Credit packs</h2>
            <p className="m-0 mt-0.5 max-w-xl text-[13px] leading-relaxed text-slate-500">
              One-time purchases. Credits never expire and accumulate across packs. Spend them on
              store generation and product pages.
            </p>
          </div>
        </div>

        {promoPending ? (
          <Alert tone="success">
            ROARR2X is active. Your next pack purchase grants double credits.
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {orderedPacks.map(({ key, pack }) => (
            <PackCard
              key={key}
              packKey={key}
              pack={pack}
              busy={busyPack === key}
              mostPopular={key === "value"}
              promoPending={promoPending}
              onBuy={handleBuy}
            />
          ))}
        </div>

        {reconcileMessage ? (
          <Alert tone="success" onDismiss={() => setReconcileMessage(null)}>
            {reconcileMessage}
          </Alert>
        ) : null}

        {actionError ? (
          <Alert tone="critical" onDismiss={() => setActionError(null)}>
            {actionError}
          </Alert>
        ) : null}

        <p className="m-0 flex items-start gap-2 rounded-xl bg-white/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500 ring-1 ring-inset ring-slate-200">
          <ShieldCheck size={15} className="mt-0.5 flex-none text-[#1e40af]" aria-hidden />
          Charges are processed by Shopify Billing — you&apos;ll be redirected to approve. If
          anything goes wrong on our end after a charge, the credits are automatically refunded.
        </p>
      </section>

      <Panel
        icon={History}
        title="Activity"
        description={`Credits added and spent. Showing up to ${LEDGER_FETCH_LIMIT} most recent entries (newest first).`}
      >
        {ledgerLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Spinner size="small" />
            Loading history…
          </div>
        ) : ledgerError ? (
          <Alert tone="warning" onDismiss={() => setLedgerError(null)}>
            {ledgerError}
          </Alert>
        ) : ledgerEntries.length === 0 ? (
          <p className="m-0 rounded-xl bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
            No activity yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/80">
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={["Date", "Type", "Feature", "Change", "Balance after"]}
              rows={paginatedLedgerRows}
              pagination={{
                hasPrevious: ledgerPage > 1,
                hasNext: ledgerPage < ledgerTotalPages,
                onPrevious: () => setLedgerPage((p) => Math.max(1, p - 1)),
                onNext: () =>
                  setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1)),
                label: `Page ${ledgerPage} of ${ledgerTotalPages}`,
                accessibilityLabel: "Ledger activity pages",
              }}
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
