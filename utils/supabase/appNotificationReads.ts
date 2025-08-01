import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function getAppNotificationReads(userId: string) {
  console.log(`[Supabase] getAppNotificationReads for userId: ${userId}`);
  return supabase
    .from("app_notification_reads")
    .select("notification_id")
    .eq("user_id", userId);
}

export async function markAppNotificationRead(
  userId: string,
  notificationId: string
) {
  console.log(
    `[Supabase] markAppNotificationRead for userId: ${userId}, notificationId: ${notificationId}`
  );
  return supabase
    .from("app_notification_reads")
    .upsert({ user_id: userId, notification_id: notificationId });
}
