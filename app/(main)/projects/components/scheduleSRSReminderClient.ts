import { scheduleSRSReminder } from "@/utils/supabase/scheduleSRSReminder";

export async function scheduleSRSReminderForProject({
  user_id,
  project_id,
  project_name,
  due,
}: {
  user_id: string;
  project_id: string;
  project_name: string;
  due: number;
}) {
  try {
    await scheduleSRSReminder({ user_id, project_id, project_name, due });
  } catch (e) {
    // Optionally handle/log error
    console.error("Failed to schedule SRS reminder", e);
  }
}
