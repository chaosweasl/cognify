import "dotenv/config";
import { pushAppNotificationOnce } from "@/utils/supabase/appNotifications";

/**
 * Notification Script Template
 *
 * Edit the values below to customize your notification:
 *
 * title:        (string)    The notification title (required, unique per notification)
 * message:      (string)    The notification message/body (required)
 * url:          (string)    Optional URL to link from the notification
 * published:    (boolean)   Optional, defaults to true
 *
 * Example:
 *   {
 *     title: "New Feature!",
 *     message: "Check out the new dashboard.",
 *     url: "/dashboard",
 *     published: true
 *   }
 */

async function main() {
  try {
    const result = await pushAppNotificationOnce({
      title: "Test Notification",
      message: "This is a test notification pushed from the script.",
      url: "/dashboard",
    });
    if (result) {
      console.log("Notification pushed:", result);
    } else {
      console.log(
        "Notification with this title already exists. No new notification pushed."
      );
    }
  } catch (err) {
    console.error("Error pushing notification:", err);
  }
}

main();

// To run this script:
// pnpm exec tsx scripts/pushNotification.ts
