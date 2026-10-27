import { useMemo, useState } from "react";
import { ArrowRight, Banknote } from "lucide-react";
import {
  FlagSearchPicker,
  areMarketPreferencesComplete,
  saveShopMarketPreferences,
  useMarketPickerOptions,
} from "../MarketPreferencesForm.jsx";
import { getSupportedLanguage, mapShopLocaleToSupported } from "../../lib/supportedLanguages.js";
import { useDashboardLoaderData } from "../../lib/DashboardDataContext";
import FlagIcon from "../FlagIcon.jsx";
import MarketPreview from "./MarketPreview.jsx";
import { GradientText, PrimaryButton, StepFrame, StepHeader } from "./OnboardingUI";

/** Numbered section title inside the settings card. */
function SettingHeading({ number, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-semibold text-white">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="m-0 text-[15px] font-semibold leading-6 text-slate-900">{title}</h3>
        <p className="m-0 text-[13px] leading-snug text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function MarketPreferencesStep({
  onBack,
  onNext,
  shopLocales = [],
  initialPreferences = null,
}) {
  const { updateMarketPreferences } = useDashboardLoaderData() || {};
  const primaryLocaleCode = shopLocales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = useMemo(
    () => mapShopLocaleToSupported(primaryLocaleCode),
    [primaryLocaleCode],
  );
  const { languageOptions, languageGroups, countryOptions, countryGroups } =
    useMarketPickerOptions("all");

  // Onboarding only offers the COD market (it accepts prepaid orders too), so it is the default.
  const marketType = initialPreferences?.market_type || initialPreferences?.marketType || "cod";
  const [countryCode, setCountryCode] = useState(
    initialPreferences?.country_code || initialPreferences?.countryCode || null,
  );
  const [language, setLanguage] = useState(initialPreferences?.language || primarySupportedValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const effectiveLanguage = language || primarySupportedValue;
  const canContinue = areMarketPreferencesComplete({
    marketType,
    countryCode,
    language: effectiveLanguage,
  });
  const primaryLanguage = getSupportedLanguage(primarySupportedValue);
  const previewLanguage = getSupportedLanguage(effectiveLanguage);
  const previewCountry = countryOptions.find((c) => c.value === countryCode) || null;

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveShopMarketPreferences({
        marketType,
        countryCode,
        language: effectiveLanguage,
      });
      const prefs = saved?.preferences || {
        market_type: marketType,
        country_code: countryCode,
        language: effectiveLanguage,
      };
      updateMarketPreferences?.(prefs);
      onNext?.(prefs);
    } catch (err) {
      setError(err?.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepFrame>
      <StepHeader
        title={
          <>
            Set your <GradientText>market</GradientText>
          </>
        }
        subtitle="Choose the language and country your store speaks to. You can change this anytime in Preferences."
        step={2}
        completed={1}
        onBack={onBack}
        backDisabled={saving}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <SettingHeading
                number={1}
                title="Store language"
                description="Every headline, description and button is written in it."
              />
              <FlagSearchPicker
                overlay
                placeholder="Select language"
                searchPlaceholder="Search languages…"
                value={effectiveLanguage}
                options={languageOptions}
                groups={languageGroups}
                onChange={(v) => setLanguage(v || null)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <SettingHeading
                number={2}
                title="Target audience"
                description="The primary country you sell to."
              />
              <FlagSearchPicker
                overlay
                placeholder="Select country"
                searchPlaceholder="Search countries…"
                value={countryCode || ""}
                options={countryOptions}
                groups={countryGroups}
                onChange={(v) => setCountryCode(v || null)}
              />
            </div>
          </div>

          <div className="mt-auto pt-6">
          <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            <p className="m-0 flex items-start gap-2.5">
              <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-blue-50 text-[#1e40af]">
                <Banknote size={12} aria-hidden />
              </span>
              <span>
                <span className="font-medium text-slate-700">COD market.</span> Customers can pay on
                delivery or prepay online.
              </span>
            </p>
            <p className="m-0 flex items-start gap-2.5">
              <FlagIcon flag={primaryLanguage.flag} width={18} className="mt-0.5" />
              <span>
                Your Shopify store language is{" "}
                <span className="font-medium text-slate-700">{primaryLanguage.name}</span>. Buttons
                follow it, and product titles stay as entered in Shopify.
              </span>
            </p>
          </div>
          </div>
        </section>

        <MarketPreview language={previewLanguage} country={previewCountry} />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p role={error ? "alert" : undefined} className="m-0 text-sm text-red-700">
          {error}
        </p>
        <PrimaryButton
          onClick={handleContinue}
          loading={saving}
          disabled={!canContinue}
          className="w-full sm:w-auto"
        >
          Continue
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </PrimaryButton>
      </div>
    </StepFrame>
  );
}
