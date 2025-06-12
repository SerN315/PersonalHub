import React, { FC } from "react";
import Input from "./BaseInput";

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
  return (
    <Input
      type={type}
      error={error}
      value={value}
      onChange={onChange}
      placeholder={`Enter your ${label}`}
    />
  );
};

export default LoginInput;
