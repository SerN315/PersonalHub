"use client";
import React, { useState } from "react";
import LoginInput from "@/app/components/ui/loginInput";

interface RegisterFormProps {
  toggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ toggleForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmpassword?: string;
    notempty?: string;
    general?: string;
  }>({
    email: undefined,
    password: undefined,
    confirmpassword: undefined,
    notempty: undefined,
    general: undefined,
  });

  const validateFields = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmpassword?: string;
      notempty?: string;
    } = {};

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (confirmpassword !== password) {
      newErrors.confirmpassword = "Passwords do not match";
    }

    if (userName.trim().length < 1) {
      newErrors.notempty = "Username cannot be empty";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  if (validateFields()) {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Signup failed:", data.error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: data.error || "Failed to register. Please try again.",
        }));
        return;
      }

      console.log("User registered:", data.user);
      window.location.href = "/auth/login";
      localStorage.setItem("access_token", data.access_token);

      // TODO: Redirect or show success
    } catch (error) {
      console.error("Registration error:", error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        general: "An unexpected error occurred during registration.",
      }));
    }
  }
};


  return (
    <div className="register-form-container">
      <h1 className="formName">Create your account</h1>
      <form onSubmit={handleSubmit} id="register-form">
        <p>Username</p>
        <LoginInput
          value={userName}
          label="Username"
          onChange={(e) => setUserName(e.target.value)}
          error={errors.notempty}
        />
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
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <p>Confirm Password</p>
        <LoginInput
          type="password"
          label="Confirm Password"
          value={confirmpassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmpassword}
        />
        {errors.general && <p className="error">{errors.general}</p>}
      </form>
      <button className="submitButton" type="submit" form="register-form">
        Register
      </button>
      <div className="register">
        <p>Already have an account</p>
        <a href="#" className="registerLink" onClick={toggleForm}>
          Login
        </a>
      </div>
    </div>
  );
};

export default RegisterForm;
