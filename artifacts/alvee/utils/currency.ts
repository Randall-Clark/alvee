import { getCountryByCode, DEFAULT_COUNTRY } from "@/constants/countries";

const EXCHANGE_RATES: Record<string, number> = {
  CAD: 1,
  USD: 0.73,
  EUR: 0.67,
  GBP: 0.57,
  CHF: 0.66,
  MAD: 7.35,
  DZD: 97.5,
  TND: 2.25,
  XOF: 440,
  XAF: 440,
  AUD: 1.12,
  JPY: 109,
  MXN: 13.2,
  BRL: 3.8,
  HTG: 95,
  LBP: 65500,
};

export function formatPrice(priceCAD: number, countryCode?: string | null): string {
  if (priceCAD === 0) return "Gratuit";

  const country = countryCode ? getCountryByCode(countryCode) : DEFAULT_COUNTRY;
  const curr = country ?? DEFAULT_COUNTRY;

  const rate = EXCHANGE_RATES[curr.currency] ?? 1;
  const converted = Math.round(priceCAD * rate);

  if (curr.currency === "JPY") {
    return `${curr.currencySymbol}${converted.toLocaleString("fr-FR")}`;
  }
  if (["XOF", "XAF", "MAD", "DZD", "TND"].includes(curr.currency)) {
    return `${converted.toLocaleString("fr-FR")} ${curr.currencySymbol}`;
  }

  return `${curr.currencySymbol}${converted}`;
}
