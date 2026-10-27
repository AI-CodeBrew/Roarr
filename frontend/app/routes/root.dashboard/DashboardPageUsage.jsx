import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";
import { useCredits } from "../../lib/CreditsContext";
import { formatCredits } from "../../lib/credits";
import { countPagesByGenerationType } from "../../lib/pageCounts";

/** Same cut-offs as the wallet pill (`CreditWalletWidget`). */
const LOW_THRESHOLD = 200;
const VERY_LOW_THRESHOLD = 50;

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** One row of the usage card: label with its footnote underneath, arrow on the right. Opens its hub. */
function UsageStat({ label, footer, footerTone, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="group flex w-full min-w-0 items-center justify-between gap-3 px-4 py-2 text-left transition hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a]"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-slate-900">{label}</span>
        <span className={`mt-0.5 block text-xs ${footerTone || "text-slate-500"}`}>{footer}</span>
      </span>
      <ArrowRight
        size={14}
        aria-hidden
        className="flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1e40af]"
      />
    </button>
  );
}

/**
 * Dashboard usage card (stacked vertically): product pages, stores and AI credits.
 * Each row opens its hub (product pages, entire store, credits).
 */
export default function DashboardPageUsage({ shop, pages = [], loading = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance } = useCredits();
  const { product, store } = useMemo(() => countPagesByGenerationType(pages), [pages]);

  const pagesReady = !(loading && !pages?.length);
  const creditsReady = typeof balance === "number";
  const creditTone =
    !creditsReady || balance >= LOW_THRESHOLD
      ? null
      : balance < VERY_LOW_THRESHOLD
        ? "critical"
        : "attention";

  return (
    <section
      aria-label="Usage"
      className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(30,58,138,0.18)] ring-1 ring-slate-200/70"
    >
      <UsageStat
        label="Product pages"
        footer={pagesReady ? plural(product.total - product.published, "unpublished page") : "Loading…"}
        onClick={() => navigate(buildEmbeddedHref("/product-page", searchParams, shop))}
        ariaLabel={`Product pages: ${product.published} of ${product.total} published. Open product pages.`}
      />
      <UsageStat
        label="Stores"
        footer={pagesReady ? plural(store.total - store.published, "unpublished store") : "Loading…"}
        onClick={() => navigate(buildEmbeddedHref("/entire-store", searchParams, shop))}
        ariaLabel={`Stores: ${store.published} of ${store.total} published. Open entire store.`}
      />
      <UsageStat
        label="AI credits"
        footer={
          creditsReady ? (
            <>
              {formatCredits(balance)} left ·{" "}
              <span className="font-semibold text-[#1e40af] group-hover:underline">Get more</span>
            </>
          ) : (
            "Loading…"
          )
        }
        footerTone={
          creditTone === "critical"
            ? "text-red-600"
            : creditTone === "attention"
              ? "text-amber-700"
              : null
        }
        onClick={() => navigate("/credits")}
        ariaLabel={
          creditsReady
            ? `AI credits: ${formatCredits(balance)} left. Open credits.`
            : "AI credits loading. Open credits."
        }
      />
    </section>
  );
}
