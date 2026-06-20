/** Allowed default currencies per profile country (ISO-ish country names from onboarding). */
const COUNTRY_CURRENCY: Record<string, string[]> = {
  GB: ["GBP"],
  UK: ["GBP"],
  "UNITED KINGDOM": ["GBP"],
  US: ["USD"],
  USA: ["USD"],
  "UNITED STATES": ["USD"],
  IE: ["EUR"],
  IRELAND: ["EUR"],
  DE: ["EUR"],
  GERMANY: ["EUR"],
  FR: ["EUR"],
  FRANCE: ["EUR"],
  ES: ["EUR"],
  SPAIN: ["EUR"],
  IT: ["EUR"],
  ITALY: ["EUR"],
  NL: ["EUR"],
  NETHERLANDS: ["EUR"],
  AU: ["AUD"],
  AUSTRALIA: ["AUD"],
  CA: ["CAD", "USD"],
  CANADA: ["CAD", "USD"],
};

const GLOBAL_CURRENCIES = ["USD", "EUR", "GBP"];

export function normalizeCountryKey(country: string | null | undefined): string {
  return (country ?? "").trim().toUpperCase();
}

export function isCountryCurrencyConsistent(
  country: string | null | undefined,
  currency: string | null | undefined
): boolean {
  const c = (currency ?? "").trim().toUpperCase();
  if (!c) return false;

  const key = normalizeCountryKey(country);
  if (!key) return GLOBAL_CURRENCIES.includes(c);

  const allowed = COUNTRY_CURRENCY[key];
  if (!allowed) return GLOBAL_CURRENCIES.includes(c);

  return allowed.includes(c);
}

export function describeCountryCurrencyIssue(
  country: string | null | undefined,
  currency: string | null | undefined
): string | null {
  if (isCountryCurrencyConsistent(country, currency)) return null;
  return `Currency ${currency ?? "?"} does not match business country ${country ?? "unknown"}.`;
}
