// Calendar dates for the planner. A due date is a plain "YYYY-MM-DD" ("that day, wherever you are"); all the arithmetic is
// whole days in UTC, so daylight saving and time zones can never move a task to a different day.

const DAY_MS = 86_400_000

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}
export const fromParts = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`;
const toDayNumber = (iso: string) => {
  const { y, m, d } = parts(iso);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
};
const fromDayNumber = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const isValidDate = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { y, m, d } = parts(iso);
  return y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
};

// "Today" on the person's own clock (not UTC's).
export const localToday = (now: Date = new Date()) => fromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
// Minutes east of UTC (Vietnam is +420): lets the server say which of YOUR days a completion belongs to.
export const tzOffsetMinutes = (now: Date = new Date()) => -now.getTimezoneOffset();
// How long until the person's clock rolls over to the next day (so "today" can be refreshed without a reload).
export function msUntilMidnight(now: Date = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}

export const addDays = (iso: string, n: number) => fromDayNumber(toDayNumber(iso) + n);
export const diffDays = (a: string, b: string) => toDayNumber(a) - toDayNumber(b); // a - b
export const weekdayOf = (iso: string) => new Date(toDayNumber(iso) * DAY_MS).getUTCDay(); // 0 = Sunday

export function addMonths(iso: string, n: number) {
  const { y, m, d } = parts(iso);
  const index = y * 12 + (m - 1) + n;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return fromParts(year, month, Math.min(d, daysInMonth(year, month)));
}

// The next date (strictly after `from`) that falls on `weekday` (0 = Sunday).
export function nextWeekday(from: string, weekday: number) {
  const ahead = (weekday - weekdayOf(from) + 7) % 7;
  return addDays(from, ahead === 0 ? 7 : ahead);
}

// A calendar page for one month: 6 weeks of 7 days starting on `weekStartsOn` (1 = Monday), with the month's own days flagged.
export function monthGrid(year: number, month: number, weekStartsOn = 1) {
  const first = fromParts(year, month, 1);
  const lead = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => {
    const iso = addDays(start, i);
    return { iso, inMonth: parts(iso).m === month };
  });
}

// ---- words for people ----------------------------------------------------------------------------------------------------------------

// "Today", "Tomorrow", "Yesterday", "Mon 26 Oct", "26 Oct 2027"
export function dayLabel(iso: string, today: string) {
  const diff = diffDays(iso, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const { y, m, d } = parts(iso);
  const base = `${d} ${MONTHS_SHORT[m - 1]}`;
  if (Math.abs(diff) < 7) return `${WEEKDAYS_SHORT[weekdayOf(iso)]} ${base}`;
  return y === parts(today).y ? base : `${base} ${y}`;
}

export function timeLabel(time: string, locale = "en-US") {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export function repeatLabel(every: number | null, unit: string | null) {
  if (!unit || !every) return "";
  if (unit === "weekday") return "Every weekday";
  const names: Record<string, string> = { day: "day", week: "week", month: "month", year: "year" };
  return every === 1 ? `Every ${names[unit]}` : `Every ${every} ${names[unit]}s`;
}
