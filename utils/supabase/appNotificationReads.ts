import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function getAppNotificationReads(userId: string) {
  return supabase
    .from("app_notification_reads")
    .select("notification_id")
    .eq("user_id", userId);
}

export async function markAppNotificationRead(
  userId: string,
  notificationId: string
) {
  return supabase
    .from("app_notification_reads")
    .upsert({ user_id: userId, notification_id: notificationId });
}
