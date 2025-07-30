import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

type AppNotificationInput = {
  title: string;
  message: string;
  url?: string;
  published?: boolean;
};
/**
 * Push a new app notification only if one with the same title does not already exist.
 * Returns the inserted notification or null if it already exists.
 */
export async function pushAppNotificationOnce({
  title,
  message,
  url,
  published = true,
}: AppNotificationInput) {
  // Check for existing notification with the same title
  const { data: existing, error: selectError } = await supabase
    .from("app_notifications")
    .select("id")
    .eq("title", title)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return null; // Already exists

  // Insert new notification
  const { data, error } = await supabase
    .from("app_notifications")
    .insert([{ title, message, url, published }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAppNotifications() {
  return supabase
    .from("app_notifications")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
}
