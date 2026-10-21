import { useMemo, useState } from "react";
import { BlockStack, Box, Button, InlineStack, Text } from "@shopify/polaris";
import MarketPreferencesForm, {
  areMarketPreferencesComplete,
  saveShopMarketPreferences,
} from "../MarketPreferencesForm.jsx";
import {
  getSupportedLanguage,
  mapShopLocaleToSupported,
} from "../../lib/supportedLanguages.js";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import { useDashboardLoaderData } from "../../lib/DashboardDataContext";

export default function MarketPreferencesStep({
  onBack,
  onNext,
  shopLocales = [],
  initialPreferences = null,
}) {
  const isMobileLayout = useViewportBelowMd();
  const { updateMarketPreferences } = useDashboardLoaderData() || {};
  const primaryLocaleCode = shopLocales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = useMemo(
    () => mapShopLocaleToSupported(primaryLocaleCode),
    [primaryLocaleCode],
  );

  const [marketType, setMarketType] = useState(
    initialPreferences?.market_type || initialPreferences?.marketType || null,
  );
  const [countryCode, setCountryCode] = useState(
    initialPreferences?.country_code || initialPreferences?.countryCode || null,
  );
  const [language, setLanguage] = useState(
    initialPreferences?.language || primarySupportedValue,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const effectiveLanguage = language || primarySupportedValue;
  const canContinue = areMarketPreferencesComplete({
    marketType,
    countryCode,
    language: effectiveLanguage,
  });

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
    <Box width="100%">
      <BlockStack gap="400">
        <BlockStack gap="100">
          <h4
            style={{
              fontFamily: 'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
              fontSize: isMobileLayout ? "1.45rem" : "1.75rem",
              fontWeight: 400,
              margin: 0,
              color: "#1a1a1a",
            }}
          >
            Set your market
          </h4>
          <Text as="p" variant="bodyMd" tone="subdued">
            Tell us how you sell and which language to generate in. You can change this anytime
            in Preferences.
          </Text>
        </BlockStack>

        <MarketPreferencesForm
          marketType={marketType}
          countryCode={countryCode}
          language={effectiveLanguage}
          onMarketTypeChange={setMarketType}
          onCountryCodeChange={setCountryCode}
          onLanguageChange={setLanguage}
          shopLocales={shopLocales}
          title={null}
          subtitle={null}
          countryPickerScope="all"
        />

        {error ? (
          <Text as="p" variant="bodySm" tone="critical">
            {error}
          </Text>
        ) : null}

        <InlineStack align="space-between" blockAlign="center" wrap>
          <Button variant="tertiary" onClick={onBack} disabled={saving}>
            <span aria-hidden="true">← </span>Back
          </Button>
          <Button variant="primary" onClick={handleContinue} loading={saving} disabled={!canContinue}>
            Continue
          </Button>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}
