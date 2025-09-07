// Client-side utility for scheduling study reminders
import { toast } from "sonner";

interface ReminderOptions {
  projectId: string;
  projectName: string;
  dueCardsCount: number;
  scheduledFor?: string;
}

export async function scheduleStudyReminder({
  projectId,
  projectName,
  dueCardsCount,
  scheduledFor,
}: ReminderOptions) {
  try {
    const message =
      dueCardsCount > 0
        ? `You have ${dueCardsCount} card${
            dueCardsCount > 1 ? "s" : ""
          } due for review in "${projectName}"`
        : `Time to study your "${projectName}" flashcards`;

    const response = await fetch("/api/user/reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: projectId,
        reminder_type: "study_reminder",
        message,
        scheduled_for: scheduledFor,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to schedule reminder");
    }

    return await response.json();
  } catch (error) {
    console.error("Schedule reminder error:", error);
    throw error;
  }
}

export async function getDueReminders() {
  try {
    const response = await fetch("/api/user/reminders");

    if (!response.ok) {
      throw new Error("Failed to get reminders");
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error("Get reminders error:", error);
    return [];
  }
}

// Schedule daily study reminders based on user settings
export async function scheduleDailyReminders(
  projects: {
    id: string;
    name: string;
    flashcards?: { srs_due_date: string }[];
  }[],
  userSettings: {
    daily_reminder?: boolean;
    notifications_enabled?: boolean;
    reminder_time?: string;
  }
) {
  if (!userSettings?.daily_reminder || !userSettings?.notifications_enabled) {
    return;
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set time based on user preference
    const [hours, minutes] = (userSettings.reminder_time || "09:00:00").split(
      ":"
    );
    tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Schedule reminder for each active project
    const activeProjects = projects.filter(
      (p) => p.flashcards?.length && p.flashcards.length > 0
    );

    for (const project of activeProjects) {
      // Get due cards count (simplified - in real app you'd check SRS scheduling)
      const dueCards =
        project.flashcards?.filter(
          (card: { srs_due_date: string }) =>
            new Date(card.srs_due_date) <= tomorrow
        ) || [];

      if (dueCards.length > 0) {
        await scheduleStudyReminder({
          projectId: project.id,
          projectName: project.name,
          dueCardsCount: dueCards.length,
          scheduledFor: tomorrow.toISOString(),
        });
      }
    }

    toast.success("Daily study reminders scheduled");
  } catch (error) {
    console.error("Schedule daily reminders error:", error);
    toast.error("Failed to schedule daily reminders");
  }
}
