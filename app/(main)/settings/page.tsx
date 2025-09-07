"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Settings,
  User,
  Shield,
  Loader2,
  Camera,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Palette,
  Clock,
  Bell,
  Moon,
  Edit3,
  Mail,
  Sun,
  Monitor,
} from "lucide-react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";
import { canProceedWithUpdate, recordUpdateTimestamp } from "./actions";
import { ThemeSelector } from "@/src/components/settings/ThemeSelector";
import { NotificationSettings } from "@/src/components/settings/NotificationSettings";
import { BackupRestoreSettings } from "@/src/components/settings/BackupRestoreSettings";

export interface UserProfile {
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

  // form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // preferences
  const {
    userSettings,
    updateUserSettings,
    loadUserSettings,
    isLoading: settingsLoading,
  } = useSettingsStore();

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");

  // user profile hooks (only what we need)
  const { updateUserProfile, uploadAvatar } = useUserProfile();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await window.fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data: UserProfile = await res.json();
        setUserProfile(data);
        setUsername(data.username || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");

        // attempt to load settings from store hook if available
        if (typeof loadUserSettings === "function") {
          await loadUserSettings();
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [loadUserSettings]);

  useEffect(() => {
    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(userSettings.reminder_time?.slice(0, 5) || "09:00");
    }
  }, [userSettings]);

  if (loading || settingsLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const tabs = [
    { id: "user", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "backup", label: "Data", icon: Shield },
  ];

  function validateProfile(displayNameValue: string, bioValue: string) {
    const trimmedDisplayName = displayNameValue.trim();
    const trimmedBio = bioValue.trim();

    if (trimmedDisplayName.length > 21)
      return {
        valid: false,
        message: "Display name must be 21 characters or less.",
      };
    if (/\s/.test(trimmedDisplayName))
      return {
        valid: false,
        message: "Display name cannot contain whitespace.",
      };
    if (trimmedBio.length > 500)
      return { valid: false, message: "Bio must be 500 characters or less." };

    return { valid: true, trimmedDisplayName, trimmedBio } as const;
  }

  function getChangedFields(trimmedDisplayName: string, trimmedBio: string) {
    const existingDisplay = userProfile?.display_name ?? "";
    const existingBio = userProfile?.bio ?? "";
    const existingUsername = userProfile?.username ?? "";

    return {
      isDisplayNameChanged: trimmedDisplayName !== existingDisplay,
      isBioChanged: trimmedBio !== existingBio,
      isAvatarChanged: !!profilePicture,
      isUsernameChanged: username.trim() !== existingUsername,
    };
  }

  const handleFileSelect = (file: File | null) => {
    // only lift file to parent; preview is handled locally in ProfileSection
    setProfilePicture(file);
  };

  const handleSaveAll = async () => {
    const validation = validateProfile(displayName, bio);
    if (!validation.valid) {
      toast.error(validation.message || "Invalid input");
      return;
    }

    const { trimmedDisplayName, trimmedBio } = validation;
    const safeDisplayName = trimmedDisplayName ?? "";
    const safeBio = trimmedBio ?? "";
    const changes = getChangedFields(safeDisplayName, safeBio);

    // Check if anything changed (profile or preferences)
    const prefsChanged =
      !!userSettings &&
      (theme !== userSettings.theme ||
        notificationsEnabled !== userSettings.notifications_enabled ||
        dailyReminder !== userSettings.daily_reminder ||
        reminderTime + ":00" !== userSettings.reminder_time);

    if (
      !changes.isDisplayNameChanged &&
      !changes.isBioChanged &&
      !changes.isAvatarChanged &&
      !changes.isUsernameChanged &&
      !prefsChanged
    ) {
      toast.info("No changes to save.");
      return;
    }

    const rateLimit = canProceedWithUpdate();
    if (!rateLimit.allowed) {
      toast.warning(rateLimit.message || "Rate limited");
      return;
    }

    setPending(true);

    try {
      let updatedAvatarUrl = userProfile?.avatar_url ?? null;

      if (changes.isAvatarChanged && profilePicture) {
        updatedAvatarUrl = await uploadAvatar(profilePicture);
      }

      const profilePayload: Partial<UserProfile> = {};
      if (changes.isDisplayNameChanged)
        profilePayload.display_name = trimmedDisplayName || null;
      if (changes.isBioChanged) profilePayload.bio = trimmedBio || null;
      if (changes.isAvatarChanged) profilePayload.avatar_url = updatedAvatarUrl;
      if (changes.isUsernameChanged) profilePayload.username = username.trim();

      if (Object.keys(profilePayload).length > 0) {
        await updateUserProfile(profilePayload);
        recordUpdateTimestamp();
      }

      // preferences
      await updateUserSettings({
        theme,
        notifications_enabled: notificationsEnabled,
        daily_reminder: dailyReminder,
        reminder_time: reminderTime + ":00",
      });

      // reflect locally
      setUserProfile((prev) => (prev ? { ...prev, ...profilePayload } : prev));

      // clear lifted file after success
      setProfilePicture(null);

      toast.success("Settings saved successfully!");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setPending(false);
    }
  };

  const handleReset = () => {
    setUsername(userProfile?.username ?? "");
    setDisplayName(userProfile?.display_name ?? "");
    setBio(userProfile?.bio ?? "");
    setProfilePicture(null);

    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(
        userSettings.reminder_time &&
          typeof userSettings.reminder_time === "string"
          ? userSettings.reminder_time.slice(0, 5)
          : "09:00"
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Header userProfile={userProfile} />
        </header>

        {/* Main Card */}
        <div className="glass-surface rounded-2xl shadow-lg border border-primary/10 overflow-hidden">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="p-6 lg:p-8">
            {activeTab === "user" && (
              <div className="space-y-8">
                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Section */}
                  <div className="space-y-6">
                    <SectionHeader
                      icon={<User className="w-5 h-5 text-white" />}
                      title="Profile Information"
                      subtitle="Update your personal details"
                    />
                    <ProfileSection
                      userProfile={userProfile}
                      username={username}
                      setUsername={setUsername}
                      displayName={displayName}
                      setDisplayName={setDisplayName}
                      bio={bio}
                      setBio={setBio}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      onFileSelect={handleFileSelect}
                    />
                  </div>

                  {/* Basic Preferences Section */}
                  <div className="space-y-6">
                    <SectionHeader
                      icon={<Settings className="w-5 h-5 text-white" />}
                      title="Basic Preferences"
                      subtitle="Quick theme settings"
                    />
                    <ThemeSelector />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-subtle">
                  <button
                    className="px-5 py-2.5 surface-elevated border border-secondary text-secondary rounded-xl font-medium interactive-hover transition-all duration-200 flex items-center justify-center gap-2"
                    onClick={handleReset}
                    disabled={pending}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    className={`px-6 py-2.5 bg-gradient-brand text-white rounded-xl font-medium shadow-brand hover:shadow-brand-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      pending ? "opacity-70 pointer-events-none" : ""
                    }`}
                    onClick={handleSaveAll}
                  >
                    {pending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {pending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={<Palette className="w-5 h-5 text-white" />}
                  title="Appearance & Theme"
                  subtitle="Customize how Cognify looks and feels"
                />
                <ThemeSelector />

                <div className="pt-8 border-t border-subtle">
                  <SectionHeader
                    icon={<Settings className="w-5 h-5 text-white" />}
                    title="Study Preferences"
                    subtitle="Configure your learning experience"
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
                  />
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={<Bell className="w-5 h-5 text-white" />}
                  title="Notifications & Reminders"
                  subtitle="Manage how and when you receive notifications"
                />
                <NotificationSettings />
              </div>
            )}

            {activeTab === "backup" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={<Shield className="w-5 h-5 text-white" />}
                  title="Data Management"
                  subtitle="Backup and restore your learning data"
                />
                <BackupRestoreSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== LOADING & ERROR SCREENS ===== */
function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="glass-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg border border-primary/10">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 surface-elevated rounded-xl flex items-center justify-center">
              <Settings
                className="w-8 h-8 brand-primary animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary mb-2">
              Loading Settings
            </h2>
            <div className="flex items-center justify-center gap-3 text-muted">
              <Loader2 className="w-4 h-4 animate-spin brand-primary" />
              <span>Preparing your workspace...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="glass-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg border border-primary/10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary mb-2">
              Unable to Load Settings
            </h2>
            <p className="text-muted mb-6">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gradient-brand text-white rounded-xl font-medium shadow-brand hover:shadow-brand-lg transition-all duration-200"
            >
              Try Again
            </button>
            <button
              onClick={() => history.back()}
              className="px-5 py-2.5 surface-elevated border border-secondary text-secondary rounded-xl font-medium interactive-hover transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== HEADER ===== */
function Header({ userProfile }: { userProfile: UserProfile | null }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-brand">
            <Settings className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Settings
          </h1>
          <p className="text-muted mt-1">Customize your Cognify experience</p>
        </div>
      </div>

      {userProfile?.is_admin && (
        <div className="flex items-center gap-2 px-3 py-1.5 surface-glass rounded-lg border-brand shadow-brand">
          <Shield className="w-4 h-4 brand-primary" />
          <span className="text-sm font-semibold text-primary">Admin</span>
        </div>
      )}
    </div>
  );
}

/* ===== SECTION HEADER ===== */
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        <p className="text-muted text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

/* ===== TAB NAV ===== */
function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { id: string; label: string; icon: React.ElementType }[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}) {
  return (
    <div className="border-b border-subtle surface-glass">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                active
                  ? "text-primary surface-elevated"
                  : "text-secondary hover:text-primary interactive-hover"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  active
                    ? "bg-gradient-brand shadow-brand"
                    : "surface-secondary group-hover:surface-elevated"
                }`}
              >
                <TabIcon
                  className={`w-4 h-4 transition-all duration-200 ${
                    active
                      ? "text-white"
                      : "text-muted group-hover:brand-primary"
                  }`}
                />
              </div>
              <span className="text-sm">{tab.label}</span>
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-brand rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== PROFILE SECTION ===== */
function ProfileSection({
  userProfile,
  username,
  setUsername,
  displayName,
  setDisplayName,
  bio,
  setBio,
  focusedField,
  setFocusedField,
  onFileSelect,
}: {
  userProfile: UserProfile | null;
  username: string;
  setUsername: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
  onFileSelect: (file: File | null) => void;
}) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setLocalPreviewUrl(null);
  }, [userProfile]);

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4 p-5 surface-elevated rounded-xl border-subtle">
        <div className="relative group">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-subtle shadow-sm relative surface-secondary">
            <Image
              src={
                localPreviewUrl ||
                userProfile?.avatar_url ||
                "/assets/nopfp.png"
              }
              alt="Profile picture"
              fill
              className="object-cover transition-all duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setLocalPreviewUrl(ev.target?.result as string);
                reader.readAsDataURL(file);
              } else {
                setLocalPreviewUrl(null);
              }
              onFileSelect(file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <p className="text-xs text-muted text-center">Click to change avatar</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <FormField
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Enter your username"
          focused={focusedField === "username"}
          onFocus={() => setFocusedField("username")}
          onBlur={() => setFocusedField(null)}
          icon={<Edit3 className="w-4 h-4 text-muted" />}
        />

        <FormField
          label="Display Name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="How others see your name"
          focused={focusedField === "displayName"}
          onFocus={() => setFocusedField("displayName")}
          onBlur={() => setFocusedField(null)}
          icon={<User className="w-4 h-4 text-muted" />}
        />

        <div
          className={`space-y-2 transition-all duration-200 ${
            focusedField === "bio" ? "scale-[1.01]" : ""
          }`}
        >
          <label className="block text-sm font-semibold text-primary">
            Bio
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              rows={4}
              placeholder="Tell others about yourself..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 resize-none text-sm surface-secondary text-primary ${
                focusedField === "bio"
                  ? "border-brand surface-elevated shadow-brand"
                  : "border-secondary hover:border-subtle"
              }`}
            />
            <Edit3 className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
          </div>
        </div>

        {/* Account Info */}
        {userProfile?.email && (
          <div className="p-4 surface-elevated rounded-lg border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 surface-elevated dark:surface-elevated/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-secondary dark:text-brand-secondary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-primary">
                    Email Address
                  </div>
                  <div className="text-xs text-muted">{userProfile.email}</div>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Form Field ===== */
function FormField({
  label,
  value,
  onChange,
  placeholder,
  focused,
  onFocus,
  onBlur,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`space-y-2 transition-all duration-200 ${
        focused ? "scale-[1.01]" : ""
      }`}
    >
      <label className="block text-sm font-semibold text-primary">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full ${
            icon ? "pl-10" : "pl-4"
          } pr-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm surface-secondary text-primary ${
            focused
              ? "border-brand surface-elevated shadow-brand"
              : "border-secondary hover:border-subtle"
          }`}
        />
      </div>
    </div>
  );
}

/* ===== PREFERENCES ===== */
function PreferencesSection({
  theme,
  setTheme,
  notificationsEnabled,
  setNotificationsEnabled,
  dailyReminder,
  setDailyReminder,
  reminderTime,
  setReminderTime,
}: {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  dailyReminder: boolean;
  setDailyReminder: (v: boolean) => void;
  reminderTime: string;
  setReminderTime: (t: string) => void;
}) {
  const themeIcons: Record<string, React.ElementType> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 brand-primary" />
          <label className="text-sm font-semibold text-primary">Theme</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((themeOption) => {
            const Icon = themeIcons[themeOption];
            return (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                  theme === themeOption
                    ? "border-brand bg-gradient-brand text-white shadow-brand"
                    : "border-secondary surface-secondary text-secondary hover:border-brand interactive-hover"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium capitalize">
                  {themeOption}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminder time */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 brand-primary" />
          <label className="text-sm font-semibold text-primary">
            Study Reminder
          </label>
        </div>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            disabled={!dailyReminder}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-secondary surface-secondary text-primary transition-all duration-200 focus:border-brand focus:surface-elevated focus:shadow-brand disabled:opacity-50 text-sm"
          />
        </div>
      </div>

      {/* Toggle Cards */}
      <div className="space-y-4">
        <ToggleCard
          icon={<Bell className="w-4 h-4 brand-primary" />}
          title="Email Notifications"
          description="Get updates about your progress"
          checked={notificationsEnabled}
          onChange={setNotificationsEnabled}
        />
        <ToggleCard
          icon={<Clock className="w-4 h-4 brand-primary" />}
          title="Daily Reminders"
          description="Never miss a study session"
          checked={dailyReminder}
          onChange={setDailyReminder}
        />
      </div>
    </div>
  );
}

/* ===== Toggle Card & Switch ===== */
function ToggleCard({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="p-4 surface-elevated rounded-xl border-subtle transition-all duration-200 hover:border-brand group">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-primary mb-1">
              {title}
            </div>
            <div className="text-xs text-muted leading-relaxed">
              {description}
            </div>
          </div>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-all duration-200 flex items-center relative ${
        checked
          ? "bg-gradient-brand"
          : "surface-primary border-2 border-secondary"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full transition-all duration-200 absolute ${
          checked
            ? "translate-x-6 bg-white shadow-brand"
            : "translate-x-1 surface-elevated border border-subtle"
        }`}
      />
    </button>
  );
}
