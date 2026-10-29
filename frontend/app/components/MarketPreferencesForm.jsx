import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Check, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { BlockStack, Text } from "@shopify/polaris";
import FlagIcon from "./FlagIcon.jsx";
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

const ACCENT = "#1e40af";
const ACCENT_SOFT = "#eff4ff";
const BORDER = "#e1e3e5";
const BORDER_SELECTED = ACCENT;
const PICKER_BORDER = "#d4d8e0";

/**
 * Searchable flag picker with SELECTED trigger + scrollable dropdown panel
 * (keeps the menu inside a max-height so it doesn't run off-screen).
 * `overlay` floats the panel over the content below instead of pushing it down.
 */
export function FlagSearchPicker({
  label,
  description,
  placeholder,
  searchPlaceholder,
  value,
  options,
  groups,
  onChange,
  emptyLabel = "Select…",
  overlay = false,
}) {
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);

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
        {label || description ? (
          <BlockStack gap="100">
            {label ? (
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                {label}
              </Text>
            ) : null}
            {description ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {description}
              </Text>
            ) : null}
          </BlockStack>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (!open && overlay && rootRef.current) {
              // Open upward when the list would run past the bottom of the frame (the Shopify
              // Sidekick bar also covers its lowest ~90px).
              const rect = rootRef.current.getBoundingClientRect();
              const roomBelow = window.innerHeight - rect.bottom - 96;
              setDropUp(roomBelow < 320 && rect.top > roomBelow);
            }
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          style={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            textAlign: "left",
            padding: "10px 12px 10px 14px",
            borderRadius: 10,
            border: `1px solid ${open ? BORDER_SELECTED : PICKER_BORDER}`,
            boxShadow: open
              ? "0 0 0 3px rgba(30, 64, 175, 0.14)"
              : "0 1px 2px rgba(16, 24, 40, 0.05)",
            background: "#fff",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "border-color 120ms ease, box-shadow 120ms ease",
          }}
        >
          {selected ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
                fontSize: 14.5,
                fontWeight: 550,
                color: "#111827",
              }}
            >
              <FlagIcon flag={selected.flag} width={24} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.label}
              </span>
            </span>
          ) : (
            <span style={{ color: "#6b7280", fontSize: 14 }}>{placeholder || emptyLabel}</span>
          )}
          <ChevronDown
            aria-hidden
            size={18}
            color="#6b7280"
            style={{
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 120ms ease",
            }}
          />
        </button>
      </BlockStack>

      {open ? (
        <div
          style={{
            ...(overlay
              ? dropUp
                ? { position: "absolute", bottom: 56, left: 0, right: 0 }
                : { position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0 }
              : { position: "relative", marginTop: 8 }),
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
                        <FlagIcon flag={item.flag} width={22} />
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
 * Language + country picker options and their dropdown groups.
 * @param {"curated" | "all"} countryPickerScope `"curated"` = short store list, `"all"` = full ISO list.
 */
export function useMarketPickerOptions(countryPickerScope = "curated") {
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

  return { languageOptions, languageGroups, countryOptions, countryGroups };
}

const MARKET_OPTIONS = [
  {
    value: "cod",
    title: "COD market",
    description: "Customers can pay on delivery or prepay online.",
    tag: "Cash + prepaid",
    icon: Banknote,
  },
  {
    value: "prepaid",
    title: "Prepaid market",
    description: "Orders are accepted only when paid up front.",
    tag: "Prepaid only",
    icon: CreditCard,
  },
];

/** Vertical radio list: one compact row per market, the chosen row gets an accent bar and fill. */
function MarketOptionList({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Market"
      className="overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-slate-200"
    >
      {MARKET_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(option.value)}
            className={`relative flex w-full items-center gap-3 px-4 py-3 text-left transition focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a] ${
              index > 0 ? "border-t border-slate-100" : ""
            } ${selected ? "bg-blue-50/70" : "hover:bg-slate-50"}`}
          >
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 w-1 transition ${selected ? "bg-[#1e40af]" : "bg-transparent"}`}
            />
            <span
              aria-hidden
              className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full ring-1 ring-inset transition ${
                selected ? "bg-[#1e40af] ring-[#1e40af]" : "bg-white ring-slate-300"
              }`}
            >
              {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
            </span>
            <span
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                selected ? "bg-[#1e3a8a] text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon size={18} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
              <span className="block text-[13px] leading-snug text-slate-500">{option.description}</span>
            </span>
            <span
              className={`hidden flex-none rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-block ${
                selected ? "bg-[#1e3a8a]/10 text-[#1e3a8a]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {option.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Round status badge: green tick once the setting is done, a numbered ring until then. */
function StatusBadge({ done, number }) {
  return (
    <span
      aria-hidden
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold transition ${
        done
          ? "bg-emerald-500 text-white shadow-[0_4px_10px_-4px_rgba(16,185,129,0.8)]"
          : "bg-white text-slate-400 ring-1 ring-inset ring-slate-300"
      }`}
    >
      {done ? <Check size={15} strokeWidth={3} /> : number}
    </span>
  );
}

/**
 * One setting in the vertical stack, as a drawer: the header (badge, title, chosen value and a
 * chevron) toggles the body. Closed rows show what was chosen instead of the help text.
 */
export function SettingRow({ number, done, title, description, summary, open, onToggle, children }) {
  return (
    <section
      className={`rounded-xl ring-1 ring-inset transition ${
        done ? "bg-emerald-50/40 ring-emerald-200/70" : "bg-white ring-slate-200"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] sm:px-5"
      >
        <StatusBadge done={done} number={number} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-6 text-slate-900">{title}</span>
          {open ? (
            <span className="block text-[13px] leading-snug text-slate-500">{description}</span>
          ) : null}
        </span>
        {!open && summary ? (
          <span className="flex min-w-0 max-w-[55%] items-center gap-2 text-sm font-medium text-slate-700">
            {summary}
          </span>
        ) : null}
        <ChevronUp
          aria-hidden
          size={18}
          className={`flex-none text-slate-500 transition-transform duration-200 ${open ? "" : "rotate-180"}`}
        />
      </button>
      {open ? <div className="market-drawer-in px-4 pb-4 sm:pl-[60px] sm:pr-5 sm:pb-5">{children}</div> : null}
    </section>
  );
}

/**
 * Preferences form: market, language and country stacked vertically. Each setting shows a green
 * tick once it is chosen.
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
  subtitle,
  /** `"curated"` = short store list (Preferences). `"all"` = full ISO list (onboarding). */
  countryPickerScope = "curated",
}) {
  const primaryLocaleCode = shopLocales?.find?.((l) => l.primary)?.locale ?? "en";
  const primarySupportedValue = mapShopLocaleToSupported(primaryLocaleCode);
  const effectiveLanguage = language || primarySupportedValue;
  const { languageOptions, languageGroups, countryOptions, countryGroups } =
    useMarketPickerOptions(countryPickerScope);

  // Drawers: the first is open to start; choosing a value closes it and opens the next one.
  const [openStep, setOpenStep] = useState(1);
  const toggle = (step) => setOpenStep((current) => (current === step ? null : step));

  const marketOption = MARKET_OPTIONS.find((o) => o.value === marketType) || null;
  const languageOption = languageOptions.find((o) => o.value === effectiveLanguage) || null;
  const countryOption = countryOptions.find((o) => o.value === countryCode) || null;
  // One live sentence that restates the choices; an explicit `subtitle` prop replaces it.
  const strong = (text) => <span className="font-semibold text-slate-700">{text}</span>;
  const summaryLine =
    subtitle !== undefined ? (
      subtitle
    ) : (
      <>
        Your next Entire Store will be written in{" "}
        {strong(getSupportedLanguage(effectiveLanguage).name)}
        {countryOption ? (
          <>
            {" "}for customers in {strong(countryOption.label)}
          </>
        ) : null}
        {marketOption ? <> as a {strong(marketOption.title)}</> : null}
        {countryOption ? "." : ". Choose a country to finish."}
      </>
    );
  const optionSummary = (option) =>
    option ? (
      <>
        <FlagIcon flag={option.flag} width={20} />
        <span className="truncate">{option.label}</span>
      </>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {(title || summaryLine) && (
        <div>
          {title ? <h3 className="m-0 text-[15px] font-semibold text-slate-900">{title}</h3> : null}
          {summaryLine ? (
            <p className="m-0 mt-1 text-[13px] leading-snug text-slate-500">{summaryLine}</p>
          ) : null}
        </div>
      )}

      <SettingRow
        number={1}
        done={Boolean(marketType)}
        title="Market"
        description="Choose how customers pay on this storefront."
        summary={marketOption ? <span className="truncate">{marketOption.title}</span> : null}
        open={openStep === 1}
        onToggle={() => toggle(1)}
      >
        <MarketOptionList
          value={marketType}
          onChange={(v) => {
            onMarketTypeChange?.(v);
            setOpenStep(2);
          }}
        />
      </SettingRow>

      <SettingRow
        number={2}
        done={Boolean(effectiveLanguage)}
        title="Store language"
        description="AI-generated store and product copy uses this language on the next generate. Buttons follow your Shopify store language; product titles stay as entered in Shopify."
        summary={optionSummary(languageOption)}
        open={openStep === 2}
        onToggle={() => toggle(2)}
      >
        <FlagSearchPicker
          overlay
          placeholder="Select language"
          searchPlaceholder="Search languages…"
          value={effectiveLanguage}
          options={languageOptions}
          groups={languageGroups}
          onChange={(v) => {
            onLanguageChange?.(v || null);
            setOpenStep(3);
          }}
        />
        <p className="m-0 mt-2 text-xs text-slate-500">
          Shop primary locale: {getSupportedLanguage(primarySupportedValue).name}
        </p>
      </SettingRow>

      <SettingRow
        number={3}
        done={Boolean(countryCode)}
        title="Target audience"
        description="The primary country you sell to."
        summary={optionSummary(countryOption)}
        open={openStep === 3}
        onToggle={() => toggle(3)}
      >
        <FlagSearchPicker
          overlay
          placeholder="Select country"
          searchPlaceholder="Search markets…"
          value={countryCode || ""}
          options={countryOptions}
          groups={countryGroups}
          onChange={(v) => {
            onCountryCodeChange?.(v || null);
            setOpenStep(null);
          }}
        />
      </SettingRow>
    </div>
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
