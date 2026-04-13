import React from "react";
import "@/app/styles/ultis/LoginForms.scss";
import "@/app/styles/pages/Login.scss";
import LoginInternal from "./LoginInternal";
import Image from "next/image";

const LoginPage: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-page-container">
        <div className="login-page-content">
          <LoginInternal />
        </div>
        <div className="decorImage">
        <Image
          alt="The Storm"
          src="/604723-DmC-Devil-May-Cry-Vergil-4K.jpg"
          fill={true}
          style={{ objectFit: "cover" }}
          sizes="100vw, 33vw"
        ></Image>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
