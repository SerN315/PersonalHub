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
import { useThemeStore } from "@/app/utils/store/ThemeStore";

const SettingAccount: React.FC<SettingAccountProps> = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    profile_picture: "",
  });

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
    if (isEditing) {
      setFormData({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        profile_picture: formData.profile_picture,
      });
    }
  }, [isEditing, formData]);

  useEffect(() => {
    fetchUser()
      .then((user) => {
        setFormData({
          name: user.display_name || "",
          username: user.user_metadata?.username || "",
          email: user.email,
          profile_picture: user.profile_picture || "",
        });
      })
      .catch((err) => {
        console.error(err);
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

    const payload: any = {};

    if (formData.name && formData.name !== userData.name) {
      payload.display_name = formData.name;
    }

    if (formData.username && formData.username !== userData.username) {
      payload.username = formData.username;
    }

    if (formData.email && formData.email !== userData.email) {
      payload.email = formData.email;
    }

    if (profileImage) {
      payload.profile_picture = formData.profile_picture;
    }

    if (Object.keys(payload).length > 0) {
      await updateUser(payload);

      const updated = await fetchUser();
      setUserData({
        name: updated.display_name || "",
        username: updated.user_metadata?.username || "",
        email: updated.email,
        profile_picture: updated.profile_picture || "",
      });
    }

    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth/login";
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      alert("Password changed successfully.");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (
        err.message.includes("incorrect") ||
        err.message.includes("Invalid")
      ) {
        alert("The current password is incorrect.");
      } else {
        alert("Failed to change password: " + err.message);
      }
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
                backgroundImage: formData.profile_picture
                  ? `url(${formData.profile_picture})`
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
              {formData.username || "Guest User"}
            </div>
            <div className="settings-section__profile__content__email">
              {formData.email}
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
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <label>Username</label>
              <BaseInput
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
              <label>Email</label>
              <BaseInput
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <div className="settings-section__profile__content__actions__editForm__passwordForm">
                <label>Password</label>
                <div className="settings-section__profile__content__actions__editForm__passwordForm__content">
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
