import { countryCodeToFlag } from "../routes/_app.generate_store/store/utils/storeCountryOptions.js";

/** Non-country ISO region codes returned by Intl.supportedValuesOf("region"). */
const EXCLUDED_REGION_CODES = new Set(["EU", "EZ", "UN", "XA", "XB"]);

/**
 * Full ISO 3166-1 alpha-2 country list for onboarding target audience.
 * Uses Intl when available; falls back to DisplayNames over a static code list.
 */
export function getAllCountryOptions() {
  let codes = [];
  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      codes = Intl.supportedValuesOf("region").filter(
        (code) => /^[A-Z]{2}$/.test(code) && !EXCLUDED_REGION_CODES.has(code),
      );
    }
  } catch {
    codes = [];
  }

  if (codes.length < 100) {
    codes = STATIC_ISO_COUNTRY_CODES;
  }

  let displayNames;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    displayNames = null;
  }

  const options = [];
  for (const value of codes) {
    const label = displayNames?.of(value) || value;
    if (!label || label === value) continue;
    options.push({
      value,
      label,
      flag: countryCodeToFlag(value),
      searchText: label,
      region: "Other",
    });
  }

  options.sort((a, b) => a.label.localeCompare(b.label, "en"));
  return options;
}

/** Fallback when Intl.supportedValuesOf is unavailable (older runtimes). */
const STATIC_ISO_COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
];
