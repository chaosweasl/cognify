import { createClient } from "@/lib/supabase/client";

/**
 * Schedules a user notification for SRS review at the next due time (e.g., 4 AM EST on due date)
 * @param user_id - User to notify
 * @param project_id - Project ID
 * @param project_name - Project name
 * @param due - Due timestamp (ms)
 */
export async function scheduleSRSReminder({
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
  const supabase = createClient();
  // Helper: get next 4 AM EST after due
  function getNext4AMEST(dueMs: number) {
    // EST is UTC-5; adjust as needed for DST
    const dueDate = new Date(dueMs);
    const utc = new Date(dueDate.getTime() + 5 * 60 * 60 * 1000);
    utc.setUTCHours(4, 0, 0, 0);
    if (utc < dueDate) utc.setUTCDate(utc.getUTCDate() + 1);
    return new Date(utc.getTime() - 5 * 60 * 60 * 1000);
  }
  const trigger_at = getNext4AMEST(due).toISOString();
  console.log(
    `[Supabase] scheduleSRSReminder for user_id: ${user_id}, project_id: ${project_id}, due: ${due}`
  );
  const { error } = await supabase.from("user_notifications").insert([
    {
      user_id,
      type: "study_reminder",
      title: "Time to review your project!",
      message: "Your project '" + project_name + "' is due for review.",
      url: "/projects/" + project_id + "/study",
      scheduled_for: trigger_at,
    },
  ]);
  if (error) throw error;
}
