import React, { FC } from "react";
import Input from "./BaseInput";
import { useThemeStore } from "@/app/utils/store/ThemeStore";

interface LoginInputProps {
  label?: string;
  error?: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LoginInput: FC<LoginInputProps> = ({
  label,
  error,
  value,
  onChange,
  type,
}) => {
  const { theme } = useThemeStore();
  return (
    <Input
      type={type}
      error={error}
      value={value}
      onChange={onChange}
      placeholder={`Enter your ${label}`}
      style={{
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#000000",
      }}
    />
  );
};

export default LoginInput;
