"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

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
  created_at: string;
  trigger_at?: string;
  url?: string;
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
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "app">("user");
  // Track read app notifications per user from DB
  const [readAppIds, setReadAppIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    console.log("[Supabase] getUserNotifications", userId);
    getUserNotifications(userId).then(
      ({
        data,
        error,
      }: {
        data: UserNotification[] | null;
        error: Error | null;
      }) => {
        if (error)
          console.error("[Supabase] getUserNotifications error", error);
        if (data) setUserNotifications(data);
      }
    );
  }, [userId]);

  useEffect(() => {
    // Only fetch app notifications if user is authenticated
    if (!userId) {
      console.log(
        "[Supabase] Skipping app notifications - user not authenticated"
      );
      return;
    }

    console.log("[Supabase] getAppNotifications");
    getAppNotifications().then(
      ({
        data,
        error,
      }: {
        data: AppNotification[] | null;
        error: Error | null;
      }) => {
        if (error) console.error("[Supabase] getAppNotifications error", error);
        if (data) setAppNotifications(data);
      }
    );
  }, [userId]); // Add userId as dependency

  // Fetch app notification reads for this user
  useEffect(() => {
    if (!userId) return;
    getAppNotificationReads(userId).then(({ data, error }) => {
      if (error)
        console.error("[Supabase] getAppNotificationReads error", error);
      if (data)
        setReadAppIds(
          data.map((row: AppNotificationRead) => row.notification_id)
        );
    });
  }, [userId, appNotifications.length]);

  // Mark all as read when user tab is opened, but only for visible (due) notifications
  useEffect(() => {
    if (
      open &&
      activeTab === "user" &&
      userId &&
      filteredUserNotifications.some((n: UserNotification) => !n.read)
    ) {
      const unreadVisible = filteredUserNotifications.filter(
        (n: UserNotification) => !n.read
      );
      Promise.all(
        unreadVisible.map((n: UserNotification) => {
          console.log("[Supabase] markNotificationRead", n.id);
          return markNotificationRead(n.id);
        })
      ).then(() => {
        console.log(
          "[Supabase] getUserNotifications (after mark read)",
          userId
        );
        getUserNotifications(userId).then(({ data, error }) => {
          if (error)
            console.error("[Supabase] getUserNotifications error", error);
          if (data) setUserNotifications(data);
        });
      });
    }
  }, [open, activeTab, userId, filteredUserNotifications]);

  // Mark all app notifications as read when app tab is opened
  useEffect(() => {
    if (
      open &&
      activeTab === "app" &&
      userId &&
      appNotifications.some((n: AppNotification) => !readAppIds.includes(n.id))
    ) {
      const unreadAppNotifications = appNotifications.filter(
        (n: AppNotification) => !readAppIds.includes(n.id)
      );
      Promise.all(
        unreadAppNotifications.map((n: AppNotification) => {
          console.log("[Supabase] markAppNotificationRead", userId, n.id);
          return markAppNotificationRead(userId, n.id);
        })
      ).then(() => {
        console.log(
          "[Supabase] getAppNotificationReads (after mark read)",
          userId
        );
        getAppNotificationReads(userId).then(({ data, error }) => {
          if (error)
            console.error("[Supabase] getAppNotificationReads error", error);
          if (data)
            setReadAppIds(
              data.map((row: AppNotificationRead) => row.notification_id)
            );
        });
      });
    }
  }, [open, activeTab, userId, appNotifications, readAppIds]);

  const unreadAppCount = filteredAppNotifications.filter(
    (n: AppNotification) => !readAppIds.includes(n.id)
  ).length;
  const notificationCount =
    filteredUserNotifications.filter((n: UserNotification) => !n.read).length +
    unreadAppCount;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative h-11 w-11 rounded-xl surface-secondary border border-subtle hover:surface-elevated hover:border-brand interactive-hover transition-all transition-normal group"
      >
        <Bell className="h-5 w-5 text-secondary group-hover:brand-primary transition-colors transition-normal" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-brand-secondary text-white border-2 border-surface-primary flex items-center justify-center rounded-full">
            {notificationCount > 9 ? "9+" : notificationCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Notification panel */}
          <div className="absolute right-0 top-full mt-2 w-80 surface-elevated glass-surface border border-subtle rounded-xl shadow-brand-lg z-50">
            {/* Header with tabs */}
            <div className="flex border-b border-subtle p-1">
              <button
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all transition-normal",
                  activeTab === "user"
                    ? "surface-elevated text-primary shadow-sm"
                    : "text-secondary hover:text-primary hover:surface-secondary"
                )}
                onClick={() => setActiveTab("user")}
              >
                Personal
                {filteredUserNotifications.filter((n) => !n.read).length >
                  0 && (
                  <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-brand-primary text-white">
                    {filteredUserNotifications.filter((n) => !n.read).length}
                  </Badge>
                )}
              </button>
              <button
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all transition-normal",
                  activeTab === "app"
                    ? "surface-elevated text-primary shadow-sm"
                    : "text-secondary hover:text-primary hover:surface-secondary"
                )}
                onClick={() => setActiveTab("app")}
              >
                Updates
                {unreadAppCount > 0 && (
                  <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-brand-primary text-white">
                    {unreadAppCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {activeTab === "user" && (
                <>
                  {filteredUserNotifications.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {filteredUserNotifications.map((n: UserNotification) => (
                        <div
                          key={n.id}
                          className={cn(
                            "relative group p-4 hover:surface-secondary transition-colors transition-normal",
                            !n.read &&
                              "surface-secondary border-l-2 border-brand-primary"
                          )}
                        >
                          <a
                            href={n.url || "#"}
                            className="block pr-8"
                            target={n.url ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={() => n.url && setOpen(false)}
                          >
                            <div
                              className={cn(
                                "text-sm font-medium mb-1",
                                !n.read ? "text-primary" : "text-secondary"
                              )}
                            >
                              {n.title}
                            </div>
                            <div className="text-xs text-muted leading-relaxed">
                              {n.message}
                            </div>
                            {n.trigger_at && (
                              <div className="text-xs text-subtle mt-2">
                                {new Date(n.trigger_at).toLocaleString()}
                              </div>
                            )}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all transition-normal"
                            title="Delete notification"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(
                                "[Supabase] deleteUserNotification",
                                n.id
                              );
                              await deleteUserNotification(n.id);
                              if (userId) {
                                console.log(
                                  "[Supabase] getUserNotifications (after delete)",
                                  userId
                                );
                                getUserNotifications(userId).then(
                                  ({ data, error }) => {
                                    if (error)
                                      console.error(
                                        "[Supabase] getUserNotifications error",
                                        error
                                      );
                                    if (data) setUserNotifications(data);
                                  }
                                );
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted mb-3" />
                      <div className="text-sm text-secondary mb-1">
                        No notifications
                      </div>
                      <div className="text-xs text-muted">
                        You&apos;re all caught up
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "app" && (
                <>
                  {filteredAppNotifications.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {filteredAppNotifications.map((n: AppNotification) => (
                        <div
                          key={n.id}
                          className={cn(
                            "relative group p-4 hover:surface-secondary transition-colors transition-normal",
                            !readAppIds.includes(n.id) &&
                              "surface-secondary border-l-2 border-brand-secondary"
                          )}
                        >
                          <a
                            href={n.url || "#"}
                            className="block"
                            target={n.url ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                          >
                            <div
                              className={cn(
                                "text-sm font-medium mb-1",
                                !readAppIds.includes(n.id)
                                  ? "text-primary"
                                  : "text-secondary"
                              )}
                            >
                              {n.title}
                            </div>
                            <div className="text-xs text-muted leading-relaxed">
                              {n.message}
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted mb-3" />
                      <div className="text-sm text-secondary mb-1">
                        No updates
                      </div>
                      <div className="text-xs text-muted">Check back later</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
