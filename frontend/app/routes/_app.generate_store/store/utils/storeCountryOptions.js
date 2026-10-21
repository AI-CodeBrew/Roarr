/**
 * Curated country list for Entire Store configure (COD vs prepaid markets).
 * value = ISO 3166-1 alpha-2
 */

/** ISO alpha-2 → regional-indicator flag emoji */
export function countryCodeToFlag(code) {
  const cc = String(code || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🌐";
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
  );
}

export const STORE_COUNTRY_OPTIONS = [
  { value: "PK", label: "Pakistan", region: "Asia" },
  { value: "IN", label: "India", region: "Asia" },
  { value: "BD", label: "Bangladesh", region: "Asia" },
  { value: "AE", label: "United Arab Emirates", region: "Middle East" },
  { value: "SA", label: "Saudi Arabia", region: "Middle East" },
  { value: "EG", label: "Egypt", region: "Middle East" },
  { value: "NG", label: "Nigeria", region: "Africa" },
  { value: "KE", label: "Kenya", region: "Africa" },
  { value: "ZA", label: "South Africa", region: "Africa" },
  { value: "ID", label: "Indonesia", region: "Asia" },
  { value: "MY", label: "Malaysia", region: "Asia" },
  { value: "PH", label: "Philippines", region: "Asia" },
  { value: "VN", label: "Vietnam", region: "Asia" },
  { value: "TH", label: "Thailand", region: "Asia" },
  { value: "TR", label: "Turkey", region: "Europe" },
  { value: "BR", label: "Brazil", region: "Americas" },
  { value: "MX", label: "Mexico", region: "Americas" },
  { value: "US", label: "United States", region: "Americas" },
  { value: "GB", label: "United Kingdom", region: "Europe" },
  { value: "CA", label: "Canada", region: "Americas" },
  { value: "AU", label: "Australia", region: "Oceania" },
  { value: "DE", label: "Germany", region: "Europe" },
  { value: "FR", label: "France", region: "Europe" },
  { value: "ES", label: "Spain", region: "Europe" },
  { value: "IT", label: "Italy", region: "Europe" },
  { value: "NL", label: "Netherlands", region: "Europe" },
].map((c) => ({
  ...c,
  flag: countryCodeToFlag(c.value),
}));

/** Featured countries shown under "Popular" in the country picker. */
export const POPULAR_COUNTRY_CODES = ["PK", "IN", "AE", "SA", "US", "GB", "CA", "AU"];
