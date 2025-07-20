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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // loading indicator

  // This holds the actual user data displayed in the UI
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    avatar_url: "",
  });

  // This holds the form data for editing (separate from display data)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    avatar_url: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize form data with user data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url,
      });
    }
  }, [isEditing, userData]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUser()
      .then((user) => {
        const fetchedUserData = {
          name: user.display_name || "",
          username: user.user_metadata?.username || "",
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || "",
        };
        console.log("Fetched user data:", fetchedUserData);
        setUserData(fetchedUserData);
        setFormData(fetchedUserData);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // preview

      try {
        const uploadedUrl = await uploadProfileImage(file); // Upload to /api/upload-avatar
        setFormData({ ...formData, avatar_url: uploadedUrl }); // Update form with new avatar URL
      } catch (err: any) {
        console.error("Image upload failed:", err.message);
        alert("Failed to upload image. Please try again.");
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
      if (formData.avatar_url && formData.avatar_url !== userData.avatar_url) {
        payload.avatar_url = formData.avatar_url;
      }

      if (Object.keys(payload).length > 0) {
        await updateUser(payload);
        const updated = await fetchUser();
        const updatedUserData = {
          name: updated.display_name || "",
          username: updated.user_metadata?.username || "",
          email: updated.email,
          avatar_url: updated.avatar_url || "",
        };
        setUserData(updatedUserData);
      }

      setIsEditing(false);
      setProfileImage(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
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
                backgroundImage: previewUrl
                  ? `url(${previewUrl})`
                  : userData.avatar_url
                  ? `url(${userData.avatar_url})`
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
