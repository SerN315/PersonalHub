"use client";
import React, { useState } from "react";
import { useUserStore } from "@/app/utils/store/userStore";
import { usePreferencesStore } from "@/app/utils/store/preferencesStore";

function greetingFor(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

// The warm hello at the top of the day. Name comes from Settings > Appearance, falling back to the profile.
export default function DayHeader({ children }: { children?: React.ReactNode }) {
  const [now] = useState(() => new Date());
  const user = useUserStore((state) => state.user);
  const showGreeting = usePreferencesStore((state) => state.prefs.greeting);
  const displayName = usePreferencesStore((state) => state.prefs.displayName);

  const first = (displayName || user?.name || user?.username || "").trim().split(/\s+/)[0];
  const greeting = greetingFor(now.getHours());

  return (
    <header className="dayHeader">
      <div className="dayHeader__text">
        <p className="dayHeader__date">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
        {showGreeting ? (
          <h1 className="dayHeader__hello">
            {greeting}
            {first ? `, ${first}` : ""}
            {now.getHours() < 5 ? "?" : "."}
          </h1>
        ) : (
          <h1 className="dayHeader__hello">My day</h1>
        )}
      </div>
      <div className="dayHeader__actions">{children}</div>
    </header>
  );
}
