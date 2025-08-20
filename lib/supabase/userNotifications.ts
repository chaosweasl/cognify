import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

export async function getUserNotifications(userId: string) {
  console.log(`[Supabase] getUserNotifications for userId: ${userId}`);
  return supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: false });
}

export async function markNotificationRead(notificationId: string) {
  console.log(
    `[Supabase] markNotificationRead for notificationId: ${notificationId}`
  );
  return supabase
    .from("user_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
}

export async function deleteUserNotification(id: string) {
  console.log(`[Supabase] deleteUserNotification for id: ${id}`);
  return supabase.from("user_notifications").delete().eq("id", id);
}
