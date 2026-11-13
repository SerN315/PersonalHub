"use client";

import React, { useEffect, useState } from "react";
import { getAdminSettings, setSearchAccess, type AdminSettings as Settings, type SearchAccess } from "@/app/apis/admin";

// The owner's switches. Only reached by people the server names as owner (the tab does not even appear for anyone else).

const CHOICES: { value: SearchAccess; label: string; text: string }[] = [
  { value: "admin", label: "Admin only", text: "Only you see the Search choice. This saves the most of the daily allowance." },
  { value: "host", label: "Hosts", text: "The host of a running party can search (and you, always)." },
  { value: "everyone", label: "Everyone in a party", text: "Hosts and guests can search while they are in a party (and you, always)." },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminSettings()
      .then((found) => !cancelled && setSettings(found))
      .catch((error) => !cancelled && setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not load the settings" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = async (value: SearchAccess) => {
    if (!settings || saving || value === settings.searchAccess) return;
    setSaving(true);
    setStatus(null);
    try {
      setSettings(await setSearchAccess(value));
      setStatus({ kind: "ok", text: "Saved. It applies to the next search." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const search = settings?.search;
  return (
    <div className="settingsForm">
      <header className="settingsHead">
        <h3>Admin</h3>
        <p>Switches that only you, the owner, can change.</p>
      </header>

      {!settings && !status && <p className="muted">Loading…</p>}
      {!settings && status && <p className={`settingsStatus ${status.kind}`} role="alert">{status.text}</p>}

      {settings && (
        <>
          <fieldset className="settingsCard adminChoice" disabled={saving}>
            <legend>
              <h4>Enable search</h4>
            </legend>
            <p className="muted">Searching YouTube uses a small daily allowance (each search costs a hundredth of it). Choose who gets the Search choice when adding songs to a party.</p>
            {CHOICES.map((choice) => (
              <label key={choice.value} className={`adminChoice__option ${settings.searchAccess === choice.value ? "is-on" : ""}`}>
                <input type="radio" name="searchAccess" value={choice.value} checked={settings.searchAccess === choice.value} onChange={() => void choose(choice.value)} />
                <span>
                  <strong>{choice.label}</strong>
                  <small>{choice.text}</small>
                </span>
              </label>
            ))}
            <p className={`settingsStatus ${status?.kind ?? ""}`} role="status" aria-live="polite">
              {status?.text}
            </p>
          </fieldset>

          <div className="settingsCard">
            <h4>Today&apos;s searches</h4>
            {search && !search.configured ? (
              <p className="muted">No YouTube key is set on the server (YOUTUBE_API_KEY), so search is off for everyone.</p>
            ) : (
              <>
                <div className="adminMeter" role="progressbar" aria-valuemin={0} aria-valuemax={search?.limit ?? 0} aria-valuenow={search?.used ?? 0} aria-label="Searches used today">
                  <span style={{ width: `${search && search.limit > 0 ? Math.min(100, (search.used / search.limit) * 100) : 0}%` }} />
                </div>
                <p className="muted">
                  {search?.used ?? 0} of {search?.limit ?? 0} used. It starts over at midnight in California, which is when YouTube&apos;s own allowance does. Searches you have made before are remembered and cost nothing.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
