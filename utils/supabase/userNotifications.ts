import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

export async function getUserNotifications(userId: string) {
  return supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("trigger_at", { ascending: false });
}

export async function markNotificationRead(notificationId: string) {
  return supabase
    .from("user_notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function deleteUserNotification(id: string) {
  return supabase.from("user_notifications").delete().eq("id", id);
}
