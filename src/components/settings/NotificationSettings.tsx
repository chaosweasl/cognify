import React from "react";
import { Clock, Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

export function NotificationSettings() {
  const { userSettings, updateUserSettings } = useSettings();

  if (!userSettings) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      await updateUserSettings({ notifications_enabled: enabled });
      toast.success(
        enabled ? "Notifications enabled" : "Notifications disabled"
      );
    } catch {
      toast.error("Failed to update notification settings");
    }
  };

  const handleToggleDailyReminder = async (enabled: boolean) => {
    try {
      await updateUserSettings({ daily_reminder: enabled });
      toast.success(
        enabled ? "Daily reminders enabled" : "Daily reminders disabled"
      );
    } catch {
      toast.error("Failed to update daily reminder settings");
    }
  };

  const handleReminderTimeChange = async (time: string) => {
    try {
      // Convert HH:MM to HH:MM:SS format for database
      const timeWithSeconds = time + ":00";
      await updateUserSettings({ reminder_time: timeWithSeconds });
      toast.success("Reminder time updated");
    } catch {
      toast.error("Failed to update reminder time");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>

        <div className="space-y-4">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {userSettings.notifications_enabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive study reminders and system notifications
                </p>
              </div>
            </div>
            <Switch
              checked={userSettings.notifications_enabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* Daily Reminder */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Daily Study Reminder</p>
                <p className="text-sm text-muted-foreground">
                  Get reminded to study at a specific time each day
                </p>
              </div>
            </div>
            <Switch
              checked={userSettings.daily_reminder}
              onCheckedChange={handleToggleDailyReminder}
              disabled={!userSettings.notifications_enabled}
            />
          </div>

          {/* Reminder Time */}
          {userSettings.daily_reminder &&
            userSettings.notifications_enabled && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reminder Time</p>
                    <p className="text-sm text-muted-foreground">
                      When would you like to receive your daily study reminder?
                    </p>
                  </div>
                  <Input
                    type="time"
                    value={userSettings.reminder_time?.slice(0, 5) || "09:00"}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
