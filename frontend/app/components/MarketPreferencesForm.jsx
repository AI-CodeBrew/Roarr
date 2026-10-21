import { useEffect, useMemo, useRef, useState } from "react";
import { BlockStack, Box, Card, RadioButton, Text } from "@shopify/polaris";
import {
  POPULAR_COUNTRY_CODES,
  STORE_COUNTRY_OPTIONS,
  countryCodeToFlag,
} from "../routes/_app.generate_store/store/utils/storeCountryOptions.js";
import { getAllCountryOptions } from "../lib/allCountryOptions.js";
import {
  SUPPORTED_LANGUAGES,
  getSupportedLanguage,
  languageDisplayLabel,
  mapShopLocaleToSupported,
} from "../lib/supportedLanguages.js";

const ACCENT = "#2f6f63";
const ACCENT_SOFT = "#edf5f3";
const BORDER = "#e1e3e5";
const BORDER_SELECTED = ACCENT;

/**
 * Searchable flag picker with SELECTED trigger + scrollable dropdown panel
 * (keeps the menu inside a max-height so it doesn't run off-screen).
 */
function FlagSearchPicker({
  label,
  description,
  placeholder,
  searchPlaceholder,
  value,
  options,
  groups,
  onChange,
  emptyLabel = "Select…",
}) {
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) || null;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (groups || [])
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((item) => {
          if (!q) return true;
          const hay = `${item.label} ${item.searchText || ""} ${item.value}`.toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus?.(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", minWidth: 0, overflow: "visible" }}>
      <BlockStack gap="150">
        <BlockStack gap="100">
          <Text as="h3" variant="headingSm" fontWeight="semibold">
            {label}
          </Text>
          {description ? (
            <Text as="p" variant="bodySm" tone="subdued">
              {description}
            </Text>
          ) : null}
        </BlockStack>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            width: "100%",
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            textAlign: "left",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1.5px solid ${selected || open ? BORDER_SELECTED : BORDER}`,
            background: selected ? ACCENT_SOFT : "#fff",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          {selected ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#202223",
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
                {selected.flag || "🌐"}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.label}
              </span>
            </span>
          ) : (
            <span style={{ color: "#6d7175", fontSize: 14 }}>{placeholder || emptyLabel}</span>
          )}
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: "#6d7175",
              fontSize: 12,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 120ms ease",
            }}
          >
            ▾
          </span>
        </button>
      </BlockStack>

      {open ? (
        <div
          style={{
            position: "relative",
            marginTop: 8,
            zIndex: 40,
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "min(240px, 40vh)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 10px 8px", borderBottom: `1px solid ${BORDER}` }}>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || "Search…"}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              flex: 1,
              minHeight: 0,
              padding: "6px 0 8px",
            }}
          >
            {filteredGroups.length === 0 ? (
              <div style={{ padding: "12px 14px", color: "#6d7175", fontSize: 13 }}>
                No matches
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.title}>
                  <div
                    style={{
                      padding: "8px 14px 4px",
                      fontSize: 11,
                      fontWeight: 650,
                      letterSpacing: "0.05em",
                      color: "#8c9196",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const isActive = item.value === value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          onChange?.(item.value);
                          setOpen(false);
                          setQuery("");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          border: "none",
                          background: isActive ? ACCENT_SOFT : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 14,
                          color: "#202223",
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1, width: 26 }} aria-hidden="true">
                          {item.flag || "🌐"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
                        {isActive ? (
                          <span style={{ color: ACCENT, fontWeight: 700 }} aria-hidden="true">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Shared COD / prepaid + country + language form used by onboarding and Preferences.
 */
export default function MarketPreferencesForm({
  marketType,
  countryCode,
  language,
  onMarketTypeChange,
  onCountryCodeChange,
  onLanguageChange,
  shopLocales = [],
  title = "Market & language",
  subtitle = "Used for Entire Store generation. You can change this later in Preferences.",
  /** `"curated"` = short store list (Preferences). `"all"` = full ISO list (onboarding). */
  countryPickerScope = "curated",
}) {
  const primaryLocaleCode = shopLocales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = mapShopLocaleToSupported(primaryLocaleCode);
  const effectiveLanguage = language || primarySupportedValue;

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((l) => ({
        value: l.value,
        flag: l.flag,
        label: languageDisplayLabel(l),
        searchText: `${l.name} ${l.nativeName || ""}`,
        popular: Boolean(l.popular),
      })),
    [],
  );

  const languageGroups = useMemo(() => {
    const popular = languageOptions.filter((l) => l.popular);
    const rest = languageOptions.filter((l) => !l.popular);
    return [
      { title: "Popular languages", items: popular },
      { title: "All languages", items: rest },
    ].filter((g) => g.items.length > 0);
  }, [languageOptions]);

  const countryOptions = useMemo(() => {
    const source =
      countryPickerScope === "all" ? getAllCountryOptions() : STORE_COUNTRY_OPTIONS;
    return source.map((c) => ({
      value: c.value,
      flag: c.flag || countryCodeToFlag(c.value),
      label: c.label,
      searchText: c.searchText || c.label,
      region: c.region || "Other",
    }));
  }, [countryPickerScope]);

  const countryGroups = useMemo(() => {
    const popularSet = new Set(POPULAR_COUNTRY_CODES);
    const popular = countryOptions.filter((c) => popularSet.has(c.value));

    if (countryPickerScope === "all") {
      const popularValues = new Set(popular.map((c) => c.value));
      const rest = countryOptions.filter((c) => !popularValues.has(c.value));
      return [
        { title: "Popular", items: popular },
        { title: "All countries", items: rest },
      ].filter((g) => g.items.length > 0);
    }

    const byRegion = {};
    for (const c of countryOptions) {
      if (popularSet.has(c.value)) continue;
      const region = c.region || "Other";
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(c);
    }
    const regionOrder = ["Asia", "Middle East", "Africa", "Europe", "Americas", "Oceania", "Other"];
    const groups = [{ title: "Popular", items: popular }];
    for (const region of regionOrder) {
      if (byRegion[region]?.length) {
        groups.push({ title: region, items: byRegion[region] });
      }
    }
    return groups.filter((g) => g.items.length > 0);
  }, [countryOptions, countryPickerScope]);

  return (
    <BlockStack gap="300">
      {(title || subtitle) && (
        <BlockStack gap="100">
          {title ? (
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text as="p" variant="bodySm" tone="subdued">
              {subtitle}
            </Text>
          ) : null}
        </BlockStack>
      )}

      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" padding="400">
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              Select Market
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Choose how customers pay on this storefront.
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => onMarketTypeChange?.("cod")}
                style={{
                  textAlign: "left",
                  padding: "14px",
                  borderRadius: "10px",
                  border: `1px solid ${marketType === "cod" ? ACCENT : "#d1d5db"}`,
                  boxShadow: "none",
                  background: marketType === "cod" ? ACCENT_SOFT : "#ffffff",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <BlockStack gap="100">
                  <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
                    <RadioButton
                      label="COD market"
                      labelHidden
                      name="marketType"
                      checked={marketType === "cod"}
                      onChange={() => {}}
                    />
                  </div>
                  <Text as="h4" variant="bodyMd" fontWeight="semibold">
                    COD market
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    COD market which accepts{" "}
                    <Text as="span" variant="bodySm" fontWeight="bold">
                      both cash on delivery and prepaid orders
                    </Text>
                  </Text>
                </BlockStack>
              </button>
              <button
                type="button"
                onClick={() => onMarketTypeChange?.("prepaid")}
                style={{
                  textAlign: "left",
                  padding: "14px",
                  borderRadius: "10px",
                  border: `1px solid ${marketType === "prepaid" ? ACCENT : "#d1d5db"}`,
                  boxShadow: "none",
                  background: marketType === "prepaid" ? ACCENT_SOFT : "#ffffff",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <BlockStack gap="100">
                  <div style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none" }}>
                    <RadioButton
                      label="Prepaid market"
                      labelHidden
                      name="marketType"
                      checked={marketType === "prepaid"}
                      onChange={() => {}}
                    />
                  </div>
                  <Text as="h4" variant="bodyMd" fontWeight="semibold">
                    Prepaid market
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Prepaid market which accepts{" "}
                    <Text as="span" variant="bodySm" fontWeight="bold">
                      only prepaid orders
                    </Text>
                  </Text>
                </BlockStack>
              </button>
            </div>
          </BlockStack>
        </Box>
      </Card>

      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" padding="400" overflowX="visible" overflowY="visible">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              alignItems: "stretch",
              overflow: "visible",
            }}
          >
            <FlagSearchPicker
              label="Store Language"
              description="AI-generated store and product copy uses this language on the next generate. Buttons follow your Shopify store language. Product titles stay as entered in Shopify."
              placeholder="Select language"
              searchPlaceholder="Search languages…"
              value={effectiveLanguage}
              options={languageOptions}
              groups={languageGroups}
              onChange={(v) => onLanguageChange?.(v || null)}
            />
            <FlagSearchPicker
              label="Target Audience"
              description="Primary country you sell to."
              placeholder="Select country"
              searchPlaceholder="Search markets…"
              value={countryCode || ""}
              options={countryOptions}
              groups={countryGroups}
              onChange={(v) => onCountryCodeChange?.(v || null)}
            />
          </div>
          <Box paddingBlockStart="300">
            <Text as="p" variant="bodySm" tone="subdued">
              Shop primary locale: {getSupportedLanguage(primarySupportedValue).flag}{" "}
              {getSupportedLanguage(primarySupportedValue).name}
            </Text>
          </Box>
        </Box>
      </Card>
    </BlockStack>
  );
}

export function areMarketPreferencesComplete({ marketType, countryCode, language }) {
  return Boolean(marketType && countryCode && language);
}

export async function saveShopMarketPreferences({
  marketType,
  countryCode,
  language,
}) {
  const response = await fetch("/api/shop-market-preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      market_type: marketType,
      country_code: countryCode,
      language,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "Failed to save market preferences");
  }
  return {
    ...data,
    preferences: {
      market_type: marketType,
      country_code: countryCode,
      language,
      ...(data?.preferences || {}),
    },
  };
}
