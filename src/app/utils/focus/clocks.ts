// World clocks for the Focus tab's "time desk". Only the browser's own time zone data is used (Intl), so nothing is looked up or sent anywhere.

export interface Zone {
  name: string;
  tz: string; // an IANA time zone
}

export const ZONES: Zone[] = [
  { name: "Ho Chi Minh City", tz: "Asia/Ho_Chi_Minh" },
  { name: "Bangkok", tz: "Asia/Bangkok" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Hong Kong", tz: "Asia/Hong_Kong" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Seoul", tz: "Asia/Seoul" },
  { name: "Manila", tz: "Asia/Manila" },
  { name: "Jakarta", tz: "Asia/Jakarta" },
  { name: "Mumbai", tz: "Asia/Kolkata" },
  { name: "Dhaka", tz: "Asia/Dhaka" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Istanbul", tz: "Europe/Istanbul" },
  { name: "Moscow", tz: "Europe/Moscow" },
  { name: "Cairo", tz: "Africa/Cairo" },
  { name: "Nairobi", tz: "Africa/Nairobi" },
  { name: "Johannesburg", tz: "Africa/Johannesburg" },
  { name: "Berlin", tz: "Europe/Berlin" },
  { name: "Paris", tz: "Europe/Paris" },
  { name: "London", tz: "Europe/London" },
  { name: "Lisbon", tz: "Europe/Lisbon" },
  { name: "Reykjavik", tz: "Atlantic/Reykjavik" },
  { name: "Sao Paulo", tz: "America/Sao_Paulo" },
  { name: "Buenos Aires", tz: "America/Argentina/Buenos_Aires" },
  { name: "New York", tz: "America/New_York" },
  { name: "Chicago", tz: "America/Chicago" },
  { name: "Denver", tz: "America/Denver" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Mexico City", tz: "America/Mexico_City" },
  { name: "Anchorage", tz: "America/Anchorage" },
  { name: "Honolulu", tz: "Pacific/Honolulu" },
  { name: "Sydney", tz: "Australia/Sydney" },
  { name: "Auckland", tz: "Pacific/Auckland" },
];

export const MAX_CLOCKS = 6;

const known = new Map(ZONES.map((zone) => [zone.tz, zone]));

// Anything (localStorage, an old version) in, a short valid list of known zones out.
export function cleanZones(raw: unknown): Zone[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Zone[] = [];
  for (const item of raw) {
    const zone = typeof item === "string" ? known.get(item) : undefined;
    if (zone && !seen.has(zone.tz)) {
      seen.add(zone.tz);
      out.push(zone);
    }
    if (out.length >= MAX_CLOCKS) break;
  }
  return out;
}

// Minutes the zone is ahead of UTC at that moment (daylight saving included).
export function zoneOffsetMinutes(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

// "same time as you", "3 hours ahead", "5 hours 30 minutes behind"
export function differenceLabel(tz: string, at: Date, localOffsetMinutes: number = -at.getTimezoneOffset()) {
  const diff = zoneOffsetMinutes(tz, at) - localOffsetMinutes;
  if (diff === 0) return "same time as you";
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const amount = [hours ? `${hours} hour${hours === 1 ? "" : "s"}` : "", minutes ? `${minutes} minutes` : ""].filter(Boolean).join(" ");
  return `${amount} ${diff > 0 ? "ahead" : "behind"}`;
}

export function timeIn(tz: string, at: Date) {
  const time = new Intl.DateTimeFormat([], { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(at);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(at);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", hour: "numeric" }).format(at));
  return { time, weekday, daytime: hour >= 6 && hour < 18 };
}
