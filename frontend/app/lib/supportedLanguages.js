/** Shared language list for store market prefs (onboarding, Settings, store revamp). */
export const SUPPORTED_LANGUAGES = [
  { value: "en", codes: ["en", "en-GB", "en-US"], flag: "🇬🇧", name: "English", nativeName: "English", popular: true },
  { value: "zh", codes: ["zh", "zh-CN", "zh-Hans", "zh-Hant", "zh-TW"], flag: "🇨🇳", name: "Mandarin Chinese", nativeName: "中文", popular: true },
  { value: "es", codes: ["es"], flag: "🇪🇸", name: "Spanish", nativeName: "Español", popular: true },
  { value: "hi", codes: ["hi"], flag: "🇮🇳", name: "Hindi", nativeName: "हिन्दी", popular: true },
  { value: "ar", codes: ["ar"], flag: "🇸🇦", name: "Arabic", nativeName: "العربية", popular: true },
  { value: "fr", codes: ["fr"], flag: "🇫🇷", name: "French", nativeName: "Français", popular: true },
  { value: "pt", codes: ["pt", "pt-PT", "pt-BR"], flag: "🇵🇹", name: "Portuguese", nativeName: "Português", popular: true },
  { value: "ru", codes: ["ru"], flag: "🇷🇺", name: "Russian", nativeName: "Русский" },
  { value: "de", codes: ["de"], flag: "🇩🇪", name: "German", nativeName: "Deutsch", popular: true },
  { value: "ja", codes: ["ja"], flag: "🇯🇵", name: "Japanese", nativeName: "日本語" },
  { value: "ko", codes: ["ko"], flag: "🇰🇷", name: "Korean", nativeName: "한국어" },
  { value: "it", codes: ["it"], flag: "🇮🇹", name: "Italian", nativeName: "Italiano" },
  { value: "tr", codes: ["tr"], flag: "🇹🇷", name: "Turkish", nativeName: "Türkçe" },
  { value: "id", codes: ["id"], flag: "🇮🇩", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { value: "vi", codes: ["vi"], flag: "🇻🇳", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { value: "th", codes: ["th"], flag: "🇹🇭", name: "Thai", nativeName: "ไทย" },
];

export function languageDisplayLabel(lang) {
  if (!lang) return "";
  if (lang.nativeName && lang.nativeName !== lang.name) {
    return `${lang.nativeName} – ${lang.name}`;
  }
  return lang.name;
}

export function mapShopLocaleToSupported(shopCode) {
  if (!shopCode) return SUPPORTED_LANGUAGES[0].value;
  const base = shopCode.split("-")[0].toLowerCase();
  const entry = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.codes.includes(shopCode) ||
      l.codes.includes(shopCode.split("-")[0]) ||
      l.codes.some((c) => c.toLowerCase().startsWith(base)),
  );
  return entry ? entry.value : SUPPORTED_LANGUAGES[0].value;
}

export function getSupportedLanguage(value) {
  return SUPPORTED_LANGUAGES.find((l) => l.value === value) || SUPPORTED_LANGUAGES[0];
}

export function buildLanguageSelectOptions(primarySupportedValue) {
  const primary = getSupportedLanguage(primarySupportedValue);
  const rest = SUPPORTED_LANGUAGES.filter((l) => l.value !== primarySupportedValue);
  return [primary, ...rest].map((l) => ({
    value: l.value,
    label: `${l.flag} ${l.name}`,
  }));
}
