export const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  MMK: "🇲🇲",
  THB: "🇹🇭",
  JPY: "🇯🇵",
  SGD: "🇸🇬",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CNY: "🇨🇳",
  INR: "🇮🇳",
  HKD: "🇭🇰",
}

export function currencyFlag(code: string): string {
  return CURRENCY_FLAGS[code.toUpperCase()] ?? "💱"
}
