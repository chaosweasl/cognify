"use client";

import { useEffect, useState } from "react";
import { Bell, X, Clock, BookOpen, Info, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useUserId } from "@/hooks/useUserId";
import { getAppNotifications } from "@/lib/supabase/appNotifications";
import {
  getAppNotificationReads,
  markAppNotificationRead,
} from "@/lib/supabase/appNotificationReads";
import {
  getUserNotifications,
  markNotificationRead,
  deleteUserNotification,
} from "@/lib/supabase/userNotifications";

// Notification types
interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  is_read: boolean;
  created_at: string;
  scheduled_for?: string;
  trigger_at?: string;
  url?: string;
  type: "study_reminder" | "general" | "achievement";
  projects?: {
    id: string;
    name: string;
  };
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  trigger_at?: string;
  url?: string;
}

interface AppNotificationRead {
  notification_id: string;
}

export function NotificationBell() {
  const userId = useUserId();
  const [userNotifications, setUserNotifications] = useState<
    UserNotification[]
  >([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "app">("user");
  const [readAppIds, setReadAppIds] = useState<string[]>([]);

  // Only show notifications whose trigger_at is in the past
  const now = Date.now();
  const filteredUserNotifications = userNotifications.filter(
    (n: UserNotification) =>
      !n.trigger_at || new Date(n.trigger_at).getTime() <= now
  );
  const filteredAppNotifications = appNotifications.filter(
    (n: AppNotification) =>
      !n.trigger_at || new Date(n.trigger_at).getTime() <= now
  );

  // Fetch user notifications
  useEffect(() => {
    if (!userId) return;

    getUserNotifications(userId).then(({ data, error }) => {
      if (error) console.error("getUserNotifications error", error);
      if (data) setUserNotifications(data);
    });
  }, [userId]);

  // Fetch app notifications (only if user is authenticated)
  useEffect(() => {
    if (!userId) return;

    getAppNotifications().then(({ data, error }) => {
      if (error) console.error("getAppNotifications error", error);
      if (data) setAppNotifications(data);
    });

    // Get read app notifications
    getAppNotificationReads(userId).then(({ data, error }) => {
      if (error) console.error("getAppNotificationReads error", error);
      if (data) {
        setReadAppIds(
          data.map((row: AppNotificationRead) => row.notification_id)
        );
      }
    });
  }, [userId]);

  const unreadAppCount = filteredAppNotifications.filter(
    (n: AppNotification) => !readAppIds.includes(n.id)
  ).length;

  const unreadUserCount = filteredUserNotifications.filter(
    (n: UserNotification) => !n.is_read && !n.read
  ).length;

  const notificationCount = unreadUserCount + unreadAppCount;

  const handleMarkUserNotificationRead = async (id: string) => {
    try {
      if (!userId) return;

      await markNotificationRead(id);
      setUserNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDeleteUserNotification = async (id: string) => {
    try {
      if (!userId) return;

      await deleteUserNotification(id);
      setUserNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (!userId) return;

      if (activeTab === "user") {
        const unreadNotifications = filteredUserNotifications.filter(
          (n) => !n.is_read && !n.read
        );
        await Promise.all(
          unreadNotifications.map((n) => markNotificationRead(n.id))
        );
        setUserNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read: true }))
        );
      } else if (activeTab === "app") {
        const unreadAppNotifications = filteredAppNotifications.filter(
          (n) => !readAppIds.includes(n.id)
        );
        await Promise.all(
          unreadAppNotifications.map((n) =>
            markAppNotificationRead(userId, n.id)
          )
        );
        setReadAppIds((prev) => [
          ...prev,
          ...unreadAppNotifications.map((n) => n.id),
        ]);
      }

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative h-11 w-11 rounded-xl"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white border-2 border-background flex items-center justify-center rounded-full">
            {notificationCount > 9 ? "9+" : notificationCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Notification panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
            {/* Header with tabs */}
            <div className="flex border-b border-border p-1">
              <button
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors",
                  activeTab === "user"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setActiveTab("user")}
              >
                Personal
                {unreadUserCount > 0 && (
                  <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500 text-white">
                    {unreadUserCount}
                  </Badge>
                )}
              </button>
              <button
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors",
                  activeTab === "app"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setActiveTab("app")}
              >
                Updates
                {unreadAppCount > 0 && (
                  <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500 text-white">
                    {unreadAppCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {activeTab === "user" && (
                <>
                  {filteredUserNotifications.length > 0 ? (
                    <div className="divide-y divide-border">
                      {filteredUserNotifications.map((n: UserNotification) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onMarkRead={() =>
                            handleMarkUserNotificationRead(n.id)
                          }
                          onDelete={() => handleDeleteUserNotification(n.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                      title="No notifications"
                      description="You're all caught up!"
                    />
                  )}
                </>
              )}

              {activeTab === "app" && (
                <>
                  {filteredAppNotifications.length > 0 ? (
                    <div className="divide-y divide-border">
                      {filteredAppNotifications.map((n: AppNotification) => (
                        <AppNotificationItem
                          key={n.id}
                          notification={n}
                          isRead={readAppIds.includes(n.id)}
                          onClose={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Info className="h-8 w-8 text-muted-foreground" />}
                      title="No updates"
                      description="Check back later for new updates"
                    />
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {((activeTab === "user" && unreadUserCount > 0) ||
              (activeTab === "app" && unreadAppCount > 0)) && (
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="w-full text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark all as read
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Enhanced notification item component
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: UserNotification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "study_reminder":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "achievement":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const isUnread = !notification.is_read && !notification.read;

  return (
    <div
      className={cn(
        "relative group p-4 hover:bg-muted/30 transition-colors",
        isUnread && "bg-primary/5 border-l-2 border-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getNotificationIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                "text-sm font-medium truncate",
                isUnread ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {notification.title}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          {notification.projects && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {notification.projects.name}
              </Badge>
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(
              notification.scheduled_for || notification.created_at
            ).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppNotificationItem({
  notification,
  isRead,
  onClose,
}: {
  notification: AppNotification;
  isRead: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/30 transition-colors cursor-pointer",
        !isRead && "bg-primary/5 border-l-2 border-primary"
      )}
      onClick={() => {
        if (notification.url) {
          window.open(notification.url, "_blank");
          onClose();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <div
            className={cn(
              "text-sm font-medium mb-1",
              !isRead ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {notification.title}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {notification.message}
          </p>
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(notification.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
