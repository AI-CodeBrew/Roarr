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
import {
  BlockStack,
  Box,
  Banner,
  Button,
  DataTable,
  Icon,
  InlineStack,
  LegacyCard,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { ProductIcon, StoreIcon } from "@shopify/polaris-icons";
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
    label: "Store Creation",
    icon: StoreIcon,
  },
  {
    key: "page_generation",
    label: "Product Page",
    icon: ProductIcon,
  },
];

const PACK_SUBTITLES = {
  starter: "(Best for single product store)",
  value: "(Best for Multi Product Store)",
};

function FeatureCostChips({ featureCosts }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-4 text-center text-sm font-semibold text-gray-800">
        Following are the credits used per action:
      </p>
      <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-3 p-0">
        {FEATURE_COST_CHIPS.map(({ key, label, icon }) => {
          const cost = resolveFeatureCost(key, featureCosts);
          return (
            <li
              key={key}
              className="flex items-center gap-2 px-2 text-xs text-gray-700"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <Icon source={icon} tone="base" />
              </span>
              <span className="whitespace-nowrap">
                <span className="font-semibold text-gray-900">{label}:</span>{" "}
                <span className="font-bold tabular-nums text-gray-900">
                  {Number(cost).toLocaleString()}cr
                </span>{" "}
                will be used
              </span>
            </li>
          );
        })}
      </ul>
    </div>
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

function PackCard({ packKey, pack, onBuy, busy, mostPopular, promoPending }) {
  const subtitle = PACK_SUBTITLES[packKey];
  const baseCredits = Number(pack.credits) || 0;
  const grantedCredits = promoPending ? baseCredits * 2 : baseCredits;

  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-5 shadow-md ${
        mostPopular ? "border-2 border-fuchsia-500" : "border border-gray-200"
      }`}
    >
      {mostPopular && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-800">
          Best value
        </span>
      )}

      <div className={mostPopular ? "pr-20" : ""}>
        <Text as="h3" variant="headingMd" fontWeight="semibold">
          {pack.name}
          {subtitle && (
            <span className="text-xs font-bold italic text-gray-500">
              {" "}{subtitle}
            </span>
          )}
        </Text>
      </div>

      <div style={{ marginTop: 16 }}>
        <Text as="p" variant="heading2xl" fontWeight="bold">
          {priceLabel(pack)}
        </Text>
        {promoPending ? (
          <div>
            <Text as="p" fontWeight="semibold">
              {formatCredits(grantedCredits, "credits")} with ROARR2X
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              Normally {formatCredits(baseCredits, "credits")}
            </Text>
          </div>
        ) : (
          <Text as="p" tone="subdued">
            {formatCredits(baseCredits, "credits")}
          </Text>
        )}
      </div>

      <ul style={{ margin: "16px 0", paddingLeft: 18 }}>
        <li>
          <Text as="span" tone="subdued">
            One-time payment — no recurring charges
          </Text>
        </li>
        <li>
          <Text as="span" tone="subdued">
            Credits never expire
          </Text>
        </li>
        <li>
          <Text as="span" tone="subdued">
            Accumulates with existing balance
          </Text>
        </li>
      </ul>

      <div style={{ marginTop: "auto" }}>
        <Button
          fullWidth
          variant="primary"
          loading={busy}
          disabled={busy}
          onClick={() => onBuy(packKey)}
        >
          Buy {pack.name}
        </Button>
      </div>
    </div>
  );
}

export function CreditPacks() {
  const {
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
  const [promoCode, setPromoCode] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [promoSuccess, setPromoSuccess] = useState(null);
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

  const handleRedeemPromo = useCallback(async () => {
    const code = String(promoCode || "").trim();
    if (!code) {
      setPromoError("Enter a promo code");
      return;
    }
    setPromoBusy(true);
    setPromoError(null);
    setPromoSuccess(null);
    try {
      const res = await fetch("/api/credits/redeem-promo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Could not apply promo code");
      }
      setPromoSuccess(
        json.message ||
          "Promo applied. Your next credit pack purchase will be doubled.",
      );
      setPromoCode("");
      posthog?.capture("credits_promo_redeemed", { code: json.code || code });
      refresh();
    } catch (err) {
      setPromoError(err?.message || "Could not apply promo code");
    } finally {
      setPromoBusy(false);
    }
  }, [promoCode, posthog, refresh]);

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
    <Box paddingBlockStart="0" paddingBlockEnd="400">
      <BlockStack gap="400">
        <FeatureCostChips
          featureCosts={featureCosts || FEATURE_COSTS_DEFAULT}
        />

        <BlockStack gap="200">
          <Text as="h2" variant="headingLg" fontWeight="semibold">
            Credit packs
          </Text>
          <Text as="p" tone="subdued">
            One-time purchases. Credits never expire and accumulate across
            packs. Spend them on store generation and product pages.
          </Text>
        </BlockStack>

        <Box
          background="bg-surface-secondary"
          padding="300"
          borderRadius="200"
        >
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              Promo code
            </Text>
            {promoPending && (
              <Banner tone="success">
                ROARR2X is active. Your next pack purchase grants double
                credits.
              </Banner>
            )}
            <InlineStack gap="200" blockAlign="end" wrap={false}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <TextField
                  label="Promo code"
                  labelHidden
                  value={promoCode}
                  onChange={(value) => {
                    setPromoCode(value);
                    if (promoError) setPromoError(null);
                    if (promoSuccess) setPromoSuccess(null);
                  }}
                  autoComplete="off"
                  placeholder="Enter promo code"
                  disabled={promoBusy}
                />
              </div>
              <Button
                variant="primary"
                loading={promoBusy}
                disabled={promoBusy || !String(promoCode || "").trim()}
                onClick={handleRedeemPromo}
              >
                Apply
              </Button>
            </InlineStack>
            {promoSuccess && (
              <Banner tone="success" onDismiss={() => setPromoSuccess(null)}>
                {promoSuccess}
              </Banner>
            )}
            {promoError && (
              <Banner tone="critical" onDismiss={() => setPromoError(null)}>
                {promoError}
              </Banner>
            )}
          </BlockStack>
        </Box>

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

        {reconcileMessage && (
          <Banner tone="success" onDismiss={() => setReconcileMessage(null)}>
            {reconcileMessage}
          </Banner>
        )}

        {actionError && (
          <Banner tone="critical" onDismiss={() => setActionError(null)}>
            {actionError}
          </Banner>
        )}

        <Box
          background="bg-surface-secondary"
          padding="300"
          borderRadius="200"
        >
          <Text as="p" variant="bodySm" tone="subdued">
            Charges are processed by Shopify Billing — you'll be redirected to
            approve. If anything goes wrong on our end after a charge, the
            credits are automatically refunded.
          </Text>
        </Box>

        <BlockStack gap="300">
          <BlockStack gap="150">
            <Text as="h3" variant="headingMd" fontWeight="semibold">
              Activity
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              Credits added and spent. Showing up to {LEDGER_FETCH_LIMIT}{" "}
              most recent entries (newest first).
            </Text>
          </BlockStack>

          {ledgerLoading ? (
            <InlineStack gap="200" blockAlign="center">
              <Spinner size="small" />
              <Text as="p" tone="subdued" variant="bodySm">
                Loading history…
              </Text>
            </InlineStack>
          ) : ledgerError ? (
            <Banner tone="warning" onDismiss={() => setLedgerError(null)}>
              {ledgerError}
            </Banner>
          ) : ledgerEntries.length === 0 ? (
            <Text as="p" tone="subdued" variant="bodySm">
              No activity yet.
            </Text>
          ) : (
            <LegacyCard>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Date",
                  "Type",
                  "Feature",
                  "Change",
                  "Balance after",
                ]}
                rows={paginatedLedgerRows}
                pagination={{
                  hasPrevious: ledgerPage > 1,
                  hasNext: ledgerPage < ledgerTotalPages,
                  onPrevious: () =>
                    setLedgerPage((p) => Math.max(1, p - 1)),
                  onNext: () =>
                    setLedgerPage((p) =>
                      Math.min(ledgerTotalPages, p + 1)
                    ),
                  label: `Page ${ledgerPage} of ${ledgerTotalPages}`,
                  accessibilityLabel: "Ledger activity pages",
                }}
              />
            </LegacyCard>
          )}
        </BlockStack>
      </BlockStack>
    </Box>
  );
}
