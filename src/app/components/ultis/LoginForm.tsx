"use client";
import React, { useState } from "react";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "@/app/components/ui/BaseButton";

interface LoginFormProps {
  toggleForm: () => void;
}

type Errors = { email?: string; password?: string; general?: string };

const LoginForm: React.FC<LoginFormProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (!email.includes("@")) next.email = "Enter your email address";
    if (password.length < 1) next.password = "Enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ general: data.error || "We couldn't sign you in. Please try again." });
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
      <h1 className="authCard__title">Welcome back</h1>
      <p className="authCard__subtitle">Let&apos;s make today a good one.</p>

      <form id="login-form" className="authCard__form" onSubmit={handleSubmit} noValidate>
        <BaseInput label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <BaseInput label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={password} error={errors.password} onChange={(e) => setPassword(e.target.value)} />
        <label className="authCard__remember">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Keep me signed in on this device
        </label>
        {errors.general && (
          <p className="authCard__error" role="alert">
            {errors.general}
          </p>
        )}
        <BaseButton type="submit" form="login-form" full disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </BaseButton>
      </form>

      <p className="authCard__switch">
        New here?{" "}
        <button type="button" className="authCard__link registerLink" onClick={toggleForm}>
          Create an account
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
