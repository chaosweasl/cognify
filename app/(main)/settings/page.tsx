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
  Database,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";
import { canProceedWithUpdate, recordUpdateTimestamp } from "./actions";
import { ThemeSelector } from "@/src/components/settings/ThemeSelector";
import { BackupRestoreSettings } from "@/src/components/settings/BackupRestoreSettings";
import { AIConfigurationSection } from "@/src/components/settings/AIConfigurationSection";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary flex items-center justify-center">
      <div className="glass-surface p-12 rounded-3xl border border-brand-primary/20">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center animate-pulse">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-brand/30 rounded-2xl blur opacity-60 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">
              Loading Settings
            </h3>
            <p className="text-secondary">
              Please wait while we load your preferences...
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="h-2 surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand rounded-full animate-pulse"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Screen Component
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary flex items-center justify-center">
      <div className="glass-surface p-12 rounded-3xl border border-status-error/20 max-w-md">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 bg-status-error/10 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary mb-2">
              Settings Error
            </h3>
            <p className="text-secondary mb-4">
              We encountered an issue loading your settings.
            </p>
            <p className="text-sm text-status-error font-mono bg-status-error/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-brand"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick Stats Component
function QuickStats({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {userProfile.display_name || userProfile.username}
              </div>
              <div className="text-sm text-secondary">Account Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Secure</div>
              <div className="text-sm text-secondary">Privacy Protected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Active</div>
              <div className="text-sm text-secondary">Ready to Learn</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Preferences
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

  // User profile hooks
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

  const handleFileSelect = (file: File | null) => {
    setProfilePicture(file);
  };

  const validateProfile = (displayNameValue: string, bioValue: string) => {
    const trimmedDisplayName = displayNameValue.trim();
    const trimmedBio = bioValue.trim();

    if (trimmedDisplayName.length > 21)
      return {
        valid: false,
        message: "Display name must be 21 characters or less.",
      };
    if (/\\s/.test(trimmedDisplayName))
      return {
        valid: false,
        message: "Display name cannot contain whitespace.",
      };
    if (trimmedBio.length > 500)
      return { valid: false, message: "Bio must be 500 characters or less." };

    return { valid: true, trimmedDisplayName, trimmedBio } as const;
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

    const rateLimit = canProceedWithUpdate();
    if (!rateLimit.allowed) {
      toast.warning(rateLimit.message || "Rate limited");
      return;
    }

    setPending(true);

    try {
      let updatedAvatarUrl = userProfile?.avatar_url ?? null;

      if (profilePicture) {
        updatedAvatarUrl = await uploadAvatar(profilePicture);
      }

      await updateUserProfile({
        username: username.trim(),
        display_name: safeDisplayName,
        bio: safeBio,
        avatar_url: updatedAvatarUrl,
      });

      await updateUserSettings({
        theme,
        notifications_enabled: notificationsEnabled,
        daily_reminder: dailyReminder,
        reminder_time: reminderTime + ":00",
      });

      recordUpdateTimestamp();
      toast.success("Settings saved successfully!");

      // Refresh profile data
      const res = await window.fetch("/api/user/profile");
      if (res.ok) {
        const data: UserProfile = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleReset = () => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setDisplayName(userProfile.display_name || "");
      setBio(userProfile.bio || "");
    }
    setProfilePicture(null);
    if (userSettings) {
      setTheme(userSettings.theme);
      setNotificationsEnabled(userSettings.notifications_enabled);
      setDailyReminder(userSettings.daily_reminder);
      setReminderTime(userSettings.reminder_time?.slice(0, 5) || "09:00");
    }
    toast.info("Changes reset to saved values");
  };

  if (!userProfile) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-brand/10 px-6 py-3 rounded-full border border-brand-primary/20 mb-6">
            <Settings className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-medium text-brand-primary">
              Account Settings
            </span>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent mb-4">
            Settings & Preferences
          </h1>

          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Customize your Cognify experience, manage your profile, and
            configure AI providers.
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats userProfile={userProfile} />

        {/* Main Settings Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Profile Settings */}
          <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Profile
                  </CardTitle>
                  <p className="text-secondary">
                    Manage your account information
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 p-6 bg-surface-secondary/50 rounded-xl">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-brand flex items-center justify-center">
                    {userProfile.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <button className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">
                    Profile Picture
                  </h4>
                  <p className="text-sm text-secondary mb-3">
                    Upload a new avatar
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileSelect(e.target.files?.[0] || null)
                    }
                    className="text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary file:text-white hover:file:bg-brand-primary/90 file:cursor-pointer"
                  />
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl surface-secondary border-2 transition-all text-primary ${
                      focusedField === "username"
                        ? "border-brand-primary surface-primary shadow-brand-lg"
                        : "border-subtle hover:border-primary"
                    }`}
                    placeholder="Enter username..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onFocus={() => setFocusedField("displayName")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl surface-secondary border-2 transition-all text-primary ${
                      focusedField === "displayName"
                        ? "border-brand-primary surface-primary shadow-brand-lg"
                        : "border-subtle hover:border-primary"
                    }`}
                    placeholder="Your display name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onFocus={() => setFocusedField("bio")}
                    onBlur={() => setFocusedField(null)}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl surface-secondary border-2 transition-all text-primary resize-none ${
                      focusedField === "bio"
                        ? "border-brand-primary surface-primary shadow-brand-lg"
                        : "border-subtle hover:border-primary"
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-xs text-muted mt-1">
                    {bio.length}/500 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme & Appearance */}
          <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Appearance
                  </CardTitle>
                  <p className="text-secondary">Customize how Cognify looks</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelector />

              {/* Study Preferences */}
              <div className="p-4 bg-surface-secondary/50 rounded-xl space-y-4">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Study Reminders
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-secondary">
                      Daily Reminders
                    </div>
                    <div className="text-sm text-muted">
                      Get notified to study each day
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={dailyReminder}
                      onChange={(e) => setDailyReminder(e.target.checked)}
                      className="sr-only"
                      id="daily-reminder"
                    />
                    <label
                      htmlFor="daily-reminder"
                      className={`flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5 transition-colors ${
                        dailyReminder
                          ? "bg-brand-primary"
                          : "bg-surface-secondary"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          dailyReminder ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                </div>

                {dailyReminder && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="px-3 py-2 rounded-lg surface-primary border border-subtle hover:border-primary focus:border-brand-primary transition-all text-primary text-sm"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Configuration Section */}
        <div className="mb-8">
          <AIConfigurationSection variant="settings" />
        </div>

        {/* Data & Security */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Privacy & Security
                  </CardTitle>
                  <p className="text-secondary">
                    Control your data and privacy
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-xl">
                <div>
                  <div className="font-medium text-primary">
                    Email Notifications
                  </div>
                  <div className="text-sm text-muted">
                    Receive updates via email
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only"
                    id="notifications"
                  />
                  <label
                    htmlFor="notifications"
                    className={`flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5 transition-colors ${
                      notificationsEnabled
                        ? "bg-brand-primary"
                        : "bg-surface-secondary"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        notificationsEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 border border-status-success/30 bg-status-success/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <span className="font-medium text-status-success text-sm">
                    Privacy Protected
                  </span>
                </div>
                <p className="text-xs text-secondary">
                  Your API keys are stored locally in your browser and never
                  sent to our servers.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Data Management
                  </CardTitle>
                  <p className="text-secondary">Export and manage your data</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BackupRestoreSettings />
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="glass-surface rounded-3xl p-8 border border-subtle">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-primary mb-2">
                Ready to Save?
              </h3>
              <p className="text-secondary">
                Make sure all your settings are configured correctly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={pending}
                className="hover:scale-105 transition-transform"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Changes
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={pending}
                className="bg-gradient-brand hover:scale-105 transition-transform"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
