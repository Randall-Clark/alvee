export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
}

export const COUNTRIES: Country[] = [
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", currencySymbol: "$", phonePrefix: "+1" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", currencySymbol: "€", phonePrefix: "+33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", currency: "EUR", currencySymbol: "€", phonePrefix: "+32" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", currency: "CHF", currencySymbol: "CHF", phonePrefix: "+41" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", currency: "USD", currencySymbol: "$", phonePrefix: "+1" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", currency: "GBP", currencySymbol: "£", phonePrefix: "+44" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", currency: "MAD", currencySymbol: "DH", phonePrefix: "+212" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", currency: "DZD", currencySymbol: "DA", phonePrefix: "+213" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", currency: "TND", currencySymbol: "DT", phonePrefix: "+216" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", currencySymbol: "CFA", phonePrefix: "+221" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", currencySymbol: "CFA", phonePrefix: "+225" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", currencySymbol: "CFA", phonePrefix: "+237" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", currency: "EUR", currencySymbol: "€", phonePrefix: "+49" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", currency: "EUR", currencySymbol: "€", phonePrefix: "+34" },
  { code: "IT", name: "Italie", flag: "🇮🇹", currency: "EUR", currencySymbol: "€", phonePrefix: "+39" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR", currencySymbol: "€", phonePrefix: "+351" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", currency: "EUR", currencySymbol: "€", phonePrefix: "+31" },
  { code: "AU", name: "Australie", flag: "🇦🇺", currency: "AUD", currencySymbol: "$", phonePrefix: "+61" },
  { code: "JP", name: "Japon", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥", phonePrefix: "+81" },
  { code: "MX", name: "Mexique", flag: "🇲🇽", currency: "MXN", currencySymbol: "$", phonePrefix: "+52" },
  { code: "BR", name: "Brésil", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$", phonePrefix: "+55" },
  { code: "HT", name: "Haïti", flag: "🇭🇹", currency: "HTG", currencySymbol: "G", phonePrefix: "+509" },
  { code: "LB", name: "Liban", flag: "🇱🇧", currency: "LBP", currencySymbol: "L£", phonePrefix: "+961" },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export const DEFAULT_COUNTRY = COUNTRIES[0];
