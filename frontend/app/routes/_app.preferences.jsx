import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useOutletContext } from "react-router";
import { CircleAlert, CircleCheck, SlidersHorizontal } from "lucide-react";
import MarketPreferencesForm, {
  areMarketPreferencesComplete,
  saveShopMarketPreferences,
} from "../components/MarketPreferencesForm.jsx";
import { CreditWalletWidget } from "../components/CreditWalletWidget";
import { GradientText, PrimaryButton, StepFrame } from "../components/RoarrUI";
import { usePageTracking } from "../hooks/usePageTracking";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd";
import {
  mapShopLocaleToSupported,
} from "../lib/supportedLanguages.js";
import { useDashboardLoaderData } from "../lib/DashboardDataContext";
import { usePosthogAfterIdentify } from "../lib/PosthogIdentityContext";
import { syncPosthogMarketType } from "../lib/posthogMarketType";

export default function PreferencesPage() {
  usePageTracking("preferences");
  const isMobileLayout = useViewportBelowMd();
  const shopify = useAppBridge();
  const outletContext = useOutletContext() || {};
  const locales = outletContext.locales || [];
  const { updateMarketPreferences } = useDashboardLoaderData() || {};
  const posthog = usePosthogAfterIdentify();

  const primaryLocaleCode = locales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = useMemo(
    () => mapShopLocaleToSupported(primaryLocaleCode),
    [primaryLocaleCode],
  );

  const [marketType, setMarketType] = useState(null);
  const [countryCode, setCountryCode] = useState(null);
  const [language, setLanguage] = useState(primarySupportedValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop-market-preferences");
      const data = await res.json().catch(() => ({}));
      const prefs = data?.preferences || data;
      if (prefs?.market_type || prefs?.marketType) {
        setMarketType(prefs.market_type || prefs.marketType);
      }
      if (prefs?.country_code || prefs?.countryCode) {
        setCountryCode(prefs.country_code || prefs.countryCode);
      }
      if (prefs?.language) {
        setLanguage(prefs.language);
      } else {
        setLanguage(primarySupportedValue);
      }
    } catch (err) {
      setError(err?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [primarySupportedValue]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const effectiveLanguage = language || primarySupportedValue;
  const canSave = areMarketPreferencesComplete({
    marketType,
    countryCode,
    language: effectiveLanguage,
  });

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveShopMarketPreferences({
        marketType,
        countryCode,
        language: effectiveLanguage,
      });
      updateMarketPreferences?.(saved?.preferences || {
        market_type: marketType,
        country_code: countryCode,
        language: effectiveLanguage,
      });
      syncPosthogMarketType(posthog, marketType);
      setMessage("Preferences saved. Entire Store will use these settings.");
      shopify?.toast?.show?.("Preferences saved", { duration: 3000 });
    } catch (err) {
      setError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-page heading="Preferences" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          padding: isMobileLayout ? "12px" : "10px",
        }}
      >
        <div className="flex flex-col gap-5">
          <StepFrame compact>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-[#1e40af] shadow-sm ring-1 ring-blue-100">
                  <SlidersHorizontal size={22} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h1 className="m-0 text-[1.4rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.65rem]">
                    <GradientText>Preferences</GradientText>
                  </h1>
                  <p className="m-0 mt-0.5 text-sm text-slate-600">
                    Market, country and generation language for Entire Store.
                  </p>
                </div>
              </div>
              <PrimaryButton
                onClick={handleSave}
                loading={saving}
                disabled={!canSave || loading}
                className={isMobileLayout ? "w-full" : ""}
              >
                Save changes
              </PrimaryButton>
            </div>
          </StepFrame>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            {loading ? (
              <div className="space-y-3" aria-busy="true" aria-live="polite">
                <div className="h-5 w-48 animate-pulse rounded-md bg-slate-100" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[60px] animate-pulse rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100" />
                ))}
                <span className="sr-only">Loading preferences…</span>
              </div>
            ) : (
              <MarketPreferencesForm
                marketType={marketType}
                countryCode={countryCode}
                language={effectiveLanguage}
                onMarketTypeChange={setMarketType}
                onCountryCodeChange={setCountryCode}
                onLanguageChange={setLanguage}
                shopLocales={locales}
                title="Store market preferences"
              />
            )}
          </section>

          {message ? (
            <p
              role="status"
              className="m-0 flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-inset ring-emerald-200"
            >
              <CircleCheck size={18} className="flex-none text-emerald-600" aria-hidden />
              {message}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="m-0 flex items-center gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-900 ring-1 ring-inset ring-red-200"
            >
              <CircleAlert size={18} className="flex-none text-red-600" aria-hidden />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </s-page>
  );
}
