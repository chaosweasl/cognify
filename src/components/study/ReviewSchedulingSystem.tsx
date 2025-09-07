"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Clock,
  Calendar,
  Settings,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Mail,
  BellRing,
  Target,
} from "lucide-react";
import { useUserId } from "@/hooks/useUserId";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StudyReminder {
  id: string;
  user_id: string;
  project_id?: string;
  project_name?: string;
  reminder_type:
    | "daily_study"
    | "due_reviews"
    | "learning_cards"
    | "goal_check";
  scheduled_time: string;
  is_active: boolean;
  last_sent: string | null;
  notification_method: "browser" | "email" | "both";
  message: string;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
  };
}

interface ReviewSchedulingSystemProps {
  projectId?: string;
  className?: string;
}

export function ReviewSchedulingSystem({
  projectId,
  className = "",
}: ReviewSchedulingSystemProps) {
  const userId = useUserId();
  const supabase = createClient();

  const [reminders, setReminders] = useState<StudyReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    reminderType: "daily_study" as StudyReminder["reminder_type"],
    scheduledTime: "09:00",
    notificationMethod: "browser" as StudyReminder["notification_method"],
    projectId: projectId || "",
    message: "",
  });

  // Load existing reminders
  useEffect(() => {
    if (!userId) return;

    const loadReminders = async () => {
      try {
        setLoading(true);

        const query = supabase
          .from("study_reminders")
          .select(
            `
            *,
            projects(name)
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (projectId) {
          query.eq("project_id", projectId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to include project names
        const transformedReminders: StudyReminder[] = (data || []).map(
          (reminder) => ({
            ...reminder,
            project_name: reminder.projects?.name || undefined,
          })
        );

        setReminders(transformedReminders);
      } catch (error) {
        console.error("Error loading reminders:", error);
        toast.error("Failed to load study reminders");
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, [userId, supabase, projectId]);

  const createReminder = async () => {
    if (!userId) return;

    try {
      const message =
        newReminder.message || getDefaultMessage(newReminder.reminderType);

      const { data, error } = await supabase
        .from("study_reminders")
        .insert({
          user_id: userId,
          project_id: newReminder.projectId || null,
          reminder_type: newReminder.reminderType,
          scheduled_time: newReminder.scheduledTime,
          notification_method: newReminder.notificationMethod,
          message,
          is_active: true,
        })
        .select(
          `
          *,
          projects(name)
        `
        )
        .single();

      if (error) throw error;

      const transformedReminder: StudyReminder = {
        ...data,
        project_name: data.projects?.name || undefined,
      };

      setReminders((prev) => [transformedReminder, ...prev]);
      setShowCreateForm(false);
      setNewReminder({
        reminderType: "daily_study",
        scheduledTime: "09:00",
        notificationMethod: "browser",
        projectId: projectId || "",
        message: "",
      });

      // Schedule the notification using the browser's notification system
      if (
        newReminder.notificationMethod === "browser" ||
        newReminder.notificationMethod === "both"
      ) {
        await scheduleNotification(transformedReminder);
      }

      toast.success("Study reminder created successfully!");
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create study reminder");
    }
  };

  const toggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("study_reminders")
        .update({ is_active: isActive })
        .eq("id", reminderId);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId
            ? { ...reminder, is_active: isActive }
            : reminder
        )
      );

      toast.success(`Reminder ${isActive ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast.error("Failed to update reminder");
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("study_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;

      setReminders((prev) =>
        prev.filter((reminder) => reminder.id !== reminderId)
      );
      toast.success("Reminder deleted successfully");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const scheduleNotification = async (reminder: StudyReminder) => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return;
    }

    // Request permission if not already granted
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
    }

    if (Notification.permission !== "granted") {
      toast.error("Notification permission not granted");
      return;
    }

    // Calculate time until next reminder
    const now = new Date();
    const [hours, minutes] = reminder.scheduled_time.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    // Use setTimeout for immediate scheduling (for demo purposes)
    // In production, you'd want to use a more robust scheduling system
    setTimeout(() => {
      new Notification(
        `Study Reminder: ${reminder.project_name || "All Projects"}`,
        {
          body: reminder.message,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: `study-reminder-${reminder.id}`,
          requireInteraction: true,
        }
      );

      // Update last_sent timestamp
      supabase
        .from("study_reminders")
        .update({ last_sent: new Date().toISOString() })
        .eq("id", reminder.id);
    }, Math.min(timeUntilReminder, 2147483647)); // Max setTimeout value
  };

  const getDefaultMessage = (
    reminderType: StudyReminder["reminder_type"]
  ): string => {
    switch (reminderType) {
      case "daily_study":
        return "It's time for your daily study session! 📚";
      case "due_reviews":
        return "You have cards due for review. Keep your streak going! 🔥";
      case "learning_cards":
        return "Your learning cards are ready for the next step! 🎯";
      case "goal_check":
        return "Check your study goals progress and stay on track! 🏆";
      default:
        return "Time to study! 📖";
    }
  };

  const getReminderIcon = (reminderType: StudyReminder["reminder_type"]) => {
    switch (reminderType) {
      case "daily_study":
        return <Calendar className="w-4 h-4" />;
      case "due_reviews":
        return <Clock className="w-4 h-4" />;
      case "learning_cards":
        return <Target className="w-4 h-4" />;
      case "goal_check":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getReminderTypeLabel = (
    reminderType: StudyReminder["reminder_type"]
  ): string => {
    switch (reminderType) {
      case "daily_study":
        return "Daily Study";
      case "due_reviews":
        return "Due Reviews";
      case "learning_cards":
        return "Learning Cards";
      case "goal_check":
        return "Goal Check";
      default:
        return "Study Reminder";
    }
  };

  if (loading) {
    return (
      <div
        className={`glass-surface border border-subtle rounded-xl p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-subtle rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-subtle rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-primary" />
            Study Reminders
          </h2>
          <p className="text-text-muted mt-1">
            Set up notifications to stay on track with your studies
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Reminder
        </Button>
      </div>

      {/* Notification Permission Check */}
      {"Notification" in window && Notification.permission === "default" && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">
                Enable Notifications
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Allow notifications to receive study reminders in your browser.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => Notification.requestPermission()}
              >
                <BellRing className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Reminder Form */}
      {showCreateForm && (
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Create New Reminder
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">
                  Reminder Type
                </label>
                <select
                  value={newReminder.reminderType}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      reminderType: e.target
                        .value as StudyReminder["reminder_type"],
                    }))
                  }
                  className="w-full p-2 surface-elevated border border-subtle rounded-lg text-primary"
                >
                  <option value="daily_study">Daily Study</option>
                  <option value="due_reviews">Due Reviews</option>
                  <option value="learning_cards">Learning Cards</option>
                  <option value="goal_check">Goal Check</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">
                  Time
                </label>
                <input
                  type="time"
                  value={newReminder.scheduledTime}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }))
                  }
                  className="w-full p-2 surface-elevated border border-subtle rounded-lg text-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Notification Method
              </label>
              <select
                value={newReminder.notificationMethod}
                onChange={(e) =>
                  setNewReminder((prev) => ({
                    ...prev,
                    notificationMethod: e.target
                      .value as StudyReminder["notification_method"],
                  }))
                }
                className="w-full p-2 surface-elevated border border-subtle rounded-lg text-primary"
              >
                <option value="browser">Browser Notification</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Custom Message (Optional)
              </label>
              <textarea
                value={newReminder.message}
                onChange={(e) =>
                  setNewReminder((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder={getDefaultMessage(newReminder.reminderType)}
                rows={2}
                className="w-full p-2 surface-elevated border border-subtle rounded-lg text-primary resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createReminder}
                className="bg-brand-primary text-primary-foreground"
              >
                Create Reminder
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Existing Reminders */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <Card className="p-8 glass-surface border border-subtle text-center">
            <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              No Reminders Set
            </h3>
            <p className="text-text-muted mb-4">
              Create your first study reminder to stay consistent with your
              learning.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Reminder
            </Button>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card
              key={reminder.id}
              className="p-4 glass-surface border border-subtle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reminder.is_active
                        ? "bg-brand-primary text-primary-foreground"
                        : "surface-secondary text-muted"
                    }`}
                  >
                    {getReminderIcon(reminder.reminder_type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary">
                        {getReminderTypeLabel(reminder.reminder_type)}
                      </h3>
                      {reminder.project_name && (
                        <Badge variant="secondary" className="text-xs">
                          {reminder.project_name}
                        </Badge>
                      )}
                      <Badge
                        variant={reminder.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {reminder.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {reminder.scheduled_time}
                      </div>

                      <div className="flex items-center gap-1">
                        {reminder.notification_method === "browser" && (
                          <Smartphone className="w-3 h-3" />
                        )}
                        {reminder.notification_method === "email" && (
                          <Mail className="w-3 h-3" />
                        )}
                        {reminder.notification_method === "both" && (
                          <>
                            <Smartphone className="w-3 h-3" />
                            <Mail className="w-3 h-3" />
                          </>
                        )}
                        {reminder.notification_method}
                      </div>

                      {reminder.last_sent && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Last sent:{" "}
                          {new Date(reminder.last_sent).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-text-muted mt-1 line-clamp-1">
                      {reminder.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={reminder.is_active}
                    onCheckedChange={(checked) =>
                      toggleReminder(reminder.id, checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Setup Suggestions */}
      {reminders.length === 0 && (
        <Card className="p-4 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-primary" />
            Suggested Reminders
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 p-2 surface-elevated rounded-lg">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span className="flex-1">Daily study at 9:00 AM</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewReminder({
                    reminderType: "daily_study",
                    scheduledTime: "09:00",
                    notificationMethod: "browser",
                    projectId: projectId || "",
                    message: "",
                  });
                  setShowCreateForm(true);
                }}
              >
                Add
              </Button>
            </div>

            <div className="flex items-center gap-3 p-2 surface-elevated rounded-lg">
              <Clock className="w-4 h-4 text-brand-primary" />
              <span className="flex-1">Due reviews at 7:00 PM</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewReminder({
                    reminderType: "due_reviews",
                    scheduledTime: "19:00",
                    notificationMethod: "browser",
                    projectId: projectId || "",
                    message: "",
                  });
                  setShowCreateForm(true);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
