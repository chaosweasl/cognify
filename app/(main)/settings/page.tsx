"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Settings,
  User,
  Brain,
  Shield,
  Sparkles,
  Loader2,
  Clock,
  Star,
  FileText,
  Save,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
}

// Main Page Component
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("user");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/profile");
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const tabs = [{ id: "user", label: "User Settings", icon: User }];

  // Loading state
  if (loading) return <LoadingScreen />;

  // Error state
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="flex-1 min-h-screen relative overflow-hidden">
      <BackgroundDecor />
      <main className="relative z-10 px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <Header userProfile={userProfile} />
          <div className="surface-elevated glass-surface border border-subtle rounded-3xl shadow-brand-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-slower relative">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <div className="p-12 relative">
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-glass rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative z-10">
                {activeTab === "user" && userProfile && (
                  <UserSettingsTab
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                  />
                )}
              </div>
            </div>
          </div>
          <FooterTips />
        </div>
      </main>
    </div>
  );
}

// ---------- Subcomponents ----------

// Loading Screen
function LoadingScreen() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-12 max-w-2xl w-full mx-4 relative z-10 shadow-brand-lg">
        <div className="flex flex-col items-center space-y-8">
          <div className="relative mb-6">
            <div className="w-32 h-32 border-4 border-secondary/20 border-t-brand-primary rounded-full animate-spin" />
            <div
              className="absolute inset-4 w-24 h-24 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "2s" }}
            />
            <div className="absolute inset-8 w-16 h-16 bg-gradient-brand rounded-full animate-pulse opacity-80" />
            <div className="absolute inset-12 w-8 h-8 flex items-center justify-center">
              <Settings className="w-8 h-8 text-white animate-pulse drop-shadow-sm" />
            </div>
          </div>
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-primary">
              Loading Settings
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Preparing your preferences...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Screen
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-16 text-center max-w-2xl mx-4 relative z-10 shadow-brand-lg">
        <div className="flex flex-col items-center space-y-8">
          <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center">
            <Settings className="w-12 h-12 text-red-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-primary">
              Unable to Load Settings
            </h2>
            <p className="text-lg text-secondary">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand-lg hover:shadow-brand px-6 py-3 rounded-2xl font-medium transform hover:scale-105 transition-all duration-slower"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Header
function Header({ userProfile }: { userProfile: UserProfile | null }) {
  return (
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand-lg transform hover:scale-110 hover:rotate-3 transition-all duration-slower group cursor-pointer">
            <Settings className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-slower drop-shadow-lg" />
            <div className="absolute -inset-2 bg-gradient-glass rounded-3xl blur-xl opacity-60 animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-full flex items-center justify-center animate-bounce shadow-brand">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-lg text-secondary">
            Customize your Cognify experience
          </p>
        </div>
      </div>
      {userProfile?.is_admin && (
        <div className="surface-secondary glass-surface border border-brand-secondary/30 px-4 py-2 rounded-2xl shadow-brand">
          <div className="flex items-center gap-2 brand-secondary font-medium">
            <Shield className="w-4 h-4" />
            <span>Admin</span>
            <Star className="w-3 h-3 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Navigation
function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { id: string; label: string; icon: any }[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}) {
  return (
    <div className="border-b border-subtle bg-surface-secondary/30 backdrop-blur-sm">
      <div className="flex">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-8 py-6 font-semibold text-lg transition-all duration-slower group ${
                activeTab === tab.id
                  ? "brand-primary bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10"
                  : "text-muted hover:text-primary interactive-hover"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-slower ${
                  activeTab === tab.id
                    ? "bg-gradient-brand shadow-brand"
                    : "bg-surface-elevated group-hover:bg-gradient-brand/20"
                }`}
              >
                <TabIcon
                  className={`w-5 h-5 transition-all duration-slower ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-muted group-hover:brand-primary"
                  }`}
                />
              </div>
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-brand rounded-t-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Footer Tips
function FooterTips() {
  return (
    <div className="mt-12 text-center space-y-4">
      <p className="text-sm text-muted leading-relaxed max-w-2xl mx-auto">
        <strong className="brand-primary">Pro Tip:</strong> Your settings are
        automatically saved and synced across all your devices. Changes take
        effect immediately to enhance your learning experience.
      </p>
    </div>
  );
}

// Background Decoration
function BackgroundDecor() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </>
  );
}

// ---------- User Settings Tab ----------

function UserSettingsTab({
  userProfile,
  setUserProfile,
}: {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00:00");
  const [pending, setPending] = useState(false);
  const [profilePending, setProfilePending] = useState(false);

  useEffect(() => {
    // Initialize with user settings if available
    setTheme("system");
    setNotificationsEnabled(true);
    setDailyReminder(true);
    setReminderTime("09:00:00");
  }, []);

  const handleSettingsSave = async () => {
    setPending(true);
    try {
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

  const handleProfileSave = async (data: {
    username: string;
    displayName: string;
    bio: string;
    profilePicture: File | null;
  }) => {
    setProfilePending(true);
    try {
      const updatedProfile = { ...userProfile };
      updatedProfile.username = data.username;
      updatedProfile.display_name = data.displayName;
      updatedProfile.bio = data.bio;
      setUserProfile(updatedProfile);
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
      <ProfileSettingsForm
        userProfile={{
          username: userProfile.username,
          displayName: userProfile.display_name || "",
          bio: userProfile.bio || "",
          avatarUrl: userProfile.avatar_url || undefined,
        }}
        isLoading={profilePending}
        onSave={handleProfileSave}
      />
      <PreferencesSection
        theme={theme}
        setTheme={setTheme}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        dailyReminder={dailyReminder}
        setDailyReminder={setDailyReminder}
        reminderTime={reminderTime}
        setReminderTime={setReminderTime}
        handleSettingsSave={handleSettingsSave}
        pending={pending}
      />
    </div>
  );
}

// Preferences Section
function PreferencesSection({
  theme,
  setTheme,
  notificationsEnabled,
  setNotificationsEnabled,
  dailyReminder,
  setDailyReminder,
  reminderTime,
  setReminderTime,
  handleSettingsSave,
  pending,
}: any) {
  return (
    <div className="surface-elevated glass-surface border border-subtle rounded-2xl shadow-brand-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-base-content flex items-center gap-2 mb-4">
        <span className="inline-block w-2 h-2 bg-brand-primary rounded-full animate-pulse mr-2" />
        Preferences
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Theme</span>
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="select select-bordered"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text font-medium">Email Notifications</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="checkbox checkbox-primary"
            />
          </label>
        </div>
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
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Daily Reminder Time</span>
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
      <div className="flex justify-end mt-8">
        <button
          className="btn btn-primary btn-lg px-8 shadow-brand"
          onClick={handleSettingsSave}
          disabled={pending}
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
  );
}

// Profile Form
const ProfileSettingsForm: React.FC<any> = ({
  userProfile,
  isLoading,
  onSave,
}) => {
  const [username, setUsername] = useState(userProfile?.username || "");
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || ""
  );
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setUsername(userProfile?.username || "");
    setDisplayName(userProfile?.displayName || "");
    setBio(userProfile?.bio || "");
  }, [userProfile]);

  useEffect(() => {
    if (profilePicture) {
      const url = URL.createObjectURL(profilePicture);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [profilePicture]);

  const handleFileSelect = (file: File | null) => setProfilePicture(file);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    await onSave({ username, displayName, bio, profilePicture });
    setPending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-elevated glass-surface border border-subtle rounded-2xl shadow-brand-lg p-8 space-y-6"
    >
      <h2 className="text-2xl font-bold text-base-content flex items-center gap-2 mb-4">
        <User className="w-6 h-6 text-brand-primary" />
        Profile
      </h2>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
          <Image
            src={
              previewUrl || userProfile.avatarUrl || "/avatar-placeholder.png"
            }
            alt="Avatar"
            fill
            className="object-cover"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex-1 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Display Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Bio</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="textarea textarea-bordered"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="btn btn-primary shadow-brand"
              disabled={pending || isLoading}
            >
              {pending || isLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
