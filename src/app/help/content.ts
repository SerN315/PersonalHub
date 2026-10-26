import type { IconName } from "@/app/components/ultis/iconSet";

// Everything the Help page says lives here, as plain data. The progress figure is COMPUTED from the roadmap (weights and how far
// each item is), so the bar and the list can never disagree. Update this file when something ships.

export const REVIEWED_ON = "22 Oct 2026";

// ---- the guide: what each part is, and why it exists -----------------------------------------------------------------------------------

export interface GuideSection {
  id: string;
  icon: IconName;
  title: string;
  href?: string; // where to go to try it
  open?: string; // the label for that link
  what: string;
  why: string;
  tips: string[];
  parts?: { icon: IconName; name: string; text: string }[];
}

export const GUIDE: GuideSection[] = [
  {
    id: "idea",
    icon: "Coffee01Icon",
    title: "What PersonalHub is for",
    what: "A calm place to start your day: a few small things you glance at, and quick jumps to the tools you use.",
    why: "It is not trying to replace Jira, Notion or your calendar. Those do their jobs better than any copy could. This is the cozy desk you sit at before and between them: light enough to keep open all day, and quiet unless you ask it something.",
    tips: ["My day is home. Tabs such as the Planner go deeper into one widget, so the menu stays short.", "Everything here is yours alone: your widgets, tasks, notes and settings belong to your account.", "Nothing nags you. Notifications, when they arrive, will be opt-in."],
  },
  {
    id: "my-day",
    icon: "DashboardSquare01Icon",
    title: "My day",
    href: "/dashboard",
    open: "Open My day",
    what: "Your day at a glance, in two views of the same things: the Board (small widgets you arrange) and the Room (a cozy pixel room that opens the same widgets). A switch at the top changes between them, and it remembers the one you were in.",
    why: "A morning glance should answer 'what is today like?' in a second, without opening five apps. The Board is for seeing everything at once; the Room is for when you would rather have the day feel calm. Either way each widget does one small job and remembers itself.",
    tips: ["On the Board, Add widget puts a new one down; Arrange lets you drag, resize, recolour and remove them.", "Widgets keep their own data: the note you write and the station you favourite are saved to your account, and it is the same data in both views."],
    parts: [
      { icon: "ClockIcon", name: "Clock", text: "The time and date, in a face that suits the room." },
      { icon: "TaskDone01Icon", name: "To-do", text: "What is due today, with a quick add line. Press the planner link for the full picture." },
      { icon: "StickyNoteIcon", name: "Sticky note", text: "Somewhere to jot a thought before it escapes. It saves as you type." },
      { icon: "AlarmClockIcon", name: "Pomodoro", text: "Work in short, focused bursts with breaks, so long tasks feel smaller." },
      { icon: "SunCloud01Icon", name: "Weather", text: "The sky outside your window: the moving picture matches the real conditions." },
      { icon: "Radio01Icon", name: "Radio", text: "A vintage radio for internet stations and YouTube playlists. Music keeps playing while you move around." },
    ],
  },
  {
    id: "planner",
    icon: "CheckListIcon",
    title: "Planner",
    href: "/todo",
    open: "Open the planner",
    what: "A desk planner for your tasks: a day page, a month calendar, ruled paper for the list and index tabs for your lists.",
    why: "Tasks need somewhere calm to live. It is deliberately small: capture quickly, see what matters today, finish things. Anything bigger belongs in your real project tool.",
    tips: [
      "Write tasks the way you would say them: 'pay rent friday 5pm !high #home every month'. It shows what it understood before you press Enter.",
      "Tick a task and it is stamped DONE; a note offers Undo for a few seconds. Repeating tasks move on to their next date by themselves.",
      "Tabs on the right: Today, Coming up, All open, each of your lists, and Finished. Press a day on the calendar to see just that day.",
      "Open any task for notes, steps, a repeat, tags and a priority clip.",
    ],
  },
  {
    id: "room",
    icon: "Home03Icon",
    title: "The Room view",
    href: "/dashboard?view=room",
    open: "Step into the room",
    what: "A little pixel-art room with a window onto the real sky. The TV has the forecast, and the things around the room open your widgets.",
    why: "Weather is something you want a feeling of, not a table of numbers. And a room is a friendlier way to reach your other tools than a board of cards.",
    tips: [
      "Switch to it with Room at the top of My day.",
      "Turn the TV on with the dial; the three buttons pick Now, Hours and Days. You can also tap or swipe the screen.",
      "Press the clock, calendar, sticky note or radio to open that widget over the room. Press the globe to look at the sky somewhere else (just for this tab).",
      "Press a curtain to draw it across the window; press again to open it. Dust drifts in the light, and the curtains sway more when it is windy.",
      "On a phone it becomes a simple page: the sky, the forecast, and the same objects as buttons.",
    ],
  },
  {
    id: "focus",
    icon: "AlarmClockIcon",
    title: "Focus",
    href: "/focus",
    open: "Open Focus",
    what: "An hourglass you turn over to start a focus session, with short and long breaks, a stopwatch, a kitchen timer, world clocks and a look back at how you have been doing.",
    why: "Work goes better in short, honest bursts. The hourglass makes starting feel like a small ritual, and the timer keeps going when you move around the hub.",
    tips: ["Pick a task from your planner to focus on; finished sessions are saved to your account and counted in your streak.", "The same timer runs in the Pomodoro widget and the hourglass in the Room."],
  },
  {
    id: "notes",
    icon: "StickyNoteIcon",
    title: "Notes",
    href: "/notes",
    open: "Open your notebook",
    what: "A leather notebook with an index down the side and a ruled page to write on, in the paper colour you choose. Pin the ones you need, search them all, and download everything.",
    why: "A sticky note is for a thought; a notebook is for the longer things. It saves as you type and never lets two tabs overwrite each other.",
    tips: ["Write mode is plain text; Read mode shows headings, bullets, bold and tick-boxes you can tick.", "Your sticky note can be brought in as the first page."],
  },
  {
    id: "radio",
    icon: "Radio01Icon",
    title: "Radio and listening parties",
    href: "/radio",
    open: "Open the radio",
    what: "The same radio as on My day, big enough for YouTube, with a sleep timer and the stations you played lately. Start a party and friends who are signed in can join with an invite code to hear the same thing.",
    why: "Music is better together. You choose what plays; guests suggest stations and videos, you approve them, and everyone can send little emoji reactions.",
    tips: ["Start a party, then press Copy invite link and send it. Guests press Join.", "Stations play at the same moment for everyone. YouTube videos follow the host to within a few seconds, so it is together rather than to the frame.", "Whole playlists can wait in the line-up too. Press the arrow on one to see its songs (listing songs of a playlist that is not playing needs the optional YouTube key on the backend; the playlist plays either way).", "There is a short chat in the room: the last sixty messages, plain text, gone when the party ends. The host can remove a message or mute someone.", "Remove anyone from the party for good; end it any time. A party also ends by itself after hours of nobody being there.", "Staying in the party while on another tab keeps the music going, but it only follows the host while the Radio tab is open."],
  },
  {
    id: "dictionary",
    icon: "BookOpen01Icon",
    title: "Dictionary",
    href: "/dictionary",
    open: "Open the dictionary",
    what: "Look up lists of words, see their meanings in your chosen language, and export what you collected to Excel or PDF.",
    why: "It began as a language-learning helper and is joining the hub so your study notes live next to everything else.",
    tips: ["Needs you to be signed in. If it says it is unavailable, the owner has not switched it on yet.", "Pick the meaning language and the lookup engine, then export your list when you are done."],
  },
  {
    id: "customize",
    icon: "PaintBoardIcon",
    title: "Make it yours",
    what: "Light or dark, an accent colour, the paper behind everything, the font and how rounded things look, plus a colour for each widget.",
    why: "You will look at this all day, so it should feel like your place, not a default. Your choices are saved to your account and follow you to other devices.",
    tips: ["Open it from 'Make it yours' in the menu.", "Widget colours are changed in Arrange mode on My day."],
  },
  {
    id: "account",
    icon: "LockPasswordIcon",
    title: "Settings & security",
    what: "Your profile picture and name, your email and phone, and your password.",
    why: "Your account is the only thing protecting your data, so it is built carefully: sessions live in protected cookies, sign-in attempts are rate limited, and every request is checked against who you are.",
    tips: ["Open Settings from the menu.", "Use a long, unique password. Changing it asks for the current one."],
  },
];

// ---- the roadmap -----------------------------------------------------------------------------------------------------------------------

export type Status = "done" | "building" | "next" | "later";

export interface RoadmapItem {
  id: string;
  title: string;
  status: Status;
  progress: number; // 0..1: how far along it is
  weight: number; // relative size of the job, so a small tab counts for less than an integration
  text: string;
}

export const ROADMAP: RoadmapItem[] = [
  { id: "accounts", title: "Accounts and secure sign-in", status: "done", progress: 1, weight: 3, text: "Sign up, sign in, remember me, password change, avatar, and sessions kept in protected cookies." },
  { id: "board", title: "My day: the Board view", status: "done", progress: 1, weight: 4, text: "Six widgets you can add, arrange, resize and recolour, saved to your account." },
  { id: "customize", title: "Make it yours", status: "done", progress: 1, weight: 2, text: "Themes, accents, backdrops, fonts and rounding, kept per account." },
  { id: "planner", title: "Planner tab", status: "done", progress: 1, weight: 4, text: "Lists, due dates, repeats, steps, tags, natural-language quick add, undo, calendar and streaks." },
  { id: "room", title: "My day: the Room view", status: "done", progress: 1, weight: 4, text: "A second way to see your day: a pixel-art room with a window onto the real sky, a TV forecast, curtains, and objects that open your widgets. A simple version for phones." },
  { id: "radio", title: "Radio", status: "done", progress: 1, weight: 2, text: "Internet stations and YouTube playlists, with favourites saved to your account." },
  { id: "pomodoro", title: "Focus tab", status: "done", progress: 1, weight: 2, text: "An hourglass for focus sessions, plus stopwatch, kitchen timer, world clocks and your history. It also appears in the Room." },
  { id: "notes", title: "Notes tab", status: "done", progress: 1, weight: 2, text: "A notebook for longer notes: autosave, search, pins, paper colours and a safe reading view." },
  { id: "party", title: "Radio tab and listening parties", status: "done", progress: 1, weight: 3, text: "A bigger radio with a sleep timer, and parties: invite friends, listen together, suggest songs and send reactions." },
  { id: "security", title: "Security hardening and tests", status: "done", progress: 1, weight: 2, text: "Every route checks who you are; limits on abuse; an automated test suite. A full review was done on the review date." },
  { id: "help", title: "Help and roadmap", status: "done", progress: 1, weight: 1, text: "This page: a guide to every part of the hub, and the plan ahead." },
  { id: "dictionary", title: "Dictionary in the hub", status: "building", progress: 0.6, weight: 3, text: "Works, but the owner has to switch it on, and the page needs a friendly sign-in prompt." },
  { id: "notifications", title: "Notifications inbox and webhooks", status: "next", progress: 0, weight: 3, text: "One quiet inbox that other tools can post into. Opt-in, never noisy." },
  { id: "connect", title: "GitHub and email glances", status: "next", progress: 0, weight: 4, text: "See what needs you without opening them. A glance and a jump, not a copy." },
  { id: "jira", title: "Jira tab (read-only)", status: "next", progress: 0, weight: 3, text: "Pick a board and see it here. You reconnect about once a month." },
  { id: "notion", title: "Notion, with writing", status: "later", progress: 0, weight: 4, text: "Write to your Notion from here. Planned after Jira, because it is the trickiest connection." },
  { id: "pet", title: "A digital pet", status: "later", progress: 0, weight: 2, text: "A small companion that lives on your board and notices your streaks." },
  { id: "apps", title: "Desktop and Android apps", status: "later", progress: 0, weight: 6, text: "The same hub as installable apps, with real notifications." },
];

export interface Phase {
  name: string;
  items: string[]; // roadmap ids
  weeks: [number, number]; // a rough range, working part-time
  note: string;
}

// What is left, in the order we would do it. Ranges are honest guesses: external services (Jira, Notion, GitHub) are where surprises live.
export const PHASES: Phase[] = [
  { name: "Finish what is built", items: ["dictionary"], weeks: [1, 2], note: "Switch the dictionary on, run the two database fixes, check everything on a real phone." },
  { name: "Notifications inbox", items: ["notifications"], weeks: [1.5, 3], note: "The foundation the integrations will post into." },
  { name: "Connect the outside", items: ["connect"], weeks: [3, 5], note: "GitHub and email, kept as light glances." },
  { name: "Jira tab", items: ["jira"], weeks: [2, 3], note: "Read-only, one board at a time." },
  { name: "Notion with writing", items: ["notion"], weeks: [3, 5], note: "Needs the most care: it can change your real documents." },
  { name: "The pet", items: ["pet"], weeks: [1, 3], note: "Small, and fun." },
  { name: "Desktop and Android", items: ["apps"], weeks: [5, 10], note: "Depends on how much of the web app can be reused as it is." },
];

export const SCORECARD: { name: string; score: number; note: string }[] = [
  { name: "Everyday usefulness", score: 8, note: "You can live in it today: board, planner, focus, notes, radio, weather." },
  { name: "Look and feel", score: 8.5, note: "One consistent cozy style, two themes, and three layouts that adapt to the screen." },
  { name: "Reliability", score: 7, note: "Several data bugs were found and fixed this week. More testing against the real database would help." },
  { name: "Security", score: 8, note: "Designed carefully and reviewed; one real hole (the dictionary routes) was found and closed." },
  { name: "Phones", score: 6.5, note: "Simple layouts exist, but they need more time on real devices." },
  { name: "Completeness against the plan", score: 5.5, note: "A little over half of everything we have discussed is built." },
];

export const HOUSEKEEPING = [
  "Run db/upgrade-tabs.sql in Supabase (Focus, Notes and listening parties need their tables) and redeploy the backend from the dev branch.",
  "Run db/repair-widget-json.sql in Supabase and redeploy the backend (fixes widget data that was saved the wrong way).",
  "Optional: set YOUTUBE_API_KEY on the backend (a free YouTube Data API key) so a playlist waiting in a party line-up can show its songs.",
  "Set ADMIN_USER_IDS on the backend, and ENABLE_FOLIA=1 once you want the dictionary live.",
  "Rotate the weather key (it was once visible in the browser) and keep it only on the backend.",
  "Set the Site URL in Supabase to your real address so emailed links do not point at localhost.",
];

// ---- numbers computed from the roadmap -------------------------------------------------------------------------------------------------

export function computeProgress(items: RoadmapItem[] = ROADMAP) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const done = items.reduce((sum, item) => sum + item.weight * Math.min(1, Math.max(0, item.progress)), 0);
  const count = (status: Status) => items.filter((item) => item.status === status).length;
  return {
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    done,
    total,
    counts: { done: count("done"), building: count("building"), next: count("next"), later: count("later") },
  };
}

export function remainingWeeks(phases: Phase[] = PHASES, skip: string[] = []) {
  const kept = phases.filter((phase) => !phase.items.some((id) => skip.includes(id)));
  return { min: kept.reduce((sum, p) => sum + p.weeks[0], 0), max: kept.reduce((sum, p) => sum + p.weeks[1], 0) };
}

export const monthsLabel = (weeks: number) => {
  const months = weeks / 4.3;
  return months < 1.5 ? `${Math.round(weeks)} weeks` : `${Math.round(months * 2) / 2} months`;
};
