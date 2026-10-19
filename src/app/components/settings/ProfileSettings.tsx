"use client";

import React, { useRef, useState } from "react";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "@/app/components/ui/BaseButton";
import BasicIcon from "@/app/components/ultis/icons";
import { useUserStore } from "@/app/utils/store/userStore";
import { updateUser, uploadProfileImage } from "@/app/apis/settings";
import type { Profile } from "@/app/apis/settings";

type Status = { kind: "ok" | "error"; text: string } | null;

const messageOf = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

const toStoreUser = (saved: Profile) => ({
  id: saved.id,
  name: saved.full_name || "",
  username: saved.username || "",
  email: saved.email,
  avatar_url: saved.avatar_url || "",
});

export default function ProfileSettings() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [form, setForm] = useState({ name: user?.name ?? "", username: user?.username ?? "", email: user?.email ?? "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="settingsEmpty">
        <h3>You are not signed in</h3>
        <p>Sign in to keep your profile and your look on every device.</p>
        <BaseButton onClick={() => (window.location.href = "/auth/login")}>Sign in</BaseButton>
      </div>
    );
  }

  const changes: Parameters<typeof updateUser>[0] = {};
  if (form.name.trim() && form.name.trim() !== user.name) changes.full_name = form.name.trim();
  if (form.username.trim() && form.username.trim() !== user.username) changes.username = form.username.trim();
  if (form.email.trim() && form.email.trim().toLowerCase() !== user.email) changes.email = form.email.trim();
  const dirty = Object.keys(changes).length > 0;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setStatus(null);
    try {
      const { user: saved, emailChangePending } = await updateUser(changes);
      setUser(toStoreUser(saved));
      setForm({ name: saved.full_name || "", username: saved.username || "", email: user.email });
      setStatus({
        kind: "ok",
        text: emailChangePending ? "Saved. Click the link we emailed to your new address to finish changing it." : "Saved. Looking good!",
      });
    } catch (err) {
      setStatus({ kind: "error", text: messageOf(err) });
    } finally {
      setSaving(false);
    }
  };

  const onPickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const avatarUrl = await uploadProfileImage(file);
      const { user: saved } = await updateUser({ avatar_url: avatarUrl });
      setUser(toStoreUser(saved));
      setStatus({ kind: "ok", text: "New picture saved." });
    } catch (err) {
      setStatus({ kind: "error", text: messageOf(err) });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="settingsForm" onSubmit={save}>
      <header className="settingsHead">
        <h3>Profile</h3>
        <p>This is how PersonalHub greets you.</p>
      </header>

      <div className="avatarRow">
        <button type="button" className="avatarPicker" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change profile picture">
          <span className="avatarPicker__img" style={{ backgroundImage: `url(${user.avatar_url || "/Blank-Avatar.webp"})` }} />
          <span className="avatarPicker__badge">
            <BasicIcon icon="Camera01Icon" size={16} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPickImage} tabIndex={-1} />
        <div>
          <strong>{uploading ? "Uploading…" : "Profile picture"}</strong>
          <p className="muted">JPEG, PNG or WebP, up to 2 MB.</p>
        </div>
      </div>

      <div className="settingsGrid">
        <BaseInput label="Name" placeholder="Optional" value={form.name} maxLength={80} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <BaseInput label="Username" value={form.username} maxLength={32} autoComplete="username" onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <div className="settingsGrid__wide">
          <BaseInput
            label="Email"
            type="email"
            value={form.email}
            autoComplete="email"
            hint="Changing it sends a confirmation link to the new address."
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div className="settingsActions">
        <p className={`settingsStatus ${status?.kind ?? ""}`} role="status" aria-live="polite">
          {status?.text}
        </p>
        <BaseButton type="submit" disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </BaseButton>
      </div>
    </form>
  );
}
