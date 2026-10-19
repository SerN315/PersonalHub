"use client";
import React, { useState } from "react";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "@/app/components/ui/BaseButton";

interface RegisterFormProps {
  toggleForm: () => void;
}

type Errors = { username?: string; email?: string; password?: string; confirm?: string; general?: string };

const RegisterForm: React.FC<RegisterFormProps> = ({ toggleForm }) => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (userName.trim().length < 1) next.username = "Pick a username";
    if (!email.includes("@")) next.email = "Enter your email address";
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (confirm !== password) next.confirm = "The passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: userName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ general: data.error || "We couldn't create your account. Please try again." });
        return;
      }
      if (data.needsConfirmation) {
        setNotice("Almost there! Check your email and click the confirmation link, then sign in.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setErrors({ general: "We can't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authCard">
      <h1 className="authCard__title">Make yourself at home</h1>
      <p className="authCard__subtitle">Create your account in a minute.</p>

      <form id="register-form" className="authCard__form" onSubmit={handleSubmit} noValidate>
        <BaseInput label="Username" autoComplete="username" placeholder="What should we call you?" maxLength={32} value={userName} error={errors.username} onChange={(e) => setUserName(e.target.value)} />
        <BaseInput label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <BaseInput label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} error={errors.password} onChange={(e) => setPassword(e.target.value)} />
        <BaseInput label="Confirm password" type="password" autoComplete="new-password" placeholder="Once more" value={confirm} error={errors.confirm} onChange={(e) => setConfirm(e.target.value)} />
        {errors.general && (
          <p className="authCard__error" role="alert">
            {errors.general}
          </p>
        )}
        {notice && (
          <p className="authCard__notice" role="status">
            {notice}
          </p>
        )}
        <BaseButton type="submit" form="register-form" full disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </BaseButton>
      </form>

      <p className="authCard__switch">
        Already have an account?{" "}
        <button type="button" className="authCard__link registerLink" onClick={toggleForm}>
          Sign in
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
