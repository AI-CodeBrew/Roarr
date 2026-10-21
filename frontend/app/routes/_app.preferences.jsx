import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useOutletContext } from "react-router";
import { BlockStack, Box, Button, Card, InlineStack, Text } from "@shopify/polaris";
import MarketPreferencesForm, {
  areMarketPreferencesComplete,
  saveShopMarketPreferences,
} from "../components/MarketPreferencesForm.jsx";
import { CreditWalletWidget } from "../components/CreditWalletWidget";
import { usePageTracking } from "../hooks/usePageTracking";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd";
import {
  getSupportedLanguage,
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
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="start" wrap>
            <BlockStack gap="100">
              <h4
                style={{
                  fontFamily:
                    'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                  fontSize: "1.75rem",
                  fontWeight: 400,
                  margin: 0,
                  color: "#1a1a1a",
                }}
              >
                Preferences
              </h4>
              <Text as="p" variant="bodyMd" tone="subdued">
                Market, country, and generation language for Entire Store.
              </Text>
            </BlockStack>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!canSave || loading}
            >
              Save
            </Button>
          </InlineStack>

          <Card>
            <Box padding="400">
              {loading ? (
                <Text as="p" tone="subdued">
                  Loading preferences…
                </Text>
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
                  subtitle={`Current language: ${getSupportedLanguage(effectiveLanguage).name}. Changes apply the next time you generate an Entire Store — existing pages are not rewritten until you regenerate.`}
                />
              )}
            </Box>
          </Card>

          {message ? (
            <Text as="p" tone="success">
              {message}
            </Text>
          ) : null}
          {error ? (
            <Text as="p" tone="critical">
              {error}
            </Text>
          ) : null}
        </BlockStack>
      </div>
    </s-page>
  );
}
