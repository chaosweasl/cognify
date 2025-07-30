"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { useUserId } from "@/hooks/useUserId";
import { getAppNotifications } from "@/utils/supabase/appNotifications";
import {
  getAppNotificationReads,
  markAppNotificationRead,
} from "@/utils/supabase/appNotificationReads";
import {
  getUserNotifications,
  markNotificationRead,
  deleteUserNotification,
} from "@/utils/supabase/userNotifications";

export function NotificationBell() {
  const userId = useUserId();
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);

  // Only show notifications whose trigger_at is in the past
  const now = Date.now();
  const filteredUserNotifications = userNotifications.filter(
    (n) => !n.trigger_at || new Date(n.trigger_at).getTime() <= now
  );
  const filteredAppNotifications = appNotifications.filter(
    (n) => !n.trigger_at || new Date(n.trigger_at).getTime() <= now
  );
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "app">("user");
  // Track read app notifications per user from DB
  const [readAppIds, setReadAppIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    console.log("[Supabase] getUserNotifications", userId);
    getUserNotifications(userId).then(({ data, error }) => {
      if (error) console.error("[Supabase] getUserNotifications error", error);
      if (data) setUserNotifications(data);
    });
  }, [userId]);

  useEffect(() => {
    console.log("[Supabase] getAppNotifications");
    getAppNotifications().then(({ data, error }) => {
      if (error) console.error("[Supabase] getAppNotifications error", error);
      if (data) setAppNotifications(data);
    });
  }, []);

  // Fetch app notification reads for this user
  useEffect(() => {
    if (!userId) return;
    getAppNotificationReads(userId).then(({ data, error }) => {
      if (error)
        console.error("[Supabase] getAppNotificationReads error", error);
      if (data) setReadAppIds(data.map((row: any) => row.notification_id));
    });
  }, [userId, appNotifications.length]);

  // Mark all as read when user tab is opened, but only for visible (due) notifications
  useEffect(() => {
    if (
      open &&
      activeTab === "user" &&
      userId &&
      filteredUserNotifications.some((n: any) => !n.read)
    ) {
      const unreadVisible = filteredUserNotifications.filter(
        (n: any) => !n.read
      );
      Promise.all(
        unreadVisible.map((n: any) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, userId, filteredUserNotifications]);

  // Mark all app notifications as read when app tab is opened
  useEffect(() => {
    if (
      open &&
      activeTab === "app" &&
      userId &&
      appNotifications.some((n: any) => !readAppIds.includes(n.id))
    ) {
      const unreadAppNotifications = appNotifications.filter(
        (n: any) => !readAppIds.includes(n.id)
      );
      Promise.all(
        unreadAppNotifications.map((n: any) => {
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
          if (data) setReadAppIds(data.map((row: any) => row.notification_id));
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, userId, appNotifications, readAppIds]);

  const unreadAppCount = filteredAppNotifications.filter(
    (n: any) => !readAppIds.includes(n.id)
  ).length;
  const notificationCount =
    filteredUserNotifications.filter((n: any) => !n.read).length +
    unreadAppCount;

  return (
    <div className="relative m-0 p-0">
      <button
        className="btn btn-ghost btn-circle hover:bg-base-200 transition-colors m-0 p-0"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="badge badge-warning badge-xs absolute top-0 right-0">
            {notificationCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 shadow-lg rounded-lg z-50 border border-base-200">
          {/* Simple header tabs */}
          <div className="flex border-b border-base-200">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "user"
                  ? "text-primary border-b-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
              onClick={() => setActiveTab("user")}
            >
              User
              {filteredUserNotifications.filter((n) => !n.read).length > 0 && (
                <span className="ml-2 badge badge-xs badge-primary align-middle">
                  {filteredUserNotifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "app"
                  ? "text-primary border-b-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
              onClick={() => setActiveTab("app")}
            >
              App
              {unreadAppCount > 0 && (
                <span className="ml-2 badge badge-xs badge-primary align-middle">
                  {unreadAppCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto">
            {activeTab === "user" && (
              <>
                {filteredUserNotifications.length > 0 ? (
                  <div className="divide-y divide-base-200">
                    {filteredUserNotifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`relative group p-3 hover:bg-base-200/50 transition-colors ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <a
                          href={n.url || "#"}
                          className="block"
                          target={n.url ? "_blank" : undefined}
                          rel="noopener noreferrer"
                        >
                          <div
                            className={`text-sm font-medium mb-1 ${
                              !n.read ? "text-primary" : ""
                            }`}
                          >
                            {n.title}
                          </div>
                          <div className="text-xs text-base-content/70">
                            {n.message}
                          </div>
                          {n.trigger_at && (
                            <div className="text-xs text-base-content/40 mt-1">
                              {new Date(n.trigger_at).toLocaleString()}
                            </div>
                          )}
                        </a>
                        <button
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn btn-xs btn-ghost text-error"
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
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-base-content/60">
                    No notifications
                  </div>
                )}
              </>
            )}

            {activeTab === "app" && (
              <>
                {filteredAppNotifications.length > 0 ? (
                  <div className="divide-y divide-base-200">
                    {filteredAppNotifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`relative group p-3 hover:bg-base-200/50 transition-colors ${
                          !readAppIds.includes(n.id) ? "bg-primary/5" : ""
                        }`}
                      >
                        <a
                          href={n.url || "#"}
                          className="block"
                          target={n.url ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          onClick={() => setOpen(false)}
                        >
                          <div
                            className={`text-sm font-medium mb-1 ${
                              !readAppIds.includes(n.id) ? "text-primary" : ""
                            }`}
                          >
                            {n.title}
                          </div>
                          <div className="text-xs text-base-content/70">
                            {n.message}
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-base-content/60">
                    No updates
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
