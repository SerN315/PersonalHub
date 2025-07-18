import React, { useState } from "react";
import { SettingAccountProps } from "@/app/types/settings";
import BaseInput from "@/app/components/ui/BaseInput";
import BaseButton from "../ui/BaseButton";
import "@/app/styles/settings/settingAccount.scss";
import BasicIcon from "../ultis/icons";
import { useThemeStore } from "@/app/utils/store/ThemeStore";

const SettingAccount: React.FC<SettingAccountProps> = ({ data, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="settings-section">
      <div className="settings-section__profile__decoration"></div>
      <div className="settings-section__profile__content">
        <div className="settings-section__profile__content__userinfo">
          <div className="settings-section__profile__content__avatar hover-edit-avatar">
            <div className="edit-overlay">
              <BasicIcon icon="Pen01Icon"></BasicIcon>
            </div>
          </div>
          <div className="settings-section__profile__content__name">
            Default Value
          </div>
          <div className="settings-section__profile__content__email">
            email@gmail.com
          </div>
        </div>

        <div className="settings-section__profile__content__actions">
          {isEditing && (
            <div className="settings-section__profile__content__actions__editForm">
              <label>Name</label>
              <BaseInput
                type="text"
                style={{
                  backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
                }}
              />
              <label>Username</label>
              <BaseInput
                type="text"
                style={{
                  backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
                }}
              />
              <label>Email</label>
              <BaseInput
                type="email"
                style={{
                  backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
                }}
              />

              <div className="settings-section__profile__content__actions__editForm__passwordForm">
                <div className="settings-section__profile__content__actions__editForm__passwordForm__controls">
                  <label>Password</label>
                  <BaseButton
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    Change Password
                  </BaseButton>
                </div>

                {showPasswordForm && (
                  <div className="passwordChangeForm">
                    <label>Current Password</label>
                    <BaseInput
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#1a1a1a" : "#ffffff",
                      }}
                    />
                    <label>New Password</label>
                    <BaseInput
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#1a1a1a" : "#ffffff",
                      }}
                    />
                    <label>Confirm New Password</label>
                    <BaseInput
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#1a1a1a" : "#ffffff",
                      }}
                    />
                    <BaseButton>Save Changes</BaseButton>
                    <BaseButton onClick={() => setShowPasswordForm(false)}>
                      Cancel
                    </BaseButton>
                  </div>
                )}
              </div>

              <div className="settings-section__profile__content__actions__editForm__controls">
                <div className="settings-section__profile__content__actions__editForm__controls__save">
                  <BaseButton>Save</BaseButton>
                </div>
                <div className="settings-section__profile__content__actions__editForm__controls__cancel">
                  <BaseButton onClick={() => setIsEditing(false)}>
                    Cancel
                  </BaseButton>
                </div>
              </div>
            </div>
          )}

          <div className="settings-section__profile__content__buttonsContainer">
            <div className="settings-section__profile__content__buttonsContainer__logout">
              <BaseButton>Logout</BaseButton>
            </div>
            <div className="settings-section__profile__content__buttonsContainer__delete">
              <BaseButton>Delete Account</BaseButton>
            </div>
            <div className="settings-section__profile__content__buttonsContainer__edit">
              <BaseButton onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Close Editor" : "Edit Profile"}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingAccount;
