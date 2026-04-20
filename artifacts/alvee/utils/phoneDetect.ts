import { COUNTRIES, Country } from "@/constants/countries";

export function detectCountryFromPhone(phone: string): Country | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (!cleaned.startsWith("+")) return null;
  const sorted = [...COUNTRIES].sort((a, b) => b.phonePrefix.length - a.phonePrefix.length);
  return sorted.find(c => cleaned.startsWith(c.phonePrefix)) || null;
}
