"use client";
import React, { useState } from "react";
import LoginInput from "@/app/components/ui/loginInput";


interface LoginFormProps {
  toggleForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({
    email: undefined,
    password: undefined,
    general: undefined,
  });

  const validateFields = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email.includes("@")) {
      newErrors.email = "Email must contain '@'";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validateFields()) {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrors((prev) => ({
            ...prev,
            general: data.error || "Login failed. Please try again.",
          }));
          return;
        }

        console.log("Logged in user:", data.user);
        window.location.href = "/dashboard"; 
        localStorage.setItem("access_token", data.access_token);

        // Redirect or trigger login success flow
      } catch (err) {
        console.error("Login error:", err);
        setErrors((prev) => ({
          ...prev,
          general: "An unexpected error occurred.",
        }));
      }
    }
  };


  return (
    <div className="login-form-container">
      {/* <h1 className="formName">Login</h1> */}
      <div className="titleDescription">
        <h1 className="title">Welcome Back</h1>
        <h2 className="subTitle">Let's login to begin productive</h2>
      </div>
      <form onSubmit={handleSubmit} id="login-form">
        <p>Email</p>
        <LoginInput
          type="email"
          value={email}
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <p>Password</p>
        <LoginInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {errors.general && <p className="error">{errors.general}</p>}
        <div className="subInteraction">
          <div className="rememberMe">
            <input type="checkbox" />
            <label>Remember me</label>
          </div>
          <a href="#" className="forgotPassword">
            Forgot Password?
          </a>
        </div>
      </form>
      <div className="submitButtons">
        <button type="submit" form="login-form" className="submitButton">
          Login
        </button>
        <button type="button" className="google-login" disabled>
          Login with Google (disabled)
        </button>
      </div>
      <div className="register">
        <p>Don't have an account?</p>
        <a href="#" className="registerLink" onClick={toggleForm}>
          Register
        </a>
      </div>
    </div>
  );
};

export default LoginForm;
