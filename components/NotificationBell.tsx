"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getDueSRSProjects } from "@/utils/supabase/srs";
import { getAppNotifications } from "@/utils/supabase/appNotifications";
import { useUserId } from "@/hooks/useUserId";

export function NotificationBell() {
  const userId = useUserId();
  const [dueProjects, setDueProjects] = useState<string[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getDueSRSProjects(userId).then(({ data }) => {
      if (data) {
        setDueProjects([...new Set(data.map((row: any) => row.project_id))]);
      }
    });
  }, [userId]);

  useEffect(() => {
    getAppNotifications().then(({ data }) => {
      if (data) setAppNotifications(data);
    });
  }, []);

  const notificationCount = dueProjects.length + appNotifications.length;

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
        <div className="absolute right-0 mt-2 w-80 bg-base-100 shadow-lg rounded-xl z-50 border border-base-200">
          <div className="p-4 border-b border-base-200 font-bold text-base-content">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {dueProjects.length > 0 && (
              <div className="p-4 border-b border-base-200">
                <div className="font-semibold mb-2 text-warning">
                  Projects Ready to Study
                </div>
                {dueProjects.map((pid) => (
                  <Link
                    key={pid}
                    href={`/projects/${pid}`}
                    className="block text-sm text-primary hover:underline mb-1"
                    onClick={() => setOpen(false)}
                  >
                    Project {pid}
                  </Link>
                ))}
              </div>
            )}
            {appNotifications.length > 0 && (
              <div className="p-4">
                <div className="font-semibold mb-2 text-info">App Updates</div>
                {appNotifications.map((n) => (
                  <a
                    key={n.id}
                    href={n.url || "#"}
                    className="block text-sm text-base-content hover:underline mb-1"
                    target={n.url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                  >
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-base-content/70">
                      {n.message}
                    </div>
                  </a>
                ))}
              </div>
            )}
            {notificationCount === 0 && (
              <div className="p-4 text-base-content/60 text-sm">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
