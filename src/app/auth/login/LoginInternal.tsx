"use client";
import React, { useState } from "react";
import LoginForm from "@/app/components/ultis/LoginForm";
import RegisterForm from "@/app/components/ultis/RegisterForm";
import CozyScene from "@/app/components/ultis/CozyScene";
import BasicIcon from "@/app/components/ultis/icons";
import "@/app/styles/pages/Login.scss";

const LoginInternal: React.FC = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const toggleForm = () => setIsLoginForm((value) => !value);

  return (
    <div className="auth">
      <section className="auth__panel">
        <div className="auth__brand">
          <span className="auth__brandMark" aria-hidden>
            <BasicIcon icon="Coffee01Icon" size={20} />
          </span>
          PersonalHub
        </div>
        <div className="auth__form" key={isLoginForm ? "login" : "register"}>
          {isLoginForm ? <LoginForm toggleForm={toggleForm} /> : <RegisterForm toggleForm={toggleForm} />}
        </div>
      </section>
      <aside className="auth__art" aria-hidden>
        <CozyScene />
      </aside>
    </div>
  );
};

export default LoginInternal;
