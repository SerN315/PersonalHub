"use client";

import {
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
import { LoadingSpinner } from "../ultis/loadingSpinner";
import { useUserStore } from "@/app/utils/store/userStore";

const SettingAccount: React.FC<SettingAccountProps> = () => {
  // Use the store directly for user, loading, and fetched
  const { user, setUser, loading, fetched } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    avatar_url: "",
  });

  const isLoggedIn = !!user?.email;

  const [, setProfileImage] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync formData with user when editing starts
  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [isEditing, user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));

      try {
        const uploadedUrl = await uploadProfileImage(file);
        setFormData({ ...formData, avatar_url: uploadedUrl });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Image upload failed:", err.message);
        alert("Failed to upload image. Please try again.");
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {};

      if (formData.name && formData.name !== user?.name) {
        payload.display_name = formData.name;
      }
      if (formData.username && formData.username !== user?.username) {
        payload.username = formData.username;
      }
      if (formData.email && formData.email !== user?.email) {
        payload.email = formData.email;
      }
      if (formData.avatar_url && formData.avatar_url !== user?.avatar_url) {
        payload.avatar_url = formData.avatar_url;
      }

      if (Object.keys(payload).length > 0) {
        await updateUser(payload);
        setUser({
          id: user?.id || "",
          name: formData.name,
          username: formData.username,
          email: formData.email,
          avatar_url: formData.avatar_url,
        });
      }

      setIsEditing(false);
      setProfileImage(null);
      setPreviewUrl(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  console.log("User from store:", user);
  // Only show loading spinner while fetching user info
  if (loading || !fetched) {
    return <LoadingSpinner />;
  }
  return (
    <div className="settings-section">
      <div className="settings-section__decoration"></div>
      <div className="settings-section__profile">
        <div className="settings-section__profile__content">
          <div className="settings-section__profile__content__userinfo">
            <div
              className="settings-section__profile__content__avatar hover-edit-avatar"
              style={{
                backgroundImage: previewUrl
                  ? `url(${previewUrl})`
                  : user?.avatar_url
                  ? `url(${user.avatar_url})`
                  : `url('/Blank-Avatar.webp')`,
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
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                  />
                </>
              )}
            </div>
            <div className="settings-section__profile__content__name">
              {user?.username || "Guest User"}
            </div>
            <div className="settings-section__profile__content__email">
              {user?.email || ""}
            </div>
          </div>

          {isLoggedIn && !isEditing ? (
            <div className="settings-section__profile__edit">
              <BaseButton onClick={() => setIsEditing(true)}>
                Edit Profile
              </BaseButton>
            </div>
          ) : (
            <div className="settings-section__profile__edit">
              <BaseButton
                onClick={() => (window.location.href = "/auth/login")}
              >
                Login
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
                <BaseButton onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </BaseButton>
                <BaseButton
                  onClick={() => {
                    setIsEditing(false);
                    setProfileImage(null);
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </BaseButton>
              </div>
            </div>
          )}
        </div>
        {isLoggedIn && (
          <div className="settings-section__buttonsContainer">
            <>
              <div className="settings-section__buttonsContainer__logout">
                <BaseButton onClick={handleLogout}>Logout</BaseButton>
              </div>
              <div className="settings-section__buttonsContainer__delete">
                <BaseButton disabled>Delete Account</BaseButton>
              </div>
            </>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingAccount;
