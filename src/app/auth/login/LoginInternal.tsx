"use client";
import { useState, useEffect } from "react";
import React from "react";
import LoginForm from "@/app/components/ultis/LoginForm";
import RegisterForm from "@/app/components/ultis/RegisterForm";
import "@/app/styles/ultis/LoginForms.scss";
import "@/app/styles/pages/Login.scss";
import Image from "next/image";
import Link from "next/link";
import BasicIcon from "@/app/components/ultis/icons";
import { useThemeStore } from "@/app/utils/store/ThemeStore";

const LoginInternal: React.FC = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
  };
  return (
    <div
      className="login-internal"
      style={{
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#000000",
      }}
    >
      <Link
        href="/"
        style={{
          position: "absolute",
          top: "50px",
          paddingLeft: "50px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <BasicIcon icon="ArrowLeft01Icon" size={20} />
        <span style={{ textDecoration: "underline" }}>Back to HomePage</span>
      </Link>
      <div
        className="login-form"
        style={{
          position: "absolute",
          opacity: isLoginForm ? 1 : 0,
          transform: isLoginForm ? "translateX(0)" : "translateX(-500px)",
          transition: "all 0.3s ease-in-out",
          willChange: "transform, opacity",
        }}
      >
        <LoginForm toggleForm={toggleForm} />
      </div>
      <div
        className="register-form"
        style={{
          position: "absolute",
          opacity: isLoginForm ? 0 : 1,
          transform: isLoginForm ? "translateX(500px)" : "translateX(0)",
          transition: "all 0.3s ease-in-out",
          willChange: "transform, opacity",
        }}
      >
        <RegisterForm toggleForm={toggleForm} />
      </div>
      <div className="decorImage">
        <Image
          alt="The Storm"
          src="/604723-DmC-Devil-May-Cry-Vergil-4K.jpg"
          layout="fill"
          objectFit="cover"
        ></Image>
      </div>
    </div>
  );
};

export default LoginInternal;
