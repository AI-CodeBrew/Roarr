import { useMemo, useState } from "react";
import { ArrowRight, Banknote } from "lucide-react";
import {
  FlagSearchPicker,
  SettingRow,
  areMarketPreferencesComplete,
  saveShopMarketPreferences,
  useMarketPickerOptions,
} from "../MarketPreferencesForm.jsx";
import { getSupportedLanguage, mapShopLocaleToSupported } from "../../lib/supportedLanguages.js";
import { useDashboardLoaderData } from "../../lib/DashboardDataContext";
import FlagIcon from "../FlagIcon.jsx";
import MarketPreview from "./MarketPreview.jsx";
import { GradientText, PrimaryButton, StepFrame, StepHeader } from "./OnboardingUI";

/** Flag and name of the chosen option, shown on a closed row. */
function OptionSummary({ option }) {
  if (!option) return null;
  return (
    <>
      <FlagIcon flag={option.flag} width={20} />
      <span className="truncate">{option.label}</span>
    </>
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
  // Rows are drawers. The language is pre-filled from Shopify, so the country row opens first;
  // choosing a value closes its row and opens the next one that still needs an answer.
  const [openStep, setOpenStep] = useState(countryCode ? null : 2);
  const toggle = (step) => setOpenStep((current) => (current === step ? null : step));

  const effectiveLanguage = language || primarySupportedValue;
  const canContinue = areMarketPreferencesComplete({
    marketType,
    countryCode,
    language: effectiveLanguage,
  });
  const primaryLanguage = getSupportedLanguage(primarySupportedValue);
  const previewLanguage = getSupportedLanguage(effectiveLanguage);
  const languageOption = languageOptions.find((o) => o.value === effectiveLanguage) || null;
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
        subtitle="Pick your store's language and country. Change them anytime in Preferences."
        step={2}
        completed={1}
        onBack={onBack}
        backDisabled={saving}
      />

      {/* One screen: settings and Continue on the left, preview on the right (stacked on mobile). */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_1fr]">
        <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:self-start">
          <SettingRow
            number={1}
            done={Boolean(effectiveLanguage)}
            title="Store language"
            description="Your page text is written in this language."
            summary={<OptionSummary option={languageOption} />}
            open={openStep === 1}
            onToggle={() => toggle(1)}
          >
            <FlagSearchPicker
              overlay
              placeholder="Select language"
              searchPlaceholder="Search languages…"
              value={effectiveLanguage}
              options={languageOptions}
              groups={languageGroups}
              onChange={(v) => {
                setLanguage(v || null);
                setOpenStep(countryCode ? null : 2);
              }}
            />
          </SettingRow>

          <SettingRow
            number={2}
            done={Boolean(countryCode)}
            title="Country you sell to"
            description="Where most of your customers are."
            summary={<OptionSummary option={previewCountry} />}
            open={openStep === 2}
            onToggle={() => toggle(2)}
          >
            <FlagSearchPicker
              overlay
              placeholder="Select country"
              searchPlaceholder="Search countries…"
              value={countryCode || ""}
              options={countryOptions}
              groups={countryGroups}
              onChange={(v) => {
                setCountryCode(v || null);
                setOpenStep(null);
              }}
            />
          </SettingRow>

          <div className="space-y-2 px-1 pt-1 text-xs leading-relaxed text-slate-500">
            <p className="m-0 flex items-start gap-2.5">
              <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-blue-50 text-[#1e40af]">
                <Banknote size={12} aria-hidden />
              </span>
              <span>Customers can pay on delivery or online.</span>
            </p>
            {/* Only worth saying when the chosen language differs from the Shopify store's. */}
            {effectiveLanguage !== primarySupportedValue ? (
              <p className="m-0 flex items-start gap-2.5">
                <FlagIcon flag={primaryLanguage.flag} width={18} className="mt-0.5" />
                <span>
                  Your Shopify store language is{" "}
                  <span className="font-medium text-slate-700">{primaryLanguage.name}</span>.
                  Buttons follow it, and product titles stay as entered in Shopify.
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <MarketPreview language={previewLanguage} country={previewCountry} />
        </div>

        <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-2 lg:self-end">
          {error ? (
            <p role="alert" className="m-0 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <PrimaryButton
            onClick={handleContinue}
            loading={saving}
            disabled={!canContinue}
            className="w-full sm:w-auto sm:self-start"
          >
            Continue
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </PrimaryButton>
        </div>
      </div>
    </StepFrame>
  );
}
