"use client";
import React, { useState } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";
import ProfileSettingsForm from "./ProfileSettingsForm";
import { toast } from "sonner";

export function UserSettingsTab() {
  const {
    userProfile,
    isLoading: isProfileLoading,
    updateUserProfile,
    uploadAvatar,
  } = useUserProfile();
  const { userSettings, updateUserSettings } = useSettingsStore();
  // Local state for settings only (profile handled by ProfileSettingsForm)
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    userSettings?.theme || "system"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userSettings?.notifications_enabled ?? true
  );
  const [dailyReminder, setDailyReminder] = useState(
    userSettings?.daily_reminder ?? true
  );
  const [reminderTime, setReminderTime] = useState(
    userSettings?.reminder_time || "09:00:00"
  );
  const [pending, setPending] = useState(false);
  const [profilePending, setProfilePending] = useState(false);

  React.useEffect(() => {
    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(userSettings.reminder_time);
    }
  }, [userSettings]);

  const handleSettingsSave = async () => {
    setPending(true);
    try {
      await updateUserSettings({
        theme,
        notifications_enabled: notificationsEnabled,
        daily_reminder: dailyReminder,
        reminder_time: reminderTime,
      });
      toast("Preferences updated", {
        description: "Your preferences were saved.",
      });
    } catch (err: any) {
      toast("Error updating preferences", {
        description: err?.message || "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  // Profile save handler for ProfileSettingsForm
  const handleProfileSave = async (data: {
    username: string;
    displayName: string;
    bio: string;
    profilePicture: File | null;
  }) => {
    setProfilePending(true);
    try {
      let avatarUrl = userProfile?.avatar_url || null;
      if (data.profilePicture) {
        avatarUrl = await uploadAvatar(data.profilePicture);
      }
      await updateUserProfile({
        username: data.username.trim(),
        display_name: data.displayName.trim() || null,
        bio: data.bio.slice(0, 500).trim() || null,
        avatar_url: avatarUrl,
      });
      toast("Profile updated", { description: "Your profile was saved." });
    } catch (err: any) {
      toast("Error updating profile", {
        description: err?.message || "Unknown error",
      });
    } finally {
      setProfilePending(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Profile Section */}
      <ProfileSettingsForm
        userProfile={
          userProfile
            ? {
                username: userProfile.username || "",
                displayName: userProfile.display_name || "",
                bio: userProfile.bio || "",
                avatarUrl: userProfile.avatar_url || undefined,
              }
            : undefined
        }
        isLoading={isProfileLoading || profilePending}
        onSave={handleProfileSave}
      />

      {/* Preferences Section */}
      <div className="surface-elevated glass-surface border border-subtle rounded-2xl shadow-brand-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-base-content flex items-center gap-2 mb-4">
          <span className="inline-block w-2 h-2 bg-brand-primary rounded-full animate-pulse mr-2" />
          Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Theme</span>
            </label>
            <select
              value={theme}
              onChange={(e) =>
                setTheme(e.target.value as "light" | "dark" | "system")
              }
              className="select select-bordered"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          {/* Email Notifications */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text font-medium">
                Email Notifications
              </span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>
          {/* Study Reminders */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text font-medium">Study Reminders</span>
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>
          {/* Reminder Time */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Daily Reminder Time
              </span>
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input input-bordered"
              disabled={!dailyReminder}
            />
          </div>
        </div>
        {/* Save Changes Button */}
        <div className="flex justify-end mt-8">
          <button
            className="btn btn-primary btn-lg px-8 shadow-brand"
            onClick={handleSettingsSave}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
