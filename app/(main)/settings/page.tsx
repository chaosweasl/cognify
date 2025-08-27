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
  Sun,
  Monitor,
} from "lucide-react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
}

// Rate limiting constants (local-only)
const TEN_SECONDS = 10 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const MAX_CHANGES_PER_HOUR = 3;
const STORAGE_KEY = "profileUpdateTimestamps";

function getTimestamps(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTimestamps(timestamps: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

function canProceedWithUpdate(): { allowed: boolean; message?: string } {
  const now = Date.now();
  const timestamps = getTimestamps().filter((ts) => now - ts < ONE_HOUR);

  if (timestamps.length >= MAX_CHANGES_PER_HOUR) {
    return {
      allowed: false,
      message: `You can only update your profile ${MAX_CHANGES_PER_HOUR} times per hour.`,
    };
  }

  const last = timestamps[timestamps.length - 1];
  if (last && now - last < TEN_SECONDS) {
    const secondsLeft = Math.ceil((TEN_SECONDS - (now - last)) / 1000);
    return {
      allowed: false,
      message: `Please wait ${secondsLeft}s before trying again.`,
    };
  }

  return { allowed: true };
}

function recordUpdateTimestamp() {
  const now = Date.now();
  const timestamps = getTimestamps()
    .filter((ts) => now - ts < ONE_HOUR)
    .concat(now);
  setTimestamps(timestamps);
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  // user profile hooks
  const {
    userProfile: profileFromHook,
    updateUserProfile,
    uploadAvatar,
    isLoading: profileLoading,
  } = useUserProfile();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data: UserProfile = await res.json();
        setUserProfile(data);
        setUsername(data.username || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setPreviewUrl(data.avatar_url || null);

        // attempt to load settings from store hook if available
        if (typeof loadUserSettings === "function") {
          await loadUserSettings();
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(userSettings.reminder_time?.slice(0, 5) || "09:00");
    }
  }, [userSettings]);

  useEffect(() => {
    if (profilePicture) {
      const url = URL.createObjectURL(profilePicture);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [profilePicture]);

  if (loading || settingsLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const tabs = [{ id: "user", label: "User Settings", icon: User }];

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
    setProfilePicture(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSaveAll = async () => {
    const validation = validateProfile(displayName, bio);
    if (!validation.valid) {
      toast.error(validation.message || "Invalid input");
      return;
    }

    const { trimmedDisplayName, trimmedBio } = validation;
    const changes = getChangedFields(trimmedDisplayName, #trimmedBio);

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

      const profilePayload: any = {};
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

      // clear file input preview after success
      setProfilePicture(null);
      setPreviewUrl(userProfile?.avatar_url ?? null);

      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setPending(false);
    }
  };

  const handleReset = () => {
    setUsername(userProfile?.username ?? "");
    setDisplayName(userProfile?.display_name ?? "");
    setBio(userProfile?.bio ?? "");
    setPreviewUrl(userProfile?.avatar_url ?? null);
    setProfilePicture(null);

    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(userSettings.reminder_time?.slice(0, 5) || "09:00");
    }
  };

  return (
    <div className="min-h-screen surface-primary relative w-full">
      <BackgroundDecor />

      <div className="relative container mx-auto px-6 py-10 max-w-5xl">
        {/* Header */}
        <header className="mb-12 animate-[slideInUp_0.6s_ease-out]">
          <Header userProfile={userProfile} />
        </header>

        {/* Card */}
        <div className="glass-surface rounded-3xl overflow-hidden shadow-brand-lg border border-subtle transition-all transition-normal">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="p-8 md:p-12">
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Profile Section */}
              <ProfileSection
                userProfile={userProfile}
                username={username}
                setUsername={setUsername}
                displayName={displayName}
                setDisplayName={setDisplayName}
                bio={bio}
                setBio={setBio}
                profilePicture={profilePicture}
                previewUrl={previewUrl}
                setProfilePicture={setProfilePicture}
                setPreviewUrl={setPreviewUrl}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                profileLoading={pending || profileLoading}
                onFileSelect={handleFileSelect}
              />

              {/* Preferences */}
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-subtle">
                <button
                  className="px-6 py-3 surface-elevated border border-secondary text-secondary rounded-2xl font-medium interactive-hover transition-all transition-normal hover:scale-105 flex items-center justify-center gap-2"
                  onClick={handleReset}
                  disabled={pending}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  className={`px-8 py-3 bg-gradient-brand text-white rounded-2xl font-semibold shadow-brand hover:shadow-brand-lg transition-all transition-normal hover:scale-105 flex items-center justify-center gap-2 ${
                    pending ? "opacity-70 pointer-events-none" : ""
                  }`}
                  onClick={handleSaveAll}
                >
                  <Save className="w-4 h-4" />
                  {pending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== LOADING & ERROR SCREENS ===== */
function LoadingScreen() {
  return (
    <div className="min-h-screen surface-primary flex items-center justify-center relative overflow-hidden w-full">
      <BackgroundDecor />
      <div className="glass-surface rounded-3xl p-12 max-w-md w-full mx-4 shadow-brand-lg border border-subtle">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center">
              <Settings
                className="w-8 h-8 brand-primary animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <div className="absolute -inset-1 bg-gradient-brand rounded-2xl blur opacity-20 animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">
              Loading Settings
            </h2>
            <div className="flex items-center justify-center gap-3 text-sm text-muted">
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
    <div className="min-h-screen surface-primary flex items-center justify-center relative overflow-hidden w-full">
      <BackgroundDecor />
      <div className="glass-surface rounded-3xl p-12 max-w-md w-full mx-4 shadow-brand-lg border border-subtle">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              Unable to Load Settings
            </h2>
            <p className="text-muted mb-6">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-brand text-white rounded-2xl font-semibold shadow-brand hover:shadow-brand-lg transition-all transition-normal"
            >
              Try Again
            </button>
            <button
              onClick={() => history.back()}
              className="px-6 py-3 surface-elevated border border-secondary text-secondary rounded-2xl font-semibold interactive-hover transition-all transition-normal"
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand transform group-hover:scale-110 transition-all transition-normal">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-brand rounded-3xl blur opacity-0 group-hover:opacity-50 transition-all transition-normal" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted mt-1">Customize your Cognify experience</p>
        </div>
      </div>

      {userProfile?.is_admin && (
        <div className="flex items-center gap-2 px-4 py-2 surface-glass rounded-2xl border border-brand shadow-brand">
          <Shield className="w-4 h-4 brand-primary" />
          <span className="text-sm font-semibold text-primary">Admin</span>
        </div>
      )}
    </div>
  );
}

/* ===== TAB NAV ===== */
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
    <div className="border-b border-subtle surface-glass">
      <div className="flex">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-8 py-6 font-semibold transition-all transition-normal group ${
                active
                  ? "text-primary surface-elevated"
                  : "text-secondary hover:text-primary interactive-hover"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all transition-normal ${
                  active
                    ? "bg-gradient-brand shadow-brand"
                    : "surface-secondary group-hover:surface-elevated"
                }`}
              >
                <TabIcon
                  className={`w-5 h-5 transition-all transition-normal ${
                    active
                      ? "text-white"
                      : "text-muted group-hover:brand-primary"
                  }`}
                />
              </div>
              <span className="text-lg">{tab.label}</span>
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

/* ===== PROFILE SECTION & FORM (uses lifted state) ===== */
function ProfileSection({
  userProfile,
  username,
  setUsername,
  displayName,
  setDisplayName,
  bio,
  setBio,
  profilePicture,
  previewUrl,
  setProfilePicture,
  setPreviewUrl,
  focusedField,
  setFocusedField,
  profileLoading,
  onFileSelect,
}: {
  userProfile: UserProfile | null;
  username: string;
  setUsername: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  profilePicture: File | null;
  previewUrl: string | null;
  setProfilePicture: (f: File | null) => void;
  setPreviewUrl: (u: string | null) => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
  profileLoading: boolean;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Profile Information
          </h2>
          <p className="text-muted">Update your personal details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-subtle shadow-brand relative bg-surface-secondary">
              <Image
                src={
                  previewUrl || userProfile?.avatar_url || "/assets/nopfp.png"
                }
                alt="Profile picture"
                fill
                className="object-cover transition-all transition-normal group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all transition-normal flex items-center justify-center">
                <Camera className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-sm text-muted text-center">
            Click to change avatar
          </p>
        </div>

        {/* Fields */}
        <div className="lg:col-span-2 space-y-6">
          <FormField
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="Enter your username"
            focused={focusedField === "username"}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
          />

          <FormField
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="How others see your name"
            focused={focusedField === "displayName"}
            onFocus={() => setFocusedField("displayName")}
            onBlur={() => setFocusedField(null)}
          />

          <div
            className={`space-y-2 transition-all transition-normal ${
              focusedField === "bio" ? "scale-[1.01]" : ""
            }`}
          >
            <label className="block text-sm font-semibold text-primary">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              rows={4}
              placeholder="Tell others about yourself..."
              className={`w-full px-4 py-3 rounded-2xl border-2 transition-all transition-normal resize-none ${
                focusedField === "bio"
                  ? "border-brand surface-elevated shadow-brand"
                  : "border-secondary surface-secondary"
              }`}
            />
          </div>

          {/* Account Info */}
          {userProfile?.email && (
            <div className="p-4 surface-elevated rounded-2xl border border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-primary">
                    Email Address
                  </div>
                  <div className="text-sm text-muted">{userProfile.email}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          )}
        </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div
      className={`space-y-2 transition-all transition-normal ${
        focused ? "scale-[1.01]" : ""
      }`}
    >
      <label className="block text-sm font-semibold text-primary">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-2xl border-2 transition-all transition-normal ${
          focused
            ? "border-brand surface-elevated shadow-brand"
            : "border-secondary surface-secondary"
        }`}
      />
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
  const themeIcons: Record<string, any> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-tertiary to-brand-secondary rounded-2xl flex items-center justify-center shadow-brand">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">Preferences</h2>
          <p className="text-muted">Customize your experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
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
                  className={`p-3 rounded-xl border-2 transition-all transition-normal flex flex-col items-center gap-2 ${
                    theme === themeOption
                      ? "border-brand bg-gradient-brand text-white shadow-brand"
                      : "border-secondary surface-secondary text-secondary hover:border-brand interactive-hover"
                  }`}
                >
                  <Icon className="w-5 h-5" />
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
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 brand-primary" />
            <label className="text-sm font-semibold text-primary">
              Study Reminder
            </label>
          </div>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            disabled={!dailyReminder}
            className="w-full px-4 py-3 rounded-2xl border-2 border-secondary surface-secondary text-primary transition-all transition-normal focus:border-brand focus:surface-elevated focus:shadow-brand disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleCard
          icon={<Bell className="w-5 h-5 brand-primary" />}
          title="Email Notifications"
          description="Get updates about your progress"
          checked={notificationsEnabled}
          onChange={setNotificationsEnabled}
        />
        <ToggleCard
          icon={<Clock className="w-5 h-5 brand-primary" />}
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
    <div className="p-6 surface-elevated rounded-2xl border border-subtle transition-all transition-normal hover:border-brand group">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">{icon}</div>
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
      className={`w-12 h-7 rounded-full transition-all transition-normal flex items-center relative ${
        checked
          ? "bg-gradient-brand shadow-brand"
          : "surface-primary border-2 border-secondary"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full transition-all transition-normal absolute ${
          checked
            ? "translate-x-6 bg-white shadow-brand"
            : "translate-x-1 surface-elevated border border-subtle"
        }`}
      />
    </button>
  );
}

/* ===== Background Decorations ===== */
function BackgroundDecor() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-brand-primary/30 to-brand-secondary/30 rounded-full animate-pulse blur-3xl"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-brand-tertiary/25 to-brand-accent/25 rounded-full animate-pulse blur-3xl"
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
