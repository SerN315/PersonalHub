"use client";

import React, { useEffect, useState } from "react";
import { getNotificationSettings, makeWebhook, removeWebhook, saveSources, type NotificationSettings as Settings } from "@/app/apis/notifications";
import type { Permission } from "@/app/utils/notifications/alert";
import { notificationPrefs } from "@/app/utils/notifications/prefs";
import { playCue } from "@/app/utils/notifications/sound";
import { sendOwn } from "@/app/utils/notifications/store";
import { Button, Checkbox, Input } from "@/app/components/ui";

// Two separate things live here. WHICH news may reach you is kept on your account (nothing is sent until you switch it on). HOW it shows up
// (a card, a chime, a message from your computer) is kept in this browser, because a phone and a laptop may want different things.

const SOURCES: { key: keyof Settings["sources"]; label: string; text: string }[] = [
  { key: "party", label: "Radio party news", text: "Someone suggests a song at a party you are hosting." },
  { key: "focus", label: "Focus sessions", text: "A focus session or break ends. It is also kept here if you were not looking." },
];

const permissionNow = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);
const message = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

export default function NotificationSettings() {
  const prefs = notificationPrefs.use();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [permission, setPermission] = useState<Permission>(permissionNow);
  const [secret, setSecret] = useState<string | null>(null); // shown once, right after it is made
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotificationSettings()
      .then((found) => !cancelled && setSettings(found))
      .catch((error) => !cancelled && setStatus({ kind: "error", text: message(error) }));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSource = async (key: keyof Settings["sources"], on: boolean) => {
    if (!settings) return;
    const before = settings;
    setSettings({ ...settings, sources: { ...settings.sources, [key]: on } });
    try {
      setSettings(await saveSources({ [key]: on }));
    } catch (error) {
      setSettings(before);
      setStatus({ kind: "error", text: message(error) });
    }
  };

  const toggleDesktop = async (on: boolean) => {
    if (!on) return notificationPrefs.set({ ...prefs, desktop: false });
    let result: Permission = permissionNow();
    if (result === "default") {
      try {
        result = (await Notification.requestPermission()) as Permission;
      } catch {
        result = "denied";
      }
    }
    setPermission(result);
    notificationPrefs.set({ ...prefs, desktop: result === "granted" });
  };

  const test = async () => {
    setStatus(null);
    try {
      // a real one, so you see and hear exactly what you have chosen. (Looking away from the page for a few seconds shows the computer's message.)
      await sendOwn({ source: "test", title: "This is how it looks", body: "A notification from PersonalHub." }, { tell: true });
    } catch (error) {
      setStatus({ kind: "error", text: message(error) });
    }
  };

  const createLink = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const made = await makeWebhook();
      setSecret(`${window.location.origin}${made.path}`);
      setSettings(await getNotificationSettings());
    } catch (error) {
      setStatus({ kind: "error", text: message(error) });
    } finally {
      setBusy(false);
    }
  };

  const removeLink = async () => {
    setBusy(true);
    try {
      await removeWebhook();
      setSecret(null);
      setSettings(await getNotificationSettings());
    } catch (error) {
      setStatus({ kind: "error", text: message(error) });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setStatus({ kind: "ok", text: "Copied." });
    } catch {
      setStatus({ kind: "error", text: "Could not copy. Select the link and copy it by hand." });
    }
  };

  return (
    <div className="settingsForm">
      <header className="settingsHead">
        <h3>Notifications</h3>
        <p>A quiet inbox. Nothing reaches it until you switch it on.</p>
      </header>

      {!settings && !status && <p className="muted">Loading…</p>}
      {!settings && status && (
        <p className={`settingsStatus ${status.kind}`} role="alert">
          {status.text}
        </p>
      )}

      {settings && (
        <>
          <fieldset className="settingsCard notifyGroup">
            <legend>
              <h4>What can reach you</h4>
            </legend>
            {SOURCES.map((source) => (
              <label key={source.key} className="notifyOption">
                <Checkbox  checked={settings.sources[source.key]} onChange={(e) => void toggleSource(source.key, e.target.checked)} />
                <span>
                  <strong>{source.label}</strong>
                  <small>{source.text}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="settingsCard notifyGroup">
            <legend>
              <h4>How it shows up on this device</h4>
            </legend>
            <label className="notifyOption">
              <Checkbox  checked={prefs.popup} onChange={(e) => notificationPrefs.set({ ...prefs, popup: e.target.checked })} />
              <span>
                <strong>A card on the page</strong>
                <small>Slides in while you are looking at PersonalHub, and leaves by itself after a few seconds.</small>
              </span>
            </label>
            <label className="notifyOption">
              <Checkbox  checked={prefs.sound} onChange={(e) => notificationPrefs.set({ ...prefs, sound: e.target.checked })} />
              <span>
                <strong>A soft chime</strong>
                <small>Plays once the page has been touched (browsers do not allow sound before that).</small>
              </span>
            </label>
            <label className="notifyOption">
              <Checkbox  checked={prefs.desktop && permission === "granted"} disabled={permission === "denied" || permission === "unsupported"} onChange={(e) => void toggleDesktop(e.target.checked)} />
              <span>
                <strong>A message from your computer when the page is in the background</strong>
                <small>
                  {permission === "denied"
                    ? "Your browser is blocking these. Allow notifications for this site in the browser's site settings, then come back."
                    : permission === "unsupported"
                      ? "This browser cannot show them."
                      : "Appears in your computer's own notification area, in the look of your system. Clicking it brings you back here. Only while PersonalHub is open in a tab."}
                </small>
              </span>
            </label>
            <div className="notifyRow">
              <Button variant="secondary" size="sm" onClick={() => void test()}>
                Send me a test
              </Button>
              <Button variant="outline" size="sm" onClick={playCue}>
                Play the chime
              </Button>
            </div>
          </fieldset>

          <div className="settingsCard">
            <h4>Let other tools post here</h4>
            <p className="muted">
              Make a private link, then give it to any tool that can send a web request (an automation, a script, a build). Whatever it sends shows up in your inbox. Anyone who has the link can post to you, so keep it private. You can replace or remove it at any time.
            </p>
            {secret && (
              <div className="hookBox">
                <p className="muted">Copy it now. For your safety it is not shown again.</p>
                <Input variant="bare" readOnly value={secret} aria-label="Your private link" onFocus={(e) => e.currentTarget.select()} />
                <div className="notifyRow">
                  <Button size="sm" onClick={() => void copy()}>
                    Copy link
                  </Button>
                </div>
                <pre>{`curl -X POST "${secret}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Build passed","body":"main is green","from":"CI"}'`}</pre>
              </div>
            )}
            <div className="notifyRow">
              <Button variant={settings.webhook.enabled ? "secondary" : "default"} size="sm" disabled={busy} onClick={() => void createLink()}>
                {settings.webhook.enabled ? "Make a new link (the old one stops working)" : "Make a private link"}
              </Button>
              {settings.webhook.enabled && (
                <Button variant="destructive" size="sm" disabled={busy} onClick={() => void removeLink()}>
                  Remove it
                </Button>
              )}
            </div>
          </div>

          <p className={`settingsStatus ${status?.kind ?? ""}`} role="status" aria-live="polite">
            {status?.text}
          </p>
        </>
      )}
    </div>
  );
}
