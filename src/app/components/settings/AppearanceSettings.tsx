"use client";

import React from "react";
import BaseButton from "@/app/components/ui/BaseButton";
import BaseInput from "@/app/components/ui/BaseInput";
import BasicIcon from "@/app/components/ultis/icons";
import { Segmented, Swatches, Switch } from "@/app/components/ui/Choice";
import { usePreferencesStore } from "@/app/utils/store/preferencesStore";
import type { Accent, Backdrop, FontChoice, Mode, Radius } from "@/app/utils/preferences";

const MODE_OPTIONS = [
  { value: "system", label: "System", icon: <BasicIcon icon="ComputerIcon" size={16} /> },
  { value: "light", label: "Light", icon: <BasicIcon icon="Sun03Icon" size={16} /> },
  { value: "dark", label: "Dark", icon: <BasicIcon icon="Moon02Icon" size={16} /> },
] as const satisfies readonly { value: Mode; label: string; icon: React.ReactNode }[];

const ACCENT_OPTIONS: readonly { value: Accent; label: string; color: string }[] = [
  { value: "clay", label: "Clay", color: "var(--c-clay)" },
  { value: "butter", label: "Butter", color: "var(--c-butter)" },
  { value: "peach", label: "Peach", color: "var(--c-peach)" },
  { value: "rose", label: "Rose", color: "var(--c-rose)" },
  { value: "sage", label: "Sage", color: "var(--c-sage)" },
  { value: "sky", label: "Sky", color: "var(--c-sky)" },
  { value: "lilac", label: "Lilac", color: "var(--c-lilac)" },
];

const BACKDROP_OPTIONS: readonly { value: Backdrop; label: string }[] = [
  { value: "paper", label: "Paper" },
  { value: "dots", label: "Dots" },
  { value: "lines", label: "Notebook" },
  { value: "glow", label: "Glow" },
  { value: "plain", label: "Plain" },
];

const FONT_OPTIONS: readonly { value: FontChoice; label: string }[] = [
  { value: "cozy", label: "Cozy serif" },
  { value: "soft", label: "Soft sans" },
  { value: "type", label: "Typewriter" },
];

const RADIUS_OPTIONS: readonly { value: Radius; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
];

function Setting({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="setting">
      <div className="setting__text">
        <strong>{title}</strong>
        {hint && <span className="muted">{hint}</span>}
      </div>
      <div className="setting__control">{children}</div>
    </div>
  );
}

export default function AppearanceSettings() {
  const prefs = usePreferencesStore((state) => state.prefs);
  const update = usePreferencesStore((state) => state.update);
  const reset = usePreferencesStore((state) => state.reset);

  return (
    <div className="settingsForm">
      <header className="settingsHead">
        <h3>Appearance</h3>
        <p>Everything changes instantly and follows you to every device.</p>
      </header>

      <Setting title="Theme" hint="System follows your device, day and night.">
        <Segmented label="Theme" value={prefs.mode} options={MODE_OPTIONS} onChange={(mode) => update({ mode })} />
      </Setting>

      <Setting title="Accent colour" hint="Buttons, highlights and little details.">
        <Swatches label="Accent colour" value={prefs.accent} options={ACCENT_OPTIONS} onChange={(accent) => update({ accent })} />
      </Setting>

      <Setting title="Background" hint="What sits behind your widgets.">
        <div className="tiles" role="radiogroup" aria-label="Background">
          {BACKDROP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={prefs.backdrop === option.value}
              className="tile"
              onClick={() => update({ backdrop: option.value })}
            >
              <span className="tile__preview" data-backdrop-preview={option.value} />
              <span className="tile__label">{option.label}</span>
            </button>
          ))}
        </div>
      </Setting>

      <Setting title="Font" hint="Headings and text.">
        <Segmented label="Font" value={prefs.font} options={FONT_OPTIONS} onChange={(font) => update({ font })} />
      </Setting>

      <Setting title="Corners" hint="How soft the cards feel.">
        <Segmented label="Corners" value={prefs.radius} options={RADIUS_OPTIONS} onChange={(radius) => update({ radius })} />
      </Setting>

      <Setting title="Daily greeting" hint="A hello on top of your dashboard.">
        <div className="greetingControl">
          <Switch label="Show the daily greeting" checked={prefs.greeting} onChange={(greeting) => update({ greeting })} />
          {prefs.greeting && (
            <BaseInput
              aria-label="Name used in the greeting"
              placeholder="What should we call you?"
              maxLength={24}
              value={prefs.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
            />
          )}
        </div>
      </Setting>

      <div className="settingsActions">
        <BaseButton variant="ghost" size="sm" onClick={reset}>
          Back to the default look
        </BaseButton>
      </div>
    </div>
  );
}
