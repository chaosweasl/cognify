"use client";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";
import Image from "next/image";
// import nopfp from "@/public/assets/nopfp.png";
const nopfp = "/assets/nopfp.png";

export function UserSettingsTab() {
  const { userProfile, updateUserProfile } = useUserProfile();
  const { userSettings, updateUserSettings } = useSettingsStore();
  const [formData, setFormData] = React.useState({
    username: userProfile?.username || "",
    displayName: userProfile?.display_name || "",
    bio: userProfile?.bio || "",
    theme: userSettings?.theme || "system",
    notificationsEnabled: userSettings?.notifications_enabled ?? true,
    dailyReminder: userSettings?.daily_reminder ?? true,
    reminderTime: userSettings?.reminder_time || "09:00:00",
  });
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        username: userProfile.username || "",
        displayName: userProfile.display_name || "",
        bio: userProfile.bio || "",
      }));
    }
  }, [userProfile]);

  React.useEffect(() => {
    if (userSettings) {
      setFormData((prev) => ({
        ...prev,
        theme: userSettings.theme,
        notificationsEnabled: userSettings.notifications_enabled,
        dailyReminder: userSettings.daily_reminder,
        reminderTime: userSettings.reminder_time,
      }));
    }
  }, [userSettings]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData((prev) => ({ ...prev }));
  };

  const handleSettingsUpdate = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await updateUserProfile({
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio,
      });
      await updateUserSettings({
        theme: formData.theme,
        notifications_enabled: formData.notificationsEnabled,
        daily_reminder: formData.dailyReminder,
        reminder_time: formData.reminderTime,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* First-time user profile setup prompt */}
      {userProfile && !userProfile.username && !userProfile.display_name && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <h3 className="font-bold">Welcome to Cognify!</h3>
            <div className="text-xs">
              Please set up your profile by adding a username. Display name and
              profile picture are optional.
            </div>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-base-content border-b pb-2">
          Profile Information
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-20 h-20 rounded-full">
              <Image
                src={userProfile?.avatar_url || nopfp}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-base-content">Profile Picture</h3>
            <p className="text-sm text-base-content/70">
              Upload a new avatar for your profile
            </p>
            <button className="btn btn-outline btn-sm mt-2">
              Change Avatar
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
              <span className="label-text-alt">
                3-30 characters, letters, numbers, - and _ only
              </span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              className="input input-bordered"
              placeholder="Your unique username"
              pattern="^[a-zA-Z0-9_\-]+$"
              minLength={3}
              maxLength={30}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Display Name</span>
              <span className="label-text-alt">
                Optional - shown to other users
              </span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              className="input input-bordered"
              placeholder="Your display name"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Bio</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="textarea textarea-bordered"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          {/* Remove old update button, replaced by Save Changes below */}
        </form>
      </div>

      {/* Preferences Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-base-content border-b pb-2">
          Preferences
        </h2>

        <div className="space-y-4">
          {/* Theme */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Theme</span>
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleSettingsUpdate("theme", e.target.value)}
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
              <span className="label-text">Email Notifications</span>
              <input
                type="checkbox"
                checked={formData.notificationsEnabled}
                onChange={(e) =>
                  handleSettingsUpdate("notificationsEnabled", e.target.checked)
                }
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {/* Study Reminders */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Study Reminders</span>
              <input
                type="checkbox"
                checked={formData.dailyReminder}
                onChange={(e) =>
                  handleSettingsUpdate("dailyReminder", e.target.checked)
                }
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {/* Reminder Time */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Daily Reminder Time</span>
            </label>
            <input
              type="time"
              value={formData.reminderTime}
              onChange={(e) =>
                handleSettingsUpdate("reminderTime", e.target.value)
              }
              className="input input-bordered"
              disabled={!formData.dailyReminder}
            />
          </div>
        </div>
      </div>
      {/* Save Changes Button */}
      <div className="flex justify-end mt-8">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={pending}
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
