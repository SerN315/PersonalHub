// Which country's "popular music" to show first. Only countries YouTube has charts for AND that this list names are offered.

export const REGIONS: [code: string, name: string][] = [
  ["US", "United States"],
  ["VN", "Vietnam"],
  ["JP", "Japan"],
  ["KR", "Korea"],
  ["GB", "United Kingdom"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["BR", "Brazil"],
  ["IN", "India"],
  ["AU", "Australia"],
  ["CA", "Canada"],
];

// "vi-VN" -> "VN"; anything unknown (or missing) -> "US"
export function regionFromLocale(locale: string | undefined): string {
  const code = /^[A-Za-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(locale ?? "")?.[1]?.toUpperCase();
  return code && REGIONS.some(([known]) => known === code) ? code : "US";
}
