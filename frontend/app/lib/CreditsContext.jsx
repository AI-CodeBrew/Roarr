/**
 * Credits provider — single source of truth for the merchant's wallet
 * balance, the pack catalog, and the global "insufficient credits" modal.
 *
 *   const { balance, packs, featureCosts, hasActivePurchase, refresh, showInsufficient }
 *           = useCredits();
 *
 * Mounted near the root of the app shell so any page can:
 *   1. Read `balance` to show a chip / ribbon.
 *   2. Call `refresh()` after a generation completes (balance changes).
 *      `refresh()` resolves to `{ ok, balance, featureCosts, hasActivePurchase }` from the HTTP
 *      response (`ok === false` on failure) so callers can gate UX without
 *      waiting on a React re-render.
 *   3. Call `showInsufficient({ balance, required, feature })` when an
 *      action returns a 402 — this opens the global modal that points
 *      the merchant at the credits page.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CREDIT_PACKS_DEFAULT,
  FEATURE_COSTS_DEFAULT,
  STORE_CREATION_COSTS_DEFAULT,
} from "./credits";

const CreditsContext = createContext(null);

const REFRESH_DEBOUNCE_MS = 800;

export function CreditsProvider({ children, enabled = true }) {
  const [balance, setBalance] = useState(null);
  const [lifetimeGranted, setLifetimeGranted] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [hasActivePurchase, setHasActivePurchase] = useState(false);
  const [promoPending, setPromoPending] = useState(false);
  const [promoRedeemed, setPromoRedeemed] = useState(false);
  const [activePromo, setActivePromo] = useState(null);
  const [packs, setPacks] = useState(CREDIT_PACKS_DEFAULT);
  const [featureCosts, setFeatureCosts] = useState(FEATURE_COSTS_DEFAULT);
  const [storeCreationCosts, setStoreCreationCosts] = useState(
    STORE_CREATION_COSTS_DEFAULT,
  );
  /** @type {string | null} `default` or ISO 3166-1 alpha-2 when Dynamo row exists */
  const [pricingRegion, setPricingRegion] = useState(null);
  const [pricingCountryName, setPricingCountryName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [insufficient, setInsufficient] = useState(null); // null | {balance, required, feature, message}

  const inflightRef = useRef(null);
  const lastFetchRef = useRef(0);

  const fetchBalance = useCallback(async () => {
    if (!enabled) {
      return { ok: false, balance: null, featureCosts: null, hasActivePurchase: false };
    }
    // Debounce rapid successive calls — generation flows often refresh
    // the balance multiple times in quick succession.
    const now = Date.now();
    if (now - lastFetchRef.current < REFRESH_DEBOUNCE_MS && inflightRef.current) {
      return inflightRef.current;
    }
    lastFetchRef.current = now;
    setLoading(true);
    setError(null);

    const promise = (async () => {
      try {
        const res = await fetch("/api/credits/balance", {
          method: "GET",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        const bal = Number(json.balance) || 0;
        const fcObj =
          json.feature_costs && typeof json.feature_costs === "object"
            ? json.feature_costs
            : null;
        const purchased = Boolean(json.has_active_purchase);
        setBalance(bal);
        setLifetimeGranted(Number(json.lifetime_granted) || 0);
        setLifetimeSpent(Number(json.lifetime_spent) || 0);
        setHasActivePurchase(purchased);
        setPromoPending(Boolean(json.promo_kluck2x_pending));
        setPromoRedeemed(Boolean(json.promo_kluck2x_redeemed));
        setActivePromo(
          typeof json.active_promo === "string" && json.active_promo
            ? json.active_promo
            : null,
        );
        if (json.packs && typeof json.packs === "object") setPacks(json.packs);
        if (fcObj) setFeatureCosts(fcObj);
        const sccObj =
          json.store_creation_costs && typeof json.store_creation_costs === "object"
            ? json.store_creation_costs
            : null;
        if (sccObj) setStoreCreationCosts(sccObj);
        const pr = json.pricing_region != null ? String(json.pricing_region) : "";
        if (pr && pr !== "default") {
          setPricingRegion(pr);
        } else {
          setPricingRegion(null);
        }
        const pn = json.pricing_country_name;
        if (typeof pn === "string" && pn.trim()) {
          setPricingCountryName(pn.trim());
        } else {
          setPricingCountryName(null);
        }
        return {
          ok: true,
          balance: bal,
          featureCosts: fcObj,
          storeCreationCosts: sccObj || STORE_CREATION_COSTS_DEFAULT,
          hasActivePurchase: purchased,
        };
      } catch (err) {
        console.warn("[credits] balance fetch failed:", err?.message || err);
        setError(err?.message || "Failed to load credit balance");
        return {
          ok: false,
          balance: null,
          featureCosts: null,
          hasActivePurchase: false,
        };
      } finally {
        setLoading(false);
        inflightRef.current = null;
      }
    })();
    inflightRef.current = promise;
    return promise;
  }, [enabled]);

  // Initial fetch + refresh on tab focus.
  useEffect(() => {
    if (!enabled) return;
    fetchBalance();

    const onFocus = () => fetchBalance();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBalance();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, fetchBalance]);

  const showInsufficient = useCallback((info) => {
    if (!info) return;
    setInsufficient({
      balance: Number(info.balance) || 0,
      required: Number(info.required) || 0,
      feature: info.feature || null,
      message: info.message || "Insufficient credits.",
    });
  }, []);

  const dismissInsufficient = useCallback(() => setInsufficient(null), []);

  const value = useMemo(
    () => ({
      balance,
      lifetimeGranted,
      lifetimeSpent,
      packs,
      featureCosts,
      storeCreationCosts,
      hasActivePurchase,
      promoPending,
      promoRedeemed,
      activePromo,
      pricingRegion,
      pricingCountryName,
      loading,
      error,
      refresh: fetchBalance,
      insufficient,
      showInsufficient,
      dismissInsufficient,
    }),
    [
      balance,
      lifetimeGranted,
      lifetimeSpent,
      packs,
      featureCosts,
      storeCreationCosts,
      hasActivePurchase,
      promoPending,
      promoRedeemed,
      activePromo,
      pricingRegion,
      pricingCountryName,
      loading,
      error,
      fetchBalance,
      insufficient,
      showInsufficient,
      dismissInsufficient,
    ]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    // Soft fallback — components that try to use this outside a provider
    // (or before mount) get a no-op shape rather than a crash.
    return {
      balance: null,
      lifetimeGranted: 0,
      lifetimeSpent: 0,
      packs: CREDIT_PACKS_DEFAULT,
      featureCosts: FEATURE_COSTS_DEFAULT,
      storeCreationCosts: STORE_CREATION_COSTS_DEFAULT,
      hasActivePurchase: false,
      promoPending: false,
      promoRedeemed: false,
      activePromo: null,
      pricingRegion: null,
      pricingCountryName: null,
      loading: false,
      error: null,
      refresh: async () => ({
        ok: false,
        balance: null,
        featureCosts: null,
        hasActivePurchase: false,
      }),
      insufficient: null,
      showInsufficient: () => {},
      dismissInsufficient: () => {},
    };
  }
  return ctx;
}
