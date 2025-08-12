"use client";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/toast-provider";
import Image from "next/image";
// import nopfp from "@/public/assets/nopfp.png";
const nopfp = "/assets/nopfp.png";

export function UserSettingsTab() {
  const { userProfile, isLoading, updateUserProfile } = useUserProfile();
  const { userSettings, updateUserSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = React.useState({
    displayName: userProfile?.display_name || "",
    bio: userProfile?.bio || "",
    theme: userSettings.theme,
    notificationsEnabled: userSettings.notificationsEnabled,
    dailyReminder: userSettings.dailyReminder,
    reminderTime: userSettings.reminderTime,
  });

  React.useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        displayName: userProfile.display_name || "",
        bio: userProfile.bio || "",
      }));
    }
  }, [userProfile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        display_name: formData.displayName,
        bio: formData.bio,
      });
      showToast("Profile updated successfully!", "success");
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const handleSettingsUpdate = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateUserSettings({ [field]: value });
    showToast("Settings updated", "success");
  };

  return (
    <div className="space-y-8">
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
              <span className="label-text">Display Name</span>
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </button>
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
    </div>
  );
}
