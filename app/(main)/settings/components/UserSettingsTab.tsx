"use client";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSettingsStore } from "@/hooks/useSettings";
import { User, Camera, Bell, Clock, Palette, Save, Info } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Card className="bg-brand-primary/10 border border-brand-primary/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-2">Welcome to Cognify!</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Please set up your profile by adding a username. Display name and
                  profile picture are optional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Section */}
      <Card className="surface-elevated glass-surface border border-subtle">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">Profile Information</h2>
              <p className="text-secondary">Manage your public profile details</p>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 p-6 surface-secondary rounded-2xl border border-subtle">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-primary/20 shadow-brand">
                <Image
                  src={userProfile?.avatar_url || nopfp}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center shadow-brand">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">Profile Picture</h3>
              <p className="text-sm text-secondary mb-3">
                Upload a new avatar for your profile
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="surface-elevated border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10"
              >
                <Camera className="w-4 h-4 mr-2" />
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-secondary font-semibold">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                  placeholder="Your unique username"
                />
                <p className="text-xs text-muted">
                  3-30 characters, letters, numbers, - and _ only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-secondary font-semibold">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                  placeholder="Your display name"
                />
                <p className="text-xs text-muted">
                  Optional - shown to other users
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-secondary font-semibold">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal resize-none"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card className="surface-elevated glass-surface border border-subtle">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center shadow-brand">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">Preferences</h2>
              <p className="text-secondary">Customize your app experience</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Theme Selection */}
            <div className="p-6 surface-secondary rounded-2xl border border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-brand-primary" />
                <h3 className="font-semibold text-primary">Theme</h3>
              </div>
              <Select
                value={formData.theme}
                onValueChange={(value) => handleSettingsUpdate("theme", value)}
              >
                <SelectTrigger className="surface-elevated border-secondary focus:border-brand-primary">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent className="surface-overlay glass-surface border-subtle">
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="p-6 surface-secondary rounded-2xl border border-subtle">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-brand-primary" />
                <h3 className="font-semibold text-primary">Notifications</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-secondary">Email Notifications</Label>
                    <p className="text-sm text-muted">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={formData.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate("notificationsEnabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-secondary">Study Reminders</Label>
                    <p className="text-sm text-muted">Daily reminders to keep you on track</p>
                  </div>
                  <Switch
                    checked={formData.dailyReminder}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate("dailyReminder", checked)
                    }
                  />
                </div>

                {formData.dailyReminder && (
                  <div className="pl-6 border-l-2 border-brand-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <Label className="font-medium text-secondary">Reminder Time</Label>
                    </div>
                    <Input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) =>
                        handleSettingsUpdate("reminderTime", e.target.value)
                      }
                      className="surface-elevated border-secondary focus:border-brand-primary transition-all transition-normal max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={pending}
          className="px-8 py-3 bg-gradient-brand hover:shadow-brand-lg text-white font-semibold"
        >
          {pending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
