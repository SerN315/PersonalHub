"use client";

import React, { useState } from "react";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "@/app/components/ui/BaseButton";
import { useUserStore } from "@/app/utils/store/userStore";
import { changePassword, logoutUser } from "@/app/apis/settings";

type Status = { kind: "ok" | "error"; text: string } | null;

export default function SecuritySettings({ onSignedOut }: { onSignedOut: () => void }) {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!user) {
    return (
      <div className="settingsEmpty">
        <h3>You are not signed in</h3>
        <BaseButton onClick={() => (window.location.href = "/auth/login")}>Sign in</BaseButton>
      </div>
    );
  }

  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = current.length > 0 && next.length >= 8 && next === confirm;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setSaving(true);
    setStatus(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ kind: "ok", text: "Password updated." });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Could not change the password" });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      onSignedOut();
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="settingsForm">
      <header className="settingsHead">
        <h3>Security</h3>
        <p>Keep your corner of the internet yours.</p>
      </header>

      <form className="settingsCard" onSubmit={submit}>
        <h4>Change password</h4>
        <BaseInput label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <div className="settingsGrid">
          <BaseInput label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." value={next} onChange={(e) => setNext(e.target.value)} />
          <BaseInput
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            error={mismatch ? "Passwords do not match" : undefined}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <div className="settingsActions">
          <p className={`settingsStatus ${status?.kind ?? ""}`} role="status" aria-live="polite">
            {status?.text}
          </p>
          <BaseButton type="submit" disabled={!ready || saving}>
            {saving ? "Updating…" : "Update password"}
          </BaseButton>
        </div>
      </form>

      <div className="settingsCard settingsCard--row">
        <div>
          <h4>Sign out</h4>
          <p className="muted">End your session on this device.</p>
        </div>
        <BaseButton variant="ghost" onClick={signOut}>
          Sign out
        </BaseButton>
      </div>

      <div className="settingsCard settingsCard--row">
        <div>
          <h4>Delete account</h4>
          <p className="muted">Not available yet. Ask the app&apos;s owner to remove your data.</p>
        </div>
        <BaseButton variant="danger" disabled>
          Delete
        </BaseButton>
      </div>
    </div>
  );
}
