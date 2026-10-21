import { MONTHS_SHORT, addDays, addMonths, daysInMonth, fromParts, isValidDate, nextWeekday, parts } from "./dates.ts";

// Turns a sentence into a task:  "pay rent friday 5pm !high #home every month"
//   dates   today, tomorrow, friday, next monday, in 3 days, next week, oct 25, 25 oct, 2026-10-25
//   time    5pm, 5:30pm, 17:30, at noon
//   repeat  every day / week / month / year / weekday / other week / 3 days, every monday, daily, weekly...
//   flags   !1 !2 !3 (or !low !med !high), #tag, @list
// Anything it does not recognise stays in the title, and it never swallows ordinary words: "may I", "sun cream" and
// "plan today's meeting" are left alone.

export type RepeatUnit = "day" | "weekday" | "week" | "month" | "year";
export interface QuickAddChip {
  kind: "date" | "time" | "priority" | "tag" | "list" | "repeat";
  label: string;
}
export interface QuickAdd {
  text: string;
  due_date: string | null;
  due_time: string | null;
  priority: 0 | 1 | 2 | 3;
  tags: string[];
  listId: string | null;
  repeat: { every: number; unit: RepeatUnit } | null;
  chips: QuickAddChip[];
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_ABBR = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const WORD_END = "(?![\\w'’])"; // not followed by a letter or an apostrophe ("today's" is not "today")
const dayIndex = (word: string) => {
  const w = word.toLowerCase();
  const full = DAY_NAMES.indexOf(w);
  return full >= 0 ? full : DAY_ABBR.indexOf(w.slice(0, 3));
};
const monthIndex = (word: string) => {
  const w = word.toLowerCase().replace(/\.$/, "");
  const full = MONTH_NAMES.indexOf(w);
  return full >= 0 ? full : MONTH_NAMES.findIndex((name) => name.slice(0, 3) === w && w.length === 3);
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Working {
  rest: string;
  chips: QuickAddChip[];
}

// Like take(), but leaves the text exactly as typed unless `valid(match)` says it is a real date or time.
function takeIf(work: Working, re: RegExp, valid: (match: RegExpExecArray) => boolean) {
  const match = re.exec(work.rest);
  if (!match || !valid(match)) return null;
  work.rest = work.rest.slice(0, match.index) + " " + work.rest.slice(match.index + match[0].length);
  return match;
}
// Remove the first match of `re` (replacing it with a space) and return its groups, or null.
function take(work: Working, re: RegExp) {
  const match = re.exec(work.rest);
  if (!match) return null;
  work.rest = work.rest.slice(0, match.index) + " " + work.rest.slice(match.index + match[0].length);
  return match;
}

export function parseQuickAdd(input: string, ctx: { today: string; lists?: { id: string; name: string }[] }): QuickAdd {
  const original = input.trim();
  const empty: QuickAdd = { text: original, due_date: null, due_time: null, priority: 0, tags: [], listId: null, repeat: null, chips: [] };
  if (!original) return empty;

  const work: Working = { rest: ` ${original} `, chips: [] };
  const result: QuickAdd = { ...empty, tags: [], chips: work.chips };

  // priority: !1 !2 !3 !low !med !medium !high
  const priority = take(work, /(?<=\s)!(1|2|3|low|med|medium|high)(?=\s)/i);
  if (priority) {
    const word = priority[1].toLowerCase();
    result.priority = (word === "1" || word === "low" ? 1 : word === "2" || word === "med" || word === "medium" ? 2 : 3) as 1 | 2 | 3;
    work.chips.push({ kind: "priority", label: ["", "Low", "Medium", "High"][result.priority] });
  }

  // #tags
  for (let match = take(work, /(?<=\s)#([\p{L}\p{N}_-]{1,24})(?=\s)/iu); match && result.tags.length < 8; match = take(work, /(?<=\s)#([\p{L}\p{N}_-]{1,24})(?=\s)/iu)) {
    if (!result.tags.some((t) => t.toLowerCase() === match![1].toLowerCase())) {
      result.tags.push(match[1]);
      work.chips.push({ kind: "tag", label: `#${match[1]}` });
    }
  }

  // @list (only if it names a list that exists; otherwise it is just text)
  const listMatch = /(?<=\s)@([\p{L}\p{N}_-]{1,40})(?=\s)/iu.exec(work.rest);
  if (listMatch && ctx.lists) {
    const wanted = listMatch[1].toLowerCase();
    const found = ctx.lists.find((l) => l.name.toLowerCase().replace(/\s+/g, "-") === wanted || l.name.toLowerCase() === wanted);
    if (found) {
      take(work, /(?<=\s)@([\p{L}\p{N}_-]{1,40})(?=\s)/iu);
      result.listId = found.id;
      work.chips.push({ kind: "list", label: `@${found.name}` });
    }
  }

  // repeat ----------------------------------------------------------------------------------------------------------------------
  let impliedDate: string | null = null;
  const setRepeat = (every: number, unit: RepeatUnit, label: string) => {
    result.repeat = { every, unit };
    work.chips.push({ kind: "repeat", label });
  };
  let m: RegExpExecArray | null;
  if ((m = take(work, new RegExp(`(?<=\\s)every\\s+(other\\s+)?(weekday|day|week|month|year)s?${WORD_END}`, "i")))) {
    const unit = m[2].toLowerCase() as RepeatUnit;
    const every = m[1] && unit !== "weekday" ? 2 : 1;
    setRepeat(every, unit, unit === "weekday" ? "Every weekday" : every === 2 ? `Every other ${unit}` : `Every ${unit}`);
  } else if ((m = take(work, new RegExp(`(?<=\\s)every\\s+(\\d{1,2})\\s+(day|week|month|year)s?${WORD_END}`, "i")))) {
    const every = Number(m[1]);
    if (every >= 1) setRepeat(every, m[2].toLowerCase() as RepeatUnit, every === 1 ? `Every ${m[2].toLowerCase()}` : `Every ${every} ${m[2].toLowerCase()}s`);
  } else if ((m = take(work, new RegExp(`(?<=\\s)every\\s+(${DAY_NAMES.join("|")}|${DAY_ABBR.join("|")})${WORD_END}`, "i")))) {
    const wd = dayIndex(m[1]);
    impliedDate = nextWeekday(ctx.today, wd);
    setRepeat(1, "week", `Every ${cap(DAY_NAMES[wd])}`);
  } else if ((m = take(work, new RegExp(`(?<=\\s)(daily|weekly|monthly|yearly|annually)${WORD_END}`, "i")))) {
    const word = m[1].toLowerCase();
    const unit: RepeatUnit = word === "daily" ? "day" : word === "weekly" ? "week" : word === "monthly" ? "month" : "year";
    setRepeat(1, unit, `Every ${unit}`);
  }

  // date --------------------------------------------------------------------------------------------------------------------------
  const connector = "(?:(?:on|by|due|before)\\s+)?";
  const setDate = (iso: string | null) => {
    if (iso && isValidDate(iso)) {
      result.due_date = iso;
      work.chips.push({ kind: "date", label: iso });
    }
  };
  if ((m = takeIf(work, /(?<=\s)(?:(?:on|by|due|before)\s+)?(\d{4}-\d{2}-\d{2})(?=\s)/, (x) => isValidDate(x[1])))) setDate(m[1]);
  // "tom" and "tod" are names (Tom, Tod), so only the unambiguous words count
  else if ((m = take(work, new RegExp(`(?<=\\s)${connector}(today)${WORD_END}`, "i")))) setDate(ctx.today);
  else if ((m = take(work, new RegExp(`(?<=\\s)${connector}(tomorrow|tmrw|tmr)${WORD_END}`, "i")))) setDate(addDays(ctx.today, 1));
  else if ((m = take(work, new RegExp(`(?<=\\s)${connector}in\\s+(\\d{1,3})\\s+(day|week|month)s?${WORD_END}`, "i")))) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    setDate(unit === "day" ? addDays(ctx.today, n) : unit === "week" ? addDays(ctx.today, n * 7) : addMonths(ctx.today, n));
  } else if ((m = take(work, new RegExp(`(?<=\\s)${connector}next\\s+(week|month|year)${WORD_END}`, "i")))) {
    const unit = m[1].toLowerCase();
    setDate(unit === "week" ? addDays(ctx.today, 7) : unit === "month" ? addMonths(ctx.today, 1) : addMonths(ctx.today, 12));
  } else if ((m = take(work, new RegExp(`(?<=\\s)(?:(?:on|by|due|before)\\s+)?(?:next\\s+|this\\s+)?(${DAY_NAMES.join("|")})${WORD_END}`, "i")))) {
    setDate(nextWeekday(ctx.today, dayIndex(m[1])));
  } else if ((m = take(work, new RegExp(`(?<=\\s)(?:on|next|this)\\s+(${DAY_ABBR.join("|")})\\.?${WORD_END}`, "i")))) {
    // three-letter day names count only after on/next/this: "sun cream" is not a date
    setDate(nextWeekday(ctx.today, dayIndex(m[1])));
  } else {
    const monthWords = `(${[...MONTH_NAMES, ...MONTHS_SHORT.map((s) => s.toLowerCase())].join("|")})\\.?`;
    const monthDay = new RegExp(`(?<=\\s)${connector}${monthWords}\\s+(\\d{1,2})(?:st|nd|rd|th)?${WORD_END}`, "i");
    const dayMonth = new RegExp(`(?<=\\s)${connector}(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthWords}${WORD_END}`, "i");
    const year = parts(ctx.today).y;
    // "feb 30" is not a date: it stays in the title exactly as typed
    const real = (monthWord: string, day: number) => monthIndex(monthWord) >= 0 && day >= 1 && day <= daysInMonth(year, monthIndex(monthWord) + 1);
    let monthName: string | undefined;
    let dayNumber = 0;
    if ((m = takeIf(work, monthDay, (x) => real(x[1], Number(x[2]))))) [monthName, dayNumber] = [m[1], Number(m[2])];
    else if ((m = takeIf(work, dayMonth, (x) => real(x[2], Number(x[1]))))) [monthName, dayNumber] = [m[2], Number(m[1])];
    if (monthName !== undefined) {
      const month = monthIndex(monthName) + 1;
      let iso = fromParts(year, month, dayNumber);
      if (iso < ctx.today) iso = fromParts(year + 1, month, Math.min(dayNumber, daysInMonth(year + 1, month))); // already past this year: next year
      setDate(iso);
    }
  }

  // time ----------------------------------------------------------------------------------------------------------------------------
  const setTime = (h: number, min: number) => {
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      result.due_time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      work.chips.push({ kind: "time", label: result.due_time });
      return true;
    }
    return false;
  };
  const amPm = new RegExp(`(?<=\\s)(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)${WORD_END}`, "i");
  if ((m = takeIf(work, amPm, (x) => Number(x[1]) >= 1 && Number(x[1]) <= 12 && Number(x[2] ?? 0) <= 59))) {
    setTime((Number(m[1]) % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0), Number(m[2] ?? 0));
  } else if ((m = take(work, new RegExp(`(?<=\\s)(?:at\\s+)?([01]?\\d|2[0-3]):([0-5]\\d)${WORD_END}`, "i")))) setTime(Number(m[1]), Number(m[2]));
  else if ((m = take(work, new RegExp(`(?<=\\s)(?:at|by|before)\\s+noon${WORD_END}`, "i")))) setTime(12, 0); // a bare "noon" could be part of a title

  // a time or a repeat with no date means "from today" (or from the weekday that "every monday" named)
  if (!result.due_date && (result.due_time || result.repeat)) {
    result.due_date = impliedDate ?? ctx.today;
    work.chips.unshift({ kind: "date", label: result.due_date });
  } else if (result.repeat && impliedDate && result.due_date === null) {
    result.due_date = impliedDate;
  }

  const text = work.rest.replace(/\s+/g, " ").trim();
  if (!text) return empty; // "tomorrow" on its own is a task called "tomorrow", not an empty task
  return { ...result, text };
}
