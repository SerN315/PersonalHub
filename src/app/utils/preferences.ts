// The look-and-feel options a person can change. The CSS for every option lives in styles/tokens.css and is
// switched by data-* attributes on <html>, so changing one never re-renders a React component.

export const MODES = ["system", "light", "dark"] as const;
export const ACCENTS = ["clay", "butter", "peach", "rose", "sage", "sky", "lilac"] as const;
export const BACKDROPS = ["paper", "dots", "lines", "glow", "plain"] as const;
export const FONTS = ["cozy", "soft", "type"] as const;
export const RADII = ["sharp", "soft", "round"] as const;
export const TINTS = ["paper", "butter", "peach", "rose", "sage", "sky", "lilac"] as const;

export type Mode = (typeof MODES)[number];
export type Accent = (typeof ACCENTS)[number];
export type Backdrop = (typeof BACKDROPS)[number];
export type FontChoice = (typeof FONTS)[number];
export type Radius = (typeof RADII)[number];
export type Tint = (typeof TINTS)[number];

export interface Preferences {
  mode: Mode;
  accent: Accent;
  backdrop: Backdrop;
  font: FontChoice;
  radius: Radius;
  greeting: boolean;
  displayName: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  mode: "system",
  accent: "clay",
  backdrop: "paper",
  font: "cozy",
  radius: "soft",
  greeting: true,
  displayName: "",
};

export const STORAGE_KEY = "ph-prefs";

const OPTIONS = { mode: MODES, accent: ACCENTS, backdrop: BACKDROPS, font: FONTS, radius: RADII } as const;

// Accepts anything (localStorage, the server) and returns only valid values, filling gaps with defaults.
export function cleanPreferences(input: unknown): Preferences {
  const out: Preferences = { ...DEFAULT_PREFERENCES };
  if (!input || typeof input !== "object") return out;
  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]) {
    const options: readonly string[] = OPTIONS[key];
    if (typeof raw[key] === "string" && options.includes(raw[key] as string)) {
      (out[key] as string) = raw[key] as string;
    }
  }
  if (typeof raw.greeting === "boolean") out.greeting = raw.greeting;
  if (typeof raw.displayName === "string") out.displayName = raw.displayName.trim().slice(0, 24);
  return out;
}

export const resolveMode = (mode: Mode): "light" | "dark" =>
  mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;

export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  root.dataset.mode = resolveMode(prefs.mode);
  root.dataset.accent = prefs.accent;
  root.dataset.backdrop = prefs.backdrop;
  root.dataset.font = prefs.font;
  root.dataset.radius = prefs.radius;
}

// Runs in <head> before first paint (with the CSP nonce) so a returning visitor never sees a flash of the wrong theme.
// Mirrors cleanPreferences/applyPreferences, kept tiny and dependency-free on purpose.
export const EARLY_PAINT_SCRIPT = `(function(){try{
var o=${JSON.stringify(OPTIONS)},p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}")||{}}catch(e){}
var d=${JSON.stringify(DEFAULT_PREFERENCES)},r=document.documentElement;
function v(k){return o[k].indexOf(p[k])>-1?p[k]:d[k]}
var m=v("mode");if(m==="system")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
r.dataset.mode=m;r.dataset.accent=v("accent");r.dataset.backdrop=v("backdrop");r.dataset.font=v("font");r.dataset.radius=v("radius");
}catch(e){}})();`;
