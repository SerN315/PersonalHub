"use client";

import React, { useState } from "react";
import "@/app/styles/settings/settings.scss";
import BasicIcon from "@/app/components/ultis/icons";
import Modal from "@/app/components/ui/Modal";
import ProfileSettings from "./ProfileSettings";
import AppearanceSettings from "./AppearanceSettings";
import SecuritySettings from "./SecuritySettings";
import type { SettingsModalProps, SettingsTab } from "@/app/types/settings";
import type { IconName } from "@/app/components/ultis/icons";

const TABS: { key: SettingsTab; label: string; blurb: string; icon: IconName }[] = [
  { key: "Profile", label: "Profile", blurb: "Who you are", icon: "UserIcon" },
  { key: "Appearance", label: "Appearance", blurb: "Make it feel like yours", icon: "PaintBoardIcon" },
  { key: "Security", label: "Security", blurb: "Password and sign-in", icon: "LockPasswordIcon" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, initialTab = "Profile", onClose }) => {
  // Opening from a different entry point (profile vs. appearance) lands on that tab; afterwards it is the person's to move.
  const [chosen, setChosen] = useState<{ tab: SettingsTab; opened: SettingsTab } | null>(null);
  const activeTab = chosen && chosen.opened === initialTab ? chosen.tab : initialTab;
  const select = (tab: SettingsTab) => setChosen({ tab, opened: initialTab });

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const index = TABS.findIndex((t) => t.key === activeTab);
    const next = TABS[(index + step + TABS.length) % TABS.length].key;
    select(next);
    document.getElementById(`settings-tab-${next}`)?.focus();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" width={880} bare>
      <div className="settings">
        <aside className="settings__side">
          <div className="settings__title">
            <h2 aria-hidden>Settings</h2>
            <button type="button" className="iconBtn settings__close" onClick={onClose} aria-label="Close settings">
              <BasicIcon icon="Cancel01Icon" size={20} />
            </button>
          </div>
          <div className="settings__tabs" role="tablist" aria-orientation="vertical" onKeyDown={onTabKeyDown}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                id={`settings-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="settings-panel"
                tabIndex={activeTab === tab.key ? 0 : -1}
                className="settings__tab"
                onClick={() => select(tab.key)}
              >
                <BasicIcon icon={tab.icon} size={20} />
                <span className="settings__tabText">
                  <span className="settings__tabLabel">{tab.label}</span>
                  <span className="settings__tabBlurb">{tab.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section id="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`} className="settings__panel">
          {activeTab === "Profile" && <ProfileSettings />}
          {activeTab === "Appearance" && <AppearanceSettings />}
          {activeTab === "Security" && <SecuritySettings onSignedOut={onClose} />}
        </section>
      </div>
    </Modal>
  );
};
