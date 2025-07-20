"use client";

import {
  fetchUser,
  updateUser,
  logoutUser,
  uploadProfileImage,
  changePassword,
} from "@/app/apis/settings";
import React, { useState, useEffect } from "react";
import { SettingAccountProps } from "@/app/types/settings";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "../ui/BaseButton";
import "@/app/styles/settings/settingAccount.scss";
import BasicIcon from "../ultis/icons";

const SettingAccount: React.FC<SettingAccountProps> = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    profile_picture: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUser()
      .then((user) => {
        setUserData({
          name: user.display_name || "",
          username: user.user_metadata?.username || "",
          email: user.email,
          profile_picture: user.profile_picture || "",
        });
      })
      .catch((err) => {
        console.error(err);
        // window.location.href = "/login"; // Redirect if unauthorized
      });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleSave = async () => {
    let profile_picture = userData.profile_picture;
    if (profileImage) {
      profile_picture = await uploadProfileImage(profileImage);
    }

    await updateUser({
      display_name: userData.name,
      username: userData.username,
      email: userData.email,
      profile_picture,
    });

    setIsEditing(false);

    // Refresh user data
    const updated = await fetchUser();
    setUserData({
      name: updated.display_name || "",
      username: updated.user_metadata?.username || "",
      email: updated.email,
      profile_picture: updated.profile_picture || "",
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth/login";
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      alert("Password changed successfully");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section__decoration"></div>
      <div className="settings-section__profile">
        <div className="settings-section__profile__content">
          <div className="settings-section__profile__content__userinfo">
            <div
              className="settings-section__profile__content__avatar hover-edit-avatar"
              style={{
                backgroundImage: userData.profile_picture
                  ? `url(${userData.profile_picture})`
                  : `url('/default-avatar.png')`,
              }}
            >
              {isEditing && (
                <>
                  <div className="edit-overlay">
                    <BasicIcon icon="Pen01Icon" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </>
              )}
            </div>
            <div className="settings-section__profile__content__name">
              {userData.username || "Guest User"}
            </div>
            <div className="settings-section__profile__content__email">
              {userData.email}
            </div>
          </div>

          {!isEditing && (
            <div className="settings-section__profile__edit">
              <BaseButton onClick={() => setIsEditing(true)}>
                Edit Profile
              </BaseButton>
            </div>
          )}

          {isEditing && (
            <div className="settings-section__profile__content__actions__editForm">
              <label>Name</label>
              <BaseInput
                type="text"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
              />
              <label>Username</label>
              <BaseInput
                type="text"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
              />
              <label>Email</label>
              <BaseInput
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />

              <div className="settings-section__profile__content__actions__editForm__passwordForm">
                <label>Password</label>
                {!showPasswordForm && (
                  <BaseButton onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </BaseButton>
                )}
                {showPasswordForm && (
                  <>
                    <label>Current Password</label>
                    <BaseInput
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <label>New Password</label>
                    <BaseInput
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <label>Confirm New Password</label>
                    <BaseInput
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <BaseButton onClick={handlePasswordChange}>
                      Save Password
                    </BaseButton>
                    <BaseButton onClick={() => setShowPasswordForm(false)}>
                      Cancel
                    </BaseButton>
                  </>
                )}
              </div>

              <div className="settings-section__profile__content__actions__editForm__controls">
                <BaseButton onClick={handleSave}>Save</BaseButton>
                <BaseButton onClick={() => setIsEditing(false)}>
                  Cancel
                </BaseButton>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section__buttonsContainer">
          <div className="settings-section__buttonsContainer__logout">
            <BaseButton onClick={handleLogout}>Logout</BaseButton>
          </div>
          <div className="settings-section__buttonsContainer__delete">
            <BaseButton disabled>Delete Account</BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingAccount;
