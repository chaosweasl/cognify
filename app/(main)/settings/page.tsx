"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Settings, User, Shield, Sparkles, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("user");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setUserProfile(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const tabs = [{ id: "user", label: "User Settings", icon: User }];

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundDecor />
      <div className="relative container mx-auto px-6 py-10 max-w-6xl">
        <header className="mb-10 animate-[slideUp_0.6s_ease-out]">
          <Header userProfile={userProfile} />
        </header>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        General
                      </h3>
                      <p className="text-sm text-gray-600">
                        Account overview & quick actions
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                          <Image
                            src={
                              userProfile?.avatar_url ||
                              "/avatar-placeholder.png"
                            }
                            alt="avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {userProfile?.display_name || userProfile?.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userProfile?.email || "No email linked"}
                          </div>
                        </div>
                      </div>
                      {userProfile?.is_admin && (
                        <div className="px-3 py-1 bg-white/70 rounded-full border border-gray-200/40 text-sm font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-700" />
                          Admin
                          <Star className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={() =>
                          toast("This would open advanced security")
                        }
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Security & Access
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 hover:shadow-xl transition-all duration-300">
                  <h4 className="text-lg font-bold mb-3">Quick Preferences</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Small toggles to speed up your workflow
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Auto-save</div>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        defaultChecked
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Email notifications
                      </div>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Profile</h2>
                        <p className="text-sm text-gray-600">
                          Edit your username, display name and bio
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Last saved: —</div>
                    </div>
                  </div>

                  <div className="p-6">
                    <ProfileSettingsForm
                      userProfile={{
                        username: userProfile?.username || "",
                        displayName: userProfile?.display_name || "",
                        bio: userProfile?.bio || "",
                        avatarUrl: userProfile?.avatar_url || undefined,
                      }}
                      isLoading={false}
                      onSave={async (data: any) => {
                        // optimistic update
                        const updated = userProfile ? { ...userProfile } : null;
                        if (updated) {
                          updated.username = data.username;
                          updated.display_name = data.displayName;
                          updated.bio = data.bio;
                          if (data.profilePicture) {
                            // temporary preview url for optimistic UI
                            updated.avatar_url = URL.createObjectURL(
                              data.profilePicture
                            );
                          }
                          setUserProfile(updated);
                        }
                        toast.success("Profile saved");
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 hover:shadow-xl transition-all duration-300">
                  <PreferencesSection />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 hover:scale-105 transition-all duration-300"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-transform duration-300"
                    onClick={() => toast.success("Settings saved")}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          Made with ❤️ — Settings follow the editor UX patterns
        </footer>
      </div>

      <style jsx global>{`
        :root {
          --brand-primary: #4f46e5;
          --brand-accent: #8b5cf6;
          --brand-secondary: #06b6d4;

          --surface: rgba(255, 255, 255, 0.8);
          --glass-blur: 8px;

          --card-radius: 1rem;
          --control-radius: 0.75rem;

          --shadow-lg: 0 10px 30px rgba(2, 6, 23, 0.08);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseSoft {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .glass-surface {
          background: var(--surface);
          backdrop-filter: blur(var(--glass-blur));
        }
      `}</style>
    </div>
  );
}

/* ------------------------
   Loading / Error (editor-style)
   ------------------------ */

function LoadingScreen() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-12 max-w-lg w-full mx-4 shadow-lg">
        <div className="flex flex-col items-center gap-6">
          <div className="w-28 h-28 rounded-full border-4 border-blue-100 flex items-center justify-center relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
            <div className="absolute">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading Settings</h2>
            <div className="flex items-center justify-center gap-3 mt-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing your
              preferences...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-3xl p-12 max-w-lg w-full mx-4 shadow-lg">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-lg flex items-center justify-center">
            <Settings className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold">Unable to Load Settings</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl"
            >
              Try Again
            </button>
            <button
              onClick={() => history.back()}
              className="px-4 py-2 border border-gray-300 rounded-2xl"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------
   Header / Tabs
   ------------------------ */

function Header({ userProfile }: { userProfile: UserProfile | null }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <Settings className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800">
            Settings
          </h1>
          <p className="text-sm text-gray-600">
            Customize your Cognify experience
          </p>
        </div>
      </div>

      {userProfile?.is_admin && (
        <div className="px-4 py-2 rounded-2xl bg-white/70 border border-gray-200 flex items-center gap-2 shadow-sm">
          <Shield className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium">Admin</span>
          <Star className="w-3 h-3 text-yellow-400" />
        </div>
      )}
    </div>
  );
}

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
    <div className="border-b border-gray-100 bg-transparent">
      <div className="flex">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-6 py-4 font-semibold text-md transition-all duration-300 ${
                active
                  ? "text-gray-900 bg-white/30"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  active
                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                    : "bg-gray-50"
                }`}
              >
                <TabIcon
                  className={`w-5 h-5 ${
                    active ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <span>{tab.label}</span>
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------
   Profile form and Preferences
   ------------------------ */

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    } else setPreviewUrl(null);
  }, [profilePicture]);

  const handleFileSelect = (file: File | null) => setProfilePicture(file);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await onSave({ username, displayName, bio, profilePicture });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
    >
      <div className="col-span-1">
        <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <Image
            src={
              previewUrl || userProfile.avatarUrl || "/avatar-placeholder.png"
            }
            alt="avatar"
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
      </div>

      <div className="md:col-span-2 space-y-4">
        <div
          className={`group ${
            focusedField === "username" ? "scale-[1.01] shadow-lg" : ""
          }`}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 transition-all duration-300 ${
              focusedField === "username"
                ? "border-blue-500 bg-white"
                : "border-gray-200"
            }`}
          />
        </div>

        <div
          className={`group ${
            focusedField === "displayName" ? "scale-[1.01] shadow-lg" : ""
          }`}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Display Name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onFocus={() => setFocusedField("displayName")}
            onBlur={() => setFocusedField(null)}
            className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 transition-all duration-300 ${
              focusedField === "displayName"
                ? "border-blue-500 bg-white"
                : "border-gray-200"
            }`}
          />
        </div>

        <div
          className={`group ${
            focusedField === "bio" ? "scale-[1.01] shadow-lg" : ""
          }`}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onFocus={() => setFocusedField("bio")}
            onBlur={() => setFocusedField(null)}
            rows={4}
            className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 transition-all duration-300 resize-none ${
              focusedField === "bio"
                ? "border-blue-500 bg-white"
                : "border-gray-200"
            }`}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-transform duration-300"
          >
            {pending || isLoading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </form>
  );
};

function PreferencesSection() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTheme("system");
    setNotificationsEnabled(true);
    setDailyReminder(true);
    setReminderTime("09:00");
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      toast.success("Preferences updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Preferences</h3>
        <div className="text-sm text-gray-500">Autosave on</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            onFocus={() => setFocusedField("theme")}
            onBlur={() => setFocusedField(null)}
            className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 ${
              focusedField === "theme"
                ? "border-blue-500 bg-white"
                : "border-gray-200"
            }`}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Email Notifications</div>
            <div className="text-xs text-gray-500">
              Get notified about important updates
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="checkbox checkbox-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Study Reminders</div>
            <div className="text-xs text-gray-500">
              Receive daily study reminder
            </div>
          </div>
          <input
            type="checkbox"
            checked={dailyReminder}
            onChange={(e) => setDailyReminder(e.target.checked)}
            className="checkbox checkbox-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            disabled={!dailyReminder}
            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-transform duration-300"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------
   Background decorations
   ------------------------ */

function BackgroundDecor() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-300/30 rounded-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-cyan-200/30 to-violet-200/30 rounded-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.04) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </>
  );
}
